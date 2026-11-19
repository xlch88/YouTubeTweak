export type MemoryFields = { s: number; c: "0" | "1"; l: string };
export type MemoryChange = { channelId: string; key: keyof MemoryFields; value?: number | string };
type StorageItems = Record<string, unknown>;
type StorageArea = {
	get: () => Promise<StorageItems>;
	set: (items: StorageItems) => Promise<unknown>;
	remove: (keys: string[]) => Promise<unknown>;
};
type Area = "sync" | "local";
export type MemoryRequest =
	| { action: "get"; area: Area; channelId: string; key: keyof MemoryFields }
	| { action: "set"; area: Area; changes: MemoryChange[] }
	| { action: "delete"; area: Area; channelId: string }
	| { action: "clear"; area: Area }
	| { action: "export" }
	| { action: "import"; memoryChunk?: unknown; localMemoryChunk?: unknown; settings?: StorageItems };
export type MemoryReply = { ok: true; value: unknown } | { ok: false; error: string; message?: string };

export function isMemoryReply(reply: unknown): reply is MemoryReply {
	if (!reply || typeof reply !== "object") return false;
	return (
		"ok" in reply &&
		(reply.ok === true ? Object.hasOwn(reply, "value") : reply.ok === false && "error" in reply && typeof reply.error === "string")
	);
}

const encoder = new TextEncoder();
const SYNC_QUOTA = 102400;
const TABLE_LIMIT = 8100;

export function isMemoryStorageKey(key: string) {
	return key === "memoryI" || key.startsWith("memory_");
}

function storageBytes(key: string, value: unknown) {
	return encoder.encode(key).length + encoder.encode(JSON.stringify(value)).length;
}

function cleanChannelId(channelId: string) {
	if (typeof channelId !== "string") throw new Error("Invalid channel ID");
	channelId = decodeURI(channelId).replace(/^@/, "") || "_DEFAULT_";
	if (/[!@,:;=]/.test(channelId)) throw new Error("Invalid channel ID");
	return channelId;
}

function validateField(key: string, value: unknown) {
	if (!["s", "c", "l"].includes(key)) throw new Error("Invalid memory field");
	if (value === undefined) return;
	if (key === "s") {
		if (
			!["number", "string"].includes(typeof value) ||
			!/^\d+(?:\.\d+)?$/.test(String(value)) ||
			!(Number(value) > 0 && Number(value) <= 16)
		)
			throw new Error("Invalid playback speed");
	} else if (key === "c") {
		if (value !== "0" && value !== "1") throw new Error("Invalid subtitle status");
	} else {
		if (typeof value !== "string" || !value || /[,@:;=]/.test(value)) throw new Error("Invalid subtitle language");
		const caption = JSON.parse(decodeURIComponent(value));
		if (!caption || typeof caption.languageCode !== "string" || !caption.languageCode) throw new Error("Invalid subtitle language");
		for (const field of ["kind", "vss_id", "translationLanguage"]) {
			if (caption[field] !== undefined && typeof caption[field] !== "string") throw new Error("Invalid subtitle language");
		}
	}
}

type MemoryEntry = { table: string; raw: string; fields: Record<string, string> };

// Preserve the existing @channel!order:key=value; format and all explicit preferences.
function parseMemory(items: StorageItems, area: Area) {
	const entries = new Map<string, MemoryEntry>();
	let nextIndex = 0;
	if (items.memoryI !== undefined) {
		if (!Number.isSafeInteger(items.memoryI) || Number(items.memoryI) < 0) throw new Error("Invalid memory index");
		nextIndex = Number(items.memoryI);
	}
	for (const [table, content] of Object.entries(items)) {
		if (!table.startsWith("memory_")) continue;
		if (!/^memory_[1-9]\d*$/.test(table) || typeof content !== "string") throw new Error("Invalid memory table");
		if (area === "sync" && storageBytes(table, content) > 8192) throw new Error("Memory item quota exceeded");
		let offset = 0;
		for (const match of content.matchAll(/@([^!@,:;=]+)!(\d+):([^;]*);/g)) {
			if (match.index !== offset || entries.has(match[1])) throw new Error("Invalid or duplicate memory entry");
			offset += match[0].length;
			const index = Number(match[2]);
			if (!Number.isSafeInteger(index) || index >= Number.MAX_SAFE_INTEGER) throw new Error("Invalid memory index");
			nextIndex = Math.max(nextIndex, index + 1);
			const fields: Record<string, string> = {};
			for (const field of match[3] ? match[3].split(",") : []) {
				const pair = field.split("=");
				if (pair.length !== 2 || Object.hasOwn(fields, pair[0])) throw new Error("Invalid memory field");
				validateField(pair[0], pair[1]);
				if (area === "sync" ? pair[0] === "l" : pair[0] !== "l") throw new Error("Invalid memory storage area");
				fields[pair[0]] = pair[1];
			}
			entries.set(match[1], { table, raw: match[0], fields });
		}
		if (offset !== content.length) throw new Error("Invalid memory table content");
	}
	return { entries, nextIndex };
}

function validateCapacity(items: StorageItems, area: Area) {
	if (area !== "sync") return;
	let bytes = 0;
	for (const [key, value] of Object.entries(items)) {
		const size = storageBytes(key, value);
		if (size > 8192) throw new Error("Sync item quota exceeded");
		bytes += size;
	}
	if (bytes > SYNC_QUOTA || Object.keys(items).length > 512) throw new Error("Sync storage quota exceeded");
}

/** One service in the background owns reads, writes, imports and deletion for every tab. */
export function createMemoryService(storage: Record<Area, StorageArea>) {
	let queue: Promise<unknown> = Promise.resolve();
	const cache: Partial<Record<Area, { items: StorageItems; entries: Map<string, MemoryEntry>; nextIndex: number }>> = {};
	const revisions = { sync: 0, local: 0 };

	async function load(area: Area) {
		if (cache[area]) return cache[area];
		// A storage change during get() must not install a stale snapshot.
		let revision: number;
		let items: StorageItems;
		do {
			revision = revisions[area];
			items = await storage[area].get();
		} while (revision !== revisions[area]);
		return (cache[area] = { items, ...parseMemory(items, area) });
	}

	async function commit(area: Area, before: StorageItems, after: StorageItems) {
		const updated = Object.fromEntries(
			Object.entries(after).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key])),
		);
		const removed = Object.keys(before).filter((key) => !(key in after));
		if (!Object.keys(updated).length && !removed.length) return;
		validateCapacity(after, area);
		// Replace obsolete chunks with empty values in the SAME set as the new data.
		// This avoids both temporarily doubling the quota and deleting old data before a failed set.
		const write = { ...Object.fromEntries(removed.map((key) => [key, key === "memoryI" ? 0 : ""])), ...updated };
		validateCapacity({ ...before, ...write }, area);
		try {
			for (let attempt = 0; ; attempt++) {
				try {
					if ((await storage[area].set(write)) === false) throw new Error("Memory storage write failed");
					break;
				} catch (error) {
					if (attempt === 2 || /quota/i.test(String(error))) throw error;
					await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
				}
			}
			// Empty chunks remain readable if key cleanup fails; never restore old data over a committed write.
			if (removed.length) await storage[area].remove(removed);
		} finally {
			delete cache[area];
		}
	}

	async function execute(request: MemoryRequest): Promise<unknown> {
		if (request.action === "export") {
			return {
				memoryChunk: Object.fromEntries(Object.entries(await storage.sync.get()).filter(([key]) => isMemoryStorageKey(key))),
				localMemoryChunk: Object.fromEntries(Object.entries(await storage.local.get()).filter(([key]) => isMemoryStorageKey(key))),
			};
		}
		if (request.action === "import") {
			const updates: { area: Area; before: StorageItems; after: StorageItems }[] = [];
			for (const area of ["sync", "local"] as const) {
				const chunk = area === "sync" ? request.memoryChunk : request.localMemoryChunk;
				if (chunk === undefined && !(area === "sync" && request.settings !== undefined)) continue;
				// Read raw storage here so a valid import can repair malformed existing memory.
				const before = await storage[area].get();
				let after = { ...before };
				if (chunk !== undefined) {
					if (!chunk || typeof chunk !== "object" || Array.isArray(chunk)) throw new Error("Invalid memory chunk");
					if (Object.keys(chunk).some((key) => !isMemoryStorageKey(key))) throw new Error("Invalid memory storage key");
					parseMemory(chunk as StorageItems, area);
					after = { ...Object.fromEntries(Object.entries(before).filter(([key]) => !isMemoryStorageKey(key))), ...chunk };
				}
				if (area === "sync" && request.settings !== undefined) {
					if (!request.settings || typeof request.settings !== "object" || Array.isArray(request.settings))
						throw new Error("Invalid settings");
					after.settings = request.settings;
				}
				validateCapacity(after, area);
				updates.push({ area, before, after });
			}
			// Validate BOTH areas before the first write. Storage areas themselves are not transactional.
			for (const { area, before, after } of updates) await commit(area, before, after);
			return true;
		}
		if (request.area !== "sync" && request.area !== "local") throw new Error("Invalid memory storage area");
		if (request.action === "clear") {
			const before = await storage[request.area].get();
			await commit(request.area, before, Object.fromEntries(Object.entries(before).filter(([key]) => !isMemoryStorageKey(key))));
			return true;
		}
		const state = await load(request.area);
		if (request.action === "get") {
			validateField(request.key, undefined);
			const value = state.entries.get(cleanChannelId(request.channelId))?.fields[request.key];
			return value === undefined ? null : request.key === "s" ? Number(value) : value;
		}
		const after = { ...state.items };
		const entries = new Map(state.entries);
		let nextIndex = state.nextIndex;
		if (request.action === "delete") {
			const entry = entries.get(cleanChannelId(request.channelId));
			if (!entry) return false;
			after[entry.table] = String(after[entry.table]).replace(entry.raw, "");
		} else if (request.action === "set") {
			if (!Array.isArray(request.changes) || request.changes.length > 100) throw new Error("Invalid memory changes");
			for (const { channelId, key, value } of request.changes) {
				validateField(key, value);
				if (request.area === "sync" ? key === "l" : key !== "l") throw new Error("Invalid memory storage area");
				const id = cleanChannelId(channelId);
				const old = entries.get(id);
				if (old?.fields[key] === (value === undefined ? undefined : String(value))) continue;
				const fields = { ...old?.fields };
				if (value === undefined) delete fields[key];
				else fields[key] = String(value);
				if (old) after[old.table] = String(after[old.table]).replace(old.raw, "");
				entries.delete(id);
				if (!Object.keys(fields).length) continue;
				if (!Number.isSafeInteger(nextIndex) || nextIndex >= Number.MAX_SAFE_INTEGER) throw new Error("Memory index exhausted");
				const raw = `@${id}!${nextIndex}:${Object.entries(fields)
					.map(([k, v]) => `${k}=${v}`)
					.join(",")};`;
				if (storageBytes("memory_1", raw) >= TABLE_LIMIT) throw new Error("Memory entry quota exceeded");
				let table = old?.table;
				if (!table || storageBytes(table, String(after[table]) + raw) >= TABLE_LIMIT) {
					table = Object.keys(after).find(
						(key) => key.startsWith("memory_") && storageBytes(key, String(after[key]) + raw) < TABLE_LIMIT,
					);
				}
				if (!table) {
					let index = 1;
					while (Object.hasOwn(after, `memory_${index}`)) index++;
					table = `memory_${index}`;
				}
				after[table] = String(after[table] ?? "") + raw;
				entries.set(id, { table, raw, fields });
				nextIndex++;
			}
			if (nextIndex !== state.nextIndex) after.memoryI = nextIndex;
		} else throw new Error("Invalid memory operation");
		await commit(request.area, state.items, after);
		return true;
	}

	return {
		invalidate(area: string) {
			if (area !== "sync" && area !== "local") return;
			revisions[area]++;
			delete cache[area];
		},
		handle(request: MemoryRequest): Promise<unknown> {
			const result = queue.then(() => execute(request));
			queue = result.catch(() => undefined);
			return result;
		},
	};
}

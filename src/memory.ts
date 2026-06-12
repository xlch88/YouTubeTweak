import { createLogger } from "./logger";
const logger = createLogger("memory");

const SAFE_LENGTH = 8100;
const MAX_TABLE_COUNT = 300;
const PREFIX = "memory_";
const STORAGE_WRITE_INTERVAL = 500;

function byteLen(v: any) {
	return new TextEncoder().encode(JSON.stringify(v)).length;
}

function isSafeLength(v: any) {
	return byteLen(v) < SAFE_LENGTH;
}

type MemoryStorager = {
	get: (keys?: string | string[]) => any;
	set: (items: { [key: string]: any }) => Promise<void>;
};
type StorageItems = { [key: string]: any };
type ChannelMemory = {
	/**
	 * Speed
	 * range: 0.25 ~ 3 ?
	 */
	s: 0.25 | 0.5 | 1 | 1.25 | 1.5 | 2 | 3 | number;
	/**
	 * Subtitle is ON or OFF
	 */
	c: "0" | "1";
};
type ChannelMemoryMetadata = {
	__meta__: {
		raw: string;
		tableIndex: string;
		tableContent: string;
		start: number;
		end: number;
		entry: string;
		entries: ChannelMemory;
		index: number;
	};
};

function hasStorageItem(items: StorageItems, key: string) {
	return Object.prototype.hasOwnProperty.call(items, key);
}

function applyStorageItem(target: StorageItems, items: StorageItems, key: string) {
	if (!hasStorageItem(items, key)) return;
	if (items[key] === undefined) {
		delete target[key];
		return;
	}
	target[key] = items[key];
}

function applyStorageItems(target: StorageItems, items: StorageItems, keys?: string[]) {
	(keys ?? Object.keys(items)).forEach((key) => applyStorageItem(target, items, key));
}

class DebouncedMemoryStorage implements MemoryStorager {
	private pendingItems: StorageItems = {};
	private flushingItems: StorageItems = {};
	private writeTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(private source: MemoryStorager) {}

	async get(keys?: string | string[]) {
		const data = await this.source.get(keys);
		if (typeof keys === "string") {
			if (hasStorageItem(this.pendingItems, keys)) return this.pendingItems[keys];
			if (hasStorageItem(this.flushingItems, keys)) return this.flushingItems[keys];
			if (data && typeof data === "object" && hasStorageItem(data, keys)) return data[keys];
			return data;
		}

		const result = data && typeof data === "object" ? { ...data } : {};
		const overlayKeys = Array.isArray(keys) ? keys : undefined;
		applyStorageItems(result, this.flushingItems, overlayKeys);
		applyStorageItems(result, this.pendingItems, overlayKeys);
		return result;
	}

	async set(items: StorageItems) {
		Object.assign(this.pendingItems, items);
		if (!this.writeTimer) {
			this.writeTimer = setTimeout(() => {
				this.flush();
			}, STORAGE_WRITE_INTERVAL);
		}
	}

	private async flush() {
		this.writeTimer = undefined;
		const items = this.pendingItems;
		this.pendingItems = {};
		if (Object.keys(items).length === 0) return;

		Object.assign(this.flushingItems, items);
		try {
			await this.source.set(items);
		} catch (e) {
			logger.warn("save memory error:", e);
		} finally {
			Object.keys(items).forEach((key) => {
				if (this.flushingItems[key] === items[key]) delete this.flushingItems[key];
			});
		}
	}
}

export function createDebouncedMemoryStorage(source: MemoryStorager): MemoryStorager {
	return new DebouncedMemoryStorage(source);
}

let mutationQueue = Promise.resolve() as Promise<void>;

function enqueueMemoryMutation<T>(task: () => Promise<T>): Promise<T> {
	const run = mutationQueue.then(task, task);
	mutationQueue = run.then(
		() => undefined,
		() => undefined,
	);
	return run;
}

/**
 * This module is designed to store information for each YouTube channel,
 * such as playback speed, video quality, etc.
 *
 * It implements a simple chunked storage mechanism because `chrome.storage.sync`
 * has a limitation where each key's length cannot exceed 8192 characters.
 *
 * The data structure is similar to the following format:
 * `@Channel!<lastUpdateOrder>:key1=value1,key2=value2,...;`
 *
 * - `@Channel!`: Indicates the channel ID.
 * - `<lastUpdateOrder>`: Represents the order of the last update.
 * - `key=value`: Stores key-value pairs for the channel's settings.
 * - `;`: Marks the end of the entry.
 *
 * This structure ensures efficient storage and retrieval of channel-specific data
 * while adhering to the storage limitations.
 */
export default {
	storage: createDebouncedMemoryStorage(browser?.storage?.sync as MemoryStorager),
	cleanChannelId(channelId: string) {
		if (channelId.startsWith("@")) channelId = channelId.slice(1);
		if (channelId === "") channelId = "_DEFAULT_";
		channelId = decodeURI(channelId);
		return channelId;
	},
	/**
	 * Sets a value in memory.
	 *
	 * @param channelId The ID of the memory entry.
	 * @param key The key of the memory entry.
	 * @param value The value of the memory entry.
	 * @returns A promise that resolves to true if the value was set successfully, or false if not.
	 */
	async set<K extends keyof ChannelMemory>(channelId: string, key: K, value?: ChannelMemory[K]) {
		return enqueueMemoryMutation(async () => {
			channelId = this.cleanChannelId(channelId);

			const s = `${channelId}${key}${value}`;
			if (/[,@:=;]/.test(s)) throw new Error("Invalid characters in id/key/value");

			if (!isSafeLength(s)) {
				throw new Error("Data exceeds safe length");
			}

			const dataIndex = parseInt(await this.storage.get("memoryI")) || 0;
			const findResult = await this.get(channelId, "__meta__");

			let oldEntries = {};
			if (findResult) {
				const { tableIndex, tableContent, entries, raw } = findResult;
				if (`${entries[key]}` === `${value}`) {
					logger.debug("No change needed for", channelId, key, value);
					return true; // No change needed
				}

				let newEntries = { ...entries };
				if (value === undefined) {
					delete newEntries[key];
				} else {
					newEntries[key] = value;
				}

				const oldValue = raw;
				const newValue = this.encode(channelId, newEntries, dataIndex);
				if (!isSafeLength(newValue)) {
					throw new Error("New value exceeds safe length");
				}

				if (byteLen(tableContent) + (byteLen(newValue) - byteLen(oldValue)) < SAFE_LENGTH) {
					try {
						await this.storage.set({ [tableIndex]: tableContent.replace(oldValue, newValue), memoryI: dataIndex + 1 });
						// debugger;
						logger.debug("Updated in place for", channelId, key, value);
						return true;
					} catch (e) {}
				}

				await this.storage.set({ [tableIndex]: tableContent.replace(oldValue, "") });
				oldEntries = newEntries;
			}

			const newValue = this.encode(channelId, { ...oldEntries, [key]: value }, dataIndex);
			const tables = Object.entries(await this.storage.get()).filter(([name]) => name.startsWith(PREFIX));

			const findInsertTable = tables.filter(([name, content]) => {
				return isSafeLength(`${content}${newValue}`);
			});
			if (findInsertTable.length > 0) {
				const [tableIndex, tableContent] = findInsertTable[0];
				await this.storage.set({ [tableIndex]: tableContent + newValue });
				await this.storage.set({ memoryI: dataIndex + 1 });
				logger.debug("Inserted new value for", channelId, key, value);
				return true;
			}

			const newTableIndex = PREFIX + (Object.keys(tables).length + 1);
			await this.storage.set({ [newTableIndex]: newValue });
			await this.storage.set({ memoryI: dataIndex + 1 });
			logger.debug("Inserted new value for", channelId, key, value);
			return true;
		});
	},

	/**
	 * Gets a value from memory.
	 *
	 * @param channelId The ID of the memory entry.
	 * @param key The key of the memory entry.
	 * @returns The value of the memory entry, or null if not found.
	 */
	async get<K extends keyof (ChannelMemory & ChannelMemoryMetadata)>(
		channelId: string,
		key: K,
	): Promise<(ChannelMemory & ChannelMemoryMetadata)[K] | null> {
		channelId = this.cleanChannelId(channelId);

		const findResult = await this.find(channelId);
		if (!findResult) {
			return null;
		}
		const [tableIndex, tableContent] = findResult as [string, string];

		const start = tableContent.indexOf(`@${channelId}!`);
		if (start === -1) return null;

		const start2 = tableContent.indexOf(`:`, start);
		if (start2 === -1) return null;

		const end = tableContent.indexOf(";", start);
		if (end === -1) return null;

		const entry = tableContent.substring(start2 + 1, end);
		const entries = Object.fromEntries(
			entry.split(",").map((e: string) => {
				return e.split("=");
			}),
		);

		if (!key) return entries;
		const index = tableContent.substring(start + channelId.length + 2, start2);
		const raw = tableContent.substring(start, end + 1);
		if (key === "__meta__") {
			return {
				raw,
				tableIndex,
				tableContent,
				start,
				end,
				entry,
				entries,
				index: Number(index),
			} as (ChannelMemory & ChannelMemoryMetadata)[K];
		}

		return entries[key] || null;
	},

	/**
	 * Finds a memory entry by channel ID.
	 *
	 * @param channelId The ID of the memory entry.
	 * @returns The memory entry, or null if not found.
	 */
	async find(channelId: string) {
		channelId = this.cleanChannelId(channelId);
		const tables = await this.storage.get();
		const result = Object.entries(tables)
			.filter(([name]) => name.startsWith(PREFIX))
			.filter(([_name, value]) => {
				return (value as string).includes("@" + channelId + "!");
			});
		return result ? (result[0] as [string, string]) : null;
	},

	/**
	 * Encodes a memory entry.
	 *
	 * @param channelId The ID of the memory entry.
	 * @param data The data to encode.
	 * @param index The index of the memory entry.
	 * @returns The encoded memory entry.
	 */
	encode(channelId: string, data: Record<string, any>, index: number) {
		channelId = this.cleanChannelId(channelId);
		return (
			`@${channelId}!${index}:` +
			Object.entries(data)
				.map(([key, value]) => `${key}=${value}`)
				.join(",") +
			";"
		);
	},

	/**
	 * Deletes a value from memory.
	 *
	 * @param id The ID of the memory entry.
	 * @param key The key of the memory entry.
	 * @returns A promise that resolves to true if the value was deleted successfully, or false if not found.
	 */
	async del(channelId: string) {
		return enqueueMemoryMutation(async () => {
			channelId = this.cleanChannelId(channelId);

			const findResult = await this.get(channelId, "__meta__");
			if (!findResult) {
				return false; // Entry not found
			}

			const { tableIndex, tableContent, raw } = findResult;

			const updatedContent = tableContent.replace(raw, "");
			await this.storage.set({ [tableIndex]: updatedContent });

			return true;
		});
	},

	/**
	 * Clears all memory tables.
	 */
	clear() {
		return enqueueMemoryMutation(async () => {
			const data = (await this.storage.get()) as Record<string, string>;
			const keysToRemove = Object.keys(data).filter((key) => key.startsWith(PREFIX));
			const itemsToRemove = keysToRemove.reduce(
				(acc, key) => {
					acc[key] = undefined;
					return acc;
				},
				{} as Record<string, undefined>,
			);
			await this.storage.set(itemsToRemove);
		});
	},
};

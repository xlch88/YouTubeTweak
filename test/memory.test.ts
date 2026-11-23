import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { createMemoryService, isMemoryReply, isMemoryStorageKey, type MemoryChange } from "../src/memory";

type StorageMap = Record<string, unknown>;
type AreaName = "sync" | "local";

type MockStorageOptions = {
	sync?: StorageMap;
	local?: StorageMap;
	onGet?: (area: AreaName, data: StorageMap) => Promise<void> | void;
	onSet?: (area: AreaName, items: StorageMap) => Promise<boolean | void> | boolean | void;
	onRemove?: (area: AreaName, keys: string[]) => Promise<void> | void;
};

const encoder = new TextEncoder();

function storageBytes(key: string, value: unknown) {
	return encoder.encode(key).length + encoder.encode(JSON.stringify(value)).length;
}

function makeCaptionValue(languageCode: string, extra: Partial<{ kind: string; vss_id: string; translationLanguage: string }> = {}) {
	return encodeURIComponent(
		JSON.stringify({
			languageCode,
			kind: extra.kind ?? "",
			vss_id: extra.vss_id ?? `.${languageCode}`,
			translationLanguage: extra.translationLanguage ?? "",
		}),
	);
}

function createMockMemoryEnv(options: MockStorageOptions = {}) {
	const data: Record<AreaName, StorageMap> = {
		sync: structuredClone(options.sync ?? {}),
		local: structuredClone(options.local ?? {}),
	};
	const calls = {
		get: { sync: 0, local: 0 },
		set: { sync: [] as StorageMap[], local: [] as StorageMap[] },
		remove: { sync: [] as string[][], local: [] as string[][] },
	};

	const makeArea = (area: AreaName) => ({
		async get() {
			calls.get[area]++;
			const snapshot = structuredClone(data[area]);
			await options.onGet?.(area, snapshot);
			return snapshot;
		},
		async set(items: StorageMap) {
			calls.set[area].push(structuredClone(items));
			const res = await options.onSet?.(area, items);
			if (res === false) return false;
			Object.assign(data[area], structuredClone(items));
			return true;
		},
		async remove(keys: string[]) {
			calls.remove[area].push([...keys]);
			await options.onRemove?.(area, keys);
			for (const key of keys) delete data[area][key];
		},
	});

	return {
		data,
		calls,
		service: createMemoryService({ sync: makeArea("sync"), local: makeArea("local") }),
	};
}

function assertCleanTables(items: StorageMap, maxTableBytes = 8100) {
	const seenChannels = new Set<string>();
	for (const [key, value] of Object.entries(items)) {
		if (!key.startsWith("memory_")) continue;
		assert.match(key, /^memory_[1-9]\d*$/, `Unexpected memory key: ${key}`);
		assert.equal(typeof value, "string", `Table ${key} must be a string`);
		assert.ok(storageBytes(key, value) < maxTableBytes, `${key} exceeded ${maxTableBytes} bytes: ${storageBytes(key, value)}`);
		let offset = 0;
		for (const match of (value as string).matchAll(/@([^!@,:;=]+)!(\d+):([^;]*);/g)) {
			assert.equal(match.index, offset, `Malformed gap in ${key} at ${offset}`);
			offset += match[0].length;
			assert.equal(seenChannels.has(match[1]), false, `Duplicate channel remained: ${match[1]}`);
			seenChannels.add(match[1]);
		}
		assert.equal(offset, (value as string).length, `Trailing garbage in ${key}`);
	}
	return seenChannels;
}

afterEach(() => {
	mock.restoreAll();
});

describe("memory utility helpers", () => {
	it("validates MemoryReply shapes strictly", () => {
		assert.equal(isMemoryReply({ ok: true, value: null }), true);
		assert.equal(isMemoryReply({ ok: true, value: undefined }), true);
		assert.equal(isMemoryReply({ ok: false, error: "boom" }), true);
		assert.equal(isMemoryReply({ ok: false, error: "boom", message: "friendly" }), true);

		assert.equal(isMemoryReply(null), false);
		assert.equal(isMemoryReply(undefined), false);
		assert.equal(isMemoryReply("ok"), false);
		assert.equal(isMemoryReply({ ok: true }), false);
		assert.equal(isMemoryReply({ ok: false }), false);
		assert.equal(isMemoryReply({ ok: false, error: 123 }), false);
		assert.equal(isMemoryReply({ ok: "true", value: 1 }), false);
	});

	it("identifies memory storage keys", () => {
		assert.equal(isMemoryStorageKey("memoryI"), true);
		assert.equal(isMemoryStorageKey("memory_1"), true);
		assert.equal(isMemoryStorageKey("memory_bad"), true);
		assert.equal(isMemoryStorageKey("settings"), false);
		assert.equal(isMemoryStorageKey("memory"), false);
	});
});

describe("duplicate merging and self-healing (Issue #66)", () => {
	it("reproduces Issue #66 exact duplicate patterns and oversized memory_1 (>8100 bytes)", async () => {
		mock.method(console, "warn", () => {});

		let filler = "";
		let idx = 1;
		while (storageBytes("memory_1", filler) < 7960) {
			filler += `@Channel${idx}!${idx}:c=1;`;
			idx++;
		}
		const memory1 =
			filler +
			"@GitKraken!310:c=1;@GitKraken!310:s=2;" +
			"@Calzee!1298:c=1;@Calzee!1289:c=0;" +
			"@AJieLive!1538:c=0;@AJieLive!1538:c=0;" +
			"@LinusTechTips!2895:c=1;@LinusTechTips!2884:c=0;";

		const initialSize = storageBytes("memory_1", memory1);
		assert.ok(initialSize > 8100 && initialSize <= 8192, `Expected 8100 < size <= 8192, got ${initialSize}`);

		const env = createMockMemoryEnv({
			sync: { memoryI: 3572, memory_1: memory1, settings: { keepMe: true } },
		});

		// Reads succeed immediately without triggering writes
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@GitKraken", key: "c" }), "1");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@GitKraken", key: "s" }), 2);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Calzee", key: "c" }), "1");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@AJieLive", key: "c" }), "0");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@LinusTechTips", key: "c" }), "1");
		assert.equal(env.calls.set.sync.length, 0);

		// First write self-heals duplicates and repacks under TABLE_LIMIT
		await env.service.handle({
			action: "set",
			area: "sync",
			changes: [{ channelId: "@GitKraken", key: "c", value: "0" }],
		});
		assert.equal(env.calls.set.sync.length, 1);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@GitKraken", key: "c" }), "0");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@GitKraken", key: "s" }), 2);
		assert.deepEqual(env.data.sync.settings, { keepMe: true });

		const channels = assertCleanTables(env.data.sync);
		assert.equal(channels.has("GitKraken"), true);
		assert.equal(channels.has("Calzee"), true);
		assert.equal(channels.has("AJieLive"), true);
		assert.equal(channels.has("LinusTechTips"), true);

		// Deleting a previously duplicated channel must not resurrect a zombie entry
		assert.equal(await env.service.handle({ action: "delete", area: "sync", channelId: "@AJieLive" }), true);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@AJieLive", key: "c" }), null);
	});

	it("merges 3+ out-of-order cross-table duplicates accurately per field index", async () => {
		mock.method(console, "warn", () => {});

		const env = createMockMemoryEnv({
			sync: {
				memoryI: 500,
				memory_10: "@Multi!100:s=1.5;@Tie!50:c=1;",
				memory_1: "@Multi!300:c=0;",
				memory_2: "@Multi!200:s=2;@Tie!50:c=0;",
			},
		});

		// Field s: index 200 beats 100 even though 300 only touched c
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Multi", key: "s" }), 2);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Multi", key: "c" }), "0");
		// Tie-break on same index is deterministic by numeric table order: memory_2 before memory_10 -> memory_10 wins
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Tie", key: "c" }), "1");

		// Even a no-op set commits self-healing and deletes obsolete memory_2 & memory_10
		await env.service.handle({
			action: "set",
			area: "sync",
			changes: [{ channelId: "@Multi", key: "c", value: "0" }],
		});
		assert.equal(env.data.sync.memory_2, undefined);
		assert.equal(env.data.sync.memory_10, undefined);
		assert.equal(env.data.sync.memory_1, "@Multi!300:c=0,s=2;@Tie!50:c=1;");
		assertCleanTables(env.data.sync);
	});

	it("handles 5 interleaved duplicates of the same channel in one table", async () => {
		mock.method(console, "warn", () => {});

		const env = createMockMemoryEnv({
			sync: {
				memoryI: 99,
				memory_1: "@Five!10:c=0;@Five!30:s=1.25;@Five!20:c=1,s=3;@Five!30:c=0;@Five!15:s=0.5;",
			},
		});

		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Five", key: "c" }), "0");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Five", key: "s" }), 1.25);

		await env.service.handle({
			action: "set",
			area: "sync",
			changes: [{ channelId: "@Five", key: "s", value: 1.5 }],
		});
		assert.equal(env.data.sync.memory_1, "@Five!99:c=0,s=1.5;");
		assert.equal(env.data.sync.memoryI, 100);
	});

	it("deletes all cross-table duplicates directly without resurrection", async () => {
		mock.method(console, "warn", () => {});

		const env = createMockMemoryEnv({
			sync: {
				memoryI: 50,
				memory_1: "@Dup!10:c=1;@Keep!11:s=1.5;",
				memory_2: "@Dup!20:s=2;",
				memory_3: "@Dup!15:c=0;",
			},
		});

		assert.equal(await env.service.handle({ action: "delete", area: "sync", channelId: "@Dup" }), true);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Dup", key: "c" }), null);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Dup", key: "s" }), null);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Keep", key: "s" }), 1.5);
		assert.equal(env.data.sync.memory_2, undefined);
		assert.equal(env.data.sync.memory_3, undefined);
		assertCleanTables(env.data.sync);
	});

	it("clears all fields of a duplicated channel via set(undefined) without leaving zombies", async () => {
		mock.method(console, "warn", () => {});

		const env = createMockMemoryEnv({
			sync: {
				memoryI: 30,
				memory_1: "@Gone!10:c=1;",
				memory_2: "@Gone!20:s=2;",
			},
		});

		await env.service.handle({
			action: "set",
			area: "sync",
			changes: [
				{ channelId: "@Gone", key: "c", value: undefined },
				{ channelId: "@Gone", key: "s", value: undefined },
			],
		});

		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Gone", key: "c" }), null);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Gone", key: "s" }), null);
		assert.equal(env.data.sync.memory_1, "");
		assert.equal(env.data.sync.memory_2, undefined);
	});

	it("merges duplicate _DEFAULT_ and Unicode/URI-encoded channel entries", async () => {
		mock.method(console, "warn", () => {});

		const env = createMockMemoryEnv({
			sync: {
				memoryI: 25,
				memory_1: "@_DEFAULT_!5:c=1;@_DEFAULT_!5:s=1.75;@测试频道!8:c=0;@测试频道!12:c=1,s=2;",
			},
		});

		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "", key: "c" }), "1");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@", key: "s" }), 1.75);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: encodeURI("@测试频道"), key: "s" }), 2);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "测试频道", key: "c" }), "1");

		await env.service.handle({
			action: "set",
			area: "sync",
			changes: [{ channelId: "", key: "s", value: 1.25 }],
		});
		assertCleanTables(env.data.sync);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "_DEFAULT_", key: "s" }), 1.25);
	});

	it("merges duplicate local subtitle language entries by latest index", async () => {
		mock.method(console, "warn", () => {});

		const en = makeCaptionValue("en");
		const ja = makeCaptionValue("ja", { kind: "asr", translationLanguage: "zh-Hans" });
		const env = createMockMemoryEnv({
			local: {
				memoryI: 30,
				memory_1: `@video_abcdefghijk!5:l=${en};@video_abcdefghijk!15:l=${ja};`,
			},
		});

		assert.equal(await env.service.handle({ action: "get", area: "local", channelId: "video_abcdefghijk", key: "l" }), ja);

		const ko = makeCaptionValue("ko");
		await env.service.handle({
			action: "set",
			area: "local",
			changes: [{ channelId: "video_abcdefghijk", key: "l", value: ko }],
		});
		assert.equal(await env.service.handle({ action: "get", area: "local", channelId: "video_abcdefghijk", key: "l" }), ko);
		assertCleanTables(env.data.local);
	});
});

describe("corrupted and legacy storage fault tolerance", () => {
	it("recovers valid entries while skipping bad memoryI, bad table names, malformed fragments, and invalid fields", async () => {
		mock.method(console, "warn", () => {});

		const badLang = makeCaptionValue("en");
		const env = createMockMemoryEnv({
			sync: {
				memoryI: "3572",
				memory_0: "@ZeroTable!1:c=1;",
				memory_bad: 12345,
				memory_2: null,
				memory_1:
					"GARBAGE;" +
					"@Good1!10:c=1,s=undefined,c=0,x=9,broken,a=b=c;" +
					`@CrossArea!11:l=${badLang},s=2;` +
					"@LegacyBang!Name!12:c=1;" +
					"@BadSpeedZero!13:s=0;" +
					"@BadSpeedHigh!14:s=17;" +
					"@EmptyFields!15:;" +
					"@OverflowIdx!9007199254740991:c=1;" +
					"@Good2!20:c=1;" +
					"@Good2!25:c=undefined;" +
					"@Good3!18:s=1.25;" +
					"@Truncated!19:c=1",
			},
		});

		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Good1", key: "c" }), "1");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Good1", key: "s" }), null);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@CrossArea", key: "s" }), 2);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Good2", key: "c" }), "1");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Good3", key: "s" }), 1.25);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@BadSpeedZero", key: "s" }), null);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@OverflowIdx", key: "c" }), null);

		// Next write cleans up all invalid tables/fragments and advances memoryI past the highest valid index (25 -> 26)
		await env.service.handle({
			action: "set",
			area: "sync",
			changes: [{ channelId: "@Fresh", key: "c", value: "0" }],
		});
		assert.equal(env.data.sync.memory_0, undefined);
		assert.equal(env.data.sync.memory_bad, undefined);
		assert.equal(env.data.sync.memory_2, undefined);
		assert.equal(env.data.sync.memoryI, 27);
		const channels = assertCleanTables(env.data.sync);
		assert.deepEqual([...channels].sort(), ["CrossArea", "Fresh", "Good1", "Good2", "Good3"]);
	});

	it("splits an existing sync table exceeding 8192 bytes during load + next write", async () => {
		mock.method(console, "warn", () => {});

		let oversized = "";
		let idx = 1;
		while (storageBytes("memory_1", oversized) <= 8300) {
			oversized += `@Over${idx}!${idx}:c=1;`;
			idx++;
		}
		assert.ok(storageBytes("memory_1", oversized) > 8192);

		const env = createMockMemoryEnv({
			sync: { memoryI: idx, memory_1: oversized },
		});

		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Over1", key: "c" }), "1");

		await env.service.handle({
			action: "set",
			area: "sync",
			changes: [{ channelId: "@NewAfterSplit", key: "s", value: 2 }],
		});
		assert.ok(typeof env.data.sync.memory_1 === "string");
		assert.ok(typeof env.data.sync.memory_2 === "string");
		const channels = assertCleanTables(env.data.sync);
		assert.equal(channels.has("Over1"), true);
		assert.equal(channels.has("NewAfterSplit"), true);
	});

	it("allows clear even when storage is completely corrupted and preserves non-memory settings", async () => {
		const env = createMockMemoryEnv({
			sync: {
				settings: { theme: "dark" },
				memoryI: "NaN",
				memory_1: "TOTAL_GARBAGE",
				memory_weird: { broken: true },
			},
		});

		assert.equal(await env.service.handle({ action: "clear", area: "sync" }), true);
		assert.deepEqual(env.data.sync, { settings: { theme: "dark" } });
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Any", key: "c" }), null);
	});

	it("handles completely corrupted storage where zero valid entries survive", async () => {
		mock.method(console, "warn", () => {});

		const env = createMockMemoryEnv({
			sync: {
				memoryI: -5,
				memory_1: "!!!BROKEN!!!",
				settings: { keep: 1 },
			},
		});

		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Any", key: "c" }), null);
		await env.service.handle({
			action: "set",
			area: "sync",
			changes: [{ channelId: "@Recovered", key: "s", value: 1.5 }],
		});
		assert.equal(env.data.sync.memory_1, "@Recovered!0:s=1.5;");
		assert.equal(env.data.sync.memoryI, 1);
		assert.deepEqual(env.data.sync.settings, { keep: 1 });
	});
});

describe("import and export edge cases", () => {
	it("auto-merges duplicates when importing legacy backups and strips obsolete tables", async () => {
		mock.method(console, "warn", () => {});

		const env = createMockMemoryEnv({
			sync: {
				memoryI: 10,
				memory_1: "@Old!1:c=1;",
				memory_2: "@Old2!2:s=2;",
				settings: { a: 1 },
			},
		});

		await env.service.handle({
			action: "import",
			settings: { a: 2 },
			memoryChunk: {
				memoryI: 3572,
				memory_1: "@GitKraken!310:c=1;@GitKraken!310:s=2;",
				memory_2: "@Calzee!1289:c=0;@Calzee!1298:c=1;",
			},
		});

		assert.equal(env.data.sync.memory_2, undefined);
		assert.equal(env.data.sync.memory_1, "@GitKraken!310:c=1,s=2;@Calzee!1298:c=1;");
		assert.equal(env.data.sync.memoryI, 3572);
		assert.deepEqual(env.data.sync.settings, { a: 2 });
	});

	it("imports an Issue #66 oversized (8100..8192 bytes) duplicate backup and shrinks it under TABLE_LIMIT", async () => {
		mock.method(console, "warn", () => {});

		let filler = "";
		let idx = 1;
		while (storageBytes("memory_1", filler) < 7960) {
			filler += `@Imp${idx}!${idx}:c=1;`;
			idx++;
		}
		const oversizedWithDup =
			filler +
			"@GitKraken!310:c=1;@GitKraken!310:s=2;" +
			"@Calzee!1298:c=1;@Calzee!1289:c=0;" +
			"@AJieLive!1538:c=0;@AJieLive!1538:c=0;" +
			"@LinusTechTips!2895:c=1;@LinusTechTips!2884:c=0;";
		assert.ok(storageBytes("memory_1", oversizedWithDup) > 8100 && storageBytes("memory_1", oversizedWithDup) <= 8192);

		const en = makeCaptionValue("en");
		const ja = makeCaptionValue("ja");
		const env = createMockMemoryEnv();
		await env.service.handle({
			action: "import",
			memoryChunk: { memoryI: 3572, memory_1: oversizedWithDup },
			localMemoryChunk: {
				memoryI: 20,
				memory_1: `@video_abcdefghijk!1:l=${en};@video_abcdefghijk!9:l=${ja};`,
			},
		});

		assertCleanTables(env.data.sync);
		assertCleanTables(env.data.local);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@GitKraken", key: "c" }), "1");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@GitKraken", key: "s" }), 2);
		assert.equal(await env.service.handle({ action: "get", area: "local", channelId: "video_abcdefghijk", key: "l" }), ja);
	});

	it("rejects malformed backups on import without modifying existing storage", async () => {
		const env = createMockMemoryEnv({
			sync: { memoryI: 5, memory_1: "@Safe!4:c=1;", settings: { intact: true } },
			local: { memoryI: 2, memory_1: `@video_12345678901!1:l=${makeCaptionValue("en")};` },
		});

		const invalidBackups: Record<string, unknown>[] = [
			{ memory_1: "CORRUPT@A!1:c=1;" },
			{ memory_1: "@A!1:c=1;TRAILING" },
			{ memory_1: "@A!1:c=2;" },
			{ memory_1: "@A!1:s=0;" },
			{ memory_1: `@A!1:l=${makeCaptionValue("en")};` },
			{ memory_1: "@A!1:c=1,c=0;" },
			{ memory_0: "@A!1:c=1;" },
			{ memory_1: 123 },
			{ memoryI: -1 },
			{ memoryI: "10" },
			{ notMemory: "abc" },
		];

		for (const memoryChunk of invalidBackups) {
			await assert.rejects(() => env.service.handle({ action: "import", memoryChunk }));
		}

		assert.equal(env.calls.set.sync.length, 0);
		assert.equal(env.calls.set.local.length, 0);
		assert.equal(env.data.sync.memory_1, "@Safe!4:c=1;");
	});

	it("validates both sync and local before writing either area on import", async () => {
		const env = createMockMemoryEnv({
			sync: { memoryI: 5, memory_1: "@BeforeSync!4:c=1;", settings: { v: 1 } },
			local: { memoryI: 2, memory_1: `@video_12345678901!1:l=${makeCaptionValue("en")};` },
		});

		await assert.rejects(
			() =>
				env.service.handle({
					action: "import",
					settings: { v: 2 },
					memoryChunk: { memoryI: 10, memory_1: "@NewSync!9:c=0;" },
					localMemoryChunk: { memoryI: 10, memory_1: "@video_12345678901!9:c=1;" },
				}),
			/Invalid memory storage area/,
		);

		assert.equal(env.calls.set.sync.length, 0);
		assert.equal(env.calls.set.local.length, 0);
		assert.equal(env.data.sync.memory_1, "@BeforeSync!4:c=1;");
		assert.deepEqual(env.data.sync.settings, { v: 1 });
	});

	it("exports only memory keys and excludes settings", async () => {
		const env = createMockMemoryEnv({
			sync: { settings: { secret: 1 }, memoryI: 3, memory_1: "@A!2:c=1;" },
			local: { waitUpdate: "2.0.5", memoryI: 2, memory_1: `@video_12345678901!1:l=${makeCaptionValue("ja")};` },
		});

		const exported = (await env.service.handle({ action: "export" })) as {
			memoryChunk: StorageMap;
			localMemoryChunk: StorageMap;
		};
		assert.deepEqual(exported.memoryChunk, { memoryI: 3, memory_1: "@A!2:c=1;" });
		assert.deepEqual(exported.localMemoryChunk, {
			memoryI: 2,
			memory_1: `@video_12345678901!1:l=${makeCaptionValue("ja")};`,
		});
	});

	it("repairs corrupted existing storage when importing a valid backup", async () => {
		const env = createMockMemoryEnv({
			sync: { memoryI: "broken", memory_1: "CORRUPTED", memory_bad: 999 },
		});

		await env.service.handle({
			action: "import",
			memoryChunk: { memoryI: 2, memory_1: "@Clean!1:s=2;" },
		});

		assert.equal(env.data.sync.memory_bad, undefined);
		assert.equal(env.data.sync.memory_1, "@Clean!1:s=2;");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Clean", key: "s" }), 2);
	});
});

describe("validation, quota, incremental updates, retry, and concurrency", () => {
	it("enforces strict field, channelId, batch size, and area validation on set", async () => {
		const env = createMockMemoryEnv();

		await assert.rejects(
			() => env.service.handle({ action: "set", area: "sync", changes: [{ channelId: "a!b", key: "c", value: "1" }] }),
			/Invalid channel ID/,
		);
		await assert.rejects(
			() => env.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@@double", key: "c", value: "1" }] }),
			/Invalid channel ID/,
		);
		await assert.rejects(
			() => env.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@A", key: "s", value: 0 }] }),
			/Invalid playback speed/,
		);
		await assert.rejects(
			() => env.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@A", key: "s", value: 16.01 }] }),
			/Invalid playback speed/,
		);
		await assert.rejects(
			() => env.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@A", key: "s", value: "1e2" }] }),
			/Invalid playback speed/,
		);
		await assert.rejects(
			() => env.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@A", key: "c", value: "2" }] }),
			/Invalid subtitle status/,
		);
		await assert.rejects(
			() =>
				env.service.handle({
					action: "set",
					area: "sync",
					changes: [{ channelId: "@A", key: "l", value: makeCaptionValue("en") }],
				}),
			/Invalid memory storage area/,
		);
		await assert.rejects(
			() => env.service.handle({ action: "set", area: "local", changes: [{ channelId: "@A", key: "s", value: 2 }] }),
			/Invalid memory storage area/,
		);
		await assert.rejects(
			() =>
				env.service.handle({
					action: "set",
					area: "local",
					changes: [{ channelId: "video_1", key: "l", value: encodeURIComponent(JSON.stringify({ kind: "asr" })) }],
				}),
			/Invalid subtitle language/,
		);

		const tooMany: MemoryChange[] = Array.from({ length: 101 }, (_, i) => ({
			channelId: `@C${i}`,
			key: "c",
			value: "1",
		}));
		await assert.rejects(() => env.service.handle({ action: "set", area: "sync", changes: tooMany }), /Invalid memory changes/);

		// Valid boundary speed values succeed
		await env.service.handle({
			action: "set",
			area: "sync",
			changes: [
				{ channelId: "@Min", key: "s", value: 0.0001 },
				{ channelId: "@Max", key: "s", value: 16 },
			],
		});
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Min", key: "s" }), 0.0001);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Max", key: "s" }), 16);
	});

	it("enforces sync quota limits (single entry, 102400 bytes, 512 keys) while local bypasses sync quota", async () => {
		const env = createMockMemoryEnv();

		// Oversized single entry
		await assert.rejects(
			() =>
				env.service.handle({
					action: "set",
					area: "sync",
					changes: [{ channelId: `@${"a".repeat(8090)}`, key: "c", value: "1" }],
				}),
			/Memory entry quota exceeded/,
		);

		// 512-key sync limit
		const manyKeys: StorageMap = {};
		for (let i = 0; i < 512; i++) manyKeys[`k${i}`] = 1;
		const keyEnv = createMockMemoryEnv({ sync: manyKeys });
		await assert.rejects(
			() => keyEnv.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@Overflow", key: "c", value: "1" }] }),
			/Sync storage quota exceeded/,
		);
		assert.equal(keyEnv.calls.set.sync.length, 0);

		// 102400-byte sync limit
		const fullSync: StorageMap = {};
		for (let i = 0; i < 12; i++) fullSync[`blob_${i}`] = "x".repeat(8150);
		fullSync.blob_tail = "x".repeat(4400);
		const byteEnv = createMockMemoryEnv({ sync: fullSync });
		await assert.rejects(
			() =>
				byteEnv.service.handle({
					action: "set",
					area: "sync",
					changes: [{ channelId: `@${"z".repeat(500)}`, key: "c", value: "1" }],
				}),
			/Sync storage quota exceeded/,
		);
		assert.equal(byteEnv.calls.set.sync.length, 0);

		// Local storage allows exceeding 102400 bytes
		const bigLocal: StorageMap = { extra: "x".repeat(120000) };
		const localEnv = createMockMemoryEnv({ local: bigLocal });
		const lang = makeCaptionValue("zh-Hans");
		await localEnv.service.handle({
			action: "set",
			area: "local",
			changes: [{ channelId: "video_12345678901", key: "l", value: lang }],
		});
		assert.equal(await localEnv.service.handle({ action: "get", area: "local", channelId: "video_12345678901", key: "l" }), lang);
	});

	it("keeps incremental single-table writes on healthy multi-table storage and spills cleanly to new tables", async () => {
		const env = createMockMemoryEnv({
			sync: {
				memoryI: 10,
				memory_1: "@A!1:c=1;",
				memory_2: "@B!2:c=0;",
			},
		});

		await env.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@B", key: "s", value: 1.5 }] });
		assert.equal(env.calls.set.sync.length, 1);
		assert.equal("memory_1" in env.calls.set.sync[0], false);
		assert.equal(env.calls.set.sync[0].memory_2, "@B!10:c=0,s=1.5;");

		// Spill to a new table when memory_1 is near TABLE_LIMIT
		let almostFull = "";
		let i = 1;
		while (storageBytes("memory_1", almostFull) < 8070) {
			almostFull += `@S${i}!${i}:c=1;`;
			i++;
		}
		const spillEnv = createMockMemoryEnv({ sync: { memoryI: i, memory_1: almostFull } });
		await spillEnv.service.handle({
			action: "set",
			area: "sync",
			changes: [{ channelId: "@SpillIntoTable2", key: "s", value: 2.25 }],
		});
		assert.equal(typeof spillEnv.data.sync.memory_2, "string");
		assert.match(String(spillEnv.data.sync.memory_2), /^@SpillIntoTable2!\d+:s=2\.25;$/);
		assertCleanTables(spillEnv.data.sync);
	});

	it("handles UTF-8 multibyte channel names accurately against 8100-byte table limit", async () => {
		const env = createMockMemoryEnv();
		// Each Chinese character is 3 UTF-8 bytes; 2600 chars = 7800 bytes (< 8100)
		const cjk1 = "频道".repeat(1300);
		const cjk2 = "字幕".repeat(1300);
		await env.service.handle({
			action: "set",
			area: "sync",
			changes: [
				{ channelId: `@${cjk1}`, key: "c", value: "1" },
				{ channelId: `@${cjk2}`, key: "s", value: 2 },
			],
		});
		assert.equal(typeof env.data.sync.memory_1, "string");
		assert.equal(typeof env.data.sync.memory_2, "string");
		assertCleanTables(env.data.sync);
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: `@${cjk1}`, key: "c" }), "1");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: `@${cjk2}`, key: "s" }), 2);
	});

	it("retries transient write errors, fails immediately on quota errors, and stays healthy after failed requests", async () => {
		let attempts = 0;
		const retryEnv = createMockMemoryEnv({
			onSet(area) {
				if (area === "sync" && ++attempts < 3) throw new Error("Transient storage error");
			},
		});
		await retryEnv.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@RetryOk", key: "c", value: "1" }] });
		assert.equal(attempts, 3);
		assert.equal(await retryEnv.service.handle({ action: "get", area: "sync", channelId: "@RetryOk", key: "c" }), "1");

		// Quota error must NOT retry
		let quotaAttempts = 0;
		const quotaEnv = createMockMemoryEnv({
			onSet() {
				quotaAttempts++;
				throw new Error("MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded");
			},
		});
		await assert.rejects(
			() => quotaEnv.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@Quota", key: "c", value: "1" }] }),
			/quota/i,
		);
		assert.equal(quotaAttempts, 1);

		// Returning false from storage.set triggers retry and eventually rejects
		let falseAttempts = 0;
		const falseEnv = createMockMemoryEnv({
			onSet() {
				falseAttempts++;
				return false;
			},
		});
		await assert.rejects(
			() => falseEnv.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@Fail", key: "c", value: "1" }] }),
			/Memory storage write failed/,
		);
		assert.equal(falseAttempts, 3);

		// Subsequent valid operations still work after a rejected request in the queue
		const recoverEnv = createMockMemoryEnv();
		await assert.rejects(() =>
			recoverEnv.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@Bad", key: "s", value: -1 }] }),
		);
		await recoverEnv.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@Good", key: "s", value: 2 }] });
		assert.equal(await recoverEnv.service.handle({ action: "get", area: "sync", channelId: "@Good", key: "s" }), 2);
	});

	it("remains readable if cleanup remove() fails after a committed set()", async () => {
		mock.method(console, "warn", () => {});

		const env = createMockMemoryEnv({
			sync: {
				memoryI: 20,
				memory_1: "@Dup!10:c=1;",
				memory_2: "@Dup!15:s=2;",
			},
			onRemove() {
				throw new Error("remove failed");
			},
		});

		await assert.rejects(
			() => env.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@Dup", key: "c", value: "0" }] }),
			/remove failed/,
		);

		// Even though remove() failed, obsolete memory_2 was already emptied in set(), so subsequent reads see committed data
		assert.equal(env.data.sync.memory_2, "");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Dup", key: "c" }), "0");
		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Dup", key: "s" }), 2);
	});

	it("serializes concurrent mutations without losing writes and retries stale snapshots on invalidate()", async () => {
		const env = createMockMemoryEnv();

		await Promise.all(
			Array.from({ length: 25 }, (_, i) =>
				env.service.handle({
					action: "set",
					area: "sync",
					changes: [
						{ channelId: `@Ch${i}`, key: "c", value: i % 2 === 0 ? "1" : "0" },
						{ channelId: `@Ch${i}`, key: "s", value: 1 + (i % 4) * 0.25 },
					],
				}),
			),
		);

		const channels = assertCleanTables(env.data.sync);
		assert.equal(channels.size, 25);
		assert.equal(env.data.sync.memoryI, 50);
		for (let i = 0; i < 25; i++) {
			assert.equal(
				await env.service.handle({ action: "get", area: "sync", channelId: `@Ch${i}`, key: "c" }),
				i % 2 === 0 ? "1" : "0",
			);
			assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: `@Ch${i}`, key: "s" }), 1 + (i % 4) * 0.25);
		}

		// Simulate external storage.onChanged invalidation mid-load
		let invalidatedOnce = false;
		const raceEnv = createMockMemoryEnv({
			sync: { memoryI: 1, memory_1: "@Race!0:c=0;" },
			async onGet(area) {
				if (area === "sync" && !invalidatedOnce) {
					invalidatedOnce = true;
					raceEnv.data.sync.memory_1 = "@Race!5:c=1;";
					raceEnv.data.sync.memoryI = 6;
					raceEnv.service.invalidate("sync");
				}
			},
		});

		assert.equal(await raceEnv.service.handle({ action: "get", area: "sync", channelId: "@Race", key: "c" }), "1");
		assert.equal(raceEnv.calls.get.sync, 2);
	});

	it("rejects writes when memoryI reaches MAX_SAFE_INTEGER while keeping reads available", async () => {
		const env = createMockMemoryEnv({
			sync: { memoryI: Number.MAX_SAFE_INTEGER, memory_1: "@Edge!1:c=1;" },
		});

		assert.equal(await env.service.handle({ action: "get", area: "sync", channelId: "@Edge", key: "c" }), "1");
		await assert.rejects(
			() => env.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@Edge", key: "s", value: 2 }] }),
			/Memory index exhausted/,
		);
	});

	it("handles multi-change same-channel batches on dirty storage, empty table reuse, and malformed URI channel IDs", async () => {
		mock.method(console, "warn", () => {});

		// Same channel updated multiple times in one set batch on top of duplicated storage
		const batchEnv = createMockMemoryEnv({
			sync: {
				memoryI: 50,
				memory_1: "@Batch!10:c=1;",
				memory_2: "@Batch!20:s=1.5;",
			},
		});
		await batchEnv.service.handle({
			action: "set",
			area: "sync",
			changes: [
				{ channelId: "@Batch", key: "c", value: "0" },
				{ channelId: "@Batch", key: "s", value: 2 },
				{ channelId: "@Batch", key: "c", value: "1" },
			],
		});
		assertCleanTables(batchEnv.data.sync);
		assert.equal(batchEnv.data.sync.memory_2, undefined);
		assert.equal(await batchEnv.service.handle({ action: "get", area: "sync", channelId: "@Batch", key: "c" }), "1");
		assert.equal(await batchEnv.service.handle({ action: "get", area: "sync", channelId: "@Batch", key: "s" }), 2);

		// Reuses empty existing table instead of endlessly creating new tables
		let fullTable1 = "";
		let i = 1;
		while (storageBytes("memory_1", fullTable1) < 8070) {
			fullTable1 += `@F${i}!${i}:c=1;`;
			i++;
		}
		const reuseEnv = createMockMemoryEnv({
			sync: { memoryI: i + 1, memory_1: fullTable1, memory_2: "" },
		});
		await reuseEnv.service.handle({
			action: "set",
			area: "sync",
			changes: [{ channelId: "@ReuseTable2", key: "c", value: "0" }],
		});
		assert.equal(reuseEnv.data.sync.memory_3, undefined);
		assert.match(String(reuseEnv.data.sync.memory_2), /^@ReuseTable2!\d+:c=0;$/);

		// Malformed percent-encoding in channelId rejects cleanly without breaking subsequent requests
		await assert.rejects(
			() => reuseEnv.service.handle({ action: "set", area: "sync", changes: [{ channelId: "@bad%ZZ", key: "c", value: "1" }] }),
			URIError,
		);
		// Delete of non-existent channel returns false and unknown invalidate area is safely ignored
		reuseEnv.service.invalidate("managed");
		assert.equal(await reuseEnv.service.handle({ action: "delete", area: "sync", channelId: "@NoSuchChannel" }), false);
		assert.equal(await reuseEnv.service.handle({ action: "get", area: "sync", channelId: "@ReuseTable2", key: "c" }), "0");
	});
});

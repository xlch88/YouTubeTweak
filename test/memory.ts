import memory from "@/memory";
const storage: Record<string, any> = {};

memory.storage = {
	async get(obj) {
		if (typeof obj === "string") {
			return storage[obj];
		}

		return Object.fromEntries(Object.entries(storage).filter(([key]) => storage[key] !== undefined));
	},
	async set(obj) {
		for (const [key, value] of Object.entries(obj)) {
			storage[key] = value;
		}
	},
};

// console.log(await memory.get("channel1", "key1"));
for (let i = 1; i <= 10; i++) {
	console.log(await memory.set(`channel${i}`, `sss`, 1));
	console.log(await memory.set(`channel${i}`, `cccc`, 0));
	console.log(await memory.set(`channel${i}`, `qqqq`, 9));
}
console.log(await memory.set(`seoiufhnuishfusrg0`, `s`, 1));
console.log(await memory.get("qwqwq", "keyTest399"));

console.log(await memory.set(`channel10`, `sss`));
console.log(await memory.del(`channel3`));

console.log(
	Object.fromEntries(
		Object.entries(storage).map(([key, value]) => {
			if (key === "memoryI") return ["index", value < 0 ? 0 : value];
			return [key, value.split(";")];
		}),
	),
);

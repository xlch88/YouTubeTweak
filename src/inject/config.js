import DefaultConfig from "../defaultConfig.js";
import { createLogger } from "../logger.js";
const logger = createLogger("config");

const STORAGE_KEY = "settings";

export default {
	config: {},
	memory: {},

	init() {
		return new Promise((resolve) => {
			chrome.storage.sync.get(null, (res) => {
				this.config = { ...DefaultConfig, ...(res[STORAGE_KEY] ?? {}) };
				this.memory = res["memory"] ?? {};
				resolve(this.config);
			});
		});
	},
	get(key = null, defaultValue = null, isMemory = false) {
		if (key === null) return isMemory ? this.memory : this.config;

		return this[isMemory ? "memory" : "config"][key] ?? defaultValue;
	},
	set(key, value, isMemory = false) {
		logger.log(`set ${isMemory ? "memory" : "setting"} : ${key} ->`, value);
		if (key) this[isMemory ? "memory" : "config"][key] = value;
		chrome.storage.sync.set(isMemory ? { memory: this.memory } : { [STORAGE_KEY]: this.config }, () => {});
	},
};

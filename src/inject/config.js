import DefaultConfig from "../defaultConfig.js";
import { createLogger } from "../logger.js";
import wirelessRedstone from "./wirelessRedstone.js";
const logger = createLogger("config");

export default {
	config: {},
	memory: {},
	onUpdate: null,
	skipUpdateEvent: false,

	init() {
		return new Promise((resolve) => {
			wirelessRedstone.send("getConfig", ["settings", "memory"], (result) => {
				this.config = { ...DefaultConfig, ...(result.settings ?? {}) };
				this.memory = result.memory ?? {};

				resolve(this.config);
			});

			wirelessRedstone.handlers.configUpdate = (data) => {
				logger.log("config update:", data);

				if (this.skipUpdateEvent) return (this.skipUpdateEvent = false);

				if (data.settings) {
					this.config = { ...this.config, ...data.settings.newValue };
				}
				if (data.memory) {
					this.memory = { ...this.memory, ...data.memory.newValue };
				}

				if (this.onUpdate) this.onUpdate(data);
			};
		});
	},
	get(key = null, defaultValue = null, isMemory = false) {
		if (key === null) return isMemory ? this.memory : this.config;

		return this[isMemory ? "memory" : "config"][key] ?? defaultValue;
	},
	set(key, value, isMemory = false) {
		logger.log(`set ${isMemory ? "memory" : "setting"} : ${key} ->`, value);
		if (key) this[isMemory ? "memory" : "config"][key] = value;

		this.skipUpdateEvent = true;
		wirelessRedstone.send("setConfig", isMemory ? { memory: this.memory } : { settings: this.config });
	},
};

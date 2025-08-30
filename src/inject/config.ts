import DefaultConfig from "../defaultConfig";
import { createLogger } from "../logger";
import wirelessRedstone from "./wirelessRedstone";
const logger = createLogger("config");
import type { Config } from "../defaultConfig";

export default {
	config: {} as Config,
	memory: {},
	onUpdate: null as null | ((data: any) => void),
	skipUpdateEvent: false,

	init() {
		return new Promise((resolve) => {
			wirelessRedstone.handlers.configUpdate = (data: {
				settings: {
					oldValue: Partial<Config>;
					newValue: Partial<Config>;
				};
				memory: {
					oldValue: Record<string, any>;
					newValue: Record<string, any>;
				};
			}) => {
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
			wirelessRedstone.send(
				"getConfig",
				["settings", "memory"],
				(result: { settings: Partial<Config>; memory: Record<string, any> }) => {
					this.config = { ...DefaultConfig, ...(result.settings ?? {}) };
					this.memory = result.memory ?? {};

					resolve(this.config);
				},
			);
		});
	},
	get<K extends keyof Config>(key: K, defaultValue?: Config[K]): Config[K] {
		return this.config[key] ?? defaultValue;
	},
	getAll() {
		return this.config;
	},
	set<K extends keyof Config>(key: K, value: Config[K]) {
		logger.log(`set setting : ${key} ->`, value);
		if (key) this.config[key] = value;

		this.skipUpdateEvent = true;
		wirelessRedstone.send("setConfig", { settings: this.config });
	},
};

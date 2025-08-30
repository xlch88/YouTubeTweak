import { defineStore } from "pinia";
import { toRaw } from "vue";
import { createLogger } from "@/logger";
import defaultConfig from "@/defaultConfig";

import type { PiniaPlugin } from "pinia";

const logger = createLogger("config");

export const STORAGE_KEY = "settings";

export default defineStore("config", {
	state: () => {
		return JSON.parse(JSON.stringify(defaultConfig));
	},

	actions: {
		loadStorage(init = false) {
			browser.storage.sync.get(STORAGE_KEY).then((res) => {
				this.$patch(res[STORAGE_KEY] || {});
				logger.info("loadStorage ->", res[STORAGE_KEY]);

				if (init) {
					this.saveStorage();
				}
			});
		},
		saveStorage() {
			const rawData = toRaw(this.$state);
			logger.info("saveStorage ->", rawData);
			browser.storage.sync.set({ [STORAGE_KEY]: rawData }).catch((e) => {
				logger.warn("save config error:", e);
			});
			browser.tabs.query({ url: "*://*.youtube.com/*" }).then((tabs) => {
				tabs.forEach((tab) => {
					if (!tab.id) return;

					browser.tabs.sendMessage(tab.id, { action: "reloadConfig" }).catch((e) => {
						logger.warn("sendMessage error:", e);
					});
				});
			});
		},
	},
});

export const configPlugin: PiniaPlugin = ({ store }) => {
	let isInitial = true;
	store.$subscribe(() => {
		if (isInitial) {
			isInitial = false;
			return;
		}
		logger.debug("update:", store);
		store.saveStorage();
	});

	store.loadStorage(true);
};

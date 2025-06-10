import { defineStore } from "pinia";
import { toRaw } from "vue";
import { createLogger } from "@/logger.js";
import defaultConfig from "@/defaultConfig.js";
import { browser } from "@wxt-dev/webextension-polyfill/browser";
const logger = createLogger("config");

export const STORAGE_KEY = "settings";

export default defineStore("config", {
	state: () => {
		return defaultConfig;
	},

	actions: {
		loadStorage(init = false) {
			browser.storage.sync.get(STORAGE_KEY, (res) => {
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
			browser.storage.sync.set({ [STORAGE_KEY]: rawData }, () => {});
			browser.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
				tabs.forEach((tab) => {
					browser.tabs.sendMessage(tab.id, { action: "reloadConfig" }).catch((e) => {
						logger.warn("sendMessage error:", e);
					});
				});
			});
		},
	},
});

export const configPlugin = ({ store }) => {
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

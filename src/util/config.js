import { defineStore } from "pinia";
import { toRaw } from "vue";
import { createLogger } from "../logger.js";
const logger = createLogger("config");

export const STORAGE_KEY = "settings";

export default defineStore("config", {
	state: () => {
		return {
			"player.ui.enableSpeedButtons": true,
			"player.ui.speedButtons": [0.5, 1, 1.5, 2],
			"player.ui.hideButton.autoplay": false,
			"player.ui.hideButton.subtitles": false,
			"player.ui.hideButton.settings": false,
			"player.ui.hideButton.miniPlayer": true,
			"player.ui.hideButton.pip": true,
			"player.ui.hideButton.size": true,
			"player.ui.hideButton.remote": true,
			"player.ui.hideButton.fullscreen": false,
			"player.ui.hideCeElement": true,
			"player.settings.maxVolume": true,

			"comment.nickname": true,
			"comment.autoShowMore": true,
			"comment.autoTranslate": true,

			"index.videoPerRow.enable": false,
			"index.videoPerRow.count": 4,
			"other.antiAD.enable": true,
			"other.antiAD.enableMerch": true,
		};
	},

	actions: {
		loadStorage(init = false) {
			chrome.storage.sync.get(STORAGE_KEY, (res) => {
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
			chrome.storage.sync.set({ [STORAGE_KEY]: rawData }, () => {});
			chrome.tabs.query({}, (tabs) => {
				tabs.forEach((tab) => {
					chrome.tabs.sendMessage(tab.id, { action: "reloadConfig" }).catch((e) => {
						logger.error("sendMessage error:", e);
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
//
// export const DEFAULT_CONFIG = {
// 	"player.ui.enableSpeedButtons": true,
// 	"player.ui.speedButtons": [0.5, 1, 1.5, 2],
// 	"player.ui.hideButton.autoplay": false,
// 	"player.ui.hideButton.subtitles": false,
// 	"player.ui.hideButton.settings": false,
// 	"player.ui.hideButton.miniPlayer": true,
// 	"player.ui.hideButton.pip": true,
// 	"player.ui.hideButton.size": true,
// 	"player.ui.hideButton.remote": true,
// 	"player.ui.hideButton.fullscreen": false,
// 	"player.ui.hideCeElement": true,
// 	"player.settings.maxVolume": true,
//
// 	"comment.nickname": true,
// 	"comment.autoShowMore": true,
// 	"comment.autoTranslate": true,
//
// 	"index.videoPerRow.enable": false,
// 	"index.videoPerRow.count": 4,
// };
//
// let configCache = {};
//
// export const a = {
// 	init() {
// 		return new Promise((resolve) => {
// 			chrome.storage.sync.get(NAMESPACE_KEY, (res) => {
// 				configCache = res[NAMESPACE_KEY] || {};
// 				resolve(configCache);
// 			});
// 		});
// 	},
//
// 	get(path) {
// 		if (path === undefined) {
// 			return configCache;
// 		}
//
// 		return configCache[path] ?? DEFAULT_CONFIG[path];
// 	},
//
// 	set(path, value) {
// 		if (!path) {
// 			configCache = value;
// 		} else {
// 			configCache[path] = value;
// 		}
//
// 		console.log("save config", path, value);
//
// 		chrome.storage.sync.set({ [NAMESPACE_KEY]: configCache }, () => {});
// 		chrome.tabs.query({}, (tabs) => {
// 			tabs.forEach((tab) => {
// 				chrome.tabs.sendMessage(tab.id, { action: "reloadConfig" }).catch(() => {});
// 			});
// 		});
// 	},
// };

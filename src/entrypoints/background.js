import { defineBackground } from "wxt/utils/define-background";
import { browser } from "@wxt-dev/webextension-polyfill/browser";

export default defineBackground(() => {
	browser.runtime.onInstalled.addListener((details) => {
		switch (details.reason) {
			case "install":
				browser.tabs.create({ url: "popup.html?action=installed" }).catch(() => {});
				break;

			case "update":
				browser.storage.local.set({ waitUpdate: false }).catch(() => {});

				browser.storage.local
					.get("needReloadTabs")
					.then((result) => {
						if (!result.needReloadTabs) return;

						browser.storage.local.set({ needReloadTabs: false }).catch(() => {});
						browser.tabs.query({ url: "*://*.youtube.com/*", discarded: false }).then((cb) => {
							cb.forEach((tab) => {
								browser.tabs.reload(tab.id).catch(() => {});
							});
						});
					})
					.catch((e) => {
						console.error("Error getting needReloadTabs:", e);
					});
				break;
		}

		console.log(details);
	});

	browser.runtime.onUpdateAvailable.addListener((details) => {
		browser.storage.local.set({ waitUpdate: details.version }).catch(() => {});
	});
});

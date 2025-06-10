import { defineBackground } from "wxt/utils/define-background";

export default defineBackground(() => {
	chrome.runtime.onInstalled.addListener((details) => {
		switch (details.reason) {
			case "install":
				chrome.tabs.create({ url: "popup.html?action=installed" }).catch(() => {});
				break;

			case "update":
				chrome.storage.local.set({ waitUpdate: false }).catch(() => {});

				chrome.storage.local
					.get("needReloadTabs")
					.then((result) => {
						if (!result.needReloadTabs) return;

						chrome.storage.local.set({ needReloadTabs: false }).catch(() => {});
						chrome.tabs.query({ url: "*://*.youtube.com/*", discarded: false }).then((cb) => {
							cb.forEach((tab) => {
								chrome.tabs.reload(tab.id).catch(() => {});
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

	chrome.runtime.onUpdateAvailable.addListener((details) => {
		chrome.storage.local.set({ waitUpdate: details.version }).catch(() => {});
	});
});

import { defineBackground } from "wxt/utils/define-background";
import initPlayerNetworkSpeedBackground from "@/inject/plugins_isolatedWorld/player-network-speed-background";
import { READ_CHANGELOG_VERSION_STORAGE_KEY, syncVersionNoticeBadge } from "@/util/versionNotice";

function reloadAllYouTubeTabs() {
	return browser.tabs
		.query({ url: "*://*.youtube.com/*", discarded: false })
		.then((tabs) =>
			Promise.allSettled(tabs.filter((tab) => typeof tab.id === "number").map((tab) => browser.tabs.reload(tab.id as number))),
		);
}

export default defineBackground({
	persistent: false,
	main() {
		initPlayerNetworkSpeedBackground();
		syncVersionNoticeBadge().catch(() => {});

		browser.runtime.onInstalled.addListener((details) => {
			switch (details.reason) {
				case "install":
					browser.tabs.create({ url: "popup.html?action=installed" }).catch(() => {});
					break;

				case "update":
					browser.storage.local.set({ waitUpdate: false }).catch(() => {});
					browser.storage.local
						.get(READ_CHANGELOG_VERSION_STORAGE_KEY)
						.then((result) => {
							if (typeof result[READ_CHANGELOG_VERSION_STORAGE_KEY] === "string" || !details.previousVersion) return;
							return browser.storage.local.set({ [READ_CHANGELOG_VERSION_STORAGE_KEY]: details.previousVersion });
						})
						.then(() => syncVersionNoticeBadge())
						.catch(() => {});

					browser.storage.local
						.get("needReloadTabs")
						.then((result) => {
							if (!result.needReloadTabs) return;

							browser.storage.local.set({ needReloadTabs: false }).catch(() => {});
							reloadAllYouTubeTabs();
						})
						.catch((e) => {
							console.error("Error getting needReloadTabs:", e);
						});
					break;
			}

			console.log(details);
		});

		browser.runtime.onMessage.addListener((message) => {
			if (message?.type !== "reloadAllYouTubeTabs") return;
			return reloadAllYouTubeTabs().then(() => true);
		});

		browser.runtime.onUpdateAvailable.addListener((details) => {
			browser.storage.local.set({ waitUpdate: details.version }).catch(() => {});
		});
	},
});

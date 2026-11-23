import { defineBackground } from "wxt/utils/define-background";
import { READ_CHANGELOG_VERSION_STORAGE_KEY, syncVersionNoticeBadge } from "@/util/versionNotice";
import { createMemoryService, type MemoryReply } from "@/memory";

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
		const memory = createMemoryService(browser.storage);
		browser.storage.onChanged.addListener((_changes, area) => memory.invalidate(area));
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

		browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
			if (message?.type === "memoryRequest") {
				// WXT exposes the native API: keep the response channel open even without Promise-listener support.
				memory.handle(message.request).then(
					(value) => sendResponse({ ok: true, value } satisfies MemoryReply),
					(error) => {
						console.error("Memory request failed:", error);
						sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) } satisfies MemoryReply);
					},
				);
				return true;
			}
			if (["getVideoSubtitleMemory", "setVideoSubtitleMemory"].includes(message?.type)) {
				if (typeof message.videoId !== "string" || !/^[A-Za-z0-9_-]{11}$/.test(message.videoId)) {
					sendResponse(null);
					return;
				}
				if (message.type === "setVideoSubtitleMemory" && typeof message.value !== "string") {
					sendResponse(false);
					return;
				}
				memory
					.handle(
						message.type === "getVideoSubtitleMemory"
							? { action: "get", area: "local", channelId: `video_${message.videoId}`, key: "l" }
							: {
									action: "set",
									area: "local",
									changes: [{ channelId: `video_${message.videoId}`, key: "l", value: message.value }],
								},
					)
					.then(sendResponse, (error) => {
						console.error("Video subtitle memory request failed:", error);
						sendResponse(message.type === "getVideoSubtitleMemory" ? null : false);
					});
				return true;
			}
			if (message?.type !== "reloadAllYouTubeTabs") return;
			reloadAllYouTubeTabs().then(
				() => sendResponse(true),
				(error) => {
					console.error("Failed to reload YouTube tabs:", error);
					sendResponse(false);
				},
			);
			return true;
		});

		browser.runtime.onUpdateAvailable.addListener((details) => {
			browser.storage.local.set({ waitUpdate: details.version }).catch(() => {});
		});
	},
});

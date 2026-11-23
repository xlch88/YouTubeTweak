import { isMemoryReply, type MemoryRequest, type MemoryReply } from "@/memory";
import { createLogger } from "../logger";
import wirelessRedstone from "./wirelessRedstone";

const logger = createLogger("IsolatedWorld");

export default function isolatedWorld() {
	if (!["www.youtube.com", "m.youtube.com"].includes(location.host)) return;

	logger.log("Initializing isolated world...");

	wirelessRedstone.init("isolated");
	const reloadNoticeMessages = {
		chromeApiOffline: browser.i18n.getMessage("reload_notice_chrome_api_offline", __APP_BRANDING__.compactName),
		reloadOnToggle: browser.i18n.getMessage("reload_notice_on_toggle"),
		reloadCurrentPage: browser.i18n.getMessage("reload_notice_current_page"),
		reloadAllYouTubePages: browser.i18n.getMessage("reload_notice_all_youtube_pages"),
	};

	Object.assign(wirelessRedstone.handlers, {
		async memoryRequest(request: MemoryRequest, reply: (result: MemoryReply) => void) {
			try {
				if (!["get", "set", "delete"].includes(request?.action)) throw new Error("Invalid page memory operation");
				const result: unknown = await browser.runtime.sendMessage({ type: "memoryRequest", request });
				if (!isMemoryReply(result))
					throw new Error("Missing or invalid memory response from background; reload the extension and YouTube page.");
				if (!result.ok) {
					console.error("[YTTweak] Memory request failed:", request.action, result.error);
					result.message = browser.i18n.getMessage(
						/quota/i.test(result.error) ? "memory_notice_quota" : "memory_notice_save_failed",
					);
				}
				reply(result);
			} catch (error) {
				console.error("[YTTweak] Memory request failed:", request?.action, error);
				reply({
					ok: false,
					error: error instanceof Error ? error.message : String(error),
					message: browser.i18n.getMessage("memory_notice_save_failed"),
				});
			}
		},
		getVideoSubtitleMemory(videoId: string, reply: (result: string | null) => void) {
			browser.runtime
				.sendMessage({ type: "getVideoSubtitleMemory", videoId })
				.then(reply)
				.catch((error) => {
					logger.error("Failed to read video subtitle memory:", error);
					reply(null);
				});
		},
		setVideoSubtitleMemory(data: { videoId: string; value: string }, reply: (result: boolean) => void) {
			browser.runtime
				.sendMessage({ type: "setVideoSubtitleMemory", videoId: data.videoId, value: data.value })
				.then(reply)
				.catch((error) => {
					logger.error("Failed to save video subtitle memory:", error);
					reply(false);
				});
		},
		getConfig(data: Parameters<typeof browser.storage.sync.get>[0], reply: (result: Record<string, any>) => void) {
			browser.storage.sync.get(data).then((result) => {
				reply(result);
			});
		},
		setConfig(data: Parameters<typeof browser.storage.sync.set>[0], reply: (result: boolean) => void) {
			browser.storage.sync
				.set(data)
				.then(() => {
					reply(true);
				})
				.catch((e) => {
					logger.error("Failed to set config:", e);
					reply(false);
				});
		},
		getReloadNoticeMessages(type: "chromeApiOffline" | "reloadOnToggle", reply: (result: Record<string, string>) => void) {
			reply({
				message: reloadNoticeMessages[type],
				reloadCurrentPage: reloadNoticeMessages.reloadCurrentPage,
				reloadAllYouTubePages: reloadNoticeMessages.reloadAllYouTubePages,
			});
		},
		reloadAllYouTubeTabs() {
			browser.runtime.sendMessage({ type: "reloadAllYouTubeTabs" }).catch((e) => {
				logger.error("Failed to reload all YouTube tabs:", e);
			});
		},
	});
	if (window === window.top) {
		browser.runtime.onMessage.addListener((message) => {
			if (
				![
					"getInsightsData",
					"getInsightsVerificationData",
					"getInsightsRegionsData",
					"getInsightsFormats",
					"getInsightsLanguageVersion",
				].includes(message?.action)
			)
				return;

			return new Promise((resolve) => {
				const timeout = window.setTimeout(() => resolve({ error: "main-world-timeout" }), 15000);
				wirelessRedstone.send(
					message.action,
					message.action === "getInsightsLanguageVersion"
						? { videoId: message.payload?.videoId, language: message.payload?.language }
						: null,
					(data) => {
						window.clearTimeout(timeout);
						resolve(data);
					},
				);
			});
		});
	}
	browser.storage.onChanged.addListener((changes, areaName) => {
		if (areaName === "sync" && typeof changes === "object" && changes.settings !== undefined) {
			wirelessRedstone.send("configUpdate", changes);
		}
	});
	// browser.runtime.onMessage.addListener((msg) => {
	// 	console.log("Received update from background:", msg.changes);
	// });

	let chromeApiStatusChecker: number | undefined;
	Object.assign(wirelessRedstone.handlers, {
		enableChromeApiStatusChecker(isEnable: boolean) {
			window.clearInterval(chromeApiStatusChecker);
			chromeApiStatusChecker = undefined;
			if (!isEnable) return;

			chromeApiStatusChecker = window.setInterval(() => {
				if (browser?.runtime?.id) return;
				wirelessRedstone.send("chromeApiOffline", true);
				window.clearInterval(chromeApiStatusChecker);
				chromeApiStatusChecker = undefined;
			}, 1000);
		},
	});

	window.__YT_TWEAK__ = {
		WORLD: "isolated",
	};
}

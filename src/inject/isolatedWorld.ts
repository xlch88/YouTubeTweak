import memory, { createDebouncedMemoryStorage } from "@/memory";
import { createLogger } from "../logger";
import wirelessRedstone from "./wirelessRedstone";

const logger = createLogger("IsolatedWorld");

export default function isolatedWorld() {
	if (!["www.youtube.com", "m.youtube.com"].includes(location.host)) return;

	logger.log("Initializing isolated world...");

	wirelessRedstone.init("isolated");
	memory.storage = createDebouncedMemoryStorage(browser.storage.sync);
	const reloadNoticeMessages = {
		chromeApiOffline: browser.i18n.getMessage("reload_notice_chrome_api_offline", __APP_BRANDING__.compactName),
		reloadOnToggle: browser.i18n.getMessage("reload_notice_on_toggle"),
		reloadCurrentPage: browser.i18n.getMessage("reload_notice_current_page"),
		reloadAllYouTubePages: browser.i18n.getMessage("reload_notice_all_youtube_pages"),
	};

	Object.assign(wirelessRedstone.handlers, {
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

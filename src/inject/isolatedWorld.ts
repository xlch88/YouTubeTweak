import memory from "@/memory";
import { createLogger } from "../logger";
import wirelessRedstone from "./wirelessRedstone";

const logger = createLogger("IsolatedWorld");

globalThis.browser = globalThis.browser || globalThis.chrome;

export default function isolatedWorld() {
	if (!["www.youtube.com", "m.youtube.com"].includes(location.host)) return;

	logger.log("Initializing isolated world...");

	wirelessRedstone.init("isolated");
	memory.storage = browser.storage.sync;

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
			if (!isEnable) {
				window.clearInterval(chromeApiStatusChecker);
				chromeApiStatusChecker = undefined;
				return;
			}

			chromeApiStatusChecker = window.setInterval(() => {
				if (browser?.runtime?.id) return;
				wirelessRedstone.send("chromeApiOffline", true);
				clearInterval(chromeApiStatusChecker);
			}, 1000);
		},
	});

	window.__YT_TWEAK__ = {
		WORLD: "isolated",
	};
}

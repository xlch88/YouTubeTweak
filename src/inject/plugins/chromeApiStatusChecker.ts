import wirelessRedstone from "@/inject/wirelessRedstone";
import { isDEV } from "@/logger";
import { showReloadNotice } from "@/inject/util/reloadNotice";

import type { Plugin } from "../types";

export default {
	"yttweak.enableChromeApiStatusChecker": {
		enable() {
			wirelessRedstone.handlers.chromeApiOffline = () => {
				showReloadNotice("chromeApiOffline");

				// mode === "development" only
				if (isDEV) {
					location.reload();
				}
			};
			wirelessRedstone.send("enableChromeApiStatusChecker", true);
		},
		disable() {
			wirelessRedstone.send("enableChromeApiStatusChecker", false);
		},
	},
} as Record<string, Plugin>;

import { createLogger } from "../../logger.js";
import { metadata } from "../mainWorld.js";
const logger = createLogger("anti-ad");

export default () => {
	const enableAntiVideoAD = localStorage.getItem("YTTweak-plugin-AntiVideoAD");
	logger.debug(enableAntiVideoAD ? "AntiVideoAD plugin enabled" : "AntiVideoAD plugin disabled");

	Object.defineProperty(window, "ytplayer", {
		configurable: true,
		enumerable: true,
		set(v) {
			logger.debug("window.ytplayer set:", v);

			// hook window.ytplayer.config
			Object.defineProperty(v, "config", {
				configurable: true,
				enumerable: true,
				set(cfg) {
					if (enableAntiVideoAD) {
						if (cfg?.args?.raw_player_response?.playerAds) cfg.args.raw_player_response.playerAds = [];
					}
					this._cfg = cfg;
				},
				get() {
					return this._cfg;
				},
			});

			// hook window.ytplayer.bootstrapPlayerResponse
			Object.defineProperty(v, "bootstrapPlayerResponse", {
				configurable: true,
				enumerable: true,
				set(rsp) {
					if (enableAntiVideoAD) {
						if (rsp?.adSlots) delete rsp.adSlots;
						if ("playerAds" in rsp) rsp.playerAds = [];
						if ("adPlacements" in rsp) rsp.adPlacements = [];
					}
					// if (rsp?.auxiliaryUi?.messageRenderers?.bkaEnforcementMessageViewModel) {
					// 	logger.info("Removing adblockblock from player response");
					// 	delete rsp.auxiliaryUi;
					// }

					if (rsp?.videoDetails?.videoId) {
						metadata.video = rsp;
						logger.debug("Get video metadata:", rsp);
					}

					delete window.ytplayer.bootstrapPlayerResponse;
					window.ytplayer.bootstrapPlayerResponse = rsp;
				},
				get() {
					return undefined;
				},
			});

			delete window.ytplayer;
			window.ytplayer = v;
		},
		get() {
			return undefined;
		},
	});

	Object.defineProperty(window, "ytInitialData", {
		configurable: true,
		enumerable: true,
		set(v) {
			this._ytInitialData = v;

			if (v?.currentVideoEndpoint?.watchEndpoint?.videoId) {
				metadata.videoNext = v;
				logger.debug("Get video next metadata:", v);
			}
		},
		get() {
			return this._ytInitialData;
		},
	});
};

import { createLogger } from "../../logger.js";
import { metadata } from "../mainWorld.js";
const logger = createLogger("anti-ad");

export default () => {
	const enableAntiAD = localStorage.getItem("YTTweak-plugin-AntiAD");
	logger.warn(enableAntiAD ? "AntiAD plugin enabled" : "AntiAD plugin disabled");

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
					if (enableAntiAD) {
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
					if (enableAntiAD) {
						if (rsp?.adSlots) delete rsp.adSlots;
						if ("playerAds" in rsp) rsp.playerAds = [];
						if ("adPlacements" in rsp) rsp.adPlacements = [];
					}
					// if (rsp?.auxiliaryUi?.messageRenderers?.bkaEnforcementMessageViewModel) {
					// 	logger.info("Removing adblockblock from player response");
					// 	delete rsp.auxiliaryUi;
					// }
					this._bpr = rsp;

					if (rsp?.videoDetails?.videoId) {
						metadata.video = rsp;
						logger.debug("Get video metadata:", rsp);
					}
				},
				get() {
					return this._bpr;
				},
			});

			this._ytp = v;
		},
		get() {
			return this._ytp;
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

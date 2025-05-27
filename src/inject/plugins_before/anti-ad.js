import { createLogger } from "../../logger.js";
const logger = createLogger("anti-ad");

export default () => {
	if (localStorage.getItem("YTTweak-plugin-AntiAD")) {
		Object.defineProperty(window, "ytplayer", {
			configurable: true,
			enumerable: true,
			set(v) {
				logger.log("window.ytplayer set:", v);

				// hook window.ytplayer.config
				Object.defineProperty(v, "config", {
					configurable: true,
					enumerable: true,
					set(cfg) {
						if (cfg?.args?.raw_player_response?.playerAds) cfg.args.raw_player_response.playerAds = [];
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
						if (rsp?.adSlots) delete rsp.adSlots;
						this._bpr = rsp;
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
	}
};

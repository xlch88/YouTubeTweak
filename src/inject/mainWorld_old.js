import { createLogger } from "../logger.js";
import { youtubeiAPIv1 } from "./util/youtubei.js";

const logger = createLogger("MainWorld");

window.addEventListener("message", (event) => {
	if (event.source !== window || event.data.from !== "YouTubeTweak-PlayerAPI-IsolatedWorld") return;

	const reply = (success, data = null) => {
		window.postMessage(
			{
				from: "YouTubeTweak-PlayerAPI-MainWorld",
				apiId: event.data.apiId,
				msgId: event.data.msgId,
				success: success,
				result: data,
			},
			"*",
		);
	};

	const player = document.querySelector(`ytd-player #movie_player[yttweak-api-id="${event.data.apiId}"]`);
	if (!player) {
		reply(false, "Player not found");
		return;
	}

	logger.debug("player:", player);

	if (player[event.data.func] !== undefined) {
		try {
			const result = player[event.data.func](...event.data.args);
			logger.debug("call player api:", event.data.func, event.data.args, result);
			reply(true, result);
			return;
		} catch (e) {
			reply(false, e.trace);
			logger.error("call player api error:", event.data.func, event.data.args, e);
			return;
		}
	}
	reply(false, "Function not found");
});

(function () {
	const originalFetch = window.fetch;
	window.fetch = async function (...args) {
		const url = args[0]?.url || args[0];
		if (typeof url === "string" && url.includes("/youtubei/v1/player")) {
			const response = await originalFetch.apply(this, args);
			const data = await response.clone().json();

			window.postMessage(
				{
					from: "YouTubeTweak-FetchHook",
					type: "player-v1",
					url,
					data,
				},
				"*",
			);

			if (data && typeof data === "object" && "adSlots" in data) {
				logger.info("Removing adSlots from player response", url);
				delete data.adSlots;
			}

			return new Response(JSON.stringify(data), {
				status: response.status,
				statusText: response.statusText,
				headers: new Headers(response.headers),
			});
		}
		return originalFetch.apply(this, args);
	};
})();

window.__YT_TWEAK__ = {
	WORLD: "main",
	youtubeiAPIv1,
};

Object.defineProperty(window, "ytplayer", {
	configurable: true,
	enumerable: true,
	set(v) {
		console.log("ytplayer set:", v);

		// 拦截 ytplayer.config
		Object.defineProperty(v, "config", {
			configurable: true,
			enumerable: true,
			set(cfg) {
				console.log("ytplayer.config 被赋值:", cfg);
				if (cfg?.args?.raw_player_response?.playerAds) {
					cfg.args.raw_player_response.playerAds = [];
				}
				this._cfg = cfg;
			},
			get() {
				return this._cfg;
			},
		});

		// 拦截 ytplayer.bootstrapPlayerResponse
		Object.defineProperty(v, "bootstrapPlayerResponse", {
			configurable: true,
			enumerable: true,
			set(rsp) {
				console.log("ytplayer.bootstrapPlayerResponse 被赋值:", rsp);
				if (rsp?.adSlots) {
					delete rsp.adSlots;
				}
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

(function waitForBody() {
	if (document.body) {
		if (window.ytInitialPlayerResponse) {
			window.postMessage(
				{
					from: "YouTubeTweak-FetchHook",
					type: "player-v1",
					url: "ytInitialPlayerResponse",
					data: window.ytInitialPlayerResponse,
				},
				"*",
			);
			delete window.ytInitialPlayerResponse.adSlots;
		}
	} else {
		requestAnimationFrame(waitForBody);
	}
})();

Object.defineProperty(window, "PolymerFakeBaseClassWithoutHtml", {
	configurable: true,
	enumerable: true,
	get() {
		return this._PolymerFakeBaseClassWithoutHtml;
	},
	set(v) {
		console.warn("[劫持] 有人试图定义 PolymerFakeBaseClassWithoutHtml");
		console.trace("调用堆栈：");
		this._PolymerFakeBaseClassWithoutHtml = function () {
			if (!this?.hostElement) return;
			if (this.hostElement?.tagName === "YTD-RICH-GRID-RENDERER") {
				window.fuck = this;
				console.log("aaaaaaaaaaaaaaaaaaaaaaa", arguments, this?.hostElement);
			}
		};
	},
});

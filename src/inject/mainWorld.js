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
			const clone = response.clone();
			clone.json().then((data) => {
				window.postMessage(
					{
						from: "YouTubeTweak-FetchHook",
						type: "player-v1",
						url,
						data,
					},
					"*",
				);
			});
			return response;
		}
		return originalFetch.apply(this, args);
	};
})();

window.__YT_TWEAK__ = {
	WORLD: "main",
	youtubeiAPIv1,
};

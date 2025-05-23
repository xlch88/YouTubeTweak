import { createLogger } from "../logger.js";
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

	logger.log("player:", player);

	if (player[event.data.func] !== undefined) {
		try {
			const result = player[event.data.func](...event.data.args);
			logger.info("call player api:", event.data.func, event.data.args, result);
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

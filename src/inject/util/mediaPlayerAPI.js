import { createLogger } from "../../logger.js";
const playerApiLogger = createLogger("PlayerAPI");

const playerProxyList = {};
/**
 * YouTube Player API Proxy
 * the plugin dwells in DIM-7, the player in DIM0
 * only a Twilight Portal can link these realms.
 *
 * @returns {{
 *   setPlaybackQuality: (string) => Promise<undefined>,
 *   getAvailableQualityLevels: () => Promise<string[]>,
 *   setPlaybackRate: (float) => Promise<undefined>,
 * }}
 */
export function createPlayerAPIProxy(player) {
	let apiId = player.getAttribute("yttweak-api-id");
	if (apiId && playerProxyList[apiId]) {
		playerApiLogger.debug("get player api proxy:", apiId);
		return playerProxyList[apiId];
	}

	apiId = crypto.randomUUID();
	const callbackMap = {};
	let msgId = 0;
	player.setAttribute("yttweak-api-id", apiId);
	playerApiLogger.log("create player api proxy:", apiId);

	const messageCallback = (event) => {
		if (event.source !== window || event.data.from !== "YouTubeTweak-PlayerAPI-MainWorld" || event.data.apiId !== apiId) return;
		if (!callbackMap[event.data?.msgId]) return;

		const call = callbackMap[event.data.msgId][event.data.success ? "resolve" : "reject"];
		call(event.data.result);
		delete callbackMap[event.data.msgId];
	};
	window.addEventListener("message", messageCallback);

	const proxy = new Proxy(
		{},
		{
			get(target, prop) {
				return (...args) => {
					return new Promise((resolve, reject) => {
						msgId++;

						window.postMessage(
							{
								from: "YouTubeTweak-PlayerAPI-IsolatedWorld",
								apiId: apiId,
								func: prop,
								args: args,
								msgId: msgId,
							},
							"*",
						);

						callbackMap[msgId] = {
							resolve,
							reject,
						};
					});
				};
			},
		},
	);

	playerProxyList[apiId] = proxy;
	return proxy;
}

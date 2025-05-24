import config from "./config.js";
import logger from "../logger.js";

const plugins = Object.assign({}, ...Object.values(import.meta.glob("./plugins/*.js", { eager: true }).map((m) => m.default)));

export const videoPlayer = {
	box: null,
	player: null,
	controls: null,
	videoStream: null,
export const metadata = {
	video: null,
};

(async () => {
	await new Promise((resolve) => {
		if (document.body) resolve();
		const observer = new MutationObserver(() => {
			if (document.body) {
				observer.disconnect();
				resolve();
			}
		});

		observer.observe(document.documentElement, { childList: true });
	});
	await config.init();

	for (const [key, value] of Object.entries(config.get())) {
		if (value && plugins[key]?.enable) {
			logger.info(`plugin enable:`, key);

			try {
				plugins[key]?.enable();
			} catch (e) {
				logger.error("plugin error:", e);
			}
		}
	}

	chrome.runtime.onMessage.addListener(async () => {
		logger.warn("config update");
		const oldConfig = config.get();
		const newConfig = await config.init();

		for (const [key, value] of Object.entries(newConfig)) {
			if (oldConfig[key] !== value) {
				if (plugins[key]?.enable || plugins[key]?.disable) {
					try {
						plugins[key][value ? "enable" : "disable"]?.();
					} catch (e) {
						logger.error("plugin error:", e);
					}
					logger.log(`plugin status change:`, key, value);

					if (plugins[key]?.options?.reloadOnToggle) {
						window.location.reload();
						return;
					}
				}
			}
		}

		Object.entries(plugins)
			.filter((p) => p[1].configUpdate)
			.map((p) => {
				try {
					if (p[1].configUpdate(oldConfig, newConfig)) {
						p[1][newConfig[p[0]] ? "enable" : "disable"]();
						logger.log(`plugin config update:`, p);
					}
				} catch (e) {
					logger.error("plugin error:", e);
				}
			});
	});

	setInterval(() => {
		// catch video player
		let player, controls, videoStream;
		if ((player = document.querySelector("ytd-player #movie_player"))) {
			if (player.getAttribute("yttweak") === "hooked") return;

			if ((controls = player.querySelector(".ytp-left-controls"))) {
				controls = controls.parentElement;

				if ((videoStream = player.querySelector(".video-stream"))) {
					player.isHookedYouTubeTweak = true;
					player.setAttribute("yttweak", "hooked");

					videoPlayer.player = player;
					videoPlayer.controls = controls;
					videoPlayer.videoStream = videoStream;

					Object.values(plugins)
						.filter((p) => p.initPlayer)
						.map((p) => {
							try {
								p.initPlayer();
							} catch (e) {
								logger.error("plugin error:", e);
							}
						});
				}
			}
		}

		// catch comments
		let queryComments;
		if ((queryComments = document.querySelectorAll("ytd-comments"))) {
			for (const commentEl of queryComments) {
				if (commentEl.getAttribute("yttweak") === "hooked") continue;
				commentEl.setAttribute("yttweak", "hooked");

				let commentUpdateListener = {};
				const commentWatcher = new MutationObserver((mutations) => {
					Object.values(commentUpdateListener).forEach((v) => v(mutations));
				});
				commentWatcher.observe(commentEl, {
					subtree: true,
					childList: true,
				});
				logger.debug("new comment:", commentEl);

				const commentParentWatcher = new MutationObserver((mutations) => {
					if (!document.body.contains(commentEl)) {
						logger.debug("comment removed:", commentEl);
						commentWatcher.disconnect();
						commentParentWatcher.disconnect();
						commentUpdateListener = {};
					}
				});
				commentWatcher.observe(commentEl.parentElement, {
					subtree: false,
					childList: true,
				});

				Object.entries(plugins)
					.filter((p) => p[1].initComments)
					.map((p) => {
						try {
							p[1].initComments(commentEl, (func) => {
								commentUpdateListener[p[0]] = func;
							});
						} catch (e) {
							logger.error("plugin error:", e);
						}
					});
			}
		}
	}, 300);

	window.__YT_TWEAK__ = {
		plugins,
		videoPlayer,
		metadata,
	};
	logger.debug(window.__YT_TWEAK__);
})();

window.addEventListener("message", (event) => {
	if (event.source !== window) return;
	if (event.data?.from === "YouTubeTweak-FetchHook") {
		switch (event.data.type) {
			case "player-v1":
				if (event.data.data?.videoDetails?.videoId === new URL(window.location)?.searchParams?.get("v")) {
					logger.debug("FetchHook - player metadata:", event.data.data);
					metadata.video = event.data.data;
				}
				break;
		}
	}
});

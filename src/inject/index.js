import config from "./config.js";
import logger from "../logger.js";

const plugins = Object.assign({}, ...Object.values(import.meta.glob("./plugins/*.js", { eager: true }).map((m) => m.default)));

export const videoPlayer = {
	box: null,
	player: null,
	controls: null,
	videoStream: null,
};

const commentUpdateListener = {};

function initVideoPlayer(player, volumePanel, volumeSlider) {
	logger.debug(`initVideoPlayer:`, player);
	for (const [key, func] of Object.entries(functionInit)) {
		logger.debug(`(video)functionInit:`, key);
		func("video", { player, volumePanel, volumeSlider });
	}
}

(async () => {
	await config.init();

	for (const [key, value] of Object.entries(config.get())) {
		if (value && plugins[key]?.enable) {
			logger.info(`plugin enable:`, key);
			plugins[key]?.enable();
		}
	}

	chrome.runtime.onMessage.addListener(async () => {
		logger.warn("config update");
		const oldConfig = config.get();
		const newConfig = await config.init();

		for (const [key, value] of Object.entries(newConfig)) {
			if (oldConfig[key] !== value) {
				if (plugins[key]?.enable || plugins[key]?.disable) {
					plugins[key][value ? "enable" : "disable"]?.();
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
				if (p[1].configUpdate(oldConfig, newConfig)) {
					p[1][newConfig[p[0]] ? "enable" : "disable"]();
					logger.log(`plugin config update:`, p);
				}
			});
	});
})();

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
					.map((p) => p.initPlayer());
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
				.map((p) =>
					p[1].initComments(commentEl, (func) => {
						logger.debug("comment update listener:", p[0], func);
						commentUpdateListener[p[0]] = func;
					}),
				);
		}
	}
}, 300);

window.__YT_TWEAK__ = {
	plugins,
	videoPlayer,
};
logger.debug(window.__YT_TWEAK__);

//
// setInterval(() => {
// 	if (
// 		(player = document.getElementsByClassName("video-stream")[0]) &&
// 		!player.isHookedYouTubeTweak &&
// 		(volumePanel = document.getElementsByClassName("ytp-volume-panel")[0]) &&
// 		(volumeSlider = document.getElementsByClassName("ytp-volume-slider-handle")[0])
// 	) {
// 		player.isHookedYouTubeTweak = true;
// 		initVideoPlayer(player, volumePanel, volumeSlider);
// 	}
// }, 300);

import config from "./config.js";

const plugins = Object.assign({}, ...Object.values(import.meta.glob("./plugins/*.js", { eager: true }).map((m) => m.default)));

export const videoPlayer = {
	box: null,
	player: null,
	controls: null,
	videoStream: null,
};

function initVideoPlayer(player, volumePanel, volumeSlider) {
	console.log(`[YTTweak] initVideoPlayer:`, player);
	for (const [key, func] of Object.entries(functionInit)) {
		console.log(`[YTTweak] (video)functionInit:`, key);
		func("video", { player, volumePanel, volumeSlider });
	}
}

(async () => {
	await config.init();

	for (const [key, value] of Object.entries(config.get())) {
		if (value && plugins[key]?.enable) {
			console.log(`[YTTweak] plugin enable:`, key);
			plugins[key]?.enable();
		}
	}

	chrome.runtime.onMessage.addListener(async () => {
		console.log("[YTTweak] config update");
		const oldConfig = config.get();
		const newConfig = await config.init();

		for (const [key, value] of Object.entries(newConfig)) {
			if (oldConfig[key] !== value) {
				if (plugins[key]?.enable || plugins[key]?.disable) {
					plugins[key][value ? "enable" : "disable"]();
					console.log(`[YTTweak] plugin status change:`, key, value);
				}
			}
		}

		Object.entries(plugins)
			.filter((p) => p[1].configUpdate)
			.map((p) => {
				if (p[1].configUpdate(oldConfig, newConfig)) {
					p[1][newConfig[p[0]] ? "enable" : "disable"]();
					console.log(`[YTTweak] plugin config update:`, p);
				}
			});
	});
})();

setInterval(() => {
	// catch video player
	let player, controls, videoStream;
	if ((player = document.querySelector("ytd-player #movie_player"))) {
		if (player.isHookedYouTubeTweak) return;

		if ((controls = player.querySelector(".ytp-left-controls"))) {
			controls = controls.parentElement;

			if ((videoStream = player.querySelector(".video-stream"))) {
				player.isHookedYouTubeTweak = true;

				videoPlayer.player = player;
				videoPlayer.controls = controls;
				videoPlayer.videoStream = videoStream;

				Object.values(plugins)
					.filter((p) => p.initPlayer)
					.map((p) => p.initPlayer());
			}
		}
	}
}, 300);

window.__YT_TWEAK__ = {
	plugins,
	videoPlayer,
};
console.log(window.__YT_TWEAK__);

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

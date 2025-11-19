import { bodyClass, secToMMDD } from "../util/helper";
import type { Plugin } from "../types";
import { videoPlayer } from "../mainWorld";

let progress: HTMLDivElement;
let progressPercent: HTMLDivElement;
let progressTag: HTMLDivElement;

let videoProgressTimer: number | null = null;
function registerVideoProgressTimer() {
	if (videoProgressTimer) {
		clearInterval(videoProgressTimer);
	}
	videoProgressTimer = window.setInterval(() => {
		if (videoPlayer?.player) {
			const duration = videoPlayer.videoStream?.duration || 0;
			const currentTime = videoPlayer.videoStream?.currentTime || 0;
			const percent = (currentTime / duration) * 100;
			if (progress) {
				progressPercent.style.width = `${percent}%`;
			}
			if (progressTag) {
				let t = document.querySelector("#movie_player .ytp-live")
					? `${secToMMDD(currentTime, currentTime > 3600)}`
					: `${secToMMDD(currentTime, duration > 3600)}/${secToMMDD(duration)}`;
				if (progressTag.innerText !== t) progressTag.innerText = t;
			}
		}
	}, 300);
}

export default {
	"player.ui.hideButton.autoplay": bodyClass("yttweak-hide-button-autoplay"),
	"player.ui.hideButton.subtitles": bodyClass("yttweak-hide-button-subtitles"),
	"player.ui.hideButton.settings": bodyClass("yttweak-hide-button-settings"),
	"player.ui.hideButton.miniPlayer": bodyClass("yttweak-hide-button-miniPlayer"),
	"player.ui.hideButton.pip": bodyClass("yttweak-hide-button-pip"),
	"player.ui.hideButton.size": bodyClass("yttweak-hide-button-size"),
	"player.ui.hideButton.remote": bodyClass("yttweak-hide-button-remote"),
	"player.ui.hideButton.fullscreen": bodyClass("yttweak-hide-button-fullscreen"),
	"player.ui.hideCeElement": bodyClass("yttweak-hide-ce_element"),
	"player.ui.progress.enable": {
		videoSrcChange() {
			registerVideoProgressTimer();
		},
		initPlayer() {
			if (!progress) {
				progress = document.createElement("div");
				progress.className = "yttweak-player-progress";

				progressPercent = document.createElement("div");
				progressPercent.className = "yttweak-player-progress-percent";
				progress.appendChild(progressPercent);

				videoPlayer.player?.appendChild(progress);
			}
		},
		enable() {
			document.body.classList.add("yttweak-player-progress-enable");
		},
		disable() {
			document.body.classList.remove("yttweak-player-progress-enable");
		},
	},
	"player.ui.progress.enableTag": {
		videoSrcChange() {
			registerVideoProgressTimer();
		},
		initPlayer() {
			if (!progressTag) {
				progressTag = document.createElement("div");
				progressTag.className = "yttweak-player-progress-tag";
				progressTag.innerText = "00:00/00:00";
				videoPlayer.player?.appendChild(progressTag);
			}
		},
		enable() {
			document.body.classList.add("yttweak-player-progress-enable-tag");
		},
		disable() {
			document.body.classList.remove("yttweak-player-progress-enable-tag");
		},
	},
} as Record<string, Plugin>;

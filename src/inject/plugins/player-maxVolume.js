import { videoPlayer } from "../isolatedWorld.js";
import config from "../config.js";
import { createLogger } from "../../logger.js";
const logger = createLogger("player-maxVolume");

let volumePanel = null;
let volumeSlider = null;
let oldVolume = null;

export default {
	"player.settings.maxVolume": {
		enable() {
			if (volumePanel && volumeSlider && videoPlayer) {
				if (parseInt(volumePanel.getAttribute("aria-valuenow")) === 100) {
					volumeSlider.style.backgroundColor = "red";
					oldVolume = videoPlayer.videoStream.volume;
					videoPlayer.videoStream.volume = 1;
				} else oldVolume = null;
			}
		},
		disable: () => {
			if (volumePanel && volumeSlider) {
				volumeSlider.style.backgroundColor = "white";
			}

			if (oldVolume) {
				videoPlayer.videoStream.volume = oldVolume;
				oldVolume = null;
			}
		},
		initPlayer() {
			volumeSlider = videoPlayer.controls.querySelector(".ytp-volume-slider-handle");
			volumePanel = videoPlayer.controls.querySelector(".ytp-volume-panel");
			if (!volumePanel || !volumeSlider) return;

			const volumeChange = () => {
				if (!config.get("player.settings.maxVolume")) return;

				if (parseInt(volumePanel.getAttribute("aria-valuenow")) === 100) {
					volumeSlider.style.backgroundColor = "red";
					if (videoPlayer.videoStream.volume !== 1) {
						logger.info(`Set Player Volume ${(videoPlayer.videoStream.volume * 100).toFixed(2)} -> 100%`);
						oldVolume = videoPlayer.videoStream.volume;
						videoPlayer.videoStream.volume = 1;
					}
				} else {
					volumeSlider.style.backgroundColor = "white";
					oldVolume = null;
				}
			};
			videoPlayer.videoStream.addEventListener("volumechange", volumeChange);
			volumeChange();
		},
	},
};

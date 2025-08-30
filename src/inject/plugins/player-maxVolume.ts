import { videoPlayer } from "../mainWorld";
import config from "../config";
import { createLogger } from "../../logger";

import type { Plugin } from "../types";

const logger = createLogger("player-maxVolume");

let volumePanel: null | HTMLElement = null;
let volumeSlider: null | HTMLElement = null;
let oldVolume: null | number = null;

export default {
	"player.settings.maxVolume": {
		enable() {
			if (volumePanel && volumeSlider && videoPlayer) {
				if (parseInt(volumePanel.getAttribute("aria-valuenow") || "0") === 100) {
					volumeSlider.style.backgroundColor = "red";
					if (videoPlayer.videoStream) {
						oldVolume = videoPlayer.videoStream.volume;
						videoPlayer.videoStream.volume = 1;
					}
				} else oldVolume = null;
			}
		},
		disable: () => {
			if (volumePanel && volumeSlider) {
				volumeSlider.style.backgroundColor = "white";
			}

			if (oldVolume) {
				if (videoPlayer.videoStream) videoPlayer.videoStream.volume = oldVolume;
				oldVolume = null;
			}
		},
		initPlayer() {
			volumeSlider = videoPlayer.controls?.querySelector(".ytp-volume-slider-handle") || null;
			volumePanel = videoPlayer.controls?.querySelector(".ytp-volume-panel") || null;
			if (!volumePanel || !volumeSlider) return;

			const volumeChange = () => {
				if (!config.get("player.settings.maxVolume")) return;

				if (volumeSlider) {
					if (volumePanel && parseInt(volumePanel.getAttribute("aria-valuenow") || "0") === 100) {
						volumeSlider.style.backgroundColor = "red";
						if (videoPlayer.videoStream && videoPlayer.videoStream.volume !== 1) {
							logger.info(`Set Player Volume ${(videoPlayer.videoStream.volume * 100).toFixed(2)} -> 100%`);
							oldVolume = videoPlayer.videoStream.volume;
							videoPlayer.videoStream.volume = 1;
						}
					} else {
						volumeSlider.style.backgroundColor = "white";
						oldVolume = null;
					}
				}
			};
			videoPlayer.videoStream?.addEventListener("volumechange", volumeChange);
			volumeChange();
		},
	},
} as Record<string, Plugin>;

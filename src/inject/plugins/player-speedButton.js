import config from "../config.js";
import { metadata, videoPlayer } from "../isolatedWorld.js";
import { createLogger } from "../../logger.js";
const logger = createLogger("player-speedButton");

const speedButtons = [];

function getChannelId() {
	return metadata.video?.microformat?.playerMicroformatRenderer?.ownerProfileUrl?.slice(23) || null;
}

function setMemorySpeed() {
	if (config.get("player.settings.saveSpeed")) {
		let speed;
		const channelId = getChannelId();
		if (channelId && (speed = config.get(`player.speed.${channelId}`, speed, true))) {
			logger.info(`Set playback rate(memory ${channelId}):`, speed);
		}
		if (!speed && (speed = config.get(`player.speed`, null, true))) {
			logger.info(`Set playback rate(memory default):`, speed);
		}
		if (!speed) return;
		speed = Number(speed);

		videoPlayer.playerApi.setPlaybackRate(speed);
		videoPlayer.videoStream.playbackRate = speed;
		speedButtons.forEach((v) => {
			if (v.getAttribute("speed") === String(speed)) {
				v.classList.add("yttweak-speed-button-active");
			} else {
				v.classList.remove("yttweak-speed-button-active");
			}
		});
	}
}

export default {
	"player.ui.enableSpeedButtons": {
		enable() {
			document.body.setAttribute("yttweak-enable-speed-button", config.get("player.ui.speedButtons").join(" "));
		},
		disable() {
			document.body.removeAttribute("yttweak-enable-speed-button");
		},
		initPlayer() {
			const speedButtonDiv = document.createElement("div");
			speedButtonDiv.className = "yttweak-speed-buttons";
			for (let speed of [0.25, 0.5, 1, 1.25, 1.5, 2, 3]) {
				const speedButton = document.createElement("span");
				speedButton.className = `yttweak-speed-button`;
				speedButton.setAttribute("speed", `${speed}`);
				speedButton.onclick = () => {
					videoPlayer.playerApi.setPlaybackRate(speed);
					videoPlayer.videoStream.playbackRate = speed;
					logger.info("Set playback rate:", speed);

					if (config.get("player.settings.saveSpeed")) {
						config.set("player.speed", speed, true);
						if (config.get("player.settings.saveSpeedByChannel")) {
							const channelId = getChannelId();
							if (channelId) {
								config.set(`player.speed.${channelId}`, speed, true);
							}
						}
					}

					speedButtons.forEach((v) => {
						v.classList.remove("yttweak-speed-button-active");
					});
					speedButton.classList.add("yttweak-speed-button-active");
				};
				speedButtons.push(speedButton);
				speedButtonDiv.appendChild(speedButton);
			}
			videoPlayer.controls.insertBefore(speedButtonDiv, videoPlayer.controls.querySelector(".ytp-left-controls").nextSibling);

			setMemorySpeed();
		},
		videoSrcChange(oldValue, newValue, isAD) {
			if (!isAD) {
				setMemorySpeed();
			}
		},
		configUpdate(oldConfig, newConfig) {
			return oldConfig["player.ui.speedButtons"].join(",") !== newConfig["player.ui.speedButtons"].join(",");
		},
	},
};

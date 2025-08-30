import config from "../config";
import { metadata, videoPlayer } from "../mainWorld";
import { createLogger } from "../../logger";
import { getChannelId } from "../util/helper";

import type { Plugin } from "../types";
import memory from "@/memory";

const logger = createLogger("player-speedButton");

const speedButtons: HTMLSpanElement[] = [];

async function setMemorySpeed() {
	let speed;
	const channelId = getChannelId();

	if (!channelId) {
		return;
	}

	if (config.get("player.settings.saveSpeedByChannel")) {
		if (channelId) {
			const memorySpeed = await memory.get(channelId, "s");
			if (memorySpeed) {
				speed = memorySpeed;
				logger.info(`Set playback rate(memory ${channelId}):`, speed);
			}
		}
	}

	if (!speed && config.get("player.settings.saveSpeed")) {
		const memorySpeed = await memory.get("", "s");
		if (memorySpeed) {
			speed = memorySpeed;
			logger.info(`Set playback rate(memory default):`, speed);
		}
	}
	if (!speed) return;
	speed = Number(speed);

	if (config.get("player.settings.saveSpeedByChannel")) {
		memory.set(channelId, "s", speed);
	}

	videoPlayer.player?.setPlaybackRate(speed);
	if (videoPlayer.videoStream) videoPlayer.videoStream.playbackRate = speed;
	speedButtons.forEach((v) => {
		if (v.getAttribute("speed") === String(speed)) {
			v.classList.add("yttweak-speed-button-active");
		} else {
			v.classList.remove("yttweak-speed-button-active");
		}
	});
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
					videoPlayer.player?.setPlaybackRate(speed);
					if (videoPlayer.videoStream) videoPlayer.videoStream.playbackRate = speed;
					logger.info("Set playback rate:", speed);

					if (config.get("player.settings.saveSpeed")) {
						memory.set("", "s", speed);
					}
					if (config.get("player.settings.saveSpeedByChannel")) {
						const channelId = getChannelId();
						if (channelId) {
							memory.set(channelId, "s", speed);
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
			if (videoPlayer.controls) {
				const left = videoPlayer.controls.querySelector(".ytp-left-controls")?.nextSibling;
				if (left) videoPlayer.controls.insertBefore(speedButtonDiv, left);
			}

			setMemorySpeed();
		},
		videoSrcChange(oldValue, newValue) {
			setMemorySpeed();
		},
		configUpdate(oldConfig, newConfig) {
			return oldConfig["player.ui.speedButtons"].join(",") !== newConfig["player.ui.speedButtons"].join(",");
		},
	},
} as Record<string, Plugin>;

import { createLogger } from "@/logger";
import memory from "@/memory";
import config from "../config";
import type { Plugin } from "../types";
import { videoPlayer } from "../mainWorld";
import { getChannelId } from "../util/helper";

const logger = createLogger("player-subtitle");
let setSubtitleTimeout: null | number = null;

async function setPlayerSubtitleStatus() {
	if (!config.get("player.settings.saveSubtitleStatusByChannel") || !config.get("player.settings.saveSubtitleStatus")) {
		return;
	}

	const channelId = getChannelId() || "";
	if (!channelId || !videoPlayer.player) {
		return;
	}

	let isOn = null;
	const memoryDefaultIsOn = !config.get("player.settings.saveSubtitleStatus") ? null : await memory.get("", "c");
	const memoryIsOn = !config.get("player.settings.saveSubtitleStatusByChannel") ? null : await memory.get(channelId, "c");

	if (memoryIsOn !== null) {
		isOn = memoryIsOn === "1";
		logger.info(`Set subtitle status (channel ${channelId}):`, isOn);
	} else if (memoryDefaultIsOn !== null) {
		isOn = memoryDefaultIsOn === "1";
		logger.info(`Set subtitle status (default):`, isOn);
	}

	if (isOn) {
		if (!videoPlayer.player.isSubtitlesOn()) videoPlayer.player.toggleSubtitlesOn();
	} else {
		if (videoPlayer.player.isSubtitlesOn()) videoPlayer.player.toggleSubtitles();
	}
}

export default {
	"player.settings.saveSubtitleStatusByChannel": {
		enable() {
			// setPlayerSubtitleStatus();
			// xmlHttpRequestHooker.init();
			// xmlHttpRequestHooker.addHook("subtitle", {
			// 	match: "/api/timedtext",
			// 	handler(result, url, responseClone) {
			// 		// logger.debug("Subtitle API called", url, result, responseClone);
			// 		setTimeout(() => {
			// 			setPlayerSubtitleStatus();
			// 		}, 300);
			// 	},
			// });
		},
		initPlayer() {
			const subtitlesButton = videoPlayer.player?.querySelector("button.ytp-subtitles-button");
			if (subtitlesButton) {
				// setPlayerSubtitleStatus();
				subtitlesButton.addEventListener("click", async () => {
					const channelId = getChannelId() || "";
					const isOn = !!videoPlayer.player?.isSubtitlesOn();
					if (config.get("player.settings.saveSubtitleStatusByChannel")) {
						logger.info(`Memory subtitle status: ${channelId} ->`, isOn);
						await memory.set(channelId, "c", isOn ? "1" : "0");
					}

					if (config.get("player.settings.saveSubtitleStatus")) {
						await memory.set("", "c", isOn ? "1" : "0");
					}
				});
			}
		},
		videoSrcChange() {
			if (setSubtitleTimeout) clearTimeout(setSubtitleTimeout);
			setSubtitleTimeout = window.setTimeout(() => {
				setPlayerSubtitleStatus();
			}, 300);
		},
	},
} as Record<string, Plugin>;

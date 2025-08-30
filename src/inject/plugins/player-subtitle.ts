import { createLogger } from "@/logger";
import memory from "@/memory";
import config from "../config";
import type { Plugin } from "../types";
import { videoPlayer } from "../mainWorld";
import { getChannelId } from "../util/helper";

const logger = createLogger("player-subtitle");

async function setPlayerSubtitleStatus() {
	if (!config.get("player.settings.saveSubtitleStatusByChannel") || !config.get("player.settings.saveSubtitleStatus")) {
		return;
	}

	const channelId = getChannelId() || "";

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
		videoPlayer.player?.toggleSubtitlesOn();
	} else {
		videoPlayer.player?.toggleSubtitlesOn();
		videoPlayer.player?.toggleSubtitles();
	}
}

export default {
	"player.settings.saveSubtitleStatusByChannel": {
		enable() {
			setPlayerSubtitleStatus();
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
				subtitlesButton.addEventListener("click", () => {
					const channelId = getChannelId() || "";
					const isOn = !!videoPlayer.player?.isSubtitlesOn();
					if (config.get("player.settings.saveSubtitleStatusByChannel")) {
						logger.info(`Memory subtitle status: ${channelId} ->`, isOn);
						memory.set(channelId, "c", isOn ? "1" : "0");
					}

					if (config.get("player.settings.saveSubtitleStatus")) {
						memory.set("", "c", isOn ? "1" : "0");
					}
				});
			}
		},
		videoSrcChange() {
			setPlayerSubtitleStatus();
		},
	},
} as Record<string, Plugin>;

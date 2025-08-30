import { createLogger } from "@/logger";
import type { Plugin } from "../types";
import { videoPlayer } from "../mainWorld";
import config from "../config";
import memory from "@/memory";
import { getChannelId } from "../util/helper";

const logger = createLogger("player-subtitle");

async function setPlayerSubtitleStatus() {
	if (!config.get("player.settings.saveSubtitleStatusByChannel")) {
		return;
	}
	logger.info("Setting player subtitle status");
	logger.debug(videoPlayer.player?.isSubtitlesOn());

	const channelId = getChannelId() || "";
	const memoryIsOn = (await memory.get(channelId, "c")) === "1";
	logger.info(`Set subtitle status: ${channelId} ->`, memoryIsOn);
	if (memoryIsOn) {
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
					if (!config.get("player.settings.saveSubtitleStatusByChannel")) return;

					const channelId = getChannelId() || "";
					const isOn = !!videoPlayer.player?.isSubtitlesOn();
					logger.info(`Memory subtitle status: ${channelId} ->`, isOn);
					memory.set(channelId, "c", isOn ? "1" : "0");
				});
			}
		},
		videoSrcChange() {
			setPlayerSubtitleStatus();
		},
	},
} as Record<string, Plugin>;

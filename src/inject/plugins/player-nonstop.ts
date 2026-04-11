import type { Plugin } from "../types";
import config from "../config";
import { videoPlayer } from "../mainWorld";

export default {
	"player.settings.nonStop": {
		initPlayer() {
			videoPlayer.videoStream?.addEventListener("pause", (evt) => {
				if (!evt.isTrusted && config.get("player.settings.nonStop")) {
					videoPlayer.videoStream?.play();
				}
			});

			document.addEventListener("yt-popup-opened", (evt) => {
				if (!config.get("player.settings.nonStop")) return;

				if (
					!["YTMUSIC-YOU-THERE-RENDERER", "YT-CONFIRM-DIALOG-RENDERER"].includes(
						(evt as CustomEvent<HTMLElement>)?.detail?.nodeName,
					)
				)
					return;

				document.querySelectorAll<HTMLElement>("ytmusic-popup-container, ytd-popup-container").forEach((el) => el.click());
			});
		},
	},
} as Record<string, Plugin>;

import memory from "@/memory";
import config from "../config";
import type { Plugin } from "../types";
import { videoPlayer } from "../mainWorld";
import { getChannelId } from "../util/helper";

let restoreTimer: number | undefined;
let revision = 0;

async function restoreSubtitleStatus() {
	const player = videoPlayer.player;
	const videoId = new URL(location.href).searchParams.get("v");
	const currentRevision = revision;
	if (!player || !videoId) return;
	const channelId = getChannelId();
	const globalStatus = config.get("player.settings.saveSubtitleStatus") ? await memory.get("", "c") : null;
	const channelStatus = config.get("player.settings.saveSubtitleStatusByChannel") && channelId ? await memory.get(channelId, "c") : null;
	if (currentRevision !== revision || videoPlayer.player !== player || player.getVideoData?.().video_id !== videoId) return;
	const status = channelStatus ?? globalStatus;
	if (status === "1" && !player.isSubtitlesOn()) player.toggleSubtitlesOn();
	if (status === "0" && player.isSubtitlesOn()) player.toggleSubtitles();
}

function rememberSubtitleToggle(event: Event) {
	if (!event.isTrusted) return;
	const player = videoPlayer.player;
	const videoId = new URL(location.href).searchParams.get("v");
	if (!player || !videoId || player.getVideoData?.().video_id !== videoId || player.classList.contains("ad-showing")) return;
	const channelId = getChannelId();
	const wasOn = player.isSubtitlesOn();
	window.clearTimeout(restoreTimer);
	revision++;
	window.setTimeout(() => {
		if (
			videoPlayer.player !== player ||
			new URL(location.href).searchParams.get("v") !== videoId ||
			player.getVideoData?.().video_id !== videoId
		)
			return;
		const isOn = player.isSubtitlesOn();
		if (wasOn === isOn) return;
		if (config.get("player.settings.saveSubtitleStatusByChannel") && channelId) void memory.set(channelId, "c", isOn ? "1" : "0");
		if (config.get("player.settings.saveSubtitleStatus")) void memory.set("", "c", isOn ? "1" : "0");
	}, 0);
}

export default {
	"player.settings.saveSubtitleStatusByChannel": {
		setup() {
			document.addEventListener("yt-navigate-start", () => {
				window.clearTimeout(restoreTimer);
				revision++;
			});
			document.addEventListener(
				"keydown",
				(event) => {
					if (event.key.toLowerCase() !== "c" || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
					if (
						!(event.target instanceof Element) ||
						event.target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']")
					)
						return;
					rememberSubtitleToggle(event);
				},
				true,
			);
			document.addEventListener(
				"click",
				(event) => {
					if (
						!(event.target instanceof Element) ||
						!event.target.closest(
							"#movie_player .ytp-subtitles-button, #movie_player .ytp-settings-menu [role='menuitemradio']",
						)
					)
						return;
					rememberSubtitleToggle(event);
				},
				true,
			);
		},
		videoSrcChange() {
			window.clearTimeout(restoreTimer);
			revision++;
			restoreTimer = window.setTimeout(restoreSubtitleStatus, 300);
		},
	},
} satisfies Record<string, Plugin>;

import wirelessRedstone from "../wirelessRedstone";
import config from "../config";
import { videoPlayer } from "../mainWorld";
import type { Plugin } from "../types";

type CaptionTrack = { languageCode: string; kind?: string; vss_id?: string; translationLanguage?: { languageCode?: string } };
let appliedVideoId = "";
let retryTimer: number | undefined;
let selectionRevision = 0;
let manualSelectionPending = false;

function captionIdentity(track?: CaptionTrack) {
	return track?.languageCode
		? JSON.stringify({
				languageCode: track.languageCode,
				kind: track.kind || "",
				vss_id: track.vss_id || "",
				translationLanguage: track.translationLanguage?.languageCode || "",
			})
		: "";
}

function normalizeLanguage(language: string) {
	return language
		.toLowerCase()
		.replace(/^zh-cn$/, "zh-hans")
		.replace(/^zh-tw$/, "zh-hant")
		.replace(/^iw(?=-|$)/, "he");
}

function selectPreferredSubtitle(reset = false) {
	if (manualSelectionPending) return;
	window.clearTimeout(retryTimer);
	const revision = ++selectionRevision;
	if (reset) appliedVideoId = "";
	const languages = config.get("player.settings.subtitleLanguages", []);
	if (!languages.length && !config.get("player.settings.saveSubtitleLanguageByVideo")) return;
	const videoId = new URL(location.href).searchParams.get("v");
	if (location.pathname !== "/watch" || !videoId || appliedVideoId === videoId) return;
	let attempts = 0;
	const saved = config.get("player.settings.saveSubtitleLanguageByVideo")
		? new Promise<string | null>((resolve) => wirelessRedstone.send("getVideoSubtitleMemory", videoId, resolve))
		: null;

	const apply = async () => {
		const savedValue = saved ? await saved : null;
		if (revision !== selectionRevision || new URL(location.href).searchParams.get("v") !== videoId) return;
		const player = videoPlayer.player;
		if (!player || typeof player.getOption !== "function" || typeof player.setOption !== "function") return;
		if (!player.isSubtitlesOn()) return;
		try {
			const tracks: CaptionTrack[] = player.getOption("captions", "tracklist", { includeAsr: true }) || [];
			if (player.classList.contains("ad-showing") || player.getVideoData?.().video_id !== videoId || !tracks.length) {
				if (++attempts < 40) retryTimer = window.setTimeout(apply, 250);
				return;
			}
			let preferred: CaptionTrack | undefined;
			if (savedValue) {
				try {
					const remembered = JSON.parse(decodeURIComponent(savedValue));
					preferred = tracks.find(
						(track) =>
							track.languageCode === remembered.languageCode &&
							(track.kind || "") === remembered.kind &&
							(!remembered.vss_id || track.vss_id === remembered.vss_id),
					);
					if (preferred && remembered.translationLanguage) {
						const translations: { languageCode: string }[] = player.getOption("captions", "translationLanguages") || [];
						const translationLanguage = translations.find(
							(language) => language.languageCode === remembered.translationLanguage,
						);
						preferred = translationLanguage ? { ...preferred, translationLanguage } : undefined;
					}
				} catch {
					/* Invalid or obsolete memory falls back to language priorities. */
				}
			}
			// Plain language IDs select authored captions; the :asr suffix selects speech recognition.
			for (const preference of preferred ? [] : languages) {
				const [language, kind] = preference.toLowerCase().split(":");
				const code = normalizeLanguage(language);
				const available = tracks.filter((track) => !track.translationLanguage && (track.kind === "asr") === (kind === "asr"));
				preferred =
					available.find((item) => normalizeLanguage(item.languageCode) === code) ||
					available.find((item) => normalizeLanguage(item.languageCode).startsWith(`${code}-`));
				if (preferred) break;
			}
			if (preferred) {
				player.setOption("captions", "track", preferred);
				const selected = player.getOption("captions", "track") as CaptionTrack | undefined;
				if (captionIdentity(selected) !== captionIdentity(preferred)) {
					if (++attempts < 40) retryTimer = window.setTimeout(apply, 250);
					return;
				}
			}
			appliedVideoId = videoId;
		} catch {
			if (++attempts < 40) retryTimer = window.setTimeout(apply, 250);
		}
	};
	// Let the existing subtitle on/off memory finish before selecting a track.
	retryTimer = window.setTimeout(apply, 450);
}

export default {
	"player.settings.subtitleLanguages": {
		setup() {
			document.addEventListener("yt-navigate-start", () => {
				window.clearTimeout(retryTimer);
				appliedVideoId = "";
				selectionRevision++;
				manualSelectionPending = false;
			});
			document.addEventListener("yt-navigate-finish", () => selectPreferredSubtitle());
			document.addEventListener(
				"click",
				(event) => {
					if (
						!event.isTrusted ||
						!(event.target instanceof Element) ||
						!event.target.closest("#movie_player .ytp-settings-menu [role='menuitemradio']")
					)
						return;
					const player = videoPlayer.player;
					const videoId = new URL(location.href).searchParams.get("v");
					if (!player || !videoId || player.getVideoData?.().video_id !== videoId || player.classList.contains("ad-showing"))
						return;
					const before = captionIdentity(player.getOption("captions", "track"));
					const revision = ++selectionRevision;
					manualSelectionPending = true;
					window.clearTimeout(retryTimer);
					window.setTimeout(() => {
						if (revision !== selectionRevision) return;
						manualSelectionPending = false;
						if (
							videoPlayer.player !== player ||
							new URL(location.href).searchParams.get("v") !== videoId ||
							player.getVideoData?.().video_id !== videoId
						)
							return;
						const after = captionIdentity(player.getOption("captions", "track"));
						if (after && after !== before && player.isSubtitlesOn()) {
							appliedVideoId = videoId;
							if (config.get("player.settings.saveSubtitleLanguageByVideo"))
								wirelessRedstone.send("setVideoSubtitleMemory", { videoId, value: encodeURIComponent(after) });
						} else selectPreferredSubtitle();
					}, 0);
				},
				true,
			);
		},
		initPlayer() {
			const player = videoPlayer.player;
			if (!player) return;
			player.addEventListener("onApiChange", () => selectPreferredSubtitle());
			new MutationObserver(() => selectPreferredSubtitle()).observe(player, {
				subtree: true,
				attributes: true,
				attributeFilter: ["aria-pressed"],
			});
		},
		videoSrcChange() {
			selectPreferredSubtitle();
		},
		configUpdate(oldConfig, newConfig) {
			if (
				JSON.stringify(oldConfig["player.settings.subtitleLanguages"]) !==
					JSON.stringify(newConfig["player.settings.subtitleLanguages"]) ||
				oldConfig["player.settings.saveSubtitleLanguageByVideo"] !== newConfig["player.settings.saveSubtitleLanguageByVideo"]
			) {
				selectPreferredSubtitle(true);
			}
			return false;
		},
	},
} satisfies Record<string, Plugin>;

import config from "../config";
import { metadata, videoPlayer } from "../mainWorld";
import { createLogger } from "../../logger";
import { secToMMDD, touchPlayer } from "../util/helper";
import {
	SHORTCUT_QUALITY_OPTIONS,
	captureShortcutFromEvent,
	normalizeShortcutValue,
	type KeyboardShortcutItem,
	type ShortcutAction,
} from "@/util/shortcuts";
import { applyPlaybackSpeed, getCurrentPlaybackSpeed, stepPlaybackSpeed } from "./player-speedButton";
import { adjustVolumeBooster, toggleVolumeBooster } from "./player-volumeBooster";
import { captureVideoScreenshot, resetVideoRotationAndMirror, rotateVideo, toggleMirrorVideo } from "./player-function-buttons";
import { toggleInPageFullscreen } from "./player-inPageFullscreen";
import { adjustVideoZoom, resetVideoZoom } from "./player-videoZoom";
import { toggleSubtitlesWithMemory } from "./player-subtitle";
import { cycleSubtitleTrack } from "./player-subtitle-language";
import { dismissScrollingMiniPlayer } from "./player-miniPlayer";

import type { Plugin } from "../types";

const logger = createLogger("other-shortcuts");

const HIDE_CONTROLS_CLASS = "yttweak-shortcuts-hide-controls";
const OSD_HIDE_DELAY_MS = 900;
const QUALITY_ORDER = ["highres", "hd2160", "hd1440", "hd1080", "hd720", "large", "medium", "small", "tiny"] as const;

const REPEATABLE_ACTIONS = new Set<ShortcutAction>([
	"speed.up",
	"speed.down",
	"playback.seekForward",
	"playback.seekBackward",
	"playback.frameNext",
	"playback.framePrev",
	"audio.volumeUp",
	"audio.volumeDown",
	"audio.boosterUp",
	"audio.boosterDown",
	"view.zoomIn",
	"view.zoomOut",
]);

const PAGE_ACTIONS = new Set<ShortcutAction>([
	"page.copyUrl",
	"page.copyUrlWithTime",
	"page.toggleComments",
	"page.openThumbnail",
]);

let listenersBound = false;
let shortcutMap = new Map<string, KeyboardShortcutItem>();
let previousSpeedBeforeToggle: number | null = null;
let activeHold: {
	mainCode: string;
	restoreSpeed: number;
	targetSpeed: number;
} | null = null;

let osdElement: HTMLDivElement | null = null;
let osdTimer: ReturnType<typeof setTimeout> | undefined;
let osdPopoverHideTimer: ReturnType<typeof setTimeout> | undefined;

function nearlyEqual(a: number, b: number) {
	return Math.abs(a - b) < 0.001;
}

function formatNumber(value: number) {
	return String(Number(value.toFixed(2)));
}

function formatQualityLabel(quality: string) {
	if (quality === "auto") return "Auto";
	const option = SHORTCUT_QUALITY_OPTIONS.find((item) => item.value === quality);
	return option ? option.label.replace(/\s*\(.*?\)/, "") : quality;
}

function rebuildShortcutMap() {
	const nextMap = new Map<string, KeyboardShortcutItem>();
	const items = config.get("other.shortcuts.items", []);
	if (Array.isArray(items)) {
		for (const item of items) {
			if (!item || !item.enabled || !item.key || nextMap.has(item.key)) continue;
			nextMap.set(item.key, item);
		}
	}
	shortcutMap = nextMap;
}

function showOsd(text: string, options: { tag?: string; sticky?: boolean } = {}) {
	if (!text) return;

	if (!osdElement) {
		osdElement = document.createElement("div");
		osdElement.className = "yttweak-shortcut-osd";
		osdElement.setAttribute("role", "status");
		osdElement.setAttribute("aria-live", "polite");
		if ("popover" in osdElement) {
			osdElement.setAttribute("popover", "manual");
		}
	}

	const host = document.fullscreenElement || document.documentElement || document.body;
	if (!host) return;
	if (osdElement.parentElement !== host || host.lastElementChild !== osdElement) {
		host.appendChild(osdElement);
	}

	if (osdPopoverHideTimer) {
		clearTimeout(osdPopoverHideTimer);
		osdPopoverHideTimer = undefined;
	}

	try {
		if (typeof osdElement.showPopover === "function" && !osdElement.matches(":popover-open")) {
			osdElement.showPopover();
		}
	} catch {}

	osdElement.replaceChildren();

	if (options.tag) {
		const tagEl = document.createElement("span");
		tagEl.className = "yttweak-shortcut-osd-tag";
		tagEl.textContent = options.tag;
		osdElement.appendChild(tagEl);
	}

	const textEl = document.createElement("span");
	textEl.className = "yttweak-shortcut-osd-text";
	textEl.textContent = text;
	osdElement.appendChild(textEl);

	void osdElement.offsetWidth;
	osdElement.classList.add("yttweak-shortcut-osd-visible");

	if (osdTimer) clearTimeout(osdTimer);
	osdTimer = undefined;

	if (!options.sticky) {
		osdTimer = setTimeout(() => {
			hideOsd();
		}, OSD_HIDE_DELAY_MS);
	}
}

function hideOsd() {
	if (osdTimer) clearTimeout(osdTimer);
	osdTimer = undefined;
	if (!osdElement) return;
	osdElement.classList.remove("yttweak-shortcut-osd-visible");

	if (osdPopoverHideTimer) clearTimeout(osdPopoverHideTimer);
	osdPopoverHideTimer = setTimeout(() => {
		osdPopoverHideTimer = undefined;
		try {
			if (osdElement && typeof osdElement.hidePopover === "function" && osdElement.matches(":popover-open")) {
				osdElement.hidePopover();
			}
		} catch {}
	}, 180);
}

function isEditableTarget(event: KeyboardEvent) {
	if (event.isComposing || event.keyCode === 229) return true;
	const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
	for (const node of path) {
		if (!(node instanceof Element)) continue;
		const tag = node.tagName;
		if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
		if (node instanceof HTMLElement && node.isContentEditable) return true;
		const role = node.getAttribute("role");
		if (role === "textbox" || role === "searchbox" || role === "combobox") return true;
	}
	return false;
}

function hasActivePlayer() {
	return Boolean(videoPlayer.player?.isConnected && videoPlayer.videoStream?.isConnected);
}

function detectVideoFps() {
	const video = videoPlayer.videoStream;
	const videoId = new URL(location.href).searchParams.get("v");
	const formats = [
		...(metadata.video?.videoDetails?.videoId === videoId ? metadata.video?.streamingData?.adaptiveFormats || [] : []),
		...(metadata.video?.videoDetails?.videoId === videoId ? metadata.video?.streamingData?.formats || [] : []),
	];
	const currentFmt = Number(videoPlayer.player?.getVideoStats?.()?.fmt);
	const matchedFormat = formats.find((format: any) => Number(format?.itag) === currentFmt && Number(format?.fps) > 0);
	if (matchedFormat) return Number(matchedFormat.fps);

	if (video?.videoHeight && formats.length) {
		const sameHeight = formats.find((format: any) => Number(format?.height) === video.videoHeight && Number(format?.fps) > 0);
		if (sameHeight) return Number(sameHeight.fps);
	}
	return 30;
}

function seekVideoBy(deltaSeconds: number) {
	const video = videoPlayer.videoStream;
	const player = videoPlayer.player;
	if (!video || !player) return;

	const rawDuration = Number(player.getDuration?.() ?? video.duration);
	const duration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : Number.POSITIVE_INFINITY;
	const currentTime = Number(player.getCurrentTime?.() ?? video.currentTime) || 0;
	const target = Math.min(Math.max(currentTime + deltaSeconds, 0), duration);

	if (typeof player.seekTo === "function") {
		player.seekTo(target, true);
	} else {
		video.currentTime = target;
	}

	const sign = deltaSeconds >= 0 ? "+" : "-";
	showOsd(`${sign}${Math.abs(deltaSeconds)}s (${secToMMDD(Math.floor(target))})`);
}

function stepVideoFrame(direction: 1 | -1) {
	const video = videoPlayer.videoStream;
	const player = videoPlayer.player;
	if (!video || !player) return;

	if (!video.paused) {
		player.pauseVideo?.();
		if (!video.paused) video.pause();
	}

	const fps = detectVideoFps();
	const frameStep = 1 / fps;
	const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : Number.POSITIVE_INFINITY;
	const nextTime = Math.min(Math.max(video.currentTime + direction * frameStep, 0), duration);
	video.currentTime = nextTime;
	showOsd(direction > 0 ? "+1f" : "-1f");
}

function setPlayerVolume(targetVolume: number) {
	const player = videoPlayer.player;
	const video = videoPlayer.videoStream;
	if (!player || !video) return;

	const clamped = Math.round(Math.min(Math.max(targetVolume, 0), 100));
	if (clamped > 0 && player.isMuted?.()) {
		player.unMute?.();
	}
	if (typeof player.setVolume === "function") {
		player.setVolume(clamped);
	} else {
		video.volume = clamped / 100;
		if (clamped > 0) video.muted = false;
	}
	showOsd(`${clamped}%`, { tag: "VOL" });
}

function applyQuality(targetQuality: string) {
	const player = videoPlayer.player;
	if (!player) return;

	if (targetQuality === "auto") {
		player.setPlaybackQualityRange?.("auto");
		player.setPlaybackQuality?.("auto");
		showOsd("Auto", { tag: "HD" });
		return;
	}

	const available = (player.getAvailableQualityLevels?.() || []).filter((level) => level !== "auto");
	if (!available.length) return;

	const startIndex = QUALITY_ORDER.indexOf(targetQuality as (typeof QUALITY_ORDER)[number]);
	const resolved =
		(startIndex >= 0 ? QUALITY_ORDER.slice(startIndex).find((q) => available.includes(q)) : null) ||
		available[available.length - 1];

	if (!resolved) return;
	player.setPlaybackQuality?.(resolved);
	player.setPlaybackQualityRange?.(resolved);
	showOsd(formatQualityLabel(resolved), { tag: "HD" });
}

function stepQuality(direction: 1 | -1) {
	const player = videoPlayer.player;
	if (!player) return;

	const available = player.getAvailableQualityLevels?.() || [];
	const ordered = QUALITY_ORDER.filter((level) => available.includes(level));
	if (!ordered.length) return;

	const current = String(player.getPlaybackQuality?.() || "");
	const currentIndex = ordered.indexOf(current as (typeof QUALITY_ORDER)[number]);
	const nextIndex =
		currentIndex === -1 ? 0 : Math.min(Math.max(currentIndex - direction, 0), ordered.length - 1);
	const target = ordered[nextIndex];
	player.setPlaybackQuality?.(target);
	player.setPlaybackQualityRange?.(target);
	showOsd(formatQualityLabel(target), { tag: "HD" });
}

async function copyText(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		try {
			const textarea = document.createElement("textarea");
			textarea.value = text;
			textarea.style.position = "fixed";
			textarea.style.opacity = "0";
			document.body.appendChild(textarea);
			textarea.select();
			const ok = document.execCommand("copy");
			textarea.remove();
			return ok;
		} catch {
			return false;
		}
	}
}

async function copyCurrentVideoUrl(withTimestamp: boolean) {
	const url = new URL(location.href);
	const videoId = url.searchParams.get("v");
	let targetUrl = location.href;

	if (url.pathname === "/watch" && videoId) {
		const cleanUrl = new URL("https://www.youtube.com/watch");
		cleanUrl.searchParams.set("v", videoId);
		if (withTimestamp && videoPlayer.videoStream) {
			const seconds = Math.max(0, Math.floor(videoPlayer.videoStream.currentTime || 0));
			if (seconds > 0) cleanUrl.searchParams.set("t", `${seconds}s`);
		}
		targetUrl = cleanUrl.toString();
	}

	const ok = await copyText(targetUrl);
	if (ok) {
		const timeLabel =
			withTimestamp && videoPlayer.videoStream
				? ` @ ${secToMMDD(Math.max(0, Math.floor(videoPlayer.videoStream.currentTime || 0)))}`
				: "";
		showOsd(`URL${timeLabel}`, { tag: "COPY" });
	}
}

function toggleCommentsScroll() {
	if (window.scrollY > 220) {
		dismissScrollingMiniPlayer(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
		showOsd("↑ Top");
		return;
	}

	const comments = document.querySelector<HTMLElement>("ytd-comments#comments, #comments");
	if (comments) {
		const mastheadHeight = document.querySelector<HTMLElement>("#masthead-container")?.getBoundingClientRect().height || 56;
		const targetTop = Math.max(0, window.scrollY + comments.getBoundingClientRect().top - mastheadHeight - 12);
		window.scrollTo({ top: targetTop, behavior: "smooth" });
		showOsd("↓ Comments");
	}
}

function openVideoThumbnail() {
	const url = new URL(location.href);
	const videoId = url.searchParams.get("v") || videoPlayer.player?.getVideoData?.()?.video_id;
	if (!videoId) return;

	const response = [videoPlayer.player?.getPlayerResponse?.(), metadata.video].find(
		(candidate) => candidate?.videoDetails?.videoId === videoId,
	);
	const thumbnails: Array<{ url?: string; width?: number; height?: number }> =
		response?.videoDetails?.thumbnail?.thumbnails || [];
	const largest = [...thumbnails]
		.filter((thumb) => typeof thumb?.url === "string")
		.sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0))[0];

	const targetUrl = largest?.url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
	window.open(targetUrl, "_blank", "noopener,noreferrer");
}

function releaseActiveHold(silent = false) {
	if (!activeHold) return;
	const { restoreSpeed } = activeHold;
	activeHold = null;

	if (hasActivePlayer()) {
		void applyPlaybackSpeed(restoreSpeed, { persist: false });
		if (!silent) showOsd(`${formatNumber(restoreSpeed)}×`);
		else hideOsd();
	} else {
		hideOsd();
	}
}

async function executeShortcut(item: KeyboardShortcutItem, event: KeyboardEvent) {
	const player = videoPlayer.player;
	const video = videoPlayer.videoStream;
	const value = normalizeShortcutValue(item.action, item.value);

	switch (item.action) {
		case "speed.up": {
			const nextSpeed = await stepPlaybackSpeed(1, (value as number | "buttons") ?? 0.25);
			showOsd(`${formatNumber(nextSpeed)}×`);
			return;
		}
		case "speed.down": {
			const nextSpeed = await stepPlaybackSpeed(-1, (value as number | "buttons") ?? 0.25);
			showOsd(`${formatNumber(nextSpeed)}×`);
			return;
		}
		case "speed.toggle": {
			const targetSpeed = Number(value ?? 2);
			const currentSpeed = getCurrentPlaybackSpeed();
			let nextSpeed: number;
			if (nearlyEqual(currentSpeed, targetSpeed)) {
				nextSpeed =
					previousSpeedBeforeToggle && !nearlyEqual(previousSpeedBeforeToggle, targetSpeed) ? previousSpeedBeforeToggle : 1;
			} else {
				previousSpeedBeforeToggle = currentSpeed;
				nextSpeed = targetSpeed;
			}
			const applied = await applyPlaybackSpeed(nextSpeed, { persist: true });
			showOsd(`${formatNumber(applied)}×`);
			return;
		}
		case "speed.set": {
			const targetSpeed = Number(value ?? 1);
			const currentSpeed = getCurrentPlaybackSpeed();
			if (!nearlyEqual(currentSpeed, targetSpeed)) {
				previousSpeedBeforeToggle = currentSpeed;
			}
			const applied = await applyPlaybackSpeed(targetSpeed, { persist: true });
			showOsd(`${formatNumber(applied)}×`);
			return;
		}
		case "speed.hold": {
			if (activeHold) return;
			const targetSpeed = Number(value ?? 2);
			const restoreSpeed = getCurrentPlaybackSpeed();
			activeHold = { mainCode: event.code, restoreSpeed, targetSpeed };
			const applied = await applyPlaybackSpeed(targetSpeed, { persist: false });
			showOsd(`${formatNumber(applied)}×`, { tag: "HOLD", sticky: true });
			return;
		}

		case "playback.togglePlay": {
			if (!video || !player) return;
			if (video.paused) {
				if (typeof player.playVideo === "function") player.playVideo();
				else void video.play();
				showOsd("▶");
			} else {
				if (typeof player.pauseVideo === "function") player.pauseVideo();
				else video.pause();
				showOsd("⏸");
			}
			return;
		}
		case "playback.seekForward":
			seekVideoBy(Number(value ?? 5));
			return;
		case "playback.seekBackward":
			seekVideoBy(-Number(value ?? 5));
			return;
		case "playback.frameNext":
			stepVideoFrame(1);
			return;
		case "playback.framePrev":
			stepVideoFrame(-1);
			return;
		case "playback.restart": {
			if (!video || !player) return;
			if (typeof player.seekTo === "function") player.seekTo(0, true);
			else video.currentTime = 0;
			if (video.ended) player.playVideo?.();
			showOsd("00:00");
			return;
		}
		case "playback.toggleLoop": {
			if (!video) return;
			video.loop = !video.loop;
			showOsd(video.loop ? "ON" : "OFF", { tag: "LOOP" });
			return;
		}
		case "playback.jumpToLive": {
			if (!player || !video) return;
			const liveButton = player.querySelector<HTMLButtonElement>(".ytp-live-badge:not([disabled])");
			if (liveButton) {
				liveButton.click();
			} else {
				const duration = Number(player.getDuration?.() ?? video.duration);
				if (Number.isFinite(duration) && duration > 0) {
					if (typeof player.seekTo === "function") player.seekTo(duration, true);
					else video.currentTime = duration;
				}
			}
			showOsd("LIVE");
			return;
		}
		case "playback.prevVideo": {
			if (!player) return;
			const prevBtn = player.querySelector<HTMLElement>(".ytp-prev-button");
			if (prevBtn && getComputedStyle(prevBtn).display !== "none") prevBtn.click();
			else player.previousVideo?.();
			return;
		}
		case "playback.nextVideo": {
			if (!player) return;
			const nextBtn = player.querySelector<HTMLElement>(".ytp-next-button");
			if (nextBtn && getComputedStyle(nextBtn).display !== "none") nextBtn.click();
			else player.nextVideo?.();
			return;
		}

		case "audio.toggleMute": {
			if (!player || !video) return;
			const muted = typeof player.isMuted === "function" ? player.isMuted() : video.muted;
			if (muted) {
				player.unMute ? player.unMute() : (video.muted = false);
				const volume = Math.round(typeof player.getVolume === "function" ? player.getVolume() : video.volume * 100);
				showOsd(`${volume}%`, { tag: "VOL" });
			} else {
				player.mute ? player.mute() : (video.muted = true);
				showOsd("MUTE", { tag: "VOL" });
			}
			return;
		}
		case "audio.volumeUp": {
			if (!player || !video) return;
			const current = typeof player.getVolume === "function" ? player.getVolume() : video.volume * 100;
			setPlayerVolume(current + Number(value ?? 5));
			return;
		}
		case "audio.volumeDown": {
			if (!player || !video) return;
			const current = typeof player.getVolume === "function" ? player.getVolume() : video.volume * 100;
			setPlayerVolume(current - Number(value ?? 5));
			return;
		}
		case "audio.setVolume":
			setPlayerVolume(Number(value ?? 100));
			return;
		case "audio.boosterToggle": {
			const result = await toggleVolumeBooster();
			showOsd(result.enabled ? `${formatNumber(result.multiplier)}×` : "OFF", { tag: "BOOST" });
			return;
		}
		case "audio.boosterUp": {
			const result = adjustVolumeBooster(1);
			showOsd(result.enabled ? `${formatNumber(result.multiplier)}×` : "OFF", { tag: "BOOST" });
			return;
		}
		case "audio.boosterDown": {
			const result = adjustVolumeBooster(-1);
			showOsd(result.enabled ? `${formatNumber(result.multiplier)}×` : "OFF", { tag: "BOOST" });
			return;
		}

		case "view.toggleInPageFullscreen": {
			const active = toggleInPageFullscreen();
			if (active !== null) showOsd(active ? "ON" : "OFF", { tag: "WEB FULL" });
			return;
		}
		case "view.toggleFullscreen": {
			if (!player) return;
			const fullscreenButton = player.querySelector<HTMLButtonElement>(".ytp-fullscreen-button");
			if (fullscreenButton) {
				fullscreenButton.click();
			} else if (document.fullscreenElement) {
				void document.exitFullscreen().catch(() => {});
			} else {
				void player.requestFullscreen?.().catch(() => {});
			}
			return;
		}
		case "view.toggleTheater": {
			const sizeButton = document.querySelector<HTMLButtonElement>("ytd-watch-flexy:not([hidden]) #movie_player .ytp-size-button");
			sizeButton?.click();
			return;
		}
		case "view.togglePip": {
			if (!video) return;
			try {
				if (document.pictureInPictureElement) {
					await document.exitPictureInPicture();
					showOsd("OFF", { tag: "PiP" });
				} else if (typeof video.requestPictureInPicture === "function") {
					await video.requestPictureInPicture();
					showOsd("ON", { tag: "PiP" });
				}
			} catch (error) {
				logger.warn("Picture-in-picture toggle failed:", error);
			}
			return;
		}
		case "view.toggleMiniPlayer": {
			if (dismissScrollingMiniPlayer()) return;
			const miniBtn = player?.querySelector<HTMLButtonElement>(".ytp-miniplayer-button");
			miniBtn?.click();
			return;
		}
		case "view.rotateCW": {
			const angle = rotateVideo(90);
			showOsd(`${angle}°`, { tag: "ROTATE" });
			return;
		}
		case "view.rotateCCW": {
			const angle = rotateVideo(-90);
			showOsd(`${angle}°`, { tag: "ROTATE" });
			return;
		}
		case "view.toggleMirror": {
			const mirrored = toggleMirrorVideo();
			showOsd(mirrored ? "ON" : "OFF", { tag: "MIRROR" });
			return;
		}
		case "view.zoomIn": {
			const zoom = adjustVideoZoom(1, 0.25);
			showOsd(`${formatNumber(zoom)}×`, { tag: "ZOOM" });
			return;
		}
		case "view.zoomOut": {
			const zoom = adjustVideoZoom(-1, 0.25);
			showOsd(`${formatNumber(zoom)}×`, { tag: "ZOOM" });
			return;
		}
		case "view.zoomReset": {
			const zoom = resetVideoZoom();
			showOsd(`${formatNumber(zoom)}×`, { tag: "ZOOM" });
			return;
		}
		case "view.resetTransform": {
			resetVideoRotationAndMirror();
			resetVideoZoom();
			showOsd("RESET");
			return;
		}
		case "view.screenshot": {
			const captured = captureVideoScreenshot();
			if (captured) showOsd("OK", { tag: "SHOT" });
			return;
		}
		case "view.toggleControls": {
			if (!player) return;
			const hidden = player.classList.toggle(HIDE_CONTROLS_CLASS);
			if (!hidden) touchPlayer();
			showOsd(hidden ? "HIDDEN" : "SHOWN", { tag: "UI" });
			return;
		}

		case "subtitle.toggle": {
			const isOn = toggleSubtitlesWithMemory();
			if (isOn !== null) showOsd(isOn ? "ON" : "OFF", { tag: "CC" });
			return;
		}
		case "subtitle.cycleTrack": {
			const result = cycleSubtitleTrack();
			if (!result) return;
			showOsd(result.hasTracks ? result.label : "NONE", { tag: "CC" });
			return;
		}

		case "quality.set":
			applyQuality(String(value ?? "hd1080"));
			return;
		case "quality.up":
			stepQuality(1);
			return;
		case "quality.down":
			stepQuality(-1);
			return;

		case "page.copyUrl":
			await copyCurrentVideoUrl(false);
			return;
		case "page.copyUrlWithTime":
			await copyCurrentVideoUrl(true);
			return;
		case "page.toggleComments":
			toggleCommentsScroll();
			return;
		case "page.openThumbnail":
			openVideoThumbnail();
			return;
		default: {
			const exhaustiveCheck: never = item.action;
			return exhaustiveCheck;
		}
	}
}

function handleKeyDown(event: KeyboardEvent) {
	if (!config.get("other.shortcuts.enable") || !shortcutMap.size) return;
	if (isEditableTarget(event)) return;

	const shortcutKey = captureShortcutFromEvent(event);
	if (!shortcutKey) return;

	const matched = shortcutMap.get(shortcutKey);
	if (!matched) return;

	if (!PAGE_ACTIONS.has(matched.action) && !hasActivePlayer()) return;

	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();

	if (event.repeat && !REPEATABLE_ACTIONS.has(matched.action)) return;

	void executeShortcut(matched, event).catch((error) => {
		logger.error("Failed to execute shortcut:", matched.action, error);
	});
}

function handleKeyUp(event: KeyboardEvent) {
	if (!activeHold) return;
	if (event.code === activeHold.mainCode) {
		releaseActiveHold(false);
	}
}

function bindListeners() {
	if (listenersBound) return;
	listenersBound = true;

	window.addEventListener("keydown", handleKeyDown, true);
	window.addEventListener("keyup", handleKeyUp, true);
	window.addEventListener("blur", () => releaseActiveHold(true));
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) releaseActiveHold(true);
	});
	document.addEventListener("yt-navigate-start", () => {
		releaseActiveHold(true);
		previousSpeedBeforeToggle = null;
		videoPlayer.player?.classList.remove(HIDE_CONTROLS_CLASS);
	});
}

export default {
	"other.shortcuts.enable": {
		setup() {
			rebuildShortcutMap();
			bindListeners();
		},
		enable() {
			rebuildShortcutMap();
			bindListeners();
		},
		disable() {
			releaseActiveHold(true);
			videoPlayer.player?.classList.remove(HIDE_CONTROLS_CLASS);
			hideOsd();
		},
		videoSrcChange() {
			releaseActiveHold(true);
			previousSpeedBeforeToggle = null;
			videoPlayer.player?.classList.remove(HIDE_CONTROLS_CLASS);
		},
		configUpdate(oldConfig, newConfig) {
			if (
				oldConfig?.["other.shortcuts.enable"] !== newConfig?.["other.shortcuts.enable"] ||
				JSON.stringify(oldConfig?.["other.shortcuts.items"]) !== JSON.stringify(newConfig?.["other.shortcuts.items"])
			) {
				releaseActiveHold(true);
				rebuildShortcutMap();
			}
			return false;
		},
	},
} as Record<string, Plugin>;

import config from "../config";
import { videoPlayer } from "../mainWorld";

import type { Plugin } from "../types";

type MiniPlayerPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

const DEFAULT_SIZE = "480x270";
const DEFAULT_OFFSET = 16;
const DEFAULT_TRIGGER = 48;
const DEFAULT_ASPECT_RATIO = 16 / 9;
const BODY_MODE_CLASS = "yttweak-mini-player-mode";
const BODY_POSITION_PREFIX = "yttweak-mini-player-position-";

let isMiniPlayerActive = false;
let isMiniPlayerDismissed = false;
let currentPlaceholder: HTMLDivElement | null = null;
let currentPinnedPlayer: HTMLDivElement | null = null;
let closeButton: HTMLButtonElement | null = null;
let miniPlayerStyle: HTMLStyleElement | null = null;
let updateFrame = 0;
let globalListenersBound = false;
let anchorBottomScrollY: number | null = null;
let lastLayoutSignature = "";
let originalPlayerParent: HTMLElement | null = null;
let originalPlayerNextSibling: ChildNode | null = null;

function createSvgElement(tagName: string) {
	return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function createCloseIcon() {
	const svg = createSvgElement("svg");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("focusable", "false");

	const path = createSvgElement("path");
	path.setAttribute("d", "M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z");
	svg.appendChild(path);

	return svg;
}

function clampOffset(value: number) {
	if (!Number.isFinite(value)) {
		return DEFAULT_OFFSET;
	}
	return Math.max(0, Math.min(value, 96));
}

function clampTrigger(value: number) {
	if (!Number.isFinite(value)) {
		return DEFAULT_TRIGGER;
	}
	return Math.max(0, Math.min(value, 400));
}

function parseSizePreset(sizePreset: string) {
	const [width, height] = sizePreset.split("x").map((value) => Number(value));
	if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
		return parseSizePreset(DEFAULT_SIZE);
	}

	return { width, height };
}

function getMiniPlayerAspectRatio() {
	const video = videoPlayer.videoStream;
	if (video?.videoWidth && video.videoHeight) {
		return video.videoWidth / video.videoHeight;
	}

	const playerAspectRatio = videoPlayer.player?.getVideoAspectRatio?.();
	if (typeof playerAspectRatio === "number" && Number.isFinite(playerAspectRatio) && playerAspectRatio > 0) {
		return playerAspectRatio;
	}

	return DEFAULT_ASPECT_RATIO;
}

function getActivationScrollY() {
	if (isMiniPlayerActive && anchorBottomScrollY !== null) {
		return anchorBottomScrollY + clampTrigger(Number(config.get("player.miniPlayer.triggerOffset", DEFAULT_TRIGGER)));
	}

	const anchor = videoPlayer.player;
	if (!anchor) {
		return Number.POSITIVE_INFINITY;
	}
	const anchorRect = anchor.getBoundingClientRect();
	return window.scrollY + anchorRect.bottom + clampTrigger(Number(config.get("player.miniPlayer.triggerOffset", DEFAULT_TRIGGER)));
}

function isWatchPage() {
	const { pathname, searchParams } = new URL(window.location.href);
	return pathname === "/watch" && searchParams.has("v");
}

function isEligibleToFloat() {
	const player = videoPlayer.player;
	const video = videoPlayer.videoStream;

	if (!config.get("player.miniPlayer.enable")) {
		return false;
	}
	if (!player || !video || !isWatchPage()) {
		return false;
	}
	if (player.classList.contains("ytp-fullscreen") || document.pictureInPictureElement === video) {
		return false;
	}
	if (video.ended || player.classList.contains("ended-mode")) {
		return false;
	}

	return true;
}

function clearPlayerLayout(player: HTMLDivElement | null) {
	if (!player) {
		return;
	}

	player.classList.remove("yttweak-mini-player-active");
	player.removeAttribute("data-yttweak-mini-player-density");
	player.style.removeProperty("--yttweak-mini-player-width");
	player.style.removeProperty("--yttweak-mini-player-height");
	player.style.removeProperty("--yttweak-mini-player-left");
	player.style.removeProperty("--yttweak-mini-player-right");
	player.style.removeProperty("--yttweak-mini-player-top");
	player.style.removeProperty("--yttweak-mini-player-bottom");
}

function clearBodyClasses() {
	document.body.classList.remove(BODY_MODE_CLASS);
	for (const position of ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]) {
		document.body.classList.remove(`${BODY_POSITION_PREFIX}${position}`);
	}
}

function applyBodyClasses(position: MiniPlayerPosition) {
	document.body.classList.add(BODY_MODE_CLASS);
	for (const candidate of ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"] as const) {
		document.body.classList.toggle(`${BODY_POSITION_PREFIX}${candidate}`, candidate === position);
	}
}

function ensureMiniPlayerStyle() {
	if (miniPlayerStyle) {
		return miniPlayerStyle;
	}

	miniPlayerStyle = document.createElement("style");
	miniPlayerStyle.id = "yttweak-mini-player-style";
	document.head.appendChild(miniPlayerStyle);
	return miniPlayerStyle;
}

function removePlaceholder() {
	currentPlaceholder?.remove();
	currentPlaceholder = null;
}

function getLayoutSignature() {
	return [
		window.innerWidth,
		window.innerHeight,
		config.get("player.miniPlayer.size", DEFAULT_SIZE),
		config.get("player.miniPlayer.position", "bottom-right"),
		config.get("player.miniPlayer.offset", DEFAULT_OFFSET),
	].join(":");
}

function ensureCloseButton() {
	const player = videoPlayer.player;
	if (!player) {
		return;
	}

	if (!closeButton) {
		closeButton = document.createElement("button");
		closeButton.type = "button";
		closeButton.className = "yttweak-mini-player-close";
		closeButton.setAttribute("aria-label", "Dismiss floating player");
		closeButton.title = "Dismiss floating player";
		const iconWrapper = document.createElement("span");
		iconWrapper.setAttribute("aria-hidden", "true");
		iconWrapper.appendChild(createCloseIcon());
		closeButton.appendChild(iconWrapper);
		closeButton.onclick = (event) => {
			event.preventDefault();
			event.stopPropagation();
			isMiniPlayerDismissed = true;
			deactivateMiniPlayer();
		};
	}

	if (closeButton.parentElement !== player) {
		closeButton.remove();
		player.appendChild(closeButton);
	}
}

function applyMiniPlayerLayout() {
	const player = currentPinnedPlayer || videoPlayer.player;
	if (!player) {
		return;
	}

	const { width: maxWidth, height: maxHeight } = parseSizePreset(config.get("player.miniPlayer.size", DEFAULT_SIZE));
	const offset = clampOffset(Number(config.get("player.miniPlayer.offset", DEFAULT_OFFSET)));
	const position = config.get("player.miniPlayer.position", "bottom-right") as MiniPlayerPosition;
	const aspectRatio = getMiniPlayerAspectRatio();

	const boundedWidth = Math.max(260, Math.min(maxWidth, window.innerWidth - offset * 2));
	const boundedHeight = Math.max(146, Math.min(maxHeight, window.innerHeight - offset * 2));

	let width = boundedWidth;
	let height = width / aspectRatio;

	if (height > boundedHeight) {
		height = boundedHeight;
		width = height * aspectRatio;
	}

	width = Math.round(width);
	height = Math.round(height);

	let left = "auto";
	let right = "auto";
	let top = "auto";
	let bottom = "auto";

	if (position.startsWith("top")) {
		const mastheadHeight = document.querySelector("#masthead-container")?.getBoundingClientRect().height || 0;
		top = `${Math.round(offset + mastheadHeight)}px`;
	} else {
		bottom = `${offset}px`;
	}

	if (position.endsWith("left")) {
		left = `${offset}px`;
	} else if (position.endsWith("right")) {
		right = `${offset}px`;
	} else {
		left = `${Math.max(offset, Math.round((window.innerWidth - width) / 2))}px`;
	}

	player.style.setProperty("--yttweak-mini-player-width", `${width}px`);
	player.style.setProperty("--yttweak-mini-player-height", `${height}px`);
	player.style.setProperty("--yttweak-mini-player-left", left);
	player.style.setProperty("--yttweak-mini-player-right", right);
	player.style.setProperty("--yttweak-mini-player-top", top);
	player.style.setProperty("--yttweak-mini-player-bottom", bottom);
	player.dataset.yttweakMiniPlayerDensity = width < 420 ? "compact" : width < 520 ? "cozy" : "full";

	const style = ensureMiniPlayerStyle();
	style.textContent = `
		:root {
			--yttweak-mini-player-width: ${width}px;
			--yttweak-mini-player-height: ${height}px;
			--yttweak-mini-player-aspect-ratio: ${aspectRatio};
			--yttweak-mini-player-caption-window-left: ${Math.round(width * 0.1)}px;
			--yttweak-mini-player-caption-window-width: ${Math.round(width * 0.8)}px;
		}
	`;
	lastLayoutSignature = getLayoutSignature();
}

function activateMiniPlayer() {
	const player = videoPlayer.player;
	if (!player || isMiniPlayerActive || !player.parentElement) {
		return;
	}

	const playerRect = player.getBoundingClientRect();
	anchorBottomScrollY = window.scrollY + playerRect.bottom;
	originalPlayerParent = player.parentElement;
	originalPlayerNextSibling = player.nextSibling;
	currentPlaceholder = document.createElement("div");
	currentPlaceholder.className = "yttweak-mini-player-placeholder";
	currentPlaceholder.style.width = `${Math.round(playerRect.width)}px`;
	currentPlaceholder.style.height = `${Math.round(playerRect.height)}px`;
	player.parentElement.insertBefore(currentPlaceholder, player);
	currentPinnedPlayer = player;
	document.body.appendChild(player);
	player.classList.add("yttweak-mini-player-active");
	applyBodyClasses(config.get("player.miniPlayer.position", "bottom-right") as MiniPlayerPosition);
	ensureCloseButton();
	applyMiniPlayerLayout();
	isMiniPlayerActive = true;
}

function deactivateMiniPlayer() {
	const player = currentPinnedPlayer || videoPlayer.player;
	if (player && originalPlayerParent) {
		if (currentPlaceholder?.parentElement === originalPlayerParent) {
			originalPlayerParent.insertBefore(player, currentPlaceholder);
			removePlaceholder();
		} else if (originalPlayerNextSibling?.parentNode === originalPlayerParent) {
			originalPlayerParent.insertBefore(player, originalPlayerNextSibling);
		} else {
			originalPlayerParent.appendChild(player);
		}
	}

	clearPlayerLayout(player);
	clearBodyClasses();
	isMiniPlayerActive = false;
	currentPinnedPlayer = null;
	anchorBottomScrollY = null;
	lastLayoutSignature = "";
	originalPlayerParent = null;
	originalPlayerNextSibling = null;
}

function updateMiniPlayerState() {
	updateFrame = 0;

	if (currentPinnedPlayer && currentPinnedPlayer !== videoPlayer.player) {
		deactivateMiniPlayer();
	}

	const activationScrollY = getActivationScrollY();
	if (isMiniPlayerDismissed && window.scrollY < activationScrollY - 120) {
		isMiniPlayerDismissed = false;
	}

	if (!isEligibleToFloat()) {
		deactivateMiniPlayer();
		return;
	}

	if (window.scrollY >= activationScrollY && !isMiniPlayerDismissed) {
		const position = config.get("player.miniPlayer.position", "bottom-right") as MiniPlayerPosition;
		if (!isMiniPlayerActive) {
			activateMiniPlayer();
		} else if (lastLayoutSignature !== getLayoutSignature()) {
			applyBodyClasses(position);
			applyMiniPlayerLayout();
		}
		return;
	}

	deactivateMiniPlayer();
}

function scheduleMiniPlayerUpdate() {
	if (updateFrame) {
		return;
	}

	updateFrame = window.requestAnimationFrame(updateMiniPlayerState);
}

function bindGlobalListeners() {
	if (globalListenersBound) {
		return;
	}

	globalListenersBound = true;
	window.addEventListener("scroll", scheduleMiniPlayerUpdate, { passive: true });
	window.addEventListener("resize", scheduleMiniPlayerUpdate);
	document.addEventListener("fullscreenchange", scheduleMiniPlayerUpdate);
	document.addEventListener("visibilitychange", scheduleMiniPlayerUpdate);
}

function initPlayer() {
	bindGlobalListeners();
	isMiniPlayerDismissed = false;
	ensureCloseButton();
	videoPlayer.videoStream?.addEventListener("loadedmetadata", scheduleMiniPlayerUpdate);
	videoPlayer.videoStream?.addEventListener("ended", scheduleMiniPlayerUpdate);
	videoPlayer.videoStream?.addEventListener("play", scheduleMiniPlayerUpdate);
	scheduleMiniPlayerUpdate();
}

export default {
	"player.miniPlayer.enable": {
		initPlayer,
		enable() {
			scheduleMiniPlayerUpdate();
		},
		disable() {
			isMiniPlayerDismissed = false;
			deactivateMiniPlayer();
		},
		configUpdate(oldConfig, newConfig) {
			const shouldRefresh =
				oldConfig["player.miniPlayer.enable"] !== newConfig["player.miniPlayer.enable"] ||
				oldConfig["player.miniPlayer.size"] !== newConfig["player.miniPlayer.size"] ||
				oldConfig["player.miniPlayer.position"] !== newConfig["player.miniPlayer.position"] ||
				oldConfig["player.miniPlayer.offset"] !== newConfig["player.miniPlayer.offset"] ||
				oldConfig["player.miniPlayer.triggerOffset"] !== newConfig["player.miniPlayer.triggerOffset"];

			if (shouldRefresh) {
				scheduleMiniPlayerUpdate();
			}

			return false;
		},
		videoSrcChange() {
			isMiniPlayerDismissed = false;
			scheduleMiniPlayerUpdate();
		},
	},
} as Record<string, Plugin>;

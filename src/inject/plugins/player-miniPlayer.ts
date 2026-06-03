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
const STACK_ROOT_CLASS = "yttweak-mini-player-stack-root";
const STACK_ROOT_SELECTOR = "ytd-player, #player, #player-container, #full-bleed-container, #player-full-bleed-container";
const LAYOUT_STYLE_SELECTORS = [
	".html5-video-player",
	".html5-video-container",
	".ytp-cued-thumbnail-overlay",
	".html5-main-video",
	"video.html5-main-video",
	".ytp-iv-video-content",
	".ytp-cued-thumbnail-overlay-image",
	".ytp-chrome-bottom",
	".ytp-caption-window-container",
	".ytp-caption-window-container > .caption-window",
] as const;
const LAYOUT_STYLE_PROPERTIES = ["width", "height", "left", "right", "top", "bottom", "margin-left", "margin-top", "transform"] as const;

let isMiniPlayerActive = false;
let isMiniPlayerDismissed = false;
let currentPinnedPlayer: HTMLDivElement | null = null;
let closeButton: HTMLButtonElement | null = null;
let miniPlayerStyle: HTMLStyleElement | null = null;
let updateFrame = 0;
let globalListenersBound = false;
let anchorBottomScrollY: number | null = null;
let lastLayoutSignature = "";
let stackRootElements: HTMLElement[] = [];
let layoutStyleSnapshots: LayoutStyleSnapshot[] = [];

type LayoutStyleProperty = (typeof LAYOUT_STYLE_PROPERTIES)[number];
type LayoutStyleSnapshot = {
	element: HTMLElement;
	properties: Record<LayoutStyleProperty, { value: string; priority: string }>;
};

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

function getViewportAnchorElement() {
	const points: Array<[number, number]> = [
		[window.innerWidth / 2, window.innerHeight * 0.35],
		[window.innerWidth / 2, window.innerHeight * 0.5],
		[window.innerWidth / 2, window.innerHeight * 0.7],
		[window.innerWidth * 0.25, window.innerHeight * 0.5],
		[window.innerWidth * 0.75, window.innerHeight * 0.5],
	];

	for (const [x, y] of points) {
		const element = document.elementFromPoint(Math.round(x), Math.round(y));
		if (element instanceof HTMLElement && !element.closest("#movie_player")) {
			return element;
		}
	}

	return document.querySelector<HTMLElement>("ytd-watch-flexy #columns, ytd-comments, #secondary, #below");
}

function preserveViewportPosition(callback: () => void) {
	const anchorElement = getViewportAnchorElement();
	const anchorTop = anchorElement?.getBoundingClientRect().top ?? null;
	const scrollLeft = window.scrollX;
	const scrollTop = window.scrollY;

	callback();
	void document.documentElement.offsetHeight;

	if (anchorElement?.isConnected && anchorTop !== null) {
		const anchorDelta = anchorElement.getBoundingClientRect().top - anchorTop;
		window.scrollTo(scrollLeft, window.scrollY + anchorDelta);
		return;
	}

	window.scrollTo(scrollLeft, scrollTop);
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

function clearStackRoots() {
	for (const element of stackRootElements) {
		element.classList.remove(STACK_ROOT_CLASS);
	}
	stackRootElements = [];
}

function applyStackRoots(player: HTMLElement) {
	clearStackRoots();

	let element = player.parentElement;
	while (element && element !== document.body && element !== document.documentElement) {
		if (element.matches(STACK_ROOT_SELECTOR)) {
			element.classList.add(STACK_ROOT_CLASS);
			stackRootElements.push(element);
		}
		element = element.parentElement;
	}
}

function captureLayoutStyles(player: HTMLElement) {
	layoutStyleSnapshots = [];

	const elements = new Set<HTMLElement>([player]);
	for (const selector of LAYOUT_STYLE_SELECTORS) {
		for (const element of player.querySelectorAll<HTMLElement>(selector)) {
			elements.add(element);
		}
	}

	for (const element of elements) {
		const properties = {} as LayoutStyleSnapshot["properties"];
		for (const property of LAYOUT_STYLE_PROPERTIES) {
			properties[property] = {
				value: element.style.getPropertyValue(property),
				priority: element.style.getPropertyPriority(property),
			};
		}
		layoutStyleSnapshots.push({ element, properties });
	}
}

function restoreLayoutStyles() {
	for (const snapshot of layoutStyleSnapshots) {
		for (const property of LAYOUT_STYLE_PROPERTIES) {
			const { value, priority } = snapshot.properties[property];
			if (value) {
				snapshot.element.style.setProperty(property, value, priority);
			} else {
				snapshot.element.style.removeProperty(property);
			}
		}
	}
	layoutStyleSnapshots = [];
}

function notifyNativePlayerResize(player: HTMLElement | null) {
	if (!player || player.classList.contains("yttweak-mini-player-active")) {
		return;
	}

	preserveViewportPosition(() => {
		window.dispatchEvent(new Event("resize"));
		player.dispatchEvent(new Event("resize"));
		videoPlayer.videoStream?.dispatchEvent(new Event("resize"));
		player.closest<HTMLElement>("ytd-player")?.dispatchEvent(new Event("resize"));
	});
}

function scheduleNativeLayoutRefresh(player: HTMLElement | null) {
	window.requestAnimationFrame(() => {
		notifyNativePlayerResize(player);
		window.requestAnimationFrame(() => notifyNativePlayerResize(player));
		window.setTimeout(() => notifyNativePlayerResize(player), 120);
	});
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
	captureLayoutStyles(player);
	currentPinnedPlayer = player;
	ensureCloseButton();
	applyMiniPlayerLayout();

	preserveViewportPosition(() => {
		applyBodyClasses(config.get("player.miniPlayer.position", "bottom-right") as MiniPlayerPosition);
		applyStackRoots(player);
		player.classList.add("yttweak-mini-player-active");
	});
	isMiniPlayerActive = true;
}

function deactivateMiniPlayer() {
	const player = currentPinnedPlayer || videoPlayer.player;
	const wasMiniPlayerActive = isMiniPlayerActive || currentPinnedPlayer !== null || layoutStyleSnapshots.length > 0;

	if (!wasMiniPlayerActive) {
		return;
	}

	preserveViewportPosition(() => {
		clearStackRoots();
		clearPlayerLayout(player);
		restoreLayoutStyles();
	});
	clearBodyClasses();
	scheduleNativeLayoutRefresh(player);
	isMiniPlayerActive = false;
	currentPinnedPlayer = null;
	anchorBottomScrollY = null;
	lastLayoutSignature = "";
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

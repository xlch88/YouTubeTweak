import config from "../config";
import { videoPlayer } from "../mainWorld";
import type { Plugin } from "../types";
import { touchPlayer } from "../util/helper";

const BODY_CLASS = "yttweak-player-video-zoom-enabled";
const ZOOMED_CLASS = "yttweak-video-zoom-zoomed";
const DRAGGING_CLASS = "yttweak-video-zoom-dragging";
const TRIGGER_VISIBLE_CLASS = "yttweak-video-zoom-trigger-visible";
const TRIGGER_READY_CLASS = "yttweak-video-zoom-trigger-ready";
const TRIGGER_CLICK_HIDDEN_CLASS = "yttweak-video-zoom-trigger-click-hidden";
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.125;
const DRAG_THRESHOLD = 3;
const TRIGGER_AREA_SIZE = 200;
const TRIGGER_CLICK_HIDE_MS = 450;
const PAGE_SCROLL_RELEASE_LOCK_MS = 300;
const IGNORED_TARGET_SELECTOR = [
	".ytp-chrome-bottom",
	".ytp-chrome-top",
	".yttweak-player-function-buttons",
	"button",
	"input",
	"select",
	"textarea",
	"a",
	"[role='button']",
	"[contenteditable='true']",
].join(",");

let mouseListenersBound = false;
let zoom = MIN_ZOOM;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let hasDragged = false;
let suppressNextClick = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartOffsetX = 0;
let dragStartOffsetY = 0;
let triggerClickHiddenUntil = 0;
let pageScrollReleaseLockedUntil = 0;
let triggerArea: HTMLDivElement | null = null;

function getVideoContainer() {
	return videoPlayer.player?.querySelector<HTMLElement>(".html5-video-container") || null;
}

function getZoomMetrics() {
	const player = videoPlayer.player;
	const videoContainer = getVideoContainer();
	if (!player || !videoContainer) return null;

	const playerRect = player.getBoundingClientRect();
	const containerWidth = videoContainer.offsetWidth || playerRect.width;
	const containerHeight = videoContainer.offsetHeight || playerRect.height;

	return {
		playerRect,
		containerWidth,
		containerHeight,
	};
}

function isEventInPlayer(event: MouseEvent) {
	const rect = videoPlayer.player?.getBoundingClientRect();
	if (!rect) return false;

	return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
}

function getVideoTriggerRect() {
	const rect = videoPlayer.videoStream?.getBoundingClientRect() || videoPlayer.player?.getBoundingClientRect();
	if (!rect) return null;

	const centerX = rect.left + rect.width / 2;
	const centerY = rect.top + rect.height / 2;
	return {
		left: centerX - TRIGGER_AREA_SIZE / 2,
		right: centerX + TRIGGER_AREA_SIZE / 2,
		top: centerY - TRIGGER_AREA_SIZE / 2,
		bottom: centerY + TRIGGER_AREA_SIZE / 2,
		width: TRIGGER_AREA_SIZE,
		height: TRIGGER_AREA_SIZE,
	};
}

function isEventInVideoTriggerArea(event: MouseEvent) {
	const rect = getVideoTriggerRect();
	if (!rect) return false;

	return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
}

function clampZoom(value: number) {
	if (!Number.isFinite(value)) return MIN_ZOOM;
	return Math.min(Math.max(Number(value.toFixed(3)), MIN_ZOOM), MAX_ZOOM);
}

function clampOffsets() {
	const metrics = getZoomMetrics();
	if (!metrics || zoom <= MIN_ZOOM) {
		offsetX = 0;
		offsetY = 0;
		return;
	}

	const maxOffsetX = Math.max(0, (metrics.containerWidth * zoom - metrics.playerRect.width) / 2);
	const maxOffsetY = Math.max(0, (metrics.containerHeight * zoom - metrics.playerRect.height) / 2);

	offsetX = Math.min(Math.max(offsetX, -maxOffsetX), maxOffsetX);
	offsetY = Math.min(Math.max(offsetY, -maxOffsetY), maxOffsetY);
}

function applyVideoZoom() {
	const player = videoPlayer.player;
	const videoContainer = getVideoContainer();
	if (!player) return;

	const enabled = config.get("player.ui.enableVideoZoom");
	player.classList.toggle(ZOOMED_CLASS, enabled && zoom > MIN_ZOOM);
	player.classList.toggle(DRAGGING_CLASS, enabled && isDragging);
	updateTriggerArea();

	if (!videoContainer) return;

	if (!enabled || zoom <= MIN_ZOOM) {
		videoContainer.style.removeProperty("transform");
		videoContainer.style.removeProperty("transform-origin");
		return;
	}

	const metrics = getZoomMetrics();
	if (!metrics) return;

	const baseOffsetX = (metrics.playerRect.width - metrics.containerWidth * zoom) / 2;
	const baseOffsetY = (metrics.playerRect.height - metrics.containerHeight * zoom) / 2;
	videoContainer.style.transform = `translate3d(${(baseOffsetX + offsetX).toFixed(1)}px, ${(baseOffsetY + offsetY).toFixed(1)}px, 0) scale(${zoom.toFixed(3)})`;
	videoContainer.style.transformOrigin = "0 0";
}

function updateTriggerArea(event?: MouseEvent) {
	const player = videoPlayer.player;
	if (!player) return;

	const triggerClickHidden = performance.now() < triggerClickHiddenUntil;
	if (!triggerClickHidden) player.classList.remove(TRIGGER_CLICK_HIDDEN_CLASS);

	const visible = config.get("player.ui.enableVideoZoom") && zoom <= MIN_ZOOM;
	player.classList.toggle(TRIGGER_VISIBLE_CLASS, visible);
	player.classList.toggle(TRIGGER_READY_CLASS, visible && !!event && !triggerClickHidden && isEventInVideoTriggerArea(event));
	if (!visible) {
		player.classList.remove(TRIGGER_CLICK_HIDDEN_CLASS);
		triggerClickHiddenUntil = 0;
		triggerArea?.style.removeProperty("display");
		return;
	}

	if (!triggerArea) {
		triggerArea = document.createElement("div");
		triggerArea.className = "yttweak-video-zoom-trigger-area";
	}
	const triggerParent = player.querySelector<HTMLElement>(".ytp-chrome-bottom") || player;
	if (triggerArea.parentElement !== triggerParent) {
		triggerParent.appendChild(triggerArea);
	}

	const parentRect = triggerParent.getBoundingClientRect();
	const rect = getVideoTriggerRect();
	if (!rect) return;

	triggerArea.style.left = `${(rect.left - parentRect.left).toFixed(1)}px`;
	triggerArea.style.top = `${(rect.top - parentRect.top).toFixed(1)}px`;
	triggerArea.style.width = `${rect.width.toFixed(1)}px`;
	triggerArea.style.height = `${rect.height.toFixed(1)}px`;
}

function resetVideoZoom() {
	if (isDragging) stopDragging();
	zoom = MIN_ZOOM;
	offsetX = 0;
	offsetY = 0;
	isDragging = false;
	hasDragged = false;
	suppressNextClick = false;
	triggerClickHiddenUntil = 0;
	pageScrollReleaseLockedUntil = 0;
	applyVideoZoom();
}

function shouldIgnoreMouseEvent(event: MouseEvent) {
	if (!isEventInPlayer(event)) return true;

	const player = videoPlayer.player;
	const target = event.target;
	return !!(target instanceof Element && player?.contains(target) && target.closest(IGNORED_TARGET_SELECTOR));
}

function handleWheel(event: WheelEvent) {
	if (!config.get("player.ui.enableVideoZoom") || shouldIgnoreMouseEvent(event) || !event.deltaY) return;

	if (zoom <= MIN_ZOOM && event.deltaY > 0) {
		if (isEventInVideoTriggerArea(event)) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			updateTriggerArea(event);
			return;
		}

		if (performance.now() < pageScrollReleaseLockedUntil) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			updateTriggerArea(event);
		}
		return;
	}

	if (zoom <= MIN_ZOOM && !isEventInVideoTriggerArea(event)) return;

	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
	touchPlayer();

	const previousZoom = zoom;
	const nextZoom = clampZoom(zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
	if (nextZoom === previousZoom) return;

	if (nextZoom <= MIN_ZOOM) {
		zoom = MIN_ZOOM;
		offsetX = 0;
		offsetY = 0;
		if (previousZoom > MIN_ZOOM && event.deltaY > 0) {
			pageScrollReleaseLockedUntil = performance.now() + PAGE_SCROLL_RELEASE_LOCK_MS;
		}
	} else {
		pageScrollReleaseLockedUntil = 0;
		const rect = videoPlayer.player?.getBoundingClientRect();
		if (rect) {
			const focalX = event.clientX - rect.left - rect.width / 2;
			const focalY = event.clientY - rect.top - rect.height / 2;
			const ratio = nextZoom / previousZoom;
			offsetX = offsetX * ratio + focalX * (1 - ratio);
			offsetY = offsetY * ratio + focalY * (1 - ratio);
		}
		zoom = nextZoom;
		clampOffsets();
	}

	applyVideoZoom();
}

function handleMouseMove(event: MouseEvent) {
	updateTriggerArea(event);
}

function stopDragging() {
	isDragging = false;
	window.removeEventListener("pointermove", handlePointerMove, true);
	window.removeEventListener("pointerup", handlePointerUp, true);
	window.removeEventListener("pointercancel", handlePointerUp, true);
	window.removeEventListener("mousemove", handlePointerMove, true);
	window.removeEventListener("mouseup", handlePointerUp, true);
	applyVideoZoom();
}

function startDragging(event: MouseEvent) {
	if (isDragging || !config.get("player.ui.enableVideoZoom") || event.button !== 0 || shouldIgnoreMouseEvent(event)) return;

	if (zoom <= MIN_ZOOM) {
		if (isEventInVideoTriggerArea(event)) {
			triggerClickHiddenUntil = performance.now() + TRIGGER_CLICK_HIDE_MS;
			videoPlayer.player?.classList.remove(TRIGGER_READY_CLASS);
			videoPlayer.player?.classList.add(TRIGGER_CLICK_HIDDEN_CLASS);
		}
		return;
	}

	touchPlayer();
	isDragging = true;
	hasDragged = false;
	dragStartX = event.clientX;
	dragStartY = event.clientY;
	dragStartOffsetX = offsetX;
	dragStartOffsetY = offsetY;
	window.addEventListener("pointermove", handlePointerMove, true);
	window.addEventListener("pointerup", handlePointerUp, true);
	window.addEventListener("pointercancel", handlePointerUp, true);
	window.addEventListener("mousemove", handlePointerMove, true);
	window.addEventListener("mouseup", handlePointerUp, true);
	applyVideoZoom();
}

function handlePointerMove(event: MouseEvent | PointerEvent) {
	if (!isDragging) return;

	const nextOffsetX = dragStartOffsetX + event.clientX - dragStartX;
	const nextOffsetY = dragStartOffsetY + event.clientY - dragStartY;
	if (!hasDragged && Math.hypot(nextOffsetX - dragStartOffsetX, nextOffsetY - dragStartOffsetY) < DRAG_THRESHOLD) return;

	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
	touchPlayer();
	hasDragged = true;
	offsetX = nextOffsetX;
	offsetY = nextOffsetY;
	clampOffsets();
	applyVideoZoom();
}

function handlePointerUp(event: MouseEvent | PointerEvent) {
	if (!isDragging) return;

	if (hasDragged) {
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
		suppressNextClick = true;
	}
	stopDragging();
}

function handleClick(event: MouseEvent) {
	if (!suppressNextClick) return;

	event.preventDefault();
	event.stopPropagation();
	suppressNextClick = false;
}

function bindMouseListeners() {
	if (mouseListenersBound) return;

	mouseListenersBound = true;
	window.addEventListener("wheel", handleWheel, { capture: true, passive: false });
	window.addEventListener("pointerdown", startDragging, true);
	window.addEventListener("mousedown", startDragging, true);
	window.addEventListener("mousemove", handleMouseMove, true);
	window.addEventListener("click", handleClick, true);
}

function setVideoZoomEnabled(enabled: boolean) {
	document.body.classList.toggle(BODY_CLASS, enabled);
	bindMouseListeners();
	if (!enabled) {
		resetVideoZoom();
		return;
	}
	applyVideoZoom();
}

export default {
	"player.ui.enableVideoZoom": {
		initPlayer() {
			bindMouseListeners();
			setVideoZoomEnabled(config.get("player.ui.enableVideoZoom"));
		},
		enable() {
			setVideoZoomEnabled(true);
		},
		disable() {
			setVideoZoomEnabled(false);
		},
		videoSrcChange() {
			resetVideoZoom();
			setVideoZoomEnabled(config.get("player.ui.enableVideoZoom"));
		},
	},
} as Record<string, Plugin>;

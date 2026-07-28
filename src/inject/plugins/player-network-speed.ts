import type { Config, PlayerNetworkSpeedMode, PlayerNetworkSpeedUnit } from "@/defaultConfig";
import config from "../config";
import { videoPlayer } from "../mainWorld";
import type { Plugin } from "../types";

const OVERLAY_WIDGET_ID = "yttweak-player-network-speed";
const CONTROLS_WIDGET_ID = "yttweak-player-network-speed-controls";

let overlayElement = document.getElementById(OVERLAY_WIDGET_ID) as HTMLDivElement | null;
let controlsElement = document.getElementById(CONTROLS_WIDGET_ID) as HTMLDivElement | null;
let interval: number | undefined;
let pageBytes = 0;
let lastUpdatedAt = performance.now();
let currentText = "0.00 MB/s";
let mode: PlayerNetworkSpeedMode | undefined;
let unit: PlayerNetworkSpeedUnit = "mb";
let trackPageTraffic = false;
let videoId: string | null = null;

function mountOverlay() {
	const container = videoPlayer.player?.querySelector(".ytp-overlay-bottom-right .ytp-overlay-inline-container");
	if (!container) return;

	if (!overlayElement) {
		overlayElement = document.createElement("div");
		overlayElement.id = OVERLAY_WIDGET_ID;
		overlayElement.className = "yttweak-player-network-speed yttweak-player-network-speed-overlay";
		overlayElement.dataset.overlayOrder = "10.5";
		overlayElement.textContent = currentText;
	}

	const timelyActions = container.querySelector(":scope > .ytp-timely-actions-content");
	if (timelyActions) {
		if (timelyActions.nextElementSibling !== overlayElement) timelyActions.after(overlayElement);
	} else if (container.firstElementChild !== overlayElement) {
		container.prepend(overlayElement);
	}
}

function mountControls() {
	const controls = videoPlayer.controls;
	const rightControls = controls?.querySelector(":scope > .ytp-right-controls");
	if (!controls || !rightControls) return;

	if (!controlsElement) {
		controlsElement = document.createElement("div");
		controlsElement.id = CONTROLS_WIDGET_ID;
		controlsElement.className = "yttweak-player-network-speed yttweak-player-network-speed-controls";
		controlsElement.textContent = currentText;
	}

	const speedButtons = controls.querySelector<HTMLElement>(":scope > .yttweak-speed-buttons");
	const anchor = speedButtons && getComputedStyle(speedButtons).display !== "none" ? speedButtons : rightControls;
	if (controlsElement.nextElementSibling !== anchor) controls.insertBefore(controlsElement, anchor);
}

function mount() {
	if (mode === "both") {
		mountOverlay();
	} else {
		overlayElement?.remove();
	}

	if (mode === "controls" || mode === "both") {
		mountControls();
	} else {
		controlsElement?.remove();
	}
}

function updateText(text: string) {
	if (text === currentText) return;
	currentText = text;
	if (overlayElement) overlayElement.textContent = text;
	if (controlsElement) controlsElement.textContent = text;
}

function isEnabled() {
	return mode !== undefined && mode !== "off";
}

function readNetworkActivity() {
	const player = videoPlayer.player;
	if (typeof player?.getStatsForNerds !== "function") return { bytes: 0, latestBytes: 0 };

	let stats: Record<string, unknown> | undefined;
	try {
		stats = player.getStatsForNerds(0);
	} catch {}
	if (!stats || typeof stats !== "object") {
		try {
			stats = player.getStatsForNerds();
		} catch {}
	}
	if (!stats || typeof stats !== "object") return { bytes: 0, latestBytes: 0 };

	let bytes = 0;
	if (Array.isArray(stats.network_activity_samples)) {
		for (const value of stats.network_activity_samples) {
			if (typeof value === "number" && Number.isFinite(value) && value > 0) bytes += value;
		}
	}

	const latestKilobytes = Number.parseFloat(String(stats.network_activity_bytes ?? "").replaceAll(",", ""));
	return {
		bytes,
		latestBytes: Number.isFinite(latestKilobytes) && latestKilobytes > 0 ? latestKilobytes * 1024 : 0,
	};
}

function resetNetworkStats() {
	readNetworkActivity();
	videoId = location.pathname === "/watch" ? new URLSearchParams(location.search).get("v") : null;
	pageBytes = 0;
	lastUpdatedAt = performance.now();
	updateText(trackPageTraffic ? `${formatSpeed(0)} ${formatTraffic(0)}` : formatSpeed(0));
}

function formatSpeed(bytesPerSecond: number) {
	if (unit === "auto" && bytesPerSecond < 1024 * 1024) {
		return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
	}
	return `${(bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
}

function formatTraffic(bytes: number) {
	if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
	if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
	return `${(bytes / 1024).toFixed(2)} KB`;
}

function update() {
	if (!isEnabled()) return;

	const now = performance.now();
	const currentVideoId = location.pathname === "/watch" ? new URLSearchParams(location.search).get("v") : null;
	if (currentVideoId !== videoId) {
		resetNetworkStats();
		return;
	}

	const { bytes, latestBytes } = readNetworkActivity();
	const bytesPerSecond = Math.max((bytes * 1000) / Math.max(now - lastUpdatedAt, 1), latestBytes * 4);
	lastUpdatedAt = now;
	if (trackPageTraffic) pageBytes += bytes || latestBytes;
	const speed = formatSpeed(bytesPerSecond);
	updateText(trackPageTraffic ? `${speed} ${formatTraffic(pageBytes)}` : speed);
}

function setMode(value: PlayerNetworkSpeedMode) {
	if (value === mode) return;
	mode = value;

	if (mode === "off") {
		window.removeEventListener("yt-navigate-start", resetNetworkStats);
		if (interval !== undefined) window.clearInterval(interval);
		interval = undefined;
		overlayElement?.remove();
		controlsElement?.remove();
		return;
	}

	mount();
	if (interval !== undefined) return;
	window.addEventListener("yt-navigate-start", resetNetworkStats);
	resetNetworkStats();
	interval = window.setInterval(update, 1000);
}

function syncSettings() {
	unit = config.get("other.playerNetworkSpeed.unit", "mb");
	const nextTrackPageTraffic = config.get("other.playerNetworkSpeed.trackPageTraffic", false);
	if (nextTrackPageTraffic !== trackPageTraffic) pageBytes = 0;
	trackPageTraffic = nextTrackPageTraffic;
	setMode(config.get("other.playerNetworkSpeed.mode", "both"));
}

export default {
	"other.playerNetworkSpeed": {
		setup() {
			if (window.top === window) syncSettings();
		},
		initPlayer() {
			if (window.top === window && isEnabled()) mount();
		},
		configUpdate(oldConfig: Partial<Config>, newConfig: Partial<Config>) {
			if (
				window.top === window &&
				(oldConfig["other.playerNetworkSpeed.mode"] !== newConfig["other.playerNetworkSpeed.mode"] ||
					oldConfig["other.playerNetworkSpeed.unit"] !== newConfig["other.playerNetworkSpeed.unit"] ||
					oldConfig["other.playerNetworkSpeed.trackPageTraffic"] !== newConfig["other.playerNetworkSpeed.trackPageTraffic"])
			) {
				syncSettings();
			}
			return false;
		},
	},
} as Record<string, Plugin>;

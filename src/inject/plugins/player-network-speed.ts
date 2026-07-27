import type { Config, PlayerNetworkSpeedMode, PlayerNetworkSpeedUnit } from "@/defaultConfig";
import config from "../config";
import { videoPlayer } from "../mainWorld";
import type { Plugin } from "../types";
import wirelessRedstone from "../wirelessRedstone";

const OVERLAY_WIDGET_ID = "yttweak-player-network-speed";
const CONTROLS_WIDGET_ID = "yttweak-player-network-speed-controls";

let overlayElement = document.getElementById(OVERLAY_WIDGET_ID) as HTMLDivElement | null;
let controlsElement = document.getElementById(CONTROLS_WIDGET_ID) as HTMLDivElement | null;
let interval: number | undefined;
let lastUpdatedAt = performance.now();
let currentText = "0.00 MB/s";
let mode: PlayerNetworkSpeedMode | undefined;
let unit: PlayerNetworkSpeedUnit = "mb";
let trackPageTraffic = false;
let updating = false;

function mountOverlay() {
	const container = videoPlayer.player?.querySelector(".ytp-overlay-bottom-right .ytp-overlay-inline-container");
	if (!container) return false;

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
	return true;
}

function mountControls() {
	const controls = videoPlayer.controls;
	const rightControls = controls?.querySelector(":scope > .ytp-right-controls");
	if (!controls || !rightControls) return false;

	if (!controlsElement) {
		controlsElement = document.createElement("div");
		controlsElement.id = CONTROLS_WIDGET_ID;
		controlsElement.className = "yttweak-player-network-speed yttweak-player-network-speed-controls";
		controlsElement.textContent = currentText;
	}

	const speedButtons = controls.querySelector<HTMLElement>(":scope > .yttweak-speed-buttons");
	const anchor = speedButtons && getComputedStyle(speedButtons).display !== "none" ? speedButtons : rightControls;
	if (controlsElement.nextElementSibling !== anchor) controls.insertBefore(controlsElement, anchor);
	return true;
}

function mount() {
	let mounted = false;
	if (mode === "both") {
		mounted = mountOverlay();
	} else {
		overlayElement?.remove();
	}

	if (mode !== "off") {
		mounted = mountControls() || mounted;
	} else {
		controlsElement?.remove();
	}
	return mounted;
}

function updateText(text: string) {
	currentText = text;
	if (overlayElement) overlayElement.textContent = text;
	if (controlsElement) controlsElement.textContent = text;
}

function isEnabled() {
	return mode !== undefined && mode !== "off";
}

function formatSpeed(bytes: number, elapsed: number) {
	const bytesPerSecond = (bytes * 1000) / Math.max(elapsed, 1);
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
	if (!isEnabled() || updating || !mount()) return;
	updating = true;

	wirelessRedstone.send(
		"getYoutubeNetworkBytes",
		{
			videoId: location.pathname === "/watch" ? new URLSearchParams(location.search).get("v") : null,
			trackPageTraffic,
		},
		(result: { supported: boolean; bytes: number; pageBytes: number }) => {
			const now = performance.now();
			updating = false;
			if (!isEnabled()) {
				wirelessRedstone.send("disableYoutubeNetworkSpeed", null);
				return;
			}

			if (result?.supported) {
				const speed = formatSpeed(result.bytes || 0, now - lastUpdatedAt);
				updateText(trackPageTraffic ? `${speed} ${formatTraffic(result.pageBytes || 0)}` : speed);
			} else {
				updateText("N/A");
			}
			lastUpdatedAt = now;
		},
	);
}

function setMode(value: PlayerNetworkSpeedMode) {
	if (value === mode) return;
	mode = value;

	if (mode === "off") {
		if (interval !== undefined) window.clearInterval(interval);
		interval = undefined;
		overlayElement?.remove();
		controlsElement?.remove();
		wirelessRedstone.send("disableYoutubeNetworkSpeed", null);
		return;
	}

	mount();
	if (interval !== undefined) return;
	lastUpdatedAt = performance.now();
	update();
	interval = window.setInterval(update, 1000);
}

function syncSettings() {
	unit = config.get("other.playerNetworkSpeed.unit", "mb");
	trackPageTraffic = config.get("other.playerNetworkSpeed.trackPageTraffic", false);
	setMode(config.get("other.playerNetworkSpeed.mode", "both"));
}

export default {
	"other.playerNetworkSpeed": {
		setup() {
			if (window.top === window) syncSettings();
		},
		initPlayer() {
			if (window.top === window) mount();
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

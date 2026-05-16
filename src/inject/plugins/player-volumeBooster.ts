import config from "../config";
import { videoPlayer } from "../mainWorld";
import { createLogger } from "../../logger";

import type { Plugin } from "../types";

const logger = createLogger("player-volumeBooster");

type AudioContextConstructor = typeof AudioContext;
type AudioChain = {
	context: AudioContext;
	source: MediaElementAudioSourceNode;
	gain: GainNode;
	video: HTMLVideoElement;
};

const audioChains = new WeakMap<HTMLVideoElement, AudioChain>();

let activeAudioChain: AudioChain | null = null;
let playerBoundForBooster: HTMLVideoElement | null = null;
let resumeListenersBound = false;

let boosterStrip: HTMLDivElement | null = null;
let boosterButton: HTMLButtonElement | null = null;

function createSvgElement(tagName: string) {
	return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function createBoosterIcon() {
	const svg = createSvgElement("svg");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("focusable", "false");

	const outline = createSvgElement("path");
	outline.setAttribute("class", "yttweak-volume-booster-outline");
	outline.setAttribute(
		"d",
		"M15 8a5 5 0 0 1 0 8m2.7-11a9 9 0 0 1 0 14M6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l3.5-4.5A.8.8 0 0 1 11 5v14a.8.8 0 0 1-1.5.5z",
	);

	svg.append(outline);
	return svg;
}

function clampMultiplier(value: number) {
	if (!Number.isFinite(value) || value < 1) {
		return 1;
	}
	return Math.min(value, 5);
}

function formatMultiplier(value: number) {
	return clampMultiplier(value).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function updateButtonState() {
	if (!boosterButton) {
		return;
	}

	const isEnabled = config.get("player.settings.volumeBooster");
	const multiplier = clampMultiplier(Number(config.get("player.settings.volumeBoosterMultiplier")));
	const buttonText = `Volume booster ${isEnabled ? "on" : "off"} (${formatMultiplier(multiplier)}x)`;

	boosterStrip?.classList.toggle("yttweak-volume-booster-visible", config.get("player.ui.enableVolumeBooster"));
	boosterButton.classList.toggle("yttweak-volume-booster-active", isEnabled);
	boosterButton.setAttribute("aria-pressed", String(isEnabled));
	boosterButton.title = buttonText;
}

async function resumeActiveContext() {
	if (!activeAudioChain || activeAudioChain.context.state !== "suspended") {
		return;
	}

	try {
		await activeAudioChain.context.resume();
	} catch (error) {
		logger.warn("Failed to resume volume booster audio context:", error);
	}
}

function bindResumeListeners() {
	if (resumeListenersBound) {
		return;
	}

	resumeListenersBound = true;
	const resume = () => {
		void resumeActiveContext();
	};

	window.addEventListener("pointerdown", resume, true);
	window.addEventListener("keydown", resume, true);
	window.addEventListener("touchstart", resume, true);
}

function getAudioContextConstructor(): AudioContextConstructor | null {
	return window.AudioContext || (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext || null;
}

async function ensureAudioChain() {
	const video = videoPlayer.videoStream;
	if (!video) {
		return null;
	}

	playerBoundForBooster = video;
	bindResumeListeners();

	if (activeAudioChain?.video === video) {
		await resumeActiveContext();
		return activeAudioChain;
	}

	activeAudioChain?.gain.gain.setValueAtTime(1, activeAudioChain.context.currentTime);

	const cachedChain = audioChains.get(video);
	if (cachedChain) {
		activeAudioChain = cachedChain;
		await resumeActiveContext();
		return cachedChain;
	}

	const AudioContextClass = getAudioContextConstructor();
	if (!AudioContextClass) {
		logger.warn("Volume booster is not supported by this browser.");
		return null;
	}

	try {
		const context = new AudioContextClass();
		const source = context.createMediaElementSource(video);
		const gain = context.createGain();

		source.connect(gain);
		gain.connect(context.destination);

		const chain: AudioChain = {
			context,
			source,
			gain,
			video,
		};

		audioChains.set(video, chain);
		activeAudioChain = chain;
		await resumeActiveContext();
		return chain;
	} catch (error) {
		logger.error("Failed to initialize the volume booster audio chain:", error);
		return null;
	}
}

async function syncBoosterState() {
	updateButtonState();

	if (!config.get("player.settings.volumeBooster")) {
		if (activeAudioChain) {
			activeAudioChain.gain.gain.setValueAtTime(1, activeAudioChain.context.currentTime);
		}
		return;
	}

	const chain = await ensureAudioChain();
	if (!chain) {
		return;
	}

	const multiplier = clampMultiplier(Number(config.get("player.settings.volumeBoosterMultiplier")));
	chain.gain.gain.setValueAtTime(multiplier, chain.context.currentTime);
}

async function setBoosterEnabled(nextState: boolean) {
	config.set("player.settings.volumeBooster", nextState);
	updateButtonState();

	if (!nextState) {
		if (activeAudioChain) {
			activeAudioChain.gain.gain.setValueAtTime(1, activeAudioChain.context.currentTime);
		}
		return;
	}

	await syncBoosterState();
}

function mountBoosterStrip() {
	const controls = videoPlayer.controls;
	if (!controls) {
		return;
	}

	if (!boosterStrip) {
		boosterStrip = document.createElement("div");
		boosterStrip.className = "yttweak-volume-booster-strip";

		boosterButton = document.createElement("button");
		boosterButton.type = "button";
		boosterButton.className = "yttweak-volume-booster-button";
		boosterButton.setAttribute("aria-label", "Toggle volume booster");
		boosterButton.onclick = (event) => {
			event.preventDefault();
			event.stopPropagation();

			const nextState = !config.get("player.settings.volumeBooster");
			void setBoosterEnabled(nextState);
		};

		const icon = document.createElement("span");
		icon.className = "yttweak-volume-booster-icon";
		icon.setAttribute("aria-hidden", "true");
		icon.appendChild(createBoosterIcon());
		boosterButton.appendChild(icon);
		boosterStrip.appendChild(boosterButton);
	}

	const rightControls = controls.querySelector(".ytp-right-controls");
	const speedStrip = controls.querySelector(".yttweak-speed-buttons");
	const insertBeforeNode = speedStrip?.nextSibling || rightControls || null;

	if (boosterStrip.parentElement !== controls) {
		controls.insertBefore(boosterStrip, insertBeforeNode);
	} else if (speedStrip && boosterStrip.previousSibling !== speedStrip) {
		controls.insertBefore(boosterStrip, speedStrip.nextSibling || rightControls || null);
	}

	updateButtonState();
}

function initPlayer() {
	if (playerBoundForBooster && playerBoundForBooster !== videoPlayer.videoStream) {
		activeAudioChain?.gain.gain.setValueAtTime(1, activeAudioChain.context.currentTime);
		activeAudioChain = null;
	}

	mountBoosterStrip();
	videoPlayer.videoStream?.addEventListener("play", syncBoosterState);
	videoPlayer.videoStream?.addEventListener("loadedmetadata", syncBoosterState);
	videoPlayer.videoStream?.addEventListener("ended", syncBoosterState);
	void syncBoosterState();
}

function refreshVolumeBoosterUi() {
	mountBoosterStrip();
	void syncBoosterState();
}

export default {
	"player.ui.enableVolumeBooster": {
		initPlayer,
		enable() {
			mountBoosterStrip();
			updateButtonState();
		},
		disable() {
			updateButtonState();
		},
		configUpdate(oldConfig, newConfig) {
			const uiChanged = oldConfig["player.ui.enableVolumeBooster"] !== newConfig["player.ui.enableVolumeBooster"];
			const enabledChanged = oldConfig["player.settings.volumeBooster"] !== newConfig["player.settings.volumeBooster"];
			const multiplierChanged =
				oldConfig["player.settings.volumeBoosterMultiplier"] !== newConfig["player.settings.volumeBoosterMultiplier"];

			if (uiChanged || enabledChanged || multiplierChanged) {
				refreshVolumeBoosterUi();
			}

			return false;
		},
		videoSrcChange() {
			refreshVolumeBoosterUi();
		},
	},
	"player.settings.volumeBooster": {
		initPlayer,
		enable() {
			void syncBoosterState();
		},
		disable() {
			void syncBoosterState();
		},
		configUpdate(oldConfig, newConfig) {
			const multiplierChanged =
				oldConfig["player.settings.volumeBoosterMultiplier"] !== newConfig["player.settings.volumeBoosterMultiplier"];

			if (multiplierChanged) {
				void syncBoosterState();
			}

			return false;
		},
		videoSrcChange() {
			void syncBoosterState();
		},
	},
} as Record<string, Plugin>;

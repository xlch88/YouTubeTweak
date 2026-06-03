import config from "../config";
import { videoPlayer } from "../mainWorld";
import { createLogger } from "../../logger";
import { createBox, updateFuncBtnStatus, yttBtnBox } from "./player-function-buttons";

import type { Plugin } from "../types";

const logger = createLogger("player-volumeBooster");
const DEFAULT_MULTIPLIER = 2;
const MIN_MULTIPLIER = 1.25;
const MAX_MULTIPLIER = 5;
const MULTIPLIER_STEP = 0.25;
const BODY_CONTROL_CLASS = "yttweak-player-enable-volume-booster";

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

let boosterButton: HTMLSpanElement | null = null;
let boosterControlVisible = false;

function clampMultiplier(value: number) {
	if (!Number.isFinite(value)) {
		return DEFAULT_MULTIPLIER;
	}

	const steppedValue = Math.round(value / MULTIPLIER_STEP) * MULTIPLIER_STEP;
	return Math.min(Math.max(steppedValue, MIN_MULTIPLIER), MAX_MULTIPLIER);
}

function formatMultiplier(value: number) {
	return clampMultiplier(value)
		.toFixed(2)
		.replace(/\.00$/, "")
		.replace(/(\.\d)0$/, "$1");
}

function getConfiguredMultiplier() {
	return clampMultiplier(Number(config.get("player.settings.volumeBoosterMultiplier", DEFAULT_MULTIPLIER)));
}

function setBoosterControlVisible(visible: boolean) {
	document.body.classList.toggle(BODY_CONTROL_CLASS, visible);

	if (boosterControlVisible === visible) {
		return;
	}

	boosterControlVisible = visible;
	updateFuncBtnStatus(visible);
}

function updateButtonState() {
	if (!boosterButton) {
		return;
	}

	const isEnabled = config.get("player.settings.volumeBooster");
	const multiplier = getConfiguredMultiplier();
	const buttonText = `Volume booster ${isEnabled ? "on" : "off"} (${formatMultiplier(multiplier)}x)\n\n🖱Use the mouse wheel to control:\n - Increase by 0.25x upwards\n - Decrease by 0.25x downwards`;

	boosterButton.classList.toggle("yttweak-volume-booster-active", isEnabled);
	boosterButton.setAttribute("text", `${formatMultiplier(multiplier)}x`);
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

function resetAudioChainGain(chain: AudioChain) {
	try {
		chain.gain.gain.setValueAtTime(1, chain.context.currentTime);
	} catch (error) {
		logger.warn("Failed to reset volume booster gain:", error);
	}
}

function disposeAudioChain(chain: AudioChain | null) {
	if (!chain) {
		return;
	}

	resetAudioChainGain(chain);
	audioChains.delete(chain.video);

	if (activeAudioChain === chain) {
		activeAudioChain = null;
	}
	if (playerBoundForBooster === chain.video) {
		playerBoundForBooster = null;
	}

	try {
		chain.source.disconnect();
	} catch (error) {
		logger.warn("Failed to disconnect volume booster source:", error);
	}

	try {
		chain.gain.disconnect();
	} catch (error) {
		logger.warn("Failed to disconnect volume booster gain:", error);
	}

	if (chain.context.state !== "closed") {
		chain.context.close().catch((error) => {
			logger.warn("Failed to close volume booster audio context:", error);
		});
	}
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

	disposeAudioChain(activeAudioChain);

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
			resetAudioChainGain(activeAudioChain);
		}
		return;
	}

	const chain = await ensureAudioChain();
	if (!chain) {
		return;
	}

	const multiplier = getConfiguredMultiplier();
	chain.gain.gain.setValueAtTime(multiplier, chain.context.currentTime);
}

function setBoosterMultiplier(multiplier: number) {
	config.set("player.settings.volumeBoosterMultiplier", clampMultiplier(multiplier));
	updateButtonState();
	void syncBoosterState();
}

async function setBoosterEnabled(nextState: boolean) {
	config.set("player.settings.volumeBooster", nextState);
	updateButtonState();

	if (!nextState) {
		if (activeAudioChain) {
			resetAudioChainGain(activeAudioChain);
		}
		return;
	}

	await syncBoosterState();
}

function stepBoosterMultiplier(direction: 1 | -1) {
	const isEnabled = config.get("player.settings.volumeBooster");

	if (direction > 0) {
		if (!isEnabled) {
			config.set("player.settings.volumeBoosterMultiplier", MIN_MULTIPLIER);
			void setBoosterEnabled(true);
			return;
		}

		setBoosterMultiplier(getConfiguredMultiplier() + MULTIPLIER_STEP);
		return;
	}

	if (!isEnabled) {
		return;
	}

	const currentMultiplier = getConfiguredMultiplier();
	if (currentMultiplier <= MIN_MULTIPLIER) {
		void setBoosterEnabled(false);
		return;
	}

	setBoosterMultiplier(currentMultiplier - MULTIPLIER_STEP);
}

function mountBoosterButton() {
	createBox();

	if (!yttBtnBox) {
		return;
	}

	if (!boosterButton) {
		boosterButton = document.createElement("span");
		boosterButton.className = "yttweak-function-button-volume-booster";
		boosterButton.setAttribute("role", "button");
		boosterButton.setAttribute("aria-label", "Toggle volume booster");
		boosterButton.onclick = (event) => {
			event.preventDefault();
			event.stopPropagation();

			const nextState = !config.get("player.settings.volumeBooster");
			void setBoosterEnabled(nextState);
		};
		boosterButton.onwheel = (event) => {
			event.preventDefault();
			event.stopPropagation();
			if (!event.deltaY) {
				return;
			}
			stepBoosterMultiplier(event.deltaY < 0 ? 1 : -1);
		};
	}

	if (boosterButton.parentElement !== yttBtnBox) {
		yttBtnBox.appendChild(boosterButton);
	}

	updateButtonState();
}

function initPlayer() {
	const currentVideo = videoPlayer.videoStream;
	if (activeAudioChain && activeAudioChain.video !== currentVideo) {
		disposeAudioChain(activeAudioChain);
	} else if (playerBoundForBooster && playerBoundForBooster !== currentVideo) {
		playerBoundForBooster = null;
	}

	mountBoosterButton();
	videoPlayer.videoStream?.addEventListener("play", syncBoosterState);
	videoPlayer.videoStream?.addEventListener("loadedmetadata", syncBoosterState);
	videoPlayer.videoStream?.addEventListener("ended", syncBoosterState);
	void syncBoosterState();
}

function refreshVolumeBoosterUi() {
	setBoosterControlVisible(config.get("player.ui.enableVolumeBooster"));
	mountBoosterButton();
	void syncBoosterState();
}

export default {
	"player.ui.enableVolumeBooster": {
		initPlayer,
		enable() {
			setBoosterControlVisible(true);
			mountBoosterButton();
			updateButtonState();
		},
		disable() {
			setBoosterControlVisible(false);
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

import config from "../config";
import { metadata, videoPlayer } from "../mainWorld";
import { createLogger } from "../../logger";
import { getChannelId } from "../util/helper";

import type { Plugin } from "../types";
import memory from "@/memory";

const logger = createLogger("player-speedButton");

const speedButtons: HTMLSpanElement[] = [];
let speedButtonDiv: HTMLDivElement | null = null;
let activeSpeedButton: HTMLSpanElement | null = null;
let speedSliderValue: HTMLDivElement | null = null;
let lastPlaybackSpeed = 1;
let sliderTimer: ReturnType<typeof setTimeout> | undefined;
let isDraggingSpeedSlider = false;
let hasDraggedSpeedSlider = false;
let dragStartX = 0;
let dragStartSpeedButton: HTMLSpanElement | null = null;
let suppressNextSpeedClick = false;

const SLIDER_DISPLAY_MS = 500;
const DRAG_THRESHOLD = 3;
const SLIDER_TRACK_SIDE_OFFSET = 28;

function formatSpeed(speed: number) {
	return String(Number(speed.toFixed(2)));
}

function nearlyEqual(a: number, b: number) {
	return Math.abs(a - b) < 0.001;
}

function getEnabledSpeeds() {
	return [...config.get("player.ui.speedButtons")].sort((a, b) => a - b);
}

function getSpeedButtonSpeed(button: HTMLSpanElement) {
	return Number(button.getAttribute("speed"));
}

function isEnabledSpeed(speed: number) {
	return getEnabledSpeeds().some((enabledSpeed) => nearlyEqual(enabledSpeed, speed));
}

function isSpeedSliderEnabled() {
	return config.get("player.ui.enableSpeedButtons") && config.get("player.ui.enableSpeedSlider") && getEnabledSpeeds().length > 1;
}

function clampSpeed(speed: number) {
	const enabledSpeeds = getEnabledSpeeds();
	if (enabledSpeeds.length === 0) return speed;
	return Math.min(Math.max(speed, enabledSpeeds[0]), enabledSpeeds[enabledSpeeds.length - 1]);
}

function getCurrentPlaybackSpeed() {
	const speed = Number(videoPlayer.player?.getPlaybackRate?.() ?? videoPlayer.videoStream?.playbackRate ?? lastPlaybackSpeed);
	return Number.isFinite(speed) && speed > 0 ? speed : lastPlaybackSpeed;
}

function findFallbackSpeedButton(speed: number) {
	if (activeSpeedButton && isEnabledSpeed(getSpeedButtonSpeed(activeSpeedButton))) return activeSpeedButton;

	let fallback = null as HTMLSpanElement | null;
	for (const button of speedButtons) {
		const buttonSpeed = getSpeedButtonSpeed(button);
		if (!isEnabledSpeed(buttonSpeed)) continue;
		if (!fallback || Math.abs(buttonSpeed - speed) < Math.abs(getSpeedButtonSpeed(fallback) - speed)) {
			fallback = button;
		}
	}
	return fallback;
}

function updateSpeedButtonState(speed: number, preferredButton?: HTMLSpanElement | null) {
	const exactButton = speedButtons.find((button) => {
		const buttonSpeed = getSpeedButtonSpeed(button);
		return isEnabledSpeed(buttonSpeed) && nearlyEqual(buttonSpeed, speed);
	});
	const nextActiveButton =
		exactButton ||
		(isSpeedSliderEnabled() || preferredButton
			? preferredButton && isEnabledSpeed(getSpeedButtonSpeed(preferredButton))
				? preferredButton
				: findFallbackSpeedButton(speed)
			: null);

	speedButtons.forEach((button) => {
		const buttonSpeed = getSpeedButtonSpeed(button);
		button.dataset.speedLabel = formatSpeed(buttonSpeed);
		button.classList.remove("yttweak-speed-button-active");
	});

	activeSpeedButton = nextActiveButton ?? null;
	if (nextActiveButton) {
		nextActiveButton.dataset.speedLabel = formatSpeed(speed);
		nextActiveButton.classList.add("yttweak-speed-button-active");
	}
}

function getSliderProgress(speed: number) {
	const enabledSpeeds = getEnabledSpeeds();
	if (enabledSpeeds.length < 2) return 0;

	const clampedSpeed = clampSpeed(speed);
	const lastIndex = enabledSpeeds.length - 1;
	if (nearlyEqual(clampedSpeed, enabledSpeeds[0])) return 0;
	if (nearlyEqual(clampedSpeed, enabledSpeeds[lastIndex])) return 1;

	for (let i = 0; i < lastIndex; i++) {
		const start = enabledSpeeds[i];
		const end = enabledSpeeds[i + 1];
		if (clampedSpeed >= start && clampedSpeed <= end) {
			const segmentProgress = (clampedSpeed - start) / (end - start);
			return (i + segmentProgress) / lastIndex;
		}
	}
	return clampedSpeed < enabledSpeeds[0] ? 0 : 1;
}

function updateSliderPosition(speed: number) {
	speedButtonDiv?.style.setProperty("--yttweak-speed-slider-progress", `${getSliderProgress(speed) * 100}%`);
	if (speedSliderValue) {
		speedSliderValue.innerText = `${formatSpeed(speed)}x`;
	}
}

function hideSpeedSlider() {
	if (sliderTimer) clearTimeout(sliderTimer);
	sliderTimer = undefined;
	speedButtonDiv?.classList.remove("yttweak-speed-slider-active");
	speedButtonDiv?.classList.remove("yttweak-speed-slider-hide-buttons");
}

function showSpeedSlider(keepVisible = false, hideButtons = true) {
	if (!speedButtonDiv) return;
	speedButtonDiv.classList.add("yttweak-speed-slider-active");
	speedButtonDiv.classList.toggle("yttweak-speed-slider-hide-buttons", hideButtons);
	if (sliderTimer) clearTimeout(sliderTimer);
	sliderTimer = undefined;
	if (keepVisible) return;
	sliderTimer = setTimeout(() => {
		speedButtonDiv?.classList.remove("yttweak-speed-slider-active");
		speedButtonDiv?.classList.remove("yttweak-speed-slider-hide-buttons");
		sliderTimer = undefined;
	}, SLIDER_DISPLAY_MS);
}

function applySpeedButtonConfigState() {
	if (config.get("player.ui.enableSpeedButtons")) {
		document.body.setAttribute("yttweak-enable-speed-button", config.get("player.ui.speedButtons").join(" "));
	} else {
		document.body.removeAttribute("yttweak-enable-speed-button");
	}

	if (isSpeedSliderEnabled()) {
		document.body.setAttribute("yttweak-enable-speed-slider", "");
	} else {
		document.body.removeAttribute("yttweak-enable-speed-slider");
		hideSpeedSlider();
	}

	updateSliderPosition(lastPlaybackSpeed);
	updateSpeedButtonState(lastPlaybackSpeed);
}

async function persistPlaybackSpeed(speed: number) {
	if (config.get("player.settings.saveSpeed")) {
		await memory.set("", "s", speed);
	}
	if (config.get("player.settings.saveSpeedByChannel")) {
		const channelId = getChannelId();
		if (channelId) {
			await memory.set(channelId, "s", speed);
		}
	}
}

async function setPlaybackSpeed(speed: number, options: { persist?: boolean; preferredButton?: HTMLSpanElement | null } = {}) {
	speed = Number(speed.toFixed(2));
	lastPlaybackSpeed = speed;
	videoPlayer.player?.setPlaybackRate(speed);
	if (videoPlayer.videoStream) videoPlayer.videoStream.playbackRate = speed;
	logger.info("Set playback rate:", speed);

	updateSpeedButtonState(speed, options.preferredButton);
	updateSliderPosition(speed);

	if (options.persist) {
		await persistPlaybackSpeed(speed);
	}
}

function getSpeedFromSliderClientX(clientX: number) {
	const enabledSpeeds = getEnabledSpeeds();
	if (!speedButtonDiv || enabledSpeeds.length < 2) return getCurrentPlaybackSpeed();

	const rect = speedButtonDiv.getBoundingClientRect();
	const trackLeft = rect.left + SLIDER_TRACK_SIDE_OFFSET;
	const trackWidth = Math.max(rect.width - SLIDER_TRACK_SIDE_OFFSET * 2, 1);
	const progress = Math.min(Math.max((clientX - trackLeft) / trackWidth, 0), 1);
	const segmentPosition = progress * (enabledSpeeds.length - 1);
	const segmentIndex = Math.min(Math.floor(segmentPosition), enabledSpeeds.length - 2);
	const segmentProgress = segmentPosition - segmentIndex;
	const start = enabledSpeeds[segmentIndex];
	const end = enabledSpeeds[segmentIndex + 1];
	return clampSpeed(Number((start + (end - start) * segmentProgress).toFixed(2)));
}

function getEventSpeedButton(target: EventTarget | null) {
	return target instanceof Element ? (target.closest(".yttweak-speed-button") as HTMLSpanElement | null) : null;
}

function handleSpeedWheel(e: WheelEvent) {
	if (!isSpeedSliderEnabled()) return;

	e.preventDefault();
	e.stopPropagation();

	const enabledSpeeds = getEnabledSpeeds();
	const currentSpeed = clampSpeed(getCurrentPlaybackSpeed());
	let nextSpeed = currentSpeed;
	if (config.get("player.ui.speedSliderWheelMode") === "speedButtons") {
		if (e.deltaY < 0) {
			nextSpeed = enabledSpeeds[enabledSpeeds.length - 1];
			for (const speed of enabledSpeeds) {
				if (speed > currentSpeed + 0.001) {
					nextSpeed = speed;
					break;
				}
			}
		} else {
			nextSpeed = enabledSpeeds[0];
			for (let i = enabledSpeeds.length - 1; i >= 0; i--) {
				if (enabledSpeeds[i] < currentSpeed - 0.001) {
					nextSpeed = enabledSpeeds[i];
					break;
				}
			}
		}
	} else {
		const configuredStep = Number(config.get("player.ui.speedSliderStep"));
		const step = Number.isFinite(configuredStep) && configuredStep > 0 ? configuredStep : 0.25;
		nextSpeed = clampSpeed(Number((currentSpeed + (e.deltaY < 0 ? step : -step)).toFixed(2)));
	}
	const preferredButton = activeSpeedButton || getEventSpeedButton(e.target) || findFallbackSpeedButton(currentSpeed);
	showSpeedSlider();
	void setPlaybackSpeed(nextSpeed, { persist: true, preferredButton });
}

function handleSpeedPointerDown(e: PointerEvent) {
	if (!isSpeedSliderEnabled() || e.button !== 0) return;

	isDraggingSpeedSlider = true;
	hasDraggedSpeedSlider = false;
	dragStartX = e.clientX;
	dragStartSpeedButton = getEventSpeedButton(e.target);
	updateSliderPosition(getCurrentPlaybackSpeed());
}

function handleDocumentPointerMove(e: PointerEvent) {
	if (!isDraggingSpeedSlider || !isSpeedSliderEnabled()) return;
	if (!hasDraggedSpeedSlider && Math.abs(e.clientX - dragStartX) < DRAG_THRESHOLD) return;

	const currentSpeed = getCurrentPlaybackSpeed();
	const speed = getSpeedFromSliderClientX(e.clientX);
	if (!hasDraggedSpeedSlider && nearlyEqual(speed, currentSpeed)) return;

	if (!hasDraggedSpeedSlider) {
		try {
			speedButtonDiv?.setPointerCapture(e.pointerId);
		} catch {}
	}
	hasDraggedSpeedSlider = true;
	e.preventDefault();
	e.stopPropagation();
	showSpeedSlider(true);
	void setPlaybackSpeed(speed, { persist: true, preferredButton: activeSpeedButton || findFallbackSpeedButton(speed) });
}

function handleDocumentPointerUp(e: PointerEvent) {
	if (!isDraggingSpeedSlider) return;

	const clickedSpeedButton = !hasDraggedSpeedSlider ? dragStartSpeedButton : null;
	suppressNextSpeedClick = hasDraggedSpeedSlider || !!clickedSpeedButton;
	isDraggingSpeedSlider = false;
	hasDraggedSpeedSlider = false;
	dragStartSpeedButton = null;
	hideSpeedSlider();
	if (clickedSpeedButton) {
		e.preventDefault();
		e.stopPropagation();
		void setPlaybackSpeed(getSpeedButtonSpeed(clickedSpeedButton), { persist: true, preferredButton: clickedSpeedButton });
	}
	if (suppressNextSpeedClick) {
		setTimeout(() => {
			suppressNextSpeedClick = false;
		}, 0);
	}
}

async function setMemorySpeed() {
	let speed;
	const channelId = getChannelId();

	if (!channelId) {
		return;
	}

	if (config.get("player.settings.saveSpeedByChannel")) {
		if (channelId) {
			const memorySpeed = await memory.get(channelId, "s");
			if (memorySpeed) {
				speed = memorySpeed;
				logger.info(`Set playback rate(memory ${channelId}):`, speed);
			}
		}
	}

	if (!speed && config.get("player.settings.saveSpeed")) {
		const memorySpeed = await memory.get("", "s");
		if (memorySpeed) {
			speed = memorySpeed;
			logger.info(`Set playback rate(memory default):`, speed);
		}
	}
	if (!speed) return;
	speed = Number(speed);

	if (config.get("player.settings.saveSpeedByChannel")) {
		await memory.set(channelId, "s", speed);
	}

	await setPlaybackSpeed(speed);
}

function mountSpeedButtonStrip() {
	if (!videoPlayer.controls || !speedButtonDiv) {
		return;
	}

	const rightControls = videoPlayer.controls.querySelector(".ytp-right-controls");
	if (speedButtonDiv.parentElement !== videoPlayer.controls) {
		videoPlayer.controls.insertBefore(speedButtonDiv, rightControls || null);
	}
}

export default {
	"player.ui.enableSpeedButtons": {
		enable() {
			applySpeedButtonConfigState();
		},
		disable() {
			document.body.removeAttribute("yttweak-enable-speed-button");
			document.body.removeAttribute("yttweak-enable-speed-slider");
			hideSpeedSlider();
		},
		initPlayer() {
			if (!speedButtonDiv) {
				speedButtonDiv = document.createElement("div");
				speedButtonDiv.className = "yttweak-speed-buttons";
				const speedSlider = document.createElement("div");
				const speedSliderTrack = document.createElement("div");
				const speedSliderFill = document.createElement("div");
				const speedSliderThumb = document.createElement("div");
				const speedButtonTrack = document.createElement("div");
				speedSliderValue = document.createElement("div");
				speedSlider.className = "yttweak-speed-slider";
				speedSliderTrack.className = "yttweak-speed-slider-track";
				speedSliderFill.className = "yttweak-speed-slider-fill";
				speedSliderThumb.className = "yttweak-speed-slider-thumb";
				speedButtonTrack.className = "yttweak-speed-button-track";
				speedSliderValue.className = "yttweak-speed-slider-value";
				speedSliderTrack.append(speedSliderFill, speedSliderThumb);
				speedSlider.append(speedSliderValue);
				speedSlider.append(speedSliderTrack);
				speedButtonDiv.appendChild(speedSlider);
				speedButtonDiv.appendChild(speedButtonTrack);
				speedButtonDiv.addEventListener("wheel", handleSpeedWheel, { passive: false });
				speedButtonDiv.addEventListener("pointerdown", handleSpeedPointerDown);
				document.addEventListener("pointermove", handleDocumentPointerMove, true);
				document.addEventListener("pointerup", handleDocumentPointerUp, true);

				for (let speed of [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 5, 10]) {
					const speedButton = document.createElement("span");
					speedButton.className = `yttweak-speed-button`;
					speedButton.setAttribute("speed", `${speed}`);
					speedButton.dataset.speedLabel = formatSpeed(speed);
					speedButton.onclick = async () => {
						if (suppressNextSpeedClick) {
							suppressNextSpeedClick = false;
							return;
						}
						await setPlaybackSpeed(speed, { persist: true, preferredButton: speedButton });
					};
					speedButtons.push(speedButton);
					speedButtonTrack.appendChild(speedButton);
				}
			}

			mountSpeedButtonStrip();
			applySpeedButtonConfigState();
			setMemorySpeed();
		},
		videoSrcChange(oldValue, newValue) {
			setMemorySpeed();
		},
		configUpdate(oldConfig, newConfig) {
			const oldSpeedButtons = oldConfig["player.ui.speedButtons"] ?? config.get("player.ui.speedButtons");
			const newSpeedButtons = newConfig["player.ui.speedButtons"] ?? config.get("player.ui.speedButtons");
			const hasUpdate =
				oldSpeedButtons.join(",") !== newSpeedButtons.join(",") ||
				oldConfig["player.ui.enableSpeedSlider"] !== newConfig["player.ui.enableSpeedSlider"] ||
				oldConfig["player.ui.speedSliderWheelMode"] !== newConfig["player.ui.speedSliderWheelMode"] ||
				oldConfig["player.ui.speedSliderStep"] !== newConfig["player.ui.speedSliderStep"];

			if (hasUpdate) {
				applySpeedButtonConfigState();
			}
			return false;
		},
	},
} as Record<string, Plugin>;

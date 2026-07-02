import config from "../config";
import { createLogger } from "../../logger";
import type { Plugin } from "../types";
import { videoPlayer } from "../mainWorld";
import { touchPlayer } from "../util/helper";

const logger = createLogger("player-function-buttons");

let enableFunctionCount = 0;

let playerTransformStyle: HTMLStyleElement | null = null;
export let yttBtnBox: HTMLDivElement | null = null;
let yttBtnRotate: HTMLSpanElement | null = null;
let yttBtnMirror: HTMLSpanElement | null = null;
let yttBtnScreenshot: HTMLSpanElement | null = null;

let rotation = 0;
let isMirror = false;

function ensurePlayerTransformStyle() {
	if (playerTransformStyle) return;

	playerTransformStyle = document.createElement("style");
	playerTransformStyle.id = "yttweak-player-transform";
	document.head.appendChild(playerTransformStyle);
}

function updatePlayerTransformStyle() {
	ensurePlayerTransformStyle();
	if (!playerTransformStyle || !videoPlayer.videoStream || !videoPlayer.player) return;

	let transformStr = `rotate(${rotation}deg)`;

	if (isMirror) {
		transformStr += " scaleX(-1)";
	}

	if (rotation == 90 || rotation == 270) {
		if (videoPlayer.videoStream.videoHeight > videoPlayer.videoStream.videoWidth) {
			transformStr += ` scale(${videoPlayer.player.clientWidth / videoPlayer.player.clientHeight})`;
		} else {
			transformStr += ` scale(${videoPlayer.player.clientHeight / videoPlayer.player.clientWidth})`;
		}
	}

	playerTransformStyle.textContent = `
		.html5-video-player video {
			transform: ${transformStr} !important;
		}
	`;
}

function sanitizeFileName(value: string) {
	return (
		value
			.replace(/[<>:"/\\|?*\x00-\x1f]/g, " ")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 120) || "youtube-video"
	);
}

function formatTimestamp(seconds: number) {
	const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
	const h = Math.floor(safeSeconds / 3600);
	const m = Math.floor((safeSeconds % 3600) / 60);
	const s = safeSeconds % 60;

	return h > 0
		? `${h.toString().padStart(2, "0")}-${m.toString().padStart(2, "0")}-${s.toString().padStart(2, "0")}`
		: `${m.toString().padStart(2, "0")}-${s.toString().padStart(2, "0")}`;
}

function getScreenshotFileName(video: HTMLVideoElement) {
	const title =
		videoPlayer.player?.getVideoData?.()?.title ||
		videoPlayer.player?.getPlayerResponse?.()?.videoDetails?.title ||
		document.title.replace(/\s+-\s+YouTube$/, "");

	return `${sanitizeFileName(title)}-${formatTimestamp(video.currentTime)}.png`;
}

function prepareScreenshotWindowDocument(screenshotWindow: Window) {
	const screenshotDocument = screenshotWindow.document;
	screenshotWindow.stop();
	screenshotDocument.title = "YouTube screenshot - Ctrl+S to save";

	const head = screenshotDocument.head || screenshotDocument.documentElement.appendChild(screenshotDocument.createElement("head"));
	const body = screenshotDocument.body || screenshotDocument.documentElement.appendChild(screenshotDocument.createElement("body"));
	if (!screenshotDocument.getElementById("yttweak-screenshot-window-style")) {
		const style = screenshotDocument.createElement("style");
		style.id = "yttweak-screenshot-window-style";
		style.textContent = `
			html,
			body {
				margin: 0;
				width: 100%;
				height: 100%;
				background: #111;
				color: #fff;
				font-family: system-ui, sans-serif;
			}
			body {
				display: flex;
				align-items: center;
				justify-content: center;
			}
			img {
				display: block;
				max-width: 100%;
				max-height: 100%;
				object-fit: contain;
			}
			.yttweak-screenshot-message {
				padding: 24px;
				text-align: center;
				font-size: 14px;
			}
		`;
		head.appendChild(style);
	}

	return body;
}

function showScreenshotWindowMessage(screenshotWindow: Window | null, message: string) {
	try {
		if (!screenshotWindow || screenshotWindow.closed) return;
		const body = prepareScreenshotWindowDocument(screenshotWindow);
		body.replaceChildren();
		const messageElement = screenshotWindow.document.createElement("div");
		messageElement.className = "yttweak-screenshot-message";
		messageElement.textContent = message;
		body.appendChild(messageElement);
	} catch (error) {
		logger.warn("Failed to update video screenshot window:", error);
	}
}

function openScreenshotWindow() {
	const popupWidth = Math.min(Math.max(videoPlayer.videoStream?.videoWidth ?? 1280, 640), 1600);
	const popupHeight = Math.min(Math.max(videoPlayer.videoStream?.videoHeight ?? 720, 420), 1000);
	const screenshotWindow = window.open("about:blank", "_blank", `popup=yes,width=${popupWidth},height=${popupHeight}`);

	if (!screenshotWindow) {
		logger.warn("Failed to open video screenshot window.");
		return null;
	}

	showScreenshotWindowMessage(screenshotWindow, "Generating screenshot...");
	screenshotWindow.focus();

	return screenshotWindow;
}

function showScreenshotBlob(screenshotWindow: Window | null, blob: Blob, fileName: string) {
	if (!screenshotWindow || screenshotWindow.closed) {
		return;
	}

	const imageUrl = URL.createObjectURL(blob);
	try {
		const body = prepareScreenshotWindowDocument(screenshotWindow);
		body.replaceChildren();

		const image = screenshotWindow.document.createElement("img");
		image.src = imageUrl;
		image.alt = fileName;
		image.title = "Press Ctrl+S to save";
		body.appendChild(image);
		screenshotWindow.addEventListener(
			"keydown",
			(event) => {
				if (!event.ctrlKey || event.key.toLowerCase() !== "s") {
					return;
				}

				event.preventDefault();
				event.stopPropagation();

				const link = screenshotWindow.document.createElement("a");
				link.href = imageUrl;
				link.download = fileName;
				link.style.display = "none";
				body.appendChild(link);
				link.click();
				link.remove();
			},
			true,
		);
		screenshotWindow.addEventListener("unload", () => URL.revokeObjectURL(imageUrl), { once: true });
		screenshotWindow.focus();
	} catch (error) {
		URL.revokeObjectURL(imageUrl);
		logger.warn("Failed to show video screenshot window:", error);
	}
}

function downloadCurrentVideoFrame() {
	touchPlayer();

	const video = videoPlayer.videoStream;
	if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
		logger.warn("Video frame is not ready for screenshot.");
		return;
	}

	const canvas = document.createElement("canvas");
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;

	const context = canvas.getContext("2d");
	if (!context) {
		logger.warn("Canvas 2D context is not available.");
		return;
	}

	const screenshotWindow = openScreenshotWindow();
	if (!screenshotWindow) return;

	try {
		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		canvas.toBlob((blob) => {
			if (!blob) {
				logger.warn("Failed to export video screenshot.");
				showScreenshotWindowMessage(screenshotWindow, "Failed to generate screenshot.");
				return;
			}

			showScreenshotBlob(screenshotWindow, blob, getScreenshotFileName(video));
		}, "image/png");
	} catch (error) {
		logger.error("Failed to capture video screenshot:", error);
		showScreenshotWindowMessage(screenshotWindow, "Failed to generate screenshot.");
	}
}

export function createBox() {
	ensurePlayerTransformStyle();
	if (!yttBtnBox) {
		let leftControls = videoPlayer.player?.querySelector(".ytp-left-controls");
		if (!leftControls) return;

		// box
		yttBtnBox = document.createElement("div");
		yttBtnBox.className = "yttweak-player-function-buttons";
		yttBtnBox.style.display = enableFunctionCount <= 0 ? "none" : "flex";
		leftControls.insertBefore(yttBtnBox, leftControls.querySelector(".ytp-volume-area"));
	}
}

export function updateFuncBtnStatus(enable = true) {
	enable ? enableFunctionCount++ : enableFunctionCount--;
	if (yttBtnBox) yttBtnBox.style.display = enableFunctionCount <= 0 ? "none" : "flex";
}

export default {
	"player.ui.functionButtons.enableRotateButton": {
		initPlayer() {
			createBox();

			if (!yttBtnRotate) {
				yttBtnRotate = document.createElement("span");
				yttBtnRotate.className = "yttweak-function-button-rotate";
				yttBtnRotate.title = "Rotate Video";
				yttBtnRotate.setAttribute("text", `${rotation}`);
				yttBtnRotate.onclick = () => {
					touchPlayer();
					rotation = (rotation + 90) % 360;
					yttBtnRotate?.setAttribute("text", `${rotation}`);
					updatePlayerTransformStyle();
				};
				yttBtnBox?.appendChild(yttBtnRotate);
			}
		},
		enable() {
			document.body.classList.add("yttweak-player-enable-rotate-button");
			updateFuncBtnStatus(true);
		},
		disable() {
			document.body.classList.remove("yttweak-player-enable-rotate-button");
			updateFuncBtnStatus(false);
		},
	},
	"player.ui.functionButtons.enableMirrorButton": {
		initPlayer() {
			createBox();

			// mirror button
			if (!yttBtnMirror) {
				yttBtnMirror = document.createElement("span");
				yttBtnMirror.className = "yttweak-function-button-mirror";
				yttBtnMirror.title = "Mirror Video";
				yttBtnMirror.setAttribute("text", `➡`);
				yttBtnMirror.onclick = () => {
					touchPlayer();
					isMirror = !isMirror;
					yttBtnMirror?.setAttribute("text", isMirror ? `⬅` : `➡`);
					updatePlayerTransformStyle();
				};
				yttBtnBox?.appendChild(yttBtnMirror);
			}
		},
		enable() {
			document.body.classList.add("yttweak-player-enable-mirror-button");
			updateFuncBtnStatus(true);
		},
		disable() {
			document.body.classList.remove("yttweak-player-enable-mirror-button");
			updateFuncBtnStatus(false);
		},
	},
	"player.ui.functionButtons.enableScreenshotButton": {
		initPlayer() {
			createBox();

			if (!yttBtnScreenshot) {
				yttBtnScreenshot = document.createElement("span");
				yttBtnScreenshot.className = "yttweak-function-button-screenshot";
				yttBtnScreenshot.title = "Download current video frame";
				yttBtnScreenshot.setAttribute("role", "button");
				yttBtnScreenshot.setAttribute("aria-label", "Download current video frame");
				yttBtnScreenshot.onclick = (event) => {
					event.preventDefault();
					event.stopPropagation();
					downloadCurrentVideoFrame();
				};
				yttBtnBox?.appendChild(yttBtnScreenshot);
			}
		},
		enable() {
			document.body.classList.add("yttweak-player-enable-screenshot-button");
			updateFuncBtnStatus(true);
		},
		disable() {
			document.body.classList.remove("yttweak-player-enable-screenshot-button");
			updateFuncBtnStatus(false);
		},
	},
} as Record<string, Plugin>;

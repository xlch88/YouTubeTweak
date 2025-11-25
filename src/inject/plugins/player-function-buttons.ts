import config from "../config";
import { createLogger } from "../../logger";
import type { Plugin } from "../types";
import { videoPlayer } from "../mainWorld";

let enableFunctionCount = 0;

let playerTransformStyle: HTMLStyleElement | null = null;
let yttBtnBox: HTMLDivElement | null = null;
let yttBtnRotate: HTMLSpanElement | null = null;
let yttBtnMirror: HTMLSpanElement | null = null;

let rotation = 0;
let isMirror = false;

function updatePlayerTransformStyle() {
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

function initPlayer() {
	if (!playerTransformStyle) {
		playerTransformStyle = document.createElement("style");
		playerTransformStyle.id = "yttweak-player-transform";
		document.head.appendChild(playerTransformStyle);
	}
	if (!yttBtnBox) {
		let leftControls = videoPlayer.player?.querySelector(".ytp-left-controls");
		if (!leftControls) return;

		// box
		yttBtnBox = document.createElement("div");
		yttBtnBox.className = "yttweak-player-function-buttons";
		yttBtnBox.style.display = enableFunctionCount <= 0 ? "none" : "flex";
		leftControls.insertBefore(yttBtnBox, leftControls.querySelector(".ytp-volume-area"));

		// rotate button
		yttBtnRotate = document.createElement("span");
		yttBtnRotate.className = "yttweak-function-button-rotate";
		yttBtnRotate.title = "Rotate Video";
		yttBtnRotate.setAttribute("text", `${rotation}`);
		yttBtnRotate.onclick = () => {
			rotation = (rotation + 90) % 360;
			yttBtnRotate?.setAttribute("text", `${rotation}`);
			updatePlayerTransformStyle();
		};
		yttBtnBox.appendChild(yttBtnRotate);

		// mirror button
		yttBtnMirror = document.createElement("span");
		yttBtnMirror.className = "yttweak-function-button-mirror";
		yttBtnMirror.title = "Mirror Video";
		yttBtnMirror.setAttribute("text", `➡`);
		yttBtnMirror.onclick = () => {
			isMirror = !isMirror;
			yttBtnMirror?.setAttribute("text", isMirror ? `⬅` : `➡`);
			updatePlayerTransformStyle();
		};
		yttBtnBox.appendChild(yttBtnMirror);
	}
}

export default {
	"player.ui.functionButtons.enableRotateButton": {
		initPlayer,
		enable() {
			document.body.classList.add("yttweak-player-enable-rotate-button");
			enableFunctionCount++;
			if (yttBtnBox) yttBtnBox.style.display = enableFunctionCount <= 0 ? "none" : "flex";
		},
		disable() {
			document.body.classList.remove("yttweak-player-enable-rotate-button");
			enableFunctionCount--;
			if (yttBtnBox) yttBtnBox.style.display = enableFunctionCount <= 0 ? "none" : "flex";
		},
	},
	"player.ui.functionButtons.enableMirrorButton": {
		initPlayer,
		enable() {
			document.body.classList.add("yttweak-player-enable-mirror-button");
			enableFunctionCount++;
			if (yttBtnBox) yttBtnBox.style.display = enableFunctionCount <= 0 ? "none" : "flex";
		},
		disable() {
			document.body.classList.remove("yttweak-player-enable-mirror-button");
			enableFunctionCount--;
			if (yttBtnBox) yttBtnBox.style.display = enableFunctionCount <= 0 ? "none" : "flex";
		},
	},
} as Record<string, Plugin>;

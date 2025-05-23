import config from "../config.js";
import { videoPlayer } from "../isolatedWorld.js";
import { createLogger } from "../../logger.js";
const logger = createLogger("player-speedButton");

export default {
	"player.ui.enableSpeedButtons": {
		enable() {
			document.body.setAttribute("yttweak-enable-speed-button", config.get("player.ui.speedButtons").join(" "));
		},
		disable() {
			document.body.removeAttribute("yttweak-enable-speed-button");
		},
		initPlayer() {
			const speedButtonDiv = document.createElement("div");
			speedButtonDiv.className = "yttweak-speed-buttons";
			const speedButtons = [];
			for (let speed of [0.25, 0.5, 1, 1.25, 1.5, 2, 3]) {
				const speedButton = document.createElement("span");
				speedButton.className = `yttweak-speed-button`;
				speedButton.setAttribute("speed", `${speed}`);
				speedButton.onclick = () => {
					videoPlayer.videoStream.playbackRate = speed;
					logger.info("Set playback rate:", speed);

					speedButtons.forEach((v) => {
						v.classList.remove("yttweak-speed-button-active");
					});
					speedButton.classList.add("yttweak-speed-button-active");
				};
				// if (speedButtonActive === speed) speedButton.classList.add("ytp-speed-button-active");
				speedButtons.push(speedButton);
				speedButtonDiv.appendChild(speedButton);
			}
			videoPlayer.controls.insertBefore(speedButtonDiv, videoPlayer.controls.querySelector(".ytp-left-controls").nextSibling);
		},
		configUpdate(oldConfig, newConfig) {
			return oldConfig["player.ui.speedButtons"].join(",") !== newConfig["player.ui.speedButtons"].join(",");
		},
	},
};

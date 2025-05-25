import { videoPlayer } from "../isolatedWorld.js";

export function bodyClass(className) {
	return {
		enable: () => {
			document.body.classList.add(className);
		},
		disable: () => {
			document.body.classList.remove(className);
		},
	};
}

export function checkPlayerAD() {
	return videoPlayer.player?.querySelector(".video-ads")?.childNodes.length > 0;
}

import config from "../config.js";

export default {
	"index.videoPerRow.enable": {
		enable() {
			document.body.classList.add("yttweak-lock-pre-row");
			let style = document.getElementById("yttweak-style-video-per-row");

			if (!style) {
				style = document.createElement("style");
				style.id = "yttweak-style-video-per-row";
				document.head.appendChild(style);
			}

			style.innerText = `ytd-rich-grid-renderer{ --ytd-rich-grid-items-per-row: ${config.get("index.videoPerRow.count")} !important }`;
		},
		disable() {
			document.body.classList.remove("yttweak-lock-pre-row");
			document.getElementById("yttweak-style-video-per-row")?.remove();
		},
		configUpdate(oldConfig, newConfig) {
			return oldConfig["index.videoPerRow.count"] !== newConfig["index.videoPerRow.count"];
		},
	},
};

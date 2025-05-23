import { createPlayerAPIProxy } from "../helper.js";
import { createLogger } from "../../logger.js";
import config from "../config.js";
import { videoPlayer } from "../isolatedWorld.js";
const logger = createLogger("player-lockQuality");

const qualityList = ["highres", "hd2160", "hd1440", "hd1080", "hd720", "large", "medium", "small", "tiny"];
let pageUrl = window.location.href;
let playerApi;

async function setQuality() {
	const qualityLevels = (await playerApi.getAvailableQualityLevels()) || [];
	logger.info("available quality levels:", qualityLevels);

	let toQuality = config.get("player.settings.lockQuality.value");
	toQuality = qualityList.slice(qualityList.indexOf(toQuality)).find((q) => qualityLevels.includes(q)) || null;

	if (toQuality) {
		playerApi.setPlaybackQuality(toQuality);
		playerApi.setPlaybackQualityRange(toQuality);
	}
	logger.info("set playback quality", toQuality);
}

export default {
	"player.settings.lockQuality": {
		enable() {
			if (!playerApi) return;
			setQuality();
		},
		initPlayer() {
			if (!config.get("player.settings.lockQuality")) return;

			playerApi = createPlayerAPIProxy();
			setQuality();

			let observer = new MutationObserver((mutationList) => {
				mutationList.forEach((mutation) => {
					if (mutation.type !== "attributes" || mutation.attributeName !== "src") return;

					if (pageUrl !== window.location.href) {
						pageUrl = window.location.href;
						setQuality();
					}

					logger.warn("video src changed", mutation.target.src);
				});
			});
			observer.observe(videoPlayer.videoStream, { attributes: true });
		},
		configUpdate(oldConfig, newConfig) {
			return oldConfig["player.settings.lockQuality.value"] !== newConfig["player.settings.lockQuality.value"];
		},
	},
};

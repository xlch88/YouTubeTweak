import { createLogger } from "../../logger.js";
import config from "../config.js";
import { videoPlayer } from "../isolatedWorld.js";
const logger = createLogger("player-lockQuality");

const qualityList = ["highres", "hd2160", "hd1440", "hd1080", "hd720", "large", "medium", "small", "tiny"];
let pageUrl = window.location.href;

async function setQuality() {
	const qualityLevels = (await videoPlayer.playerApi.getAvailableQualityLevels()) || [];
	logger.info("available quality levels:", qualityLevels);

	let toQuality = config.get("player.settings.lockQuality.value");
	toQuality = qualityList.slice(qualityList.indexOf(toQuality)).find((q) => qualityLevels.includes(q)) || null;

	if (toQuality) {
		videoPlayer.playerApi.setPlaybackQuality(toQuality);
		videoPlayer.playerApi.setPlaybackQualityRange(toQuality);
	}
	logger.info("set playback quality", toQuality);
}

export default {
	"player.settings.lockQuality": {
		enable() {
			if (!videoPlayer.playerApi) return;
			setQuality();
		},
		initPlayer() {
			if (!config.get("player.settings.lockQuality")) return;
			setQuality();
		},
		videoSrcChange(oldValue, newValue, isAD) {
			if (!isAD && newValue && pageUrl !== window.location.href) {
				pageUrl = window.location.href;
				setQuality();
			}
		},
		configUpdate(oldConfig, newConfig) {
			return oldConfig["player.settings.lockQuality.value"] !== newConfig["player.settings.lockQuality.value"];
		},
	},
};

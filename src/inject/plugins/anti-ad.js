import { videoPlayer } from "../index.js";
import { bodyClass } from "../helper.js";
import { createLogger } from "../../logger.js";
const logger = createLogger("anti-ad");

let interval = null;

function antiAD() {
	if (videoPlayer.player?.querySelector(".video-ads")?.childNodes.length > 0) {
		// videoPlayer.videoStream.pause();
		if (!isNaN(videoPlayer.videoStream?.duration) && videoPlayer.videoStream?.duration > 0) {
			videoPlayer.videoStream.currentTime = videoPlayer.videoStream.duration;
			videoPlayer.videoStream.playbackRate = 16;
			logger.info("skip ad.");
		}
	});
	document.querySelectorAll("ytd-ad-slot-renderer").forEach((ad) => {
		if (ad?.parentElement?.parentElement && ad?.parentElement?.parentElement.tagName === "YTD-RICH-ITEM-RENDERER") {
			// ad.parentElement.parentElement.style.display = "none";
			ad.parentElement.parentElement?.remove();
			logger.debug("remove index ad:", ad.parentElement.parentElement);
		} else {
			ad.remove();
			logger.debug("remove ad:", ad.parentElement.parentElement);
		}
	});
}
const observer = new MutationObserver(antiAD);

export default {
	"other.antiAD.enable": {
		enable() {
			document.body.classList.add("yttweak-anti-ad");
		},
		disable() {
			antiAD(observer.takeRecords());
			observer.disconnect();
			document.body.classList.remove("yttweak-anti-ad");
		},
		initPlayer() {
			const adsEl = videoPlayer.player.querySelector(".video-ads");
			if (adsEl !== null) observer.observe(adsEl, { childList: true, subtree: true });
		},
	},
	"other.antiAD.enableMerch": bodyClass("yttweak-anti-ad-merch"),
};

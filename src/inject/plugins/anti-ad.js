import { videoPlayer } from "../mainWorld.js";
import { bodyClass } from "../util/helper.js";
import { createLogger } from "../../logger.js";
const logger = createLogger("anti-ad");

let antiADSlotInterval;

export default {
	"other.antiAD.enable": {
		enable() {
			document.body.classList.add("yttweak-anti-ad");

			antiADSlotInterval = setInterval(() => {
				document.querySelectorAll("ytd-ad-slot-renderer").forEach((ad) => {
					if (ad?.parentElement?.parentElement && ad?.parentElement?.parentElement.tagName === "YTD-RICH-ITEM-RENDERER") {
						// ad.parentElement.parentElement.style.display = "none";
						logger.debug("remove index ad:", ad.parentElement.parentElement);
						ad.parentElement.parentElement?.remove();
					} else {
						logger.debug("remove ad:", ad);
						ad.remove();
					}
				});

				let adBlockBlocker;
				if (
					(adBlockBlocker = document.querySelector("ytd-enforcement-message-view-model")) &&
					adBlockBlocker?.parentElement?.style?.display !== "none"
				) {
					let closeButton = adBlockBlocker?.querySelector("#dismiss-button .yt-spec-button-shape-next");
					if (closeButton) {
						logger.info("click adBlockBlocker close.");
						adBlockBlocker?.querySelector("#dismiss-button .yt-spec-button-shape-next")?.click?.();
					}
				}
			}, 1000);
		},
		disable() {
			antiADSlotInterval && clearInterval(antiADSlotInterval);
			document.body.classList.remove("yttweak-anti-ad");
		},
		videoSrcChange(oldValue, newValue, isAD) {
			if (isAD) {
				if (!isNaN(videoPlayer.videoStream?.duration) && videoPlayer.videoStream?.duration > 0) {
					videoPlayer.videoStream.currentTime = videoPlayer.videoStream.duration;
					videoPlayer.videoStream.playbackRate = 16;
					logger.info("skip video ad.");
				}
			}
		},
	},
	"other.antiAD.enableMerch": bodyClass("yttweak-anti-ad-merch"),
};

import { videoPlayer } from "../mainWorld.js";
import { bodyClass } from "../util/helper.js";
import { createLogger } from "../../logger.js";
import fetchHooker from "../fetchHooker.js";
import config from "../config.js";
const logger = createLogger("anti-ad");

let antiADSlotInterval;

export default {
	"other.antiAD.enable": {
		options: {
			reloadOnToggle: true,
		},
		setup() {
			if (
				(!config.get("other.antiAD.enable") && localStorage.getItem("YTTweak-plugin-AntiAD")) ||
				(config.get("other.antiAD.enable") && !localStorage.getItem("YTTweak-plugin-AntiAD"))
			) {
				logger.info("plugin status change. need to reload page !!!");
				debugger;

				config.get("other.antiAD.enable")
					? localStorage.setItem("YTTweak-plugin-AntiAD", "1")
					: localStorage.removeItem("YTTweak-plugin-AntiAD");
				location.reload();
			}
		},
		enable() {
			document.body.classList.add("yttweak-anti-ad");
			localStorage.setItem("YTTweak-plugin-AntiAD", "1");

			fetchHooker.hooks.antiAD = {
				match: "/youtubei/v1/player",
				mutator: true,
				handler(data) {
					if (data && typeof data === "object") {
						let isRemove = false;
						if ("adSlots" in data) {
							isRemove = true;
							delete data.adSlots;
						}
						if ("playerAds" in data) {
							isRemove = true;
							data.playerAds = [];
						}
						if ("adPlacements" in data) {
							isRemove = true;
							data.adPlacements = [];
						}
						// if (data?.auxiliaryUi?.messageRenderers?.bkaEnforcementMessageViewModel) {
						// 	logger.info("Removing adblockblock from player response");
						// 	delete data.auxiliaryUi;
						// }

						if (isRemove) logger.info("Removing adSlots from player response");
					}

					return data;
				},
			};

			antiADSlotInterval = setInterval(() => {
				document.querySelectorAll("ytd-ad-slot-renderer:not([ytt-hide])").forEach((ad) => {
					ad.setAttribute("ytt-hide", "1");
					if (ad?.parentElement?.parentElement && ad?.parentElement?.parentElement.tagName === "YTD-RICH-ITEM-RENDERER") {
						const parent = ad.parentElement.parentElement;
						parent.style.background = "red";
						parent.style.display = "none";
						logger.debug("remove index ad:", parent);
						// parent.remove();
					} else {
						logger.debug("remove ad:", ad);
						// ad.remove();
						ad.style.display = "none";
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
						if (videoPlayer.player.playVideo) {
							videoPlayer.player.playVideo();
						}
					}
				}
			}, 1000);
		},
		disable() {
			antiADSlotInterval && clearInterval(antiADSlotInterval);
			document.body.classList.remove("yttweak-anti-ad");
			localStorage.removeItem("YTTweak-plugin-AntiAD");
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

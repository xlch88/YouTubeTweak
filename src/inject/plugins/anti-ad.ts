// @ts-ignore
import { videoPlayer } from "../mainWorld.js";
// @ts-ignore
import { bodyClass } from "../util/helper.js";
// @ts-ignore
import { createLogger } from "../../logger.js";
// @ts-ignore
import fetchHooker from "../fetchHooker.js";
// @ts-ignore
import config from "../config.js";
// @ts-ignore
import { checkPlayerAD } from "../util/helper.js";
const logger = createLogger("anti-ad");

let antiADSlotInterval: null | number;
let antiVideoADSlotInterval: null | number = null;

const adVideoCheckTimeouts: number[] = [];

export default {
	"other.antiAD.enableVideo": {
		options: {
			reloadOnToggle: true,
		},
		setup() {
			if (
				(!config.get("other.antiAD.enableVideo") && localStorage.getItem("YTTweak-plugin-AntiVideoAD")) ||
				(config.get("other.antiAD.enableVideo") && !localStorage.getItem("YTTweak-plugin-AntiVideoAD"))
			) {
				logger.info("plugin status change. need to reload page !!!");
				debugger;

				config.get("other.antiAD.enableVideo")
					? localStorage.setItem("YTTweak-plugin-AntiVideoAD", "1")
					: localStorage.removeItem("YTTweak-plugin-AntiVideoAD");
				location.reload();
			}
		},
		enable() {
			document.body.classList.add("yttweak-anti-ad-video");
			localStorage.setItem("YTTweak-plugin-AntiVideoAD", "1");

			fetchHooker.hooks.antiAD = {
				match: "/youtubei/v1/player",
				mutator: true,
				handler(data: object) {
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

						// !!! Removing this will cause the video to not play !!!
						// if (data?.auxiliaryUi?.messageRenderers?.bkaEnforcementMessageViewModel) {
						// 	logger.info("Removing adblockblock from player response");
						// 	delete data.auxiliaryUi;
						// }

						if (isRemove) logger.info("Removing adSlots from player response");
					}

					return data;
				},
			};

			antiVideoADSlotInterval = window.setInterval(() => {
				let adBlockBlocker;
				if (
					(adBlockBlocker = document.querySelector("ytd-enforcement-message-view-model")) &&
					adBlockBlocker?.parentElement?.style?.display !== "none"
				) {
					let closeButton = adBlockBlocker?.querySelector("#dismiss-button .yt-spec-button-shape-next");
					if (closeButton) {
						logger.info("click adBlockBlocker close.");
						//(adBlockBlocker?.querySelector("#dismiss-button .yt-spec-button-shape-next") as HTMLElement | null)?.click?.();
						if (videoPlayer.player.playVideo) {
							videoPlayer.player.playVideo();
						}
					}
				}
			}, 1000);
		},
		disable() {
			antiVideoADSlotInterval && clearInterval(antiVideoADSlotInterval);
			document.body.classList.remove("yttweak-anti-ad-video");
			localStorage.removeItem("YTTweak-plugin-AntiVideoAD");
		},
		videoSrcChange(oldValue: object, newValue: object) {
			adVideoCheckTimeouts.forEach((t) => clearTimeout(t));
			adVideoCheckTimeouts.length = 0;

			const checkCount = 50;
			for (let i = 1; i <= checkCount; i++) {
				adVideoCheckTimeouts.push(
					window.setTimeout(() => {
						const isAD = checkPlayerAD();
						if (isAD) {
							if (!isNaN(videoPlayer.videoStream?.duration) && videoPlayer.videoStream?.duration > 0) {
								videoPlayer.videoStream.currentTime = videoPlayer.videoStream.duration;
								videoPlayer.videoStream.playbackRate = 16;
								logger.info("skip video ad.");
							}
						}
						if (isAD || i === checkCount) {
							adVideoCheckTimeouts.forEach((t) => clearTimeout(t));
							adVideoCheckTimeouts.length = 0;
						}
					}, 100 * i),
				);
			}
		},
	},
	"other.antiAD.enable": {
		enable() {
			document.body.classList.add("yttweak-anti-ad");

			antiADSlotInterval = window.setInterval(() => {
				document.querySelectorAll<HTMLElement>("ytd-ad-slot-renderer:not([ytt-hide])").forEach((ad) => {
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
			}, 1000);
		},
		disable() {
			antiADSlotInterval && clearInterval(antiADSlotInterval);
			document.body.classList.remove("yttweak-anti-ad");
		},
	},
	"other.antiAD.enableMerch": bodyClass("yttweak-anti-ad-merch"),
};

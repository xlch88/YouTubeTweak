import { videoPlayer } from "../mainWorld";
import { bodyClass } from "../util/helper";
import { createLogger } from "../../logger";
import fetchHooker from "../fetchHooker";
import config from "../config";
import { checkPlayerAD } from "../util/helper";
import type { Plugin } from "../types";
const logger = createLogger("anti-ad");

let antiADSlotInterval: null | number;
let antiVideoADSlotInterval: null | number = null;

const adVideoCheckTimeouts: number[] = [];

export default {
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
	"other.premiumLogo.enable": {
		options: {
			reloadOnToggle: true,
		},
		setup() {
			const premiumLogoEnabled = config.get("other.premiumLogo.enable");
			const logoCountryCode = config.get("other.logoCountryCode");
			let needsReload = false;

			if (
				(!premiumLogoEnabled && localStorage.getItem("YTTweak-plugin-PremiumLogo")) ||
				(premiumLogoEnabled && !localStorage.getItem("YTTweak-plugin-PremiumLogo"))
			) {
				premiumLogoEnabled
					? localStorage.setItem("YTTweak-plugin-PremiumLogo", "1")
					: localStorage.removeItem("YTTweak-plugin-PremiumLogo");
				needsReload = true;
			}
			if ((localStorage.getItem("YTTweak-plugin-LogoCountryCode") ?? "") !== logoCountryCode) {
				logoCountryCode
					? localStorage.setItem("YTTweak-plugin-LogoCountryCode", logoCountryCode)
					: localStorage.removeItem("YTTweak-plugin-LogoCountryCode");
				needsReload = true;
			}
			if (needsReload) location.reload();

			if (!premiumLogoEnabled && !logoCountryCode) return;

			fetchHooker.addHook("antiAD-get_watch", {
				match: "/youtubei/v1/get_watch",
				mutator: true,
				handler(data: any) {
					const topbar = data?.[1]?.watchNextResponse?.topbar;

					if (premiumLogoEnabled) {
						const iconImage = topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage;
						if (iconImage) {
							iconImage.iconType = "YOUTUBE_PREMIUM_LOGO";
						}
					}
					if (logoCountryCode && topbar?.desktopTopbarRenderer) {
						topbar.desktopTopbarRenderer.countryCode = logoCountryCode;
					}

					return data;
				},
			});

			fetchHooker.addHook("antiAD-next", {
				match: "/youtubei/v1/next",
				mutator: true,
				handler(data: any) {
					const topbar = data?.topbar;

					if (premiumLogoEnabled) {
						const iconImage = topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage;
						if (iconImage) {
							iconImage.iconType = "YOUTUBE_PREMIUM_LOGO";
						}
					}
					if (logoCountryCode && topbar?.desktopTopbarRenderer) {
						topbar.desktopTopbarRenderer.countryCode = logoCountryCode;
					}

					return data;
				},
			});

			fetchHooker.addHook("antiAD-browse", {
				match: "/youtubei/v1/browse",
				mutator: true,
				handler(data: any) {
					const topbar = data?.topbar;

					if (premiumLogoEnabled) {
						const iconImage = topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage;
						if (iconImage) {
							iconImage.iconType = "YOUTUBE_PREMIUM_LOGO";
						}
					}
					if (logoCountryCode && topbar?.desktopTopbarRenderer) {
						topbar.desktopTopbarRenderer.countryCode = logoCountryCode;
					}

					return data;
				},
			});
		},
		enable() {
			localStorage.setItem("YTTweak-plugin-PremiumLogo", "1");
		},
		disable() {
			localStorage.removeItem("YTTweak-plugin-PremiumLogo");
		},
	},
	"other.logoCountryCode": {
		options: {
			reloadOnToggle: true,
		},
		enable() {
			localStorage.setItem("YTTweak-plugin-LogoCountryCode", config.get("other.logoCountryCode"));
		},
		disable() {
			localStorage.removeItem("YTTweak-plugin-LogoCountryCode");
		},
	},
} as Record<string, Plugin>;

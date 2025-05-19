import { videoPlayer } from "../index.js";
import { bodyClass } from "../helper.js";

function antiAD(records) {
	records.forEach((record) => {
		if (record.type === "childList" && record.addedNodes.length !== 0) {
			const { videoStream } = videoPlayer;
			// videoStream.pause();
			if (videoStream?.duration > 0) {
				videoStream.currentTime = videoStream.duration;
				videoStream.playbackRate = 16;
			}
		}
	});
	document.querySelectorAll("ytd-ad-slot-renderer").forEach((ad) => {
		const rendererEl = ad?.parentElement?.parentElement;
		if (rendererEl?.tagName === "YTD-RICH-ITEM-RENDERER") {
			// rendererEl.style.display = "none";
			rendererEl.remove();
		}
		ad.remove();
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

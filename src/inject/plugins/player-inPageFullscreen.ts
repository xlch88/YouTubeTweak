import config from "../config";
import { videoPlayer } from "../mainWorld";
import type { Plugin } from "../types";
import { touchPlayer } from "../util/helper";

const BODY_ACTIVE_CLASS = "yttweak-player-in-page-fullscreen";
const BODY_BUTTON_VISIBLE_CLASS = "yttweak-show-in-page-fullscreen-button";
const BUTTON_CLASS = "yttweak-in-page-fullscreen-button";

let inPageFullscreenButton: HTMLButtonElement | null = null;
let layoutFrame = 0;
let theaterRefreshTimer = 0;

function isWatchPage() {
	const { pathname, searchParams } = new URL(window.location.href);
	return pathname === "/watch" && searchParams.has("v");
}

function cancelPendingLayoutRefresh() {
	if (layoutFrame) {
		window.cancelAnimationFrame(layoutFrame);
		layoutFrame = 0;
	}
	if (theaterRefreshTimer) {
		window.clearTimeout(theaterRefreshTimer);
		theaterRefreshTimer = 0;
	}
}

function activateTheaterLayout() {
	const watchFlexy = document.querySelector<HTMLElement>("ytd-watch-flexy:not([hidden])");
	const sizeButton = watchFlexy?.querySelector<HTMLButtonElement>("#movie_player .ytp-size-button");
	if (!watchFlexy || !sizeButton) return false;

	if (!watchFlexy.hasAttribute("theater")) {
		sizeButton.click();
		return true;
	}

	const fullBleedHeight = watchFlexy.querySelector<HTMLElement>("#full-bleed-container")?.getBoundingClientRect().height;
	const videoHeight = watchFlexy.querySelector<HTMLVideoElement>(".html5-main-video")?.getBoundingClientRect().height;
	if (fullBleedHeight !== undefined && videoHeight !== undefined && Math.abs(fullBleedHeight - videoHeight) <= 1) {
		return true;
	}

	sizeButton.click();
	theaterRefreshTimer = window.setTimeout(() => {
		theaterRefreshTimer = 0;
		const currentWatchFlexy = document.querySelector<HTMLElement>("ytd-watch-flexy:not([hidden])");
		if (
			!currentWatchFlexy ||
			currentWatchFlexy.hasAttribute("theater") ||
			!document.body.classList.contains(BODY_ACTIVE_CLASS) ||
			!isWatchPage()
		) {
			return;
		}
		currentWatchFlexy.querySelector<HTMLButtonElement>("#movie_player .ytp-size-button")?.click();
	}, 200);
	return true;
}

function setInPageFullscreen(active: boolean) {
	cancelPendingLayoutRefresh();

	if (active && !isWatchPage()) return;

	document.body.classList.toggle(BODY_ACTIVE_CLASS, active);
	inPageFullscreenButton?.classList.toggle("yttweak-in-page-fullscreen-active", active);
	inPageFullscreenButton?.setAttribute("aria-pressed", String(active));

	layoutFrame = window.requestAnimationFrame(() => {
		layoutFrame = 0;
		if (active) {
			activateTheaterLayout();
			return;
		}

		const watchFlexy = document.querySelector<HTMLElement>("ytd-watch-flexy:not([hidden])");
		if (!watchFlexy?.hasAttribute("theater")) return;
		watchFlexy.querySelector<HTMLButtonElement>("#movie_player .ytp-size-button")?.click();
	});
}

function mountInPageFullscreenButton() {
	const fullscreenButton = videoPlayer.player?.querySelector<HTMLButtonElement>(".ytp-right-controls .ytp-fullscreen-button");
	const fullscreenIcon = fullscreenButton?.querySelector<SVGElement>("svg");
	if (!fullscreenButton || !fullscreenIcon) return;

	if (!inPageFullscreenButton) {
		inPageFullscreenButton = document.createElement("button");
		inPageFullscreenButton.type = "button";
		inPageFullscreenButton.className = `ytp-button ${BUTTON_CLASS}`;
		inPageFullscreenButton.title = "In-page fullscreen";
		inPageFullscreenButton.setAttribute("aria-label", "Toggle in-page fullscreen");
		inPageFullscreenButton.setAttribute("aria-pressed", "false");

		const iconFrame = document.createElement("span");
		iconFrame.className = `${BUTTON_CLASS}-icon`;
		iconFrame.append(fullscreenIcon.cloneNode(true));
		inPageFullscreenButton.append(iconFrame);
		inPageFullscreenButton.onclick = (event) => {
			event.preventDefault();
			event.stopPropagation();
			touchPlayer();
			setInPageFullscreen(!document.body.classList.contains(BODY_ACTIVE_CLASS));
		};
	}

	fullscreenButton.before(inPageFullscreenButton);
}

function syncButtonVisibility() {
	const visible = config.get("player.ui.inPageFullscreen");
	document.body.classList.toggle(BODY_BUTTON_VISIBLE_CLASS, visible);
	mountInPageFullscreenButton();
	if (!visible && document.body.classList.contains(BODY_ACTIVE_CLASS)) setInPageFullscreen(false);
}

export default {
	"player.ui.inPageFullscreen": {
		setup() {
			window.addEventListener("yt-navigate-start", () => {
				cancelPendingLayoutRefresh();
				document.body.classList.remove(BODY_ACTIVE_CLASS);
				inPageFullscreenButton?.classList.remove("yttweak-in-page-fullscreen-active");
				inPageFullscreenButton?.setAttribute("aria-pressed", "false");
			});
			window.addEventListener("yt-navigate-finish", mountInPageFullscreenButton);
		},
		initPlayer: syncButtonVisibility,
		videoSrcChange: mountInPageFullscreenButton,
		enable: syncButtonVisibility,
		disable: syncButtonVisibility,
	},
} as Record<string, Plugin>;

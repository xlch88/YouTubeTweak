import config from "./config.js";
import logger from "../logger.js";
import { checkPlayerAD } from "./util/helper.js";
import { youtubeiAPIv1 } from "./util/youtubei.js";
import wirelessRedstone from "./wirelessRedstone.js";
import "./style.scss";
import fetchHooker from "./fetchHooker.js";

const plugins = Object.assign({}, ...Object.values(import.meta.glob("./plugins/*.js", { eager: true }).map((m) => m.default)));
const pluginsDocumentStart = Object.values(import.meta.glob("./plugins_before/*.js", { eager: true }).map((m) => m.default));

export const videoPlayer = {
	box: null,
	/**
	 * YouTube player element with API
	 *
	 * @type {null || HTMLDivElement & {
	 *   getAvailableQualityLevels: () => string[],
	 *   setPlaybackQuality: (quality: string) => void,
	 *   setPlaybackQualityRange: (quality: string) => void,
	 *   setPlaybackRate: (playbackRate: number) => void,
	 *   playVideo: () => void,
	 *   [key: string]: any
	 * }}
	 */
	player: null,
	controls: null,
	videoStream: null,
	playerApi: null,
};
export const metadata = {
	video: null,
	videoNext: null,
};

const YouTubeTweakApp = {
	async init() {
		await this.waitBody();
		await config.init();
		this.initPlugins();
		this.initElementCatcher();
	},
	waitBody() {
		if (document.body) return Promise.resolve();

		return new Promise((resolve) => {
			const observer = new MutationObserver(() => {
				if (document.body) {
					observer.disconnect();
					resolve();
				}
			});

			observer.observe(document.documentElement, { childList: true });
		});
	},
	initPlugins() {
		for (const [key, value] of Object.entries(config.get())) {
			if (value && plugins[key]?.enable) {
				logger.info(`plugin enable:`, key);

				try {
					plugins[key]?.enable();
				} catch (e) {
					logger.error("plugin error:", e);
				}
			}
		}

		config.onUpdate = (data) => {
			if (!data.settings) return;

			const oldConfig = data.settings.oldValue;
			const newConfig = data.settings.newValue;

			for (const [key, value] of Object.entries(newConfig)) {
				if (oldConfig[key] !== value) {
					if (plugins[key]?.enable || plugins[key]?.disable) {
						try {
							plugins[key][value ? "enable" : "disable"]?.();
						} catch (e) {
							logger.error("plugin error:", e);
						}
						logger.log(`plugin status change:`, key, value);

						if (plugins[key]?.options?.reloadOnToggle) {
							window.location.reload();
							return;
						}
					}
				}
			}

			Object.entries(plugins)
				.filter((p) => p[1].configUpdate)
				.map((p) => {
					try {
						if (p[1].configUpdate(oldConfig, newConfig)) {
							p[1][newConfig[p[0]] ? "enable" : "disable"]();
							logger.log(`plugin config update:`, p);
						}
					} catch (e) {
						logger.error("plugin error:", e);
					}
				});
		};
	},
	initElementCatcher() {
		const adCheckTimeouts = [];
		setInterval(() => {
			// catch video player
			let player, controls, videoStream;
			if ((player = document.querySelector("ytd-player #movie_player"))) {
				if (player.getAttribute("yttweak") === "hooked") return;

				if ((controls = player.querySelector(".ytp-left-controls"))) {
					controls = controls.parentElement;

					if ((videoStream = player.querySelector(".video-stream"))) {
						player.isHookedYouTubeTweak = true;
						player.setAttribute("yttweak", "hooked");

						videoPlayer.player = player;
						videoPlayer.controls = controls;
						videoPlayer.videoStream = videoStream;

						function onVideoSrcChange(oldValue, newValue) {
							adCheckTimeouts.forEach((t) => clearTimeout(t));
							adCheckTimeouts.length = 0;

							if (new URL(window.location.href).pathname !== "/watch") {
								metadata.video = null;
								metadata.videoNext = null;
							}

							function callVideoSrcChange(isAD) {
								logger.debug("video src changed", {
									oldValue,
									newValue,
									isAD: isAD,
								});
								Object.entries(plugins)
									.filter((p) => p[1].videoSrcChange)
									.forEach((p) => p[1].videoSrcChange(oldValue, newValue, isAD));
							}

							const checkCount = 10;
							for (let i = 1; i <= checkCount; i++) {
								adCheckTimeouts.push(
									setTimeout(() => {
										const isAD = checkPlayerAD();
										if (isAD || i === checkCount) {
											adCheckTimeouts.forEach((t) => clearTimeout(t));
											adCheckTimeouts.length = 0;
											callVideoSrcChange(isAD);
										}
									}, 100 * i),
								);
							}
						}

						let observer = new MutationObserver((mutationList) => {
							mutationList.forEach((mutation) => {
								if (mutation.type !== "attributes" || mutation.attributeName !== "src") return;

								const handler = () => {
									videoStream.removeEventListener("canplay", handler);
									onVideoSrcChange(mutation.oldValue, mutation.target.getAttribute("src"));
								};
								videoStream.addEventListener("canplay", handler, { once: true });
							});
						});
						observer.observe(videoPlayer.videoStream, { attributes: true, attributeOldValue: true, attributeFilter: ["src"] });

						Object.values(plugins)
							.filter((p) => p.initPlayer)
							.map((p) => {
								try {
									p.initPlayer();
								} catch (e) {
									logger.error("plugin error:", e);
								}
							});
						onVideoSrcChange(null, videoStream.src);
					}
				}
			}

			// catch comments
			let queryComments;
			if ((queryComments = document.querySelectorAll("ytd-comments"))) {
				for (const commentEl of queryComments) {
					if (commentEl.getAttribute("yttweak") === "hooked") continue;
					commentEl.setAttribute("yttweak", "hooked");

					let commentUpdateListener = {};
					const commentWatcher = new MutationObserver((mutations) => {
						Object.values(commentUpdateListener).forEach((v) => v(mutations));
					});
					commentWatcher.observe(commentEl, {
						subtree: true,
						childList: true,
					});
					logger.debug("new comment:", commentEl);

					const commentParentWatcher = new MutationObserver((mutations) => {
						if (!document.body.contains(commentEl)) {
							logger.debug("comment removed:", commentEl);
							commentWatcher.disconnect();
							commentParentWatcher.disconnect();
							commentUpdateListener = {};
						}
					});
					commentWatcher.observe(commentEl.parentElement, {
						subtree: false,
						childList: true,
					});

					Object.entries(plugins)
						.filter((p) => p[1].initComments)
						.map((p) => {
							try {
								p[1].initComments(commentEl, (func) => {
									commentUpdateListener[p[0]] = func;
								});
							} catch (e) {
								logger.error("plugin error:", e);
							}
						});
				}
			}
		}, 300);
	},
};

export default function mainWorld() {
	if (["www.youtube.com", "m.youtube.com"].includes(location.host)) {
		Object.values(pluginsDocumentStart).forEach((v) => v());

		fetchHooker.hooks.playerMetadata = {
			match: "/youtubei/v1/player",
			mutator: false,
			handler(data) {
				const url = new URL(window.location.href);
				if (url.pathname === "/watch" && typeof data?.videoDetails === "object") {
					if (url.searchParams.get("v") === data.videoDetails.videoId) {
						metadata.video = data;
						logger.debug("Get video metadata:", data);
					}
				}
			},
		};
		fetchHooker.hooks.playerMetadataNext = {
			match: "/youtubei/v1/next",
			mutator: false,
			handler(data) {
				const url = new URL(window.location.href);
				if (url.pathname === "/watch" && typeof data?.currentVideoEndpoint === "object") {
					if (url.searchParams.get("v") === data.currentVideoEndpoint?.watchEndpoint?.videoId) {
						metadata.videoNext = data;
						logger.debug("Get video next metadata:", data);
					}
				}
			},
		};

		fetchHooker.init();
		wirelessRedstone.init("main");
		wirelessRedstone.send("test", { test: "data" }, (replyData) => {
			logger.info("test ok :", replyData);
		});
		YouTubeTweakApp.init();

		window.__YT_TWEAK__ = {
			WORLD: "main",
			plugins,
			videoPlayer,
			metadata,
			youtubeiAPIv1,
		};

		logger.debug(window.__YT_TWEAK__);
	}
}

import config from "./config";
import logger from "../logger";
import { youtubeiAPIv1 } from "./util/youtubei";
import wirelessRedstone from "./wirelessRedstone";
import "./style.scss";
import fetchHooker from "./fetchHooker";
import type { Plugin } from "./types";
import memory, { createDebouncedMemoryStorage } from "@/memory";
import xmlHttpRequestHooker from "./xmlHttpRequestHooker";

declare global {
	interface Window {
		__YT_TWEAK__?: {
			WORLD: string;
			plugins?: Record<string, Plugin>;
			videoPlayer?: typeof videoPlayer;
			metadata?: typeof metadata;
			youtubeiAPIv1?: typeof youtubeiAPIv1;
			fetchHookerIsEnabled?: boolean;
			xmlHttpRequestHookerIsEnabled?: boolean;
		};
	}
}

const plugins = Object.assign(
	{},
	...Object.values(import.meta.glob<Record<string, { default: Function }>>("./plugins/*.{js,ts}", { eager: true })).map((m) => m.default),
) as Record<string, Plugin>;

const pluginsDocumentStart = Object.values(
	import.meta.glob("./plugins_before/*.{js,ts}", { eager: true }) as Record<string, { default: Function }>,
).map((m) => m.default);

export const videoPlayer: {
	box: null;
	player: null | (HTMLDivElement & {
		isHookedYouTubeTweak?: boolean;
		getAvailableQualityLevels: () => string[];
		getPlaybackRate: () => number;
		setPlaybackQuality: (quality: string) => void;
		setPlaybackQualityRange: (quality: string) => void;
		setPlaybackRate: (playbackRate: number) => void;
		isSubtitlesOn: () => boolean;
		playVideo: () => void;
		toggleSubtitles: () => void;
		toggleSubtitlesOn: () => void;
		[key: string]: any;
	});
	controls: null | HTMLDivElement;
	videoStream: null | HTMLVideoElement;
	playerApi: null;
} = {
	box: null,
	player: null,
	controls: null,
	videoStream: null,
	playerApi: null,
};
export const metadata = {
	video: null as null | Record<string, any>,
	videoNext: null as null | Record<string, any>,
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
					resolve(undefined);
				}
			});

			observer.observe(document.documentElement, { childList: true });
		});
	},
	initPlugins() {
		for (const [pluginName, plugin] of Object.entries(plugins)) {
			if (plugin.setup) {
				logger.info(`plugin init:`, pluginName);
				try {
					plugin.setup();
				} catch (e) {
					logger.error("plugin error:", e);
				}
			}
		}
		for (const [key, value] of Object.entries(config.getAll())) {
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
							logger.info("plugin status change. need to reload page !!!");
							window.location.reload();
							return;
						}
					}
				}
			}

			Object.entries(plugins).map((p) => {
				try {
					const pluginNewStatus = p[0];
					const plugin = p[1];

					if (plugin.configUpdate && plugin.configUpdate(oldConfig, newConfig)) {
						pluginNewStatus ? plugin.enable?.() : plugin.disable?.();
						logger.log(`plugin config update:`, p);
					}
				} catch (e) {
					logger.error("plugin error:", e);
				}
			});
		};
	},
	initElementCatcher() {
		const catchPlayer = () => {
			const player = document.querySelector<HTMLDivElement>("ytd-player #movie_player");
			if (!player || player.getAttribute("yttweak") === "hooked") return;

			const controls = player.querySelector<HTMLDivElement>(".ytp-left-controls")?.parentElement as HTMLDivElement | undefined;
			if (!controls) return;

			const videoStream = player.querySelector<HTMLVideoElement>(".video-stream");
			if (!videoStream) return;

			player.setAttribute("yttweak", "hooked");
			videoPlayer.player = player as any;
			videoPlayer.player!.isHookedYouTubeTweak = true;
			videoPlayer.controls = controls;
			videoPlayer.videoStream = videoStream;

			function onVideoSrcChange(oldValue: string | null, newValue: string) {
				if (new URL(window.location.href).pathname !== "/watch") {
					metadata.video = null;
					metadata.videoNext = null;
				} else {
					metadata.video = videoPlayer.player?.getPlayerResponse() || null;
					metadata.videoNext = videoPlayer.player?.getWatchNextResponse() || null;
				}

				logger.debug("video src changed", {
					oldValue,
					newValue,
				});
				Object.entries(plugins).forEach((p) => p[1].videoSrcChange?.(oldValue, newValue));
			}

			const srcObserver = new MutationObserver((mutationList) => {
				mutationList.forEach((mutation) => {
					if (mutation.type !== "attributes" || mutation.attributeName !== "src") return;

					const handler = () => {
						videoStream?.removeEventListener("canplay", handler);
						onVideoSrcChange(
							mutation.oldValue as string,
							(mutation.target as HTMLVideoElement).getAttribute("src") as string,
						);
					};
					videoStream?.addEventListener("canplay", handler, { once: true });
				});
			});
			srcObserver.observe(videoPlayer.videoStream, { attributes: true, attributeOldValue: true, attributeFilter: ["src"] });

			Object.values(plugins).map((p) => {
				try {
					p.initPlayer?.();
				} catch (e) {
					logger.error("plugin error:", e);
				}
			});
			onVideoSrcChange(null, videoStream.src);
		};

		const catchComments = () => {
			for (const commentEl of document.querySelectorAll<HTMLDivElement>("ytd-comments:not([yttweak])")) {
				commentEl.setAttribute("yttweak", "hooked");

				const commentUpdateListener: Record<string, (mutations: MutationRecord[]) => void> = {};
				const commentWatcher = new MutationObserver((mutations) => {
					Object.values(commentUpdateListener).forEach((v) => v(mutations));
				});
				commentWatcher.observe(commentEl, {
					subtree: true,
					childList: true,
				});
				logger.debug("new comment:", commentEl);

				const commentParentWatcher = new MutationObserver(() => {
					if (!document.body.contains(commentEl)) {
						logger.debug("comment removed:", commentEl);
						commentWatcher.disconnect();
						commentParentWatcher.disconnect();
						const empty: Record<string, (mutations: MutationRecord[]) => void> = {};
						Object.assign(commentUpdateListener, empty);
					}
				});
				commentParentWatcher.observe(commentEl.parentElement as Node, {
					subtree: false,
					childList: true,
				});

				Object.entries(plugins).map((p) => {
					try {
						p[1].initComments?.(commentEl, (func) => {
							commentUpdateListener[p[0]] = func;
						});
					} catch (e) {
						logger.error("plugin error:", e);
					}
				});
			}
		};

		catchPlayer();
		catchComments();

		const domObserver = new MutationObserver(() => {
			catchPlayer();
			catchComments();
		});
		domObserver.observe(document.documentElement, { childList: true, subtree: true });
	},
};

export default async function mainWorld() {
	if (["www.youtube.com", "m.youtube.com"].includes(location.host)) {
		Object.values(pluginsDocumentStart).forEach((v) => v());

		let fetchHookerIsEnabled = false;
		let xmlHttpRequestHookerIsEnabled = false;
		if (localStorage.getItem("YTTweak-EnableFetchHooker")) {
			fetchHookerIsEnabled = true;
			fetchHooker.init();
		}
		if (localStorage.getItem("YTTweak-EnableXMLHttpRequestHooker")) {
			xmlHttpRequestHookerIsEnabled = true;
			xmlHttpRequestHooker.init();
		}

		wirelessRedstone.init("main");
		memory.storage = createDebouncedMemoryStorage({
			get(key): Promise<any> {
				return new Promise((resolve) => {
					wirelessRedstone.send("getConfig", key, (data) => {
						if (typeof key === "string") {
							return resolve(data[key]);
						}

						resolve(data);
					});
				});
			},
			set(items) {
				return new Promise((resolve) => {
					wirelessRedstone.send("setConfig", items, (data) => {
						resolve(data);
					});
				});
			},
		});
		wirelessRedstone.send("test", { test: "data" }, (replyData) => {
			logger.info("test ok :", replyData);
		});
		await YouTubeTweakApp.init();

		if (Object.keys(fetchHooker.hooks).length > 0) {
			if (!fetchHookerIsEnabled) {
				logger.warn("fetchHooker is not enabled, but has hooks! Enable it now.");
				localStorage.setItem("YTTweak-EnableFetchHooker", "1");
				location.reload();
				return;
			}

			fetchHooker.addHook("playerMetadata", {
				match: "/youtubei/v1/player",
				mutator: false,
				handler(data: any) {
					const url = new URL(window.location.href);
					if (url.pathname === "/watch" && typeof data?.videoDetails === "object") {
						if (url.searchParams.get("v") === data.videoDetails.videoId) {
							metadata.video = data;
							logger.debug("Get video metadata:", data);
						}
					}
				},
			});
			fetchHooker.addHook("playerMetadataNext", {
				match: "/youtubei/v1/next",
				mutator: false,
				handler(data: any) {
					const url = new URL(window.location.href);
					if (url.pathname === "/watch" && typeof data?.currentVideoEndpoint === "object") {
						if (url.searchParams.get("v") === data.currentVideoEndpoint?.watchEndpoint?.videoId) {
							metadata.videoNext = data;
							logger.debug("Get video next metadata:", data);
						}
					}
				},
			});
		} else {
			if (fetchHookerIsEnabled) {
				logger.warn("fetchHooker is enabled, but has no hooks!");
				localStorage.removeItem("YTTweak-EnableFetchHooker");
				location.reload();
			}
		}

		if (Object.keys(xmlHttpRequestHooker.hooks).length > 0) {
			if (!xmlHttpRequestHookerIsEnabled) {
				logger.warn("xmlHttpRequestHooker is not enabled, but has hooks! Enable it now.");
				localStorage.setItem("YTTweak-EnableXMLHttpRequestHooker", "1");
				location.reload();
				return;
			}
		} else {
			if (xmlHttpRequestHookerIsEnabled) {
				logger.warn("xmlHttpRequestHooker is enabled, but has no hooks!");
				localStorage.removeItem("YTTweak-EnableXMLHttpRequestHooker");
				location.reload();
				return;
			}
		}

		window.__YT_TWEAK__ = {
			WORLD: "main",
			plugins,
			videoPlayer,
			metadata,
			youtubeiAPIv1,
			fetchHookerIsEnabled: fetchHookerIsEnabled,
			xmlHttpRequestHookerIsEnabled: xmlHttpRequestHookerIsEnabled,
		};

		logger.debug(window.__YT_TWEAK__);
	}
}

import config from "./config";
import logger from "../logger";
import { youtubeiAPIv1 } from "./util/youtubei";
import wirelessRedstone from "./wirelessRedstone";
import "./style.scss";
import fetchHooker from "./fetchHooker";
import type { Plugin } from "./types";
import memory, { createDebouncedMemoryStorage } from "@/memory";
import xmlHttpRequestHooker from "./xmlHttpRequestHooker";
import { showReloadNotice } from "./util/reloadNotice";

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

export const videoPlayer = {
	box: null,
	/**
	 * YouTube player element with API
	 */
	player: null as
		| null
		| (HTMLDivElement & {
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
		  }),
	controls: null as null | HTMLDivElement,
	videoStream: null as null | HTMLVideoElement,
	playerApi: null as null,
};
export const metadata = {
	video: null as null | Record<string, any>,
	videoNext: null as null | Record<string, any>,
	anonymousVideo: null as null | Record<string, any>,
};

function parseYouTubeRegions(data: Record<string, any>) {
	const regions = new Map<string, string>();
	const queue: any[] = [data];

	for (let index = 0; index < queue.length; index++) {
		const value = queue[index];
		if (!value || typeof value !== "object") continue;

		const renderer = value.compactLinkRenderer;
		const countryAction = renderer?.serviceEndpoint?.signalServiceEndpoint?.actions?.find(
			(action: Record<string, any>) => action.selectCountryCommand,
		);
		const code = countryAction?.selectCountryCommand?.gl;
		const name = renderer?.title?.simpleText || renderer?.title?.runs?.map((run: Record<string, any>) => run.text).join("");
		if (/^[A-Z]{2}$/.test(code) && name) regions.set(code, name);

		Object.values(value).forEach((child) => {
			if (child && typeof child === "object") queue.push(child);
		});
	}

	return [...regions].map(([code, name]) => ({ code, name }));
}

function buildTimedtextUrl(track: Record<string, any>, targetLanguage?: string) {
	const url = new URL(track.baseUrl);

	url.searchParams.set("fmt", "vtt");
	if (track.kind) url.searchParams.set("kind", track.kind);
	if (track.languageCode) url.searchParams.set("lang", track.languageCode);
	if (targetLanguage) url.searchParams.set("tlang", targetLanguage);
	else url.searchParams.delete("tlang");

	return url;
}

async function hasTimedtextContent(url: URL) {
	try {
		const response = await fetch(url.href, { credentials: "include" });
		return response.ok && Boolean((await response.text()).trim());
	} catch {
		return false;
	}
}

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
			let needsReload = false;

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
							needsReload = true;
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

			if (needsReload) showReloadNotice("reloadOnToggle");
		};
	},
	initElementCatcher() {
		setInterval(() => {
			// catch video player
			let player: typeof videoPlayer.player, controls: typeof videoPlayer.controls, videoStream: typeof videoPlayer.videoStream;
			if ((player = document.querySelector("ytd-player #movie_player")) && player.getAttribute("yttweak") !== "hooked") {
				if ((controls = player.querySelector(".ytp-left-controls"))) {
					controls = controls.parentElement as HTMLDivElement;

					if ((videoStream = player.querySelector(".video-stream"))) {
						player.isHookedYouTubeTweak = true;
						player.setAttribute("yttweak", "hooked");

						videoPlayer.player = player;
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

						let observer = new MutationObserver((mutationList) => {
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
						observer.observe(videoPlayer.videoStream, { attributes: true, attributeOldValue: true, attributeFilter: ["src"] });

						Object.values(plugins).map((p) => {
							try {
								p.initPlayer?.();
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
				for (const commentEl of queryComments as NodeListOf<HTMLDivElement>) {
					if (commentEl.getAttribute("yttweak") === "hooked") continue;
					commentEl.setAttribute("yttweak", "hooked");

					let commentUpdateListener: Record<string, (mutations: MutationRecord[]) => void> = {};
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
					commentWatcher.observe(commentEl.parentElement as Node, {
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
			}

			// catch watch metadata
			const watchMetadata = document.querySelector<HTMLElement>('ytd-watch-metadata:not([yttweak="hooked"])');
			if (watchMetadata) {
				watchMetadata.setAttribute("yttweak", "hooked");

				const watchMetadataUpdateListeners: Record<string, (mutations: MutationRecord[]) => void> = {};
				new MutationObserver((mutations) => {
					Object.values(watchMetadataUpdateListeners).forEach((listener) => listener(mutations));
				}).observe(watchMetadata, {
					subtree: true,
					childList: true,
					characterData: true,
				});

				Object.entries(plugins).forEach(([pluginName, plugin]) => {
					try {
						plugin.initWatchMetadata?.(watchMetadata, (listener) => {
							watchMetadataUpdateListeners[pluginName] = listener;
						});
					} catch (e) {
						logger.error("plugin error:", e);
					}
				});
			}
		}, 300);
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
		wirelessRedstone.handlers.getInsightsData = (_data, reply) => {
			const videoId = new URL(location.href).searchParams.get("v");
			if (!videoId) {
				reply({
					video: null,
					videoNext: null,
					anonymousVideo: null,
					anonymousVideoNext: null,
					regions: [],
					error: "not-watch-page",
				});
				return;
			}

			metadata.video = videoPlayer.player?.getPlayerResponse?.() || metadata.video;
			metadata.videoNext = videoPlayer.player?.getWatchNextResponse?.() || metadata.videoNext;

			reply({
				video: metadata.video,
				videoNext: metadata.videoNext,
				anonymousVideo: null,
				anonymousVideoNext: null,
				regions: [],
				error: null,
			});
		};
		wirelessRedstone.handlers.getInsightsVerificationData = async (_data, reply) => {
			const videoId = new URL(location.href).searchParams.get("v");
			if (!videoId) {
				reply({ anonymousVideo: null, anonymousVideoNext: null, error: "not-watch-page" });
				return;
			}

			try {
				const data = await youtubeiAPIv1(
					"/get_watch",
					{
						playerRequest: { videoId },
						watchNextRequest: { videoId },
					},
					"en",
					"US",
					false,
				);
				metadata.anonymousVideo = Array.isArray(data)
					? data.find((item) => item?.playerResponse)?.playerResponse || null
					: null;
				reply({
					anonymousVideo: metadata.anonymousVideo,
					anonymousVideoNext: Array.isArray(data)
						? data.find((item) => item?.watchNextResponse)?.watchNextResponse || null
						: null,
					error: null,
				});
			} catch (e) {
				logger.error("Failed to get anonymous insights data:", e);
				metadata.anonymousVideo = null;
				reply({
					anonymousVideo: null,
					anonymousVideoNext: null,
					error: e instanceof Error ? e.message : String(e),
				});
			}
		};
		wirelessRedstone.handlers.getInsightsRegionsData = async (_data, reply) => {
			try {
				const ytcfg = (window as any).ytcfg;
				const data = await youtubeiAPIv1(
					"/account/account_menu",
					{},
					ytcfg?.get("HL") || document.documentElement.lang || navigator.language,
					ytcfg?.get("GL") || "US",
				);
				reply({ regions: parseYouTubeRegions(data), error: null });
			} catch (e) {
				logger.error("Failed to get YouTube regions:", e);
				reply({ regions: [], error: e instanceof Error ? e.message : String(e) });
			}
		};
		wirelessRedstone.handlers.getInsightsSubtitleUrl = async (track, reply) => {
			if (!track?.baseUrl || !track.languageCode) {
				reply({ url: null, error: "invalid-caption-track" });
				return;
			}

			const response = metadata.anonymousVideo || videoPlayer.player?.getPlayerResponse?.() || metadata.video;
			const renderer = response?.captions?.playerCaptionsTracklistRenderer;
			const resolvedTrack =
				renderer?.captionTracks?.find(
					(candidate: Record<string, any>) =>
						candidate.baseUrl &&
						((track.vssId && candidate.vssId === track.vssId) ||
							(candidate.languageCode === track.languageCode &&
								(candidate.kind || "") === (track.kind || ""))),
				) || track;
			const directUrl = buildTimedtextUrl(resolvedTrack);
			if (await hasTimedtextContent(directUrl)) {
				reply({ url: directUrl.href, error: null });
				return;
			}

			const canTranslate = renderer?.translationLanguages?.some(
				(language: Record<string, any>) => language.languageCode === track.languageCode,
			);
			const sourceTrack = canTranslate
				? renderer?.captionTracks?.find(
						(candidate: Record<string, any>) =>
							candidate.baseUrl &&
							candidate.isTranslatable &&
							candidate.languageCode !== track.languageCode &&
							candidate.kind === "asr",
					) ||
					renderer?.captionTracks?.find(
						(candidate: Record<string, any>) =>
							candidate.baseUrl && candidate.isTranslatable && candidate.languageCode !== track.languageCode,
					)
				: null;

			if (sourceTrack) {
				const translatedUrl = buildTimedtextUrl(sourceTrack, track.languageCode);
				if (await hasTimedtextContent(translatedUrl)) {
					reply({ url: translatedUrl.href, error: null });
					return;
				}
			}

			reply({ url: null, error: "empty-subtitle" });
		};
		wirelessRedstone.handlers.getInsightsFormats = async (_data, reply) => {
			const videoId = new URL(location.href).searchParams.get("v");
			if (!videoId) {
				reply({ formats: [], error: "not-watch-page" });
				return;
			}

			const signatureTimestamp = Number((window as any).ytcfg?.get("STS")) || 20660;
			const clients = [
				{
					clientName: "ANDROID_VR",
					clientVersion: "1.65.10",
					deviceMake: "Oculus",
					deviceModel: "Quest 3",
					androidSdkVersion: 32,
					userAgent:
						"com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
					osName: "Android",
					osVersion: "12L",
				},
				{
					clientName: "VISIONOS",
					clientVersion: "1.02",
					deviceMake: "Apple",
					deviceModel: "RealityDevice17,1",
					userAgent:
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
					osName: "visionOS",
					osVersion: "26.5.23O471",
				},
			];
			const results = await Promise.allSettled(
				clients.map((client) => {
					const controller = new AbortController();
					const timeout = window.setTimeout(() => controller.abort(), 10000);

					return youtubeiAPIv1(
						"/player",
						{
							context: { client: { ...client, hl: "en", gl: "US" } },
							videoId,
							playbackContext: {
								contentPlaybackContext: {
									html5Preference: "HTML5_PREF_WANTS",
									signatureTimestamp,
								},
							},
							contentCheckOk: true,
							racyCheckOk: true,
						},
						"en",
						"US",
						false,
						controller.signal,
					).finally(() => window.clearTimeout(timeout));
				}),
			);
			const formats: Record<string, any>[] = [];
			const errors: string[] = [];

			results.forEach((result, index) => {
				if (result.status === "rejected") {
					errors.push(
						`${clients[index].clientName}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
					);
					return;
				}
				if (result.value?.videoDetails?.videoId && result.value.videoDetails.videoId !== videoId) {
					errors.push(`${clients[index].clientName}: wrong-video`);
					return;
				}

				const clientFormats = [
					...(result.value?.streamingData?.formats || []),
					...(result.value?.streamingData?.adaptiveFormats || []),
				];
				formats.push(...clientFormats);
				if (!clientFormats.length) {
					errors.push(
						`${clients[index].clientName}: ${result.value?.playabilityStatus?.status || "no-formats"}${
							result.value?.playabilityStatus?.reason ? ` (${result.value.playabilityStatus.reason})` : ""
						}`,
					);
				}
			});

			reply({ formats, error: errors.length ? errors.join("; ") : null });
		};
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
				debugger;
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
				debugger;
				location.reload();
			}
		}

		if (Object.keys(xmlHttpRequestHooker.hooks).length > 0) {
			if (!xmlHttpRequestHookerIsEnabled) {
				logger.warn("xmlHttpRequestHooker is not enabled, but has hooks! Enable it now.");
				localStorage.setItem("YTTweak-EnableXMLHttpRequestHooker", "1");
				debugger;
				location.reload();
				return;
			}
		} else {
			if (xmlHttpRequestHookerIsEnabled) {
				logger.warn("xmlHttpRequestHooker is enabled, but has no hooks!");
				localStorage.removeItem("YTTweak-EnableXMLHttpRequestHooker");
				debugger;
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

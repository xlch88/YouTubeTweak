import { createLogger } from "@/logger";
import type { Plugin } from "../types";
import xmlHttpRequestHooker from "../xmlHttpRequestHooker";
import { googleTranslate } from "../util/helper";
import config from "../config";
import { videoPlayer } from "../mainWorld";
const logger = createLogger("Translate-timedtext");
const TIMEDTEXT_TRANSLATE_MAX_TEXT_LENGTH = 38000;
const textEncoder = new TextEncoder();

type timedtextResponse = {
	events?: Array<{
		dDurationMs: number;
		tStartMs: number;
		segs: Array<{
			utf8: string;
		}>;
	}>;
};

async function translateTimedtextItems(texts: string[], srcLang: string, toLang: string) {
	if (texts.length === 0) return [];

	const batches: string[][] = [];
	let batch: string[] = [];
	let batchTextLength = 0;

	for (const text of texts) {
		const textLength = textEncoder.encode(text).length;
		if (textLength > TIMEDTEXT_TRANSLATE_MAX_TEXT_LENGTH) {
			throw new Error(`Single timedtext item exceeds translate text length limit: ${textLength}`);
		}

		if (batch.length > 0 && batchTextLength + textLength > TIMEDTEXT_TRANSLATE_MAX_TEXT_LENGTH) {
			batches.push(batch);
			batch = [];
			batchTextLength = 0;
		}

		batch.push(text);
		batchTextLength += textLength;
	}

	if (batch.length > 0) {
		batches.push(batch);
	}

	const batchResults = await Promise.all(
		batches.map(async (batch) => {
			const result = await googleTranslate(batch, srcLang, toLang);
			return batch.map((source, index) => (typeof result[0][index] === "string" ? result[0][index] : source));
		}),
	);

	return batchResults.flat();
}

export default {
	"translate.enable.timedtext": {
		options: {
			reloadOnToggle: true,
		},
		enable() {
			logger.log("Enabling translate timedtext plugin...");
			xmlHttpRequestHooker.addHook("translateTimedtext", {
				match: "/api/timedtext",
				mutator: true,
				async handler(data: timedtextResponse, url, responseClone) {
					logger.debug("Intercepted timedtext request:", url);
					if (!data || typeof data !== "object") {
						return data;
					}

					const urlObj = new URL(url);
					let srcLang = urlObj.searchParams.get("lang") || "auto";
					let toLang =
						config.get("comment.targetLanguage") === "auto"
							? window.yt?.config_?.HL || "zh_TW"
							: config.get("comment.targetLanguage");

					if (srcLang.slice(0, 2) === toLang.slice(0, 2)) {
						return data;
					}

					if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
						return data;
					}

					const needTranslateList: Record<string, string> = {};
					for (const i in data.events) {
						const evt = data.events[i];
						// evt.segs[0].utf8 = "????";
						if (evt.segs && Array.isArray(evt.segs)) {
							needTranslateList[i] = evt.segs
								.map((seg) => seg.utf8)
								.join("")
								.replace(/\n/g, "<br/>");

							if (needTranslateList[i].trim() === "") {
								needTranslateList[i] = "---";
							}
						} else {
							needTranslateList[i] = "---";
						}
					}

					if (Object.keys(needTranslateList).length === 0) {
						return data;
					}

					if (srcLang === "ja") {
						for (const [i, v] of Object.entries(needTranslateList)) {
							const vSplit = v.split("<br/>");
							if (vSplit.length >= 2 && /[a-zA-Z ]/g.test(vSplit.slice(-1)[0])) {
								needTranslateList[i] = vSplit.slice(0, -1).join("<br/>");
							}
						}
					}

					let translatedTexts: string[];
					try {
						translatedTexts = await translateTimedtextItems(Object.values(needTranslateList), srcLang, toLang);
					} catch (e) {
						logger.warn("Timedtext translation failed:", e);
						return data;
					}

					for (const i in data.events) {
						try {
							if (urlObj.searchParams.get("kind") === "asr") {
								data.events[i].segs[0].utf8 =
									translatedTexts[i].replace(/<br\/>/g, "").replace("---", "") +
									"\n" +
									data.events[i].segs.map((v) => v.utf8).join("");
								data.events[i].segs.length = 1;
							} else {
								data.events[i].segs[0].utf8 =
									translatedTexts[i].replace(/<br\/>/g, "") + "\n" + data.events[i].segs[0].utf8;
							}
						} catch {
							debugger;
						}
					}
					logger.debug("Timedtext translation result:", data, needTranslateList, translatedTexts);
					return data;
				},
			});

			if (videoPlayer.player) {
				if (videoPlayer.player.isSubtitlesOn()) {
					videoPlayer.player.toggleSubtitles();
					setTimeout(() => {
						videoPlayer.player?.toggleSubtitlesOn();
					}, 100);
				}
			}
		},
		disable() {
			delete xmlHttpRequestHooker.hooks["translateTimedtext"];

			if (videoPlayer.player) {
				if (videoPlayer.player.isSubtitlesOn()) {
					videoPlayer.player.toggleSubtitles();
					setTimeout(() => {
						videoPlayer.player?.toggleSubtitlesOn();
					}, 100);
				}
			}
		},
	},
} as Record<string, Plugin>;

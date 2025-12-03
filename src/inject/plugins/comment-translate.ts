import config from "../config";
import { createLogger } from "../../logger";

import type { Plugin } from "../types";

const logger = createLogger("comment-translate");

type TranslateTask = {
	commentEl: Element;
	contentDom: Element;
	text: string;
	targetLang: string;
	mode: "auto" | "manual";
};

let translateQueue: TranslateTask[] = [];

function appendTranslateButton(task: TranslateTask, translatedHtml?: string) {
	const commentTranslateButton = document.createElement("button");
	commentTranslateButton.className = "yttweak-comment-translate-button";

	const translateBar = task.commentEl.querySelector(".ytd-comment-view-model ytd-comment-engagement-bar .ytd-comment-engagement-bar");
	if (!translateBar) return;

	translateBar.appendChild(commentTranslateButton);
	commentTranslateButton.onclick = () => {
		commentTranslateButton.remove();
		if (translatedHtml !== undefined) {
			appendTranslation(task, translatedHtml);
		} else {
			translateQueue.push({ ...task, mode: "manual" });
		}
	};
}

function appendTranslation(task: TranslateTask, translatedHtml: string) {
	if (!translatedHtml) return;

	const transNode = document.createElement("div");
	transNode.className = "yttweak-comment-translate";
	transNode.textContent =
		(translatedHtml.includes("<br/><br/>") ? "\n\n" : "\n") +
		decodeHtmlEntities(translatedHtml)
			.replace(/❤/g, "❤️")
			.replace(/<br\/>/g, "\n");
	task.contentDom.parentElement?.appendChild(transNode);
}

function normalizeLang(lang: string) {
	return (lang || "").toLowerCase().replace("_", "-");
}

function isSameLanguage(a: string, b: string) {
	const na = normalizeLang(a);
	const nb = normalizeLang(b);
	if (!na || !nb) return false;

	if (na === nb) return true;
	return na.split("-")[0] === nb.split("-")[0];
}

function isBlockedLanguage(lang: string, blocked: string[]) {
	return blocked.some((item) => isSameLanguage(item, lang));
}

function handleTranslate(v: HTMLElement) {
	if (v.classList.contains("yttweak-processed-translate")) {
		return;
	}
	v.classList.add("yttweak-processed-translate");
	console.log(v);
	v.querySelectorAll("button.yttweak-comment-translate-button")?.forEach((btn) => btn.remove());

	setTimeout(() => {
		let commentContentDom = v.querySelector("#content yt-attributed-string>span");
		let commentContent = "";

		if (!commentContentDom) return;

		commentContentDom?.childNodes.forEach((child) => {
			if (child.nodeType === Node.TEXT_NODE) {
				commentContent += child.textContent;
			} else if (child.nodeType === Node.ELEMENT_NODE && child.childNodes.length >= 1) {
				// emoji
				if ((child.childNodes[0] as HTMLImageElement)?.alt) {
					commentContent += (child.childNodes[0] as HTMLImageElement).alt;
				}

				if ((child as HTMLElement).innerText) {
					commentContent += (child as HTMLElement).innerText;
				}
			}
		});

		let toLang =
			config.get("comment.targetLanguage") === "auto" ? window.yt?.config_?.HL || "zh_TW" : config.get("comment.targetLanguage");
		const task: TranslateTask = {
			commentEl: v,
			contentDom: commentContentDom,
			text: commentContent,
			targetLang: toLang,
			mode: "auto",
		};

		if (commentContent.trim() === "" || /^[\d\p{P}\p{Z}\p{C}]*$/u.test(commentContent)) {
			appendTranslateButton(task);
			return;
		}

		translateQueue.push(task);

		const t = document.createElement("span");
		t.classList.add("yttweak-comment-translate-tag");
		commentContentDom.parentElement?.appendChild(t);
	}, 100);
}
setInterval(() => {
	if (translateQueue.length === 0) return;

	const queue = translateQueue;
	translateQueue = [];

	const batches: Record<string, TranslateTask[]> = {};
	queue.forEach((task) => {
		const key = task.targetLang || "auto";
		batches[key] ??= [];
		batches[key].push(task);
	});

	Object.values(batches).forEach((doing) => {
		fetch("https://translate-pa.googleapis.com/v1/translateHtml", {
			headers: {
				"content-type": "application/json+protobuf",
				"x-goog-api-key": "AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520",
			},
			body: JSON.stringify([[doing.map((v) => v.text.split("\n").join("<br/>")), "auto", doing[0].targetLang], "te_lib"]),
			method: "POST",
		})
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				const translations: string[] = Array.isArray(data?.[0]) ? data[0] : [];
				const detectedLanguages: string[] = Array.isArray(data?.[1]) ? data[1] : [];
				const neverTranslateLanguages = config.get("comment.neverTranslateLanguages", []);

				doing.forEach((task, i) => {
					const result = translations[i];
					const detectedLang = detectedLanguages[i] || "auto";
					if (typeof result !== "string") {
						appendTranslateButton(task);
						return;
					}

					const shouldSkipAuto =
						task.mode === "auto" &&
						(isSameLanguage(detectedLang, task.targetLang) || isBlockedLanguage(detectedLang, neverTranslateLanguages));

					if (shouldSkipAuto) {
						appendTranslateButton(task, result);
						return;
					}

					appendTranslation(task, result);
				});
			})
			.catch((error) => {
				logger.warn("translate error:", error);
			});
	});
}, 500);

export default {
	"comment.autoTranslate": {
		options: {
			reloadOnToggle: true,
		},

		enable() {
			document.body.classList.add("yttweak-comment-enable-translate");
		},
		disable() {
			document.body.classList.remove("yttweak-comment-enable-translate");
		},
		initComments(commentEl, setUpdateListener) {
			if (!config.get("comment.autoTranslate")) return;

			commentEl.querySelectorAll("ytd-comment-view-model").forEach((v) => {
				handleTranslate(v as HTMLElement);
			});

			setUpdateListener((mutations) => {
				for (const mutation of mutations) {
					if (mutation.type === "childList") {
						mutation.addedNodes.forEach((node) => {
							const v = node as HTMLElement;
							const tagName = v?.tagName?.toLowerCase();
							if (tagName === "ytd-comment-view-model" || tagName === "ytd-comment-thread-renderer") {
								handleTranslate(v);
							}
						});

						if (mutation.removedNodes.length > 0) {
							const node = mutation.removedNodes.values().next().value as HTMLElement;
							if (node?.classList?.contains("yttweak-comment-translate-tag")) {
								const parent = (mutation.target as HTMLElement)?.parentElement?.parentElement?.parentElement?.parentElement
									?.parentElement;

								if (parent && parent.tagName.toLowerCase() === "ytd-comment-view-model") {
									console.log("Re-translate comment as its translation node is removed:", parent);
									handleTranslate(parent);
								}
							}
						}
					}
				}
			});
		},
	},
} as Record<string, Plugin>;

function decodeHtmlEntities(str: string) {
	const namedEntities: Record<string, string> = {
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&quot;": '"',
		"&apos;": "'",
		"&nbsp;": "\u00A0",
		"&copy;": "©",
		"&reg;": "®",
		"&cent;": "¢",
		"&pound;": "£",
		"&yen;": "¥",
		"&euro;": "€",
		"&sect;": "§",
		"&deg;": "°",
		"&hellip;": "…",
		"&mdash;": "—",
		"&ndash;": "–",
		"&lsquo;": "‘",
		"&rsquo;": "’",
		"&ldquo;": "“",
		"&rdquo;": "”",
		"&times;": "×",
		"&divide;": "÷",
		"&trade;": "™",
		"&raquo;": "»",
		"&laquo;": "«",
		"&para;": "¶",
		"&bull;": "•",
		"&middot;": "·",
		"&iexcl;": "¡",
		"&iquest;": "¿",
		"&uarr;": "↑",
		"&darr;": "↓",
		"&larr;": "←",
		"&rarr;": "→",
		"&Alpha;": "Α",
		"&Beta;": "Β",
		"&Gamma;": "Γ",
		"&Delta;": "Δ",
		"&Epsilon;": "Ε",
		"&Zeta;": "Ζ",
		"&Eta;": "Η",
		"&Theta;": "Θ",
		"&Mu;": "Μ",
		"&Pi;": "Π",
		"&Sigma;": "Σ",
		"&Phi;": "Φ",
		"&Omega;": "Ω",
	};

	return str
		.replace(/&[a-zA-Z]+?;/g, (match) => namedEntities[match] || match)
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
		.replace(/&#x([\da-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

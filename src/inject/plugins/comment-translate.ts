import config from "../config";
import { createLogger } from "../../logger";
import { videoPlayer } from "../mainWorld";

import type { Plugin } from "../types";

const logger = createLogger("comment-translate");

const DOUBLE_BREAK_RE = /<br\s*\/?>\s*<br\s*\/?>/i;
const RESULT_HTML_TOKEN_RE = /<br\s*\/?>|<[^>]+>/gi;
const TRANSLATABLE_FORMAT_TAGS = new Set(["SPAN", "B", "STRONG", "I", "EM", "U", "S", "DEL", "INS", "MARK", "SMALL", "SUB", "SUP"]);
const NON_TEXT_SELECTOR = "a,img,picture,svg,yt-icon,button,input,textarea,select,video,audio,canvas,iframe";
const IMAGE_MIRROR_ATTRIBUTES = ["alt", "class", "data-src", "data-srcset", "data-thumb", "height", "sizes", "src", "srcset", "style", "width"];

type DomNodeEntry = {
	node: Node;
	images: ImageSnapshot[];
};

type ShellNodeEntry = {
	element: Element;
};

type ImageSnapshot = {
	alt: string;
	src: string;
	srcset: string;
	sizes: string;
	className: string;
	attributes: [string, string][];
};

type ImageMirror = {
	cleanup: () => void;
	isConnected: () => boolean;
};

type TextSegment = {
	leading: string;
	source: string;
	trailing: string;
};

type TranslatePart =
	| {
			type: "text";
			index: number;
	  }
	| {
			type: "node";
			index: number;
	  }
	| {
			type: "open";
			index: number;
	  }
	| {
			type: "close";
			index: number;
	  };

type TranslateTask = {
	commentEl: Element;
	contentDom: Element;
	plainText: string;
	parts: TranslatePart[];
	textSegments: TextSegment[];
	domNodes: DomNodeEntry[];
	shellNodes: ShellNodeEntry[];
	targetLang: string;
	mode: "auto" | "manual";
};

let translateQueue: TranslateTask[] = [];
const imageMirrors = new Set<ImageMirror>();

function appendTranslateButton(task: TranslateTask, translatedSegments?: string[]) {
	const commentTranslateButton = document.createElement("button");
	commentTranslateButton.className = "yttweak-comment-translate-button";

	const translateBar = task.commentEl.querySelector(".ytd-comment-view-model ytd-comment-engagement-bar .ytd-comment-engagement-bar");
	if (!translateBar) return;

	translateBar.appendChild(commentTranslateButton);
	commentTranslateButton.onclick = () => {
		commentTranslateButton.remove();
		if (translatedSegments !== undefined) {
			appendTranslation(task, translatedSegments);
		} else {
			translateQueue.push({ ...task, mode: "manual" });
		}
	};
}

function appendTranslation(task: TranslateTask, translatedSegments: string[]) {
	if (translatedSegments.length === 0) return;

	const transNode = document.createElement("div");
	transNode.className = "yttweak-comment-translate";
	transNode.appendChild(document.createTextNode(translatedSegments.some((text) => DOUBLE_BREAK_RE.test(text)) ? "\n\n" : "\n"));
	transNode.appendChild(createTranslationFragment(task, translatedSegments));

	task.contentDom.appendChild(transNode);
}

function createTranslationContent(contentDom: Element) {
	const parts: TranslatePart[] = [];
	const textSegments: TextSegment[] = [];
	const domNodes: DomNodeEntry[] = [];
	const shellNodes: ShellNodeEntry[] = [];
	const content = {
		parts,
		textSegments,
		domNodes,
		shellNodes,
		plainText: "",
	};

	contentDom.childNodes.forEach((child) => {
		appendNodeToTranslationContent(content, child);
	});

	return content;
}

function appendNodeToTranslationContent(
	content: Pick<TranslateTask, "parts" | "textSegments" | "domNodes" | "shellNodes" | "plainText">,
	node: Node,
) {
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.textContent ?? "";
		const segment = createTextSegment(text);
		const index = content.textSegments.length;
		content.parts.push({ type: "text", index });
		content.textSegments.push(segment);
		content.plainText += segment.source;
		return;
	}

	if (node.nodeType !== Node.ELEMENT_NODE) return;

	const element = node as HTMLElement;
	if (element.classList.contains("yttweak-comment-translate")) return;

	if (shouldTranslateElementChildren(element)) {
		const index = content.shellNodes.length;
		content.parts.push({ type: "open", index });
		content.shellNodes.push({ element });

		element.childNodes.forEach((child) => {
			appendNodeToTranslationContent(content, child);
		});

		content.parts.push({ type: "close", index });
		return;
	}

	const index = content.domNodes.length;
	content.parts.push({ type: "node", index });
	content.domNodes.push({ node, images: captureImageSnapshots(element) });
}

function shouldTranslateElementChildren(element: HTMLElement): boolean {
	if (!TRANSLATABLE_FORMAT_TAGS.has(element.tagName)) return false;
	if (element.matches(NON_TEXT_SELECTOR)) return false;

	return element.childNodes.length > 0;
}

function createTextSegment(text: string): TextSegment {
	if (text.trim() === "") {
		return { leading: text, source: "", trailing: "" };
	}

	const leading = text.match(/^\s*/)?.[0] ?? "";
	const trailing = text.match(/\s*$/)?.[0] ?? "";
	const source = text.slice(leading.length, text.length - trailing.length);

	return { leading, source, trailing };
}

function createTranslationFragment(task: TranslateTask, translatedSegments: string[]) {
	const fragment = document.createDocumentFragment();
	const parentStack: Node[] = [];
	let currentParent: Node = fragment;

	task.parts.forEach((part) => {
		if (part.type === "text") {
			appendTranslatedTextSegment(currentParent, task.textSegments[part.index], translatedSegments[part.index]);
			return;
		}

		if (part.type === "node") {
			appendDomClone(currentParent, task, part.index);
			return;
		}

		if (part.type === "open") {
			const shell = createShellClone(task, part.index);
			if (!shell) return;

			currentParent.appendChild(shell);
			parentStack.push(currentParent);
			currentParent = shell;
			return;
		}

		currentParent = parentStack.pop() ?? fragment;
	});

	return fragment;
}

function appendTranslatedTextSegment(parent: Node, segment: TextSegment | undefined, translatedHtml: string | undefined) {
	if (!segment) return;

	appendText(parent, segment.leading);
	appendTranslatedText(parent, translatedHtml ?? segment.source);
	appendText(parent, segment.trailing);
}

function appendTranslatedText(parent: Node, translatedHtml: string) {
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	RESULT_HTML_TOKEN_RE.lastIndex = 0;
	while ((match = RESULT_HTML_TOKEN_RE.exec(translatedHtml)) !== null) {
		appendText(parent, translatedHtml.slice(lastIndex, match.index));
		if (match[0].toLowerCase().startsWith("<br")) {
			parent.appendChild(document.createTextNode("\n"));
		}
		lastIndex = match.index + match[0].length;
	}

	appendText(parent, translatedHtml.slice(lastIndex));
}

function appendText(parent: Node, text: string) {
	if (!text) return;
	parent.appendChild(document.createTextNode(decodeHtmlEntities(text).replace(/❤/g, "❤️")));
}

function appendDomClone(parent: Node, task: TranslateTask, index: number) {
	const entry = task.domNodes[index];
	if (!entry) return;

	const clone = sanitizeClonedDomNode(entry);
	parent.appendChild(clone);
	if (clone.nodeType === Node.ELEMENT_NODE) {
		connectLazyImageMirrors(entry, clone as Element);
	}
}

function createShellClone(task: TranslateTask, index: number) {
	const entry = task.shellNodes[index];
	if (!entry) return null;

	return entry.element.cloneNode(false);
}

function sanitizeClonedDomNode(entry: DomNodeEntry) {
	const clone = entry.node.cloneNode(true);
	if (clone.nodeType !== Node.ELEMENT_NODE) return clone;

	const element = clone as HTMLElement;
	hydrateImageClones(entry, element);
	bindTimestampLinks(element);
	return element;
}

function captureImageSnapshots(element: Element): ImageSnapshot[] {
	return getImages(element).map(captureImageSnapshot);
}

function captureImageSnapshot(img: HTMLImageElement): ImageSnapshot {
	return {
		alt: img.alt,
		src: getImageSrc(img),
		srcset: getImageSrcset(img),
		sizes: img.sizes || img.getAttribute("sizes") || "",
		className: img.className,
		attributes: Array.from(img.attributes, (attr) => [attr.name, attr.value]),
	};
}

function hydrateImageClones(entry: DomNodeEntry, clone: Element) {
	const sourceImages = getImages(entry.node);
	const cloneImages = getImages(clone);

	cloneImages.forEach((cloneImg, index) => {
		syncImageClone(sourceImages[index], cloneImg, entry.images[index]);
	});
}

function syncImageClone(sourceImg: HTMLImageElement | undefined, cloneImg: HTMLImageElement, snapshot: ImageSnapshot | undefined) {
	const sourceAttributes = sourceImg ? Array.from(sourceImg.attributes, (attr) => [attr.name, attr.value] as [string, string]) : [];
	const attributes = sourceAttributes.length > 0 ? sourceAttributes : snapshot?.attributes || [];
	const alt = sourceImg?.alt || snapshot?.alt || cloneImg.getAttribute("alt") || "";
	const src = getImageSrc(sourceImg) || snapshot?.src || getImageSrc(cloneImg) || "";
	const srcset = getImageSrcset(sourceImg) || snapshot?.srcset || getImageSrcset(cloneImg) || "";
	const sizes = sourceImg?.sizes || sourceImg?.getAttribute("sizes") || snapshot?.sizes || cloneImg.getAttribute("sizes") || "";
	const className = sourceImg?.className || snapshot?.className || cloneImg.className || "";

	attributes.forEach(([name, value]) => cloneImg.setAttribute(name, value));

	if (className) {
		cloneImg.className = className;
	}
	if (alt) {
		cloneImg.alt = alt;
		cloneImg.setAttribute("alt", alt);
	}
	if (src) {
		cloneImg.src = src;
		cloneImg.setAttribute("src", src);
		cloneImg.loading = "eager";
		cloneImg.classList.add("ytCoreImageLoaded");
	}
	if (srcset) {
		cloneImg.srcset = srcset;
		cloneImg.setAttribute("srcset", srcset);
	}
	if (sizes) {
		cloneImg.sizes = sizes;
		cloneImg.setAttribute("sizes", sizes);
	}
}

function connectLazyImageMirrors(entry: DomNodeEntry, clone: Element) {
	const sourceImages = getImages(entry.node);
	const cloneImages = getImages(clone);

	cloneImages.forEach((cloneImg, index) => {
		const sourceImg = sourceImages[index];
		if (!sourceImg) return;

		const snapshot = entry.images[index];
		const observer = new MutationObserver(() => sync());
		let mirror: ImageMirror;
		let cloneWasConnected = cloneImg.isConnected;
		const cleanup = () => {
			observer.disconnect();
			sourceImg.removeEventListener("load", sync, true);
			imageMirrors.delete(mirror);
		};
		const sync = () => {
			if (cloneImg.isConnected) {
				cloneWasConnected = true;
			}
			if (!sourceImg.isConnected || (cloneWasConnected && !cloneImg.isConnected)) {
				cleanup();
				return;
			}
			syncImageClone(sourceImg, cloneImg, snapshot);
		};

		mirror = {
			cleanup,
			isConnected: () => sourceImg.isConnected && cloneImg.isConnected,
		};

		observer.observe(sourceImg, { attributes: true, attributeFilter: IMAGE_MIRROR_ATTRIBUTES });
		sourceImg.addEventListener("load", sync, true);
		imageMirrors.add(mirror);
		sync();
	});
}

function pruneImageMirrors() {
	imageMirrors.forEach((mirror) => {
		if (!mirror.isConnected()) {
			mirror.cleanup();
		}
	});
}

function getImages(node: Node | Element) {
	if (node.nodeType !== Node.ELEMENT_NODE) return [];

	const element = node as Element;
	const images = Array.from(element.querySelectorAll<HTMLImageElement>("img"));
	if (element.tagName === "IMG") {
		images.unshift(element as HTMLImageElement);
	}

	return images;
}

function getImageSrc(img: HTMLImageElement | undefined) {
	return img?.currentSrc || img?.src || img?.getAttribute("src") || img?.getAttribute("data-src") || img?.getAttribute("data-thumb") || "";
}

function getImageSrcset(img: HTMLImageElement | undefined) {
	return img?.srcset || img?.getAttribute("srcset") || img?.getAttribute("data-srcset") || "";
}

function bindTimestampLinks(element: HTMLElement) {
	const anchors =
		element.tagName === "A" ? [element as HTMLAnchorElement] : Array.from(element.querySelectorAll<HTMLAnchorElement>("a[href]"));

	anchors.forEach((anchor) => {
		const timestamp = getTimestampSecondsFromLink(anchor);
		if (timestamp === null) return;

		bindTimestampLink(anchor, timestamp);
	});
}

function bindTimestampLink(anchor: HTMLAnchorElement, seconds: number) {
	anchor.classList.add("yttweak-comment-time-link");
	anchor.dataset.yttweakTimestamp = String(seconds);
	anchor.addEventListener(
		"click",
		(evt) => {
			if (!shouldInterceptTimestampClick(evt)) return;

			evt.preventDefault();
			evt.stopPropagation();
			evt.stopImmediatePropagation();
			seekPlayerTo(seconds);
		},
		true,
	);
}

function shouldInterceptTimestampClick(evt: MouseEvent) {
	return evt.button === 0 && !evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey;
}

function getTimestampSecondsFromLink(anchor: HTMLAnchorElement) {
	const href = anchor.getAttribute("href");
	const timestamp = parseTimestampFromHref(href);
	if (timestamp !== null) return timestamp;

	return isYouTubeWatchHref(href) ? parseTimestampText(anchor.textContent ?? "") : null;
}

function parseTimestampFromHref(href: string | null) {
	if (!href) return null;

	try {
		const url = new URL(href, window.location.href);
		return (
			parseTimestampValue(url.searchParams.get("t")) ??
			parseTimestampValue(url.searchParams.get("time_continue")) ??
			parseTimestampValue(url.searchParams.get("start"))
		);
	} catch {
		const match = href.match(/[?&#](?:t|time_continue|start)=([^&#]+)/i);
		return match ? parseTimestampValue(decodeURIComponent(match[1])) : null;
	}
}

function isYouTubeWatchHref(href: string | null) {
	if (!href) return false;

	try {
		const url = new URL(href, window.location.href);
		return ["www.youtube.com", "m.youtube.com", "youtube.com"].includes(url.hostname) && url.pathname === "/watch";
	} catch {
		return /^\/watch(?:[?#]|$)/.test(href);
	}
}

function parseTimestampValue(value: string | null) {
	if (!value) return null;

	const normalized = value.trim().toLowerCase();
	const textTime = parseTimestampText(normalized);
	if (textTime !== null) return textTime;

	if (/^\d+s?$/.test(normalized)) return Number(normalized.replace(/s$/, ""));

	const match = normalized.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
	if (!match || (!match[1] && !match[2] && !match[3])) return null;

	return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function parseTimestampText(text: string) {
	const parts = text
		.trim()
		.split(":")
		.map((part) => part.trim());

	if (parts.length < 2 || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;

	const numbers = parts.map(Number);
	const seconds = numbers[numbers.length - 1];
	const minutes = numbers[numbers.length - 2];
	if (seconds > 59 || minutes > 59) return null;

	return numbers.length === 2 ? minutes * 60 + seconds : numbers[0] * 3600 + minutes * 60 + seconds;
}

function seekPlayerTo(seconds: number) {
	const targetTime = Math.max(0, seconds);
	videoPlayer.player?.seekTo?.(targetTime, true);
	if (videoPlayer.videoStream) {
		videoPlayer.videoStream.currentTime = targetTime;
	}
	if (!isMiniPlayerOpen()) {
		window.scrollTo({ top: 0, left: window.scrollX, behavior: "smooth" });
	}
}

function isMiniPlayerOpen() {
	return Boolean(
		videoPlayer.player?.classList.contains("yttweak-mini-player-active") ||
			document.body.classList.contains("yttweak-mini-player-mode"),
	);
}

function escapeTextForTranslate(text: string) {
	return escapeHtml(text).replace(/\r\n|\r|\n/g, "<br/>");
}

function escapeHtml(text: string) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function decodeHtmlEntities(text: string) {
	const namedEntities: Record<string, string> = {
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&quot;": '"',
		"&apos;": "'",
		"&#39;": "'",
		"&nbsp;": "\u00A0",
	};

	return text
		.replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#39;/g, (entity) => namedEntities[entity] ?? entity)
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
		.replace(/&#x([\da-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
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
	v.querySelectorAll("button.yttweak-comment-translate-button")?.forEach((btn) => btn.remove());
	v.querySelectorAll(".yttweak-comment-translate")?.forEach((node) => node.remove());

	setTimeout(() => {
		const commentContentDom = v.querySelector("#content yt-attributed-string>span");

		if (!commentContentDom) return;

		const commentContent = createTranslationContent(commentContentDom);

		const toLang =
			config.get("comment.targetLanguage") === "auto" ? window.yt?.config_?.HL || "zh_TW" : config.get("comment.targetLanguage");
		const task: TranslateTask = {
			commentEl: v,
			contentDom: commentContentDom,
			plainText: commentContent.plainText,
			parts: commentContent.parts,
			textSegments: commentContent.textSegments,
			domNodes: commentContent.domNodes,
			shellNodes: commentContent.shellNodes,
			targetLang: toLang,
			mode: "auto",
		};

		if (commentContent.plainText.trim() === "" || /^[\d\p{P}\p{Z}\p{C}]*$/u.test(commentContent.plainText)) {
			appendTranslateButton(task);
			return;
		}

		translateQueue.push(task);

		// const t = document.createElement("span");
		// t.classList.add("yttweak-comment-translate-tag");
		// commentContentDom.parentElement?.appendChild(t);
	}, 100);
}
setInterval(() => {
	pruneImageMirrors();
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
		const segmentJobs = doing.flatMap((task) =>
			task.textSegments
				.map((segment, segmentIndex) => ({ task, segment, segmentIndex }))
				.filter((job) => job.segment.source.trim() !== ""),
		);
		if (segmentJobs.length === 0) {
			doing.forEach((task) => appendTranslateButton(task));
			return;
		}

		fetch("https://translate-pa.googleapis.com/v1/translateHtml", {
			headers: {
				"content-type": "application/json+protobuf",
				"x-goog-api-key": "AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520",
			},
			body: JSON.stringify([
				[segmentJobs.map((job) => escapeTextForTranslate(job.segment.source)), "auto", doing[0].targetLang],
				"te_lib",
			]),
			method: "POST",
		})
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				const translations: string[] = Array.isArray(data?.[0]) ? data[0] : [];
				const detectedLanguages: string[] = Array.isArray(data?.[1]) ? data[1] : [];
				const neverTranslateLanguages = config.get("comment.neverTranslateLanguages", []);
				const translatedSegmentsByTask = new Map<TranslateTask, string[]>();
				const detectedLanguageByTask = new Map<TranslateTask, string>();

				doing.forEach((task) => {
					translatedSegmentsByTask.set(
						task,
						task.textSegments.map((segment) => segment.source),
					);
				});

				segmentJobs.forEach((job, i) => {
					const translatedSegments = translatedSegmentsByTask.get(job.task);
					if (!translatedSegments) return;

					const result = translations[i];
					translatedSegments[job.segmentIndex] = typeof result === "string" ? result : job.segment.source;
					if (!detectedLanguageByTask.has(job.task) && detectedLanguages[i]) {
						detectedLanguageByTask.set(job.task, detectedLanguages[i]);
					}
				});

				doing.forEach((task) => {
					const result = translatedSegmentsByTask.get(task);
					if (!result) {
						appendTranslateButton(task);
						return;
					}
					const detectedLang = detectedLanguageByTask.get(task) || "auto";

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
							const target = mutation.target as HTMLElement;
							const parent = target?.closest("ytd-comment-view-model") as HTMLElement;
							if (
								node.nodeType !== Node.TEXT_NODE ||
								!parent ||
								target.nodeName !== "SPAN" ||
								!target.classList.contains("ytAttributedStringHost")
							) {
								continue;
							}
							parent.classList.remove("yttweak-processed-translate");
							handleTranslate(parent);
						}
					}
				}
			});
		},
	},
} as Record<string, Plugin>;

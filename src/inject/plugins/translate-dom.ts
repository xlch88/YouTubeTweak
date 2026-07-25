import config from "../config";
import type { Plugin } from "../types";
import {
	createTextSegment,
	decodeHtmlEntities,
	escapeTextForTranslate,
	getImageSrc,
	getImageSrcset,
	getTargetLanguage,
	googleTranslate,
	shouldSkipAutoTranslation,
	translatedHtmlToText,
	type TextSegment,
} from "../util/translate";

const NON_TRANSLATABLE_SELECTOR = "a, img, picture, svg, yt-icon, button, input, textarea, select, video, audio, canvas, iframe";
const VIDEO_LIST_TITLE_SELECTOR = [
	"yt-lockup-view-model .ytLockupViewModelMetadata .ytLockupMetadataViewModelTextContainer h3 a .ytAttributedStringWhiteSpacePreWrap",
	"ytd-video-renderer .text-wrapper #title-wrapper a#video-title yt-formatted-string",
	"ytm-shorts-lockup-view-model .shortsLockupViewModelHostOutsideMetadata h3.shortsLockupViewModelHostMetadataTitle a span.ytAttributedStringWhiteSpacePreWrap",
	".ytp-modern-videowall-still .ytp-modern-videowall-still-info .ytp-modern-videowall-still-info-title",
	"ytd-playlist-panel-video-renderer #meta span#video-title",
].join(",");
const observedVideoListTitles = new WeakSet<HTMLElement>();
let descriptionNavigating = false;

async function translatePlainText(source: string, targetLanguage: string) {
	const [translations, detectedLanguages] = await googleTranslate(source, "auto", targetLanguage);
	const translation = decodeHtmlEntities(translations[0] ?? "").trim();
	if (!translation || translation === source || shouldSkipAutoTranslation(detectedLanguages[0], targetLanguage)) return;
	return translation;
}

async function translateTextElement(element: HTMLElement, translationClass: string) {
	const source = element.textContent?.trim() ?? "";
	const currentTranslation = element.nextElementSibling;
	if (!source) {
		if (currentTranslation?.classList.contains(translationClass)) currentTranslation.remove();
		delete element.dataset.yttweakTranslation;
		return;
	}
	const targetLanguage = getTargetLanguage();
	const key = `${targetLanguage}\n${source}`;
	if (element.dataset.yttweakTranslation === key) return;

	element.dataset.yttweakTranslation = key;
	if (currentTranslation?.classList.contains(translationClass)) currentTranslation.remove();

	try {
		const translatedText = await translatePlainText(source, targetLanguage);
		if (element.dataset.yttweakTranslation !== key || element.textContent?.trim() !== source || !element.isConnected || !translatedText)
			return;

		const translation = document.createElement("span");
		translation.className = translationClass;
		translation.textContent = translatedText;
		element.after(translation);
	} catch {
		if (element.dataset.yttweakTranslation === key) delete element.dataset.yttweakTranslation;
	}
}

async function translateVideoTitle(metadata: HTMLElement) {
	const title = metadata.querySelector<HTMLElement>("#title h1 yt-formatted-string");
	if (!title) return;

	const h1 = title.parentElement;
	await translateTextElement(title, "yttweak-video-title-translate");
	h1?.classList.toggle("yttweak-video-title-translated", Boolean(h1?.querySelector(":scope > .yttweak-video-title-translate")));
}

function initVideoListTitles() {
	document.querySelectorAll<HTMLElement>(VIDEO_LIST_TITLE_SELECTOR).forEach((title) => {
		if (observedVideoListTitles.has(title)) return;
		observedVideoListTitles.add(title);
		title.dataset.yttweakTranslationHooked = "true";
		delete title.dataset.yttweakTranslation;
		const update = async () => {
			await translateTextElement(title, "yttweak-video-list-title-translate");
			const translated = Boolean(title.parentElement?.querySelector(":scope > .yttweak-video-list-title-translate"));
			title.parentElement?.classList.toggle("yttweak-video-list-title-translated", translated);
			title.closest("h3")?.classList.toggle("yttweak-video-list-title-translated", translated);
		};
		void update();
		new MutationObserver(() => void update()).observe(title, {
			subtree: true,
			childList: true,
			characterData: true,
		});
	});
}

async function translateVideoSummary(metadata: HTMLElement) {
	const summary = metadata.querySelector<HTMLElement>("#video-summary");
	const content = summary?.querySelector<HTMLElement>("#content");
	const collapsedTitle = summary?.querySelector<HTMLElement>("#collapsed-title");
	const source = content?.querySelector<HTMLElement>(".videoSummaryContentViewModelParagraphContainer");
	const sourceText = source?.innerText.trim();
	if (!summary || !content || !collapsedTitle || !source || !sourceText) return;

	if (!content.dataset.yttweakTranslationHooked) {
		content.dataset.yttweakTranslationHooked = "true";
		new MutationObserver(() => {
			const translation = summary.querySelector<HTMLElement>(".yttweak-video-summary-translate-collapsed");
			if (translation) translation.hidden = !content.hidden;
		}).observe(content, {
			attributes: true,
			attributeFilter: ["hidden"],
		});
	}

	const targetLanguage = getTargetLanguage();
	const key = `${targetLanguage}\n${sourceText}`;
	const currentExpandedTranslation = summary.querySelector(".yttweak-video-summary-translate-expanded");
	const currentCollapsedTranslation = summary.querySelector<HTMLElement>(".yttweak-video-summary-translate-collapsed");
	if (source.dataset.yttweakTranslation === key) {
		if (currentCollapsedTranslation) currentCollapsedTranslation.hidden = !content.hidden;
		return;
	}

	source.dataset.yttweakTranslation = key;
	currentExpandedTranslation?.remove();
	currentCollapsedTranslation?.remove();

	try {
		const translatedText = await translatePlainText(sourceText, targetLanguage);
		if (source.dataset.yttweakTranslation !== key || source.innerText.trim() !== sourceText || !source.isConnected || !translatedText) {
			return;
		}

		const expandedTranslation = document.createElement("span");
		expandedTranslation.className = "yttweak-video-description-translate yttweak-video-summary-translate-expanded";
		expandedTranslation.textContent = translatedText;
		source.after(expandedTranslation);

		const collapsedTranslation = document.createElement("span");
		collapsedTranslation.className = "yttweak-video-summary-translate-collapsed";
		collapsedTranslation.textContent = translatedText;
		collapsedTranslation.hidden = !content.hidden;
		collapsedTitle.after(collapsedTranslation);
	} catch {
		if (source.dataset.yttweakTranslation === key) delete source.dataset.yttweakTranslation;
	}
}

async function createRichTextTranslation(source: HTMLElement, targetLanguage: string) {
	const translation = source.cloneNode(true) as HTMLElement;
	translation.removeAttribute("id");
	translation.removeAttribute("data-yttweak-translation");
	translation.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));

	const segments: Array<[Text, TextSegment]> = [];
	const walker = document.createTreeWalker(translation, NodeFilter.SHOW_TEXT);
	while (walker.nextNode()) {
		const node = walker.currentNode as Text;
		const segment = createTextSegment(node.data);
		if (segment.source && !node.parentElement?.closest(NON_TRANSLATABLE_SELECTOR)) segments.push([node, segment]);
	}
	if (segments.length === 0) return null;

	const [translations, detectedLanguages] = await googleTranslate(
		segments.map(([, segment]) => escapeTextForTranslate(segment.source)),
		"auto",
		targetLanguage,
	);

	let changed = false;
	segments.forEach(([node, segment], index) => {
		const translatedText = translatedHtmlToText(translations[index] ?? "").trim();
		if (!translatedText || translatedText === segment.source || shouldSkipAutoTranslation(detectedLanguages[index], targetLanguage))
			return;

		node.data = segment.leading + translatedText + segment.trailing;
		changed = true;
	});

	return changed ? translation : null;
}

function syncRichTextImages(source: HTMLElement, translation: HTMLElement) {
	const sourceImages = source.querySelectorAll<HTMLImageElement>("img");
	translation.querySelectorAll<HTMLImageElement>("img").forEach((image, index) => {
		const syncImage = () => {
			const src = getImageSrc(sourceImages[index]);
			const srcset = getImageSrcset(sourceImages[index]);
			if (src) image.src = src;
			if (srcset) image.srcset = srcset;
			if (!src && !srcset) return false;

			image.loading = "eager";
			image.classList.add("ytCoreImageLoaded");
			return true;
		};
		if (!syncImage()) sourceImages[index]?.addEventListener("load", syncImage, { once: true });
	});
}

async function translateDescriptionSource(expander: HTMLElement, selector: string, branchName: "snippet" | "expanded") {
	const translationClass = `yttweak-video-description-translate-${branchName}`;
	const source = expander.querySelector<HTMLElement>(selector);
	if (!source || source.dataset.yttweakTranslation) return;
	source.dataset.yttweakTranslation = "true";

	try {
		const translation = await createRichTextTranslation(source, getTargetLanguage());
		if (!translation || !source.isConnected) return;

		translation.classList.add("ytd-text-inline-expander", "yttweak-video-description-translate", translationClass);
		syncRichTextImages(source, translation);
		expander.querySelector(`.${translationClass}`)?.remove();
		if (branchName === "snippet") {
			const attributedSnippetTextDom = expander.querySelector<HTMLElement>("#attributed-snippet-text");
			const snippetDom = expander.querySelector<HTMLElement>("#snippet");
			if (snippetDom && attributedSnippetTextDom) {
				snippetDom.style.maxHeight = `${attributedSnippetTextDom?.innerText.trim().split("\n").length * 20}px`;
				translation.style.maxHeight = `${attributedSnippetTextDom?.innerText.trim().split("\n").length * 20 - 2}px`;
			}
			expander.querySelector("#expand")?.after(translation);
		} else {
			source.closest("#expanded")?.append(translation);
		}
	} catch {
		delete source.dataset.yttweakTranslation;
	}
}

function translateWatchMetadata(metadata: HTMLElement) {
	if (config.get("translate.enable.videoTitle")) void translateVideoTitle(metadata);
	if (config.get("translate.enable.videoSummary")) void translateVideoSummary(metadata);
	if (!config.get("translate.enable.videoDescription") || descriptionNavigating) return;

	const title = metadata.querySelector<HTMLElement>("#title h1 yt-formatted-string")?.textContent?.trim();
	if (!title) return;

	const expander = metadata.querySelector<HTMLElement>("#description #description-inline-expander");
	if (!expander) return;

	void translateDescriptionSource(
		expander,
		":scope > #snippet > #snippet-text > #attributed-snippet-text > span.ytAttributedStringHost",
		"snippet",
	);
	void translateDescriptionSource(expander, ":scope > #expanded > yt-attributed-string > span.ytAttributedStringHost", "expanded");
}

export default {
	"translate.enable.videoTitle": {
		options: {
			reloadOnToggle: true,
		},
		enable() {},
		initWatchMetadata(metadata, setUpdateListener) {
			translateWatchMetadata(metadata);
			setUpdateListener(() => {
				if (!metadata.querySelector(".yttweak-video-description-translate-snippet")) translateWatchMetadata(metadata);
				if (
					metadata.querySelector(
						"#description-inline-expander > #expanded > yt-attributed-string > span.ytAttributedStringHost",
					) &&
					!metadata.querySelector(".yttweak-video-description-translate-expanded")
				)
					translateWatchMetadata(metadata);
			});
		},
	},
	"translate.enable.videoListTitle": {
		options: {
			reloadOnToggle: true,
		},
		enable() {
			initVideoListTitles();
			setInterval(initVideoListTitles, 500);
		},
	},
	"translate.enable.videoDescription": {
		options: {
			reloadOnToggle: true,
		},
		enable() {
			document.body.classList.add("yttweak-translate-video-description");
			window.addEventListener("yt-navigate-start", () => {
				descriptionNavigating = true;
				document
					.querySelectorAll<HTMLElement>("#description-inline-expander span.ytAttributedStringHost[data-yttweak-translation]")
					.forEach((source) => {
						delete source.dataset.yttweakTranslation;
					});
				document
					.querySelectorAll<HTMLElement>(
						".yttweak-video-description-translate-snippet, .yttweak-video-description-translate-expanded",
					)
					.forEach((translation) => translation.remove());
			});
			window.addEventListener("yt-page-data-updated", () => {
				descriptionNavigating = false;
				const metadata = document.querySelector<HTMLElement>("ytd-watch-metadata");
				if (metadata) translateWatchMetadata(metadata);
			});
		},
	},
	"translate.enable.videoSummary": {
		options: {
			reloadOnToggle: true,
		},
		enable() {},
	},
} as Record<string, Plugin>;

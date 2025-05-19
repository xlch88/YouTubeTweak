import config from "../config.js";
import { createLogger } from "../../logger.js";
const logger = createLogger("comment-translate");

let needTranslate = [];
function handleTranslate(v) {
	setTimeout(() => {
		let commentContentDom = v.querySelector("#content yt-attributed-string>span");
		let commentContent = "";
		commentContentDom.childNodes.forEach((child) => {
			if (child.nodeType === Node.TEXT_NODE) {
				commentContent += child.textContent;
			} else if (child.nodeType === Node.ELEMENT_NODE && child.childNodes.length >= 1) {
				if (child.childNodes[0]?.alt) {
					commentContent += child.childNodes[0].alt; // emoji
				}
				if (child.innerText) {
					commentContent += child.innerText;
				}
			}
		});

		let srcLang = detectLanguage(commentContent);
		let toLang = window?.yt?.config_?.HL || "zh_TW";
		if (
			srcLang === toLang ||
			(srcLang.startsWith("zh") && toLang.startsWith("zh")) ||
			commentContent.trim() === "" ||
			/^[\d\p{P}\p{Z}\p{C}]*$/u.test(commentContent)
		)
			return;

		needTranslate.push([commentContentDom, commentContent]);
	}, 100);
}
setInterval(() => {
	if (needTranslate.length === 0) return;
	const doing = needTranslate.map((v) => v);
	needTranslate = [];

	let toLang = window.yt?.config_?.HL || "zh_TW";
	fetch("https://translate-pa.googleapis.com/v1/translateHtml", {
		headers: {
			"content-type": "application/json+protobuf",
			"x-goog-api-key": "AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520",
		},
		body: JSON.stringify([[doing.map((v) => v[1].split("\n").join("<br/>")), "auto", toLang], "te_lib"]),
		method: "POST",
	})
		.then((res) => {
			return res.json();
		})
		.then((data) => {
			data[0].forEach((result, i) => {
				const transNode = document.createElement("div");
				transNode.className = "yttweak-comment-translate";
				transNode.textContent =
					(result.includes("<br/><br/>") ? "\n\n" : "\n") +
					decodeHtmlEntities(result)
						.replace(/❤/g, "❤️")
						.replace(/<br\/>/g, "\n");
				doing[i][0].parentElement.insertBefore(transNode, null);
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
				handleTranslate(v);
			});

			setUpdateListener((mutations) => {
				for (const mutation of mutations) {
					if (mutation.type === "childList") {
						mutation.addedNodes.forEach((v) => {
							if (v?.tagName?.toLowerCase() === "ytd-comment-view-model") {
								handleTranslate(v);
							}
						});
					}
				}
			});
		},
	},
};

// helper
function detectLanguage(text) {
	if (!text || typeof text !== "string") return "auto";

	const scores = {};
	const detectors = [
		{ lang: "zh-CN", regex: /[\u4e00-\u9fa5]/g, weight: 2 }, // 简体中文字形区
		{ lang: "zh-TW", regex: /[\u4e00-\u9fff]/g, weight: 1.5 }, // 共通中文字区，但较弱
		{ lang: "zh-TW", regex: /[\u3100-\u312f\u31a0-\u31bf]/g, weight: 3 }, // 注音
		{ lang: "ja", regex: /[\u3040-\u30ff\u31f0-\u31ff]/g, weight: 2 },
		{ lang: "ko", regex: /[\uac00-\ud7af]/g, weight: 2 },
		{ lang: "ru", regex: /[а-яё]/gi, weight: 1.5 },
		{ lang: "ar", regex: /[\u0600-\u06ff]/g, weight: 1.5 },
		{ lang: "iw", regex: /[\u0590-\u05ff]/g, weight: 1.5 },
		{ lang: "th", regex: /[\u0e00-\u0e7f]/g, weight: 1.5 },
		{ lang: "hi", regex: /[\u0900-\u097f]/g, weight: 1.5 },
		{ lang: "bn", regex: /[\u0980-\u09ff]/g, weight: 1.5 },
		{ lang: "ta", regex: /[\u0b80-\u0bff]/g, weight: 1.5 },
		{ lang: "el", regex: /[α-ω]/gi, weight: 1.2 },
		{ lang: "tr", regex: /[çğıöşü]/gi, weight: 1.2 },
		{ lang: "vi", regex: /[ăâđêôơư]/gi, weight: 1.2 },
		{ lang: "de", regex: /[äöüß]/gi, weight: 1.2 },
		{ lang: "fr", regex: /[éèêëàâæçùûüœ]/gi, weight: 1.2 },
		{ lang: "es", regex: /[ñáéíóúü¿¡]/gi, weight: 1.2 },
		{ lang: "pt", regex: /[ãõáâêéóôç]/gi, weight: 1.2 },
		{ lang: "it", regex: /[àèéìòù]/gi, weight: 1.2 },
		{ lang: "pl", regex: /[ąćęłńóśźż]/gi, weight: 1.2 },
		{ lang: "sv", regex: /[åäö]/gi, weight: 1.0 },
		{ lang: "no", regex: /[æøå]/gi, weight: 1.0 },
		{ lang: "da", regex: /[æøå]/gi, weight: 1.0 },
		{ lang: "cs", regex: /[čďěňřšťž]/gi, weight: 1.0 },
		{ lang: "hu", regex: /[áéíóöőúüű]/gi, weight: 1.0 },
		{ lang: "ro", regex: /[ăâîșț]/gi, weight: 1.0 },
		{ lang: "nl", regex: /[éèëï]/gi, weight: 1.0 },
		{ lang: "fi", regex: /[äö]/gi, weight: 1.0 },
		{ lang: "en", regex: /\b(the|and|you|this|that|are|is|was|of|to|in)\b/gi, weight: 0.6 },
		{ lang: "id", regex: /\b(saya|anda|dia|kami|mereka|tidak|itu)\b/gi, weight: 0.6 },
	];

	for (const { lang, regex, weight } of detectors) {
		const matches = text.match(regex);
		if (matches) {
			scores[lang] = (scores[lang] || 0) + matches.length * weight;
		}
	}

	const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
	return ranked.length ? ranked[0][0] : "auto";
}

function decodeHtmlEntities(str) {
	const namedEntities = {
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

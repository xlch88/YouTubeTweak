import { createI18n } from "vue-i18n";
import en from "@/assets/i18n/en-US.json";

export let i18n: ReturnType<typeof createI18n>;

export const locales: Record<string, string> = {
	"zh-CN": "简体中文 (Simple Chinese)",
	"zh-TW": "繁体中文 (Traditional Chinese)",
	"ja-JP": "日本語 (Japanese)",
	"es-ES": "Español (Spanish)",
	"en-US": "English (US)",
	"de-DE": "Deutsch (German)",
	"fr-FR": "Français (French)",
	"ar-SA": "العربية (Arabic)",
	"bn-BD": "বাংলা (Bengali)",
	"hi-IN": "हिन्दी (Hindi)",
	"ko-KR": "한국어 (Korean)",
	"pa-PK": "پنجابی (Punjabi)",
	"pt-BR": "Português (Portuguese)",
	"ru-RU": "Русский (Russian)",
	"uk-UA": "Українська (Ukrainian)",
	"id-ID": "Indonesia (Indonesian)",
	"vi-VN": "Tiếng Việt (Vietnamese)",
	"it-IT": "Italiano (Italian)",
	"tr-TR": "Türkçe (Turkish)",
	"fa-IR": "فارسی (Persian)",
	"th-TH": "ไทย (Thai)",
	"ms-MY": "Bahasa Melayu (Malay)",
	"ta-IN": "தமிழ் (Tamil)",
	"mr-IN": "मराठी (Marathi)",
	"te-IN": "తెలుగు (Telugu)",
};

export async function initI18n() {
	let locale = localStorage.getItem("lang");
	if (!locale) {
		const shotKey = Object.fromEntries(Object.keys(locales).map((v) => [v.split("-")[0], v]));

		for (const l of window?.navigator?.languages) {
			if (locales[l]) {
				locale = l;
				break;
			} else if (shotKey[l]) {
				locale = shotKey[l];
				break;
			}
		}
	}
	if (!locale || !locales[locale]) {
		locale = "en-US";
	}
	localStorage.setItem("lang", locale);
	document.documentElement.lang = locale;

	i18n = createI18n({
		locale: locale,
		fallbackLocale: "en-US",
		messages: {
			"en-US": en,
		},
	});

	await loadLocaleMessages(locale);
	return i18n;
}

export async function loadLocaleMessages(locale: string) {
	if (locale === "en-US") return Promise.resolve();
	if (i18n.global.availableLocales.includes(locale)) {
		return Promise.resolve();
	}
	let messages: Record<string, any>;

	try {
		messages = (await import(`@/assets/i18n/${locale}.json`)).default;
	} catch (error) {
		console.warn(`[i18n] Failed to load locale ${locale}, falling back to en-US.`, error);

		i18n.global.locale = "en-US";

		localStorage.setItem("lang", "en-US");
		document.documentElement.lang = "en-US";
		return Promise.resolve();
	}

	function cleanNeedTranslate(messages: Record<string, any>) {
		for (const [key, value] of Object.entries(messages)) {
			if (typeof value === "string" && value.startsWith("__NEED_TRANSLATE__")) {
				delete messages[key];
			} else if (typeof value === "object") {
				cleanNeedTranslate(value);
			}
		}
	}
	cleanNeedTranslate(messages);

	document.documentElement.lang = locale;
	i18n.global.setLocaleMessage(locale, messages);
}

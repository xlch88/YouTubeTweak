import { createI18n } from "vue-i18n";
import en from "@/assets/i18n/en-US.json";

export let i18n: ReturnType<typeof createI18n>;

export const locales: Record<string, string> = {
	"zh-CN": "简体中文 (Simple Chinese)",
	"zh-TW": "繁体中文 (Traditional Chinese)",
	"ja-JP": "日本語 (Japanese)",
	"en-US": "English (US)",
	"fr-FR": "Français (French)",
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
	let messages = (await import(`@/assets/i18n/${locale}.json`)).default;

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

	i18n.global.setLocaleMessage(locale, messages);
}

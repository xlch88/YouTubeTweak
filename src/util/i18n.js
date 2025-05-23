import { createI18n } from "vue-i18n";
import en from "../assets/i18n/en.json";

export let i18n;

export const locales = {
	zh: "简体中文 (Simple Chinese)",
	"zh-TW": "繁体中文 (Traditional Chinese)",
	en: "English",
	ja: "日本語 (Japanese)",
};

export async function initI18n() {
	let locale = window?.navigator?.language || "zh";
	if (!locales[locale] && locale.includes("-") && locales[locale.split("-")[0]]) {
		locale = locale.split("-")[0];
	}

	i18n = createI18n({
		locale: locale,
		fallbackLocale: "en",
		messages: {
			en: en,
		},
	});

	await loadLocaleMessages(locale);
	return i18n;
}

export async function loadLocaleMessages(locale) {
	const messages = await import(`../assets/i18n/${locale}.json`);
	i18n.global.setLocaleMessage(locale, messages.default);
}

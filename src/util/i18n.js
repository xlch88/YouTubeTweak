import { createI18n } from "vue-i18n";
import en from "../assets/i18n/en-US.json";

export let i18n;

export const locales = {
	"zh-CN": "简体中文 (Simple Chinese)",
	"zh-TW": "繁体中文 (Traditional Chinese)",
	"ja-JP": "日本語 (Japanese)",
	"en-US": "English (US)",
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
	if (!locales[locale]) {
		locale = "en-US";
	}
	localStorage.setItem("lang", locale);

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

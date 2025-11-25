<template>
	<section id="page-comment">
		<div class="card">
			<div class="card-title">{{ $t("comment.nickname.title") }}</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.nickname']" />
					<span>{{ $t("comment.nickname.checkbox.showNickname") }}</span>
				</label>
			</div>
		</div>
		<div class="card">
			<div class="card-title">{{ $t("comment.context.title") }}</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.autoShowMore']" />
					<span>{{ $t("comment.context.checkbox.autoShowMore") }}</span>
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.autoTranslate']" />
					<span>{{ $t("comment.context.checkbox.autoTranslate") }}</span>
				</label>

				<label class="form-item form-item-select">
					<span>{{ $t("comment.context.select.targetLanguage") }}: </span>
					<select v-model="config['comment.targetLanguage']">
						<option value="auto">{{ $t("comment.context.select.option.auto") }}</option>
						<option v-for="(v, k) in locales" :value="k" :key="k">{{ v }}</option>
					</select>
				</label>

				<label class="form-item form-item-select">
					<span style="white-space: break-spaces">{{ $t("comment.context.select.neverTranslate") }}</span>
					<select v-model="config['comment.neverTranslateLanguages']" multiple>
						<option v-for="(v, k) in locales" :value="k" :key="k">{{ v }}</option>
					</select>
				</label>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import useConfigStore from "../util/config";
const config = useConfigStore();
const locales: Record<string, string> = {
	af: "Afrikaans",
	az: "Azərbaycan",
	id: "Bahasa Indonesia",
	ms: "Bahasa Malaysia",
	bs: "Bosanski",
	ca: "Català",
	cs: "Čeština",
	da: "Dansk",
	de: "Deutsch",
	et: "Eesti",
	"en-IN": "English (India)",
	"en-GB": "English (UK)",
	en: "English (US)",
	es: "Español (España)",
	"es-419": "Español (Latinoamérica)",
	"es-US": "Español (US)",
	eu: "Euskara",
	fil: "Filipino",
	fr: "Français",
	"fr-CA": "Français (Canada)",
	gl: "Galego",
	hr: "Hrvatski",
	zu: "IsiZulu",
	is: "Íslenska",
	it: "Italiano",
	sw: "Kiswahili",
	lv: "Latviešu valoda",
	lt: "Lietuvių",
	hu: "Magyar",
	nl: "Nederlands",
	no: "Norsk",
	uz: "O‘zbek",
	pl: "Polski",
	"pt-PT": "Português",
	pt: "Português (Brasil)",
	ro: "Română",
	sq: "Shqip",
	sk: "Slovenčina",
	sl: "Slovenščina",
	"sr-Latn": "Srpski",
	fi: "Suomi",
	sv: "Svenska",
	vi: "Tiếng Việt",
	tr: "Türkçe",
	be: "Беларуская",
	bg: "Български",
	ky: "Кыргызча",
	kk: "Қазақ Тілі",
	mk: "Македонски",
	mn: "Монгол",
	ru: "Русский",
	sr: "Српски",
	uk: "Українська",
	el: "Ελληνικά",
	hy: "Հայերեն",
	iw: "עברית",
	ur: "اردو",
	ar: "العربية",
	fa: "فارسی",
	ne: "नेपाली",
	mr: "मराठी",
	hi: "हिन्दी",
	as: "অসমীয়া",
	bn: "বাংলা",
	pa: "ਪੰਜਾਬੀ",
	gu: "ગુજરાતી",
	or: "ଓଡ଼ିଆ",
	ta: "தமிழ்",
	te: "తెలుగు",
	kn: "ಕನ್ನಡ",
	ml: "മലയാളം",
	si: "සිංහල",
	th: "ภาษาไทย",
	lo: "ລາວ",
	my: "ဗမာ",
	ka: "ქართული",
	am: "አማርኛ",
	km: "ខ្មែរ",
	"zh-CN": "中文 (简体)",
	"zh-TW": "中文 (繁體)",
	"zh-HK": "中文 (香港)",
	ja: "日本語",
	ko: "한국어",
};
</script>

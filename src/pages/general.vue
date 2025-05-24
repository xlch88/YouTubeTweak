<template>
	<div class="card">
		<div class="card-title">{{ $t("general.about.title") }}</div>
		<div class="card-body about">
			<img src="/assets/img/logo.svg" alt="logo" />
			<p class="title">YouTube Tweak</p>
			<p class="version">
				v{{ APP_INFO.version }}<br /><span>Build at {{ APP_INFO.build }}</span>
			</p>
			<p>Copyright &copy; {{ new Date().getFullYear() }} <a href="https://dark495.me/" target="_blank">Dark495</a></p>
			<p class="link">
				<a href="https://github.com/xlch88/YouTubeTweak" target="_blank">⭐{{ $t("general.about.link.github") }}</a> |
				<a href="https://github.com/xlch88/YouTubeTweak/releases" target="_blank">📓{{ $t("general.about.link.changelog") }}</a> |
				<a href="https://github.com/xlch88/YouTubeTweak/issues" target="_blank">❓{{ $t("general.about.link.issue") }}</a>
			</p>
		</div>
	</div>

	<div class="card">
		<div class="card-title">{{ $t("general.language.title") }} (Language)</div>
		<div class="card-body config">
			<select @change="setLocale" v-model="locale">
				<option v-for="(name, key) of locales" :key="key" :value="key">{{ name }}</option>
			</select>
		</div>
	</div>

	<div class="card">
		<div class="card-title">{{ $t("general.config.title") }}</div>
		<div class="card-body config">
			<button class="btn">{{ $t("general.config.button.exportConfig") }} ⤴️</button>
			<button class="btn">{{ $t("general.config.button.importConfig") }} ⤵️</button>
			<button class="btn" @click="resetConfig()">{{ $t("general.config.button.resetConfig") }} 🔄</button>
		</div>
	</div>
</template>

<script setup>
import useConfigStore from "../util/config.js";
const config = useConfigStore();

import { useI18n } from "vue-i18n";
const { t } = useI18n();

import { inject, ref } from "vue";
const setTab = inject("setTab");

import { locales, i18n, loadLocaleMessages } from "../util/i18n.js";
const language = locales;
const locale = ref(i18n.global.locale);

const APP_INFO = window.__APP_INFO__;

function resetConfig() {
	if (!confirm(t("general.config.alert.resetConfig"))) return;

	config.$reset();
	setTab("player");
}

function setLocale(e) {
	locale.value = e.target.value;

	loadLocaleMessages(locale.value).then(() => {
		i18n.global.locale = locale.value;
		localStorage.setItem("lang", locale.value);
	});
}
</script>

<style lang="scss" scoped>
.about {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;

	img {
		width: 100px;
		height: 80px;
	}

	p {
		margin: 10px 0;
		text-align: center;
		&.title {
			font-size: 20px;
			font-weight: bolder;
			margin-top: 10px;
			color: black;
		}
		&.version {
			font-size: 15px;
			margin-bottom: 20px;
			span {
				color: rgba(#000, 0.5);
			}
		}
	}
}

.config {
	display: flex;
	gap: 5px;
	.btn {
		flex: 1;
	}
}
</style>

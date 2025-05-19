<template>
	<div class="about">
		<img src="/assets/img/logo.svg" alt="logo" />
		<p class="title">YouTube Tweak</p>
		<p class="version">
			v{{ APP_INFO.version }}<br /><span>Build at {{ APP_INFO.build }}</span>
		</p>
		<p class="config">
			<button class="btn">{{ $t("about.config.button.exportConfig") }} ⤴️</button>
			<button class="btn">{{ $t("about.config.button.importConfig") }} ⤵️</button>
			<button class="btn" @click="resetConfig()">{{ $t("about.config.button.resetConfig") }} 🔄</button>
		</p>
		<p>Copyright &copy; {{ new Date().getFullYear() }} <a href="https://dark495.me/" target="_blank">Dark495</a></p>
		<p class="link">
			<a href="https://github.com/xlch88/YouTubeTweak" target="_blank">⭐{{ $t("about.link.github") }}</a> |
			<a href="https://github.com/xlch88/YouTubeTweak/releases" target="_blank">📓{{ $t("about.link.changelog") }}</a> |
			<a href="https://github.com/xlch88/YouTubeTweak/issues" target="_blank">❓{{ $t("about.link.issue") }}</a>
		</p>
	</div>
</template>

<script setup>
import { inject } from "vue";
import useConfigStore from "../util/config.js";
const config = useConfigStore();

import { useI18n } from "vue-i18n";
const { t } = useI18n();
const setTab = inject("setTab");

const APP_INFO = window.__APP_INFO__;

function resetConfig() {
	if (!confirm(t("about.config.alert.resetConfig"))) return;

	config.$reset();
	setTab("player");
}
</script>

<style lang="scss">
.about {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	background: #fff;

	img {
		width: 150px;
		height: 150px;
	}

	p {
		margin: 10px 0;
		text-align: center;
		&.title {
			font-size: 20px;
			font-weight: bolder;
			margin-top: 10px;
		}
		&.config {
			display: flex;
			gap: 5px;
		}
		&.version {
			font-size: 15px;
			margin-bottom: 50px;
			span {
				color: rgba(#000, 0.5);
			}
		}
	}
}
</style>

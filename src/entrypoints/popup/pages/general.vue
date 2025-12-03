<template>
	<section id="page-general">
		<div class="tips tips-success" v-if="waitUpdate">
			<p>
				<b>{{ $t("general.update.tips.0", { version: waitUpdate }) }}</b>
				<br />
				{{ $t("general.update.tips.1") }}
				<a href="">{{ $t("general.update.buttons.log") }}</a>
			</p>
			<button @click="updateNow()" class="btn btn-green">{{ $t("general.update.buttons.update") }}</button>
		</div>

		<div class="tips tips-warning" v-if="warningFetchHooker">
			<p>
				<b>{{ $t("general.warning.tips.title") }}</b>
				<br />
				{{ $t("general.warning.tips.fetchHooker") }}
			</p>
		</div>

		<div class="card">
			<div class="card-title">{{ $t("general.about.title") }}</div>
			<div class="card-body about">
				<img src="@/assets/img/logo.svg" alt="logo" />
				<p class="title">YouTube Tweak</p>
				<p class="version" :title="$t('general.update.tips.2')" @click="requestUpdateCheck()">
					v{{ APP_INFO.version }}<br /><span>Build at {{ APP_INFO.build }}</span>
				</p>
				<p>Copyright &copy; {{ new Date().getFullYear() }} <a href="https://dark495.me/" target="_blank">Dark495</a></p>
				<p class="link">
					<a href="https://github.com/xlch88/YouTubeTweak" target="_blank">⭐{{ $t("general.about.link.github") }}</a> |
					<a href="https://github.com/xlch88/YouTubeTweak/releases" target="_blank">📓{{ $t("general.about.link.changelog") }}</a>
					|
					<a href="https://github.com/xlch88/YouTubeTweak/issues" target="_blank">❓{{ $t("general.about.link.issue") }}</a>
				</p>
			</div>
		</div>

		<div class="card">
			<div class="card-title">{{ $t("general.language.title") }} (Language)</div>
			<div class="card-body">
				<select class="w-100" @change="setLocale" v-model="locale">
					<option v-for="(name, key) of locales" :key="key" :value="key">{{ name }}</option>
				</select>
				<a :href="`https://github.com/xlch88/YoutubeTweak/blob/main/TRANSLATORS.md#${locale}`" target="_blank">{{
					$t("general.language.link.translator")
				}}</a>
			</div>
		</div>

		<div class="card">
			<div class="card-title">{{ $t("general.config.title") }}</div>
			<div class="card-body config">
				<button class="btn" @click="showConfigModal('export')">{{ $t("general.config.button.exportConfig") }} ⤴️</button>
				<button class="btn" @click="showConfigModal('import')">{{ $t("general.config.button.importConfig") }} ⤵️</button>
				<button class="btn" @click="resetConfig()">{{ $t("general.config.button.resetConfig") }} 🔄</button>
			</div>
		</div>

		<div class="config-modal" v-if="configModalType">
			<div class="config-modal-body">
				<textarea
					ref="configTextarea"
					spellcheck="false"
					autocorrect="off"
					autocapitalize="off"
					autocomplete="off"
					v-model="configModalValue"
					:placeholder="
						configModalType === 'import' ? $t('general.config.modal.importTips') : $t('general.config.modal.exportTips')
					"
				></textarea>
				<div class="buttons">
					<button class="btn" @click="configModalType = configModalValue = ''">
						{{ $t("general.config.button.cancel") }}
					</button>
					<button class="btn" @click="configModalSubmit()">
						{{ configModalType === "import" ? $t("general.config.button.submit") : $t("general.config.button.copy") }}
					</button>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import useConfigStore from "../util/config";
const config = useConfigStore();

import { useI18n } from "vue-i18n";
const { t } = useI18n();

import { inject, ref, computed } from "vue";
const setTab = inject("setTab") as (v: string) => void;

import { locales, i18n, loadLocaleMessages } from "../util/i18n";
const language = locales;
const locale = ref(i18n.global.locale as string);

const APP_INFO = window.__APP_INFO__;

const warningFetchHooker = computed(() => {
	return config["other.antiAD.enableVideo"] || config["translate.enable.timedtext"];
});

function resetConfig() {
	if (!confirm(t("general.config.alert.resetConfig"))) return;

	config.$reset();
	setTab("player");
}

function setLocale(e: Event) {
	locale.value = (e.target as HTMLSelectElement).value;

	loadLocaleMessages(locale.value).then(() => {
		i18n.global.locale = locale.value;
		document.documentElement.lang = locale.value;
		localStorage.setItem("lang", locale.value);
	});
}

const configModalType = ref("");
const configModalValue = ref("");
function showConfigModal(type: string) {
	configModalType.value = type;
	configModalValue.value = type === "import" ? "" : JSON.stringify(config.$state, null, 2);
}
function configModalSubmit() {
	if (configModalType.value === "import") {
		try {
			const newConfig = JSON.parse(configModalValue.value);
			config.$patch(newConfig);
			config.saveStorage();
			alert(t("general.config.alert.importSuccess"));

			configModalType.value = "";
			configModalValue.value = "";
		} catch (e) {
			alert(t("general.config.alert.importError"));
		}
	} else if (configModalType.value === "export") {
		navigator.clipboard
			.writeText(configModalValue.value)
			.then(() => {
				alert(t("general.config.alert.copySuccess"));

				configModalType.value = "";
				configModalValue.value = "";
			})
			.catch(() => {
				alert(t("general.config.alert.copyError"));
			});
	}
}

const waitUpdate = ref("");
browser.storage.local.get("waitUpdate").then((data) => {
	if (data.waitUpdate) {
		waitUpdate.value = data.waitUpdate;
	}
});
async function requestUpdateCheck() {
	if (!browser?.runtime?.requestUpdateCheck) {
		alert(t("general.update.alert.unsupportedUpdate"));
		return;
	}

	if (waitUpdate.value) {
		return;
	}

	const result = (await browser.runtime.requestUpdateCheck()) as {
		status: "throttled" | "no_update" | "update_available";
		version?: string;
	};
	if (result.status === "update_available") {
		waitUpdate.value = result.version || "";
	} else if (result.status === "no_update") {
		alert(t("general.update.alert.noUpdate"));
	} else {
		alert(t("general.update.alert.busy"));
	}
}
function updateNow() {
	browser.storage.local.set({ needReloadTabs: true }).then(() => {
		browser.runtime.reload();
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
			cursor: pointer;
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

.config-modal {
	position: fixed;
	z-index: 9998;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	background: rgba(black, 0.7);

	.config-modal-body {
		margin: 60px 20px 20px;
		height: calc(100% - 20px - 60px);
		width: calc(100% - 40px);
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		gap: 10px;

		textarea {
			width: 100%;
			height: 100%;
			font-family: "Courier New", monospace;
			font-size: 11px;
			resize: none;
		}
		.buttons {
			display: flex;
			gap: 10px;
			height: 30px;
			button {
				width: 100%;
			}
		}
	}
}
</style>

<template>
	<section id="page-general">
		<div class="tips tips-success" v-if="waitUpdate">
			<p>
				<b>{{ $t("general.update.tips.0", { version: waitUpdate }) }}</b>
				<br />
				{{ $t("general.update.tips.1") }}
			</p>
			<button @click="showChangelog('manual')" class="btn">{{ $t("general.update.buttons.log") }}</button>
			<button @click="updateNow()" class="btn btn-green">{{ $t("general.update.buttons.update") }}</button>
		</div>

		<div class="tips tips-warning" v-if="warningFetchHooker">
			<p>
				<b>{{ $t("general.warning.tips.title") }}</b>
				<br />
				{{ $t("general.warning.tips.fetchHooker") }}
			</p>
		</div>

		<div ref="sponsorCard" class="tips tips-sponsor" v-if="sponsorCardVisible">
			<p>
				<b>{{ $t("general.sponsor.tips.title") }}</b>
				<br />
				{{ $t("general.sponsor.tips.description") }}
			</p>
			<div class="sponsor-actions">
				<button type="button" class="sponsor-button">{{ $t("general.sponsor.buttons.sponsor") }}</button>
				<button type="button" class="sponsor-dismiss" @click="sponsorCardVisible = false">
					{{ $t("general.sponsor.buttons.noThanks") }}
				</button>
			</div>
		</div>

		<div class="card">
			<div class="card-title">
				<span>{{ $t("general.about.title") }}</span>
				<DocsHelpLink anchor="general-about" />
			</div>
			<div class="card-body about">
				<img :src="APP_LOGO" alt="logo" />
				<p class="title">{{ APP_BRANDING.displayName }}</p>
				<p class="version">
					<span :title="$t('general.update.tips.2')" @click="requestUpdateCheck()">
						v{{ APP_INFO.version }}<br />
						Build at {{ APP_INFO.build }}
					</span>
					<br />
					<a class="commit-link" :href="APP_INFO.commit.url" target="_blank" rel="noopener noreferrer" @click.stop>
						Commit {{ APP_INFO.commit.id }}
					</a>
				</p>
				<p>Copyright &copy; {{ new Date().getFullYear() }} <a href="https://dark495.me/" target="_blank">Dark495</a></p>
				<div class="about-links">
					<a class="about-link about-link-source" href="https://github.com/xlch88/YouTubeTweak" target="_blank">
						<span class="about-link-icon">⭐</span>
						<span>{{ $t("general.about.link.github") }}</span>
					</a>
					<button class="about-link about-link-changelog" @click="showChangelog('manual')">
						<span class="about-link-icon">📓</span>
						<span>{{ $t("general.about.link.changelog") }}</span>
					</button>
					<a class="about-link about-link-issue" href="https://github.com/xlch88/YouTubeTweak/issues" target="_blank">
						<span class="about-link-icon">❓</span>
						<span>{{ $t("general.about.link.issue") }}</span>
					</a>
					<button class="about-link about-link-sponsor" @click="showSponsorCard()">
						<span class="about-link-icon">💖</span>
						<span>{{ $t("general.about.link.sponsor") }}</span>
					</button>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="card-title">
				<span>{{ $t("general.language.title") }} (Language)</span>
				<DocsHelpLink anchor="general-language" />
			</div>
			<div class="card-body">
				<select class="w-100" @change="setLocale" v-model="locale">
					<option v-for="(name, key) of locales" :key="key" :value="key">{{ name }}</option>
				</select>
				<a :href="`https://github.com/xlch88/YoutubeTweak/blob/main/docs/TRANSLATORS.md#${locale}`" target="_blank">{{
					$t("general.language.link.translator")
				}}</a>
			</div>
		</div>

		<div class="card">
			<div class="card-title">
				<span>{{ $t("general.update.title") }}</span>
			</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['yttweak.disableUpdateNotice']" />
					<span>{{ $t("general.update.checkbox.disableNotice") }}</span>
					<DocsHelpLink anchor="general-update-notice-disable" />
				</label>
			</div>
		</div>

		<div class="card config-card">
			<div class="card-title">
				<span>{{ $t("general.config.title") }}</span>
				<DocsHelpLink anchor="general-config" />
			</div>
			<div class="card-body config">
				<button class="btn" @click="showConfigModal('export')">
					<span>⤴️</span>{{ $t("general.config.button.exportConfig") }}
				</button>
				<button class="btn" @click="showConfigModal('import')">
					<span>⤵️</span>{{ $t("general.config.button.importConfig") }}
				</button>
				<button class="btn" @click="resetConfig()"><span>🔄</span>{{ $t("general.config.button.resetConfig") }}</button>
			</div>
		</div>

		<transition name="modal-fade">
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
					<label v-if="configModalType === 'export'" class="config-memory-checkbox">
						<input type="checkbox" v-model="configModalExportMemory" @change="updateExportConfigValue" />
						<span>{{ $t("general.config.modal.exportMemory") }}</span>
						<DocsHelpLink anchor="general-config-export" />
					</label>
					<label v-else-if="importConfigHasMemoryChunk" class="config-memory-checkbox">
						<input type="checkbox" v-model="configModalImportMemory" />
						<span>{{ $t("general.config.modal.importMemoryConfirm") }}</span>
						<DocsHelpLink anchor="general-config-import" />
					</label>
					<div class="buttons">
						<button class="btn" @click="configModalType = configModalValue = ''">
							{{ $t("general.config.button.cancel") }}
						</button>
						<button class="btn" :disabled="configModalBusy" @click="configModalSubmit()">
							{{ configModalType === "import" ? $t("general.config.button.submit") : $t("general.config.button.copy") }}
						</button>
					</div>
				</div>
			</div>
		</transition>

		<transition name="modal-fade">
			<div class="changelog-modal" v-if="changelogModalVisible">
				<div class="changelog-modal-body">
					<div class="changelog-modal-header">
						<div>
							<h2>{{ changelogModalTitle }}</h2>
							<p>
								<span>{{ changelogModalSubtitle }}</span>
								<a class="changelog-github-link" :href="changelogGithubUrl" target="_blank">CHANGELOG.md</a>
							</p>
						</div>
						<button class="changelog-modal-close" :aria-label="$t('general.changelog.buttons.close')" @click="closeChangelog()">
							&times;
						</button>
					</div>
					<div class="changelog-modal-content">
						<div class="changelog-status" v-if="changelogLoading">{{ $t("general.changelog.loading") }}</div>
						<div class="changelog-status changelog-error" v-else-if="changelogError">{{ changelogError }}</div>
						<div class="changelog-list" v-else-if="changelogReleases.length">
							<article class="changelog-release" v-for="release in changelogReleases" :key="release.version">
								<h3>
									v{{ release.version }}
									<span v-if="release.date">{{ release.date }}</span>
								</h3>
								<section class="changelog-group" v-for="group in release.groups" :key="`${release.version}-${group.type}`">
									<h4>{{ $t(`general.changelog.groups.${group.type}`) }}</h4>
									<ul>
										<li v-for="(item, index) in group.items" :key="index">
											<b v-if="item.scope">{{ item.scope }}</b>
											<span>{{ item.text }}</span>
										</li>
									</ul>
								</section>
							</article>
						</div>
						<div class="changelog-status" v-else>{{ $t("general.changelog.empty") }}</div>
					</div>
					<div class="changelog-modal-footer">
						<button class="btn" @click="closeChangelog()">{{ $t("general.changelog.buttons.close") }}</button>
					</div>
				</div>
			</div>
		</transition>

		<transition name="modal-fade">
			<div class="reset-confirm-modal" v-if="resetConfirmVisible" @click.self="resetConfirmVisible = false">
				<div class="reset-confirm-modal-body" role="dialog" aria-modal="true">
					<p>{{ $t("general.config.alert.resetConfig") }}</p>
					<div class="buttons">
						<button type="button" class="btn btn-cancel" @click="resetConfirmVisible = false">
							{{ $t("general.config.button.cancel") }}
						</button>
						<button type="button" class="btn btn-danger" @click="confirmResetConfig()">
							{{ $t("general.config.button.resetConfig") }}
						</button>
					</div>
				</div>
			</div>
		</transition>

		<div class="page-toast" v-if="toastMessage">{{ toastMessage }}</div>
	</section>
</template>

<script setup lang="ts">
import {
	CHANGELOG_URL,
	READ_CHANGELOG_VERSION_STORAGE_KEY,
	compareVersions,
	markChangelogVersionRead,
} from "@/util/versionNotice";
import appleLogo from "@/assets/img/logo_apple.svg";
import logo from "@/assets/img/logo.svg";
import DocsHelpLink from "../components/DocsHelpLink.vue";
import useConfigStore from "../util/config";
const config = useConfigStore();

import { useI18n } from "vue-i18n";
const { t } = useI18n();

import { inject, ref, computed, watch, nextTick } from "vue";
const setTab = inject("setTab") as (v: string) => void;

import { locales, i18n, loadLocaleMessages } from "../util/i18n";
const language = locales;
const locale = ref(i18n.global.locale as string);

const APP_INFO = window.__APP_INFO__;
const APP_BRANDING = __APP_BRANDING__;
const APP_LOGO = APP_BRANDING.isSafari ? appleLogo : logo;
const sponsorCard = ref<HTMLElement>();
const sponsorCardVisible = ref(false);

const warningFetchHooker = computed(() => {
	return config["translate.enable.timedtext"] || config["other.premiumLogo.enable"];
});

const toastMessage = ref("");
const resetConfirmVisible = ref(false);
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(message: string) {
	toastMessage.value = message;
	if (toastTimer) clearTimeout(toastTimer);
	toastTimer = setTimeout(() => {
		toastMessage.value = "";
		toastTimer = undefined;
	}, 1000);
}

function resetConfig() {
	resetConfirmVisible.value = true;
}

function confirmResetConfig() {
	resetConfirmVisible.value = false;
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

async function showSponsorCard() {
	sponsorCardVisible.value = true;
	await nextTick();
	sponsorCard.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const configModalType = ref("");
const configModalValue = ref("");
const configModalBusy = ref(false);
const configModalExportMemory = ref(false);
const configModalImportMemory = ref(false);
let exportConfigUpdateId = 0;
const MEMORY_CHUNK_KEY = "memoryChunk";
const MEMORY_INDEX_KEY = "memoryI";
const MEMORY_TABLE_PREFIX = "memory_";

type MemoryChunk = Record<string, unknown>;

function isRecord(v: unknown): v is Record<string, unknown> {
	return !!v && typeof v === "object" && !Array.isArray(v);
}

const importConfigHasMemoryChunk = computed(() => {
	if (configModalType.value !== "import") return false;
	try {
		const newConfig = JSON.parse(configModalValue.value);
		return isRecord(newConfig) && Object.prototype.hasOwnProperty.call(newConfig, MEMORY_CHUNK_KEY);
	} catch (e) {
		return false;
	}
});

watch(configModalValue, () => {
	if (configModalType.value === "import") {
		configModalImportMemory.value = false;
	}
});

function isMemoryStorageKey(key: string) {
	return key === MEMORY_INDEX_KEY || key.startsWith(MEMORY_TABLE_PREFIX);
}

function pickMemoryChunk(items: Record<string, unknown>) {
	return Object.fromEntries(Object.entries(items).filter(([key]) => isMemoryStorageKey(key))) as MemoryChunk;
}

async function getMemoryChunk() {
	const storageItems = (await browser.storage.sync.get()) as Record<string, unknown>;
	return pickMemoryChunk(storageItems);
}

async function overwriteMemoryChunk(memoryChunk: unknown) {
	if (!isRecord(memoryChunk)) throw new Error("Invalid memoryChunk");

	const importedMemoryItems = pickMemoryChunk(memoryChunk);
	const currentStorageItems = (await browser.storage.sync.get()) as Record<string, unknown>;
	const currentMemoryKeys = Object.keys(currentStorageItems).filter(isMemoryStorageKey);
	const importedMemoryKeys = Object.keys(importedMemoryItems);
	const staleMemoryKeys = currentMemoryKeys.filter((key) => !importedMemoryKeys.includes(key));

	if (importedMemoryKeys.length > 0) {
		await browser.storage.sync.set(importedMemoryItems);
	}
	if (staleMemoryKeys.length > 0) {
		await browser.storage.sync.remove(staleMemoryKeys);
	}
}

async function updateExportConfigValue() {
	if (configModalType.value !== "export") return;

	const updateId = ++exportConfigUpdateId;
	const exportMemory = configModalExportMemory.value;
	const exportConfig = JSON.parse(JSON.stringify(config.$state)) as Record<string, unknown>;
	configModalBusy.value = exportMemory;
	try {
		if (exportMemory) {
			exportConfig[MEMORY_CHUNK_KEY] = await getMemoryChunk();
		}
		if (updateId === exportConfigUpdateId) {
			configModalValue.value = JSON.stringify(exportConfig, null, 2);
		}
	} finally {
		if (updateId === exportConfigUpdateId) {
			configModalBusy.value = false;
		}
	}
}

function showConfigModal(type: string) {
	exportConfigUpdateId++;
	configModalType.value = type;
	configModalBusy.value = false;
	configModalExportMemory.value = false;
	configModalImportMemory.value = false;
	configModalValue.value = type === "import" ? "" : JSON.stringify(config.$state, null, 2);
}
async function configModalSubmit() {
	if (configModalType.value === "import") {
		configModalBusy.value = true;
		try {
			const newConfig = JSON.parse(configModalValue.value);
			if (!isRecord(newConfig)) throw new Error("Invalid config");

			const hasMemoryChunk = Object.prototype.hasOwnProperty.call(newConfig, MEMORY_CHUNK_KEY);
			const memoryChunk = newConfig[MEMORY_CHUNK_KEY];
			delete newConfig[MEMORY_CHUNK_KEY];

			if (hasMemoryChunk && configModalImportMemory.value) {
				await overwriteMemoryChunk(memoryChunk);
			}

			config.$patch(newConfig as any);
			config.saveStorage();
			showToast(t("general.config.alert.importSuccess"));

			configModalType.value = "";
			configModalValue.value = "";
		} catch (e) {
			showToast(t("general.config.alert.importError"));
		} finally {
			configModalBusy.value = false;
		}
	} else if (configModalType.value === "export") {
		navigator.clipboard
			.writeText(configModalValue.value)
			.then(() => {
				showToast(t("general.config.alert.copySuccess"));

				configModalType.value = "";
				configModalValue.value = "";
			})
			.catch(() => {
				showToast(t("general.config.alert.copyError"));
			});
	}
}

const waitUpdate = ref("");
browser.storage.local.get("waitUpdate").then((data) => {
	if (data.waitUpdate) {
		waitUpdate.value = data.waitUpdate as string;
	}
});
async function requestUpdateCheck() {
	if (!browser?.runtime?.requestUpdateCheck) {
		showToast(t("general.update.alert.unsupportedUpdate"));
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
		showToast(t("general.update.alert.noUpdate"));
	} else {
		showToast(t("general.update.alert.busy"));
	}
}
function updateNow() {
	browser.storage.local.set({ needReloadTabs: true }).then(() => {
		browser.runtime.reload();
	});
}

type ChangelogItem = {
	scope?: string;
	text: string;
};
type ChangelogGroupType = "added" | "updated" | "fixed";
type ChangelogRelease = {
	version: string;
	date?: string;
	changes: Record<string, Partial<Record<ChangelogGroupType, ChangelogItem[]>>>;
};
type ChangelogMode = "unread" | "manual";

const changelogGroupTypes: ChangelogGroupType[] = ["added", "updated", "fixed"];
const changelogModalVisible = ref(false);
const changelogLoading = ref(false);
const changelogError = ref("");
const changelogMode = ref<ChangelogMode>("manual");
const changelogFromVersion = ref("");
const changelogReleases = ref<
	Array<{
		version: string;
		date?: string;
		groups: Array<{
			type: ChangelogGroupType;
			items: ChangelogItem[];
		}>;
	}>
>([]);
let changelogRequestId = 0;

const changelogModalTitle = computed(() => {
	return changelogMode.value === "unread" ? t("general.changelog.title") : t("general.changelog.manualTitle");
});
const changelogModalSubtitle = computed(() => {
	if (changelogMode.value === "unread" && changelogFromVersion.value) {
		return t("general.changelog.subtitle", { from: changelogFromVersion.value, to: APP_INFO.version });
	}
	return t("general.changelog.currentSubtitle", { version: APP_INFO.version });
});
const changelogGithubUrl = computed(() => {
	if (locale.value.startsWith("zh")) return "https://github.com/xlch88/YouTubeTweak/blob/main/docs/zh-cn/CHANGELOG.md";
	if (locale.value.startsWith("ja")) return "https://github.com/xlch88/YouTubeTweak/blob/main/docs/ja/CHANGELOG.md";
	return "https://github.com/xlch88/YouTubeTweak/blob/main/CHANGELOG.md";
});

function getReleaseChanges(release: ChangelogRelease): Partial<Record<ChangelogGroupType, ChangelogItem[]>> {
	return (
		release.changes[locale.value] ||
		release.changes[locale.value.split("-")[0]] ||
		release.changes.en ||
		Object.values(release.changes)[0] ||
		{}
	);
}

function buildChangelogReleases(releases: ChangelogRelease[], fromVersion: string) {
	return releases
		.filter((release) => {
			if (compareVersions(release.version, APP_INFO.version) > 0) return false;
			return !fromVersion || compareVersions(release.version, fromVersion) > 0;
		})
		.sort((left, right) => compareVersions(right.version, left.version))
		.map((release) => {
			const changes = getReleaseChanges(release);
			return {
				version: release.version,
				date: release.date,
				groups: changelogGroupTypes
					.map((type) => ({
						type,
						items: changes[type] || [],
					}))
					.filter((group) => group.items.length > 0),
			};
		})
		.filter((release) => release.groups.length > 0);
}

async function showChangelog(mode: ChangelogMode) {
	const requestId = ++changelogRequestId;
	const data = await browser.storage.local.get(READ_CHANGELOG_VERSION_STORAGE_KEY);
	const fromVersion =
		mode === "unread" && typeof data[READ_CHANGELOG_VERSION_STORAGE_KEY] === "string"
			? data[READ_CHANGELOG_VERSION_STORAGE_KEY]
			: "";
	changelogMode.value = mode;
	changelogFromVersion.value = fromVersion;
	changelogModalVisible.value = true;
	changelogLoading.value = true;
	changelogError.value = "";
	changelogReleases.value = [];

	try {
		const response = await fetch(CHANGELOG_URL, { cache: "no-store" });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		const changelog = (await response.json()) as { releases?: ChangelogRelease[] };
		if (requestId === changelogRequestId) {
			const releases = changelog.releases || [];
			const matchedReleases = buildChangelogReleases(releases, fromVersion);
			const hasCurrentVersionChangelog = releases.some((release) => compareVersions(release.version, APP_INFO.version) === 0);
			if (mode === "unread" && fromVersion && !hasCurrentVersionChangelog) {
				changelogMode.value = "manual";
				changelogFromVersion.value = "";
				changelogReleases.value = buildChangelogReleases(releases, "");
			} else {
				changelogReleases.value = matchedReleases;
			}
			markChangelogVersionRead().catch(() => {});
		}
	} catch (e) {
		if (requestId === changelogRequestId) {
			changelogError.value = t("general.changelog.error");
		}
	} finally {
		if (requestId === changelogRequestId) {
			changelogLoading.value = false;
		}
	}
}

function closeChangelog() {
	changelogRequestId++;
	changelogModalVisible.value = false;
}

const pageParams = new URLSearchParams(window.location.search);
if (pageParams.get("changelog") === "1") {
	pageParams.delete("changelog");
	history.replaceState(null, "", `${window.location.pathname}?${pageParams.toString()}`);
	showChangelog("unread");
}
</script>

<style lang="scss" scoped>
.tips-sponsor {
	scroll-margin-top: 8px;
	background: linear-gradient(120deg, #ff79ba 0%, #ffd3e7 46%, #ff9dcc 100%);
	background-size: 180% 180%;
	border: 1px solid rgba(#d63384, 0.24);
	box-shadow:
		0 7px 16px rgba(#d63384, 0.14),
		inset 0 1px 0 rgba(white, 0.5);
	color: #51112e;
	animation: sponsor-card-breathe 1.8s ease-in-out infinite;

	p {
		margin: 0;
		line-height: 1.55;
	}

	b {
		color: #8f164d;
	}

	.sponsor-actions {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;

		button {
			appearance: none;
			border: none;
			font-family: inherit;
			font-weight: 700;
			cursor: pointer;
			transition:
				background 0.15s,
				box-shadow 0.15s,
				color 0.15s,
				transform 0.15s;

			&:hover {
				transform: translateY(-1px);
			}

			&:active {
				transform: translateY(0);
			}
		}

		.sponsor-button {
			position: relative;
			overflow: hidden;
			min-height: 28px;
			padding: 6px 14px;
			border-radius: 999px;
			background: linear-gradient(135deg, #d63384 0%, #ef4c9b 56%, #b92770 100%);
			box-shadow:
				0 5px 12px rgba(#d63384, 0.26),
				inset 0 1px 0 rgba(white, 0.38);
			color: white;
			font-size: 12px;
			animation: sponsor-button-pulse 1.5s ease-in-out infinite;

			&::after {
				content: "";
				position: absolute;
				top: -55%;
				left: -40%;
				width: 34%;
				height: 210%;
				background: linear-gradient(90deg, transparent, rgba(white, 0.58), transparent);
				pointer-events: none;
				transform: rotate(24deg) translateX(-160%);
				animation: sponsor-button-shine 1.7s ease-in-out infinite;
			}

			&:hover {
				background: linear-gradient(135deg, #e63891 0%, #ff62aa 56%, #c92c7a 100%);
				box-shadow:
					0 8px 16px rgba(#d63384, 0.32),
					inset 0 1px 0 rgba(white, 0.48);
				transform: translateY(-2px) scale(1.03);
			}

			&:hover::after {
				animation-duration: 0.9s;
			}

			&:active {
				box-shadow:
					0 4px 10px rgba(#d63384, 0.28),
					inset 0 2px 4px rgba(#7a123f, 0.2);
				transform: translateY(0) scale(0.98);
			}
		}

		.sponsor-dismiss {
			padding: 5px 2px;
			background: transparent;
			color: rgba(#51112e, 0.72);
			font-size: 12px;

			&:hover {
				color: #8f164d;
				text-decoration: underline;
			}
		}
	}
}

@keyframes sponsor-button-pulse {
	0%,
	100% {
		box-shadow:
			0 5px 12px rgba(#d63384, 0.26),
			inset 0 1px 0 rgba(white, 0.38);
	}

	50% {
		box-shadow:
			0 7px 16px rgba(#d63384, 0.3),
			inset 0 1px 0 rgba(white, 0.44);
	}
}

@keyframes sponsor-card-breathe {
	0%,
	100% {
		background-position: 0% 50%;
		box-shadow:
			0 8px 16px rgba(#d63384, 0.18),
			inset 0 1px 0 rgba(white, 0.5);
		transform: translateY(0);
	}

	50% {
		background-position: 100% 50%;
		box-shadow:
			0 15px 26px rgba(#d63384, 0.28),
			inset 0 1px 0 rgba(white, 0.64);
		transform: translateY(-3px) scale(1.015);
	}
}

@keyframes sponsor-button-shine {
	0%,
	45% {
		transform: rotate(24deg) translateX(-160%);
	}

	75%,
	100% {
		transform: rotate(24deg) translateX(520%);
	}
}

@media (prefers-reduced-motion: reduce) {
	.tips-sponsor {
		animation: none;

		.sponsor-actions {
			button,
			.sponsor-button,
			.sponsor-button::after {
				animation: none;
				transition: none;
			}
		}
	}
}

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
				cursor: pointer;
				color: rgba(#000, 0.5);
			}

			.commit-link {
				color: rgba(#000, 0.3);
				padding-top: 10px;
				font-size: 12px;
				&:hover {
					text-decoration: underline;
				}
			}
		}
	}

	.about-links {
		max-width: 100%;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px;
		margin-top: 10px;
		padding-bottom: 6px;

		.about-link {
			appearance: none;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 4px;
			min-height: 25px;
			padding: 4px 9px;
			border: 1px solid;
			border-radius: 999px;
			background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
			font-size: 11px;
			font-weight: 600;
			font-family: inherit;
			line-height: 1.3;
			text-align: center;
			white-space: nowrap;
			cursor: pointer;
			transition:
				background 0.15s,
				border-color 0.15s,
				box-shadow 0.15s,
				transform 0.15s;

			&:hover {
				background: white;
				transform: translateY(-1px);
			}

			&:active {
				transform: translateY(0);
			}

			.about-link-icon {
				font-size: 12px;
				line-height: 1;
			}

			&.about-link-source {
				border-color: #f6c343;
				color: #b58100;
				box-shadow:
					0 0 0 1px rgba(246, 195, 67, 0.08),
					0 3px 10px rgba(246, 195, 67, 0.14);

				&:hover {
					box-shadow:
						0 0 0 1px rgba(246, 195, 67, 0.18),
						0 5px 14px rgba(246, 195, 67, 0.24);
				}
			}

			&.about-link-changelog {
				border-color: #409eff;
				color: #1f74d6;
				box-shadow:
					0 0 0 1px rgba(64, 158, 255, 0.08),
					0 3px 10px rgba(64, 158, 255, 0.14);

				&:hover {
					box-shadow:
						0 0 0 1px rgba(64, 158, 255, 0.18),
						0 5px 14px rgba(64, 158, 255, 0.24);
				}
			}

			&.about-link-issue {
				border-color: #f56c6c;
				color: #d9363e;
				box-shadow:
					0 0 0 1px rgba(245, 108, 108, 0.08),
					0 3px 10px rgba(245, 108, 108, 0.14);

				&:hover {
					box-shadow:
						0 0 0 1px rgba(245, 108, 108, 0.18),
						0 5px 14px rgba(245, 108, 108, 0.24);
				}
			}

			&.about-link-sponsor {
				display: none;
				border-color: #d63384;
				color: #b92770;
				box-shadow:
					0 0 0 1px rgba(214, 51, 132, 0.08),
					0 3px 10px rgba(214, 51, 132, 0.14);

				&:hover {
					box-shadow:
						0 0 0 1px rgba(214, 51, 132, 0.18),
						0 5px 14px rgba(214, 51, 132, 0.24);
				}
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

.modal-fade-enter-active,
.modal-fade-leave-active {
	transition: opacity 0.16s ease;

	.config-modal-body,
	.changelog-modal-body,
	.reset-confirm-modal-body {
		transition: transform 0.16s ease;
	}
}

.modal-fade-enter-from,
.modal-fade-leave-to {
	opacity: 0;

	.config-modal-body,
	.changelog-modal-body,
	.reset-confirm-modal-body {
		transform: translateY(8px) scale(0.98);
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
		.config-memory-checkbox {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 12px;
			line-height: 1.4;
			color: white;

			input {
				flex: 0 0 auto;
			}
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

.changelog-modal {
	position: fixed;
	z-index: 9999;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	background: rgba(black, 0.7);
	padding: 10px;

	.changelog-modal-body {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: white;
		border-radius: 6px;
		overflow: hidden;

		.changelog-modal-header {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: 10px;
			padding: 12px;
			border-bottom: 1px solid #eee;
			background: rgb(249, 250, 253);

			h2 {
				margin: 0;
				font-size: 16px;
				line-height: 1.3;
			}

			p {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 6px;
				margin: 4px 0 0;
				color: #7e8299;
				font-size: 12px;
				line-height: 1.4;

				.changelog-github-link {
					color: #599bff;
					font-weight: 600;

					&:hover {
						text-decoration: underline;
					}
				}
			}

			.changelog-modal-close {
				width: 28px;
				height: 28px;
				flex: 0 0 auto;
				border: none;
				border-radius: 5px;
				background: transparent;
				color: #606266;
				font-size: 24px;
				line-height: 24px;
				cursor: pointer;

				&:hover {
					background: rgba(#000, 0.08);
				}
			}
		}

		.changelog-modal-content {
			flex: 1;
			overflow-y: auto;
			padding: 12px;

			.changelog-status {
				min-height: 120px;
				display: flex;
				align-items: center;
				justify-content: center;
				color: #7e8299;
				text-align: center;
				line-height: 1.5;

				&.changelog-error {
					color: #c0392b;
				}
			}

			.changelog-list {
				display: flex;
				flex-direction: column;
				gap: 12px;

				.changelog-release {
					padding-bottom: 12px;
					border-bottom: 1px solid #eee;

					&:last-child {
						border-bottom: none;
						padding-bottom: 0;
					}

					h3 {
						display: flex;
						align-items: baseline;
						gap: 8px;
						margin: 0 0 8px;
						font-size: 15px;
						line-height: 1.3;

						span {
							color: #909399;
							font-size: 11px;
							font-weight: normal;
						}
					}

					.changelog-group {
						margin-top: 8px;

						h4 {
							margin: 0 0 5px;
							color: #606266;
							font-size: 12px;
							line-height: 1.3;
						}

						ul {
							margin: 0;
							padding-left: 18px;

							li {
								margin-top: 4px;
								color: #303133;
								line-height: 1.45;
								user-select: text;

								b {
									margin-right: 5px;
									color: #409eff;
								}
							}
						}
					}
				}
			}
		}

		.changelog-modal-footer {
			padding: 10px 12px;
			border-top: 1px solid #eee;
			background: rgb(249, 250, 253);

			button {
				width: 100%;
			}
		}
	}
}

.reset-confirm-modal {
	position: fixed;
	z-index: 9999;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	background: rgba(black, 0.7);

	.reset-confirm-modal-body {
		width: 100%;
		max-width: 320px;
		padding: 16px;
		border-radius: 6px;
		background: white;
		box-shadow: 0 10px 28px rgba(black, 0.2);

		p {
			margin: 0;
			color: #303133;
			font-size: 14px;
			line-height: 1.5;
			text-align: center;
		}

		.buttons {
			display: flex;
			gap: 10px;
			margin-top: 16px;

			button {
				flex: 1;
			}

			.btn-cancel {
				background: #909399;

				&:hover {
					background: #a6a9ad;
				}

				&:active {
					background: #82848a;
				}
			}

			.btn-danger {
				background: #f56c6c;

				&:hover {
					background: #f78989;
				}

				&:active {
					background: #dd6161;
				}
			}
		}
	}
}

.page-toast {
	position: fixed;
	z-index: 10000;
	left: 50%;
	bottom: 50px;
	transform: translateX(-50%);
	max-width: calc(100% - 100px);
	width: 100%;
	padding: 8px 12px;
	border-radius: 6px;
	background: rgba(0, 0, 0, 0.72);
	color: white;
	font-size: 13px;
	line-height: 1.4;
	text-align: center;
	pointer-events: none;
}

.config-card {
	.btn {
		background: #ffffff;
		color: #000;
		border: 1px solid #e0e0e0;
		transition: background 0.3s;
		&:hover {
			background: #f0f0f0;
		}
		span {
			display: block;
			font-size: 20px;
			padding-bottom: 5px;
		}
	}
}
</style>

<template>
	<section id="other">
		<SettingsCard card-id="other-home">
			<template #title>
				<span>{{ $t("other.index.title") }}</span>
				<DocsHelpLink anchor="other-home" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['index.videoPerRow.enable']" />
					<span> {{ $t("other.index.checkbox.videoPerRow") }} </span>
					<DocsHelpLink anchor="other-home-video-per-row" />
					<input
						type="number"
						style="width: 50px; margin-left: 5px"
						v-model="config['index.videoPerRow.count']"
						min="1"
						max="15"
						@blur="check"
					/>
				</label>
			</div>
		</SettingsCard>

		<SettingsCard card-id="other-comment">
			<template #title>
				<span>{{ $t("other.comment.title") }}</span>
				<DocsHelpLink anchor="other-comment" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.nickname']" />
					<span>{{ $t("other.comment.checkbox.showNickname") }}</span>
					<DocsHelpLink anchor="other-comment-nickname" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.autoShowMore']" />
					<span>{{ $t("comment.context.checkbox.autoShowMore") }}</span>
					<DocsHelpLink anchor="other-comment-auto-more" />
				</label>
				<label class="blocked-comment-users">
					<span>{{ $t("other.comment.blockedUsers") }}</span>
					<textarea
						v-model="config['comment.blockedUsers']"
						rows="5"
						spellcheck="false"
						:placeholder="'@username1\n@username2'"
					></textarea>
				</label>
			</div>
		</SettingsCard>

		<SettingsCard card-id="other-anti-ad">
			<template #title>
				<span>{{ $t("other.antiAD.title") }}</span>
				<DocsHelpLink anchor="other-anti-ad" />
			</template>
			<div class="card-body">
				<p>{{ $t("other.antiAD.tips.enable") }}</p>
				<label class="form-item">
					<input type="checkbox" v-model="config['other.antiAD.enable']" />
					<span> {{ $t("other.antiAD.checkbox.enable") }} </span>
					<DocsHelpLink anchor="other-anti-ad-image" />
				</label>
				<label class="form-item form-item-deleted">
					<input type="checkbox" disabled />
					<span> {{ $t("other.antiAD.checkbox.enableVideo") }} </span>
					<DocsHelpLink anchor="other-anti-ad-video" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['other.antiAD.enableMerch']" />
					<span> {{ $t("other.antiAD.checkbox.enableMerch") }} </span>
					<DocsHelpLink anchor="other-anti-ad-merch" />
				</label>
				<p>
					{{ $t("other.antiAD.tips.videoDeprecated") }}<br />
					- <a href="https://ublockorigin.com/" target="_black">uBlock Origin</a>: {{ $t("other.antiAD.tips.uBlockOrigin")
					}}<br />
					- <a href="https://sponsor.ajay.app/" target="_black">SponsorBlock</a>:
					{{ $t("other.antiAD.tips.sponsorBlock") }}
				</p>
			</div>
		</SettingsCard>

		<SettingsCard card-id="other-shorts">
			<template #title>
				<span>{{ $t("other.shorts.title") }}</span>
				<DocsHelpLink anchor="other-shorts" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['shorts-blocker.enable.index']" />
					<span> {{ $t("other.shorts.checkbox.enableIndex") }} </span>
					<DocsHelpLink anchor="other-shorts-home-search" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['shorts-blocker.enable.watch']" />
					<span> {{ $t("other.shorts.checkbox.enableWatch") }} </span>
					<DocsHelpLink anchor="other-shorts-watch" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['shorts-blocker.enable.menu']" />
					<span> {{ $t("other.shorts.checkbox.enableMenu") }} </span>
					<DocsHelpLink anchor="other-shorts-menu" />
				</label>
			</div>
		</SettingsCard>

		<SettingsCard card-id="other-rollback">
			<template #title>
				<span>{{ $t("other.rollback.title") }}</span>
				<DocsHelpLink anchor="other-rollback" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['rollback.playerUI']" />
					<span>{{ $t("other.rollback.checkbox.playerUI") }}</span>
					<DocsHelpLink anchor="other-rollback-player-layout" />
				</label>
			</div>
		</SettingsCard>

		<SettingsCard card-id="other-appearance">
			<template #title>
				<span>{{ $t("other.appearance.title") }}</span>
				<DocsHelpLink anchor="other-appearance" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['other.premiumLogo.enable']" />
					<span>{{ $t("other.appearance.checkbox.premiumLogo") }}</span>
					<DocsHelpLink anchor="other-appearance-premium-logo" />
				</label>
				<label class="form-item form-item-select">
					<span>{{ $t("other.appearance.logoCountryCode") }}</span>
					<DocsHelpLink anchor="other-appearance-logo-country-code" />
					<input v-model.lazy="config['other.logoCountryCode']" type="text" placeholder="Pirates" />
				</label>
			</div>
		</SettingsCard>

		<SettingsCard card-id="other-custom-css">
			<template #title>
				<span>{{ $t("other.customCss.title") }}</span>
				<DocsHelpLink anchor="other-custom-css" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['other.customCss.enable']" />
					<span>{{ $t("other.customCss.checkbox.enable") }}</span>
					<DocsHelpLink anchor="other-custom-css-inject" />
				</label>
				<pre
					ref="customCssEditor"
					class="custom-css-editor language-css"
					role="textbox"
					:aria-label="$t('other.customCss.title')"
					aria-multiline="true"
					:data-placeholder="customCssPlaceholder"
					@focus="startCustomCssEdit"
					@blur="saveCustomCss"
				></pre>
				<p>{{ $t("other.customCss.tips.inject") }}</p>
			</div>
		</SettingsCard>
	</section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { CodeJar } from "codejar";
import Prism from "prismjs/components/prism-core";
import "prismjs/components/prism-css";
import DocsHelpLink from "../components/DocsHelpLink.vue";
import SettingsCard from "../components/SettingsCard.vue";
import useConfigStore from "../util/config";
const config = useConfigStore();
const { tm } = useI18n();
const customCssEditor = ref<HTMLElement | null>(null);
const customCssPlaceholder = computed(() => {
	const message = tm("other.customCss.placeholder");
	return typeof message === "string" ? message : "";
});
let customCssDraft = config["other.customCss.value"];
let customCssJar: CodeJar | null = null;
let isEditingCustomCss = false;

watch(
	() => config["other.customCss.value"],
	(value) => {
		if (!isEditingCustomCss) {
			customCssDraft = String(value ?? "");
			updateCustomCssEditorCode(String(value ?? ""));
		}
	},
);

onMounted(() => {
	initCustomCssEditor();
});

onBeforeUnmount(() => {
	if (isEditingCustomCss) {
		saveCustomCss();
	}

	customCssJar?.destroy();
	customCssJar = null;
});

function check() {
	if (
		!/^\d+$/.test(config["index.videoPerRow.count"].toString()) ||
		config["index.videoPerRow.count"] < 1 ||
		config["index.videoPerRow.count"] > 10
	) {
		config["index.videoPerRow.count"] = 4;
	}
}

function highlightCustomCss(editor: HTMLElement) {
	const code = editor.textContent || "";
	editor.innerHTML = code ? Prism.highlight(code, Prism.languages.css, "css") : "";
}

function updateCustomCssEditorCode(code: string) {
	const editor = customCssEditor.value;
	if (!editor) return;

	if (customCssJar) {
		customCssJar.updateCode(code, false);
		return;
	}

	editor.textContent = code;
	highlightCustomCss(editor);
}

function initCustomCssEditor() {
	const editor = customCssEditor.value;
	if (!editor) return;

	customCssJar = CodeJar(editor, highlightCustomCss, {
		tab: "\t",
		catchTab: true,
		spellcheck: false,
		addClosing: false,
	});
	customCssJar.onUpdate((code) => {
		customCssDraft = code;
	});
	customCssJar.updateCode(customCssDraft, false);
}

function startCustomCssEdit() {
	isEditingCustomCss = true;
}

function saveCustomCss() {
	isEditingCustomCss = false;
	config["other.customCss.value"] = customCssDraft;
}
</script>

<style lang="scss" scoped>
.blocked-comment-users {
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-top: 8px;

	textarea {
		box-sizing: border-box;
		width: 100%;
		min-height: 100px;
		padding: 8px;
		resize: vertical;
	}
}

.custom-css-editor {
	width: 100%;
	min-height: 140px;
	margin: 10px 0 0;
	padding: 5px;
	font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
	font-size: 14px;
	line-height: 1.4;
	tab-size: 4;
	white-space: pre-wrap;
	overflow-wrap: break-word;
	overflow: auto;
	color: #24292f;
	background: #fff;
	border: 1px solid #dfdfdf;
	border-radius: 7px;
	resize: vertical;
	user-select: text;
	outline: 0;

	&:empty::before {
		content: attr(data-placeholder);
		color: #8a8f98;
		pointer-events: none;
	}

	&:hover {
		border-color: var(--settings-accent);
	}

	&:focus {
		border-color: var(--settings-accent);
		box-shadow: 0 0 0 3px var(--settings-accent-soft);
	}

	& :deep(.token.comment) {
		color: #6a737d;
	}

	& :deep(.token.selector) {
		color: #6f42c1;
	}

	& :deep(.token.property) {
		color: #005cc5;
	}

	& :deep(.token.function),
	& :deep(.token.url) {
		color: #032f62;
	}

	& :deep(.token.important),
	& :deep(.token.atrule),
	& :deep(.token.keyword) {
		color: #d73a49;
	}

	& :deep(.token.punctuation) {
		color: #24292f;
	}
}

.form-item-deleted {
	position: relative;
	span {
		text-decoration-line: line-through;
		text-decoration-thickness: 1px;
		text-decoration-color: black;
	}
	button {
		pointer-events: none;
	}

	&:hover > .docs-help-link {
		pointer-events: none;
	}
}
</style>

<template>
	<section id="other">
		<div class="card">
			<div class="card-title">{{ $t("other.index.title") }}</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['index.videoPerRow.enable']" />
					<span> {{ $t("other.index.checkbox.videoPerRow") }} </span>
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
		</div>

		<div class="card">
			<div class="card-title">{{ $t("other.comment.title") }}</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.nickname']" />
					<span>{{ $t("other.comment.checkbox.showNickname") }}</span>
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.autoShowMore']" />
					<span>{{ $t("comment.context.checkbox.autoShowMore") }}</span>
				</label>
			</div>
		</div>

		<div class="card">
			<div class="card-title">{{ $t("other.antiAD.title") }}</div>
			<div class="card-body">
				<p>{{ $t("other.antiAD.tips.enable") }}</p>
				<label class="form-item">
					<input type="checkbox" v-model="config['other.antiAD.enable']" />
					<span> {{ $t("other.antiAD.checkbox.enable") }} </span>
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['other.antiAD.enableVideo']" />
					<span> {{ $t("other.antiAD.checkbox.enableVideo") }} </span>
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['other.antiAD.enableMerch']" />
					<span> {{ $t("other.antiAD.checkbox.enableMerch") }} </span>
				</label>
			</div>
		</div>

		<div class="card">
			<div class="card-title">{{ $t("other.shorts.title") }}</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['shorts-blocker.enable.index']" />
					<span> {{ $t("other.shorts.checkbox.enableIndex") }} </span>
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['shorts-blocker.enable.watch']" />
					<span> {{ $t("other.shorts.checkbox.enableWatch") }} </span>
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['shorts-blocker.enable.menu']" />
					<span> {{ $t("other.shorts.checkbox.enableMenu") }} </span>
				</label>
			</div>
		</div>

		<div class="card">
			<div class="card-title">{{ $t("other.rollback.title") }}</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['rollback.playerUI']" />
					<span>{{ $t("other.rollback.checkbox.playerUI") }}</span>
				</label>
			</div>
		</div>

		<div class="card">
			<div class="card-title">{{ $t("other.customCss.title") }}</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['other.customCss.enable']" />
					<span>{{ $t("other.customCss.checkbox.enable") }}</span>
				</label>
				<pre
					ref="customCssEditor"
					class="custom-css-editor language-css"
					role="textbox"
					:aria-label="$t('other.customCss.title')"
					aria-multiline="true"
					:data-placeholder="$t('other.customCss.placeholder')"
					@focus="startCustomCssEdit"
					@blur="saveCustomCss"
				></pre>
				<p>{{ $t("other.customCss.tips.inject") }}</p>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { CodeJar } from "codejar";
import Prism from "prismjs/components/prism-core";
import "prismjs/components/prism-css";
import useConfigStore from "../util/config";
const config = useConfigStore();
const customCssEditor = ref<HTMLElement | null>(null);
let customCssDraft = config["other.customCss.value"];
let customCssJar: CodeJar | null = null;
let isEditingCustomCss = false;

watch(
	() => config["other.customCss.value"],
	(value) => {
		if (!isEditingCustomCss) {
			customCssDraft = value;
			updateCustomCssEditorCode(value);
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

	customCssJar = CodeJar(
		editor,
		highlightCustomCss,
		{
			tab: "\t",
			catchTab: true,
			spellcheck: false,
			addClosing: false,
		},
	);
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
	border-radius: 5px;
	resize: vertical;
	user-select: text;
	outline: 0;

	&:empty::before {
		content: attr(data-placeholder);
		color: #8a8f98;
		pointer-events: none;
	}

	&:hover {
		border-color: #c0c4cc;
	}

	&:focus {
		border-color: #86b7fe;
		box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
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
</style>

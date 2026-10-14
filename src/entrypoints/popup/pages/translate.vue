<template>
	<section id="page-translate">
		<SettingsCard card-id="translate-settings">
			<template #title>
				<span>{{ $t("translate.common.title") }}</span>
				<DocsHelpLink anchor="translate-settings" />
			</template>
			<div class="card-body">
				<label class="form-item form-item-select">
					<span>{{ $t("comment.context.select.targetLanguage") }}: </span>
					<DocsHelpLink anchor="translate-settings-target-language" />
					<select v-model="config['comment.targetLanguage']">
						<option value="auto">{{ $t("comment.context.select.option.auto") }}</option>
						<option v-for="(v, k) in locales" :value="k" :key="k">{{ v }}</option>
					</select>
				</label>

				<label class="form-item form-item-select settings-stack">
					<span>{{ $t("comment.context.select.neverTranslate") }}</span>
					<DocsHelpLink anchor="translate-settings-never-translate" />
					<select v-model="config['comment.neverTranslateLanguages']" multiple>
						<option v-for="(v, k) in locales" :value="k" :key="k">{{ v }}</option>
					</select>
				</label>
			</div>
		</SettingsCard>
		<SettingsCard card-id="translate-global">
			<template #title>
				<span>{{ $t("translate.global.title") }}</span>
				<DocsHelpLink anchor="translate-global" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['translate.enable.videoListTitle']" />
					<span>{{ $t("translate.global.checkbox.videoListTitle") }}</span>
					<DocsHelpLink anchor="translate-global-video-list-title" />
				</label>
			</div>
		</SettingsCard>
		<SettingsCard card-id="translate-watch">
			<template #title>
				<span>{{ $t("translate.watch.title") }}</span>
				<DocsHelpLink anchor="translate-watch" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['translate.enable.videoTitle']" />
					<span>{{ $t("translate.watch.checkbox.videoTitle") }}</span>
					<DocsHelpLink anchor="translate-watch-video-title" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['translate.enable.videoDescription']" />
					<span>{{ $t("translate.watch.checkbox.videoDescription") }}</span>
					<DocsHelpLink anchor="translate-watch-video-description" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['translate.enable.videoSummary']" />
					<span>{{ $t("translate.watch.checkbox.videoSummary") }}</span>
					<DocsHelpLink anchor="translate-watch-video-summary" />
				</label>
			</div>
		</SettingsCard>
		<SettingsCard card-id="translate-subtitle">
			<template #title>
				<span>{{ $t("translate.subtitle.title") }}</span>
				<DocsHelpLink anchor="translate-subtitle" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['translate.enable.timedtext']" />
					<span>{{ $t("translate.subtitle.checkbox.timedtext") }}</span>
					<DocsHelpLink anchor="translate-subtitle-enable" />
				</label>
				<label class="form-item form-item-select">
					<span>{{ $t("translate.subtitle.select.mode") }}: </span>
					<select v-model="config['translate.timedtext.mode']">
						<option value="bilingual">{{ $t("translate.subtitle.select.option.bilingual") }}</option>
						<option value="translationOnly">{{ $t("translate.subtitle.select.option.translationOnly") }}</option>
					</select>
				</label>
			</div>
		</SettingsCard>
		<SettingsCard card-id="translate-comment">
			<template #title>
				<span>{{ $t("translate.comment.title") }}</span>
				<DocsHelpLink anchor="translate-comment" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.autoTranslate']" />
					<span>{{ $t("comment.context.checkbox.autoTranslate") }}</span>
					<DocsHelpLink anchor="translate-comment-content" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.showManualTranslateButtonForSkippedLanguages']" />
					<span>{{ $t("comment.context.checkbox.showManualTranslateButtonForSkippedLanguages") }}</span>
					<DocsHelpLink anchor="translate-comment-manual-button" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.lineByLineTranslate']" />
					<span>{{ $t("comment.context.checkbox.lineByLineTranslate") }}</span>
					<DocsHelpLink anchor="translate-comment-line-by-line" />
				</label>
			</div>
		</SettingsCard>
	</section>
</template>

<script setup lang="ts">
import DocsHelpLink from "../components/DocsHelpLink.vue";
import SettingsCard from "../components/SettingsCard.vue";
import useConfigStore from "../util/config";
import { languages as locales } from "../util/languages";
const config = useConfigStore();
</script>

<style lang="scss" scoped>
#page-translate {
	select[multiple] {
		height: 112px;
		width: 100%;
		max-width: none;
	}
}
</style>

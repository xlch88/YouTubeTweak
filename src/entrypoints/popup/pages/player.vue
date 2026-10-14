<template>
	<section id="page-player">
		<SettingsCard card-id="player-quality">
			<template #title>
				<span>{{ $t("player.lockQuality.title") }}</span>
				<DocsHelpLink anchor="player-quality" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.lockQuality']" />
					<span>{{ $t("player.lockQuality.checkbox.enable") }}</span>
					<DocsHelpLink anchor="player-quality-auto-switch" />
				</label>
				<fieldset
					class="settings-dependent"
					:disabled="!config['player.settings.lockQuality']"
					:aria-label="$t('player.lockQuality.title')"
				>
					<select class="w-100" v-model="config['player.settings.lockQuality.value']">
						<option
							v-for="(name, key) of {
								highres: '8K (4320p)',
								hd2160: '4K (2160p)',
								hd1440: '1440p',
								hd1080: '1080p',
								hd720: '720p',
								large: '480p',
								medium: '360p',
								small: '240p',
								tiny: '144p',
							}"
							:value="key"
							:key="key"
						>
							{{ name }}
						</option>
					</select>
					<p>{{ $t("player.lockQuality.tips.quality") }}</p>
				</fieldset>
			</div>
		</SettingsCard>
		<SettingsCard card-id="player-speed-button">
			<template #title>
				<span>{{ $t("player.playbackSpeed.title") }}</span>
				<DocsHelpLink anchor="player-speed-button" />
			</template>
			<div class="card-body">
				<p class="settings-label">{{ $t("player.playbackSpeed.tips.save") }}</p>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.saveSpeed']" />
					<span>{{ $t("player.playbackSpeed.checkbox.save") }}</span>
					<DocsHelpLink anchor="player-speed-button-save" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.saveSpeedByChannel']" />
					<span>{{ $t("player.playbackSpeed.checkbox.saveByChannel") }}</span>
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.keepMusicVideosAtNormalSpeed']" />
					<span>{{ $t("player.playbackSpeed.checkbox.keepMusicVideosAtNormalSpeed") }}</span>
					<DocsHelpLink anchor="player-speed-button-music" />
				</label>
				<SettingsCard card-id="player-speed-controls" embedded :default-open="false">
					<template #title>{{ $t("player.playbackSpeed.tips.controls") }}</template>
					<label class="form-item">
						<input type="checkbox" v-model="config['player.ui.enableSpeedButtons']" />
						<span>{{ $t("player.playbackSpeed.checkbox.enable") }}</span>
						<DocsHelpLink anchor="player-speed-button-show" />
					</label>
					<fieldset
						class="settings-dependent"
						:disabled="!config['player.ui.enableSpeedButtons']"
						:aria-label="$t('player.playbackSpeed.tips.controls')"
					>
						<p class="settings-label">{{ $t("player.playbackSpeed.tips.enabledButtons") }}</p>
						<div class="form-item-group enabled-speed-buttons">
							<label
								class="form-item"
								v-for="speed in [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 5, 10]"
								:key="speed"
							>
								<input
									type="checkbox"
									class="checkbox-size-mini"
									v-model="config['player.ui.speedButtons']"
									:value="speed"
								/>
								<span>{{ speed }}×</span>
							</label>
						</div>
						<label class="form-item form-item-select">
							<span>{{ $t("player.playbackSpeed.checkbox.collapse") }}</span>
							<select class="w-100" v-model="config['player.ui.collapseSpeedButtons']">
								<option value="never">{{ $t("player.buttonCollapse.option.never") }}</option>
								<option value="always">{{ $t("player.buttonCollapse.option.always") }}</option>
								<option value="auto">{{ $t("player.buttonCollapse.option.auto") }}</option>
							</select>
						</label>
						<label class="form-item">
							<input type="checkbox" v-model="config['player.ui.enableSpeedSlider']" />
							<span>{{ $t("player.playbackSpeed.checkbox.enableSlider") }}</span>
						</label>
						<p>{{ $t("player.playbackSpeed.tips.slider") }}</p>
						<label v-if="config['player.ui.enableSpeedSlider']" class="form-item form-item-select settings-stack">
							<span>{{ $t("player.playbackSpeed.select.sliderWheelStep") }}</span>
							<select v-if="!showCustomSpeedSliderStepInput" class="w-100" v-model="speedSliderWheelStepSelectValue">
								<option value="speedButtons">{{ $t("player.playbackSpeed.select.sliderWheelStepFollowButtons") }}</option>
								<option v-if="speedSliderWheelStepSelectValue === 'currentCustom'" value="currentCustom">
									{{ config["player.ui.speedSliderStep"] }}
								</option>
								<option v-for="step in speedSliderStepPresets" :value="String(step)" :key="step">{{ step }}</option>
								<option value="custom">{{ $t("player.playbackSpeed.select.sliderWheelStepCustom") }}</option>
							</select>
							<span v-else class="speed-slider-step-custom">
								<input
									type="number"
									min="0.0001"
									max="10"
									step="0.0001"
									v-model.number="config['player.ui.speedSliderStep']"
								/>
								<button class="btn" type="button" @click="showCustomSpeedSliderStepInput = false">
									{{ $t("player.playbackSpeed.select.sliderWheelStepPresets") }}
								</button>
							</span>
						</label>
					</fieldset>
				</SettingsCard>
			</div>
		</SettingsCard>
		<SettingsCard card-id="player-volume-booster">
			<template #title>
				<span>{{ $t("player.volumeBooster.title") }}</span>
				<DocsHelpLink anchor="player-volume-booster" />
			</template>
			<div class="card-body">
				<VolumeBoosterSettings />
				<hr />
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.maxVolume']" />
					<span>{{ $t("player.volumeBooster.checkbox.maxVolume") }}</span>
					<DocsHelpLink anchor="player-other-max-volume" />
				</label>
			</div>
		</SettingsCard>
		<SettingsCard card-id="player-subtitle">
			<template #title>
				<span>{{ $t("player.subtitles.title") }}</span>
				<DocsHelpLink anchor="player-subtitle" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.saveSubtitleStatus']" />
					<span>{{ $t("player.subtitles.checkbox.save") }}</span>
					<DocsHelpLink anchor="player-subtitle-save-status" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.saveSubtitleStatusByChannel']" />
					<span>{{ $t("player.subtitles.checkbox.saveByChannel") }}</span>
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.saveSubtitleLanguageByVideo']" />
					<span>{{ $t("player.subtitles.checkbox.saveLanguageByVideo") }}</span>
					<DocsHelpLink anchor="player-subtitle-save-language" />
				</label>
				<SubtitleLanguages />
			</div>
		</SettingsCard>
		<SettingsCard card-id="player-function-buttons">
			<template #title>
				<span>{{ $t("player.functionButtons.title") }}</span>
				<DocsHelpLink anchor="player-function-buttons" />
			</template>
			<div class="card-body">
				<label class="form-item form-item-select">
					<span>{{ $t("player.functionButtons.checkbox.collapse") }}</span>
					<select class="w-100" v-model="config['player.ui.functionButtons.collapseButtons']">
						<option value="never">{{ $t("player.buttonCollapse.option.never") }}</option>
						<option value="always">{{ $t("player.buttonCollapse.option.always") }}</option>
						<option value="auto">{{ $t("player.buttonCollapse.option.auto") }}</option>
					</select>
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.ui.functionButtons.enableRotateButton']" />
					<span>{{ $t("player.functionButtons.checkbox.enableRotateButton") }}</span>
					<DocsHelpLink anchor="player-function-buttons-rotate" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.ui.functionButtons.enableMirrorButton']" />
					<span>{{ $t("player.functionButtons.checkbox.enableMirrorButton") }}</span>
					<DocsHelpLink anchor="player-function-buttons-mirror" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.ui.functionButtons.enableScreenshotButton']" />
					<span>{{ $t("player.functionButtons.checkbox.enableScreenshotButton") }}</span>
					<DocsHelpLink anchor="player-function-buttons-screenshot" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.ui.inPageFullscreen']" />
					<span>{{ $t("player.functionButtons.checkbox.inPageFullscreen") }}</span>
					<DocsHelpLink anchor="player-function-buttons-in-page-fullscreen" />
				</label>
			</div>
		</SettingsCard>
		<SettingsCard card-id="player-button-display" :default-open="false">
			<template #title>
				<span>{{ $t("player.hidePlayerButtons.title") }}</span>
				<DocsHelpLink anchor="player-button-display" />
			</template>
			<div class="card-body">
				<label
					class="form-item form-item-select"
					v-for="key in ['autoplay', 'subtitles', 'settings', 'miniPlayer', 'pip', 'size', 'remote', 'fullscreen']"
					:key="key"
				>
					<span>{{ $t(`player.hidePlayerButtons.checkbox.${key}`) }}</span>
					<DocsHelpLink v-if="key === 'autoplay'" anchor="player-button-display-native" />
					<select class="w-100" v-model="config[`player.ui.hideButton.${key}`]">
						<option value="auto">{{ $t("player.hidePlayerButtons.option.auto") }}</option>
						<option value="hide">{{ $t("player.hidePlayerButtons.option.hide") }}</option>
						<option v-if="key !== 'subtitles'" value="show">{{ $t("player.hidePlayerButtons.option.show") }}</option>
					</select>
				</label>
			</div>
		</SettingsCard>
		<SettingsCard card-id="player-video-zoom">
			<template #title>
				<span>{{ $t("player.videoZoom.title") }}</span>
				<DocsHelpLink anchor="player-video-zoom" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['player.ui.enableVideoZoom']" />
					<span>{{ $t("player.videoZoom.checkbox.enable") }}</span>
					<DocsHelpLink anchor="player-video-zoom-wheel" />
				</label>
				<p>{{ $t("player.videoZoom.tips.enable") }}</p>
			</div>
		</SettingsCard>
		<MiniPlayerSettingsCard />
		<SettingsCard card-id="player-ui">
			<template #title>
				<span>{{ $t("player.ui.title") }}</span>
				<DocsHelpLink anchor="player-ui" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['player.ui.hideCeElement']" />
					<span>{{ $t("player.ui.checkbox.hideCeElement") }}</span>
					<DocsHelpLink anchor="player-ui-ending-overlay" />
				</label>
				<div class="settings-group">
					<p class="settings-label">{{ $t("player.ui.tips.progress") }}</p>
					<label class="form-item">
						<input type="checkbox" v-model="config['player.ui.progress.enable']" />
						<span>{{ $t("player.ui.checkbox.progressEnable") }}</span>
						<DocsHelpLink anchor="player-ui-progress-bar" />
					</label>
					<fieldset
						class="settings-dependent"
						:disabled="!config['player.ui.progress.enable']"
						:aria-label="$t('player.ui.tips.progress')"
					>
						<label class="form-item form-item-select">
							<span>{{ $t("player.ui.checkbox.progressHeight") }}</span>
							<input type="number" min="1" max="20" v-model.number="config['player.ui.progress.height']" />
						</label>
					</fieldset>
				</div>
				<div class="settings-group">
					<p class="settings-label">{{ $t("player.ui.tips.timeTag") }}</p>
					<label class="form-item">
						<input type="checkbox" v-model="config['player.ui.progress.enableTag']" />
						<span>{{ $t("player.ui.checkbox.progressEnableTag") }}</span>
						<DocsHelpLink anchor="player-ui-time-tag" />
					</label>
					<fieldset
						class="settings-dependent"
						:disabled="!config['player.ui.progress.enableTag']"
						:aria-label="$t('player.ui.tips.timeTag')"
					>
						<label class="form-item form-item-select">
							<span>{{ $t("player.ui.checkbox.progressTagFontSize") }}</span>
							<input type="number" min="8" max="48" v-model.number="config['player.ui.progress.tagFontSize']" />
						</label>
						<label class="form-item form-item-select">
							<span>{{ $t("player.ui.checkbox.progressTagOffset") }}</span>
							<input type="number" min="0" max="200" v-model.number="config['player.ui.progress.tagOffset']" />
						</label>
						<label class="form-item form-item-select">
							<span>{{ $t("player.ui.checkbox.progressTagPosition") }}</span>
							<select class="w-100" v-model="config['player.ui.progress.tagPosition']">
								<option v-for="option in progressTagPositions" :value="option.value" :key="option.value">
									{{ option.arrow }} {{ $t(option.labelKey) }}
								</option>
							</select>
						</label>
					</fieldset>
				</div>
				<div class="settings-group">
					<p class="settings-label">{{ $t("player.ui.networkSpeed.title") }}</p>
					<label class="form-item form-item-select">
						<span>{{ $t("player.ui.networkSpeed.label") }}</span>
						<DocsHelpLink anchor="player-ui-network-speed" />
						<select class="w-100" v-model="config['other.playerNetworkSpeed.mode']">
							<option value="off">{{ $t("player.ui.networkSpeed.option.off") }}</option>
							<option value="controls">{{ $t("player.ui.networkSpeed.option.controls") }}</option>
							<option value="both">{{ $t("player.ui.networkSpeed.option.both") }}</option>
						</select>
					</label>
					<fieldset
						class="settings-dependent"
						:disabled="config['other.playerNetworkSpeed.mode'] === 'off'"
						:aria-label="$t('player.ui.networkSpeed.title')"
					>
						<label class="form-item form-item-select">
							<span>{{ $t("player.ui.networkSpeed.unit.label") }}</span>
							<select class="w-100" v-model="config['other.playerNetworkSpeed.unit']">
								<option value="mb">{{ $t("player.ui.networkSpeed.unit.option.mb") }}</option>
								<option value="auto">{{ $t("player.ui.networkSpeed.unit.option.auto") }}</option>
							</select>
						</label>
						<label class="form-item">
							<input type="checkbox" v-model="config['other.playerNetworkSpeed.trackPageTraffic']" />
							<span>{{ $t("player.ui.networkSpeed.trackPageTraffic") }}</span>
						</label>
					</fieldset>
				</div>
			</div>
		</SettingsCard>
		<SettingsCard card-id="player-other">
			<template #title>
				<span>{{ $t("player.other.title") }}</span>
				<DocsHelpLink anchor="player-other" />
			</template>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.nonStop']" />
					<span>{{ $t("player.other.checkbox.nonStop") }}</span>
					<DocsHelpLink anchor="player-other-nonstop" />
				</label>
			</div>
		</SettingsCard>
	</section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import DocsHelpLink from "../components/DocsHelpLink.vue";
import SettingsCard from "../components/SettingsCard.vue";
import MiniPlayerSettingsCard from "../components/player/MiniPlayerSettingsCard.vue";
import VolumeBoosterSettings from "../components/player/VolumeBoosterSettings.vue";
import SubtitleLanguages from "../components/player/SubtitleLanguages.vue";
import useConfigStore from "../util/config";
import type { PlayerHideButtonMode } from "@/defaultConfig";
const config = useConfigStore() as {
	[key: `player.ui.hideButton.${string}`]: PlayerHideButtonMode;
} & ReturnType<typeof useConfigStore>;

const progressTagPositions = [
	{ value: "bottom-left", labelKey: "player.ui.position.bottomLeft", arrow: "↙" },
	{ value: "bottom-right", labelKey: "player.ui.position.bottomRight", arrow: "↘" },
	{ value: "top-left", labelKey: "player.ui.position.topLeft", arrow: "↖" },
	{ value: "top-right", labelKey: "player.ui.position.topRight", arrow: "↗" },
];

const speedSliderStepPresets = [0.0625, 0.125, 0.25, 0.5, 1];
const showCustomSpeedSliderStepInput = ref(false);
const speedSliderWheelStepSelectValue = computed({
	get() {
		if (config["player.ui.speedSliderWheelMode"] === "speedButtons") return "speedButtons";
		return speedSliderStepPresets.includes(Number(config["player.ui.speedSliderStep"]))
			? String(config["player.ui.speedSliderStep"])
			: "currentCustom";
	},
	set(value) {
		if (value === "currentCustom") return;
		if (value === "speedButtons") {
			config["player.ui.speedSliderWheelMode"] = "speedButtons";
			showCustomSpeedSliderStepInput.value = false;
			return;
		}

		config["player.ui.speedSliderWheelMode"] = "custom";
		showCustomSpeedSliderStepInput.value = value === "custom";
		if (value !== "custom") {
			config["player.ui.speedSliderStep"] = Number(value);
		}
	},
});
</script>

<style lang="scss">
#page-player {
	padding-bottom: 6px;

	.enabled-speed-buttons {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 6px;
		margin: 7px 0 9px;

		.form-item {
			position: relative;
			min-height: 30px;
			padding: 3px;
			justify-content: center;
			border: 1px solid #e1dce7;
			border-radius: 7px;
			background: #fff;
			cursor: pointer;
			font-size: 12px;
			font-variant-numeric: tabular-nums;

			input {
				position: absolute;
				width: 1px;
				height: 1px;
				min-width: 0;
				min-height: 0;
				opacity: 0;
			}

			span {
				text-align: center;
			}

			&:has(input:checked) {
				border-color: #dfc3f3;
				background: var(--settings-accent-soft);
				color: var(--settings-accent-ink);
				font-weight: 650;
			}

			&:has(input:focus-visible) {
				outline: 2px solid var(--settings-accent);
				outline-offset: 2px;
			}

			&:has(input:disabled) {
				cursor: not-allowed;
			}
		}
	}

	.speed-slider-step-custom {
		display: flex;
		gap: 6px;

		input {
			flex: 1 1 0;
			min-width: 0;
			width: auto;
		}

		.btn {
			flex: 0 0 auto;
		}
	}
}
</style>

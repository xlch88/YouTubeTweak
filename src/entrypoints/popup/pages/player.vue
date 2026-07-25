<template>
	<section id="page-player">
		<div class="card">
			<div class="card-title">
				<span>{{ $t("player.lockQuality.title") }}</span>
				<DocsHelpLink anchor="player-quality" />
			</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.lockQuality']" />
					<span>{{ $t("player.lockQuality.checkbox.enable") }}</span>
					<DocsHelpLink anchor="player-quality-auto-switch" />
				</label>
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
			</div>
		</div>
		<div class="card">
			<div class="card-title">
				<span>{{ $t("player.speedButtons.title") }}</span>
				<DocsHelpLink anchor="player-speed-button" />
			</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['player.ui.enableSpeedButtons']" />
					<span>{{ $t("player.speedButtons.checkbox.enable") }}</span>
					<DocsHelpLink anchor="player-speed-button-show" />
				</label>
				<p>{{ $t("player.speedButtons.tips.enabledButtons") }}</p>
				<div class="form-item-group enabled-speed-buttons">
					<label class="form-item" v-for="speed in [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 5, 10]">
						<input
							type="checkbox"
							class="checkbox-size-mini"
							v-model="config['player.ui.speedButtons']"
							:value="speed"
							:key="speed"
						/>
						<span>{{ speed }}x</span>
					</label>
				</div>
				<label class="form-item speed-slider-toggle">
					<input type="checkbox" v-model="config['player.ui.enableSpeedSlider']" />
					<span>{{ $t("player.speedButtons.checkbox.enableSlider") }}</span>
				</label>
				<p class="speed-slider-tip">{{ $t("player.speedButtons.tips.slider") }}</p>
				<label v-if="config['player.ui.enableSpeedSlider']" class="form-item form-item-select speed-slider-step">
					<span>{{ $t("player.speedButtons.select.sliderWheelStep") }}</span>
					<select v-if="!showCustomSpeedSliderStepInput" class="w-100" v-model="speedSliderWheelStepSelectValue">
						<option value="speedButtons">{{ $t("player.speedButtons.select.sliderWheelStepFollowButtons") }}</option>
						<option v-if="speedSliderWheelStepSelectValue === 'currentCustom'" value="currentCustom">
							{{ config["player.ui.speedSliderStep"] }}
						</option>
						<option v-for="step in speedSliderStepPresets" :value="String(step)" :key="step">{{ step }}</option>
						<option value="custom">{{ $t("player.speedButtons.select.sliderWheelStepCustom") }}</option>
					</select>
					<span v-else class="speed-slider-step-custom">
						<input type="number" min="0.0001" max="10" step="0.0001" v-model.number="config['player.ui.speedSliderStep']" />
						<button class="btn" type="button" @click="showCustomSpeedSliderStepInput = false">
							{{ $t("player.speedButtons.select.sliderWheelStepPresets") }}
						</button>
					</span>
				</label>

				<p>{{ $t("player.speedButtons.tips.save") }}</p>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.saveSpeed']" />
					<span>{{ $t("player.speedButtons.checkbox.save") }}</span>
					<DocsHelpLink anchor="player-speed-button-save" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.saveSpeedByChannel']" />
					<span>{{ $t("player.speedButtons.checkbox.saveByChannel") }}</span>
				</label>
			</div>
		</div>
		<VolumeBoosterSettingsCard />
		<div class="card">
			<div class="card-title">
				<span>{{ $t("player.videoZoom.title") }}</span>
				<DocsHelpLink anchor="player-video-zoom" />
			</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['player.ui.enableVideoZoom']" />
					<span>{{ $t("player.videoZoom.checkbox.enable") }}</span>
					<DocsHelpLink anchor="player-video-zoom-wheel" />
				</label>
				<p>{{ $t("player.videoZoom.tips.enable") }}</p>
			</div>
		</div>
		<div class="card">
			<div class="card-title">
				<span>{{ $t("player.subtitles.title") }}</span>
				<DocsHelpLink anchor="player-subtitle" />
			</div>
			<div class="card-body">
				<p>{{ $t("player.subtitles.tips.save") }}</p>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.saveSubtitleStatus']" />
					<span>{{ $t("player.subtitles.checkbox.save") }}</span>
					<DocsHelpLink anchor="player-subtitle-save-status" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.saveSubtitleStatusByChannel']" />
					<span>{{ $t("player.subtitles.checkbox.saveByChannel") }}</span>
				</label>
			</div>
		</div>
		<div class="card">
			<div class="card-title">
				<span>{{ $t("player.functionButtons.title") }}</span>
				<DocsHelpLink anchor="player-function-buttons" />
			</div>
			<div class="card-body">
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
			</div>
		</div>
		<div class="card">
			<div class="card-title">
				<span>{{ $t("player.hidePlayerButtons.title") }}</span>
				<DocsHelpLink anchor="player-button-display" />
			</div>
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
		</div>
		<MiniPlayerSettingsCard />
		<div class="card">
			<div class="card-title">
				<span>{{ $t("player.ui.title") }}</span>
				<DocsHelpLink anchor="player-ui" />
			</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['player.ui.hideCeElement']" />
					<span>{{ $t("player.ui.checkbox.hideCeElement") }}</span>
					<DocsHelpLink anchor="player-ui-ending-overlay" />
				</label>
				<p>{{ $t("player.ui.tips.progress") }}</p>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.ui.progress.enable']" />
					<span>{{ $t("player.ui.checkbox.progressEnable") }}</span>
					<DocsHelpLink anchor="player-ui-progress-bar" />
				</label>
				<label class="form-item form-item-select">
					<span>{{ $t("player.ui.checkbox.progressHeight") }}</span>
					<input type="number" min="1" max="20" style="width: 70px" v-model.number="config['player.ui.progress.height']" />
				</label>
				<p>{{ $t("player.ui.tips.timeTag") }}</p>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.ui.progress.enableTag']" />
					<span>{{ $t("player.ui.checkbox.progressEnableTag") }}</span>
					<DocsHelpLink anchor="player-ui-time-tag" />
				</label>
				<label class="form-item form-item-select">
					<span>{{ $t("player.ui.checkbox.progressTagFontSize") }}</span>
					<input type="number" min="8" max="48" style="width: 70px" v-model.number="config['player.ui.progress.tagFontSize']" />
				</label>
				<label class="form-item form-item-select">
					<span>{{ $t("player.ui.checkbox.progressTagOffset") }}</span>
					<input type="number" min="0" max="200" style="width: 70px" v-model.number="config['player.ui.progress.tagOffset']" />
				</label>
				<label class="form-item form-item-select">
					<span>{{ $t("player.ui.checkbox.progressTagPosition") }}</span>
					<select class="w-100" v-model="config['player.ui.progress.tagPosition']">
						<option v-for="option in progressTagPositions" :value="option.value" :key="option.value">
							{{ option.arrow }} {{ $t(option.labelKey) }}
						</option>
					</select>
				</label>
			</div>
		</div>
		<div class="card">
			<div class="card-title">
				<span>{{ $t("player.other.title") }}</span>
				<DocsHelpLink anchor="player-other" />
			</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.maxVolume']" />
					<span>{{ $t("player.other.checkbox.maxVolume") }}</span>
					<DocsHelpLink anchor="player-other-max-volume" />
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['player.settings.nonStop']" />
					<span>{{ $t("player.other.checkbox.nonStop") }}</span>
					<DocsHelpLink anchor="player-other-nonstop" />
				</label>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import DocsHelpLink from "../components/DocsHelpLink.vue";
import MiniPlayerSettingsCard from "../components/player/MiniPlayerSettingsCard.vue";
import VolumeBoosterSettingsCard from "../components/player/VolumeBoosterSettingsCard.vue";
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

<style lang="scss" scoped>
.enabled-speed-buttons {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 5px;
	justify-content: flex-start;
	margin-top: 5px;
	width: 100%;

	label {
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		position: relative;
		border: 1px dashed #00000040;
		border-radius: 13px;
		padding: 0px 7px 0px 7px;
		gap: 1px;
		min-width: 0;
		width: 100%;

		span {
			width: 100%;
			text-align: center;
		}
	}
}

.speed-slider {
	&-toggle {
		margin-top: 10px;
	}

	&-tip {
		margin-top: 4px;
		margin-bottom: 3px;
	}

	&-step {
		&-custom {
			display: flex;
			gap: 6px;
			justify-content: flex-end;

			input {
				width: 90px;
			}
		}
	}
}
</style>

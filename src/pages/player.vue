<template>
	<div class="card">
		<div class="card-title">{{ $t("player.lockQuality.title") }}</div>
		<div class="card-body">
			<label class="form-item">
				<input type="checkbox" v-model="config['player.settings.lockQuality']" />
				<span>{{ $t("player.lockQuality.checkbox.enable") }}</span>
			</label>
			<select class="w-100 mt-5" v-model="config['player.settings.lockQuality.value']">
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
		<div class="card-title">{{ $t("player.speedButtons.title") }}</div>
		<div class="card-body">
			<label class="form-item">
				<input type="checkbox" v-model="config['player.ui.enableSpeedButtons']" />
				<span>{{ $t("player.speedButtons.checkbox.enable") }}</span>
			</label>
			<p>{{ $t("player.speedButtons.tips.enabledButtons") }}</p>
			<div class="form-item-group">
				<label class="form-item" v-for="speed in [0.25, 0.5, 1, 1.25, 1.5, 2, 3]">
					<input type="checkbox" v-model="config['player.ui.speedButtons']" :value="speed" :key="speed" />
					<span>{{ speed }}x</span>
				</label>
			</div>
			<p>记住倍速</p>

			<label class="form-item" v-for="speed in [0.25, 0.5, 1, 1.25, 1.5, 2, 3]">
				<input type="checkbox" v-model="config['player.ui.speedButtons']" :value="speed" :key="speed" />
				<span>{{ speed }}x</span>
			</label>
		</div>
	</div>
	<div class="card">
		<div class="card-title">{{ $t("player.hidePlayerButtons.title") }}</div>
		<div class="card-body">
			<label
				class="form-item"
				v-for="key in ['autoplay', 'subtitles', 'settings', 'miniPlayer', 'pip', 'size', 'remote', 'fullscreen']"
				:key="key"
			>
				<input type="checkbox" v-model="config[`player.ui.hideButton.${key}`]" />
				<span>{{ $t(`player.hidePlayerButtons.checkbox.${key}`) }}</span>
			</label>
		</div>
	</div>
	<div class="card">
		<div class="card-title">{{ $t("player.ui.title") }}</div>
		<div class="card-body">
			<label class="form-item">
				<input type="checkbox" v-model="config['player.ui.hideCeElement']" />
				<span>{{ $t("player.ui.checkbox.hideCeElement") }}</span>
			</label>
		</div>
	</div>
	<div class="card">
		<div class="card-title">{{ $t("player.other.title") }}</div>
		<div class="card-body">
			<label class="form-item">
				<input type="checkbox" v-model="config['player.settings.maxVolume']" />
				<span>{{ $t("player.other.checkbox.maxVolume") }}</span>
			</label>
		</div>
	</div>
</template>

<script setup>
import useConfigStore from "../util/config.js";
const config = useConfigStore();
</script>

<template>
	<div class="card">
		<div class="card-title">{{ $t("player.volumeBooster.title") }}</div>
		<div class="card-body">
			<label class="form-item">
				<input type="checkbox" v-model="config['player.ui.enableVolumeBooster']" />
				<span>{{ $t("player.volumeBooster.checkbox.showControl") }}</span>
			</label>

			<label class="form-item">
				<input type="checkbox" v-model="config['player.settings.volumeBooster']" />
				<span>{{ $t("player.volumeBooster.checkbox.enableByDefault") }}</span>
			</label>

			<p>{{ $t("player.volumeBooster.tips.control") }}</p>

			<label class="form-item form-item-select">
				<span>{{ $t("player.volumeBooster.select.multiplier") }}</span>
				<select class="w-100" v-model.number="config['player.settings.volumeBoosterMultiplier']">
					<option v-for="option in multiplierOptions" :key="option" :value="option">{{ formatMultiplier(option) }}x</option>
				</select>
			</label>
		</div>
	</div>
</template>

<script setup lang="ts">
import useConfigStore from "../../util/config";

const config = useConfigStore();

const multiplierOptions = Array.from({ length: 16 }, (_, index) => 1.25 + index * 0.25);

function formatMultiplier(value: number) {
	return value
		.toFixed(2)
		.replace(/\.00$/, "")
		.replace(/(\.\d)0$/, "$1");
}
</script>

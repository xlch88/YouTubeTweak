<template>
	<SettingsCard card-id="player-mini-player">
		<template #title>
			<span>{{ $t("player.miniPlayer.title") }}</span>
			<DocsHelpLink anchor="player-mini-player" />
		</template>
		<div class="card-body">
			<label class="form-item">
				<input type="checkbox" v-model="config['player.miniPlayer.enable']" />
				<span>{{ $t("player.miniPlayer.checkbox.enable") }}</span>
				<DocsHelpLink anchor="player-mini-player-scroll" />
			</label>

			<p>{{ $t("player.miniPlayer.tips.enable") }}</p>

			<fieldset
				class="settings-dependent"
				:disabled="!config['player.miniPlayer.enable']"
				:aria-label="$t('player.miniPlayer.title')"
			>
				<label class="form-item form-item-select">
					<span>{{ $t("player.miniPlayer.select.size") }}</span>
					<select class="w-100" v-model="config['player.miniPlayer.size']">
						<option v-if="!sizeOptions.includes(config['player.miniPlayer.size'])" :value="config['player.miniPlayer.size']">
							{{ config["player.miniPlayer.size"].replace("x", "×") }}
						</option>
						<option v-for="option in sizeOptions" :key="option" :value="option">
							{{ option.replace("x", "×") }}
						</option>
					</select>
				</label>

				<label class="form-item form-item-select">
					<span>{{ $t("player.miniPlayer.select.position") }}</span>
					<select class="w-100" v-model="config['player.miniPlayer.position']">
						<option v-for="option in positionOptions" :key="option.value" :value="option.value">
							{{ option.arrow }} {{ $t(option.labelKey) }}
						</option>
					</select>
				</label>

				<div class="form-item mini-player-offsets">
					<span>{{ $t("player.miniPlayer.select.offset") }}</span>
					<div class="offset-inputs">
						<label v-for="axis in ['x', 'y'] as const" :key="axis">
							<span>{{ axis.toUpperCase() }}</span>
							<input
								type="number"
								min="0"
								step="1"
								:value="offset[axis]"
								:aria-label="`${$t('player.miniPlayer.select.offset')} ${axis.toUpperCase()} (px)`"
								@change="setOffset(axis, ($event.target as HTMLInputElement).value)"
							/>
						</label>
						<span>px</span>
					</div>
				</div>

				<label class="form-item form-item-select">
					<span>{{ $t("player.miniPlayer.select.triggerOffset") }}</span>
					<input type="number" min="0" max="400" v-model.number="config['player.miniPlayer.triggerOffset']" />
				</label>
			</fieldset>
		</div>
	</SettingsCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DocsHelpLink from "../DocsHelpLink.vue";
import SettingsCard from "../SettingsCard.vue";
import useConfigStore from "../../util/config";

const config = useConfigStore();
const offset = computed(() => {
	const value = config["player.miniPlayer.offset"];
	return typeof value === "number" ? { x: value, y: value } : value;
});

function setOffset(axis: "x" | "y", value: string) {
	if (!value.trim() || !Number.isFinite(Number(value))) return;
	config["player.miniPlayer.offset"] = { ...offset.value, [axis]: Math.max(0, Math.round(Number(value))) };
}

const sizeOptions = ["360x203", "420x236", "480x270", "560x315", "640x360", "720x405"];

const positionOptions = [
	{ value: "bottom-right", labelKey: "player.ui.position.bottomRight", arrow: "↘" },
	{ value: "bottom-center", labelKey: "player.ui.position.bottomCenter", arrow: "↓" },
	{ value: "bottom-left", labelKey: "player.ui.position.bottomLeft", arrow: "↙" },
	{ value: "top-right", labelKey: "player.ui.position.topRight", arrow: "↗" },
	{ value: "top-center", labelKey: "player.ui.position.topCenter", arrow: "↑" },
	{ value: "top-left", labelKey: "player.ui.position.topLeft", arrow: "↖" },
];
</script>

<style lang="scss" scoped>
.mini-player-offsets {
	flex-wrap: wrap;
	.offset-inputs {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-left: auto;
		color: #737987;
		label {
			display: flex;
			align-items: center;
			gap: 4px;
		}
		input {
			width: 62px;
			min-width: 0;
		}
	}
}
</style>

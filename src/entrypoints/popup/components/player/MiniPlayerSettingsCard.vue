<template>
	<div class="card">
		<div class="card-title">{{ $t("player.miniPlayer.title") }}</div>
		<div class="card-body">
			<label class="form-item">
				<input type="checkbox" v-model="config['player.miniPlayer.enable']" />
				<span>{{ $t("player.miniPlayer.checkbox.enable") }}</span>
			</label>

			<p>{{ $t("player.miniPlayer.tips.enable") }}</p>

			<label class="form-item form-item-select">
				<span>{{ $t("player.miniPlayer.select.size") }}</span>
				<select class="w-100" v-model="config['player.miniPlayer.size']">
					<option v-for="option in sizeOptions" :key="option.value" :value="option.value">
						{{ option.label }}
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

			<label class="form-item form-item-select">
				<span>{{ $t("player.miniPlayer.select.offset") }}</span>
				<input type="number" min="0" max="96" style="width: 90px" v-model.number="config['player.miniPlayer.offset']" />
			</label>

			<label class="form-item form-item-select">
				<span>{{ $t("player.miniPlayer.select.triggerOffset") }}</span>
				<input
					type="number"
					min="0"
					max="400"
					style="width: 90px"
					v-model.number="config['player.miniPlayer.triggerOffset']"
				/>
			</label>
		</div>
	</div>
</template>

<script setup lang="ts">
import useConfigStore from "../../util/config";

const config = useConfigStore();

const sizeOptions = [
	{ value: "360x203", label: "Compact 360×203" },
	{ value: "420x236", label: "Balanced 420×236" },
	{ value: "480x270", label: "Default 480×270" },
	{ value: "560x315", label: "Large 560×315" },
	{ value: "640x360", label: "XL 640×360" },
	{ value: "720x405", label: "Cinema 720×405" },
];

const positionOptions = [
	{ value: "bottom-right", labelKey: "player.ui.position.bottomRight", arrow: "↘" },
	{ value: "bottom-center", labelKey: "player.ui.position.bottomCenter", arrow: "↓" },
	{ value: "bottom-left", labelKey: "player.ui.position.bottomLeft", arrow: "↙" },
	{ value: "top-right", labelKey: "player.ui.position.topRight", arrow: "↗" },
	{ value: "top-center", labelKey: "player.ui.position.topCenter", arrow: "↑" },
	{ value: "top-left", labelKey: "player.ui.position.topLeft", arrow: "↖" },
];
</script>

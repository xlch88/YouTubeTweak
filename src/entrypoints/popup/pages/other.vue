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
						max="10"
						@blur="check"
					/>
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
	</section>
</template>

<script setup>
import useConfigStore from "../util/config.js";
const config = useConfigStore();

function check() {
	if (
		!/^\d+$/.test(config["index.videoPerRow.count"].toString()) ||
		config["index.videoPerRow.count"] < 1 ||
		config["index.videoPerRow.count"] > 10
	) {
		config["index.videoPerRow.count"] = 4;
	}
}
</script>

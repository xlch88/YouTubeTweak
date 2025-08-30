<template>
	<section id="page-comment">
		<div class="card">
			<div class="card-title">{{ $t("comment.nickname.title") }}</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.nickname']" />
					<span>{{ $t("comment.nickname.checkbox.showNickname") }}</span>
				</label>
			</div>
		</div>
		<div class="card">
			<div class="card-title">{{ $t("comment.context.title") }}</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.autoShowMore']" />
					<span>{{ $t("comment.context.checkbox.autoShowMore") }}</span>
				</label>
				<label class="form-item">
					<input type="checkbox" v-model="config['comment.autoTranslate']" />
					<span>{{ $t("comment.context.checkbox.autoTranslate") }}</span>
				</label>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import useConfigStore from "../util/config";
const config = useConfigStore();
</script>

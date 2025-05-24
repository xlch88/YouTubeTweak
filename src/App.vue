<template>
	<template v-if="action === 'popup'">
		<header>
			<div class="item logo">
				<img src="/assets/img/logo.svg" alt="logo" />
				<span><small>YouTube</small>Tweak</span>
			</div>
			<button
				v-for="key in ['player', 'comment', 'other', 'general']"
				:key="key"
				class="item"
				:class="{ active: tab === key }"
				@click="tab = key"
			>
				{{ $t(`tabs.${key}.title`) }}
			</button>
		</header>

		<main>
			<player v-if="tab === 'player'"></player>
			<comment v-else-if="tab === 'comment'"></comment>
			<other v-else-if="tab === 'other'"></other>
			<general v-else-if="tab === 'general'"></general>
		</main>
	</template>
	<installed v-else-if="action === 'installed'"></installed>
</template>

<script setup>
import useConfigStore from "./util/config.js";
import { ref, provide } from "vue";
import Other from "./pages/other.vue";
import Player from "./pages/player.vue";
import Comment from "./pages/comment.vue";
import Installed from "./pages/installed.vue";
import General from "./pages/general.vue";

const tab = ref("player");
const action = ref("popup");

const params = new URLSearchParams(window.location.search);
if (params.get("action")) {
	action.value = params.get("action");
}

if (!(window === window.top && chrome?.extension?.getViews({ type: "popup" })?.includes(window))) {
	document.body.style.width = "initial";
	document.body.style.height = "initial";
}

provide("setTab", (v) => {
	tab.value = v;
});
</script>

<style lang="scss">
main {
	margin-top: 40px;
	height: 100%;
	width: 100%;
	overflow-y: auto;
	//background: #000;
	//width: 100px;
	//height: 100px;
}
header {
	position: fixed;
	z-index: 9999;
	height: 40px;
	width: 100%;
	top: 0;
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	justify-content: space-between;
	align-items: center;
	box-shadow: 0 0 10px rgba(#000, 0.3);
	background: #fff;

	.item {
		appearance: none;
		padding: 5px 10px;
		height: 100%;
		flex: 1;
		line-height: 30px;
		text-align: center;
		border: none;
		background: none;
		cursor: pointer;
		word-break: keep-all;
		white-space: nowrap;

		&.active {
			background: rgba(#000, 0.05);
		}
		&:hover {
			background: rgba(#000, 0.1);
		}

		&.logo {
			display: flex;
			align-items: center;
			padding: 0 10px;
			background: #fff;
			cursor: default;

			img {
				width: 30px;
				height: 30px;
				margin-right: 5px;
			}
			span {
				font-weight: bolder;
				font-size: 15px;
				line-height: 12px;
				font-family: "Trebuchet MS";
				display: flex;
				flex-direction: column;
				text-align: left;

				small {
					font-size: 7px;
					line-height: 7px;
					color: rgba(0, 0, 0, 0.5);
				}
			}
		}
	}
}
.card {
	background: #fff;
	margin: 10px;
	border-radius: 5px;
	padding: 10px;
	.card-title {
		font-size: 15px;
		font-weight: bolder;
		padding-bottom: 5px;
		margin-bottom: 5px;
		border-bottom: 1px solid #eee;
	}
	.card-body {
		p {
			color: #7e8299;
			margin-bottom: 0;
			margin-top: 10px;
		}
	}
}
.form-item {
	display: flex;
	align-items: center;

	&:hover input[type="checkbox"]:not(:checked):not(:focus):not(:disabled) {
		background-color: rgba(#000, 0.1);
	}
}
.form-item-group {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	justify-content: space-between;
}
</style>

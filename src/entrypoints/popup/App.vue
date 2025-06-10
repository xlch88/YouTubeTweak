<template>
	<template v-if="action === 'popup'">
		<header>
			<a class="item logo" target="_blank" href="https://github.com/xlch88/YouTubeTweak">
				<img src="@/assets/img/logo.svg" alt="logo" />
				<span><small>YouTube</small>Tweak</span>
			</a>
			<button
				v-for="key in ['player', 'comment', 'other', /*'insights', */ 'general']"
				:key="key"
				class="item"
				:class="{ active: tab === key }"
				@click="tab = key"
			>
				<span>{{ $t(`tabs.${key}.title`) }}</span>
			</button>
		</header>

		<main>
			<player v-if="tab === 'player'"></player>
			<comment v-else-if="tab === 'comment'"></comment>
			<other v-else-if="tab === 'other'"></other>
			<general v-else-if="tab === 'general'"></general>
			<insights v-else-if="tab === 'insights'"></insights>
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
import Insights from "./pages/insights.vue";

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
	padding: 0 10px;

	.item {
		appearance: none;
		padding: 5px 0;
		height: 100%;
		line-height: 30px;
		text-align: center;
		border: none;
		background: none;
		cursor: pointer;
		word-break: keep-all;
		white-space: nowrap;
		font-size: 12px;
		transition: color 0.3s;

		&:is(button) > span {
			background: transparent;
			padding: 3px 6px;
			border-radius: 500px;
		}

		&.active {
			color: #d739e3;
			> span {
				background: rgba(215, 57, 227, 0.2);
			}
		}
		&:hover {
			color: #c15fc7;
			&.active {
				color: #c320d0;
			}
		}

		&.logo {
			display: flex;
			align-items: center;
			background: #fff;
			cursor: help;
			color: #000;

			img {
				width: 30px;
				height: 30px;
				margin-right: 5px;
			}
			span {
				font-weight: bolder;
				font-size: 15px;
				line-height: 12px;
				font-family: "Trebuchet MS", serif;
				display: flex;
				flex-direction: column;
				text-align: left;

				small {
					font-size: 7px;
					line-height: 7px;
					color: rgba(0, 0, 0, 0.5);
				}
			}

			&:hover {
				color: #8f5bff;
			}
		}
	}
}
.card {
	background: #fff;
	margin: 10px;
	border-radius: 5px;
	padding: 10px;
	box-shadow:
		0 7px 14px 0 rgba(65, 69, 88, 0.1),
		0 3px 6px 0 rgba(0, 0, 0, 0.07);

	.card-title {
		font-weight: bold;
		border-bottom: 1px solid #eee;
		background: rgb(249, 250, 253);
		margin: -10px -10px 10px -10px;
		padding: 10px;
		font-size: 13px;
		border-radius: 5px 5px 0 0;
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

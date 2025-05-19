<template>
	<template v-if="action === 'popup'">
		<header>
			<div class="item logo">
				<img src="/assets/img/logo.svg" alt="logo" />
				<span>YouTubeTweak</span>
			</div>
			<button
				v-for="key in ['player', 'comment', 'other', 'about']"
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
			<about v-else-if="tab === 'about'"></about>
		</main>
	</template>
	<installed v-else-if="action === 'installed'"></installed>
</template>

<script setup>
import useConfigStore from "./util/config.js";
import { ref, provide } from "vue";
import Other from "./pages/other.vue";
import About from "./pages/about.vue";
import Player from "./pages/player.vue";
import Comment from "./pages/comment.vue";
import Installed from "./pages/installed.vue";
const config = useConfigStore();

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
		padding: 5px;
		height: 100%;
		flex: 1;
		line-height: 30px;
		text-align: center;
		border: none;
		background: none;
		cursor: pointer;

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
				line-height: 14px;
				font-family: "Trebuchet MS";
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

	&:hover input[type="checkbox"] {
		background-color: rgba(#000, 0.1);
	}

	input[type="checkbox"] {
		appearance: none;
		width: 18px;
		height: 18px;
		border: 1.5px solid #b2b2b2;
		border-radius: 4px;
		background-color: white;
		cursor: pointer;
		position: relative;
		margin-left: 0;
		transition:
			background-color 0.3s,
			border-color 0.3s;

		&:checked {
			background-color: #2196f3;
			border-color: #2196f3;

			&::after {
				content: "";
				position: absolute;
				left: 5px;
				top: 1px;
				width: 3px;
				height: 8px;
				border: solid #ffffff;
				border-width: 0 2px 2px 0;
				transform: rotate(45deg);
			}
		}
	}
}
.form-item-group {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	justify-content: space-between;
}
</style>

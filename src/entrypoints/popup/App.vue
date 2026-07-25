<template>
	<template v-if="action === 'popup'">
		<header>
			<a class="item logo" target="_blank" href="https://github.com/xlch88/YouTubeTweak">
				<img :src="APP_LOGO" alt="logo" />
				<span v-if="APP_BRANDING.isSafari"><small>You</small>Tweak</span>
				<span v-else><small>YouTube</small>Tweak</span>
			</a>
			<button v-for="key in Object.keys(tabs)" :key="key" class="item" :class="{ active: tab === key }" @click="tabClick(key)">
				<span>{{ $t(`tabs.${key}.title`) }}</span>
			</button>
		</header>

		<main ref="mainElement">
			<transition name="slide-fade" mode="out-in">
				<component :is="tabs[tab]" />
			</transition>
		</main>
	</template>
	<installed v-else-if="action === 'installed'"></installed>
</template>

<script setup lang="ts">
import useConfigStore from "./util/config";
import appleLogo from "@/assets/img/logo_apple.svg";
import logo from "@/assets/img/logo.svg";
import { ref, provide, defineAsyncComponent, watch } from "vue";
import Installed from "./pages/installed.vue";
import type { Component } from "vue";

const APP_BRANDING = __APP_BRANDING__;
const APP_LOGO = APP_BRANDING.isSafari ? appleLogo : logo;
const tabs: Record<string, Component> = {
	player: defineAsyncComponent(() => import("./pages/player.vue")),
	translate: defineAsyncComponent(() => import("./pages/translate.vue")),
	other: defineAsyncComponent(() => import("./pages/other.vue")),
	// insights: defineAsyncComponent(() => import("./pages/insights.vue")),
	general: defineAsyncComponent(() => import("./pages/general.vue")),
};

const mainElement = ref<HTMLElement | null>(null);
const tab = ref(localStorage.getItem("tab") || "player");
watch(tab, () => {
	setTimeout(() => {
		if (mainElement.value) mainElement.value.scrollTop = 0;
	}, 100);
});
function tabClick(key: string) {
	tab.value = key;
	localStorage.setItem("tab", key);
}
const action = ref("popup");

const params = new URLSearchParams(window.location.search);
const actionParam = params.get("action");
if (actionParam) {
	action.value = actionParam;
}
const tabParam = params.get("tab");
if (tabParam && tabs[tabParam]) {
	tab.value = tabParam;
}

if (!(window === window.top && browser?.extension?.getViews({ type: "popup" })?.includes(window))) {
	document.body.style.width = "initial";
	document.body.style.height = "initial";
}

provide("setTab", (v: string) => {
	tab.value = v;
});
</script>

<style lang="scss">
main {
	margin-top: 44px;
	height: calc(100vh - 44px);
	width: 100%;
	overflow-y: auto;
	overflow-x: hidden;
	scrollbar-gutter: stable;

	.slide-fade-enter-active,
	.slide-fade-leave-active {
		transition:
			transform 0.14s ease,
			opacity 0.14s ease;
	}

	.slide-fade-enter-from,
	.slide-fade-leave-to {
		transform: translateY(-6px);
		opacity: 0;
	}

	.slide-fade-enter-to,
	.slide-fade-leave-from {
		transform: translateY(0);
		opacity: 1;
	}
}

header {
	position: fixed;
	z-index: 9999;
	height: 44px;
	width: 100%;
	top: 0;
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	gap: 2px;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid #e8e8ef;
	box-shadow: 0 2px 12px rgba(40, 42, 54, 0.08);
	background: #fff;
	padding: 0 8px;

	.item {
		appearance: none;
		padding: 5px 2px;
		height: 100%;
		line-height: 30px;
		text-align: center;
		border: none;
		background: none;
		color: #55586a;
		cursor: pointer;
		word-break: keep-all;
		white-space: nowrap;
		font-size: 12px;
		font-weight: 500;
		transition: color 0.18s;
		flex: 1;

		&:is(button) > span {
			background: transparent;
			padding: 4px 7px;
			border-radius: 500px;
			transition:
				background-color 0.18s,
				box-shadow 0.18s;
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

		&:focus-visible {
			outline: 2px solid rgba(215, 57, 227, 0.4);
			outline-offset: -3px;
			border-radius: 7px;
		}

		&.logo {
			display: flex;
			align-items: center;
			background: transparent;
			color: #252631;
			cursor: pointer;

			img {
				width: 28px;
				height: 28px;
				margin-right: 5px;
			}

			span {
				font-weight: 700;
				font-size: 15px;
				line-height: 12px;
				font-family: "Trebuchet MS", serif;
				display: flex;
				flex-direction: column;
				text-align: left;

				small {
					font-size: 7px;
					line-height: 7px;
					color: #8a8c98;
				}
			}

			&:hover {
				color: #8f5bff;
			}
		}
	}
}
</style>

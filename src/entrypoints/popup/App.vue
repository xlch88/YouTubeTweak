<template>
	<template v-if="action === 'popup'">
		<header>
			<a class="item logo" target="_blank" href="https://github.com/xlch88/YouTubeTweak">
				<img :src="APP_LOGO" alt="logo" />
				<span v-if="APP_BRANDING.isSafari"><small>You</small>Tweak</span>
				<span v-else><small>YouTube</small>Tweak</span>
			</a>
			<button
				v-for="(item, key) in tabs"
				:key="key"
				class="item"
				:class="{ active: tab === key }"
				:title="$t(`tabs.${key}.title`)"
				:aria-label="$t(`tabs.${key}.title`)"
				@click="tabClick(key)"
			>
				<span>
					<svg
						class="tab-icon"
						:class="{ 'tab-icon-filled': item.filled }"
						:viewBox="item.viewBox"
						:stroke-width="item.strokeWidth"
						aria-hidden="true"
					>
						<path :d="item.icon" />
					</svg>
					<span class="tab-label">{{ $t(`tabs.${key}.title`) }}</span>
				</span>
			</button>
		</header>

		<main ref="mainElement">
			<transition name="slide-fade" mode="out-in">
				<component :is="tabs[tab].component" />
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
const tabs: Record<
	string,
	{ component: Component; icon: string; viewBox: string; filled?: boolean; strokeWidth?: number }
> = {
	player: {
		component: defineAsyncComponent(() => import("./pages/player.vue")),
		icon: "M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z M10 9l5 3-5 3Z",
		viewBox: "3.15 4.15 17.7 15.7",
		strokeWidth: 1.8,
	},
	translate: {
		component: defineAsyncComponent(() => import("./pages/translate.vue")),
		icon: "M966.40846532 1011.8493111c-18.17633896 0-31.80859289-9.08816895-40.89676184-27.26450789l-63.61718581-127.23436948h-295.36550188l-63.61718474 127.23436948c-9.08816895 22.72042289-36.35267685 31.80859289-59.07310079 18.17633895-27.2645079-9.08816895-36.35267685-36.35267685-22.7204229-54.5290158l77.24943869-149.95479343 154.49887844-308.99775582c13.63225395-22.72042289 36.35267685-40.89676184 63.61718474-40.89676184s49.98493079 13.63225395 63.61718475 40.89676184l154.49887844 308.99775582 77.24943868 149.95479343c9.08816895 22.72042289 0 49.98493079-18.17633788 59.07310081-13.63225395 4.544085-18.17633896 4.544085-27.2645079 4.54408393z m-354.43860267-240.83648607h204.48380922l-104.51394765-204.48380924-99.96986157 204.48380924zM57.59153468 866.43860267c-18.17633896 0-31.80859289-9.08816895-40.89676185-27.26450789-9.08816895-22.72042289 0-49.98493079 22.72042396-59.0731008 99.96986265-49.98493079 190.85155528-118.14620054 263.55690897-199.93972424-49.98493079-68.16126974-90.88169264-136.32253949-118.14620054-204.48380923-9.08816895-22.72042289 4.544085-49.98493079 27.26450791-59.07310081 22.72042289-9.08816895 49.98493079 4.544085 59.07310081 27.26450792 22.72042289 54.52901579 49.98493079 109.0580316 86.33760761 159.04296343 63.61718473-90.88169264 109.0580316-190.85155528 136.32253949-299.90958687H57.59153468c-27.2645079 0-45.44084685-18.17633896-45.44084578-45.44084685s18.17633896-45.44084685 45.44084578-45.44084686h259.01282502V57.59153468c0-27.2645079 18.17633896-45.44084685 45.44084686-45.44084578s45.44084685 18.17633896 45.44084685 45.44084578v54.52901579h254.46874003c27.2645079 0 45.44084685 18.17633896 45.44084686 45.44084686s-18.17633896 45.44084685-45.44084686 45.44084685h-72.70535475c-27.2645079 136.32253949-90.88169264 263.55691003-172.67521634 372.61494055l27.26450791 27.26450791c18.17633896 18.17633896 18.17633896 45.44084685 0 63.61718581-18.17633896 18.17633896-45.44084685 18.17633896-63.61718475 0l-18.17633895-18.17633896c-77.24943869 86.3376087-172.67521634 159.04296239-281.73324793 213.57197818-9.08816895 0-18.17633896 4.544085-22.72042395 4.544085z",
		viewBox: "0 0 1024 1024",
		filled: true,
	},
	other: {
		component: defineAsyncComponent(() => import("./pages/other.vue")),
		icon: "M7 6h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z M14 6h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z M7 13h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z M14 13h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z",
		viewBox: "4.15 4.15 15.7 15.7",
		strokeWidth: 1.6,
	},
	general: {
		component: defineAsyncComponent(() => import("./pages/general.vue")),
		icon: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
		viewBox: "1.15 1.15 21.7 21.7",
		strokeWidth: 2.2,
	},
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
	justify-content: flex-start;
	align-items: center;
	border-bottom: 1px solid #e8e8ef;
	box-shadow: 0 2px 12px rgba(40, 42, 54, 0.08);
	background: #fff;
	padding: 0 8px;

	.item {
		appearance: none;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 5px 0;
		height: 100%;
		line-height: normal;
		text-align: center;
		border: none;
		background: none;
		color: #55586a;
		cursor: pointer;
		word-break: keep-all;
		white-space: nowrap;
		font-size: 12px;
		font-weight: 500;
		width: 32px;
		flex: 0 0 auto;
		transition:
			width 0.18s cubic-bezier(0.2, 0, 0, 1),
			color 0.18s;

		&:is(button) > span {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0;
			width: 100%;
			height: 30px;
			overflow: hidden;
			background: transparent;
			padding: 4px 7px;
			border-radius: 500px;
			transition:
				background-color 0.18s,
				box-shadow 0.18s,
				gap 0.18s cubic-bezier(0.2, 0, 0, 1);
		}

		.tab-icon {
			width: 16px;
			height: 16px;
			flex: 0 0 auto;
			fill: none;
			stroke: currentColor;
			stroke-linecap: round;
			stroke-linejoin: round;

			&.tab-icon-filled {
				fill: currentColor;
				stroke: none;
			}
		}

		.tab-label {
			display: block;
			width: 0;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			line-height: 1;
			opacity: 0;
			transition:
				width 0.18s cubic-bezier(0.2, 0, 0, 1),
				opacity 0.12s ease;
		}

		&.active {
			width: 120px;
			color: #d739e3;

			> span {
				gap: 5px;
				background: rgba(215, 57, 227, 0.2);
			}

			.tab-label {
				width: 80px;
				opacity: 1;
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
			width: auto;
			flex: 0 0 auto;
			align-items: center;
			justify-content: flex-start;
			margin-right: auto;
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

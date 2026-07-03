<template>
	<template v-if="action === 'popup'">
		<header :class="{ 'search-active': showSearch }">
			<a class="item logo" target="_blank" href="https://github.com/xlch88/YouTubeTweak">
				<img src="@/assets/img/logo.svg" alt="logo" />
				<span><small>YouTube</small>Tweak</span>
			</a>
			<button
				v-for="key in Object.keys(tabs)"
				:key="key"
				class="item"
				:class="{ active: tab === key }"
				@click="tabClick(key)"
				:aria-label="$t(`tabs.${key}.title`)"
			>
				<span>{{ $t(`tabs.${key}.title`) }}</span>
			</button>
			<button
				class="item search-toggle"
				:class="{ active: showSearch }"
				@click="toggleSearch"
				:aria-label="$t('common.search')"
				:title="$t('common.search')"
			>
				<span aria-hidden="true">{{ showSearch ? "✕" : "🔍" }}</span>
			</button>
		</header>

		<div v-if="showSearch" class="search-bar">
			<input
				ref="searchInput"
				type="search"
				v-model="searchQuery"
				:placeholder="$t('common.searchPlaceholder')"
				aria-controls="settings-content"
				autocomplete="off"
				spellcheck="false"
			/>
		</div>

		<main id="settings-content" :class="{ 'search-has-query': searchQuery.length > 0 }">
			<transition name="slide-fade" mode="out-in">
				<component :is="tabs[tab]" />
			</transition>
		</main>
	</template>
	<installed v-else-if="action === 'installed'"></installed>
</template>

<script setup lang="ts">
import useConfigStore from "./util/config";
import { ref, provide, defineAsyncComponent, nextTick, watch, computed } from "vue";
import Installed from "./pages/installed.vue";
import type { Component } from "vue";

const tabs: Record<string, Component> = {
	player: defineAsyncComponent(() => import("./pages/player.vue")),
	translate: defineAsyncComponent(() => import("./pages/translate.vue")),
	other: defineAsyncComponent(() => import("./pages/other.vue")),
	// insights: defineAsyncComponent(() => import("./pages/insights.vue")),
	general: defineAsyncComponent(() => import("./pages/general.vue")),
};

const tab = ref(localStorage.getItem("tab") || "player");
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

const showSearch = ref(false);
const searchQuery = ref("");
const searchInput = ref<HTMLInputElement | null>(null);

function toggleSearch() {
	showSearch.value = !showSearch.value;
	if (!showSearch.value) {
		searchQuery.value = "";
	} else {
		nextTick(() => {
			searchInput.value?.focus();
		});
	}
}

provide("searchQuery", computed(() => searchQuery.value.toLowerCase().trim()));

function applySearchFilter() {
	const query = searchQuery.value.toLowerCase().trim();
	const cards = document.querySelectorAll<HTMLElement>("#settings-content .card");
	for (const card of cards) {
		if (!query) {
			card.classList.remove("search-match");
			continue;
		}
		const text = card.textContent?.toLowerCase() || "";
		card.classList.toggle("search-match", text.includes(query));
	}
}

watch(searchQuery, (value) => {
	if (value && !showSearch.value) {
		showSearch.value = true;
		nextTick(() => {
			searchInput.value?.focus();
		});
	}
	nextTick(() => applySearchFilter());
});

watch(tab, () => {
	nextTick(() => applySearchFilter());
});

const searchObserver = new MutationObserver(() => applySearchFilter());

watch(showSearch, (val) => {
	if (val) {
		nextTick(() => {
			const main = document.getElementById("settings-content");
			if (main) {
				searchObserver.observe(main, { childList: true, subtree: true });
			}
		});
	} else {
		searchObserver.disconnect();
	}
});

document.addEventListener("keydown", (e) => {
	if ((e.ctrlKey || e.metaKey) && e.key === "f" && window === window.top) {
		const popupWindows = browser?.extension?.getViews?.({ type: "popup" });
		if (popupWindows?.includes(window)) {
			e.preventDefault();
			showSearch.value = true;
			nextTick(() => searchInput.value?.focus());
		}
	}
});
</script>

<style lang="scss">
main {
	margin-top: 40px;
	height: 100%;
	width: 100%;
	overflow-y: auto;
	overflow-x: hidden;

	.slide-fade-enter-active,
	.slide-fade-leave-active {
		transition:
			transform 0.1s cubic-bezier(1, 0.5, 0.8, 1),
			opacity 0.1s cubic-bezier(1, 0.5, 0.8, 1);
	}

	.slide-fade-enter-from,
	.slide-fade-leave-to {
		transform: translateY(-10px);
		opacity: 0;
	}

	.slide-fade-enter-to,
	.slide-fade-leave-from {
		transform: translateY(0);
		opacity: 1;
	}
}

.search-bar {
	position: fixed;
	z-index: 9998;
	top: 40px;
	width: 100%;
	padding: 6px 10px;
	background: #fff;
	border-bottom: 1px solid #eee;
	box-shadow: 0 2px 6px rgba(#000, 0.08);

	input {
		width: 100%;
		height: 28px;
		padding: 4px 8px;
		border: 1px solid #d0d5dd;
		border-radius: 6px;
		font-size: 13px;
		outline: none;
		transition: border-color 0.2s;

		&:focus {
			border-color: #409eff;
			box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
		}

		&::placeholder {
			color: #9ca3af;
		}
	}
}

.search-has-query {
	.card {
		&:not(.search-match) {
			display: none;
		}
	}
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

	&.search-active ~ main {
		margin-top: 80px;
	}

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
		flex: 1;

		&:is(button) > span {
			background: transparent;
			padding: 3px 6px;
			border-radius: 500px;
			transition: background 0.3s;
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
			flex: 0 0 auto;
			padding-right: 5px;

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

		&.search-toggle {
			flex: 0 0 32px;
			font-size: 14px;
			padding: 0;
		}
	}
}
</style>

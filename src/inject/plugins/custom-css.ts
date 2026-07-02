import config from "../config";
import type { Plugin } from "../types";

const CUSTOM_CSS_STYLE_ID = "yttweak-custom-css";

function getCustomCssStyle() {
	let style = document.getElementById(CUSTOM_CSS_STYLE_ID) as HTMLStyleElement | null;
	if (!style) {
		style = document.createElement("style");
		style.id = CUSTOM_CSS_STYLE_ID;
		(document.head || document.documentElement).appendChild(style);
	}

	return style;
}

function removeCustomCssStyle() {
	document.getElementById(CUSTOM_CSS_STYLE_ID)?.remove();
}

function applyCustomCss() {
	const css = config.get("other.customCss.value", "");
	if (!config.get("other.customCss.enable") || !css.trim()) {
		removeCustomCssStyle();
		return;
	}

	getCustomCssStyle().textContent = css;
}

export default {
	"other.customCss.enable": {
		setup() {
			applyCustomCss();
		},
		enable() {
			applyCustomCss();
		},
		disable() {
			removeCustomCssStyle();
		},
		configUpdate(oldConfig, newConfig) {
			if (oldConfig["other.customCss.value"] !== newConfig["other.customCss.value"]) {
				applyCustomCss();
			}

			return false;
		},
	},
} as Record<string, Plugin>;

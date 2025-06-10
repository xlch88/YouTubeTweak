import { defineConfig } from "wxt";
import vueDevTools from "vite-plugin-vue-devtools";
import sassGlobImports from "vite-plugin-sass-glob-import";
import pkg from "./package.json";
import fs from "node:fs";

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: "src",
	modules: ["@wxt-dev/module-vue", "@wxt-dev/auto-icons", "@wxt-dev/webextension-polyfill"],

	autoIcons: {
		baseIconPath: "assets/img/logo.svg",
		grayscaleOnDevelopment: false,
	},

	webExt: {
		keepProfileChanges: true,
		chromiumProfile: fs.realpathSync(".profile/chrome"),
		firefoxProfile: fs.realpathSync(".profile/firefox"),
		startUrls: ["https://www.youtube.com/watch?v=zczjerfFrSI"],
	},

	manifest: ({ browser, manifestVersion, mode, command }) => {
		return {
			manifest_version: 3,
			name: "__MSG_manifest_name__",
			description: "__MSG_manifest_description__",
			short_name: "YouTubeTweak",
			default_locale: "zh_CN",
			permissions: ["storage", "tabs"],
			host_permissions: ["*://*.youtube.com/*"],
		};
	},
	vite: (env) => ({
		define: {
			__APP_INFO__: JSON.stringify({
				build: new Date().toISOString(),
				version: pkg.version,
			}),
			__IS_DEV__: env.mode === "development",
		},
		plugins: [
			sassGlobImports(),
			...[
				env.mode !== "production"
					? vueDevTools({
							launchEditor: "idea",
							appendTo: "/src/entrypoints/popup/main.js",
						})
					: [],
			],
		],
	}),
});

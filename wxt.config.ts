import { defineConfig } from "wxt";
import vueDevTools from "vite-plugin-vue-devtools";
import sassGlobImports from "vite-plugin-sass-glob-import";
import pkg from "./package.json";
import fs from "node:fs";

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: "src",
	modules: ["@wxt-dev/module-vue", "@wxt-dev/auto-icons"],

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
			name: "__MSG_manifest_name__",
			description: "__MSG_manifest_description__",
			short_name: "YouTubeTweak",
			default_locale: "zh_CN",
			permissions: ["storage", "tabs"],
			host_permissions: ["*://*.youtube.com/*"],
			key: fs
				.readFileSync("src/assets/public.pem", "utf8")
				.trim()
				.split("\n")
				.slice(1, -1)
				.map((v) => v.trim())
				.join(""),
			browser_specific_settings: {
				gecko: {
					id: "youtubetweak@dark495.me",
					strict_min_version: "88.0",
				},
			},
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

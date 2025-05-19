import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import webExtension from "vite-plugin-web-extension";
import vueDevTools from "vite-plugin-vue-devtools";
import sassGlobImports from "vite-plugin-sass-glob-import";
import sharp from "sharp";
import fs from "node:fs";
import pkg from "./package.json";
import manifest from "./manifest.json";

["public/assets/img/logo", ".chrome-profile"].forEach((dirPath) => {
	if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	return {
		define: {
			__APP_INFO__: JSON.stringify({
				build: new Date().toISOString(),
				version: pkg.version,
			}),
		},
		build: {
			sourcemap: mode === 'production' ? false : "inline",
			minify: mode === 'production',
		},
		plugins: [
			sassGlobImports(),
			vueDevTools(),
			vue(),
			{
				name: "logo-to-png",
				buildStart() {
					const wait = [];
					for (const size of [16, 32, 48, 128]) {
						const outputFile = `public/assets/img/logo/${size}.png`;
						if (mode === "production" || !fs.existsSync(outputFile)) {
							wait.push(
								sharp("public/assets/img/logo.svg").resize(size, size).png({ compressionLevel: 9 }).toFile(outputFile),
							);
						}
					}
					return Promise.allSettled(wait);
				},
			},
			webExtension({
				manifest: () => ({
					version: pkg.version,
					description: pkg.description,
					...manifest,
				}),
				watchFilePaths: ["src/inject/**/*.*"],
				skipManifestValidation: true,
				webExtConfig: {
					chromiumProfile: fs.realpathSync(__dirname + "/.chrome-profile"),
					keepProfileChanges: true,
					startUrl: ["https://www.youtube.com/watch?v=ghWpp_iNkLg"],
				},
			}),
		],
	};
});

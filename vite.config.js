import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import webExtension from "vite-plugin-web-extension";
import vueDevTools from "vite-plugin-vue-devtools";
import sassGlobImports from "vite-plugin-sass-glob-import";
import sharp from "sharp";
import fs from "node:fs";
import pkg from "./package.json";
import manifest from "./manifest.json";
import i18nChecker from "./vite-plugin-i18n-checker.js";
import child_process from "node:child_process";

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
			sourcemap: mode === "production" ? false : "inline",
			minify: mode === "production",
			emptyOutDir: true,
			outDir: mode === "production" ? "dist" : "dist_dev",
		},
		plugins: [
			sassGlobImports(),
			...[mode !== "production" ? vueDevTools() : []],
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
			{
				name: "manifest-i18n",
				buildStart() {
					for (const file of fs.readdirSync("src/assets/i18n").filter((file) => file.endsWith(".json"))) {
						const name = file.replace(/\.json$/, "");
						const dir = `./public/_locales/${name.replace("-", "_")}`;
						const localeData = JSON.parse(fs.readFileSync(`src/assets/i18n/${file}`, "utf-8"));

						const messagesJsonFile = `${dir}/messages.json`;

						if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
						if (mode === "production" || !fs.existsSync(messagesJsonFile)) {
							fs.writeFileSync(
								messagesJsonFile,
								JSON.stringify(
									{
										manifest_name: {
											message: localeData.manifest.name,
										},
										manifest_description: {
											message: localeData.manifest.description,
										},
									},
									null,
									2,
								),
							);
						}
					}
				},
			},
			i18nChecker(),
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
					startUrl: ["https://www.youtube.com/watch?v=zczjerfFrSI"],
					// args: ["--mute-audio"],
				},
			}),
			{
				name: "auto-zip",
				closeBundle() {
					if (mode === "production") {
						fs.existsSync("./dist.zip") && fs.unlinkSync("./dist.zip");
						child_process.execSync("7z a -tzip ./dist.zip ./dist/*");
					}
				},
			},
		],
	};
});

import { defineWxtModule } from "wxt/modules";
import fs from "fs";

export default defineWxtModule({
	setup(wxt) {
		wxt.hooks.hook("build:before", () => {
			// fs.rmSync("./public/_locales", { recursive: true, force: true });

			for (const file of fs.readdirSync("src/assets/i18n").filter((file) => file.endsWith(".json"))) {
				console.log(`Generating locale file: ${file}`);
				let name = file.replace(/\.json$/, "").replace("-", "_");

				if (!["pt_BR", "pt_PT", "zh_CN", "zh_TW"].includes(name)) {
					name = name.split("_")[0];
				}

				const dir = `./public/_locales/${name}`;
				const localeData = JSON.parse(fs.readFileSync(`src/assets/i18n/${file}`, "utf-8"));

				const messagesJsonFile = `${dir}/messages.json`;
				const extName =
					wxt.config.browser === "edge" ? localeData.manifest.name_edge || localeData.manifest.name : localeData.manifest.name;
				const messagesContent = JSON.stringify(
					{
						manifest_name: {
							message: extName,
						},
						manifest_description: {
							message: localeData.manifest.description,
						},
					},
					null,
					2,
				);

				if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
				fs.writeFileSync(messagesJsonFile, messagesContent);
			}

			const dir = `./public/_locales/en`;
			const dir2 = `./public/_locales/en_US`;
			if (!fs.existsSync(dir2)) fs.mkdirSync(dir2, { recursive: true });
			fs.copyFileSync(`${dir}/messages.json`, `${dir2}/messages.json`);
		});
	},
});

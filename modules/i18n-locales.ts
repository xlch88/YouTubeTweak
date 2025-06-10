import { defineWxtModule } from "wxt/modules";
import fs from "fs";

export default defineWxtModule({
	setup(wxt) {
		wxt.hooks.hook("build:before", () => {
			fs.rmSync("./public/_locales", { recursive: true, force: true });

			for (const file of fs.readdirSync("src/assets/i18n").filter((file) => file.endsWith(".json"))) {
				let name = file.replace(/\.json$/, "").replace("-", "_");

				if (!["pt_BR", "pt_PT", "zh_CN", "zh_TW"].includes(name)) {
					name = name.split("_")[0];
				}

				const dir = `./public/_locales/${name}`;
				const localeData = JSON.parse(fs.readFileSync(`src/assets/i18n/${file}`, "utf-8"));

				const messagesJsonFile = `${dir}/messages.json`;
				const messagesContent = JSON.stringify(
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
				);

				if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
				fs.writeFileSync(messagesJsonFile, messagesContent);
			}
		});
	},
});

/*
 *  ────────────────────────────────────────────────────────────────────────────
 *  Heads-up, fellow masochist:
 *
 *  1.  Google nuked the --load-extension flag in **Chrome 137+ (branded builds)**,
 *      see: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/aEHdhDZ-V0E/m/UWP4-k32AgAJ
 *
 *  2.  That single move breaks web-ext’s hot-reload helper
 *      (a.k.a. “reload-manager-extension”), because Chrome now ignores
 *      the CLI hook it relies on.
 *
 *  3.  Work-around here: stuff reload-manager-extension into a **fixed path**
 *      inside this repo instead of the random OS temp dir, and patch
 *      Chromium’s runner to read that path.
 *
 *  4.  Manual steps still required (no way around it):
 *         • Visit chrome://extensions/
 *         • Toggle **Developer mode** ON
 *         • Click **Load unpacked** and point to **both** of these folders:
 *              - <project_root>/dist_dev
 *              - <project_root>/.reload-manager-extension
 *
 *  5.  Welcome to 2025, where Google decides what flags you’re allowed to use.
 *     Deal with it or switch to unbranded Chromium.
 *  ────────────────────────────────────────────────────────────────────────────
 */

import path from "path";
import fs from "fs";

export function patchWebExt() {
	const target = path.join(__dirname, "node_modules/web-ext-run/lib/extension-runners/chromium.js");
	const patchLine = "const extPath = process.cwd() + '/.reload-manager-extension'";
	if (fs.existsSync(target)) {
		let code = fs.readFileSync(target, "utf8");
		if (!code.includes(patchLine)) {
			code = code.replace(/const\s+extPath\s*=\s*(.*?)/, patchLine + " || $1");

			fs.writeFileSync(target, code);
			console.log("✅ chromium.js patched ! please try again.", patchLine, code.includes(patchLine));
			process.exit(0);
		}
	} else {
		console.error("❌ cannot find chromium.js, try -> npm i");
		process.exit(0);
	}
}

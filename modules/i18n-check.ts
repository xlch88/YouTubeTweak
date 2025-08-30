import fs from "fs";
import path from "path";
import { defineWxtModule } from "wxt/modules";

interface LangContent {
	[key: string]: string | number | string[] | LangContent;
}

const i18nDir = fs.realpathSync("./src/assets/i18n");
const placeholder = "__NEED_TRANSLATE__";

function clearPlaceholders(obj: LangContent) {
	for (const k in obj) {
		if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
		const v = obj[k];

		if ((typeof v === "string" && v.startsWith(placeholder)) || v === "") {
			delete obj[k];
			continue;
		}

		if (v && typeof v === "object") {
			if (Array.isArray(v)) {
				for (const kk of v) {
					if (kk.startsWith(placeholder)) {
						v.splice(v.indexOf(kk), 1);
					}
				}
			} else {
				clearPlaceholders(v);
				if (Object.keys(v).length === 0) delete obj[k];
			}
		}
	}
}

function flattenKeys(obj: LangContent, prefix = "") {
	const keys: Record<string, boolean> = {};
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const fullKey = prefix ? `${prefix}.${key}` : key;
			if (typeof obj[key] === "object" && obj[key] !== null) {
				Object.assign(keys, flattenKeys(<LangContent>obj[key], fullKey));
			} else if (typeof obj[key] !== "string" || !obj[key].startsWith(placeholder)) {
				keys[fullKey] = true;
			}
		}
	}
	return keys;
}

function setDeep(obj: LangContent, pathStr: string, value: string | number, isArray = false) {
	const parts = pathStr.split(".");
	let current = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		if (!current[part] || typeof current[part] !== "object") {
			if (i === parts.length - 2 && isArray) {
				current[part] = [];
			} else {
				current[part] = {};
			}
		}
		current = <LangContent>current[part];
	}
	current[parts[parts.length - 1]] = value;
}

function getDeep(obj: LangContent, pathStr: string) {
	const parts = pathStr.split(".");
	let current = obj;
	for (const part of parts) {
		if (current && typeof current === "object" && part in current) {
			current = <LangContent>current[part];
		} else {
			return null; // Path not found
		}
	}
	return current;
}

function getDeepParentType(obj: LangContent, pathStr: string) {
	const parts = pathStr.split(".").slice(0, -1);
	let current = obj;
	for (const part of parts) {
		if (current && typeof current === "object" && part in current) {
			current = <LangContent>current[part];
		} else {
			return null; // Path not found
		}
	}
	return Array.isArray(current) ? "array" : typeof current;
}

const baseLang = "zh-CN.json";
const baseContent = JSON.parse(fs.readFileSync(path.join(i18nDir, baseLang), "utf8"));
function reorderByBase(target: LangContent, base: LangContent) {
	// 数组直接返回，不改顺序
	if (Array.isArray(base)) return target;

	if (base && typeof base === "object") {
		const ordered: LangContent = {};
		for (const k of Object.keys(base)) {
			if (Object.prototype.hasOwnProperty.call(target, k)) {
				ordered[k] = reorderByBase(<LangContent>target[k], <LangContent>base[k]);
			} else {
				ordered[k] = base[k] && typeof base[k] === "object" && !Array.isArray(base[k]) ? reorderByBase({}, base[k]) : target[k];
			}
		}
		for (const k of Object.keys(target)) {
			if (!(k in ordered)) ordered[k] = target[k]; // 额外 key
		}
		return ordered;
	}
	return target;
}

function fillMissingTranslations(dir = i18nDir) {
	const filenames = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
	const allKeysSet: Set<string> = new Set();
	const fileData: Record<string, LangContent> = {};

	for (const filename of filenames) {
		const fullPath = path.join(dir, filename);
		const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));
		clearPlaceholders(content);
		fileData[filename] = content;

		const keys = flattenKeys(content);
		for (const key in keys) {
			allKeysSet.add(key);
		}
	}

	let result: Record<string, string[]> = {};
	for (const filename of filenames) {
		const content = fileData[filename];
		const existingKeys = flattenKeys(content);

		for (const key of allKeysSet) {
			if (!existingKeys[key]) {
				let _placeholder = getDeep(baseContent, key) || "";
				if (typeof _placeholder === "string" && !_placeholder.startsWith(placeholder)) {
					_placeholder = placeholder + ": " + _placeholder;
				} else {
					_placeholder = placeholder;
				}

				result[filename] ??= [];
				result[filename].push(key);
				setDeep(content, key, _placeholder, getDeepParentType(baseContent, key) === "array");
			}
		}

		const fullPath = path.join(dir, filename);
		const finalContent = filename !== baseLang ? reorderByBase(content, baseContent) : content;
		fs.writeFileSync(fullPath, JSON.stringify(finalContent, null, "\t") + "\n" + "\n", "utf8");
	}

	if (Object.values(result).length > 0) {
		console.error("Missing keys:", result);
		if (result["en-US.json"]) {
			console.error("!!! en-US.json Must not have missing translations.");
			process.exit(1);
		}
	}
}

export default defineWxtModule({
	setup(wxt) {
		wxt.hooks.hook("build:before", () => {
			fillMissingTranslations();
		});
	},
});

import fs from "fs";
import path from "path";

const i18nDir = path.join(__dirname, "src/assets/i18n");
const placeholder = "__NEED_TRANSLATE__";

function flattenKeys(obj, prefix = "") {
	const keys = {};
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const fullKey = prefix ? `${prefix}.${key}` : key;
			if (typeof obj[key] === "object" && obj[key] !== null) {
				Object.assign(keys, flattenKeys(obj[key], fullKey));
			} else if (obj[key] !== placeholder) {
				keys[fullKey] = true;
			}
		}
	}
	return keys;
}

function setDeep(obj, pathStr, value) {
	const parts = pathStr.split(".");
	let current = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		if (!current[part] || typeof current[part] !== "object") {
			current[part] = {};
		}
		current = current[part];
	}
	current[parts[parts.length - 1]] = value;
}

function fillMissingTranslations(dir = i18nDir) {
	const filenames = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
	const allKeysSet = new Set();
	const fileData = {};

	for (const filename of filenames) {
		const fullPath = path.join(dir, filename);
		const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));
		fileData[filename] = content;

		const keys = flattenKeys(content);
		for (const key in keys) {
			allKeysSet.add(key);
		}
	}

	let result = {};
	for (const filename of filenames) {
		const content = fileData[filename];
		const existingKeys = flattenKeys(content);
		let needWriteFile = false;

		for (const key of allKeysSet) {
			if (!existingKeys[key]) {
				result[filename] ??= [];
				result[filename].push(key);
				setDeep(content, key, placeholder);
				needWriteFile = true;
			}
		}

		if (needWriteFile) {
			const fullPath = path.join(dir, filename);
			fs.writeFileSync(fullPath, JSON.stringify(content, null, "\t"), "utf8");
		}
	}

	if (Object.values(result).length > 0) {
		console.error("Missing keys:", result);
		const err = new Error(
			`i18n-checker: Missing translations found and filled with placeholder "${placeholder}". Please translate them before deploying.`,
		);
		err.stack = err.message;
		throw err;
	}
}

export default function i18nChecker() {
	return {
		name: "i18n-checker",
		buildStart() {
			fillMissingTranslations();
		},
	};
}

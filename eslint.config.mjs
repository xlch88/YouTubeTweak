import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

export default tseslint.config(
	{
		ignores: ["dist/", ".wxt/", ".output/", "*.js", "*.mjs", "*.cjs"],
	},
	...tseslint.configs.recommendedTypeChecked.map((config) => ({
		...config,
		files: ["src/**/*.ts"],
	})),
	...tseslint.configs.stylisticTypeChecked.map((config) => ({
		...config,
		files: ["src/**/*.ts"],
	})),
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				project: true,
			},
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/restrict-template-expressions": "warn",
			"@typescript-eslint/no-floating-promises": "warn",
			"@typescript-eslint/no-misused-promises": "warn",
			"@typescript-eslint/prefer-nullish-coalescing": "warn",
			"@typescript-eslint/prefer-optional-chain": "warn",
			"@typescript-eslint/consistent-type-definitions": "off",
			"@typescript-eslint/array-type": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-empty-interface": "off",
			"@typescript-eslint/ban-ts-comment": ["warn", { "ts-ignore": "allow-with-description" }],
			"no-debugger": "error",
			"prefer-const": "warn",
		},
	},
	{
		files: ["src/**/*.vue"],
		languageOptions: {
			parser: vueParser,
			parserOptions: {
				parser: tseslint.parser,
				ecmaVersion: "latest",
				sourceType: "module",
			},
		},
		plugins: {
			vue: pluginVue,
		},
		processor: pluginVue.processors[".vue"],
		rules: {
			"no-debugger": "error",
			"prefer-const": "warn",
		},
	},
	eslintConfigPrettier,
);

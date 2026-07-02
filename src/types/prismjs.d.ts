declare module "prismjs/components/prism-core" {
	const Prism: {
		languages: Record<string, unknown>;
		highlight(code: string, grammar: unknown, language: string): string;
	};

	export default Prism;
}

declare module "prismjs/components/prism-css";

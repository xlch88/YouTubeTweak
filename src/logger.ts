declare global {
	const __IS_DEV__: boolean;
}

export const isDEV = __IS_DEV__;

const colorMap = {
	log: "#3498db",
	info: "#2ecc71",
	warn: "#f39c12",
	error: "#e74c3c",
	debug: "#9b59b6",
	verbose: "#95a5a6",
};

/**
 * @property {Function} log
 * @property {Function} warn
 * @property {Function} debug
 * @property {Function} info
 * @property {Function} error
 */
export function createLogger(name = "main") {
	const logger: Record<keyof typeof colorMap, (...args: any[]) => void> = {} as any;
	Object.entries(colorMap).forEach(([type, bg]) => {
		logger[type as keyof typeof colorMap] = (
			console[isDEV || ["info", "log", "debug"].includes(type) ? (type as keyof typeof console) : "log"] as (...args: any[]) => void
		).bind(
			console,
			`%cYTTweak%c${name}`,
			`font-family: sans-serif; background: ${bg}; color: white; border-radius: 4px 0 0 4px; padding: 2px 6px; font-weight: bold; font-size: 10px; line-height: 10px;`,
			`font-family: sans-serif; background: #e9e9e9; color: black; border-radius: 0 4px 4px 0; padding: 2px 6px; font-weight: bold; font-size: 10px; line-height: 10px;`,
		);
	});

	return logger;
}
export default createLogger();

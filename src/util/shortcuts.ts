export type ShortcutAction =
	| "speed.up"
	| "speed.down"
	| "speed.toggle"
	| "speed.set"
	| "speed.hold"
	| "playback.togglePlay"
	| "playback.seekForward"
	| "playback.seekBackward"
	| "playback.frameNext"
	| "playback.framePrev"
	| "playback.restart"
	| "playback.toggleLoop"
	| "playback.jumpToLive"
	| "playback.prevVideo"
	| "playback.nextVideo"
	| "audio.toggleMute"
	| "audio.volumeUp"
	| "audio.volumeDown"
	| "audio.setVolume"
	| "audio.boosterToggle"
	| "audio.boosterUp"
	| "audio.boosterDown"
	| "view.toggleInPageFullscreen"
	| "view.toggleFullscreen"
	| "view.toggleTheater"
	| "view.togglePip"
	| "view.toggleMiniPlayer"
	| "view.rotateCW"
	| "view.rotateCCW"
	| "view.toggleMirror"
	| "view.zoomIn"
	| "view.zoomOut"
	| "view.zoomReset"
	| "view.resetTransform"
	| "view.screenshot"
	| "view.toggleControls"
	| "subtitle.toggle"
	| "subtitle.cycleTrack"
	| "quality.set"
	| "quality.up"
	| "quality.down"
	| "page.copyUrl"
	| "page.copyUrlWithTime"
	| "page.toggleComments"
	| "page.openThumbnail";

export type ShortcutGroupId = "speed" | "playback" | "audio" | "view" | "subtitleQuality" | "page";

export type ShortcutParamSpec =
	| { kind: "speedStep"; defaultValue: number | "buttons"; min: number; max: number; step: number; presets: number[] }
	| { kind: "speed"; defaultValue: number; min: number; max: number; step: number; presets: number[] }
	| { kind: "seconds"; defaultValue: number; min: number; max: number; step: number; presets: number[] }
	| { kind: "volume"; defaultValue: number; min: number; max: number; step: number; presets: number[] }
	| { kind: "quality"; defaultValue: ShortcutQualityValue };

export type ShortcutQualityValue =
	| "auto"
	| "highres"
	| "hd2160"
	| "hd1440"
	| "hd1080"
	| "hd720"
	| "large"
	| "medium"
	| "small"
	| "tiny";

export type ShortcutActionDefinition = {
	id: ShortcutAction;
	group: ShortcutGroupId;
	param?: ShortcutParamSpec;
};

export type KeyboardShortcutItem = {
	id: string;
	enabled: boolean;
	key: string;
	action: ShortcutAction;
	value?: number | string;
};

export type ShortcutPreset = {
	id: "speedControl" | "viewTools" | "playbackLoop";
	items: Array<Omit<KeyboardShortcutItem, "id" | "enabled">>;
};

export const SHORTCUT_QUALITY_OPTIONS: Array<{ value: ShortcutQualityValue; label: string }> = [
	{ value: "auto", label: "Auto" },
	{ value: "highres", label: "8K (4320p)" },
	{ value: "hd2160", label: "4K (2160p)" },
	{ value: "hd1440", label: "1440p" },
	{ value: "hd1080", label: "1080p" },
	{ value: "hd720", label: "720p" },
	{ value: "large", label: "480p" },
	{ value: "medium", label: "360p" },
	{ value: "small", label: "240p" },
	{ value: "tiny", label: "144p" },
];

const VALID_QUALITY_VALUES = new Set<string>(SHORTCUT_QUALITY_OPTIONS.map((option) => option.value));

const SPEED_STEP_PARAM: ShortcutParamSpec = {
	kind: "speedStep",
	defaultValue: 0.25,
	min: 0.05,
	max: 5,
	step: 0.05,
	presets: [0.1, 0.25, 0.5, 1],
};

const SEEK_SECONDS_PARAM: ShortcutParamSpec = {
	kind: "seconds",
	defaultValue: 5,
	min: 1,
	max: 3600,
	step: 1,
	presets: [5, 15, 30, 85],
};

const VOLUME_STEP_PARAM: ShortcutParamSpec = {
	kind: "volume",
	defaultValue: 5,
	min: 1,
	max: 100,
	step: 1,
	presets: [2, 5, 10, 20],
};

export const SHORTCUT_ACTION_DEFINITIONS: ShortcutActionDefinition[] = [
	{ id: "speed.up", group: "speed", param: SPEED_STEP_PARAM },
	{ id: "speed.down", group: "speed", param: SPEED_STEP_PARAM },
	{ id: "speed.toggle", group: "speed", param: { kind: "speed", defaultValue: 2, min: 0.1, max: 16, step: 0.25, presets: [1, 1.5, 2, 3] } },
	{ id: "speed.set", group: "speed", param: { kind: "speed", defaultValue: 1, min: 0.1, max: 16, step: 0.25, presets: [1, 1.5, 2, 3] } },
	{ id: "speed.hold", group: "speed", param: { kind: "speed", defaultValue: 2, min: 0.1, max: 16, step: 0.25, presets: [1.5, 2, 2.5, 3] } },

	{ id: "playback.togglePlay", group: "playback" },
	{ id: "playback.seekForward", group: "playback", param: SEEK_SECONDS_PARAM },
	{ id: "playback.seekBackward", group: "playback", param: SEEK_SECONDS_PARAM },
	{ id: "playback.frameNext", group: "playback" },
	{ id: "playback.framePrev", group: "playback" },
	{ id: "playback.restart", group: "playback" },
	{ id: "playback.toggleLoop", group: "playback" },
	{ id: "playback.jumpToLive", group: "playback" },
	{ id: "playback.prevVideo", group: "playback" },
	{ id: "playback.nextVideo", group: "playback" },

	{ id: "audio.toggleMute", group: "audio" },
	{ id: "audio.volumeUp", group: "audio", param: VOLUME_STEP_PARAM },
	{ id: "audio.volumeDown", group: "audio", param: VOLUME_STEP_PARAM },
	{ id: "audio.setVolume", group: "audio", param: { kind: "volume", defaultValue: 100, min: 0, max: 100, step: 5, presets: [25, 50, 75, 100] } },
	{ id: "audio.boosterToggle", group: "audio" },
	{ id: "audio.boosterUp", group: "audio" },
	{ id: "audio.boosterDown", group: "audio" },

	{ id: "view.toggleInPageFullscreen", group: "view" },
	{ id: "view.toggleFullscreen", group: "view" },
	{ id: "view.toggleTheater", group: "view" },
	{ id: "view.togglePip", group: "view" },
	{ id: "view.toggleMiniPlayer", group: "view" },
	{ id: "view.rotateCW", group: "view" },
	{ id: "view.rotateCCW", group: "view" },
	{ id: "view.toggleMirror", group: "view" },
	{ id: "view.zoomIn", group: "view" },
	{ id: "view.zoomOut", group: "view" },
	{ id: "view.zoomReset", group: "view" },
	{ id: "view.resetTransform", group: "view" },
	{ id: "view.screenshot", group: "view" },
	{ id: "view.toggleControls", group: "view" },

	{ id: "subtitle.toggle", group: "subtitleQuality" },
	{ id: "subtitle.cycleTrack", group: "subtitleQuality" },
	{ id: "quality.set", group: "subtitleQuality", param: { kind: "quality", defaultValue: "hd1080" } },
	{ id: "quality.up", group: "subtitleQuality" },
	{ id: "quality.down", group: "subtitleQuality" },

	{ id: "page.copyUrlWithTime", group: "page" },
	{ id: "page.copyUrl", group: "page" },
	{ id: "page.toggleComments", group: "page" },
	{ id: "page.openThumbnail", group: "page" },
];

export const SHORTCUT_GROUP_ORDER: ShortcutGroupId[] = ["speed", "playback", "audio", "view", "subtitleQuality", "page"];

export const SHORTCUT_ACTION_MAP: Record<ShortcutAction, ShortcutActionDefinition> = Object.fromEntries(
	SHORTCUT_ACTION_DEFINITIONS.map((def) => [def.id, def]),
) as Record<ShortcutAction, ShortcutActionDefinition>;

export const SHORTCUT_PRESETS: ShortcutPreset[] = [
	{
		id: "speedControl",
		items: [
			{ key: "KeyD", action: "speed.up", value: 0.25 },
			{ key: "KeyS", action: "speed.down", value: 0.25 },
			{ key: "KeyR", action: "speed.toggle", value: 1 },
			{ key: "KeyA", action: "speed.toggle", value: 2 },
		],
	},
	{
		id: "viewTools",
		items: [
			{ key: "KeyW", action: "view.toggleInPageFullscreen" },
			{ key: "KeyP", action: "view.togglePip" },
			{ key: "Shift+KeyS", action: "view.screenshot" },
			{ key: "Shift+KeyM", action: "view.toggleMirror" },
		],
	},
	{
		id: "playbackLoop",
		items: [
			{ key: "BracketLeft", action: "playback.seekBackward", value: 5 },
			{ key: "BracketRight", action: "playback.seekForward", value: 85 },
			{ key: "Shift+KeyL", action: "playback.toggleLoop" },
		],
	},
];

// Common single-key / Shift-key bindings already occupied by YouTube's built-in player.
export const YOUTUBE_NATIVE_SHORTCUTS: Record<string, string> = {
	Space: "togglePlay",
	KeyK: "togglePlay",
	KeyJ: "seekBackward10",
	KeyL: "seekForward10",
	KeyM: "mute",
	KeyF: "fullscreen",
	KeyT: "theater",
	KeyI: "miniPlayer",
	KeyC: "subtitles",
	ArrowLeft: "seekBackward5",
	ArrowRight: "seekForward5",
	ArrowUp: "volumeUp",
	ArrowDown: "volumeDown",
	Comma: "framePrev",
	Period: "frameNext",
	"Shift+Comma": "speedDown",
	"Shift+Period": "speedUp",
	"Shift+KeyN": "nextVideo",
	"Shift+KeyP": "prevVideo",
	Slash: "search",
	Home: "seekStart",
	End: "seekEnd",
};

const MODIFIER_CODES = new Set([
	"ControlLeft",
	"ControlRight",
	"ShiftLeft",
	"ShiftRight",
	"AltLeft",
	"AltRight",
	"MetaLeft",
	"MetaRight",
	"OSLeft",
	"OSRight",
]);

const MODIFIER_ORDER = ["Ctrl", "Alt", "Shift", "Meta"] as const;

const CODE_DISPLAY_LABELS: Record<string, string> = {
	Space: "Space",
	ArrowUp: "↑",
	ArrowDown: "↓",
	ArrowLeft: "←",
	ArrowRight: "→",
	BracketLeft: "[",
	BracketRight: "]",
	Backslash: "\\",
	Semicolon: ";",
	Quote: "'",
	Comma: ",",
	Period: ".",
	Slash: "/",
	Minus: "-",
	Equal: "=",
	Backquote: "`",
	Enter: "Enter",
	Tab: "Tab",
	Backspace: "Backspace",
	Delete: "Del",
	Insert: "Ins",
	Home: "Home",
	End: "End",
	PageUp: "PgUp",
	PageDown: "PgDn",
	NumpadAdd: "Num +",
	NumpadSubtract: "Num -",
	NumpadMultiply: "Num *",
	NumpadDivide: "Num /",
	NumpadDecimal: "Num .",
	NumpadEnter: "Num Enter",
};

export function normalizeShortcutKey(rawKey: unknown): string {
	if (typeof rawKey !== "string") return "";
	const parts = rawKey
		.split("+")
		.map((part) => part.trim())
		.filter(Boolean);
	if (!parts.length) return "";

	const modifiers = new Set<string>();
	let mainCode = "";
	for (const part of parts) {
		if (part === "Ctrl" || part === "Control") modifiers.add("Ctrl");
		else if (part === "Alt") modifiers.add("Alt");
		else if (part === "Shift") modifiers.add("Shift");
		else if (part === "Meta" || part === "Cmd") modifiers.add("Meta");
		else mainCode = part;
	}

	if (!mainCode || MODIFIER_CODES.has(mainCode) || mainCode === "Escape") return "";
	return [...MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier)), mainCode].join("+");
}

export function captureShortcutFromEvent(event: KeyboardEvent): string | null {
	if (!event.code || MODIFIER_CODES.has(event.code)) return null;
	if (event.code === "Escape" && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) return null;

	const parts: string[] = [];
	if (event.ctrlKey) parts.push("Ctrl");
	if (event.altKey) parts.push("Alt");
	if (event.shiftKey) parts.push("Shift");
	if (event.metaKey) parts.push("Meta");
	parts.push(event.code);
	return parts.join("+");
}

export function formatShortcutCode(code: string): string {
	if (CODE_DISPLAY_LABELS[code]) return CODE_DISPLAY_LABELS[code];
	if (/^Key[A-Z]$/.test(code)) return code.slice(3);
	if (/^Digit[0-9]$/.test(code)) return code.slice(5);
	if (/^Numpad[0-9]$/.test(code)) return `Num ${code.slice(6)}`;
	return code;
}

export function formatShortcutParts(key: string): string[] {
	const normalized = normalizeShortcutKey(key);
	if (!normalized) return [];
	return normalized.split("+").map((part) => {
		if (part === "Ctrl" || part === "Alt" || part === "Shift" || part === "Meta") return part;
		return formatShortcutCode(part);
	});
}

export function getDefaultShortcutValue(action: ShortcutAction): number | string | undefined {
	return SHORTCUT_ACTION_MAP[action]?.param?.defaultValue;
}

export function normalizeShortcutValue(action: ShortcutAction, rawValue: unknown): number | string | undefined {
	const param = SHORTCUT_ACTION_MAP[action]?.param;
	if (!param) return undefined;

	if (param.kind === "quality") {
		return typeof rawValue === "string" && VALID_QUALITY_VALUES.has(rawValue) ? rawValue : param.defaultValue;
	}
	if (param.kind === "speedStep" && rawValue === "buttons") {
		return "buttons";
	}

	const numeric = Number(rawValue);
	if (!Number.isFinite(numeric)) return param.defaultValue;
	const clamped = Math.min(Math.max(numeric, param.min), param.max);
	return param.kind === "seconds" || param.kind === "volume" ? Math.round(clamped) : Number(clamped.toFixed(4));
}

export function isValidShortcutAction(value: unknown): value is ShortcutAction {
	return typeof value === "string" && Object.hasOwn(SHORTCUT_ACTION_MAP, value);
}

export function createShortcutId() {
	return `sc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function normalizeShortcutItems(raw: unknown): KeyboardShortcutItem[] {
	if (!Array.isArray(raw)) return [];

	const seenIds = new Set<string>();
	const items: KeyboardShortcutItem[] = [];

	for (const entry of raw) {
		if (!entry || typeof entry !== "object") continue;
		const candidate = entry as Record<string, unknown>;
		if (!isValidShortcutAction(candidate.action)) continue;

		const key = normalizeShortcutKey(candidate.key);
		if (!key) continue;

		let id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : createShortcutId();
		while (seenIds.has(id)) id = createShortcutId();
		seenIds.add(id);

		const value = normalizeShortcutValue(candidate.action, candidate.value);
		items.push({
			id,
			enabled: candidate.enabled !== false,
			key,
			action: candidate.action,
			...(value !== undefined ? { value } : {}),
		});
	}

	return items;
}

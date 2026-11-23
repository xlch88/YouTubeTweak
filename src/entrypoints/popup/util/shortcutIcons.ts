import type { ShortcutAction } from "@/util/shortcuts";

// Unified 16x16 stroke icon paths (stroke-width 1.45, round caps & joins).
export const SHORTCUT_ACTION_ICONS: Record<ShortcutAction, string> = {
	"speed.up": "M3 4.5 7.5 8 3 11.5M8.5 4.5 13 8l-4.5 3.5",
	"speed.down": "M13 4.5 8.5 8l4.5 3.5M7.5 4.5 3 8l4.5 3.5",
	"speed.toggle": "M3 5.5h10M10.5 3 13 5.5 10.5 8M13 10.5H3M5.5 8 3 10.5 5.5 13",
	"speed.set": "M2.8 11.5a5.5 5.5 0 1 1 10.4 0M8 10.5l2.8-3.4M8 10.5a.4.4 0 1 0 0 .01",
	"speed.hold": "M9.2 2 4 9h4l-1.2 5L12 7H8l1.2-5Z",

	"playback.togglePlay": "M3.5 4v8l5.5-4-5.5-4ZM11.5 4v8",
	"playback.seekForward": "M12.6 8.2A4.8 4.8 0 1 1 10.8 4.2M11.3 2.4v2.5H8.8",
	"playback.seekBackward": "M3.4 8.2a4.8 4.8 0 1 0 1.8-4M4.7 2.4v2.5h2.5",
	"playback.frameNext": "M4 4.5v7M7.2 4.5 12.2 8l-5 3.5v-7Z",
	"playback.framePrev": "M12 4.5v7M8.8 4.5 3.8 8l5 3.5v-7Z",
	"playback.restart": "M3.5 4v8M12.5 8H6.2M8.8 5.2 6 8l2.8 2.8",
	"playback.toggleLoop": "M12 5H5.5A2.5 2.5 0 0 0 3 7.5v.5M10 3l2 2-2 2M4 11h6.5A2.5 2.5 0 0 0 13 8.5V8M6 13l-2-2 2-2",
	"playback.jumpToLive":
		"M8 8a.4.4 0 1 0 0 .01M5.5 5.5a3.5 3.5 0 0 0 0 5M10.5 5.5a3.5 3.5 0 0 1 0 5M3.5 3.6a6.2 6.2 0 0 0 0 8.8M12.5 3.6a6.2 6.2 0 0 1 0 8.8",
	"playback.prevVideo": "M4 4v8M12 4.5 6.5 8 12 11.5v-7Z",
	"playback.nextVideo": "M12 4v8M4 4.5 9.5 8 4 11.5v-7Z",

	"audio.toggleMute": "M2.6 6.2h2.2L8 3.6v8.8L4.8 9.8H2.6V6.2ZM10.6 6.2l3 3.6M13.6 6.2l-3 3.6",
	"audio.volumeUp": "M2.5 6.2h2.2L7.8 3.6v8.8L4.7 9.8H2.5V6.2ZM10.3 8h3.4M12 6.3v3.4",
	"audio.volumeDown": "M2.5 6.2h2.2L7.8 3.6v8.8L4.7 9.8H2.5V6.2ZM10.3 8h3.4",
	"audio.setVolume": "M2.5 6.2h2.2L7.8 3.6v8.8L4.7 9.8H2.5V6.2ZM10.2 6.2a2.5 2.5 0 0 1 0 3.6M12 4.5a4.8 4.8 0 0 1 0 7",
	"audio.boosterToggle": "M3 9.5v2.5M6.3 6.5v5.5M9.6 4v8M13 7.2v4.8",
	"audio.boosterUp": "M3 9.5v2.5M6 7v5M9 5v7M12.5 11.5V4.5M10.8 6.2 12.5 4.5l1.7 1.7",
	"audio.boosterDown": "M3 9.5v2.5M6 7v5M9 5v7M12.5 4.5v7M10.8 9.8 12.5 11.5l1.7-1.7",

	"view.toggleInPageFullscreen":
		"M2.5 3.5h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1ZM2.5 6h11",
	"view.toggleFullscreen": "M2.5 6V3.5H5M11 3.5h2.5V6M13.5 10v2.5H11M5 12.5H2.5V10",
	"view.toggleTheater": "M2 4.8h12a1 1 0 0 1 1 1v4.4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5.8a1 1 0 0 1 1-1Z",
	"view.togglePip":
		"M2.5 3.5h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1ZM8.5 7.8h4v2.7h-4V7.8Z",
	"view.toggleMiniPlayer":
		"M2.5 3.5h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1ZM4.6 5.6 7.4 8.4M7.4 6v2.4H5",
	"view.rotateCW": "M12.6 8.2A4.6 4.6 0 1 1 10.7 4.3M11.4 2.5v2.6H8.8",
	"view.rotateCCW": "M3.4 8.2a4.6 4.6 0 1 0 1.9-3.9M4.6 2.5v2.6h2.6",
	"view.toggleMirror": "M8 2.5v11M5.8 5.2 2.6 8l3.2 2.8V5.2ZM10.2 5.2 13.4 8l-3.2 2.8V5.2Z",
	"view.zoomIn": "M7.2 11.4a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4ZM10.4 10.4l2.8 2.8M5.6 7.2h3.2M7.2 5.6v3.2",
	"view.zoomOut": "M7.2 11.4a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4ZM10.4 10.4l2.8 2.8M5.6 7.2h3.2",
	"view.zoomReset": "M3 5.2V3h2.2M10.8 3H13v2.2M13 10.8V13h-2.2M5.2 13H3v-2.2M6 8h4M8 6v4",
	"view.resetTransform": "M3.2 8.2a4.8 4.8 0 1 0 1.4-3.6L3 6.2M3 3.4v2.8h2.8",
	"view.screenshot":
		"M2.5 5.5h2.2l1-1.5h4.6l1 1.5h2.2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1ZM8 10.6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
	"view.toggleControls":
		"M2.5 8s2.2-3.5 5.5-3.5S13.5 8 13.5 8s-2.2 3.5-5.5 3.5S2.5 8 2.5 8ZM8 9.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM3 13 13 3",

	"subtitle.toggle":
		"M2.5 4h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM4.5 9.2h3M9 9.2h2.5M4.5 7h5",
	"subtitle.cycleTrack":
		"M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM2.8 8h10.4M8 2.5c1.6 1.5 2.2 3.4 2.2 5.5s-.6 4-2.2 5.5c-1.6-1.5-2.2-3.4-2.2-5.5S6.4 4 8 2.5Z",
	"quality.set": "M3 5h10M3 8h10M3 11h10M6 3.8v2.4M10.5 6.8v2.4M7 9.8v2.4",
	"quality.up": "M3 12v-2M6 12V8.5M9 12V6M12.5 11.5v-7M10.8 6.2 12.5 4.5l1.7 1.7",
	"quality.down": "M3 12v-2M6 12V8.5M9 12V6M12.5 4.5v7M10.8 9.8 12.5 11.5l1.7-1.7",

	"page.copyUrlWithTime": "M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM8 5v3.2l2.2 1.3",
	"page.copyUrl": "M6.6 9.4 9.4 6.6M5.2 7.2 3.8 8.6a2.3 2.3 0 0 0 3.2 3.2l1.4-1.4M10.8 8.8l1.4-1.4A2.3 2.3 0 1 0 9 4.2L7.6 5.6",
	"page.toggleComments": "M3 4.2h10a1 1 0 0 1 1 1v5.6a1 1 0 0 1-1 1H6.8L3.8 14v-2.2H3a1 1 0 0 1-1-1V5.2a1 1 0 0 1 1-1Z",
	"page.openThumbnail":
		"M2.5 3.5h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1ZM3 11l3-3 2.3 2.2 1.9-1.8L13 11M5.6 6.2a.4.4 0 1 0 0 .01",
};

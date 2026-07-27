enum VideoQuality {
	highres = "8K (4320p)",
	hd2160 = "4K (2160p)",
	hd1440 = "1440p",
	hd1080 = "1080p",
	hd720 = "720p",
	large = "480p",
	medium = "360p",
	small = "240p",
	tiny = "144p",
}

type MiniPlayerSize = "360x203" | "420x236" | "480x270" | "560x315" | "640x360" | "720x405";
type MiniPlayerPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
export type PlayerHideButtonMode = "auto" | "hide" | "show";
export type PlayerButtonCollapseMode = "never" | "always" | "auto";

export type Config = {
	"player.ui.enableSpeedButtons": boolean;
	"player.ui.collapseSpeedButtons": PlayerButtonCollapseMode;
	"player.ui.enableSpeedSlider": boolean;
	"player.ui.speedSliderWheelMode": "speedButtons" | "custom";
	"player.ui.speedSliderStep": number;
	"player.ui.speedButtons": Array<0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2 | 2.25 | 2.5 | 2.75 | 3 | 5 | 10>;
	"player.ui.enableVolumeBooster": boolean;
	"player.ui.inPageFullscreen": boolean;
	"player.ui.hideButton.autoplay": PlayerHideButtonMode;
	"player.ui.hideButton.subtitles": PlayerHideButtonMode;
	"player.ui.hideButton.settings": PlayerHideButtonMode;
	"player.ui.hideButton.miniPlayer": PlayerHideButtonMode;
	"player.ui.hideButton.pip": PlayerHideButtonMode;
	"player.ui.hideButton.size": PlayerHideButtonMode;
	"player.ui.hideButton.remote": PlayerHideButtonMode;
	"player.ui.hideButton.fullscreen": PlayerHideButtonMode;
	"player.ui.hideCeElement": boolean;
	"player.ui.progress.enable": boolean;
	"player.ui.progress.height": number;
	"player.ui.progress.enableTag": boolean;
	"player.ui.progress.tagFontSize": number;
	"player.ui.progress.tagPosition": "bottom-left" | "bottom-right" | "top-left" | "top-right";
	"player.ui.progress.tagOffset": number;
	"player.miniPlayer.enable": boolean;
	"player.miniPlayer.size": MiniPlayerSize;
	"player.miniPlayer.position": MiniPlayerPosition;
	"player.miniPlayer.offset": number;
	"player.miniPlayer.triggerOffset": number;
	"player.settings.maxVolume": boolean;
	"player.settings.lockQuality": boolean;
	"player.settings.lockQuality.value": keyof typeof VideoQuality;
	"player.settings.saveSpeed": boolean;
	"player.settings.saveSpeedByChannel": boolean;
	"player.settings.saveSubtitleStatus": boolean;
	"player.settings.saveSubtitleStatusByChannel": boolean;
	"player.settings.nonStop": boolean;
	"player.settings.volumeBooster": boolean;
	"player.settings.volumeBoosterMultiplier": number;
	"player.ui.functionButtons.enableRotateButton": boolean;
	"player.ui.functionButtons.enableMirrorButton": boolean;
	"player.ui.functionButtons.enableScreenshotButton": boolean;
	"player.ui.functionButtons.collapseButtons": PlayerButtonCollapseMode;
	"player.ui.enableVideoZoom": boolean;

	"comment.nickname": boolean;
	"comment.autoShowMore": boolean;
	"comment.autoTranslate": boolean;
	"comment.showManualTranslateButtonForSkippedLanguages": boolean;
	"comment.lineByLineTranslate": boolean;
	"comment.targetLanguage": string;
	"comment.neverTranslateLanguages": string[];

	"translate.enable.videoListTitle": boolean;
	"translate.enable.videoTitle": boolean;
	"translate.enable.videoDescription": boolean;
	"translate.enable.videoSummary": boolean;
	"translate.enable.timedtext": boolean;
	"translate.timedtext.mode": "bilingual" | "translationOnly";

	"index.videoPerRow.enable": boolean;
	"index.videoPerRow.count": 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
	"other.premiumLogo.enable": boolean;
	"other.logoCountryCode": string;
	"other.antiAD.enable": boolean;
	"other.antiAD.enableMerch": boolean;
	"shorts-blocker.enable.index": boolean;
	"shorts-blocker.enable.watch": boolean;
	"shorts-blocker.enable.menu": boolean;
	"rollback.playerUI": boolean;
	"other.customCss.enable": boolean;
	"other.customCss.value": string;

	"yttweak.enableChromeApiStatusChecker": boolean;
	"yttweak.disableUpdateNotice": boolean;
};

const config: Config = {
	"player.ui.enableSpeedButtons": true,
	"player.ui.collapseSpeedButtons": "auto",
	"player.ui.enableSpeedSlider": true,
	"player.ui.speedSliderWheelMode": "speedButtons",
	"player.ui.speedSliderStep": 0.25,
	"player.ui.speedButtons": [0.5, 1, 1.5, 2],
	"player.ui.enableVolumeBooster": true,
	"player.ui.inPageFullscreen": false,
	"player.ui.hideButton.autoplay": "auto",
	"player.ui.hideButton.subtitles": "auto",
	"player.ui.hideButton.settings": "auto",
	"player.ui.hideButton.miniPlayer": "hide",
	"player.ui.hideButton.pip": "hide",
	"player.ui.hideButton.size": "hide",
	"player.ui.hideButton.remote": "hide",
	"player.ui.hideButton.fullscreen": "auto",
	"player.ui.hideCeElement": true,
	"player.ui.progress.enable": true,
	"player.ui.progress.height": 2,
	"player.ui.progress.enableTag": true,
	"player.ui.progress.tagFontSize": 12,
	"player.ui.progress.tagPosition": "bottom-left",
	"player.ui.progress.tagOffset": 5,
	"player.miniPlayer.enable": false,
	"player.miniPlayer.size": "480x270",
	"player.miniPlayer.position": "bottom-right",
	"player.miniPlayer.offset": 16,
	"player.miniPlayer.triggerOffset": 48,
	"player.settings.maxVolume": true,
	"player.settings.lockQuality": false,
	"player.settings.lockQuality.value": "hd1080",
	"player.settings.saveSpeed": true,
	"player.settings.saveSpeedByChannel": true,
	"player.settings.saveSubtitleStatus": true,
	"player.settings.saveSubtitleStatusByChannel": true,
	"player.settings.nonStop": true,
	"player.settings.volumeBooster": false,
	"player.settings.volumeBoosterMultiplier": 2,
	"player.ui.functionButtons.enableRotateButton": false,
	"player.ui.functionButtons.enableMirrorButton": false,
	"player.ui.functionButtons.enableScreenshotButton": false,
	"player.ui.functionButtons.collapseButtons": "auto",
	"player.ui.enableVideoZoom": true,

	"comment.nickname": true,
	"comment.autoShowMore": true,
	"comment.autoTranslate": true,
	"comment.showManualTranslateButtonForSkippedLanguages": true,
	"comment.lineByLineTranslate": true,
	"comment.targetLanguage": "auto",
	"comment.neverTranslateLanguages": [],

	"translate.enable.videoListTitle": true,
	"translate.enable.videoTitle": true,
	"translate.enable.videoDescription": true,
	"translate.enable.videoSummary": true,
	"translate.enable.timedtext": true,
	"translate.timedtext.mode": "bilingual",

	"index.videoPerRow.enable": false,
	"index.videoPerRow.count": 4,
	"other.premiumLogo.enable": false,
	"other.logoCountryCode": "",
	"other.antiAD.enable": false,
	"other.antiAD.enableMerch": false,
	"shorts-blocker.enable.index": false,
	"shorts-blocker.enable.watch": false,
	"shorts-blocker.enable.menu": false,
	"rollback.playerUI": false,
	"other.customCss.enable": false,
	"other.customCss.value": "",

	"yttweak.enableChromeApiStatusChecker": true,
	"yttweak.disableUpdateNotice": false,
};

export function normalizeConfig(rawConfig: Partial<Config> | Record<string, unknown>) {
	const normalizedConfig = { ...rawConfig } as Record<string, unknown>;
	for (const key of [
		"player.ui.hideButton.autoplay",
		"player.ui.hideButton.subtitles",
		"player.ui.hideButton.settings",
		"player.ui.hideButton.miniPlayer",
		"player.ui.hideButton.pip",
		"player.ui.hideButton.size",
		"player.ui.hideButton.remote",
		"player.ui.hideButton.fullscreen",
	]) {
		if (normalizedConfig[key] === true) normalizedConfig[key] = "hide";
		if (normalizedConfig[key] === false) normalizedConfig[key] = "auto";
	}
	if (normalizedConfig["player.ui.hideButton.subtitles"] === "show") {
		normalizedConfig["player.ui.hideButton.subtitles"] = "auto";
	}
	if (typeof normalizedConfig["other.customCss.value"] !== "string") {
		normalizedConfig["other.customCss.value"] = "";
	}
	if (typeof normalizedConfig["other.logoCountryCode"] !== "string") {
		normalizedConfig["other.logoCountryCode"] = "";
	}

	if (typeof normalizedConfig["other.antiAD.enableVideo"] !== undefined) {
		delete normalizedConfig["other.antiAD.enableVideo"];
	}
	return normalizedConfig as Partial<Config>;
}

export default config;

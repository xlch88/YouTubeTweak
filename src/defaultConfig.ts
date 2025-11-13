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

export type Config = {
	"player.ui.enableSpeedButtons": boolean;
	"player.ui.speedButtons": Array<0.25 | 0.5 | 1 | 1.25 | 1.5 | 2 | 3>;
	"player.ui.hideButton.autoplay": boolean;
	"player.ui.hideButton.subtitles": boolean;
	"player.ui.hideButton.settings": boolean;
	"player.ui.hideButton.miniPlayer": boolean;
	"player.ui.hideButton.pip": boolean;
	"player.ui.hideButton.size": boolean;
	"player.ui.hideButton.remote": boolean;
	"player.ui.hideButton.fullscreen": boolean;
	"player.ui.hideCeElement": boolean;
	"player.settings.maxVolume": boolean;
	"player.settings.lockQuality": boolean;
	"player.settings.lockQuality.value": keyof typeof VideoQuality;
	"player.settings.saveSpeed": boolean;
	"player.settings.saveSpeedByChannel": boolean;
	"player.settings.saveSubtitleStatus": boolean;
	"player.settings.saveSubtitleStatusByChannel": boolean;

	"comment.nickname": boolean;
	"comment.autoShowMore": boolean;
	"comment.autoTranslate": boolean;

	"index.videoPerRow.enable": boolean;
	"index.videoPerRow.count": 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
	"other.antiAD.enable": boolean;
	"other.antiAD.enableMerch": boolean;
	"other.antiAD.enableVideo": boolean;
	"shorts-blocker.enable.index": boolean;
	"shorts-blocker.enable.watch": boolean;
	"shorts-blocker.enable.menu": boolean;

	"yttweak.enableChromeApiStatusChecker": boolean;
};

const config: Config = {
	"player.ui.enableSpeedButtons": true,
	"player.ui.speedButtons": [0.5, 1, 1.5, 2],
	"player.ui.hideButton.autoplay": false,
	"player.ui.hideButton.subtitles": false,
	"player.ui.hideButton.settings": false,
	"player.ui.hideButton.miniPlayer": true,
	"player.ui.hideButton.pip": true,
	"player.ui.hideButton.size": true,
	"player.ui.hideButton.remote": true,
	"player.ui.hideButton.fullscreen": false,
	"player.ui.hideCeElement": true,
	"player.settings.maxVolume": true,
	"player.settings.lockQuality": false,
	"player.settings.lockQuality.value": "hd1080",
	"player.settings.saveSpeed": true,
	"player.settings.saveSpeedByChannel": true,
	"player.settings.saveSubtitleStatus": true,
	"player.settings.saveSubtitleStatusByChannel": true,

	"comment.nickname": true,
	"comment.autoShowMore": true,
	"comment.autoTranslate": true,

	"index.videoPerRow.enable": false,
	"index.videoPerRow.count": 4,
	"other.antiAD.enable": false,
	"other.antiAD.enableMerch": false,
	"other.antiAD.enableVideo": false,
	"shorts-blocker.enable.index": false,
	"shorts-blocker.enable.watch": false,
	"shorts-blocker.enable.menu": false,

	"yttweak.enableChromeApiStatusChecker": true,
};

export default config;

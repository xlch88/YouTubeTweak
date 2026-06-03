import type { Plugin } from "../types";
import config from "../config";
import { videoPlayer, metadata } from "../mainWorld";

const modelWhitelist = ["YT-UNIFIED-SHARE-PANEL-RENDERER", "YT-SUBSCRIBE-BUTTON-VIEW-MODEL"];

function findYouThereText(obj: any): string | undefined {
	/**
	 *  ytInitialPlayerResponse.messages.find(v=>v.youThereRenderer).youThereRenderer.configData.youThereData.showPausedActions.find(v=>v.openPopupAction).openPopupAction.popup.confirmDialogRenderer.dialogMessages[0].runs[0].text
		↑ 'Video paused. Continue watching?'
	 */

	return obj?.messages
		?.find((v: any) => v.youThereRenderer)
		?.youThereRenderer?.configData?.youThereData?.showPausedActions?.find((v: any) => v?.openPopupAction)?.openPopupAction?.popup
		.confirmDialogRenderer?.dialogMessages?.[0]?.runs?.[0]?.text;
}

export default {
	"player.settings.nonStop": {
		initPlayer() {
			videoPlayer.videoStream?.addEventListener("pause", (evt) => {
				if (!evt.isTrusted && config.get("player.settings.nonStop")) {
					videoPlayer.videoStream?.play();
				}
			});

			document.addEventListener("yt-popup-opened", (e) => {
				if (!config.get("player.settings.nonStop")) return;

				const evt = e as CustomEvent<HTMLElement>;

				const dialogText = [
					...evt?.detail?.querySelectorAll<HTMLElement>("tp-yt-paper-dialog-scrollable#scroller yt-formatted-string"),
				]
					.map((v) => v?.innerText)
					.join();

				let pauseText =
					findYouThereText(metadata.video) ||
					findYouThereText(metadata.videoNext) ||
					findYouThereText((window as any).ytInitialPlayerResponse) ||
					findYouThereText((window as any).ytInitialData) ||
					"Video paused. Continue watching?";

				if (!dialogText.includes(pauseText)) {
					return;
				}

				document.querySelectorAll<HTMLElement>("ytmusic-popup-container, ytd-popup-container").forEach((el) => el.click());
			});
		},
	},
} as Record<string, Plugin>;

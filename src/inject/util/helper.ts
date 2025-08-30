import { videoPlayer } from "../mainWorld";

export function bodyClass(className: string) {
	return {
		enable: () => {
			document.body.classList.add(className);
		},
		disable: () => {
			document.body.classList.remove(className);
		},
	};
}

export function checkPlayerAD() {
	return (videoPlayer.player?.querySelector(".video-ads")?.childNodes?.length ?? 0) > 0 || false;
}

export function getChannelId() {
	const rt = videoPlayer.player?.getPlayerResponse()?.microformat?.playerMicroformatRenderer?.ownerProfileUrl?.slice(23);
	return rt ? decodeURI(rt) : null;
}

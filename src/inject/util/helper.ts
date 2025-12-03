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

export function secToMMDD(time: number, forceShowHours = false): string {
	const hours = Math.floor(time / 3600)
		.toString()
		.padStart(2, "0");
	const minutes = Math.floor((time % 3600) / 60)
		.toString()
		.padStart(2, "0");
	const seconds = Math.floor(time % 60)
		.toString()
		.padStart(2, "0");

	return hours !== "00" || forceShowHours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function googleTranslate(text: string | string[], srcLang: string = "auto", targetLang: string): Promise<[string, string]> {
	return new Promise((resolve, reject) => {
		fetch("https://translate-pa.googleapis.com/v1/translateHtml", {
			headers: {
				"content-type": "application/json+protobuf",
				"x-goog-api-key": "AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520",
			},
			body: JSON.stringify([[typeof text === "string" ? [text] : text, srcLang, targetLang], "te_lib"]),
			method: "POST",
		})
			.then((res) => res.json())
			.then((data) => {
				if (typeof data[0] === "number") {
					reject(new Error(`Translation API error (${data[0]}): ` + data[1]));
					return;
				}

				resolve(data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

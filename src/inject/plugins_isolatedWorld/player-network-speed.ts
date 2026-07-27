import wirelessRedstone from "../wirelessRedstone";

export default function initPlayerNetworkSpeedBridge() {
	Object.assign(wirelessRedstone.handlers, {
		getYoutubeNetworkBytes(
			data: { videoId?: string | null; trackPageTraffic?: boolean },
			reply: (result: { supported: boolean; bytes: number; pageBytes: number }) => void,
		) {
			browser.runtime
				.sendMessage({
					type: "getYoutubeNetworkBytes",
					videoId: typeof data?.videoId === "string" ? data.videoId : null,
					trackPageTraffic: data?.trackPageTraffic === true,
				})
				.then(reply)
				.catch(() => reply({ supported: false, bytes: 0, pageBytes: 0 }));
		},
		disableYoutubeNetworkSpeed() {
			browser.runtime.sendMessage({ type: "disableYoutubeNetworkSpeed" }).catch(() => {});
		},
	});
}

if (window.ytInitialPlayerResponse) {
	window.postMessage(
		{
			from: "YouTubeTweak-FetchHook",
			type: "player-v1",
			url: "ytInitialPlayerResponse",
			data: window.ytInitialPlayerResponse,
		},
		"*",
	);
	delete window.ytInitialPlayerResponse.adSlots;
}

export async function youtubeiAPIv1(
	path: string,
	args: Record<string, any>,
	hl = "en",
	gl = "US",
	cookie = true,
	signal?: AbortSignal,
) {
	const ytcfg = (window as any).ytcfg;
	const defaultClient = ytcfg?.get("INNERTUBE_CONTEXT")?.client || {};
	const requestContext = args.context || {};
	const visitorData =
		requestContext.client?.visitorData || ytcfg?.get("VISITOR_DATA") || defaultClient.visitorData;
	const client = {
		clientName: "WEB",
		clientVersion: ytcfg?.get("INNERTUBE_CLIENT_VERSION") ?? defaultClient.clientVersion ?? "2.20260728.01.00",
		gl,
		hl,
		...requestContext.client,
		...(visitorData && { visitorData }),
	};
	const signatureTimestamp = Number(ytcfg?.get("STS")) || 20660;
	const playerRequest = args.playerRequest;
	const clientId = { WEB: "1", ANDROID_VR: "28", VISIONOS: "101" }[client.clientName as string];
	const { context: _context, ...requestArgs } = args;

	const response = await fetch(`https://www.youtube.com/youtubei/v1${path}?prettyPrint=false`, {
		headers: {
			accept: "*/*",
			"content-type": "application/json",
			...(clientId && { "x-youtube-client-name": clientId }),
			"x-youtube-client-version": client.clientVersion,
			...(visitorData && { "x-goog-visitor-id": visitorData }),
		},
		body: JSON.stringify({
			context: {
				...requestContext,
				client,
			},
			...requestArgs,
			...(playerRequest && {
				playerRequest: {
					...playerRequest,
					playbackContext: {
						...playerRequest.playbackContext,
						contentPlaybackContext: {
							...playerRequest.playbackContext?.contentPlaybackContext,
							signatureTimestamp,
						},
					},
				},
			}),
		}),
		credentials: cookie ? "include" : "omit",
		method: "POST",
		signal,
	});
	if (!response.ok) throw new Error(`YouTube API HTTP ${response.status}`);

	return await response.json();
}

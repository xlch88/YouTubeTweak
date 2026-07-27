const tabStates = new Map<
	number,
	{
		attached: boolean;
		videoId: string | null;
		mediaRequests: Set<string>;
		receivedBytes: number;
		pageBytes: number;
		trackPageTraffic: boolean;
	}
>();
const debuggerApi = (
	globalThis as typeof globalThis & {
		chrome?: {
			debugger?: {
				attach(target: { tabId: number }, requiredVersion: string): Promise<void>;
				detach(target: { tabId: number }): Promise<void>;
				sendCommand(target: { tabId: number }, method: string): Promise<unknown>;
				onEvent: {
					addListener(listener: (source: { tabId?: number }, method: string, params?: Record<string, unknown>) => void): void;
				};
				onDetach: {
					addListener(listener: (source: { tabId?: number }) => void): void;
				};
			};
		};
	}
).chrome?.debugger;
const unsupportedResult = { supported: false, bytes: 0, pageBytes: 0 } as const;

function clearTab(tabId: number) {
	tabStates.delete(tabId);
}

function getYouTubeVideoId(value?: string) {
	if (!value) return null;

	try {
		const url = new URL(value);
		if (url.hostname !== "youtube.com" && !url.hostname.endsWith(".youtube.com")) return null;
		if (url.pathname !== "/watch") return null;
		return url.searchParams.get("v") || null;
	} catch {
		return null;
	}
}

function resetPageTraffic(tabId: number, videoId: string | null, trackPageTraffic?: boolean) {
	const state = tabStates.get(tabId);
	const shouldTrackPageTraffic = trackPageTraffic ?? state?.trackPageTraffic ?? false;
	if (state?.videoId === videoId) {
		if (state.trackPageTraffic !== shouldTrackPageTraffic) {
			state.trackPageTraffic = shouldTrackPageTraffic;
			state.pageBytes = 0;
		}
		return;
	}

	tabStates.set(tabId, {
		attached: state?.attached ?? false,
		videoId,
		mediaRequests: new Set(),
		receivedBytes: 0,
		pageBytes: 0,
		trackPageTraffic: shouldTrackPageTraffic,
	});
}

async function detachTab(tabId: number) {
	clearTab(tabId);
	if (!debuggerApi) return;

	try {
		await debuggerApi.detach({ tabId });
	} catch {}
}

async function enableNetworkTracking(tabId: number) {
	const state = tabStates.get(tabId);
	if (!debuggerApi || !state) return false;
	if (state.attached) return true;

	try {
		await debuggerApi.sendCommand({ tabId }, "Network.enable");
	} catch {
		try {
			await debuggerApi.attach({ tabId }, "1.3");
			await debuggerApi.sendCommand({ tabId }, "Network.enable");
		} catch {
			try {
				await debuggerApi.detach({ tabId });
			} catch {}
			return false;
		}
	}

	const currentState = tabStates.get(tabId);
	if (currentState) {
		currentState.attached = true;
		return true;
	}

	try {
		await debuggerApi.detach({ tabId });
	} catch {}
	return false;
}

async function getNetworkBytes(tabId: number, videoId: string, trackPageTraffic: boolean) {
	resetPageTraffic(tabId, videoId, trackPageTraffic);
	const supported = await enableNetworkTracking(tabId);
	const state = tabStates.get(tabId);
	if (!supported || !state) {
		if (supported) {
			await detachTab(tabId);
		} else {
			clearTab(tabId);
		}
		return unsupportedResult;
	}

	const bytes = state.receivedBytes;
	state.receivedBytes = 0;
	return { supported: true, bytes, pageBytes: state.pageBytes };
}

export default function initPlayerNetworkSpeedBackground() {
	if (!debuggerApi) return;

	debuggerApi.onEvent.addListener((source, method, params) => {
		const tabId = source.tabId;
		if (typeof tabId !== "number") return;
		const state = tabStates.get(tabId);
		if (!state?.attached) return;

		const event = params as {
			requestId?: string;
			request?: { url?: string };
			encodedDataLength?: number;
			dataLength?: number;
		};

		if (method === "Network.requestWillBeSent" && event.requestId && event.request?.url) {
			let isMediaRequest = false;

			try {
				const hostname = new URL(event.request.url).hostname;
				isMediaRequest = hostname === "googlevideo.com" || hostname.endsWith(".googlevideo.com");
			} catch {}

			if (isMediaRequest) {
				state.mediaRequests.add(event.requestId);
			} else {
				state.mediaRequests.delete(event.requestId);
			}
			return;
		}

		if (method === "Network.dataReceived" && event.requestId && state.mediaRequests.has(event.requestId)) {
			const bytes =
				typeof event.encodedDataLength === "number" && event.encodedDataLength > 0
					? event.encodedDataLength
					: Math.max(event.dataLength || 0, 0);
			state.receivedBytes += bytes;
			if (state.trackPageTraffic) state.pageBytes += bytes;
			return;
		}

		if ((method === "Network.loadingFinished" || method === "Network.loadingFailed") && event.requestId) {
			state.mediaRequests.delete(event.requestId);
		}
	});

	debuggerApi.onDetach.addListener((source) => {
		if (typeof source.tabId === "number") clearTab(source.tabId);
	});

	browser.tabs.onRemoved.addListener(clearTab);
	browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
		if (!changeInfo.url || !tabStates.has(tabId)) return;

		const videoId = getYouTubeVideoId(changeInfo.url);
		if (videoId) {
			resetPageTraffic(tabId, videoId);
		} else {
			void detachTab(tabId);
		}
	});

	browser.runtime.onMessage.addListener((message, sender) => {
		const tabId = sender.tab?.id;
		if (message?.type === "disableYoutubeNetworkSpeed") {
			if (typeof tabId !== "number") return false;
			return detachTab(tabId).then(() => true);
		}
		if (message?.type !== "getYoutubeNetworkBytes") return;
		if (typeof tabId !== "number" || typeof message.videoId !== "string") return unsupportedResult;
		if (tabStates.get(tabId)?.videoId === message.videoId) {
			return getNetworkBytes(tabId, message.videoId, message.trackPageTraffic === true);
		}

		return browser.tabs
			.get(tabId)
			.then((tab) =>
				getYouTubeVideoId(tab.pendingUrl || tab.url) === message.videoId
					? getNetworkBytes(tabId, message.videoId, message.trackPageTraffic === true)
					: unsupportedResult,
			)
			.catch(() => unsupportedResult);
	});
}

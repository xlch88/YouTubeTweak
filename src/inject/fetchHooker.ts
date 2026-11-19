export type Hook = {
	match: ((...args: Parameters<typeof window.fetch>) => boolean) | string;
	handler: (result: any, url: string, responseClone: Response) => any;
	mutator?: boolean;
};

export default {
	hooks: {} as Record<string, Hook>,
	addHook(name: string, hook: Hook) {
		localStorage.setItem("YTTweak-EnableFetchHooker", "1");
		this.hooks[name] = hook;
	},

	init() {
		const originalFetch = window.fetch;

		Object.defineProperty(window, "fetch", {
			value: async (...args: Parameters<typeof window.fetch>) => {
				let url: string | undefined;
				try {
					const input = args[0];
					url = typeof input === "string" ? input : input instanceof URL ? input.href : input?.url;
				} catch (error) {
					console.warn("Unable to read fetch URL for hooks:", error);
				}

				const matchedHooks = Object.values(this.hooks).filter((v) => {
					try {
						if (typeof v.match === "function") return v.match(...args);
						return typeof url === "string" && url.includes(v.match);
					} catch (error) {
						console.warn("Unable to match fetch hook:", error);
						return false;
					}
				});
				if (matchedHooks.length === 0 || typeof url !== "string") return originalFetch.apply(window, args);

				const response = await originalFetch.apply(window, args);
				if (!response.ok) return response;
				try {
					const responseClone = response.clone();

					if (!matchedHooks.some((v) => v.mutator)) {
						void responseClone
							.json()
							.then(async (result) => {
								for (const hook of matchedHooks) {
									try {
										await hook.handler(result, url, responseClone);
									} catch (error) {
										console.warn("Unable to run fetch observer:", error);
									}
								}
							})
							.catch((error) => console.warn("Unable to read fetch response for observers:", error));

						return response;
					}
					let data = await responseClone.json();
					for (const hook of matchedHooks) {
						if (hook.mutator) {
							data = await hook.handler(data, url, responseClone);
						} else {
							await hook.handler(data, url, responseClone);
						}
					}

					const body = JSON.stringify(data);
					if (body === undefined) throw new Error("Fetch hook returned no JSON response");
					return new Response(body, {
						status: response.status,
						statusText: response.statusText,
						headers: new Headers(response.headers),
					});
				} catch (error) {
					console.warn("Unable to transform fetch response:", error);
					return response;
				}
			},
			writable: false,
			configurable: false,
			enumerable: true,
		});
	},
};

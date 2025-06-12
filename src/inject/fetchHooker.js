export default {
	hooks: {},

	init() {
		const originalFetch = window.fetch;

		Object.defineProperty(window, "fetch", {
			value: async (...args) => {
				const url = args[0]?.url || args[0];
				console.log(url);

				const matchedHooks = Object.values(this.hooks).filter((v) => {
					if (typeof v.match === "function") {
						return v.match(...args);
					}
					return url.includes(v.match);
				});
				if (matchedHooks.length === 0 || typeof url !== "string") return originalFetch.apply(window, args);

				const response = await originalFetch.apply(window, args);
				const responseClone = response.clone();

				if (matchedHooks.filter((v) => v.mutator).length <= 0) {
					responseClone.json().then((result) => {
						matchedHooks.forEach((hook) => hook.handler(result, url, responseClone));
					});

					return response;
				} else {
					let data = await responseClone.json();
					for (const hook of matchedHooks) {
						if (hook.mutator) {
							data = hook.handler(data, url, responseClone);
						} else {
							hook.handler(data, url, responseClone);
						}
					}

					return new Response(JSON.stringify(data), {
						status: response.status,
						statusText: response.statusText,
						headers: new Headers(response.headers),
					});
				}
			},
			writable: false,
			configurable: false,
			enumerable: true,
		});

		Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
			get() {
				return new Proxy(
					{},
					{
						get(_, prop) {
							if (prop === "fetch") {
								return window.fetch.bind(window);
							}
							return undefined;
						},
					},
				);
			},
		});
	},
};

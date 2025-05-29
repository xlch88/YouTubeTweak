export default {
	hooks: {},

	init() {
		const originalFetch = window.fetch;
		window.fetch = async (...args) => {
			const url = args[0]?.url || args[0];

			const matchedHooks = Object.values(this.hooks).filter((v) => url.includes(v.match));
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
					data = hook.handler(data, url, responseClone);
				}

				return new Response(JSON.stringify(data), {
					status: response.status,
					statusText: response.statusText,
					headers: new Headers(response.headers),
				});
			}
		};
	},
};

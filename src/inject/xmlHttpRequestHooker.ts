type Hook = {
	match: ((method: string, url: string, body: any, xhr: XMLHttpRequest) => boolean) | string;
	handler: (result: any, url: string, xhr: XMLHttpRequest) => any;
	mutator?: boolean;
};

const hooks: Record<string, Hook> = {};

export default {
	addHook(name: string, hook: Hook) {
		hooks[name] = hook;
	},
	init() {
		const OriginalOpen = XMLHttpRequest.prototype.open;
		const OriginalSend = XMLHttpRequest.prototype.send;

		XMLHttpRequest.prototype.open = function (
			this: XMLHttpRequest,
			method: string,
			url: string,
			async?: boolean,
			username?: string | null,
			password?: string | null,
		) {
			(this as any)._xhr_meta = { method, url };
			return OriginalOpen.apply(this, [method, url, async ?? true, username ?? null, password ?? null]);
		};

		XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
			const meta = (this as any)._xhr_meta || {};
			const url = String(meta.url || "");
			const method = String(meta.method || "GET");

			const matchedHooks = Object.values(hooks).filter((v: Hook) => {
				if (typeof v.match === "function") return v.match(method, url, body, this);
				return url.includes(v.match);
			});

			if (matchedHooks.length === 0 || !url) {
				return OriginalSend.apply(this, [body ?? null]);
			}

			let processed = false;
			const handle = () => {
				if (processed || this.readyState !== 4) return;
				processed = true;

				const ct = (this.getResponseHeader("content-type") || "").toLowerCase();
				const isJSON =
					this.responseType === "json" ||
					ct.includes("application/json") ||
					ct.includes("+json") ||
					/^\s*[\[{]/.test(this.responseText || "");

				if (!isJSON) {
					matchedHooks.forEach((h) => !h.mutator && h.handler(this.response, url, this));
					return;
				}

				let data: any;
				try {
					data = this.responseType === "json" ? this.response : JSON.parse(this.responseText);
				} catch {
					matchedHooks.forEach((h) => !h.mutator && h.handler(this.response, url, this));
					return;
				}

				const hasMutator = matchedHooks.some((h) => h.mutator);
				if (!hasMutator) {
					queueMicrotask(() => matchedHooks.forEach((h) => h.handler(data, url, this)));
					return;
				}

				for (const h of matchedHooks) {
					if (h.mutator) data = h.handler(data, url, this);
					else h.handler(data, url, this);
				}

				const text = (() => {
					try {
						return typeof data === "string" ? data : JSON.stringify(data);
					} catch {
						return this.responseText;
					}
				})();

				try {
					Object.defineProperty(this, "responseText", {
						get: () => text,
						configurable: true,
					});
					Object.defineProperty(this, "response", {
						get: () => (this.responseType === "json" ? data : text),
						configurable: true,
					});
				} catch {}
			};

			this.addEventListener("readystatechange", handle);
			return OriginalSend.apply(this, [body ?? null]);
		};
	},
};

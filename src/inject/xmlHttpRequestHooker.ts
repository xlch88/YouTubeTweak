export type Hook = {
	match: ((method: string, url: string, body: any, xhr: XMLHttpRequest) => boolean) | string;
	handler: (result: any, url: string, xhr: XMLHttpRequest) => any | Promise<any>;
	mutator?: boolean;
};

type Listener = {
	type: string;
	listener: EventListenerOrEventListenerObject;
};

const xmlHttpRequestHooker = {
	hooks: {} as Record<string, Hook>,
	addHook(name: string, hook: Hook) {
		this.hooks[name] = hook;
	},
	init() {
		if (typeof window === "undefined") return;
		if ((window as any).__HookedXHRInstalled) return;
		(window as any).__HookedXHRInstalled = true;

		const OriginalXHR = window.XMLHttpRequest;
		const hooksRef = this.hooks;

		class HookedXHR {
			private _inner: XMLHttpRequest;
			private _method = "GET";
			private _url = "";
			private _body: any = null;
			private _readyState = 0;
			private _status = 0;
			private _statusText = "";
			private _responseType: XMLHttpRequestResponseType = "";
			private _responseOverride: any = undefined;
			private _responseTextOverride: string | undefined = undefined;
			private _listeners: Listener[] = [];
			private _matchedHooks: Hook[] = [];
			private _asyncHandled = false;

			onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
			onload: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
			onerror: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
			onabort: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
			ontimeout: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
			onloadend: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
			onloadstart: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
			onprogress: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => any) | null = null;

			constructor() {
				this._inner = new OriginalXHR();

				this._inner.addEventListener("load", () => {
					this._handleLoad().catch((e) => {
						console.error("HookedXHR load handler error", e);
						this._finalizeError("error");
					});
				});

				this._inner.addEventListener("error", () => {
					this._finalizeError("error");
				});

				this._inner.addEventListener("timeout", () => {
					this._finalizeError("timeout");
				});

				this._inner.addEventListener("abort", () => {
					this._finalizeError("abort");
				});

				this._inner.addEventListener("loadstart", (ev) => {
					this._readyState = 1;
					this._fire("readystatechange");
					this._fire("loadstart", ev);
				});

				this._inner.addEventListener("progress", (ev) => {
					this._fire("progress", ev);
				});
			}

			get readyState(): number {
				return this._readyState;
			}

			get status(): number {
				return this._status || this._inner.status;
			}

			get statusText(): string {
				return this._statusText || this._inner.statusText;
			}

			get responseType(): XMLHttpRequestResponseType {
				return this._responseType || this._inner.responseType;
			}

			set responseType(v: XMLHttpRequestResponseType) {
				this._responseType = v;
				try {
					this._inner.responseType = v;
				} catch {}
			}

			get responseURL(): string {
				return (this._inner as any).responseURL || "";
			}

			get response(): any {
				if (this._responseOverride !== undefined) return this._responseOverride;
				return this._inner.response;
			}

			get responseText(): string {
				if (this._responseTextOverride !== undefined) return this._responseTextOverride;
				return this._inner.responseText;
			}

			get responseXML(): Document | null {
				return this._inner.responseXML;
			}

			get withCredentials(): boolean {
				return this._inner.withCredentials;
			}

			set withCredentials(v: boolean) {
				this._inner.withCredentials = v;
			}

			get timeout(): number {
				return this._inner.timeout;
			}

			set timeout(v: number) {
				this._inner.timeout = v;
			}

			get upload(): XMLHttpRequestUpload {
				return this._inner.upload;
			}

			open(method: string, url: string, async: boolean = true, username?: string | null, password?: string | null) {
				this._method = method.toUpperCase();
				this._url = String(url);
				this._readyState = 1;
				this._fire("readystatechange");

				this._inner.open(this._method, this._url, async, username ?? undefined, password ?? undefined);
			}

			send(body?: Document | XMLHttpRequestBodyInit | null) {
				this._body = body ?? null;

				this._matchedHooks = Object.values(hooksRef).filter((h: Hook) => {
					if (!this._url) return false;
					if (typeof h.match === "function") return h.match(this._method, this._url, this._body, this as any);
					return this._url.includes(h.match);
				});

				this._inner.send(body as any);
			}

			abort() {
				this._inner.abort();
			}

			setRequestHeader(name: string, value: string) {
				this._inner.setRequestHeader(name, value);
			}

			getAllResponseHeaders(): string {
				return this._inner.getAllResponseHeaders();
			}

			getResponseHeader(name: string): string | null {
				return this._inner.getResponseHeader(name);
			}

			overrideMimeType(mime: string) {
				this._inner.overrideMimeType(mime);
			}

			addEventListener(type: string, listener: EventListenerOrEventListenerObject, _options?: boolean | AddEventListenerOptions) {
				this._listeners.push({ type, listener });
			}

			removeEventListener(type: string, listener: EventListenerOrEventListenerObject, _options?: boolean | EventListenerOptions) {
				this._listeners = this._listeners.filter((l) => !(l.type === type && l.listener === listener));
			}

			dispatchEvent(event: Event): boolean {
				this._fire(event.type, event);
				return true;
			}

			private async _handleLoad() {
				if (this._asyncHandled) return;
				this._asyncHandled = true;

				this._status = this._inner.status;
				this._statusText = this._inner.statusText;

				if (!this._matchedHooks.length) {
					this._readyState = 4;
					this._fire("readystatechange");
					this._fire("load");
					this._fire("loadend");
					return;
				}

				const ct = (this._inner.getResponseHeader("content-type") || "").toLowerCase();
				const isJSON =
					this.responseType === "json" ||
					ct.includes("application/json") ||
					ct.includes("+json") ||
					/^\s*[\[{]/.test(this._inner.responseText || "");

				let data: any;
				let text: string | undefined;

				if (isJSON) {
					try {
						if (this.responseType === "json") {
							data = this._inner.response;
						} else {
							data = JSON.parse(this._inner.responseText);
						}
					} catch {
						data = this._inner.response;
					}
				} else {
					data = this._inner.response;
				}

				const hasMutator = this._matchedHooks.some((h) => h.mutator);

				if (!hasMutator) {
					await Promise.all(this._matchedHooks.map((h) => Promise.resolve(h.handler(data, this._url, this as any))));

					this._readyState = 4;
					this._fire("readystatechange");
					this._fire("load");
					this._fire("loadend");
					return;
				}

				for (const h of this._matchedHooks) {
					if (h.mutator) {
						data = await h.handler(data, this._url, this as any);
					} else {
						await h.handler(data, this._url, this as any);
					}
				}

				if (isJSON) {
					try {
						text = typeof data === "string" ? data : JSON.stringify(data);
					} catch {
						text = this._inner.responseText;
					}
				} else {
					text = typeof data === "string" ? data : String(data);
				}

				this._responseOverride = isJSON && this.responseType === "json" ? data : text;
				this._responseTextOverride = text;

				this._readyState = 4;
				this._fire("readystatechange");
				this._fire("load");
				this._fire("loadend");
			}

			private _finalizeError(kind: "error" | "timeout" | "abort") {
				if (this._asyncHandled) return;
				this._asyncHandled = true;

				this._status = this._inner.status;
				this._statusText = this._inner.statusText;

				this._readyState = 4;
				this._fire("readystatechange");
				this._fire(kind);
				this._fire("loadend");
			}

			private _fire(type: string, existingEvent?: Event) {
				const event = existingEvent || new Event(type);

				const prop = ("on" + type) as keyof this;
				const handler = (this as any)[prop];
				if (typeof handler === "function") {
					try {
						handler.call(this, event);
					} catch (e) {
						console.error("HookedXHR handler error", e);
					}
				}

				for (const { type: t, listener } of this._listeners) {
					if (t !== type) continue;
					try {
						if (typeof listener === "function") {
							listener.call(this, event);
						} else if (listener && typeof (listener as any).handleEvent === "function") {
							(listener as any).handleEvent.call(this, event);
						}
					} catch (e) {
						console.error("HookedXHR listener error", e);
					}
				}
			}
		}

		(HookedXHR as any).UNSENT = (OriginalXHR as any).UNSENT;
		(HookedXHR as any).OPENED = (OriginalXHR as any).OPENED;
		(HookedXHR as any).HEADERS_RECEIVED = (OriginalXHR as any).HEADERS_RECEIVED;
		(HookedXHR as any).LOADING = (OriginalXHR as any).LOADING;
		(HookedXHR as any).DONE = (OriginalXHR as any).DONE;

		(HookedXHR.prototype as any).UNSENT = (OriginalXHR as any).UNSENT;
		(HookedXHR.prototype as any).OPENED = (OriginalXHR as any).OPENED;
		(HookedXHR.prototype as any).HEADERS_RECEIVED = (OriginalXHR as any).HEADERS_RECEIVED;
		(HookedXHR.prototype as any).LOADING = (OriginalXHR as any).LOADING;
		(HookedXHR.prototype as any).DONE = (OriginalXHR as any).DONE;

		(window as any).__NativeXMLHttpRequest = OriginalXHR;
		(window as any).XMLHttpRequest = HookedXHR as any;
	},
};

export default xmlHttpRequestHooker;

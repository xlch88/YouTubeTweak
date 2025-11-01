let cloneInto: any; // window.cloneInto

export default {
	handlers: {} as Record<string, (data: any, reply: (data: any) => void) => void>,
	world: "",
	callbackStack: {} as Record<string, (data: any) => void>,

	init(world: string) {
		if (this.world !== "") return;

		// @ts-ignore for firefox https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts/cloneInto
		cloneInto = typeof window.cloneInto === "function" ? window.cloneInto : (data) => data;

		this.world = world;
		window.addEventListener(`yttweak-portal-${this.world}`, (event) => {
			const evt = event as CustomEvent;
			let data;
			try {
				data = JSON.parse(evt.detail);
			} catch {
				return;
			}
			// const data = evt.detail;
			// if (data.fromWorld === this.world) return;

			if (data.type === "worldPortalReply") {
				if (this.callbackStack[data.cbId]) {
					this.callbackStack[data.cbId](data.data);
					delete this.callbackStack[data.cbId];
				}
				return;
			}

			if (this.handlers[data.type]) {
				this.handlers[data.type](data.data, (replyData) => {
					if (!data.cbId) return;
					const detail = {
						fromWorld: this.world,
						type: "worldPortalReply",
						data: replyData,
						cbId: data.cbId,
					};
					window.dispatchEvent(
						new CustomEvent(`yttweak-portal-${this.world === "isolated" ? "main" : "isolated"}`, {
							detail: JSON.stringify(detail),
						}),
					);
				});
			}
		});
	},
	send(type = "", data: any, callback: null | ((data: any) => void) = null) {
		if (!this.world) return;

		let cbId = null;
		if (typeof callback === "function") {
			cbId = crypto.randomUUID();
			this.callbackStack[cbId] = callback;
		}
		const detail = {
			fromWorld: this.world,
			type,
			data,
			cbId,
		};
		window.dispatchEvent(
			new CustomEvent(`yttweak-portal-${this.world === "isolated" ? "main" : "isolated"}`, {
				detail: JSON.stringify(detail),
			}),
		);
	},
};

let cloneInto;

export default {
	handlers: {},
	world: "",
	callbackStack: {},

	init(world) {
		if (this.world !== "") return;

		// @ts-ignore for firefox https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts/cloneInto
		cloneInto = typeof window.cloneInto === "function" ? window.cloneInto : (data) => data;

		this.world = world;
		window.addEventListener(`yttweak-portal-${this.world}`, (evt) => {
			const data = evt.detail;
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
							detail: this.world === "isolated" ? cloneInto(detail, window) : detail,
						}),
					);
				});
			}
		});
	},
	send(type = "", data, callback = null) {
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
				detail: this.world === "isolated" ? cloneInto(detail, window) : detail,
			}),
		);
	},
};

export default {
	handlers: {},
	world: "",
	callbackStack: {},

	init(world) {
		if (this.world !== "") return;
		this.world = world;

		window.addEventListener("message", (evt) => {
			if (evt.source !== window) return;

			const data = evt.data;
			if (data?.from !== "YouTubeTweak-WorldPortal") return;
			if (data.fromWorld === this.world) return;

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

					window.postMessage({
						from: "YouTubeTweak-WorldPortal",
						fromWorld: this.world,
						type: "worldPortalReply",
						data: replyData,
						cbId: data.cbId,
					});
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
		window.postMessage({
			from: "YouTubeTweak-WorldPortal",
			fromWorld: this.world,
			type,
			data,
			cbId,
		});
	},
};

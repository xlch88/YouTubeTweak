const STORAGE_KEY = "settings";

export default {
	init() {
		return new Promise((resolve) => {
			chrome.storage.sync.get(STORAGE_KEY, (res) => {
				if (res[STORAGE_KEY]) {
					this.config = res[STORAGE_KEY];
				} else {
					this.config = {};
				}
				resolve(this.config);
			});
		});
	},
	get(key = null, defaultValue = null) {
		if (key === null) return this.config;

		return this.config[key] ?? defaultValue;
	},
};

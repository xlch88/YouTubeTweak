chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install") {
		chrome.tabs.create({ url: "index.html?action=installed" });
	}
});

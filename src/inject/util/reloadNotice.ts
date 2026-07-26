import wirelessRedstone from "@/inject/wirelessRedstone";
import logoUrl from "@/assets/img/logo.svg?url";
import appleLogoUrl from "@/assets/img/logo_apple.svg?url";

type ReloadNoticeType = "chromeApiOffline" | "reloadOnToggle";

type ReloadNoticeMessages = {
	message: string;
	reloadCurrentPage: string;
	reloadAllYouTubePages: string;
};

export function showReloadNotice(type: ReloadNoticeType) {
	if (window.top !== window) return;

	wirelessRedstone.send("getReloadNoticeMessages", type, (messages: ReloadNoticeMessages) => {
		if (!messages?.message || !messages.reloadCurrentPage) return;

		let container = document.querySelector<HTMLDivElement>("#__yt_tweak_reload_notice");
		if (!container) {
			container = document.createElement("div");
			container.id = "__yt_tweak_reload_notice";
			container.setAttribute("role", "dialog");
			container.setAttribute("aria-live", "polite");
			container.setAttribute("aria-atomic", "true");
			container.setAttribute("aria-labelledby", "__yt_tweak_reload_notice_message");
			container.style.setProperty("--yttweak-notice-logo", `url("${__APP_BRANDING__.isSafari ? appleLogoUrl : logoUrl}")`);
			document.body.appendChild(container);
		}
		container.dataset.noticeType = type;

		const tips = document.createElement("p");
		tips.id = "__yt_tweak_reload_notice_message";
		tips.textContent = messages.message;

		const actions = document.createElement("div");
		actions.className = "actions";

		const reloadCurrentPageButton = document.createElement("button");
		reloadCurrentPageButton.type = "button";
		reloadCurrentPageButton.className = "reload-current";
		reloadCurrentPageButton.textContent = messages.reloadCurrentPage;
		reloadCurrentPageButton.onclick = () => location.reload();
		actions.appendChild(reloadCurrentPageButton);

		if (type === "reloadOnToggle" && messages.reloadAllYouTubePages) {
			const reloadAllYouTubePagesButton = document.createElement("button");
			reloadAllYouTubePagesButton.type = "button";
			reloadAllYouTubePagesButton.className = "reload-all";
			reloadAllYouTubePagesButton.textContent = messages.reloadAllYouTubePages;
			reloadAllYouTubePagesButton.onclick = () => wirelessRedstone.send("reloadAllYouTubeTabs", true);
			actions.appendChild(reloadAllYouTubePagesButton);
		}

		container.replaceChildren(tips, actions);
	});
}

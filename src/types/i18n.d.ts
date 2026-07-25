import "wxt/browser";

declare module "wxt/browser" {
	interface WxtI18n {
		getMessage(
			messageName:
				| "reload_notice_chrome_api_offline"
				| "reload_notice_on_toggle"
				| "reload_notice_current_page"
				| "reload_notice_all_youtube_pages",
			substitutions?: string | string[],
		): string;
	}
}

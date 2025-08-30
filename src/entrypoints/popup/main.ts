import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import "./app.scss";
import { initI18n } from "./util/i18n";
import { configPlugin } from "./util/config";

declare global {
	const __APP_INFO__: { version: string; build: string };
	interface Window {
		__APP_INFO__: typeof __APP_INFO__;
		browser: typeof browser;
	}
}

window.__APP_INFO__ = __APP_INFO__;
window.browser = window.browser || window.chrome;

const app = createApp(App);
const pinia = createPinia();

if (import.meta.env.DEV) app.config.performance = true;

pinia.use(configPlugin);
app.use(pinia);

initI18n().then((i18n) => {
	app.use(i18n);
	app.mount("#app");
	document.querySelector("body > .loading")?.remove();
});

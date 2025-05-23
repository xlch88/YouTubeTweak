import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import "./app.scss";
import { initI18n } from "./util/i18n.js";
import { configPlugin } from "./util/config.js";

const app = createApp(App);
const pinia = createPinia();

app.config.devtools = true;

pinia.use(configPlugin);
app.use(pinia);

initI18n().then((i18n) => {
	app.use(i18n);
	app.mount("body");
});

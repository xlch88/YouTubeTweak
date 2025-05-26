import wirelessRedstone from "../wirelessRedstone.js";
import { isDEV } from "../../logger.js";

export default {
	"yttweak.enableChromeApiStatusChecker": {
		enable() {
			wirelessRedstone.handlers.chromeApiOffline = () => {
				const container = document.createElement("div");
				container.id = "__yt_tweak_update_notice";

				const tips = document.createElement("p");
				tips.textContent = "YouTubeTweak is update!\nPlease reload the page.";

				const button = document.createElement("button");
				button.textContent = "Reload Now";
				button.onclick = () => location.reload();

				container.appendChild(tips);
				container.appendChild(button);
				document.body.appendChild(container);

				// mode === "development" only
				if (isDEV) {
					location.reload();
				}
			};
			wirelessRedstone.send("enableChromeApiStatusChecker", true);
		},
	},
};

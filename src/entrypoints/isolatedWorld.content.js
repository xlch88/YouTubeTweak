import { defineContentScript } from "wxt/utils/define-content-script";
import isolatedWorld from "../inject/isolatedWorld.js";

export default defineContentScript({
	world: "ISOLATED",
	allFrames: true,
	runAt: "document_start",
	matches: ["*://*.youtube.com/*"],
	registration: "manifest",
	main: isolatedWorld,
});

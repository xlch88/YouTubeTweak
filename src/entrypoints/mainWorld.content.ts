import { defineContentScript } from "wxt/utils/define-content-script";
import mainWorld from "../inject/mainWorld";

export default defineContentScript({
	world: "MAIN",
	allFrames: true,
	runAt: "document_start",
	matches: ["*://*.youtube.com/*"],
	registration: "manifest",
	main: mainWorld,
});

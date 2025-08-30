import { defineContentScript } from "wxt/utils/define-content-script";
// @ts-ignore
import isolatedWorld from "../inject/isolatedWorld";

let contentScript;
contentScript = defineContentScript({
	world: "ISOLATED",
	allFrames: true,
	runAt: "document_start",
	matches: ["*://*.youtube.com/*"],
	registration: "manifest",
	main: isolatedWorld,
});

export default contentScript;

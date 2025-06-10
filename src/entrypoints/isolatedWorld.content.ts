import { defineContentScript } from "wxt/utils/define-content-script";
// @ts-ignore
import isolatedWorld from "../inject/isolatedWorld.js";

let contentScript;
contentScript = defineContentScript({
	world: "ISOLATED",
	allFrames: true,
	runAt: "document_start",
	matches: ["*://*.youtube.com/*"],
	registration: "manifest",
	include: ["chrome"],
	main: isolatedWorld,
});

export default contentScript;

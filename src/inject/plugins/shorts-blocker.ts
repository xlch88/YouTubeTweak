import { bodyClass } from "../util/helper";
import type { Plugin } from "../types";

export default {
	"shorts-blocker.enable.index": bodyClass("yttweak-shorts-blocker-index"),
	"shorts-blocker.enable.watch": bodyClass("yttweak-shorts-blocker-watch"),
	"shorts-blocker.enable.menu": bodyClass("yttweak-shorts-blocker-menu"),
} as Record<string, Plugin>;

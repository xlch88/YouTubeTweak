import config from "../config";
import { videoPlayer } from "../mainWorld";

import type { PlayerButtonCollapseMode } from "@/defaultConfig";

function getOuterWidth(element: Element | null) {
	if (!element) return 0;

	const style = getComputedStyle(element);
	if (style.display === "none" || style.visibility === "hidden") return 0;

	return (
		element.getBoundingClientRect().width +
		(Number.parseFloat(style.marginLeft) || 0) +
		(Number.parseFloat(style.marginRight) || 0)
	);
}

export function shouldCollapsePlayerControls(mode: PlayerButtonCollapseMode) {
	if (mode === "always") return true;
	if (mode === "never") return false;

	const controls = videoPlayer.controls;
	const leftControls = controls?.querySelector(".ytp-left-controls");
	const rightControls = controls?.querySelector(".ytp-right-controls");
	if (!controls || !leftControls || !rightControls) return false;

	const speedButtons = controls.querySelector(".yttweak-speed-buttons");
	const functionButtons = leftControls.querySelector(".yttweak-player-function-buttons");
	const speedMeasureClass =
		config.get("player.ui.collapseSpeedButtons") === "always"
			? "yttweak-measure-speed-buttons-collapsed"
			: "yttweak-measure-speed-buttons-expanded";
	const functionMeasureClass =
		config.get("player.ui.functionButtons.collapseButtons") === "always"
			? "yttweak-measure-function-buttons-collapsed"
			: "yttweak-measure-function-buttons-expanded";

	speedButtons?.classList.add(speedMeasureClass);
	functionButtons?.classList.add(functionMeasureClass);
	try {
		const leftControlsWidth = Array.from(leftControls.children).reduce(
			(width, element) =>
				width +
				(element.matches(".ytp-volume-area")
					? Math.max(getOuterWidth(element), 120)
					: getOuterWidth(element)),
			0,
		);
		const requiredWidth = leftControlsWidth + getOuterWidth(speedButtons) + getOuterWidth(rightControls);
		return requiredWidth >= controls.getBoundingClientRect().width;
	} finally {
		speedButtons?.classList.remove(speedMeasureClass);
		functionButtons?.classList.remove(functionMeasureClass);
	}
}

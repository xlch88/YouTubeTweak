import { bodyClass } from "../util/helper";
import config from "../config";
import { createLogger } from "../../logger";

import type { Plugin } from "../types";

const logger = createLogger("comment-nickname");

function handleNickname(v: HTMLElement) {
	let author = v.querySelector<HTMLDivElement | HTMLAnchorElement>("#author-comment-badge"),
		url: string,
		username: string;
	if (author && author.childElementCount > 0) {
		url = author.querySelector<HTMLAnchorElement>("a#name")?.href || "";
		username = author.querySelector<HTMLElement>("yt-formatted-string")?.title || "";
		author = author.querySelector("yt-formatted-string");
	} else {
		author = v.querySelector<HTMLAnchorElement>("#author-text");
		url = author?.href || "";
		username = author?.querySelector("span")?.innerText.trim() || "";
	}

	fetch(url)
		.then((v) => {
			return v.text();
		})
		.then((v) => {
			const result = /<meta property="og:title" content="(.*?)">/.exec(v);
			if (result) {
				const nicknameNode = document.createElement("span");
				nicknameNode.textContent = result[1];
				nicknameNode.className = "yttweak-comment-nickname";

				const usernameNode = document.createElement("span");
				usernameNode.textContent = username;
				usernameNode.className = "yttweak-comment-username";

				author?.replaceChildren(nicknameNode, usernameNode);
				logger.log(`nickname:`, username, `->`, nicknameNode.textContent);
			}
		})
		.catch((e) => {
			logger.error("nickname error:", e);
		});
}

export default {
	"comment.autoShowMore": bodyClass("yttweak-comment-auto-more"),
	"comment.nickname": {
		options: {
			reloadOnToggle: true,
		},

		enable() {},
		disable() {},
		initComments(commentEl, setUpdateListener) {
			if (!config.get("comment.nickname")) return;

			commentEl.querySelectorAll("ytd-comment-view-model").forEach((v) => {
				handleNickname(v as HTMLElement);
			});

			setUpdateListener((mutations) => {
				for (const mutation of mutations) {
					if (mutation.type === "childList") {
						mutation.addedNodes.forEach((node) => {
							const div = node as HTMLDivElement;
							const tagName = div?.tagName?.toLowerCase();
							if (tagName === "ytd-comment-view-model" || tagName === "ytd-comment-thread-renderer") {
								handleNickname(div);
							}
						});
					}
				}
			});
		},
	} as Plugin,
};

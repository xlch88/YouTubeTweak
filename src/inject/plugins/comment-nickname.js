import { bodyClass } from "../util/helper.js";
import config from "../config.js";
import { createLogger } from "../../logger.js";
const logger = createLogger("comment-nickname");

function handleNickname(v) {
	let author = v.querySelector("#author-comment-badge"),
		url,
		username;
	if (author && author.childElementCount > 0) {
		url = author.querySelector("a#name").href;
		username = author.querySelector("yt-formatted-string").title;
		author = author.querySelector("yt-formatted-string");
	} else {
		author = v.querySelector("#author-text");
		url = author.href;
		username = author.querySelector("span").innerText.trim();
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

				author.replaceChildren(nicknameNode, usernameNode);
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
				handleNickname(v);
			});

			setUpdateListener((mutations) => {
				for (const mutation of mutations) {
					if (mutation.type === "childList") {
						mutation.addedNodes.forEach((v) => {
							if (v?.tagName?.toLowerCase() === "ytd-comment-view-model") {
								handleNickname(v);
							}
						});
					}
				}
			});
		},
	},
};

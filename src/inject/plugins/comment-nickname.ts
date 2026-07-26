import { bodyClass } from "../util/helper";
import config from "../config";
import { createLogger } from "../../logger";

import type { Plugin } from "../types";

const AUTHOR_SELECTOR = "#author-text, #author-comment-badge, #author-thumbnail";
const logger = createLogger("comment-nickname");
const nicknameRequestUrls = new WeakMap<HTMLElement, string>();

function getAuthorDetails(comment: HTMLElement) {
	const authorBadge = comment.querySelector<HTMLElement>("#author-comment-badge");
	if (authorBadge?.childElementCount) {
		const link = authorBadge.querySelector<HTMLAnchorElement>("a#name");
		const usernameNode = link?.querySelector<HTMLElement>("yt-formatted-string");
		if (!link || !usernameNode) return;

		return {
			link,
			usernameNode,
			url: link.href,
			username: usernameNode.title.trim() || usernameNode.innerText.trim(),
		};
	}

	const link = comment.querySelector<HTMLAnchorElement>("#author-text");
	const usernameNode = link?.querySelector<HTMLElement>("span:not(.yttweak-comment-nickname)");
	if (!link || !usernameNode) return;

	return {
		link,
		usernameNode,
		url: link.href,
		username: usernameNode.innerText.trim(),
	};
}

function handleNickname(v: HTMLElement) {
	const comment = v.matches("ytd-comment-view-model") ? v : v.querySelector<HTMLElement>("ytd-comment-view-model");
	if (!comment) return;

	const author = getAuthorDetails(comment);
	if (!author?.url) return;

	const nicknameNode = author.link.querySelector<HTMLElement>(".yttweak-comment-nickname");
	if (nicknameNode?.dataset.yttweakChannelUrl === author.url || nicknameRequestUrls.get(comment) === author.url) return;

	nicknameRequestUrls.set(comment, author.url);
	nicknameNode?.remove();

	fetch(author.url)
		.then((response) => {
			return response.text();
		})
		.then((html) => {
			const result = /<meta property="og:title" content="(.*?)">/.exec(html);
			const currentAuthor = getAuthorDetails(comment);
			if (
				!result ||
				!currentAuthor ||
				!comment.isConnected ||
				currentAuthor.url !== author.url ||
				nicknameRequestUrls.get(comment) !== author.url
			) {
				return;
			}

			currentAuthor.link.querySelector(".yttweak-comment-nickname")?.remove();

			const currentNicknameNode = document.createElement("span");
			currentNicknameNode.textContent = result[1];
			currentNicknameNode.className = "yttweak-comment-nickname";
			currentNicknameNode.dataset.yttweakChannelUrl = author.url;

			currentAuthor.usernameNode.classList.add("yttweak-comment-username");
			currentAuthor.usernameNode.before(currentNicknameNode);
			logger.log(`nickname:`, currentAuthor.username, `->`, currentNicknameNode.textContent);
		})
		.catch((e) => {
			logger.error("nickname error:", e);
		})
		.finally(() => {
			if (nicknameRequestUrls.get(comment) === author.url) {
				nicknameRequestUrls.delete(comment);
			}
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
				const comments = new Set<HTMLElement>();

				for (const mutation of mutations) {
					if (mutation.type !== "childList") continue;

					mutation.addedNodes.forEach((node) => {
						if (!(node instanceof HTMLElement)) return;

						if (node.matches("ytd-comment-view-model")) {
							comments.add(node);
						}
						node.querySelectorAll<HTMLElement>("ytd-comment-view-model").forEach((comment) => comments.add(comment));
					});

					const target = mutation.target as HTMLElement;
					const comment = target?.closest?.<HTMLElement>("ytd-comment-view-model");
					if (!comment) continue;

					const authorChanged =
						Boolean(target.closest(AUTHOR_SELECTOR)) ||
						[...mutation.addedNodes, ...mutation.removedNodes].some(
							(node) =>
								node instanceof Element && (node.matches(AUTHOR_SELECTOR) || Boolean(node.querySelector(AUTHOR_SELECTOR))),
						);
					const commentTextChanged =
						target.nodeName === "SPAN" &&
						target.classList.contains("ytAttributedStringHost") &&
						Array.from(mutation.removedNodes).some((node) => node.nodeType === Node.TEXT_NODE);

					if (authorChanged || commentTextChanged) {
						comments.add(comment);
					}
				}

				comments.forEach((comment) => handleNickname(comment));
			});
		},
	} as Plugin,
};

import config from "../config";
import type { Plugin } from "../types";
import "./comment-blockedUsers.scss";

let blockedUsers = new Set<string>();

function updateComment(comment: HTMLElement) {
	const author =
		comment.querySelector<HTMLAnchorElement>("#author-comment-badge a#name") ||
		comment.querySelector<HTMLAnchorElement>("#author-text");
	let handle = "";
	try {
		handle = decodeURIComponent(new URL(author?.getAttribute("href") || "", location.href).pathname.slice(1));
	} catch {
		// A malformed author URL must not interrupt filtering the remaining comments.
	}
	if (!handle.startsWith("@")) {
		handle =
			author
				?.querySelector<HTMLElement>(".yttweak-comment-username, span:not(.yttweak-comment-nickname), yt-formatted-string")
				?.textContent?.trim() || "";
	}
	const thread = comment.closest<HTMLElement>("ytd-comment-thread-renderer");
	const target = thread?.querySelector("ytd-comment-view-model, ytd-comment-renderer") === comment ? thread : comment;
	target.classList.toggle("yttweak-comment-blocked", blockedUsers.has(handle.normalize("NFC").toLowerCase()));
}

function updateBlockedUsers() {
	blockedUsers = new Set(
		config
			.get("comment.blockedUsers", "")
			.split(/\r?\n/)
			.map((line) => line.trim().normalize("NFC").toLowerCase())
			.filter((line) => /^@\S+$/.test(line)),
	);
	document
		.querySelectorAll<HTMLElement>(".yttweak-comment-blocked")
		.forEach((element) => element.classList.remove("yttweak-comment-blocked"));
	document.querySelectorAll<HTMLElement>("ytd-comment-view-model, ytd-comment-renderer").forEach(updateComment);
}

export default {
	"comment.blockedUsers": {
		enable: updateBlockedUsers,
		disable: updateBlockedUsers,
		setup() {
			new MutationObserver((mutations) => {
				if (!blockedUsers.size) return;
				const comments = new Set<HTMLElement>();
				for (const mutation of mutations) {
					const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
					const comment = target?.closest<HTMLElement>("ytd-comment-view-model, ytd-comment-renderer");
					if (comment) comments.add(comment);
					for (const node of mutation.addedNodes) {
						if (!(node instanceof HTMLElement)) continue;
						if (node.matches("ytd-comment-view-model, ytd-comment-renderer")) comments.add(node);
						node.querySelectorAll<HTMLElement>("ytd-comment-view-model, ytd-comment-renderer").forEach((item) =>
							comments.add(item),
						);
					}
				}
				comments.forEach(updateComment);
			}).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["href"] });
		},
	},
} satisfies Record<string, Plugin>;

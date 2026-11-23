import type { MemoryChange, MemoryFields, MemoryReply, MemoryRequest } from "@/memory";
import wirelessRedstone from "./wirelessRedstone";

function requestMemory(request: MemoryRequest): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			if (callbackId) delete wirelessRedstone.callbackStack[callbackId];
			reject(new Error("YouTubeTweak: Memory save could not be confirmed. Please try again."));
		}, 10000);
		const callbackId = wirelessRedstone.send("memoryRequest", request, (reply: MemoryReply) => {
			clearTimeout(timer);
			if (reply?.ok) resolve(reply.value);
			else {
				console.error("[YTTweak] Memory request failed:", reply);
				const detail = !reply?.ok && reply?.error ? reply.error.replace(/^Error:\s*/, "") : "";
				const message =
					reply?.message && detail && reply.message !== detail
						? `${reply.message} (${detail})`
						: reply?.message || detail || "Memory request failed";
				reject(new Error(message));
			}
		});
	});
}

export default {
	async get<K extends keyof MemoryFields>(channelId: string, key: K, area: "sync" | "local" = "sync"): Promise<MemoryFields[K] | null> {
		try {
			return (await requestMemory({ action: "get", area, channelId, key })) as MemoryFields[K] | null;
		} catch (error) {
			console.error("[YTTweak] Failed to read memory:", error);
			return null;
		}
	},
	async setMany(changes: MemoryChange[], area: "sync" | "local" = "sync") {
		if (!changes.length) return true;
		try {
			await requestMemory({ action: "set", area, changes });
			return true;
		} catch (error) {
			console.error("[YTTweak] Failed to save memory:", error);
			let notice = document.getElementById("yttweak-memory-error");
			if (!notice) {
				notice = document.createElement("div");
				notice.id = "yttweak-memory-error";
				notice.setAttribute("role", "alert");
				(document.body || document.documentElement).appendChild(notice);
			}
			const message = document.createElement("span");
			message.textContent = error instanceof Error ? error.message : String(error);
			const dismiss = document.createElement("button");
			dismiss.type = "button";
			dismiss.textContent = "×";
			dismiss.onclick = () => notice.remove();
			notice.replaceChildren(message, dismiss);
			return false;
		}
	},
};

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pkg from "../package.json";

type StoreName = "chrome" | "edge" | "firefox";

interface StoresConfigFile {
	chrome?: {
		publisherId?: string;
		extensionId?: string;
		serviceAccountFile?: string;
	};
	edge?: {
		productId?: string;
		clientId?: string;
		apiKey?: string;
	};
	firefox?: {
		extensionId?: string;
		jwtIssuer?: string;
		jwtSecret?: string;
	};
}

interface ServiceAccountJson {
	client_email: string;
	private_key: string;
	token_uri?: string;
}

interface ChangelogEntry {
	scope: string;
	text: string;
}

interface ChangelogLang {
	added?: ChangelogEntry[];
	updated?: ChangelogEntry[];
	fixed?: ChangelogEntry[];
}

interface ChangelogFile {
	releases?: Array<{
		version: string;
		date: string;
		changes?: Partial<Record<"zh-CN" | "en" | "ja", ChangelogLang>>;
	}>;
}

const ALL_STORES: StoreName[] = ["chrome", "edge", "firefox"];
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 80;

function parseArgs(argv: string[]) {
	let only: StoreName[] = [...ALL_STORES];
	let dryRun = false;
	let draft = false;
	let version = pkg.version;
	let configPath = process.env.STORE_CONFIG_PATH || ".secret/stores.json";
	let customNotes = "";

	for (const arg of argv) {
		if (arg === "--help" || arg === "-h") {
			console.log(`Usage: npm run pushstore -- [options]

Options:
  --only=chrome,edge,firefox   Publish only to the specified stores (default: all)
  --dry-run                    Validate artifacts, credentials, and read-only auth without uploading
  --draft                      Upload packages without submitting for store review
  --version=<version>          Override version used to locate .output artifacts (default: package.json)
  --notes=<text>               Additional notes for store reviewers
  --config=<path>              Path to local stores config JSON (default: .secret/stores.json)
`);
			process.exit(0);
		} else if (arg === "--dry-run") {
			dryRun = true;
		} else if (arg === "--draft") {
			draft = true;
		} else if (arg.startsWith("--only=")) {
			const parsed = arg
				.slice("--only=".length)
				.split(",")
				.map((s) => s.trim().toLowerCase())
				.filter(Boolean);
			for (const name of parsed) {
				if (!ALL_STORES.includes(name as StoreName)) {
					throw new Error(`Unknown store "${name}". Supported values: ${ALL_STORES.join(", ")}`);
				}
			}
			if (parsed.length === 0) throw new Error("--only must specify at least one store");
			only = [...new Set(parsed)] as StoreName[];
		} else if (arg.startsWith("--version=")) {
			version = arg.slice("--version=".length).trim();
		} else if (arg.startsWith("--config=")) {
			configPath = arg.slice("--config=".length).trim();
		} else if (arg.startsWith("--notes=")) {
			customNotes = arg.slice("--notes=".length).trim();
		} else {
			throw new Error(`Unknown option: ${arg}`);
		}
	}

	return { only, dryRun, draft, version, configPath, customNotes };
}

function loadConfigFile(configPath: string): StoresConfigFile {
	if (!fs.existsSync(configPath)) return {};
	return JSON.parse(fs.readFileSync(configPath, "utf8")) as StoresConfigFile;
}

function requireFile(filePath: string): Buffer {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Artifact not found: ${filePath}`);
	}
	const buf = fs.readFileSync(filePath);
	if (buf.length === 0) {
		throw new Error(`Artifact is empty: ${filePath}`);
	}
	return buf;
}

function listZipEntries(zipBuf: Buffer): string[] {
	// Locate End of Central Directory (EOCD) signature 0x06054b50 from the tail
	const minOffset = Math.max(0, zipBuf.length - 65557);
	let eocdOffset = -1;
	for (let i = zipBuf.length - 22; i >= minOffset; i--) {
		if (zipBuf.readUInt32LE(i) === 0x06054b50) {
			eocdOffset = i;
			break;
		}
	}
	if (eocdOffset < 0) throw new Error("Invalid ZIP archive: EOCD signature not found");

	const entryCount = zipBuf.readUInt16LE(eocdOffset + 10);
	let offset = zipBuf.readUInt32LE(eocdOffset + 16);
	const names: string[] = [];

	for (let i = 0; i < entryCount; i++) {
		if (offset + 46 > zipBuf.length || zipBuf.readUInt32LE(offset) !== 0x02014b50) {
			throw new Error("Invalid ZIP archive: corrupt central directory entry");
		}
		const nameLen = zipBuf.readUInt16LE(offset + 28);
		const extraLen = zipBuf.readUInt16LE(offset + 30);
		const commentLen = zipBuf.readUInt16LE(offset + 32);
		names.push(zipBuf.subarray(offset + 46, offset + 46 + nameLen).toString("utf8"));
		offset += 46 + nameLen + extraLen + commentLen;
	}
	return names;
}

function assertSourcesZipSafe(sourcesZipBuf: Buffer) {
	const entries = listZipEntries(sourcesZipBuf);
	const forbidden = entries.filter((name) => /(^|\/)(\.secret|\.env(\.|$)|stores\.json|chrome-web-store\.pem)/i.test(name));
	if (forbidden.length > 0) {
		throw new Error(`Refusing to upload sources.zip containing sensitive files: ${forbidden.join(", ")}`);
	}
}

function formatChangelogLang(lang: ChangelogLang | undefined, headings: { added: string; updated: string; fixed: string }): string {
	if (!lang) return "";
	const sections: string[] = [];
	for (const key of ["updated", "added", "fixed"] as const) {
		const items = lang[key];
		if (!items?.length) continue;
		const lines = items.map((item) => `- ${item.scope}: ${item.text}`);
		sections.push(`${headings[key]}\n${lines.join("\n")}`);
	}
	return sections.join("\n\n");
}

function buildStoreNotes(version: string, customNotes: string) {
	let release: NonNullable<ChangelogFile["releases"]>[number] | undefined;
	if (fs.existsSync("changelog.json")) {
		const changelog = JSON.parse(fs.readFileSync("changelog.json", "utf8")) as ChangelogFile;
		const baseVersion = version.split(".").slice(0, 3).join(".");
		release =
			changelog.releases?.find((r) => r.version === version) ||
			changelog.releases?.find((r) => r.version === baseVersion);
	}

	const firefoxReleaseNotes: Record<string, string> = {};
	const zhText = formatChangelogLang(release?.changes?.["zh-CN"], { added: "添加", updated: "更新", fixed: "修复" });
	const enText = formatChangelogLang(release?.changes?.en, { added: "Added", updated: "Updated", fixed: "Fixed" });
	const jaText = formatChangelogLang(release?.changes?.ja, { added: "追加", updated: "更新", fixed: "修正" });

	if (zhText) firefoxReleaseNotes["zh-CN"] = zhText;
	if (enText) firefoxReleaseNotes["en-US"] = enText;
	if (jaText) firefoxReleaseNotes.ja = jaText;

	const firefoxApprovalNotes = [
		"Build instructions to reproduce the extension package from sources.zip:",
		"1. Environment: Node.js 24 LTS and npm",
		"2. Install dependencies: npm ci",
		"3. Build Firefox extension: npm run build:firefox",
		"4. Output package: .output/youtube-tweak-<version>-firefox.zip",
		...(customNotes ? ["", `Additional notes: ${customNotes}`] : []),
	].join("\n");

	const edgeParts = [
		`Release v${version}`,
		...(enText ? [enText] : []),
		...(customNotes ? [`Additional notes: ${customNotes}`] : []),
	];
	const edgeNotes = edgeParts.join("\n\n").slice(0, 1000);

	return { firefoxReleaseNotes, firefoxApprovalNotes, edgeNotes };
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function base64url(input: string | Buffer): string {
	return Buffer.from(input).toString("base64url");
}

async function readResponseBody(res: Response): Promise<{ text: string; json: Record<string, unknown> | null }> {
	const text = await res.text();
	if (!text) return { text: "", json: null };
	try {
		return { text, json: JSON.parse(text) as Record<string, unknown> };
	} catch {
		return { text, json: null };
	}
}

async function publishChrome(opts: {
	config: StoresConfigFile;
	version: string;
	dryRun: boolean;
	draft: boolean;
}) {
	const publisherId = process.env.CHROME_PUBLISHER_ID || opts.config.chrome?.publisherId;
	const extensionId = process.env.CHROME_EXTENSION_ID || opts.config.chrome?.extensionId || "malfbchbmmlhkjjbepjodfkmnbngckoi";
	const saInput = process.env.CHROME_SERVICE_ACCOUNT_JSON || opts.config.chrome?.serviceAccountFile;

	if (!publisherId || !saInput) {
		throw new Error("Missing Chrome credentials (publisherId / serviceAccountFile or CHROME_* env vars)");
	}

	const sa = (
		saInput.trim().startsWith("{") ? JSON.parse(saInput) : JSON.parse(fs.readFileSync(saInput, "utf8"))
	) as ServiceAccountJson;
	if (!sa.client_email || !sa.private_key) {
		throw new Error("Invalid Google Service Account JSON: missing client_email or private_key");
	}

	const crxPath = path.join(".output", `${pkg.name}-${opts.version}-chrome.crx`);
	const crxBuf = requireFile(crxPath);
	console.log(`[chrome] Package: ${crxPath} (${crxBuf.length} bytes)`);

	const tokenUri = sa.token_uri || "https://oauth2.googleapis.com/token";
	const now = Math.floor(Date.now() / 1000);
	const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(
		JSON.stringify({
			iss: sa.client_email,
			scope: "https://www.googleapis.com/auth/chromewebstore",
			aud: tokenUri,
			iat: now,
			exp: now + 3600,
		}),
	)}`;
	const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), sa.private_key).toString("base64url");

	const tokenRes = await fetch(tokenUri, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
			assertion: `${unsigned}.${signature}`,
		}),
	});
	const tokenBody = await readResponseBody(tokenRes);
	const accessToken = typeof tokenBody.json?.access_token === "string" ? tokenBody.json.access_token : "";
	if (!tokenRes.ok || !accessToken) {
		throw new Error(`Chrome OAuth token exchange failed (${tokenRes.status}): ${tokenBody.text}`);
	}

	const itemBase = `publishers/${publisherId}/items/${extensionId}`;
	const statusUrl = `https://chromewebstore.googleapis.com/v2/${itemBase}:fetchStatus`;
	const fetchStatus = async () => {
		const res = await fetch(statusUrl, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		const body = await readResponseBody(res);
		if (!res.ok) {
			throw new Error(`Chrome fetchStatus failed (${res.status}): ${body.text}`);
		}
		return body.json || {};
	};

	const currentStatus = await fetchStatus();
	const publishedChannels = (
		currentStatus.publishedItemRevisionStatus as { distributionChannels?: Array<{ crxVersion?: string }> } | undefined
	)?.distributionChannels;
	const submittedChannels = (
		currentStatus.submittedItemRevisionStatus as { state?: string; distributionChannels?: Array<{ crxVersion?: string }> } | undefined
	);
	console.log(
		`[chrome] Current store status: published=${publishedChannels?.[0]?.crxVersion ?? "none"}, submitted=${submittedChannels?.state ?? "none"}`,
	);

	if (opts.dryRun) {
		console.log("[chrome] Dry-run check passed.");
		return;
	}

	const uploadUrl = `https://chromewebstore.googleapis.com/upload/v2/${itemBase}:upload`;
	console.log("[chrome] Uploading CRX package...");
	const uploadRes = await fetch(uploadUrl, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"X-Goog-Upload-Protocol": "raw",
			"X-Goog-Upload-File-Name": path.basename(crxPath),
			"Content-Type": "application/octet-stream",
		},
		body: new Uint8Array(crxBuf),
	});
	const uploadBody = await readResponseBody(uploadRes);
	if (!uploadRes.ok) {
		throw new Error(`Chrome upload failed (${uploadRes.status}): ${uploadBody.text}`);
	}

	let uploadState = String(uploadBody.json?.uploadState || "");
	const uploadedVersion = String(uploadBody.json?.crxVersion || "");
	console.log(`[chrome] Upload response: crxVersion=${uploadedVersion || "(pending)"}, uploadState=${uploadState}`);

	if (uploadState === "IN_PROGRESS" || uploadState === "UPLOAD_IN_PROGRESS") {
		for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
			await sleep(POLL_INTERVAL_MS);
			const st = await fetchStatus();
			uploadState = String(st.lastAsyncUploadState || "");
			console.log(`[chrome] Poll upload (${attempt}/${MAX_POLL_ATTEMPTS}): lastAsyncUploadState=${uploadState}`);
			if (uploadState === "SUCCEEDED" || uploadState === "UPLOAD_COMPLETE") break;
			if (uploadState === "FAILED" || uploadState === "FAILURE") {
				throw new Error(`Chrome async upload failed: ${JSON.stringify(st)}`);
			}
		}
	}

	if (uploadState && !["SUCCEEDED", "UPLOAD_COMPLETE"].includes(uploadState)) {
		throw new Error(`Chrome upload did not succeed (state=${uploadState}): ${uploadBody.text}`);
	}

	if (opts.draft) {
		console.log("[chrome] Draft uploaded (review submission skipped due to --draft).");
		return;
	}

	const publishUrl = `https://chromewebstore.googleapis.com/v2/${itemBase}:publish`;
	console.log("[chrome] Submitting for review...");
	const publishRes = await fetch(publishUrl, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ publishType: "DEFAULT_PUBLISH" }),
	});
	const publishBody = await readResponseBody(publishRes);
	if (!publishRes.ok) {
		throw new Error(`Chrome publish failed (${publishRes.status}): ${publishBody.text}`);
	}
	console.log(`[chrome] Submitted successfully: state=${String(publishBody.json?.state || "OK")}`);
}

async function publishEdge(opts: {
	config: StoresConfigFile;
	version: string;
	dryRun: boolean;
	draft: boolean;
	notes: string;
}) {
	const productId = process.env.EDGE_PRODUCT_ID || opts.config.edge?.productId;
	const clientId = process.env.EDGE_CLIENT_ID || opts.config.edge?.clientId;
	const apiKey = process.env.EDGE_API_KEY || opts.config.edge?.apiKey;

	if (!productId || !clientId || !apiKey) {
		throw new Error("Missing Edge credentials (productId / clientId / apiKey or EDGE_* env vars)");
	}

	const zipPath = path.join(".output", `${pkg.name}-${opts.version}-edge.zip`);
	const zipBuf = requireFile(zipPath);
	console.log(`[edge] Package: ${zipPath} (${zipBuf.length} bytes)`);

	const authHeaders = {
		Authorization: `ApiKey ${apiKey}`,
		"X-ClientID": clientId,
	};
	const apiBase = `https://api.addons.microsoftedge.microsoft.com/v1/products/${productId}`;

	const explainEdgeStatus = (stage: string, status: number, text: string) => {
		if (status === 401) {
			return `Edge ${stage} failed (401 Unauthorized): Edge Publish API v1.1 API Key may be expired (72-day limit); regenerate it in Microsoft Partner Center.`;
		}
		return `Edge ${stage} failed (${status}): ${text}`;
	};

	if (opts.dryRun) {
		const probeRes = await fetch(`${apiBase}/submissions/draft/package/operations/00000000-0000-0000-0000-000000000000`, {
			headers: authHeaders,
		});
		if (probeRes.status === 401 || probeRes.status === 403) {
			throw new Error(explainEdgeStatus("auth check", probeRes.status, await probeRes.text()));
		}
		console.log(`[edge] Dry-run auth check passed (probe status=${probeRes.status}).`);
		return;
	}

	console.log("[edge] Uploading draft package...");
	const uploadRes = await fetch(`${apiBase}/submissions/draft/package`, {
		method: "POST",
		headers: {
			...authHeaders,
			"Content-Type": "application/zip",
		},
		body: new Uint8Array(zipBuf),
	});
	const uploadBody = await readResponseBody(uploadRes);
	if (!uploadRes.ok) {
		throw new Error(explainEdgeStatus("package upload", uploadRes.status, uploadBody.text));
	}

	const uploadLocation = uploadRes.headers.get("Location")?.trim() || "";
	const uploadOpId = uploadLocation.split("/").filter(Boolean).pop();
	if (!uploadOpId) {
		throw new Error("Edge package upload did not return an operation ID in Location header");
	}
	console.log(`[edge] Upload accepted (operationId=${uploadOpId}), polling validation...`);

	let uploadDone = false;
	for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
		await sleep(POLL_INTERVAL_MS);
		const pollRes = await fetch(`${apiBase}/submissions/draft/package/operations/${uploadOpId}`, {
			headers: authHeaders,
		});
		const pollBody = await readResponseBody(pollRes);
		if (!pollRes.ok) {
			throw new Error(explainEdgeStatus("upload status poll", pollRes.status, pollBody.text));
		}
		const status = String(pollBody.json?.status || "");
		console.log(`[edge] Poll upload (${attempt}/${MAX_POLL_ATTEMPTS}): status=${status}`);
		if (status === "Succeeded") {
			uploadDone = true;
			break;
		}
		if (status === "Failed") {
			throw new Error(`Edge package validation failed: ${pollBody.text}`);
		}
	}
	if (!uploadDone) {
		throw new Error("Edge package validation timed out");
	}

	if (opts.draft) {
		console.log("[edge] Draft uploaded and validated (review submission skipped due to --draft).");
		return;
	}

	console.log("[edge] Submitting for certification review...");
	const publishRes = await fetch(`${apiBase}/submissions`, {
		method: "POST",
		headers: {
			...authHeaders,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ notes: opts.notes }),
	});
	const publishBody = await readResponseBody(publishRes);
	if (!publishRes.ok) {
		throw new Error(explainEdgeStatus("submission", publishRes.status, publishBody.text));
	}

	const publishLocation = publishRes.headers.get("Location")?.trim() || "";
	const publishOpId = publishLocation.split("/").filter(Boolean).pop();
	if (!publishOpId) {
		console.log("[edge] Submitted successfully.");
		return;
	}

	console.log(`[edge] Submission accepted (operationId=${publishOpId}), polling submission status...`);
	for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
		await sleep(POLL_INTERVAL_MS);
		const pollRes = await fetch(`${apiBase}/submissions/operations/${publishOpId}`, {
			headers: authHeaders,
		});
		const pollBody = await readResponseBody(pollRes);
		if (!pollRes.ok) {
			throw new Error(explainEdgeStatus("submission status poll", pollRes.status, pollBody.text));
		}
		const status = String(pollBody.json?.status || "");
		console.log(`[edge] Poll submission (${attempt}/${MAX_POLL_ATTEMPTS}): status=${status}`);
		if (status === "Succeeded") {
			console.log("[edge] Submitted successfully.");
			return;
		}
		if (status === "Failed") {
			throw new Error(`Edge submission failed: ${pollBody.text}`);
		}
	}
	throw new Error("Edge submission status polling timed out");
}

async function publishFirefox(opts: {
	config: StoresConfigFile;
	version: string;
	dryRun: boolean;
	draft: boolean;
	releaseNotes: Record<string, string>;
	approvalNotes: string;
}) {
	const extensionId = process.env.FIREFOX_EXTENSION_ID || opts.config.firefox?.extensionId || "youtubetweak@dark495.me";
	const jwtIssuer = process.env.FIREFOX_JWT_ISSUER || opts.config.firefox?.jwtIssuer;
	const jwtSecret = process.env.FIREFOX_JWT_SECRET || opts.config.firefox?.jwtSecret;

	if (!jwtIssuer || !jwtSecret) {
		throw new Error("Missing Firefox AMO credentials (jwtIssuer / jwtSecret or FIREFOX_* env vars)");
	}

	const zipPath = path.join(".output", `${pkg.name}-${opts.version}-firefox.zip`);
	const sourcesZipPath = path.join(".output", `${pkg.name}-${opts.version}-sources.zip`);
	const zipBuf = requireFile(zipPath);
	const sourcesZipBuf = requireFile(sourcesZipPath);
	assertSourcesZipSafe(sourcesZipBuf);
	console.log(`[firefox] Package: ${zipPath} (${zipBuf.length} bytes)`);
	console.log(`[firefox] Sources: ${sourcesZipPath} (${sourcesZipBuf.length} bytes, audited clean)`);

	const authHeader = () => {
		const now = Math.floor(Date.now() / 1000);
		const unsigned = `${base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${base64url(
			JSON.stringify({
				iss: jwtIssuer,
				jti: crypto.randomUUID(),
				iat: now,
				exp: now + 120,
			}),
		)}`;
		const sig = crypto.createHmac("sha256", jwtSecret).update(unsigned).digest("base64url");
		return `JWT ${unsigned}.${sig}`;
	};

	const profileRes = await fetch("https://addons.mozilla.org/api/v5/accounts/profile/", {
		headers: { Authorization: authHeader() },
	});
	const profileBody = await readResponseBody(profileRes);
	if (!profileRes.ok) {
		throw new Error(`Firefox AMO auth check failed (${profileRes.status}): ${profileBody.text}`);
	}

	const encodedId = encodeURIComponent(extensionId);
	const addonRes = await fetch(`https://addons.mozilla.org/api/v5/addons/addon/${encodedId}/`, {
		headers: { Authorization: authHeader() },
	});
	const addonBody = await readResponseBody(addonRes);
	if (!addonRes.ok) {
		throw new Error(`Firefox AMO addon lookup failed (${addonRes.status}): ${addonBody.text}`);
	}
	const currentVer = (addonBody.json?.current_version as { version?: string } | undefined)?.version ?? "none";
	console.log(`[firefox] Current AMO version: ${currentVer} (slug=${String(addonBody.json?.slug || extensionId)})`);

	if (opts.dryRun) {
		console.log("[firefox] Dry-run check passed.");
		return;
	}

	console.log("[firefox] Uploading package for validation...");
	const uploadForm = new FormData();
	uploadForm.set("upload", new Blob([new Uint8Array(zipBuf)], { type: "application/zip" }), path.basename(zipPath));
	uploadForm.set("channel", "listed");
	const uploadRes = await fetch("https://addons.mozilla.org/api/v5/addons/upload/", {
		method: "POST",
		headers: { Authorization: authHeader() },
		body: uploadForm,
	});
	const uploadBody = await readResponseBody(uploadRes);
	const uploadUuid = typeof uploadBody.json?.uuid === "string" ? uploadBody.json.uuid : "";
	if (!uploadRes.ok || !uploadUuid) {
		throw new Error(`Firefox AMO upload failed (${uploadRes.status}): ${uploadBody.text}`);
	}
	console.log(`[firefox] Upload accepted (uuid=${uploadUuid}), polling validation...`);

	let validated = false;
	for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
		await sleep(POLL_INTERVAL_MS);
		const pollRes = await fetch(`https://addons.mozilla.org/api/v5/addons/upload/${uploadUuid}/`, {
			headers: { Authorization: authHeader() },
		});
		const pollBody = await readResponseBody(pollRes);
		if (!pollRes.ok) {
			throw new Error(`Firefox AMO validation poll failed (${pollRes.status}): ${pollBody.text}`);
		}
		const processed = Boolean(pollBody.json?.processed);
		const valid = Boolean(pollBody.json?.valid);
		console.log(`[firefox] Poll validation (${attempt}/${MAX_POLL_ATTEMPTS}): processed=${processed}, valid=${valid}`);
		if (processed) {
			if (!valid) {
				throw new Error(`Firefox AMO package validation failed: ${pollBody.text}`);
			}
			validated = true;
			break;
		}
	}
	if (!validated) {
		throw new Error("Firefox AMO validation timed out");
	}

	if (opts.draft) {
		console.log("[firefox] Package validated on AMO (version creation skipped due to --draft).");
		return;
	}

	console.log("[firefox] Creating version and uploading sources.zip...");
	const versionForm = new FormData();
	versionForm.set("upload", uploadUuid);
	versionForm.set(
		"source",
		new Blob([new Uint8Array(sourcesZipBuf)], { type: "application/zip" }),
		path.basename(sourcesZipPath),
	);
	versionForm.set("approval_notes", opts.approvalNotes);

	const createRes = await fetch(`https://addons.mozilla.org/api/v5/addons/addon/${encodedId}/versions/`, {
		method: "POST",
		headers: { Authorization: authHeader() },
		body: versionForm,
	});
	const createBody = await readResponseBody(createRes);
	if (!createRes.ok) {
		throw new Error(`Firefox AMO version creation failed (${createRes.status}): ${createBody.text}`);
	}

	const versionId = createBody.json?.id;
	const createdVersion = String(createBody.json?.version || opts.version);
	console.log(`[firefox] Version ${createdVersion} created (id=${String(versionId)}).`);

	if (versionId && Object.keys(opts.releaseNotes).length > 0) {
		console.log(`[firefox] Updating localized release_notes (${Object.keys(opts.releaseNotes).join(", ")})...`);
		const patchRes = await fetch(`https://addons.mozilla.org/api/v5/addons/addon/${encodedId}/versions/${versionId}/`, {
			method: "PATCH",
			headers: {
				Authorization: authHeader(),
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ release_notes: opts.releaseNotes }),
		});
		const patchBody = await readResponseBody(patchRes);
		if (!patchRes.ok) {
			throw new Error(`Firefox AMO release_notes update failed (${patchRes.status}): ${patchBody.text}`);
		}
	}

	const editUrl = `https://addons.mozilla.org/developers/addon/${String(addonBody.json?.slug || extensionId)}/versions/${String(versionId || "")}`;
	console.log(`[firefox] Submitted successfully: ${editUrl}`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const config = loadConfigFile(args.configPath);
	const notes = buildStoreNotes(args.version, args.customNotes);

	console.log(`Publishing ${pkg.name} v${args.version} -> [${args.only.join(", ")}]${args.dryRun ? " (DRY RUN)" : ""}${args.draft ? " (DRAFT)" : ""}`);

	const results: Array<{ store: StoreName; ok: boolean; error?: string }> = [];

	for (const store of args.only) {
		console.log(`\n--- ${store.toUpperCase()} ---`);
		try {
			if (store === "chrome") {
				await publishChrome({ config, version: args.version, dryRun: args.dryRun, draft: args.draft });
			} else if (store === "edge") {
				await publishEdge({ config, version: args.version, dryRun: args.dryRun, draft: args.draft, notes: notes.edgeNotes });
			} else if (store === "firefox") {
				await publishFirefox({
					config,
					version: args.version,
					dryRun: args.dryRun,
					draft: args.draft,
					releaseNotes: notes.firefoxReleaseNotes,
					approvalNotes: notes.firefoxApprovalNotes,
				});
			}
			results.push({ store, ok: true });
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`[${store}] ERROR: ${message}`);
			results.push({ store, ok: false, error: message });
		}
	}

	console.log("\n=== Summary ===");
	for (const r of results) {
		console.log(`- ${r.store}: ${r.ok ? "OK" : `FAILED (${r.error})`}`);
	}

	if (results.some((r) => !r.ok)) {
		process.exitCode = 1;
	}
}

await main();

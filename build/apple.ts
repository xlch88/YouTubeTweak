import { execFileSync, spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

if (process.platform !== "darwin") {
	console.error(`build/apple.ts only supports macOS (darwin); current platform is ${process.platform}. Refusing to run.`);
	process.exit(1);
}

type Configuration = "Debug" | "Release";
type Device = {
	name: string;
	version: string;
	id: string;
};

const root = process.cwd();
const command = process.argv[2] || "help";
const githubRepositoryUrl = "https://github.com/xlch88/YouTubeTweak";
const project = "apple-app/YouTubeTweakExtension.xcodeproj";
const scheme = "YouTubeTweak";
const iosDerivedDataPath = "apple-app/DerivedData-iOS";
const macDerivedDataPath = "apple-app/DerivedData";
const iosAppPath = "apple-app/Build/Products/Debug-iphoneos/YouTubeTweak.app";
const macProductDir = "apple-app/Build/Products";
const bundleId = "com.yttweak.appleapp";
const deviceIdCachePath = "apple-app/.ios-device-id";
const env = {
	...process.env,
	DEVELOPER_DIR: process.env.DEVELOPER_DIR || "/Applications/Xcode.app/Contents/Developer",
};

const packageVersion = (() => {
	try {
		return (JSON.parse(readFileSync(abs("package.json"), "utf8")) as { version?: string }).version || "0.0.0";
	} catch {
		return "0.0.0";
	}
})();
const packageBuildNumber = (() => {
	const match = packageVersion.match(/^(\d+)\.(\d+)\.(\d+)/);
	if (!match) return packageVersion.replace(/\D/g, "") || "1";
	return String(Number(match[1]) * 1000 + Number(match[2]) * 100 + Number(match[3]));
})();

function abs(relativePath: string) {
	return path.join(root, relativePath);
}

function readOutput(commandName: string, args: string[], stdio: "ignore" | "pipe" = "ignore") {
	try {
		return execFileSync(commandName, args, {
			env,
			encoding: "utf8",
			stdio: ["ignore", "pipe", stdio],
		}).trim();
	} catch {
		return "";
	}
}

function run(commandName: string, args: string[], live = false) {
	console.log(`> ${commandName} ${args.join(" ")}`);
	const result = spawnSync(commandName, args, live ? { env, stdio: "inherit" } : { env, encoding: "utf8" });
	if (!live) {
		if (result.stdout) process.stdout.write(result.stdout);
		if (result.stderr) process.stderr.write(result.stderr);
	}
	if (result.error) throw result.error;
	if (result.status !== 0) {
		explainAppleDeviceError(result);
		process.exit(result.status || 1);
	}
	return result;
}

function runForResult(commandName: string, args: string[]) {
	console.log(`> ${commandName} ${args.join(" ")}`);
	const result = spawnSync(commandName, args, { env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
	if (result.stdout) process.stdout.write(result.stdout);
	if (result.stderr) process.stderr.write(result.stderr);
	if (result.error) throw result.error;
	return result;
}

function explainAppleDeviceError(result: ReturnType<typeof spawnSync>) {
	const text = `${result.stdout?.toString() || ""}\n${result.stderr?.toString() || ""}`;
	if (/kAMDMobileImageMounterDeviceLocked|DeviceLocked|device is locked/i.test(text)) {
		console.error("");
		console.error("The iOS device is still locked for Developer Disk Image mounting.");
		console.error("Keep it unlocked on the home screen, unplug/replug USB, then run again.");
		console.error("Also check Settings > Privacy & Security > Developer Mode.");
		console.error("");
	}
	if (/No Accounts|No profiles for .* were found|provisioning profiles matching|No signing certificate/i.test(text)) {
		console.error("");
		console.error("Xcode signing failed.");
		console.error("Run as the macOS user signed in to Xcode and check Xcode > Settings > Accounts.");
		console.error("");
	}
	if (/errSecInternalComponent/i.test(text)) {
		console.error("");
		console.error("Xcode could not use the signing private key from this security session.");
		console.error("Run the command again in an interactive terminal so the one-time remote signing setup can repair access.");
		console.error("");
	}
}

function normalizeGitRemoteUrl(remoteUrl: string) {
	const trimmedUrl = remoteUrl.trim();
	if (!trimmedUrl) return "";

	const sshMatch = trimmedUrl.match(/^git@github\.com:(.+?)(?:\.git)?$/);
	if (sshMatch) return `https://github.com/${sshMatch[1]}`;

	const httpsMatch = trimmedUrl.match(/^(https:\/\/github\.com\/.+?)(?:\.git)?$/);
	if (httpsMatch) return httpsMatch[1];

	return trimmedUrl.replace(/\.git$/, "");
}

function xcodeBuildMetadataArgs() {
	const commitId = readOutput("git", ["rev-parse", "--short=7", "HEAD"]) || "unknown";
	const repositoryUrl = normalizeGitRemoteUrl(readOutput("git", ["config", "--get", "remote.origin.url"])) || githubRepositoryUrl;
	return [
		`MARKETING_VERSION=${packageVersion}`,
		`CURRENT_PROJECT_VERSION=${packageBuildNumber}`,
		`YTTWEAK_BUILD_DATE=${new Intl.DateTimeFormat("sv-SE", {
			timeZone: "Asia/Shanghai",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		}).format(new Date())} +08:00`,
		`YTTWEAK_COMMIT_ID=${commitId}`,
		`YTTWEAK_COMMIT_URL=${commitId === "unknown" ? repositoryUrl : `${repositoryUrl}/commit/${commitId}`}`,
	];
}

function relaunchInGuiSession(platform: "ios" | "mac", args: string[]) {
	const flag = platform === "ios" ? "YTTWEAK_IOS_GUI_SESSION" : "YTTWEAK_MAC_GUI_SESSION";
	if (process.env[flag] === "1") return;

	const targetUser =
		platform === "ios" ? process.env.IOS_DEV_USER || "dark495" : process.env.MAC_DEV_USER || process.env.IOS_DEV_USER || "dark495";
	const targetHome =
		platform === "ios"
			? process.env.IOS_DEV_HOME || `/Users/${targetUser}`
			: process.env.MAC_DEV_HOME || process.env.IOS_DEV_HOME || `/Users/${targetUser}`;
	const targetUid = readOutput("id", ["-u", targetUser]);
	if (!targetUid) return;

	const currentUid = typeof process.getuid === "function" ? String(process.getuid()) : "";
	const managerUid = readOutput("launchctl", ["manageruid"]);
	if (currentUid === targetUid && managerUid === targetUid) {
		process.env[flag] = "1";
		return;
	}

	const guiEnv = [`HOME=${targetHome}`, `USER=${targetUser}`, `LOGNAME=${targetUser}`, `DEVELOPER_DIR=${env.DEVELOPER_DIR}`, `${flag}=1`];
	if (platform === "ios" && process.env.IOS_DEVICE_ID) guiEnv.push(`IOS_DEVICE_ID=${process.env.IOS_DEVICE_ID}`);

	const scriptArgs = ["npm", "exec", "tsx", "--", "build/apple.ts", ...args];
	const commandName = currentUid === "0" ? "launchctl" : "sudo";
	const commandArgs =
		currentUid === "0"
			? ["asuser", targetUid, "sudo", "-u", targetUser, "env", ...guiEnv, ...scriptArgs]
			: ["launchctl", "asuser", targetUid, "sudo", "-u", targetUser, "env", ...guiEnv, ...scriptArgs];

	console.log(`Re-entering ${targetUser}'s GUI login session for ${platform === "ios" ? "iOS" : "macOS"} Xcode signing...`);
	const result = spawnSync(commandName, commandArgs, { cwd: root, env, stdio: "inherit" });
	if (result.error) throw result.error;
	process.exit(result.status || 0);
}

function readSecret(prompt: string) {
	if (!process.stdin.isTTY) {
		console.error("Remote signing setup needs an interactive terminal for its one-time password prompt.");
		console.error("Run npm run dev:mac once from the VS Code Remote terminal.");
		process.exit(1);
	}

	return new Promise<string>((resolve, reject) => {
		const wasPaused = process.stdin.isPaused();
		const wasRaw = process.stdin.isRaw;
		let value = "";

		process.stdout.write(prompt);
		process.stdin.setRawMode(true);
		process.stdin.resume();

		function finish(error?: Error) {
			process.stdin.off("data", onData);
			process.stdin.setRawMode(wasRaw);
			if (wasPaused) process.stdin.pause();
			process.stdout.write("\n");
			if (error) reject(error);
			else resolve(value);
		}

		function onData(chunk: Buffer | string) {
			for (const character of chunk.toString()) {
				if (character === "\r" || character === "\n") {
					finish();
					return;
				}
				if (character === "\u0003") {
					finish(new Error("Remote signing setup cancelled."));
					return;
				}
				if (character === "\u007f" || character === "\b") {
					value = [...value].slice(0, -1).join("");
					continue;
				}
				if (character >= " ") value += character;
			}
		}

		process.stdin.on("data", onData);
	});
}

function canUseCodeSigningIdentity(identity: string) {
	const probeDir = mkdtempSync(path.join(tmpdir(), "yttweak-codesign-"));
	const probePath = path.join(probeDir, "probe");

	try {
		copyFileSync("/usr/bin/true", probePath);
		return (
			spawnSync("/usr/bin/codesign", ["--force", "--sign", identity, "--timestamp=none", probePath], {
				env,
				stdio: "ignore",
			}).status === 0
		);
	} finally {
		rmSync(probeDir, { force: true, recursive: true });
	}
}

async function prepareRemoteMacSigning() {
	const identity = readOutput("security", ["find-identity", "-v", "-p", "codesigning"]).match(
		/^\s*\d+\)\s+([0-9A-F]{40})\s+"Apple Development:/m,
	)?.[1];
	if (!identity) {
		console.error("No valid Apple Development signing identity was found.");
		console.error("Check Xcode > Settings > Accounts and create or download the development certificate first.");
		process.exit(1);
	}
	if (canUseCodeSigningIdentity(identity)) return identity;

	console.log("");
	console.log("This security session cannot use the Apple Development private key yet.");
	console.log("Enter the macOS login password once to enable password-free signing for subsequent VS Code Remote builds.");

	let password = "";
	try {
		password = await readSecret("macOS login password: ");
		const keychainPath = path.join(
			process.env.MAC_DEV_HOME || process.env.IOS_DEV_HOME || process.env.HOME || `/Users/${process.env.USER}`,
			"Library/Keychains/login.keychain-db",
		);

		for (const args of [
			["unlock-keychain", keychainPath],
			["set-key-partition-list", "-S", "apple-tool:,apple:,codesign:", "-s", keychainPath],
		]) {
			const result = spawnSync("security", args, {
				env,
				input: `${password}\n`,
				encoding: "utf8",
			});
			if (result.status === 0) continue;
			if (result.stdout) process.stdout.write(result.stdout);
			if (result.stderr) process.stderr.write(result.stderr);
			throw new Error(`security ${args[0]} failed.`);
		}

		const settingsResult = spawnSync("security", ["set-keychain-settings", keychainPath], { env, encoding: "utf8" });
		if (settingsResult.status !== 0) {
			if (settingsResult.stdout) process.stdout.write(settingsResult.stdout);
			if (settingsResult.stderr) process.stderr.write(settingsResult.stderr);
			throw new Error("Could not disable the login keychain timeout.");
		}
	} finally {
		password = "";
	}

	if (!canUseCodeSigningIdentity(identity)) {
		throw new Error("The signing key is still unavailable after remote signing setup.");
	}
	console.log("Remote signing is configured; subsequent builds in this login session will not ask for a password.");
	console.log("");
	return identity;
}

function fixXcodeScriptModes() {
	const intermediatesPath = "apple-app/Build/Intermediates";
	if (!existsSync(intermediatesPath)) return;

	const result = spawnSync("find", [intermediatesPath, "-name", "Script-*.sh", "-type", "f", "-exec", "chmod", "755", "{}", "+"], {
		env,
	});
	if (result.error) throw result.error;
}

function isProvisioningPackagingFailure(result: ReturnType<typeof spawnSync>) {
	return /ProcessProductPackaging[\s\S]*\.mobileprovision|embedded\.mobileprovision|Provisioning Profiles/i.test(
		`${result.stdout || ""}\n${result.stderr || ""}`,
	);
}

function runXcodeBuildWithProvisioningRetry(args: string[]) {
	fixXcodeScriptModes();
	const result = runForResult("xcodebuild", args);
	if (result.status === 0) return;

	if (!isProvisioningPackagingFailure(result)) {
		explainAppleDeviceError(result);
		process.exit(result.status || 1);
	}

	console.error("");
	console.error("Xcode failed while packaging a provisioning profile. Cleaning iOS build products and retrying once...");
	console.error("");

	const cleanResult = runForResult("xcodebuild", [...args.filter((arg) => arg !== "build"), "clean"]);
	if (cleanResult.status !== 0) {
		explainAppleDeviceError(cleanResult);
		process.exit(cleanResult.status || 1);
	}

	const retryResult = runForResult("xcodebuild", args);
	if (retryResult.status !== 0) {
		explainAppleDeviceError(retryResult);
		process.exit(retryResult.status || 1);
	}
}

function syncBuildServer() {
	fixXcodeScriptModes();
	const buildResult = runForResult("xcodebuild", [...macBuildArgs("Debug").slice(0, -1), "CODE_SIGNING_ALLOWED=NO", "clean", "build"]);
	if (buildResult.status !== 0) {
		explainAppleDeviceError(buildResult);
		process.exit(buildResult.status || 1);
	}

	const buildLog = `${buildResult.stdout || ""}\n${buildResult.stderr || ""}`;
	for (const cwd of [root, abs("apple-app")]) {
		console.log(`> xcode-build-server parse (${cwd})`);
		const parseResult = spawnSync("xcode-build-server", ["parse"], {
			cwd,
			env,
			input: buildLog,
			encoding: "utf8",
			maxBuffer: 64 * 1024 * 1024,
		});
		if (parseResult.stdout) process.stdout.write(parseResult.stdout);
		if (parseResult.stderr) process.stderr.write(parseResult.stderr);
		if (parseResult.error) throw parseResult.error;
		if (parseResult.status !== 0) process.exit(parseResult.status || 1);
	}
}

const canvasSize = 1024;
const bodySize = 824;
const bodyOffset = Math.round((canvasSize - bodySize) / 2);
const macLogoSize = 620;
const iosLogoSize = Math.round((canvasSize * macLogoSize) / bodySize);
const appleLogoPath = "src/assets/img/logo_apple.svg";
const outputSizes = [16, 32, 64, 128, 256, 512, 1024];
const macAppIconEntries = [
	{ filename: "mac-16.png", idiom: "mac", size: "16x16", scale: "1x", pixels: 16 },
	{ filename: "mac-32.png", idiom: "mac", size: "16x16", scale: "2x", pixels: 32 },
	{ filename: "mac-32.png", idiom: "mac", size: "32x32", scale: "1x", pixels: 32 },
	{ filename: "mac-64.png", idiom: "mac", size: "32x32", scale: "2x", pixels: 64 },
	{ filename: "mac-128.png", idiom: "mac", size: "128x128", scale: "1x", pixels: 128 },
	{ filename: "mac-256.png", idiom: "mac", size: "128x128", scale: "2x", pixels: 256 },
	{ filename: "mac-256.png", idiom: "mac", size: "256x256", scale: "1x", pixels: 256 },
	{ filename: "mac-512.png", idiom: "mac", size: "256x256", scale: "2x", pixels: 512 },
	{ filename: "mac-512.png", idiom: "mac", size: "512x512", scale: "1x", pixels: 512 },
	{ filename: "mac-1024.png", idiom: "mac", size: "512x512", scale: "2x", pixels: 1024 },
];
const iosAppIconEntries = [
	{ filename: "ios-20@2x.png", idiom: "iphone", size: "20x20", scale: "2x", pixels: 40 },
	{ filename: "ios-20@3x.png", idiom: "iphone", size: "20x20", scale: "3x", pixels: 60 },
	{ filename: "ios-29@2x.png", idiom: "iphone", size: "29x29", scale: "2x", pixels: 58 },
	{ filename: "ios-29@3x.png", idiom: "iphone", size: "29x29", scale: "3x", pixels: 87 },
	{ filename: "ios-40@2x.png", idiom: "iphone", size: "40x40", scale: "2x", pixels: 80 },
	{ filename: "ios-40@3x.png", idiom: "iphone", size: "40x40", scale: "3x", pixels: 120 },
	{ filename: "ios-60@2x.png", idiom: "iphone", size: "60x60", scale: "2x", pixels: 120 },
	{ filename: "ios-60@3x.png", idiom: "iphone", size: "60x60", scale: "3x", pixels: 180 },
	{ filename: "ipad-20@1x.png", idiom: "ipad", size: "20x20", scale: "1x", pixels: 20 },
	{ filename: "ipad-20@2x.png", idiom: "ipad", size: "20x20", scale: "2x", pixels: 40 },
	{ filename: "ipad-29@1x.png", idiom: "ipad", size: "29x29", scale: "1x", pixels: 29 },
	{ filename: "ipad-29@2x.png", idiom: "ipad", size: "29x29", scale: "2x", pixels: 58 },
	{ filename: "ipad-40@1x.png", idiom: "ipad", size: "40x40", scale: "1x", pixels: 40 },
	{ filename: "ipad-40@2x.png", idiom: "ipad", size: "40x40", scale: "2x", pixels: 80 },
	{ filename: "ipad-76@1x.png", idiom: "ipad", size: "76x76", scale: "1x", pixels: 76 },
	{ filename: "ipad-76@2x.png", idiom: "ipad", size: "76x76", scale: "2x", pixels: 152 },
	{ filename: "ipad-83.5@2x.png", idiom: "ipad", size: "83.5x83.5", scale: "2x", pixels: 167 },
	{ filename: "ios-marketing-1024.png", idiom: "ios-marketing", size: "1024x1024", scale: "1x", pixels: 1024 },
];
const iconVariants = [
	{
		outputDir: ".output/apple-app-icons/safari-mv2/icons",
		appIconSetDir: "apple-app/YouTubeTweak/Assets.xcassets/AppIcon.appiconset",
	},
	{
		outputDir: ".output/apple-app-icons/safari-mv2-dev/icons",
		appIconSetDir: "apple-app/YouTubeTweak/Assets.xcassets/AppIconDebug.appiconset",
	},
];

function iconBackgroundSvg() {
	return Buffer.from(`
<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="155%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="22" stdDeviation="19" flood-color="#000000" flood-opacity="0.20"/>
    </filter>
  </defs>
  <rect x="${bodyOffset}" y="${bodyOffset}" width="${bodySize}" height="${bodySize}" rx="184" ry="184" fill="#ffffff" filter="url(#shadow)"/>
</svg>`);
}

async function loadCenteredLogo(sourcePath: string, size: number) {
	const buffer = await sharp(sourcePath)
		.ensureAlpha()
		.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
		.resize({ width: size, height: size, fit: "inside", withoutEnlargement: false })
		.png()
		.toBuffer();
	const metadata = await sharp(buffer).metadata();
	const width = metadata.width || size;
	const height = metadata.height || size;
	return {
		buffer,
		left: Math.round((canvasSize - width) / 2),
		top: Math.round((canvasSize - height) / 2),
	};
}

async function makeMasterIcon(
	sourcePath: string,
	background: { r: number; g: number; b: number; alpha: number },
	size: number,
	transparentBackground = false,
) {
	const logo = await loadCenteredLogo(sourcePath, size);
	return sharp({
		create: {
			width: canvasSize,
			height: canvasSize,
			channels: 4,
			background,
		},
	})
		.composite(
			transparentBackground
				? [
						{ input: iconBackgroundSvg(), left: 0, top: 0 },
						{ input: logo.buffer, left: logo.left, top: logo.top },
					]
				: [{ input: logo.buffer, left: logo.left, top: logo.top }],
		)
		.png()
		.toBuffer();
}

async function writeAppIconSet(variant: (typeof iconVariants)[number], macMaster: Buffer, iosMaster: Buffer) {
	const appIconSetDir = abs(variant.appIconSetDir);
	await mkdir(appIconSetDir, { recursive: true });

	await Promise.all([
		...macAppIconEntries.map((entry) =>
			sharp(macMaster)
				.resize(entry.pixels, entry.pixels, { fit: "contain", kernel: sharp.kernel.lanczos3 })
				.png()
				.toFile(path.join(appIconSetDir, entry.filename)),
		),
		...iosAppIconEntries.map((entry) =>
			sharp(iosMaster)
				.resize(entry.pixels, entry.pixels, { fit: "cover", kernel: sharp.kernel.lanczos3 })
				.png()
				.toFile(path.join(appIconSetDir, entry.filename)),
		),
	]);

	await writeFile(
		path.join(appIconSetDir, "Contents.json"),
		`${JSON.stringify(
			{
				images: [...macAppIconEntries, ...iosAppIconEntries].map(({ pixels, ...entry }) => entry),
				info: { author: "xcode", version: 1 },
			},
			null,
			"\t",
		)}\n`,
	);
}

async function writeIconVariant(variant: (typeof iconVariants)[number]) {
	const outputDir = abs(variant.outputDir);
	const macMaster = await makeMasterIcon(abs(appleLogoPath), { r: 0, g: 0, b: 0, alpha: 0 }, macLogoSize, true);
	const iosMaster = await makeMasterIcon(abs(appleLogoPath), { r: 255, g: 255, b: 255, alpha: 1 }, iosLogoSize);
	await mkdir(outputDir, { recursive: true });
	await Promise.all(
		outputSizes.map((size) =>
			sharp(macMaster)
				.resize(size, size, { fit: "contain", kernel: sharp.kernel.lanczos3 })
				.png()
				.toFile(path.join(outputDir, `${size}.png`)),
		),
	);
	await writeAppIconSet(variant, macMaster, iosMaster);
	console.log(
		`generated ${variant.outputDir} from ${appleLogoPath} (body ${bodySize}/${canvasSize}, mac logo ${macLogoSize}/${canvasSize}, ios logo ${iosLogoSize}/${canvasSize})`,
	);
}

async function runIcons() {
	await Promise.all(iconVariants.map(writeIconVariant));
}

function readCachedDeviceId() {
	return existsSync(deviceIdCachePath) ? readFileSync(deviceIdCachePath, "utf8").trim() : "";
}

function cacheDeviceId(id: string) {
	if (!id || id === readCachedDeviceId()) return;
	writeFileSync(deviceIdCachePath, `${id}\n`);
	console.log(`Saved iOS device id to ${deviceIdCachePath}`);
}

function listIOSDevicesWithXCDevice(): Device[] {
	try {
		return (JSON.parse(readOutput("xcrun", ["xcdevice", "list"], "pipe")) as any[])
			.filter((device) => {
				return (
					device &&
					device.available !== false &&
					device.simulator !== true &&
					device.platform === "com.apple.platform.iphoneos" &&
					/\b(iPhone|iPad|iPod)\b/.test(device.modelName || device.name || "")
				);
			})
			.map((device) => ({
				name: device.name || device.modelName || "iOS Device",
				version: device.operatingSystemVersion || "unknown",
				id: device.identifier,
			}));
	} catch {
		return [];
	}
}

function listIOSDevicesWithXCTrace(): Device[] {
	const text = readOutput("xcrun", ["xctrace", "list", "devices"], "pipe");
	if (!text) return [];

	const devices: Device[] = [];
	let inDevices = false;
	for (const line of text.split(/\r?\n/)) {
		if (line.startsWith("== Devices ==")) {
			inDevices = true;
			continue;
		}
		if (line.startsWith("== Simulators ==")) break;
		if (!inDevices) continue;

		const match = line.match(/^(.+?) \(([^()]+)\) \(([0-9A-Fa-f-]{20,})\)$/);
		if (match && /\b(iPhone|iPad|iPod)\b/.test(match[1])) {
			devices.push({ name: match[1], version: match[2], id: match[3] });
		}
	}
	return devices;
}

function chooseDeviceId() {
	if (process.env.IOS_DEVICE_ID) {
		cacheDeviceId(process.env.IOS_DEVICE_ID);
		return process.env.IOS_DEVICE_ID;
	}

	const devices = listIOSDevicesWithXCDevice();
	if (devices.length === 1) {
		console.log(`Using iOS device: ${devices[0].name} (${devices[0].version}) ${devices[0].id}`);
		cacheDeviceId(devices[0].id);
		return devices[0].id;
	}

	const cachedDeviceId = readCachedDeviceId();
	if (cachedDeviceId) {
		console.log(`Using cached iOS device id from ${deviceIdCachePath}: ${cachedDeviceId}`);
		return cachedDeviceId;
	}

	const fallbackDevices = devices.length > 0 ? devices : listIOSDevicesWithXCTrace();
	if (fallbackDevices.length === 1) {
		console.log(`Using iOS device: ${fallbackDevices[0].name} (${fallbackDevices[0].version}) ${fallbackDevices[0].id}`);
		cacheDeviceId(fallbackDevices[0].id);
		return fallbackDevices[0].id;
	}

	if (fallbackDevices.length === 0) {
		console.error("No connected iPhone/iPad was found by Xcode command line tools.");
		console.error("Run once with IOS_DEVICE_ID=<device id> npm run dev:ios to save it for future runs.");
		process.exit(1);
	}

	console.error("Multiple iOS devices found. Set IOS_DEVICE_ID to one of:");
	for (const device of fallbackDevices) console.error(`  ${device.id}  ${device.name} (${device.version})`);
	process.exit(1);
}

function iosBuildArgs(configuration: Configuration, destination: string, extraArgs: string[] = []) {
	return [
		"-project",
		project,
		"-scheme",
		scheme,
		"-configuration",
		configuration,
		"-destination",
		destination,
		"-derivedDataPath",
		iosDerivedDataPath,
		"-allowProvisioningUpdates",
		...extraArgs,
		...xcodeBuildMetadataArgs(),
		"build",
	];
}

async function buildIOS(configuration: Configuration) {
	relaunchInGuiSession("ios", [`build:ios${configuration === "Debug" ? ":debug" : ""}`]);
	await runIcons();
	runXcodeBuildWithProvisioningRetry(
		iosBuildArgs(
			configuration,
			configuration === "Debug" ? "platform=iOS" : "generic/platform=iOS",
			configuration === "Debug" ? ["-allowProvisioningDeviceRegistration", "ENABLE_DEBUG_DYLIB=NO"] : [],
		),
	);
}

async function devIOS() {
	relaunchInGuiSession("ios", ["dev:ios"]);
	const deviceId = chooseDeviceId();
	await runIcons();
	runXcodeBuildWithProvisioningRetry(
		iosBuildArgs("Debug", `id=${deviceId}`, ["-allowProvisioningDeviceRegistration", "ENABLE_DEBUG_DYLIB=NO"]),
	);
	run("xcrun", ["devicectl", "device", "install", "app", "--device", deviceId, iosAppPath]);

	const launchArgs = ["devicectl", "device", "process", "launch", "--device", deviceId, "--terminate-existing"];
	if (process.env.YTTWEAK_IOS_CONSOLE !== "0") launchArgs.push("--console");
	launchArgs.push(bundleId);

	if (process.env.YTTWEAK_IOS_CONSOLE !== "0") {
		console.log("");
		console.log("Attaching app console. Press Ctrl-C to stop.");
		run("xcrun", launchArgs, true);
	} else {
		run("xcrun", launchArgs);
	}
}

function macBuildArgs(configuration: Configuration) {
	return [
		"-project",
		project,
		"-scheme",
		scheme,
		"-configuration",
		configuration,
		"-destination",
		"platform=macOS",
		"-derivedDataPath",
		macDerivedDataPath,
		"-allowProvisioningUpdates",
		...xcodeBuildMetadataArgs(),
		"build",
	];
}

function verifyMacAppSignature(appPath: string) {
	return spawnSync("/usr/bin/codesign", ["--verify", "--deep", "--strict", "--verbose=4", appPath], {
		env,
		encoding: "utf8",
	});
}

function ensureMacAppSignature(configuration: Configuration, identity: string) {
	const appPath = abs(`${macProductDir}/${configuration}/YouTubeTweak.app`);
	const extensionPath = path.join(appPath, "Contents/PlugIns/YouTubeTweakExtension.appex");
	if (!existsSync(extensionPath)) {
		throw new Error(`Missing Safari extension after macOS build: ${extensionPath}`);
	}

	const initialVerification = verifyMacAppSignature(appPath);
	if (initialVerification.status === 0) {
		console.log(`Verified macOS app signature: ${appPath}`);
		return;
	}

	console.warn("Xcode left the macOS app with a stale signature after copying updated Safari extension resources.");
	console.warn("Re-signing the embedded extension first, then the containing app...");
	for (const bundlePath of [extensionPath, appPath]) {
		run("/usr/bin/codesign", [
			"--force",
			"--sign",
			identity,
			"--timestamp=none",
			"--preserve-metadata=identifier,entitlements,flags,runtime",
			bundlePath,
		]);
		if (bundlePath === extensionPath) {
			run("/usr/bin/codesign", ["--verify", "--strict", "--verbose=4", extensionPath]);
		}
	}

	const finalVerification = verifyMacAppSignature(appPath);
	if (finalVerification.status !== 0) {
		if (finalVerification.stdout) process.stdout.write(finalVerification.stdout);
		if (finalVerification.stderr) process.stderr.write(finalVerification.stderr);
		throw new Error(`macOS app signature is still invalid after re-signing: ${appPath}`);
	}
	console.log(`Re-signed and verified macOS app: ${appPath}`);
}

function stopMacAppIfRunning(configuration: Configuration) {
	const relativeAppExecutablePath = `${macProductDir}/${configuration}/YouTubeTweak.app/Contents/MacOS/YouTubeTweak`;
	const absoluteAppExecutablePath = abs(relativeAppExecutablePath);
	const pgrepResult = spawnSync("pgrep", ["-x", "YouTubeTweak"], { env, encoding: "utf8" });
	if (pgrepResult.status !== 0 || !pgrepResult.stdout) return;

	let stopped = false;
	for (const pidText of pgrepResult.stdout.split(/\s+/)) {
		const pid = Number(pidText);
		if (!Number.isFinite(pid)) continue;

		const commandLine = spawnSync("ps", ["-p", String(pid), "-o", "command="], { env, encoding: "utf8" }).stdout.trim();
		if (
			commandLine === absoluteAppExecutablePath ||
			commandLine.startsWith(`${absoluteAppExecutablePath} `) ||
			commandLine === relativeAppExecutablePath ||
			commandLine.startsWith(`${relativeAppExecutablePath} `)
		) {
			try {
				process.kill(pid, "SIGTERM");
				stopped = true;
			} catch {
				// The process may have exited between pgrep and kill.
			}
		}
	}
	if (stopped) spawnSync("sleep", ["0.2"]);
}

async function buildMac(configuration: Configuration) {
	relaunchInGuiSession("mac", [`build:mac${configuration === "Debug" ? ":debug" : ""}`]);
	const signingIdentity = await prepareRemoteMacSigning();
	await runIcons();
	fixXcodeScriptModes();
	run("xcodebuild", macBuildArgs(configuration), true);
	ensureMacAppSignature(configuration, signingIdentity);
}

async function devMac() {
	relaunchInGuiSession("mac", ["dev:mac"]);
	const signingIdentity = await prepareRemoteMacSigning();
	await runIcons();
	fixXcodeScriptModes();
	run("xcodebuild", macBuildArgs("Debug"), true);
	ensureMacAppSignature("Debug", signingIdentity);
	const macAppPath = `${macProductDir}/Debug/YouTubeTweak.app`;
	run(
		"/System/Library/Frameworks/CoreServices.framework/Versions/Current/Frameworks/LaunchServices.framework/Versions/Current/Support/lsregister",
		["-f", "-R", "-trusted", macAppPath],
	);
	run("/usr/bin/pluginkit", ["-a", `${macAppPath}/Contents/PlugIns/YouTubeTweakExtension.appex`]);
	stopMacAppIfRunning("Debug");
	run("/usr/bin/open", ["-n", "-W", macAppPath], true);
}

function watchPaths() {
	return [
		"package.json",
		"build/apple.ts",
		appleLogoPath,
		"apple-app/YouTubeTweak/YouTubeTweakExtensionApp.swift",
		"apple-app/YouTubeTweak/Info.plist",
		"apple-app/YouTubeTweak/LaunchScreen.storyboard",
		"apple-app/YouTubeTweak/YouTubeTweak.entitlements",
		"apple-app/YouTubeTweak/assets/i18n",
		"apple-app/YouTubeTweakExtension/Info.plist",
		"apple-app/YouTubeTweakExtension/SafariWebExtensionHandler.swift",
		"apple-app/YouTubeTweakExtension/YouTubeTweakExtension.entitlements",
		"apple-app/YouTubeTweakExtension.xcodeproj/project.pbxproj",
		".output/safari-mv2",
		".output/safari-mv2-dev",
	].filter(existsSync);
}

function watchAppleApp(platform: "ios" | "mac", scriptName: "dev:ios" | "dev:mac") {
	relaunchInGuiSession(platform, [`${scriptName}:watch`]);

	const paths = watchPaths();
	if (paths.length === 0) {
		console.error(`No ${platform === "ios" ? "iOS" : "macOS"} app paths found to watch.`);
		process.exit(1);
	}

	let running = false;
	let pending = false;
	let restarting = false;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let activeChild: ReturnType<typeof spawn> | null = null;

	function stopActiveChild(signal: NodeJS.Signals = "SIGINT") {
		if (!activeChild) return;
		if (activeChild.pid && process.platform !== "win32") {
			try {
				process.kill(-activeChild.pid, signal);
				return;
			} catch {
				// Fall back to the direct child if the process group is already gone.
			}
		}
		activeChild.kill(signal);
	}

	function runDev(reason: string) {
		if (running) {
			pending = true;
			restarting = true;
			if (activeChild) {
				console.log(`\nChange detected. Restarting ${platform === "ios" ? "iOS app console" : "macOS app"}...`);
				stopActiveChild();
			}
			return;
		}

		running = true;
		pending = false;
		restarting = false;
		console.log(reason ? `\nChange detected: ${reason}` : "");
		console.log(platform === "ios" ? "Rebuilding, installing, and launching iOS app...\n" : "Rebuilding and launching macOS app...\n");

		activeChild = spawn("npm", ["run", scriptName], {
			stdio: "inherit",
			env: process.env,
			detached: process.platform !== "win32",
		});
		activeChild.on("exit", (code) => {
			activeChild = null;
			running = false;
			if (restarting) {
				console.log(platform === "ios" ? "\niOS app console stopped for rebuild." : "\nmacOS app stopped for rebuild.");
			} else if (code === 0) {
				console.log(
					platform === "ios" ? "\niOS app exited. Watching for changes..." : "\nmacOS app exited. Watching for changes...",
				);
			} else if (code !== 130 && code !== null) {
				console.log(`\n${scriptName} exited with code ${code}. Watching for changes...`);
			}
			if (pending) runDev("queued change");
		});
	}

	function stop() {
		stopActiveChild();
		process.exit(0);
	}

	process.once("SIGINT", stop);
	process.once("SIGTERM", stop);

	console.log(`Watching ${platform === "ios" ? "iOS" : "macOS"} app sources:`);
	for (const watchPath of paths) console.log(`  ${watchPath}`);
	runDev("initial build");

	const watcher = spawn(
		"fswatch",
		[
			"-0",
			"--exclude",
			".*/Build/.*",
			"--exclude",
			".*/DerivedData[^/]*/.*",
			"--exclude",
			".*/AppIcon[^/]*\\.appiconset/.*",
			"--exclude",
			".*/\\.output/apple-app-icons/.*",
			"--exclude",
			".*/\\.DS_Store$",
			...paths,
		],
		{ stdio: ["ignore", "pipe", "inherit"] },
	);

	let buffer = "";
	watcher.stdout.on("data", (chunk) => {
		buffer += chunk.toString("utf8");
		const parts = buffer.split("\0");
		buffer = parts.pop() || "";
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			for (const part of parts) {
				if (part.trim()) {
					runDev(part.trim());
					break;
				}
			}
		}, 700);
	});
	watcher.on("exit", (code) => {
		console.error(`fswatch exited with code ${code}.`);
		process.exit(code || 1);
	});
}

function usage() {
	console.error("Usage: tsx build/apple.ts <command>");
	console.error("");
	console.error("Commands:");
	for (const name of [
		"icons",
		"dev:ios",
		"dev:ios:watch",
		"dev:mac",
		"dev:mac:watch",
		"build:ios",
		"build:ios:debug",
		"build:mac",
		"build:mac:debug",
		"build-server",
	]) {
		console.error(`  ${name}`);
	}
	process.exit(1);
}

switch (command) {
	case "icons":
		await runIcons();
		break;
	case "dev:ios":
		await devIOS();
		break;
	case "dev:ios:watch":
		watchAppleApp("ios", "dev:ios");
		break;
	case "dev:mac":
		await devMac();
		break;
	case "dev:mac:watch":
		watchAppleApp("mac", "dev:mac");
		break;
	case "build:ios":
		await buildIOS("Release");
		break;
	case "build:ios:debug":
		await buildIOS("Debug");
		break;
	case "build:mac":
		await buildMac("Release");
		break;
	case "build:mac:debug":
		await buildMac("Debug");
		break;
	case "build-server":
		syncBuildServer();
		break;
	default:
		usage();
}

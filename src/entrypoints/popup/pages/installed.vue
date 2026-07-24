<template>
	<section id="page-installed" :class="`${installedHint}-user-agent`">
		<div class="installed">
			<img :src="APP_LOGO" alt="logo" />
			<p class="title">{{ APP_BRANDING.displayName }}</p>
			<p class="version">
				v{{ APP_INFO.version }}<br /><span>Build at {{ APP_INFO.build }}</span>
			</p>

			<h1>{{ $t("installed.title") }}</h1>
			<p>{{ $t("installed.line1") }}</p>
			<p>{{ $t("installed.line2") }}</p>
			<p>{{ $t("installed.line3") }}</p>
		</div>

		<div id="arrow">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				shape-rendering="geometricPrecision"
				text-rendering="geometricPrecision"
				image-rendering="optimizeQuality"
				fill-rule="evenodd"
				clip-rule="evenodd"
				viewBox="0 0 511.999 414.537"
			>
				<path
					fill-rule="nonzero"
					fill="#bababa"
					d="M272.672 106.83c35.974-29.622 93.074-70.771 124.026-101.724C404.401.483 413.074-.958 421.124.61c8.291 1.606 15.868 6.316 21.079 13.928l1.587 2.598 68.209 134.816-23.269 11.733c-6.285-12.42-46.018-93.326-61.794-123.347-8.421 113.201-50.941 202.355-119.111 265.333C232.553 375.215 126.272 412.448.41 414.537L0 388.52c119.332-1.982 219.658-36.875 290.177-102.028 64.084-59.205 103.813-143.79 111.061-251.776l-112.032 92.217-16.534-20.103z"
				/>
			</svg>

			<svg
				v-if="installedHint === 'safari' || installedHint === 'safari-ipad'"
				xmlns="http://www.w3.org/2000/svg"
				class="browser-extension-icon-hint"
				viewBox="0 0 80 80"
				aria-hidden="true"
			>
				<path
					d="M57.25 28.27C60.62 28.44 62.91 26.86 66.34 28.89C72.18 32.35 71.59 40.96 66.19 44.46C63.2 46.4 60.06 44.51 57.08 45.25C55.1 49.58 57.96 54.73 53.41 58.17C50.88 60.08 47.2 59.39 44.25 59.39C36.92 59.4 29.58 59.47 22.25 59.46C18.83 59.45 14.78 59.23 13.26 55.51C12.12 52.74 11.63 39.75 14.96 38.72C18.02 37.77 26.75 44.78 26.79 36.76C26.84 27.81 17.78 35.4 14.85 34.39C11.71 33.3 12.25 20.54 13.07 17.78C14.13 14.21 18.63 13.45 21.75 13.42C29.08 13.35 36.42 13.44 43.75 13.44C47.23 13.45 51.05 12.98 53.97 15.28C58.19 18.6 54.91 24.4 57.25 28.27ZM17.58 45.25C16.72 47.67 16.3 52.77 18.87 54.38C21.79 56.22 35.2 54.95 39.25 54.95C42.26 54.95 47.01 55.84 49.79 54.59C55.01 52.24 48.65 42.23 53.39 39.15C56.28 37.26 66.42 45.69 65.95 36.25C65.52 27.75 56.34 35.95 53.55 34.2C48.96 31.33 54.32 20.59 50.02 18.74C45.98 17.01 32.18 18.17 27.25 18.17C24.73 18.17 21.29 17.53 19 18.75C16.29 20.2 16.56 25.93 17.84 28.25C20.34 28.33 22.37 26.86 24.97 27.78C32.06 30.28 33.56 40.15 27.1 44.34C23.99 46.35 20.72 44.39 17.58 45.25Z"
					fill="#898989"
					fill-rule="evenodd"
					stroke="#898989"
					stroke-linejoin="round"
					stroke-width="0.25"
				/>
			</svg>

			<svg
				v-else-if="installedHint === 'chrome'"
				xmlns="http://www.w3.org/2000/svg"
				class="browser-extension-icon-hint"
				preserveAspectRatio="xMidYMid meet"
				focusable="false"
				viewBox="0 -960 960 960"
				aria-hidden="true"
			>
				<path
					d="M216-135.869q-33.287 0-56.709-23.422-23.422-23.422-23.422-56.709v-172.304q37.609-2 63.218-28.424 25.608-26.424 25.608-63.272t-25.608-63.272q-25.609-26.424-63.218-28.424V-744q0-33.287 23.422-56.709 23.422-23.422 56.709-23.422h161.065q2.631-40.956 31.96-69.315 29.329-28.359 70.75-28.359t70.975 28.199q29.554 28.199 32.185 69.475H744q33.287 0 56.709 23.422 23.422 23.422 23.422 56.709v161.065q40.956 2.631 69.315 31.96 28.359 29.329 28.359 70.75t-28.199 70.975q-28.199 29.554-69.475 32.185V-216q0 33.287-23.422 56.709-23.422 23.422-56.709 23.422H216Zm2.87-83.001h522.26v-522.26H218.87v108.652q42.13 22.63 65.597 63.772 23.468 41.141 23.468 88.706 0 49.01-23.468 90.168Q261-348.674 218.87-327.283v108.413ZM480-480Z"
					fill="#898989"
				/>
			</svg>

			<svg
				v-else-if="installedHint === 'firefox'"
				xmlns="http://www.w3.org/2000/svg"
				class="browser-extension-icon-hint"
				viewBox="0 0 20 20"
				aria-hidden="true"
			>
				<path
					d="m15.5 5-2 0 0-1.873c0-1.594-1.183-2.961-2.693-3.112A3.003 3.003 0 0 0 7.5 2.999L7.5 5l-3 0A2.5 2.5 0 0 0 2 7.5l0 2.25c0 .69.56 1.25 1.25 1.25l1.623 0c.833 0 1.544.59 1.62 1.343a1.49 1.49 0 0 1-.379 1.163c-.285.314-.69.494-1.113.494L3.25 14C2.56 14 2 14.56 2 15.25l0 2.25A2.5 2.5 0 0 0 4.5 20l11 0a2.5 2.5 0 0 0 2.5-2.5l0-10A2.5 2.5 0 0 0 15.5 5zm1 12.7-.8.8-11.4 0-.8-.8 0-2.2 1.501 0c.846 0 1.657-.36 2.225-.988a3.01 3.01 0 0 0 .759-2.318C7.834 10.683 6.467 9.5 4.873 9.5L3.5 9.5l0-2.2.8-.8 3.7 0a1 1 0 0 0 1-1l0-2.501a1.502 1.502 0 0 1 1.657-1.492c.753.075 1.343.787 1.343 1.62L12 5.5a1 1 0 0 0 1 1l2.7 0 .8.8 0 10.4z"
					fill="#898989"
				/>
			</svg>

			<svg
				v-else-if="installedHint === 'edge'"
				xmlns="http://www.w3.org/2000/svg"
				class="browser-extension-icon-hint"
				viewBox="0 0 20 20"
				aria-hidden="true"
			>
				<path
					d="M11.1 2c-1.07.08-1.94.9-2.08 1.94V4H6.35A1.5 1.5 0 005 5.5v2.27h-.06A2.25 2.25 0 003 10v.16c.08 1.06.9 1.93 1.94 2.07H5v2.42A1.5 1.5 0 006.5 16h2.02v.06A2.25 2.25 0 0010.75 18h.16a2.25 2.25 0 002.07-1.94V16h2.52c.83 0 1.5-.67 1.5-1.5v-3.25h-1.87A1.25 1.25 0 0114 10v-.12c.06-.63.6-1.13 1.25-1.13H17V5.36A1.5 1.5 0 0015.5 4h-2.02v-.06A2.25 2.25 0 0011.25 2h-.15zm.15 1c.69 0 1.25.56 1.25 1.25V5h3l.1.01a.5.5 0 01.4.5v2.24h-.75c-1.17 0-2.15.9-2.24 2.07l-.01.16c0 1.2.9 2.17 2.07 2.26l.16.01H16v2.25a.5.5 0 01-.5.5H12v.75a1.25 1.25 0 01-2.5 0V15h-3a.5.5 0 01-.5-.5v-3.25h-.75a1.25 1.25 0 010-2.5H6V5.5c0-.27.23-.5.5-.5H10v-.75c0-.69.56-1.25 1.25-1.25z"
					fill="#898989"
					fill-rule="nonzero"
				/>
			</svg>

			<svg v-else xmlns="http://www.w3.org/2000/svg" class="browser-extension-icon-hint" viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M9 4C9 2.89543 9.89543 2 11 2C12.1046 2 13 2.89543 13 4V6H18V11H20C21.1046 11 22 11.8954 22 13C22 14.1046 21.1046 15 20 15H18V20H13V18C13 16.8954 12.1046 16 11 16C9.89543 16 9 16.8954 9 18V20H4V15H6C7.10457 15 8 14.1046 8 13C8 11.8954 7.10457 11 6 11H4V6H9V4Z"
					fill="#898989"
				/>
			</svg>
		</div>
	</section>
</template>

<script setup lang="ts">
import appleLogo from "@/assets/img/logo_apple.svg";
import logo from "@/assets/img/logo.svg";
import { markChangelogVersionRead } from "@/util/versionNotice";

const APP_INFO = window.__APP_INFO__;
const APP_BRANDING = __APP_BRANDING__;
const APP_LOGO = APP_BRANDING.isSafari ? appleLogo : logo;
const installedHint = (() => {
	const isIPad = /iPad/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

	if (isIPad) return "safari-ipad";
	if (/Firefox\//.test(navigator.userAgent)) return "firefox";
	if (/Edg\//.test(navigator.userAgent)) return "edge";
	if (/(?:Chrome|CriOS|Chromium)\//.test(navigator.userAgent) && !/(?:OPR|Opera|SamsungBrowser)\//.test(navigator.userAgent))
		return "chrome";
	if (/Macintosh|Mac OS X/.test(navigator.userAgent)) return "safari";
	return "default";
})();

console.log(installedHint);

markChangelogVersionRead().catch(() => {});
</script>

<style lang="scss">
.installed {
	text-align: center;
	display: flex;
	width: 100dvw;
	height: 100dvh;
	flex-direction: column;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: center;

	img {
		width: 150px;
		height: 150px;
	}

	p {
		margin: 10px 0;
		text-align: center;

		&.title {
			font-size: 20px;
			font-weight: bolder;
			margin-top: 10px;
		}

		&.version {
			font-size: 15px;
			margin-bottom: 50px;

			span {
				color: rgba(#000, 0.5);
			}
		}
	}
}

#page-installed {
	#arrow {
		position: fixed;
		left: 15vw;
		top: 20px;
		width: 250px;

		.browser-extension-icon-hint {
			position: absolute;
			left: 0px;
			top: 60px;
			width: 100px;
			height: 100px;
		}
	}
	&.safari-user-agent {
		#arrow {
			left: auto;
			right: min(69%, calc(100% - 320px));
		}
	}

	&.safari-ipad-user-agent {
		#arrow {
			left: 70%;
			transform: translateX(-50%);
			svg:nth-child(1) {
				transform: scaleX(-1);
			}
			svg:nth-child(2) {
				left: 150px;
			}
		}
	}

	&.chrome-user-agent,
	&.default-user-agent {
		#arrow {
			left: auto;
			right: 70px;
		}
	}

	&.firefox-user-agent {
		#arrow {
			left: auto;
			right: 20px;
		}
	}

	&.edge-user-agent {
		#arrow {
			left: auto;
			right: 85px;
		}
	}
}
</style>

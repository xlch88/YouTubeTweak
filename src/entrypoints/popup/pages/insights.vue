<template>
	<section id="page-insights">
		<div v-if="tabResolved && !video && !videoPreview" class="insight-state insight-empty" role="status">
			<span class="empty-visual" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none">
					<rect x="3.25" y="5.25" width="17.5" height="13.5" rx="3.25" />
					<path d="m10.2 9.15 4.8 2.85-4.8 2.85Z" />
					<path d="M6.75 2.75h10.5" />
				</svg>
			</span>
			<strong class="empty-message">{{ isWatchPage ? "—" : $t("insights.label.tips.watchPageRequired") }}</strong>
			<span v-if="!isWatchPage" class="empty-path">youtube.com/watch</span>
		</div>
		<article v-else class="insight-layout">
			<div class="hero">
				<img v-if="thumbnail" :src="thumbnail" crossorigin="anonymous" />
				<div class="hero-copy">
					<span v-if="channelName" class="channel">
						<span>{{ channelName }}</span>
						<small v-if="subscriberCount">{{ subscriberCount }}</small>
						<small v-else-if="nextDataPending" class="subscriber-loading" aria-hidden="true"></small>
					</span>
					<h2>{{ videoTitle }}</h2>
				</div>
			</div>

			<div class="insight-content">
				<div v-if="ageGatePending" class="insight-tip" role="status">
					<span class="tip-icon" aria-hidden="true">
						<svg
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="8" cy="8" r="5.5" />
							<path d="M8 4.8v3.7m0 2.4v.1" />
						</svg>
					</span>
					<span class="tip-copy">
						<strong>{{ $t("insights.label.tips.ageGateTitle") }}</strong>
						<span>{{ $t("insights.label.tips.ageGateDescription") }}</span>
					</span>
				</div>

				<div class="stats">
					<div v-for="item in stats" :key="item.key" class="stat">
						<span class="label">{{ $t(`insights.label.metadata.${item.key}`) }}</span>
						<strong v-if="!item.loading" :title="String(item.value)">{{ item.value }}</strong>
						<span v-else class="field-loading field-loading-stat" aria-hidden="true"></span>
					</div>
				</div>

				<div class="details">
					<div v-for="item in details" :key="item.key" class="detail">
						<span class="label">{{ $t(`insights.label.metadata.${item.key}`) }}</span>
						<span class="value" :title="String(item.value)">{{ item.value }}</span>
					</div>
				</div>

				<div v-if="video" class="media-lists">
					<details
						v-for="section in mediaSections"
						:key="section.key"
						class="media-panel"
						:class="[
							`media-panel-${section.key}`,
							{
								'media-panel-regions': section.layout === 'regions',
								'media-panel-success': section.icon === 'region-allowed',
								'media-panel-danger': section.icon === 'region-blocked',
							},
						]"
						@toggle="onMediaPanelToggle(section.key, $event)"
					>
						<summary>
							<span
								class="section-icon"
								:class="{
									'section-icon-success': section.icon === 'region-allowed',
									'section-icon-danger': section.icon === 'region-blocked',
								}"
							>
								<svg
									v-if="section.key === 'videoFormats'"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<rect x="2.3" y="3.5" width="11.4" height="9" rx="2" />
									<path d="m7 6.2 3.2 1.8L7 9.8Z" fill="currentColor" stroke="none" />
								</svg>
								<svg
									v-else-if="section.key === 'audioFormats'"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.7"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M6.3 11.2V5.1L12 3.8v5.8" />
									<ellipse cx="4.5" cy="11.3" rx="1.8" ry="1.4" />
									<ellipse cx="10.2" cy="9.7" rx="1.8" ry="1.4" />
								</svg>
								<svg
									v-else-if="section.key === 'subtitles'"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<rect x="2.2" y="3.4" width="11.6" height="9.2" rx="2" />
									<path d="M4.5 7.2h2.2m2.6 0h2.2M4.5 9.6h3m1.4 0h2.6" />
								</svg>
								<svg
									v-else-if="section.key === 'audioTracks'"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.7"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M2.5 6.3h2.2l2.8-2.2v7.8L4.7 9.7H2.5Z" />
									<path d="M10 6.2a2.6 2.6 0 0 1 0 3.6m1.8-5.4a5 5 0 0 1 0 7.2" />
								</svg>
								<svg
									v-else-if="section.icon === 'region-allowed'"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M3 8.5 6.2 11.5 13 4.5" />
								</svg>
								<svg
									v-else-if="section.icon === 'region-blocked'"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									aria-hidden="true"
								>
									<circle cx="8" cy="8" r="5.5" />
									<path d="m5.5 5.5 5 5m0-5-5 5" />
								</svg>
								<svg
									v-else-if="section.icon === 'region-all'"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<circle cx="8" cy="8" r="5.7" />
									<path d="M2.5 8h11M8 2.3c1.7 1.7 2.4 3.6 2.4 5.7S9.7 12 8 13.7C6.3 12 5.6 10.1 5.6 8S6.3 4 8 2.3Z" />
								</svg>
								<template v-else>{{ section.icon }}</template>
							</span>
							<span class="section-title">{{ $t(`insights.label.lists.${section.key}`) }}</span>
							<small class="section-count">
								{{
									formatsLoading && (section.key === "videoFormats" || section.key === "audioFormats")
										? "…"
										: formatsError && (section.key === "videoFormats" || section.key === "audioFormats")
											? "!"
											: (section.count ?? section.items.length)
								}}
							</small>
							<span class="section-chevron" aria-hidden="true">
								<svg
									viewBox="0 0 12 12"
									fill="none"
									stroke="currentColor"
									stroke-width="1.7"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="m2.5 4 3.5 3.5L9.5 4" />
								</svg>
							</span>
						</summary>
						<div
							v-if="(section.key === 'videoFormats' || section.key === 'audioFormats') && (formatsLoading || formatsError)"
							class="media-request-state"
							:class="{ 'media-request-state-error': formatsError && !formatsLoading }"
							aria-live="polite"
						>
							<span v-if="formatsLoading" class="request-dot"></span>
							<svg
								v-else
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								aria-hidden="true"
							>
								<circle cx="8" cy="8" r="5.5" />
								<path d="M8 5v3.5m0 2.2v.1" />
							</svg>
							<span>
								{{ $t(formatsLoading ? "insights.label.lists.loadingFormats" : "insights.label.lists.loadFormatsFailed") }}
							</span>
						</div>
						<div v-if="section.items.length" class="media-items" :class="{ 'region-items': section.layout === 'regions' }">
							<div
								v-for="item in section.items"
								:key="item.key"
								class="media-item"
								:class="{ 'media-item-danger': item.danger }"
							>
								<span v-if="section.layout === 'regions'" class="region-code">{{ item.meta[0] }}</span>
								<div class="media-copy">
									<strong>{{ item.title }}</strong>
									<div
										v-if="section.layout !== 'regions' && item.meta.length"
										class="media-meta"
										:title="item.meta.join(' · ')"
									>
										<span v-for="part in item.meta" :key="part">{{ part }}</span>
									</div>
								</div>
								<button
									v-if="!downloadsDisabled && (item.captionTrack?.baseUrl || item.mediaUrl)"
									class="download-action"
									type="button"
									:title="
										$t(
											downloadError === item.key
												? 'insights.label.lists.downloadFailed'
												: item.captionTrack?.baseUrl
													? 'insights.label.lists.downloadSubtitle'
													: 'insights.label.lists.downloadMedia',
										)
									"
									:aria-label="
										$t(
											item.captionTrack?.baseUrl
												? 'insights.label.lists.downloadSubtitle'
												: 'insights.label.lists.downloadMedia',
										)
									"
									@click.stop="openMedia(item)"
								>
									<svg
										v-if="downloadError === item.key"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										aria-hidden="true"
									>
										<circle cx="8" cy="8" r="5.5" />
										<path d="M8 5v3.5m0 2.2v.1" />
									</svg>
									<svg
										v-else
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.7"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d="M9.5 3H13v3.5M8.2 7.8l4.6-4.6" />
										<path d="M7 4H4.5A1.5 1.5 0 0 0 3 5.5v6A1.5 1.5 0 0 0 4.5 13h6a1.5 1.5 0 0 0 1.5-1.5V9" />
									</svg>
								</button>
							</div>
						</div>
						<div v-else class="media-empty" :class="{ 'media-empty-success': section.message }">
							{{ section.message || "—" }}
						</div>
					</details>
				</div>

				<div class="flags">
					<div
						v-for="flag in flags"
						:key="flag.key"
						class="flag"
						:class="{
							'flag-success': !flag.loading && flag.active !== null && (flag.danger ? !flag.active : flag.active),
							'flag-error': !flag.loading && flag.active !== null && (flag.danger ? flag.active : !flag.active),
							'flag-loading': flag.loading,
							'flag-unknown': !flag.loading && flag.active === null,
						}"
						:title="$t(`insights.label.flags.${flag.key}.description`)"
					>
						<span class="icon">{{ flag.icon }}</span>
						<span class="name">
							<span>{{ $t(`insights.label.flags.${flag.key}.name`) }}</span>
							<small v-if="flag.value">{{ flag.value }}</small>
						</span>
						<span class="status">
							<span v-if="flag.loading" class="status-loading" aria-hidden="true"></span>
							<span v-else-if="flag.active === null">?</span>
							<svg
								v-else
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path v-if="flag.active" d="M3 8.5 6.2 11.5 13 4.5" />
								<path v-else d="m4 4 8 8m0-8-8 8" />
							</svg>
						</span>
					</div>
				</div>
			</div>
		</article>
	</section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

type InsightsData = {
	video: Record<string, any> | null;
	videoNext: Record<string, any> | null;
	anonymousVideo: Record<string, any> | null;
	anonymousVideoNext: Record<string, any> | null;
	regions: { code: string; name: string }[];
	error: string | null;
};

type VideoPreview = {
	title: string;
	thumbnail: string;
};

type MediaListItem = {
	key: string;
	title: string;
	meta: string[];
	captionTrack?: Record<string, any>;
	mediaUrl?: string;
	danger?: boolean;
};

type MediaSection = {
	key: string;
	icon?: string;
	items: MediaListItem[];
	layout?: "rows" | "regions";
	message?: string;
	count?: number;
};

type InsightFlag = {
	key: string;
	icon: string;
	active: boolean | null;
	danger: boolean;
	value?: string;
	loading?: boolean;
};

const YOUTUBE_REGION_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO
JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR
MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO
RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV
TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW
`
	.trim()
	.split(/\s+/);

const FALLBACK_REGION_NAMES: Record<string, string> = {
	AD: "Andorra",
	AF: "Afghanistan",
	AG: "Antigua & Barbuda",
	AI: "Anguilla",
	AL: "Albania",
	AO: "Angola",
	AQ: "Antarctica",
	AS: "American Samoa",
	AW: "Aruba",
	AX: "Åland Islands",
	BB: "Barbados",
	BF: "Burkina Faso",
	BI: "Burundi",
	BJ: "Benin",
	BL: "St. Barthélemy",
	BM: "Bermuda",
	BN: "Brunei",
	BQ: "Caribbean Netherlands",
	BS: "Bahamas",
	BT: "Bhutan",
	BV: "Bouvet Island",
	BW: "Botswana",
	BZ: "Belize",
	CC: "Cocos (Keeling) Islands",
	CD: "Congo - Kinshasa",
	CF: "Central African Republic",
	CG: "Congo - Brazzaville",
	CI: "Côte d’Ivoire",
	CK: "Cook Islands",
	CM: "Cameroon",
	CN: "China",
	CU: "Cuba",
	CV: "Cape Verde",
	CW: "Curaçao",
	CX: "Christmas Island",
	DJ: "Djibouti",
	DM: "Dominica",
	EH: "Western Sahara",
	ER: "Eritrea",
	ET: "Ethiopia",
	FJ: "Fiji",
	FK: "Falkland Islands",
	FM: "Micronesia",
	FO: "Faroe Islands",
	GA: "Gabon",
	GD: "Grenada",
	GF: "French Guiana",
	GG: "Guernsey",
	GI: "Gibraltar",
	GL: "Greenland",
	GM: "Gambia",
	GN: "Guinea",
	GP: "Guadeloupe",
	GQ: "Equatorial Guinea",
	GS: "South Georgia & South Sandwich Islands",
	GU: "Guam",
	GW: "Guinea-Bissau",
	GY: "Guyana",
	HM: "Heard & McDonald Islands",
	HT: "Haiti",
	IM: "Isle of Man",
	IO: "British Indian Ocean Territory",
	IR: "Iran",
	JE: "Jersey",
	KG: "Kyrgyzstan",
	KI: "Kiribati",
	KM: "Comoros",
	KN: "St. Kitts & Nevis",
	KP: "North Korea",
	KY: "Cayman Islands",
	LC: "St. Lucia",
	LR: "Liberia",
	LS: "Lesotho",
	MC: "Monaco",
	MF: "St. Martin",
	MG: "Madagascar",
	MH: "Marshall Islands",
	ML: "Mali",
	MM: "Myanmar (Burma)",
	MN: "Mongolia",
	MO: "Macao SAR China",
	MP: "Northern Mariana Islands",
	MQ: "Martinique",
	MR: "Mauritania",
	MS: "Montserrat",
	MU: "Mauritius",
	MV: "Maldives",
	MW: "Malawi",
	MZ: "Mozambique",
	NA: "Namibia",
	NC: "New Caledonia",
	NE: "Niger",
	NF: "Norfolk Island",
	NR: "Nauru",
	NU: "Niue",
	PF: "French Polynesia",
	PM: "St. Pierre & Miquelon",
	PN: "Pitcairn Islands",
	PS: "Palestinian Territories",
	PW: "Palau",
	RE: "Réunion",
	RW: "Rwanda",
	SB: "Solomon Islands",
	SC: "Seychelles",
	SD: "Sudan",
	SH: "St. Helena",
	SJ: "Svalbard & Jan Mayen",
	SL: "Sierra Leone",
	SM: "San Marino",
	SO: "Somalia",
	SR: "Suriname",
	SS: "South Sudan",
	ST: "São Tomé & Príncipe",
	SX: "Sint Maarten",
	SY: "Syria",
	SZ: "Eswatini",
	TC: "Turks & Caicos Islands",
	TD: "Chad",
	TF: "French Southern Territories",
	TG: "Togo",
	TJ: "Tajikistan",
	TK: "Tokelau",
	TL: "Timor-Leste",
	TM: "Turkmenistan",
	TO: "Tonga",
	TT: "Trinidad & Tobago",
	TV: "Tuvalu",
	UM: "U.S. Outlying Islands",
	UZ: "Uzbekistan",
	VA: "Vatican City",
	VC: "St. Vincent & Grenadines",
	VG: "British Virgin Islands",
	VI: "U.S. Virgin Islands",
	VU: "Vanuatu",
	WF: "Wallis & Futuna",
	WS: "Samoa",
	YT: "Mayotte",
	ZM: "Zambia",
};

const { t } = useI18n();
const insightsData = ref<InsightsData | null>(null);
const videoPreview = ref<VideoPreview | null>(null);
const tabResolved = ref(false);
const isWatchPage = ref(false);
const verificationState = ref<"idle" | "loading" | "loaded" | "error">("idle");
const downloadError = ref<string | null>(null);
const activeTabId = ref<number | null>(null);
const formatsRequested = ref(false);
const formatsLoading = ref(false);
const formatsError = ref<string | null>(null);
const extraFormats = ref<Record<string, any>[]>([]);

onMounted(async () => {
	try {
		const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
		isWatchPage.value = Boolean(tab?.url?.match(/^https:\/\/(www|m)\.youtube\.com\/watch/));
		if (!tab?.id || !isWatchPage.value) return;

		activeTabId.value = tab.id;
		const videoId = new URL(tab.url!).searchParams.get("v");
		if (videoId) {
			videoPreview.value = {
				title: tab.title?.replace(/\s*-\s*YouTube$/i, "") || videoId,
				thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
			};
		}
		tabResolved.value = true;
		insightsData.value = await browser.tabs.sendMessage(tab.id, { action: "getInsightsData" });
		if (insightsData.value?.error) console.warn("Failed to load immediate insights data:", insightsData.value.error);

		verificationState.value = "loading";
		void browser.tabs
			.sendMessage(tab.id, { action: "getInsightsVerificationData" })
			.then((data) => {
				if (data?.error) throw new Error(data.error);
				if (!insightsData.value) return;

				insightsData.value = {
					...insightsData.value,
					anonymousVideo: data?.anonymousVideo || null,
					anonymousVideoNext: data?.anonymousVideoNext || null,
				};
				verificationState.value = "loaded";
			})
			.catch((e) => {
				verificationState.value = "error";
				console.error("Failed to verify insights data without cookies:", e);
			});
		void browser.tabs
			.sendMessage(tab.id, { action: "getInsightsRegionsData" })
			.then((data) => {
				if (!insightsData.value) return;
				insightsData.value = { ...insightsData.value, regions: data?.regions || [] };
				if (data?.error) console.warn("Failed to load YouTube regions:", data.error);
			})
			.catch((e) => console.error("Failed to load YouTube regions:", e));
	} catch (e) {
		console.error("Failed to load insights data:", e);
	} finally {
		tabResolved.value = true;
	}
});

function textOf(value: any) {
	if (typeof value === "string") return value;
	return value?.simpleText || value?.runs?.map((run: Record<string, any>) => run.text).join("") || "";
}

function codecName(mimeType = "") {
	const codec = mimeType.match(/codecs="([^"]+)/)?.[1] || "";
	if (codec.startsWith("avc1")) return "H.264";
	if (codec.startsWith("av01")) return "AV1";
	if (codec.startsWith("vp9")) return "VP9";
	if (codec.startsWith("mp4a")) return "AAC";
	if (codec.startsWith("opus")) return "Opus";
	return codec || "—";
}

function isHdrFormat(format: Record<string, any>) {
	return /hdr/i.test(format.qualityLabel || "") || /2084|hlg/i.test(JSON.stringify(format.colorInfo || {}));
}

function hasAgeRestriction(status: unknown) {
	return /age.?restrict|age.?verification|age.?check|required.*confirm.*age|confirm your age|desktopLegacyAgeGateReason/i.test(
		typeof status === "string" ? status : JSON.stringify(status || {}),
	);
}

function formatSize(contentLength: string | number | undefined) {
	const bytes = Number(contentLength);
	if (!Number.isFinite(bytes) || bytes <= 0) return "";
	return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function formatMetric(value: unknown) {
	const text = String(value ?? "").trim();
	const match = text.replace(/,/g, "").match(/([\d.]+)\s*(万|萬|亿|億|만|억|[KMB])?/i);
	if (!match) return text || "—";

	const unit = match[2]?.toUpperCase();
	const multiplier =
		unit === "万" || unit === "萬" || unit === "만"
			? 10_000
			: unit === "亿" || unit === "億" || unit === "억"
				? 100_000_000
				: unit === "K"
					? 1_000
					: unit === "M"
						? 1_000_000
						: unit === "B"
							? 1_000_000_000
							: 1;
	const number = Number(match[1]) * multiplier;

	return Number.isFinite(number) ? Math.round(number).toLocaleString("en-US") : text;
}

const video = computed(() => insightsData.value?.video || insightsData.value?.anonymousVideo || null);
const videoNext = computed(() => insightsData.value?.videoNext || insightsData.value?.anonymousVideoNext || null);
const anonymousVideo = computed(() => insightsData.value?.anonymousVideo || null);
const verificationPending = computed(() => verificationState.value === "loading");
const verificationAvailable = computed(() => verificationState.value === "loaded");
const nextDataPending = computed(() => !videoNext.value && verificationPending.value);
const videoDetails = computed(() => ({
	...(anonymousVideo.value?.videoDetails || {}),
	...(video.value?.videoDetails || {}),
}));
const microformat = computed(() => ({
	...(anonymousVideo.value?.microformat?.playerMicroformatRenderer || {}),
	...(video.value?.microformat?.playerMicroformatRenderer || {}),
}));
const playabilityStatus = computed(() => video.value?.playabilityStatus || {});
const anonymousPlayabilityStatus = computed(() => anonymousVideo.value?.playabilityStatus || null);
const currentPlayabilityText = computed(() => JSON.stringify(playabilityStatus.value || {}));
const combinedPlayabilityText = computed(() => JSON.stringify([playabilityStatus.value || {}, anonymousPlayabilityStatus.value || {}]));
const currentAgeRestricted = computed<boolean | null>(() => (video.value ? hasAgeRestriction(currentPlayabilityText.value) : null));
const isAgeRestricted = computed<boolean | null>(() => {
	if (currentAgeRestricted.value === true) return true;
	if (!verificationAvailable.value || !anonymousVideo.value) return null;
	return hasAgeRestriction(combinedPlayabilityText.value);
});
const isLoginRestricted = computed<boolean | null>(() => {
	if (!verificationAvailable.value || !anonymousVideo.value) return null;
	return (
		(playabilityStatus.value.status === "LOGIN_REQUIRED" || anonymousPlayabilityStatus.value?.status === "LOGIN_REQUIRED") &&
		isAgeRestricted.value !== true
	);
});
const ageGatePending = computed(() => {
	const status = insightsData.value?.video?.playabilityStatus;
	if (!status || status.status === "OK") return false;

	return (
		hasAgeRestriction(status) ||
		/content.?check|required.*(?:confirm|proceed)|i understand and wish to proceed|我了解并希望继续观看|继续观看/i.test(
			JSON.stringify(status),
		)
	);
});
const isKidsContent = computed<boolean | null>(() => {
	const kidsFlag = videoDetails.value.isKids ?? microformat.value.isKids;
	if (typeof kidsFlag === "boolean") return kidsFlag;

	const miniplayerMode = playabilityStatus.value.miniplayer?.miniplayerRenderer?.playbackMode;
	if (miniplayerMode === "PLAYBACK_MODE_PAUSED_ONLY") return true;
	if (miniplayerMode === "PLAYBACK_MODE_ALLOW") return false;
	return null;
});
const downloadsDisabled = computed(
	() =>
		!verificationAvailable.value || isAgeRestricted.value === true || isLoginRestricted.value === true || isKidsContent.value === true,
);
const captionsData = computed(() => video.value?.captions?.playerCaptionsTracklistRenderer || {});
const muxedFormats = computed<Record<string, any>[]>(() => video.value?.streamingData?.formats || []);
const adaptiveFormats = computed<Record<string, any>[]>(() => video.value?.streamingData?.adaptiveFormats || []);
const premiumFormats = computed<Record<string, any>[]>(
	() => playabilityStatus.value.paygatedQualitiesMetadata?.restrictedAdaptiveFormats || [],
);
const allFormats = computed(() => {
	const formats = new Map<string, Record<string, any>>();

	[...muxedFormats.value, ...adaptiveFormats.value, ...premiumFormats.value, ...extraFormats.value].forEach((format, index) => {
		const key = format.itag
			? `${format.itag}:${format.mimeType || ""}:${format.audioTrack?.id || ""}`
			: `${format.mimeType || ""}:${format.qualityLabel || format.audioQuality || ""}:${format.bitrate || index}`;
		const existing = formats.get(key);
		if (!existing || (!existing.url && format.url)) formats.set(key, format);
	});

	return [...formats.values()];
});
const captionTracks = computed<Record<string, any>[]>(() => captionsData.value.captionTracks || []);
const translationLanguages = computed<Record<string, any>[]>(() => captionsData.value.translationLanguages || []);
const availableCountryCodes = computed<string[] | null>(() =>
	Array.isArray(microformat.value.availableCountries) ? microformat.value.availableCountries : null,
);
const youtubeRegions = computed(() => insightsData.value?.regions || []);
const audioFormats = computed(() => allFormats.value.filter((format) => format.mimeType?.startsWith("audio/")));
const videoFormats = computed(() =>
	allFormats.value
		.filter((format) => format.mimeType?.startsWith("video/"))
		.sort((a, b) => (b.height || 0) - (a.height || 0) || (b.bitrate || 0) - (a.bitrate || 0)),
);
const nextContents = computed<Record<string, any>[]>(
	() => videoNext.value?.contents?.twoColumnWatchNextResults?.results?.results?.contents || [],
);
const engagementPanels = computed<Record<string, any>[]>(() => videoNext.value?.engagementPanels || []);
const commentPanel = computed(() =>
	engagementPanels.value.find((item) => item.engagementPanelSectionListRenderer?.panelIdentifier === "engagement-panel-comments-section"),
);
const commentSection = computed(
	() => nextContents.value.find((item) => item?.itemSectionRenderer?.sectionIdentifier === "comment-item-section")?.itemSectionRenderer,
);
const subscriberCount = computed(() => {
	const secondaryInfo = nextContents.value.find((item) => item.videoSecondaryInfoRenderer)?.videoSecondaryInfoRenderer;
	return textOf(secondaryInfo?.owner?.videoOwnerRenderer?.subscriberCountText);
});
const commentCount = computed(() =>
	textOf(commentPanel.value?.engagementPanelSectionListRenderer?.header?.engagementPanelTitleHeaderRenderer?.contextualInfo),
);
const thumbnail = computed(() => {
	const thumbnails = microformat.value.thumbnail?.thumbnails || videoDetails.value.thumbnail?.thumbnails || [];
	return thumbnails[thumbnails.length - 1]?.url || videoPreview.value?.thumbnail || "";
});
const videoTitle = computed(() => videoDetails.value.title || microformat.value.title?.simpleText || videoPreview.value?.title || "—");
const channelName = computed(
	() => microformat.value.ownerChannelName || videoDetails.value.author || microformat.value.ownerProfileUrl || "",
);
const videoFormatItems = computed<MediaListItem[]>(() => {
	const premiumItags = new Set(premiumFormats.value.map((format) => format.itag));

	return videoFormats.value.map((format, index) => {
		const meta = [
			codecName(format.mimeType),
			format.fps ? `${format.fps} FPS` : "",
			isHdrFormat(format) ? "HDR" : "SDR",
			format.averageBitrate || format.bitrate ? `${Math.round((format.averageBitrate || format.bitrate) / 1000)} kbps` : "",
			formatSize(format.contentLength),
			format.itag ? `itag ${format.itag}` : "",
			format.audioQuality ? "A/V" : "",
		].filter(Boolean);

		return {
			key: `video-${format.itag || index}-${index}`,
			title: `${format.qualityLabel || format.quality || "—"}${premiumItags.has(format.itag) ? ` · ${t("insights.label.lists.premium")}` : ""}`,
			meta,
			mediaUrl: format.url,
		};
	});
});
const audioFormatItems = computed<MediaListItem[]>(() =>
	audioFormats.value
		.slice()
		.sort((a, b) => (b.averageBitrate || b.bitrate || 0) - (a.averageBitrate || a.bitrate || 0))
		.map((format, index) => ({
			key: `audio-${format.itag || index}-${index}`,
			title: `${codecName(format.mimeType)} · ${Math.round((format.averageBitrate || format.bitrate || 0) / 1000)} kbps`,
			meta: [
				format.audioSampleRate ? `${Math.round(Number(format.audioSampleRate) / 1000)} kHz` : "",
				format.audioChannels ? `${format.audioChannels} ch` : "",
				format.audioQuality || "",
				format.isDrc ? "DRC" : "",
				formatSize(format.contentLength),
				format.itag ? `itag ${format.itag}` : "",
			].filter(Boolean),
			mediaUrl: format.url,
		})),
);
const captionItems = computed<MediaListItem[]>(() =>
	captionTracks.value.map((track, index) => ({
		key: `caption-${track.vssId || track.languageCode || index}-${index}`,
		title: textOf(track.name) || track.languageCode || `#${index + 1}`,
		meta: [
			track.languageCode || "",
			track.kind === "asr" ? t("insights.label.lists.autoGenerated") : "",
			track.isTranslatable ? t("insights.label.lists.translatable") : "",
		].filter(Boolean),
		captionTrack: track,
	})),
);
const audioTrackItems = computed<MediaListItem[]>(() => {
	const formatTracks = new Map<string, { track: Record<string, any>; formats: Record<string, any>[] }>();

	audioFormats.value.forEach((format, index) => {
		if (!format.audioTrack) return;
		const key = format.audioTrack.id || textOf(format.audioTrack.displayName) || `track-${index}`;
		const group = formatTracks.get(key) || { track: format.audioTrack, formats: [] as Record<string, any>[] };
		group.formats.push(format);
		formatTracks.set(key, group);
	});

	if (formatTracks.size) {
		return [...formatTracks.entries()].map(([key, group], index) => {
			const directFormat = group.formats
				.filter((format) => format.url)
				.sort((a, b) => (b.averageBitrate || b.bitrate || 0) - (a.averageBitrate || a.bitrate || 0))[0];
			const title = textOf(group.track.displayName) || group.track.id || `${t("insights.label.lists.audioTrack")} ${index + 1}`;

			return {
				key: `track-${key}-${index}`,
				title,
				meta: [
					group.track.audioIsDefault ? t("insights.label.lists.default") : "",
					[...new Set(group.formats.map((format) => codecName(format.mimeType)))].join(" / "),
					`${group.formats.length}×`,
				].filter(Boolean),
				mediaUrl: directFormat?.url,
			};
		});
	}

	const captionAudioTracks = captionsData.value.audioTracks || [];
	if (!captionAudioTracks.length && audioFormats.value.length) {
		const directFormat = audioFormats.value
			.filter((format) => format.url)
			.sort((a, b) => (b.averageBitrate || b.bitrate || 0) - (a.averageBitrate || a.bitrate || 0))[0];

		return [
			{
				key: "track-default",
				title: `${t("insights.label.lists.audioTrack")} 1 · ${t("insights.label.lists.default")}`,
				meta: [[...new Set(audioFormats.value.map((format) => codecName(format.mimeType)))].join(" / ")],
				mediaUrl: directFormat?.url,
			},
		];
	}

	return captionAudioTracks.map((track: Record<string, any>, index: number) => {
		const languages = (track.captionTrackIndices || [])
			.map((captionIndex: number) => textOf(captionTracks.value[captionIndex]?.name))
			.filter(Boolean);
		const isDefault = captionsData.value.defaultAudioTrackIndex === index || track.hasDefaultTrack;

		return {
			key: `track-${index}`,
			title: `${t("insights.label.lists.audioTrack")} ${index + 1}${isDefault ? ` · ${t("insights.label.lists.default")}` : ""}`,
			meta: [`${languages.slice(0, 4).join(" / ")}${languages.length > 4 ? ` +${languages.length - 4}` : ""}`],
		};
	});
});
const allRegionCodes = computed(() => [...new Set([...YOUTUBE_REGION_CODES, ...(availableCountryCodes.value || [])])]);
const regionDisplay = computed(() => {
	if (!availableCountryCodes.value) return { mode: "unknown" as const, codes: [] as string[] };
	const availableCountries = new Set(availableCountryCodes.value);
	const unavailableCountries = allRegionCodes.value.filter((code) => !availableCountries.has(code));

	if (!unavailableCountries.length) return { mode: "unrestricted" as const, codes: [] as string[] };
	if (unavailableCountries.length < availableCountries.size) {
		return { mode: "blocked" as const, codes: unavailableCountries };
	}

	return {
		mode: "allowed" as const,
		codes: allRegionCodes.value.filter((code) => availableCountries.has(code)),
	};
});
const regionItems = computed<MediaListItem[]>(() => {
	const regionNames = new Map(youtubeRegions.value.map(({ code, name }) => [code, name]));

	return regionDisplay.value.codes.map((code) => ({
		key: `region-${code}`,
		title: regionNames.get(code) || FALLBACK_REGION_NAMES[code] || code,
		meta: [code],
		danger: regionDisplay.value.mode === "blocked",
	}));
});
const supportedRegionCount = computed(() => new Set(availableCountryCodes.value || []).size);
const mediaSections = computed<MediaSection[]>(() =>
	[
		{ key: "videoFormats", items: videoFormatItems.value },
		{ key: "audioFormats", items: audioFormatItems.value },
		{ key: "subtitles", items: captionItems.value },
		{ key: "audioTracks", items: audioTrackItems.value },
		{
			key: "regions",
			icon:
				regionDisplay.value.mode === "blocked"
					? "region-blocked"
					: regionDisplay.value.mode === "allowed"
						? "region-allowed"
						: "region-all",
			items: regionItems.value,
			layout: "regions" as const,
			message: regionDisplay.value.mode === "unrestricted" ? t("insights.label.lists.noRestrictions") : undefined,
			count: regionDisplay.value.mode === "unrestricted" ? allRegionCodes.value.length : undefined,
		},
	].filter((section) => section.layout === "regions" || section.items.length),
);
const metadata = computed(() => {
	const publishDate = microformat.value.publishDate;
	const uploadDate = microformat.value.uploadDate;
	const maxFps = videoFormats.value.reduce((best, format) => Math.max(best, format.fps || 0), 0);
	const videoCodecs = [...new Set(videoFormats.value.map((format) => codecName(format.mimeType)))];

	return {
		date: publishDate && uploadDate && publishDate !== uploadDate ? `${publishDate} (${uploadDate})` : publishDate || uploadDate || "—",
		likeCount: formatMetric(microformat.value.likeCount),
		viewCount: formatMetric(microformat.value.viewCount || videoDetails.value.viewCount),
		category: microformat.value.category || "—",
		sec: formatMetric(videoDetails.value.lengthSeconds || microformat.value.lengthSeconds),
		subscriberCount: formatMetric(subscriberCount.value),
		channelId: videoDetails.value.channelId || microformat.value.externalChannelId || "—",
		username:
			microformat.value.ownerProfileUrl?.split("/").filter(Boolean).pop() ||
			microformat.value.ownerChannelName ||
			videoDetails.value.author ||
			"—",
		countries: availableCountryCodes.value ? `${supportedRegionCount.value} / ${allRegionCodes.value.length}` : "—",
		captions: captionTracks.value.length ? `${captionTracks.value.length} / ${translationLanguages.value.length}` : "—",
		codecs: videoCodecs.length ? videoCodecs.join(" / ") : "—",
		displayMode: videoFormats.value.length
			? `${maxFps ? `${maxFps} FPS` : "—"} · ${videoFormats.value.some(isHdrFormat) ? "HDR" : "SDR"}`
			: "—",
		tags: Array.isArray(videoDetails.value.keywords) ? videoDetails.value.keywords.length : "—",
	};
});
const stats = computed(() =>
	(["viewCount", "likeCount", "sec", "subscriberCount"] as const).map((key) => ({
		key,
		value: metadata.value[key],
		loading: key === "subscriberCount" && !subscriberCount.value && nextDataPending.value,
	})),
);
const details = computed(() =>
	(["date", "category", "username", "channelId", "countries", "captions", "codecs", "displayMode", "tags"] as const).map((key) => ({
		key,
		value: metadata.value[key],
	})),
);

async function openMedia(item: MediaListItem) {
	if (downloadsDisabled.value || (!item.captionTrack?.baseUrl && !item.mediaUrl)) return;

	downloadError.value = null;
	try {
		let url = item.mediaUrl;
		if (item.captionTrack?.baseUrl) {
			if (!activeTabId.value) return;
			const result = await browser.tabs.sendMessage(activeTabId.value, {
				action: "getInsightsSubtitleUrl",
				captionTrack: item.captionTrack,
			});
			if (!result?.url) throw new Error(result?.error || "subtitle-url-unavailable");
			url = result.url;
		}

		if (url) await browser.tabs.create({ url });
	} catch (error) {
		downloadError.value = item.key;
		console.error("Failed to open media:", error);
	}
}

function onMediaPanelToggle(sectionKey: string, event: Event) {
	if (
		!(event.currentTarget as HTMLDetailsElement).open ||
		(sectionKey !== "videoFormats" && sectionKey !== "audioFormats") ||
		formatsRequested.value ||
		downloadsDisabled.value ||
		!activeTabId.value
	)
		return;

	formatsRequested.value = true;
	formatsLoading.value = true;
	formatsError.value = null;
	browser.tabs
		.sendMessage(activeTabId.value, { action: "getInsightsFormats" })
		.then((result) => {
			extraFormats.value = Array.isArray(result?.formats) ? result.formats : [];
			if (!extraFormats.value.length) {
				formatsRequested.value = false;
				formatsError.value = result?.error || "no-formats";
			}
			if (result?.error) {
				console.warn("Failed to load all additional media formats:", result.error);
			}
		})
		.catch((error) => {
			formatsRequested.value = false;
			formatsError.value = error instanceof Error ? error.message : String(error);
			console.error("Failed to load additional media formats:", error);
		})
		.finally(() => {
			formatsLoading.value = false;
		});
}

const flags = computed<InsightFlag[]>(() => {
	const availableCountries = availableCountryCodes.value;
	const playabilityText = combinedPlayabilityText.value;
	const videoNextText = videoNext.value ? JSON.stringify(videoNext.value) : "";
	const currentMembershipRestricted = video.value
		? /members?.only|membership|sponsor|ypcOffer/i.test(currentPlayabilityText.value)
		: null;
	const membershipRestricted =
		currentMembershipRestricted === true
			? true
			: verificationAvailable.value && anonymousVideo.value
				? /members?.only|membership|sponsor|ypcOffer/i.test(playabilityText)
				: null;
	const copyrightBlocked =
		video.value || anonymousVideo.value
			? /copyright|著作権|版权|版權|저작권|derechos de autor|droits d’auteur|urheberrecht/i.test(playabilityText)
			: null;
	const communityBlocked =
		video.value || anonymousVideo.value
			? /community guidelines?|violat(?:e[ds]?|ing)[^"]{0,80}guidelines?|社区准则|社群規範|コミュニティ ガイドライン|커뮤니티 가이드/i.test(
					playabilityText,
				)
			: null;
	const regionRestricted = availableCountries === null ? null : regionDisplay.value.mode !== "unrestricted";
	const blocked =
		video.value && anonymousVideo.value && verificationAvailable.value && regionRestricted !== null
			? (playabilityStatus.value.status !== "OK" || anonymousPlayabilityStatus.value?.status !== "OK") &&
				!isAgeRestricted.value &&
				!membershipRestricted &&
				!regionRestricted &&
				!isLoginRestricted.value &&
				!copyrightBlocked &&
				!communityBlocked
			: null;

	return [
		{
			key: "global",
			icon: "🌍",
			active: availableCountries === null ? null : regionDisplay.value.mode === "unrestricted",
			danger: false,
			value: availableCountries === null ? undefined : `${supportedRegionCount.value}/${allRegionCodes.value.length}`,
			loading: availableCountries === null && verificationPending.value,
		},
		{
			key: "family",
			icon: "🏠",
			active: typeof microformat.value.isFamilySafe === "boolean" ? microformat.value.isFamilySafe : null,
			danger: false,
			loading: typeof microformat.value.isFamilySafe !== "boolean" && verificationPending.value,
		},
		{
			key: "comment",
			icon: "💬",
			active:
				isKidsContent.value === true
					? false
					: videoNext.value
						? Boolean(commentCount.value) ||
							commentSection.value?.contents?.some(
								(item: Record<string, any>) =>
									item.commentsEntryPointHeaderRenderer || item.commentThreadRenderer || item.continuationItemRenderer,
							) ||
							false
						: null,
			danger: false,
			value: commentCount.value || undefined,
			loading: isKidsContent.value !== true && !videoNext.value && verificationPending.value,
		},
		{
			key: "premium",
			icon: "💎",
			active: video.value ? premiumFormats.value.length > 0 : null,
			danger: false,
		},
		{
			key: "transcript",
			icon: "📝",
			active: videoNext.value
				? engagementPanels.value.some((item) => item.engagementPanelSectionListRenderer?.panelIdentifier?.includes("transcript"))
				: null,
			danger: false,
			loading: !videoNext.value && verificationPending.value,
		},
		{
			key: "clip",
			icon: "✂️",
			active: videoNext.value
				? engagementPanels.value.some(
						(item) => item.engagementPanelSectionListRenderer?.panelIdentifier === "engagement-panel-clip-create",
					)
				: null,
			danger: false,
			loading: !videoNext.value && verificationPending.value,
		},
		{
			key: "storyboard",
			icon: "🎞️",
			active: video.value ? Boolean(video.value.storyboards?.playerStoryboardSpecRenderer) : null,
			danger: false,
		},
		{
			key: "login",
			icon: "🔑",
			active: isLoginRestricted.value,
			danger: true,
			loading: verificationPending.value,
		},
		{
			key: "emergency",
			icon: "🙅",
			active: videoNext.value ? /"(?:emergency|crisis|selfHarm|suicide)[^"]*Renderer"\s*:/i.test(videoNextText) : null,
			danger: true,
			loading: !videoNext.value && verificationPending.value,
		},
		{ key: "copyright", icon: "©️", active: copyrightBlocked, danger: true },
		{ key: "community", icon: "⚠️", active: communityBlocked, danger: true },
		{
			key: "blocked",
			icon: "🚫",
			active: blocked,
			danger: true,
			loading: verificationPending.value,
		},
		{
			key: "r18",
			icon: "⛔",
			active: isAgeRestricted.value,
			danger: true,
			loading: currentAgeRestricted.value !== true && verificationPending.value,
		},
		{
			key: "crawlable",
			icon: "㊙️",
			active:
				typeof microformat.value.isUnlisted === "boolean"
					? microformat.value.isUnlisted
					: typeof videoDetails.value.isCrawlable === "boolean"
						? !videoDetails.value.isCrawlable
						: null,
			danger: true,
		},
		{
			key: "private",
			icon: "🔒",
			active: typeof videoDetails.value.isPrivate === "boolean" ? videoDetails.value.isPrivate : null,
			danger: true,
		},
		{
			key: "membership",
			icon: "💸",
			active: membershipRestricted,
			danger: true,
			loading: currentMembershipRestricted !== true && verificationPending.value,
		},
		{
			key: "kids",
			icon: "🧒",
			active: isKidsContent.value,
			danger: true,
		},
		{
			key: "embed",
			icon: "🔗",
			active: typeof playabilityStatus.value.playableInEmbed === "boolean" ? playabilityStatus.value.playableInEmbed : null,
			danger: false,
		},
		{
			key: "ads",
			icon: "📢",
			active:
				video.value && playabilityStatus.value.status === "OK"
					? Boolean(video.value.adPlacements?.length || video.value.playerAds?.length)
					: null,
			danger: false,
		},
		{
			key: "shorts",
			icon: "📱",
			active: typeof microformat.value.isShortsEligible === "boolean" ? microformat.value.isShortsEligible : null,
			danger: false,
		},
	];
});
</script>

<style lang="scss">
#page-insights {
	--insights-accent: #d739e3;

	.insight-state {
		min-height: 180px;
		color: #8a8c98;

		&.insight-empty {
			min-height: calc(100vh - 44px);
			padding: 30px 24px;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 11px;
			text-align: center;

			.empty-visual {
				width: 62px;
				height: 50px;
				display: grid;
				place-items: center;
				color: var(--insights-accent);

				svg {
					width: 46px;
					height: 46px;
					stroke: currentColor;
					stroke-width: 1.4;
					stroke-linecap: round;
					stroke-linejoin: round;

					path:nth-of-type(1) {
						fill: currentColor;
						stroke: none;
					}
				}
			}

			.empty-message {
				max-width: 300px;
				color: #413d46;
				font-size: 14px;
				font-weight: 680;
				line-height: 1.45;
			}

			.empty-path {
				color: #8b8790;
				font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
				font-size: 10px;
				letter-spacing: 0.02em;
			}
		}
	}

	.insight-layout {
		.hero {
			width: 100%;
			position: relative;
			aspect-ratio: 16 / 9;
			overflow: hidden;
			background: #e9e9ee;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			&::after {
				content: "";
				position: absolute;
				inset: 32% 0 0;
				background: linear-gradient(to bottom, transparent, rgba(#09070a, 0.78));
				pointer-events: none;
				transition: opacity 0.22s ease;
			}

			.hero-copy {
				position: absolute;
				z-index: 1;
				right: 13px;
				bottom: 11px;
				left: 13px;
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				gap: 5px;
				color: white;
				transition:
					opacity 0.22s ease,
					transform 0.22s ease;

				.channel {
					max-width: 100%;
					padding: 3px 7px;
					display: flex;
					align-items: center;
					gap: 6px;
					border: 1px solid rgba(#fff, 0.24);
					border-radius: 99px;
					background: rgba(#111, 0.34);
					font-size: 10px;
					line-height: 1;

					> span {
						min-width: 0;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}

					small {
						flex: 0 0 auto;
						padding-left: 6px;
						border-left: 1px solid rgba(#fff, 0.24);
						font-size: 9px;

						&.subscriber-loading {
							width: 34px;
							height: 7px;
							border-radius: 4px;
							background: linear-gradient(100deg, rgba(#fff, 0.2) 28%, rgba(#fff, 0.48) 42%, rgba(#fff, 0.2) 58%);
							background-size: 220% 100%;
							animation: insights-shimmer 1.35s ease-in-out infinite;
						}
					}
				}

				h2 {
					margin: 0;
					display: -webkit-box;
					overflow: hidden;
					font-size: 14px;
					line-height: 1.35;
					text-shadow: 0 1px 8px rgba(#000, 0.55);
					word-break: break-word;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 2;
				}
			}

			&:hover {
				&::after {
					opacity: 0;
				}

				.hero-copy {
					opacity: 0;
					transform: translateY(6px);
					pointer-events: none;
				}
			}
		}

		.insight-content {
			padding: 12px 4px 14px 10px;

			@supports (-webkit-touch-callout: none) {
				@media (hover: none) and (pointer: coarse) and (max-width: 932px) {
					padding-right: 10px;
				}
			}

			.insight-tip,
			.stat,
			.details,
			.media-panel,
			.flags {
				box-shadow:
					0 1px 2px rgba(37, 39, 51, 0.04),
					0 5px 16px rgba(37, 39, 51, 0.06);
			}

			.insight-tip {
				margin-bottom: 10px;
				padding: 9px;
				display: grid;
				grid-template-columns: 30px minmax(0, 1fr);
				align-items: center;
				gap: 9px;
				border: 1px solid rgba(#c47732, 0.24);
				border-radius: 9px;
				background: #fffaf5;
				color: #9b591f;

				.tip-icon {
					width: 30px;
					height: 30px;
					display: grid;
					place-items: center;
					border-radius: 8px;
					background: rgba(#c47732, 0.1);

					svg {
						width: 16px;
						height: 16px;
					}
				}

				.tip-copy {
					min-width: 0;
					display: flex;
					flex-direction: column;
					gap: 3px;

					strong {
						color: #754116;
						font-size: 10px;
						line-height: 1.3;
					}

					> span {
						color: #966439;
						font-size: 9px;
						line-height: 1.45;
					}
				}
			}

			.label {
				color: #85838b;
				font-size: 10px;
				font-weight: 600;
			}

			.field-loading {
				display: inline-block;
				border-radius: 5px;
				background: linear-gradient(100deg, #ececf1 28%, #f8f8fa 42%, #ececf1 58%);
				background-size: 220% 100%;
				animation: insights-shimmer 1.35s ease-in-out infinite;

				&.field-loading-stat {
					width: 68%;
					height: 13px;
					margin-top: 5px;
				}
			}

			.stats {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 7px;

				.stat {
					min-width: 0;
					padding: 8px 9px;
					border: 1px solid #ecebf0;
					border-radius: 8px;
					background: #fff;

					strong {
						margin-top: 3px;
						display: block;
						overflow: hidden;
						color: #28252b;
						font-size: 13px;
						line-height: 1.2;
						text-overflow: ellipsis;
						white-space: nowrap;
						user-select: all;
					}
				}
			}

			.details {
				margin-top: 10px;
				padding: 2px 9px;
				border: 1px solid #ecebf0;
				border-radius: 8px;
				background: #fff;

				.detail {
					min-width: 0;
					padding: 7px 0;
					display: grid;
					grid-template-columns: auto minmax(0, 1fr);
					align-items: center;
					gap: 12px;
					border-bottom: 1px solid #f0eff2;

					&:last-child {
						border-bottom: 0;
					}

					.value {
						overflow: hidden;
						color: #37333a;
						font-size: 11px;
						font-weight: 600;
						text-align: right;
						text-overflow: ellipsis;
						white-space: nowrap;
						user-select: all;
					}
				}
			}

			.media-lists {
				margin-top: 10px;
				display: flex;
				flex-direction: column;
				gap: 8px;

				.media-panel {
					--media-accent: #a425ac;
					--media-border: rgba(164, 37, 172, 0.2);
					--media-soft: rgba(215, 57, 227, 0.07);
					--media-surface: #fcf8fd;

					overflow: hidden;
					border: 1px solid #ecebf0;
					border-radius: 10px;
					background: #fff;
					transition:
						border-color 0.16s ease,
						box-shadow 0.16s ease;

					&.media-panel-audioFormats {
						--media-accent: #3975c6;
						--media-border: rgba(57, 117, 198, 0.22);
						--media-soft: rgba(57, 117, 198, 0.075);
						--media-surface: #f7faff;
					}

					&.media-panel-subtitles {
						--media-accent: #248a7b;
						--media-border: rgba(36, 138, 123, 0.22);
						--media-soft: rgba(36, 138, 123, 0.075);
						--media-surface: #f6fbfa;
					}

					&.media-panel-audioTracks {
						--media-accent: #b86a2e;
						--media-border: rgba(184, 106, 46, 0.22);
						--media-soft: rgba(184, 106, 46, 0.075);
						--media-surface: #fdf9f5;
					}

					&.media-panel-success {
						--media-accent: #318657;
						--media-border: rgba(49, 134, 87, 0.22);
						--media-soft: rgba(49, 134, 87, 0.075);
						--media-surface: #f7fbf8;
					}

					&.media-panel-danger {
						--media-accent: #d3473e;
						--media-border: rgba(211, 71, 62, 0.22);
						--media-soft: rgba(211, 71, 62, 0.075);
						--media-surface: #fdf8f7;
					}

					summary {
						min-height: 46px;
						padding: 7px 9px;
						display: grid;
						grid-template-columns: 30px minmax(0, 1fr) auto 13px;
						align-items: center;
						gap: 8px;
						color: #37333a;
						cursor: pointer;
						list-style: none;
						transition: background 0.16s ease;

						&::-webkit-details-marker {
							display: none;
						}

						&:hover {
							background: var(--media-surface);
						}

						.section-icon {
							width: 30px;
							height: 30px;
							display: grid;
							place-items: center;
							border: 1px solid var(--media-border);
							border-radius: 8px;
							background: var(--media-soft);
							color: var(--media-accent);
							font-size: 13px;
							font-weight: 800;
							letter-spacing: -0.04em;

							svg {
								width: 15px;
								height: 15px;
							}

							&.section-icon-success {
								border-color: rgba(#3b9d65, 0.18);
								background: rgba(#3b9d65, 0.08);
								color: #318657;
							}

							&.section-icon-danger {
								border-color: rgba(#e25349, 0.18);
								background: rgba(#e25349, 0.08);
								color: #d3473e;
							}
						}

						.section-title {
							overflow: hidden;
							font-size: 11px;
							font-weight: 680;
							text-overflow: ellipsis;
							white-space: nowrap;
						}

						.section-count {
							min-width: 24px;
							padding: 3px 7px;
							border-radius: 99px;
							background: var(--media-soft);
							color: var(--media-accent);
							font-size: 9px;
							font-weight: 700;
							text-align: center;
						}

						.section-chevron {
							width: 14px;
							height: 14px;
							display: grid;
							place-items: center;
							color: #96929b;
							transition: transform 0.16s ease;

							svg {
								width: 12px;
								height: 12px;
							}
						}
					}

					&[open] {
						border-color: var(--media-border);
						box-shadow:
							0 2px 4px rgba(37, 39, 51, 0.04),
							0 8px 20px rgba(37, 39, 51, 0.075);

						summary {
							background: var(--media-surface);
							border-bottom: 1px solid #f0eff2;

							.section-icon {
								border-color: var(--media-border);
								background: var(--media-soft);
							}

							.section-chevron {
								transform: rotate(180deg);
							}
						}
					}

					.media-request-state {
						margin: 6px 6px 0;
						padding: 7px 9px;
						display: flex;
						align-items: center;
						gap: 7px;
						border: 1px solid var(--media-border);
						border-radius: 8px;
						background: var(--media-soft);
						color: var(--media-accent);
						font-size: 9px;
						font-weight: 650;

						.request-dot {
							width: 7px;
							height: 7px;
							flex: 0 0 auto;
							border-radius: 50%;
							background: currentColor;
							animation: insights-pulse 0.55s ease-in-out infinite alternate;
						}

						svg {
							width: 13px;
							height: 13px;
							flex: 0 0 auto;
						}

						&.media-request-state-error {
							border-color: rgba(#e25349, 0.2);
							background: rgba(#e25349, 0.06);
							color: #c7423a;
						}
					}

					&:not(.media-panel-regions) {
						.media-items {
							padding: 6px;
							display: grid;
							gap: 5px;
							background: linear-gradient(180deg, var(--media-surface) 0, #fff 96px);

							.media-item {
								position: relative;
								min-width: 0;
								padding: 7px 8px 7px 11px;
								overflow: hidden;
								display: flex;
								align-items: center;
								gap: 10px;
								border: 1px solid #ebe9ef;
								border-radius: 9px;
								background: #fff;
								box-shadow: 0 1px 2px rgba(37, 39, 51, 0.035);
								transition:
									border-color 0.14s ease,
									box-shadow 0.14s ease,
									transform 0.14s ease;

								&::before {
									content: "";
									position: absolute;
									top: 7px;
									bottom: 7px;
									left: 0;
									width: 3px;
									border-radius: 0 3px 3px 0;
									background: var(--media-accent);
									opacity: 0.72;
								}

								&:hover {
									border-color: var(--media-border);
									box-shadow:
										0 2px 4px rgba(37, 39, 51, 0.045),
										0 7px 16px rgba(37, 39, 51, 0.065);
									transform: translateY(-1px);
								}

								.media-copy {
									min-width: 0;
									flex: 1;

									strong {
										display: block;
										overflow: hidden;
										color: #2d2930;
										font-size: 11px;
										font-weight: 720;
										letter-spacing: -0.01em;
										line-height: 1.3;
										text-overflow: ellipsis;
										white-space: nowrap;
									}

									.media-meta {
										margin-top: 5px;
										display: flex;
										flex-wrap: wrap;
										gap: 4px;

										span {
											padding: 2px 5px;
											border: 1px solid #eceaf0;
											border-radius: 6px;
											background: #f8f7f9;
											color: #716d76;
											font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
											font-size: 8px;
											line-height: 1.15;
											white-space: nowrap;

											&:first-child {
												border-color: var(--media-border);
												background: var(--media-soft);
												color: var(--media-accent);
												font-weight: 750;
											}
										}
									}
								}

								.download-action {
									width: 27px;
									height: 27px;
									flex: 0 0 auto;
									padding: 0;
									display: grid;
									place-items: center;
									border: 1px solid var(--media-border);
									border-radius: 8px;
									background: var(--media-soft);
									color: var(--media-accent);
									cursor: pointer;
									transition:
										background 0.14s ease,
										box-shadow 0.14s ease,
										transform 0.14s ease;

									svg {
										width: 14px;
										height: 14px;
									}

									&:hover {
										background: var(--media-surface);
										box-shadow: 0 4px 10px rgba(37, 39, 51, 0.09);
										transform: translateY(-1px);
									}

									&:active {
										box-shadow: none;
										transform: translateY(0);
									}
								}
							}
						}
					}

					&.media-panel-regions {
						.region-items {
							padding: 8px;
							display: grid;
							grid-template-columns: repeat(2, minmax(0, 1fr));
							gap: 6px;

							.media-item {
								min-height: 42px;
								margin: 0;
								padding: 6px;
								display: grid;
								grid-template-columns: 30px minmax(0, 1fr);
								align-items: center;
								gap: 7px;
								border: 1px solid rgba(#3b9d65, 0.18);
								border-radius: 7px;
								background: rgba(#3b9d65, 0.045);
								transition:
									background 0.14s ease,
									border-color 0.14s ease,
									transform 0.14s ease;

								&:hover {
									border-color: rgba(#3b9d65, 0.3);
									background: rgba(#3b9d65, 0.075);
									transform: translateY(-1px);
								}

								.region-code {
									width: 30px;
									height: 25px;
									display: grid;
									place-items: center;
									border-radius: 5px;
									background: rgba(#3b9d65, 0.1);
									color: #318657;
									font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
									font-size: 9px;
									font-weight: 800;
								}

								.media-copy {
									min-width: 0;

									strong {
										display: block;
										overflow: hidden;
										color: #2f7650;
										font-size: 9px;
										font-weight: 680;
										line-height: 1.25;
										text-overflow: ellipsis;
										white-space: nowrap;
									}
								}

								&.media-item-danger {
									border-color: rgba(#e25349, 0.18);
									background: rgba(#e25349, 0.055);

									.region-code {
										background: rgba(#e25349, 0.1);
										color: #c7423a;
									}

									.media-copy {
										strong {
											color: #b93d36;
										}
									}

									&:hover {
										border-color: rgba(#e25349, 0.32);
										background: rgba(#e25349, 0.085);
									}
								}
							}
						}
					}

					.media-empty {
						padding: 12px;
						color: #aaa7ae;
						font-size: 10px;
						text-align: center;

						&.media-empty-success {
							margin: 8px;
							border: 1px solid rgba(#3b9d65, 0.16);
							border-radius: 7px;
							background: rgba(#3b9d65, 0.055);
							color: #318657;
							font-weight: 700;
						}
					}
				}
			}

			.flags {
				margin-top: 10px;
				padding: 8px;
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 6px;
				border: 1px solid #ecebf0;
				border-radius: 8px;
				background: #fff;

				.flag {
					min-width: 0;
					min-height: 34px;
					padding: 5px 7px;
					display: grid;
					grid-template-columns: 20px minmax(0, 1fr) 14px;
					align-items: center;
					gap: 5px;
					border: 1px solid;
					border-radius: 7px;
					cursor: help;
					font-size: 11px;

					.icon {
						font-size: 13px;
						text-align: center;
					}

					.name {
						min-width: 0;
						display: flex;
						align-items: center;
						gap: 4px;
						overflow: hidden;
						color: #47434a;
						font-weight: 600;

						> span {
							min-width: 0;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}

						small {
							flex: 0 0 auto;
							color: #85818a;
							font-size: 9px;
						}
					}

					.status {
						width: 16px;
						height: 16px;
						display: grid;
						place-items: center;
						font-weight: 800;
						text-align: center;

						svg {
							width: 14px;
							height: 14px;
						}
					}

					&.flag-success {
						border-color: rgba(#3b9d65, 0.18);
						background: rgba(#3b9d65, 0.055);

						.status {
							color: #318657;
						}
					}

					&.flag-error {
						border-color: rgba(#e25349, 0.2);
						background: rgba(#e25349, 0.06);

						.name {
							color: #5c3937;
						}

						.status {
							color: #d94a40;
						}
					}

					&.flag-loading {
						border-color: #ecebf0;
						background: #fafafd;

						.name {
							color: #76727c;
						}

						.status-loading {
							width: 13px;
							height: 6px;
							display: block;
							border-radius: 4px;
							background: linear-gradient(100deg, #dedde4 28%, #f2f1f5 42%, #dedde4 58%);
							background-size: 220% 100%;
							animation: insights-shimmer 1.15s ease-in-out infinite;
						}
					}

					&.flag-unknown {
						border-color: #ecebf0;
						background: #fff;

						.status {
							color: #94919a;
						}
					}
				}
			}
		}
	}

	@keyframes insights-pulse {
		from {
			opacity: 0.58;
		}

		to {
			opacity: 1;
		}
	}

	@keyframes insights-shimmer {
		from {
			background-position: 100% 0;
		}

		to {
			background-position: -100% 0;
		}
	}
}
</style>

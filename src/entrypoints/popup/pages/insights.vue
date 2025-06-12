<template>
	<section id="page-insights">
		<!--
	detail:
		img (max)
		title
		availableCountries
		isFamilySafe
		isPrivate
		isCrawlable
		lengthSeconds
		playableInEmbed

	adaptiveFormats:
		mineType
		quality
		fps
		averageBitrate
		bitrate

	audio:
		mineType
		quality
		audioSampleRate
		bitrate
		audioChannels
		loudnessDb

	captionTracks:
		name
		languageCode

	-->
		<div class="card video-detail">
			<div class="thumbnail">
				<img src="https://i.ytimg.com/vi/UnIhRpIT7nc/maxresdefault.jpg" crossorigin="anonymous" />
				<span>【Inaba Cumori ft Kaai Yuki】 Lagtrain (ラグトレイン) [1 HOUR] {sub esp}</span>
			</div>
			<div class="card-body">
				<div class="metadata">
					<div class="row">
						<div class="item">
							<span class="label">{{ $t("insights.label.metadata.date") }}</span>
							<span class="value">2020-07-16 04:00:13 (2020-07-16T04:00:13Z)</span>
						</div>
					</div>
					<div class="row">
						<div class="item">
							<span class="label">{{ $t("insights.label.metadata.likeCount") }}</span>
							<span class="value">89644</span>
						</div>
						<div class="item">
							<span class="label">{{ $t("insights.label.metadata.viewCount") }}</span>
							<span class="value">76699843</span>
						</div>
					</div>
					<div class="row">
						<div class="item">
							<span class="label">{{ $t("insights.label.metadata.category") }}</span>
							<span class="value">Music</span>
						</div>
						<div class="item">
							<span class="label">{{ $t("insights.label.metadata.sec") }}</span>
							<span class="value">8920</span>
						</div>
					</div>
					<div class="row">
						<div class="item">
							<span class="label">{{ $t("insights.label.metadata.quality") }}</span>
							<span class="value">1080p</span>
						</div>
						<div class="item">
							<span class="label">{{ $t("insights.label.metadata.username") }}</span>
							<span class="value">@GranTortuga</span>
						</div>
					</div>
				</div>
				<!--			<table class="flags">-->
				<!--				<tbody>-->
				<!--					<tr>-->
				<!--						<td class="success" :title="$t('insights.label.flags.global.description')">-->
				<!--							{{ $t("insights.label.flags.global.name") }} 🌍-->
				<!--						</td>-->
				<!--						<td class="success">Family Safe 🏠</td>-->
				<!--						<td class="success">Kids content 🧒</td>-->
				<!--					</tr>-->
				<!--					<tr>-->
				<!--						<td class="error">Comment 💬</td>-->
				<!--						<td class="error">Login 🔑</td>-->
				<!--						<td class="success">R18 ⛔</td>-->
				<!--					</tr>-->
				<!--					<tr>-->
				<!--						<td class="success">Alt+F4 IRL 🙅</td>-->
				<!--						<td class="success">Blocked 🚫</td>-->
				<!--						<td class="success">Membership 💸</td>-->
				<!--					</tr>-->
				<!--				</tbody>-->
				<!--			</table>-->
				<div class="flags">
					<div
						class="item item-success"
						v-for="(icon, key) of {
							global: '🌍',
							family: '🏠',
							comment: '💬',
							login: '🔑',
							emergency: '🙅',
							blocked: '🚫',
							r18: '⛔',
							crawlable: '㊙️',
							private: '🔒',
							membership: '💸',
							kids: '🧒',
							embed: '🔗',
							shorts: '📱',
						}"
						:title="$t(`insights.label.flags.${key}.description`)"
					>
						{{ $t(`insights.label.flags.${key}.name`) }} {{ icon }}
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<style lang="scss">
.video-detail {
	overflow: hidden;
	.thumbnail {
		width: calc(100% + 20px);
		margin: -10px -10px 5px;
		position: relative;
		aspect-ratio: 16 / 9;
		font-size: 0;
		overflow: hidden;

		img {
			width: 100%;
			position: relative;
			z-index: 1;
		}
		span {
			position: absolute;
			z-index: 2;
			bottom: 0;
			left: 0;
			color: white;
			font-size: 12px;
			background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent 80%);
			text-shadow: 0px 0px 10px rgba(black, 0.5);
			padding: 10px;
			font-weight: bolder;
			word-break: break-all;
		}
	}
	.card-body {
		.title {
			margin: 0;
			font-size: 15px;
			span {
				user-select: all;
				&:nth-child(2) {
					margin-left: 5px;
					color: rgba(#000, 0.3);
				}
			}
		}
		.metadata {
			background: rgba(black, 0.03);
			padding: 5px;
			margin: 8px 0;
			border-radius: 5px;
			display: flex;
			flex-direction: column;
			flex-wrap: nowrap;

			.row {
				display: flex;
				gap: 4px;

				border-bottom: 1px dashed rgba(black, 0.05);
				margin-bottom: 2px;
				padding-bottom: 2px;
				&:nth-last-child(1) {
					border-bottom: none;
					margin-bottom: 0;
					padding-bottom: 0;
				}

				.item {
					flex: 1;
					display: flex;
					justify-content: space-between;
					position: relative;
					border-right: 1px dashed rgba(black, 0.05);
					padding-right: 4px;

					&:nth-last-child(1) {
						border-right: none;
						padding-right: 0;
					}

					.label {
						color: rgba(#000, 0.5);
						font-weight: 600;
					}
					.value {
						font-weight: bolder;
						user-select: all;
					}
				}
			}
		}
		.flags {
			background: rgba(#000000, 0.03);
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			border-collapse: collapse;

			.item {
				border-right: 1px solid rgba(black, 0.05);
				border-bottom: 1px solid rgba(black, 0.05);

				padding: 5px 0;
				text-align: center;
				cursor: help;
				font-size: 11px;

				&.item-success {
					color: #4caf50;
				}
				&.item-error {
					color: #ff5722;
					font-weight: bolder;
				}

				&:nth-child(3n) {
					border-right: none;
				}

				&:nth-last-child(-n + 3) {
					border-bottom: none;
				}
			}

			//background: rgba(#000000, 0.03);
			//border-radius: 5px;
			//overflow: hidden;
			//table-layout: fixed;
			//width: 100%;
			//border-collapse: collapse;
			//
			//tr:first-child td {
			//	border-top: none;
			//}
			//tr td:first-child {
			//	border-left: none;
			//}
			//tr:last-child td {
			//	border-bottom: none;
			//}
			//tr td:last-child {
			//	border-right: none;
			//}
			//
			//td {
			//	padding: 5px 0;
			//	text-align: center;
			//	cursor: help;
			//	border: 1px solid rgba(black, 0.05);
			//	font-size: 11px;
			//
			//	&.success {
			//		color: #4caf50;
			//	}
			//	&.error {
			//		color: #ff5722;
			//		font-weight: bolder;
			//	}
			//}
		}
	}
}
</style>
<script setup lang="ts"></script>

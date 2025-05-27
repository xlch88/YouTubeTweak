<template>
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
		<img class="thumbnail" src="https://i.ytimg.com/vi/UnIhRpIT7nc/maxresdefault.jpg" crossorigin="anonymous" />
		<div class="card-body">
			<h1 class="title">
				<span>【Inaba Cumori ft Kaai Yuki】 Lagtrain (ラグトレイン) [1 HOUR] {sub esp}</span>
			</h1>
			<div class="metadata">
				<div class="row">
					<div class="item">
						<span class="label">Date:</span>
						<span class="value">2020-07-16 04:00:13 (2020-07-16T04:00:13Z)</span>
					</div>
				</div>
				<div class="row">
					<div class="item">
						<span class="label">Like:</span>
						<span class="value">89644</span>
					</div>
					<div class="item">
						<span class="label">View Count:</span>
						<span class="value">76699843</span>
					</div>
				</div>
				<div class="row">
					<div class="item">
						<span class="label">Category:</span>
						<span class="value">Music</span>
					</div>
					<div class="item">
						<span class="label">Length seconds:</span>
						<span class="value">8920</span>
					</div>
				</div>
				<div class="row">
					<div class="item">
						<span class="label">Highest quality:</span>
						<span class="value">1080p</span>
					</div>
					<div class="item">
						<span class="label">Username:</span>
						<span class="value">@GranTortuga</span>
					</div>
				</div>
			</div>
			<table class="flags">
				<tbody>
					<tr>
						<td class="success">Global 🌍</td>
						<td class="success">Family Safe 🏠</td>
						<td class="success">Kids content 🧒</td>
					</tr>
					<tr>
						<td class="error">Comment 💬</td>
						<td class="error">Login 🔑</td>
						<td class="success">R18 ⛔</td>
					</tr>
					<tr>
						<td class="success">Alt+F4 IRL 🙅</td>
						<td class="success">Blocked 🚫</td>
						<td class="success">Membership 💸</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<style lang="scss">
.video-detail {
	overflow: hidden;
	.thumbnail {
		width: calc(100% + 20px);
		margin: -10px -10px 5px;
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
			border-radius: 5px;
			overflow: hidden;
			table-layout: fixed;
			width: 100%;
			border-collapse: collapse;

			tr:first-child td {
				border-top: none;
			}
			tr td:first-child {
				border-left: none;
			}
			tr:last-child td {
				border-bottom: none;
			}
			tr td:last-child {
				border-right: none;
			}

			td {
				padding: 5px 0;
				text-align: center;
				cursor: help;
				border: 1px solid rgba(black, 0.05);
				font-size: 11px;

				&.success {
					color: #4caf50;
				}
				&.error {
					color: #ff5722;
					font-weight: bolder;
				}
			}
		}
	}
}
</style>
<script setup lang="ts"></script>

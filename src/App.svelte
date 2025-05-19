<header>
	<div class="item logo">
		<img src="/assets/img/logo.svg" alt="logo" />
		<span>YouTubeTweak</span>
	</div>
	{#each ["player", "comment", "other", "about"] as key}
		<button
			class="item {tab === key ? 'active' : ''}"
			onclick={() => {
				tab = key;
			}}
		>
			{$_(`tabs.${key}.title`)}
		</button>
	{/each}
</header>

<main class="youtube-tweak-app">
	{#if tab === "player"}
		<div class="card">
			<div class="card-title">倍速按钮</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["player.ui.enableSpeedButtons"]} />
					<span>显示倍速按钮</span>
				</label>
				<p>启用的按钮：</p>
				<div class="form-item-group">
					{#each [0.25, 0.5, 1, 1.25, 1.5, 2, 3] as speed}
						<label class="form-item">
							<input type="checkbox" bind:group={settings["player.ui.speedButtons"]} value={speed} />
							<span>{speed}x</span>
						</label>
					{/each}
				</div>
			</div>
		</div>
		<div class="card">
			<div class="card-title">按钮隐藏</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["player.ui.hideButton.autoplay"]} />
					<span>隐藏自动播放按钮</span>
				</label>
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["player.ui.hideButton.subtitles"]} />
					<span>隐藏字幕按钮</span>
				</label>
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["player.ui.hideButton.settings"]} />
					<span>隐藏设置按钮</span>
				</label>
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["player.ui.hideButton.miniPlayer"]} />
					<span>隐藏迷你播放器按钮</span>
				</label>
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["player.ui.hideButton.pip"]} />
					<span>隐藏画中画按钮</span>
				</label>
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["player.ui.hideButton.size"]} />
					<span>隐藏宽画幅(剧场模式)按钮</span>
				</label>
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["player.ui.hideButton.remote"]} />
					<span>隐藏远程播放(在电视上播放)按钮</span>
				</label>
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["player.ui.hideButton.fullscreen"]} />
					<span>隐藏全屏按钮</span>
				</label>
			</div>
		</div>
		<div class="card">
			<div class="card-title">界面</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["player.ui.hideCeElement"]} />
					<span>半透明结尾的推荐视频/作者</span>
				</label>
			</div>
		</div>
		<div class="card">
			<div class="card-title">其他</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["player.settings.maxVolume"]} />
					<span>最大音量时关闭音量均衡(真正100%音量)</span>
				</label>
			</div>
		</div>
	{:else if tab === "comment"}
		<div class="card">
			<div class="card-title">昵称</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["comment.nickname"]} />
					<span>显示评论者昵称(频道名称)</span>
				</label>
			</div>
		</div>
		<div class="card">
			<div class="card-title">评论</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["comment.autoShowMore"]} />
					<span>自动展开长评论</span>
				</label>
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["comment.autoTranslate"]} />
					<span>自动翻译评论</span>
				</label>
			</div>
		</div>
	{:else if tab === "other"}
		<div class="card">
			<div class="card-title">首页</div>
			<div class="card-body">
				<label class="form-item">
					<input type="checkbox" bind:checked={settings["index.videoPerRow.enable"]} />
					<span> 固定首页推荐视频每行数量 </span>
					<input
						type="number"
						style="width: 50px; margin-left: 5px"
						bind:value={settings["index.videoPerRow.count"]}
						min="1"
						max="10"
						onblur={() => {
							if (
								!/^\d+$/.test(settings["index.videoPerRow.count"].toString()) ||
								settings["index.videoPerRow.count"] < 1 ||
								settings["index.videoPerRow.count"] > 10
							) {
								settings["index.videoPerRow.count"] = 4;
							}
						}}
					/>
				</label>
			</div>
		</div>
	{:else if tab === "about"}
		<div class="about">
			<img src="assets/img/logo.svg" alt="logo" />
			<p class="title">YouTube Tweak</p>
			<p class="version">v1.0.0<br /><span>Build at 2025-05-13 00:00:00</span></p>
			<p class="config">
				<button class="btn">导出设置 ⤴️</button>
				<button class="btn">导入设置 ⤵️</button>
				<button class="btn" onclick={resetSetting}>重置设置 🔄</button>
			</p>
			<p>Copyright &copy; 2025 <a href="https://dark495.me/" target="_blank">Dark495</a></p>
			<p class="link">
				<a href="https://github.com/xlch88/YouTubeTweak" target="_blank">⭐Github</a> |
				<a href="https://github.com/xlch88/YouTubeTweak/releases" target="_blank">📓Changelog</a> |
				<a href="https://github.com/xlch88/YouTubeTweak/issues" target="_blank">❓Issues</a>
			</p>
		</div>
	{/if}
</main>

<script>
import { onMount, tick } from "svelte";
import config, { DEFAULT_CONFIG } from "./util/config.js";
import { _ } from "svelte-i18n";
import { waitLocale } from "svelte-i18n";

export async function preload() {
	// awaits for the loading of the 'en-US' and 'en' dictionaries
	return waitLocale();
}

let tab = $state("about");

let settings = $state({ ...DEFAULT_CONFIG });
let isSettingsInit = false;
config.init().then((v) => {
	Object.assign(settings, {
		...v,
	});

	tick().then(() => {
		isSettingsInit = true;
	});
});

$effect(() => {
	Object.values(settings); // wtf 这太tm可怕了 我watch呢??? 老子要回去写vue😭😭😭😭
	if (!isSettingsInit) return;
	config.set(null, $state.snapshot(settings));
});

onMount(() => {});

function resetSetting() {
	if (confirm("确定要重置设置吗？")) {
		Object.assign(settings, {
			...DEFAULT_CONFIG,
		});
		tab = "player";
	}
}
</script>

<style lang="scss">
main {
	margin-top: 40px;
	height: 450px;
	overflow-y: auto;
	//background: #000;
	//width: 100px;
	//height: 100px;
}
header {
	position: fixed;
	height: 40px;
	width: 100%;
	top: 0;
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	justify-content: space-between;
	align-items: center;
	box-shadow: 0 0 10px rgba(#000, 0.3);
	background: #fff;

	.item {
		appearance: none;
		padding: 5px;
		height: 100%;
		flex: 1;
		line-height: 30px;
		text-align: center;
		border: none;
		background: none;
		cursor: pointer;

		&.active {
			background: rgba(#000, 0.05);
		}
		&:hover {
			background: rgba(#000, 0.1);
		}

		&.logo {
			display: flex;
			align-items: center;
			padding: 0 10px;
			background: #fff;
			cursor: default;

			img {
				width: 30px;
				height: 30px;
				margin-right: 5px;
			}
			span {
				font-weight: bolder;
				font-size: 15px;
				line-height: 14px;
				font-family: "Trebuchet MS";
			}
		}
	}
}
.card {
	background: #fff;
	margin: 10px;
	border-radius: 5px;
	padding: 10px;
	.card-title {
		font-size: 15px;
		font-weight: bolder;
		padding-bottom: 5px;
		margin-bottom: 5px;
		border-bottom: 1px solid #eee;
	}
	.card-body {
		p {
			color: #7e8299;
			margin-bottom: 0;
			margin-top: 10px;
		}
	}
}
.form-item {
	display: flex;
	align-items: center;

	&:hover input[type="checkbox"] {
		background-color: rgba(#000, 0.1);
	}

	input[type="checkbox"] {
		appearance: none;
		width: 18px;
		height: 18px;
		border: 1.5px solid #b2b2b2;
		border-radius: 4px;
		background-color: white;
		cursor: pointer;
		position: relative;
		margin-left: 0;
		transition:
			background-color 0.3s,
			border-color 0.3s;

		&:checked {
			background-color: #2196f3;
			border-color: #2196f3;

			&::after {
				content: "";
				position: absolute;
				left: 5px;
				top: 1px;
				width: 3px;
				height: 8px;
				border: solid #ffffff;
				border-width: 0 2px 2px 0;
				transform: rotate(45deg);
			}
		}
	}
}
.form-item-group {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	justify-content: space-between;
}
.about {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	background: #fff;
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
</style>

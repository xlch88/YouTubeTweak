# Chrome 扩展 CDP 调试方法

## 使用前提

- 先取得用户对远程调试浏览器的授权，再连接用户已经运行的 `http://127.0.0.1:9222`，不要另起 Chrome、dev server 或安装浏览器自动化依赖。
- 先看 `git status --short`，记录已有改动；测试脚本、快照和备份放在项目内独立目录，避免把个人配置、令牌和播放历史提交到仓库。
- 本地扩展入口为 `chrome-extension://malfbchbmmlhkjjbepjodfkmnbngckoi/popup.html`，换环境后应重新确认扩展 ID 和实际加载的构建。

## 连接和选择目标

先读取调试端点，确认浏览器和目标列表，不能把另一套浏览器的页面当成当前授权实例。

```powershell
Invoke-RestMethod http://127.0.0.1:9222/json/version
Invoke-RestMethod http://127.0.0.1:9222/json/list |
    Select-Object id, type, title, url, webSocketDebuggerUrl
```

优先使用已经连接该浏览器的 Chrome DevTools 工具，按以下顺序操作。

1. `list_pages` 获取页面 ID，按 URL 找到 YouTube 和 popup 。
2. `take_snapshot` 获取最新控件 UID，再用 `click`、`fill`、`fill_form`、`press_key` 操作。
3. `evaluate_script` 读取 DOM、播放器状态和扩展存储，返回可 JSON 序列化的值。
4. 用 `list_console_messages`、`list_network_requests` 和对应详情工具调查异常，视觉效果需要时再截图。

工具里的 `pageId`、CDP 的 `targetId`、扩展 API 的 `tab.id` 是不同标识，不可混用；页面重建后要重新枚举。

### 直接 CDP 的备用路径

如果工具没有连接到 9222，可用现有 Node.js 的 `fetch` 和 `WebSocket` 直连，不需要安装 Puppeteer 或 Playwright；先确认当前 Node 支持这两个全局 API 。

连接 `/json/version` 返回的 `webSocketDebuggerUrl` 后，为每条请求分配递增 `id`，用 pending Map 将响应匹配回 Promise，并把没有 `id` 的消息作为事件处理。

```js
// 以下为协议消息示例；由 WebSocket 客户端发送并等待相同 id 的响应。
{ id: 1, method: "Target.getTargets" }
{ id: 2, method: "Target.attachToTarget", params: { targetId: "实际目标ID", flatten: true } }
// 保存上一条结果中的 sessionId，后续目标命令携带它。
{ id: 3, sessionId: "实际会话ID", method: "Runtime.enable" }
{ id: 4, sessionId: "实际会话ID", method: "Runtime.evaluate", params: {
    expression: "({url: location.href, title: document.title})",
    awaitPromise: true,
    returnByValue: true
} }
```

检查协议 `error` 和 `result.exceptionDetails`，不能只看是否收到响应；为请求设置超时，并在 socket 关闭时拒绝仍未完成的请求。

需要常驻连接时，可让项目内 Node 脚本通过 stdin 接收逐行 JSON 命令、stdout 输出带请求 ID 的结果，由终端会话继续写入命令，避免每次求值都重新连接。

导航或扩展重载后，旧执行上下文会失效，应重新获取 target/session/context；结束时 `Target.detachFromTarget` 并关闭自己建立的 socket 或 stdin relay，不要发送 `Browser.close` 。

## 操作 popup

### 设置页和控件

可以把 popup URL 打开成普通标签页，获得稳定、不会因失焦关闭的调试目标；优先复用已打开的 popup 。

- 顶部页签通过按钮的可访问名称定位，切换后重新取快照，等待异步组件出现。
- 设置卡片是 `details > summary`，折叠时先点击 summary；嵌套卡片也要展开，隐藏不等于功能不存在。
- checkbox 使用真实点击或表单工具修改，select 选择实际 option value，文本框按组件需要触发输入、变更或失焦。
- 用 `element.matches(':disabled')` 检查禁用状态，不能只看 `element.disabled`，因为禁用可能来自父级 fieldset 。
- 不要只改 DOM 的 `checked`、`value` 或直接调用插件 `enable()` 来宣称 UI 测试通过，这会绕过 Vue、存储或插件生命周期。

当前代码的定位入口如下，后续版本应先核对再复用。

| 入口 | 用途 |
| --- | --- |
| `src/defaultConfig.ts` | 配置键、默认值及归一化逻辑 |
| `src/entrypoints/popup/pages/*.vue` | 设置键与实际控件的对应关系 |
| `src/entrypoints/popup/util/config.ts` | Pinia 保存与配置通知 |
| `src/entrypoints/popup/components/SettingsCard.vue` | 卡片折叠状态 |
| `src/inject/isolatedWorld.ts` | 扩展 API、存储变化与 MAIN world 消息桥 |
| `src/inject/mainWorld.ts` | 插件生命周期和页面调试入口 |

设置保存在 `chrome.storage.sync` 的 `settings` 对象中，键是包含点号的扁平字符串，例如 `settings['player.settings.lockQuality']`，不是多层对象。

每次 UI 修改后，在 popup 上下文读取持久化值，再去 YouTube 验证实际效果；当前传播路径是 popup 保存、storage.onChanged、isolated world、MAIN world 配置更新。

```js
async () => (await chrome.storage.sync.get('settings')).settings
```

直接写 storage 适合构造测试前置条件，不替代 UI 验证；必须合并已有 settings，等待写入完成与页面状态变化，不能把整个对象替换成只含一个键的对象。

### 当前视频 / Insights 的特殊处理

popup 使用 `tabs.query({ active: true, currentWindow: true })` 获取当前视频；当 popup 自己作为前台标签时，查到的会是 popup，不能据此判断视频识别失败。

1. 在同一浏览器窗口保留 YouTube watch 标签和 popup 标签。
2. 先把 YouTube 标签设为 active，再通过 CDP 对后台 popup 求值或重载，保持 YouTube 为活动标签。
3. 加载 Insights 前再次确认活动标签；通过后台 `Runtime.evaluate` 点击 popup 页签，避免会把 popup 带到前台的操作。
4. 用 `chrome.tabs.query` 核对实际选中的 URL 和 tab ID，再检查消息返回值和渲染内容。

普通标签页适合检查设置及渲染逻辑，不能替代工具栏 popup 的打开、失焦关闭和尺寸行为测试；这类问题需要真实工具栏 popup 目标。

## YouTube 页面验证

在 YouTube 顶层 MAIN world 读取 `window.__YT_TWEAK__`，不要在 popup 或 isolated world 里找页面播放器对象。

```js
() => {
    const app = window.__YT_TWEAK__;
    const video = app?.videoPlayer?.videoStream;
    const player = app?.videoPlayer?.player;
    return {
        url: location.href,
        world: app?.WORLD,
        plugins: Object.keys(app?.plugins ?? {}),
        bodyClasses: document.body.className,
        video: video ? {
            time: video.currentTime,
            paused: video.paused,
            rate: video.playbackRate,
            volume: video.volume,
            muted: video.muted,
            width: video.videoWidth,
            height: video.videoHeight,
            transform: getComputedStyle(video).transform
        } : null,
        quality: player?.getPlaybackQuality?.(),
        availableQualities: player?.getAvailableQualityLevels?.()
    };
}
```

入口可能受构建模式影响，不存在时先核对当前构建和执行上下文；运行时代码应与磁盘源码相符，watch 已运行也不代表旧页面完成了更新。

逐项验证“禁用 → 启用 → 实际操作 → 再禁用 → 再启用”，每次只改变一个待测因素，并覆盖相关依赖开关、重复操作、SPA 切视频和整页刷新。

- 键盘功能使用真实 `press_key` 或 CDP `Input.dispatchKeyEvent`，并区分播放器焦点与文本输入焦点。
- CSS 功能同时检查元素及祖先的 class、inline style、computed style 和尺寸，避免把 DOM 存在误判为可见。
- 播放器功能读取真实视频尺寸、倍速、音量等结果，不只看按钮文字或配置值。
- SPA 切视频应通过站内链接完成，并等待视频 ID 和播放器状态更新；`location.href` 导航不能代替 SPA 场景。
- 异步结果按条件限时等待，超时保留证据，不用固定短暂停顿后直接下结论。
- 网络相关功能沿用项目 MAIN world 消息路径，不能用 Node 或 popup 的请求结果代替页面实际行为。
- 分开记录自然页面验证和人工构造 DOM 的验证，人工样本只能证明对应处理路径。

记录操作前后的控制台和网络差异，按堆栈、请求发起者和禁用后的对照判断来源，不把 YouTube 自身日志或第三方错误一概归到扩展。

## 备份和恢复

测试前在扩展上下文保存以下快照；popup 初始化本身会加载并保存设置，若需保留完全原始状态，应优先在已有扩展上下文备份后再新开 popup 。

```js
async () => ({
    sync: await chrome.storage.sync.get(null),
    local: await chrome.storage.local.get(null),
    popupLocalStorage: Object.fromEntries(
        Array.from({ length: localStorage.length }, (_, i) => {
            const key = localStorage.key(i);
            return [key, localStorage.getItem(key)];
        })
    )
})
```

另行记录 YouTube URL、播放位置、暂停状态、倍速、音量、静音、滚动位置和活动标签；若测试会改页面 localStorage，也先备份相关键。

恢复时按本次实际修改的键回填原值，移除测试新增且原先不存在的键，不要清空全部存储；对记忆类功能还要核对它们自动写入的数据，避免覆盖用户测试期间的新修改。

popup 的 `tab` 和 `settings-card:*` 也在 localStorage 中，恢复它们时要避免仍挂载的 UI 再次写回；必要时先恢复设置并关闭测试 UI，最后通过保留的扩展上下文回填 UI 状态。

等待防抖保存结束后重新读取并对比备份，恢复原页面及播放状态，关闭本次创建的标签并断开自己的 CDP 会话。

如有代码改动，再执行项目的一次性检查 `npm.cmd run compile`、`npm.cmd run build` 和 `git diff --check`；浏览器行为验证与构建检查分别记录，不能互相替代。

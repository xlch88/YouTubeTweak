你需要使用 `gh` 命令发布 GitHub 最新 Release。

请严格按以下流程执行，不要跳步，不要猜测，不要重复发布。

## 目标

读取项目中的多语言 changelog，提取最新版本的更新内容，并根据 GitHub 当前最新 Release 判断是否需要发布新版本。

## 需要读取的 changelog 文件

请读取以下三个文件：

- `/CHANGELOG.md`
- `/docs/zh-cn/CHANGELOG.md`
- `/docs/ja/CHANGELOG.md`

它们分别对应：

- 英文 changelog
- 中文 changelog
- 日文 changelog

## 版本判断规则

1. 从三个 changelog 文件中分别提取最顶部的最新版本号。
2. 版本号必须统一，例如都为 `v1.1.7` 或都为 `1.1.7`。
3. 最终用于 Release 的版本号必须带 `v` 前缀，例如：

```text
v1.1.7
```

4. 如果 changelog 中三个文件的最新版本号不一致，必须停止执行，并输出错误原因。
5. 使用 `gh` 命令获取 GitHub 仓库当前最后发布的 Release 版本号。
6. 将 GitHub 当前最后发布版本与 changelog 最新版本进行比较：

- 如果 GitHub 当前最后发布版本等于 changelog 最新版本：停止执行，不要重新发布。
- 如果 GitHub 当前最后发布版本大于 changelog 最新版本：停止执行，并输出错误原因。
- 如果 GitHub 当前最后发布版本小于 changelog 最新版本：继续发布。

## Release 信息要求

发布 Release 时必须使用以下信息：

- Tag：changelog 最新版本号，必须以 `v` 开头，例如 `v1.1.7`
- Release title：与 Tag 完全相同，例如 `v1.1.7`
- Release label：Latest
- Release notes：只保留英文 changelog 的最新版本标题作为整份 Release notes 的唯一版本标题，随后依次拼接英文、中文、日文的最新版本正文，最后固定追加扩展商店说明内容

## Assets 要求

发布时必须上传以下四个文件：

```text
.output/youtube-tweak-版本号-chrome.crx
.output/youtube-tweak-版本号-edge.zip
.output/youtube-tweak-版本号-firefox.zip
.output/youtube-tweak-版本号-sources.zip
```

其中 `版本号` 使用不带 `v` 前缀的版本号。

例如版本为 `v1.1.7` 时，必须上传：

```text
.output/youtube-tweak-1.1.7-chrome.crx
.output/youtube-tweak-1.1.7-edge.zip
.output/youtube-tweak-1.1.7-firefox.zip
.output/youtube-tweak-1.1.7-sources.zip
```

在发布前必须检查这四个文件是否全部存在。

如果任意文件不存在，必须停止执行，并明确输出缺失文件路径，不要创建 Release。

## Release notes 生成规则

Release notes 必须按以下顺序组成：

1. 英文 changelog 中最新版本的完整章节，包括 `## [版本号] - 日期` 标题和该版本正文
2. 分隔线：

```markdown
---
```

3. 中文 changelog 中最新版本的正文，不包含 `## [版本号] - 日期` 标题
4. 分隔线：

```markdown
---
```

5. 日文 changelog 中最新版本的正文，不包含 `## [版本号] - 日期` 标题
6. 分隔线：

```markdown
---
```

7. 固定尾部内容

生成结果的结构必须严格符合以下模板：

```markdown
## [版本号] - 日期

英文正文，从 `###` 分类标题开始

---

中文正文，从 `###` 分类标题开始

---

日文正文，从 `###` 分类标题开始

---

固定尾部内容
```

`## [版本号] - 日期` 必须是 Release notes 的第一行，并且整份 Release notes 中只能出现一次。

中文和日文部分必须从各自最新版本标题之后开始提取，到下一个 `## [版本号] - 日期` 标题之前结束；不得包含或重复各自的版本标题。

只允许提取最新版本对应的 changelog 内容，不要包含更旧版本。

除按上述规则省略中文和日文的版本标题外，不要改写 changelog 内容，不要擅自润色，不要重新分类，不要添加不存在的内容。

## 固定尾部内容

Release notes 最后必须原样追加以下内容，不允许修改、翻译、删减、重排或格式化：

```markdown
**If you need to install this extension, please install it through the app store:**
**如果您需要安装此扩展，请通过应用商店进行安装：**

| Browser           | Extension Link                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Firefox           | [YouTube Tweak for Firefox](https://addons.mozilla.org/firefox/addon/youtube-tweak/)                                   |
| Chrome (Chromium) | [YouTube Tweak for Chrome](https://chromewebstore.google.com/detail/malfbchbmmlhkjjbepjodfkmnbngckoi)                  |
| Microsoft Edge    | [YouTube Tweak for Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/eebgfpfoggpnfolkknkdkbjkbejdoedg) |

**The build files below are for archiving only and cannot be installed directly in the browser.**
**下方的构建文件仅供存档，无法直接在浏览器安装。**
```

## 执行要求

1. 使用 `gh` 命令获取当前最新 Release。
2. 使用 `gh` 命令创建 Release。
3. Release 必须标记为 Latest。
4. Release notes 必须通过临时 markdown 文件传入，不要在命令行里硬塞长文本。
5. 发布前必须输出即将发布的信息，包括：

```text
Version:
Tag:
Release title:
Assets:
```

6. 发布成功后输出 Release URL。
7. 如果停止发布，必须说明停止原因。
8. 不要创建草稿 Release。
9. 不要创建 prerelease。
10. 不要修改 changelog 文件。
11. 不要修改构建产物。
12. 不要生成额外无关文件，除了发布 Release notes 所需的临时文件。
13. 创建 Release 前必须检查临时 markdown 文件，确认第一行是英文 changelog 的最新版本标题，并且 `## [版本号] - 日期` 形式的版本标题只出现一次；如果不满足，必须停止执行并修正临时文件，不能创建 Release。

## 推荐执行逻辑

请按以下逻辑执行：

```text
读取三个 changelog
提取三个最新版本号
检查版本号是否一致
规范化版本号为 vX.Y.Z
获取 GitHub 当前最新 Release 版本号
比较版本
如果已发布则停止
如果远端版本更新则停止
检查四个 asset 文件是否存在
生成 release notes 临时文件，仅保留英文版本标题
检查 release notes 的版本标题位于第一行且只出现一次
使用 gh 创建 Release
上传四个 assets
标记为 Latest
输出发布结果
```

## 注意

如果 `gh` 未登录、无权限、仓库未识别、网络错误、GitHub API 错误、asset 缺失、版本不一致或版本比较异常，必须停止执行，并输出明确错误。

不要在失败后继续尝试创建 Release。
不要覆盖已有 Release。
不要删除已有 Release。
不要删除已有 Tag。
不要强推 Tag。

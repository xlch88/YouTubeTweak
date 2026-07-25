# Changelog

[中文](/docs/zh-cn/CHANGELOG.md) | [English](/CHANGELOG.md) | [日本語](/docs/ja/CHANGELOG.md)

All release version update records are listed in this file.

If you have questions, bug reports, or feature suggestions, please go to the [GitHub Issues page](https://github.com/xlch88/YouTubeTweak/issues) to submit them.

## [1.2.2] - 2026-07-25

### Updated

- **Comment translation:** Improved processing efficiency when translating multiple items at once and updated the manual translation button icon.

### Added

- **Comment translation:** Added the "Show a Manual Translation Button for Comments That Do Not Need Automatic Translation" option, allowing you to hide the manual translation action for comments in the target language or languages set to "Always Never Translate."

### Fixed

- **Page translation:** Fixed translation display issues for watch page titles and playlist titles, and improved compatibility with DeArrow.
- **Translation settings:** Fixed "Always Never Translate Languages" not applying consistently to automatic translation of comments, page content, and subtitles.
- **Update notifications:** Fixed patch versions being misidentified as feature updates, causing incorrect `new` badge display and inaccurate changelog version ranges.
- **Video zoom:** Fixed dragging a zoomed video potentially triggering other player actions.

## [1.2.1] - 2026-07-21

### Updated

- **Ad blocking:** Removed the video ad blocking feature; using another extension instead is recommended.
- **Comment translation:** Changed the comment translation marker to a gray dashed underline.

### Added

- **Page translation:** Added translation for video list titles, watch page titles, and video descriptions, with support for translating video summaries provided by YouTube.
- **Appearance:** Added customization for the logo country/region label, allowing the label next to the YouTube logo to be replaced with specified text.
- **Update notifications:** Added an option to disable update notifications, which can hide the `new` badge on the extension icon and stop the unread changelog from opening automatically.

### Fixed

- **Subtitle translation:** Fixed character entities such as `&amp;` being displayed verbatim in subtitle translations.

## [1.2.0] - 2026-07-18

### Updated

- **Installation guide:** Improved post-installation instructions by displaying the corresponding extension icon hint for Chrome, Edge, and Firefox.
- **Settings UI:** Improved the layout of cards, scrollbars, playback speed buttons, and configuration management, and changed configuration reset to use an in-extension confirmation dialog.

### Added

- **Appearance:** Added the "Disguise Premium Logo" option, allowing the YouTube header logo to be displayed in the Premium style.

### Fixed

- **Changelog:** Fixed failed loads being marked as read and the changelog potentially opening automatically again after switching pages.
- **Feature documentation:** Fixed the feature documentation entry point failing to open in the English interface.
- **Scroll mini-player:** Fixed YouTube's ambient mode causing the video image to darken.
- **Subtitle translation:** Fixed an error that could occur when certain subtitle events lacked text fragments.

## [1.1.9] - 2026-07-03

### Added

- **Changelog:** Added the built-in changelog popup and unread prompt for new versions, allowing users to view changes for the current version inside the extension.
- **Settings UI:** Added quick entry points to feature documentation, allowing users to open the corresponding help document directly from each setting.
- **Player buttons:** Added player button display modes, with support for Auto, Hide, and Force enable options.

### Fixed

- **Custom CSS:** Fixed a possible error in the custom CSS editor in the popup window.

## [1.1.8] - 2026-07-03

### Updated

- **Settings UI:** Improved the prompt display for configuration import/export and update check results.
- **Player controls:** Improved how the player control bar is shown when using custom controls such as speed, rotation, and mirroring.

### Added

- **Speed control:** Added a speed slider, with support for continuous drag-based speed adjustment, mouse wheel speed adjustment, and custom wheel step sizes.
- **Video zoom:** Added video zoom with the mouse wheel. After zooming in, the video can be dragged to move the view.
- **Player function buttons:** Added a video screenshot button, with support for saving the current video frame as a PNG image.
- **Player buttons:** Added player button display modes, with support for automatic, hidden, and force-enabled states.
- **Custom CSS:** Added a custom CSS editor, with support for injecting custom styles into YouTube.
- **Configuration management:** Added options to export/import memory data, with support for migrating per-channel speed, subtitle, and other memories together with settings.

## [1.1.7] - 2026-06-12

### Updated

- **anti-ad:** Added blocking rules for YouTube shopping timely shelf elements.
- **player-nonStop:** Improved detection for the "Video paused. Continue watching?" dialog to avoid closing unrelated popups.
- **memory:** Batched repeated memory persistence writes within 500ms to reduce unnecessary storage updates.
- **mini-player:** Simplified mini-player size labels in the popup settings.
- **i18n:** Updated translations for the latest player and rollback settings.
- **dependencies:** Updated WXT/build tooling and removed legacy browser global shims.

### Added

- **mini-player:** Added a scroll mini-player with size, position, margin, and trigger-offset settings.
- **volumeBooster:** Added a real volume booster with an in-player control and configurable boost level.
- **comment-translate:** Added line-by-line translation display for multi-line comments.
- **player-ui:** Added an option to hide YouTube's mini-player button.
- **rollback:** Added an option to restore the old YouTube player layout.

### Fixed

- **mini-player:** Improved stacking and layout restoration when entering or leaving mini-player mode.
- **rollback:** Fixed non-16:9 videos being rendered inside a 16:9 outer shell when the old player layout is enabled.

## [1.1.5] - 2026-04-11

### Updated

- **anti-ad:** Added two new blocking rules.

### Added

- **player-nonStop:** Prevents automatic pausing after playing for a while (the "Video paused. Continue watching?" prompt).

### Fixed

- **comment-translate:** Fixed an issue where translated content was not updated after changing the sort order.

## [1.1.4] - 2025-12-03

### Fixed

- **XMLHttpRequest Hooker:** Fixed an issue where the XMLHttpRequest Hooker would not initialize properly.

## [1.1.3] - 2025-12-03

### Updated

- **Popup Window:** Added a "Translation" page; moved the previous "Comments" features to other locations.

### Added

- **Popup Window:** Added a warning on the "General" page to remind users some features may affect normal page behavior.
- **bilingual-subtitles:** When enabled, automatically uses Google-translated captions and displays the translation above the original line.

### Fixed

- **comment-translate:** Fixed translation display glitches when switching comment sort order.

## [1.1.2] - 2025-11-26

### Added

- **comment-translate:** Added an option to never translate selected languages.

### Fixed

- **comment-translate:** Fixed an issue where the selected target language setting did not take effect.
- **comment-translate:** Removed the extra expand/collapse button that appeared when showing translated content.

## [1.1.1] - 2025-11-25

### Fixed

- **player-speedButton:** Fix an issue where some playback-speed buttons failed to appear.

## [1.1.0] - 2025-11-24

### Updated

- **player-speedButton:** Added more speed options.

### Added

- **player-time-tag:** Floating video time tag now supports custom font size, position, and offset.
- **video-progress-bar:** Added an option to customize the progress bar height.
- **i18n:** Added Arabic (ar-SA) translation.
- **i18n:** Added Bengali (bn-BD) translation.
- **i18n:** Added German (de-DE) translation.
- **i18n:** Added Spanish (es-ES) translation.
- **i18n:** Added Persian (fa-IR) translation.
- **i18n:** Added Hindi (hi-IN) translation.
- **i18n:** Added Indonesian (id-ID) translation.
- **i18n:** Added Italian (it-IT) translation.
- **i18n:** Added Korean (ko-KR) translation.
- **i18n:** Added Marathi (mr-IN) translation.
- **i18n:** Added Malay (ms-MY) translation.
- **i18n:** Added Punjabi (pa-PK) translation.
- **i18n:** Added Portuguese (pt-BR) translation.
- **i18n:** Added Russian (ru-RU) translation.
- **i18n:** Added Tamil (ta-IN) translation.
- **i18n:** Added Telugu (te-IN) translation.
- **i18n:** Added Thai (th-TH) translation.
- **i18n:** Added Turkish (tr-TR) translation.
- **i18n:** Added Ukrainian (uk-UA) translation.
- **i18n:** Added Vietnamese (vi-VN) translation.

## [1.0.9] - 2025-11-22

### Fixed

- **player-ui**: Fixed the floating time tag issue in live mode.
- **comment-translate**: Similar languages (e.g., en_US, en_UK) will not be translated repeatedly.

### Added

- **Update**: Click version number in popup to check for updates.
- **comment-translate**: Added target language selection option for comment translation feature.
- **comment-translate**: Added a button to manually trigger the translation.
- **player-function-buttons**: Added two new function buttons: Mirror Video and Rotate Video.

## [1.0.8] - 2025-11-14

### Updated

- **Videos per row:** Increased the maximum value of the `Videos per row` option from `10` to `15`.

### Added

- **Video progress bar:** Added an option to always display the progress bar below the video.
- **Video timestamp:** Added an option to display the `current time/total duration` of the video in the bottom-left corner.

## [1.0.7] - 2025-11-12

### Added

- **player-speedButton:** Added more options `(2.25x, 2.5x)` and redesigned the related UI.
- **shorts-blocker:** When “Hide Shorts on homepage” is checked, it will also hide `Shorts videos in search results`.
- **anti-ad:** When “Block creator’s product recommendations” is checked, it will hide the `“Recommended Products” floating button` in the `player`.
- **anti-ad:** When “Block creator’s product recommendations” is checked, it will hide the `Event Tickets section` below the video description.

### Fixed

- **comment-nickname:** Fixed the issue where comment usernames displayed abnormal colors in `dark mode`.
- **shorts-blocker:** Fixed an issue where `Shorts` still appeared in the `recommended videos` on the watch page.
- **Popup Window:** Fixed an issue where the `popup window` width was abnormal in certain browsers.

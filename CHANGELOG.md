# Changelog

[中文](/docs-i18n/CHANGELOG_CN.md) | [English](/CHANGELOG.md)

All release version update records are listed in this file.

If you have questions, bug reports, or feature suggestions, please go to the [GitHub Issues page](https://github.com/xlch88/YouTubeTweak/issues) to submit them.

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

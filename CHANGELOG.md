# Changelog

[中文](/docs-i18n/CHANGELOG_CN.md) | [English](/CHANGELOG.md)

All release version update records are listed in this file.

If you have questions, bug reports, or feature suggestions, please go to the [GitHub Issues page](https://github.com/xlch88/YouTubeTweak/issues) to submit them.

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

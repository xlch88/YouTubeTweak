<a name="functions"></a>

# Feature Guide

[中文](/docs/zh-cn/FUNCTIONS.md) | [English](/FUNCTIONS.md) | [日本語](/docs/ja/FUNCTIONS.md)

YouTube Tweak is a browser extension for enhancing the YouTube web experience and is displayed as YouTweak in the Safari version. This document follows the category order in the extension popup panel and focuses on what each feature does, what happens after it is enabled, which scenarios it fits, and which limitations to note.

This extension mainly takes effect on the desktop YouTube website. Some features only apply on video watch pages, the homepage, search pages, comment areas, or Shorts-related areas. The exact scope is explained in the corresponding feature sections.

The question mark button beside a setting opens the corresponding section of this document directly. The default states mentioned in this document are the preset values used after resetting settings; existing settings do not change automatically after an upgrade.

<a name="player"></a>

# Player

These features enhance the viewing experience on video watch pages and mainly affect the YouTube player and the video watch page.

<a name="player-quality"></a>

## Lock Quality

<a name="player-quality-auto-switch"></a>

### Automatically Switch Video Quality

Default: `Off; target quality 1080p` | Version: `v1.0.1 (2025-06-09)`

After enabling this, the extension will try to switch the video quality to your selected resolution every time you enter or switch videos.

Suitable use cases:

- You want every video to use a fixed resolution as much as possible.
- You do not want to open YouTube's settings menu each time to adjust quality manually.
- Your network is stable and you want to prioritize 1080p, 1440p, 4K, or higher quality.

Configurable options:

- Switch: controls whether video quality is switched automatically.
- Target quality: you can select 8K, 4K, 1440p, 1080p, 720p, 480p, 360p, 240p, or 144p.

Notes:

- If the current video does not provide your selected quality, the extension will automatically fall back to the highest available quality below that selection.
- This feature only affects video watch pages.
- The qualities available from YouTube itself depend on the video source, device, network, and account status.

<a name="player-speed-button"></a>

## Speed Buttons

<a name="player-speed-button-show"></a>

### Show Speed Buttons and Speed Slider

Default: `On; show 0.5x, 1x, 1.5x, and 2x; speed slider on; mouse wheel follows button steps` | Version: `v1.0.0 (2025-05-19)`

After enabling this, custom speed buttons will appear in the player control bar. You can click the buttons directly to change playback speed without opening YouTube's original settings menu.

Suitable use cases:

- You often switch between fixed speeds such as 1.5x and 2x.
- You need to adjust speed quickly when watching tutorials, livestream replays, or long videos.
- You want to place frequently used speeds directly on the player.

Configurable options:

- Show speed buttons/speed slider: controls whether the extension's speed entry is shown in the player.
- Enabled buttons: you can select 0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x, 2.25x, 2.5x, 2.75x, 3x, 5x, or 10x.
- Enable speed slider: after enabling this, you can hold and drag left or right on the speed area to adjust speed continuously.
- Mouse wheel step: wheel speed adjustment can follow the enabled speed buttons, or use 0.0625, 0.125, 0.25, 0.5, 1, or a custom step.

Notes:

- The speed slider depends on "Show speed buttons/speed slider" being enabled and requires at least two speed buttons to be enabled.
- When the mouse is over the speed area and you scroll the wheel, playback speed will be adjusted directly.
- Custom wheel steps support very fine values, but values that are too small make adjustment slower, while values that are too large cause obvious speed jumps.

<a name="player-speed-button-save"></a>

### Remember Playback Speed

Default: `On; remember by channel on` | Version: `v1.0.1 (2025-06-09)`

After enabling this, the extension will remember the playback speed you used and automatically restore it in later videos.

Suitable use cases:

- You usually watch most videos at the same speed.
- You want to use different speeds for different channels.
- You often switch between study, entertainment, and music channels.

Configurable options:

- Remember player speed: saves one global playback speed.
- Remember playback speed separately for each channel: saves playback speed by channel.

Notes:

- When both global memory and per-channel memory are enabled, per-channel memory has priority.
- Per-channel memory requires the extension to identify the channel that owns the current video.
- Memory data can be exported together with settings from the general settings.

<a name="player-volume-booster"></a>

## Volume Booster

<a name="player-volume-booster-gain"></a>

### Add Real Volume Gain in the Player

Default: `Show control on; volume boost off; boost level 2x` | Version: `v1.1.7 (2026-06-12)`

After enabling this, the extension can raise the sound above YouTube's built-in 100% volume and show a volume booster button in the player.

Suitable use cases:

- The video's own audio is too quiet.
- System volume is already high, but YouTube is still not loud enough.
- You want to temporarily boost the volume of one video instead of adjusting the whole system.

Configurable options:

- Show boost control beside the speed bar: controls whether the volume booster button is shown in the player.
- Enable volume boost by default: enables boosting by default when entering a video.
- Boost level: you can select gain levels from 1.25x to 5x, with 0.25x between each level.

Usage:

- Click the volume booster button inside the player to toggle boosting immediately.
- Place the mouse over the button and scroll the wheel to increase or decrease the boost level.

Notes:

- Excessive sound boost may cause clipping, noise, or worse audio quality.
- Some browsers may require the user to interact with the page before volume boosting can actually start working.
- If the in-player button is hidden, the default enabled state can still take effect, but you cannot temporarily toggle it in the player.

<a name="player-video-zoom"></a>

## Video Zoom

<a name="player-video-zoom-wheel"></a>

### Zoom the Video with the Mouse Wheel

Default: `On` | Version: `v1.1.8 (2026-07-03)`

After enabling this, you can scroll the mouse wheel over the video image to zoom in or out. After zooming in, you can drag the image to move the viewing area.

Suitable use cases:

- The video contains small text, fine details, or distant content that you need to see clearly.
- You want to zoom into a local area of a landscape video.
- You need to temporarily inspect details while watching teaching videos, screen recordings, or monitoring footage.

Usage:

- Move the mouse to the middle area of the video image and scroll up to zoom in.
- After zooming in, scroll down to zoom out until the original size is restored.
- After zooming in, hold the left mouse button and drag to move the image.

Notes:

- The maximum zoom is 4x.
- Video zoom will not trigger when the mouse is over player buttons, the control bar, links, input boxes, or similar areas.
- When the video is at its original size, only the area in the center of the video where the zoom hint appears captures the mouse wheel; the rest of the page can still scroll normally.
- This feature only affects the current video image and does not change the video source file.

<a name="player-subtitle"></a>

## Subtitles

<a name="player-subtitle-save-status"></a>

### Remember Subtitle Enabled State

Default: `On; remember by channel on` | Version: `v1.0.4 (2025-08-31)`

After enabling this, the extension will record whether you turned subtitles on and try to restore the subtitle state in later videos.

Suitable use cases:

- You often watch foreign-language videos and want subtitles to stay enabled by default.
- Some channels need subtitles while others do not.
- You do not want to manually turn subtitles on or off for every video.

Configurable options:

- Remember subtitle enabled state: records the global subtitle state.
- Remember subtitle enabled state separately for each channel: records subtitle state by channel.

Notes:

- Automatic subtitle state restoration requires both "Remember subtitle enabled state" and "Remember subtitle enabled state separately for each channel" to be enabled.
- If a video has no subtitles, the extension cannot force-generate YouTube subtitles.
- Per-channel memory requires the extension to identify the channel that owns the current video.

<a name="player-function-buttons"></a>

## Function Buttons

The rotate, mirror, and screenshot buttons can be enabled independently.

<a name="player-function-buttons-rotate"></a>

### Rotate Video Button

Default: `Off` | Version: `v1.0.9 (2025-11-22)`

After enabling this, a rotate button will appear in the player. Each click rotates the video image by 90 degrees.

Suitable use cases:

- The video was uploaded with the wrong orientation.
- You want to watch vertical content in landscape mode, or temporarily adjust the viewing orientation.

Notes:

- Rotation only affects the display effect on the current page and does not modify the video itself.
- When rotated by 90 or 270 degrees, the extension will try to scale the image to fit the player area.

<a name="player-function-buttons-mirror"></a>

### Mirror Video Button

Default: `Off` | Version: `v1.0.9 (2025-11-22)`

After enabling this, a mirror button will appear in the player. Clicking it flips the video image horizontally, and clicking again restores it.

Suitable use cases:

- When following dance, fitness, or instrument movements, you want left and right to better match your own perspective.
- You want to temporarily restore the direction of a video that was uploaded mirrored.

Notes:

- Mirroring only affects the display effect and does not change the video file.
- Mirroring can be used together with rotation.

<a name="player-function-buttons-screenshot"></a>

### Video Screenshot Button

Default: `Off` | Version: `v1.1.8 (2026-07-03)`

After enabling this, a screenshot button will appear in the player. Clicking it captures the current video frame and opens the image in a new window.

Suitable use cases:

- You want to save a frame from a video.
- You want to take notes, record tutorial steps, or save visual references.

Usage:

- After clicking the screenshot button, the extension opens a new window showing the screenshot.
- In the screenshot window, press Ctrl+S to save the image.

Notes:

- Browser popup blocking may prevent the screenshot window from opening.
- If the current video frame is not ready yet, the screenshot may fail.
- The screenshot filename will try to use the video title and current playback time.

<a name="player-button-display"></a>

## Button Display Mode

<a name="player-button-display-native"></a>

### Control Native Player Button Display

Default: `Mini player, picture-in-picture, theater mode, and cast buttons hidden; all others automatic` | Version: `v1.0.0 (2025-05-19)`

This feature controls the display mode of some native buttons in the YouTube player, making the player control bar cleaner.

Suitable use cases:

- You do not use certain native YouTube buttons and want to reduce distractions.
- You want to force-show certain buttons that YouTube hides.
- You want the player control bar to better match your personal habits.

Configurable buttons:

- Autoplay button.
- Subtitles button.
- Settings button.
- Mini player button.
- Picture-in-picture button.
- Theater mode button.
- Play on TV button.
- Full screen button.

Configurable display modes:

- Auto: keep YouTube's default display behavior.
- Hide: hide the corresponding button.
- Force enable: try to keep the corresponding button visible.

Notes:

- The subtitles button only supports "Auto" and "Hide"; it does not provide "Force enable".
- If YouTube's page structure changes, display control for individual buttons may temporarily stop working.

<a name="player-mini-player"></a>

## Scrolling Mini Player

<a name="player-mini-player-scroll"></a>

### Float the Video While Scrolling

Default: `Off; 480×270; bottom-right; margin 16px; trigger distance 48px` | Version: `v1.1.7 (2026-06-12)`

After enabling this, when you scroll down and leave the player on a video watch page, the current video becomes a floating mini player, making it easier to browse comments or recommendations while watching.

Suitable use cases:

- You want to browse the comment area while watching a video.
- You want to scroll down the watch page without letting the video leave your view.
- You need to look for information while watching a long video.

Configurable options:

- Size: you can select 360×203, 420×236, 480×270, 560×315, 640×360, or 720×405.
- Position: you can select top-left, top-center, top-right, bottom-left, bottom-center, or bottom-right.
- Screen margin: sets the distance between the mini player and the screen edge.
- Activate after scrolling past the player: sets how many pixels away from the original player before entering mini player mode.

Notes:

- This feature only takes effect on normal video watch pages.
- It will not enter mini player mode during full-screen playback or picture-in-picture playback.
- The mini player has a close button. After clicking it, floating will be disabled for the current scroll; when you scroll back near the player or switch videos, triggering will be allowed again.
- When the screen is too small, the actual display size is automatically reduced to avoid exceeding the screen.
- Small mini player sizes hide some control buttons that are not suitable for display.

<a name="player-ui"></a>

## UI

<a name="player-ui-ending-overlay"></a>

### Translucent End-Screen Recommendations

Default: `On` | Version: `v1.0.0 (2025-05-19)`

After enabling this, recommended videos, author entries, and other elements overlaid on the video at the end will become translucent to reduce obstruction.

Suitable use cases:

- End-screen recommendation cards often block the video image.
- You want to see the last few seconds of the video clearly.

Notes:

- When the mouse hovers over these recommendation elements, they return to normal display for easy clicking.
- This feature only affects end-screen overlay elements in the player.

<a name="player-ui-progress-bar"></a>

### Progress Bar Below the Video

Default: `On; height 2px` | Version: `v1.0.8 (2025-11-14)`

After enabling this, when the YouTube player control bar auto-hides, a simple progress bar appears at the bottom of the video.

Suitable use cases:

- You want to see playback progress without showing the full control bar.
- You want to reduce obstruction from YouTube's native progress bar and control bar.

Configurable options:

- Whether to show the progress bar.
- Progress bar height, supporting 1 to 20 pixels.

Notes:

- The progress bar is mainly shown when the player control bar is hidden.
- Live videos do not show this progress bar.

<a name="player-ui-time-tag"></a>

### Corner Video Time

Default: `On; font size 12; bottom-left; margin 5px` | Version: `v1.0.8 (2025-11-14)`

After enabling this, when the player control bar auto-hides, the corner of the player shows the current playback time and total duration.

Suitable use cases:

- You want to know where playback is at any time without opening the full control bar.
- You need a more obvious time indicator when watching long videos.

Configurable options:

- Whether to show video time.
- Font size, supporting 8 to 48.
- Display position: bottom-left, bottom-right, top-left, or top-right.
- Offset from the edge, supporting 0 to 200 pixels.

Notes:

- The time badge is mainly shown when the player control bar is hidden.
- Live videos usually only show the current playback time.

<a name="player-other"></a>

## Other

<a name="player-other-max-volume"></a>

### Use True 100% Volume at Maximum Volume

Default: `On` | Version: `v1.0.0 (2025-05-19)`

After enabling this, when YouTube's volume bar is at 100%, the extension ensures the video element itself is also at a true full-volume state.

Suitable use cases:

- YouTube shows full volume, but the actual sound is still low.
- You want to ensure the player is not additionally reducing volume.

Notes:

- This feature only intervenes when YouTube's volume bar is at 100%.
- This is not extra volume amplification; if you need volume above 100%, use "Volume Booster".
- When active, the volume slider uses a noticeable color indicator.

<a name="player-other-nonstop"></a>

### Disable Automatic Video Pause

Default: `On` | Version: `v1.1.5 (2026-04-11)`

After enabling this, the extension will try to prevent YouTube's automatic pause prompt after long playback and automatically handle dialogs such as "Video paused. Continue playing?" when detected.

Suitable use cases:

- You play music, podcasts, livestream replays, or study videos for a long time.
- You do not want YouTube to pause because there has been no operation for a long time.

Notes:

- This feature only targets YouTube automatic pause behavior.
- If a video stops because the user paused it manually, because of network issues, or because of page restrictions, the extension does not guarantee continued playback.

<a name="translate"></a>

# Translation

These features are used to translate video list titles, watch page text, subtitles, and comments. All translation features use online translation services, so network access is required.

<a name="translate-settings"></a>

## Translation Settings

<a name="translate-settings-target-language"></a>

### Translation Target Language

Default: `Follow YouTube language` | Version: `v1.0.9 (2025-11-22)`

This setting determines which language video lists, watch pages, subtitles, and comments are translated into.

Configurable options:

- Follow YouTube language: automatically use the current YouTube page language.
- Specify language: choose a fixed target language from the list.

Notes:

- If the source language and target language are the same, some translation features will skip automatic translation.
- After changing the target language, previously displayed old translation content may require refreshing the page or reloading comments before it updates.

<a name="translate-settings-never-translate"></a>

### Always Never Translate Languages

Default: `Empty list` | Version: `v1.1.2 (2025-11-26)`

This setting is used to avoid automatically translating content in certain languages and applies to video list titles, watch page titles, descriptions, summaries, subtitles, and comments.

Suitable use cases:

- You can read certain languages directly and do not want them to be translated automatically.
- You want to avoid translated text repeatedly appearing for Chinese, English, or other familiar languages.

Notes:

- Language detection ignores regional differences within the same language. For example, after selecting English, content in other regional varieties of English is also skipped.
- When a comment is identified as a language that does not need translation, the extension keeps a manual translation button only when "Show a manual translation button for comments that do not need automatic translation" is enabled.
- Video lists, watch page text, and subtitles do not provide a manual translation action; matching excluded languages retain the original text directly.

<a name="translate-global"></a>

## Global Translation

<a name="translate-global-video-list-title"></a>

### Translate Video List Titles

Default: `On` | Version: `v1.2.1 (2026-07-21)`

After enabling this, the extension displays translations below the original titles in video lists, allowing you to understand video content directly while browsing without first opening the watch page.

Suitable use cases:

- You browse foreign-language home pages, search results, or recommendation lists.
- You view Shorts titles and player end-screen recommendations and want to see translations at the same time.
- You want to keep the original titles so you can compare them with the translations.

Scope:

- The YouTube home page, search results, watch-page recommendation lists, and other areas that use video cards.
- Shorts video cards.
- Recommended videos displayed at the end of the player.

Notes:

- This feature does not depend on the subtitle translation or comment translation options.
- Translations use the "Translation Target Language" setting. When "Follow YouTube language" is selected, the current YouTube page language is used.
- Original titles are retained, while translations appear below them with a dashed underline to distinguish them.
- If a title is already in the target language, the translation is identical to the original, or translation fails, the extension does not display a duplicate translation.
- Enabling or disabling this feature automatically refreshes the current YouTube page.

<a name="translate-watch"></a>

## Watch Page Translation

<a name="translate-watch-video-title"></a>

### Translate Watch Page Video Title

Default: `On` | Version: `v1.2.1 (2026-07-21)`

After enabling this, regular video watch pages display a title translation below the original title while retaining the original title.

Suitable use cases:

- You want to quickly understand the title when watching a foreign-language video.
- You need to compare the original title with the translation to avoid losing the original context by viewing only the translation.

Notes:

- This feature only applies to regular video watch pages.
- Translations use the "Translation Target Language" setting and do not depend on the description, summary, subtitle, or comment translation options.
- If the title is already in the target language, the translation is identical to the original, or translation fails, the page retains the original title.
- Enabling or disabling this feature automatically refreshes the current YouTube page.

<a name="translate-watch-video-description"></a>

### Translate Video Description

Default: `On` | Version: `v1.2.1 (2026-07-21)`

After enabling this, regular video watch pages display a translated description near the original description. The corresponding translation remains visible whether the description is collapsed or expanded.

Suitable use cases:

- You read content descriptions, chapter information, or supplementary material for foreign-language videos.
- You want to retain the links, images, and formatting in the original description while reading the translation.

Notes:

- This feature only applies to regular video watch pages.
- Translations use the "Translation Target Language" setting and do not depend on the title, summary, subtitle, or comment translation options.
- The original description is retained, while the translation appears in an area with a dashed border. Links, images, and other content that cannot be translated directly remain unchanged.
- If the description contains no translatable text or translation fails, the page retains the original description.
- Enabling or disabling this feature automatically refreshes the current YouTube page.

<a name="translate-watch-video-summary"></a>

### Translate Video Summary

Default: `On` | Version: `v1.2.1 (2026-07-21)`

After enabling this, if YouTube provides a video summary on a regular video watch page, the extension displays a translated summary near the original summary. The appropriate translation is shown whether the summary is collapsed or expanded.

Suitable use cases:

- You want to understand the general content of a foreign-language video through its summary first.
- YouTube displays a summary, but the summary language is difficult for you to read.

Notes:

- This feature only applies to regular video watch pages where YouTube provides a summary.
- The extension only translates existing summaries and does not automatically generate summaries for videos without one.
- Translations use the "Translation Target Language" setting and do not depend on the title, description, subtitle, or comment translation options.
- If the summary is already in the target language, the translation is identical to the original, or translation fails, the page retains the original summary.
- Enabling or disabling this feature automatically refreshes the current YouTube page.

<a name="translate-subtitle"></a>

## Subtitle Translation

<a name="translate-subtitle-enable"></a>

### Enable Subtitle Translation

Default: `On; bilingual translation` | Version: `v1.1.3 (2025-12-03)`

After enabling this, the extension translates subtitle content when YouTube loads subtitles and displays the translation in the player subtitles.

Suitable use cases:

- You need subtitle translation when watching foreign-language videos.
- You want to keep the original subtitles while also seeing the translation.
- You want to directly replace subtitles with the target language.

Configurable options:

- Enable subtitle translation: controls whether video subtitles are translated.
- Translation mode: you can select "Bilingual translation" or "Show translation only".

Translation mode descriptions:

- Bilingual translation: shows both the translation and the original text in the subtitles.
- Show translation only: only shows the translated content.

Notes:

- This feature requires the video itself to have available subtitles.
- Enabling or disabling subtitle translation may refresh the current YouTube page.
- If subtitle content is too long or the translation service fails, the extension keeps the original subtitles.
- Subtitle translation is a feature that adjusts page loading content. If the page behaves abnormally, you can first disable this feature for troubleshooting.

<a name="translate-comment"></a>

## Comment Translation

<a name="translate-comment-content"></a>

### Translate Comment Content

Default: `On` | Version: `v1.0.0 (2025-05-19)`

After enabling this, the extension automatically translates comments in the comment area and displays the translation near the original comment.

Suitable use cases:

- You browse multilingual comment areas.
- You want to quickly understand comments when watching overseas videos.
- You do not want to click YouTube's native translate button one by one.

Configurable options:

- Translate comment content: controls whether comments are translated automatically.
- Show a manual translation button for comments that do not need automatic translation: keeps an optional translation action for comments whose language matches the target language or the "Always never translate languages" setting.
- Translation target language: determines which language comments are translated into.
- Always never translate languages: avoids automatically showing translations for familiar languages.

Notes:

- If a comment is empty or contains only symbols, the extension shows a manual translation button. Comments identified as not needing translation only show it when "Show a manual translation button for comments that do not need automatic translation" is enabled.
- Translations preserve emoji, images, links, and text styling from the original comment wherever possible; video timestamp links in the translation remain clickable and jump to the corresponding time.
- After comment sorting, loading more comments, or YouTube dynamically refreshing the comment area, the extension continues processing newly appearing comments.
- If the translation service is unavailable, comments remain unchanged.

<a name="translate-comment-manual-button"></a>

### Show a Manual Translation Button for Comments That Do Not Need Automatic Translation

Default: `On` | Version: `v1.2.1 (2026-07-21)`

When enabled, comments whose detected language matches the translation target language or the "Always never translate languages" setting keep a manual translation button.

When disabled, those comments show neither an automatic translation nor the manual translation button. Comments that need translation continue to be translated automatically.

<a name="translate-comment-line-by-line"></a>

### Show Translation Line by Line Below the Original Text

Default: `On` | Version: `v1.1.7 (2026-06-12)`

After enabling this, for comments containing multiple lines, the extension tries to place each translated line below the corresponding original line instead of stacking the whole translated paragraph at the end of the comment.

Suitable use cases:

- Translating lyrics, segmented explanations, long comments, or multi-line timelines.
- You want to read the original text and translation line by line.

Notes:

- This feature depends on "Translate comment content" being enabled.
- Line-by-line display is only obvious when the comment itself contains line breaks; normal single-line comments still show translation in the normal way.

<a name="other"></a>

# Other

These features are used to adjust YouTube page layout, comment display, ad distractions, Shorts, branding, old layouts, and custom styles.

<a name="other-home"></a>

## Home

<a name="other-home-video-per-row"></a>

### Lock the Number of Recommended Videos per Row on the Home Page

Default: `Off; 4 per row` | Version: `v1.0.0 (2025-05-19)`

After enabling this, you can fix how many recommended videos are shown per row on the YouTube home page.

Suitable use cases:

- You want home page cards to be denser or looser.
- You do not like YouTube automatically adjusting the number per row based on window width.
- You want to show more videos on a large screen.

Configurable options:

- Switch: controls whether the number per row is locked.
- Count: enter the number of videos displayed per row.

Notes:

- This feature mainly affects the recommended video grid on the home page.
- The currently suggested input range is 1 to 10; values outside the range will be reset to 4.
- When the page width is too narrow, YouTube's own layout may still affect the actual display.

<a name="other-comment"></a>

## Comments

<a name="other-comment-nickname"></a>

### Show Commenter Nicknames

Default: `On` | Version: `v1.0.0 (2025-05-19)`

After enabling this, the extension tries to display the commenter's channel name and show the original account name as auxiliary information.

Suitable use cases:

- You want to see a more complete channel display name for commenters.
- You are not used to only seeing YouTube account names or handles.

Notes:

- After enabling or disabling this, you may need to refresh the YouTube page.
- This feature needs to access the commenter's channel page to read the name, so loading speed depends on the network and YouTube page response.
- If channel information cannot be read, comment display stays unchanged from YouTube's original display.

<a name="other-comment-auto-more"></a>

### Automatically Expand Long Comments

Default: `On` | Version: `v1.0.0 (2025-05-19)`

After enabling this, long comments are automatically expanded, and the "Show more" and "Show less" buttons in comments are hidden.

Suitable use cases:

- You often read long comments or lyric comments.
- You do not want to repeatedly click "Show more".

Notes:

- This feature mainly affects the comment area.
- After enabling this, long comments are expanded by default, and the manual collapse entry is hidden.

<a name="other-anti-ad"></a>

## Ad Blocking

<a name="other-anti-ad-image"></a>

### Block Image and Text Ads

Default: `Off` | Version: `v1.0.0 (2025-05-19)`

After enabling this, the extension hides image/text ads, ad slots, some Premium promotions, and page ad modules on YouTube pages.

Suitable use cases:

- You want to reduce ad distractions on the home page, watch page, and sidebar.
- You want the recommendation content area to be cleaner.

Notes:

- This is an experimental feature and is not guaranteed to block all ads.
- After YouTube's page structure changes, some ads may reappear.

<a name="other-anti-ad-video"></a>

### Video Ad Blocking (Discontinued)

Default: `Unavailable` | Version: `v1.0.0 (2025-05-19)`

The current version has discontinued the extension's built-in video ad blocking feature. Its entry in the settings panel appears as an unavailable option with a strikethrough and can no longer be enabled.

Alternatives:

- uBlock Origin: blocks common webpage ads, including video ads.
- SponsorBlock: skips sponsor or promotional segments added to videos by their creators.

Notes:

- The alternatives above are independent browser extensions and are not part of YouTube Tweak. Their availability depends on the browser and the corresponding extension's support.
- "Block Image and Text Ads" and "Block Creator Product Recommendations" remain features that can be used independently.

<a name="other-anti-ad-merch"></a>

### Block Creator Product Recommendations

Default: `Off` | Version: `v1.0.0 (2025-05-19)`

After enabling this, the extension hides creator product recommendations, shopping recommendation shelves, ticket recommendations, and some product recommendation entries in the player.

Suitable use cases:

- You do not want to see merchandise shelves or shopping promotions on watch pages.
- You want to reduce commercial recommendations around videos.

Notes:

- This feature only hides related page elements and does not change the video content itself.
- After YouTube's page structure changes, individual product modules may temporarily fail to hide.

<a name="other-shorts"></a>

## Shorts

The three Shorts blocking options work independently.

<a name="other-shorts-home-search"></a>

### Block Shorts on the Home Page and in Search Results

Default: `Off` | Version: `v1.0.1 (2025-06-09)`

After enabling this, Shorts sections in home page recommendations are hidden, and Shorts sections in search results are hidden together.

Suitable use cases:

- You do not want to see Shorts recommendations on the home page.
- You only want to see normal video results when searching content.

Notes:

- This feature affects Shorts recommendation areas on the home page and search pages.
- It does not delete Shorts content on YouTube; it only hides the corresponding entries or sections.

<a name="other-shorts-watch"></a>

### Block Shorts Recommendations on Video Watch Pages

Default: `Off` | Version: `v1.0.1 (2025-06-09)`

After enabling this, Shorts recommendations in the video watch page sidebar, description area, or related recommendation area are hidden.

Suitable use cases:

- You do not want Shorts recommendations to interrupt you while watching normal videos.
- You want the watch page recommendation area to focus more on normal videos.

<a name="other-shorts-menu"></a>

### Block Shorts in the Sidebar

Default: `Off` | Version: `v1.0.1 (2025-06-09)`

After enabling this, Shorts entries in the YouTube sidebar, mini sidebar, and mobile web bottom navigation are hidden.

Suitable use cases:

- You do not use Shorts and want to reduce entry-point distractions.
- You want to avoid accidentally clicking Shorts.

Notes:

- This feature mainly hides entry points and does not affect directly opening Shorts links.
- Under different YouTube languages or layouts, individual entries may not be hidden.

<a name="other-rollback"></a>

## Rollback

<a name="other-rollback-player-layout"></a>

### Return to the Old Watch Page Layout

Default: `Off` | Version: `v1.1.7 (2026-06-12)`

After enabling this, the extension adjusts part of the YouTube watch page layout closer to the old style, such as restoring a narrower right recommendation column and smaller recommendation thumbnails.

Suitable use cases:

- You do not like the new watch page's right recommendations being too wide or thumbnails being too large.
- You want the watch page layout to be more compact.
- You encounter non-16:9 videos displaying awkwardly in the player area.

Notes:

- This feature mainly affects the two-column layout of desktop video watch pages.
- It is a visual rollback adjustment for the page. Its effect may change after YouTube redesigns the page.

<a name="other-appearance"></a>

## Appearance

<a name="other-appearance-premium-logo"></a>

### Disguise Premium Logo

Default: `Off` | Version: `v1.2.0 (2026-07-18)`

After enabling this, the regular YouTube logo in the upper-left corner is displayed as the YouTube Premium logo.

Suitable use cases:

- You prefer the YouTube Premium logo style.
- You want the page header to look like a Premium account.

Notes:

- This only changes the logo appearance. It does not activate YouTube Premium, change your account membership, or unlock any Premium benefits.
- Enabling or disabling this feature reloads the current YouTube page.
- If YouTube changes its page data structure, the logo may temporarily remain unchanged.

<a name="other-appearance-logo-country-code"></a>

### Modify Logo Country/Region Label

Default: `Empty` | Version: `v1.2.1 (2026-07-21)`

After you enter text, the label next to the YouTube logo that originally displays the country or region is replaced with your text. Clearing the field restores YouTube's default display.

Suitable use cases:

- You want to customize the brand label in the upper-left corner of the page.
- You want to replace the default country or region abbreviation with personalized text.

Configurable options:

- Country/region label: enter custom text, such as `Pirates`; leave it blank to make no changes.

Notes:

- This feature only changes the text displayed next to the logo. It does not change your account region, content region, language, currency, recommendations, or actual location.
- After modifying or clearing the text, opened YouTube pages reload automatically.
- This option can be used independently and does not depend on "Disguise Premium Logo"; both can also take effect at the same time.
- If YouTube changes its page layout, this label may temporarily be unavailable.

<a name="other-custom-css"></a>

## Custom CSS

<a name="other-custom-css-inject"></a>

### Inject Custom CSS into YouTube

Default: `Off; style content empty` | Version: `v1.1.8 (2026-07-03)`

After enabling this, you can apply CSS styles you write to YouTube pages to adjust colors, hide elements, or modify layout details.

Suitable use cases:

- You are familiar with CSS and want to fine-tune YouTube according to personal habits.
- You want to temporarily hide certain page elements.
- You want deeper personalized appearance adjustments.

Configurable options:

- Switch: controls whether custom styles are enabled.
- Text box: enter the CSS to apply to YouTube.

Notes:

- Content is saved when the text box loses focus and applied to already opened YouTube pages.
- Incorrect CSS may cause abnormal YouTube page display.
- After turning off the switch, custom styles are removed from the page.

<a name="general"></a>

# General

These features are used for the extension's own language, settings, updates, about information, and installation prompts.

<a name="general-about"></a>

## About

<a name="general-about-info"></a>

### View Extension Information and Project Entries

Default: `Always shown` | Version: `v1.0.0 (2025-05-19)`

The General page shows the extension name, version number, build time, and the commit corresponding to the current version. It also provides entries for the project home page, changelog, issue feedback, and sponsorship. The Safari version uses the YouTweak name and corresponding icon, while other versions display YouTube Tweak.

Clicking the sponsorship entry displays a sponsorship prompt card, which can also be closed directly.

Suitable use cases:

- You want to confirm the currently installed version.
- You want to view update content.
- You want to report an issue or view the project source code.

<a name="general-about-check-update"></a>

### Manually Check for Updates

Default: `Click the version number to trigger manually` | Version: `v1.0.9 (2025-11-22)`

Click the version number to manually check whether the extension has a new version.

Notes:

- If the browser does not support manual update checks, the extension prompts you to check the extension store.
- If checks are too frequent, the browser may temporarily limit further checks.

<a name="general-language"></a>

## Language

<a name="general-language-switch"></a>

### Switch Extension Display Language

Default: `Follow browser language; use English when unsupported` | Version: `v1.0.1 (2025-06-09)`

You can switch the extension popup panel language on the General page.

Suitable use cases:

- You want to view settings in a language you are familiar with.
- You want to help check whether a translation is accurate.

Notes:

- Language switching immediately affects the extension panel.
- The page provides an entry for translation contributors, making it convenient to view or participate in translation.

<a name="general-update-notice"></a>

## Updates

<a name="general-update-notice-disable"></a>

### Disable Update Notifications

Default: `Off` | Version: `v1.2.1 (2026-07-21)`

After enabling this, the extension no longer uses the `new` badge on the extension icon to remind you to read new version notes, and clicking the extension icon no longer automatically opens the changelog because of unread notes.

Suitable use cases:

- You do not want the extension icon to display a marker for new version notes.
- You want each click on the extension icon to open the settings page you normally use.

Notes:

- When this option is disabled, reminders for unread new version notes are shown.
- The unread badge compares the first three parts of the version number; an update that changes only the fourth revision part does not display the `new` badge again.
- This option only disables new version note notifications. It does not prevent the browser from checking for, downloading, or installing extension updates.
- After disabling notifications, you can still manually view the changelog under "About" or click the version number to manually check for updates.

<a name="general-update-notice-version"></a>

### Available Update Prompt

Default: `Shown automatically when a new version is detected` | Version: `v1.0.1 (2025-06-09)`

When the browser detects an installable new version of the extension, the General page displays an update prompt.

Available actions:

- View changelog.
- Update now.

Notes:

- Normally, after all YouTube tabs are closed, the browser automatically completes the extension update.
- Clicking "Update now" reloads the extension and refreshes opened YouTube tabs after the update completes.
- "Disable Update Notifications" only disables unread new version note notifications. It does not disable the prompt shown when the browser has detected an available update.

<a name="general-update-notice-reload-page"></a>

### YouTube Page Reload Required Prompt

Default: `Detected and shown automatically` | Version: `v1.0.1 (2025-06-09)`

After the extension updates, already opened YouTube pages may still be using the old state. At this point, a prompt may appear on the page asking you to reload it.

Suitable use cases:

- The extension has just updated, but features on the YouTube page look abnormal.
- The page says the extension has been updated and needs to be reloaded.

Notes:

- There is no separate option in the settings panel.
- Click the reload button in the prompt to refresh the current page.
- After reloading, the page uses the new extension state.

<a name="general-update-notice-compatibility"></a>

### Compatibility Warning

Default: `Shown when subtitle translation or Disguise Premium Logo is enabled` | Version: `v1.1.3 (2025-12-03)`

When subtitle translation or Disguise Premium Logo is enabled, the General page displays a warning prompt.

Reason:

- These features directly adjust subtitle or branding information that YouTube loads into the page.
- This adjustment may cause page abnormalities because of YouTube redesigns, network issues, or browser restrictions.

Recommendation:

- If you encounter problems such as videos failing to play, abnormal subtitles, abnormal page loading, or payment-related pages for purchasing Premium, joining channel memberships, or sending live-stream donations not working correctly, first disable subtitle translation and Disguise Premium Logo for troubleshooting.

<a name="general-config"></a>

## Extension Settings

<a name="general-config-export"></a>

### Export Settings

Default: `Export regular settings only; memory excluded` | Version: `v1.0.1 (2025-06-09)`

You can export the current extension settings as text for backup, migration to another browser, or sharing with other users.

Configurable options:

- Also export memory: exports memory data such as per-channel speed and subtitle state.

Notes:

- If "Also export memory" is not checked, only normal settings are exported.
- The exported content is copied to the clipboard; if copying fails, you can manually select and copy the text.

<a name="general-config-import"></a>

### Import Settings

Default: `Import regular settings only; memory requires separate confirmation` | Version: `v1.0.1 (2025-06-09)`

You can paste previously exported settings text to restore settings to the current browser.

Notes:

- Import failure usually means the text format is incorrect or the content is incomplete.
- If the imported content contains memory data, the panel will require extra confirmation on whether to import that memory.
- Importing memory may overwrite existing per-channel speed, subtitle, and other memories in the current browser.

<a name="general-config-reset"></a>

### Reset Settings

Default: `Restore regular settings; retain per-channel memory` | Version: `v1.0.0 (2025-05-19)`

You can restore extension settings to their default values.

Notes:

- A confirmation prompt appears before reset.
- After reset, the panel returns to the "Player" page.
- Resetting normal settings does not specifically clear per-channel memory. If you need to migrate or overwrite memory, use the memory options in import/export.

<a name="general-installed"></a>

## Installation Welcome Page

<a name="general-installed-first-run"></a>

### First Installation Prompt

Default: `Open automatically after first installation` | Version: `v1.0.0 (2025-05-19)`

After the extension is installed for the first time, a welcome page opens, indicating that the extension has been installed successfully and guiding the user to click the browser's extension icon to start using it. The page adjusts the position and style of the arrow and extension icon hint for Safari, Chrome, Firefox, Edge, or other browsers.

Suitable use cases:

- You have just installed the extension and need to know where to open the settings panel.
- You want to confirm that the extension has been installed successfully.

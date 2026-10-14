<a name="functions"></a>

# Feature Guide

[中文](/docs/zh-cn/FUNCTIONS.md) | [English](/FUNCTIONS.md) | [日本語](/docs/ja/FUNCTIONS.md)

YouTube Tweak is a browser extension for enhancing the YouTube web experience and is displayed as YouTweak in the Safari version. This document follows the category order in the extension popup panel and focuses on what each feature does, what happens after it is enabled, which scenarios it fits, and which limitations to note.

This extension mainly takes effect on the desktop YouTube website. Some features only apply on video watch pages, the homepage, search pages, comment areas, or Shorts-related areas. The exact scope is explained in the corresponding feature sections.

Hover over a setting or card title to reveal its question mark button, which opens the corresponding section of this document directly. The default states mentioned in this document are the preset values used after resetting settings; existing settings do not change automatically after an upgrade.

Click any card title to expand or collapse its settings, or focus the title and press Enter or Space. Each card remembers its own state when you reopen the popup or switch categories or languages. These states are saved only in the current browser. Collapsing a card only hides its settings; it does not turn off features or clear their saved values.

<a name="player"></a>

# Player

These features enhance the viewing experience on video watch pages and mainly affect the YouTube player and the video watch page.

Dependent settings are grouped below their main switch. Turning off quality locking, speed controls, the mini player, the progress bar, or corner video time grays out the related options without clearing their saved values. Turning off network speed display similarly disables its unit and traffic options.

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

## Playback Speed

Playback rules appear first. Expand "Speed controls" to adjust the buttons, slider, and mouse wheel; collapsing this section only hides its settings and does not turn the controls off.

<a name="player-speed-button-save"></a>

### Remember Playback Speed

Default: `On; remember by channel on` | Version: `v1.0.1 (2025-06-09)`

After enabling this, the extension will remember the playback speed you set with its speed buttons, slider, or mouse wheel and automatically restore it in later videos.

Suitable use cases:

- You usually watch most videos at the same speed.
- You want to use different speeds for different channels.
- You often switch between study, entertainment, and music channels.

Configurable options:

- Remember player speed: saves one global playback speed.
- Remember playback speed separately for each channel: saves playback speed by channel.

Notes:

- When both global memory and per-channel memory are enabled, per-channel memory has priority.
- Speeds set through YouTube's own menu or keyboard shortcuts are not saved in this memory.
- Restoring either global or per-channel speed memory requires the extension to identify the channel that owns the current video.
- Memory data can be exported together with settings from the general settings.

<a name="player-speed-button-music"></a>

### Start Music Videos at 1×

Default: `Off` | Version: `v2.0.0 (2026-09-14)`

When a video loads and YouTube identifies its category as music, this option starts playback at 1× instead of restoring a saved global or channel speed. It also works when speed memory is turned off.

This is useful when you watch other videos at a faster speed but want music to start at its original tempo.

Notes:

- You can still change the speed manually afterward; this option does not keep forcing 1× during playback.
- Starting at 1× does not overwrite saved speeds. Later changes made with the extension's speed controls still follow your enabled speed memory options.
- Detection uses the video's category. A video that contains music but is not categorized as music may not be recognized.

<a name="player-speed-button-show"></a>

### Show Speed Buttons and Speed Slider

Default: `On; show 0.5x, 1x, 1.5x, and 2x; automatic button collapsing; speed slider on; mouse wheel follows button steps` | Version: `v1.0.0 (2025-05-19)`

After enabling this, custom speed buttons will appear in the player control bar. You can click the buttons directly to change playback speed without opening YouTube's original settings menu.

Suitable use cases:

- You often switch between fixed speeds such as 1.5x and 2x.
- You need to adjust speed quickly when watching tutorials, livestream replays, or long videos.
- You want to place frequently used speeds directly on the player.

Configurable options:

- Show speed buttons/speed slider: controls whether the extension's speed entry is shown in the player.
- Enabled buttons: select the highlighted speed choices you want to show: 0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x, 2.25x, 2.5x, 2.75x, 3x, 5x, or 10x.
- Collapse speed buttons: choose never, always, or automatically when the player control bar runs out of space.
- Enable speed slider: after enabling this, you can hold and drag left or right on the speed area to adjust speed continuously.
- Mouse wheel step: wheel speed adjustment can follow the enabled speed buttons, or use 0.0625, 0.125, 0.25, 0.5, 1, or a custom step.

Notes:

- Both dragging and mouse wheel adjustment require "Show speed buttons/speed slider" and "Enable speed slider" to be enabled, with at least two speed buttons enabled.
- Once these conditions are met, place the mouse over the speed area and scroll the wheel to adjust playback speed.
- Dragging and mouse wheel adjustment are limited to the lowest and highest enabled button speeds. Custom mouse wheel steps cannot exceed this range either. For example, with only 1x, 1.5x, and 2x enabled, adjustment is limited to 1x through 2x.
- Custom wheel steps support very fine values, but values that are too small make adjustment slower, while values that are too large cause obvious speed jumps.

<a name="player-volume-booster"></a>

## Volume Booster

<a name="player-volume-booster-gain"></a>

### Add Real Volume Gain in the Player

Default: `Show control on; volume boost off; boost level 2x` | Version: `v1.1.7 (2026-06-12)`

After enabling this, the extension can raise the sound above YouTube's built-in 100% volume and show a volume booster button in the player.

Suitable use cases:

- The video's own audio is too quiet.
- System volume is already high, but YouTube is still not loud enough.
- You want to adjust volume gain quickly in the player.

Configurable options:

- Show boost control beside the speed bar: controls whether the volume booster button is shown in the player.
- Enable volume boost by default: enables boosting by default when entering a video.
- Boost level: you can select gain levels from 1.25x to 5x, with 0.25x between each level.

Usage:

- Click the volume booster button inside the player to toggle boosting immediately.
- Place the mouse over the button and scroll the wheel to increase or decrease the boost level.
- When boosting is off, scrolling up enables it at 1.25x; scrolling down again at 1.25x turns boosting off.
- The enabled state and boost level adjusted in the player are saved automatically and used for later videos. If you only want to boost the current video, turn it off manually afterward.

Notes:

- Excessive sound boost may cause clipping, noise, or worse audio quality.
- Some browsers may require the user to interact with the page before volume boosting can actually start working.
- If the in-player button is hidden, the default enabled state can still take effect, but you need to return to the extension settings to adjust the switch and boost level.

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

- Global and per-channel memory can be enabled independently. When both are enabled, the current channel's memory takes priority, with global memory used as a fallback.
- Clicking the player's subtitle button, turning subtitles on or off in the player settings, or successfully toggling subtitles with YouTube's C key records the new state. Automatic restoration does not overwrite remembered manual choices.
- If a video has no subtitles, the extension cannot force-generate YouTube subtitles.
- Per-channel memory requires the extension to identify the channel that owns the current video.

<a name="player-subtitle-save-language"></a>

### Remember the Manually Selected Subtitle Language for Each Video

Default: `Off` | Version: `v2.0.3 (2026-10-14)`

When enabled, manually clicking YouTube's player settings and selecting a different subtitle language on a normal video watch page saves that choice for the video. This is useful when you revisit a video and want to keep using particular subtitles without affecting other videos.

Notes:

- Only manual subtitle changes in the player settings menu are recorded, not automatic selections or restorations made by the extension. Simply turning subtitles on or off does not save a language.
- Authored and auto-generated subtitles are distinguished. If you manually choose YouTube's auto-translate option, the target language is also remembered.
- On your next visit, the language is restored only if subtitles are already on. Restoring a language will not turn subtitles on; their on/off state remains controlled by YouTube and "Remember subtitle on/off status".
- The video's remembered language takes priority over "Preferred subtitle languages" below. If the original subtitles or translation target are no longer available, the priority list is tried instead.
- These per-video memories are stored only in the extension's local storage in the current browser, without browser cloud sync. To migrate them, check "Also export memory" when exporting settings.
- Turning this option off stops recording and restoring languages but does not delete existing memories.

<a name="player-subtitle-priority"></a>

### Preferred Subtitle Languages

Default: `Empty list` | Version: `v2.0.3 (2026-10-14)`

Set the order in which subtitle languages are selected on normal video watch pages. For example, after adding Chinese, English, and Japanese in that order, the extension first looks for Chinese subtitles, then English if Chinese is unavailable, and finally Japanese.

Configurable options:

- Add language: choose a language from the drop-down list. Names are displayed as "name in the current interface language (native name)", for example, "English (English)". Base languages and their regional variants appear in the same group.
- Subtitle type: each language offers separate choices for authored subtitles and subtitles marked "Auto-generated". Both can be added and ordered independently. "Auto-generated" means subtitles recognized from speech by YouTube, not subtitles translated from another language.
- Priority order: drag the handle on the left of an entry or click the move-up and move-down buttons. Entries higher in the list take priority.
- Remove language: click the remove button on the right of an entry to stop automatically selecting it.

Notes:

- Candidate languages come from the extension's built-in language list, not the current video's subtitles. Adding a language does not mean that the video provides it.
- Selecting a base language tries that language and its regional variants; selecting a specific variant narrows the match. Authored and auto-generated subtitles are not interchangeable and must be added separately.
- Languages are selected only when subtitles are on. This does not change the subtitle on/off state or automatically enable YouTube auto-translate.
- If the current video has a usable remembered manual language choice, that memory is restored first. The priority list is used only when no usable memory exists.
- If no subtitles match, YouTube's existing selection is retained. After you manually change subtitles in the current video, the extension will not override the choice with the priority list.
- This feature selects subtitle languages independently of the subtitle translation toggle in the "Translation" category.

<a name="player-function-buttons"></a>

## Function Buttons

The rotate, mirror, screenshot, and in-page fullscreen buttons can be enabled independently. For the function button group, choose never collapse, always collapse, or automatic collapsing when the player control bar runs out of space. Automatic collapsing is the default; the separate in-page fullscreen button is not part of this group.

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

<a name="player-function-buttons-in-page-fullscreen"></a>

### In-Page Fullscreen Button

Default: `Off` | Version: `v2.0.0 (2026-09-14)`

Shows an additional button beside YouTube's fullscreen button on normal video watch pages. Click it to fill the browser page with the video while keeping the browser tabs and toolbar available; click it again to leave this view.

This is useful when you want a larger video without entering system fullscreen. Changing pages or turning off this setting exits in-page fullscreen.

Entering in-page fullscreen also switches to theater mode. Clicking the button again or turning off the setting returns to the normal layout, even if theater mode was already active before entering; the previous theater mode is not retained.

<a name="player-button-display"></a>

## Button Display Mode

Click the card title to expand the native button settings. Closing the card does not change the selected display modes.

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
- In the scrolling mini player, dragging moves the entire floating player instead of panning the zoomed image.

Notes:

- The maximum zoom is 4x.
- Video zoom will not trigger when the mouse is over player buttons, the control bar, links, input boxes, or similar areas.
- When the video is at its original size, only the area in the center of the video where the zoom hint appears captures the mouse wheel; the rest of the page can still scroll normally.
- This feature only affects the current video image and does not change the video source file.

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

- Size: you can select 360×203, 420×236, 480×270, 560×315, 640×360, or 720×405. Custom dimensions set by dragging also appear here.
- Position: you can select bottom-right, bottom-center, bottom-left, top-right, top-center, or top-left.
- Screen margin: set horizontal X and vertical Y distances separately, in pixels, measured from the edges of the page's visible area at the selected corner. Centered positions remain horizontally centered.
- Activate after scrolling past the player: set how many pixels past the original player to scroll before entering mini player mode, from 0 to 400 pixels.

Dragging:

- Hold and drag an unobstructed area of the video to move the entire mini player. Player buttons, menus, and the control bar retain their own interactions.
- Drag any of the four corners to resize while preserving the video's aspect ratio. The size is limited by the page's visible area, with a minimum width of 260 pixels when enough space is available.
- When you release the mouse, the corner is selected according to whether the player's center is in the top-left, top-right, bottom-left, or bottom-right region of the page's visible area, and the X and Y margins are saved. Resizing also saves the dimensions.
- Dragging only previews changes; settings are saved on release. Press Esc to cancel the current drag and restore the previous layout.

Notes:

- This feature only takes effect on normal video watch pages.
- It will not enter mini player mode during full-screen playback or picture-in-picture playback.
- The mini player has a close button. After clicking it, floating will be disabled for the current scroll; when you scroll back near the player or switch videos, triggering will be allowed again.
- When the screen is too small, the actual display size is automatically reduced to avoid exceeding the screen.
- While floating, the extension's speed buttons, function button group, and corner video time are hidden.
- When the actual display width is below 520 pixels, some native control buttons are hidden, but subtitles remain visible. The control bar follows YouTube's automatic visibility behavior instead of staying visible while floating.
- Subtitles scale down with the player while retaining a readable font size of at least approximately 14 pixels, and long content wraps. Leaving mini player mode restores the original subtitle display without changing YouTube's subtitle font-size preference.

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
- Offset from the edge, supporting 0 to 200 pixels.
- Display position: bottom-left, bottom-right, top-left, or top-right.

Notes:

- The time badge is mainly shown when the player control bar is hidden.
- Live videos usually only show the current playback time.

<a name="player-ui-network-speed"></a>

### Real-Time Network Speed

Default: `Bottom-right of the video and control bar; fixed MB/s; page traffic total off` | Version: `v2.0.0 (2026-09-14)`

Shows the current player transfer speed so you can tell when the video is loading data. These settings are under Player → UI.

Configurable options:

- Display location: off, control bar only, or both the bottom-right of the video and the control bar.
- Rate unit: always show MB/s, or switch automatically between KB/s and MB/s.
- Track page traffic: adds an estimated cumulative transfer total beside the speed. The total resets when you change videos, navigate to another page, or restart tracking.

Notes:

- The figures reflect traffic reported by the player, not all traffic from the browser or device. They are approximate and can fall to zero when playback uses buffered data.
- Turning the display off grays out the unit and traffic options without clearing their saved choices.

<a name="player-other"></a>

## Other

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
- For comments in an excluded language that differs from the target language, a manual translation action is retained only when both "Translate comment content" and "Show a manual translation button for comments that do not need automatic translation" are enabled and a translation different from the original is available.
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
- The playlist sidebar on watch pages.
- Shorts video cards.
- Recommended videos displayed at the end of the player.

Notes:

- This feature does not depend on the subtitle translation or comment translation options.
- Translations use the "Translation Target Language" setting. When "Follow YouTube language" is selected, the current YouTube page language is used.
- Original titles are retained, while translations appear below them with a dashed underline to distinguish them.
- If a title is already in the target language, the translation is identical to the original, or translation fails, the extension does not display a duplicate translation.
- After enabling or disabling this feature, the page prompts you to reload; you can choose to refresh the current page or all YouTube pages.

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
- After enabling or disabling this feature, the page prompts you to reload; you can choose to refresh the current page or all YouTube pages.

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
- After enabling or disabling this feature, the page prompts you to reload; you can choose to refresh the current page or all YouTube pages.

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
- After enabling or disabling this feature, the page prompts you to reload; you can choose to refresh the current page or all YouTube pages.

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
- After enabling or disabling subtitle translation, the page prompts you to reload; you can choose to refresh the current page or all YouTube pages.
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
- Show a manual translation button for comments that do not need automatic translation: keeps a manual translation action for comments excluded from automatic translation, subject to the conditions described below.
- Translation target language: determines which language comments are translated into.
- Always never translate languages: avoids automatically showing translations for familiar languages.

Notes:

- Blank comments and comments containing only numbers or punctuation are skipped. Comments in the target language do not show the extension's manual translation button either.
- Translations preserve emoji, images, links, and text styling from the original comment wherever possible; video timestamp links in the translation remain clickable and jump to the corresponding time.
- After comment sorting, loading more comments, or YouTube dynamically refreshing the comment area, the extension continues processing newly appearing comments.
- If the translation service is unavailable, comments remain unchanged.
- After enabling or disabling comment translation, the page prompts you to reload; you can choose to refresh the current page or all YouTube pages.

<a name="translate-comment-manual-button"></a>

### Show a Manual Translation Button for Comments That Do Not Need Automatic Translation

Default: `On` | Version: `v1.2.1 (2026-07-21)`

When enabled, a manual translation button appears beside a comment if its language is in "Always never translate languages", differs from the translation target language, and the translation service returns a translation different from the original. The translation appears only after you click the button.

This is useful when you can usually read a language directly but occasionally need to view a translation of an individual comment.

Notes:

- This feature depends on "Translate comment content" being enabled.
- Comments in the target language do not show this button. Blank comments and comments containing only numbers or punctuation are skipped, and the button is also absent when the translation is identical to the original.
- When disabled, excluded comments show neither an automatic translation nor the manual translation button; comments that need normal translation continue to be translated automatically.

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

<a name="other-comment-blocked-users"></a>

### Hide Comments from Selected Users

Default: `Empty list` | Version: `v2.0.3 (2026-10-14)`

Enter accounts you do not want to see in the "Hidden commenters" text box to hide their comments in YouTube comment sections. This is useful for reducing disruptions from particular accounts.

Usage and limitations:

- Enter one account handle starting with @ per line, such as @example. Use the handle, not a display name or channel URL.
- Matching is case-insensitive. Leading and trailing spaces and blank lines are ignored; entries without a leading @ or containing whitespace have no effect.
- Hiding a top-level comment also hides its replies. Hiding a reply's author hides only the corresponding reply.
- Both existing and subsequently loaded comments are processed. Removing an account from the list also restores its affected comments that are already loaded.
- This only affects YouTube comments whose authors can be identified in the current browser. It does not block accounts, report users, or delete comments on your YouTube account, and does not filter video recommendations or live chat.

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
- After enabling or disabling this feature, the page prompts you to reload; you can choose to refresh the current page or all YouTube pages.
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
- After modifying or clearing the text, the page prompts you to reload; you can choose to refresh the current page or all YouTube pages.
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

<a name="insights"></a>

# Insights

These features show the current video's information, media formats, viewing restrictions, and the thumbnails, titles, and descriptions displayed in different languages. Open a YouTube video watch page before opening the extension's Insights page; on other pages, you will be prompted to open a video watch page first.

<a name="insights-info"></a>

## Basic Information

<a name="insights-info-view"></a>

### View Video Information

Default: `Read current video information when Insights opens` | Version: `v2.0.0 (2026-09-14)`

The top of the page shows the video thumbnail, title, channel, and subscriber count. Below it are the view count, like count, video length in seconds, subscriber count, and detailed information, allowing you to quickly check the current video's basic information.

- Date: shows the publication date; if the publication and upload dates differ, the upload date is also shown in parentheses.
- Category, username, and channel ID: help identify the video's category and publishing channel.
- Available regions: shows the number of available regions and the total number of regions covered.
- Subtitles / translation: shows the number of subtitle tracks and the number of target languages available for automatic translation, respectively.
- Video codecs: lists the codec names used by the retrieved video formats.
- Playback specifications: shows the highest frame rate among the retrieved formats and whether HDR formats are included; this does not indicate which specifications the player is currently using.
- Tags: shows the number of video tags.

A loading state is shown while information is being read. Information that could not be retrieved appears as "—" or unknown; it should not be interpreted as zero or as confirmation that there are no restrictions.

If a prompt requires confirmation on the page, return to YouTube and click "I understand and wish to proceed", then reopen Insights. Some information is only available after completing the confirmation on the page.

<a name="insights-video-formats"></a>

## Video Quality

<a name="insights-video-formats-view"></a>

### View Video Formats and Playback Specifications

Default: `Group collapsed; fetch additional media formats when expanded` | Version: `v2.0.0 (2026-09-14)`

Lists the retrieved video resolutions and their formats, ordered from highest to lowest resolution. Multiple formats at the same resolution are combined into an expandable group, while a single format is shown directly, making it easier to compare codecs, frame rates, and bitrates at the same quality.

Each format displays the following labels according to the information available:

| Label | Meaning |
| --- | --- |
| Codec name | The video compression format, such as H.264, VP9, or AV1. |
| FPS | The number of frames per second, also called the frame rate. |
| HDR / SDR | High dynamic range or standard dynamic range video, respectively. |
| kbps | The bitrate, or amount of data transferred per second; this value alone cannot determine image quality across different codecs. |
| KB / MB | The known media size, which may not include separately listed audio. |
| itag | The number YouTube uses to distinguish media formats. |
| A/V | This format contains both video and audio. |
| Premium | Premium enhanced-bitrate quality listed by YouTube. |

The first time you expand Video Quality or Audio Formats, additional formats are retrieved for both types of media. A prompt appears during loading; if loading fails, collapse the panel and expand it again to retry. This list is for viewing information; a listed Premium quality does not mean the current account is entitled to use it.

<a name="insights-audio-formats"></a>

## Audio Formats

<a name="insights-audio-formats-view"></a>

### View Audio Specifications

Default: `Group collapsed; fetch additional media formats when expanded` | Version: `v2.0.0 (2026-09-14)`

Lists the retrieved audio formats, ordered from highest to lowest bitrate. Multiple formats using the same codec are combined into an expandable group, while a single format is shown directly, making it easier to compare audio codecs and sound specifications.

In addition to the codec, bitrate, media size, and format number, entries may show the sample rate, channel count, quality level, and DRC label. kHz indicates the sample rate, and ch indicates the channel count; DRC means the audio has dynamic range compression, which reduces the volume difference between quiet and loud sounds. These details appear only when YouTube provides the relevant information.

<a name="insights-subtitles"></a>

## Subtitles

<a name="insights-subtitles-view"></a>

### View Subtitle Languages and Types

Default: `Shown when subtitle information is available; group collapsed` | Version: `v2.0.0 (2026-09-14)`

Lists subtitle languages in a compact multi-column layout, with the language code, whether the subtitles are automatically generated from speech, and whether they support YouTube automatic translation, making it easier to check which subtitles the video provides.

"Translatable" means the subtitles can be translated into other languages; it does not mean the video already provides separate subtitles for every target language. This section shows subtitle information; enabling subtitles and selecting their language are still done in the player.

<a name="insights-audio-tracks"></a>

## Audio Tracks

<a name="insights-audio-tracks-view"></a>

### View Audio Tracks and the Default Audio Version

Default: `Shown when audio track information is available; group collapsed` | Version: `v2.0.0 (2026-09-14)`

Lists the retrieved audio track names, default track marker, and the codecs and number of formats for each track, making it easier to check whether a video provides different languages or audio versions.

If complete track names cannot be retrieved, only a number, the default track, and related subtitle languages may be shown. This section displays the audio track information available; it does not switch the player's audio version.

<a name="insights-regions"></a>

## Region Availability

<a name="insights-regions-view"></a>

### View Available and Unavailable Regions

Default: `Group and region lists collapsed` | Version: `v2.0.0 (2026-09-14)`

Use this section to check the video's availability in different countries or regions. When regional restrictions apply, "Available regions" and "Unavailable regions" appear side by side within the same panel, separated by a vertical divider, with their respective counts. The two columns can be expanded or collapsed independently; each has a limited height when expanded and uses a vertical scrollbar if there are many entries.

The lists show region names and codes. "No restrictions" appears when the video is available in every region covered; "—" appears when region information could not be retrieved, which is not treated as worldwide availability. This section displays region information and does not change YouTube's viewing restrictions.

<a name="insights-restrictions"></a>

## Restrictions

<a name="insights-restrictions-view"></a>

### View Playback Restrictions and Available Capabilities

Default: `Collapsed; expanded or collapsed state remembered` | Version: `v2.0.0 (2026-09-14)`

The "Restrictions" panel has a red icon and groups the video's viewing restrictions and available capabilities. A check mark means the item is true, a cross means it is false, and "?" means it has not been confirmed; a loading state appears while information is being read. Colors also distinguish favorable states from restrictions, so a check mark does not necessarily mean there are no restrictions: for example, a check mark for "Age restriction" means an age restriction exists.

Hover over an item to see a short explanation. The meanings of the items are as follows:

| Item | Meaning |
| --- | --- |
| No regional restrictions | Whether the video can be watched in every country and region covered. |
| Family friendly | Whether YouTube marks the video as suitable for family viewing. |
| Comments | Whether an available comments entry or comment information was retrieved; the comment count may also appear. |
| Premium quality | Whether Premium enhanced-bitrate quality is listed. |
| Transcript | Whether a transcript entry is available. |
| Clips allowed | Whether an entry for creating clips from the video is available. |
| Storyboard | Whether the progress bar provides preview thumbnails. |
| Sign-in restriction | Whether watching requires signing in independently of age verification. |
| Suicide warning | Whether reminders or support information related to self-harm, suicide, or other crisis content appear. |
| Copyright block | Whether playback is reported as unavailable for copyright reasons. |
| Community Guidelines block | Whether playback is reported as unavailable for violating the Community Guidelines. |
| Other playback restrictions | Whether playback restrictions exist that do not fall into the other recognized categories. |
| Age restriction | Whether viewers must meet the required age or complete age confirmation. |
| Unlisted video | Whether the video is marked as unlisted and usually requires a link to access. |
| Private video | Whether the video is marked as private and can only be accessed by its publisher and authorized viewers. |
| Members only | Whether paid channel membership is required. |
| Made for kids | Whether the video is identified as content for children; YouTube may limit related interactions and playback capabilities. |
| Embedding allowed | Whether playback can be embedded on other websites. |
| Ad serving | Whether the information currently retrieved includes ad-serving data; missing data does not confirm that the video cannot earn revenue. |
| Shorts allowed | Whether YouTube marks the video as usable for Shorts. |

These markers help explain the information currently available; they do not bypass sign-in, age, membership, regional, or other viewing restrictions. An unknown state also cannot establish whether a restriction exists or not.

<a name="insights-language-versions"></a>

## Language Versions

<a name="insights-language-versions-query"></a>

### Select Languages and Query in Batches

Default: `Manual start; language selector collapsed; first 10 remaining languages selected by popularity; up to 10 languages initially; 10 per subsequent batch` | Version: `v2.0.0 (2026-09-14)`

This panel is last on the Insights page and lets you compare the thumbnails, titles, and descriptions YouTube displays in different languages. The selection and loading controls are below the results; queries start only when you click the loading button.

- Languages to check: the single-line entry shows the selected count. Click it to expand the multi-select list. Hold Ctrl/⌘ to select multiple languages or Shift to select a range; Select all and Clear selection are also available. Languages that have been loaded or restored from the cache are removed from the available options.
- Subsequent batches: choose up to 5, 10, 20, or 50 languages per batch. Changing this number selects that many remaining popular languages again without starting a query automatically.
- Loading button: processes selected, unloaded languages in list order. The initial loading limit applies when no results have been loaded; after restoring the cache, the "Continue loading" batch size is used. Once every currently selected language loads successfully, the next batch of remaining languages is selected, but requires another click to continue; completing only the current selection does not show "All languages have been loaded".
- Stop: stops subsequent queries in the current batch; a request already sent finishes first, so "Stopping" may appear briefly after clicking. Retrieved results are retained.

Queries run one at a time, with each language starting immediately after the previous one completes, without an additional pause. Language selection and batch size cannot be changed during a query. Closing the popup also stops subsequent queries, although a request already sent may still finish. If a language query fails, the current batch stops and can be retried later; if YouTube limits requests, a prompt appears and queries pause for 60 seconds. If the video changes or you leave the watch page, reopen Insights before querying again.

Avoid using this feature too quickly or frequently, as YouTube may block requests. If localized content is unavailable, YouTube may return the original version, so these results do not confirm which translations the creator supplied.

Languages are ordered by estimated internet users, with regional variants last. Ordering data is adapted from [OBDILCI V6 (July 2025)](https://www.obdilci.org/projects/main/), using the [original spreadsheet’s INTERNAUTES L1+L2 column](https://www.obdilci.org/wp-content/uploads/2025/07/ResultsV6.xlsx): estimated connected first- and second-language speakers, not a globally deduplicated headcount. For a few aggregated or missing languages, [CLDR 48 language populations](https://raw.githubusercontent.com/unicode-org/cldr/release-48/common/supplemental/supplementalData.xml) multiplied by [World Bank internet-use rates (IT.NET.USER.ZS)](https://data.worldbank.org/indicator/IT.NET.USER.ZS) are used to split totals proportionally or fill gaps. The adapted ordering data retains the [CC BY-SA 4.0 license](https://creativecommons.org/licenses/by-sa/4.0/).

<a name="insights-language-versions-view"></a>

### View Thumbnails, Titles, and Descriptions

Default: `Shown after results are available; descriptions collapsed` | Version: `v2.0.0 (2026-09-14)`

Results have separate "Thumbnails" and "Titles and descriptions" sections. Each groups identical content and lists the languages it includes, making it easier to find content differences between languages.

Each distinct thumbnail is shown at full width on its own row, and identical thumbnails are grouped together; click a thumbnail to open the image in a new tab. Matching title-and-description pairs are grouped separately; click a title to expand or collapse its description. Only one description can be expanded at a time, and expanding another automatically collapses the previous one. "No description" appears when no description is available.

Query progress shows the number of languages checked and the number of grouped versions. Versions are counted by the complete thumbnail, title, and description combination, so this may differ from the number of thumbnails or text combinations alone. Results and expanded descriptions grow with their content and use the popup's main scrolling area, without separate inner scrollbars.

<a name="insights-language-versions-cache"></a>

### Reuse Local Query Results

Default: `Stored locally in this browser per video; valid for 60 minutes; checked and cleaned when the popup opens` | Version: `v2.0.0 (2026-09-14)`

Successful query results are cached automatically and can be restored directly when the popup reopens, reducing repeated queries. If the current video has valid cached results when the popup opens, all of its still-valid language results are renewed for the validity period stated above; entries for other videos are not renewed, and expired results are not restored to a valid state.

There is no timed cache cleanup while the popup stays open. After results are restored, their languages are removed from the available options, and the remaining popular languages are selected according to the query feature's preselection rules; if all languages already have valid cached results, no languages are preselected.

<a name="general"></a>

# General

These features are used for the extension's own language, settings, updates, about information, and installation prompts.

<a name="general-about"></a>

## About

<a name="general-about-info"></a>

### View Extension Information and Project Entries

Default: `Always shown` | Version: `v1.0.0 (2025-05-19)`

The General page shows the extension name, version number, build time, and the commit corresponding to the current version. It also provides entries for the project home page, changelog, and issue feedback. The Safari version uses the YouTweak name and corresponding icon, while other versions display YouTube Tweak.

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

After the extension updates, already opened YouTube pages may still be using the old state. A reload prompt also appears after changing settings that require reloading to take full effect. When the prompt appears, you can decide when to refresh.

Suitable use cases:

- The extension has just updated, but features on the YouTube page look abnormal.
- The page says the extension has been updated and needs to be reloaded.
- You want already opened pages to use new settings after changing translation, logo, or similar options.

Available actions:

- Refresh current page: reloads only the YouTube page showing the prompt.
- Refresh all YouTube pages: appears in prompts caused by settings changes and reloads all open YouTube tabs in the browser at once.

Notes:

- There is no separate option in the settings panel.
- When an extension update invalidates the connection, the prompt only provides a button to refresh the current page.
- Refreshing reloads the page content, so you can wait until you have finished your current browsing activity before clicking.
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

- Also export memory: backs up cloud-synced global and per-channel playback speeds and subtitle on/off states, together with locally stored per-video subtitle language memories.

Notes:

- The memory option covers both cloud-synced memory and local per-video memory. Neither is exported when it is unchecked.
- The exported content is copied to the clipboard; if copying fails, you can manually select and copy the text.
- Local interface data such as card expansion states and Insights query caches are not included in this backup.

<a name="general-config-import"></a>

### Import Settings

Default: `Import regular settings only; memory requires separate confirmation` | Version: `v1.0.1 (2025-06-09)`

You can paste previously exported settings text to restore settings to the current browser.

Notes:

- Import failure usually means the text format is incorrect or the content is incomplete.
- If the imported content includes cloud-synced or local per-video memory, the panel requires separate confirmation to import it. Without confirmation, only regular settings are imported.
- After confirmation, each memory category included in the backup replaces the corresponding current memory entirely rather than merging with it. If an included category is empty, its current memory is cleared.
- Memory categories absent from the backup remain unchanged. For example, importing an older backup without local memory does not clear existing per-video subtitle language memories.
- Imported per-video subtitle language memories remain local to the current browser and are not moved to cloud sync.

<a name="general-config-reset"></a>

### Reset Settings

Default: `Restore regular settings; retain existing memory` | Version: `v1.0.0 (2025-05-19)`

You can restore extension settings to their default values.

Notes:

- A confirmation prompt appears before reset.
- After reset, the panel returns to the "Player" page.
- Resetting regular settings does not clear cloud-synced or local per-video memory. To migrate or replace memory, use the memory options in import/export.

<a name="general-installed"></a>

## Installation Welcome Page

<a name="general-installed-first-run"></a>

### First Installation Prompt

Default: `Open automatically after first installation` | Version: `v1.0.0 (2025-05-19)`

After the extension is installed for the first time, a welcome page opens, indicating that the extension has been installed successfully and guiding the user to click the browser's extension icon to start using it. The page adjusts the position and style of the arrow and extension icon hint for Safari, Chrome, Firefox, Edge, or other browsers.

Suitable use cases:

- You have just installed the extension and need to know where to open the settings panel.
- You want to confirm that the extension has been installed successfully.

Enabling the Safari version and accessing its settings:

- After installing YouTweak, open the companion app to view the setup instructions; installing the app alone does not mean the Safari extension is enabled.
- On macOS, clicking "Enable YouTweak Extension" or "Open YouTweak Extension Settings" opens Safari's extension settings, where you can enable and manage the extension.
- On iPhone or iPad, these two buttons open the [setup instructions](/docs/en/help/ios.md#safari-enable) and [settings access instructions](/docs/en/help/ios.md#safari-setting), respectively. Follow the instructions to complete the process.
- Then open YouTube in Safari, follow Safari's prompt to allow the extension access to the website, and open YouTweak settings through the browser's extension entry.
- The companion app also provides entries for the project home page, issue feedback, feature guide, changelog, and website to help you find assistance.

@echo off
:: Disable remote debugging and unsafe extension debugging to prevent issues with YouTube playback and subtitles

set CHROME_PROFILE=I:\.profile\chrome

start "" "C:/Program Files/Google/Chrome/Application/chrome.exe" --user-data-dir="%CHROME_PROFILE%" https://www.youtube.com/watch?v=zczjerfFrSI

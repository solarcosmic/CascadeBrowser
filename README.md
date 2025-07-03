![cascade_banner2](https://github.com/user-attachments/assets/2289eab6-b0b6-4cf1-af0a-b0111035fc9c)
# Cascade (Browser)
A proof-of-concept simplistic web browser built in Electron.

Inspired by [Zen](https://zen-browser.app/), [Arc](https://arc.net/), and [Flow](https://flow-browser.com/). Looks like Zen, feels like Arc (hint: no it doesn't), and is somewhat minimalist.

The purpose of Cascade was for three reasons:
1. To learn Electron further and how WebViews work
2. To see what was possible with Electron
3. Hack Club :)

As such, it is not recommended to daily drive this browser. It is just a browser to see what Electron's capable of (and myself).

## What can Cascade do?
It can do basic web browsing tasks, such as:
- Back/forward and reload navigation
- Various keybinds (Ctrl+R, Ctrl+Shift+R, Ctrl+P, Ctrl+W, Ctrl+T)
- Tab creation and destruction, as well as loading favicons
- Basic support for context menus (e.g. Inspect, Select All)
- Save tabs on exit, so it loads them on next load
- Smart URL bar (direct URL, search, etc.)
- Browse!

It is missing quite a few additional features, (e.g. bookmarks, browsing history) but those are beyond the scope of this project.

## How does Cascade work?
Cascade uses `WebView`(s) (yes, I know) as its main driver for Chromium. There are better and more supported solutions out there, such as `WebContentView`, but that goes beyond the scope of this project, as one of the reasons I chose not to use it is because it isn't easily embeddable into the DOM.

![Screenshot From 2025-07-01 22-22-06](https://github.com/user-attachments/assets/1efc13d8-edc8-44e5-91d2-96e5dc633e36)
Example of the GitHub landing page running on a somewhat old version of Cascade (GNOME 48)

## AI Disclosure (Gemini, GPT-4o)
AI was used in the making of this project, but only to:
- Fix small issues that were the outcome of other additions
- Additional code for other complex elements like Regex

The code is licensed under MIT.

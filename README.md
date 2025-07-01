![cascade_banner2](https://github.com/user-attachments/assets/2289eab6-b0b6-4cf1-af0a-b0111035fc9c)
# Cascade (Browser)
A proof-of-concept simplistic web browser built in Electron.

Looks like Zen, feels like Arc (hint: no it doesn't), and is somewhat minimalist.

The purpose of Cascade was for three reasons:
1. To learn Electron further and how WebViews work
2. To see what was possible with Electron
3. Hack Club :)

As such, it is not recommended to daily drive this browser. It is just a browser to see what Electron's capable of (and myself).

## How does Cascade work?
Cascade uses `WebView`(s) (yes, I know) as its main driver for Chromium. There are better and more supported solutions out there, such as `WebContentView`, but that goes beyond the scope of this project, as one of the reasons I chose not to use it is because it isn't easily embeddable into the DOM.

![Screenshot From 2025-07-01 22-22-06](https://github.com/user-attachments/assets/1efc13d8-edc8-44e5-91d2-96e5dc633e36)
Example of the GitHub landing page running on Cascade (GNOME 48)

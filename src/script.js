/*
 * Copyright (c) 2025 solarcosmic.
 * This project is licensed under the MIT license.
 * To view the license, see <https://opensource.org/licenses/MIT>.
*/
var focusedTab = null;

/*
 * Creates a WebView object, used to display the Chromium tab.
*/
function createWebView(url, uuid) {
    const webView = document.createElement("webview");
    webView.classList.add("view-box");
    webView.src = url;
    webView.setAttribute("allowpopups", true);
    webView.setAttribute("preload", "../preload.js");
    document.getElementById("container").appendChild(webView);
    attachContextMenu(webView);
    webView.addEventListener('dom-ready', () => {
        webView.executeJavaScript(`
            function addLinkContextMenuListener(win) {
                win.document.addEventListener('contextmenu', function(e) {
                    let el = e.target;
                    while (el && el !== win.document.body) {
                        if (el.tagName && el.tagName.toLowerCase() === 'a' && el.href) {
                            win.postMessage({ type: 'cascade-link-context', href: el.href }, '*');
                            break;
                        }
                        el = el.parentElement;
                    }
                }, true);
            }
            addLinkContextMenuListener(window);
        `);
        webView.addEventListener("page-title-updated", (e, title, explicitSet) => {
            if (focusedTab == webView) {
                createOrModifyTabButton(webView, uuid);
                document.title = e["title"] + " ⎯ Cascade Browser";
            }
        })
    })
    webView.addEventListener('new-window', (e) => {
        createNewTab(e.url);
    });
    return webView;
}

/*
 * Adds the context menus (selection, page, image) so that they can be used.
*/
var currentContextImage = null;
var currentContextLink = null;
function attachContextMenu(webView, isMenu = false) {
    webView.addEventListener('ipc-message', (event) => {
        if (event.channel === 'cascade-link-context') {
            currentContextLink = event.args[0];
            window.electronAPI.showContextMenu("link", currentContextLink);
        }
    });

    webView.addEventListener('context-menu', async (event) => {
        if (currentContextLink) {
            currentContextLink = null;
            return;
        }

        // image
        const imgSrc = await webView.executeJavaScript(`
            (function() {
                let el = document.elementFromPoint(${event.params.x}, ${event.params.y});
                if (el && el.tagName && el.tagName.toLowerCase() === 'img') return el.src;
                return null;
            })();
        `);

        if (imgSrc) {
            currentContextImage = imgSrc;
            window.electronAPI.showContextMenu("image", imgSrc);
            return;
        }

        const selectedText = await webView.executeJavaScript('window.getSelection().toString()');
        if (selectedText && selectedText.trim().length > 0) {
            window.electronAPI.showContextMenu("selection", selectedText);
        } else {
            window.electronAPI.showContextMenu("page");
        }
    });
}

/*
 * Sets the title of the window.
*/
function setWindowTitle(title) {
    document.title = title + " ⎯ Cascade Browser";
}

function getElementAtPoint(x, y) {
    return document.elementFromPoint(x, y);
}

async function getElementAtWebViewPoint(x, y) {
    const returnPoint = await webView.executeJavaScript(`document.elementFromPoint(${x}, ${y});`);
    if (returnPoint) return returnPoint;
    return null;
}

/*
 * A function to switch tabs.
 * Loops through all of the view boxes, hides them all, then shows the selected tab.
*/
function switchTab(webView) {
    hideAllTabs();
    webView.style.display = "flex";
    focusedTab = webView;
    const webViewStr = webView.id.replace("webview_", "");
    removeActiveTabClass();
    const button = document.querySelector("#viewbutton_" + webViewStr);
    if (button) button.classList.add("current_tab");
    setWindowTitle(webView.getTitle());
    document.getElementById("url-box").value = webView.getURL();
}

/*
 * Loops through all tabs and hides them, then sets the focused tab to null.
*/
function hideAllTabs() {
    const views = document.getElementsByClassName("view-box");
    for (let i = 0; i < views.length; i++) {
        views[i].style.display = "none";
    }
    focusedTab = null;
}

/*
 * This removes any tab from having the "active" effect (light grey).
*/
function removeActiveTabClass() {
    const buttons = document.querySelectorAll(".current_tab")
    buttons.forEach((button) => {
        button.classList.remove("current_tab");
    });
}

/*
 * Refreshes the tab provided.
*/
function refreshTab(currentTab) {
    currentTab.reload();
}

/*
 * Sets the browser tab in the direction you want it to go.
*/
function goDirection(currentTab, direction = "back") {
    if (!currentTab) return;
    if (direction == "back") {
        currentTab.goBack();
    } else if (direction == "forward") {
        currentTab.goForward();
    }
}

/* https://stackoverflow.com/questions/1301512/truncate-a-string-straight-javascript */
function truncateString(str, num) {
    if (str.length > num) {
        return str.slice(0, num) + "...";
    } else {
        return str;
    }
}

/*
 * Modifies the tab button in the tab list, or if one doesn't exist, creates one.
*/
function createOrModifyTabButton(webView, uuid, customTitle) {
    const title = truncateString((customTitle !== undefined ? customTitle : (webView.getTitle() || "Loading...")), 21);
    const foundButton = document.getElementById("viewbutton_" + uuid);
    if (foundButton) {
        removeTextNodes(foundButton);
        foundButton.appendChild(document.createTextNode(title));
    } else {
        const button = document.createElement("button");
        button.classList.add("tab-button");
        if (uuid) button.setAttribute("id", "viewbutton_" + uuid);

        const favicon = document.createElement("img");
        favicon.classList.add("side_button");
        favicon.style = "width: 12px; height: 12px; margin-right: 10px; margin-bottom: -1.75px;";
        button.appendChild(favicon);

        button.appendChild(document.createTextNode(title));

        const closeBtn = document.createElement("img");
        closeBtn.src = "assets/xmark-solid.svg";
        closeBtn.classList.add("tab-close-btn");
        closeBtn.classList.add("svg_side_button");
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeTab(webView);
        });
        button.appendChild(closeBtn);

        button.addEventListener("click", () => {
            switchTab(webView);
        });
        button.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (isTabPinned(uuid)) {
                window.electronAPI.showContextMenu("tab-select-pinned", uuid);
            } else {
                window.electronAPI.showContextMenu("tab-select", uuid);
            }
        });
        document.getElementById("normal-tabs").appendChild(button);
        return button;
    }
}

/*
 * Removes any text objects inside an element.
*/
function removeTextNodes(element) {
    const childNodes = Array.from(element.childNodes);
    for (const node of childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            element.removeChild(node);
        }
    }
}

/*
 * This is where tabs get created, assigned a random UUID to refer to, and does other cool stuff.
*/
function createNewTab(url) {
    hideAllTabs();
    const viewId = crypto.randomUUID(); // sufficient enough, UUID
    const firstView = createWebView((url || "https://google.com"), viewId);
    firstView.setAttribute("id", "webview_" + viewId);

    removeActiveTabClass();

    const button = createOrModifyTabButton(firstView, viewId, "Loading...");
    if (button) {
        button.classList.add("current_tab");
        const favicon = button.querySelector(".side_button");
        favicon.src = ""; // change this later if wanted, for the loading favicon, gif ??
    }

    firstView.addEventListener('dom-ready', () => {
        switchTab(firstView);
        if (!firstView.getURL().startsWith("view-source:")) {
            firstView.style.backgroundColor = "#ffffff";
        } else {
            firstView.style.backgroundColor = "#141414";
        }
        firstView.addEventListener('will-navigate', (e) => {
            if (firstView.id == focusedTab.id) {
                document.getElementById("url-box").value = e.url;
            }
        });
        createOrModifyTabButton(firstView, viewId);
        if (button) {
            const favicon = button.querySelector(".side_button");
            firstView.addEventListener('page-favicon-updated', (e) => {
                if (e.favicons[0] != favicon.src) favicon.src = e.favicons[0];
            });
        }
    })
}

/*
 * Handy function to get the button from a WebView
*/
function getCorrespondingButton(webView) {
    const webViewStr = webView.id.replace("webview_", "");
    return document.querySelector("#viewbutton_" + webViewStr);
}

/*
 * Handy function to get the WebView from a button
*/
function getCorrespondingTab(button) {
    const buttonStr = button.id.replace("viewbutton_", "");
    return document.querySelector("#webview_" + buttonStr);
}

/*
 * Function that handles the redirecting of all URLs except the ones in the frames themselves.
 * What I mean by that is if any part in this script wants the URL to go somewhere, it calls it
 * through this function, but if a page inside a WebView changes the URL, this will not be fired.
*/
function goToURL(webView, url) {
    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("cascade://") ||
        url.startsWith("view-source:") ||
        url.startsWith("blob:")
    ) {
        webView.loadURL(url);
    } else if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(url.trim())) { // tests to check if we should redirect with http/https
        webView.loadURL("https://" + url.trim());
    } else {
        // assume the user is searching
        webView.loadURL("https://www.google.com/search?client=cascade&q=" + encodeURIComponent(url));
    }
}

function getButtonFromTabID(uuid) {
    const tablist = document.getElementById("tablist");
    const tab_buttons = tablist.querySelectorAll(".tab-button");

    for (const item of tab_buttons) {
        const newID = item.id.replace("viewbutton_", "");
        if (newID == uuid) return item;
    }
}

function isTabPinned(uuid) {
    const button = getButtonFromTabID(uuid);
    if (button.parentElement.id == "pinned-tabs") return true;
    return false;
}

function pinTab(button) {
    const pinned_tabs = document.getElementById("pinned-tabs");
    pinned_tabs.appendChild(button);
}

function unpinTab(button) {
    const normal_tabs = document.getElementById("normal-tabs");
    normal_tabs.prepend(button);
}

/*
 * Closes a tab, removes its WebView, then removes its button.
 * Also swaps the tab to the next tab if possible.
*/
function closeTab(webView) {
    if (!webView) return;
    const button = getCorrespondingButton(webView);
    // remove tab logic
    if (webView == focusedTab) {
        focusedTab.remove();
        focusedTab = null;
    }
    if (button.nextElementSibling) {
        switchTab(getCorrespondingTab(button.nextElementSibling));
    } else if (button.previousElementSibling && button.previousElementSibling.id != "new-tab") {
        switchTab(getCorrespondingTab(button.previousElementSibling));
    }
    button.remove();
}

// Event Handlers
document.getElementById("new-tab").addEventListener("click", () => {
    createNewTab();
})

document.getElementById("refresh").addEventListener("click", () => {
    if (focusedTab) refreshTab(focusedTab);
});

document.getElementById("back").addEventListener("click", () => {
    if (focusedTab) goDirection(focusedTab, "back");
});

document.getElementById("forward").addEventListener("click", () => {
    if (focusedTab) goDirection(focusedTab, "forward");
});

document.getElementById("menu").addEventListener("click", () => {
    window.electronAPI.showContextMenu("menu");
});

window.electronAPI.onTargetBlankTabOpen((url) => {
    createNewTab(url);
})

window.addEventListener("beforeunload", () => {
    const views = document.getElementsByClassName("view-box");
    const urls = [];
    for (let i = 0; i < views.length; i++) {
        urls.push(views[i].getURL());
    }
    localStorage.setItem("cascade_tabs", JSON.stringify(urls));
});

document.addEventListener("DOMContentLoaded", () => {
    let restored = false;
    const savedTabs = localStorage.getItem("cascade_tabs");
    if (savedTabs) {
        try {
            const urls = JSON.parse(savedTabs);
            if (Array.isArray(urls) && urls.length > 0) {
                urls.forEach((url, idx) => {
                    createNewTab(url);
                });
                restored = true;
            }
        } catch (e) {} // ignore
    }
    if (!restored) {
        createNewTab();
    }
    document.title = "Cascade Browser";
    const url_box = document.getElementById("url-box");
    if (url_box) {
        url_box.addEventListener("keypress", (e) => {
            if (e["key"] == "Enter") {
                url_box.blur();
                if (focusedTab) {
                    goToURL(focusedTab, url_box.value);
                }
            }
        });
    }
});

window.electronAPI.onPrintCurrentTabRequest(() => {
    if (focusedTab) focusedTab.print();
})

window.electronAPI.onContextMenuResponse(async (data) => {
    const action = data["action"];
    const text = data["text"]
    if (!action) console.error("No action provided");
    if (action == "copy") {
        // nothing needs to be here, this is done in main.js
    } else if (action == "select-all") {
        if (focusedTab) focusedTab.selectAll();
    } else if (action == "search-google") {
        if (focusedTab) createNewTab("https://www.google.com/search?client=cascade&q=" + text);
    } else if (action == "inspect-element") {
        if (focusedTab) focusedTab.openDevTools();
    } else if (action == "print-page") {
        if (focusedTab) focusedTab.print();
    } else if (action == "view-page-source") {
        if (focusedTab) goToURL(focusedTab, "view-source:" + focusedTab.getURL());
    } else if (action == "open-image-in-new-tab") {
        if (focusedTab && currentContextImage) createNewTab(currentContextImage);
    } else if (action == "copy-image-address") {
        if (focusedTab && currentContextImage) window.electronAPI.copyToClipboard(currentContextImage);
    } else if (action == "open-link-in-new-tab") {
        if (focusedTab && currentContextLink) createNewTab(currentContextLink);
    } else if (action == "pin-tab") {
        if (focusedTab) pinTab(getButtonFromTabID(text));
    } else if (action == "unpin-tab") {
        if (focusedTab) unpinTab(getButtonFromTabID(text));
    }
})

window.electronAPI.onTabRefresh((isNoCache) => {
    if (focusedTab) {
        if (isNoCache) {
            focusedTab.reloadIgnoringCache();
        } else {
            focusedTab.reload();
        }
    }
})

window.electronAPI.onTabClose(() => {
    if (focusedTab) closeTab(focusedTab);
})

window.electronAPI.onTabNew(() => {
    createNewTab();
})

window.electronAPI.onOpenTab((url) => {
    createNewTab(url);
});
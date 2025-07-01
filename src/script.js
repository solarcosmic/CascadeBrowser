/* const { v4: uuidv4 } = require('uuid'); */
var listTabs = {};
var focusedTab = null;

function createWebView(url, uuid, preload) {
    const webView = document.createElement("webview");
    webView.classList.add("view-box");
    webView.src = url;
    //if (preload) webView.setAttribute("preload", preload);
    webView.setAttribute("allowpopups", true);
    document.getElementById("container").appendChild(webView);
    attachContextMenu(webView);
    webView.addEventListener('dom-ready', () => {
        webView.addEventListener("page-title-updated", (e, title, explicitSet) => {
            if (focusedTab == webView) {
                createOrModifyTabButton(webView, uuid);
                document.title = e["title"] + " ⎯ Cascade Browser";
            }
        })
    })
    return webView;
}

function attachContextMenu(webView) {
    webView.addEventListener('context-menu', async (event) => {
        const selectedText = await webView.executeJavaScript('window.getSelection().toString()');
        if (selectedText && selectedText.trim().length > 0) {
            console.log(selectedText);
            // Show your custom context menu here, e.g.:
            window.electronAPI.showContextMenu("selection", selectedText);
        } else if (!selectedText) {
            window.electronAPI.showContextMenu("page");
        }
    });
}

function setWindowTitle(title) {
    document.title = title + " ⎯ Cascade Browser";
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

function hideAllTabs() {
    const views = document.getElementsByClassName("view-box");
    for (let i = 0; i < views.length; i++) {
        views[i].style.display = "none";
    }
    focusedTab = null;
}

function removeActiveTabClass() {
    const buttons = document.querySelectorAll(".current_tab")
    buttons.forEach((button) => {
        button.classList.remove("current_tab");
    });
}

function refreshTab(currentTab) {
    currentTab.reload();
}

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

function createOrModifyTabButton(webView, uuid) {
    const title = truncateString((webView.getTitle() || "Webpage"), 24);
    const foundButton = document.getElementById("viewbutton_" + uuid);
    if (foundButton) {
        removeTextNodes(foundButton);
        foundButton.appendChild(document.createTextNode(title));
    } else {
        const button = document.createElement("button");
        if (uuid) button.setAttribute("id", "viewbutton_" + uuid);
        const favicon = document.createElement("img");
        favicon.classList.add("side_button");
        favicon.style = "width: 12px; height: 12px; margin-right: 10px; margin-bottom: -1.75px;";
        button.appendChild(favicon);
        button.appendChild(document.createTextNode(title));
        button.addEventListener("click", () => {
            switchTab(webView);
        });
        document.getElementById("tablist").appendChild(button);
        return button;
    }
}

function removeTextNodes(element) {
    const childNodes = Array.from(element.childNodes);
    for (const node of childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            element.removeChild(node);
        }
    }
}

function createNewTab(url) {
    //const viewId = uuidv4();
    hideAllTabs();
    const viewId = crypto.randomUUID();
    const firstView = createWebView((url || "https://google.com"), viewId, "preload-webview.js");
    firstView.setAttribute("id", "webview_" + viewId);

    firstView.addEventListener('dom-ready', () => {
        switchTab(firstView);
        firstView.addEventListener('will-navigate', (e) => {
            if (firstView.id == focusedTab.id) {
                document.getElementById("url-box").value = e.url;
            }
        });
        const button = createOrModifyTabButton(firstView, viewId);
        if (button) {
            const favicon = button.querySelector(".side_button");
            firstView.addEventListener('page-favicon-updated', (e) => {
                if (e.favicons[0] != favicon.src) favicon.src = e.favicons[0]; // prevent spam
            });
        }
    })
}

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

window.electronAPI.onTargetBlankTabOpen((url) => {
    createNewTab(url);
})

document.addEventListener("DOMContentLoaded", () => {
    createNewTab();
    document.title = "Cascade Browser";
    const url_box = document.getElementById("url-box");
    if (url_box) {
        url_box.addEventListener("keypress", (e) => {
            if (e["key"] == "Enter") {
                url_box.blur();
                if (focusedTab) focusedTab.loadURL(url_box.value);
            }
        });
    }
});

window.electronAPI.onPrintCurrentTabRequest(() => {
    if (focusedTab) focusedTab.print();
})

window.electronAPI.onContextMenuResponse((data) => {
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
    }
})

window.electronAPI.onTabRefresh((isCache) => {
    console.log(isCache);
    if (focusedTab) focusedTab.print();
})
/* const { v4: uuidv4 } = require('uuid'); */
var listTabs = {};
var focusedTab = null;

function createWebView(url, uuid) {
    const webView = document.createElement("webview");
    webView.classList.add("view-box");
    webView.src = url;
    webView.setAttribute("allowpopups", true);
    document.getElementById("container").appendChild(webView);
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

/*
 * A function to switch tabs.
 * Loops through all of the view boxes, hides them all, then shows the selected tab.
*/
function switchTab(webView) {
    hideAllTabs();
    webView.style.display = "flex";
    focusedTab = webView;
}

function hideAllTabs() {
    const views = document.getElementsByClassName("view-box");
    for (let i = 0; i < views.length; i++) {
        views[i].style.display = "none";
    }
    focusedTab = null;
}

function refreshTab(currentTab) {
    currentTab.reload();
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
    const title = truncateString((webView.getTitle() || "Webpage"), 27);
    const foundButton = document.getElementById("viewbutton_" + uuid);
    if (foundButton) {
        foundButton.textContent = title;
    } else {
        const button = document.createElement("button");
        if (uuid) button.setAttribute("id", "viewbutton_" + uuid);
        button.textContent = title;
        button.addEventListener("click", () => {
            switchTab(webView);
        });
        document.getElementById("tablist").appendChild(button);
    }
}

function createNewTab(url) {
    //const viewId = uuidv4();
    hideAllTabs();
    const viewId = crypto.randomUUID();
    const firstView = createWebView((url || "https://google.com"), viewId);
    firstView.setAttribute("id", "webview_" + viewId);

    firstView.addEventListener('dom-ready', () => {
        createOrModifyTabButton(firstView, viewId);
        switchTab(firstView);
        firstView.addEventListener('new-window', (e) => {
            const url = e.url;
            console.log(url);
        })
    })
}

document.getElementById("new-tab").addEventListener("click", () => {
    createNewTab();
})

document.getElementById("refresh").addEventListener("click", () => {
    if (focusedTab) refreshTab(focusedTab);
});

window.electronAPI.onTargetBlankTabOpen((url) => {
    createNewTab(url);
})

document.addEventListener("DOMContentLoaded", () => {
    createNewTab();
    document.title = "Cascade Browser";
});

window.electronAPI.onPrintCurrentTabRequest(() => {
    if (focusedTab) focusedTab.print();
})
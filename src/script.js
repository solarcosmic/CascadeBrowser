var listTabs = {};
var focusedTab = null;

function createWebView(url) {
    const webView = document.createElement("webview");
    webView.src = url;
    document.getElementById("sidebar").appendChild(webView);
    webview.addEventListener('dom-ready', () => {
        webview.addEventListener("page-title-updated", (e, title, explicitSet) => {
            if (focusedTab == webView) {
                document.title = e["title"] + " ⎯ Cascade Browser";
            }
        })
    })
    return webView;
}

function switchTab(webView) {
    const views = document.querySelectorAll("webview");
    for (const item in views) {
        views.style.display = "none";
    }
    webView.style.display = "initial";
    focusedTab = webView;
}

const firstView = createWebView("https://google.com");
document.getElementById("new-tab").addEventListener("click", () => {
    // new tab logic
})
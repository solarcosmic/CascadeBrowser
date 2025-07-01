const { contextBridge, ipcRenderer } = require('electron/renderer')
ipcRenderer.on('open-tab', (event, url) => {
    window.dispatchEvent(new CustomEvent('open-tab', { detail: url }));
});

contextBridge.exposeInMainWorld('electronAPI', {
  onTargetBlankTabOpen: (callback) => ipcRenderer.on('targetblank-open', (_event, url) => callback(url)),
  onPrintCurrentTabRequest: (callback) => ipcRenderer.on('print-current-tab', (_event, url) => callback(url)),
  showContextMenu: (type, selection) => ipcRenderer.send('show-context-menu', type, selection),
  onContextMenuResponse: (callback) => ipcRenderer.on('context-menu-action', (_event, action) => callback(action)),
  onTabRefresh: (callback) => ipcRenderer.on('refresh-tab', (_event, withCache) => callback(withCache)),
  onTabClose: (callback) => ipcRenderer.on('close-tab', (_event) => callback()),
  onTabNew: (callback) => ipcRenderer.on('new-tab', (_event) => callback()),
  copyToClipboard: (item) => ipcRenderer.send('copy-to-clipboard', item),
  openTab: (url) => ipcRenderer.send('open-tab', url),
  onOpenTab: (callback) => {
    window.addEventListener('open-tab', (e) => callback(e.detail));
  }
});
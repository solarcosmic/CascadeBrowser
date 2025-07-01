const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  onTargetBlankTabOpen: (callback) => ipcRenderer.on('targetblank-open', (_event, url) => callback(url)),
  onPrintCurrentTabRequest: (callback) => ipcRenderer.on('print-current-tab', (_event, url) => callback(url)),
})
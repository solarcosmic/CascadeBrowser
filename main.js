const { app, BrowserWindow, shell, ipcMain, globalShortcut } = require('electron/main')
const path = require('node:path')

function createWindow () {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    //titleBarStyle: 'hidden',
    //frame: false,
    backgroundColor: "#fff",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      nativeWindowOpen: true,
      devTools: true,
      contextIsolation: true,
      webviewTag: true,
      autoHideMenuBar: true,
      nativeWindowOpen: true
    },
  })

  win.setMenu(null);
  win.loadFile('src/index.html')
  win.webContents.openDevTools();

  /* https://github.com/electron/electron/issues/40613 */
  app.on('web-contents-created', (e, contents) => {
    if (contents.getType() == 'webview') {
      contents.setWindowOpenHandler((details) => {
        win.webContents.send('targetblank-open', details.url);
      })
    }
  });
  globalShortcut.register("CmdOrCtrl+P", () => {
    win.isFocused() && win.webContents.send('print-current-tab');
  });
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
const { app, BrowserWindow, shell, ipcMain, globalShortcut, Menu, clipboard } = require('electron/main')
const path = require('node:path')

const menu = Menu.buildFromTemplate([
  { label: 'Copy' },
  { label: 'Select All' },
  { label: 'Print Selection'},
  { label: 'Search Google for this selection'},
  { label: 'Inspect Element'},
]);

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
      nativeWindowOpen: true,
    },
    frame: true
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
  globalShortcut.register("CmdOrCtrl+R", () => {
    win.isFocused() && win.webContents.send('refresh-tab', false);
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

/* https://stackoverflow.com/questions/1301512/truncate-a-string-straight-javascript */
function truncateString(str, num) {
    if (str.length > num) {
        return str.slice(0, num) + "...";
    } else {
        return str;
    }
}

ipcMain.on('show-context-menu', (event, type, text) => {
  if (type == "selection") {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Copy',
        click: () => {
          clipboard.writeText(text);
          event.sender.send('context-menu-action', { action: 'copy', text });
        }
      },
      {
        label: 'Select All',
        click: () => {
          event.sender.send('context-menu-action', { action: 'select-all' });
        }
      },
      {
        label: 'Search Google for "' + truncateString(text, 25) + '"',
        click: () => {
          event.sender.send('context-menu-action', { action: 'search-google', text });
        }
      },
      {
        label: 'Inspect Element (Entire Page)',
        click: () => {
          event.sender.send('context-menu-action', { action: 'inspect-element' });
        }
      },
    ]);
    menu.popup();
  }
});
/*
 * Copyright (c) 2025 solarcosmic.
 * This project is licensed under the MIT license.
 * To view the license, see <https://opensource.org/licenses/MIT>.
*/
const { app, components, BrowserWindow, shell, ipcMain, globalShortcut, Menu, clipboard } = require("electron/main");
const path = require("node:path");

var about = null;
function createWindow() {
  console.log("Welcome to Cascade version v" + app.getVersion() + "!");
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
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
  console.log("Main window created.");

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
  globalShortcut.register("CmdOrCtrl+W", () => {
    win.isFocused() && win.webContents.send('close-tab');
  });
  globalShortcut.register("CmdOrCtrl+T", () => {
    win.isFocused() && win.webContents.send('new-tab');
  });
  globalShortcut.register("CmdOrCtrl+Shift+R", () => {
    win.isFocused() && win.webContents.send('refresh-tab', true);
  });
  ipcMain.on('open-tab', (event, url) => {
    win.webContents.send('open-tab', url);
  });
  win.on("closed", () => {
    if (about) about.close();
  })
}

app.whenReady().then(async () => {
  await components.whenReady();
    console.log('components ready:', components.status());
  ipcMain.handle('about:getVersions', retrieveAppVersions)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

function retrieveAppVersions() {
  return {
    "electron": process.versions.electron,
    "chrome": process.versions.chrome,
    "os": process.getSystemVersion(),
    "app": app.getVersion()
  };
}

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

ipcMain.on("copy-to-clipboard", (event, item) => {
  clipboard.writeText(item);
});

ipcMain.on("show-context-menu", (event, type, text) => {
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
  } else if (type == "page") {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Print Page',
        click: () => {
          event.sender.send('context-menu-action', { action: 'print-page', text });
        }
      },
      {
        label: 'Select All',
        click: () => {
          event.sender.send('context-menu-action', { action: 'select-all' });
        }
      },
      {
        type: "separator"
      },
      {
        label: 'Page Source',
        click: () => {
          event.sender.send('context-menu-action', { action: 'view-page-source' });
        }
      },
      {
        label: 'Inspect Element',
        click: () => {
          event.sender.send('context-menu-action', { action: 'inspect-element' });
        }
      },
    ]);
    menu.popup();
  } else if (type == "image") {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Open Image in New Tab',
        click: () => {
          event.sender.send('context-menu-action', { action: 'open-image-in-new-tab', text });
        }
      },
      {
        label: 'Copy Image Address',
        click: () => {
          event.sender.send('context-menu-action', { action: 'copy-image-address' });
        }
      },
      {
        type: "separator"
      },
      {
        label: 'Inspect Element (Entire Page)',
        click: () => {
          event.sender.send('context-menu-action', { action: 'inspect-element' });
        }
      },
    ]);
    menu.popup();
  } else if (type == "menu") {
    const menu = Menu.buildFromTemplate([
      {
        label: 'About Cascade',
        click: () => {
          about = new BrowserWindow({
            width: 324,
            height: 550,
            backgroundColor: "#fff",
            webPreferences: {
              preload: path.join(__dirname, 'preload.js')
            },
            frame: true,
            resizable: false
          })

          about.setMenu(null);
          about.loadFile('src/about.html')

          about.on('closed', () => {
            about = null;
          });
        }
      }
    ]);
    menu.popup();
  } else if (type == "link") {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Open Link in New Tab',
        click: () => {
          event.sender.send('context-menu-action', { action: 'open-link-in-new-tab', text });
        }
      },
      {
        label: 'Copy Link',
        click: () => {
          clipboard.writeText(text);
        }
      },
      {
        label: 'Search Google for "' + truncateString(text, 25) + '"',
        click: () => {
          event.sender.send('context-menu-action', { action: 'search-google', text });
        }
      },
      {
        type: "separator"
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
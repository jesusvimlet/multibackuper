const {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    Tray,
    dialog
} = require('electron');
const path = require('path');
const url = require('url');
const globalShortcut = require('electron').globalShortcut;
const nativeImage = require('electron').nativeImage;
const store = require('./lib/store.js').instance();
var shell = require('electron').shell;

// Restart on js changes
// require('electron-reload')(__dirname, {
//     electron: require(`${__dirname}/node_modules/electron`)
// });


let win;
let tray = null;


function reload() {
    win.reload();
}

ipcMain.on('asynchronous-message', (event, arg) => {
    if (arg === "reload") {
        reload();
    } else if (arg === "exit") {
        process.exit();
    } else if (arg === "minimize") {
        win.minimize();
    } else if (arg === "hide") {
        win.hide();
    } else if (arg === "maximize") {
        if (win.isMaximized()) {
            win.restore();
        } else {
            win.maximize();
        }
    }
});


ipcMain.on('set-tray', (event, arg) => {   
    updateTray(arg);
});

function createWindow() {
    var savedSize = store.get('windowBounds') || {
        width: 800,
        height: 600
    };

    // Create the browser window.
    win = new BrowserWindow({
        width: savedSize.width,
        height: savedSize.height,
        frame: false
    });


    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'webapp/index.html'),
        protocol: 'file:',
        slashes: true
    }));



    // globalShortcut.register('f5', function () { // TODO f5 to refresh html content
    //     // win.reload();
    //     reload();
    // });
    // // Open the DevTools.
    // win.webContents.openDevTools(); //TODO Open inspector



    // Emitted when the window is closed.
    win.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });


    win.on('resize', () => {
        // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
        // the height, width, and x and y coordinates.
        let {
            width,
            height
        } = win.getBounds();
        // Now that we have them, save them using the `set` method.
        store.set('windowBounds', {
            width,
            height
        });
    });

    win.webContents.on('new-window', function (event, url) {
        event.preventDefault();
        shell.openExternal(url);
    });


    // Tray
    setTray("-");
}

function setTray(trayLog){
    const iconPath = path.join(__dirname, 'icon.ico');
    const trayIcon = nativeImage.createFromPath(iconPath);
    tray = new Tray(trayIcon);
    var contextMenu = Menu.buildFromTemplate([{
            label: "Run all",
            click() {
                win.webContents.executeJavaScript('document.querySelector("backup-er").runAll();')
            }
        }, {
            label: "Watch all",
            click() {
                win.webContents.executeJavaScript('document.querySelector("backup-er").watchAll();')
            }
        }, {
            label: "Stop watching all",
            click() {
                win.webContents.executeJavaScript('document.querySelector("backup-er").stopWatchAll();')
            }
        },
        {
            type: 'separator'
        }, {
            label: 'Exit',
            role: "quit"
        }
    ]);
    tray.setToolTip('Multi-Backup');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        win.isVisible() ? win.hide() : win.show()
    });
}
function updateTray(trayLog){
    var contextMenu = Menu.buildFromTemplate([{
            label: trayLog
        }, {
            type: 'separator'
        }, {
            label: "Run all",
            click() {
                win.webContents.executeJavaScript('document.querySelector("backup-er").runAll();')
            }
        }, {
            label: "Watch all",
            click() {
                win.webContents.executeJavaScript('document.querySelector("backup-er").watchAll();')
            }
        }, {
            label: "Stop watching all",
            click() {
                win.webContents.executeJavaScript('document.querySelector("backup-er").stopWatchAll();')
            }
        },
        {
            type: 'separator'
        }, {
            label: 'Exit',
            role: "quit"
        }
    ]);
    tray.setContextMenu(contextMenu);    
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

var settings = store.get('settings') || {
    "openAtLogin": false,
    "openAsHidden ": false
};

app.setLoginItemSettings(settings);
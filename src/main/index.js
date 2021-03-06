import { app, BrowserWindow } from 'electron'
import electron from 'electron'
import config from '../config/config'
import { writeWindowInfo, getWindowInfo } from '../config/handler-window-config'

const winSize = getWindowInfo()
let currentDeviceWidth = 0
let currentDeviceHeight = 0

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

function createWindow () {
    /**
     * Initial window options
     */
    let workAreaSize = electron.screen.getPrimaryDisplay().workAreaSize
    let winWidth = currentDeviceWidth = workAreaSize.width
    let winHeight = currentDeviceHeight = workAreaSize.height + 40
    let minWidth =  winWidth * config['ratioWidth']
    let minHeight =  winHeight * config['ratioHeight']

    if (winSize.width && winSize.height && winSize.currentDeviceWidth === winWidth) { // 默认使用配置文件中宽高
        winWidth = winSize.width
        winHeight = winSize.height
    } else {
        if (winWidth === config['deviceWidth']) { // 1080p
            winWidth = config['windowWidth']
            winHeight = config['windowHeight']
        } else { // 更高清屏幕或者低分辨
            winHeight = winHeight * config['ratioHeight']
            winWidth = (config['defaultWindowWidth'] * winHeight) / config['defaultWindowHeight']
        }
    }

    mainWindow = new BrowserWindow({
        minWidth: parseInt(minWidth),
        minHeight: parseInt(minHeight),
        width: parseInt(winWidth),
        height: parseInt(winHeight),
        frame: false,
        webPreferences: {
            webSecurity: false
        },
        backgroundColor: '#1B2226',
        show: false
    })

    mainWindow.loadURL(winURL)

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    // 资源加载完成时显示
    mainWindow.on('ready-to-show', function() {
        mainWindow.show()
        mainWindow.focus()
    })

    if (config['isOpenDevTools']) {
        mainWindow.webContents.openDevTools() // 打开调试工具
    }
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})

const ipc = electron.ipcMain
//最小化
ipc.on('window-min', () => {
    mainWindow.minimize()
})
//最大化
ipc.on('window-max', () => {
    if(mainWindow.isMaximized()) {
          mainWindow.restore()
    }else{
          mainWindow.maximize()
    }
})
// 关闭
ipc.on('window-close', () => {
    mainWindow.close()
})

// 存储window窗口大小
ipc.on('save-window-size', () => {
    let winSize = mainWindow.getSize()
    writeWindowInfo(JSON.stringify({
        width: winSize[0],
        height: winSize[1],
        currentDeviceWidth,
        currentDeviceHeight
    }, null, 4))
})


/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
})

app.on('ready', () => {
    if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

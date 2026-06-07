// If ELECTRON_RUN_AS_NODE=1 is present in the environment, Electron runs as
// plain Node.js and require('electron') never returns the real API.
// Detect it early and re-spawn ourselves without that variable.
if (process.env.ELECTRON_RUN_AS_NODE) {
  const { spawn } = require('child_process')
  const env = Object.assign({}, process.env)
  delete env.ELECTRON_RUN_AS_NODE
  spawn(process.execPath, process.argv.slice(1), { stdio: 'inherit', env, windowsHide: false })
    .on('close', (code) => process.exit(code || 0))
  return
}

const { app, BrowserWindow, ipcMain, Notification, nativeImage, shell } = require('electron')
const path = require('path')

const isDev = process.env.NODE_ENV === 'development'

let win
let appIcon

function getIcon() {
  const iconFile = 'pwa-192.png'
  const p = isDev
    ? path.join(__dirname, '..', 'public', iconFile)
    : path.join(__dirname, '..', 'dist', iconFile)
  return nativeImage.createFromPath(p)
}

function createWindow() {
  appIcon = getIcon()

  win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'PSG Mail',
    icon: appIcon,
    backgroundColor: '#ffffff',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Remove default menu bar
  win.setMenuBarVisibility(false)

  if (isDev) {
    win.loadURL('http://localhost:3001')
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  win.once('ready-to-show', () => win.show())

  // Open external links in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ── Native notifications ─────────────────────────────────────
ipcMain.on('notify', (_event, { title, body }) => {
  if (!Notification.isSupported()) return
  const n = new Notification({
    title: title || 'PSG Mail',
    body: body || '',
    icon: appIcon,
    silent: false,
  })
  n.on('click', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
  n.show()
})

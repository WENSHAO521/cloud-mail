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

const { app, BrowserWindow, ipcMain, Notification, nativeImage, shell, Menu } = require('electron')
const path = require('path')

const isDev  = process.env.NODE_ENV === 'development'
const isMac  = process.platform === 'darwin'
const isWin  = process.platform === 'win32'

let win
let appIcon

// ── Icon ─────────────────────────────────────────────────────
function getIcon() {
  if (isMac) {
    // macOS: prefer .icns; fall back to PNG (electron-builder handles ICNS at build time)
    const icnsPath = isDev
      ? path.join(__dirname, '..', 'build', 'icon.icns')
      : path.join(process.resourcesPath, 'build', 'icon.icns')
    const pngPath = isDev
      ? path.join(__dirname, '..', 'public', 'pwa-512.png')
      : path.join(__dirname, '..', 'dist', 'pwa-512.png')
    const img = nativeImage.createFromPath(icnsPath)
    return img.isEmpty() ? nativeImage.createFromPath(pngPath) : img
  }
  const iconFile = 'pwa-192.png'
  const p = isDev
    ? path.join(__dirname, '..', 'public', iconFile)
    : path.join(__dirname, '..', 'dist', iconFile)
  return nativeImage.createFromPath(p)
}

// ── macOS Application Menu ────────────────────────────────────
function buildMacMenu() {
  const template = [
    {
      label: app.name,           // "PSG Mail" (first menu = app name on macOS)
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Message',
          accelerator: 'CmdOrCtrl+N',
          click: () => win?.webContents.executeJavaScript("document.dispatchEvent(new KeyboardEvent('keydown',{key:'c',bubbles:true}))"),
        },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' },
          ],
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'PSG Mail Help',
          click: () => shell.openExternal('https://panorama-sg.com'),
        },
      ],
    },
  ]
  return Menu.buildFromTemplate(template)
}

// ── Window ────────────────────────────────────────────────────
function createWindow() {
  appIcon = getIcon()

  const macWindowOptions = isMac ? {
    titleBarStyle: 'hiddenInset',        // keeps native traffic-light buttons
    trafficLightPosition: { x: 14, y: 18 },
    vibrancy: 'under-window',            // frosted-glass effect (macOS 10.10+)
    visualEffectState: 'active',
  } : {}

  win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'PSG Mail',
    icon: appIcon,
    backgroundColor: '#ffffff',
    show: false,
    ...macWindowOptions,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Windows: hide default menu bar; macOS: use native app menu
  if (!isMac) {
    win.setMenuBarVisibility(false)
  } else {
    Menu.setApplicationMenu(buildMacMenu())
  }

  if (isDev) {
    win.loadURL('http://localhost:3001')
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  win.once('ready-to-show', () => {
    win.show()
    // macOS: set initial dock icon (no badge at start)
    if (isMac && app.dock) app.dock.setIcon(appIcon)
  })

  // Open external links in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.on('closed', () => { win = null })
}

// ── App lifecycle ─────────────────────────────────────────────
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  // macOS convention: keep app running after last window closes
  if (!isMac) app.quit()
})

app.on('activate', () => {
  // macOS: re-create window when dock icon is clicked with no windows open
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ── IPC: Native notifications ─────────────────────────────────
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
      if (isMac) app.focus()
      win.focus()
    }
  })
  n.show()
})

// ── IPC: Dock badge (macOS only) ──────────────────────────────
ipcMain.on('set-badge', (_event, count) => {
  if (isMac && app.dock) {
    app.dock.setBadge(count > 0 ? String(count) : '')
  }
  // Windows taskbar overlay badge
  if (isWin && win) {
    if (count > 0) {
      const badge = nativeImage.createEmpty()
      // Create a simple red circle badge programmatically
      win.setOverlayIcon(null, '')
      // Use a canvas-drawn badge via renderer, or skip for simplicity
    } else {
      win.setOverlayIcon(null, '')
    }
  }
})

// ── IPC: Window controls (for custom titlebar if needed) ──────
ipcMain.on('window-minimize', () => win?.minimize())
ipcMain.on('window-maximize', () => win?.isMaximized() ? win.unmaximize() : win.maximize())
ipcMain.on('window-close',    () => win?.close())

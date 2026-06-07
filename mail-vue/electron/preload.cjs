const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Notifications
  sendNotification: (title, body) => {
    ipcRenderer.send('notify', { title, body })
  },

  // Dock badge (macOS) / taskbar overlay badge (Windows)
  setBadgeCount: (count) => {
    ipcRenderer.send('set-badge', count)
  },

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close:    () => ipcRenderer.send('window-close'),

  // Platform info
  platform: process.platform,
  isMac: process.platform === 'darwin',
  isWin: process.platform === 'win32',
})

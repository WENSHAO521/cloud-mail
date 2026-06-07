const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Notifications
  sendNotification: (title, body) => {
    ipcRenderer.send('notify', { title, body })
  },

  // Dock badge (macOS) / taskbar badge (Windows)
  setBadgeCount: (count) => {
    ipcRenderer.send('set-badge', count)
  },

  // Platform info
  platform: process.platform,
  isMac: process.platform === 'darwin',
  isWin: process.platform === 'win32',
})

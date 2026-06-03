import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    items: [],               // { emailId, name, subject, time, read }
    permission: typeof Notification !== 'undefined'
      ? Notification.permission
      : 'denied',
  }),
  getters: {
    unreadCount: (state) => state.items.filter(n => !n.read).length,
  },
  actions: {
    push(email) {
      if (this.items.some(n => n.emailId === email.emailId)) return
      this.items.unshift({
        emailId: email.emailId,
        name: email.name || email.sendEmail || '',
        subject: email.subject || '',
        time: Date.now(),
        read: false,
      })
      if (this.items.length > 100) this.items.length = 100
    },
    markAllRead() {
      this.items.forEach(n => { n.read = true })
    },
    clear() {
      this.items = []
    },
    async requestPermission() {
      if (!('Notification' in window)) return
      const result = await Notification.requestPermission()
      this.permission = result
    },
  },
})

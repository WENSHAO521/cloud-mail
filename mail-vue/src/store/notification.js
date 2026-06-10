import { defineStore } from 'pinia'
import { requestNotificationPermission, showMailNotification } from '@/utils/notification-service.js'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    items: [],               // { emailId, name, subject, time, read }
    permission: typeof window !== 'undefined' && typeof Notification !== 'undefined'
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
      return true
    },
    async notifyEmail(email) {
      const added = this.push(email)
      if (!added) return false
      await showMailNotification(email)
      return true
    },
    markAllRead() {
      this.items.forEach(n => { n.read = true })
    },
    clear() {
      this.items = []
    },
    async requestPermission() {
      const result = await requestNotificationPermission()
      this.permission = result
      return result
    },
  },
})

import { defineStore } from 'pinia'
import { getAvatarByEmail } from '@/request/my.js'

export const useAvatarCacheStore = defineStore('avatarCache', {
    state: () => ({
        // email → base64 string | null (null = fetch in-flight)
        cache: {}
    }),
    actions: {
        // Trigger a server fetch if not already cached/loading.
        // Returns immediately; when fetch completes the reactive cache
        // entry updates and any component using get() re-renders.
        prefetch(email) {
            if (!email || email in this.cache) return
            this.cache[email] = null   // mark in-flight
            getAvatarByEmail(email)
                .then(res => { this.cache[email] = res?.avatar || '' })
                .catch(() => { this.cache[email] = '' })
        },
        // Synchronous read + side-effect fetch. Use in templates.
        get(email) {
            this.prefetch(email)
            return this.cache[email] || ''
        }
    }
})

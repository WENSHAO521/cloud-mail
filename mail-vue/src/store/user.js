import { defineStore } from 'pinia'
import { loginUserInfo, updateSignature, saveAvatar as apiSaveAvatar, clearAvatar as apiClearAvatar } from '@/request/my.js'

export const useUserStore = defineStore('user', {
    state: () => ({
        user: {},
        refreshList: 0,
        avatar: '',
    }),
    actions: {
        refreshUserList() {
            loginUserInfo().then(() => { this.refreshList++ })
        },
        refreshUserInfo() {
            loginUserInfo().then(user => {
                this.user = user
                this.avatar = user.avatar || localStorage.getItem(`psg_avatar_${user.email}`) || ''
            })
        },
        loadAvatar() {
            const avatar = this.user?.avatar
            if (avatar) {
                this.avatar = avatar
            } else {
                // fallback: legacy localStorage key
                const email = this.user?.email
                this.avatar = email ? (localStorage.getItem(`psg_avatar_${email}`) || '') : ''
            }
        },
        async saveAvatar(base64) {
            this.avatar = base64
            // Persist to server (cross-device)
            await apiSaveAvatar(base64)
            // Also keep localStorage as instant-load cache
            const email = this.user?.email
            if (email) localStorage.setItem(`psg_avatar_${email}`, base64)
        },
        async clearAvatar() {
            this.avatar = ''
            await apiClearAvatar()
            const email = this.user?.email
            if (email) localStorage.removeItem(`psg_avatar_${email}`)
        },
        async saveSignature(signature) {
            await updateSignature(signature)
            this.user.signature = signature
        }
    }
})

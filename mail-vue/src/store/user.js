import { defineStore } from 'pinia'
import {loginUserInfo, updateSignature} from "@/request/my.js";

export const useUserStore = defineStore('user', {
    state: () => ({
        user: {},
        refreshList: 0,
        avatar: '',
        ownEmails: new Set()   // all bound account emails for this user
    }),
    actions: {
        refreshUserList() {
            loginUserInfo().then(user => {
                this.refreshList ++
            })
        },
        refreshUserInfo() {
            loginUserInfo().then(user => {
                this.user = user
                this.loadAvatar()
            })
        },
        loadAvatar() {
            const email = this.user?.email
            if (!email) return
            this.avatar = localStorage.getItem(`psg_avatar_${email}`) || ''
            // Restore persisted own-email set (populated after first compose open)
            try {
                const extras = JSON.parse(localStorage.getItem('psg_own_emails') || '[]')
                this.ownEmails = new Set([email, ...extras])
            } catch {
                this.ownEmails = new Set([email])
            }
        },
        saveAvatar(base64) {
            this.avatar = base64
            // Write avatar under every bound account email so storedAvatar() finds it anywhere
            for (const e of this.ownEmails) {
                if (e) localStorage.setItem(`psg_avatar_${e}`, base64)
            }
        },
        clearAvatar() {
            this.avatar = ''
            for (const e of this.ownEmails) {
                if (e) localStorage.removeItem(`psg_avatar_${e}`)
            }
        },
        // Called after account list loads — registers all bound emails and back-fills avatar
        registerOwnEmails(emails) {
            const primary = this.user?.email
            const all = primary ? [primary, ...emails] : [...emails]
            this.ownEmails = new Set(all)
            localStorage.setItem('psg_own_emails', JSON.stringify(emails))
            // If user already has an avatar, sync it to any newly discovered account emails
            if (this.avatar) {
                for (const e of all) {
                    if (e && !localStorage.getItem(`psg_avatar_${e}`)) {
                        localStorage.setItem(`psg_avatar_${e}`, this.avatar)
                    }
                }
            }
        },
        async saveSignature(signature) {
            await updateSignature(signature)
            this.user.signature = signature
        }
    }
})

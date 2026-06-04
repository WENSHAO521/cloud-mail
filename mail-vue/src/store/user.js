import { defineStore } from 'pinia'
import {loginUserInfo, updateSignature} from "@/request/my.js";

export const useUserStore = defineStore('user', {
    state: () => ({
        user: {},
        refreshList: 0,
        avatar: '',
        ownEmails: []   // all bound account emails — plain Array for reliable Vue reactivity
    }),
    actions: {
        refreshUserList() {
            loginUserInfo().then(() => { this.refreshList++ })
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
            try {
                const extras = JSON.parse(localStorage.getItem('psg_own_emails') || '[]')
                const all = [email, ...extras.filter(e => e && e !== email)]
                this.ownEmails = all
            } catch {
                this.ownEmails = [email]
            }
        },
        saveAvatar(base64) {
            this.avatar = base64
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
        registerOwnEmails(emails) {
            const primary = this.user?.email
            const deduped = [...new Set([...(primary ? [primary] : []), ...emails.filter(Boolean)])]
            this.ownEmails = deduped
            localStorage.setItem('psg_own_emails', JSON.stringify(emails.filter(Boolean)))
            // Back-fill avatar to any newly discovered account email keys
            if (this.avatar) {
                for (const e of deduped) {
                    if (!localStorage.getItem(`psg_avatar_${e}`)) {
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

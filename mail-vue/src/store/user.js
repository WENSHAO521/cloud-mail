import { defineStore } from 'pinia'
import {loginUserInfo, updateSignature} from "@/request/my.js";

export const useUserStore = defineStore('user', {
    state: () => ({
        user: {},
        refreshList: 0,
        avatar: '',
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
            if (email) {
                this.avatar = localStorage.getItem(`psg_avatar_${email}`) || ''
            }
        },
        saveAvatar(base64) {
            const email = this.user?.email
            if (email) {
                localStorage.setItem(`psg_avatar_${email}`, base64)
                this.avatar = base64
            }
        },
        clearAvatar() {
            const email = this.user?.email
            if (email) {
                localStorage.removeItem(`psg_avatar_${email}`)
                this.avatar = ''
            }
        },
        async saveSignature(signature) {
            await updateSignature(signature)
            this.user.signature = signature
        }
    }
})

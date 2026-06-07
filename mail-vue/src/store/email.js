import { defineStore } from 'pinia'

export const useEmailStore = defineStore('email', {
    state: () => ({
        deleteIds: null,
        starScroll: null,
        emailScroll: null,
        cancelStarEmailId: 0,
        addStarEmailId: 0,
        inboxUnreadCount: 0,
        contentData: {
            email: null,
            delType: null,
            showStar: true,
            showReply: true,
            showUnread: false,
            emailIndex: 0,
            emailTotal: 0,
        },
        sendScroll: null,
    }),
    persist: {
        pick: ['contentData'],
    },
})

import { defineStore } from 'pinia'

export const useRulesStore = defineStore('rules', {
    state: () => ({
        rules: [],
    }),
    getters: {
        enabledRules: (s) => s.rules.filter(r => r.enabled),
    },
    actions: {
        applyRules(email, { starAdd, archiveEmail, emailRead }) {
            for (const rule of this.enabledRules) {
                let match = false
                if (rule.conditionType === 'all') {
                    match = true
                } else if (rule.conditionType === 'sender') {
                    match = (email.sendEmail || '').toLowerCase().includes(rule.conditionValue.toLowerCase()) ||
                            (email.name || '').toLowerCase().includes(rule.conditionValue.toLowerCase())
                } else if (rule.conditionType === 'subject') {
                    match = (email.subject || '').toLowerCase().includes(rule.conditionValue.toLowerCase())
                }
                if (!match) continue
                if (rule.action === 'star' && starAdd)        starAdd(email.emailId).catch(() => {})
                if (rule.action === 'archive' && archiveEmail) archiveEmail(email.emailId)
                if (rule.action === 'markRead' && emailRead)   emailRead([email.emailId]).catch(() => {})
            }
        },
    },
    persist: true,
})

    import { defineStore } from 'pinia'

export const useAccountStore = defineStore('account', {
    state: () => ({
        currentAccountId: 0,
        currentAccount: {},
        changeUserAccountName: ''
    }),
    actions: {
        setCurrentAccount(account) {
            this.currentAccountId = account.accountId
            this.currentAccount = account
        }
    }
})
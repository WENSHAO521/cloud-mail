<template>
  <emailScroll
    type="spam"
    ref="scroll"
    :getEmailList="getSpamList"
    :emailDelete="emailDelete"
    :star-add="starAdd"
    :star-cancel="starCancel"
    :unspam-email="unspamEmail"
    actionLeft="6px"
    :show-account-icon="false"
    @jump="jumpContent"
  />
</template>

<script setup>
import emailScroll from "@/components/email-scroll/index.vue"
import { emailDelete, emailSpamList, emailUnmarkSpam } from "@/request/email.js"
import { starAdd, starCancel } from "@/request/star.js"
import { useEmailStore } from "@/store/email.js"
import { useAccountStore } from "@/store/account.js"
import { defineOptions, ref, watch } from "vue"
import router from "@/router/index.js"

defineOptions({ name: 'spam' })

const scroll = ref({})
const emailStore = useEmailStore()
const accountStore = useAccountStore()

watch(() => accountStore.currentAccountId, () => {
  scroll.value.refreshList()
})

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showStar = false
  emailStore.contentData.showReply = false
  uiStore.mobileDetailOpen = true
}

function getSpamList(emailId, size) {
  const accountId = accountStore.currentAccountId
  const allReceive = accountStore.currentAccount.allReceive
  return emailSpamList(accountId, allReceive, emailId, size)
}

function unspamEmail(emailId) {
  emailUnmarkSpam([emailId]).then(() => {
    scroll.value.deleteEmail([emailId])
  })
}
</script>

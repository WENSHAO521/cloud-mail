<template>
  <emailScroll
    type="trash"
    ref="scroll"
    :getEmailList="getTrashList"
    :emailDelete="emailPermanentDelete"
    :star-add="starAdd"
    :star-cancel="starCancel"
    :restore-email="restoreAction"
    actionLeft="6px"
    :show-account-icon="false"
    @jump="jumpContent"
  />
</template>

<script setup>
import emailScroll from "@/components/email-scroll/index.vue"
import { emailPermanentDelete, emailTrashList, emailRestore } from "@/request/email.js"
import { starAdd, starCancel } from "@/request/star.js"
import { useEmailStore } from "@/store/email.js"
import { useAccountStore } from "@/store/account.js"
import { useUiStore } from "@/store/ui.js"
import { defineOptions, ref, watch } from "vue"

defineOptions({ name: 'trash' })

const scroll = ref({})
const emailStore = useEmailStore()
const accountStore = useAccountStore()
const uiStore = useUiStore()

watch(() => accountStore.currentAccountId, () => scroll.value.refreshList())

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showStar = true
  emailStore.contentData.showReply = false
  uiStore.mobileDetailOpen = true
}

function getTrashList(emailId, size) {
  const accountId  = accountStore.currentAccountId
  const allReceive = accountStore.currentAccount.allReceive
  return emailTrashList(accountId, allReceive, emailId, size)
}

function restoreAction(emailId) {
  emailRestore([emailId]).then(() => scroll.value.deleteEmail([emailId]))
}
</script>

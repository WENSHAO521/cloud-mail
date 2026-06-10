<template>
  <emailScroll ref="scroll"
               :cancel-success="cancelStar"
               :star-success="addStar"
               :getEmailList="getEmailList"
               :emailDelete="emailDelete"
               :star-add="starAdd"
               :star-cancel="starCancel"
               :time-sort="params.timeSort"
               :email-read="emailRead"
               :show-unread="true"
               :spam-email="spamEmailAction"
               :archive-email="archiveEmailAction"
               actionLeft="4px"
               @jump="jumpContent"
  >
    <template #first>
      <Icon class="icon" @click="changeTimeSort" icon="solar:sort-by-time-linear"
            v-if="params.timeSort === 0" width="28" height="28"/>
      <Icon class="icon" @click="changeTimeSort" icon="solar:sort-by-time-linear" v-else
            width="28" height="28" style="transform:scaleY(-1)"/>
    </template>

  </emailScroll>
</template>

<script setup>
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js"
import {useUiStore} from "@/store/ui.js";
import {useSettingStore} from "@/store/setting.js";
import emailScroll from "@/components/email-scroll/index.vue"
import {emailList, emailDelete, emailLatest, emailRead, emailMarkSpam, emailArchive} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {defineOptions, h, onMounted, onUnmounted, reactive, ref, watch, computed} from "vue";
import {useI18n} from "vue-i18n";
import {useNotificationStore} from "@/store/notification.js";
import {useRulesStore} from "@/store/rules.js";
import {sleep} from "@/utils/time-utils.js";
import router from "@/router/index.js";
import {Icon} from "@iconify/vue";
import { useRoute } from 'vue-router'

defineOptions({
  name: 'email'
})

const { t } = useI18n()
const route = useRoute();
const emailStore = useEmailStore();
const uiStore = useUiStore();
const accountStore = useAccountStore();
const settingStore = useSettingStore();
const scroll = ref({})
const params = reactive({
  timeSort: 0,
})
const notificationStore = useNotificationStore()
const rulesStore = useRulesStore()

let latestRunning = false
onMounted(() => {
  emailStore.emailScroll = scroll;
  latestRunning = true
  latest()
})
onUnmounted(() => { latestRunning = false })

const inboxUnread = computed(() => scroll.value?.unreadCount ?? 0)
watch(inboxUnread, v => {
  emailStore.inboxUnreadCount = v
  window.electronAPI?.setBadgeCount?.(v)
})


watch(() => accountStore.currentAccountId, () => {
  scroll.value.refreshList();
})

function changeTimeSort() {
  params.timeSort = params.timeSort ? 0 : 1
  scroll.value.refreshList();
}

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showUnread = true
  emailStore.contentData.showStar = true
  emailStore.contentData.showReply = true
  uiStore.mobileDetailOpen = true
}

const existIds = new Set();

async function latest() {
  while (latestRunning) {

    let autoRefresh = settingStore.settings.autoRefresh;
    await sleep(autoRefresh > 1 ? autoRefresh * 1000 : 3000);

    if (route.name !== 'email') {
      continue;
    }

    const latestId = scroll.value.latestEmail?.emailId

    if (!scroll.value.firstLoad && autoRefresh > 1) {
      try {
        const accountId = accountStore.currentAccountId
        const allReceive = scroll.value.latestEmail?.allReceive
        const curTimeSort = params.timeSort
        let list = []

        //确保发起请求时最后一个邮件是当前账号的,或者
        if (accountId === scroll.value.latestEmail?.reqAccountId) {
          list = await emailLatest(latestId, accountId, allReceive);
        }

        //确保请求回来后，账号没有切换，时间排序没有改变，全部邮件类型没变
        if (accountId === accountStore.currentAccountId && params.timeSort === curTimeSort && allReceive === accountStore.currentAccount.allReceive) {
          if (list.length > 0) {

            for (let email of list) {

              email.reqAccountId = accountId;
              email.allReceive = allReceive;

              if (!existIds.has(email.emailId)) {

                existIds.add(email.emailId)
                scroll.value.addItem(email)

                // apply client-side rules
                rulesStore.applyRules(email, {
                  starAdd,
                  archiveEmail: archiveEmailAction,
                  emailRead,
                })

                notificationStore.notifyEmail(email)

                await sleep(50)
              }

            }

          }

        }
      } catch (e) {
        if (e.code === 401 || e.code === 403) {
          settingStore.settings.autoRefresh = 0;
        }
        console.error(e)
      }
    }
  }
}

function archiveEmailAction(emailId) {
  emailArchive([emailId]).then(() => scroll.value.deleteEmail([emailId]))
    .catch(() => ElMessage({ message: t('operationFailMsg'), type: 'error', plain: true }))
}

function spamEmailAction(emailId) {
  emailMarkSpam([emailId]).then(() => {
    scroll.value.deleteEmail([emailId])
  }).catch(() => ElMessage({ message: t('operationFailMsg'), type: 'error', plain: true }))
}

function addStar(email) {
  emailStore.starScroll?.addItem(email)
}

function cancelStar(email) {
  emailStore.starScroll?.deleteEmail([email.emailId])
}

function getEmailList(emailId, size) {
  const accountId =  accountStore.currentAccountId;
  const allReceive = accountStore.currentAccount.allReceive;
  return emailList(accountId, allReceive, emailId, params.timeSort, size, 0).then(data => {
    if (data.latestEmail) { data.latestEmail.reqAccountId = accountId; data.latestEmail.allReceive = allReceive; }
    return data;
  })
}

</script>
<style>
.icon {
  cursor: pointer;
}
</style>

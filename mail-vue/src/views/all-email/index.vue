<template>
  <div class="email-list-box">
    <emailScroll ref="sysEmailScroll"
                 :get-emailList="getEmailList"
                 :email-delete="allEmailDelete"
                 :star-add="starAdd"
                 :star-cancel="starCancel"
                 :show-star="false"
                 show-user-info
                 show-status
                 actionLeft="4px"
                 :show-account-icon="false"
                 :time-sort="params.timeSort"
                 :item-height="65"
                 :hide-inline-search="true"
                 @jump="jumpContent"
                 @refresh-before="refreshBefore"
                 @right-search="rightSearch"
                 :type="'all-email'"
    >
      <template #first>
        <!-- Search type pill -->
        <div class="type-pill" @click.stop="openSelect">
          <el-select
              ref="mySelect"
              v-model="params.searchType"
              class="select"
          >
            <el-option key="3" :label="$t('sender')" :value="'name'"/>
            <el-option key="4" :label="$t('subject')" :value="'subject'"/>
            <el-option key="1" :label="$t('user')" :value="'user'"/>
            <el-option key="2" :label="$t('selectEmail')" :value="'account'"/>
          </el-select>
          <span class="type-label">{{ selectTitle }}</span>
          <Icon icon="mingcute:down-small-fill" width="14" height="14" class="type-arrow"/>
        </div>
        <!-- Content search input -->
        <input
            v-model="searchValue"
            class="content-input"
            :placeholder="$t('searchByContent')"
            @keydown.enter="search"
        />
        <!-- Status filter -->
        <el-select v-model="params.type" class="status-select" @change="typeSelectChange">
          <el-option key="1" :label="$t('all')" value="all"/>
          <el-option key="3" :label="$t('received')" value="receive"/>
          <el-option key="2" :label="$t('sent')" value="send"/>
          <el-option key="4" :label="$t('selectDeleted')" value="delete"/>
          <el-option key="4" :label="$t('noRecipientTitle')" value="noone"/>
        </el-select>
        <!-- Action icons -->
        <Icon class="icon" icon="iconoir:search" @click="search" width="16" height="16"/>
        <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-down-outline"
              v-if="params.timeSort === 0" width="18" height="18"/>
        <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-up-outline" v-else
              width="18" height="18"/>
        <Icon class="icon clear" icon="fluent:broom-sparkle-16-regular" width="16" height="16" @click="openBathDelete"/>
      </template>
    </emailScroll>
    <el-dialog v-model="showBathDelete" :title="$t('clearEmail')" width="335"
               @closed="closedClear">
      <div class="clear-email">
        <el-input v-model="clearParams.sendName" :placeholder="$t('sender')"/>
        <el-input v-model="clearParams.subject" :placeholder="$t('subject')"/>
        <el-input v-model="clearParams.sendEmail" :placeholder="$t('sendEmailAddress')"/>
        <el-input v-model="clearParams.toEmail" :placeholder="$t('toEmail')"/>
        <el-date-picker popper-class="my-date-picker"
                        v-model="clearTime"
                        type="daterange"
                        :teleported="false"
                        unlink-panels
                        :range-separator="t('to')"
                        size="default"
        />
        <div class="clear-button">
          <el-select v-model="clearParams.type" style="width: 200px">
            <el-option key="eq" :label="t('equal')" value="eq"/>
            <el-option key="left" :label="t('leading')" value="left"/>
            <el-option key="include" :label="t('include')" value="include"/>
          </el-select>
          <el-button :loading="clearLoading" type="primary" @click="batchDelete">{{ t('clear') }}</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import {starAdd, starCancel} from "@/request/star.js";
import emailScroll from "@/components/email-scroll/index.vue"
import {computed, defineOptions, reactive, ref, watch, onMounted} from "vue";
import {useEmailStore} from "@/store/email.js";
import {useUiStore} from "@/store/ui.js";
import {
  allEmailList,
  allEmailDelete,
  allEmailBatchDelete,
  allEmailLatest
} from "@/request/all-email.js";
import {Icon} from "@iconify/vue";
import router from "@/router/index.js";
import {useI18n} from 'vue-i18n';
import {toUtc} from "@/utils/day.js";
import {sleep} from "@/utils/time-utils.js";
import {useSettingStore} from "@/store/setting.js";
import { useRoute } from 'vue-router'

defineOptions({
  name: 'all-email'
})

const route = useRoute()
const {t} = useI18n();
const emailStore = useEmailStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
const clearTime = ref('')
const sysEmailScroll = ref({})
const searchValue = ref('')
const mySelect = ref()
const showBathDelete = ref(false)
const clearLoading = ref(false)

onMounted(() => {
  latest();
})

const openSelect = () => {
  mySelect.value.toggleMenu()
}

const params = reactive({
  timeSort: 0,
  type: 'receive',
  userEmail: null,
  accountEmail: null,
  name: null,
  subject: null,
  searchType: 'name'
})

const clearParams = reactive({
  subject: '',
  sendEmail: '',
  sendName: '',
  startTime: '',
  toEmail: '',
  endTime: '',
  type: 'eq',
})

function resetClearParams() {
  clearParams.subject = ''
  clearParams.sendEmail = ''
  clearParams.sendName = ''
  clearParams.startTime = ''
  clearParams.toEmail = ''
  clearParams.endTime = ''
}

function closedClear() {
  resetClearParams()
  clearParams.type = 'eq'
  clearParams.endTime = ''
  clearTime.value = null
}

const selectTitle = computed(() => {
  if (params.searchType === 'user') return t('user')
  if (params.searchType === 'account') return t('selectEmail')
  if (params.searchType === 'name') return t('sender')
  if (params.searchType === 'subject') return t('subject')
})

const paramsStar = localStorage.getItem('all-email-params')
if (paramsStar) {
  const locaParams = JSON.parse(paramsStar)
  params.type = locaParams.type
  params.timeSort = locaParams.timeSort
  params.status = locaParams.status
  params.searchType = locaParams.searchType
}

watch(() => params, () => {
  localStorage.setItem('all-email-params', JSON.stringify(params))
}, {
  deep: true
})

function openBathDelete() {
  showBathDelete.value = true
}

function batchDelete() {

  if (clearTime.value) {
    clearParams.startTime = toUtc(clearTime.value[0]).format("YYYY-MM-DD HH:mm:ss")
    clearParams.endTime = toUtc(clearTime.value[1]).add(1, 'day').format("YYYY-MM-DD HH:mm:ss")
  }

  if (!clearParams.sendEmail && !clearParams.sendName && !clearParams.subject && !clearParams.toEmail && !clearTime.value) {
    showBathDelete.value = false
    return
  }

  ElMessageBox.confirm(
      t('delAllConfirm'),
      {
        confirmButtonText: t('confirm'),
        cancelButtonText: t('cancel'),
        type: 'warning',
      }
  ).then(() => {
    clearLoading.value = true

    allEmailBatchDelete(clearParams).then(() => {
      ElMessage({
        message: t('clearSuccess'),
        type: "success",
        plain: true
      })
      resetClearParams()
      sysEmailScroll.value.refreshList();
    }).finally(() => {
      clearLoading.value = false
    })
  })
}

function rightSearch(type, value) {
  params.searchType = type;
  searchValue.value = value;
  search();
}

function refreshBefore() {
  searchValue.value = null
  params.timeSort = 0
  params.type = 'receive'
  params.userEmail = null
  params.accountEmail = null
  params.name = null
  params.subject = null
  params.searchType = 'name'
}

function search() {

  params.userEmail = null
  params.accountEmail = null
  params.name = null
  params.subject = null

  if (params.searchType === 'user') {
    params.userEmail = searchValue.value
  }

  if (params.searchType === 'account') {
    params.accountEmail = searchValue.value
  }

  if (params.searchType === 'name') {
    params.name = searchValue.value
  }

  if (params.searchType === 'subject') {
    params.subject = searchValue.value
  }

  sysEmailScroll.value.refreshList();
}

function changeTimeSort() {
  params.timeSort = params.timeSort ? 0 : 1
  search()
}

function typeSelectChange() {
  search()
}

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'physics'
  emailStore.contentData.showStar = false
  emailStore.contentData.showReply = false
  uiStore.mobileDetailOpen = true
}


function getEmailList(emailId, size) {
  return allEmailList({emailId, size, ...params})
}

async function latest() {

  while (true) {

    let autoRefresh = settingStore.settings.autoRefresh;

    await sleep(autoRefresh > 1 ? autoRefresh * 1000 : 3000);

    const latestId = sysEmailScroll.value.latestEmail?.emailId

    if (autoRefresh < 2) {
      continue
    }

    if (!latestId && latestId !== 0) {
      continue
    }

    if (route.name !== 'all-email') {
      continue
    }


    if (params.type !== 'receive') {
      continue
    }

    try {

      const curTimeSort = params.timeSort
      let list = await allEmailLatest(latestId)

      if (list.length === 0) {
        continue
      }

      if (params.type !== 'receive') {
        continue
      }

      // 确保回来之后条件没变
      if (params.timeSort !== curTimeSort) {
        continue
      }

      for (let email of list) {

        sysEmailScroll.value.addItem(email)
        await sleep(50)

      }

    } catch (e) {
      if (e.code === 401 || e.code === 403) {
        settingStore.settings.autoRefresh = 0;
      }
      console.error(e)
    }

  }
}

</script>
<style>

@media (max-width: 767px) {
  .el-date-range-picker .el-picker-panel__body {
    min-width: auto;

  }

  .my-date-picker::after {
    content: "";
    position: absolute; /* 脱离文档流，不会撑开 */
    left: 0;
    right: 0;
    height: 20px;
    background: transparent; /* 方便看效果 */
  }

  .el-date-range-picker__content {
    width: 100%;
  }

  .el-date-range-picker {
    width: 300px;
  }

  .el-tooltip .el-picker_popper {
    padding-bottom: 200px;
  }

  .el-date-range-picker__content.is-left {
    border-right: 0;
  }
}

</style>
<style scoped lang="scss">
.email-list-box {
  height: 100%;
  width: 100%;
  overflow: hidden;
}


/* ── Hidden real select (triggered by type-pill click) ─── */
.select {
  position: absolute;
  width: 40px;
  opacity: 0;
  pointer-events: none;
}

/* ── Search type pill ─────────────────────────────────── */
.type-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--light-border, #d0d0d0);
  background: var(--surface, #fff);
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;

  .type-label {
    font-size: 12px;
    color: var(--el-text-color-regular);
    white-space: nowrap;
  }

  .type-arrow {
    color: var(--el-text-color-placeholder);
  }

  @media (hover: hover) {
    &:hover {
      border-color: var(--el-border-color-hover);
    }
  }
}

/* ── Content search plain input ───────────────────────── */
.content-input {
  height: 28px;
  min-width: 80px;
  max-width: 180px;
  flex: 1;
  border: 1px solid var(--light-border, #d0d0d0);
  border-left: none;
  background: var(--surface, #fff);
  padding: 0 8px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }

  &:focus {
    border-color: var(--el-color-primary);
    z-index: 1;
  }
}

/* ── Status select ────────────────────────────────────── */
:deep(.el-select__wrapper) {
  height: 28px;
  min-height: 28px;
  padding: 0 8px;
  box-sizing: border-box;
}

.clear-email {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.clear-button {
  display: flex;
  align-items: center;
  gap: 15px;

  .el-button {
    width: 100%;
  }
}

.status-select {
  width: 88px;
  flex-shrink: 0;
}

:deep(.el-date-editor.el-input__wrapper) {
  width: 303px;
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  color: var(--muted, #7e7576);
  transition: border-color 0.10s, color 0.10s;

  @media (hover: hover) {
    &:hover {
      border-color: #000000;
      color: #000000;
    }

    &.clear:hover {
      border-color: #bc0000;
      color: #bc0000;
    }
  }
}

.dark .icon:hover {
  border-color: #ffffff !important;
  color: #ffffff !important;
}
.dark .icon.clear:hover {
  border-color: #bc0000 !important;
  color: #bc0000 !important;
}

.dark .type-pill {
  background: var(--surface);
  border-color: var(--light-border);
  .type-label { color: var(--el-text-color-regular); }
}

.dark .content-input {
  background: var(--surface);
  border-color: var(--light-border);
  color: var(--el-text-color-primary);
  &::placeholder { color: var(--el-text-color-placeholder); }
}

.clear {
  @media (max-width: 419px) {
    position: absolute;
    top: 41px;
    left: 242px;
  }
}

:deep(.reload) {
  @media (max-width: 419px) {
    position: absolute;
    top: 42px;
    left: 208px;
  }
}

:deep(.delete) {
  @media (max-width: 456px) {
    position: absolute;
    top: 43px;
    left: 294px;
  }

  @media (max-width: 419px) {
    position: absolute;
    top: 43px;
    left: 282px;
  }
}
</style>

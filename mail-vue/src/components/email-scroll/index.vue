<template>
  <div class="email-container">

    <!-- ── Search area (always visible, vfasky p-4 pill style) ── -->
    <div class="search-area">
      <div class="search-pill">
        <Icon icon="iconoir:search" width="20" height="20" class="search-icon-pill" />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          class="search-input"
          :placeholder="$t('searchPlaceholder')"
          @keydown.esc="searchQuery = ''"
        />
        <Icon v-if="searchQuery" icon="material-symbols:close-rounded" width="18" height="18"
              class="search-clear-icon" @click="searchQuery = ''" />
      </div>
    </div>

    <!-- ── Toolbar (h-12 border-y, vfasky style) ── -->
    <div class="mail-toolbar">
      <div class="toolbar-left">
        <el-checkbox
          v-model="checkAll"
          :indeterminate="isIndeterminate"
          :disabled="!emailList.length || loading"
          @change="handleCheckAllChange"
        />
        <slot name="first"></slot>
        <button class="icon-btn" @click="refresh">
          <Icon icon="ion:reload" width="17" height="17" />
        </button>
        <button v-perm="'email:delete'" class="icon-btn icon-danger"
                v-if="getSelectedMailsIds().length > 0" @click="handleDelete">
          <Icon icon="material-symbols:delete-outline-rounded" width="17" height="17" />
        </button>
        <button class="icon-btn" v-if="getSelectedMailsIds().length > 0 && showUnread" @click="handleRead">
          <Icon icon="fluent:mail-read-20-regular" width="19" height="19" />
        </button>
      </div>
      <div class="toolbar-right">
        <span class="mail-count" v-if="total && !searchQuery.trim()">{{ $t('emailCount', { total }) }}</span>
        <span class="mail-count" v-if="searchQuery.trim()">{{ $t('searchResultCount', { count: searchResultCount }) }}</span>
      </div>
    </div>

    <!-- ── Email list ── -->
    <div ref="scroll" class="scroll">
      <UseVirtualList
        ref="scrollbarRef"
        @scroll="onScroll"
        :list="list"
        :options="{ itemHeight: itemHeight, overscan: 15 }"
        class="virtual"
        style="height: 100%"
        v-if="!loading && emailList.length > 0"
        :key="keyCount"
      >
        <template #default="{ data: item }">

          <!-- ── Mail row (Brutalist table layout) ── -->
          <div class="mail-row-wrap" v-if="!item.expand">
            <div
              class="mail-row"
              :class="[props.type, { 'is-unread': item.unread === EmailUnreadEnum.UNREAD && showUnread }]"
              :data-active="item.rightChecked || undefined"
              @click="jumpDetails(item)"
              @contextmenu="handleContextmenu($event, item)"
            >
              <!-- Col 1: Checkbox + unread dot -->
              <div class="row-check">
                <div class="unread-indicator" :class="{ visible: item.unread === EmailUnreadEnum.UNREAD && showUnread }"></div>
                <el-checkbox class="mail-cb" v-model="item.checked" @click.stop />
              </div>

              <!-- Col 2: Sender -->
              <div class="row-sender">
                <div class="email-status-inline" v-if="showStatus">
                  <el-tooltip effect="dark" :content="item.statusIcon?.content">
                    <Icon :icon="item.statusIcon?.icon" :style="`color: ${item.statusIcon?.color}`"
                          width="14" height="14" />
                  </el-tooltip>
                </div>
                <span class="mail-name">
                  <slot name="name" :email="item">{{ item.name }}</slot>
                </span>
                <Icon v-if="item.isStar && showStar" icon="fluent-color:star-16" width="12" height="12" class="sender-star" />
              </div>

              <!-- Col 3: Subject + snippet -->
              <div class="row-subject-cell">
                <span v-if="item.code" class="code-tag" @click.stop="copyCode(item.code)">
                  [{{ t('codeLabel') }}{{ item.code }}]
                </span>
                <span class="subject-text">
                  <slot name="subject" :email="item">{{ item.subject || '​' }}</slot>
                </span>
                <span class="mail-preview-inline">{{ item.formatText ? ' — ' + item.formatText : '' }}</span>
                <div class="user-info-inline" v-if="showUserInfo">
                  <span>{{ item.userEmail }}</span>
                  <span>→ {{ item.type === 0 ? item.toEmail : item.sendEmail }}</span>
                </div>
              </div>

              <!-- Col 4: Time + actions -->
              <div class="row-meta">
                <span class="mail-time">{{ item.formatCreateTime }}</span>
                <div class="mail-actions">
                  <button v-if="archiveEmail" class="icon-btn" :title="$t('archive')"
                          @click.stop="archiveEmail(item.emailId)">
                    <Icon icon="material-symbols:archive-outline-rounded" width="14" height="14" />
                  </button>
                  <button v-if="showStar" class="icon-btn" :title="$t('star')"
                          @click.stop="starChange(item)">
                    <Icon :icon="item.isStar ? 'fluent-color:star-16' : 'solar:star-line-duotone'"
                          :width="14" :height="14" />
                  </button>
                  <button v-perm="'email:delete'" class="icon-btn icon-danger" :title="$t('delete')"
                          @click.stop="rightDelete(item.emailId)">
                    <Icon icon="material-symbols:delete-outline-rounded" width="14" height="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <skeletonBlock v-else-if="item.expand === 'loading'"
                         :rows="1" :showStar="showStar" :accountShow="accountShow"
                         :showStatus="showStatus" :showUserInfo="showUserInfo" :type="type" />
          <div class="no-more" v-else-if="item.expand === 'noMoreData'">
            {{ $t('noMoreData') }}
          </div>
        </template>
      </UseVirtualList>

      <skeletonBlock v-if="firstLoad && showFirstLoading"
                     :rows="20" :showStar="showStar" :accountShow="accountShow"
                     :showStatus="showStatus" :showUserInfo="showUserInfo" :type="type" />
      <skeletonBlock v-if="loading"
                     :rows="skeletonRows" :showStar="showStar" :accountShow="accountShow"
                     :showStatus="showStatus" :showUserInfo="showUserInfo" :type="type" />
      <div class="empty" v-if="noLoading && emailList.length === 0 && !loading">
        <el-empty :description="$t('noMessagesFound')" />
      </div>
      <div class="empty" v-if="searchQuery.trim() && searchResultCount === 0 && emailList.length > 0 && !loading">
        <el-empty :description="$t('noSearchResults')" />
      </div>
    </div>

    <!-- Context menu -->
    <el-dropdown
      ref="dropdownRef"
      @visible-change="visibleChange"
      :virtual-ref="triggerRef"
      :show-arrow="false"
      :popper-options="{ modifiers: [{ name: 'offset', options: { offset: [0, 0] } }] }"
      virtual-triggering
      trigger="contextmenu"
      placement="bottom-start"
    >
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-if="rightClickEmail.code" @click="copyCode(rightClickEmail.code)">
            <div class="ctx-item"><Icon icon="fluent-color:clipboard-24" width="18" height="18" /><span>{{ t('copyCode') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email'].includes(props.type)" @click="emailRead(rightClickEmail.emailId)">
            <div class="ctx-item"><Icon icon="fluent:mail-read-20-regular" width="18" height="18" /><span>{{ t('markAsRead') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email','star'].includes(props.type)" @click="openReply(rightClickEmail)">
            <div class="ctx-item"><Icon icon="la:reply" width="18" height="18" /><span>{{ t('reply') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email','star'].includes(props.type)" @click="openReplyAll(rightClickEmail)">
            <div class="ctx-item"><Icon icon="la:reply-all" width="18" height="18" /><span>{{ t('replyAll') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email','send','star'].includes(props.type)" @click="openForward(rightClickEmail)">
            <div class="ctx-item"><Icon icon="iconoir:arrow-up-right" width="17" height="17" /><span>{{ t('forward') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email','send','star'].includes(props.type)" @click="starChange(rightClickEmail)">
            <div class="ctx-item"><Icon icon="solar:star-line-duotone" width="17" height="17" /><span>{{ t('star') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'all-email'" @click="handleSearch('user', rightClickEmail.userEmail)">
            <div class="ctx-item"><Icon icon="iconoir:search" width="18" height="18" /><span>{{ t('searchUser') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'all-email'" @click="handleSearch('account', rightClickEmail.toEmail)">
            <div class="ctx-item"><Icon icon="iconoir:search" width="18" height="18" /><span>{{ t('searchEmail') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'all-email'" @click="handleSearch('name', rightClickEmail.name)">
            <div class="ctx-item"><Icon icon="iconoir:search" width="18" height="18" /><span>{{ t('searchSender') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'email'" @click="archiveAction(rightClickEmail.emailId)">
            <div class="ctx-item"><Icon icon="material-symbols:archive-outline-rounded" width="18" height="18" /><span>{{ t('archive') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'archive'" @click="unarchiveAction(rightClickEmail.emailId)">
            <div class="ctx-item"><Icon icon="material-symbols:unarchive-outline-rounded" width="18" height="18" /><span>{{ t('unarchive') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'email'" @click="markSpamAction(rightClickEmail.emailId)">
            <div class="ctx-item"><Icon icon="material-symbols:report-outline-rounded" width="18" height="18" /><span>{{ t('markAsSpam') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'spam'" @click="unmarkSpamAction(rightClickEmail.emailId)">
            <div class="ctx-item"><Icon icon="material-symbols:check-circle-outline-rounded" width="18" height="18" /><span>{{ t('notSpam') }}</span></div>
          </el-dropdown-item>
          <el-dropdown-item @click="rightDelete(rightClickEmail.emailId)">
            <div class="ctx-item danger"><Icon icon="material-symbols:delete-outline-rounded" width="18" height="18" /><span>{{ t('delete') }}</span></div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

  </div>
</template>

<script setup>
import {Icon} from "@iconify/vue";
import skeletonBlock from "@/components/email-scroll/skeleton/index.vue"
import {computed, onActivated, reactive, ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import {useEmailStore} from "@/store/email.js";
import {useUiStore} from "@/store/ui.js";
import {useSettingStore} from "@/store/setting.js";
import {sleep} from "@/utils/time-utils.js"
import { avatarBg, avatarLetter, storedAvatar, gravatarCandidate, markGravatarMiss } from '@/utils/avatar.js'
import { useAvatarCacheStore } from '@/store/avatar-cache.js'
import {fromNow} from "@/utils/day.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";
import { UseVirtualList } from '@vueuse/components'
import { useScroll } from '@vueuse/core'

const props = defineProps({
  getEmailList: Function,
  emailDelete: Function,
  emailRead: Function,
  starAdd: Function,
  starCancel: Function,
  cancelSuccess: Function,
  starSuccess: Function,
  actionLeft: { type: String, default: '0' },
  timeSort: { type: Number, default: 0 },
  showStatus: { type: Boolean, default: false },
  showAccountIcon: { type: Boolean, default: true },
  showUserInfo: { type: Boolean, default: false },
  showStar: { type: Boolean, default: true },
  allowStar: { type: Boolean, default: true },
  type: { type: String, default: 'email' },
  showFirstLoading: { type: Boolean, default: true },
  showUnread: { type: Boolean, default: false },
  spamEmail: { type: Function, default: null },
  unspamEmail: { type: Function, default: null },
  archiveEmail: { type: Function, default: null },
  unarchiveEmail: { type: Function, default: null },
})

const emit = defineEmits(['jump', 'refresh-before', 'delete-draft', 'right-search'])
const {t} = useI18n()
const settingStore = useSettingStore()
const uiStore = useUiStore();
const emailStore = useEmailStore();
const loading = ref(false);
const followLoading = ref(false);
const noLoading = ref(false);
const emailList = reactive([])
const expandList = reactive([])
const total = ref(0);
const checkAll = ref(false);
const isIndeterminate = ref(false);
const scroll = ref(null)
const firstLoad = ref(true)
let scrollTop = 0
const latestEmail = ref(null)
const scrollbarRef = ref(null)
let reqLock = false
let isMobile = ref(innerWidth < 1367)
let skeletonRows = 0
const keyCount = ref(0);
const dropdownRef = ref(null);
const dropdownCloseLock = ref(false);
const dropdownShow = ref(false);
const rightClickEmail = ref({});
const searchQuery = ref('');
const searchInputRef = ref(null);
const checkedEmailCount = ref(0);
let timer = null
const position = ref(DOMRect.fromRect({ x: 0, y: 0 }))
const triggerRef = ref({ getBoundingClientRect() { return position.value; } })
const queryParam = reactive({ size: 50 });

defineExpose({ refreshList, deleteEmail, addItem, handleList, emailList, firstLoad, latestEmail, noLoading, total })

onActivated(() => {
  requestAnimationFrame(() => {
    const index = scrollTop / itemHeight.value
    scrollbarRef.value?.scrollTo(index);
  })
})

const onResize = () => { isMobile.value = innerWidth < 1367 }
const onWheel = () => { if (dropdownShow.value) dropdownRef.value.handleClose() }

onMounted(() => {
  timer = setInterval(() => {
    emailList.forEach(email => { email.formatCreateTime = fromNow(email.createTime); })
  }, 1000 * 60);
  window.addEventListener('resize', onResize)
  window.addEventListener('wheel', onWheel)
})

onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('wheel', onWheel)
})

getEmailList()

function onScroll(e) { scrollTop = e.target.scrollTop; }

const { arrivedState } = useScroll(scrollbarRef, { offset: { bottom: 1200 } })

const searchResultCount = computed(() => {
  if (!searchQuery.value.trim()) return emailList.length
  const q = searchQuery.value.toLowerCase()
  return emailList.filter(e => e.name?.toLowerCase().includes(q) || e.subject?.toLowerCase().includes(q)).length
})

const list = computed(() => {
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    return emailList.filter(e => e.name?.toLowerCase().includes(q) || e.subject?.toLowerCase().includes(q))
  }
  return [...emailList, ...expandList]
})

const itemHeight = computed(() => {
  if (props.type === 'all-email') return isMobile.value ? 60 : 56;
  return isMobile.value ? 52 : 44;
})

watch(itemHeight, () => { keyCount.value++ })

watch(followLoading, (v) => {
  if (v) expandList.push({ emailId: 0, expand: 'loading' })
  else { const i = expandList.findIndex(x => x.expand === 'loading'); expandList.splice(i, 1); }
})

watch(noLoading, (v) => {
  if (v) expandList.push({ emailId: 0, expand: 'noMoreData' })
  else { const i = expandList.findIndex(x => x.expand === 'noMoreData'); expandList.splice(i, 1); }
})

watch(() => arrivedState.bottom, (isBottom) => { if (isBottom && !loading.value) loadData(); });

watch(() => emailList.map(item => item.checked), () => {
  if (emailList.length > 0) updateCheckStatus();
}, { deep: true });

watch(() => emailStore.deleteIds, () => { if (emailStore.deleteIds) deleteEmail(emailStore.deleteIds) })
watch(() => emailStore.cancelStarEmailId, () => {
  emailList.forEach(email => { if (email.emailId === emailStore.cancelStarEmailId) email.isStar = 0 })
})
watch(() => emailStore.addStarEmailId, () => {
  emailList.forEach(email => { if (email.emailId === emailStore.addStarEmailId) email.isStar = 1 })
})

function openReply(email) { uiStore.writerRef.openReply(email) }
function openReplyAll(email) { uiStore.writerRef.openReplyAll(email) }
function openForward(email) { uiStore.writerRef.openForward(email) }

function visibleChange(e) {
  dropdownShow.value = e;
  dropdownCloseLock.value = true;
  setTimeout(() => { dropdownCloseLock.value = false; }, 1500)
  if (!e && rightClickEmail.value.rightChecked) rightClickEmail.value.rightChecked = false
}

const handleContextmenu = (event, email) => {
  if (props.type === 'draft') return
  if (rightClickEmail.value.rightChecked) rightClickEmail.value.rightChecked = false
  const { clientX, clientY } = event
  position.value = DOMRect.fromRect({ x: clientX, y: clientY })
  event.preventDefault();
  dropdownRef.value?.handleOpen();
  rightClickEmail.value = email;
  rightClickEmail.value.rightChecked = true
}

function getSkeletonRows() {
  if (emailList.length > 20) return skeletonRows = 20
  if (emailList.length === 0) return skeletonRows = 1
  skeletonRows = emailList.length
}

const accountShow = computed(() => uiStore.accountShow && settingStore.settings.manyEmail === 0)

function htmlToText(email) {
  if (email.content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = email.content.replace(/<(img|iframe|object|embed|video|audio|source|link)[^>]*>/gi, '');
    tempDiv.querySelectorAll('script, style, title').forEach(el => el.remove());
    let text = tempDiv.textContent || tempDiv.innerText || '';
    text = text.replace(/\s+/g, ' ').trim();
    return cleanSpace(text)
  }
  if (email.text) return cleanSpace(email.text)
  return ''
}

function cleanSpace(text) {
  return text
    .replace(/[​-‏﻿͏ 　­]/g, '')
    .replace(/\s+/g, ' ').trim();
}

const avatarCache = useAvatarCacheStore()
function senderBg(item) { return avatarBg(item.sendEmail || item.name || '') }
function senderLetter(item) { return avatarLetter(item.name, item.sendEmail) }
function senderImg(item) {
  return avatarCache.get(item.sendEmail) || storedAvatar(item.sendEmail) || gravatarCandidate(item.sendEmail)
}

function starChange(email) {
  if (!email.isStar) {
    if (!props.allowStar) return;
    email.isStar = 1;
    props.starAdd(email.emailId).then(() => { email.isStar = 1; props.starSuccess(email) }).catch(e => { console.error(e); email.isStar = 0 })
  } else {
    email.isStar = 0;
    props.starCancel(email.emailId).then(() => { email.isStar = 0; props.cancelSuccess?.(email) }).catch(e => { console.error(e); email.isStar = 1; })
  }
}

function changeAccountShow() { uiStore.accountShow = !uiStore.accountShow; }

const handleRead = () => { const ids = getSelectedMailsIds(); props.emailRead(ids); localRead(ids); }

function emailRead(emailId) { props.emailRead([emailId]); localRead([emailId]); }

function localRead(emailIds) {
  emailIds.forEach(emailId => {
    const index = emailList.findIndex(email => email.emailId === emailId);
    if (index > -1) { emailList[index].unread = EmailUnreadEnum.READ; emailList[index].checked = false; }
  })
}

function rightDelete(emailId) {
  const doDelete = () => {
    props.emailDelete([emailId]).then(() => {
      ElMessage({ message: t('delSuccessMsg'), type: 'success', plain: true })
      deleteEmail([emailId])
      emailStore.deleteIds = [emailId]
    }).catch(() => {
      ElMessage({ message: t('delFailMsg') || 'Delete failed', type: 'error', plain: true })
    })
  }
  if (props.type === 'all-email') {
    ElMessageBox.confirm(t('delOneEmailConfirm'), { confirmButtonText: t('confirm'), cancelButtonText: t('cancel'), type: 'warning' })
      .then(doDelete)
    return
  }
  doDelete()
}

function archiveAction(emailId) { if (props.archiveEmail) props.archiveEmail(emailId) }
function unarchiveAction(emailId) { if (props.unarchiveEmail) props.unarchiveEmail(emailId) }
function markSpamAction(emailId) { if (props.spamEmail) props.spamEmail(emailId) }
function unmarkSpamAction(emailId) { if (props.unspamEmail) props.unspamEmail(emailId) }
function handleSearch(type, value) { emit('right-search', type, value); }

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    ElMessage({ message: t('copySuccessMsg'), type: 'success', plain: true })
  } catch (err) {
    ElMessage({ message: t('copyFailMsg'), type: 'error', plain: true })
  }
}

function handleDelete() {
  ElMessageBox.confirm(t('delEmailsConfirm'), { confirmButtonText: t('confirm'), cancelButtonText: t('cancel'), type: 'warning' })
    .then(() => {
      if (props.type === 'draft') { emit('delete-draft', getSelectedDraftsIds()); return; }
      const emailIds = getSelectedMailsIds()
      props.emailDelete(emailIds).then(() => {
        ElMessage({ message: t('delSuccessMsg'), type: 'success', plain: true })
        deleteEmail(emailIds)
        emailStore.deleteIds = emailIds
      }).catch(() => {
        ElMessage({ message: t('delFailMsg') || 'Delete failed', type: 'error', plain: true })
      })
    })
}

function deleteEmail(emailIds) {
  const idSet = new Set(emailIds)
  for (let i = emailList.length - 1; i >= 0; i--) {
    if (idSet.has(emailList[i].emailId)) emailList.splice(i, 1)
  }
  if (emailList.length < queryParam.size && !noLoading.value) getEmailList()
}

function addItem(email) {
  const existIndex = emailList.findIndex(item => item.emailId === email.emailId)
  if (existIndex > -1) return false;
  email.formatText = htmlToText(email);
  email.formatCreateTime = fromNow(email.createTime);
  if (props.timeSort) {
    if (noLoading.value) { handleList([email]); emailList.push(email); }
    if (email.emailId > latestEmail.value?.emailId) latestEmail.value = email
    total.value++; return true;
  }
  const index = emailList.findIndex(item => item.emailId < email.emailId)
  if (index !== -1) { handleList([email]); emailList.splice(index, 0, email); }
  else if (noLoading.value) { handleList([email]); emailList.push(email); }
  if (email.emailId > latestEmail.value?.emailId) latestEmail.value = email
  total.value++; return true;
}

function handleCheckAllChange(val) { emailList.forEach(item => item.checked = val); isIndeterminate.value = false; }
function getSelectedMailsIds() { return emailList.filter(item => item.checked).map(item => item.emailId); }
function getSelectedDraftsIds() { return emailList.filter(item => item.checked).map(item => item.draftId); }
function updateCheckStatus() {
  const n = emailList.filter(item => item.checked).length;
  checkedEmailCount.value = n;
  checkAll.value = n === emailList.length;
  isIndeterminate.value = n > 0 && n < emailList.length;
}

function jumpDetails(email) {
  if (dropdownShow.value) { dropdownRef.value.handleClose(); return; }
  if (!dropdownCloseLock.value) { const sel = window.getSelection(); if (sel.toString().trim()) return }
  const idx = emailList.findIndex(e => e.emailId === email.emailId)
  emailStore.contentData.emailIndex = idx + 1
  emailStore.contentData.emailTotal = total.value
  emit('jump', email)
}

function getEmailList(refresh = false) {
  if (reqLock) return;
  let emailId = emailList.length > 0 ? emailList.at(-1).emailId : 0;
  reqLock = true
  if (!refresh) {
    if (loading.value || noLoading.value) { reqLock = false; return }
  } else {
    getSkeletonRows(); emailId = 0; loading.value = true; scrollTop = 0;
  }
  if (emailList.length === 0) loading.value = true;
  else followLoading.value = !refresh;
  let start = Date.now();
  props.getEmailList(emailId, queryParam.size).then(async data => {
    let duration = Date.now() - start;
    if (duration < 300 && !emailId) await sleep(300 - duration)
    firstLoad.value = false
    let list = data.list.map(item => ({ ...item, checked: false }));
    if (refresh) emailList.length = 0
    latestEmail.value = data.latestEmail
    handleList(list); emailList.push(...list);
    if (refresh) scrollbarRef.value?.setScrollTop(0);
    noLoading.value = data.list.length < queryParam.size;
    followLoading.value = data.list.length >= queryParam.size;
    total.value = data.total;
  }).finally(() => {
    loading.value = false; firstLoad.value = false; followLoading.value = false; reqLock = false;
  })
}

function handleList(list) {
  list.forEach(email => {
    email.formatText = htmlToText(email)
    email.formatCreateTime = fromNow(email.createTime);
    email.test = t('received')
    const statusIconMap = {
      0: { icon: 'ic:round-mark-email-read', color: '#51C76B', content: t('received') },
      1: { icon: 'bi:send-arrow-up-fill',    color: '#51C76B', content: t('sent') },
      2: { icon: 'bi:send-check-fill',       color: '#51C76B', content: t('delivered') },
      3: { icon: 'bi:send-x-fill',           color: '#F56C6C', content: t('bounced') },
      8: { icon: 'bi:send-x-fill',           color: '#F56C6C', content: t('bounced') },
      4: { icon: 'bi:send-exclamation-fill', color: '#FBBD08', content: t('complained') },
      5: { icon: 'bi:send-arrow-up-fill',    color: '#FBBD08', content: t('delayed') },
      7: { icon: 'ic:round-mark-email-read', color: '#FBBD08', content: t('noRecipient') },
    };
    if (email.isDel) email.isDelContent = t('selectDeleted');
    email.statusIcon = statusIconMap[email.status];
  })
}

function refresh() { emit('refresh-before'); refreshList() }

function refreshList() {
  checkAll.value = false; isIndeterminate.value = false; searchQuery.value = '';
  getEmailList(true);
}

function loadData() { getEmailList() }
</script>

<style lang="scss" scoped>
/* ── Container ────────────────────────────────────────────── */
.email-container {
  display: grid;
  grid-template-rows: auto auto 1fr;
  height: 100%;
  overflow: hidden;
  background: #f9f9f9;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.dark .email-container {
  background: #0a0a0a;
}

/* ── Search area ──────────────────────────────────────────── */
.search-area {
  padding: 10px 16px;
  background: #f9f9f9;
  border-bottom: 1px solid #000000;
}

.dark .search-area {
  background: #0a0a0a;
  border-bottom-color: #333333;
}

.search-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  background: #ffffff;
  border-radius: 0;
  padding: 0 12px;
  border: 1px solid #000000;
  transition: border-color 0.12s ease;

  &:focus-within {
    border-color: #bc0000;
  }

  .search-icon-pill { color: #7e7576; flex-shrink: 0; }

  .search-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #000000;
    min-width: 0;
    &::placeholder {
      color: #7e7576;
      text-transform: uppercase;
    }
  }

  .search-clear-icon {
    color: #7e7576;
    cursor: pointer;
    flex-shrink: 0;
    &:hover { color: #000000; }
  }
}

.dark .search-pill {
  background: #111111;
  border-color: #555555;
  &:focus-within { border-color: #bc0000; }
  .search-input { color: #ffffff; }
}

/* ── Toolbar ──────────────────────────────────────────────── */
.mail-toolbar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #000000;
  background: #f3f3f3;
  flex-shrink: 0;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mail-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #7e7576;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    border: 1px solid #cfc4c5;
    padding: 2px 6px;
  }
}

.dark .mail-toolbar {
  background: #111111;
  border-bottom-color: #333333;
  .mail-count { border-color: #444444; }
}

/* ── Icon button (brutalist square) ──────────────────────── */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* min 32px for touch targets */
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 0;
  cursor: pointer;
  color: #7e7576;
  transition: background 0.10s ease, color 0.10s ease, border-color 0.10s;
  flex-shrink: 0;

  @media (hover: hover) {
    &:hover {
      border-color: #000000;
      color: #000000;
    }

    &.icon-danger:hover {
      border-color: #bc0000;
      color: #bc0000;
    }
  }
}

.dark .icon-btn {
  color: #555555;
  @media (hover: hover) {
    &:hover {
      border-color: #ffffff;
      color: #ffffff;
    }
    &.icon-danger:hover {
      border-color: #bc0000;
      color: #bc0000;
    }
  }
}

/* ── Scroll area ──────────────────────────────────────────── */
.scroll {
  height: 100%;
  overflow: hidden;
  background: var(--psg-bg, #f9f9f9);

  .virtual { will-change: scroll-position; }

  .empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  .no-more {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 12px 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted, #7e7576);
  }
}

/* ── Mail row wrapper ─────────────────────────────────────── */
:deep(.mail-row-wrap) {
  padding: 0;
}

/* ── Mail row: Brutalist table layout (Stitch) ────────────── */
:deep(.mail-row) {
  display: grid;
  grid-template-columns: 52px 180px 1fr 110px;
  gap: 8px;
  min-height: 44px;
  padding: 8px 16px 8px 8px;
  border-radius: 0;
  border-bottom: 1px solid var(--light-border-color, #cfc4c5);
  background: #ffffff;
  cursor: pointer;
  align-items: center;
  transition: background 100ms ease;

  &.all-email {
    grid-template-columns: 52px 180px 1fr 110px;
    min-height: 56px;
  }

  @media (max-width: 1280px) {
    grid-template-columns: 44px 140px 1fr 88px;
  }

  /* ── Mobile: stacked 2-row card layout ── */
  @media (max-width: 768px) {
    grid-template-columns: 36px 1fr auto;
    grid-template-rows: auto auto;
    gap: 0 8px;
    min-height: 56px;
    padding: 8px 12px 8px 4px;
    align-items: start;

    &.all-email { min-height: 64px; }
  }

  @media (hover: hover) {
    &:hover {
      background: #f3f3f3;
    }
  }

  &[data-active] {
    background: #eeeeee;
  }
}

/* Mobile row cell placement */
@media (max-width: 768px) {
  :deep(.row-check) {
    grid-column: 1;
    grid-row: 1 / 3;
    align-self: center;
  }
  :deep(.row-sender) {
    grid-column: 2;
    grid-row: 1;
    padding-top: 2px;
  }
  :deep(.row-meta) {
    grid-column: 3;
    grid-row: 1;
    align-items: flex-start;
    padding-top: 2px;
  }
  :deep(.row-subject-cell) {
    grid-column: 2 / 4;
    grid-row: 2;
    padding-bottom: 4px;

    /* Hide long preview on mobile to reduce clutter */
    .mail-preview-inline { display: none; }
  }
}

/* 480px: hide preview text, boost sender/subject readability */
@media (max-width: 480px) {
  :deep(.mail-preview-inline) { display: none !important; }
  :deep(.row-sender .mail-name) { font-size: 15px; }
  :deep(.row-subject-cell .subject-text) { font-size: 15px; }
}

.dark :deep(.mail-row) {
  background: #111111;
  border-bottom-color: #202020;

  &:hover { background: #1a1a1a; }
  &[data-active] { background: #1e1e1e; }
}

/* ── Col 1: Checkbox + unread indicator ───────────────────── */
:deep(.row-check) {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding-left: 8px;

  .unread-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: transparent;
    flex-shrink: 0;
    transition: background 0.1s;

    &.visible { background: #bc0000; }
  }
}

/* ── Col 2: Sender ────────────────────────────────────────── */
:deep(.row-sender) {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;

  .mail-name {
    font-size: 14px;
    font-weight: 400;
    color: #4c4546;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .sender-star { flex-shrink: 0; }

  .email-status-inline {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}

/* ── Col 3: Subject + snippet ─────────────────────────────── */
:deep(.row-subject-cell) {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;

  .subject-text {
    font-size: 14px;
    font-weight: 400;
    color: #4c4546;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
    min-width: 0;
  }

  .mail-preview-inline {
    font-size: 13px;
    color: #7e7576;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 2;
    min-width: 0;
  }

  .code-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #bc0000;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    border: 1px solid #bc0000;
    padding: 0 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .user-info-inline {
    display: flex;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #7e7576;
    flex-shrink: 0;
    white-space: nowrap;
  }
}

/* ── Col 4: Time + actions ────────────────────────────────── */
:deep(.row-meta) {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;

  .mail-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #7e7576;
    white-space: nowrap;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
  }

  .mail-actions {
    display: flex;
    align-items: center;
    gap: 0;
    opacity: 0;
    transition: opacity 0.1s;
  }
}

:deep(.mail-row:hover .row-meta .mail-actions),
:deep(.mail-row[data-active] .row-meta .mail-actions) {
  opacity: 1;
}

/* ── Unread state ─────────────────────────────────────────── */
:deep(.mail-row.is-unread) {
  background: #ffffff;

  .row-sender .mail-name {
    font-weight: 700 !important;
    color: #1a1c1c !important;
  }
  .row-subject-cell .subject-text {
    font-weight: 700 !important;
    color: #1a1c1c !important;
  }
  .row-meta .mail-time {
    font-weight: 700 !important;
    color: #1a1c1c !important;
  }
}

.dark :deep(.mail-row.is-unread) {
  background: #0f0f0f;
  .row-sender .mail-name { color: #ffffff !important; }
  .row-subject-cell .subject-text { color: #ffffff !important; }
  .row-meta .mail-time { color: #cccccc !important; }
}

:deep(.mail-row:not(.is-unread)) {
  .row-sender .mail-name { opacity: 0.65; }
  .row-subject-cell .subject-text { opacity: 0.65; }
}

/* ── Context menu ─────────────────────────────────────────── */
.ctx-item {
  display: flex;
  align-items: center;
  gap: 10px;

  &.danger { color: #bc0000; }
}

:deep(.el-dropdown-menu__item:last-child) { padding-bottom: 8px; }
:deep(.el-dropdown-menu__item:first-child) { padding-top: 8px; }
:deep(.el-dropdown-menu__item) { padding: 6px 14px; }
</style>

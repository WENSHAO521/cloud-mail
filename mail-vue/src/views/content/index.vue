<template>
  <!-- Empty state: no email selected — matches vfasky's empty detail panel -->
  <div v-if="!email" class="detail-empty surface-card">
    <Icon icon="material-symbols:mark-email-unread-outline-rounded" width="40" height="40" class="empty-icon"/>
    <span class="empty-text">{{ $t('selectEmailHint') }}</span>
  </div>

  <!-- Email view: surface-card floating card -->
  <article v-else class="surface-card email-detail">

    <!-- Header: min-h-16, circular icon-buttons -->
    <header class="detail-header">
      <div class="header-left">
        <!-- Back button: always visible; clears selection on desktop, triggers mobile nav -->
        <button class="icon-btn detail-back-btn" @click="handleBack">
          <Icon icon="material-symbols-light:arrow-back-ios-new" width="20" height="20" />
        </button>
        <button v-perm="'email:delete'" class="icon-btn icon-danger" @click="handleDelete">
          <Icon icon="material-symbols:delete-outline-rounded" width="19" height="19" />
        </button>
        <button class="icon-btn" @click="changeStar" v-if="emailStore.contentData.showStar">
          <Icon :icon="email.isStar ? 'fluent-color:star-16' : 'solar:star-line-duotone'"
                :width="email.isStar ? 20 : 18" :height="email.isStar ? 20 : 18" />
        </button>
        <template v-if="emailStore.contentData.showReply">
          <button class="icon-btn" v-perm="'email:send'" @click="openReply">
            <Icon icon="la:reply" width="21" height="21" />
          </button>
          <button class="icon-btn" v-perm="'email:send'" @click="openReplyAll">
            <Icon icon="la:reply-all" width="22" height="22" />
          </button>
          <button class="icon-btn" v-perm="'email:send'" @click="openForward">
            <Icon icon="iconoir:arrow-up-right" width="20" height="20" />
          </button>
        </template>
      </div>
      <span class="page-counter" v-if="emailStore.contentData.emailTotal > 0">
        {{ emailStore.contentData.emailIndex }}&thinsp;/&thinsp;{{ emailStore.contentData.emailTotal }}
      </span>
    </header>

    <!-- Scrollable content -->
    <el-scrollbar class="detail-scroll">
      <div class="detail-content">

        <h1 class="email-title">{{ email.subject }}</h1>

        <div class="meta-section">
          <div class="meta-left">
            <div class="meta-avatar" :style="{ background: metaAvatarBg }">
              <span class="meta-initial">{{ (email.name || email.sendEmail || '?')[0].toUpperCase() }}</span>
              <img v-if="metaAvatarImg" :src="metaAvatarImg" class="meta-avatar-img"
                   @error="e => { e.target.style.display='none'; markGravatarMiss(email.sendEmail) }" />
            </div>
            <div class="meta-info">
              <div class="meta-sender-name">{{ email.name || email.sendEmail }}</div>
              <div class="meta-sender-email">{{ email.sendEmail }}</div>
              <div class="meta-to" v-if="formateReceive(email.recipient)">
                <span class="meta-label">{{ $t('recipient') }}:</span>
                <span class="meta-value">{{ formateReceive(email.recipient) }}</span>
              </div>
              <div class="meta-to" v-if="parsedCc.length > 0">
                <span class="meta-label">{{ $t('cc') }}:</span>
                <span class="meta-value">{{ parsedCc.join(', ') }}</span>
              </div>
              <div class="meta-to" v-if="parsedBcc.length > 0">
                <span class="meta-label">{{ $t('bcc') }}:</span>
                <span class="meta-value">{{ parsedBcc.join(', ') }}</span>
              </div>
            </div>
          </div>
          <div class="meta-right">
            <span class="meta-date">{{ formatDetailDate(email.createTime) }}</span>
            <el-alert v-if="email.status === 3" :closable="false" :title="toMessage(email.message)"
                      class="email-msg" type="error" show-icon />
            <el-alert v-if="email.status === 4" :closable="false" :title="$t('complained')"
                      class="email-msg" type="warning" show-icon />
            <el-alert v-if="email.status === 5" :closable="false" :title="$t('delayed')"
                      class="email-msg" type="warning" show-icon />
          </div>
        </div>

        <div class="email-body">
          <ShadowHtml class="shadow-html" :html="formatImage(email.content)" v-if="email.content" />
          <pre v-else class="email-text">{{ email.text }}</pre>
        </div>

        <div class="att-container" v-if="email.attList && email.attList.length > 0">
          <div class="att-header">
            <span class="att-title-text">{{ $t('attachments') }}</span>
            <span class="att-count">{{ $t('attCount', { total: email.attList.length }) }}</span>
          </div>
          <div class="att-list">
            <div class="att-item" v-for="att in email.attList" :key="att.attId" @click="showImage(att.key)">
              <Icon v-bind="getIconByName(att.filename)" class="att-icon-file" />
              <span class="att-name">{{ att.filename }}</span>
              <span class="att-size">{{ formatBytes(att.size) }}</span>
              <div class="att-actions">
                <button v-if="isImage(att.filename)" class="icon-btn-sm" @click.stop="showImage(att.key)">
                  <Icon icon="hugeicons:view" width="18" height="18" />
                </button>
                <a class="icon-btn-sm" :href="cvtR2Url(att.key)" download @click.stop>
                  <Icon icon="material-symbols:download-rounded" width="18" height="18" />
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </el-scrollbar>
  </article>

  <el-image-viewer v-if="showPreview" :url-list="srcList" show-progress @close="showPreview = false" />
</template>

<script setup>
import ShadowHtml from '@/components/shadow-html/index.vue'
import { reactive, ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { emailDelete, emailRead } from '@/request/email.js'
import { Icon } from '@iconify/vue'
import { useEmailStore } from '@/store/email.js'
import { useAccountStore } from '@/store/account.js'
import { useUiStore } from '@/store/ui.js'
import { useSettingStore } from '@/store/setting.js'
import { formatDetailDate } from '@/utils/day.js'
import { starAdd, starCancel } from '@/request/star.js'
import { getExtName, formatBytes } from '@/utils/file-utils.js'
import { cvtR2Url, toOssDomain } from '@/utils/convert.js'
import { getIconByName } from '@/utils/icon-utils.js'
import { allEmailDelete } from '@/request/all-email.js'
import { useI18n } from 'vue-i18n'
import { EmailUnreadEnum } from '@/enums/email-enum.js'
import { avatarBg, storedAvatar, gravatarCandidate, markGravatarMiss } from '@/utils/avatar.js'
import { useAvatarCacheStore } from '@/store/avatar-cache.js'

const emit = defineEmits(['back'])

const uiStore = useUiStore()
const settingStore = useSettingStore()
const accountStore = useAccountStore()
const emailStore = useEmailStore()
const avatarCache = useAvatarCacheStore()
const { t } = useI18n()

// Reactive reference to the currently selected email
const email = computed(() => emailStore.contentData.email)

const metaAvatarImg = computed(() =>
  avatarCache.get(email.value?.sendEmail)
  || storedAvatar(email.value?.sendEmail)
  || gravatarCandidate(email.value?.sendEmail)
)
const metaAvatarBg = computed(() => avatarBg(email.value?.sendEmail || email.value?.name || ''))

const showPreview = ref(false)
const srcList = reactive([])

const parsedCc  = computed(() => parseAddressList(email.value?.cc))
const parsedBcc = computed(() => parseAddressList(email.value?.bcc))

// Mark as read when email opens
watch(email, (newEmail) => {
  if (newEmail && emailStore.contentData.showUnread && newEmail.unread === EmailUnreadEnum.UNREAD) {
    newEmail.unread = EmailUnreadEnum.READ
    emailRead([newEmail.emailId])
  }
  if (!newEmail) emailStore.contentData.showUnread = false
}, { immediate: true })

// Clear on account switch
watch(() => accountStore.currentAccountId, () => {
  emailStore.contentData.email = null
})

function handleBack() {
  emailStore.contentData.email = null
  emit('back')
}

function openReply()    { uiStore.writerRef.openReply(email.value) }
function openReplyAll() { uiStore.writerRef.openReplyAll(email.value) }
function openForward()  { uiStore.writerRef.openForward(email.value) }

function toMessage(message) {
  return message ? JSON.parse(message).message : ''
}

function formatImage(content) {
  content = content || ''
  const domain = settingStore.settings.r2Domain
  return content.replace(/{{domain}}/g, toOssDomain(domain) + '/')
}

function showImage(key) {
  if (!isImage(key)) return
  const url = cvtR2Url(key)
  srcList.length = 0
  srcList.push(url)
  showPreview.value = true
}

function isImage(filename) {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'jfif', 'webp'].includes(getExtName(filename))
}

function formateReceive(recipient) {
  try { return JSON.parse(recipient || '[]').map(item => item.address).join(', ') }
  catch { return '' }
}

function parseAddressList(raw) {
  try {
    const list = JSON.parse(raw || '[]')
    return list.map(item => (typeof item === 'string' ? item : item.address)).filter(Boolean)
  } catch { return [] }
}

function changeStar() {
  const e = email.value
  if (!e) return
  if (e.isStar) {
    e.isStar = 0
    starCancel(e.emailId).then(() => {
      e.isStar = 0
      emailStore.cancelStarEmailId = e.emailId
      setTimeout(() => emailStore.cancelStarEmailId = 0)
      emailStore.starScroll?.deleteEmail([e.emailId])
    }).catch(() => { e.isStar = 1 })
  } else {
    e.isStar = 1
    starAdd(e.emailId).then(() => {
      e.isStar = 1
      emailStore.addStarEmailId = e.emailId
      setTimeout(() => emailStore.addStarEmailId = 0)
      emailStore.starScroll?.addItem(e)
    }).catch(() => { e.isStar = 0 })
  }
}

function handleDelete() {
  const e = email.value
  if (!e) return
  ElMessageBox.confirm(t('delEmailConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    const doDelete = emailStore.contentData.delType === 'logic'
      ? emailDelete(e.emailId)
      : allEmailDelete(e.emailId)
    doDelete.then(() => {
      ElMessage({ message: t('delSuccessMsg'), type: 'success', plain: true })
      emailStore.deleteIds = [e.emailId]
      emailStore.contentData.email = null
    })
  })
}
</script>

<style scoped lang="scss">
/* ── Shared: both empty + email take full height ─────────── */
.detail-empty,
.email-detail {
  width: 100%;
  height: 100%;
}

/* ── Empty state ─────────────────────────────────────────── */
.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 4px;
  background: var(--surface, #ffffff);
  border: 1px solid color-mix(in srgb, var(--separator, #e5e5e5) 80%, transparent);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.05);

  .empty-icon { color: var(--muted, #666666); opacity: 0.5; }

  .empty-text {
    font-size: 14px;
    color: var(--muted, #666666);
  }
}

/* ── surface-card ────────────────────────────────────────── */
.email-detail {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 4px;
  background: var(--surface, #ffffff);
  border: 1px solid color-mix(in srgb, var(--separator, #e5e5e5) 80%, transparent);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.05);

  @media (max-width: 760px) {
    border-radius: 0;
    box-shadow: none;
    border: none;
  }
}

/* ── Header ──────────────────────────────────────────────── */
.detail-header {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--separator, #e5e5e5);
  flex-shrink: 0;
}

.header-left { display: flex; align-items: center; gap: 2px; }

/* Back button: hidden on desktop, visible on mobile */
.detail-back-btn {
  @media (min-width: 761px) { display: none; }
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: var(--muted, #666666);
  transition: background 0.12s ease, color 0.12s ease;
  flex-shrink: 0;

  @media (hover: hover) {
    &:hover { background: rgba(0,0,0,0.07); color: var(--el-text-color-primary); }
    &.icon-danger:hover { background: rgba(176,0,0,0.10); color: #b00000; }
  }
}

.icon-btn-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: var(--muted, #666666);
  text-decoration: none;
  transition: background 0.12s ease, color 0.12s ease;

  @media (hover: hover) {
    &:hover { background: rgba(0,0,0,0.07); color: var(--el-text-color-primary); }
  }
}

.page-counter {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: var(--muted, #666666);
  white-space: nowrap;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}

/* ── Scroll ──────────────────────────────────────────────── */
.detail-scroll { flex: 1; min-height: 0; }

.detail-content {
  padding: 28px;
  max-width: 980px;
  @media (max-width: 1024px) { padding: 20px; }
  @media (max-width: 767px)  { padding: 14px; }
}

/* ── Subject ─────────────────────────────────────────────── */
.email-title {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
  margin: 0 0 32px;
  word-break: break-word;
}

/* ── Meta ────────────────────────────────────────────────── */
.meta-section {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.meta-left { display: flex; align-items: flex-start; gap: 16px; min-width: 0; flex: 1; }

.meta-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  .meta-initial { color: #fff; font-size: 20px; font-weight: 700; line-height: 1; }
  .meta-avatar-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
}

.meta-info { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 4px; }

.meta-sender-name {
  font-size: 17px; font-weight: 600; color: var(--el-text-color-primary);
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
}

.meta-sender-email {
  font-size: 13px; color: var(--muted, #666666);
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
}

.meta-to {
  display: flex; align-items: baseline; gap: 6px;
  font-size: 13px; color: var(--muted, #666666); flex-wrap: wrap;
}
.meta-label { font-weight: 500; color: var(--muted, #666666); flex-shrink: 0; }
.meta-value { color: var(--el-text-color-primary); word-break: break-word; }

.meta-right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0;
}
.meta-date {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px; color: var(--muted, #666666);
  white-space: nowrap; font-variant-numeric: tabular-nums;
}
.email-msg { margin-top: 4px; }

/* ── Body ────────────────────────────────────────────────── */
.email-body { font-size: 17px; line-height: 2; color: var(--el-text-color-primary); word-break: break-word; }

.shadow-html::after {
  content: ""; position: absolute; inset: 0;
  background: var(--message-block-color); pointer-events: none;
}

.email-text {
  font-family: 'IBM Plex Mono', 'Courier New', monospace;
  white-space: pre-wrap; word-break: break-word;
  margin: 0; font-size: 14px; line-height: 1.8; color: var(--muted, #666666);
}

/* ── Attachments ─────────────────────────────────────────── */
.att-container {
  margin-top: 40px; max-width: 560px;
  border-radius: 4px; border: 1px solid var(--separator, #e5e5e5); padding: 16px;
}
.att-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
}
.att-title-text { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.att-count { font-size: 13px; color: var(--muted, #666666); }
.att-list { display: flex; flex-direction: column; gap: 6px; }

.att-item {
  display: flex; align-items: center; gap: 10px;
  border-radius: 10px; background: var(--surface-secondary, #f0f0f0);
  padding: 8px 12px; cursor: pointer; transition: background 0.12s ease;

  @media (hover: hover) {
    &:hover { background: color-mix(in srgb, var(--surface-secondary, #f0f0f0) 70%, var(--separator, #e5e5e5)); }
  }

  .att-icon-file { flex-shrink: 0; color: var(--muted, #666666); }
  .att-name { flex: 1; min-width: 0; font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .att-size { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted, #666666); flex-shrink: 0; white-space: nowrap; }
  .att-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
}
</style>

/* Global: blockquote inside shadow-html */
<style>
.psg-shadow-blockquote,
.shadow-html-host blockquote,
blockquote {
  border-left: 3px solid #b00000 !important;
  padding-left: 16px !important;
  margin: 16px 0 !important;
  color: #666666 !important;
}
</style>

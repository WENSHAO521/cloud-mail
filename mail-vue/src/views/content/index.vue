<template>
  <div class="box">
    <div class="header-actions">
      <Icon class="icon" icon="material-symbols-light:arrow-back-ios-new" width="20" height="20" @click="handleBack"/>
      <div class="header-divider"></div>
      <Icon v-perm="'email:delete'" class="icon danger" icon="material-symbols:delete-outline-rounded" width="19" height="19" @click="handleDelete"/>
      <Icon class="icon" @click="changeStar" v-if="emailStore.contentData.showStar && email.isStar" icon="fluent-color:star-16" width="20" height="20"/>
      <Icon class="icon" @click="changeStar" v-if="emailStore.contentData.showStar && !email.isStar" icon="solar:star-line-duotone" width="18" height="18"/>
      <div class="header-divider" v-if="emailStore.contentData.showReply"></div>
      <Icon class="icon" v-if="emailStore.contentData.showReply" v-perm="'email:send'" @click="openReply" icon="la:reply" width="21" height="21" />
      <Icon class="icon" v-if="emailStore.contentData.showReply" v-perm="'email:send'" @click="openReplyAll" icon="la:reply-all" width="22" height="22" />
      <Icon class="icon" v-if="emailStore.contentData.showReply" v-perm="'email:send'" @click="openForward" icon="iconoir:arrow-up-right" width="20" height="20" />
    </div>
    <div></div>
    <el-scrollbar class="scrollbar">
      <div class="container">
        <div class="email-title">
          {{ email.subject }}
        </div>
        <div class="content">
          <div class="email-meta">
            <div class="meta-avatar" :style="{ background: metaAvatarBg, border: 'none' }">
              <span>{{ (email.name || email.sendEmail || '?')[0].toUpperCase() }}</span>
              <img v-if="metaAvatarImg"
                   :src="metaAvatarImg"
                   class="meta-avatar-img"
                   @error="e => { e.target.style.display='none'; markGravatarMiss(email.sendEmail) }"/>
            </div>
            <div class="meta-body">
              <div class="meta-top">
                <div class="meta-identity">
                  <span class="meta-sender-name">{{ email.name }}</span>
                  <span class="meta-sender-email">{{ email.sendEmail }}</span>
                </div>
                <div class="meta-date">{{ formatDetailDate(email.createTime) }}</div>
              </div>
              <div class="meta-to">
                <span class="meta-label">{{ $t('recipient') }}</span>
                <span class="meta-recipients">{{ formateReceive(email.recipient) }}</span>
              </div>
              <div class="meta-to" v-if="parsedCc.length > 0">
                <span class="meta-label">{{ $t('cc') }}</span>
                <span class="meta-recipients">{{ parsedCc.join(', ') }}</span>
              </div>
              <div class="meta-to" v-if="parsedBcc.length > 0">
                <span class="meta-label">{{ $t('bcc') }}</span>
                <span class="meta-recipients">{{ parsedBcc.join(', ') }}</span>
              </div>
              <el-alert v-if="email.status === 3" :closable="false" :title="toMessage(email.message)" class="email-msg" type="error" show-icon />
              <el-alert v-if="email.status === 4" :closable="false" :title="$t('complained')" class="email-msg" type="warning" show-icon />
              <el-alert v-if="email.status === 5" :closable="false" :title="$t('delayed')" class="email-msg" type="warning" show-icon />
            </div>
          </div>
          <el-scrollbar class="htm-scrollbar" :class="email.attList.length === 0 ? 'bottom-distance' : ''">
            <ShadowHtml class="shadow-html" :html="formatImage(email.content)" v-if="email.content" />
            <pre v-else class="email-text" >{{email.text}}</pre>
          </el-scrollbar>
          <div class="att" v-if="email.attList.length > 0">
            <div class="att-title">
              <span>{{$t('attachments')}}</span>
              <span>{{$t('attCount',{total: email.attList.length})}}</span>
            </div>
            <div class="att-box">

              <div class="att-item" v-for="att in email.attList" :key="att.attId">
                <div class="att-icon" @click="showImage(att.key)">
                  <Icon v-bind="getIconByName(att.filename)" />
                </div>
                <div class="att-name" @click="showImage(att.key)">
                  {{ att.filename }}
                </div>
                <div class="att-size">{{ formatBytes(att.size) }}</div>
                <div class="opt-icon att-icon">
                  <Icon v-if="isImage(att.filename)" icon="hugeicons:view" width="22" height="22" @click="showImage(att.key)"/>
                  <a :href="cvtR2Url(att.key)" download>
                    <Icon icon="system-uicons:push-down" width="22" height="22"/>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <el-image-viewer
        v-if="showPreview"
        :url-list="srcList"
        show-progress
        @close="showPreview = false"
    />
  </div>
</template>
<script setup>
import ShadowHtml from '@/components/shadow-html/index.vue'
import {reactive, ref, watch, onMounted, onUnmounted} from "vue";
import {useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {emailDelete, emailRead} from "@/request/email.js";
import {Icon} from "@iconify/vue";
import {useEmailStore} from "@/store/email.js";
import {useAccountStore} from "@/store/account.js";
import {formatDetailDate} from "@/utils/day.js";
import {starAdd, starCancel} from "@/request/star.js";
import {getExtName, formatBytes} from "@/utils/file-utils.js";
import {cvtR2Url,toOssDomain} from "@/utils/convert.js";
import {getIconByName} from "@/utils/icon-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {allEmailDelete} from "@/request/all-email.js";
import {useUiStore} from "@/store/ui.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";
import {avatarBg, storedAvatar, gravatarCandidate, markGravatarMiss} from "@/utils/avatar.js";
import {useAvatarCacheStore} from "@/store/avatar-cache.js";
import {computed} from "vue";

const uiStore = useUiStore();
const settingStore = useSettingStore();
const accountStore = useAccountStore();
const emailStore = useEmailStore();
const router = useRouter()
const email = emailStore.contentData.email
const avatarCache = useAvatarCacheStore()
const metaAvatarImg = computed(() =>
    avatarCache.get(email.sendEmail)        // server (cross-device, reactive)
    || storedAvatar(email.sendEmail)        // local cache
    || gravatarCandidate(email.sendEmail)   // gravatar fallback
)
const metaAvatarBg = computed(() => avatarBg(email.sendEmail || email.name || ''))
const showPreview = ref(false)
const srcList = reactive([])

const { t } = useI18n()
watch(() => accountStore.currentAccountId, () => {
  handleBack()
})

onMounted(() => {
  if (emailStore.contentData.showUnread && email.unread === EmailUnreadEnum.UNREAD) {
    email.unread = EmailUnreadEnum.READ;
    emailRead([email.emailId]);
  }
})

onUnmounted(() => {
  emailStore.contentData.showUnread = false;
})

function openReply() {
  uiStore.writerRef.openReply(email)
}

function openReplyAll() {
  uiStore.writerRef.openReplyAll(email)
}

function openForward() {
  uiStore.writerRef.openForward(email)
}

function toMessage(message) {
  return  message ? JSON.parse(message).message : '';
}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return  content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function showImage(key) {
  if (!isImage(key)) return;
  const url = cvtR2Url(key)
  srcList.length = 0
  srcList.push(url)
  showPreview.value = true
}

function isImage(filename) {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif','jfif'].includes(getExtName(filename))
}

function formateReceive(recipient) {
  try {
    return JSON.parse(recipient || '[]').map(item => item.address).join(', ')
  } catch { return '' }
}

function parseAddressList(raw) {
  try {
    const list = JSON.parse(raw || '[]')
    return list.map(item => (typeof item === 'string' ? item : item.address)).filter(Boolean)
  } catch { return [] }
}

const parsedCc  = computed(() => parseAddressList(email.cc))
const parsedBcc = computed(() => parseAddressList(email.bcc))

function changeStar() {
  if (email.isStar) {
    email.isStar = 0;
    starCancel(email.emailId).then(() => {
      email.isStar = 0;
      emailStore.cancelStarEmailId = email.emailId
      setTimeout(() => emailStore.cancelStarEmailId = 0)
      emailStore.starScroll?.deleteEmail([email.emailId])
    }).catch((e) => {
      console.error(e)
      email.isStar = 1;
    })
  } else {
    email.isStar = 1;
    starAdd(email.emailId).then(() => {
      email.isStar = 1;
      emailStore.addStarEmailId = email.emailId
      setTimeout(() => emailStore.addStarEmailId = 0)
      emailStore.starScroll?.addItem(email)
    }).catch((e) => {
      console.error(e)
      email.isStar = 0;
    })
  }
}

const handleBack = () => {
  router.back()
}

const handleDelete = () => {
  ElMessageBox.confirm(t('delEmailConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    if (emailStore.contentData.delType === 'logic') {
      emailDelete(email.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.emailId]
      })
    } else  {

      allEmailDelete(email.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.emailId]
      })
    }

    router.back()
  })
}
</script>
<style scoped lang="scss">
.box {
  height: 100%;
  overflow: hidden;
  background: var(--psg-bg, #f7f7f7);
}

/* ── Toolbar — flat, no blur, fast rendering ── */
.header-actions {
  padding: 0 20px;
  height: 48px;
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.header-divider {
  width: 1px;
  height: 16px;
  background: var(--light-border-color);
  margin: 0 6px;
  flex-shrink: 0;
}

.star {
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--regular-text-color);
  transition: background 0.14s var(--ease-out), color 0.14s;
  flex-shrink: 0;

  @media (hover: hover) {
    &:hover {
      background: var(--base-fill);
      color: var(--el-text-color-primary);
    }
    &.danger:hover {
      background: rgba(204, 0, 0, 0.07);
      color: #b00000;
    }
  }
}

/* ── Reading area ── */
.scrollbar {
  height: calc(100% - 48px);
  width: 100%;
}

/* White document card wrapper */
.container {
  font-size: 14.5px;
  max-width: 860px;
  margin: 24px auto;
  padding: 0;
  background: #ffffff;
  border: 1px solid var(--psg-border, #e5e7eb);
  border-radius: 3px;
  border-top: 3px solid #b00000;
  box-shadow: var(--card-shadow);
  overflow: hidden;

  /* inner content padding */
  > * {
    padding-left: 48px;
    padding-right: 48px;
  }
  > .email-title { padding-top: 40px; }
  > .att { padding-bottom: 32px; }
  > .content { padding-bottom: 0; }

  @media (max-width: 1200px) {
    margin: 16px;
    > * { padding-left: 28px; padding-right: 28px; }
    > .email-title { padding-top: 28px; }
  }
  @media (max-width: 767px) {
    margin: 8px;
    border-radius: 0;
    > * { padding-left: 16px; padding-right: 16px; }
    > .email-title { padding-top: 20px; }
  }
}

/* ── Subject ── */
.email-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.03em;
  color: var(--el-text-color-primary);
  margin-bottom: 32px;
  word-break: break-word;
}

/* ── Sender meta card ── */
.email-meta {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 0;
  margin: 0 0 24px;
  border-bottom: 1px solid var(--psg-border, #e5e7eb);
  background: transparent;
  transition: border-color 0.15s;
}

.meta-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(204, 0, 0, 0.09);
  color: #b00000;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: -0.02em;
  margin-top: 2px;
  position: relative;
  overflow: hidden;
}

.meta-avatar-img {
  position: absolute;
  inset: 0;
  width: 40px;
  height: 40px;
  object-fit: cover;
  display: block;
  border-radius: 8px;
}

.meta-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.meta-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-identity {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.meta-sender-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-sender-email {
  font-size: 12px;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--secondary-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-date {
  font-size: 11.5px;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--secondary-text-color);
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

.meta-to {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--secondary-text-color);
  flex-shrink: 0;
}

.meta-recipients {
  font-size: 12.5px;
  color: var(--regular-text-color);
  word-break: break-word;
}

.email-msg {
  margin-top: 8px;
  border-radius: 2px !important;
}

/* ── Content area ── */
.content {
  display: flex;
  flex-direction: column;
}

/* ── Attachments ── */
.att {
  margin-top: 32px;
  margin-bottom: 0;
  border: 1px solid var(--psg-border, #e5e7eb);
  border-top: 2px solid #111111;
  width: fit-content;

  .att-box {
    min-width: min(420px, calc(100vw - 80px));
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .att-title {
    padding: 12px 14px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    font-weight: 700;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--light-border-color);

    span:last-child {
      color: var(--secondary-text-color);
      font-weight: 400;
      text-transform: none;
      letter-spacing: 0;
    }
  }

  .att-item {
    cursor: pointer;
    background: transparent;
    padding: 10px 14px;
    border-left: 2px solid transparent;
    border-bottom: 1px solid var(--light-border-color);
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    transition: border-color 0.14s var(--ease-out), background 0.14s;

    &:last-child { border-bottom: none; }

    &:hover {
      background: var(--base-fill);
      border-left-color: #b00000;
    }

    .att-icon { display: grid; color: var(--regular-text-color); }

    .att-size {
      color: var(--secondary-text-color);
      font-size: 11.5px;
      font-family: 'IBM Plex Mono', monospace;
    }

    .att-name {
      margin-left: 10px;
      margin-right: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 13px;
      color: var(--el-text-color-primary);
    }

    .opt-icon {
      padding-left: 12px;
      color: var(--secondary-text-color);
      align-items: center;
      display: flex;
      gap: 8px;
      transition: color 0.12s;

      &:hover { color: #b00000; }

      a {
        color: var(--secondary-text-color);
        align-items: center;
        display: flex;
        transition: color 0.12s;
        &:hover { color: #b00000; }
      }
    }
  }
}

.shadow-html::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--message-block-color);
  pointer-events: none;
}

.email-text {
  font-family: 'IBM Plex Mono', 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--regular-text-color);
}

.bottom-distance {
  margin-bottom: 40px;
}

/* Subject styling in card context */
.email-title {
  color: #111111;
  letter-spacing: -0.02em;
}
</style>

/* ── Global: blockquote inside shadow-html iframe ───────── */
<style>
.psg-shadow-blockquote,
.shadow-html-host blockquote,
blockquote {
  border-left: 3px solid #b00000 !important;
  padding-left: 16px !important;
  margin: 16px 0 !important;
  color: #6b7280 !important;
}
</style>

<template>
  <div class="settings-page">

    <header class="page-head">
      <h1 class="page-h1">{{ $t('settings') }}</h1>
    </header>

    <!-- ── Bento top row ── -->
    <div class="bento-row">

      <!-- LEFT: Profile card -->
      <div class="bento-card profile-card">
        <div class="card-label">{{ $t('profile') }}</div>

        <div class="avatar-strip">
          <div class="avatar-wrap" @click="triggerUpload">
            <img v-if="userStore.avatar" :src="userStore.avatar" class="avatar-img"/>
            <div v-else class="avatar-init">{{ userInitial }}</div>
            <div class="avatar-lens">
              <Icon icon="solar:camera-add-bold" width="18" height="18"/>
            </div>
            <input ref="fileInputRef" type="file" accept="image/*"
                   style="display:none" @change="handleFileChange"/>
          </div>
          <div class="avatar-meta">
            <div class="meta-name">{{ userStore.user.name || userStore.user.email }}</div>
            <div class="meta-email">{{ userStore.user.email }}</div>
            <div class="meta-role" v-if="userStore.user.role?.name">{{ userStore.user.role.name }}</div>
            <div class="avatar-links">
              <button class="link-btn" @click="triggerUpload">{{ $t('uploadAvatar') }}</button>
              <button class="link-btn dim" v-if="userStore.avatar" @click="removeAvatar">{{ $t('removeAvatar') }}</button>
            </div>
          </div>
        </div>

        <div class="data-table">
          <div class="data-row">
            <span class="data-key">{{ $t('username') }}</span>
            <div class="data-val">
              <template v-if="setNameShow">
                <el-input v-model="accountName" size="small" style="width:140px"/>
                <button class="link-btn" @click="setName">{{ $t('save') }}</button>
                <button class="link-btn dim" @click="setNameShow = false">{{ $t('cancel') }}</button>
              </template>
              <template v-else>
                <span class="val-str">{{ userStore.user.name || '—' }}</span>
                <button class="link-btn" @click="showSetName">{{ $t('change') }}</button>
              </template>
            </div>
          </div>
          <div class="data-row">
            <span class="data-key">{{ $t('emailAccount') }}</span>
            <span class="val-str mono">{{ userStore.user.email }}</span>
          </div>
          <div class="data-row last">
            <span class="data-key">{{ $t('password') }}</span>
            <div class="data-val">
              <span class="val-str">••••••••</span>
              <button class="link-btn" @click="pwdShow = true">{{ $t('changePwdBtn') }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT column: Language + Auto-reply -->
      <div class="bento-right">

        <!-- Language card -->
        <div class="bento-card">
          <div class="card-label">{{ $t('language') }}</div>
          <el-select :model-value="langSelect" style="width:180px" @change="changeLang">
            <el-option label="中文" value="zh" @pointerdown.prevent.stop="changeLang('zh')"/>
            <el-option label="English" value="en" @pointerdown.prevent.stop="changeLang('en')"/>
          </el-select>
        </div>

        <!-- Auto-reply card -->
        <div class="bento-card autoreply-card">
          <div class="card-label-row">
            <div class="card-label">{{ $t('autoReply') }}</div>
            <el-switch v-model="autoReplyEnabled" @change="saveAutoReply"/>
          </div>
          <div class="card-sub">{{ $t('autoReplyDesc') }}</div>
          <transition name="expand">
            <div class="autoreply-body" v-if="autoReplyEnabled">
              <el-input
                v-model="autoReplyMessage"
                type="textarea" :rows="4"
                :placeholder="$t('autoReplyMessage')"
                resize="none"
              />
              <div class="row-action-bar">
                <el-button type="primary" size="small" :loading="autoReplySaving" @click="saveAutoReply">
                  {{ $t('save') }}
                </el-button>
              </div>
            </div>
          </transition>
        </div>

      </div>
    </div>

    <!-- ── Signature (full width) ── -->
    <div class="bento-card full-card">
      <div class="card-label-row">
        <div class="card-label">{{ $t('signature') }}</div>
        <el-button type="primary" size="small" :loading="signatureLoading" @click="saveSignature">
          {{ $t('save') }}
        </el-button>
      </div>
      <div class="card-sub">{{ $t('signatureDesc') }}</div>
      <div class="editor-shell">
        <tinyEditor
          ref="signatureEditorRef"
          :def-value="signatureText"
          editor-id="signature-editor"
          toolbar="bold italic underline | forecolor | link | code"
          height="160px"
          @change="onSignatureChange"
        />
      </div>
    </div>

    <!-- ── Danger zone ── -->
    <div class="bento-card danger-card-wrap" v-perm="'my:delete'">
      <div class="card-label red">{{ $t('dangerZone') }}</div>
      <div class="danger-inner">
        <div class="danger-text">
          <div class="danger-heading">{{ $t('deleteUserBtn') }}</div>
          <div class="danger-sub">{{ $t('delAccountMsg') }}</div>
        </div>
        <el-button type="danger" size="small" @click="deleteConfirm">
          {{ $t('deleteUserBtn') }}
        </el-button>
      </div>
    </div>

    <!-- Change password dialog -->
    <el-dialog v-model="pwdShow" :title="$t('changePassword')" width="380">
      <div class="pwd-form">
        <div class="pwd-field">
          <label class="pwd-label">{{ $t('newPassword') }}</label>
          <el-input type="password" v-model="form.password" autocomplete="off" show-password/>
        </div>
        <div class="pwd-field">
          <label class="pwd-label">{{ $t('confirmPassword') }}</label>
          <el-input type="password" v-model="form.newPwd" autocomplete="off" show-password/>
        </div>
        <el-button type="primary" :loading="setPwdLoading" @click="submitPwd" style="align-self:flex-end">
          {{ $t('save') }}
        </el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { reactive, ref, computed, defineOptions, onMounted } from 'vue'
import { resetPassword, userDelete } from "@/request/my.js"
import { useUserStore } from "@/store/user.js"
import router from "@/router/index.js"
import { accountSetName } from "@/request/account.js"
import { useAccountStore } from "@/store/account.js"
import { useI18n } from "vue-i18n"
import { useSettingStore } from "@/store/setting.js"
import { Icon } from "@iconify/vue"
import tinyEditor from "@/components/tiny-editor/index.vue"
import http from "@/axios/index.js"

const { t } = useI18n()
const accountStore = useAccountStore()
const settingStore = useSettingStore()
const userStore = useUserStore()
const setPwdLoading = ref(false)
const setNameShow = ref(false)
const accountName = ref(null)
const langSelect = ref(settingStore.lang)
const fileInputRef = ref(null)
const pwdShow = ref(false)
const form = reactive({ password: '', newPwd: '' })
const signatureText = ref('')
const signatureLoading = ref(false)
const signatureEditorRef = ref(null)
const autoReplyEnabled = ref(false)
const autoReplyMessage = ref('')
const autoReplySaving = ref(false)

defineOptions({ name: 'setting' })

onMounted(() => {
  userStore.loadAvatar()
  signatureText.value = userStore.user.signature || ''
  http.get('/autoReply/get').then(data => {
    autoReplyEnabled.value = !!data.enabled
    autoReplyMessage.value = data.message || ''
  }).catch(() => {})
})

const userInitial = computed(() => {
  const name = userStore.user?.name?.trim()
  if (name) return name[0].toUpperCase()
  return userStore.user?.email?.[0]?.toUpperCase() || '?'
})

function triggerUpload() { fileInputRef.value?.click() }

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  compressImage(file, 200).then(base64 => { userStore.saveAvatar(base64) })
  e.target.value = ''
}

function compressImage(file, maxPx = 200) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

function removeAvatar() { userStore.clearAvatar() }

function showSetName() {
  accountName.value = userStore.user.name
  setNameShow.value = true
}

function setName() {
  if (!accountName.value) {
    ElMessage({ message: t('emptyUserNameMsg'), type: 'error', plain: true })
    return
  }
  setNameShow.value = false
  const name = accountName.value
  if (name === userStore.user.name) return
  userStore.user.name = name
  accountSetName(userStore.user.account.accountId, name).then(() => {
    ElMessage({ message: t('saveSuccessMsg'), type: 'success', plain: true })
    accountStore.changeUserAccountName = name
  }).catch(() => { userStore.user.name = name })
}

function onSignatureChange(html) { signatureText.value = html }

async function saveSignature() {
  signatureLoading.value = true
  try {
    const html = signatureEditorRef.value?.getContent?.() ?? signatureText.value
    await userStore.saveSignature(html)
    ElMessage({ message: t('signatureSaved'), type: 'success', plain: true })
  } finally { signatureLoading.value = false }
}

async function saveAutoReply() {
  autoReplySaving.value = true
  try {
    await http.put('/autoReply/set', { enabled: autoReplyEnabled.value, message: autoReplyMessage.value })
    ElMessage({ message: t('autoReplySaved'), type: 'success', plain: true })
  } finally { autoReplySaving.value = false }
}

function changeLang(lang) {
  let setting = {}
  try { setting = JSON.parse(localStorage.getItem('setting') || '{}') } catch {}
  localStorage.setItem('setting', JSON.stringify({ ...setting, lang }))
  window.location.reload()
}

const deleteConfirm = () => {
  ElMessageBox.confirm(t('delAccountConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    userDelete().then(() => {
      localStorage.removeItem('token')
      router.replace('/login')
      ElMessage({ message: t('delSuccessMsg'), type: 'success', plain: true })
    })
  })
}

function submitPwd() {
  if (!form.password) {
    ElMessage({ message: t('emptyPwdMsg'), type: 'error', plain: true })
    return
  }
  if (form.password.length < 6) {
    ElMessage({ message: t('pwdLengthMsg'), type: 'error', plain: true })
    return
  }
  if (form.password !== form.newPwd) {
    ElMessage({ message: t('confirmPwdFailMsg'), type: 'error', plain: true })
    return
  }
  setPwdLoading.value = true
  resetPassword(form.password).then(() => {
    ElMessage({ message: t('saveSuccessMsg'), type: 'success', plain: true })
    pwdShow.value = false
    form.password = ''
    form.newPwd = ''
  }).finally(() => { setPwdLoading.value = false })
}
</script>

<style scoped lang="scss">
/* ═══════════════════════════════════════
   PAGE SHELL
═══════════════════════════════════════ */
.settings-page {
  max-width: 860px;
  padding: 28px 48px 40px;

  @media (max-width: 960px) {
    padding: 20px 24px 32px;
  }
  @media (max-width: 640px) {
    padding: 16px 16px 24px;
  }
}

/* ── Page heading ── */
.page-head {
  padding-bottom: 14px;
  margin-bottom: 0;
  border-bottom: 2px solid var(--el-text-color-primary);
}

.page-h1 {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  color: var(--el-text-color-primary);
  line-height: 1;
}

/* ═══════════════════════════════════════
   BENTO GRID
═══════════════════════════════════════ */
.bento-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
}

.bento-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bento-card {
  border: 1px solid var(--light-border-color);
  border-radius: 4px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  &.full-card { margin-bottom: 12px; }
  &.autoreply-card { flex: 1; }
}

.card-label {
  font-size: 10.5px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--el-text-color-primary);

  &.red { color: #CC0000; }
}

.card-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-sub {
  font-size: 12px;
  color: var(--secondary-text-color);
  margin-top: -8px;
  line-height: 1.5;
}

/* ═══════════════════════════════════════
   PROFILE SECTION
═══════════════════════════════════════ */
.avatar-strip {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.avatar-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  background: #111;

  &:hover .avatar-lens { opacity: 1; }
}

.avatar-img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}

.avatar-init {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 900;
  letter-spacing: -0.04em;
  color: #fff; user-select: none;
}

.avatar-lens {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.54);
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
  transition: opacity 0.15s cubic-bezier(0.22,1,0.36,1);
  color: #fff;
}

.avatar-meta {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 3px;
  padding-top: 2px;
}

.meta-name {
  font-size: 17px; font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  line-height: 1.2;
}

.meta-email {
  font-size: 12px;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--secondary-text-color);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.meta-role {
  display: inline-flex; align-items: center;
  font-size: 9px; font-weight: 900;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: #CC0000;
  background: rgba(204,0,0,0.07);
  border: 1px solid rgba(204,0,0,0.18);
  padding: 2px 7px; border-radius: 2px;
  width: fit-content; margin-top: 4px;
}

.avatar-links {
  display: flex; align-items: center; gap: 14px;
  margin-top: 10px;
}

/* ── Data table ── */
.data-table {
  border: 1px solid var(--light-border-color);
  border-radius: 3px; overflow: hidden;
}

.data-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  align-items: center;
  min-height: 50px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--light-border-color);
  gap: 16px;
  transition: background 0.14s cubic-bezier(0.22,1,0.36,1);

  &:hover { background: var(--base-fill); }
  &.last { border-bottom: none; }

  @media (max-width: 480px) {
    grid-template-columns: 80px 1fr;
    padding: 10px 12px;
  }
}

.data-key {
  font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.10em;
  color: var(--secondary-text-color); flex-shrink: 0;
}

.data-val {
  display: flex; align-items: center;
  gap: 12px; flex-wrap: wrap;
}

.val-str {
  font-size: 13.5px; color: var(--el-text-color-primary);
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis;

  &.mono {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px; color: var(--regular-text-color);
  }
}

/* ── Link buttons ── */
.link-btn {
  background: transparent; border: none; cursor: pointer;
  font-size: 12px; font-weight: 700;
  color: #CC0000; padding: 0;
  letter-spacing: 0.02em;
  transition: opacity 0.12s; user-select: none;
  font-family: inherit;

  &:hover { opacity: 0.65; }
  &.dim { color: var(--secondary-text-color); font-weight: 600; }
}

/* ═══════════════════════════════════════
   SIGNATURE / EDITOR
═══════════════════════════════════════ */
.editor-shell {
  border: 1px solid var(--light-border-color);
  border-radius: 2px; overflow: hidden;
  height: 160px;
}

.row-action-bar {
  display: flex; justify-content: flex-end;
}

/* ═══════════════════════════════════════
   AUTO-REPLY
═══════════════════════════════════════ */
.toggle-line {
  display: flex; align-items: center; gap: 12px;
}

.toggle-text {
  font-size: 13px; color: var(--regular-text-color);
}

.autoreply-body {
  display: flex; flex-direction: column; gap: 12px;
  overflow: hidden;
}

/* expand/collapse animation */
.expand-enter-active {
  transition: opacity 0.24s cubic-bezier(0.22,1,0.36,1),
              transform 0.24s cubic-bezier(0.22,1,0.36,1),
              max-height 0.28s cubic-bezier(0.22,1,0.36,1);
}
.expand-leave-active {
  transition: opacity 0.16s ease,
              transform 0.16s ease,
              max-height 0.20s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0; transform: translateY(-8px); max-height: 0;
}
.expand-enter-to, .expand-leave-from {
  opacity: 1; transform: translateY(0); max-height: 300px;
}

/* ═══════════════════════════════════════
   DANGER ZONE
═══════════════════════════════════════ */
.danger-card-wrap {
  border-color: rgba(204,0,0,0.22) !important;
  border-left: 3px solid #CC0000 !important;
  background: rgba(204,0,0,0.02);
}

.danger-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 520px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.danger-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }

.danger-heading {
  font-size: 13.5px; font-weight: 700;
  color: var(--el-text-color-primary);
}

.danger-sub {
  font-size: 12.5px; line-height: 1.5;
  color: var(--regular-text-color);
}

/* ═══════════════════════════════════════
   PASSWORD DIALOG
═══════════════════════════════════════ */
.pwd-form {
  display: flex; flex-direction: column; gap: 16px;
  padding: 4px 0 8px;
}

.pwd-field { display: flex; flex-direction: column; gap: 6px; }

.pwd-label {
  font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.10em;
  color: var(--secondary-text-color);
}
</style>

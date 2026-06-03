<template>
  <div class="settings-page">

    <!-- ── Page title ── -->
    <div class="page-title-block">
      <h1 class="page-title">{{ $t('settings') }}</h1>
    </div>

    <!-- ══════════════════════════════════════
         PROFILE
    ══════════════════════════════════════ -->
    <section class="block">
      <div class="block-header">
        <div class="block-label">{{ $t('profile') }}</div>
      </div>

      <!-- Avatar + identity -->
      <div class="profile-hero">
        <div class="avatar-zone" @click="triggerUpload">
          <img v-if="userStore.avatar" :src="userStore.avatar" class="avatar-img"/>
          <div v-else class="avatar-init">{{ userInitial }}</div>
          <div class="avatar-overlay">
            <Icon icon="solar:camera-add-bold" width="20" height="20"/>
          </div>
          <input ref="fileInputRef" type="file" accept="image/*"
                 style="display:none" @change="handleFileChange"/>
        </div>
        <div class="profile-identity">
          <div class="profile-name">{{ userStore.user.name || userStore.user.email }}</div>
          <div class="profile-email">{{ userStore.user.email }}</div>
          <div class="profile-role" v-if="userStore.user.role?.name">{{ userStore.user.role.name }}</div>
          <div class="avatar-actions">
            <button class="text-action" @click="triggerUpload">{{ $t('uploadAvatar') }}</button>
            <button class="text-action muted" v-if="userStore.avatar" @click="removeAvatar">{{ $t('removeAvatar') }}</button>
          </div>
        </div>
      </div>

      <!-- Info rows -->
      <div class="info-table">
        <div class="info-row">
          <span class="info-key">{{ $t('username') }}</span>
          <div class="info-val">
            <template v-if="setNameShow">
              <el-input v-model="accountName" size="small" style="width:180px"/>
              <button class="text-action" @click="setName">{{ $t('save') }}</button>
              <button class="text-action muted" @click="setNameShow = false">{{ $t('cancel') }}</button>
            </template>
            <template v-else>
              <span class="val-text">{{ userStore.user.name || '—' }}</span>
              <button class="text-action" @click="showSetName">{{ $t('change') }}</button>
            </template>
          </div>
        </div>
        <div class="info-row">
          <span class="info-key">{{ $t('emailAccount') }}</span>
          <span class="val-text mono">{{ userStore.user.email }}</span>
        </div>
        <div class="info-row last">
          <span class="info-key">{{ $t('password') }}</span>
          <div class="info-val">
            <span class="val-text">••••••••</span>
            <button class="text-action" @click="pwdShow = true">{{ $t('changePwdBtn') }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════
         LANGUAGE
    ══════════════════════════════════════ -->
    <section class="block">
      <div class="block-header">
        <div class="block-label">{{ $t('language') }}</div>
      </div>
      <el-select :model-value="langSelect" style="width:180px" @change="changeLang">
        <el-option label="中文" value="zh" @pointerdown.prevent.stop="changeLang('zh')"/>
        <el-option label="English" value="en" @pointerdown.prevent.stop="changeLang('en')"/>
      </el-select>
    </section>

    <!-- ══════════════════════════════════════
         EMAIL SIGNATURE
    ══════════════════════════════════════ -->
    <section class="block">
      <div class="block-header">
        <div class="block-label">{{ $t('signature') }}</div>
        <el-button type="primary" size="small" :loading="signatureLoading" @click="saveSignature" class="block-action">
          {{ $t('save') }}
        </el-button>
      </div>
      <div class="editor-frame">
        <tinyEditor
          ref="signatureEditorRef"
          :def-value="signatureText"
          editor-id="signature-editor"
          toolbar="bold italic underline | forecolor | link | code"
          height="160px"
          @change="onSignatureChange"
        />
      </div>
    </section>

    <!-- ══════════════════════════════════════
         AUTO-REPLY
    ══════════════════════════════════════ -->
    <section class="block">
      <div class="block-header">
        <div class="block-label">{{ $t('autoReply') }}</div>
        <el-switch v-model="autoReplyEnabled" @change="saveAutoReply" class="block-switch"/>
      </div>

      <transition name="slide-fade">
        <div class="autoreply-body" v-if="autoReplyEnabled">
          <el-input
            v-model="autoReplyMessage"
            type="textarea"
            :rows="4"
            :placeholder="$t('autoReplyMessage')"
            resize="none"
            class="autoreply-input"
          />
          <div class="autoreply-footer">
            <el-button type="primary" size="small" :loading="autoReplySaving" @click="saveAutoReply">
              {{ $t('save') }}
            </el-button>
          </div>
        </div>
      </transition>
    </section>

    <!-- ══════════════════════════════════════
         DANGER ZONE
    ══════════════════════════════════════ -->
    <section class="block danger-block" v-perm="'my:delete'">
      <div class="block-header">
        <div class="block-label danger-label">{{ $t('dangerZone') }}</div>
      </div>
      <div class="danger-card">
        <div class="danger-content">
          <div class="danger-title">{{ $t('deleteUserBtn') }}</div>
          <div class="danger-desc">{{ $t('delAccountMsg') }}</div>
        </div>
        <el-button type="danger" size="small" @click="deleteConfirm" class="danger-btn">
          {{ $t('deleteUserBtn') }}
        </el-button>
      </div>
    </section>

    <!-- ── Change password dialog ── -->
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
/* ── Page shell ── */
.settings-page {
  max-width: 680px;
  padding: 48px 56px 80px;
  display: flex;
  flex-direction: column;
  gap: 0;

  @media (max-width: 767px) {
    padding: 28px 20px 60px;
  }
}

/* ── Page title ── */
.page-title-block {
  margin-bottom: 48px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--el-text-color-primary);
}

.page-title {
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--el-text-color-primary);
  line-height: 1;
  text-transform: uppercase;
}

/* ── Section block ── */
.block {
  padding: 36px 0;
  border-bottom: 1px solid var(--light-border-color);

  &:last-child { border-bottom: none; }
}

.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.block-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--secondary-text-color);
  padding-left: 10px;
  border-left: 3px solid #CC0000;
  line-height: 1.2;
}

.block-action {
  border-radius: 2px !important;
  font-size: 12px !important;
  flex-shrink: 0;
}

.block-switch {
  flex-shrink: 0;
}

/* ── Profile hero ── */
.profile-hero {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 28px;

  @media (max-width: 520px) {
    flex-direction: column;
    gap: 16px;
  }
}

.avatar-zone {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  background: #111;

  &:hover .avatar-overlay { opacity: 1; }
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-init {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.04em;
  user-select: none;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s var(--ease-out, ease);
  color: #fff;
}

.profile-identity {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
}

.profile-name {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--el-text-color-primary);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-email {
  font-size: 12.5px;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--secondary-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-role {
  display: inline-flex;
  align-items: center;
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #CC0000;
  background: rgba(204,0,0,0.07);
  border: 1px solid rgba(204,0,0,0.18);
  padding: 2px 8px;
  border-radius: 2px;
  width: fit-content;
  margin-top: 4px;
}

.avatar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
}

/* ── Text action link ── */
.text-action {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  color: #CC0000;
  padding: 0;
  letter-spacing: 0.02em;
  transition: opacity 0.12s;
  user-select: none;

  &:hover { opacity: 0.7; }
  &.muted {
    color: var(--secondary-text-color);
    font-weight: 600;
  }
}

/* ── Info table ── */
.info-table {
  border: 1px solid var(--light-border-color);
  border-radius: 3px;
  overflow: hidden;
}

.info-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  min-height: 52px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--light-border-color);
  gap: 16px;
  transition: background 0.12s;

  &:hover { background: var(--base-fill); }
  &.last { border-bottom: none; }

  @media (max-width: 480px) {
    grid-template-columns: 90px 1fr;
    padding: 10px 14px;
  }
}

.info-key {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--secondary-text-color);
  flex-shrink: 0;
}

.info-val {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.val-text {
  font-size: 13.5px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &.mono {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    color: var(--regular-text-color);
  }
}

/* ── Editor frame ── */
.editor-frame {
  border: 1px solid var(--light-border-color);
  border-radius: 2px;
  overflow: hidden;
  height: 160px;
}

/* ── Auto-reply ── */
.autoreply-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.autoreply-input {
  :deep(.el-textarea__inner) {
    border-radius: 2px;
    font-size: 13.5px;
    line-height: 1.6;
    resize: none;
  }
}

.autoreply-footer {
  display: flex;
  justify-content: flex-end;
}

/* Slide transition for auto-reply body */
.slide-fade-enter-active {
  transition: opacity 0.22s var(--ease-out, ease), transform 0.22s var(--ease-out, ease);
}
.slide-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Danger section ── */
.danger-block {
  border-bottom: none;
}

.danger-label {
  color: #CC0000;
  border-left-color: #CC0000;
}

.danger-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 20px;
  border: 1px solid rgba(204,0,0,0.20);
  border-left: 3px solid #CC0000;
  border-radius: 2px;
  background: rgba(204,0,0,0.025);

  @media (max-width: 520px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.danger-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.danger-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.danger-desc {
  font-size: 12.5px;
  color: var(--regular-text-color);
  line-height: 1.5;
}

.danger-btn {
  flex-shrink: 0;
  border-radius: 2px !important;
}

/* ── Password dialog ── */
.pwd-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 8px;
}

.pwd-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pwd-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--secondary-text-color);
}
</style>

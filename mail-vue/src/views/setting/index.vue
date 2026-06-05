<template>
  <div class="settings-outer">

    <!-- Pill tabs — matches vfasky settings-tab-list -->
    <div class="settings-tab-list">
      <button class="settings-tab-button" :data-active="String(activeTab === 'details')" @click="activeTab = 'details'">
        {{ $t('details') }}
      </button>
      <button class="settings-tab-button" :data-active="String(activeTab === 'mail')" @click="activeTab = 'mail'">
        {{ $t('mailManagement') }}
      </button>
    </div>

    <!-- ── Details tab ─────────────────────────────────── -->
    <template v-if="activeTab === 'details'">
    <div class="settings-detail-grid">

      <!-- LEFT — main settings -->
      <div class="settings-main">

        <!-- ── PROFILE ── -->
        <section class="section" id="s-profile">
          <div class="section-head">
            <span class="section-label">{{ $t('profile') }}</span>
          </div>

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
                  <el-input v-model="accountName" size="small" style="width:160px"/>
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
        </section>

        <!-- ── LANGUAGE ── -->
        <section class="section" id="s-language">
          <div class="section-head">
            <span class="section-label">{{ $t('language') }}</span>
          </div>
          <div class="section-body">
          <el-select :model-value="langSelect" style="width:200px" @change="changeLang">
            <el-option label="中文" value="zh" @pointerdown.prevent.stop="changeLang('zh')"/>
            <el-option label="English" value="en" @pointerdown.prevent.stop="changeLang('en')"/>
          </el-select>
          </div>
        </section>

        <!-- ── SIGNATURE ── -->
        <section class="section" id="s-signature">
          <div class="section-head">
            <span class="section-label">{{ $t('signature') }}</span>
            <el-button type="primary" size="small" :loading="signatureLoading" @click="saveSignature" class="head-action">
              {{ $t('save') }}
            </el-button>
          </div>
          <div class="section-body">
          <div class="section-desc">{{ $t('signatureDesc') }}</div>
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
        </section>

        <!-- ── AUTO-REPLY ── -->
        <section class="section" id="s-autoreply">
          <div class="section-head">
            <span class="section-label">{{ $t('autoReply') }}</span>
            <el-switch v-model="autoReplyEnabled" @change="saveAutoReply"/>
          </div>
          <div class="section-body">
          <div class="section-desc">{{ $t('autoReplyDesc') }}</div>
          <transition name="expand">
            <div class="autoreply-body" v-if="autoReplyEnabled">
              <el-input
                v-model="autoReplyMessage"
                type="textarea" :rows="4"
                :placeholder="$t('autoReplyMessage')"
                resize="none"
              />
              <div class="section-action-bar">
                <el-button type="primary" size="small" :loading="autoReplySaving" @click="saveAutoReply">
                  {{ $t('save') }}
                </el-button>
              </div>
            </div>
          </transition>
          </div>
        </section>

      </div>

      <!-- RIGHT — danger card (sticky, matches vfasky settings-danger-card) -->
      <section class="section danger-section settings-danger-sticky" v-perm="'my:delete'">
        <div class="section-head">
          <span class="section-label danger-label">{{ $t('dangerZone') }}</span>
        </div>
        <div class="danger-inner" style="padding: 0 24px 20px">
          <div class="danger-text">
            <div class="danger-heading">{{ $t('deleteUserBtn') }}</div>
            <div class="danger-desc-text">{{ $t('delAccountMsg') }}</div>
          </div>
          <el-button type="danger" size="small" @click="deleteConfirm">
            {{ $t('deleteUserBtn') }}
          </el-button>
        </div>
      </section>

    </div><!-- /settings-detail-grid -->
    </template>

    <!-- ── Mail management tab ────────────────────────── -->
    <template v-else-if="activeTab === 'mail'">
      <section class="section mail-panel">
        <Account />
      </section>
    </template>

    <!-- Password dialog -->
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
import Account from '@/layout/account/index.vue'
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

const activeTab = ref('details')

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
/* ─── Outer shell ──────────────────────────────────── */
.settings-outer {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 32px 56px;

  @media (max-width: 960px)  { padding: 20px 20px 40px; }
  @media (max-width: 640px)  { padding: 16px 16px 32px; }
}

/* ─── Left settings column ─────────────────────────── */
.settings-main {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Settings grid ── */
.settings-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
  gap: 20px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.settings-danger-sticky {
  position: sticky;
  top: 24px;

  @media (max-width: 1100px) {
    position: static;
  }
}

/* ── Tab list ── */
.settings-tab-list {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: var(--surface-secondary, #f0f0f0);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.settings-tab-button {
  min-width: 108px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--secondary-text-color, #666666);
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1;
  padding: 11px 22px;
  transition: background 140ms ease, box-shadow 140ms ease, color 140ms ease;
  white-space: nowrap;
  font-family: inherit;

  &[data-active="true"] {
    background: var(--surface, #fff);
    color: var(--el-text-color-primary);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.08);
  }
}

/* ── Section — surface-card ── */
.section {
  background: var(--surface, #fff);
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--separator, #e5e5e5) 80%, transparent);
  box-shadow: 0 4px 14px rgba(0,0,0,0.04);
  overflow: hidden;
  margin-bottom: 20px;

  &:last-child { margin-bottom: 0; }
  &.danger-section { border-color: rgba(204,0,0,0.25); }
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--separator, #e5e5e5);
}

.section-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0;
  text-transform: none;
  border-left: none;
  padding-left: 0;
  line-height: 1.4;
}

.danger-label {
  color: #CC0000;
}

.head-action {
  border-radius: 2px !important;
  font-size: 12px !important;
  flex-shrink: 0;
}

.section-body {
  padding: 16px 24px 20px;
}

.section-desc {
  font-size: 12.5px;
  color: var(--secondary-text-color);
  margin-bottom: 14px;
  line-height: 1.55;
}

/* ── Avatar strip ── */
.avatar-strip {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 16px;
  padding: 16px 24px 0;
}

.avatar-wrap {
  position: relative;
  width: 76px;
  height: 76px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  background: #111;

  &:hover .avatar-lens { opacity: 1; }
}

.avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.avatar-init {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; font-weight: 900;
  letter-spacing: -0.04em; color: #fff; user-select: none;
}

.avatar-lens {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.54);
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
  transition: opacity 0.14s ease;
  color: #fff;
}

.avatar-meta {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 3px;
  padding-top: 2px;
}

.meta-name {
  font-size: 16px; font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
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
  padding: 2px 6px; border-radius: 2px;
  width: fit-content; margin-top: 4px;
}

.avatar-links {
  display: flex; align-items: center; gap: 12px;
  margin-top: 8px;
}

/* ── Data table — vfasky divide-y style ── */
.data-table {
  display: flex;
  flex-direction: column;
  padding: 0 24px;
}

.data-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  align-items: center;
  min-height: 52px;
  padding: 12px 0;
  border-bottom: 1px solid var(--separator, #e5e5e5);
  gap: 16px;

  &.last, &:last-child { border-bottom: none; }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 10px 0;
  }
}

.data-key {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted, #666666);
  flex-shrink: 0;
}

.data-val {
  display: flex; align-items: center;
  gap: 10px; flex-wrap: wrap;
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
  transition: opacity 0.12s; user-select: none;
  font-family: inherit;

  &:hover { opacity: 0.65; }
  &.dim { color: var(--secondary-text-color); font-weight: 600; }
}

/* ── Editor ── */
.editor-shell {
  border: 1px solid var(--light-border-color);
  border-radius: 2px; overflow: hidden;
  height: 160px;
}

/* ── Auto-reply ── */
.autoreply-body {
  display: flex; flex-direction: column; gap: 12px;
  overflow: hidden; margin-top: 4px;
}

.section-action-bar {
  display: flex; justify-content: flex-end;
}

.expand-enter-active {
  transition: opacity 0.22s ease, transform 0.22s ease, max-height 0.26s ease;
}
.expand-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease, max-height 0.18s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0; transform: translateY(-6px); max-height: 0;
}
.expand-enter-to, .expand-leave-from {
  opacity: 1; transform: translateY(0); max-height: 300px;
}

/* ── Danger zone ── */
.danger-section {
  padding-top: 20px;
}

.mail-panel {
  padding: 20px;
}

.danger-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 520px) {
    flex-direction: column; align-items: flex-start;
  }
}

.danger-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.danger-heading { font-size: 13.5px; font-weight: 700; color: var(--el-text-color-primary); }
.danger-desc-text { font-size: 12.5px; line-height: 1.5; color: var(--regular-text-color); }

/* ═══════════════════════════════════════════════
   RIGHT — info sidebar
═══════════════════════════════════════════════ */
.settings-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: sticky;
  top: 24px;

  @media (max-width: 1160px) {
    display: none; /* hidden on single-col layout */
  }
}

.sidebar-block {
  padding: 18px 0 18px;
  border-bottom: 1px solid var(--light-border-color);

  &:first-child { padding-top: 0; }
  &:last-of-type { border-bottom: none; }
}

.sidebar-block-label {
  font-size: 9.5px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--secondary-text-color);
  margin-bottom: 10px;
}

.sidebar-block-text {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--regular-text-color);
  margin: 0;
}

/* Page index navigation */
.page-index {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.index-item {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--regular-text-color);
  text-decoration: none;
  padding: 5px 0 5px 10px;
  border-left: 2px solid transparent;
  transition: border-color 0.12s, color 0.12s;

  &:hover {
    color: var(--el-text-color-primary);
    border-left-color: #CC0000;
  }

  &.danger-link:hover { color: #CC0000; }
}

/* Account meta-list */
.meta-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}

.meta-pair {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 8px;
  align-items: baseline;

  dt {
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--secondary-text-color);
  }

  dd {
    font-size: 12.5px;
    color: var(--el-text-color-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.mono {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11.5px;
      color: var(--regular-text-color);
    }
  }
}

/* Help note */
.sidebar-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 14px 12px;
  border: 1px solid var(--light-border-color);
  border-left: 3px solid var(--light-border-color);
  border-radius: 2px;
  margin-top: 20px;
  background: var(--extra-light-fill);

  .note-icon {
    color: var(--secondary-text-color);
    flex-shrink: 0;
    margin-top: 1px;
  }

  span {
    font-size: 12px;
    line-height: 1.6;
    color: var(--secondary-text-color);
  }
}

/* ── Password dialog ── */
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

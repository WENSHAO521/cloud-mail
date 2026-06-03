<template>
  <div class="settings-page">

    <!-- ── Profile section ── -->
    <div class="section">
      <div class="section-label">{{ $t('profile') }}</div>

      <!-- Avatar row -->
      <div class="avatar-row">
        <div class="avatar-area">
          <div class="avatar-wrap" @click="triggerUpload">
            <img v-if="userStore.avatar" :src="userStore.avatar" class="avatar-img"/>
            <div v-else class="avatar-init">{{ userInitial }}</div>
            <div class="avatar-overlay">
              <Icon icon="solar:camera-add-bold" width="18" height="18"/>
            </div>
          </div>
          <input ref="fileInputRef" type="file" accept="image/*"
                 style="display:none" @change="handleFileChange"/>
        </div>
        <div class="avatar-meta">
          <div class="meta-name">{{ userStore.user.name || userStore.user.email }}</div>
          <div class="meta-email">{{ userStore.user.email }}</div>
          <div class="meta-role" v-if="userStore.user.role?.name">{{ userStore.user.role.name }}</div>
          <div class="avatar-actions">
            <span class="action-link" @click="triggerUpload">{{ $t('uploadAvatar') }}</span>
            <span v-if="userStore.avatar" class="action-link remove" @click="removeAvatar">{{ $t('removeAvatar') }}</span>
          </div>
          <div class="meta-tip">{{ $t('avatarTip') }}</div>
        </div>
      </div>

      <!-- Info rows -->
      <div class="info-card">
        <div class="info-row">
          <span class="row-label">{{ $t('username') }}</span>
          <div class="row-value">
            <template v-if="setNameShow">
              <el-input v-model="accountName" size="small" style="width:200px"/>
              <span class="text-link" @click="setName">{{ $t('save') }}</span>
              <span class="text-link muted" @click="setNameShow = false">{{ $t('cancel') }}</span>
            </template>
            <template v-else>
              <span class="value-text">{{ userStore.user.name || '—' }}</span>
              <span class="text-link" @click="showSetName">{{ $t('change') }}</span>
            </template>
          </div>
        </div>
        <div class="info-row">
          <span class="row-label">{{ $t('emailAccount') }}</span>
          <span class="row-value value-text mono">{{ userStore.user.email }}</span>
        </div>
        <div class="info-row" style="border-bottom:none">
          <span class="row-label">{{ $t('password') }}</span>
          <div class="row-value">
            <el-button size="small" @click="pwdShow = true">{{ $t('changePwdBtn') }}</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Language section ── -->
    <div class="section">
      <div class="section-label">{{ $t('language') }}</div>
      <el-select :model-value="langSelect" style="width:160px" @change="changeLang">
        <el-option label="中文" value="zh" @pointerdown.prevent.stop="changeLang('zh')"/>
        <el-option label="English" value="en" @pointerdown.prevent.stop="changeLang('en')"/>
      </el-select>
    </div>

    <!-- ── Signature section ── -->
    <div class="section">
      <div class="section-label">{{ $t('signature') }}</div>
      <div class="signature-area">
        <div class="signature-editor-wrap">
          <tinyEditor
            ref="signatureEditorRef"
            :def-value="signatureText"
            editor-id="signature-editor"
            toolbar="bold italic underline | forecolor | link | code"
            height="160px"
            @change="onSignatureChange"
          />
        </div>
        <el-button type="primary" size="small" :loading="signatureLoading" @click="saveSignature">
          {{ $t('save') }}
        </el-button>
      </div>
    </div>

    <!-- ── Auto-reply section ── -->
    <div class="section">
      <div class="section-label">{{ $t('autoReply') }}</div>
      <div class="signature-area">
        <el-switch v-model="autoReplyEnabled" :active-text="$t('autoReplyEnabled')" @change="saveAutoReply"/>
        <el-input v-if="autoReplyEnabled" v-model="autoReplyMessage" type="textarea" :rows="4"
                  :placeholder="$t('autoReplyMessage')" resize="none" style="margin-top:8px"/>
        <el-button v-if="autoReplyEnabled" type="primary" size="small" :loading="autoReplySaving"
                   @click="saveAutoReply" style="align-self:flex-end">{{ $t('save') }}</el-button>
      </div>
    </div>

    <!-- ── Templates section ── -->
    <div class="section">
      <div class="section-label">{{ $t('templates') }}</div>
      <div class="templates-area">
        <div class="tpl-list" v-if="tplList.length">
          <div class="tpl-item" v-for="tpl in tplList" :key="tpl.templateId">
            <div class="tpl-info">
              <span class="tpl-name">{{ tpl.name }}</span>
              <span class="tpl-subject" v-if="tpl.subject">— {{ tpl.subject }}</span>
            </div>
            <div class="tpl-actions">
              <span class="text-link" @click="openEditTpl(tpl)">{{ $t('change') }}</span>
              <span class="text-link remove" @click="deleteTpl(tpl.templateId)">{{ $t('delete') }}</span>
            </div>
          </div>
        </div>
        <el-button size="small" @click="openAddTpl">{{ $t('addTemplate') }}</el-button>
      </div>
    </div>

    <!-- ── Contact Groups section ── -->
    <div class="section">
      <div class="section-label">{{ $t('contactGroups') }}</div>
      <div class="templates-area">
        <div class="tpl-list" v-if="groupList.length">
          <div class="tpl-item" v-for="g in groupList" :key="g.groupId">
            <div class="tpl-info">
              <span class="tpl-name">{{ g.name }}</span>
              <span class="tpl-subject">— {{ g.emails.join(', ') }}</span>
            </div>
            <div class="tpl-actions">
              <span class="text-link" @click="openEditGroup(g)">{{ $t('change') }}</span>
              <span class="text-link remove" @click="deleteGroup(g.groupId)">{{ $t('delete') }}</span>
            </div>
          </div>
        </div>
        <el-button size="small" @click="openAddGroup">{{ $t('addGroup') }}</el-button>
      </div>
    </div>

    <!-- ── Danger zone ── -->
    <div class="section danger-section" v-perm="'my:delete'">
      <div class="section-label">{{ $t('dangerZone') }}</div>
      <div class="danger-card">
        <div class="danger-desc">{{ $t('delAccountMsg') }}</div>
        <el-button type="primary" size="small" @click="deleteConfirm">{{ $t('deleteUserBtn') }}</el-button>
      </div>
    </div>

    <!-- Template dialog -->
    <el-dialog v-model="tplShow" :title="tplForm.templateId ? $t('editTemplate') : $t('addTemplate')" width="520">
      <div style="display:flex;flex-direction:column;gap:10px">
        <el-input v-model="tplForm.name" :placeholder="$t('templateName')"/>
        <el-input v-model="tplForm.subject" :placeholder="$t('templateSubject')"/>
        <div style="height:200px;border:1px solid var(--light-border-color);border-radius:2px;overflow:hidden">
          <tinyEditor ref="tplEditorRef" :def-value="tplForm.content" editor-id="tpl-editor"
            toolbar="bold italic underline | forecolor | link | code" height="200px"
            @change="(html) => tplForm.content = html"/>
        </div>
        <el-button type="primary" :loading="tplLoading" @click="saveTpl">{{ $t('save') }}</el-button>
      </div>
    </el-dialog>

    <!-- Contact Group dialog -->
    <el-dialog v-model="groupShow" :title="groupForm.groupId ? $t('addGroup') : $t('addGroup')" width="460">
      <div style="display:flex;flex-direction:column;gap:10px">
        <el-input v-model="groupForm.name" :placeholder="$t('groupName')"/>
        <el-input-tag v-model="groupForm.emails" :placeholder="$t('emailAccount')" tag-type="primary"/>
        <el-button type="primary" :loading="groupLoading" @click="saveGroup">{{ $t('save') }}</el-button>
      </div>
    </el-dialog>

    <!-- Change password dialog -->
    <el-dialog v-model="pwdShow" :title="$t('changePassword')" width="360">
      <div class="pwd-form">
        <el-input type="password" :placeholder="$t('newPassword')"
                  v-model="form.password" autocomplete="off"/>
        <el-input type="password" :placeholder="$t('confirmPassword')"
                  v-model="form.newPwd" autocomplete="off"/>
        <el-button type="primary" :loading="setPwdLoading" @click="submitPwd">
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
import { templateList, templateAdd, templateUpdate, templateDelete } from "@/request/template.js"
import { contactGroupList, contactGroupAdd, contactGroupUpdate, contactGroupDelete } from "@/request/contact-group.js"
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
const tplList = ref([])
const tplShow = ref(false)
const tplLoading = ref(false)
const tplEditorRef = ref(null)
const tplForm = reactive({ templateId: null, name: '', subject: '', content: '' })
const groupList = ref([])
const groupShow = ref(false)
const groupLoading = ref(false)
const groupForm = reactive({ groupId: null, name: '', emails: [] })
const autoReplyEnabled = ref(false)
const autoReplyMessage = ref('')
const autoReplySaving = ref(false)

defineOptions({ name: 'setting' })

onMounted(() => {
  userStore.loadAvatar()
  signatureText.value = userStore.user.signature || ''
  templateList().then(list => tplList.value = list).catch(() => {})
  contactGroupList().then(list => groupList.value = list).catch(() => {})
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

function triggerUpload() {
  fileInputRef.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  compressImage(file, 200).then(base64 => {
    userStore.saveAvatar(base64)
  })
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

function removeAvatar() {
  userStore.clearAvatar()
}

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

function onSignatureChange(html) {
  signatureText.value = html
}

async function saveSignature() {
  signatureLoading.value = true
  try {
    const html = signatureEditorRef.value?.getContent?.() ?? signatureText.value
    await userStore.saveSignature(html)
    ElMessage({ message: t('signatureSaved'), type: 'success', plain: true })
  } finally {
    signatureLoading.value = false
  }
}

function openAddTpl() {
  Object.assign(tplForm, { templateId: null, name: '', subject: '', content: '' })
  tplShow.value = true
}

function openEditTpl(tpl) {
  Object.assign(tplForm, { templateId: tpl.templateId, name: tpl.name, subject: tpl.subject, content: tpl.content })
  tplShow.value = true
}

async function saveTpl() {
  tplLoading.value = true
  try {
    const html = tplEditorRef.value?.getContent?.() ?? tplForm.content
    if (tplForm.templateId) {
      await templateUpdate(tplForm.templateId, tplForm.name, tplForm.subject, html)
      const idx = tplList.value.findIndex(t => t.templateId === tplForm.templateId)
      if (idx > -1) tplList.value[idx] = { ...tplList.value[idx], name: tplForm.name, subject: tplForm.subject, content: html }
    } else {
      const newTpl = await templateAdd(tplForm.name, tplForm.subject, html)
      tplList.value.unshift(newTpl)
    }
    tplShow.value = false
    ElMessage({ message: t('templateSaved'), type: 'success', plain: true })
  } finally { tplLoading.value = false }
}

async function deleteTpl(templateId) {
  await templateDelete(templateId)
  tplList.value = tplList.value.filter(t => t.templateId !== templateId)
  ElMessage({ message: t('templateDeleted'), type: 'success', plain: true })
}

async function saveAutoReply() {
  autoReplySaving.value = true
  try {
    await http.put('/autoReply/set', { enabled: autoReplyEnabled.value, message: autoReplyMessage.value })
    ElMessage({ message: t('autoReplySaved'), type: 'success', plain: true })
  } finally { autoReplySaving.value = false }
}

function openAddGroup() {
  Object.assign(groupForm, { groupId: null, name: '', emails: [] })
  groupShow.value = true
}

function openEditGroup(g) {
  Object.assign(groupForm, { groupId: g.groupId, name: g.name, emails: [...g.emails] })
  groupShow.value = true
}

async function saveGroup() {
  groupLoading.value = true
  try {
    if (groupForm.groupId) {
      await contactGroupUpdate(groupForm.groupId, groupForm.name, groupForm.emails)
      const idx = groupList.value.findIndex(g => g.groupId === groupForm.groupId)
      if (idx > -1) groupList.value[idx] = { ...groupList.value[idx], name: groupForm.name, emails: [...groupForm.emails] }
    } else {
      const ng = await contactGroupAdd(groupForm.name, groupForm.emails)
      groupList.value.unshift(ng)
    }
    groupShow.value = false
    ElMessage({ message: t('groupSaved'), type: 'success', plain: true })
  } finally { groupLoading.value = false }
}

async function deleteGroup(groupId) {
  await contactGroupDelete(groupId)
  groupList.value = groupList.value.filter(g => g.groupId !== groupId)
  ElMessage({ message: t('groupDeleted'), type: 'success', plain: true })
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
.settings-page {
  max-width: 680px;
  padding: 40px 48px;
  display: flex;
  flex-direction: column;
  gap: 40px;

  @media (max-width: 767px) {
    padding: 24px 20px;
  }
}

/* ── Section wrapper ── */
.section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--secondary-text-color);
  padding-bottom: 10px;
  border-bottom: 2px solid #111111;
}
.dark .section-label { border-bottom-color: #444; }

/* ── Avatar row ── */
.avatar-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.avatar-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  background: #111111;

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
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  background: #111111;
  user-select: none;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
  color: #ffffff;
}

.avatar-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 4px;
}

.meta-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.meta-email {
  font-size: 12px;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--secondary-text-color);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.meta-role {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #CC0000;
  background: rgba(204, 0, 0, 0.08);
  border: 1px solid rgba(204, 0, 0, 0.20);
  padding: 2px 8px;
  border-radius: 2px;
  width: fit-content;
  margin-top: 4px;
}

.avatar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.action-link {
  font-size: 12px;
  font-weight: 600;
  color: #CC0000;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.12s;
  user-select: none;

  &:hover { opacity: 0.75; }
  &.remove { color: var(--secondary-text-color); }
}

.meta-tip {
  font-size: 11px;
  color: var(--secondary-text-color);
  margin-top: 2px;
}

/* ── Info card ── */
.info-card {
  border: 1px solid var(--light-border-color);
  border-radius: 3px;
  overflow: hidden;
}

.info-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  min-height: 48px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--light-border-color);
  gap: 12px;

  @media (max-width: 520px) {
    grid-template-columns: 100px 1fr;
  }
}

.row-label {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--secondary-text-color);
  flex-shrink: 0;
}

.row-value {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}

.value-text {
  font-size: 13.5px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  &.mono {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
  }
}

.text-link {
  font-size: 12px;
  font-weight: 600;
  color: #CC0000;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: opacity 0.12s;
  &:hover { opacity: 0.75; }
  &.muted { color: var(--secondary-text-color); }
}

/* ── Danger section ── */
.templates-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 520px;

  .tpl-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: 1px solid var(--light-border-color);
    border-radius: 3px;
    overflow: hidden;
  }

  .tpl-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--light-border-color);
    &:last-child { border-bottom: none; }
    &:hover { background: var(--base-fill); }

    .tpl-info {
      flex: 1;
      min-width: 0;
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      .tpl-name { font-weight: 600; color: var(--el-text-color-primary); }
      .tpl-subject { color: var(--regular-text-color); margin-left: 4px; }
    }

    .tpl-actions {
      display: flex;
      gap: 10px;
      flex-shrink: 0;
      margin-left: 12px;
    }
  }
}

.signature-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 600px;

  .signature-editor-wrap {
    height: 160px;
    border: 1px solid var(--light-border-color);
    border-radius: 2px;
    overflow: hidden;
  }

  .el-button {
    align-self: flex-end;
  }
}

.danger-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 18px;
  border: 1px solid var(--light-border-color);
  border-left: 3px solid #CC0000;
  border-radius: 2px;
  background: var(--extra-light-fill);

  @media (max-width: 520px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.danger-desc {
  font-size: 13px;
  color: var(--regular-text-color);
  line-height: 1.5;
}

/* ── Password dialog ── */
.pwd-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>

<template>
  <div class="send" v-show="show">
    <div class="write-box">

      <!-- ── Header ─────────────────────────────── -->
      <div class="wh">
        <div class="wh-left">
          <div class="wh-badge">
            <span v-if="form.sendType === 'reply'">{{ $t('reply') }}</span>
            <span v-else-if="form.sendType === 'forward'">{{ $t('forward') }}</span>
            <span v-else>{{ $t('compose') }}</span>
          </div>
          <div class="wh-sender">
            <div class="wh-avatar">{{ senderInitial }}</div>
            <div class="wh-info">
              <span class="wh-name">{{ form.name || form.sendEmail.split('@')[0] }}</span>
              <span class="wh-email">{{ form.sendEmail }}</span>
            </div>
          </div>
        </div>
        <div class="wh-close" @click="close">
          <Icon icon="material-symbols-light:close-rounded" width="22" height="22"/>
        </div>
      </div>

      <!-- ── Fields ─────────────────────────────── -->
      <div class="container">

        <!-- To -->
        <div class="field-row">
          <span class="field-label">{{ $t('recipient') }}</span>
          <el-input-tag class="field-tag" @add-tag="addTagChange" tag-type="primary"
                        @input="inputChange" size="default" v-model="form.receiveEmail">
            <template #prefix>
              <el-select ref="mySelect" class="write-select" popper-class="write-select"
                         :show-arrow="false" :no-match-text="' '" :no-data-text="' '"
                         @visible-change="selectStatusChange" @change="selectChange">
                <el-option v-for="item in selectRecipientList" :key="item"
                           :label="item" :value="item" style="color:#999"/>
              </el-select>
            </template>
          </el-input-tag>
          <div class="field-actions">
            <span v-if="!showCc"  class="field-toggle" @click.stop="showCc = true">{{ $t('cc') }}</span>
            <span v-if="!showBcc" class="field-toggle" @click.stop="showBcc = true">{{ $t('bcc') }}</span>
            <div class="icon-btn-sm" @click.stop="openContacts">
              <Icon icon="fa7-solid:user-plus" width="14" height="14"/>
            </div>
          </div>
        </div>

        <!-- Cc -->
        <div class="field-row" v-show="showCc">
          <span class="field-label">{{ $t('cc') }}</span>
          <el-input-tag class="field-tag" v-model="form.cc" tag-type="primary"
                        @add-tag="addCcTag" size="default"/>
        </div>

        <!-- Bcc -->
        <div class="field-row" v-show="showBcc">
          <span class="field-label">{{ $t('bcc') }}</span>
          <el-input-tag class="field-tag" v-model="form.bcc" tag-type="primary"
                        @add-tag="addBccTag" size="default"/>
        </div>

        <!-- Subject -->
        <div class="field-row subject-row">
          <el-input class="subject-input" v-model="form.subject"
                    :placeholder="t('subject')" />
        </div>

        <!-- Editor -->
        <div class="editor-wrap">
          <tinyEditor :def-value="defValue" ref="editor" @change="change" @focus="focusChange" />
        </div>

        <!-- Toolbar -->
        <div class="toolbar-bar">
          <div class="toolbar-left">
            <div class="tb-btn" @click="chooseFile" :title="$t('attachment')">
              <Icon icon="iconamoon:attachment-fill" width="18" height="18"/>
            </div>
            <div class="tb-btn" @click="clearContent" :title="$t('clear')">
              <Icon icon="icon-park-outline:clear-format" width="17" height="17"/>
            </div>
            <div class="att-list">
              <div class="att-item" v-for="(item,index) in form.attachments" :key="index">
                <Icon v-bind="getIconByName(item.filename)" width="14" height="14"/>
                <span class="att-filename">{{ item.filename }}</span>
                <span class="att-size">{{ formatBytes(item.size) }}</span>
                <Icon icon="material-symbols-light:close-rounded" width="16" height="16"
                      style="cursor:pointer;flex-shrink:0" @click="delAtt(index)"/>
              </div>
            </div>
          </div>
          <div class="toolbar-right">
            <el-button class="send-btn" type="primary" @click="sendEmail">
              <Icon icon="mingcute:send-fill" width="15" height="15" style="margin-right:6px"/>
              <span v-if="form.sendType === 'reply'">{{ $t('reply') }}</span>
              <span v-else-if="form.sendType === 'forward'">{{ $t('forward') }}</span>
              <span v-else>{{ $t('send') }}</span>
            </el-button>
          </div>
        </div>

      </div>
    </div>
    <el-dialog top="10vh" v-model="showContacts" @closed="clearSelectContact" :title="t('recentContacts')">
      <el-table ref="contactsTabRef" row-key="email" :data="contacts" style="height: 445px">
        <el-table-column type="selection" width="32" />
        <el-table-column property="email" :label="t('emailAccount')" >
          <template #default="props">
            <div class="email-row">{{ props.row.email }}</div>
          </template>
        </el-table-column>
        <el-table-column width="55" label="" >
          <template #default>
            <div style="display: flex;">
              <Icon icon="mage:user" style="color: var(--el-text-color-primary)" width="22" height="22" color="#606266" />
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="contacts-bottom">
        <el-button type="default" @click="deleteContact">{{t('clear')}}</el-button>
        <el-button type="primary" @click="chooseContact">{{t('selectContacts')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import tinyEditor from '@/components/tiny-editor/index.vue'
import {h, nextTick, onMounted, onUnmounted, reactive, ref, toRaw, computed} from "vue";
import {Icon} from "@iconify/vue";
import {useUserStore} from "@/store/user.js";
import {emailSend} from "@/request/email.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {fileToBase64, formatBytes} from "@/utils/file-utils.js";
import {getIconByName} from "@/utils/icon-utils.js";
import sendPercent from "@/components/send-percent/index.vue"
import {toOssDomain} from "@/utils/convert.js";
import {formatDetailDate} from "@/utils/day.js";
import {useSettingStore} from "@/store/setting.js";
import {userDraftStore} from "@/store/draft.js";
import {useWriterStore} from "@/store/writer.js";
import db from "@/db/db.js";
import dayjs from "dayjs";
import {useI18n} from "vue-i18n";
import router from "@/router/index.js";
import {ElMessageBox} from "element-plus";

defineExpose({
  open,
  openReply,
  openForward,
  openDraft
})

const {t} = useI18n()
const writerStore = useWriterStore();
const draftStore = userDraftStore()
const settingStore = useSettingStore()
const emailStore = useEmailStore();
const accountStore = useAccountStore()
const editor = ref({})
const userStore = useUserStore();
const show = ref(false);
const showCc = ref(false);
const showBcc = ref(false);
const percent = ref(0)
let percentMessage = null
let sending = false
const defValue = ref('')
const contactsTabRef = ref({})
const showContacts = ref(false)
const mySelect = ref()
let selectStatus = false
const backReply = reactive({
  receiveEmail: [],
  subject: '',
  content: '',
  sendType: ''
})
const form = reactive({
  sendEmail: '',
  receiveEmail: [],
  cc: [],
  bcc: [],
  accountId: -1,
  name: '',
  subject: '',
  content: '',
  sendType: '',
  text: '',
  emailId: 0,
  attachments: [],
  draftId: null,
})

const selectRecipientList = ref([])

const senderInitial = computed(() => {
  const name = form.name?.trim()
  if (name) return name[0].toUpperCase()
  return form.sendEmail?.[0]?.toUpperCase() || '?'
})

const contacts = computed(() => writerStore.sendRecipientRecord.map(item => ({email: item})))

function openContacts() {
  showContacts.value = true
  nextTick(() => {
    form.receiveEmail.forEach(item => {
      if (writerStore.sendRecipientRecord.includes(item)) {
        contactsTabRef.value.toggleRowSelection({email: item});
      }
    })
  })
}

function deleteContact() {
  ElMessageBox.confirm(t('confirmDeletionOfContacts'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
    form.receiveEmail = form.receiveEmail.filter(item => !contactList.includes(item));
    writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(item => !contactList.includes(item));
  })
}

function chooseContact() {

  const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
  contactList.forEach(item => {
    if (!form.receiveEmail.includes(item)) {
      form.receiveEmail.push(item);
    }
  })

  form.receiveEmail = form.receiveEmail.filter(item => {
    return contactList.includes(item) || !writerStore.sendRecipientRecord.includes(item);
  });

  showContacts.value = false
}

function clearSelectContact() {
  contactsTabRef.value.clearSelection();
}

function selectChange(value) {
  form.receiveEmail.push(value)
}

function selectStatusChange(status) {
  selectStatus = status
}

const openSelect = () => {
  mySelect.value.toggleMenu()
}

function inputChange(value) {

  selectRecipientList.value = writerStore.sendRecipientRecord.filter(item => value && !form.receiveEmail.includes(item) && item.startsWith(value)).slice(0, 10);

  if (!selectStatus && selectRecipientList.value.length > 0) {
    openSelect()
  }

  if (selectStatus && selectRecipientList.value.length === 0) {
    openSelect()
  }

}

function addTagChange(val) {

  const emails = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
  ));

  form.receiveEmail.splice(form.receiveEmail.length - 1, 1)

  let has = false
  emails.forEach(email => {
    if (isEmail(email) && !form.receiveEmail.includes(email)) {
      form.receiveEmail.push(email)
      has = true
    }
  })
  if (selectStatus && has) openSelect()
}

function clearContent() {
  ElMessageBox.confirm(t('clearContentConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    resetForm()
  })

}

function delAtt(index) {
  form.attachments.splice(index, 1);
}

function chooseFile() {
  const doc = document.createElement("input")
  doc.setAttribute("type", "file")
  doc.multiple = true;
  doc.click()
  doc.onchange = async (e) => {

    const fileList = e.target.files;

    for (const file of fileList) {

      const size = file.size
      const filename = file.name
      const contentType = file.type

      const content = await fileToBase64(file)
      form.attachments.push({content, filename, size, contentType})

    }

  }
}

async function sendEmail() {

  if (form.receiveEmail.length === 0) {
    ElMessage({
      message: t('emptyRecipientMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.subject) {
    ElMessage({
      message: t('emptySubjectMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.content) {
    form.content = editor.value.getContent();
  }

  if (!form.content) {
    ElMessage({
      message: t('emptyContentMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.manyType === 'divide' && form.attachments.length > 0) {
    ElMessage({
      message: t('noSeparateSendMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (sending) {
    ElMessage({
      message: t('sendingErrorMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  percentMessage = ElMessage({
    message: () => h(sendPercent, {value: percent.value, desc: t('sending')}),
    dangerouslyUseHTMLString: true,
    plain: true,
    duration: 0,
    customClass: 'message-bottom'
  })

  sending = true

  show.value = false

  emailSend(form, (e) => {
    percent.value = Math.round((e.loaded * 98) / e.total)
  }).then(emailList => {
    const email = emailList[0]
    emailList.forEach(item => {
      emailStore.sendScroll?.addItem(item)
    })

    ElNotification({
      title: t('sendSuccessMsg'),
      type: "success",
      message: h('span', {style: 'color: teal'}, email.subject),
      position: 'bottom-right'
    })

    userStore.refreshUserInfo();

    addRecipientRecord();

    if (form.draftId) {
      form.subject = ''
      form.content = ''
      form.receiveEmail = []
      draftStore.setDraft = {...toRaw(form)}
    }

    show.value = false
    resetForm();
  }).catch((e) => {
    ElNotification({
      title: t('sendFailMsg'),
      type: e.code === 403 ? 'warning' : 'error',
      message: h('span', {style: 'color: teal'}, e.message),
      position: 'bottom-right'
    })
    if (e.code === 401) {
      localStorage.removeItem('token');
      router.replace('/login');
    }
    show.value = true
    addRecipientRecord();
  }).finally(() => {
    percentMessage.close()
    percent.value = 0
    sending = false
  })
}

function addRecipientRecord() {
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(
      email => !form.receiveEmail.includes(email)
  );

  writerStore.sendRecipientRecord.unshift(...form.receiveEmail);
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.slice(0, 500);
}

function resetForm() {
  form.receiveEmail = []
  form.cc = []
  form.bcc = []
  form.subject = ''
  form.content = ''
  form.manyType = null
  form.attachments = []
  form.sendType = ''
  form.emailId = 0
  form.draftId = null
  showCc.value = false
  showBcc.value = false
  backReply.content = ''
  backReply.subject = ''
  backReply.receiveEmail = []
  backReply.sendType = ''
  editor.value.clearEditor()
}

function addCcTag(val) {
  const emails = val.split(/[,，]/).map(e => e.trim()).filter(e => e)
  form.cc.splice(form.cc.length - 1, 1)
  emails.forEach(email => {
    if (isEmail(email) && !form.cc.includes(email)) form.cc.push(email)
  })
}

function addBccTag(val) {
  const emails = val.split(/[,，]/).map(e => e.trim()).filter(e => e)
  form.bcc.splice(form.bcc.length - 1, 1)
  emails.forEach(email => {
    if (isEmail(email) && !form.bcc.includes(email)) form.bcc.push(email)
  })
}

function change(content, text) {
  form.content = content;
  form.text = text
}

function focusChange() {
  if (selectStatus) openSelect()
}

function openForward(email) {
  resetForm();

  email.subject = email.subject || ''

  form.subject = email.subject
  form.sendType = 'forward'

  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
      ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
    `
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })

  });
}

function openReply(email) {

  resetForm();

  email.subject = email.subject || ''

  form.receiveEmail.push(email.sendEmail)
  form.subject = (
      email.subject.startsWith('Re:') ||
      email.subject.startsWith('Re：') ||
      email.subject.startsWith('回复：') ||
      email.subject.startsWith('回复:')) ? email.subject : 'Re: ' + email.subject
  form.sendType = 'reply'
  form.emailId = email.emailId

  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
    <div></div>
    <div>
    <br>
        ${formatDetailDate(email.createTime)} ${email.name} &lt${email.sendEmail}&gt ${t('wrote')}:
    </div>
    <blockquote class="mceNonEditable" style="margin: 0 0 0 0.8ex;border-left: 1px solid rgb(204,204,204);padding-left: 1ex;">
      <articl>
          ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
      </article>
    </blockquote>`
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })
  })

}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function open() {
  if (!accountStore.currentAccount.email) {
    form.sendEmail = userStore.user.email;
    form.accountId = userStore.user.account.accountId;
    form.name = userStore.user.name;
  } else {
    form.sendEmail = accountStore.currentAccount.email;
    form.accountId = accountStore.currentAccount.accountId;
    form.name = accountStore.currentAccount.name;
  }
  show.value = true;
  editor.value.focus()
}

function openDraft(draft) {
  Object.assign(form, {...draft})
  defValue.value = ''
  setTimeout(() => defValue.value = form.content)
  show.value = true;
  editor.value.focus()
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    close()
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

function close() {

  if (selectStatus) openSelect();

  if (!form.content) {
    form.content = editor.value.getContent();
  }

  if (form.draftId) {
    draftStore.setDraft = {...toRaw(form)}
    show.value = false
    resetForm()
    return;
  }

  if (!(form.content || form.subject || form.receiveEmail.length > 0)) {
    show.value = false
    resetForm()
    return;
  }

  if (backReply.sendType === 'reply' || backReply.sendType === 'forward') {
    let subjectFlag = form.subject === backReply.subject
    let contentFlag = editor.value.getContent() === backReply.content
    let receiveFlag = form.receiveEmail.length === 1 && form.receiveEmail[0] === backReply.receiveEmail[0]
    if (backReply.sendType === 'forward' && form.receiveEmail.length === 0) {
      receiveFlag = true;
    }
    if (subjectFlag && contentFlag && receiveFlag) {
      resetForm();
      close()
      return;
    }
  }

  ElMessageBox.confirm(t('saveDraftConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning',
    distinguishCancelAndClose: true
  }).then(async () => {
    const formData = {...toRaw(form)};
    delete formData.draftId
    delete formData.attachments
    formData.createTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
    const draftId = await db.value.draft.add({...formData})
    db.value.att.add({draftId, attachments: toRaw(form.attachments)})
    draftStore.refreshList++
    show.value = false
    await nextTick(() => {
      resetForm()
    })
  }).catch((action) => {
    if (action === 'cancel') {
      show.value = false
      resetForm()
    }
  })

}

</script>
<style>
.write-select .el-select-dropdown__list {
  padding: 4px 4px !important;
}
.write-select .el-select-dropdown__item {
  padding: 0 10px 0 10px;
}

.write-select .el-select-dropdown {
  min-width: 0 !important;
}
</style>
<style scoped lang="scss">
/* ── Overlay ─────────────────────────────────── */
.send {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.60);
  z-index: 2000;
}

/* ── Dialog box ──────────────────────────────── */
.write-box {
  background: var(--el-bg-color);
  width: min(1300px, calc(100% - 16px));
  display: grid;
  grid-template-rows: auto 1fr;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
  border-radius: 2px;
  overflow: hidden;

  @media (max-width: 767px) {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  @media (min-width: 768px) {
    height: min(840px, calc(100vh - 32px));
  }
}

/* ── Header ──────────────────────────────────── */
.wh {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 20px;
  height: 52px;
  background: #111111;
  flex-shrink: 0;
  border-bottom: 3px solid #CC0000;
}

.wh-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.wh-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #CC0000;
  white-space: nowrap;
  flex-shrink: 0;
}

.wh-sender {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding-left: 14px;
  border-left: 1px solid rgba(255,255,255,0.10);
}

.wh-avatar {
  width: 28px;
  height: 28px;
  border-radius: 2px;
  background: #CC0000;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wh-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.wh-name {
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(255,255,255,0.90);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wh-email {
  font-size: 10.5px;
  font-family: 'IBM Plex Mono', monospace;
  color: rgba(255,255,255,0.38);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wh-close {
  width: 32px;
  height: 32px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255,255,255,0.55);
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;

  @media (hover: hover) {
    &:hover {
      background: rgba(255,255,255,0.10);
      color: rgba(255,255,255,0.90);
    }
  }
}

/* ── Fields container ────────────────────────── */
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Each field row */
.field-row {
  display: flex;
  align-items: center;
  min-height: 46px;
  padding: 0 20px;
  border-bottom: 1px solid var(--light-border-color);
  flex-shrink: 0;
  gap: 0;
}

.field-label {
  flex-shrink: 0;
  width: 62px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--secondary-text-color);
}

.field-tag {
  flex: 1;
  min-width: 0;
}

.field-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 8px;
}

.field-toggle {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--secondary-text-color);
  cursor: pointer;
  letter-spacing: 0.03em;
  user-select: none;
  padding: 3px 6px;
  border-radius: 2px;
  transition: background 0.12s, color 0.12s;

  @media (hover: hover) {
    &:hover {
      background: var(--base-fill);
      color: var(--el-text-color-primary);
    }
  }
}

.icon-btn-sm {
  width: 26px;
  height: 26px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--secondary-text-color);
  transition: background 0.12s, color 0.12s;

  @media (hover: hover) {
    &:hover {
      background: var(--base-fill);
      color: var(--el-text-color-primary);
    }
  }
}

/* Subject row */
.subject-row {
  min-height: 50px;
  border-bottom: 2px solid var(--light-border-color);
}

/* Editor fills remaining height */
.editor-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Bottom toolbar */
.toolbar-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 16px 10px;
  border-top: 1px solid var(--light-border-color);
  background: var(--extra-light-fill);
  flex-shrink: 0;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.tb-btn {
  width: 30px;
  height: 30px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--regular-text-color);
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;

  @media (hover: hover) {
    &:hover {
      background: var(--base-fill);
      color: #CC0000;
    }
  }
}

.att-list {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  overflow-x: auto;
  padding: 0 4px;
  max-width: 100%;

  .att-item {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    font-size: 11.5px;
    padding: 0 8px;
    background: var(--el-bg-color);
    border: 1px solid var(--light-border-color);
    border-left: 2px solid #CC0000;
    border-radius: 0;
    white-space: nowrap;
    flex-shrink: 0;
    max-width: 200px;

    .att-filename {
      max-width: 100px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-weight: 500;
    }

    .att-size {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px;
      color: var(--secondary-text-color);
    }
  }
}

.toolbar-right { flex-shrink: 0; }

.send-btn {
  height: 34px !important;
  padding: 0 20px !important;
  font-size: 12.5px !important;
  font-weight: 700 !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
  border-radius: 2px !important;
  display: inline-flex !important;
  align-items: center !important;
}

/* El overrides — flat field inputs */
:deep(.field-tag .el-input-tag),
:deep(.field-tag .el-input__wrapper) {
  border-radius: 0 !important;
  box-shadow: none !important;
  border: none !important;
  background: transparent !important;
  padding-left: 0 !important;
}

:deep(.subject-input .el-input__wrapper) {
  border-radius: 0 !important;
  box-shadow: none !important;
  border: none !important;
  background: transparent !important;
  padding-left: 0 !important;

  .el-input__inner {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: var(--el-text-color-primary) !important;
    letter-spacing: 0.01em !important;
  }
}

:deep(.el-input-tag__suffix) { padding-right: 0; }

.email-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-dialog) {
  width: 500px !important;
  @media (max-width: 540px) {
    width: calc(100% - 32px) !important;
  }
}

.contacts-bottom {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 8px;
}

.write-select {
  position: absolute;
  width: 300px;
  left: 60px;
  z-index: 0;
  opacity: 0;
  pointer-events: none;
}
</style>

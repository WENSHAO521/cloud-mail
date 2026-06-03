<template>
  <div class="templates-page">

    <!-- ── List mode ── -->
    <template v-if="!editorMode">
      <div class="page-header">
        <div class="page-title">{{ $t('templates') }}</div>
        <el-button class="action-btn" @click="openAdd">
          <Icon icon="ep:plus" width="14" height="14" />
          {{ $t('addTemplate') }}
        </el-button>
      </div>

      <!-- Empty state -->
      <div v-if="!tplList.length" class="empty-state">
        <div class="empty-icon">
          <Icon icon="material-symbols:description-outline-rounded" width="40" height="40" />
        </div>
        <div class="empty-title">{{ $t('noTemplates') }}</div>
        <div class="empty-desc">{{ $t('noTemplatesDesc') }}</div>
        <el-button class="action-btn" @click="openAdd">
          <Icon icon="ep:plus" width="14" height="14" />
          {{ $t('addTemplate') }}
        </el-button>
      </div>

      <!-- Template list -->
      <div v-else class="tpl-list">
        <div class="tpl-row" v-for="tpl in tplList" :key="tpl.templateId">
          <div class="tpl-icon-wrap">
            <Icon icon="material-symbols:description-outline-rounded" width="18" height="18" />
          </div>
          <div class="tpl-body">
            <div class="tpl-name">{{ tpl.name }}</div>
            <div class="tpl-subject" v-if="tpl.subject">{{ tpl.subject }}</div>
          </div>
          <div class="tpl-btns">
            <button class="icon-btn" :title="$t('change')" @click="openEdit(tpl)">
              <Icon icon="material-symbols:edit-outline-rounded" width="16" height="16" />
            </button>
            <button class="icon-btn danger" :title="$t('delete')" @click="deleteTpl(tpl.templateId)">
              <Icon icon="material-symbols:delete-outline-rounded" width="16" height="16" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Editor mode ── -->
    <template v-else>
      <div class="editor-header">
        <button class="back-btn" @click="cancelEdit">
          <Icon icon="ep:arrow-left" width="15" height="15" />
          {{ $t('templates') }}
        </button>
        <div class="editor-title">
          {{ tplForm.templateId ? $t('editTemplate') : $t('addTemplate') }}
        </div>
        <el-button type="primary" class="save-btn" :loading="tplLoading" @click="saveTpl">
          {{ $t('save') }}
        </el-button>
      </div>

      <div class="editor-body">
        <div class="field-block">
          <label class="field-label">{{ $t('templateName') }}</label>
          <el-input
            v-model="tplForm.name"
            :placeholder="$t('templateName')"
            class="field-input"
            size="large"
          />
        </div>

        <div class="field-block">
          <label class="field-label">{{ $t('templateSubject') }}</label>
          <el-input
            v-model="tplForm.subject"
            :placeholder="$t('subjectInputDesc')"
            class="field-input"
            size="large"
          />
        </div>

        <div class="field-block editor-field">
          <label class="field-label">{{ $t('message') }}</label>
          <div class="editor-wrap">
            <tinyEditor
              ref="tplEditorRef"
              :def-value="tplForm.content"
              editor-id="tpl-editor"
              toolbar="bold italic underline | forecolor backcolor | bullist numlist | link | code"
              height="100%"
              @change="(html) => tplForm.content = html"
            />
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { reactive, ref, onMounted, defineOptions } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import tinyEditor from '@/components/tiny-editor/index.vue'
import { templateList, templateAdd, templateUpdate, templateDelete } from '@/request/template.js'

defineOptions({ name: 'templates' })

const { t } = useI18n()
const tplList = ref([])
const tplLoading = ref(false)
const tplEditorRef = ref(null)
const editorMode = ref(false)
const tplForm = reactive({ templateId: null, name: '', subject: '', content: '' })

onMounted(() => {
  templateList().then(list => tplList.value = list).catch(() => {})
})

function openAdd() {
  Object.assign(tplForm, { templateId: null, name: '', subject: '', content: '' })
  editorMode.value = true
}

function openEdit(tpl) {
  Object.assign(tplForm, { templateId: tpl.templateId, name: tpl.name, subject: tpl.subject, content: tpl.content })
  editorMode.value = true
}

function cancelEdit() {
  editorMode.value = false
}

async function saveTpl() {
  if (!tplForm.name.trim()) {
    ElMessage({ message: t('emptyUserNameMsg'), type: 'error', plain: true })
    return
  }
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
    editorMode.value = false
    ElMessage({ message: t('templateSaved'), type: 'success', plain: true })
  } finally { tplLoading.value = false }
}

async function deleteTpl(templateId) {
  await templateDelete(templateId)
  tplList.value = tplList.value.filter(t => t.templateId !== templateId)
  ElMessage({ message: t('templateDeleted'), type: 'success', plain: true })
}
</script>

<style lang="scss" scoped>
.templates-page {
  max-width: 720px;
  padding: 36px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100%;

  @media (max-width: 767px) {
    padding: 24px 20px;
  }
}

/* ── List mode ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: -0.01em;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  padding: 0 14px;
  height: 34px;
  border-radius: 2px;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 60px 0;
  text-align: center;
}

.empty-icon {
  color: var(--secondary-text-color);
  opacity: 0.5;
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-top: 4px;
}

.empty-desc {
  font-size: 12.5px;
  color: var(--secondary-text-color);
  margin-bottom: 8px;
}

/* Template list */
.tpl-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--light-border-color);
  border-radius: 3px;
  overflow: hidden;
}

.tpl-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--light-border-color);
  transition: background 0.1s;
  &:last-child { border-bottom: none; }

  @media (hover: hover) {
    .tpl-btns { opacity: 0; }
    &:hover {
      background: var(--base-fill);
      .tpl-btns { opacity: 1; }
    }
  }
}

.tpl-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(204, 0, 0, 0.07);
  color: #CC0000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tpl-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tpl-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tpl-subject {
  font-size: 12px;
  color: var(--secondary-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tpl-btns {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--secondary-text-color);
  transition: background 0.12s, color 0.12s;

  &:hover {
    background: var(--base-fill);
    color: var(--el-text-color-primary);
  }
  &.danger:hover {
    background: rgba(204, 0, 0, 0.08);
    color: #CC0000;
  }
}

/* ── Editor mode ── */
.editor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--light-border-color);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--secondary-text-color);
  padding: 6px 0;
  transition: color 0.12s;
  white-space: nowrap;
  &:hover { color: var(--el-text-color-primary); }
}

.editor-title {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.save-btn {
  border-radius: 2px;
  font-weight: 600;
  font-size: 13px;
}

.editor-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 7px;

  &.editor-field {
    flex: 1;
    min-height: 0;
  }
}

.field-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--secondary-text-color);
}

.field-input {
  :deep(.el-input__wrapper) {
    border-radius: 2px;
  }
}

.editor-wrap {
  height: 320px;
  border: 1px solid var(--light-border-color);
  border-radius: 2px;
  overflow: hidden;
}
</style>

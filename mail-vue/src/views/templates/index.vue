<template>

  <!-- ── List mode ── -->
  <div class="page" v-if="!editorMode">
    <header class="page-head">
      <h1 class="page-h1">{{ $t('templates') }}</h1>
      <el-button class="add-btn" @click="openAdd">
        <Icon icon="ep:plus" width="13" height="13"/>
        {{ $t('addTemplate') }}
      </el-button>
    </header>

    <!-- Empty -->
    <div v-if="!tplList.length" class="empty-state">
      <Icon icon="material-symbols:description-outline-rounded" width="34" height="34" class="empty-icon"/>
      <div class="empty-title">{{ $t('noTemplates') }}</div>
      <div class="empty-desc">{{ $t('noTemplatesDesc') }}</div>
    </div>

    <!-- Card grid -->
    <div v-else class="card-grid">
      <div class="tpl-card" v-for="tpl in tplList" :key="tpl.templateId">
        <div class="card-top">
          <div class="card-icon">
            <Icon icon="material-symbols:description-outline-rounded" width="18" height="18"/>
          </div>
          <div class="card-actions">
            <button class="act-btn" :title="$t('change')" @click="openEdit(tpl)">
              <Icon icon="material-symbols:edit-outline-rounded" width="14" height="14"/>
            </button>
            <button class="act-btn danger" :title="$t('delete')" @click="deleteTpl(tpl.templateId)">
              <Icon icon="material-symbols:delete-outline-rounded" width="14" height="14"/>
            </button>
          </div>
        </div>
        <div class="card-name">{{ tpl.name }}</div>
        <div class="card-subject" v-if="tpl.subject">{{ tpl.subject }}</div>
        <div class="card-subject placeholder" v-else>{{ $t('noSubject') }}</div>
      </div>
    </div>
  </div>

  <!-- ── Editor mode ── -->
  <div class="page editor-page" v-else>
    <div class="editor-nav">
      <button class="back-btn" @click="cancelEdit">
        <Icon icon="ep:arrow-left" width="14" height="14"/>
        {{ $t('templates') }}
      </button>
      <div class="editor-crumb">
        {{ tplForm.templateId ? $t('editTemplate') : $t('addTemplate') }}
      </div>
      <el-button type="primary" class="save-btn" :loading="tplLoading" @click="saveTpl">
        {{ $t('save') }}
      </el-button>
    </div>

    <div class="editor-grid">
      <div class="editor-left">
        <div class="field-block">
          <label class="field-label">{{ $t('templateName') }}</label>
          <el-input v-model="tplForm.name" :placeholder="$t('templateName')" size="large"/>
        </div>
        <div class="field-block">
          <label class="field-label">{{ $t('templateSubject') }}</label>
          <el-input v-model="tplForm.subject" :placeholder="$t('subjectInputDesc')" size="large"/>
        </div>
      </div>
      <div class="editor-right">
        <div class="field-block stretch">
          <label class="field-label">{{ $t('message') }}</label>
          <div class="editor-frame">
            <tinyEditor ref="tplEditorRef" :def-value="tplForm.content" editor-id="tpl-editor"
              toolbar="bold italic underline | forecolor backcolor | bullist numlist | link | code"
              height="100%" @change="(html) => tplForm.content = html"/>
          </div>
        </div>
      </div>
    </div>
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
function cancelEdit() { editorMode.value = false }

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
.page {
  padding: 28px 40px 40px;
  max-width: 1100px;

  @media (max-width: 960px) { padding: 20px 24px 28px; }
  @media (max-width: 640px) { padding: 16px 16px 20px; }
}

.editor-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Header ── */
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--el-text-color-primary);
  margin-bottom: 20px;
}

.page-h1 {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  color: var(--el-text-color-primary);
  line-height: 1;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  height: 32px;
  padding: 0 14px;
  border-radius: 2px !important;
  flex-shrink: 0;
}

/* ── Empty ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 0;
  text-align: center;
}
.empty-icon { color: var(--secondary-text-color); opacity: 0.35; }
.empty-title { font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); }
.empty-desc  { font-size: 12.5px; color: var(--secondary-text-color); }

/* ── Card grid ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.tpl-card {
  border: 1px solid var(--light-border-color);
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.14s cubic-bezier(0.22,1,0.36,1),
              box-shadow 0.14s cubic-bezier(0.22,1,0.36,1);
  cursor: default;

  &:hover {
    border-color: var(--el-border-color);
    box-shadow: var(--card-shadow-hover);
  }
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(204,0,0,0.07);
  color: #CC0000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;

  .tpl-card:hover & { opacity: 1; }
}

.act-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--secondary-text-color);
  transition: background 0.12s, color 0.12s;
  &:hover { background: var(--base-fill); color: var(--el-text-color-primary); }
  &.danger:hover { background: rgba(204,0,0,0.08); color: #CC0000; }
}

.card-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-subject {
  font-size: 12.5px;
  color: var(--regular-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &.placeholder { color: var(--secondary-text-color); font-style: italic; }
}

/* ── Editor mode ── */
.editor-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 0 20px;
  border-bottom: 1px solid var(--light-border-color);
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--secondary-text-color);
  padding: 0;
  transition: color 0.12s;
  white-space: nowrap;
  font-family: inherit;
  &:hover { color: var(--el-text-color-primary); }
}

.editor-crumb {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.save-btn { border-radius: 2px !important; font-weight: 700 !important; }

/* ── Editor two-column ── */
.editor-grid {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 32px;
  align-items: start;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
}

.editor-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-right {
  display: flex;
  flex-direction: column;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 7px;

  &.stretch { flex: 1; }
}

.field-label {
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--secondary-text-color);
}

.editor-frame {
  height: 320px;
  border: 1px solid var(--light-border-color);
  border-radius: 2px;
  overflow: hidden;
}
</style>

<template>

  <!-- ═══════════════════════════
       LIST MODE
  ═══════════════════════════ -->
  <div class="page" v-if="!editorMode">
    <header class="page-head">
      <h1 class="page-h1">{{ $t('templates') }}</h1>
    </header>

    <div class="two-col">
      <!-- Left label -->
      <div class="col-label">
        <div class="label-title">{{ $t('templates') }}</div>
        <div class="label-desc">{{ $t('noTemplatesDesc') }}</div>
      </div>

      <!-- Right content -->
      <div class="col-body">
        <div class="col-top">
          <el-button class="add-btn" @click="openAdd">
            <Icon icon="ep:plus" width="13" height="13"/>
            {{ $t('addTemplate') }}
          </el-button>
        </div>

        <!-- Empty -->
        <div v-if="!tplList.length" class="empty-state">
          <Icon icon="material-symbols:description-outline-rounded" width="36" height="36" class="empty-icon"/>
          <div class="empty-title">{{ $t('noTemplates') }}</div>
          <div class="empty-desc">{{ $t('noTemplatesDesc') }}</div>
        </div>

        <!-- List -->
        <div v-else class="item-list">
          <div class="item-row" v-for="tpl in tplList" :key="tpl.templateId">
            <div class="item-icon">
              <Icon icon="material-symbols:description-outline-rounded" width="16" height="16"/>
            </div>
            <div class="item-body">
              <div class="item-name">{{ tpl.name }}</div>
              <div class="item-sub" v-if="tpl.subject">{{ tpl.subject }}</div>
            </div>
            <div class="item-actions">
              <button class="act-btn" @click="openEdit(tpl)">
                <Icon icon="material-symbols:edit-outline-rounded" width="15" height="15"/>
              </button>
              <button class="act-btn danger" @click="deleteTpl(tpl.templateId)">
                <Icon icon="material-symbols:delete-outline-rounded" width="15" height="15"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════
       EDITOR MODE
  ═══════════════════════════ -->
  <div class="page editor-page" v-else>
    <div class="editor-nav">
      <button class="back-btn" @click="cancelEdit">
        <Icon icon="ep:arrow-left" width="14" height="14"/>
        {{ $t('templates') }}
      </button>
      <div class="editor-breadcrumb">
        {{ tplForm.templateId ? $t('editTemplate') : $t('addTemplate') }}
      </div>
      <el-button type="primary" class="save-btn" :loading="tplLoading" @click="saveTpl">
        {{ $t('save') }}
      </el-button>
    </div>

    <div class="editor-body">
      <div class="two-col editor-two-col">
        <div class="col-label">
          <div class="label-title">{{ tplForm.templateId ? $t('editTemplate') : $t('addTemplate') }}</div>
          <div class="label-desc">{{ $t('noTemplatesDesc') }}</div>
        </div>
        <div class="col-body">
          <div class="field-block">
            <label class="field-label">{{ $t('templateName') }}</label>
            <el-input v-model="tplForm.name" :placeholder="$t('templateName')" size="large"/>
          </div>
          <div class="field-block">
            <label class="field-label">{{ $t('templateSubject') }}</label>
            <el-input v-model="tplForm.subject" :placeholder="$t('subjectInputDesc')" size="large"/>
          </div>
          <div class="field-block">
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
/* ── Shell ── */
.page {
  max-width: 860px;
  padding: 32px 48px 40px;

  @media (max-width: 960px) { padding: 24px 28px 32px; }
  @media (max-width: 640px) { padding: 16px 16px 24px; }
}

.editor-page {
  display: flex;
  flex-direction: column;
  padding-bottom: 48px;
}

/* ── Page heading ── */
.page-head {
  padding-bottom: 14px;
  border-bottom: 2px solid var(--el-text-color-primary);
  margin-bottom: 0;
}
.page-h1 {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  color: var(--el-text-color-primary);
  line-height: 1;
}

/* ── Two-column row ── */
.two-col {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 40px;
  padding: 20px 0;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 28px 0;
  }
}

.editor-two-col {
  padding-top: 0;
}

/* ── Left label column ── */
.col-label { padding-top: 2px; }

.label-title {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.label-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--secondary-text-color);
}

/* ── Right content column ── */
.col-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.col-top {
  display: flex;
  justify-content: flex-end;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  height: 34px;
  padding: 0 14px;
  border-radius: 2px !important;
  letter-spacing: 0.02em;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0 16px;
  text-align: center;
}
.empty-icon { color: var(--secondary-text-color); opacity: 0.4; }
.empty-title {
  font-size: 14px; font-weight: 700;
  color: var(--el-text-color-primary); margin-top: 4px;
}
.empty-desc { font-size: 12.5px; color: var(--secondary-text-color); }

/* ── Item list ── */
.item-list {
  border: 1px solid var(--light-border-color);
  border-radius: 3px;
  overflow: hidden;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--light-border-color);
  transition: background 0.14s cubic-bezier(0.22,1,0.36,1);

  &:last-child { border-bottom: none; }

  @media (hover: hover) {
    .item-actions { opacity: 0; }
    &:hover {
      background: var(--base-fill);
      .item-actions { opacity: 1; }
    }
  }
}

.item-icon {
  width: 32px; height: 32px;
  border-radius: 6px;
  background: rgba(204,0,0,0.07);
  color: #CC0000;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.item-body {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}

.item-name {
  font-size: 13.5px; font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.item-sub {
  font-size: 12px; color: var(--secondary-text-color);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.item-actions {
  display: flex; gap: 2px; flex-shrink: 0;
  transition: opacity 0.15s;
}

.act-btn {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px;
  border: none; background: transparent;
  border-radius: 4px; cursor: pointer;
  color: var(--secondary-text-color);
  transition: background 0.12s, color 0.12s;

  &:hover { background: var(--base-fill); color: var(--el-text-color-primary); }
  &.danger:hover { background: rgba(204,0,0,0.08); color: #CC0000; }
}

/* ── Editor mode ── */
.editor-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 0 28px;
  border-bottom: 1px solid var(--light-border-color);
  margin-bottom: 0;
}

.back-btn {
  display: flex; align-items: center; gap: 5px;
  background: transparent; border: none; cursor: pointer;
  font-size: 12.5px; font-weight: 700;
  color: var(--secondary-text-color); padding: 6px 0;
  transition: color 0.12s; white-space: nowrap; font-family: inherit;
  &:hover { color: var(--el-text-color-primary); }
}

.editor-breadcrumb {
  flex: 1; font-size: 14px; font-weight: 700;
  color: var(--el-text-color-primary);
}

.save-btn { border-radius: 2px !important; font-weight: 700 !important; }

.editor-body { flex: 1; }

/* ── Editor form fields ── */
.field-block {
  display: flex; flex-direction: column; gap: 7px;
}

.field-label {
  font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.10em;
  color: var(--secondary-text-color);
}

.editor-frame {
  height: 300px;
  border: 1px solid var(--light-border-color);
  border-radius: 2px; overflow: hidden;
}
</style>

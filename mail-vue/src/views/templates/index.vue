<template>

  <!-- ═══════════════════════════ LIST MODE ═══════════════════════════ -->
  <div class="page-outer" v-if="!editorMode">

    <div class="page-main-only">
        <div class="list-toolbar">
          <el-button class="add-btn" @click="openAdd">
            <Icon icon="ep:plus" width="13" height="13"/>
            {{ $t('addTemplate') }}
          </el-button>
        </div>

        <div v-if="!tplList.length" class="empty-state">
          <Icon icon="material-symbols:description-outline-rounded" width="32" height="32" class="empty-icon"/>
          <div class="empty-title">{{ $t('noTemplates') }}</div>
          <div class="empty-desc">{{ $t('noTemplatesDesc') }}</div>
        </div>

        <div v-else class="item-list">
          <div class="item-row" v-for="tpl in tplList" :key="tpl.templateId">
            <div class="item-icon">
              <Icon icon="material-symbols:description-outline-rounded" width="16" height="16"/>
            </div>
            <div class="item-body">
              <div class="item-name">{{ tpl.name }}</div>
              <div class="item-sub" v-if="tpl.subject">{{ tpl.subject }}</div>
              <div class="item-sub placeholder" v-else>{{ $t('noSubject') }}</div>
            </div>
            <div class="item-actions">
              <button class="act-btn" :title="$t('change')" @click="openEdit(tpl)">
                <Icon icon="material-symbols:edit-outline-rounded" width="14" height="14"/>
              </button>
              <button class="act-btn danger" :title="$t('delete')" @click="deleteTpl(tpl.templateId)">
                <Icon icon="material-symbols:delete-outline-rounded" width="14" height="14"/>
              </button>
            </div>
          </div>
        </div>

    </div>
  </div>

  <!-- ═══════════════════════════ EDITOR MODE ═══════════════════════════ -->
  <div class="page-outer editor-mode" v-else>
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

    <div class="page-grid editor-grid">
      <div class="editor-fields">
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
/* ── Outer shell ── */
.page-outer {
  max-width: 1240px;
  margin: 0 auto;
  padding: 28px 32px 56px;

  @media (max-width: 960px)  { padding: 20px 24px 40px; }
  @media (max-width: 640px)  { padding: 16px 16px 32px; }
}

.editor-mode { display: flex; flex-direction: column; gap: 0; }

/* ── Page heading ── */
.page-head {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--separator, #e5e5e5);
  margin-bottom: 24px;
}
.page-h1 {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

/* ── Two-column grid ── */
/* Full-width main (no sidebar) */
.page-main-only {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 900px;
}

.page-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.editor-grid { margin-top: 0; }

/* ── Main column ── */
.page-main { display: flex; flex-direction: column; gap: 16px; }

.list-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 16px;
  background: var(--surface, #fff);
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--separator, #e5e5e5) 80%, transparent);
  box-shadow: 0 4px 14px rgba(0,0,0,0.04);
}

.add-btn {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  height: 36px; padding: 0 16px;
  border-radius: 8px !important;
}

/* Empty state */
.empty-state {
  display: flex; flex-direction: column;
  align-items: flex-start; gap: 6px;
  padding: 32px 0;
}
.empty-icon { color: var(--secondary-text-color); opacity: 0.35; }
.empty-title { font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); }
.empty-desc  { font-size: 12.5px; color: var(--secondary-text-color); }

/* Item list */
.item-list {
  background: var(--surface, #fff);
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--separator, #e5e5e5) 80%, transparent);
  box-shadow: 0 4px 14px rgba(0,0,0,0.04);
  overflow: hidden;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--light-border-color);
  transition: background 0.12s ease;

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
  width: 32px; height: 32px; border-radius: 3px;
  background: rgba(204,0,0,0.08);
  border: 1px solid rgba(204,0,0,0.15);
  color: #CC0000;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

.item-name {
  font-size: 13.5px; font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.item-sub {
  font-size: 12px; color: var(--secondary-text-color);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  &.placeholder { font-style: italic; }
}

.item-actions {
  display: flex; gap: 2px; flex-shrink: 0;
  transition: opacity 0.14s;
}

.act-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  border: none; background: transparent;
  border-radius: 3px; cursor: pointer;
  color: var(--secondary-text-color);
  transition: background 0.10s, color 0.10s;

  &:hover { background: var(--base-fill); color: var(--el-text-color-primary); }
  &.danger:hover { background: rgba(204,0,0,0.08); color: #CC0000; }
}

/* ── Editor mode ── */
.editor-nav {
  display: flex; align-items: center; gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--light-border-color);
  margin-bottom: 24px;
}

.back-btn {
  display: flex; align-items: center; gap: 5px;
  background: transparent; border: none; cursor: pointer;
  font-size: 12.5px; font-weight: 700;
  color: var(--secondary-text-color); padding: 0;
  transition: color 0.12s; white-space: nowrap; font-family: inherit;
  &:hover { color: var(--el-text-color-primary); }
}

.editor-crumb {
  flex: 1; font-size: 14px; font-weight: 700; color: var(--el-text-color-primary);
}

.save-btn { border-radius: 2px !important; font-weight: 700 !important; }

.editor-fields { display: flex; flex-direction: column; gap: 16px; }

.field-block { display: flex; flex-direction: column; gap: 7px; }

.field-label {
  font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.10em;
  color: var(--secondary-text-color);
}

.editor-frame {
  height: 320px;
  border: 1px solid var(--light-border-color);
  border-radius: 2px; overflow: hidden;
}

/* ═══════════════════════════════════════════
   RIGHT SIDEBAR
═══════════════════════════════════════════ */
.page-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: sticky;
  top: 24px;

  @media (max-width: 1160px) { display: none; }
}

.sidebar-block {
  padding: 16px 0;
  border-bottom: 1px solid var(--light-border-color);

  &:first-child { padding-top: 0; }
  &.last { border-bottom: none; }
}

.sb-label {
  font-size: 9.5px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.16em;
  color: var(--secondary-text-color);
  margin-bottom: 10px;
}

.sb-text {
  font-size: 12.5px; line-height: 1.7;
  color: var(--regular-text-color); margin: 0;
}

.sb-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 7px;

  li {
    font-size: 12.5px; line-height: 1.55;
    color: var(--regular-text-color);
    padding-left: 12px;
    position: relative;

    &::before {
      content: '—';
      position: absolute; left: 0;
      color: #CC0000;
      font-weight: 700;
    }
  }
}

.sb-stat {
  display: flex; align-items: baseline; gap: 6px;
}

.sb-stat-num {
  font-size: 32px; font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.sb-stat-unit {
  font-size: 12px; color: var(--secondary-text-color);
}

.sb-shortcut-row {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px;

  kbd {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px; font-weight: 700;
    background: var(--base-fill);
    border: 1px solid var(--light-border-color);
    border-radius: 3px;
    padding: 2px 6px;
    color: var(--el-text-color-primary);
  }

  span { color: var(--secondary-text-color); }
}

.sb-shortcut-desc {
  font-size: 12px; color: var(--regular-text-color);
  margin-left: 6px;
}
</style>

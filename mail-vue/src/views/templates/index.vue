<template>

  <!-- ═══════════════════════════ LIST MODE ═══════════════════════════ -->
  <div class="page-outer" v-if="!editorMode">

    <div class="page-main-only">
        <!-- Toolbar: stats + category tabs + add button -->
        <div class="list-toolbar">
          <div class="toolbar-left">
            <div class="stat-chip">
              <span class="stat-num">{{ tplList.length }}</span>
              <span class="stat-lbl">{{ $t('templateUnit') }}</span>
            </div>
            <!-- Category tabs (only when templates exist) -->
            <div class="cat-tabs" v-if="tplList.length && allCategories.length">
              <button
                class="cat-tab"
                :class="{ active: activeCategory === '__all__' }"
                @click="activeCategory = '__all__'"
              >
                {{ $t('all') }}
                <span class="cat-count">{{ tplList.length }}</span>
              </button>
              <button
                v-for="cat in allCategories" :key="cat"
                class="cat-tab"
                :class="{ active: activeCategory === cat }"
                @click="activeCategory = cat"
              >
                {{ cat }}
                <span class="cat-count">{{ categoryCount[cat] || 0 }}</span>
              </button>
              <button
                v-if="categoryCount[''] > 0"
                class="cat-tab"
                :class="{ active: activeCategory === '__none__' }"
                @click="activeCategory = '__none__'"
              >
                {{ $t('uncategorized') }}
                <span class="cat-count">{{ categoryCount[''] }}</span>
              </button>
            </div>
          </div>
          <el-button class="add-btn" @click="openAdd">
            <Icon icon="solar:add-circle-linear" width="13" height="13"/>
            {{ $t('addTemplate') }}
          </el-button>
        </div>

        <div v-if="!tplList.length" class="empty-state">
          <Icon icon="solar:document-text-linear" width="32" height="32" class="empty-icon"/>
          <div class="empty-title">{{ $t('noTemplates') }}</div>
          <div class="empty-desc">{{ $t('noTemplatesDesc') }}</div>
        </div>

        <div v-else-if="!filteredList.length" class="empty-state">
          <Icon icon="solar:filter-linear" width="32" height="32" class="empty-icon"/>
          <div class="empty-title">{{ activeCategory === '__none__' ? $t('uncategorized') : activeCategory }}</div>
          <div class="empty-desc">{{ $t('noTemplates') }}</div>
        </div>

        <div v-else class="item-list">
          <div class="item-row" v-for="tpl in filteredList" :key="tpl.templateId">
            <div class="item-icon">
              <Icon icon="solar:document-text-linear" width="16" height="16"/>
            </div>
            <div class="item-body">
              <div class="item-name">{{ tpl.name }}</div>
              <div class="item-meta">
                <span class="item-sub" v-if="tpl.subject">{{ tpl.subject }}</span>
                <span class="item-sub placeholder" v-else>{{ $t('noSubject') }}</span>
                <span class="item-cat" v-if="tplCats[tpl.templateId]">{{ tplCats[tpl.templateId] }}</span>
              </div>
            </div>
            <div class="item-actions">
              <button class="act-btn" :title="$t('change')" @click="openEdit(tpl)">
                <Icon icon="solar:pen-linear" width="14" height="14"/>
              </button>
              <button class="act-btn danger" :title="$t('delete')" @click="deleteTpl(tpl.templateId)">
                <Icon icon="solar:trash-bin-trash-linear" width="14" height="14"/>
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
        <Icon icon="solar:alt-arrow-left-linear" width="14" height="14"/>
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
        <div class="field-row">
          <div class="field-block field-grow">
            <label class="field-label">{{ $t('templateName') }}</label>
            <el-input v-model="tplForm.name" :placeholder="$t('templateName')" size="large"/>
          </div>
          <div class="field-block field-cat">
            <label class="field-label">{{ $t('category') }}</label>
            <el-select
              v-model="tplForm.category"
              :placeholder="$t('categoryPlaceholder')"
              filterable
              allow-create
              clearable
              size="large"
              class="cat-select"
            >
              <el-option v-for="cat in allCategories" :key="cat" :label="cat" :value="cat"/>
            </el-select>
          </div>
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
import { reactive, ref, computed, onMounted, defineOptions } from 'vue'
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
const tplForm = reactive({ templateId: null, name: '', subject: '', content: '', category: '' })

// ── Category system (persisted in localStorage) ─────────────────
const CATS_KEY = 'psg-tpl-cats'
const tplCats = ref(JSON.parse(localStorage.getItem(CATS_KEY) || '{}'))
const activeCategory = ref('__all__')

function saveCats() {
  localStorage.setItem(CATS_KEY, JSON.stringify(tplCats.value))
}

const allCategories = computed(() =>
  [...new Set(Object.values(tplCats.value).filter(Boolean))].sort()
)

const categoryCount = computed(() => {
  const counts = { '': 0 }
  tplList.value.forEach(t => {
    const cat = tplCats.value[t.templateId] || ''
    counts[cat] = (counts[cat] || 0) + 1
  })
  return counts
})

const filteredList = computed(() => {
  if (activeCategory.value === '__all__') return tplList.value
  if (activeCategory.value === '__none__') return tplList.value.filter(t => !tplCats.value[t.templateId])
  return tplList.value.filter(t => tplCats.value[t.templateId] === activeCategory.value)
})
// ────────────────────────────────────────────────────────────────

onMounted(() => {
  templateList().then(list => tplList.value = list).catch(() => {})
})

function openAdd() {
  Object.assign(tplForm, { templateId: null, name: '', subject: '', content: '', category: '' })
  editorMode.value = true
}
function openEdit(tpl) {
  Object.assign(tplForm, {
    templateId: tpl.templateId, name: tpl.name, subject: tpl.subject, content: tpl.content,
    category: tplCats.value[tpl.templateId] || ''
  })
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
      // Save category
      if (tplForm.category.trim()) tplCats.value[tplForm.templateId] = tplForm.category.trim()
      else delete tplCats.value[tplForm.templateId]
      saveCats()
    } else {
      const newTpl = await templateAdd(tplForm.name, tplForm.subject, html)
      tplList.value.unshift(newTpl)
      // Save category for new template
      if (tplForm.category.trim()) { tplCats.value[newTpl.templateId] = tplForm.category.trim(); saveCats() }
    }
    editorMode.value = false
    ElMessage({ message: t('templateSaved'), type: 'success', plain: true })
  } finally { tplLoading.value = false }
}

async function deleteTpl(templateId) {
  try {
    await templateDelete(templateId)
    tplList.value = tplList.value.filter(t => t.templateId !== templateId)
    delete tplCats.value[templateId]
    saveCats()
    ElMessage({ message: t('templateDeleted'), type: 'success', plain: true })
  } catch {}
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

/* Full-width main (no sidebar) */
.page-main-only {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 900px;
}

.page-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
.editor-grid { margin-top: 0; }
.page-main { display: flex; flex-direction: column; gap: 16px; }

/* ── Toolbar ── */
.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--surface, #fff);
  border-radius: 0;
  border: 1px solid var(--light-border, #000000);
  box-shadow: none;
  min-height: 52px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-shrink: 0;
}

.stat-num {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.stat-lbl {
  font-size: 11px;
  color: var(--secondary-text-color);
  font-weight: 500;
}

/* ── Category tabs ── */
.cat-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.cat-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--regular-text-color);
  font-family: inherit;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  white-space: nowrap;

  &:hover { background: var(--base-fill); border-color: var(--light-border-color); }

  &.active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
  }
}

.cat-count {
  font-size: 10px;
  font-weight: 700;
  background: var(--base-fill);
  border: 1px solid var(--light-border-color);
  padding: 0 4px;
  min-width: 16px;
  height: 16px;
  line-height: 14px;
  text-align: center;
  color: var(--secondary-text-color);

  .cat-tab.active & {
    background: var(--el-color-primary-light-7);
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
  }
}

.add-btn {
  font-size: 13px; font-weight: 600;
  height: 34px; padding: 0 14px;
  border-radius: 0 !important;
  flex-shrink: 0;

  :deep(svg) { margin-right: 6px; }
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
  border-radius: 0;
  border: 1px solid var(--light-border, #000000);
  box-shadow: none;
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
  width: 32px; height: 32px; border-radius: 0;
  background: rgba(188,0,0,0.08);
  border: 1px solid rgba(188,0,0,0.15);
  color: #bc0000;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }

.item-name {
  font-size: 13.5px; font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.item-sub {
  font-size: 12px; color: var(--secondary-text-color);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  flex: 1; min-width: 0;
  &.placeholder { font-style: italic; }
}

.item-cat {
  font-size: 10.5px; font-weight: 700;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
  padding: 1px 7px;
  white-space: nowrap;
  flex-shrink: 0;
}

.item-actions {
  display: flex; gap: 2px; flex-shrink: 0;
  transition: opacity 0.14s;
}

.act-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  border: none; background: transparent;
  border-radius: 0; cursor: pointer;
  color: var(--secondary-text-color);
  transition: background 0.10s, color 0.10s;

  &:hover { background: var(--base-fill); color: var(--el-text-color-primary); }
  &.danger:hover { background: rgba(188,0,0,0.08); color: #bc0000; }
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

.save-btn { border-radius: 0 !important; font-weight: 700 !important; }

.editor-fields { display: flex; flex-direction: column; gap: 16px; }

/* Name + Category side by side */
.field-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;

  @media (max-width: 560px) { flex-direction: column; }
}

.field-grow { flex: 1; min-width: 0; }

.field-cat { width: 200px; flex-shrink: 0; @media (max-width: 560px) { width: 100%; } }

.field-block { display: flex; flex-direction: column; gap: 7px; }

.field-label {
  font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.10em;
  color: var(--secondary-text-color);
}

.cat-select {
  width: 100%;
  :deep(.el-select__wrapper) { border-radius: 0 !important; }
}

.editor-frame {
  height: 320px;
  border: 1px solid var(--light-border-color);
  border-radius: 0; overflow: hidden;
}
</style>

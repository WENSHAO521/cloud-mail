<template>
  <div class="page-outer" :class="{ 'editor-mode': editorMode }">

    <!-- ── LIST MODE ── -->
    <div class="page-main-only" v-if="!editorMode">
      <div class="list-toolbar">
        <el-button class="add-btn" @click="openAdd">
          <Icon icon="ep:plus" width="13" height="13"/>
          {{ $t('addRule') }}
        </el-button>
      </div>

      <div v-if="!rulesStore.rules.length" class="empty-state">
        <Icon icon="material-symbols:rule-rounded" width="32" height="32" class="empty-icon"/>
        <div class="empty-title">{{ $t('noRules') }}</div>
        <div class="empty-desc">{{ $t('noRulesDesc') }}</div>
      </div>

      <div v-else class="item-list">
        <div class="item-row" v-for="rule in rulesStore.rules" :key="rule.id">
          <div class="item-icon" :class="{ disabled: !rule.enabled }">
            <Icon icon="material-symbols:rule-rounded" width="16" height="16"/>
          </div>
          <div class="item-body">
            <div class="item-name">{{ rule.name }}</div>
            <div class="item-sub">
              <span class="cond-label">{{ $t(conditionLabel(rule.conditionType)) }}</span>
              <span v-if="rule.conditionType !== 'all'"> "{{ rule.conditionValue }}"</span>
              <span class="arrow"> → </span>
              <span class="act-label">{{ $t(actionLabel(rule.action)) }}</span>
            </div>
          </div>
          <div class="item-actions">
            <el-switch v-model="rule.enabled" size="small" @change="rulesStore.$patch({})" />
            <button class="act-btn" :title="$t('change')" @click="openEdit(rule)">
              <Icon icon="material-symbols:edit-outline-rounded" width="14" height="14"/>
            </button>
            <button class="act-btn danger" :title="$t('delete')" @click="deleteRule(rule.id)">
              <Icon icon="material-symbols:delete-outline-rounded" width="14" height="14"/>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── EDITOR MODE ── -->
    <template v-else>
      <div class="editor-nav">
        <button class="back-btn" @click="cancelEdit">
          <Icon icon="ep:arrow-left" width="14" height="14"/>
          {{ $t('emailRules') }}
        </button>
        <div class="editor-crumb">
          {{ ruleForm.id ? $t('editRule') : $t('addRule') }}
        </div>
        <el-button type="primary" class="save-btn" @click="saveRule">
          {{ $t('save') }}
        </el-button>
      </div>

      <div class="editor-fields">
        <div class="field-block">
          <label class="field-label">{{ $t('ruleName') }}</label>
          <el-input v-model="ruleForm.name" :placeholder="$t('ruleName')" size="large"/>
        </div>
        <div class="field-block">
          <label class="field-label">{{ $t('ruleConditionType') }}</label>
          <el-select v-model="ruleForm.conditionType" size="large" style="width:100%">
            <el-option value="sender"  :label="$t('conditionSender')" />
            <el-option value="subject" :label="$t('conditionSubject')" />
            <el-option value="all"     :label="$t('ruleMatchAll')" />
          </el-select>
        </div>
        <div class="field-block" v-if="ruleForm.conditionType !== 'all'">
          <label class="field-label">{{ $t('ruleConditionValue') }}</label>
          <el-input v-model="ruleForm.conditionValue" :placeholder="$t('ruleConditionPlaceholder')" size="large"/>
        </div>
        <div class="field-block">
          <label class="field-label">{{ $t('ruleActionType') }}</label>
          <el-select v-model="ruleForm.action" size="large" style="width:100%">
            <el-option value="star"     :label="$t('actionStar')" />
            <el-option value="archive"  :label="$t('actionArchive')" />
            <el-option value="markRead" :label="$t('actionMarkRead')" />
          </el-select>
        </div>
        <div class="field-block">
          <el-checkbox v-model="ruleForm.enabled">{{ $t('ruleEnabledLabel') }}</el-checkbox>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { reactive, ref, defineOptions } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { useRulesStore } from '@/store/rules.js'

defineOptions({ name: 'rules' })

const { t } = useI18n()
const rulesStore = useRulesStore()

const editorMode = ref(false)
const ruleForm = reactive({ id: null, name: '', conditionType: 'sender', conditionValue: '', action: 'star', enabled: true })

function openAdd() {
  Object.assign(ruleForm, { id: null, name: '', conditionType: 'sender', conditionValue: '', action: 'star', enabled: true })
  editorMode.value = true
}

function openEdit(rule) {
  Object.assign(ruleForm, { ...rule })
  editorMode.value = true
}

function cancelEdit() { editorMode.value = false }

function saveRule() {
  if (!ruleForm.name.trim()) {
    ElMessage({ message: t('ruleName') + ' ' + t('emptyContentMsg'), type: 'error', plain: true })
    return
  }
  if (ruleForm.conditionType !== 'all' && !ruleForm.conditionValue.trim()) {
    ElMessage({ message: t('ruleConditionValue') + ' ' + t('emptyContentMsg'), type: 'error', plain: true })
    return
  }
  if (ruleForm.id) {
    const idx = rulesStore.rules.findIndex(r => r.id === ruleForm.id)
    if (idx > -1) rulesStore.rules[idx] = { ...ruleForm }
  } else {
    rulesStore.rules.push({ ...ruleForm, id: Date.now() })
  }
  editorMode.value = false
  ElMessage({ message: t('ruleSaved'), type: 'success', plain: true })
}

function deleteRule(id) {
  rulesStore.rules = rulesStore.rules.filter(r => r.id !== id)
  ElMessage({ message: t('ruleDeleted'), type: 'success', plain: true })
}

function conditionLabel(type) {
  return { sender: 'conditionSender', subject: 'conditionSubject', all: 'ruleMatchAll' }[type] || type
}
function actionLabel(action) {
  return { star: 'actionStar', archive: 'actionArchive', markRead: 'actionMarkRead' }[action] || action
}
</script>

<style lang="scss" scoped>
.page-outer {
  max-width: 900px;
  margin: 0 auto;
  padding: 28px 32px 56px;
  @media (max-width: 640px) { padding: 16px 16px 32px; }
}
.editor-mode { display: flex; flex-direction: column; }
.page-main-only { display: flex; flex-direction: column; gap: 16px; max-width: 780px; }
.list-toolbar {
  display: flex; justify-content: flex-end; align-items: center;
  padding: 12px 16px;
  background: var(--surface, #fff);
  border: 1px solid var(--light-border, #000000);
}
.add-btn {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  height: 36px; padding: 0 16px;
  border-radius: 0 !important;
}
.empty-state {
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 32px 0;
}
.empty-icon { color: var(--secondary-text-color); opacity: 0.35; }
.empty-title { font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); }
.empty-desc  { font-size: 12.5px; color: var(--secondary-text-color); }
.item-list {
  background: var(--surface, #fff);
  border: 1px solid var(--light-border, #000000);
  overflow: hidden;
}
.item-row {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--light-border-color);
  &:last-child { border-bottom: none; }
  @media (hover: hover) {
    .item-actions { opacity: 0; }
    &:hover { background: var(--base-fill); .item-actions { opacity: 1; } }
  }
}
.item-icon {
  width: 32px; height: 32px;
  background: rgba(188,0,0,0.08); border: 1px solid rgba(188,0,0,0.15); color: #bc0000;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  &.disabled { background: var(--base-fill); border-color: var(--light-border-color); color: var(--secondary-text-color); }
}
.item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.item-name { font-size: 13.5px; font-weight: 700; color: var(--el-text-color-primary); }
.item-sub { font-size: 12px; color: var(--secondary-text-color); }
.cond-label, .act-label { font-weight: 600; color: var(--el-text-color-primary); }
.arrow { color: var(--secondary-text-color); }
.item-actions {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  transition: opacity 0.14s;
}
.act-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  border: none; background: transparent; border-radius: 0; cursor: pointer;
  color: var(--secondary-text-color); transition: background 0.10s, color 0.10s;
  &:hover { background: var(--base-fill); color: var(--el-text-color-primary); }
  &.danger:hover { background: rgba(188,0,0,0.08); color: #bc0000; }
}
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
  color: var(--secondary-text-color); padding: 0; font-family: inherit;
  &:hover { color: var(--el-text-color-primary); }
}
.editor-crumb { flex: 1; font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); }
.save-btn { border-radius: 0 !important; font-weight: 700 !important; }
.editor-fields { display: flex; flex-direction: column; gap: 16px; max-width: 520px; }
.field-block { display: flex; flex-direction: column; gap: 7px; }
.field-label {
  font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.10em;
  color: var(--secondary-text-color);
}
</style>

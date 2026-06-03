<template>
  <div class="page">

    <header class="page-head">
      <h1 class="page-h1">{{ $t('contactGroups') }}</h1>
    </header>

    <div class="two-col">
      <!-- Left label -->
      <div class="col-label">
        <div class="label-title">{{ $t('contactGroups') }}</div>
        <div class="label-desc">{{ $t('noGroupsDesc') }}</div>
      </div>

      <!-- Right content -->
      <div class="col-body">
        <div class="col-top">
          <el-button class="add-btn" @click="openAdd">
            <Icon icon="ep:plus" width="13" height="13"/>
            {{ $t('addGroup') }}
          </el-button>
        </div>

        <!-- Empty -->
        <div v-if="!groupList.length" class="empty-state">
          <Icon icon="material-symbols:group-outline" width="36" height="36" class="empty-icon"/>
          <div class="empty-title">{{ $t('noGroups') }}</div>
          <div class="empty-desc">{{ $t('noGroupsDesc') }}</div>
        </div>

        <!-- Group list -->
        <div v-else class="group-list">
          <div class="group-card" v-for="g in groupList" :key="g.groupId">

            <div class="group-header" @click="toggleExpand(g.groupId)">
              <div class="group-left">
                <div class="group-avatar">{{ (g.name || '?')[0].toUpperCase() }}</div>
                <div class="group-info">
                  <div class="group-name">{{ g.name }}</div>
                  <div class="group-count">
                    {{ g.contacts.length }}&thinsp;{{ g.contacts.length === 1 ? $t('memberSingle') : $t('memberPlural') }}
                  </div>
                </div>
              </div>
              <div class="group-right" @click.stop>
                <button class="act-btn" @click="openEdit(g)">
                  <Icon icon="material-symbols:edit-outline-rounded" width="15" height="15"/>
                </button>
                <button class="act-btn danger" @click="deleteGroup(g.groupId)">
                  <Icon icon="material-symbols:delete-outline-rounded" width="15" height="15"/>
                </button>
                <span class="chevron" :class="{ open: expandedIds.has(g.groupId) }">
                  <Icon icon="ep:arrow-down" width="13" height="13"/>
                </span>
              </div>
            </div>

            <transition name="slide">
              <div v-if="expandedIds.has(g.groupId)" class="member-list">
                <div v-if="!g.contacts.length" class="member-empty">{{ $t('noContacts') }}</div>
                <div class="member-row" v-for="(c, i) in g.contacts" :key="i">
                  <div class="member-dot">{{ (c.name || c.email || '?')[0].toUpperCase() }}</div>
                  <div class="member-info">
                    <span class="member-name" v-if="c.name">{{ c.name }}</span>
                    <span class="member-email" :class="{ solo: !c.name }">{{ c.email }}</span>
                  </div>
                </div>
              </div>
            </transition>

          </div>
        </div>
      </div>
    </div>

    <!-- ── Drawer ── -->
    <el-drawer
      v-model="drawerShow"
      :title="groupForm.groupId ? $t('editGroup') : $t('addGroup')"
      direction="rtl"
      size="440px"
      :close-on-click-modal="false"
    >
      <div class="drawer-body">

        <div class="drawer-field">
          <label class="drawer-label">{{ $t('groupName') }}</label>
          <el-input v-model="groupForm.name" :placeholder="$t('groupName')" size="large"/>
        </div>

        <div class="drawer-field">
          <div class="members-head">
            <label class="drawer-label">{{ $t('contactMembers') }}</label>
            <button class="add-member-btn" @click="addContact">
              <Icon icon="ep:plus" width="12" height="12"/>
              {{ $t('addContact') }}
            </button>
          </div>

          <div v-if="!groupForm.contacts.length" class="members-empty">{{ $t('noContacts') }}</div>

          <div class="member-editor" v-else>
            <div class="editor-row" v-for="(c, i) in groupForm.contacts" :key="i">
              <div class="row-avatar">{{ ((c.name || c.email || String(i + 1))[0] || '#').toUpperCase() }}</div>
              <div class="row-fields">
                <el-input v-model="c.name" :placeholder="$t('namePlaceholder')" size="small" class="no-border-input"/>
                <el-input v-model="c.email" :placeholder="$t('emailAccount')" size="small" class="no-border-input mono-input"/>
              </div>
              <button class="remove-btn" @click="removeContact(i)">
                <Icon icon="ep:close" width="13" height="13"/>
              </button>
            </div>
          </div>
        </div>

      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerShow = false">{{ $t('cancel') }}</el-button>
          <el-button type="primary" :loading="groupLoading" @click="saveGroup">{{ $t('save') }}</el-button>
        </div>
      </template>
    </el-drawer>

  </div>
</template>

<script setup>
import { reactive, ref, onMounted, defineOptions } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { contactGroupList, contactGroupAdd, contactGroupUpdate, contactGroupDelete } from '@/request/contact-group.js'

defineOptions({ name: 'groups' })

const { t } = useI18n()
const groupList = ref([])
const drawerShow = ref(false)
const groupLoading = ref(false)
const expandedIds = ref(new Set())
const groupForm = reactive({ groupId: null, name: '', contacts: [] })

onMounted(() => {
  contactGroupList().then(list => groupList.value = list).catch(() => {})
})

function toggleExpand(groupId) {
  if (expandedIds.value.has(groupId)) expandedIds.value.delete(groupId)
  else expandedIds.value.add(groupId)
  expandedIds.value = new Set(expandedIds.value)
}

function addContact() { groupForm.contacts.push({ name: '', email: '' }) }
function removeContact(i) { groupForm.contacts.splice(i, 1) }

function openAdd() {
  Object.assign(groupForm, { groupId: null, name: '', contacts: [{ name: '', email: '' }] })
  drawerShow.value = true
}
function openEdit(g) {
  groupForm.groupId = g.groupId
  groupForm.name = g.name
  groupForm.contacts = g.contacts.map(c => ({ ...c }))
  drawerShow.value = true
}

async function saveGroup() {
  if (!groupForm.name.trim()) {
    ElMessage({ message: t('emptyUserNameMsg'), type: 'error', plain: true })
    return
  }
  const contacts = groupForm.contacts.filter(c => c.email.trim())
  groupLoading.value = true
  try {
    if (groupForm.groupId) {
      await contactGroupUpdate(groupForm.groupId, groupForm.name, contacts)
      const idx = groupList.value.findIndex(g => g.groupId === groupForm.groupId)
      if (idx > -1) groupList.value[idx] = { ...groupList.value[idx], name: groupForm.name, contacts }
    } else {
      const ng = await contactGroupAdd(groupForm.name, contacts)
      groupList.value.unshift(ng)
    }
    drawerShow.value = false
    ElMessage({ message: t('groupSaved'), type: 'success', plain: true })
  } finally { groupLoading.value = false }
}

async function deleteGroup(groupId) {
  await contactGroupDelete(groupId)
  groupList.value = groupList.value.filter(g => g.groupId !== groupId)
  expandedIds.value.delete(groupId)
  expandedIds.value = new Set(expandedIds.value)
  ElMessage({ message: t('groupDeleted'), type: 'success', plain: true })
}
</script>

<style lang="scss" scoped>
.page {
  max-width: 860px;
  padding: 36px 48px 64px;
  min-height: 100%;

  @media (max-width: 960px) { padding: 28px 28px 48px; }
  @media (max-width: 640px) { padding: 20px 16px 40px; }
}

/* ── Heading ── */
.page-head {
  padding-bottom: 24px;
  border-bottom: 2px solid var(--el-text-color-primary);
}
.page-h1 {
  font-size: 34px; font-weight: 900;
  letter-spacing: -0.05em; text-transform: uppercase;
  color: var(--el-text-color-primary); line-height: 1;
}

/* ── Two-column ── */
.two-col {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 40px;
  padding: 28px 0;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 20px; padding: 28px 0;
  }
}

.col-label { padding-top: 2px; }

.label-title {
  font-size: 11px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--el-text-color-primary); margin-bottom: 8px;
}
.label-desc {
  font-size: 12px; line-height: 1.6;
  color: var(--secondary-text-color);
}

.col-body {
  display: flex; flex-direction: column;
  gap: 16px; min-width: 0;
}

.col-top { display: flex; justify-content: flex-end; }

.add-btn {
  display: flex; align-items: center; gap: 6px;
  font-size: 12.5px; font-weight: 700;
  height: 34px; padding: 0 14px;
  border-radius: 2px !important; letter-spacing: 0.02em;
}

/* ── Empty state ── */
.empty-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 8px;
  padding: 48px 0 32px; text-align: center;
}
.empty-icon { color: var(--secondary-text-color); opacity: 0.4; }
.empty-title { font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); margin-top: 4px; }
.empty-desc { font-size: 12.5px; color: var(--secondary-text-color); }

/* ── Group list ── */
.group-list {
  display: flex; flex-direction: column; gap: 8px;
}

.group-card {
  border: 1px solid var(--light-border-color);
  border-radius: 3px; overflow: hidden;
  transition: border-color 0.14s cubic-bezier(0.22,1,0.36,1);
  &:hover { border-color: var(--el-border-color); }
}

.group-header {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 12px 14px; cursor: pointer;
  transition: background 0.14s cubic-bezier(0.22,1,0.36,1);
  &:hover { background: var(--base-fill); }
}

.group-left {
  display: flex; align-items: center;
  gap: 12px; flex: 1; min-width: 0;
}

.group-avatar {
  width: 36px; height: 36px; border-radius: 8px;
  background: rgba(204,0,0,0.08);
  border: 1px solid rgba(204,0,0,0.15);
  color: #CC0000; font-size: 14px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; letter-spacing: -0.02em;
}

.group-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.group-name {
  font-size: 14px; font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.group-count {
  font-size: 11.5px; color: var(--secondary-text-color);
}

.group-right {
  display: flex; align-items: center; gap: 2px;
  flex-shrink: 0; margin-left: 12px;
}

.act-btn {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px;
  border: none; background: transparent;
  border-radius: 4px; cursor: pointer;
  color: var(--secondary-text-color);
  opacity: 0;
  transition: background 0.12s, color 0.12s, opacity 0.15s;

  .group-card:hover & { opacity: 1; }
  &:hover { background: var(--base-fill); color: var(--el-text-color-primary); }
  &.danger:hover { background: rgba(204,0,0,0.08); color: #CC0000; }
}

.chevron {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  color: var(--secondary-text-color);
  transition: transform 0.22s cubic-bezier(0.22,1,0.36,1);
  &.open { transform: rotate(180deg); }
}

/* ── Expanded members ── */
.member-list {
  padding: 8px 14px 12px 62px;
  display: flex; flex-direction: column; gap: 2px;
  border-top: 1px solid var(--light-border-color);
  background: var(--extra-light-fill);
}

.member-empty {
  font-size: 12.5px; color: var(--secondary-text-color); padding: 4px 0;
}

.member-row {
  display: flex; align-items: center; gap: 10px; padding: 5px 0;
}

.member-dot {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--base-fill); border: 1px solid var(--light-border-color);
  color: var(--regular-text-color); font-size: 10.5px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.member-info {
  display: flex; flex-direction: column; gap: 1px; min-width: 0;
}

.member-name {
  font-size: 12.5px; font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.member-email {
  font-size: 11.5px; font-family: 'IBM Plex Mono', monospace;
  color: var(--secondary-text-color);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  &.solo { font-size: 13px; }
}

/* slide transition */
.slide-enter-active { transition: opacity 0.22s cubic-bezier(0.22,1,0.36,1), transform 0.22s cubic-bezier(0.22,1,0.36,1); }
.slide-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.slide-enter-from { opacity: 0; transform: translateY(-6px); }
.slide-leave-to   { opacity: 0; transform: translateY(-4px); }

/* ── Drawer ── */
.drawer-body {
  display: flex; flex-direction: column; gap: 24px; padding: 4px 0 24px;
}

.drawer-field { display: flex; flex-direction: column; gap: 8px; }

.drawer-label {
  font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.10em;
  color: var(--secondary-text-color);
}

.members-head {
  display: flex; align-items: center; justify-content: space-between;
}

.add-member-btn {
  display: flex; align-items: center; gap: 4px;
  background: transparent;
  border: 1px solid var(--light-border-color);
  border-radius: 2px; cursor: pointer;
  font-size: 12px; font-weight: 700;
  color: var(--regular-text-color); padding: 4px 10px;
  transition: border-color 0.12s, color 0.12s; font-family: inherit;
  &:hover { border-color: var(--el-border-color); color: var(--el-text-color-primary); }
}

.members-empty {
  font-size: 13px; color: var(--secondary-text-color);
  padding: 12px 0; text-align: center;
}

.member-editor {
  display: flex; flex-direction: column; gap: 6px; margin-top: 2px;
}

.editor-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--light-border-color);
  border-radius: 3px;
  background: var(--extra-light-fill);
  transition: border-color 0.12s;
  &:focus-within { border-color: var(--el-border-color-hover); }
}

.row-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(204,0,0,0.07);
  border: 1px solid rgba(204,0,0,0.15);
  color: #CC0000; font-size: 11px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.row-fields {
  flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0;
}

.no-border-input {
  :deep(.el-input__wrapper) {
    box-shadow: none !important; border: none !important;
    background: transparent; padding: 0 4px;
    &:hover { box-shadow: none !important; }
    &.is-focus { box-shadow: none !important; }
  }
  :deep(.el-input__inner) { font-size: 12.5px; height: 22px; }
}

.mono-input {
  :deep(.el-input__inner) {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px; color: var(--secondary-text-color);
  }
}

.remove-btn {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  border: none; background: transparent;
  border-radius: 4px; cursor: pointer;
  color: var(--secondary-text-color); flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
  &:hover { background: rgba(204,0,0,0.08); color: #CC0000; }
}

.drawer-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding-top: 12px; border-top: 1px solid var(--light-border-color);
}
</style>

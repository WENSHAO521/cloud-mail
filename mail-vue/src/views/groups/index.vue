<template>
  <div class="groups-page">

    <div class="page-header">
      <div class="page-title">{{ $t('contactGroups') }}</div>
      <el-button class="action-btn" @click="openAdd">
        <Icon icon="ep:plus" width="14" height="14" />
        {{ $t('addGroup') }}
      </el-button>
    </div>

    <!-- Empty state -->
    <div v-if="!groupList.length" class="empty-state">
      <div class="empty-icon">
        <Icon icon="material-symbols:group-outline" width="40" height="40" />
      </div>
      <div class="empty-title">{{ $t('noGroups') }}</div>
      <div class="empty-desc">{{ $t('noGroupsDesc') }}</div>
      <el-button class="action-btn" @click="openAdd">
        <Icon icon="ep:plus" width="14" height="14" />
        {{ $t('addGroup') }}
      </el-button>
    </div>

    <!-- Group list -->
    <div v-else class="group-list">
      <div class="group-card" v-for="g in groupList" :key="g.groupId">
        <div class="card-header" @click="toggleExpand(g.groupId)">
          <div class="card-left">
            <div class="group-avatar">
              {{ (g.name || '?')[0].toUpperCase() }}
            </div>
            <div class="card-meta">
              <div class="group-name">{{ g.name }}</div>
              <div class="member-hint">
                {{ g.contacts.length }} {{ g.contacts.length === 1 ? $t('memberSingle') : $t('memberPlural') }}
              </div>
            </div>
          </div>
          <div class="card-right" @click.stop>
            <button class="icon-btn" :title="$t('change')" @click="openEdit(g)">
              <Icon icon="material-symbols:edit-outline-rounded" width="16" height="16" />
            </button>
            <button class="icon-btn danger" :title="$t('delete')" @click="deleteGroup(g.groupId)">
              <Icon icon="material-symbols:delete-outline-rounded" width="16" height="16" />
            </button>
            <div class="chevron" :class="{ open: expandedIds.has(g.groupId) }">
              <Icon icon="ep:arrow-down" width="13" height="13" />
            </div>
          </div>
        </div>

        <!-- Expanded members -->
        <div v-if="expandedIds.has(g.groupId)" class="member-list">
          <div v-if="!g.contacts.length" class="member-empty">
            {{ $t('noContacts') }}
          </div>
          <div class="member-row" v-for="(c, i) in g.contacts" :key="i">
            <div class="member-avatar">{{ (c.name || c.email || '?')[0].toUpperCase() }}</div>
            <div class="member-info">
              <div class="member-name" v-if="c.name">{{ c.name }}</div>
              <div class="member-email" :class="{ solo: !c.name }">{{ c.email }}</div>
            </div>
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
      class="group-drawer"
    >
      <div class="drawer-body">

        <div class="drawer-field">
          <label class="drawer-label">{{ $t('groupName') }}</label>
          <el-input
            v-model="groupForm.name"
            :placeholder="$t('groupName')"
            size="large"
            class="drawer-input"
          />
        </div>

        <div class="drawer-field members-field">
          <div class="members-header">
            <label class="drawer-label">{{ $t('contactMembers') }}</label>
            <button class="add-member-btn" @click="addContact">
              <Icon icon="ep:plus" width="13" height="13" />
              {{ $t('addContact') }}
            </button>
          </div>

          <div v-if="!groupForm.contacts.length" class="members-empty">
            {{ $t('noContacts') }}
          </div>

          <div class="member-editor" v-else>
            <div class="editor-row" v-for="(c, i) in groupForm.contacts" :key="i">
              <div class="row-avatar">
                {{ ((c.name || c.email || String(i + 1))[0] || '#').toUpperCase() }}
              </div>
              <div class="row-inputs">
                <el-input
                  v-model="c.name"
                  :placeholder="$t('namePlaceholder')"
                  size="small"
                  class="name-input"
                />
                <el-input
                  v-model="c.email"
                  :placeholder="$t('emailAccount')"
                  size="small"
                  class="email-input"
                />
              </div>
              <button class="remove-btn" @click="removeContact(i)">
                <Icon icon="ep:close" width="14" height="14" />
              </button>
            </div>
          </div>
        </div>

      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerShow = false">{{ $t('cancel') }}</el-button>
          <el-button type="primary" :loading="groupLoading" @click="saveGroup">
            {{ $t('save') }}
          </el-button>
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
  if (expandedIds.value.has(groupId)) {
    expandedIds.value.delete(groupId)
  } else {
    expandedIds.value.add(groupId)
  }
  expandedIds.value = new Set(expandedIds.value)
}

function addContact() {
  groupForm.contacts.push({ name: '', email: '' })
}

function removeContact(i) {
  groupForm.contacts.splice(i, 1)
}

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
.groups-page {
  max-width: 680px;
  padding: 36px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (max-width: 767px) {
    padding: 24px 20px;
  }
}

/* ── Header ── */
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

/* ── Empty state ── */
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
  opacity: 0.45;
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

/* ── Group list ── */
.group-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-card {
  border: 1px solid var(--light-border-color);
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--el-border-color);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.1s;
  &:hover { background: var(--base-fill); }
}

.card-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.group-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(204, 0, 0, 0.08);
  border: 1px solid rgba(204, 0, 0, 0.15);
  color: #CC0000;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.group-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-hint {
  font-size: 11.5px;
  color: var(--secondary-text-color);
}

.card-right {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  margin-left: 12px;
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
  opacity: 0;

  .group-card:hover & { opacity: 1; }

  &:hover {
    background: var(--base-fill);
    color: var(--el-text-color-primary);
  }
  &.danger:hover {
    background: rgba(204, 0, 0, 0.08);
    color: #CC0000;
  }
}

.chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--secondary-text-color);
  transition: transform 0.2s;
  &.open { transform: rotate(180deg); }
}

/* ── Expanded members ── */
.member-list {
  padding: 0 14px 12px 62px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-top: 1px solid var(--light-border-color);
  background: var(--extra-light-fill, rgba(0,0,0,0.015));
  padding-top: 10px;
}

.member-empty {
  font-size: 12.5px;
  color: var(--secondary-text-color);
  padding: 4px 0;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
}

.member-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--base-fill);
  border: 1px solid var(--light-border-color);
  color: var(--regular-text-color);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.member-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-email {
  font-size: 11.5px;
  color: var(--secondary-text-color);
  font-family: 'IBM Plex Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &.solo { font-size: 13px; }
}

/* ── Drawer ── */
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px 0 24px;
}

.drawer-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawer-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--secondary-text-color);
}

.drawer-input {
  :deep(.el-input__wrapper) { border-radius: 2px; }
}

.members-field {
  flex: 1;
}

.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-member-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px solid var(--light-border-color);
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--regular-text-color);
  padding: 4px 10px;
  transition: border-color 0.12s, color 0.12s;
  &:hover {
    border-color: var(--el-border-color);
    color: var(--el-text-color-primary);
  }
}

.members-empty {
  font-size: 13px;
  color: var(--secondary-text-color);
  padding: 12px 0 4px;
  text-align: center;
}

.member-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 2px;
}

.editor-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--light-border-color);
  border-radius: 3px;
  background: var(--extra-light-fill, rgba(0,0,0,0.015));
  transition: border-color 0.12s;
  &:focus-within { border-color: var(--el-border-color-hover); }
}

.row-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(204, 0, 0, 0.07);
  border: 1px solid rgba(204, 0, 0, 0.15);
  color: #CC0000;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.row-inputs {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.name-input, .email-input {
  :deep(.el-input__wrapper) {
    border-radius: 2px;
    box-shadow: none;
    border: 1px solid transparent;
    background: transparent;
    padding: 0 4px;
    &:hover { border-color: var(--light-border-color); }
    &.is-focus { border-color: var(--el-color-primary) !important; }
  }
  :deep(.el-input__inner) {
    font-size: 12.5px;
    height: 24px;
  }
}

.email-input {
  :deep(.el-input__inner) {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: var(--secondary-text-color);
  }
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--secondary-text-color);
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
  &:hover {
    background: rgba(204, 0, 0, 0.08);
    color: #CC0000;
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--light-border-color);
}
</style>

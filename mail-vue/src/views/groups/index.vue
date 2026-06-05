<template>
  <div class="page-outer">

    <div class="page-main-only">
        <div class="list-toolbar">
          <el-button class="add-btn" @click="openAdd">
            <Icon icon="ep:plus" width="13" height="13"/>
            {{ $t('addGroup') }}
          </el-button>
        </div>

        <div v-if="!groupList.length" class="empty-state">
          <Icon icon="material-symbols:group-outline" width="32" height="32" class="empty-icon"/>
          <div class="empty-title">{{ $t('noGroups') }}</div>
          <div class="empty-desc">{{ $t('noGroupsDesc') }}</div>
        </div>

        <div v-else class="group-list">
          <div class="group-card" v-for="g in groupList" :key="g.groupId">

            <div class="card-head" @click="toggleExpand(g.groupId)">
              <div class="card-left">
                <div class="group-avatar">{{ (g.name || '?')[0].toUpperCase() }}</div>
                <div class="card-info">
                  <div class="group-name">{{ g.name }}</div>
                  <div class="group-count">
                    {{ g.contacts.length }}&thinsp;{{ g.contacts.length === 1 ? $t('memberSingle') : $t('memberPlural') }}
                  </div>
                </div>
              </div>
              <div class="card-right" @click.stop>
                <div class="card-actions">
                  <button class="act-btn" :title="$t('change')" @click="openEdit(g)">
                    <Icon icon="material-symbols:edit-outline-rounded" width="14" height="14"/>
                  </button>
                  <button class="act-btn danger" :title="$t('delete')" @click="deleteGroup(g.groupId)">
                    <Icon icon="material-symbols:delete-outline-rounded" width="14" height="14"/>
                  </button>
                </div>
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

    <!-- Drawer -->
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
import { reactive, ref, computed, onMounted, defineOptions } from 'vue'
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

const totalContacts = computed(() => groupList.value.reduce((s, g) => s + g.contacts.length, 0))

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
.page-outer {
  max-width: 1240px;
  margin: 0 auto;
  padding: 28px 32px 56px;

  @media (max-width: 960px)  { padding: 20px 24px 40px; }
  @media (max-width: 640px)  { padding: 16px 16px 32px; }
}

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

/* Full-width main (no sidebar) */
.page-main-only {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 900px;
}

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

.empty-state {
  display: flex; flex-direction: column;
  align-items: flex-start; gap: 6px; padding: 32px 0;
}
.empty-icon { color: var(--secondary-text-color); opacity: 0.35; }
.empty-title { font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); }
.empty-desc  { font-size: 12.5px; color: var(--secondary-text-color); }

/* Group list */
.group-list {
  background: var(--surface, #fff);
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--separator, #e5e5e5) 80%, transparent);
  box-shadow: 0 4px 14px rgba(0,0,0,0.04);
  overflow: hidden;
}

.group-card {
  border-bottom: 1px solid var(--light-border-color);
  &:last-child { border-bottom: none; }
}

.card-head {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 13px 16px; cursor: pointer;
  transition: background 0.12s ease;

  @media (hover: hover) {
    .card-actions { opacity: 0; }
    &:hover {
      background: var(--base-fill);
      .card-actions { opacity: 1; }
    }
  }
}

.card-left {
  display: flex; align-items: center;
  gap: 12px; flex: 1; min-width: 0;
}

.group-avatar {
  width: 32px; height: 32px; border-radius: 3px;
  background: rgba(204,0,0,0.08);
  border: 1px solid rgba(204,0,0,0.15);
  color: #CC0000; font-size: 13px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.card-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.group-name {
  font-size: 13.5px; font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.group-count { font-size: 11.5px; color: var(--secondary-text-color); }

.card-right {
  display: flex; align-items: center; gap: 2px;
  flex-shrink: 0; margin-left: 12px;
}

.card-actions {
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

.chevron {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px;
  color: var(--secondary-text-color);
  transition: transform 0.20s cubic-bezier(0.22,1,0.36,1);
  &.open { transform: rotate(180deg); }
}

/* Expanded members */
.member-list {
  padding: 8px 16px 12px 62px;
  display: flex; flex-direction: column; gap: 2px;
  border-top: 1px solid var(--light-border-color);
  background: var(--extra-light-fill);
}

.member-empty { font-size: 12.5px; color: var(--secondary-text-color); padding: 4px 0; }

.member-row { display: flex; align-items: center; gap: 10px; padding: 4px 0; }

.member-dot {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--base-fill);
  border: 1px solid var(--light-border-color);
  color: var(--regular-text-color); font-size: 9.5px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.member-info { display: flex; align-items: baseline; gap: 8px; min-width: 0; }

.member-name {
  font-size: 12.5px; font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  flex-shrink: 0;
}

.member-email {
  font-size: 11.5px; font-family: 'IBM Plex Mono', monospace;
  color: var(--secondary-text-color);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  &.solo { font-size: 13px; }
}

.slide-enter-active { transition: opacity 0.20s ease, transform 0.20s ease; }
.slide-leave-active { transition: opacity 0.14s ease, transform 0.14s ease; }
.slide-enter-from { opacity: 0; transform: translateY(-5px); }
.slide-leave-to   { opacity: 0; transform: translateY(-3px); }

/* ═══════════════════════════════════════
   RIGHT SIDEBAR
═══════════════════════════════════════ */
.page-sidebar {
  display: flex; flex-direction: column; gap: 0;
  position: sticky; top: 24px;

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
  color: var(--secondary-text-color); margin-bottom: 10px;
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
    padding-left: 12px; position: relative;

    &::before {
      content: '—'; position: absolute; left: 0;
      color: #CC0000; font-weight: 700;
    }
  }
}

.sb-stat-pair { display: flex; gap: 24px; }

.sb-stat { display: flex; align-items: baseline; gap: 5px; }

.sb-stat-num {
  font-size: 32px; font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.sb-stat-unit { font-size: 12px; color: var(--secondary-text-color); }

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

.member-editor { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; }

.editor-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--light-border-color);
  border-radius: 2px;
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

.row-fields { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }

.no-border-input {
  :deep(.el-input__wrapper) {
    box-shadow: none !important; border: none !important;
    background: transparent; padding: 0 4px;
    &:hover, &.is-focus { box-shadow: none !important; }
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
  border-radius: 3px; cursor: pointer;
  color: var(--secondary-text-color); flex-shrink: 0;
  transition: background 0.10s, color 0.10s;
  &:hover { background: rgba(204,0,0,0.08); color: #CC0000; }
}

.drawer-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--light-border-color);
}
</style>

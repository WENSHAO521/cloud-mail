<template>
  <div class="tools-page">
    <div class="section">
      <div class="section-label">{{ $t('contactGroups') }}</div>
      <div class="tools-area">
        <div class="item-list" v-if="groupList.length">
          <div class="group-item" v-for="g in groupList" :key="g.groupId">
            <div class="group-header" @click="toggleExpand(g.groupId)">
              <div class="group-title">
                <Icon icon="material-symbols:group-outline" width="16" height="16" class="group-icon"/>
                <span class="item-name">{{ g.name }}</span>
                <span class="contact-count">{{ g.contacts.length }}</span>
              </div>
              <div class="group-actions" @click.stop>
                <span class="text-link" @click="openEditGroup(g)">{{ $t('change') }}</span>
                <span class="text-link remove" @click="deleteGroup(g.groupId)">{{ $t('delete') }}</span>
                <Icon
                  :icon="expandedIds.has(g.groupId) ? 'ep:arrow-up' : 'ep:arrow-down'"
                  width="14" height="14" class="expand-icon"
                  @click.stop="toggleExpand(g.groupId)"
                />
              </div>
            </div>

            <div v-if="expandedIds.has(g.groupId)" class="contact-list">
              <div v-if="!g.contacts.length" class="contact-empty">{{ $t('noContacts') }}</div>
              <div class="contact-row" v-for="(c, i) in g.contacts" :key="i">
                <div class="contact-avatar">{{ (c.name || c.email || '?')[0].toUpperCase() }}</div>
                <div class="contact-info">
                  <span class="contact-name" v-if="c.name">{{ c.name }}</span>
                  <span class="contact-email">{{ c.email }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-hint">{{ $t('noGroups') }}</div>
        <el-button size="small" @click="openAddGroup">{{ $t('addGroup') }}</el-button>
      </div>
    </div>

    <el-dialog v-model="groupShow" :title="groupForm.groupId ? $t('editGroup') : $t('addGroup')" width="480">
      <div class="group-form">
        <el-input v-model="groupForm.name" :placeholder="$t('groupName')" style="margin-bottom:16px"/>

        <div class="contacts-label">{{ $t('contactMembers') }}</div>
        <div class="contact-editor" v-if="groupForm.contacts.length">
          <div class="editor-row" v-for="(c, i) in groupForm.contacts" :key="i">
            <el-input v-model="c.name" :placeholder="$t('namePlaceholder')" style="flex:1"/>
            <el-input v-model="c.email" :placeholder="$t('emailAccount')" style="flex:1.5"/>
            <Icon icon="ep:close" width="16" height="16" class="remove-contact" @click="removeContact(i)"/>
          </div>
        </div>
        <el-button size="small" @click="addContact" style="margin-top:8px">
          <Icon icon="ep:plus" width="14" height="14" style="margin-right:4px"/>{{ $t('addContact') }}
        </el-button>

        <div style="margin-top:20px;display:flex;justify-content:flex-end">
          <el-button type="primary" :loading="groupLoading" @click="saveGroup">{{ $t('save') }}</el-button>
        </div>
      </div>
    </el-dialog>
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
const groupShow = ref(false)
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

function openAddGroup() {
  Object.assign(groupForm, { groupId: null, name: '', contacts: [{ name: '', email: '' }] })
  groupShow.value = true
}

function openEditGroup(g) {
  groupForm.groupId = g.groupId
  groupForm.name = g.name
  groupForm.contacts = g.contacts.map(c => ({ ...c }))
  groupShow.value = true
}

async function saveGroup() {
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
    groupShow.value = false
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
.tools-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--regular-text-color);
  border-bottom: 2px solid #CC0000;
  padding-bottom: 6px;
}

.tools-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-list {
  border: 1px solid var(--light-border-color);
  border-radius: 3px;
  overflow: hidden;
}

.group-item {
  border-bottom: 1px solid var(--light-border-color);
  &:last-child { border-bottom: none; }
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.1s;
  &:hover { background: var(--base-fill); }
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.group-icon {
  color: var(--secondary-text-color);
  flex-shrink: 0;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-count {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--secondary-text-color);
  background: var(--base-fill);
  border: 1px solid var(--light-border-color);
  border-radius: 10px;
  padding: 1px 7px;
  line-height: 1.5;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: 14px;
  font-size: 12.5px;
}

.expand-icon {
  color: var(--secondary-text-color);
  cursor: pointer;
  flex-shrink: 0;
}

.contact-list {
  padding: 0 14px 10px 38px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-empty {
  font-size: 12px;
  color: var(--secondary-text-color);
  padding: 4px 0;
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  border-radius: 2px;
}

.contact-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(204, 0, 0, 0.10);
  border: 1px solid rgba(204, 0, 0, 0.20);
  color: #CC0000;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.contact-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-email {
  font-size: 11.5px;
  color: var(--secondary-text-color);
  font-family: 'IBM Plex Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-hint {
  font-size: 13px;
  color: var(--secondary-text-color);
  padding: 4px 0;
}

.text-link {
  cursor: pointer;
  color: var(--regular-text-color);
  &:hover { color: var(--el-text-color-primary); }
  &.remove:hover { color: #CC0000; }
}

/* Dialog form */
.group-form {
  display: flex;
  flex-direction: column;
}

.contacts-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--secondary-text-color);
  margin-bottom: 8px;
}

.contact-editor {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.editor-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remove-contact {
  cursor: pointer;
  color: var(--secondary-text-color);
  flex-shrink: 0;
  &:hover { color: #CC0000; }
}
</style>

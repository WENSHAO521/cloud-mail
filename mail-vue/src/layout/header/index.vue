<template>
  <div class="header" :class="!hasPerm('email:send') ? 'not-send' : ''">
    <!-- Left: hamburger + page title -->
    <div class="header-left">
      <hanburger @click="changeAside"/>
      <span class="breadcrumb-item">{{ $t(route.meta.title) }}</span>
    </div>

    <!-- Center: Compose button (only when send perm) -->
    <div v-perm="'email:send'" class="compose-center" @click="openSend">
      <div class="compose-pill">
        <Icon icon="material-symbols:edit-outline-rounded" width="18" height="18"/>
        <span class="compose-label">{{ $t('compose') }}</span>
      </div>
    </div>

    <!-- Right: toolbar -->
    <div class="toolbar">
      <div v-if="uiStore.dark" class="icon-btn" @click="openDark($event)">
        <Icon icon="mingcute:sun-fill" width="20" height="20"/>
      </div>
      <div v-else class="icon-btn" @click="openDark($event)">
        <Icon icon="solar:moon-linear" width="20" height="20"/>
      </div>
      <div class="icon-btn" @click="openNotice">
        <Icon icon="streamline-plump:announcement-megaphone" width="20" height="20"/>
      </div>

      <!-- Avatar dropdown -->
      <el-dropdown ref="userinfoRef" @visible-change="e => userInfoShow = e" :teleported="false" popper-class="detail-dropdown">
        <div class="avatar-wrap" @click="userInfoHide">
          <div class="avatar-circle">
            {{ formatName(userStore.user.email) }}
          </div>
          <Icon class="chevron" icon="mingcute:down-small-fill" width="22" height="22"/>
        </div>
        <template #dropdown>
          <div class="user-details">
            <div class="details-head">
              <div class="details-avatar">{{ formatName(userStore.user.email) }}</div>
              <div class="details-info">
                <div class="user-name" v-if="userStore.user.name">{{ userStore.user.name }}</div>
                <div class="detail-email" @click="copyEmail(userStore.user.email)">{{ userStore.user.email }}</div>
              </div>
            </div>
            <div class="detail-role">
              <el-tag>{{ userStore.user.role.name }}</el-tag>
            </div>
            <div class="detail-divider"></div>
            <div class="action-info">
              <div class="action-row">
                <span class="action-label">{{ $t('sendCount') }}</span>
                <div class="action-val">
                  <span v-if="sendCount">{{ sendCount }}</span>
                  <el-tag v-if="!hasPerm('email:send')">{{ sendType }}</el-tag>
                  <el-tag v-else-if="!sendCount">{{ sendType }}</el-tag>
                </div>
              </div>
              <div class="action-row">
                <span class="action-label">{{ $t('accountCount') }}</span>
                <div class="action-val">
                  <el-tag v-if="settingStore.settings.manyEmail || settingStore.settings.addEmail">{{ $t('disabled') }}</el-tag>
                  <span v-else-if="accountCount && hasPerm('account:add')">{{ $t('totalUserAccount', {msg: accountCount}) }}</span>
                  <el-tag v-else-if="!accountCount && hasPerm('account:add')">{{ $t('unlimited') }}</el-tag>
                  <el-tag v-else-if="!hasPerm('account:add')">{{ $t('unauthorized') }}</el-tag>
                </div>
              </div>
            </div>
            <div class="logout">
              <el-button type="primary" :loading="logoutLoading" @click="clickLogout">{{ $t('logOut') }}</el-button>
            </div>
          </div>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import router from "@/router";
import hanburger from '@/components/hamburger/index.vue'
import {logout} from "@/request/login.js";
import {Icon} from "@iconify/vue";
import {useUiStore} from "@/store/ui.js";
import {useUserStore} from "@/store/user.js";
import {useRoute} from "vue-router";
import {computed, ref} from "vue";
import {useSettingStore} from "@/store/setting.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const route = useRoute();
const settingStore = useSettingStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const logoutLoading = ref(false)
const userInfoShow = ref(false)
const userinfoRef = ref({})

const accountCount = computed(() => userStore.user.role.accountCount)

const sendType = computed(() => {
  if (settingStore.settings.send === 1) return t('disabled')
  if (!hasPerm('email:send')) return t('unauthorized')
  if (userStore.user.role.sendType === 'ban') return t('sendBanned')
  if (userStore.user.role.sendType === 'internal') return t('sendInternal')
  if (!userStore.user.role.sendCount) return t('unlimited')
  if (userStore.user.role.sendType === 'day') return t('daily')
  if (userStore.user.role.sendType === 'count') return t('total')
})

const sendCount = computed(() => {
  if (!hasPerm('email:send')) return null
  if (userStore.user.role.sendType === 'ban') return null
  if (userStore.user.role.sendType === 'internal') return null
  if (!userStore.user.role.sendCount) return null
  if (settingStore.settings.send === 1) return null
  return userStore.user.sendCount + '/' + userStore.user.role.sendCount
})

function userInfoHide() {
  if (userInfoShow.value) {
    userinfoRef.value.handleClose()
  } else {
    userinfoRef.value.handleOpen()
  }
}

async function copyEmail(email) {
  try {
    await navigator.clipboard.writeText(email)
    ElMessage({ message: t('copySuccessMsg'), type: 'success', plain: true })
  } catch (err) {
    ElMessage({ message: t('copyFailMsg'), type: 'error', plain: true })
  }
}

function openNotice() {
  uiStore.showNotice()
}

function openDark(e) {
  const nextIsDark = !uiStore.dark
  const root = document.documentElement

  if (!document.startViewTransition) {
    switchDark(nextIsDark, root)
    return
  }

  const x = e.clientX
  const y = e.clientY
  const maxX = Math.max(x, window.innerWidth - x)
  const maxY = Math.max(y, window.innerHeight - y)
  const endRadius = Math.hypot(maxX, maxY)

  root.setAttribute('data-theme-to', nextIsDark ? 'dark' : 'light')
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-end-radius', `${endRadius + 10}px`)

  const transition = document.startViewTransition(() => { switchDark(nextIsDark, root) })
  transition.finished.finally(() => { root.removeAttribute('data-theme-to') })
}

function switchDark(nextIsDark, root) {
  root.setAttribute('class', nextIsDark ? 'dark' : '')
  const metaTag = document.getElementById('theme-color-meta')
  const isMobile = !window.matchMedia("(pointer: fine) and (hover: hover)").matches
  metaTag.setAttribute('content', nextIsDark
    ? (isMobile ? '#141414' : '#000000')
    : (isMobile ? '#FFFFFF' : '#F1F1F1')
  )
  uiStore.dark = nextIsDark
}

function openSend() {
  uiStore.writerRef.open()
}

function changeAside() {
  uiStore.asideShow = !uiStore.asideShow
}

function clickLogout() {
  logoutLoading.value = true
  logout().then(() => {
    localStorage.removeItem("token")
    router.replace('/login')
  }).finally(() => {
    logoutLoading.value = false
  })
}

function formatName(email) {
  const name = userStore.user?.name?.trim()
  if (name) return name[0].toUpperCase()
  return email?.[0]?.toUpperCase() || ''
}
</script>

<style>
.detail-dropdown {
  color: var(--el-text-color-primary) !important;
}
</style>
<style lang="scss" scoped>

/* Header grid: left | center | right */
.header {
  display: grid;
  height: 100%;
  align-items: center;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  padding: 0 14px 0 6px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--light-border-color);
}

.header.not-send {
  grid-template-columns: auto 1fr auto;
}

/* Left */
.header-left {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.breadcrumb-item {
  font-weight: 600;
  font-size: 14px;
  color: var(--navy-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-left: 6px;
  letter-spacing: 0.02em;
}
.dark .breadcrumb-item {
  color: #d0daf0;
}

/* Center: compose button */
.compose-center {
  display: flex;
  justify-content: center;

  @media (max-width: 767px) {
    display: none;
  }
}

.compose-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 20px;
  border-radius: 6px;
  background: linear-gradient(135deg, #c8970a, #e8b520);
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  transition: opacity 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 8px rgba(200, 151, 10, 0.30);
  user-select: none;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);

  @media (hover: hover) {
    &:hover {
      opacity: 0.9;
      box-shadow: 0 3px 12px rgba(200, 151, 10, 0.40);
    }
  }
}

/* Right toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--secondary-text-color);
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;

  @media (hover: hover) {
    &:hover {
      background: var(--base-fill);
      color: var(--navy-primary);
    }
  }
}
.dark .icon-btn:hover {
  color: #d0daf0 !important;
}

/* Avatar */
.avatar-wrap {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 3px 4px 3px 4px;
  border-radius: 6px;
  transition: background 0.15s;
  gap: 2px;

  @media (hover: hover) {
    &:hover { background: var(--base-fill); }
  }
}

.avatar-circle {
  width: 30px;
  height: 30px;
  border-radius: 5px;
  background: linear-gradient(135deg, #1a3560, #2a4c8a);
  color: #e8c84a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  user-select: none;
  letter-spacing: 0.02em;
  box-shadow: 0 1px 4px rgba(26, 53, 96, 0.30);
}

.chevron {
  color: var(--secondary-text-color);
  margin-right: 2px;
}

/* User details dropdown */
.user-details {
  width: 280px;
  padding-bottom: 10px;

  .details-head {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px 12px;
    background: linear-gradient(135deg, #f0f3fb, #f8f9fc);
    border-bottom: 1px solid var(--light-border-color);
  }

  .details-avatar {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: linear-gradient(135deg, #1a3560, #2a4c8a);
    color: #e8c84a;
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(26, 53, 96, 0.25);
  }

  .details-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 14px;
    font-weight: 600;
    color: #1a3560;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .dark .user-name { color: #d0daf0; }

  .detail-email {
    font-size: 11.5px;
    color: var(--regular-text-color);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
    margin-top: 2px;
    font-family: 'IBM Plex Mono', monospace;
    @media (hover: hover) {
      &:hover { color: #c8970a; }
    }
  }

  .detail-role {
    padding: 10px 20px 10px;
  }

  .detail-divider {
    height: 1px;
    background: var(--light-border-color);
    margin-bottom: 10px;
  }

  .action-info {
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .action-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12.5px;
    }

    .action-label {
      color: var(--regular-text-color);
      font-weight: 500;
    }

    .action-val {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: #1a3560;
    }
  }
  .dark .action-val { color: #d0daf0 !important; }

  .logout {
    margin-top: 14px;
    padding: 0 16px;
    .el-button {
      width: 100%;
    }
  }
}

:deep(.el-popper.is-pure) {
  border-radius: 8px;
}

.el-tooltip__trigger:first-child:focus-visible {
  outline: unset;
}
</style>

<template>
  <div class="header">
    <!-- Left: hamburger + page title -->
    <div class="header-left">
      <hanburger @click="changeAside"/>
      <span class="breadcrumb-item">{{ $t(route.meta.title) }}</span>
    </div>

    <!-- Right: toolbar -->
    <div class="toolbar">
      <div v-if="uiStore.dark" class="icon-btn" @click="openDark($event)">
        <Icon icon="mingcute:sun-fill" width="20" height="20"/>
      </div>
      <div v-else class="icon-btn" @click="openDark($event)">
        <Icon icon="solar:moon-linear" width="20" height="20"/>
      </div>
      <NotificationPanel />
      <div class="icon-btn" @click="openNotice">
        <Icon icon="streamline-plump:announcement-megaphone" width="20" height="20"/>
      </div>

      <!-- Avatar dropdown -->
      <el-dropdown ref="userinfoRef" @visible-change="e => userInfoShow = e" :teleported="false" popper-class="detail-dropdown">
        <div class="avatar-wrap" @click="userInfoHide">
          <div class="avatar-circle">
            <img v-if="userStore.avatar" :src="userStore.avatar" class="avatar-photo"/>
            <span v-else>{{ formatName(userStore.user.email) }}</span>
          </div>
          <Icon class="chevron" icon="mingcute:down-small-fill" width="22" height="22"/>
        </div>
        <template #dropdown>
          <div class="user-details">
            <div class="details-head">
              <div class="details-avatar">
        <img v-if="userStore.avatar" :src="userStore.avatar" class="avatar-photo-lg"/>
        <span v-else>{{ formatName(userStore.user.email) }}</span>
      </div>
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
import NotificationPanel from '@/components/notification-panel/index.vue'
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

userStore.loadAvatar()

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

.header {
  display: flex;
  min-height: 64px;
  align-items: center;
  padding: 0 20px 0 8px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--separator, #e5e5e5);
  gap: 4px;
  position: sticky;
  top: 0;
  z-index: 20;

  :global(.dark) & {
    background: rgba(18, 18, 18, 0.92);
    border-bottom-color: rgba(255,255,255,0.08);
  }
}

.header-left {
  flex: 1;
  min-width: 0;
}

/* Left */
.header-left {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.breadcrumb-item {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-left: 8px;
  letter-spacing: -0.01em;
}

/* Right toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--muted, #666666);
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;

  @media (hover: hover) {
    &:hover {
      background: rgba(0, 0, 0, 0.07);
      color: var(--el-text-color-primary);
    }
  }
}

/* Avatar */
.avatar-wrap {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 3px 6px 3px 3px;
  transition: background 0.12s;
  gap: 4px;

  @media (hover: hover) {
    &:hover { background: rgba(0, 0, 0, 0.06); }
  }
}

.avatar-circle {
  width: 32px;
  height: 32px;
  background: #111111;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  user-select: none;
  overflow: hidden;
}

.chevron {
  color: var(--secondary-text-color);
  margin-right: 2px;
}

/* User details dropdown */
.user-details {
  width: 280px;
  padding-bottom: 12px;

  .details-head {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px 16px;
    border-bottom: 1px solid var(--separator, #e5e5e5);
    background: var(--surface-secondary, #f0f0f0);
  }

  .details-avatar {
    width: 44px;
    height: 44px;
    background: #111111;
    color: #ffffff;
    font-size: 17px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  .details-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 13.5px;
    font-weight: 700;
    color: #111111;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    letter-spacing: 0.01em;
  }

  .detail-email {
    font-size: 11px;
    color: var(--regular-text-color);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
    margin-top: 3px;
    font-family: 'IBM Plex Mono', monospace;
    @media (hover: hover) {
      &:hover { color: #CC0000; }
    }
  }

  .detail-role {
    padding: 10px 20px 8px;
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
      letter-spacing: 0.02em;
    }

    .action-val {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }

  .logout {
    margin-top: 14px;
    padding: 0 16px;
    .el-button {
      width: 100%;
    }
  }
}

:deep(.el-popper.is-pure) {
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06) !important;
  border: 1px solid var(--separator, #e5e5e5) !important;
}

.el-tooltip__trigger:first-child:focus-visible {
  outline: unset;
}

.avatar-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-photo-lg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

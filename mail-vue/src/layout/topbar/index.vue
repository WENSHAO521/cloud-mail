<template>
  <header class="topbar">
    <!-- Left: global search (mail routes) or section title -->
    <div class="tb-left">
      <div v-if="isMailRoute" class="tb-search">
        <Icon icon="iconoir:search" width="18" height="18" class="tb-search-icon"/>
        <input
          v-model="search"
          class="tb-search-input"
          :placeholder="$t('globalSearchPlaceholder')"
          @keydown.esc="search = ''"
        />
        <Icon v-if="search" icon="material-symbols:close-rounded" width="17" height="17"
              class="tb-search-clear" @click="search = ''"/>
        <kbd v-else class="tb-kbd" :title="$t('commandPlaceholder')" @click="openPalette">⌘K</kbd>
      </div>
      <h1 v-else class="tb-title">{{ pageTitle }}</h1>
    </div>

    <!-- Right: compose · sync · theme · notifications · user -->
    <div class="tb-right">
      <button v-if="canSend" class="tb-compose" @click="openCompose">
        <Icon icon="psg:compose" width="18" height="18"/>
        <span>{{ $t('compose') }}</span>
      </button>

      <div class="tb-sync" :data-online="String(online)" :title="syncLabel">
        <span class="tb-sync-dot"></span>
        <span class="tb-sync-text">{{ syncLabel }}</span>
      </div>

      <div class="tb-divider"></div>

      <button class="tb-icon-btn" :title="uiStore.dark ? $t('lightMode') : $t('darkMode')" @click="toggleDark">
        <Icon :icon="uiStore.dark ? 'mingcute:sun-fill' : 'solar:moon-linear'" width="19" height="19"/>
      </button>

      <NotificationPanel/>

      <!-- User identity -->
      <el-dropdown ref="userRef" trigger="click" placement="bottom-end" :teleported="false" popper-class="tb-user-popper">
        <div class="tb-user">
          <div class="tb-avatar">
            <img v-if="userStore.avatar" :src="userStore.avatar" class="tb-avatar-img"/>
            <span v-else>{{ initial }}</span>
          </div>
          <div class="tb-user-meta">
            <span class="tb-user-name">{{ userStore.user.name || nameFromEmail }}</span>
            <span class="tb-user-role">{{ userStore.user.role?.name }}</span>
          </div>
          <Icon class="tb-chevron" icon="mingcute:down-small-fill" width="20" height="20"/>
        </div>
        <template #dropdown>
          <div class="tb-user-card">
            <div class="tb-card-head">
              <div class="tb-card-avatar">
                <img v-if="userStore.avatar" :src="userStore.avatar" class="tb-avatar-img"/>
                <span v-else>{{ initial }}</span>
              </div>
              <div class="tb-card-info">
                <div class="tb-card-name" v-if="userStore.user.name">{{ userStore.user.name }}</div>
                <div class="tb-card-email" @click="copyEmail(userStore.user.email)">{{ userStore.user.email }}</div>
              </div>
            </div>
            <div class="tb-card-role"><el-tag>{{ userStore.user.role?.name }}</el-tag></div>
            <div class="tb-card-divider"></div>
            <div class="tb-card-rows">
              <div class="tb-card-row">
                <span class="tb-card-label">{{ $t('sendCount') }}</span>
                <div class="tb-card-val">
                  <span v-if="sendCount">{{ sendCount }}</span>
                  <el-tag v-if="!hasPerm('email:send')">{{ sendType }}</el-tag>
                  <el-tag v-else-if="!sendCount">{{ sendType }}</el-tag>
                </div>
              </div>
              <div class="tb-card-row">
                <span class="tb-card-label">{{ $t('accountCount') }}</span>
                <div class="tb-card-val">
                  <el-tag v-if="settingStore.settings.manyEmail || settingStore.settings.addEmail">{{ $t('disabled') }}</el-tag>
                  <span v-else-if="accountCount && hasPerm('account:add')">{{ $t('totalUserAccount', { msg: accountCount }) }}</span>
                  <el-tag v-else-if="!accountCount && hasPerm('account:add')">{{ $t('unlimited') }}</el-tag>
                  <el-tag v-else-if="!hasPerm('account:add')">{{ $t('unauthorized') }}</el-tag>
                </div>
              </div>
            </div>
            <div class="tb-card-actions">
              <el-button size="small" @click="goSettings">{{ $t('settings') }}</el-button>
              <el-button type="primary" size="small" :loading="logoutLoading" @click="clickLogout">{{ $t('logOut') }}</el-button>
            </div>
          </div>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import router from '@/router/index.js'
import { useUiStore } from '@/store/ui.js'
import { useUserStore } from '@/store/user.js'
import { useSettingStore } from '@/store/setting.js'
import { hasPerm } from '@/perm/perm.js'
import { logout } from '@/request/login.js'
import { avatarLetter } from '@/utils/avatar.js'
import NotificationPanel from '@/components/notification-panel/index.vue'

const { t } = useI18n()
const route = useRoute()
const uiStore = useUiStore()
const userStore = useUserStore()
const settingStore = useSettingStore()

const MAIL_ROUTES = new Set(['email', 'send', 'draft', 'star', 'archive', 'spam', 'all-email'])
const isMailRoute = computed(() => MAIL_ROUTES.has(route.meta?.name))
const pageTitle = computed(() => route.meta?.title ? t(route.meta.title) : '')

const canSend = computed(() => hasPerm('email:send'))
const search = computed({ get: () => uiStore.mailSearch, set: v => { uiStore.mailSearch = v } })

const initial = computed(() => avatarLetter(userStore.user?.name, userStore.user?.email))
const nameFromEmail = computed(() => (userStore.user?.email || '').split('@')[0])
const accountCount = computed(() => userStore.user.role?.accountCount)

/* ── Sync status (online/offline) ── */
const online = ref(navigator.onLine)
const setOnline = () => { online.value = navigator.onLine }
const syncLabel = computed(() => online.value ? t('syncSynced') : t('syncOffline'))

/* ── Send quota (mirrors header dropdown) ── */
const sendType = computed(() => {
  if (settingStore.settings.send === 1) return t('disabled')
  if (!hasPerm('email:send')) return t('unauthorized')
  if (userStore.user.role?.sendType === 'ban') return t('sendBanned')
  if (userStore.user.role?.sendType === 'internal') return t('sendInternal')
  if (!userStore.user.role?.sendCount) return t('unlimited')
  if (userStore.user.role?.sendType === 'day') return t('daily')
  if (userStore.user.role?.sendType === 'count') return t('total')
})
const sendCount = computed(() => {
  if (!hasPerm('email:send')) return null
  if (userStore.user.role?.sendType === 'ban') return null
  if (userStore.user.role?.sendType === 'internal') return null
  if (!userStore.user.role?.sendCount) return null
  if (settingStore.settings.send === 1) return null
  return userStore.user.sendCount + '/' + userStore.user.role.sendCount
})

const userRef = ref(null)
const logoutLoading = ref(false)

function openCompose() { uiStore.writerRef?.open?.() }
function openPalette() { uiStore.commandPaletteShow = true }
function goSettings() { userRef.value?.handleClose?.(); router.push({ name: 'setting' }) }

function toggleDark() {
  const next = !uiStore.dark
  document.documentElement.setAttribute('class', next ? 'dark' : '')
  uiStore.dark = next
}

async function copyEmail(email) {
  try {
    await navigator.clipboard.writeText(email)
    ElMessage({ message: t('copySuccessMsg'), type: 'success', plain: true })
  } catch (e) {
    ElMessage({ message: t('copyFailMsg'), type: 'error', plain: true })
  }
}

function clickLogout() {
  logoutLoading.value = true
  logout().then(() => {
    localStorage.removeItem('token')
    router.replace('/login')
  }).finally(() => { logoutLoading.value = false })
}

userStore.loadAvatar?.()

onMounted(() => {
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOnline)
})
onBeforeUnmount(() => {
  window.removeEventListener('online', setOnline)
  window.removeEventListener('offline', setOnline)
})
</script>

<style scoped lang="scss">
.topbar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px 0 20px;
  background: #ffffff;
  border-bottom: 1px solid var(--separator, #e5e5e5);

  :global(.dark) & {
    background: #141414;
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
}

/* ── Left ── */
.tb-left { flex: 1; min-width: 0; display: flex; align-items: center; }

.tb-search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 460px;
  height: 38px;
  padding: 0 10px 0 13px;
  background: var(--surface-secondary, #f0f0f0);
  border: 1px solid transparent;
  border-radius: 3px;
  transition: background 0.14s, border-color 0.14s, box-shadow 0.14s;

  &:focus-within {
    background: #ffffff;
    border-color: #b00000;
    box-shadow: 0 0 0 3px rgba(176, 0, 0, 0.08);
    :global(.dark) & { background: #1c1c1c; }
  }

  .tb-search-icon { color: var(--muted, #666666); flex-shrink: 0; }

  .tb-search-input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    color: var(--el-text-color-primary);
    &::placeholder { color: var(--muted, #666666); }
  }

  .tb-search-clear { color: var(--muted, #666666); cursor: pointer; flex-shrink: 0; }
}

.tb-kbd {
  flex-shrink: 0;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted, #666666);
  background: #ffffff;
  border: 1px solid var(--separator, #e5e5e5);
  border-radius: 3px;
  padding: 1px 6px;
  cursor: pointer;
  :global(.dark) & { background: #222; }
}

.tb-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Right ── */
.tb-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.tb-compose {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border: none;
  border-radius: 3px;
  background: #b00000;
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.14s;

  &:hover { background: #8a0000; }
}

.tb-sync {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 11px;
  border-radius: 3px;
  background: var(--surface-secondary, #f0f0f0);

  .tb-sync-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #b00000;
    flex-shrink: 0;
  }
  .tb-sync-text {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted, #666666);
    font-family: 'IBM Plex Mono', monospace;
  }

  &[data-online="true"] {
    .tb-sync-dot {
      background: #1f8a4c;
      box-shadow: 0 0 0 0 rgba(31, 138, 76, 0.5);
      animation: tb-pulse 2.4s ease-out infinite;
    }
  }
}

@keyframes tb-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(31, 138, 76, 0.45); }
  70%  { box-shadow: 0 0 0 6px rgba(31, 138, 76, 0); }
  100% { box-shadow: 0 0 0 0 rgba(31, 138, 76, 0); }
}

.tb-divider {
  width: 1px;
  height: 24px;
  background: var(--separator, #e5e5e5);
  margin: 0 2px;
}

.tb-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--muted, #666666);
  transition: background 0.12s, color 0.12s;

  &:hover { background: rgba(0, 0, 0, 0.06); color: var(--el-text-color-primary); }
  :global(.dark) &:hover { background: rgba(255, 255, 255, 0.08); }
}

/* ── User ── */
.tb-user {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 6px 4px 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
  max-width: 220px;

  &:hover { background: rgba(0, 0, 0, 0.05); }
  :global(.dark) &:hover { background: rgba(255, 255, 255, 0.06); }
}

.tb-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #111111;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;

  .tb-avatar-img { width: 100%; height: 100%; object-fit: cover; }
}

.tb-user-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}
.tb-user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tb-user-role {
  font-size: 10.5px;
  color: var(--muted, #666666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'IBM Plex Mono', monospace;
  letter-spacing: 0.02em;
}
.tb-chevron { color: var(--muted, #666666); flex-shrink: 0; }

/* hide name/role under a tight width */
@media (max-width: 1180px) {
  .tb-user-meta { display: none; }
  .tb-sync-text { display: none; }
}

/* ── User dropdown card ── */
.tb-user-card { width: 280px; padding-bottom: 12px; }
.tb-card-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid var(--separator, #e5e5e5);
  background: var(--surface-secondary, #f0f0f0);
}
.tb-card-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: #111111; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; font-weight: 700; flex-shrink: 0; overflow: hidden;
  .tb-avatar-img { width: 100%; height: 100%; object-fit: cover; }
}
.tb-card-info { flex: 1; min-width: 0; }
.tb-card-name {
  font-size: 13.5px; font-weight: 700; color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tb-card-email {
  font-size: 11px; color: var(--muted, #666666); margin-top: 3px;
  font-family: 'IBM Plex Mono', monospace; cursor: pointer;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  &:hover { color: #b00000; }
}
.tb-card-role { padding: 10px 20px 8px; }
.tb-card-divider { height: 1px; background: var(--separator, #e5e5e5); margin-bottom: 10px; }
.tb-card-rows { padding: 0 20px; display: flex; flex-direction: column; gap: 8px; }
.tb-card-row { display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; }
.tb-card-label { color: var(--muted, #666666); font-weight: 500; letter-spacing: 0.02em; }
.tb-card-val { display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--el-text-color-primary); }
.tb-card-actions { display: flex; gap: 8px; padding: 14px 16px 0; }
.tb-card-actions .el-button { flex: 1; }
</style>

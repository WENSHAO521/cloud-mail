<template>
  <aside class="mail-sidebar"
         :data-collapsed="String(collapsed)"
         :data-open="String(uiStore.asideShow)">

    <!-- ── Header ───────────────────────────────────────── -->
    <div class="sidebar-header">
      <div class="acct-section">
        <div class="sidebar-account-avatar" :style="{ background: acctAvatarBg }">
          <span class="acct-fallback">{{ acctInitial }}</span>
          <img v-if="userStore.avatar" :src="userStore.avatar" class="acct-img"
               @error="e => e.target.style.display = 'none'" />
        </div>
        <div class="sidebar-user-meta" @click="router.push({ name: 'setting' })">
          <div class="acct-name">{{ userStore.user.name || userStore.user.email }}</div>
          <div class="acct-email">{{ userStore.user.email }}</div>
        </div>
      </div>
      <div class="header-btns">
        <button class="icon-button sidebar-collapse-button"
                :title="collapsed ? $t('expand') : $t('collapse')"
                @click="uiStore.asideCollapsed = !uiStore.asideCollapsed">
          <Icon icon="material-symbols:menu-rounded" width="20" height="20" />
        </button>
        <button class="icon-button sidebar-close-button"
                :title="$t('close')"
                @click="uiStore.asideShow = false">
          <Icon icon="material-symbols:close-rounded" width="20" height="20" />
        </button>
      </div>
    </div>

    <!-- ── Primary nav ──────────────────────────────────── -->
    <nav class="sidebar-nav">
      <el-tooltip v-for="item in navItems" :key="item.name"
                  :content="$t(item.labelKey)" placement="right" :disabled="!collapsed">
        <div v-if="!item.perm || hasPerm(item.perm)"
             class="sidebar-nav-link"
             :class="{ active: route.meta.name === item.name }"
             @click="router.push({ name: item.name })">
          <span class="sidebar-nav-content">
            <Icon :icon="item.icon" width="20" height="20" class="nav-icon" />
            <span class="sidebar-label">{{ $t(item.labelKey) }}</span>
          </span>
        </div>
      </el-tooltip>
    </nav>

    <!-- ── Admin section ────────────────────────────────── -->
    <template v-if="visibleAdminItems.length">
      <div class="sidebar-section-separator"></div>
      <div class="sidebar-section-title">{{ $t('manage') }}</div>
      <nav class="sidebar-nav">
        <el-tooltip v-for="item in visibleAdminItems" :key="item.name"
                    :content="$t(item.labelKey)" placement="right" :disabled="!collapsed">
          <div class="sidebar-nav-link"
               :class="{ active: route.meta.name === item.name }"
               @click="router.push({ name: item.name })">
            <span class="sidebar-nav-content">
              <Icon :icon="item.icon" width="20" height="20" class="nav-icon" />
              <span class="sidebar-label">{{ $t(item.labelKey) }}</span>
            </span>
          </div>
        </el-tooltip>
      </nav>
    </template>

    <!-- ── Footer ───────────────────────────────────────── -->
    <div class="sidebar-footer">
      <div class="sidebar-bottom-actions">

        <!-- Compose — collapsed: icon only -->
        <el-tooltip v-if="canSend && collapsed" :content="$t('compose')" placement="right">
          <button class="icon-button compose-icon-btn" @click="openCompose">
            <Icon icon="psg:compose" width="20" height="20" />
          </button>
        </el-tooltip>
        <!-- Compose — expanded: full button -->
        <button v-else-if="canSend" class="sidebar-compose-button" @click="openCompose">
          <Icon icon="psg:compose" width="20" height="20" />
          <span>{{ $t('compose') }}</span>
        </button>

        <!-- ··· dropdown -->
        <el-dropdown placement="top-end" trigger="click">
          <button class="icon-button sidebar-more-button">
            <Icon icon="material-symbols:more-horiz-rounded" width="20" height="20" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="toggleDark">
                <div class="drop-item">
                  <Icon :icon="uiStore.dark ? 'material-symbols:light-mode-outline-rounded'
                                            : 'material-symbols:dark-mode-outline-rounded'"
                        width="17" height="17" />
                  <span>{{ uiStore.dark ? $t('lightMode') : $t('darkMode') }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item @click="clickLogout" class="logout-item">
                <div class="drop-item">
                  <Icon icon="material-symbols:logout-rounded" width="17" height="17" />
                  <span>{{ $t('logOut') }}</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

      </div>
    </div>

  </aside>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { useUiStore } from "@/store/ui.js";
import { useUserStore } from "@/store/user.js";
import { hasPerm } from "@/perm/perm.js";
import { logout } from "@/request/login.js";
import { computed, ref, onUnmounted } from "vue";
import { avatarBg, avatarLetter } from "@/utils/avatar.js";

const route  = useRoute();
const uiStore = useUiStore();
const userStore = useUserStore();

/* ── Collapse ── */
const isMobile = ref(window.innerWidth < 1025);
const onResize = () => { isMobile.value = window.innerWidth < 1025; };
window.addEventListener('resize', onResize);
onUnmounted(() => window.removeEventListener('resize', onResize));
const collapsed = computed(() => uiStore.asideCollapsed && !isMobile.value);

/* ── Account ── */
const acctAvatarBg = computed(() => avatarBg(userStore.user?.email || ''));
const acctInitial  = computed(() => avatarLetter(userStore.user?.name, userStore.user?.email));

/* ── Can compose ── */
const canSend = computed(() => hasPerm('email:send'));

/* ── Nav items ── */
const navItems = [
  { name: 'email',     labelKey: 'inbox',         icon: 'psg:inbox' },
  { name: 'send',      labelKey: 'sent',          icon: 'psg:send',     perm: 'email:send' },
  { name: 'draft',     labelKey: 'drafts',        icon: 'psg:draft',    perm: 'email:send' },
  { name: 'star',      labelKey: 'starred',       icon: 'psg:bookmark' },
  { name: 'archive',   labelKey: 'archiveFolder', icon: 'psg:archive' },
  { name: 'spam',      labelKey: 'spam',          icon: 'psg:spam' },
  { name: 'templates', labelKey: 'templates',     icon: 'psg:template' },
  { name: 'groups',    labelKey: 'contactGroups', icon: 'psg:group' },
  { name: 'setting',   labelKey: 'settings',      icon: 'psg:settings' },
];

const adminItems = [
  { name: 'analysis',   labelKey: 'analytics',      icon: 'psg:analytics', perm: 'analysis:query' },
  { name: 'user',       labelKey: 'allUsers',        icon: 'psg:group',     perm: 'user:query' },
  { name: 'all-email',  labelKey: 'allMail',         icon: 'psg:all-mail',  perm: 'all-email:query' },
  { name: 'role',       labelKey: 'permissions',     icon: 'psg:lock',      perm: 'role:query' },
  { name: 'reg-key',    labelKey: 'inviteCode',      icon: 'psg:key',       perm: 'reg-key:query' },
  { name: 'sys-setting',labelKey: 'SystemSettings',  icon: 'psg:system',    perm: 'setting:query' },
];

const visibleAdminItems = computed(() =>
  adminItems.filter(item => !item.perm || hasPerm(item.perm))
);

/* ── Actions ── */
function openCompose() {
  uiStore.writerRef?.open?.();
}

function toggleDark() {
  const next = !uiStore.dark;
  document.documentElement.setAttribute('class', next ? 'dark' : '');
  uiStore.dark = next;
}

function clickLogout() {
  logout().catch(() => null).finally(() => {
    localStorage.removeItem('token');
    router.replace('/login');
  });
}
</script>

<style lang="scss" scoped>
/* ══════════════════════════════════════════════════════════
   Sidebar root
   Mirrors vfasky mail-sidebar — colors replaced with PSG palette
   ══════════════════════════════════════════════════════════ */
.mail-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 260px;
  background: #111111;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  overflow: hidden;
  transition: width 0.22s cubic-bezier(0.22, 1, 0.36, 1);

  /* Mobile: fixed overlay, slides in */
  @media (max-width: 1023px) {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 50;
    width: min(86vw, 310px);
    transform: translateX(-105%);
    transition: transform 160ms ease;

    &[data-open="true"] { transform: translateX(0); }
  }
}

/* ── Header ──────────────────────────────────────────────── */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 20px 24px;
  flex-shrink: 0;
  gap: 8px;
}

.acct-section {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.sidebar-account-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  .acct-fallback {
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
  }

  .acct-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
}

.sidebar-user-meta {
  min-width: 0;
  flex: 1;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;

  @media (hover: hover) {
    &:hover .acct-name { color: #ffffff; }
  }
}

.acct-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.12s;
}

.acct-email {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.32);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-btns {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

/* ── Icon button (shared) ────────────────────────────────── */
.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.38);
  border-radius: 8px;
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;

  @media (hover: hover) {
    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.80);
    }
  }
}

/* Close button only shows on mobile */
.sidebar-close-button { display: none; }
@media (max-width: 1023px) {
  .sidebar-close-button { display: flex; }
  .sidebar-collapse-button { display: none; }
}

/* ── Nav ─────────────────────────────────────────────────── */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.sidebar-nav-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 16px;
  height: 44px;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.68);
  transition: background 0.10s ease, color 0.10s ease;
  user-select: none;

  @media (hover: hover) {
    &:not(.active):hover {
      background: rgba(255, 255, 255, 0.07);
      color: rgba(255, 255, 255, 0.90);
    }
  }

  &.active {
    background: rgba(204, 0, 0, 0.16);
    color: #ffffff;
    font-weight: 600;
  }
}

.sidebar-nav-content {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.nav-icon { flex-shrink: 0; }

.sidebar-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Admin separator + title ─────────────────────────────── */
.sidebar-section-separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
  margin: 16px 24px;
}

.sidebar-section-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.28);
  padding: 0 24px;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Footer ──────────────────────────────────────────────── */
.sidebar-footer {
  margin-top: auto;
  padding: 24px;
  flex-shrink: 0;
}

.sidebar-bottom-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.sidebar-compose-button {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #cc0000;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.14s ease;

  @media (hover: hover) {
    &:hover { background: #a80000; }
  }
  &:active { background: #880000; }
}

.sidebar-more-button {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: transparent;
}

/* ── Force icon colors inside dark sidebar footer ── */
.sidebar-footer .icon-button,
.sidebar-footer .sidebar-more-button {
  color: rgba(255, 255, 255, 0.68) !important;

  @media (hover: hover) {
    &:hover {
      background: rgba(255, 255, 255, 0.07);
      color: #fff !important;
    }
  }
}

.compose-icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #cc0000;
  color: #ffffff;
  border-radius: 8px;

  @media (hover: hover) {
    &:hover { background: #a80000; }
  }
}

/* Dropdown items */
.drop-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

:deep(.logout-item) {
  color: #cc0000 !important;
}

/* ══════════════════════════════════════════════════════════
   Collapsed state  (matches vfasky [data-collapsed="true"])
   ══════════════════════════════════════════════════════════ */
.mail-sidebar[data-collapsed="true"] {
  width: 72px;

  .sidebar-header {
    flex-direction: column;
    gap: 10px;
    align-items: center;
    justify-content: center;
    padding-inline: 12px;
  }

  .acct-section {
    justify-content: center;
    flex: none;
  }

  .sidebar-user-meta,
  .sidebar-section-title,
  .sidebar-label {
    display: none;
  }

  .sidebar-collapse-button {
    margin-left: 0;
  }

  .sidebar-nav-link {
    justify-content: center;
    margin-inline: 10px;
    padding-inline: 0;
  }

  .sidebar-nav-content {
    justify-content: center;
    gap: 0;
    flex: none;
  }

  .sidebar-section-separator {
    margin-inline: 16px;
  }

  .sidebar-footer {
    padding-inline: 14px;
  }

  .sidebar-bottom-actions {
    flex-direction: column;
    gap: 8px;
  }

  .sidebar-more-button {
    width: 36px;
    height: 36px;
  }
}
</style>

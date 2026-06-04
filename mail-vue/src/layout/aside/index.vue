<template>
  <div class="sidebar-root" :class="{ collapsed }">

    <!-- Account header — mirrors vfasky top row -->
    <div class="account-header" :class="{ collapsed }">
      <el-tooltip :content="(userStore.user.name || '') + ' · ' + (userStore.user.email || '')"
                  placement="right" :disabled="!collapsed">
        <div class="acct-row" @click="router.push({name: 'setting'})">
          <div class="acct-avatar" :style="{ background: acctAvatarBg }">
            <span class="acct-initial">{{ acctInitial }}</span>
            <img v-if="userStore.avatar" :src="userStore.avatar" class="acct-avatar-img"
                 @error="e => e.target.style.display = 'none'" />
          </div>
          <div class="acct-info" v-if="!collapsed">
            <span class="acct-name">{{ userStore.user.name || userStore.user.email }}</span>
            <span class="acct-email">{{ userStore.user.email }}</span>
          </div>
        </div>
      </el-tooltip>
      <button class="collapse-btn" @click="uiStore.asideCollapsed = !uiStore.asideCollapsed"
              :title="collapsed ? $t('expand') : $t('collapse')">
        <Icon icon="material-symbols:menu-rounded" width="20" height="20" />
      </button>
    </div>

    <!-- Scrollable nav area -->
    <el-scrollbar class="sidebar-scroll">
      <div class="sidebar-inner" :class="{ collapsed }">
        <el-menu :collapse="false">
          <el-tooltip v-for="item in navItems" :key="item.name"
                      :content="$t(item.labelKey)" placement="right"
                      :disabled="!uiStore.asideCollapsed">
            <el-menu-item
              v-if="!item.perm || hasPerm(item.perm)"
              @click="router.push({name: item.name})" :index="item.name"
              :class="route.meta.name === item.name ? 'choose-item' : ''">
              <Icon :icon="item.icon" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{ $t(item.labelKey) }}</span>
            </el-menu-item>
          </el-tooltip>

          <div class="manage-title" v-if="!collapsed"
               v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
            <span>{{ $t('manage') }}</span>
          </div>

          <el-tooltip :content="$t('analytics')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                          :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
              <Icon icon="psg:analytics" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{ $t('analytics') }}</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip :content="$t('allUsers')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'user'})" index="user" v-perm="'user:query'"
                          :class="route.meta.name === 'user' ? 'choose-item' : ''">
              <Icon icon="psg:group" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{ $t('allUsers') }}</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip :content="$t('allMail')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                          :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
              <Icon icon="psg:all-mail" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{ $t('allMail') }}</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip :content="$t('permissions')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'role'})" index="role" v-perm="'role:query'"
                          :class="route.meta.name === 'role' ? 'choose-item' : ''">
              <Icon icon="psg:lock" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{ $t('permissions') }}</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip :content="$t('inviteCode')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                          :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
              <Icon icon="psg:key" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{ $t('inviteCode') }}</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip :content="$t('SystemSettings')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                          :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
              <Icon icon="psg:system" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{ $t('SystemSettings') }}</span>
            </el-menu-item>
          </el-tooltip>
        </el-menu>
      </div>
    </el-scrollbar>

    <!-- Compose button — pinned at bottom -->
    <div class="sidebar-footer" :class="{ collapsed }">
      <el-tooltip :content="$t('compose')" placement="right" :disabled="!collapsed">
        <div class="compose-btn" v-if="canSend" @click="openCompose" :class="{ 'compose-icon-only': collapsed }">
          <Icon icon="psg:compose" width="20" height="20" class="compose-icon" />
          <span class="compose-text" v-if="!collapsed">{{ $t('compose') }}</span>
        </div>
      </el-tooltip>
    </div>

  </div>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { useUiStore } from "@/store/ui.js";
import { useUserStore } from "@/store/user.js";
import { hasPerm } from "@/perm/perm.js";
import { computed, ref, onUnmounted } from "vue";
import { avatarBg, avatarLetter } from "@/utils/avatar.js";

const route = useRoute();
const uiStore = useUiStore();
const userStore = useUserStore();

const canSend = computed(() => hasPerm('email:send'));

const isMobile = ref(window.innerWidth < 1025);
const onResize = () => { isMobile.value = window.innerWidth < 1025; }
window.addEventListener('resize', onResize);
onUnmounted(() => window.removeEventListener('resize', onResize));
const collapsed = computed(() => uiStore.asideCollapsed && !isMobile.value);

const acctAvatarBg = computed(() => avatarBg(userStore.user?.email || ''));
const acctInitial  = computed(() => avatarLetter(userStore.user?.name, userStore.user?.email));

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

function openCompose() {
  uiStore.writerRef?.open?.();
}
</script>

<style lang="scss" scoped>
/* ─── Root ─────────────────────────────────────────────── */
.sidebar-root {
  display: flex;
  flex-direction: column;
  width: 240px;
  height: 100%;
  background: #111111;
  transition: width 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;

  &.collapsed { width: 56px; }
}

/* ─── Account header ────────────────────────────────────── */
.account-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 10px 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;

  /* Collapsed: stack avatar + hamburger vertically */
  &.collapsed {
    flex-direction: column;
    padding: 12px 8px;
    gap: 6px;
    align-items: center;
  }
}

.acct-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  margin: -2px -4px;
  transition: background 0.12s;

  @media (hover: hover) {
    &:hover { background: rgba(255, 255, 255, 0.06); }
  }

  .collapsed & {
    flex: none;
    padding: 0;
    margin: 0;
    background: none !important;
  }
}

.acct-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  .acct-initial {
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0;
    line-height: 1;
  }

  .acct-avatar-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
}

.acct-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.acct-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.90);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.acct-email {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapse-btn {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.12s, color 0.12s;

  /* Hide on mobile — sidebar is a full overlay, no collapse needed */
  @media (max-width: 1024px) { display: none; }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.80);
  }
}

/* ─── Scrollable nav ────────────────────────────────────── */
.sidebar-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;

  :deep(.el-scrollbar__wrap) { background: transparent; }
}

.sidebar-inner {
  width: 240px;
  min-height: 100%;
  padding: 4px 0 8px;

  &.collapsed { width: 56px; }
}

/* ─── Section divider ───────────────────────────────────── */
.manage-title {
  padding: 16px 18px 4px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.22);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 8px;
}

/* ─── Nav items ─────────────────────────────────────────── */
:deep(.el-menu) {
  background: transparent;
  border-right: none;
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
  margin: 1px 8px !important;
  border-radius: 6px !important;
  height: 38px !important;
  padding: 0 12px !important;
  color: rgba(255, 255, 255, 0.58) !important;
  background: transparent !important;
  transition: background 0.10s ease, color 0.10s ease !important;
  gap: 0;

  .sidebar-inner.collapsed & {
    padding: 0 !important;
    margin: 1px 6px !important;
    justify-content: center !important;
    border-radius: 6px !important;
  }

  @media (hover: hover) {
    &:not(.choose-item):hover {
      background: rgba(255, 255, 255, 0.07) !important;
      color: rgba(255, 255, 255, 0.90) !important;
    }
  }
}

/* Active state */
:deep(.el-menu-item.choose-item) {
  color: #ffffff !important;
  background: rgba(192, 0, 0, 0.18) !important;
  border-left: 2px solid #cc0000 !important;
  padding-left: 10px !important;
  font-weight: 600 !important;
  border-radius: 0 6px 6px 0 !important;
  margin-left: 0 !important;
  margin-right: 8px !important;

  .sidebar-inner.collapsed & {
    border-left: none !important;
    padding-left: 0 !important;
    margin-left: 6px !important;
    border-radius: 6px !important;
    background: rgba(192, 0, 0, 0.24) !important;
  }
}

.menu-name {
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.01em;
  margin-left: 11px;
  color: inherit;
  user-select: none;
}

:deep(.el-menu-item.choose-item) .menu-name {
  font-weight: 600;
}

/* ─── Sidebar footer (compose) ──────────────────────────── */
.sidebar-footer {
  flex-shrink: 0;
  padding: 8px 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);

  &.collapsed { padding: 8px 8px 16px; }
}

.compose-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 40px;
  padding: 0 14px;
  border-radius: 6px;
  background: #cc0000;
  cursor: pointer;
  user-select: none;
  transition: background 0.14s ease;

  &.compose-icon-only {
    padding: 0;
    justify-content: center;
  }

  .compose-icon { color: #fff; flex-shrink: 0; }

  .compose-text {
    margin-left: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.03em;
  }

  @media (hover: hover) {
    &:hover { background: #a80000; }
  }
  &:active { background: #8a0000; }
}
</style>

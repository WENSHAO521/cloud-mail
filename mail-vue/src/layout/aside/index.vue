<template>
  <div class="sidebar-root" :class="{ collapsed }">
    <el-scrollbar class="sidebar-scroll">
      <div class="sidebar-inner" :class="{ collapsed }">
        <!-- Logo + collapse toggle -->
        <div class="title" :class="{ collapsed }">
          <img v-if="!collapsed" class="psg-logo" src="/image/psg-logo.png" alt="Panorama Scholarly Group" />
          <button class="collapse-btn" @click="uiStore.asideCollapsed = !uiStore.asideCollapsed" :title="collapsed ? $t('expand') : $t('collapse')">
            <Icon :icon="collapsed ? 'psg:chevron-right' : 'psg:chevron-left'" width="18" height="18"/>
          </button>
        </div>

        <!-- Account section -->
        <el-tooltip :content="userStore.user.email" placement="right" :disabled="!collapsed">
          <div class="account-section" :class="{ collapsed }" @click="router.push({name: 'setting'})">
            <div class="acct-avatar" :style="{ background: acctAvatarBg }">
              <span class="acct-initial">{{ acctInitial }}</span>
              <img v-if="userStore.avatar" :src="userStore.avatar" class="acct-avatar-img" @error="e => e.target.style.display='none'" />
            </div>
            <div class="acct-info" v-if="!collapsed">
              <div class="acct-name">{{ userStore.user.name || userStore.user.email }}</div>
              <div class="acct-email">{{ userStore.user.email }}</div>
            </div>
          </div>
        </el-tooltip>

        <el-menu :collapse="false" style="margin-top: 8px">
          <el-tooltip v-for="item in navItems" :key="item.name"
                      :content="$t(item.labelKey)" placement="right"
                      :disabled="!uiStore.asideCollapsed">
            <el-menu-item
              v-if="!item.perm || hasPerm(item.perm)"
              @click="router.push({name: item.name})" :index="item.name"
              :class="route.meta.name === item.name ? 'choose-item' : ''">
              <Icon :icon="item.icon" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{$t(item.labelKey)}}</span>
            </el-menu-item>
          </el-tooltip>

          <div class="manage-title" v-if="!collapsed" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
            <div>{{$t('manage')}}</div>
          </div>

          <el-tooltip :content="$t('analytics')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                          :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
              <Icon icon="psg:analytics" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{$t('analytics')}}</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip :content="$t('allUsers')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'user'})" index="user" v-perm="'user:query'"
                          :class="route.meta.name === 'user' ? 'choose-item' : ''">
              <Icon icon="psg:group" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{$t('allUsers')}}</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip :content="$t('allMail')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                          :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
              <Icon icon="psg:all-mail" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{$t('allMail')}}</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip :content="$t('permissions')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'role'})" index="role" v-perm="'role:query'"
                          :class="route.meta.name === 'role' ? 'choose-item' : ''">
              <Icon icon="psg:lock" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{$t('permissions')}}</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip :content="$t('inviteCode')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                          :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
              <Icon icon="psg:key" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{$t('inviteCode')}}</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip :content="$t('SystemSettings')" placement="right" :disabled="!collapsed">
            <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                          :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
              <Icon icon="psg:system" width="20" height="20" />
              <span class="menu-name" v-if="!collapsed">{{$t('SystemSettings')}}</span>
            </el-menu-item>
          </el-tooltip>
        </el-menu>
      </div>
    </el-scrollbar>

    <!-- Compose button — pinned to sidebar bottom -->
    <div class="sidebar-footer" :class="{ collapsed }">
      <el-tooltip :content="$t('compose')" placement="right" :disabled="!collapsed">
        <div class="compose-btn" v-if="canSend" @click="openCompose" :class="{ 'compose-icon-only': collapsed }">
          <Icon icon="psg:compose" width="20" height="20" class="compose-icon"/>
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

const isMobile = ref(window.innerWidth < 1025)
const onResize = () => { isMobile.value = window.innerWidth < 1025 }
window.addEventListener('resize', onResize)
onUnmounted(() => window.removeEventListener('resize', onResize))
const collapsed = computed(() => uiStore.asideCollapsed && !isMobile.value)

const acctAvatarBg = computed(() => avatarBg(userStore.user?.email || ''))
const acctInitial = computed(() => avatarLetter(userStore.user?.name, userStore.user?.email))

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
/* Root wrapper — controls overall sidebar width */
.sidebar-root {
  display: flex;
  flex-direction: column;
  width: 256px;
  height: 100%;
  background: linear-gradient(180deg, #161616 0%, #0a0a0a 100%);
  transition: width 0.22s cubic-bezier(0.22,1,0.36,1);
  overflow: hidden;

  &.collapsed { width: 56px; }
}

/* Scrollable nav area */
.sidebar-scroll {
  flex: 1;
  overflow: hidden;
  min-height: 0;

  :deep(.el-scrollbar__wrap) {
    background: transparent;
  }
}

.sidebar-inner {
  width: 256px;
  min-height: 100%;
  padding-bottom: 8px;

  &.collapsed { width: 56px; }
}

/* Logo row */
.title {
  margin: 0;
  padding: 14px 14px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(90deg, #c00000 0%, #7a0000 100%) 1;
  gap: 8px;

  &.collapsed {
    justify-content: center;
    padding: 14px 8px 12px;
  }

  .psg-logo {
    height: 28px;
    width: auto;
    max-width: 160px;
    display: block;
    object-fit: contain;
    filter: invert(1);
  }
}

.collapse-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: rgba(255,255,255,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;

  @media (max-width: 1024px) { display: none; }

  &:hover {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.80);
  }
}

/* Account section */
.account-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 6px 8px 4px;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.12s ease;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding-bottom: 14px;
  margin-bottom: 0;
  border-radius: 0;
  margin-left: 0;
  margin-right: 0;
  padding-left: 14px;
  padding-right: 14px;

  &.collapsed {
    justify-content: center;
    padding: 10px 8px;
    margin: 0;
    border-radius: 0;
  }

  @media (hover: hover) {
    &:hover { background: rgba(255,255,255,0.05); }
  }
}

.acct-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  .acct-initial {
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0;
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
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.01em;
}

.acct-email {
  font-size: 10px;
  color: rgba(255,255,255,0.38);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.01em;
  font-family: 'IBM Plex Mono', monospace;
}

/* Section label */
.manage-title {
  margin-top: 20px;
  margin-bottom: 2px;
  padding: 10px 18px 5px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

/* Menu item base */
.el-menu-item {
  margin: 1px 8px !important;
  border-radius: 2px !important;
  height: 38px !important;
  padding: 0 12px !important;
  transition: background 0.12s ease !important;
  color: rgba(255, 255, 255, 0.60) !important;
  gap: 0;

  .sidebar-inner.collapsed & {
    padding: 0 !important;
    margin: 1px 4px !important;
    justify-content: center !important;
  }
}

/* Active */
.choose-item {
  font-weight: 600 !important;
  color: #ffffff !important;
  border-left: 3px solid rgba(255,255,255,0.70) !important;
  box-shadow: 0 2px 8px rgba(176, 0, 0, 0.35) !important;
  background: linear-gradient(90deg, #c00000 0%, #8a0000 100%) !important;
  border-radius: 2px !important;
}

.choose-item .menu-name {
  color: #ffffff !important;
}

@media (hover: hover) {
  .el-menu-item:not(.choose-item):hover {
    background: rgba(255, 255, 255, 0.07) !important;
    color: rgba(255, 255, 255, 0.88) !important;
  }
}

.menu-name {
  user-select: none;
  font-size: 13px;
  letter-spacing: 0.01em;
  margin-left: 12px;
  color: inherit;
}

/* Sidebar footer — compose button pinned at bottom */
.sidebar-footer {
  flex-shrink: 0;
  padding: 10px 8px 14px;
  border-top: 1px solid rgba(255,255,255,0.07);
  background: linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%);

  &.collapsed {
    padding: 10px 8px 14px;
  }
}

.compose-btn {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 12px;
  height: 40px;
  border-radius: 2px;
  background: linear-gradient(135deg, #c00000 0%, #7e0000 100%);
  border: none;
  cursor: pointer;
  user-select: none;
  transition: box-shadow 0.15s ease, filter 0.15s ease;
  justify-content: flex-start;
  box-shadow: 0 2px 6px rgba(176, 0, 0, 0.40);

  &.compose-icon-only {
    padding: 0;
    justify-content: center;
  }

  .compose-icon {
    color: #ffffff;
    flex-shrink: 0;
  }

  .compose-text {
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-left: 12px;
  }

  @media (hover: hover) {
    &:hover { filter: brightness(1.12); box-shadow: 0 3px 10px rgba(176,0,0,0.50); }
  }
  &:active { filter: brightness(0.88); box-shadow: none; }
}

/* Element Plus overrides */
:deep(.el-scrollbar__wrap--hidden-default) {
  background: transparent !important;
}

:deep(.el-menu-item) {
  background: transparent;
  color: rgba(255, 255, 255, 0.60);
}

:deep(.el-menu) {
  background: transparent;
  border-right: none;
}

.el-menu {
  border-right: 0;
  width: 256px;
}

:deep(.el-divider__text) {
  background: var(--aside-backgound);
  color: rgba(255, 255, 255, 0.3);
}
</style>

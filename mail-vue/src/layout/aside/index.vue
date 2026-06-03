<template>
  <el-scrollbar class="scroll">
    <div class="sidebar-inner">
      <!-- Logo -->
      <div class="title">
        <img class="psg-logo" src="/image/psg-logo.png" alt="Panorama Scholarly Group" />
      </div>

      <!-- Compose FAB — Google Material style, dark sidebar version -->
      <div class="compose-btn" v-if="canSend" @click="openCompose">
        <Icon icon="material-symbols:edit-outline-rounded" width="20" height="20" class="compose-icon"/>
        <span class="compose-text">{{ $t('compose') }}</span>
      </div>

      <el-menu :collapse="false" style="margin-top: 8px">
        <el-menu-item @click="router.push({name: 'email'})" index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <Icon icon="hugeicons:mailbox-01" width="20" height="20" />
          <span class="menu-name">{{$t('inbox')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'send'})" index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <Icon icon="cil:send" width="20" height="20" />
          <span class="menu-name">{{$t('sent')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'draft'})" index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <Icon icon="ep:document" width="19" height="19" />
          <span class="menu-name">{{$t('drafts')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'star'})" index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <Icon icon="solar:star-line-duotone" width="20" height="20" />
          <span class="menu-name">{{$t('starred')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'setting'})" index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <Icon icon="fluent:settings-48-regular" width="20" height="20" />
          <span class="menu-name">{{$t('settings')}}</span>
        </el-menu-item>

        <div class="manage-title" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
          <div>{{$t('manage')}}</div>
        </div>

        <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <Icon icon="fluent:data-pie-20-regular" width="22" height="22" />
          <span class="menu-name">{{$t('analytics')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'user'})" index="user" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <Icon icon="si:user-alt-2-line" width="20" height="20" />
          <span class="menu-name">{{$t('allUsers')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <Icon icon="fluent:mail-list-28-regular" width="22" height="22" />
          <span class="menu-name">{{$t('allMail')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'role'})" index="role" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <Icon icon="fluent:lock-closed-16-regular" width="22" height="22" />
          <span class="menu-name">{{$t('permissions')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <Icon icon="fluent:fingerprint-20-filled" width="22" height="22" />
          <span class="menu-name">{{$t('inviteCode')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <Icon icon="eos-icons:system-ok-outlined" width="20" height="20" />
          <span class="menu-name">{{$t('SystemSettings')}}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </el-scrollbar>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { useUiStore } from "@/store/ui.js";
import { hasPerm } from "@/perm/perm.js";
import { computed } from "vue";

const route = useRoute();
const uiStore = useUiStore();

const canSend = computed(() => hasPerm('email:send'));

function openCompose() {
  uiStore.writerRef?.open?.();
}
</script>

<style lang="scss" scoped>
.scroll {
  height: 100%;
  width: 256px;

  :deep(.el-scrollbar__wrap) {
    background: var(--aside-backgound);
  }
}

.sidebar-inner {
  width: 256px;
  min-height: 100%;
  background: var(--aside-backgound);
  padding-bottom: 24px;
}

/* Logo */
.title {
  margin: 0;
  padding: 16px 18px 14px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(200, 151, 10, 0.15);

  .psg-logo {
    height: 32px;
    width: auto;
    max-width: 172px;
    display: block;
    object-fit: contain;
    filter: invert(1) brightness(1.1);
  }
}

/* Compose — gold gradient CTA */
.compose-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 14px 10px;
  padding: 11px 18px;
  border-radius: 6px;
  background: linear-gradient(135deg, #c8970a, #e8b520);
  border: none;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 2px 8px rgba(200, 151, 10, 0.35);

  .compose-icon {
    color: #fff;
    flex-shrink: 0;
    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));
  }

  .compose-text {
    font-size: 13.5px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.04em;
    text-shadow: 0 1px 2px rgba(0,0,0,0.18);
  }

  @media (hover: hover) {
    &:hover {
      opacity: 0.9;
      box-shadow: 0 4px 12px rgba(200, 151, 10, 0.45);
    }
  }

  &:active {
    opacity: 0.82;
    box-shadow: 0 1px 4px rgba(200, 151, 10, 0.3);
  }
}

/* Section label */
.manage-title {
  margin-top: 18px;
  margin-bottom: 2px;
  padding: 12px 20px 5px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(200, 151, 10, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* Menu item base */
.el-menu-item {
  margin: 1px 10px !important;
  border-radius: 5px !important;
  height: 38px !important;
  padding: 0 12px !important;
  transition: background 0.15s ease !important;
  color: rgba(255, 255, 255, 0.65) !important;
  gap: 0;
}

/* Active — navy gold accent */
.choose-item {
  font-weight: 600 !important;
  background: var(--gold-subtle) !important;
  color: #e8c84a !important;
  border-left: none !important;
  box-shadow: inset 3px 0 0 var(--gold-accent) !important;
}

.choose-item .menu-name {
  color: #e8c84a !important;
}

@media (hover: hover) {
  .el-menu-item:not(.choose-item):hover {
    background: rgba(255, 255, 255, 0.07) !important;
    color: rgba(255, 255, 255, 0.90) !important;
  }
}

/* Menu name text */
.menu-name {
  user-select: none;
  font-size: 13px;
  letter-spacing: 0.01em;
  margin-left: 12px;
  color: inherit;
}

/* Element Plus menu overrides */
:deep(.el-scrollbar__wrap--hidden-default) {
  background: var(--aside-backgound) !important;
}

:deep(.el-menu-item) {
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
}

:deep(.el-menu) {
  background: var(--aside-backgound);
  border-right: none;
}

.el-menu {
  border-right: 0;
  width: 236px;
}

:deep(.el-divider__text) {
  background: var(--aside-backgound);
  color: rgba(255, 255, 255, 0.4);
}
</style>

<template>
  <nav class="m-tabbar">
    <button class="m-tab" :class="{ active: isActive('email') }" @click="go('email')">
      <Icon icon="psg:inbox" width="22" height="22"/>
      <span>{{ $t('inbox') }}</span>
    </button>

    <button class="m-tab" @click="openSearch">
      <Icon icon="iconoir:search" width="22" height="22"/>
      <span>{{ $t('search') }}</span>
    </button>

    <!-- Center: compose -->
    <button class="m-tab m-tab-compose" :aria-label="$t('compose')" @click="openCompose">
      <span class="m-compose-fab">
        <Icon icon="psg:compose" width="22" height="22"/>
      </span>
    </button>

    <button class="m-tab" :class="{ active: isActive('send') }" @click="go('send')">
      <Icon icon="psg:send" width="22" height="22"/>
      <span>{{ $t('sent') }}</span>
    </button>

    <button class="m-tab" :class="{ active: isActive('setting') }" @click="go('setting')">
      <Icon icon="psg:settings" width="22" height="22"/>
      <span>{{ $t('settings') }}</span>
    </button>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import router from '@/router/index.js'
import { useUiStore } from '@/store/ui.js'

const route = useRoute()
const uiStore = useUiStore()

function isActive(name) {
  return route.meta?.name === name
}

function go(name) {
  if (route.meta?.name === name) return
  router.push({ name })
}

function openCompose() {
  uiStore.writerRef?.open?.()
}

function openSearch() {
  uiStore.commandPaletteShow = true
}
</script>

<style scoped lang="scss">
.m-tabbar {
  display: flex;
  width: 100%;
  align-items: stretch;
  justify-content: space-around;
  height: calc(56px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: #ffffff;
  border-top: 1px solid var(--separator, #e5e5e5);

  :global(.dark) & {
    background: #141414;
    border-top-color: rgba(255, 255, 255, 0.08);
  }
}

.m-tab {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--muted, #666666);
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  padding: 6px 2px;
  transition: color 0.12s;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  &:active { color: #111111; }

  &.active {
    color: #b00000;
    :global(.dark) & { color: #e03333; }
  }
}

/* Center compose — elevated red action */
.m-tab-compose {
  flex: 0 0 64px;
  justify-content: flex-start;
  padding-top: 8px;
}

.m-compose-fab {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #b00000;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(176, 0, 0, 0.32);
  transition: background 0.14s, transform 0.12s;

  .m-tab-compose:active & {
    background: #8a0000;
    transform: scale(0.94);
  }
}
</style>

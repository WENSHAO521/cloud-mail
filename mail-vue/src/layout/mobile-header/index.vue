<template>
  <header class="m-header">
    <!-- Left: menu + brand / section title -->
    <div class="m-left">
      <button class="m-icon-btn" :aria-label="$t('menu')" @click="openDrawer">
        <Icon icon="material-symbols:menu-rounded" width="24" height="24"/>
      </button>
      <div class="m-brand">
        <span class="m-brand-name">PSG</span>
        <span class="m-title">{{ title }}</span>
      </div>
    </div>

    <!-- Right: search + compose -->
    <div class="m-right">
      <button class="m-icon-btn" :aria-label="$t('search')" @click="openSearch">
        <Icon icon="iconoir:search" width="22" height="22"/>
      </button>
      <button v-if="canSend" class="m-icon-btn m-compose" :aria-label="$t('compose')" @click="openCompose">
        <Icon icon="psg:compose" width="21" height="21"/>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/store/ui.js'
import { hasPerm } from '@/perm/perm.js'

const route = useRoute()
const uiStore = useUiStore()
const { t } = useI18n()

const canSend = computed(() => hasPerm('email:send'))

const title = computed(() => {
  const key = route.meta?.title
  return key ? t(key) : 'PSG Mail'
})

function openDrawer() {
  uiStore.asideShow = true
}

function openCompose() {
  uiStore.writerRef?.open?.()
}

function openSearch() {
  uiStore.commandPaletteShow = true
}
</script>

<style scoped lang="scss">
.m-header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 6px 0 4px;
  background: #ffffff;
  border-bottom: 1px solid #000000;
  gap: 8px;

  :global(.dark) & {
    background: #141414;
    border-bottom-color: #2e2e2e;
  }
}

.m-left {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.m-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.m-brand-name {
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #bc0000;
}

.m-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-family: 'JetBrains Mono', monospace;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.m-right {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

/* 44px touch targets */
.m-icon-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--muted, #666666);
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;

  &:active { background: rgba(0, 0, 0, 0.08); }
}

.m-compose { color: #bc0000; }
</style>

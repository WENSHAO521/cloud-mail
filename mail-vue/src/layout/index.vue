<template>
  <CommandPalette ref="cmdPaletteRef"/>

  <div class="app-shell"
       :data-mode="isMailRoute ? 'mail' : 'workspace'"
       :data-collapsed="String(sidebarCollapsed)"
       :data-mobile-detail="String(uiStore.mobileDetailOpen)">

    <!-- Mobile sidebar backdrop -->
    <div class="sidebar-backdrop"
         :data-open="String(uiStore.asideShow)"
         @click="uiStore.asideShow = false"/>

    <!-- Sidebar ─ always column 1 -->
    <Aside />

    <!-- ── Mail mode: list (col 2) + reading pane (col 3) ── -->
    <template v-if="isMailRoute">
      <section class="mail-list-pane">
        <router-view v-slot="{ Component, route: r }">
          <keep-alive :include="keepAliveList">
            <component :is="Component" :key="r.name"/>
          </keep-alive>
        </router-view>
      </section>
      <section class="mail-detail-pane">
        <ContentPane @back="uiStore.mobileDetailOpen = false"/>
      </section>
    </template>

    <!-- ── Workspace mode: content (col 2) ── -->
    <main v-else class="workspace-pane">
      <div class="workspace-body">
        <router-view v-slot="{ Component, route: r }">
          <keep-alive :include="keepAliveWorkspace">
            <component :is="Component" :key="r.name"/>
          </keep-alive>
        </router-view>
      </div>
    </main>

  </div>

  <writer ref="writerRef"/>
</template>

<script setup>
import Aside from '@/layout/aside/index.vue'
import ContentPane from '@/views/content/index.vue'
import CommandPalette from '@/components/command-palette/index.vue'
import writer from '@/layout/write/index.vue'
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/store/ui.js'
import { useNotificationStore } from '@/store/notification.js'
import { useEmailStore } from '@/store/email.js'
import { emailArchive } from '@/request/email.js'

const route = useRoute()
const uiStore = useUiStore()
const notificationStore = useNotificationStore()
const emailStore = useEmailStore()
const writerRef = ref({})
const cmdPaletteRef = ref(null)

const MAIL_ROUTES = new Set(['email', 'send', 'draft', 'star', 'archive', 'spam', 'all-email'])
const isMailRoute = computed(() => MAIL_ROUTES.has(route.meta?.name))
const sidebarCollapsed = computed(() => uiStore.asideCollapsed && window.innerWidth >= 1025)

const keepAliveList = ['email', 'all-email', 'send', 'star', 'draft', 'archive', 'spam']
const keepAliveWorkspace = ['sys-setting', 'analysis', 'user', 'role', 'reg-key', 'setting', 'templates', 'groups']

// Clear selected email when switching mail folders
watch(isMailRoute, (is) => { if (!is) emailStore.contentData.email = null })
watch(() => route.name, (name, prev) => {
  if (MAIL_ROUTES.has(name) && MAIL_ROUTES.has(prev) && name !== prev) {
    emailStore.contentData.email = null
    uiStore.mobileDetailOpen = false
  }
})

// Keyboard shortcuts
function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    cmdPaletteRef.value?.open()
    return
  }
  const tag = e.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const email = emailStore.contentData?.email
  switch (e.key) {
    case 'c': uiStore.writerRef?.open?.(); break
    case 'r': if (email) uiStore.writerRef?.openReply?.(email); break
    case 'a': if (email) uiStore.writerRef?.openReplyAll?.(email); break
    case 'f': if (email) uiStore.writerRef?.openForward?.(email); break
    case 'e':
      if (email?.emailId) {
        emailArchive([email.emailId]).then(() => {
          emailStore.emailScroll?.deleteEmail?.([email.emailId])
        }).catch(() => {})
      }
      break
  }
}

// Responsive sidebar
function handleResize() {
  if (window.innerWidth < 1025) uiStore.asideShow = false
  else uiStore.asideShow = true
}

onMounted(() => {
  uiStore.writerRef = writerRef
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
  handleResize()
  notificationStore.requestPermission()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
/* ── Shell: CSS grid, replaces el-container/el-aside ───────── */
.app-shell {
  height: 100vh;
  overflow: hidden;
  display: grid;
  position: fixed;
  inset: 0;

  /* Mail mode: sidebar | list | detail */
  &[data-mode="mail"] {
    grid-template-columns: 260px minmax(360px, 520px) minmax(420px, 1fr);

    &[data-collapsed="true"] {
      grid-template-columns: 72px minmax(360px, 520px) minmax(420px, 1fr);
    }
  }

  /* Workspace mode: sidebar | content */
  &[data-mode="workspace"] {
    grid-template-columns: 260px minmax(0, 1fr);

    &[data-collapsed="true"] {
      grid-template-columns: 72px minmax(0, 1fr);
    }
  }

  /* Tablet: reduce list width */
  @media (max-width: 1280px) {
    &[data-mode="mail"] {
      grid-template-columns: 260px minmax(320px, 400px) minmax(0, 1fr);
      &[data-collapsed="true"] {
        grid-template-columns: 72px minmax(320px, 400px) minmax(0, 1fr);
      }
    }
  }

  /* Mobile: single column */
  @media (max-width: 1024px) {
    display: block !important;
    height: 100dvh;
  }
}

/* ── Sidebar backdrop (mobile) ─────────────────────────────── */
.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  background: rgba(0, 0, 0, 0);
  opacity: 0;
  transition: opacity 160ms ease, background 160ms ease;

  @media (max-width: 1024px) {
    display: block;

    &[data-open="true"] {
      pointer-events: auto;
      background: rgba(0, 0, 0, 0.4);
      opacity: 1;
    }
  }
}

/* ── Mail panes ────────────────────────────────────────────── */
.mail-list-pane {
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid var(--separator, #e5e7eb);
  background: var(--psg-bg, #f7f7f7);

  @media (max-width: 1024px) {
    height: 100dvh;
  }
}

.mail-detail-pane {
  min-height: 0;
  overflow: hidden;
  background: var(--psg-bg, #f7f7f7);
  padding: 14px;

  @media (max-width: 1024px) {
    height: 100dvh;
    padding: 0;
  }
}

/* Mobile: hide/show panes based on detail state */
@media (max-width: 760px) {
  .app-shell[data-mobile-detail="true"] .mail-list-pane { display: none; }
  .app-shell[data-mobile-detail="false"] .mail-detail-pane { display: none; }
}

/* ── Workspace pane ────────────────────────────────────────── */
.workspace-pane {
  min-height: 0;
  overflow: hidden;
  background: var(--psg-bg, #f7f7f7);
  display: flex;
  flex-direction: column;

  @media (max-width: 1024px) {
    height: 100dvh;
  }
}

.workspace-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>

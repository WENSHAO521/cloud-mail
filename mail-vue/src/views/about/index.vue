<template>
  <div class="about-view">
    <el-scrollbar>
      <div class="about-body">

        <!-- ── Brand header ── -->
        <div class="about-hero">
          <div class="hero-publisher">PANORAMA SCHOLARLY GROUP</div>
          <div class="hero-product">PSG MAIL</div>
          <div class="hero-version-chip">v{{ appVersion }}</div>
        </div>

        <!-- ── Version / Update card ── -->
        <div class="about-card">
          <div class="about-card-title">{{ $t('version') }}</div>
          <div class="about-row">
            <span class="about-label">{{ $t('currentVersion') }}</span>
            <span class="about-value mono">v{{ appVersion }}</span>
          </div>

          <template v-if="isElectron">
            <div class="about-row">
              <span class="about-label">{{ $t('updateStatus') }}</span>
              <span class="about-status-badge" :class="stageCls">
                <span class="status-dot" />
                {{ stageLabel }}
              </span>
            </div>

            <el-progress
              v-if="stage === 'downloading'"
              class="update-progress"
              :percentage="progress"
              :stroke-width="4"
              :show-text="false"
            />

            <div v-if="stage === 'error' && errorMessage" class="update-error-detail">
              {{ errorMessage }}
            </div>

            <div class="about-actions">
              <el-button
                v-if="stage !== 'ready'"
                :loading="stage === 'checking'"
                :disabled="stage === 'downloading'"
                class="about-btn"
                @click="checkUpdate"
              >
                <Icon v-if="stage !== 'checking'" icon="solar:refresh-linear" width="15" height="15" />
                {{ stage === 'checking' ? $t('checking') : $t('checkForUpdates') }}
              </el-button>

              <el-button
                v-if="stage === 'ready'"
                class="about-btn about-btn--install"
                @click="doInstall"
              >
                <Icon icon="solar:download-minimalistic-linear" width="15" height="15" />
                {{ $t('installAndRestart') }}
              </el-button>
            </div>
          </template>

          <div v-else class="about-row">
            <span class="about-label">{{ $t('updateStatus') }}</span>
            <a class="about-link" href="https://github.com/WENSHAO521/cloud-mail/releases" target="_blank">
              {{ $t('checkOnGitHub') }}
            </a>
          </div>
        </div>

        <!-- ── Info card ── -->
        <div class="about-card">
          <div class="about-card-title">{{ $t('aboutApp') }}</div>
          <div class="about-row">
            <span class="about-label">{{ $t('publisher') }}</span>
            <span class="about-value">Panorama Scholarly Group</span>
          </div>
          <div class="about-row">
            <span class="about-label">{{ $t('license') }}</span>
            <span class="about-value mono">MIT</span>
          </div>
          <div class="about-row">
            <span class="about-label">{{ $t('sourceCode') }}</span>
            <a class="about-link" href="https://github.com/WENSHAO521/cloud-mail" target="_blank">
              github.com/WENSHAO521/cloud-mail
            </a>
          </div>
        </div>

      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineOptions } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'

defineOptions({ name: 'about' })

const { t } = useI18n()

const appVersion = __APP_VERSION__
const isElectron = !!window.electronAPI

// stage: idle | checking | up-to-date | downloading | ready | error
const stage    = ref('idle')
const progress = ref(0)
const newVersion = ref('')
const errorMessage = ref('')
let autoCheckTimer = null

const stageCls = computed(() => ({
  'status--idle':       stage.value === 'idle',
  'status--checking':   stage.value === 'checking',
  'status--ok':         stage.value === 'up-to-date',
  'status--available':  stage.value === 'downloading',
  'status--ready':      stage.value === 'ready',
  'status--error':      stage.value === 'error',
}))

const stageLabel = computed(() => {
  switch (stage.value) {
    case 'idle':        return t('notChecked')
    case 'checking':    return t('checking')
    case 'up-to-date':  return t('upToDate')
    case 'downloading': return `${t('downloading')} ${progress.value}%`
    case 'ready':       return t('readyToInstall') + (newVersion.value ? ` (v${newVersion.value})` : '')
    case 'error':       return t('updateError')
    default:            return ''
  }
})

function checkUpdate() {
  stage.value = 'checking'
  errorMessage.value = ''
  window.electronAPI?.checkForUpdates()
}

function doInstall() {
  window.electronAPI?.installUpdate()
}

onMounted(() => {
  if (!isElectron) return

  window.electronAPI.onUpdateAvailable((info) => {
    newVersion.value = info.version
    errorMessage.value = ''
    stage.value = 'downloading'
    progress.value = 0
  })

  window.electronAPI.onUpdateProgress((pct) => {
    progress.value = pct
    if (stage.value !== 'downloading') stage.value = 'downloading'
  })

  window.electronAPI.onUpdateDownloaded(() => {
    stage.value = 'ready'
    progress.value = 100
  })

  window.electronAPI.onUpdateNotAvailable?.(() => {
    errorMessage.value = ''
    stage.value = 'up-to-date'
  })

  window.electronAPI.onUpdateError?.((msg) => {
    errorMessage.value = msg || t('updateErrorDetailFallback')
    stage.value = 'error'
  })

  autoCheckTimer = setTimeout(() => {
    if (stage.value === 'idle') checkUpdate()
  }, 6000)
})

onUnmounted(() => {
  clearTimeout(autoCheckTimer)
})
</script>

<style lang="scss" scoped>
.about-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page, #f5f5f5);
}

.about-body {
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 24px 60px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

/* ── Hero ─────────────────────────────────────────── */
.about-hero {
  border-left: 3px solid #bc0000;
  padding: 20px 24px;
  background: var(--el-bg-color, #ffffff);
  border-bottom: 1px solid var(--light-border-color, #e0e0e0);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-publisher {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted, #888);
}

.hero-product {
  font-family: 'JetBrains Mono', monospace;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.hero-version-chip {
  display: inline-block;
  margin-top: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #bc0000;
  border: 1px solid #bc0000;
  padding: 2px 8px;
  letter-spacing: 0.06em;
  align-self: flex-start;
}

/* ── Card ─────────────────────────────────────────── */
.about-card {
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--light-border-color, #e0e0e0);
  padding: 0;
  overflow: hidden;
}

.about-card-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted, #888);
  padding: 12px 20px 10px;
  border-bottom: 1px solid var(--light-border-color, #e0e0e0);
  background: var(--surface-secondary, #fafafa);
}

/* ── Row ──────────────────────────────────────────── */
.about-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 20px;
  gap: 16px;
  border-bottom: 1px solid var(--light-border-color, #f0f0f0);

  &:last-child { border-bottom: none; }
}

.about-label {
  font-size: 13px;
  color: var(--muted, #666);
  flex-shrink: 0;
}

.about-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  text-align: right;

  &.mono {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
  }
}

.about-link {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #bc0000;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.12s;

  &:hover { border-bottom-color: #bc0000; }
}

/* ── Status badge ─────────────────────────────────── */
.about-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border: 1px solid currentColor;

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  &.status--idle       { color: var(--muted, #999); }
  &.status--checking   { color: #d97706; }
  &.status--ok         { color: #16a34a; }
  &.status--available,
  &.status--ready      { color: #bc0000; }
  &.status--error      { color: #dc2626; }
}

/* ── Progress ─────────────────────────────────────── */
.update-progress {
  padding: 0 20px 12px;

  :deep(.el-progress-bar__outer) {
    border-radius: 0;
    background: var(--light-border-color, #e0e0e0);
  }

  :deep(.el-progress-bar__inner) {
    border-radius: 0;
    background: #bc0000;
  }
}

.update-error-detail {
  margin: 0 20px 12px;
  padding: 8px 10px;
  border: 1px solid rgba(220, 38, 38, .35);
  background: rgba(220, 38, 38, .08);
  color: #dc2626;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.5;
  word-break: break-word;
}

/* ── Actions ──────────────────────────────────────── */
.about-actions {
  padding: 4px 20px 16px;
  display: flex;
  gap: 10px;
}

.about-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: 0;
  border-color: var(--light-border-color, #ccc);
  display: flex;
  align-items: center;
  gap: 6px;

  &--install {
    background: #bc0000;
    border-color: #bc0000;
    color: #fff;

    &:hover { background: #000; border-color: #000; }
  }
}

/* ── Dark mode ────────────────────────────────────── */
:global(.dark) {
  .about-hero,
  .about-card { border-color: rgba(255,255,255,0.10); }

  .about-card-title {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.08);
  }

  .about-row { border-color: rgba(255,255,255,0.06); }
}
</style>

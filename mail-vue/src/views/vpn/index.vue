<template>
  <div class="download-view">
    <el-scrollbar>
      <div class="dl-body">

        <!-- ── Hero ── -->
        <div class="dl-hero">
          <div class="hero-publisher">PANORAMA SCHOLARLY GROUP</div>
          <div class="hero-product">PSG CONNECT</div>
          <div class="hero-sub">{{ $t('vpnHeroSub') }}</div>
        </div>

        <!-- ── Loading skeleton ── -->
        <div v-if="loading" class="dl-grid">
          <div v-for="i in 4" :key="i" class="dl-card dl-card--skeleton" />
        </div>

        <!-- ── Error ── -->
        <div v-else-if="error" class="dl-error">
          <Icon icon="solar:danger-triangle-linear" width="20" />
          {{ $t('vpnLoadError') }}
          <a :href="RELEASES_URL" target="_blank" rel="noopener" class="dl-releases-link">
            {{ $t('vpnViewOnGitHub') }}
          </a>
        </div>

        <!-- ── Platform cards ── -->
        <template v-else-if="latest">

          <!-- Windows -->
          <div class="dl-grid">
            <div class="dl-card" v-if="getUrl(latest, 'win')">
              <div class="dl-card-icon">
                <Icon icon="simple-icons:windows11" width="40" height="40" />
              </div>
              <div class="dl-card-info">
                <div class="dl-card-platform">Windows</div>
                <div class="dl-card-desc">{{ $t('vpnWindowsDesc') }}</div>
                <div class="dl-card-meta">Windows 10 / 11 · x64</div>
              </div>
              <a class="dl-btn" :href="getUrl(latest, 'win')" target="_blank" rel="noopener">
                <Icon icon="solar:download-minimalistic-bold" width="16" height="16" />
                {{ $t('dlDownload') }} .exe
              </a>
            </div>

            <!-- macOS -->
            <div class="dl-card" v-if="getUrl(latest, 'mac')">
              <div class="dl-card-icon">
                <Icon icon="simple-icons:apple" width="40" height="40" />
              </div>
              <div class="dl-card-info">
                <div class="dl-card-platform">macOS</div>
                <div class="dl-card-desc">{{ $t('vpnMacDesc') }}</div>
                <div class="dl-card-meta">macOS 12+ · Intel & Apple Silicon</div>
              </div>
              <a class="dl-btn" :href="getUrl(latest, 'mac')" target="_blank" rel="noopener">
                <Icon icon="solar:download-minimalistic-bold" width="16" height="16" />
                {{ $t('dlDownload') }} .dmg
              </a>
            </div>

            <!-- Android -->
            <div class="dl-card" v-if="getUrl(latest, 'android')">
              <div class="dl-card-icon">
                <Icon icon="simple-icons:android" width="40" height="40" />
              </div>
              <div class="dl-card-info">
                <div class="dl-card-platform">Android</div>
                <div class="dl-card-desc">{{ $t('vpnAndroidDesc') }}</div>
                <div class="dl-card-meta">Android 5.0+</div>
              </div>
              <a class="dl-btn" :href="getUrl(latest, 'android')" target="_blank" rel="noopener">
                <Icon icon="solar:download-minimalistic-bold" width="16" height="16" />
                {{ $t('dlDownload') }} .apk
              </a>
            </div>

            <!-- Linux -->
            <div class="dl-card" v-if="getUrl(latest, 'linux')">
              <div class="dl-card-icon">
                <Icon icon="simple-icons:linux" width="40" height="40" />
              </div>
              <div class="dl-card-info">
                <div class="dl-card-platform">Linux</div>
                <div class="dl-card-desc">{{ $t('vpnLinuxDesc') }}</div>
                <div class="dl-card-meta">Ubuntu 22.04+ · .deb / .AppImage</div>
              </div>
              <a class="dl-btn" :href="getUrl(latest, 'linux')" target="_blank" rel="noopener">
                <Icon icon="solar:download-minimalistic-bold" width="16" height="16" />
                {{ $t('dlDownload') }} .deb
              </a>
            </div>
          </div>

          <!-- ── Footer ── -->
          <div class="dl-footer">
            <a class="dl-releases-link" :href="RELEASES_URL" target="_blank" rel="noopener">
              <Icon icon="simple-icons:github" width="14" height="14" />
              {{ $t('vpnAllReleases') }}
            </a>
            <span class="dl-version">{{ latest.tag_name }}</span>
          </div>

        </template>

      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const RELEASES_URL = 'https://github.com/WENSHAO521/FlClash-/releases'
const GITHUB_API   = 'https://api.github.com/repos/WENSHAO521/FlClash-/releases/latest'

const latest  = ref(null)
const loading = ref(true)
const error   = ref(false)

onMounted(async () => {
  try {
    const res = await fetch(GITHUB_API)
    if (!res.ok) throw new Error(res.status)
    latest.value = await res.json()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

function getUrl(release, platform) {
  for (const a of release.assets || []) {
    const n = a.name.toLowerCase()
    if (platform === 'win'     && (n.endsWith('.exe') || n.endsWith('.msix'))) return a.browser_download_url
    if (platform === 'mac'     && (n.endsWith('.dmg') || n.endsWith('.pkg') || n.includes('macos') || n.includes('darwin'))) return a.browser_download_url
    if (platform === 'android' && (n.endsWith('.apk') || n.endsWith('.aab'))) return a.browser_download_url
    if (platform === 'linux'   && (n.endsWith('.deb') || n.endsWith('.appimage') || n.endsWith('.rpm'))) return a.browser_download_url
  }
  return null
}
</script>

<style lang="scss" scoped>
.download-view {
  height: 100%;
  background: var(--el-bg-color-page, #f5f5f5);
}

.dl-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 24px 60px;
}

/* ── Hero ── */
.dl-hero {
  margin-bottom: 36px;
  border-left: 4px solid #bc0000;
  padding-left: 18px;
}

.hero-publisher {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted, #7e7576);
  margin-bottom: 4px;
}

.hero-product {
  font-family: 'JetBrains Mono', monospace;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--el-text-color-primary);
  line-height: 1.1;
}

.hero-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--muted, #7e7576);
}

/* ── Grid ── */
.dl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

/* ── Card ── */
.dl-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 20px 18px;
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--light-border, #000000);
  border-top: 3px solid var(--light-border, #000000);
  transition: border-top-color 0.12s;

  @media (hover: hover) {
    &:hover { border-top-color: #bc0000; }
  }

  &--skeleton {
    height: 160px;
    opacity: 0.35;
    animation: dl-pulse 1.2s ease-in-out infinite;
  }
}

:global(.dark) .dl-card {
  background: var(--el-bg-color, #1c1c20);
  border-color: rgba(255, 255, 255, 0.15);
  border-top-color: rgba(255, 255, 255, 0.3);
}

.dl-card-icon {
  color: var(--el-text-color-primary);
  opacity: 0.75;
}

.dl-card-info { flex: 1; }

.dl-card-platform {
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.dl-card-desc {
  font-size: 12px;
  color: var(--muted, #7e7576);
  line-height: 1.5;
  margin-bottom: 6px;
}

.dl-card-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--muted, #7e7576);
  letter-spacing: 0.04em;
}

/* ── Button ── */
.dl-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 14px;
  background: #111111;
  color: #ffffff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: background 0.12s;

  @media (hover: hover) {
    &:hover { background: #bc0000; }
  }
  &:active { background: #7a0000; }
}

:global(.dark) .dl-btn {
  background: rgba(255,255,255,0.88);
  color: #111;

  @media (hover: hover) {
    &:hover { background: #bc0000; color: #fff; }
  }
}

/* ── Error ── */
.dl-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 0;
  font-size: 13px;
  color: #bc0000;
}

/* ── Footer ── */
.dl-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--light-border-color, #cfc4c5);
}

.dl-releases-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted, #7e7576);
  text-decoration: none;
  font-family: 'JetBrains Mono', monospace;

  @media (hover: hover) {
    &:hover { color: var(--el-text-color-primary); }
  }
}

.dl-version {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--muted, #7e7576);
  margin-left: auto;
}

@keyframes dl-pulse {
  0%, 100% { opacity: 0.35; }
  50%       { opacity: 0.15; }
}
</style>

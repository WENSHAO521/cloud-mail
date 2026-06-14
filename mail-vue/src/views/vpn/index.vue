<template>
  <div class="vpn-view">
    <el-scrollbar>
      <div class="vpn-body">

        <!-- ── Hero ── -->
        <div class="vpn-hero">
          <div class="hero-publisher">PANORAMA SCHOLARLY GROUP</div>
          <div class="hero-product">PSG VPS</div>
          <div class="hero-sub">{{ $t('vpnHeroSub') }}</div>
        </div>

        <!-- ── Loading ── -->
        <div v-if="loading" class="vpn-state">
          <div class="vpn-spinner" />
        </div>

        <!-- ── Error ── -->
        <div v-else-if="error" class="vpn-state vpn-state--error">
          <Icon icon="solar:danger-triangle-linear" width="22" />
          <span>{{ $t('vpnLoadError') }}</span>
          <a :href="RELEASES_URL" class="footer-link" target="_blank" rel="noopener">
            {{ $t('vpnViewOnGitHub') }}
          </a>
        </div>

        <!-- ── Releases ── -->
        <template v-else>
          <div v-for="(release, idx) in releases" :key="release.id" class="vpn-release">
            <div class="release-head">
              <div class="release-left">
                <span class="release-version">{{ release.tag_name }}</span>
                <span v-if="idx === 0" class="badge-latest">LATEST</span>
              </div>
              <div class="release-date">{{ formatDate(release.published_at) }}</div>
            </div>

            <div class="release-files">
              <a
                v-for="asset in release.assets"
                :key="asset.id"
                class="file-row"
                :href="asset.browser_download_url"
                target="_blank"
                rel="noopener"
              >
                <Icon :icon="platformIcon(asset.name)" width="15" class="file-platform-icon" />
                <span class="file-name">{{ asset.name }}</span>
                <span class="file-size">{{ formatSize(asset.size) }}</span>
                <Icon icon="solar:download-minimalistic-bold" width="13" class="dl-icon" />
              </a>
              <div v-if="!release.assets.length" class="no-files">
                {{ $t('vpnNoAssets') }}
              </div>
            </div>
          </div>

          <div class="vpn-footer">
            <a :href="RELEASES_URL" class="footer-link" target="_blank" rel="noopener">
              <Icon icon="simple-icons:github" width="13" />
              {{ $t('vpnAllReleases') }}
            </a>
            <span class="footer-count">{{ releases.length }} {{ $t('vpnVersions') }}</span>
          </div>
        </template>

      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const RELEASES_URL = 'https://github.com/WENSHAO521/FlClash-/releases'
const GITHUB_API   = 'https://api.github.com/repos/WENSHAO521/FlClash-/releases?per_page=30'

const releases = ref([])
const loading  = ref(true)
const error    = ref(false)

onMounted(async () => {
  try {
    const res  = await fetch(GITHUB_API)
    if (!res.ok) throw new Error(res.status)
    const data = await res.json()
    releases.value = data.filter(r => !r.draft)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

function platformIcon(name) {
  const n = name.toLowerCase()
  if (n.includes('windows') || n.endsWith('.exe') || n.endsWith('.msix')) return 'simple-icons:windows11'
  if (n.includes('macos') || n.includes('darwin') || n.endsWith('.dmg') || n.endsWith('.pkg')) return 'simple-icons:apple'
  if (n.includes('android') || n.endsWith('.apk') || n.endsWith('.aab')) return 'simple-icons:android'
  if (n.endsWith('.deb') || n.endsWith('.rpm') || n.endsWith('.appimage') || n.includes('linux')) return 'simple-icons:linux'
  if (n.endsWith('.zip') || n.endsWith('.tar.gz') || n.endsWith('.tgz')) return 'solar:file-download-linear'
  return 'solar:file-linear'
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB'
  return bytes + ' B'
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style lang="scss" scoped>
.vpn-view {
  height: 100%;
  background: var(--el-bg-color-page, #f5f5f5);
}

.vpn-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 24px 60px;
}

/* ── Hero ── */
.vpn-hero {
  margin-bottom: 32px;
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

/* ── State (loading / error) ── */
.vpn-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 0;
  color: var(--muted, #7e7576);
  font-size: 13px;

  &--error {
    color: #bc0000;
  }
}

.vpn-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--light-border-color, #cfc4c5);
  border-top-color: #bc0000;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Release block ── */
.vpn-release {
  margin-bottom: 20px;
  border: 1px solid var(--light-border, #e0d8d9);
  border-top: 3px solid var(--light-border, #000);
  background: var(--el-bg-color, #fff);

  &:first-of-type {
    border-top-color: #bc0000;
  }
}

:global(.dark) .vpn-release {
  background: var(--el-bg-color, #1c1c20);
  border-color: rgba(255,255,255,0.12);
  border-top-color: rgba(255,255,255,0.25);

  &:first-of-type {
    border-top-color: #bc0000;
  }
}

.release-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--light-border-color, #e8e0e1);
}

:global(.dark) .release-head {
  border-bottom-color: rgba(255,255,255,0.08);
}

.release-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.release-version {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 0.03em;
}

.badge-latest {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 2px 6px;
  background: #bc0000;
  color: #fff;
}

.release-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--muted, #7e7576);
}

/* ── File rows ── */
.release-files {
  padding: 4px 0;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  text-decoration: none;
  color: var(--el-text-color-regular);
  transition: background 0.1s;

  @media (hover: hover) {
    &:hover {
      background: var(--el-fill-color-light, rgba(0,0,0,0.04));

      .dl-icon { opacity: 1; color: #bc0000; }
    }
  }
}

.file-platform-icon {
  flex-shrink: 0;
  color: var(--muted, #7e7576);
}

.file-name {
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--muted, #7e7576);
  flex-shrink: 0;
  width: 56px;
  text-align: right;
}

.dl-icon {
  flex-shrink: 0;
  opacity: 0.3;
  transition: opacity 0.1s, color 0.1s;
}

.no-files {
  padding: 12px 16px;
  font-size: 12px;
  color: var(--muted, #7e7576);
}

/* ── Footer ── */
.vpn-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--light-border-color, #cfc4c5);
  margin-top: 4px;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--muted, #7e7576);
  text-decoration: none;

  @media (hover: hover) {
    &:hover { color: var(--el-text-color-primary); }
  }
}

.footer-count {
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--muted, #7e7576);
}
</style>

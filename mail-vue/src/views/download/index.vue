<template>
  <div class="download-view">
    <el-scrollbar>
      <div class="dl-body">

        <!-- ── Hero ── -->
        <div class="dl-hero">
          <div class="hero-publisher">PANORAMA SCHOLARLY GROUP</div>
          <div class="hero-product">PSG MAIL</div>
          <div class="hero-sub">{{ $t('dlHeroSub') }}</div>
        </div>

        <!-- ── Platform cards ── -->
        <div class="dl-grid">

          <!-- Windows -->
          <div class="dl-card">
            <div class="dl-card-icon">
              <Icon icon="simple-icons:windows11" width="40" height="40" />
            </div>
            <div class="dl-card-info">
              <div class="dl-card-platform">Windows</div>
              <div class="dl-card-desc">{{ $t('dlWindowsDesc') }}</div>
              <div class="dl-card-meta">Windows 10 / 11 · x64</div>
            </div>
            <a class="dl-btn" :href="releaseUrl('win')" target="_blank" rel="noopener">
              <Icon icon="solar:download-minimalistic-bold" width="16" height="16" />
              {{ $t('dlDownload') }} .exe
            </a>
          </div>

          <!-- macOS -->
          <div class="dl-card">
            <div class="dl-card-icon">
              <Icon icon="simple-icons:apple" width="40" height="40" />
            </div>
            <div class="dl-card-info">
              <div class="dl-card-platform">macOS</div>
              <div class="dl-card-desc">{{ $t('dlMacDesc') }}</div>
              <div class="dl-card-meta">macOS 12+ · Intel & Apple Silicon</div>
            </div>
            <a class="dl-btn" :href="releaseUrl('mac')" target="_blank" rel="noopener">
              <Icon icon="solar:download-minimalistic-bold" width="16" height="16" />
              {{ $t('dlDownload') }} .dmg
            </a>
          </div>

          <!-- Android -->
          <div class="dl-card">
            <div class="dl-card-icon">
              <Icon icon="simple-icons:android" width="40" height="40" />
            </div>
            <div class="dl-card-info">
              <div class="dl-card-platform">Android</div>
              <div class="dl-card-desc">{{ $t('dlAndroidDesc') }}</div>
              <div class="dl-card-meta">Android 8.0+</div>
            </div>
            <a class="dl-btn" :href="releaseUrl('android')" target="_blank" rel="noopener">
              <Icon icon="solar:download-minimalistic-bold" width="16" height="16" />
              {{ $t('dlDownload') }} .apk
            </a>
          </div>

          <!-- Linux -->
          <div class="dl-card">
            <div class="dl-card-icon">
              <Icon icon="simple-icons:linux" width="40" height="40" />
            </div>
            <div class="dl-card-info">
              <div class="dl-card-platform">Linux</div>
              <div class="dl-card-desc">{{ $t('dlLinuxDesc') }}</div>
              <div class="dl-card-meta">Ubuntu 22.04+ · .deb / .AppImage</div>
            </div>
            <a class="dl-btn" :href="releaseUrl('linux')" target="_blank" rel="noopener">
              <Icon icon="solar:download-minimalistic-bold" width="16" height="16" />
              {{ $t('dlDownload') }} .deb
            </a>
          </div>

          <!-- Web -->
          <div class="dl-card dl-card--web">
            <div class="dl-card-icon">
              <Icon icon="solar:global-linear" width="40" height="40" />
            </div>
            <div class="dl-card-info">
              <div class="dl-card-platform">{{ $t('dlWeb') }}</div>
              <div class="dl-card-desc">{{ $t('dlWebDesc') }}</div>
              <div class="dl-card-meta">{{ $t('dlWebMeta') }}</div>
            </div>
            <div class="dl-btn dl-btn--current">
              <Icon icon="solar:check-circle-bold" width="16" height="16" />
              {{ $t('dlWebCurrent') }}
            </div>
          </div>

        </div>

        <!-- ── Releases link ── -->
        <div class="dl-footer">
          <a class="dl-releases-link" :href="RELEASES_URL" target="_blank" rel="noopener">
            <Icon icon="simple-icons:github" width="14" height="14" />
            {{ $t('dlAllReleases') }}
          </a>
          <span class="dl-version">v{{ appVersion }}</span>
        </div>

      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

const appVersion = __APP_VERSION__

const RELEASES_URL = 'https://github.com/WENSHAO521/cloud-mail/releases'

function releaseUrl(platform) {
  const base = `${RELEASES_URL}/latest/download`
  if (platform === 'win')     return `${base}/PSG-Mail-${appVersion}-win-Setup.exe`
  if (platform === 'mac')     return `${base}/PSG-Mail-${appVersion}-mac.dmg`
  if (platform === 'android') return `${base}/PSG-Mail-${appVersion}-android.apk`
  if (platform === 'linux')   return `${base}/PSG-Mail-${appVersion}-linux.deb`
  return RELEASES_URL
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

  &--web {
    border-top-color: var(--light-border, #000000);
    opacity: 0.75;

    @media (hover: hover) {
      &:hover { border-top-color: #444; }
    }
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

.dl-card-info {
  flex: 1;
}

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

  &--current {
    background: var(--el-bg-color-page, #f5f5f5);
    color: var(--muted, #7e7576);
    border: 1px solid var(--light-border-color, #cfc4c5);
    cursor: default;

    @media (hover: hover) {
      &:hover { background: var(--el-bg-color-page, #f5f5f5); }
    }
  }
}

:global(.dark) .dl-btn {
  background: rgba(255,255,255,0.88);
  color: #111;

  @media (hover: hover) {
    &:hover { background: #bc0000; color: #fff; }
  }

  &--current {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.4);
    border-color: rgba(255,255,255,0.12);

    @media (hover: hover) {
      &:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
    }
  }
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
</style>

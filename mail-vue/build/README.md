# Build assets

Place generated icons here before running `electron:build`.

| File | Platform | How to generate |
|------|----------|-----------------|
| `icon.ico`  | Windows | New PSG app icon |
| `icon.icns` | macOS   | New PSG app icon |
| `icon.png`  | Linux   | New PSG app icon |
| `desktop-icon.ico`  | Windows | New PSG desktop app icon |
| `desktop-icon.icns` | macOS   | Generated in the release workflow from `desktop-icon.png` |
| `desktop-icon.png`  | Linux/runtime | New PSG desktop app icon |

Source image: `public/image/psg-icon-logo.svg`.

Run `npm run generate:icons` from `mail-vue/` to regenerate the web, mobile PWA, and desktop icon assets.

electron-builder uses `desktop-icon.*` for packaged desktop/install icons. The Electron runtime keeps both icon sets available.

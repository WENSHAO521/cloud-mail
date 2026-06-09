# Build assets

Place generated icons here before running `electron:build`.

| File | Platform | How to generate |
|------|----------|-----------------|
| `icon.ico`  | Windows | Dark PSG icon for light backgrounds |
| `icon.icns` | macOS   | Dark PSG icon for light backgrounds |
| `icon.png`  | Linux   | Dark PSG icon for light backgrounds |
| `desktop-icon.ico`  | Windows | White PSG icon for dark desktop backgrounds |
| `desktop-icon.icns` | macOS   | Generated in the release workflow from `desktop-icon.png` |
| `desktop-icon.png`  | Linux/runtime | White PSG icon for dark desktop backgrounds |

Source image: `public/image/psg-logo.png` (512 × 512 PNG)

Run `node scripts/generate-desktop-icons.cjs` from `mail-vue/` to regenerate `desktop-icon.png` and `desktop-icon.ico` from `icon.png`.

electron-builder uses `desktop-icon.*` for packaged desktop/install icons so the app remains visible on black desktops. The Electron runtime keeps both icon sets and switches between `icon.*` and `desktop-icon.*` based on the OS dark/light theme.

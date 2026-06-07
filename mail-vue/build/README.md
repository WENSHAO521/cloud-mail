# Build assets

Place generated icons here before running `electron:build`.

| File | Platform | How to generate |
|------|----------|-----------------|
| `icon.ico`  | Windows | PowerShell: `scripts/gen-icons.ps1` (uses System.Drawing, no extra deps) |
| `icon.icns` | macOS   | Run `bash scripts/gen-icons.sh` on macOS (uses sips + iconutil) |
| `icon.png`  | Linux   | Copy `public/image/psg-logo.png` → `build/icon.png` |

Source image: `public/image/psg-logo.png` (512 × 512 PNG)

electron-builder reads icons from this directory automatically.

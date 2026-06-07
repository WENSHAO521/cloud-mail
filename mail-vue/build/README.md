# Build assets

Place generated icons here before running `electron:build`.

| File | Platform | How to generate |
|------|----------|-----------------|
| `icon.icns` | macOS | Run `bash scripts/gen-icons.sh` on macOS |
| `icon.ico`  | Windows | Run `bash scripts/gen-icons.sh` on macOS (needs ImageMagick), or use any PNG→ICO converter |
| `icon.png`  | Linux   | Copy `public/pwa-512.png` → `build/icon.png` |

electron-builder reads icons from this directory automatically.

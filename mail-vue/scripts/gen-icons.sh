#!/usr/bin/env bash
# Run this script on macOS to generate app.icns and Windows ICO from pwa-512.png
# Requirements: Xcode command-line tools (iconutil), ImageMagick (for .ico)
#
# Usage: bash scripts/gen-icons.sh

set -e
SRC="public/pwa-512.png"
BUILD="build"
ICONSET="$BUILD/icon.iconset"

echo "→ Generating macOS .icns from $SRC"
mkdir -p "$ICONSET"

# Generate all required sizes for iconset
sizes=(16 32 64 128 256 512)
for s in "${sizes[@]}"; do
  sips -z $s $s "$SRC" --out "$ICONSET/icon_${s}x${s}.png"       2>/dev/null
  sips -z $((s*2)) $((s*2)) "$SRC" --out "$ICONSET/icon_${s}x${s}@2x.png" 2>/dev/null
done

iconutil -c icns "$ICONSET" -o "$BUILD/icon.icns"
echo "✓ Created $BUILD/icon.icns"
rm -rf "$ICONSET"

# Generate Windows ICO (requires ImageMagick)
if command -v convert &>/dev/null; then
  echo "→ Generating Windows icon.ico"
  convert "$SRC" -define icon:auto-resize=256,128,64,48,32,16 "$BUILD/icon.ico"
  echo "✓ Created $BUILD/icon.ico"
else
  echo "  (skipped icon.ico — ImageMagick not found)"
fi

echo "Done. Icons are in $BUILD/"

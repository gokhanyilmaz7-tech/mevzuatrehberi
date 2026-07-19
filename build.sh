#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "[1/4] Web kaynakları derleniyor"
npm run build

# Vite çoklu girişleri templates/ altında üretir; WKWebView kök URL'si ise
# doğrudan /index.html, /mevzuat.html ve /ipc.html bekler.
cp dist/templates/index.html dist/index.html
cp dist/templates/mevzuat.html dist/mevzuat.html
cp dist/templates/ipc.html dist/ipc.html

APP_DIR="$ROOT_DIR/build/macos/MevzuatRehberi.app"
CONTENTS_DIR="$APP_DIR/Contents"
RESOURCES_DIR="$CONTENTS_DIR/Resources"
BIN_DIR="$CONTENTS_DIR/MacOS"
ICON_SOURCE="$ROOT_DIR/build/macos/AppIcon.icns"

for backup_icon in \
  "/Users/gokhanyilmazmac/Desktop/MevzuatRehberi.app.bak.app/Contents/Resources/AppIcon.icns" \
  "/Users/gokhanyilmazmac/Desktop/MevzuatRehberi.app.bak.app.bak/Contents/Resources/AppIcon.icns" \
  "/Users/gokhanyilmazmac/Desktop/MevzuatRehberi-web-wrapper.backup.app/Contents/Resources/AppIcon.icns"; do
  if [[ -f "$backup_icon" ]]; then ICON_SOURCE="$backup_icon"; break; fi
done

if [[ -f "$ROOT_DIR/build/macos/MevzuatRehberi.app/Contents/Resources/AppIcon.icns" ]]; then
  ICON_SOURCE="$ROOT_DIR/build/macos/MevzuatRehberi.app/Contents/Resources/AppIcon.icns"
fi
ICON_CACHE="$(mktemp -t mevzuat-appicon)"
trap 'rm -f "$ICON_CACHE"' EXIT
if [[ -f "$ICON_SOURCE" ]]; then cp "$ICON_SOURCE" "$ICON_CACHE"; fi

echo "[2/4] macOS uygulaması paketleniyor"
rm -rf "$APP_DIR"
mkdir -p "$BIN_DIR" "$RESOURCES_DIR/web"

swiftc -parse-as-library \
  -framework AppKit -framework SwiftUI -framework WebKit \
  macos-app/MevzuatRehberiApp.swift \
  -o "$BIN_DIR/MevzuatRehberi"

cp macos-app/Info.plist "$CONTENTS_DIR/Info.plist"
cp -R dist/. "$RESOURCES_DIR/web/"

if [[ -f "$ICON_CACHE" ]]; then
  cp "$ICON_CACHE" "$RESOURCES_DIR/AppIcon.icns"
else
  echo "AppIcon.icns bulunamadı; mevcut AppIcon.svg kullanılamadı." >&2
  exit 1
fi

chmod +x "$BIN_DIR/MevzuatRehberi"

echo "[3/4] Uygulama doğrulanıyor"
test -x "$BIN_DIR/MevzuatRehberi"
test -f "$RESOURCES_DIR/AppIcon.icns"
test -f "$RESOURCES_DIR/web/index.html"
test -f "$RESOURCES_DIR/web/manifest.json"
test -f "$RESOURCES_DIR/web/ipc-2026.json"

echo "[4/4] Desktop'a kopyalanıyor"
rm -rf "/Users/gokhanyilmazmac/Desktop/MevzuatRehberi.app"
cp -R "$APP_DIR" "/Users/gokhanyilmazmac/Desktop/MevzuatRehberi.app"

echo "Build tamamlandı: /Users/gokhanyilmazmac/Desktop/MevzuatRehberi.app"

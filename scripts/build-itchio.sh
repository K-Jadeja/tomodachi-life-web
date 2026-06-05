#!/usr/bin/env bash
# Build the game and package it for itch.io.
# The output zip is ready to upload as an HTML5 project.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[itchio] Building production bundle…"
npm run build

OUT_DIR="dist"
ZIP_PATH="tomo-island-itchio.zip"

echo "[itchio] Zipping $OUT_DIR → $ZIP_PATH"
# Use system zip (available on macOS, Linux, and via Git Bash on Windows).
zip -r "$ZIP_PATH" "$OUT_DIR" -x "*.map"

echo "[itchio] Done. Upload $ZIP_PATH to itch.io as an HTML5 project."
echo "[itchio] Set 'This file will be played in the browser' and point index.html."

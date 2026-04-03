#!/bin/bash
# Build script — creates a distributable zip of the extension

set -e

DIST="dist"
ZIP="vocab-tool.zip"

rm -rf "$DIST"
mkdir -p "$DIST"

# Copy only the files needed for the extension
cp vocab-extension/manifest.json vocab-extension/popup.html vocab-extension/popup.js vocab-extension/storage.js vocab-extension/styles.css "$DIST/"
cp -r vocab-extension/icons "$DIST/icons"

# Create zip
cd "$DIST"
zip -r "../$ZIP" . -x "*.DS_Store"
cd ..

echo "✓ Built: $ZIP ($(du -sh $ZIP | cut -f1))"
echo "  Files: $(ls $DIST)"

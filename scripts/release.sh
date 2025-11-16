#!/bin/bash
set -e

echo "🚀 Starting release process..."
echo "============================================"

# Step 1: Build all packages
echo "📦 Building packages..."
turbo build

# Step 2: Check VS Code extension version BEFORE changeset publish
VSCODE_PKG="apps/vscode-extension/package.json"
echo ""
echo "🔍 Checking VS Code extension state..."
echo "📄 Package: $VSCODE_PKG"

if [ ! -f "$VSCODE_PKG" ]; then
  echo "❌ ERROR: Package.json not found at $VSCODE_PKG"
  exit 1
fi

VERSION_BEFORE=$(node -p "require('./$VSCODE_PKG').version")
echo "📌 Version BEFORE changeset publish: $VERSION_BEFORE"

# Check if there are any changesets
echo ""
echo "🔍 Checking for changesets..."
CHANGESET_COUNT=$(ls -1 .changeset/*.md 2>/dev/null | grep -v README | wc -l)
echo "📊 Found $CHANGESET_COUNT changeset(s)"

if [ "$CHANGESET_COUNT" -gt 0 ]; then
  echo "📝 Changeset files:"
  ls -1 .changeset/*.md 2>/dev/null | grep -v README || true
fi

# Step 3: Publish to npm via Changesets
echo ""
echo "📢 Publishing to npm..."
echo "============================================"
changeset publish
echo "============================================"

# Step 4: Check if version changed
echo ""
echo "🔍 Checking VS Code extension version AFTER changeset publish..."
VERSION_AFTER=$(node -p "require('./$VSCODE_PKG').version")
echo "📌 Version AFTER changeset publish: $VERSION_AFTER"

# Step 5: Compare versions
echo ""
echo "🔄 Comparing versions..."
echo "   Before: $VERSION_BEFORE"
echo "   After:  $VERSION_AFTER"

if [ "$VERSION_BEFORE" != "$VERSION_AFTER" ]; then
  echo "✅ Version changed! Publishing to VS Code Marketplace..."

  # Check if vsce is installed
  if ! command -v vsce &> /dev/null; then
    echo "📥 Installing vsce..."
    npm install -g @vscode/vsce
  fi

  # Build and publish extension
  echo ""
  echo "🏗️  Building VS Code extension..."
  cd apps/vscode-extension
  pnpm build

  echo ""
  echo "📤 Publishing to Marketplace..."

  # Publish using PAT from environment variable
  if [ -n "$AZURE_VSCODE_PAT" ]; then
    echo "🔑 Using AZURE_VSCODE_PAT from environment"
    vsce publish --no-dependencies --pat "$AZURE_VSCODE_PAT"
  else
    echo "🔑 Using PAT from vsce login"
    vsce publish --no-dependencies
  fi

  cd ../..

  echo ""
  echo "✅ VS Code extension v$VERSION_AFTER published to Marketplace!"
else
  echo "⚠️  Version NOT changed ($VERSION_BEFORE)"
  echo "ℹ️  Skipping Marketplace publish"

  # Additional debugging
  echo ""
  echo "🐛 Debug info:"
  echo "   - Changesets found: $CHANGESET_COUNT"
  echo "   - Package private: $(node -p "require('./$VSCODE_PKG').private")"
  echo "   - Git tags:"
  git tag --list "better-claude-code-vscode@*" | tail -3 || echo "     (none)"
fi

echo ""
echo "🎉 Release process completed!"
echo "============================================"

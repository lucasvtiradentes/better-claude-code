#!/bin/bash
set -e

echo "🚀 Starting release process..."

# Step 1: Build all packages
echo "📦 Building packages..."
turbo build

# Step 2: Store VS Code extension version BEFORE changeset publish
VSCODE_PKG="apps/vscode-extension/package.json"
VERSION_BEFORE=$(node -p "require('./$VSCODE_PKG').version")

# Step 3: Publish to npm via Changesets
echo "📢 Publishing to npm..."
changeset publish

# Step 4: Check if VS Code extension version was bumped by changeset
VERSION_AFTER=$(node -p "require('./$VSCODE_PKG').version")

if [ "$VERSION_BEFORE" != "$VERSION_AFTER" ]; then
  echo "✅ VS Code extension version bumped: $VERSION_BEFORE → $VERSION_AFTER"
  echo "📤 Publishing to VS Code Marketplace..."

  # Check if vsce is installed
  if ! command -v vsce &> /dev/null; then
    echo "📥 Installing vsce..."
    npm install -g @vscode/vsce
  fi

  # Build and publish extension
  cd apps/vscode-extension
  pnpm build

  # Publish using PAT from environment variable
  if [ -n "$AZURE_VSCODE_PAT" ]; then
    echo "🔑 Using AZURE_VSCODE_PAT from environment"
    vsce publish --no-dependencies --pat "$AZURE_VSCODE_PAT"
  else
    echo "🔑 Using PAT from vsce login"
    vsce publish --no-dependencies
  fi

  cd ../..

  echo "✅ VS Code extension published to Marketplace!"
else
  echo "ℹ️  VS Code extension version not changed ($VERSION_BEFORE), skipping Marketplace publish"
fi

echo "🎉 Release process completed!"

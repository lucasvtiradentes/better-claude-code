#!/bin/bash
set -e

echo "🚀 Starting release process..."

# Step 1: Build all packages
echo "📦 Building packages..."
turbo build

# Step 2: Publish to npm via Changesets
echo "📢 Publishing to npm..."
changeset publish

# Step 3: Check if VS Code extension should be published
# Look for git tag matching the extension version (created by changesets)
VSCODE_PKG="apps/vscode-extension/package.json"
CURRENT_VERSION=$(node -p "require('./$VSCODE_PKG').version")
TAG_NAME="better-claude-code-vscode@${CURRENT_VERSION}"

# Check if this tag was just created (exists locally but not on remote yet)
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
  echo "✅ Found new VS Code extension tag: $TAG_NAME"
  echo "📤 Publishing version $CURRENT_VERSION to VS Code Marketplace..."

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
  echo "ℹ️  No new VS Code extension version to publish (current: $CURRENT_VERSION)"
fi

echo "🎉 Release process completed!"

#!/bin/bash
set -e

echo "🚀 Starting release process..."

# Step 1: Build all packages
echo "📦 Building packages..."
turbo build

# Step 2: Publish to npm via Changesets
echo "📢 Publishing to npm..."
changeset publish

# Step 3: Check if VS Code extension version changed
VSCODE_PKG="apps/vscode-extension/package.json"

if git diff HEAD~1 HEAD --quiet -- "$VSCODE_PKG"; then
  echo "ℹ️  VS Code extension not changed, skipping Marketplace publish"
else
  echo "🔍 VS Code extension changed, checking if version was bumped..."

  # Get current version from package.json
  CURRENT_VERSION=$(node -p "require('./$VSCODE_PKG').version")

  # Get previous version from git
  PREV_VERSION=$(git show HEAD~1:./$VSCODE_PKG | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8')).version")

  if [ "$CURRENT_VERSION" != "$PREV_VERSION" ]; then
    echo "✅ Version bumped: $PREV_VERSION → $CURRENT_VERSION"
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
    echo "ℹ️  Version not bumped, skipping Marketplace publish"
  fi
fi

echo "🎉 Release process completed!"

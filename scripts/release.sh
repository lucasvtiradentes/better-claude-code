#!/bin/bash
set -e

echo "🚀 Starting release process..."
echo "============================================"

# Step 1: Build all packages
echo "📦 Building packages..."
turbo build

# Step 2: Check if VS Code extension was bumped in the last commit
VSCODE_PKG="apps/vscode-extension/package.json"
echo ""
echo "🔍 Checking VS Code extension state..."
echo "📄 Package: $VSCODE_PKG"

if [ ! -f "$VSCODE_PKG" ]; then
  echo "❌ ERROR: Package.json not found at $VSCODE_PKG"
  exit 1
fi

CURRENT_VERSION=$(node -p "require('./$VSCODE_PKG').version")
echo "📌 Current version: $CURRENT_VERSION"

# Try to get previous version from git (if available)
PREVIOUS_VERSION=""
if git rev-parse HEAD^ >/dev/null 2>&1; then
  PREVIOUS_VERSION=$(git show HEAD^:./$VSCODE_PKG 2>/dev/null | node -p "try { JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8')).version } catch(e) { '' }" || echo "")
  if [ -n "$PREVIOUS_VERSION" ]; then
    echo "📌 Previous version: $PREVIOUS_VERSION"
  else
    echo "⚠️  Could not read previous version from git"
  fi
else
  echo "⚠️  No previous commit available (shallow clone or first commit)"
fi

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

# Step 4: Determine if we should publish
echo ""
echo "🔄 Determining if VS Code extension should be published..."

SHOULD_PUBLISH=false

# Check if version was bumped in this commit (comparing with previous commit)
if [ -n "$PREVIOUS_VERSION" ] && [ "$PREVIOUS_VERSION" != "$CURRENT_VERSION" ]; then
  echo "✅ Version bumped in this commit: $PREVIOUS_VERSION → $CURRENT_VERSION"
  SHOULD_PUBLISH=true
else
  echo "ℹ️  Version not changed in this commit"
fi

if [ "$SHOULD_PUBLISH" = true ]; then
  echo "✅ Publishing to VS Code Marketplace..."

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
  echo "✅ VS Code extension v$CURRENT_VERSION published to Marketplace!"
else
  echo "⚠️  Skipping Marketplace publish"

  # Additional debugging
  echo ""
  echo "🐛 Debug info:"
  echo "   - Current version: $CURRENT_VERSION"
  echo "   - Previous version: ${PREVIOUS_VERSION:-unknown}"
  echo "   - Changesets found: $CHANGESET_COUNT"
  echo "   - Package private: $(node -p "require('./$VSCODE_PKG').private")"
  echo "   - Recent git tags:"
  git tag --list "better-claude-code-vscode@*" | tail -3 || echo "     (none)"
fi

echo ""
echo "🎉 Release process completed!"
echo "============================================"

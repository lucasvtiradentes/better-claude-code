<div align="center">
<img width="128" src=".github/image/logo.svg" alt="BCC logo">
<h4>Better Claude Code</h4>
<p>
  <a href="https://www.npmjs.com/package/better-claude-code"><img src="https://img.shields.io/npm/v/better-claude-code.svg" alt="npm version"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=lucasvtiradentes.better-claude-code-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/lucasvtiradentes.better-claude-code-vscode.svg" alt="vscode version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <br>
  <a href="#trumpet-overview">Overview</a> • <a href="#star-features">Features</a> • <a href="#package-distributions">Distributions</a> • <a href="#rocket-quick-start">Quick Start</a> • <a href="#wrench-development">Development</a>
</p>

</div>

<a href="#"><img src="./.github/image/divider.png" /></a>

## :trumpet: Overview

Toolkit to view, analyze and compact Claude Code sessions across projects. Available as CLI tool and VS Code extension.

<img src="./.github/image/vscode-extension.png" alt="VS Code Extension Screenshot" width="100%">

<a name="TOC"></a>

## :question: Motivation<a href="#TOC"><img align="right" src="./.github/image/up_arrow.png" width="22"></a>

I was using Claude Code heavily for complex problems but disliked the native session compaction as it lost too much context. So I built this to run custom compaction prompts and continue work across sessions without losing track of where we were.

## :star: Features<a href="#TOC"><img align="right" src="./.github/image/up_arrow.png" width="22"></a>

- **Session Compaction** - Parse and summarize Claude Code sessions with AI
- **Web Dashboard** - Full UI for session analysis
- **VS Code Integration** - Native extension for managing sessions in your editor
- **Multi-project Support** - Track sessions across all your Claude Code projects
- **Custom Labels** - Organize sessions and projects with color-coded tags
- **Filtering** - Filter by date, tokens, labels, and content type
- **Real-time Updates** - File system watching for instant session detection
- **Git Integration** - Automatic project discovery with repository info

## :package: Distributions<a href="#TOC"><img align="right" src="./.github/image/up_arrow.png" width="22"></a>

BCC is distributed in two forms:

### CLI Tool

Command-line interface for session management and web server control.

- **Package**: [`better-claude-code`](https://www.npmjs.com/package/better-claude-code)
- **Installation**: `npm install -g better-claude-code`
- **Binary**: `bcc`
- **Documentation**: [CLI README](./apps/cli/README.md)

### VS Code Extension

Native VS Code extension for editor integration.

- **Vscode extension**: [`better-claude-code-vscode`](https://marketplace.visualstudio.com/items?itemName=lucasvtiradentes.better-claude-code-vscode)
- **Installation**: Search "Better Claude Code" in VS Code Extensions
- **Documentation**: [Extension README](./apps/vscode-extension/README.md)

## :rocket: Quick Start<a href="#TOC"><img align="right" src="./.github/image/up_arrow.png" width="22"></a>

**CLI Quick Start:**

```bash
npm install -g better-claude-code
bcc server start          # Launch web dashboard
bcc compact --latest      # Summarize latest session
```

**VS Code Quick Start:**

1. Install extension from marketplace
2. Click BCC icon in activity bar
3. Browse sessions, right-click to compact

## :wrench: Development<a href="#TOC"><img align="right" src="./.github/image/up_arrow.png" width="22"></a>

```bash
pnpm install                     # Install dependencies
pnpm run dev                     # Start backend + frontend
pnpm run dev:cli                 # CLI development mode
pnpm run build                   # Build all packages
pnpm run typecheck               # Type checking
pnpm run lint                    # Linting
pnpm run format                  # Code formatting
```

## :scroll: License<a href="#TOC"><img align="right" src="./.github/image/up_arrow.png" width="22"></a>

MIT License - see [LICENSE](LICENSE) file for details.

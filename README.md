# BCC - Better Claude Code

CLI auxiliary tools for Claude Code.

## Installation

```bash
npm install -g bcc
```

## Commands

### hello
Print a hello message (template command with flags)

```bash
bcc hello
bcc hello --name John
bcc hello -n Alice --uppercase
bcc hello --name Bob --repeat 3
```

**Flags:**
- `--name, -n <name>` - Name to greet
- `--uppercase, -u` - Print message in uppercase
- `--repeat, -r <number>` - Number of times to repeat the message

### update
Update bcc to latest version

```bash
bcc update
```

### completion
Generate shell completion scripts

```bash
bcc completion install
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Run in development
pnpm run dev -- hello

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
```

## License

MIT

---

<div align="center">
  <p>Made with ❤️ by <b>Lucas Vieira</b></p>
</div>

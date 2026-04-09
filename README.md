# SkillMarket

Cross-platform skill manager for AI coding tools (Cursor, VSCode, Codex, OpenCode, Claude Code, Antigravity).

## Installation

```bash
npm install -g thisisskillmarket
```

Or use directly:

```bash
npx thisisskillmarket --help
```

## Usage

```bash
# List available skills
skm ls

# Show installed skills
skm ls --installed

# View skill information
skm info brainstorming

# Install a skill
skm install brainstorming

# Update a specific skill
skm update brainstorming

# Update all skills
skm update --all

# Sync platform links
skm sync

# Uninstall a skill
skm uninstall brainstorming
```

## Development

```bash
# Install dependencies
npm install

# Build project
npm run build

# Link for local testing
npm link
```

## Architecture

Skills are installed to `~/.skillmarket/` with the following structure:

```
~/.skillmarket/
├── registry.json          # Installed skills registry
├── cache/                 # npm package cache
├── skills/               # Installed skills
│   └── <skill-name>/
│       ├── latest/       # Symlink to latest version
│       └── <version>/
└── platform-links/       # Platform-specific symlinks
    ├── cursor/
    ├── vscode/
    └── ...
```

## Supported Platforms

- Cursor
- VSCode
- Codex
- OpenCode
- Claude Code
- Antigravity

## License

MIT

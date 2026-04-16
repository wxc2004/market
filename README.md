# SkillMarket

Cross-platform skill manager for AI coding tools (Cursor, VSCode, Codex, OpenCode, Claude Code, Antigravity).

## Installation

```bash
npm install -g itismyskillmarket
```

Or use directly:

```bash
npx itismyskillmarket --help
```

## Usage

```bash
# List available skills (with pagination)
skm ls
skm ls --page 2           # Go to page 2
skm ls --limit 10         # Show 10 items per page

# Show installed skills (with pagination)
skm ls --installed
skm ls --installed --page 2

# View skill information
skm info brainstorming

# Install a skill (to all detected platforms)
skm install brainstorming

# Install to specific platform
skm install brainstorming --platform opencode

# Install to multiple platforms
skm install brainstorming --platform opencode,claude,vscode

# Install specific version
skm install brainstorming@1.0.0

# Force overwrite if already installed
skm install brainstorming --force

# Update a specific skill
skm update brainstorming

# Update all skills
skm update --all

# Show available platforms
skm platforms

# Sync platform links
skm sync

# Uninstall a skill (from all platforms)
skm uninstall brainstorming

# Uninstall from specific platform
skm uninstall brainstorming --platform opencode
```

## Cross-Platform Installation

SkillMarket can install skills directly to your AI coding tool's skill directory:

### Supported Platforms

| Platform | Skill Directory | Status |
|----------|---------------|--------|
| OpenCode | `~/.config/opencode/skills/` | ✅ Detected |
| Claude Code | `~/.claude/skills/` | ✅ Available |
| VSCode | `~/.copilot/skills/` | ✅ Available |

### Installation Behavior

By default, `skm install` installs to all detected platforms:

```bash
# Install to all platforms
skm install my-skill
```

Use `--platform` to target specific platforms:

```bash
# OpenCode only
skm install my-skill --platform opencode

# Multiple platforms
skm install my-skill --platform opencode,claude,vscode
```

Use `skm platforms` to see which platforms are available on your system:

```bash
$ skm platforms

📍 Available Platforms:

OpenCode     ✅  Available (2 skills installed)
Claude Code  ✅  Available (1 skills installed)
VSCode       ✅  Available (0 skills installed)
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

# Platform-specific skill directories
~/.config/opencode/skills/<skill-name>/SKILL.md
~/.claude/skills/<skill-name>/SKILL.md
~/.copilot/skills/<skill-name>/SKILL.md
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

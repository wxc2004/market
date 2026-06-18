# SkillMarket

> **v1.3.42** — Cross-platform skill manager for AI coding tools (Cursor, VSCode, Codex CLI, OpenCode, Claude Code, Antigravity, OpenClaw, Hermes Agent, Saitec TUI).

## Installation

```bash
npm install -g itismyskillmarket
```

Or use directly:

```bash
npx itismyskillmarket --help
```

## Download Standalone .exe (Windows)

Download the **standalone Windows executable** (~70 MB) — no Node.js installation required:

```bash
# Download from GitHub Releases
# https://github.com/wxc2004/market/releases/download/v1.3.37/skillmarket.exe

# Double-click the exe to start GUI + open browser automatically
# Or run from terminal:
.\skillmarket.exe          # Start GUI (same as double-click)
.\skillmarket.exe --help   # Show CLI help
.\skillmarket.exe ls       # List available skills
```

> **双击体验**: 直接双击 `skillmarket.exe` 会自动启动 Web GUI 界面并打开浏览器，无需打开终端输入命令。带参数运行则进入命令行模式。

All CLI commands work identically to the npm version. Built with Node.js SEA (Single Executable Applications).

## Usage

```bash
# List available skills (with pagination)
skm ls
skm ls --page 2           # Go to page 2
skm ls --limit 10         # Show 10 items per page

# Show installed skills (with pagination)
skm ls --installed
skm ls --installed --page 2

# Search skills from npm registry
skm search <keyword>
skm search test --limit 10

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

# Install from GitHub
skm install owner/repo
skm install https://github.com/owner/repo

# Update a specific skill
skm update brainstorming

# Update all skills
skm update --all

# Show available platforms
skm platforms

# Sync platform links
skm sync

# Sync skill to latest version (install to all platforms)
skm sync brainstorming

# Uninstall a skill (from all platforms)
skm uninstall brainstorming

# Uninstall from specific platform
skm uninstall brainstorming --platform opencode

# Uninstall all skills
skm uninstall --all
skm uninstall --all --yes      # Skip confirmation
skm uninstall --dry-run         # Preview without deleting

# Publish a skill to npm
skm publish <skill-name>
skm publish <skill-name> --version 1.0.1

# Verify a skill
skm verify <skill-name>

# Manage configuration
skm config                 # View all configuration values
skm config get npmRegistry # Get a specific config value
skm config set npmRegistry https://registry.npmmirror.com  # Set a value (persistent)
skm config reset npmScope  # Reset a config to default
skm config reset --all     # Reset all config to defaults

# Start GUI (web interface)
skm gui
skm gui 18790              # Custom port

# Admin: manage published skills (read-only)
skm admin ls               # List all published skills
skm admin info <skill>     # View skill details
skm admin search <keyword> # Search published skills
skm admin stats            # Publishing statistics
skm admin verify <skill>   # Verify published skill

# Admin: manage published skills (write operations)
skm admin deprecate <skill>          # Deprecate a skill (--version, --message)
skm admin unpublish <skill>          # Unpublish a skill (--version, --force)
skm admin tag set <skill> <tag> <v>  # Set a dist-tag
skm admin tag rm <skill> <tag>       # Remove a dist-tag
skm admin tag ls <skill>             # List all dist-tags
skm admin owner add <skill> <user>   # Add package maintainer
skm admin owner rm <skill> <user>    # Remove package maintainer
skm admin access <skill> <level>     # Set access (public|restricted)
```

## Admin: Cloud Skill Management

SkillMarket provides a comprehensive admin command group (`skm admin`) for managing published skills on the npm registry. All write operations use your npm credentials.

### Read-Only Commands

| Command | Description |
|---------|-------------|
| `skm admin ls` | List all published skills |
| `skm admin info <skill>` | View full skill details (versions, dist-tags, metadata) |
| `skm admin search <keyword>` | Search published skills |
| `skm admin stats` | Publishing statistics dashboard |
| `skm admin verify <skill>` | Validate published skill structure and metadata |

### Write Operations (Management)

| Command | Description |
|---------|-------------|
| `skm admin deprecate <skill>` | Mark skill as deprecated (--version, --message) |
| `skm admin unpublish <skill>` | Remove skill from npm (--version, --force) |
| `skm admin tag set <skill> <tag> <ver>` | Set a distribution tag (e.g. `beta`, `next`) |
| `skm admin tag rm <skill> <tag>` | Remove a distribution tag |
| `skm admin tag ls <skill>` | List all distribution tags |
| `skm admin owner add <skill> <user>` | Add an npm user as package maintainer |
| `skm admin owner rm <skill> <user>` | Remove a package maintainer |
| `skm admin access <skill> <level>` | Set package visibility (public\|restricted) |

### Admin Examples

```bash
# Deprecate a skill with custom message
skm admin deprecate brainstorming --message "Use v2 instead"

# Unpublish a specific version
skm admin unpublish my-skill --version 1.0.0

# Unpublish entire package (requires --force)
skm admin unpublish my-skill --force

# Manage dist-tags
skm admin tag set my-skill beta 2.0.0-beta.1
skm admin tag ls my-skill
skm admin tag rm my-skill beta

# Manage maintainers
skm admin owner add my-skill collaborator-npm-username
skm admin owner rm my-skill old-maintainer

# Set package to private
skm admin access my-skill restricted
```

### GUI Upload Skill

The `skm gui` web interface includes an **Upload** view for publishing or installing skills from a `.zip` archive:

1. Drag & drop or select a skill zip file
2. Click "Upload & Parse" to extract and validate
3. Choose action: **Publish to npm**, **Install Locally**, or **Both**

### GUI Admin Dashboard

The `skm gui` web interface includes an **Admin** view with:
- **Statistics cards**: Published skills, total/average versions, metadata coverage, total size, platform coverage
- **Skill management list**: All published skills with inline actions for deprecate, unpublish, tag, owner, and access management
- **Modal dialogs**: Confirmation dialogs for each management operation

```bash
# Start GUI and navigate to Admin view
skm gui
```

## Configuration

SkillMarket supports three levels of configuration (priority: high → low):

1. **Environment variables** — highest priority, override everything
2. **Config file** (`~/.skillmarket/config.json`) — set via `skm config set`
3. **Defaults** — sensible built-in values

Use the `skm config` CLI commands to manage persistent configuration:

```bash
skm config                    # View all config with source indicators
skm config set npmRegistry https://registry.npmmirror.com  # Set mirror registry
skm config get npmRegistry    # View single config value
skm config reset npmScope     # Reset to default
skm config reset --all        # Reset all config
```

### Environment Variables

Environment variables override both config file and defaults:

| Variable | Default | Description |
|----------|---------|-------------|
| `SKM_NPM_SCOPE` | `@itismyskillmarket` | Primary npm scope for publishing/lookup |
| `SKM_NPM_SCOPE_FALLBACK` | `@wanxuchen` | Fallback scope (backward compatibility) |
| `SKM_NPM_SCOPES` | (5 scopes) | Comma-separated list of scopes to search |
| `SKM_NPM_REGISTRY` | `https://registry.npmjs.org` | npm registry URL |
| `SKM_URL` | `https://www.npmjs.com/package/@itismyskillmarket` | Personal link prefix for `skm publish` output |

Example:
```bash
export SKM_NPM_SCOPE=@mycompany
export SKM_URL=https://my-registry.example.com
skm publish my-skill   # → View at: https://my-registry.example.com/my-skill
```

## Cross-Platform Installation

SkillMarket can install skills directly to your AI coding tool's skill directory:

### Supported Platforms

| Platform | Skill Directory | Status |
|----------|---------------|--------|
| OpenCode | `~/.config/opencode/skills/` | ✅ Detected |
| Claude Code | `~/.claude/skills/` | ✅ Available |
| VSCode | `~/.copilot/skills/` | ✅ Available |
| Codex CLI | `~/.codex/skills/` | ✅ Available |
| OpenClaw | `~/.openclaw/skills/` | ✅ Available |
| Hermes Agent | `~/.hermes/skills/` | ✅ Available |
| Saitec TUI | `~/.saitec_tui/skills/` | ✅ Available |

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
skm install my-skill --platform opencode,claude,vscode,codex
```

Use `skm platforms` to see which platforms are available on your system:

```bash
$ skm platforms

📍 Available Platforms:

OpenCode        ✅  Available (2 skills installed)
Claude Code     ✅  Available (1 skills installed)
VSCode          ✅  Available (0 skills installed)
Codex CLI       ✅  Available (0 skills installed)
OpenClaw        ✅  Available (0 skills installed)
Hermes Agent    ✅  Available (0 skills installed)
Saitec TUI      ✅  Available (0 skills installed)
```

## Development

```bash
# Install dependencies
npm install

# Build project
npm run build

# Link for local testing
npm link

# Build standalone .exe (Windows)
# Requires: Node.js 20+, esbuild, postject
node scripts/build-exe.mjs
# Output: dist/skillmarket.exe (~70 MB)
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
~/.codex/skills/<skill-name>/SKILL.md
```

## Supported Platforms

- Cursor
- VSCode
- Codex CLI
- OpenCode
- Claude Code
- Antigravity
- OpenClaw
- Hermes Agent
- Saitec TUI

## License

MIT

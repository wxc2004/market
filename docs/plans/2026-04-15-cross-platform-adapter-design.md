# Cross-Platform Skill Adapter Design

**Date**: 2026-04-15
**Author**: wxc2004
**Status**: Approved

## 1. Overview

### 1.1 Problem Statement

SkillMarket currently installs skills to a local `~/.skillmarket/` directory with platform-specific symlinks. Users need a unified way to install skills directly into their AI coding tool platforms (OpenCode, Claude Code, VSCode) with a single command.

### 1.2 Goals

1. Provide a simple `skm install <skill>` command for end users
2. Automatically detect installed platforms and install skills appropriately
3. Support explicit platform targeting via `--platform` flag
4. Follow Agent Skills open standard across all platforms
5. Allow users to discover and install skills from a central marketplace (npm)

### 1.3 Success Criteria

- [ ] User can install a skill to all detected platforms with one command
- [ ] User can specify `--platform opencode|claude|vscode` to install to specific platform
- [ ] Already installed skills are skipped (idempotent)
- [ ] Skills follow the Agent Skills standard (SKILL.md with YAML frontmatter)
- [ ] Works on Windows, macOS, and Linux

---

## 2. Platform Analysis

### 2.1 OpenCode

| Property | Value |
|----------|-------|
| Skill Directory | `~/.config/opencode/skills/<name>/` |
| File Required | `SKILL.md` with YAML frontmatter |
| Detection | Check `OPENCODE` environment variable |
| Config | `~/.config/opencode/opencode.json` |

**Skill Structure:**
```
~/.config/opencode/skills/<skill-name>/
└── SKILL.md
```

### 2.2 Claude Code

| Property | Value |
|----------|-------|
| Skill Directory | `~/.claude/skills/<name>/` |
| File Required | `SKILL.md` with YAML frontmatter |
| Detection | Check `CLAUDE_CODE` environment variable or `~/.claude/` exists |
| Official Market | `claude plugin install` command |

**Skill Structure:**
```
~/.claude/skills/<skill-name>/
└── SKILL.md
```

### 2.3 VSCode (GitHub Copilot Agent Skills)

| Property | Value |
|----------|-------|
| Skill Directory | `~/.copilot/skills/<name>/` |
| File Required | `SKILL.md` with YAML frontmatter |
| Detection | Check `~/.copilot/skills/` or `VSCODE` environment variable |
| Alternative | `~/.claude/skills/` (cross-compatible) |

**Skill Structure:**
```
~/.copilot/skills/<skill-name>/
└── SKILL.md
```

---

## 3. Architecture Design

### 3.1 Directory Structure

```
~/.skillmarket/                    # Local skill cache (existing)
├── skills/
│   └── <skill-id>/
│       └── <version>/
│           ├── SKILL.md
│           └── metadata.json
└── cache/

~/.config/opencode/skills/          # OpenCode platform link
└── <skill-id>/
    └── SKILL.md

~/.claude/skills/                   # Claude Code platform link
└── <skill-id>/
    └── SKILL.md

~/.copilot/skills/                  # VSCode platform link
└── <skill-id>/
    └── SKILL.md
```

### 3.2 Module Design

#### 3.2.1 Platform Detection Module

**File**: `src/utils/platform-detect.ts`

```typescript
interface Platform {
  id: 'opencode' | 'claude' | 'vscode';
  name: string;
  skillDir: string;
  detect: () => boolean;
}
```

**Detection Logic:**
1. Check environment variables first
2. Fall back to directory existence checks
3. Support user override via config

#### 3.2.2 Platform Adapter Module

**File**: `src/adapters/`

```
src/adapters/
├── base.ts           # Abstract base adapter
├── opencode.ts       # OpenCode specific implementation
├── claude.ts         # Claude Code specific implementation
└── vscode.ts         # VSCode specific implementation
```

**Adapter Interface:**
```typescript
interface PlatformAdapter {
  readonly id: string;
  readonly name: string;
  readonly skillDir: string;
  
  isInstalled(): Promise<boolean>;
  isInstalled(skillId: string): Promise<boolean>;
  install(skillId: string, skillDir: string): Promise<void>;
  uninstall(skillId: string): Promise<void>;
  listInstalled(): Promise<string[]>;
}
```

#### 3.2.3 Install Command Enhancement

**File**: `src/commands/install.ts` (modify)

**New Behavior:**
1. Parse `--platform` flag (optional)
2. If no flag, detect all available platforms
3. For each platform:
   - Check if already installed (skip if yes)
   - Copy/link skill from cache to platform directory
4. Display installation summary

**CLI Usage:**
```bash
# Install to all detected platforms
skm install brainstorming

# Install to specific platform
skm install brainstorming --platform opencode

# Install to multiple platforms
skm install brainstorming --platform opencode,claude

# List all platforms
skm platforms
```

---

## 4. Implementation Details

### 4.1 Platform Detection Logic

```typescript
function detectPlatforms(): Platform[] {
  const platforms: Platform[] = [];
  
  if (process.env.OPENCODE || exists(OPENCODE_SKILL_DIR)) {
    platforms.push(opencodeAdapter);
  }
  
  if (process.env.CLAUDE_CODE || exists(CLAUDE_SKILL_DIR)) {
    platforms.push(claudeAdapter);
  }
  
  if (exists(VSCODE_SKILL_DIR)) {
    platforms.push(vscodeAdapter);
  }
  
  return platforms;
}
```

### 4.2 Installation Flow

```
skm install <skill-id>
    │
    ├── Parse args (skillId, --platform)
    │
    ├── Determine target platforms
    │   ├── --platform flag → use specified
    │   └── no flag → detect all available
    │
    ├── Download skill from npm (if not cached)
    │
    ├── For each target platform:
    │   ├── Check if already installed
    │   ├── If not: copy SKILL.md to platform dir
    │   └── If yes: skip (show "already installed")
    │
    └── Display summary
```

### 4.3 File Operations

**Copy Strategy:**
- Source: `~/.skillmarket/skills/<skill-id>/latest/SKILL.md`
- Target: `<platform-skill-dir>/<skill-id>/SKILL.md`
- Use `fs.copy()` for cross-platform compatibility
- Create parent directories as needed

**Windows Symlink Note:**
- Use `junction` type for Windows compatibility
- Fall back to copy if symlink fails

---

## 5. CLI Interface

### 5.1 Install Command

```bash
skm install <skill-id> [options]

Options:
  --platform <platforms>    Target platforms (comma-separated)
  --force                   Overwrite if already installed
  --version <version>       Specific version to install

Examples:
  skm install brainstorming              # Install to all platforms
  skm install brainstorming --platform opencode   # OpenCode only
  skm install brainstorming --platform claude,vscode
  skm install brainstorming@1.0.0        # Specific version
```

### 5.2 Platforms Command (new)

```bash
skm platforms [options]

Options:
  --installed    Show only platforms with skills installed
  --available    Show only platforms detected as available

Output:
  OpenCode   ✅ installed (5 skills)
  Claude     ✅ installed (3 skills)
  VSCode     ⚠️ available (no skills installed)
```

### 5.3 Uninstall Command

```bash
skm uninstall <skill-id> [options]

Options:
  --platform <platforms>    Target platforms (default: all)
```

---

## 6. Error Handling

### 6.1 Error Cases

| Error | Handling |
|-------|----------|
| Platform directory not writable | Show error with `sudo` hint |
| Skill not found in registry | Show available skills |
| Network error (npm) | Retry 3 times, then show error |
| Partial install failure | Continue with other platforms, report failures |

### 6.2 User Feedback

```
Installing brainstorming to platforms...

OpenCode   ⚠️  Already installed (use --force to overwrite)
Claude     ✅  Installed successfully
VSCode     ✅  Installed successfully

Summary: 2 installed, 1 skipped, 0 failed
```

---

## 7. Configuration

### 7.1 User Config File

**File**: `~/.skillmarket/config.json`

```json
{
  "defaultPlatforms": ["opencode", "claude", "vscode"],
  "installStrategy": "all",
  "autoUpdate": true
}
```

### 7.2 Per-Skill Config

Skills can specify compatible platforms in `metadata.json`:

```json
{
  "name": "brainstorming",
  "version": "1.0.0",
  "platforms": ["opencode", "claude", "vscode"]
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

- Platform detection
- Adapter implementations
- CLI argument parsing

### 8.2 Integration Tests

- Full install/uninstall cycle
- Platform-specific behaviors
- Cross-platform scenarios

### 8.3 Manual Testing

- Test on Windows, macOS, Linux
- Test with each platform running

---

## 9. Migration Plan

### 9.1 Backward Compatibility

- Existing `skm sync` command continues to work
- New `--platform` flag is additive
- No breaking changes to existing behavior

### 9.2 Deprecation Path

- Phase 1: New install command with platform support
- Phase 2: `sync` command delegates to new implementation
- Phase 3: (optional) Deprecate `sync` in favor of direct install

---

## 10. Future Considerations

### 10.1 Platform Marketplace Integration

- Claude Code: Submit to Anthropic plugin marketplace
- VSCode: Create VSCode extension for easy discovery
- OpenCode: Integrate with oh-my-opencode plugin system

### 10.2 Advanced Features

- `skm update --all` with platform awareness
- Platform-specific skill variants
- Skill dependency resolution

---

## Appendix A: Reference Links

- [OpenCode Skills Documentation](https://opencode.ai/docs/skills/)
- [Claude Code Plugins Reference](https://docs.anthropic.com/en/docs/claude-code/plugins-reference)
- [VSCode Agent Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [Agent Skills Open Standard](https://github.com/model-context-protocol/specs)

---

## Appendix B: SKILL.md Format

All skills must follow this format:

```markdown
---
name: skill-name
description: Brief description for agent selection
license: MIT
compatibility: opencode,claude,vscode
---

# Skill Name

Detailed instructions...
```

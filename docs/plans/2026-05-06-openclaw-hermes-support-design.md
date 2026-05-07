# OpenClaw & Hermes Agent Skill Format Support - Design

**Date**: 2026-05-06
**Status**: Approved
**Scope**: Add OpenClaw and Hermes Agent as supported platforms in SkillMarket

## Background

SkillMarket currently supports: Cursor, VSCode, Codex, OpenCode, Claude Code, Antigravity.
OpenClaw and Hermes Agent both follow the **agentskills.io open standard** (SKILL.md + YAML frontmatter), making them natural additions to the platform list.

## Skill Format Compatibility

| | OpenClaw | Hermes Agent |
|---|---|---|
| Skill Directory | `~/.openclaw/skills/` | `~/.hermes/skills/` + `<project>/skills/` |
| Metadata Field | `metadata.openclaw` | `metadata.hermes` |
| Platform Identifier | `"openclaw"` | `"hermes"` |
| Spec Base | agentskills.io open standard | agentskills.io open standard |

Both formats are SKILL.md-based and structurally compatible with existing Cursor/Claude Code formats.

## Design Decisions

### Decision 1: Two New Platform Adapters (Approved)

**Choice**: Create `adapters/openclaw.ts` and `adapters/hermes.ts` following the exact same pattern as existing adapters.

**Rationale**:
- 100% consistent with existing architecture
- Independent platform logic for future platform-specific behavior
- Clear, reviewable changes

### Decision 2: No New Types Required (Approved)

Existing `SkillMetadata.platforms: string[]` already supports arbitrary platform strings.
Existing `InstalledSkill.platforms: string[]` already persists platform info correctly.
No type changes needed.

### Decision 3: Metadata Passthrough (Approved)

OpenClaw's `metadata.openclaw.*` and Hermes' `metadata.hermes.*` fields are:
- Preserved as-is in SKILL.md when copying to target platform directory
- Optionally displayed in `skm info` for dependency visibility
- Runtime gating is handled by each agent, not by SkillMarket

### Decision 4: No Core Command Changes (Approved)

`install.ts`, `uninstall.ts`, `ls.ts`, `search.ts`, `update.ts`, `sync.ts` do NOT need changes.
Platform dispatching already works via `getAdapterByPlatform()` → adapter methods.

## File Changes

### New Files
```
src/adapters/openclaw.ts   - OpenClaw platform adapter
src/adapters/hermes.ts     - Hermes Agent platform adapter
```

### Modified Files
```
src/constants.ts           - Add 'openclaw' and 'hermes' to PLATFORMS array
src/adapters/index.ts       - Export new adapters
src/adapters/registry.ts    - Register new adapters in getAdapterByPlatform()
```

### Optional Enhancement
```
src/commands/info.ts       - Display metadata.openclaw/hermes dependency info
```

### No Changes Required
```
src/cli.ts                  - No change
src/commands/install.ts     - No change (platform dispatch works as-is)
src/commands/uninstall.ts   - No change
src/commands/ls.ts          - No change
src/commands/search.ts      - No change
src/commands/update.ts      - No change
src/commands/sync.ts       - No change
src/types.ts                - No change (platforms: string[] is compatible)
src/commands/github-install.ts - No change (format already compatible)
```

## Adapter Implementation Plan

### OpenClawAdapter (`src/adapters/openclaw.ts`)

```typescript
export class OpenClawAdapter implements PlatformAdapter {
  readonly id = 'openclaw';
  readonly name = 'OpenClaw';
  readonly skillDir = path.join(os.homedir(), '.openclaw', 'skills');

  async isAvailable(): Promise<boolean> {
    // Check if ~/.openclaw/ exists
  }

  async isInstalled(skillId: string): Promise<boolean> {
    // Check if skill dir exists in skillDir
  }

  async install(skillId: string, sourceDir: string): Promise<void> {
    // Copy SKILL.md and supporting files to skillDir/skillId/
  }

  async uninstall(skillId: string): Promise<void> {
    // Remove skillDir/skillId/
  }

  async listInstalled(): Promise<string[]> {
    // Read skillDir directory
  }
}
```

### HermesAdapter (`src/adapters/hermes.ts`)

```typescript
export class HermesAdapter implements PlatformAdapter {
  readonly id = 'hermes';
  readonly name = 'Hermes Agent';
  readonly skillDir = path.join(os.homedir(), '.hermes', 'skills');

  async isAvailable(): Promise<boolean> {
    // Check if ~/.hermes/ exists
    // Also check for project-level skills/ directory
  }

  async isInstalled(skillId: string): Promise<boolean> {
    // Check global skillDir + project skills/
  }

  async install(skillId: string, sourceDir: string): Promise<void> {
    // Copy to skillDir/skillId/
    // Note: Hermes also supports project-level skills/
  }

  async uninstall(skillId: string): Promise<void> {
    // Remove from skillDir/skillId/ (global)
  }

  async listInstalled(): Promise<string[]> {
    // Combine global + project skills
  }
}
```

## Backward Compatibility

| Existing Feature | Status |
|---|---|
| Previously installed skills (opencode/claude/vscode etc.) | ✅ Unaffected |
| `registry.json` format | ✅ Unchanged |
| npm package format (`package.json` skillmarket field) | ✅ Unchanged |
| All CLI commands | ✅ Behavior unchanged |

This is a **pure additive** change — zero breaking changes.

## Testing Strategy

### Unit Tests (vitest)
- `src/adapters/openclaw.test.ts` — Test all adapter methods
- `src/adapters/hermes.test.ts` — Test all adapter methods
- `src/adapters/registry.test.ts` — Test new platform registration

### Manual Verification
```bash
# 1. Check platform detection
skm platforms
# Should show: OpenClaw ✅ / Hermes Agent ✅ (if directories exist)

# 2. Install to new platforms
skm install brainstorming --platform openclaw
# Verify: ~/.openclaw/skills/brainstorming/SKILL.md exists

skm install brainstorming --platform hermes
# Verify: ~/.hermes/skills/brainstorming/SKILL.md exists

# 3. List installed
skm ls --installed
# Should show brainstorming on openclaw and hermes platforms

# 4. Uninstall
skm uninstall brainstorming --platform openclaw
```

### Format Compatibility Verification
- Install a skill with `metadata.openclaw` from GitHub → verify full SKILL.md is copied
- Install a skill with `metadata.hermes` from GitHub → verify full SKILL.md is copied

## Data Flow

```
User Input → skm install <skill> --platform openclaw,hermes
         ↓
cli.ts parses → install.ts
         ↓
parsePlatforms() → ["openclaw", "hermes"]
         ↓
getAdapterByPlatform("openclaw") → OpenClawAdapter
getAdapterByPlatform("hermes")   → HermesAdapter
         ↓
adapter.isAvailable() checks if directory exists
         ↓
adapter.install(skillId, sourceDir)
         ↓
Copy SKILL.md to ~/.openclaw/skills/<name>/
Copy SKILL.md to ~/.hermes/skills/<name>/
         ↓
Update registry.json with platforms: ["openclaw", "hermes"]
```

## Success Criteria

- [ ] `skm platforms` lists OpenClaw and Hermes Agent
- [ ] `skm install <skill> --platform openclaw` installs to `~/.openclaw/skills/`
- [ ] `skm install <skill> --platform hermes` installs to `~/.hermes/skills/`
- [ ] `skm install <skill>` (all platforms) includes new platforms in detection
- [ ] `skm ls --installed` shows correct platform tags
- [ ] `skm uninstall <skill> --platform openclaw` works
- [ ] `skm uninstall <skill> --platform hermes` works
- [ ] Existing platform installs/uninstalls unaffected
- [ ] registry.json format unchanged and backward compatible

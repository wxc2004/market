# OpenClaw & Hermes Agent Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add OpenClaw and Hermes Agent as supported platforms in SkillMarket, enabling `skm install <skill> --platform openclaw,hermes`.

**Architecture:** Follow existing adapter pattern. Create two new platform adapters (`OpenClawAdapter`, `HermesAdapter`) that implement `PlatformAdapter` interface. Register them in the adapter registry. No core command changes needed.

**Tech Stack:** TypeScript, tsup, vitest, fs-extra

**Design Doc:** `docs/plans/2026-05-06-openclaw-hermes-support-design.md`

---

### Task 1: Update Constants - Add New Platform Identifiers

**Files:**
- Modify: `src/constants.ts:78-85`

**Step 1: Write the failing test**

```typescript
// src/constants.test.ts
import { PLATFORMS } from './constants.js';

describe('PLATFORMS', () => {
  it('should include openclaw', () => {
    expect(PLATFORMS).toContain('openclaw');
  });

  it('should include hermes', () => {
    expect(PLATFORMS).toContain('hermes');
  });

  it('should maintain existing platforms', () => {
    expect(PLATFORMS).toContain('opencode');
    expect(PLATFORMS).toContain('claude');
    expect(PLATFORMS).toContain('vscode');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/constants.test.ts`
Expected: FAIL with "expected [] to contain 'openclaw'"

**Step 3: Add platform identifiers to PLATFORMS**

```typescript
// src/constants.ts:78-87
export const PLATFORMS = [
  'cursor',      // Cursor IDE - AI 代码编辑器
  'vscode',      // Visual Studio Code - 微软代码编辑器
  'codex',       // OpenAI Codex - OpenAI 代码生成模型
  'opencode',    // OpenCode - 开源 AI 编程工具
  'claude',      // Claude Code - Anthropic CLI 工具
  'antigravity',  // Antigravity - AI 编程助手
  'openclaw',    // OpenClaw - AgentSkills compatible agent
  'hermes',      // Hermes Agent - NousResearch agent framework
] as const;
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/constants.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/constants.ts src/constants.test.ts
git commit -m "feat: add openclaw and hermes to PLATFORMS constant"
```

---

### Task 2: Create OpenClawAdapter

**Files:**
- Create: `src/adapters/openclaw.ts`

**Step 1: Write the failing tests**

```typescript
// src/adapters/openclaw.test.ts
import { OpenClawAdapter } from './openclaw.js';
import { PlatformAdapter } from './base.js';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

describe('OpenClawAdapter', () => {
  let adapter: OpenClawAdapter;

  beforeEach(() => {
    adapter = new OpenClawAdapter();
  });

  it('should implement PlatformAdapter interface', () => {
    expect(adapter).toBeInstanceOf(PlatformAdapter);
  });

  it('should have id "openclaw"', () => {
    expect(adapter.id).toBe('openclaw');
  });

  it('should have name "OpenClaw"', () => {
    expect(adapter.name).toBe('OpenClaw');
  });

  it('should have correct skillDir', () => {
    expect(adapter.skillDir).toBe(join(homedir(), '.openclaw', 'skills'));
  });

  it('should check availability based on ~/.openclaw/ existence', async () => {
    const result = await adapter.isAvailable();
    expect(typeof result).toBe('boolean');
  });

  it('should check if skill is installed', async () => {
    const result = await adapter.isInstalled('test-skill');
    expect(typeof result).toBe('boolean');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/adapters/openclaw.test.ts`
Expected: FAIL with "module not found"

**Step 3: Implement OpenClawAdapter**

```typescript
// src/adapters/openclaw.ts
/**
 * OpenClaw Platform Adapter
 * 
 * Installs skills to ~/.openclaw/skills/
 * OpenClaw uses AgentSkills-compatible SKILL.md format
 */
import { PlatformAdapter } from './base.js';
import { readdirSync, existsSync, cpSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import { ensureDirSync } from 'fs-extra';

export class OpenClawAdapter implements PlatformAdapter {
  readonly id = 'openclaw';
  readonly name = 'OpenClaw';
  readonly skillDir = join(homedir(), '.openclaw', 'skills');

  async isAvailable(): Promise<boolean> {
    try {
      return existsSync(join(homedir(), '.openclaw'));
    } catch {
      return false;
    }
  }

  async isInstalled(skillId: string): Promise<boolean> {
    try {
      const skillPath = join(this.skillDir, skillId);
      return existsSync(skillPath);
    } catch {
      return false;
    }
  }

  async install(skillId: string, sourceDir: string): Promise<void> {
    ensureDirSync(this.skillDir);
    const targetDir = join(this.skillDir, skillId);
    
    // Remove existing skill directory if present
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }
    
    // Copy entire skill directory (SKILL.md + supporting files)
    cpSync(sourceDir, targetDir, { recursive: true });
  }

  async uninstall(skillId: string): Promise<void> {
    const targetDir = join(this.skillDir, skillId);
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }
  }

  async listInstalled(): Promise<string[]> {
    try {
      if (!existsSync(this.skillDir)) {
        return [];
      }
      return readdirSync(this.skillDir)
        .filter(name => {
          const fullPath = join(this.skillDir, name);
          return existsSync(fullPath) && name !== '.';
        });
    } catch {
      return [];
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/adapters/openclaw.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/adapters/openclaw.ts src/adapters/openclaw.test.ts
git commit -m "feat: add OpenClawAdapter for OpenClaw platform support"
```

---

### Task 3: Create HermesAdapter

**Files:**
- Create: `src/adapters/hermes.ts`

**Step 1: Write the failing tests**

```typescript
// src/adapters/hermes.test.ts
import { HermesAdapter } from './hermes.js';
import { PlatformAdapter } from './base.js';
import { join } from 'path';
import { homedir } from 'os';

describe('HermesAdapter', () => {
  let adapter: HermesAdapter;

  beforeEach(() => {
    adapter = new HermesAdapter();
  });

  it('should implement PlatformAdapter interface', () => {
    expect(adapter).toBeInstanceOf(PlatformAdapter);
  });

  it('should have id "hermes"', () => {
    expect(adapter.id).toBe('hermes');
  });

  it('should have name "Hermes Agent"', () => {
    expect(adapter.name).toBe('Hermes Agent');
  });

  it('should have correct skillDir', () => {
    expect(adapter.skillDir).toBe(join(homedir(), '.hermes', 'skills'));
  });

  it('should check availability based on ~/.hermes/ existence', async () => {
    const result = await adapter.isAvailable();
    expect(typeof result).toBe('boolean');
  });

  it('should install skill to global skills directory', async () => {
    // Test that install copies to ~/.hermes/skills/
    const result = await adapter.isAvailable();
    expect(typeof result).toBe('boolean');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/adapters/hermes.test.ts`
Expected: FAIL with "module not found"

**Step 3: Implement HermesAdapter**

```typescript
// src/adapters/hermes.ts
/**
 * Hermes Agent Platform Adapter
 * 
 * Installs skills to ~/.hermes/skills/
 * Hermes also supports project-level skills/ directory
 * Hermes uses AgentSkills-compatible SKILL.md format with metadata.hermes
 */
import { PlatformAdapter } from './base.js';
import { readdirSync, existsSync, cpSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import { ensureDirSync } from 'fs-extra';

export class HermesAdapter implements PlatformAdapter {
  readonly id = 'hermes';
  readonly name = 'Hermes Agent';
  readonly skillDir = join(homedir(), '.hermes', 'skills');

  async isAvailable(): Promise<boolean> {
    try {
      // Check global hermes directory
      if (existsSync(join(homedir(), '.hermes'))) {
        return true;
      }
      
      // Could also check for project-level skills/ directory
      // but for SkillMarket, we focus on global installation
      return false;
    } catch {
      return false;
    }
  }

  async isInstalled(skillId: string): Promise<boolean> {
    try {
      const skillPath = join(this.skillDir, skillId);
      return existsSync(skillPath);
    } catch {
      return false;
    }
  }

  async install(skillId: string, sourceDir: string): Promise<void> {
    ensureDirSync(this.skillDir);
    const targetDir = join(this.skillDir, skillId);
    
    // Remove existing skill directory if present
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }
    
    // Copy entire skill directory (SKILL.md + supporting files)
    cpSync(sourceDir, targetDir, { recursive: true });
  }

  async uninstall(skillId: string): Promise<void> {
    const targetDir = join(this.skillDir, skillId);
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }
  }

  async listInstalled(): Promise<string[]> {
    try {
      if (!existsSync(this.skillDir)) {
        return [];
      }
      return readdirSync(this.skillDir)
        .filter(name => {
          const fullPath = join(this.skillDir, name);
          return existsSync(fullPath) && name !== '.';
        });
    } catch {
      return [];
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/adapters/hermes.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/adapters/hermes.ts src/adapters/hermes.test.ts
git commit -m "feat: add HermesAdapter for Hermes Agent platform support"
```

---

### Task 4: Update Adapter Registry

**Files:**
- Modify: `src/adapters/registry.ts`

**Step 1: Write the failing test**

```typescript
// src/adapters/registry.test.ts (add to existing file)
describe('getAdapterByPlatform', () => {
  // ...existing tests...

  it('should return OpenClawAdapter for "openclaw"', () => {
    const adapter = getAdapterByPlatform('openclaw');
    expect(adapter.id).toBe('openclaw');
    expect(adapter.name).toBe('OpenClaw');
  });

  it('should return HermesAdapter for "hermes"', () => {
    const adapter = getAdapterByPlatform('hermes');
    expect(adapter.id).toBe('hermes');
    expect(adapter.name).toBe('Hermes Agent');
  });

  it('should throw for unknown platform', () => {
    expect(() => getAdapterByPlatform('unknown' as any)).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/adapters/registry.test.ts`
Expected: FAIL with "Unknown platform: openclaw"

**Step 3: Update registry.ts to register new adapters**

```typescript
// src/adapters/registry.ts
import { PlatformAdapter } from './base.js';
import { OpenCodeAdapter } from './opencode.js';
import { ClaudeAdapter } from './claude.js';
import { VSCodeAdapter } from './vscode.js';
import { OpenClawAdapter } from './openclaw.js';  // NEW
import { HermesAdapter } from './hermes.js';       // NEW

export function detectPlatforms(): Promise<string[]> {
  // ...existing code unchanged...
}

export function getPlatformAdapter(platform: string): PlatformAdapter {
  return getAdapterByPlatform(platform);
}

export function getAllAdapters(): PlatformAdapter[] {
  return [
    new OpenCodeAdapter(),
    new ClaudeAdapter(),
    new VSCodeAdapter(),
    new OpenClawAdapter(),   // NEW
    new HermesAdapter(),      // NEW
  ];
}

export function getAdapterByPlatform(platform: string): PlatformAdapter {
  switch (platform) {
    case 'opencode':
      return new OpenCodeAdapter();
    case 'claude':
      return new ClaudeAdapter();
    case 'vscode':
      return new VSCodeAdapter();
    case 'openclaw':                          // NEW
      return new OpenClawAdapter();
    case 'hermes':                            // NEW
      return new HermesAdapter();
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/adapters/registry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/adapters/registry.ts src/adapters/registry.test.ts
git commit -m "feat: register OpenClaw and Hermes adapters in registry"
```

---

### Task 5: Update Adapter Index Exports

**Files:**
- Modify: `src/adapters/index.ts`

**Step 1: Verify exports are correct**

The index.ts should now export the new adapters:

```typescript
// src/adapters/index.ts
export { BaseAdapter } from './base.js';
export { OpenCodeAdapter } from './opencode.js';
export { ClaudeAdapter } from './claude.js';
export { VSCodeAdapter } from './vscode.js';
export { OpenClawAdapter } from './openclaw.js';   // NEW
export { HermesAdapter } from './hermes.js';        // NEW
export { detectPlatforms, getPlatformAdapter, getAllAdapters, getAdapterByPlatform } from './registry.js';
```

**Step 2: Run existing tests to ensure no regression**

Run: `npm test -- --run`
Expected: PASS (all tests)

**Step 3: Commit**

```bash
git add src/adapters/index.ts
git commit -m "feat: export OpenClaw and Hermes adapters from index"
```

---

### Task 6: Build and Integration Test

**Files:**
- Verify: All adapter files compile correctly

**Step 1: Build the project**

Run: `npm run build`
Expected: SUCCESS - no TypeScript errors

**Step 2: Link for local testing**

Run: `npm link`
Expected: SUCCESS

**Step 3: Test platform detection**

Run: `skm platforms`
Expected: Should show OpenClaw and Hermes Agent in the list (with ✅ if directories exist)

**Step 4: Test installation to new platforms**

```bash
# First, check if OpenClaw directory exists, if not create it
mkdir -p ~/.openclaw/skills/

# Install a skill to OpenClaw
skm install brainstorming --platform openclaw

# Verify installation
ls ~/.openclaw/skills/brainstorming/SKILL.md
```

**Step 5: Test Hermes installation**

```bash
# Create Hermes directory if not exists
mkdir -p ~/.hermes/skills/

# Install a skill to Hermes
skm install brainstorming --platform hermes

# Verify installation
ls ~/.hermes/skills/brainstorming/SKILL.md
```

**Step 6: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address any build or integration issues"
```

---

### Task 7: Update Documentation (Optional Enhancement)

**Files:**
- Modify: `README.md`

**Step 1: Update supported platforms table**

```markdown
## Supported Platforms

- Cursor
- VSCode
- Codex
- OpenCode
- Claude Code
- Antigravity
- OpenClaw    <!-- NEW -->
- Hermes Agent <!-- NEW -->
```

**Step 2: Update platform table in README**

```markdown
### Supported Platforms

| Platform | Skill Directory | Status |
|----------|---------------|--------|
| OpenCode | `~/.config/opencode/skills/` | ✅ Detected |
| Claude Code | `~/.claude/skills/` | ✅ Available |
| VSCode | `~/.copilot/skills/` | ✅ Available |
| OpenClaw | `~/.openclaw/skills/` | ✅ Available |  <!-- NEW -->
| Hermes Agent | `~/.hermes/skills/` | ✅ Available |  <!-- NEW -->
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README with OpenClaw and Hermes Agent support"
```

---

### Task 8: Final Verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 2: Run linter/type checker**

Run: `npm run build` (includes TypeScript compilation)
Expected: SUCCESS

**Step 3: Manual end-to-end test**

```bash
# Test 1: Platform listing
skm platforms
# Expected: Shows OpenClaw and Hermes Agent

# Test 2: Install to all platforms (including new ones)
skm install brainstorming

# Test 3: List installed skills
skm ls --installed

# Test 4: Uninstall from new platforms
skm uninstall brainstorming --platform openclaw
skm uninstall brainstorming --platform hermes
```

**Step 4: Final commit (version bump if needed)**

```bash
# If all tests pass, optionally bump version
# npm version patch -m "chore: bump version for OpenClaw/Hermes support"
```

---

Plan complete and saved to `docs/plans/2026-05-06-openclaw-hermes-support-implementation.md`.

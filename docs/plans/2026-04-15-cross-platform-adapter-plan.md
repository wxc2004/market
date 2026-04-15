# Cross-Platform Skill Adapter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to install skills to OpenCode, Claude Code, and VSCode platforms with a single `skm install` command.

**Architecture:** Create platform adapter classes that follow a common interface, detect available platforms automatically, and install skills to each platform's native skill directory.

**Tech Stack:** TypeScript, Node.js, fs-extra

---

## Task 1: Create Platform Adapter Base Class

**Files:**
- Create: `src/adapters/base.ts`
- Create: `src/adapters/index.ts`
- Modify: `src/types.ts`

**Step 1: Add PlatformAdapter type to types.ts**

Add to `src/types.ts`:

```typescript
/**
 * Platform adapter interface for cross-platform skill installation
 */
export interface PlatformAdapter {
  /** Unique platform identifier */
  readonly id: string;
  
  /** Human-readable platform name */
  readonly name: string;
  
  /** Platform's skill directory path */
  readonly skillDir: string;
  
  /** Check if this platform is available on the current system */
  isAvailable(): Promise<boolean>;
  
  /** Check if a skill is installed on this platform */
  isInstalled(skillId: string): Promise<boolean>;
  
  /** Install a skill to this platform */
  install(skillId: string, sourceDir: string): Promise<void>;
  
  /** Uninstall a skill from this platform */
  uninstall(skillId: string): Promise<void>;
  
  /** List all skills installed on this platform */
  listInstalled(): Promise<string[]>;
}
```

**Step 2: Create base adapter class**

Create `src/adapters/base.ts`:

```typescript
/**
 * =============================================================================
 * Base Platform Adapter
 * =============================================================================
 * 
 * Abstract base class for platform-specific skill adapters.
 * Provides common functionality for all platforms.
 */

import fs from 'fs-extra';
import path from 'path';
import type { PlatformAdapter } from '../types.js';

export abstract class BaseAdapter implements PlatformAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly skillDir: string;
  
  /**
   * Get the path where a specific skill should be installed
   */
  protected getSkillPath(skillId: string): string {
    return path.join(this.skillDir, skillId);
  }
  
  /**
   * Get the path to the SKILL.md file for a skill
   */
  protected getSkillFilePath(skillId: string): string {
    return path.join(this.getSkillPath(skillId), 'SKILL.md');
  }
  
  async isAvailable(): Promise<boolean> {
    // Check if skill directory is writable or can be created
    try {
      await fs.ensureDir(this.skillDir);
      return true;
    } catch {
      return false;
    }
  }
  
  async isInstalled(skillId: string): Promise<boolean> {
    const skillFile = this.getSkillFilePath(skillId);
    return fs.pathExists(skillFile);
  }
  
  async install(skillId: string, sourceDir: string): Promise<void> {
    const targetDir = this.getSkillPath(skillId);
    const targetFile = this.getSkillFilePath(skillId);
    
    // Ensure target directory exists
    await fs.ensureDir(targetDir);
    
    // Check if SKILL.md exists in source
    const sourceFile = path.join(sourceDir, 'SKILL.md');
    if (!(await fs.pathExists(sourceFile))) {
      throw new Error(`SKILL.md not found in ${sourceDir}`);
    }
    
    // Copy SKILL.md to target
    await fs.copy(sourceFile, targetFile, { overwrite: true });
  }
  
  async uninstall(skillId: string): Promise<void> {
    const targetDir = this.getSkillPath(skillId);
    if (await fs.pathExists(targetDir)) {
      await fs.remove(targetDir);
    }
  }
  
  async listInstalled(): Promise<string[]> {
    if (!(await fs.pathExists(this.skillDir))) {
      return [];
    }
    
    const entries = await fs.readdir(this.skillDir, { withFileTypes: true });
    const skills: string[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFile = path.join(this.skillDir, entry.name, 'SKILL.md');
        if (await fs.pathExists(skillFile)) {
          skills.push(entry.name);
        }
      }
    }
    
    return skills;
  }
}
```

**Step 3: Create index file**

Create `src/adapters/index.ts`:

```typescript
/**
 * Platform adapters index
 */

export { BaseAdapter } from './base.js';
export { OpenCodeAdapter } from './opencode.js';
export { ClaudeAdapter } from './claude.js';
export { VSCodeAdapter } from './vscode.js';
export { detectPlatforms, getPlatformAdapter } from './registry.js';
```

**Step 4: Commit**

```bash
git add src/adapters/base.ts src/adapters/index.ts src/types.ts
git commit -m "feat: add base platform adapter class"
```

---

## Task 2: Create OpenCode Adapter

**Files:**
- Create: `src/adapters/opencode.ts`

**Step 1: Create OpenCode adapter**

Create `src/adapters/opencode.ts`:

```typescript
/**
 * =============================================================================
 * OpenCode Platform Adapter
 * =============================================================================
 * 
 * Handles skill installation for OpenCode AI coding tool.
 * Skills are installed to ~/.config/opencode/skills/<skill-id>/
 */

import path from 'path';
import os from 'os';
import { BaseAdapter } from './base.js';

export class OpenCodeAdapter extends BaseAdapter {
  readonly id = 'opencode';
  readonly name = 'OpenCode';
  
  get skillDir(): string {
    // Respect OPENCODE_CONFIG_DIR environment variable
    const configDir = process.env.OPENCODE_CONFIG_DIR 
      || path.join(os.homedir(), '.config', 'opencode');
    return path.join(configDir, 'skills');
  }
  
  async isAvailable(): Promise<boolean> {
    // Check for environment variable or directory
    if (process.env.OPENCODE) return true;
    
    const configDir = process.env.OPENCODE_CONFIG_DIR 
      || path.join(os.homedir(), '.config', 'opencode');
    
    try {
      await fs.ensureDir(path.join(configDir, 'skills'));
      return true;
    } catch {
      return false;
    }
  }
}

import fs from 'fs-extra';
```

**Step 2: Commit**

```bash
git add src/adapters/opencode.ts
git commit -m "feat: add OpenCode platform adapter"
```

---

## Task 3: Create Claude Code Adapter

**Files:**
- Create: `src/adapters/claude.ts`

**Step 1: Create Claude adapter**

Create `src/adapters/claude.ts`:

```typescript
/**
 * =============================================================================
 * Claude Code Platform Adapter
 * =============================================================================
 * 
 * Handles skill installation for Claude Code CLI.
 * Skills are installed to ~/.claude/skills/<skill-id>/
 */

import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { BaseAdapter } from './base.js';

export class ClaudeAdapter extends BaseAdapter {
  readonly id = 'claude';
  readonly name = 'Claude Code';
  
  get skillDir(): string {
    return path.join(os.homedir(), '.claude', 'skills');
  }
  
  async isAvailable(): Promise<boolean> {
    // Check for environment variable or directory
    if (process.env.CLAUDE_CODE) return true;
    
    // Check if .claude directory exists
    const claudeDir = path.join(os.homedir(), '.claude');
    return fs.pathExists(claudeDir);
  }
}
```

**Step 2: Commit**

```bash
git add src/adapters/claude.ts
git commit -m "feat: add Claude Code platform adapter"
```

---

## Task 4: Create VSCode Adapter

**Files:**
- Create: `src/adapters/vscode.ts`

**Step 1: Create VSCode adapter**

Create `src/adapters/vscode.ts`:

```typescript
/**
 * =============================================================================
 * VSCode (Copilot) Platform Adapter
 * =============================================================================
 * 
 * Handles skill installation for VSCode GitHub Copilot Agent Skills.
 * Skills are installed to ~/.copilot/skills/<skill-id>/
 * 
 * Note: Also supports ~/.claude/skills/ for cross-compatibility.
 */

import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { BaseAdapter } from './base.js';

export class VSCodeAdapter extends BaseAdapter {
  readonly id = 'vscode';
  readonly name = 'VSCode';
  
  get skillDir(): string {
    // Try ~/.copilot/skills first, fallback to ~/.claude/skills
    return path.join(os.homedir(), '.copilot', 'skills');
  }
  
  async isAvailable(): Promise<boolean> {
    // Check multiple possible locations
    const possibleDirs = [
      path.join(os.homedir(), '.copilot', 'skills'),
      path.join(os.homedir(), '.claude', 'skills'),
    ];
    
    for (const dir of possibleDirs) {
      try {
        await fs.ensureDir(dir);
        return true;
      } catch {
        continue;
      }
    }
    
    return false;
  }
  
  async install(skillId: string, sourceDir: string): Promise<void> {
    // Install to ~/.copilot/skills, but also create symlink in ~/.claude/skills
    await super.install(skillId, sourceDir);
    
    // Create cross-compatible symlink in ~/.claude/skills
    const claudeSkillDir = path.join(os.homedir(), '.claude', 'skills');
    const targetPath = this.getSkillPath(skillId);
    const claudeTargetPath = path.join(claudeSkillDir, skillId);
    
    try {
      await fs.ensureDir(claudeSkillDir);
      await fs.remove(claudeTargetPath);
      await fs.symlink(targetPath, claudeTargetPath, 'junction');
    } catch {
      // Silently fail if symlink not possible (cross-platform compatibility)
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/adapters/vscode.ts
git commit -m "feat: add VSCode platform adapter"
```

---

## Task 5: Create Platform Registry

**Files:**
- Create: `src/adapters/registry.ts`

**Step 1: Create platform registry**

Create `src/adapters/registry.ts`:

```typescript
/**
 * =============================================================================
 * Platform Registry
 * =============================================================================
 * 
 * Central registry for platform adapters.
 * Handles platform detection and selection.
 */

import { OpenCodeAdapter } from './opencode.js';
import { ClaudeAdapter } from './claude.js';
import { VSCodeAdapter } from './vscode.js';
import type { PlatformAdapter } from '../types.js';
import type { Platform } from '../constants.js';

const adapters: Map<string, PlatformAdapter> = new Map();

/**
 * Register all built-in platform adapters
 */
function registerAdapters(): void {
  const opencode = new OpenCodeAdapter();
  const claude = new ClaudeAdapter();
  const vscode = new VSCodeAdapter();
  
  adapters.set(opencode.id, opencode);
  adapters.set(claude.id, claude);
  adapters.set(vscode.id, vscode);
}

// Register adapters on module load
registerAdapters();

/**
 * Detect which platforms are available on the current system
 */
export async function detectPlatforms(): Promise<PlatformAdapter[]> {
  const available: PlatformAdapter[] = [];
  
  for (const adapter of adapters.values()) {
    if (await adapter.isAvailable()) {
      available.push(adapter);
    }
  }
  
  return available;
}

/**
 * Get adapter for a specific platform
 */
export function getPlatformAdapter(platformId: string): PlatformAdapter | undefined {
  return adapters.get(platformId);
}

/**
 * Get all registered adapters
 */
export function getAllAdapters(): PlatformAdapter[] {
  return Array.from(adapters.values());
}

/**
 * Get adapter by platform type
 */
export function getAdapterByPlatform(platform: Platform): PlatformAdapter | undefined {
  const idMap: Record<Platform, string> = {
    opencode: 'opencode',
    claude: 'claude',
    vscode: 'vscode',
    cursor: 'opencode',  // Cursor uses OpenCode-compatible structure
    codex: 'opencode',  // Codex uses OpenCode-compatible structure
    antigravity: 'opencode',  // Antigravity uses OpenCode-compatible structure
  };
  
  return adapters.get(idMap[platform]);
}
```

**Step 2: Commit**

```bash
git add src/adapters/registry.ts
git commit -m "feat: add platform registry and detection"
```

---

## Task 6: Update Install Command

**Files:**
- Modify: `src/commands/install.ts`

**Step 1: Update install command with platform support**

Modify `src/commands/install.ts`, add these imports and functions:

```typescript
// Add to imports
import { detectPlatforms, getAdapterByPlatform } from '../adapters/index.js';
import type { PlatformAdapter } from '../types.js';
import type { Platform } from '../constants.js';

// Add platform option parsing to installSkill function
export async function installSkill(
  skillId: string,
  version?: string,
  options?: {
    platforms?: string[];
    force?: boolean;
  }
): Promise<void> {
  // ... existing code until step 3 ...
  
  // ==========================================================================
  // Step 4 (NEW): Determine target platforms
  // ==========================================================================
  
  let targetAdapters: PlatformAdapter[] = [];
  
  if (options?.platforms && options.platforms.length > 0) {
    // User specified platforms
    for (const platformStr of options.platforms) {
      const platform = platformStr as Platform;
      const adapter = getAdapterByPlatform(platform);
      if (adapter) {
        targetAdapters.push(adapter);
      } else {
        console.warn(`⚠️  Unknown platform: ${platformStr}`);
      }
    }
  } else {
    // Auto-detect available platforms
    targetAdapters = await detectPlatforms();
  }
  
  if (targetAdapters.length === 0) {
    console.log('No target platforms found.');
    console.log('Use --platform to specify platforms manually.');
    return;
  }
  
  console.log(`\nInstalling to ${targetAdapters.length} platform(s)...\n`);
  
  // ==========================================================================
  // Step 5 (NEW): Install to each platform
  // ==========================================================================
  
  const results: { adapter: PlatformAdapter; status: 'installed' | 'skipped' | 'failed'; error?: string }[] = [];
  
  for (const adapter of targetAdapters) {
    try {
      const isInstalled = await adapter.isInstalled(skillId);
      
      if (isInstalled && !options?.force) {
        console.log(`${adapter.name}   ⚠️  Already installed (use --force to overwrite)`);
        results.push({ adapter, status: 'skipped' });
        continue;
      }
      
      // Install skill
      await adapter.install(skillId, skillVersionDir);
      console.log(`${adapter.name}   ✅  Installed successfully`);
      results.push({ adapter, status: 'installed' });
    } catch (error) {
      console.log(`${adapter.name}   ❌  Failed: ${error}`);
      results.push({ adapter, status: 'failed', error: String(error) });
    }
  }
  
  // ==========================================================================
  // Step 6 (NEW): Display summary
  // ==========================================================================
  
  const installed = results.filter(r => r.status === 'installed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`\n📊 Summary: ${installed} installed, ${skipped} skipped, ${failed} failed`);
}
```

**Step 2: Commit**

```bash
git add src/commands/install.ts
git commit -m "feat: add platform support to install command"
```

---

## Task 7: Update CLI Parser

**Files:**
- Modify: `src/cli.ts`

**Step 1: Update CLI to parse --platform flag**

Modify `src/cli.ts`, update the install command handler:

```typescript
// In the install command section, update the handler:

.command('install <skill>')
.description('Install a skill to local and/or platform directories')
.option('-p, --platform <platforms>', 'Target platforms (comma-separated: opencode,claude,vscode)')
.option('-f, --force', 'Overwrite if already installed')
.option('-v, --version <version>', 'Specific version to install')
.action(async (skill, options) => {
  const platforms = options.platform 
    ? options.platform.split(',').map(p => p.trim())
    : undefined;
  
  await installSkill(skill, options.version, {
    platforms,
    force: options.force
  });
});

// Also add new platforms command
.command('platforms', 'Show available platforms')
.action(async () => {
  const { detectPlatforms } = await import('./adapters/index.js');
  const adapters = await detectPlatforms();
  
  console.log('\n📍 Available Platforms:\n');
  
  const { OpenCodeAdapter, ClaudeAdapter, VSCodeAdapter } = await import('./adapters/index.js');
  
  const allPlatforms = [
    { name: 'OpenCode', adapter: new OpenCodeAdapter() },
    { name: 'Claude Code', adapter: new ClaudeAdapter() },
    { name: 'VSCode', adapter: new VSCodeAdapter() },
  ];
  
  for (const { name, adapter } of allPlatforms) {
    const available = adapters.find(a => a.id === adapter.id);
    const installed = await adapter.listInstalled();
    
    if (available) {
      console.log(`${name.padEnd(12)} ✅  Available (${installed.length} skills installed)`);
    } else {
      console.log(`${name.padEnd(12)} ❌  Not detected`);
    }
  }
  
  console.log('');
});
```

**Step 2: Commit**

```bash
git add src/cli.ts
git commit -m "feat: add --platform flag and platforms command"
```

---

## Task 8: Update Uninstall Command

**Files:**
- Modify: `src/commands/uninstall.ts`

**Step 1: Update uninstall to support platforms**

Modify `src/commands/uninstall.ts`:

```typescript
// Add platform support to uninstall

import { detectPlatforms, getAdapterByPlatform } from '../adapters/index.js';
import type { Platform } from '../constants.js';

export async function uninstallSkill(
  skillId: string,
  options?: {
    platforms?: string[];
  }
): Promise<void> {
  // ... existing registry code ...
  
  let targetAdapters = options?.platforms
    ? options.platforms.map(p => getAdapterByPlatform(p as Platform)).filter(Boolean)
    : await detectPlatforms();
  
  console.log(`\nUninstalling from ${targetAdapters.length} platform(s)...\n`);
  
  for (const adapter of targetAdapters) {
    if (!adapter) continue;
    
    try {
      await adapter.uninstall(skillId);
      console.log(`${adapter.name}   ✅  Uninstalled`);
    } catch (error) {
      console.log(`${adapter.name}   ❌  Failed: ${error}`);
    }
  }
  
  // ... rest of existing code ...
}
```

**Step 2: Update CLI to pass platform option**

Update `src/cli.ts` uninstall handler to pass platforms:

```typescript
.option('-p, --platform <platforms>', 'Target platforms (comma-separated)')
.action(async (skill, options) => {
  const platforms = options.platform 
    ? options.platform.split(',').map(p => p.trim())
    : undefined;
  
  await uninstallSkill(skill, { platforms });
});
```

**Step 3: Commit**

```bash
git add src/commands/uninstall.ts src/cli.ts
git commit -m "feat: add platform support to uninstall command"
```

---

## Task 9: Build and Test

**Step 1: Build the project**

```bash
npm run build
```

**Step 2: Test platform detection**

```bash
npx skillmarket platforms
```

Expected output:
```
📍 Available Platforms:

OpenCode     ✅  Available (X skills installed)
Claude Code  ✅/❌  Available/Not detected
VSCode       ✅/❌  Available/Not detected
```

**Step 3: Test install with platform flag**

```bash
# Test install to specific platform
npx skillmarket install test-skill --platform opencode

# Test install to all platforms
npx skillmarket install test-skill
```

**Step 4: Test uninstall**

```bash
npx skillmarket uninstall test-skill --platform opencode
```

---

## Task 10: Update Documentation

**Files:**
- Modify: `README.md`
- Create: `docs/CROSS-PLATFORM.md`

**Step 1: Update README with new commands**

Add to README.md:

```markdown
## Cross-Platform Installation

Install skills to multiple AI coding platforms with one command:

```bash
# Install to all detected platforms
skm install brainstorming

# Install to specific platform
skm install brainstorming --platform opencode

# Install to multiple platforms
skm install brainstorming --platform opencode,claude,vscode

# Show available platforms
skm platforms
```
```

**Step 2: Create cross-platform guide**

Create `docs/CROSS-PLATFORM.md` with detailed documentation.

**Step 3: Commit**

```bash
git add README.md docs/CROSS-PLATFORM.md
git commit -m "docs: add cross-platform installation guide"
```

---

## Task 11: Final Verification and Push

**Step 1: Run full build**

```bash
npm run build && npm run test
```

**Step 2: Check git status**

```bash
git status
```

**Step 3: Push to GitHub**

```bash
git push
```

---

## Summary of Changes

| Task | Files | Description |
|------|-------|-------------|
| 1 | `src/adapters/base.ts`, `src/types.ts` | Base adapter class |
| 2 | `src/adapters/opencode.ts` | OpenCode adapter |
| 3 | `src/adapters/claude.ts` | Claude Code adapter |
| 4 | `src/adapters/vscode.ts` | VSCode adapter |
| 5 | `src/adapters/registry.ts`, `src/adapters/index.ts` | Registry and detection |
| 6 | `src/commands/install.ts` | Enhanced install with platform support |
| 7 | `src/cli.ts` | CLI parser updates |
| 8 | `src/commands/uninstall.ts` | Enhanced uninstall with platform support |
| 9 | - | Build and test |
| 10 | `README.md`, `docs/CROSS-PLATFORM.md` | Documentation |

**Total: ~11 tasks, estimated 2-3 hours**

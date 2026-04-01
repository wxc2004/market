# SkillMarket Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers/subagent-driven-development to implement this plan task-by-task.

**Goal:** 创建跨平台 npm CLI 工具 `skillmarket`，用于管理 AI 编程工具的 skills。

**Architecture:** 
- TypeScript + tsup 构建
- Commander.js CLI 框架
- 统一的 skill 目录结构 + 平台软链接适配
- npm registry 缓存本地管理

**Tech Stack:** TypeScript, tsup, commander, fs-extra, semver

---

## Task 1: 项目初始化 (M1)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `src/index.ts` (入口)
- Create: `src/cli.ts` (CLI 入口)
- Create: `src/commands/help.ts`

**Step 1: 创建 package.json**

```json
{
  "name": "skillmarket",
  "version": "1.0.0",
  "description": "Cross-platform skill manager for AI coding tools",
  "type": "module",
  "bin": {
    "skm": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.4",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  }
}
```

**Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

**Step 3: 创建 tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  shims: true
});
```

**Step 4: 创建 src/index.ts**

```typescript
#!/usr/bin/env node
import './cli.js';
```

**Step 5: 创建 src/cli.ts**

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('skm')
  .description('SkillMarket - Cross-platform skill manager')
  .version('1.0.0');

program.parse();
```

**Step 6: 提交**

```bash
git add package.json tsconfig.json tsup.config.ts src/
git commit -m "chore: project initialization with TypeScript and tsup"
```

---

## Task 2: 目录结构和常量定义 (M1)

**Files:**
- Create: `src/constants.ts`
- Create: `src/types.ts`
- Create: `src/utils/dirs.ts`

**Step 1: 创建 src/constants.ts**

```typescript
export const MARKET_DIR = 'skillmarket';

export const SUBDIRS = {
  CACHE: 'cache',
  SKILLS: 'skills',
  PLATFORM_LINKS: 'platform-links'
} as const;

export const PLATFORMS = [
  'cursor',
  'vscode',
  'codex',
  'opencode',
  'claude',
  'antigravity'
] as const;

export const REGISTRY_FILE = 'registry.json';
export const LATEST_LINK = 'latest';
```

**Step 2: 创建 src/types.ts**

```typescript
export interface SkillMetadata {
  id: string;
  displayName: string;
  description: string;
  platforms: string[];
  defaultVersion: string;
}

export interface InstalledSkill {
  id: string;
  version: string;
  installedAt: string;
  platforms: string[];
}

export interface RegistryData {
  skills: Record<string, InstalledSkill>;
  lastUpdated: string;
}
```

**Step 3: 创建 src/utils/dirs.ts**

```typescript
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { MARKET_DIR, SUBDIRS, REGISTRY_FILE } from '../constants.js';

export function getMarketHome(): string {
  return path.join(os.homedir(), '.skillmarket');
}

export function getCacheDir(): string {
  return path.join(getMarketHome(), SUBDIRS.CACHE);
}

export function getSkillsDir(): string {
  return path.join(getMarketHome(), SUBDIRS.SKILLS);
}

export function getPlatformLinksDir(): string {
  return path.join(getMarketHome(), SUBDIRS.PLATFORM_LINKS);
}

export function getRegistryPath(): string {
  return path.join(getMarketHome(), REGISTRY_FILE);
}

export async function ensureMarketDirs(): Promise<void> {
  await fs.ensureDir(getCacheDir());
  await fs.ensureDir(getSkillsDir());
  await fs.ensureDir(getPlatformLinksDir());
}
```

**Step 4: 提交**

```bash
git add src/constants.ts src/types.ts src/utils/dirs.ts
git commit -m "feat: add directory structure and types"
```

---

## Task 3: --help 命令实现 (M1)

**Files:**
- Modify: `src/cli.ts`

**Step 1: 更新 src/cli.ts**

```typescript
import { Command } from 'commander';
import { PLATFORMS } from './constants.js';

const program = new Command();

program
  .name('skm')
  .description('SkillMarket - Cross-platform skill manager for AI coding tools')
  .version('1.0.0');

// Display help with commands
program
  .option('-h, --help', 'Display help information')
  .action(() => {
    console.log(`
SkillMarket CLI

Usage: skm <command> [options]

Commands:
  --help, -h          Display this help message
  --ls [options]     List available skills
                       --installed    Show only installed skills
                       --updates      Check for updates
  --info <skill-id>   Display skill information
  --install <skill>   Install a skill (e.g., skm --install brainstorming)
                       @version      Install specific version
                       --all         Install all available skills
  --uninstall <skill> Remove an installed skill
  --update [options]  Update skills
                       --all          Update all skills
  --sync              Synchronize platform links
  --platform <name>   Set target platform (${PLATFORMS.join(', ')})

Examples:
  skm --ls                    List all available skills
  skm --ls --installed        Show installed skills only
  skm --info brainstorming     View skill details
  skm --install brainstorming Install a skill
  skm --install brainstorming@1.0.0 Install specific version
  skm --update --all           Update all installed skills
    `);
  });

program.parse();
```

**Step 2: 提交**

```bash
git add src/cli.ts
git commit -m "feat: add help command with usage examples"
```

---

## Task 4: --ls 命令基础实现 (M2)

**Files:**
- Create: `src/commands/ls.ts`
- Create: `src/commands/registry.ts`

**Step 1: 创建 src/commands/registry.ts**

```typescript
import fs from 'fs-extra';
import path from 'path';
import { getRegistryPath, getMarketHome } from '../utils/dirs.js';
import type { RegistryData, InstalledSkill } from '../types.js';

const DEFAULT_REGISTRY: RegistryData = {
  skills: {},
  lastUpdated: new Date().toISOString()
};

export async function loadRegistry(): Promise<RegistryData> {
  const registryPath = getRegistryPath();
  
  if (!(await fs.pathExists(registryPath))) {
    return DEFAULT_REGISTRY;
  }
  
  try {
    const data = await fs.readJson(registryPath);
    return data as RegistryData;
  } catch {
    return DEFAULT_REGISTRY;
  }
}

export async function saveRegistry(registry: RegistryData): Promise<void> {
  await fs.ensureDir(getMarketHome());
  registry.lastUpdated = new Date().toISOString();
  await fs.writeJson(getRegistryPath(), registry, { spaces: 2 });
}

export async function getInstalledSkills(): Promise<InstalledSkill[]> {
  const registry = await loadRegistry();
  return Object.values(registry.skills);
}

export async function isSkillInstalled(skillId: string): Promise<boolean> {
  const registry = await loadRegistry();
  return skillId in registry.skills;
}
```

**Step 2: 创建 src/commands/ls.ts**

```typescript
import { loadRegistry, getInstalledSkills } from './registry.js';

interface LsOptions {
  installed?: boolean;
  updates?: boolean;
}

export async function listSkills(options: LsOptions): Promise<void> {
  const { installed, updates } = options;
  
  if (installed) {
    const skills = await getInstalledSkills();
    
    if (skills.length === 0) {
      console.log('No skills installed yet. Run "skm --ls" to see available skills.');
      return;
    }
    
    console.log('Installed Skills:\n');
    for (const skill of skills) {
      console.log(`  ${skill.id}@${skill.version}`);
      console.log(`    Platforms: ${skill.platforms.join(', ')}`);
      console.log(`    Installed: ${skill.installedAt}`);
      console.log();
    }
    return;
  }
  
  // TODO: Query npm registry for available skills
  console.log('Available Skills (from npm registry):\n');
  console.log('  Loading...');
  
  // Placeholder - will be implemented in M2
}
```

**Step 3: 更新 src/cli.ts 集成 --ls 命令**

```typescript
import { listSkills } from './commands/ls.js';

// In program definition, add:
program
  .option('-ls, --ls', 'List available skills')
  .option('--installed', 'Show only installed skills')
  .option('--updates', 'Check for updates')
  .action((opts) => {
    listSkills(opts);
  });
```

**Step 4: 提交**

```bash
git add src/commands/ls.ts src/commands/registry.ts src/cli.ts
git commit -m "feat: add --ls command with registry support"
```

---

## Task 5: npm registry 查询 (M2)

**Files:**
- Create: `src/commands/npm.ts`

**Step 1: 创建 src/commands/npm.ts**

```typescript
import https from 'https';
import { URL } from 'url';

interface NpmPackage {
  name: string;
  version: string;
  description?: string;
}

interface NpmRegistryResponse {
  name: string;
  versions: Record<string, NpmPackage>;
  'dist-tags': Record<string, string>;
}

export async function fetchNpmPackage(packageName: string): Promise<NpmRegistryResponse | null> {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://registry.npmjs.org/${packageName}`);
    
    https.get(url.toString(), { timeout: 10000 }, (res) => {
      let data = '';
      
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

export async function searchSkillmarketPackages(): Promise<string[]> {
  const packages: string[] = [];
  
  // Search for @skillmarket/* packages
  return new Promise((resolve, reject) => {
    const url = new URL('https://registry.npmjs.org/-/v1/search');
    url.searchParams.set('text', 'keywords:skillmarket');
    url.searchParams.set('size', '100');
    
    https.get(url.toString(), { timeout: 10000 }, (res) => {
      let data = '';
      
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          for (const pkg of result.objects || []) {
            packages.push(pkg.package.name);
          }
          resolve(packages);
        } catch {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}
```

**Step 2: 更新 ls.ts 使用 npm 查询**

```typescript
import { searchSkillmarketPackages, fetchNpmPackage } from './npm.js';

export async function listSkills(options: LsOptions): Promise<void> {
  const { installed } = options;
  
  if (installed) {
    // Show installed skills
    const skills = await getInstalledSkills();
    // ... existing code
  } else {
    // Show available skills from npm
    console.log('Searching npm registry...\n');
    const packages = await searchSkillmarketPackages();
    
    if (packages.length === 0) {
      console.log('No skills found. Check back later!');
      return;
    }
    
    console.log(`Found ${packages.length} skill(s):\n`);
    
    for (const pkgName of packages) {
      const info = await fetchNpmPackage(pkgName);
      if (info) {
        const latestVersion = info['dist-tags']?.latest;
        console.log(`  ${info.name}@${latestVersion}`);
        console.log(`    ${info.description || 'No description'}`);
        console.log();
      }
    }
  }
}
```

**Step 3: 提交**

```bash
git add src/commands/npm.ts src/commands/ls.ts
git commit -m "feat: add npm registry query support"
```

---

## Task 6: --info 命令实现 (M2)

**Files:**
- Create: `src/commands/info.ts`

**Step 1: 创建 src/commands/info.ts**

```typescript
import { fetchNpmPackage } from './npm.js';
import { isSkillInstalled, getInstalledSkills } from './registry.js';

export async function showSkillInfo(skillId: string): Promise<void> {
  // Try @skillmarket/<skillId> first, then bare name
  const packageName = skillId.startsWith('@') 
    ? skillId 
    : `@skillmarket/${skillId}`;
  
  console.log(`Fetching info for: ${packageName}\n`);
  
  const info = await fetchNpmPackage(packageName);
  
  if (!info) {
    console.log(`Skill "${skillId}" not found in npm registry.`);
    return;
  }
  
  const latestVersion = info['dist-tags']?.latest;
  const pkg = info.versions[latestVersion];
  
  // Check installation status
  const installed = await isSkillInstalled(skillId);
  const installedSkills = await getInstalledSkills();
  const installedSkill = installedSkills.find(s => s.id === skillId);
  
  console.log(`=== ${info.name} ===`);
  console.log(`Version: ${latestVersion}${installedSkill ? ` (installed: ${installedSkill.version})` : ''}`);
  console.log(`Description: ${pkg.description || 'N/A'}\n`);
  
  // Show skillmarket metadata if available
  const skillmarketMeta = (pkg as any).skillmarket;
  if (skillmarketMeta) {
    console.log(`Platforms: ${skillmarketMeta.platforms?.join(', ') || 'N/A'}`);
    console.log(`Default Version: ${skillmarketMeta.defaultVersion || 'N/A'}\n`);
  }
  
  // Show available versions
  const versions = Object.keys(info.versions).slice(-10); // Last 10
  console.log(`Recent versions: ${versions.join(', ')}`);
  
  if (installed) {
    console.log(`\nStatus: Installed (use skm --update ${skillId} to update)`);
  } else {
    console.log(`\nStatus: Not installed (use skm --install ${skillId} to install)`);
  }
}
```

**Step 2: 更新 cli.ts**

```typescript
import { showSkillInfo } from './commands/info.js';

// Add command:
program
  .argument('<skill-id>', 'Skill ID to show info')
  .action((skillId) => {
    showSkillInfo(skillId);
  });
```

**Step 3: 提交**

```bash
git add src/commands/info.ts src/cli.ts
git commit -m "feat: add --info command for skill details"
```

---

## Task 7: --install 命令基础实现 (M3)

**Files:**
- Create: `src/commands/install.ts`
- Create: `src/utils/platform.ts`

**Step 1: 创建 src/utils/platform.ts**

```typescript
import { PLATFORMS } from '../constants.js';

export type Platform = typeof PLATFORMS[number];

export function detectPlatform(): Platform {
  if (process.env.OPENCODE) return 'opencode';
  if (process.env.CURSOR) return 'cursor';
  if (process.env.VSCODE) return 'vscode';
  if (process.env.CLAUDE_CODE) return 'claude';
  if (process.env.ANTIGRAVITY) return 'antigravity';
  return 'codex'; // Default fallback
}

export function isValidPlatform(name: string): name is Platform {
  return PLATFORMS.includes(name as Platform);
}

export function getPlatformFromInput(name: string): Platform | null {
  return isValidPlatform(name.toLowerCase()) ? name.toLowerCase() as Platform : null;
}
```

**Step 2: 创建 src/commands/install.ts**

```typescript
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fetchNpmPackage } from './npm.js';
import { loadRegistry, saveRegistry } from './registry.js';
import { getCacheDir, getSkillsDir, ensureMarketDirs } from '../utils/dirs.js';
import { detectPlatform } from '../utils/platform.js';
import { LATEST_LINK } from '../constants.js';
import type { InstalledSkill } from '../types.js';

const execAsync = promisify(exec);

export async function installSkill(
  skillId: string, 
  version?: string
): Promise<void> {
  await ensureMarketDirs();
  
  const packageName = skillId.startsWith('@') 
    ? skillId 
    : `@skillmarket/${skillId}`;
  
  console.log(`Installing ${packageName}${version ? `@${version}` : ''}...`);
  
  // 1. Fetch package info
  const pkgInfo = await fetchNpmPackage(packageName);
  if (!pkgInfo) {
    throw new Error(`Package ${packageName} not found`);
  }
  
  const targetVersion = version || pkgInfo['dist-tags'].latest;
  
  // 2. Download package via npm pack
  const cacheDir = getCacheDir();
  const targetDir = path.join(cacheDir, `${packageName}@${targetVersion}`);
  
  if (!(await fs.pathExists(targetDir))) {
    console.log('Downloading package...');
    await fs.ensureDir(cacheDir);
    
    try {
      await execAsync(`npm pack ${packageName}@${targetVersion} --pack-destination ${cacheDir}`);
      
      // Find and extract the tarball
      const tarball = (await fs.readdir(cacheDir))
        .find(f => f.endsWith('.tgz') && f.includes(packageName.replace('/', '-')));
      
      if (tarball) {
        await execAsync(`tar -xzf ${path.join(cacheDir, tarball)} -C ${cacheDir}`);
        await fs.remove(path.join(cacheDir, tarball));
        
        // Rename extracted folder
        const extractedDir = path.join(cacheDir, 'package');
        const finalDir = targetDir;
        await fs.move(extractedDir, finalDir, { overwrite: true });
      }
    } catch (err) {
      throw new Error(`Failed to download package: ${err}`);
    }
  }
  
  // 3. Extract platform-specific files
  const skillsDir = getSkillsDir();
  const skillVersionDir = path.join(skillsDir, `${skillId}@${targetVersion}`);
  
  console.log('Setting up skill...');
  await fs.ensureDir(skillVersionDir);
  
  // Copy SKILL.md and metadata if they exist
  const pkgRoot = targetDir;
  
  if (await fs.pathExists(path.join(pkgRoot, 'SKILL.md'))) {
    await fs.copy(path.join(pkgRoot, 'SKILL.md'), path.join(skillVersionDir, 'SKILL.md'));
  }
  
  if (await fs.pathExists(path.join(pkgRoot, 'metadata.json'))) {
    await fs.copy(path.join(pkgRoot, 'metadata.json'), path.join(skillVersionDir, 'metadata.json'));
  }
  
  // 4. Create latest symlink
  const latestLink = path.join(skillsDir, skillId, LATEST_LINK);
  await fs.ensureSymlink(skillVersionDir, latestLink, 'junction');
  
  // 5. Update registry
  const registry = await loadRegistry();
  const platforms = detectPlatform(); // For now, just current platform
  
  registry.skills[skillId] = {
    id: skillId,
    version: targetVersion,
    installedAt: new Date().toISOString(),
    platforms: [platforms]
  } as InstalledSkill;
  
  await saveRegistry(registry);
  
  console.log(`\n✅ ${skillId}@${targetVersion} installed successfully!`);
  console.log(`   Use "skm --info ${skillId}" for more details`);
}
```

**Step 3: 更新 cli.ts**

```typescript
import { installSkill } from './commands/install.js';

// Add command:
program
  .command('install <skill>')
  .description('Install a skill')
  .option('--all', 'Install all available skills')
  .action(async (skill, options) => {
    try {
      await installSkill(skill);
    } catch (err) {
      console.error('Installation failed:', err);
      process.exit(1);
    }
  });
```

**Step 4: 提交**

```bash
git add src/commands/install.ts src/utils/platform.ts src/cli.ts
git commit -m "feat: add --install command with npm download"
```

---

## Task 8: 软链接策略实现 (M3)

**Files:**
- Create: `src/commands/sync.ts`

**Step 1: 创建 src/commands/sync.ts**

```typescript
import fs from 'fs-extra';
import path from 'path';
import { 
  getSkillsDir, 
  getPlatformLinksDir, 
  ensureMarketDirs 
} from '../utils/dirs.js';
import { loadRegistry } from './registry.js';
import { PLATFORMS, LATEST_LINK } from '../constants.js';

export async function syncPlatformLinks(): Promise<void> {
  await ensureMarketDirs();
  
  const skillsDir = getSkillsDir();
  const platformLinksDir = getPlatformLinksDir();
  const registry = await loadRegistry();
  
  console.log('Syncing platform links...\n');
  
  // For each platform
  for (const platform of PLATFORMS) {
    const platformDir = path.join(platformLinksDir, platform, 'skills');
    await fs.ensureDir(platformDir);
    
    // For each installed skill
    for (const [skillId, skillInfo] of Object.entries(registry.skills)) {
      const skillLatestLink = path.join(skillsDir, skillId, LATEST_LINK);
      const platformSkillDir = path.join(platformDir, skillId);
      
      if (await fs.pathExists(skillLatestLink)) {
        // Create link to platform-specific version inside the skill
        const targetPlatformDir = path.join(skillLatestLink, platform);
        
        if (await fs.pathExists(targetPlatformDir)) {
          await fs.ensureSymlink(targetPlatformDir, platformSkillDir, 'junction');
          console.log(`  Linked: ${platform}/${skillId}`);
        }
      }
    }
  }
  
  console.log('\n✅ Sync complete!');
}
```

**Step 2: 更新 cli.ts 添加 --sync**

```typescript
import { syncPlatformLinks } from './commands/sync.js';

program
  .command('sync')
  .description('Synchronize platform links')
  .action(async () => {
    try {
      await syncPlatformLinks();
    } catch (err) {
      console.error('Sync failed:', err);
      process.exit(1);
    }
  });
```

**Step 3: 提交**

```bash
git add src/commands/sync.ts src/cli.ts
git commit -m "feat: add --sync for platform link management"
```

---

## Task 9: --update 和 --uninstall 实现 (M4)

**Files:**
- Modify: `src/commands/install.ts`
- Create: `src/commands/update.ts`
- Create: `src/commands/uninstall.ts`

**Step 1: 创建 src/commands/update.ts**

```typescript
import { installSkill } from './install.js';
import { getInstalledSkills, loadRegistry } from './registry.js';
import { fetchNpmPackage } from './npm.js';

export async function updateSkill(skillId?: string): Promise<void> {
  if (skillId) {
    // Update specific skill
    const pkgInfo = await fetchNpmPackage(`@skillmarket/${skillId}`);
    if (pkgInfo) {
      const latestVersion = pkgInfo['dist-tags'].latest;
      console.log(`Updating ${skillId} to ${latestVersion}...`);
      await installSkill(skillId, latestVersion);
    }
    return;
  }
  
  // Update all skills
  const installed = await getInstalledSkills();
  
  if (installed.length === 0) {
    console.log('No skills installed to update.');
    return;
  }
  
  console.log(`Checking updates for ${installed.length} skill(s)...\n`);
  
  let hasUpdates = false;
  
  for (const skill of installed) {
    const pkgInfo = await fetchNpmPackage(`@skillmarket/${skill.id}`);
    if (pkgInfo) {
      const latestVersion = pkgInfo['dist-tags'].latest;
      
      if (latestVersion !== skill.version) {
        console.log(`  ${skill.id}: ${skill.version} → ${latestVersion} [UPDATE]`);
        hasUpdates = true;
        
        try {
          await installSkill(skill.id, latestVersion);
        } catch (err) {
          console.error(`  Failed to update ${skill.id}:`, err);
        }
      } else {
        console.log(`  ${skill.id}: ${skill.version} (up to date)`);
      }
    }
  }
  
  if (!hasUpdates) {
    console.log('\nAll skills are up to date!');
  }
}
```

**Step 2: 创建 src/commands/uninstall.ts**

```typescript
import fs from 'fs-extra';
import path from 'path';
import { loadRegistry, saveRegistry } from './registry.js';
import { getSkillsDir, getPlatformLinksDir } from '../utils/dirs.js';
import { PLATFORMS } from '../constants.js';

export async function uninstallSkill(skillId: string): Promise<void> {
  const registry = await loadRegistry();
  
  if (!(skillId in registry.skills)) {
    console.log(`Skill "${skillId}" is not installed.`);
    return;
  }
  
  const skillInfo = registry.skills[skillId];
  
  console.log(`Uninstalling ${skillId}@${skillInfo.version}...`);
  
  // Remove skill directory
  const skillsDir = getSkillsDir();
  const skillDir = path.join(skillsDir, skillId);
  await fs.remove(skillDir);
  
  // Remove from platform links
  const platformLinksDir = getPlatformLinksDir();
  for (const platform of PLATFORMS) {
    const linkPath = path.join(platformLinksDir, platform, 'skills', skillId);
    if (await fs.pathExists(linkPath)) {
      await fs.remove(linkPath);
    }
  }
  
  // Update registry
  delete registry.skills[skillId];
  await saveRegistry(registry);
  
  console.log(`\n✅ ${skillId} uninstalled successfully!`);
}
```

**Step 3: 提交**

```bash
git add src/commands/update.ts src/commands/uninstall.ts
git commit -m "feat: add --update and --uninstall commands"
```

---

## Task 10: 清理和发布准备

**Files:**
- Create: `README.md`
- Create: `src/index.ts` (bin entry)

**Step 1: 更新 package.json bin 字段**

```json
{
  "bin": {
    "skm": "./dist/index.js"
  }
}
```

**Step 2: 创建 README.md**

```markdown
# SkillMarket

Cross-platform skill manager for AI coding tools (Cursor, VSCode, Codex, OpenCode, Claude Code, Antigravity).

## Installation

```bash
npm install -g skillmarket
```

Or use directly:

```bash
npx skillmarket --help
```

## Usage

```bash
# List available skills
skm --ls

# Show installed skills
skm --ls --installed

# View skill information
skm --info brainstorming

# Install a skill
skm --install brainstorming

# Update all skills
skm --update --all

# Sync platform links
skm --sync
```

## Development

```bash
npm install
npm run build
npm link
```
```

**Step 3: 提交**

```bash
git add README.md package.json
git commit -m "docs: add README and finalize package.json"
git tag v1.0.0
git push origin main --tags
```

---

## 后续任务 (M5-M6)

- [ ] 测试覆盖
- [ ] 完善错误处理
- [ ] Windows 平台软链接兼容
- [ ] 发布到 npm

/**
 * =============================================================================
 * SkillMarket 安装命令模块
 * =============================================================================
 * 
 * 本模块实现 `skm install` 命令，用于安装 skill 到本地和跨平台目录。
 * 
 * 安装流程:
 * 1. 确保目录结构存在
 * 2. 从 npm 获取包信息
 * 3. 下载包到缓存
 * 4. 解压并复制到 skills 目录
 * 5. 创建 latest 软链接
 * 6. 安装到目标平台（OpenCode/Claude Code/VSCode）
 * 7. 更新本地注册表
 * 
 * 安装后的目录结构:
 * ~/.skillmarket/
 * ├── skills/
 * │   └── <skillId>/
 * │       ├── latest -> <version>/  (软链接)
 * │       └── <version>/
 * │           ├── SKILL.md
 * │           └── metadata.json
 * └── ...
 * 
 * 跨平台安装:
 * - OpenCode: ~/.config/opencode/skills/<skillId>/SKILL.md
 * - Claude Code: ~/.claude/skills/<skillId>/SKILL.md
 * - VSCode: ~/.copilot/skills/<skillId>/SKILL.md
 * 
 * @module commands/install
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as tar from 'tar';

import { fetchSkillPackage } from './npm.js';
import { loadRegistry, saveRegistry } from './registry.js';
import { getCacheDir, getSkillsDir, ensureMarketDirs } from '../utils/dirs.js';
import { detectPlatforms, getAdapterByPlatform } from '../adapters/index.js';
import { LATEST_LINK } from '../constants.js';
import type { InstalledSkill } from '../types.js';
import type { Platform } from '../constants.js';
import type { PlatformAdapter } from '../types.js';

const execAsync = promisify(exec);

// -----------------------------------------------------------------------------
// 安装选项接口
// -----------------------------------------------------------------------------

export interface InstallOptions {
  /** 目标平台列表（留空则安装到所有可用平台） */
  platforms?: string[];
  /** 强制覆盖已安装的 skill */
  force?: boolean;
  /** 本地源码目录（从本地路径安装，跳过 npm fetch） */
  sourceDir?: string;
}

// -----------------------------------------------------------------------------
// 安装函数
// -----------------------------------------------------------------------------

/**
 * 安装指定的 skill
 * 
 * @param {string} skillId - Skill 标识符（支持短格式或 scoped 格式）
 * @param {string} [version] - 指定版本号（可选，不指定则安装最新版本）
 * @param {InstallOptions} [options] - 安装选项
 * @returns {Promise<void>}
 * 
 * @example
 * // 安装最新版本的 brainstorming
 * await installSkill('brainstorming');
 * 
 * // 安装指定版本
 * await installSkill('brainstorming', '1.0.0');
 * 
 * // 安装到特定平台
 * await installSkill('brainstorming', undefined, { platforms: ['opencode'] });
 * 
 * // 强制覆盖
 * await installSkill('brainstorming', undefined, { force: true });
 */
export async function installSkill(
  skillId: string, 
  version?: string,
  options?: InstallOptions
): Promise<void> {
  // ==========================================================================
  // 步骤 0: 准备
  // ==========================================================================
  
  // 确保所有必要的目录都已创建
  await ensureMarketDirs();
  
  // ==========================================================================
  // 步骤 1: 确定版本和源码来源（本地目录 or npm）
  // ==========================================================================
  
  let targetVersion: string;
  let pkgRoot: string; // 包含 SKILL.md / metadata.json 的源码目录
  
  if (options?.sourceDir) {
    // ---- 本地安装模式：从 sourceDir 读取 version ----
    console.log(`Installing ${skillId} from local source...`);
    pkgRoot = options.sourceDir;
    
    const pkgJsonPath = path.join(pkgRoot, 'package.json');
    targetVersion = version || '0.0.0';
    if (await fs.pathExists(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));
        if (pkg.version) targetVersion = pkg.version;
      } catch { /* ignore */ }
    }
  } else {
    // ---- npm 模式：从 registry 获取包信息并下载 ----
    console.log(`Installing ${skillId}${version ? `@${version}` : ''}...`);
    
    const pkgInfo = await fetchSkillPackage(skillId);
    if (!pkgInfo) {
      throw new Error(`Package ${skillId} not found`);
    }
    
    const packageName = pkgInfo.name;
    targetVersion = version || pkgInfo['dist-tags']?.latest;
    if (!targetVersion) {
      throw new Error(`No version found for ${packageName}`);
    }
    
    // 下载包到缓存
    const cacheDir = getCacheDir();
    const targetDir = path.join(cacheDir, `${packageName}@${targetVersion}`);
    
    if (!(await fs.pathExists(targetDir))) {
      console.log('Downloading package...');
      await fs.ensureDir(cacheDir);
      
      try {
        const { stdout } = await execAsync(
          `npm pack ${packageName}@${targetVersion} --pack-destination "${cacheDir}"`
        );
        const tarballName = stdout.trim();
        const tarballPath = path.join(cacheDir, tarballName);
        
        if (await fs.pathExists(tarballPath)) {
          await tar.extract({ file: tarballPath, cwd: cacheDir });
          await fs.remove(tarballPath);
          await fs.move(path.join(cacheDir, 'package'), targetDir, { overwrite: true });
        }
      } catch (err) {
        throw new Error(`Failed to download package: ${err}`);
      }
    }
    
    pkgRoot = targetDir;
  }
  
  // ==========================================================================
  // 步骤 2: 复制到 skills 目录
  // ==========================================================================
  
  const skillsDir = getSkillsDir();
  const skillVersionDir = path.join(skillsDir, `${skillId}@${targetVersion}`);
  
  console.log('Setting up skill...');
  await fs.ensureDir(skillVersionDir);
  
  if (await fs.pathExists(path.join(pkgRoot, 'SKILL.md'))) {
    await fs.copy(
      path.join(pkgRoot, 'SKILL.md'), 
      path.join(skillVersionDir, 'SKILL.md')
    );
  }
  
  if (await fs.pathExists(path.join(pkgRoot, 'metadata.json'))) {
    await fs.copy(
      path.join(pkgRoot, 'metadata.json'), 
      path.join(skillVersionDir, 'metadata.json')
    );
  }
  
  // ==========================================================================
  // 步骤 3: 创建 latest 软链接
  // ==========================================================================
  
  const skillDir = path.join(skillsDir, skillId);
  await fs.ensureDir(skillDir);
  const latestLink = path.join(skillDir, LATEST_LINK);
  
  try {
    await fs.remove(latestLink);
    await fs.symlink(skillVersionDir, latestLink, 'junction');
  } catch {
    await fs.copy(skillVersionDir, path.join(skillDir, LATEST_LINK), { overwrite: true });
  }
  
  // ==========================================================================
  // 步骤 4: 安装到目标平台
  // ==========================================================================
  
  let targetAdapters: PlatformAdapter[] = [];
  
  if (options?.platforms && options.platforms.length > 0) {
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
    targetAdapters = await detectPlatforms();
  }
  
  if (targetAdapters.length === 0) {
    console.log('No target platforms detected.');
    console.log('Use --platform to specify platforms manually.');
  } else {
    console.log(`\nInstalling to ${targetAdapters.length} platform(s)...\n`);
    
    const results: { name: string; status: 'installed' | 'skipped' | 'failed'; error?: string }[] = [];
    
    for (const adapter of targetAdapters) {
      try {
        const isInstalled = await adapter.isInstalled(skillId);
        
        if (isInstalled && !options?.force) {
          console.log(`${adapter.name.padEnd(12)} ⚠️  Already installed (use --force to overwrite)`);
          results.push({ name: adapter.name, status: 'skipped' });
          continue;
        }
        
        await adapter.install(skillId, skillVersionDir);
        console.log(`${adapter.name.padEnd(12)} ✅  Installed successfully`);
        results.push({ name: adapter.name, status: 'installed' });
      } catch (error) {
        console.log(`${adapter.name.padEnd(12)} ❌  Failed: ${error}`);
        results.push({ name: adapter.name, status: 'failed', error: String(error) });
      }
    }
    
    const installed = results.filter(r => r.status === 'installed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    console.log(`\n📊 Summary: ${installed} installed, ${skipped} skipped, ${failed} failed`);
  }
  
  // ==========================================================================
  // 步骤 5: 更新注册表
  // ==========================================================================
  
  const registry = await loadRegistry();
  const installedPlatforms = targetAdapters.map(a => a.id);
  
  registry.skills[skillId] = {
    id: skillId,
    version: targetVersion,
    installedAt: new Date().toISOString(),
    platforms: installedPlatforms
  } as InstalledSkill;
  
  await saveRegistry(registry);
  
  // ==========================================================================
  // 完成
  // ==========================================================================
  
  console.log(`\n✅ ${skillId}@${targetVersion} installed successfully!`);
  console.log(`   Use "skm info ${skillId}" for more details`);
}

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

import fs from 'fs-extra';          // 文件系统操作
import path from 'path';             // 路径处理
import { exec } from 'child_process'; // 执行 shell 命令
import { promisify } from 'util';    // Promise 化工具

// 模块导入
import { fetchSkillPackage } from './npm.js';         // npm 查询
import { loadRegistry, saveRegistry } from './registry.js';  // 注册表操作
import { getCacheDir, getSkillsDir, ensureMarketDirs } from '../utils/dirs.js';  // 目录工具
import { detectPlatforms, getAdapterByPlatform } from '../adapters/index.js';  // 平台适配器
import { LATEST_LINK } from '../constants.js';       // 常量
import type { InstalledSkill } from '../types.js';    // 类型定义
import type { Platform } from '../constants.js';
import type { PlatformAdapter } from '../types.js';

// 将 exec 转为 Promise 形式
const execAsync = promisify(exec);

// -----------------------------------------------------------------------------
// 安装选项接口
// -----------------------------------------------------------------------------

export interface InstallOptions {
  /** 目标平台列表（留空则安装到所有可用平台） */
  platforms?: string[];
  /** 强制覆盖已安装的 skill */
  force?: boolean;
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
  
  console.log(`Installing ${skillId}${version ? `@${version}` : ''}...`);
  
  // ==========================================================================
  // 步骤 1: 获取包信息
  // ==========================================================================
  
  // 从 npm 查询包的元信息（自动尝试多个可能的 scope）
  const pkgInfo = await fetchSkillPackage(skillId);
  if (!pkgInfo) {
    throw new Error(`Package ${skillId} not found`);
  }
  
  // 获取实际找到的包名
  const packageName = pkgInfo.name;
  
  // 确定要安装的版本（用户指定版本 > 最新版本）
  const targetVersion = version || pkgInfo['dist-tags']?.latest;
  if (!targetVersion) {
    throw new Error(`No version found for ${packageName}`);
  }
  
  // ==========================================================================
  // 步骤 2: 下载包到缓存
  // ==========================================================================
  
  const cacheDir = getCacheDir();
  
  // 计算目标缓存目录路径
  // 例如: ~/.skillmarket/cache/@skillmarket%2Fbrainstorming@1.0.0/
  const targetDir = path.join(cacheDir, `${packageName}@${targetVersion}`);
  
  // 如果缓存已存在，跳过下载
  if (!(await fs.pathExists(targetDir))) {
    console.log('Downloading package...');
    await fs.ensureDir(cacheDir);
    
    try {
      // 使用 npm pack 下载包到指定目录
      // npm pack 会生成 .tgz 文件
      await execAsync(`npm pack ${packageName}@${targetVersion} --pack-destination ${cacheDir}`);
      
      // 查找下载的 tarball 文件
      const files = await fs.readdir(cacheDir);
      
      // npm pack 生成的文件名格式: <package-name>-<version>.tgz
      // scoped 包格式: @scope-package-name-<version>.tgz
      const tarball = files.find(f => 
        f.endsWith('.tgz') && 
        f.includes(packageName.replace('/', '-'))
      );
      
      if (tarball) {
        // 解压 tarball
        await execAsync(`tar -xzf "${path.join(cacheDir, tarball)}" -C "${cacheDir}"`);
        
        // 删除 tarball（不再需要）
        await fs.remove(path.join(cacheDir, tarball));
        
        // npm 解压后目录名固定为 'package'，需要重命名为目标版本目录
        const extractedDir = path.join(cacheDir, 'package');
        const finalDir = targetDir;
        
        // 移动并覆盖（如果已存在）
        await fs.move(extractedDir, finalDir, { overwrite: true });
      }
    } catch (err) {
      throw new Error(`Failed to download package: ${err}`);
    }
  }
  
  // ==========================================================================
  // 步骤 3: 复制到 skills 目录
  // ==========================================================================
  
  const skillsDir = getSkillsDir();
  
  // 创建版本目录: ~/.skillmarket/skills/<skillId>@<version>/
  const skillVersionDir = path.join(skillsDir, `${skillId}@${targetVersion}`);
  
  console.log('Setting up skill...');
  await fs.ensureDir(skillVersionDir);
  
  // 从缓存复制必要的文件到 skills 目录
  const pkgRoot = targetDir;
  
  // 复制 SKILL.md（skill 定义文件）
  if (await fs.pathExists(path.join(pkgRoot, 'SKILL.md'))) {
    await fs.copy(
      path.join(pkgRoot, 'SKILL.md'), 
      path.join(skillVersionDir, 'SKILL.md')
    );
  }
  
  // 复制 metadata.json（可选元数据文件）
  if (await fs.pathExists(path.join(pkgRoot, 'metadata.json'))) {
    await fs.copy(
      path.join(pkgRoot, 'metadata.json'), 
      path.join(skillVersionDir, 'metadata.json')
    );
  }
  
  // ==========================================================================
  // 步骤 4: 创建 latest 软链接
  // ==========================================================================
  
  // skill 主目录: ~/.skillmarket/skills/<skillId>/
  const skillDir = path.join(skillsDir, skillId);
  await fs.ensureDir(skillDir);
  
  // latest 软链接路径: ~/.skillmarket/skills/<skillId>/latest
  const latestLink = path.join(skillDir, LATEST_LINK);
  
  try {
    // 删除已存在的软链接（如果有）
    await fs.remove(latestLink);
    
    // 创建软链接指向版本目录
    // 'junction' 类型在 Windows 上不需要管理员权限
    await fs.symlink(skillVersionDir, latestLink, 'junction');
  } catch {
    // Windows 上 junction 可能失败，降级为目录复制
    await fs.copy(skillVersionDir, path.join(skillDir, LATEST_LINK), { overwrite: true });
  }
  
  // ==========================================================================
  // 步骤 5: 安装到目标平台 (NEW)
  // ==========================================================================
  
  let targetAdapters: PlatformAdapter[] = [];
  
  if (options?.platforms && options.platforms.length > 0) {
    // 用户指定了平台
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
    // 自动检测可用平台
    targetAdapters = await detectPlatforms();
  }
  
  if (targetAdapters.length === 0) {
    console.log('No target platforms detected.');
    console.log('Use --platform to specify platforms manually.');
  } else {
    console.log(`\nInstalling to ${targetAdapters.length} platform(s)...\n`);
    
    // 安装到每个平台
    const results: { name: string; status: 'installed' | 'skipped' | 'failed'; error?: string }[] = [];
    
    for (const adapter of targetAdapters) {
      try {
        const isInstalled = await adapter.isInstalled(skillId);
        
        if (isInstalled && !options?.force) {
          console.log(`${adapter.name.padEnd(12)} ⚠️  Already installed (use --force to overwrite)`);
          results.push({ name: adapter.name, status: 'skipped' });
          continue;
        }
        
        // 安装 skill 到平台目录
        await adapter.install(skillId, skillVersionDir);
        console.log(`${adapter.name.padEnd(12)} ✅  Installed successfully`);
        results.push({ name: adapter.name, status: 'installed' });
      } catch (error) {
        console.log(`${adapter.name.padEnd(12)} ❌  Failed: ${error}`);
        results.push({ name: adapter.name, status: 'failed', error: String(error) });
      }
    }
    
    // 显示摘要
    const installed = results.filter(r => r.status === 'installed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    console.log(`\n📊 Summary: ${installed} installed, ${skipped} skipped, ${failed} failed`);
  }
  
  // ==========================================================================
  // 步骤 6: 更新注册表
  // ==========================================================================
  
  const registry = await loadRegistry();
  const installedPlatforms = targetAdapters.map(a => a.id);
  
  // 添加/更新注册表中的 skill 记录
  registry.skills[skillId] = {
    id: skillId,
    version: targetVersion,
    installedAt: new Date().toISOString(),
    platforms: installedPlatforms
  } as InstalledSkill;
  
  // 保存注册表
  await saveRegistry(registry);
  
  // ==========================================================================
  // 完成
  // ==========================================================================
  
  console.log(`\n✅ ${skillId}@${targetVersion} installed successfully!`);
  console.log(`   Use "skm info ${skillId}" for more details`);
}

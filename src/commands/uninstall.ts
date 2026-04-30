/**
 * =============================================================================
 * SkillMarket 卸载命令模块
 * =============================================================================
 * 
 * 本模块实现 `skm uninstall` 命令，用于卸载已安装的 skill。
 * 
 * 卸载流程:
 * 1. 检查 skill 是否已安装
 * 2. 从目标平台卸载
 * 3. 删除 skill 主目录（包含所有版本和软链接）
 * 4. 删除各平台的软链接
 * 5. 从注册表中移除记录
 * 
 * 新增功能 (v1.4.0):
 * - 支持 --all 卸载所有 skills
 * - 支持 --dry-run 预览删除内容
 * - 添加确认提示（--all 时强制确认）
 * - 改进错误处理：平台卸载失败时暂停本地删除
 * 
 * @module commands/uninstall
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import fs from 'fs-extra';              // 文件系统操作
import path from 'path';                 // 路径处理
import readline from 'readline';          // 用户交互确认
import { loadRegistry, saveRegistry, getInstalledSkills } from './registry.js';  // 注册表操作
import { getSkillsDir, getPlatformLinksDir } from '../utils/dirs.js';  // 目录工具
import { PLATFORMS } from '../constants.js';  // 平台常量
import { detectPlatforms, getAdapterByPlatform } from '../adapters/index.js';  // 平台适配器
import type { Platform } from '../constants.js';
import type { PlatformAdapter, InstalledSkill } from '../types.js';

// -----------------------------------------------------------------------------
// 卸载选项接口
// -----------------------------------------------------------------------------

export interface UninstallOptions {
  /** 目标平台列表（留空则卸载所有平台） */
  platforms?: string[];
  /** 卸载所有已安装的 skills */
  all?: boolean;
  /** 预览模式：不实际删除，只显示将要删除的内容 */
  dryRun?: boolean;
  /** 跳过确认提示 */
  yes?: boolean;
}

// -----------------------------------------------------------------------------
// 工具函数：用户确认提示
// -----------------------------------------------------------------------------

/**
 * 请求用户确认
 * 
 * @param {string} message - 确认提示信息
 * @returns {Promise<boolean>} 用户是否确认
 */
async function askConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// -----------------------------------------------------------------------------
// 工具函数：收集 skill 删除预览信息
// -----------------------------------------------------------------------------

/**
 * 收集指定 skill 的删除预览信息
 * 
 * @param {string} skillId - Skill 标识符
 * @param {UninstallOptions} options - 卸载选项
 * @returns {Promise<{skillInfo: InstalledSkill, platforms: string[], localFiles: string[]}>} 预览信息
 */
async function getUninstallPreview(
  skillId: string,
  options?: UninstallOptions
): Promise<{
  skillInfo: InstalledSkill;
  platforms: string[];
  localPath: string;
  platformLinks: string[];
}> {
  const registry = await loadRegistry();
  const skillInfo = registry.skills[skillId];
  
  // 收集目标平台
  let platformNames: string[] = [];
  
  if (options?.platforms && options.platforms.length > 0) {
    platformNames = options.platforms;
  } else {
    const adapters = await detectPlatforms();
    platformNames = adapters.map(a => a.name);
  }
  
  // 本地文件路径
  const skillsDir = getSkillsDir();
  const localPath = path.join(skillsDir, skillId);
  
  // 平台软链接路径
  const platformLinksDir = getPlatformLinksDir();
  const platformLinks: string[] = [];
  
  for (const platform of PLATFORMS) {
    const linkPath = path.join(platformLinksDir, platform, 'skills', skillId);
    if (await fs.pathExists(linkPath)) {
      platformLinks.push(linkPath);
    }
  }
  
  return { skillInfo, platforms: platformNames, localPath, platformLinks };
}

// -----------------------------------------------------------------------------
// 卸载单个 skill
// -----------------------------------------------------------------------------

/**
 * 卸载指定的 skill
 * 
 * @param {string} skillId - Skill 标识符
 * @param {UninstallOptions} [options] - 卸载选项
 * @returns {Promise<boolean>} 是否成功卸载
 * 
 * @example
 * // 卸载 brainstorming
 * await uninstallSkill('brainstorming');
 * 
 * // 从特定平台卸载
 * await uninstallSkill('brainstorming', { platforms: ['opencode'] });
 */
export async function uninstallSkill(
  skillId: string,
  options?: UninstallOptions
): Promise<boolean> {
  // ==========================================================================
  // 步骤 1: 检查是否已安装
  // ==========================================================================
  
  const registry = await loadRegistry();
  
  // 检查注册表中是否存在该 skill
  if (!(skillId in registry.skills)) {
    console.log(`❌ Skill "${skillId}" is not installed.`);
    return false;
  }
  
  // 获取 skill 信息（用于显示）
  const skillInfo = registry.skills[skillId];
  
  // ==========================================================================
  // 步骤 2: Dry-run 模式 - 只显示预览
  // ==========================================================================
  
  if (options?.dryRun) {
    const preview = await getUninstallPreview(skillId, options);
    
    console.log(`\n📋 Uninstall Preview for "${skillId}":`);
    console.log(`   Version: ${skillInfo.version}`);
    console.log(`   Installed: ${skillInfo.installedAt}`);
    console.log(`   Platforms (from registry): ${preview.platforms.join(', ') || 'none'}`);
    console.log(`\n   Local files to remove:`);
    console.log(`   - ${preview.localPath}`);
    
    if (preview.platformLinks.length > 0) {
      console.log(`\n   Platform links to remove:`);
      for (const link of preview.platformLinks) {
        console.log(`   - ${link}`);
      }
    }
    
    console.log(`\n⚠️  This was a dry-run. No files were actually deleted.`);
    return true;
  }
  
  // ==========================================================================
  // 步骤 3: 确认提示（除非使用 --yes）
  // ==========================================================================
  
  if (!options?.yes) {
    const confirmed = await askConfirmation(`Are you sure you want to uninstall "${skillId}"?`);
    if (!confirmed) {
      console.log('Uninstall cancelled.');
      return false;
    }
  }
  
  console.log(`\nUninstalling ${skillId}@${skillInfo.version}...`);
  
  // ==========================================================================
  // 步骤 4: 从平台卸载
  // ==========================================================================
  
  let targetAdapters: (PlatformAdapter | undefined)[] = [];
  let platformUninstallErrors: { name: string; error: string }[] = [];
  
  if (options?.platforms && options.platforms.length > 0) {
    // 用户指定了平台
    for (const platformStr of options.platforms) {
      const platform = platformStr as Platform;
      targetAdapters.push(getAdapterByPlatform(platform));
    }
  } else {
    // 自动检测可用平台
    targetAdapters = await detectPlatforms();
  }
  
  // 过滤掉 undefined（无效平台）
  const validAdapters = targetAdapters.filter((a): a is PlatformAdapter => a !== undefined);
  
  if (validAdapters.length > 0) {
    console.log(`\nUninstalling from ${validAdapters.length} platform(s)...\n`);
    
    for (const adapter of validAdapters) {
      try {
        await adapter.uninstall(skillId);
        console.log(`${adapter.name.padEnd(12)} ✅  Uninstalled`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`${adapter.name.padEnd(12)} ❌  Failed: ${errorMsg}`);
        platformUninstallErrors.push({ name: adapter.name, error: errorMsg });
      }
    }
  }
  
  // ==========================================================================
  // 步骤 5: 如果有平台卸载失败，询问是否继续
  // ==========================================================================
  
  if (platformUninstallErrors.length > 0 && !options?.yes) {
    const continueAnyway = await askConfirmation(
      `⚠️  ${platformUninstallErrors.length} platform(s) failed to uninstall. Continue with local cleanup?`
    );
    if (!continueAnyway) {
      console.log('Uninstall aborted. Platform files may still exist.');
      return false;
    }
  }
  
  // ==========================================================================
  // 步骤 6: 删除 skill 主目录
  // ==========================================================================
  
  // skill 主目录包含所有版本和 latest 软链接
  const skillsDir = getSkillsDir();
  const skillDir = path.join(skillsDir, skillId);
  
  if (await fs.pathExists(skillDir)) {
    await fs.remove(skillDir);
    console.log(`✅ Removed local files: ${skillDir}`);
  }
  
  // ==========================================================================
  // 步骤 7: 删除平台软链接
  // ==========================================================================
  
  const platformLinksDir = getPlatformLinksDir();
  let removedLinks = 0;
  
  // 遍历所有平台，删除对应的软链接
  for (const platform of PLATFORMS) {
    // 计算软链接路径
    const linkPath = path.join(platformLinksDir, platform, 'skills', skillId);
    
    // 如果软链接存在则删除
    if (await fs.pathExists(linkPath)) {
      await fs.remove(linkPath);
      removedLinks++;
    }
  }
  
  if (removedLinks > 0) {
    console.log(`✅ Removed ${removedLinks} platform link(s)`);
  }
  
  // ==========================================================================
  // 步骤 8: 更新注册表
  // ==========================================================================
  
  // 从注册表中删除该 skill 的记录
  delete registry.skills[skillId];
  
  // 保存更新后的注册表
  await saveRegistry(registry);
  console.log(`✅ Registry updated`);
  
  // ==========================================================================
  // 完成
  // ==========================================================================
  
  console.log(`\n✅ ${skillId} uninstalled successfully!`);
  return true;
}

// -----------------------------------------------------------------------------
// 卸载所有已安装的 skills
// -----------------------------------------------------------------------------

/**
 * 卸载所有已安装的 skills
 * 
 * @param {UninstallOptions} [options] - 卸载选项
 * @returns {Promise<{success: number, failed: number}>} 卸载结果统计
 * 
 * @example
 * // 卸载所有，带确认提示
 * await uninstallAll({ yes: false });
 * 
 * // 强制卸载所有，跳过确认
 * await uninstallAll({ yes: true });
 */
export async function uninstallAll(
  options?: UninstallOptions
): Promise<{ success: number; failed: number }> {
  const registry = await loadRegistry();
  const installedSkills = Object.keys(registry.skills);
  
  if (installedSkills.length === 0) {
    console.log('No skills installed.');
    return { success: 0, failed: 0 };
  }
  
  console.log(`\nFound ${installedSkills.length} installed skill(s):`);
  for (const skillId of installedSkills) {
    const info = registry.skills[skillId];
    console.log(`  - ${skillId}@${info.version}`);
  }
  
  // ==========================================================================
  // Dry-run 模式
  // ==========================================================================
  
  if (options?.dryRun) {
    console.log(`\n📋 Dry-run: Would uninstall ${installedSkills.length} skill(s).`);
    console.log(`⚠️  No files were actually deleted.`);
    return { success: installedSkills.length, failed: 0 };
  }
  
  // ==========================================================================
  // 确认提示（--all 时强制要求确认，除非使用 --yes）
  // ==========================================================================
  
  if (!options?.yes) {
    const confirmed = await askConfirmation(
      `\n⚠️  Are you sure you want to uninstall ALL ${installedSkills.length} skill(s)? This action cannot be undone.`
    );
    if (!confirmed) {
      console.log('Uninstall cancelled.');
      return { success: 0, failed: 0 };
    }
  }
  
  // ==========================================================================
  // 逐个卸载
  // ==========================================================================
  
  console.log(`\nUninstalling all skills...\n`);
  
  let successCount = 0;
  let failedCount = 0;
  
  for (const skillId of installedSkills) {
    try {
      const success = await uninstallSkill(skillId, { ...options, yes: true }); // 已经确认过，跳过子确认
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.log(`❌ Failed to uninstall ${skillId}: ${error}`);
      failedCount++;
    }
  }
  
  // ==========================================================================
  // 完成统计
  // ==========================================================================
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   📦 Total: ${installedSkills.length}`);
  
  return { success: successCount, failed: failedCount };
}

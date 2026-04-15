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
 * @module commands/uninstall
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import fs from 'fs-extra';              // 文件系统操作
import path from 'path';                 // 路径处理
import { loadRegistry, saveRegistry } from './registry.js';  // 注册表操作
import { getSkillsDir, getPlatformLinksDir } from '../utils/dirs.js';  // 目录工具
import { PLATFORMS } from '../constants.js';  // 平台常量
import { detectPlatforms, getAdapterByPlatform } from '../adapters/index.js';  // 平台适配器
import type { Platform } from '../constants.js';
import type { PlatformAdapter } from '../types.js';

// -----------------------------------------------------------------------------
// 卸载选项接口
// -----------------------------------------------------------------------------

export interface UninstallOptions {
  /** 目标平台列表（留空则卸载所有平台） */
  platforms?: string[];
}

// -----------------------------------------------------------------------------
// 卸载函数
// -----------------------------------------------------------------------------

/**
 * 卸载指定的 skill
 * 
 * @param {string} skillId - Skill 标识符
 * @param {UninstallOptions} [options] - 卸载选项
 * @returns {Promise<void>}
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
): Promise<void> {
  // ==========================================================================
  // 步骤 1: 检查是否已安装
  // ==========================================================================
  
  const registry = await loadRegistry();
  
  // 检查注册表中是否存在该 skill
  if (!(skillId in registry.skills)) {
    console.log(`Skill "${skillId}" is not installed.`);
    return;
  }
  
  // 获取 skill 信息（用于显示）
  const skillInfo = registry.skills[skillId];
  
  console.log(`Uninstalling ${skillId}@${skillInfo.version}...`);
  
  // ==========================================================================
  // 步骤 2: 从平台卸载 (NEW)
  // ==========================================================================
  
  let targetAdapters: (PlatformAdapter | undefined)[] = [];
  
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
        console.log(`${adapter.name.padEnd(12)} ❌  Failed: ${error}`);
      }
    }
  }
  
  // ==========================================================================
  // 步骤 3: 删除 skill 主目录
  // ==========================================================================
  
  // skill 主目录包含所有版本和 latest 软链接
  const skillsDir = getSkillsDir();
  const skillDir = path.join(skillsDir, skillId);
  
  // 递归删除整个目录
  await fs.remove(skillDir);
  
  // ==========================================================================
  // 步骤 4: 删除平台软链接
  // ==========================================================================
  
  const platformLinksDir = getPlatformLinksDir();
  
  // 遍历所有平台，删除对应的软链接
  for (const platform of PLATFORMS) {
    // 计算软链接路径
    const linkPath = path.join(platformLinksDir, platform, 'skills', skillId);
    
    // 如果软链接存在则删除
    if (await fs.pathExists(linkPath)) {
      await fs.remove(linkPath);
    }
  }
  
  // ==========================================================================
  // 步骤 5: 更新注册表
  // ==========================================================================
  
  // 从注册表中删除该 skill 的记录
  delete registry.skills[skillId];
  
  // 保存更新后的注册表
  await saveRegistry(registry);
  
  // ==========================================================================
  // 完成
  // ==========================================================================
  
  console.log(`\n✅ ${skillId} uninstalled successfully!`);
}

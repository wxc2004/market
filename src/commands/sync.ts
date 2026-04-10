/**
 * =============================================================================
 * SkillMarket 同步命令模块
 * =============================================================================
 * 
 * 本模块实现 `skm sync` 命令，用于同步平台软链接。
 * 
 * 同步流程:
 * 1. 遍历所有支持的平台
 * 2. 对每个已安装的 skill，创建平台特定的软链接
 * 
 * 软链接结构:
 * ~/.skillmarket/
 * ├── skills/                           # 实际 skill 文件
 * │   └── <skill>/
 * │       └── latest -> <version>/       # 指向最新版本
 * │           └── <platform>/            # 平台特定文件
 * │               └── SKILL.md
 * │
 * └── platform-links/                   # 平台适配层
 *     └── <platform>/
 *         └── skills/
 *             └── <skill> -> ../../../skills/<skill>/latest/<platform>
 * 
 * 这样各平台只需要配置 platform-links 作为 skill 查找路径即可。
 * 
 * @module commands/sync
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import fs from 'fs-extra';    // 文件系统操作
import path from 'path';       // 路径处理

// 模块导入
import { 
  getSkillsDir, 
  getPlatformLinksDir, 
  ensureMarketDirs 
} from '../utils/dirs.js';

import { loadRegistry } from './registry.js';

import { getPlatformFromInput, type Platform } from '../utils/platform.js';
import { PLATFORMS, LATEST_LINK } from '../constants.js';

// -----------------------------------------------------------------------------
// 同步函数
// -----------------------------------------------------------------------------

/**
 * 同步平台软链接
 * 
 * 为每个已安装的 skill 在平台目录下创建软链接，
 * 指向 skills 目录中对应的平台特定文件。
 * 
 * @param {string | Platform} [targetPlatform] - 目标平台（可选，不指定则同步所有平台）
 * @returns {Promise<void>}
 * 
 * @example
 * // 同步所有平台链接
 * await syncPlatformLinks();
 * 
 * // 仅同步到 opencode
 * await syncPlatformLinks('opencode');
 */
export async function syncPlatformLinks(targetPlatform?: string): Promise<void> {
  // ==========================================================================
  // 步骤 1: 准备
  // ==========================================================================
  
  // 确保所有必要的目录都已创建
  await ensureMarketDirs();
  
  // 获取目录路径
  const skillsDir = getSkillsDir();
  const platformLinksDir = getPlatformLinksDir();
  
  // 加载注册表获取已安装的 skills
  const registry = await loadRegistry();
  
  // 确定要同步的平台列表
  let platformsToSync: Platform[];
  
  if (targetPlatform) {
    const parsed = getPlatformFromInput(targetPlatform);
    if (!parsed) {
      console.warn(`Invalid platform: ${targetPlatform}, syncing all platforms`);
      platformsToSync = PLATFORMS;
    } else {
      platformsToSync = [parsed];
    }
  } else {
    platformsToSync = PLATFORMS;
  }
  
  const targetDesc = targetPlatform ? targetPlatform : 'all platforms';
  console.log(`Syncing platform links to ${targetDesc}...\n`);
  
  // ==========================================================================
  // 步骤 2: 遍历指定平台
  // ==========================================================================
  
  for (const platform of platformsToSync) {
    // 创建平台的 skills 目录
    // 例如: ~/.skillmarket/platform-links/cursor/skills/
    const platformDir = path.join(platformLinksDir, platform, 'skills');
    await fs.ensureDir(platformDir);
    
    // ==========================================================================
    // 步骤 3: 遍历所有已安装的 skills
    // ==========================================================================
    
    for (const [skillId, skillInfo] of Object.entries(registry.skills)) {
      // skill 的 latest 软链接路径
      // 例如: ~/.skillmarket/skills/brainstorming/latest
      const skillLatestLink = path.join(skillsDir, skillId, LATEST_LINK);
      
      // 平台特定的 skill 链接目标路径
      // 例如: ~/.skillmarket/skills/brainstorming/latest/cursor
      const targetPlatformDir = path.join(skillLatestLink, platform);
      
      // 平台软链接的目标位置
      // 例如: ~/.skillmarket/platform-links/cursor/skills/brainstorming
      const platformSkillDir = path.join(platformDir, skillId);
      
      // 检查 latest 链接是否存在
      if (await fs.pathExists(skillLatestLink)) {
        // 检查该平台是否有对应的文件
        if (await fs.pathExists(targetPlatformDir)) {
          try {
            // 删除已存在的链接
            await fs.remove(platformSkillDir);
            
            // 创建新的软链接
            // 'junction' 类型在 Windows 上不需要管理员权限
            await fs.symlink(targetPlatformDir, platformSkillDir, 'junction');
            
            console.log(`  Linked: ${platform}/${skillId}`);
          } catch {
            // Windows 上软链接失败时的降级处理
            // 改为复制目录而非创建链接
            await fs.copy(targetPlatformDir, platformSkillDir, { overwrite: true });
            console.log(`  Copied: ${platform}/${skillId}`);
          }
        }
      }
    }
  }
  
  // ==========================================================================
  // 完成
  // ==========================================================================
  
  console.log('\n✅ Sync complete!');
}

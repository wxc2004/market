/**
 * =============================================================================
 * SkillMarket 更新命令模块
 * =============================================================================
 * 
 * 本模块实现 `skm update` 命令，用于：
 * - 更新单个 skill 到最新版本
 * - 更新所有已安装的 skills
 * 
 * 更新逻辑：
 * 1. 查询 npm 获取每个 skill 的最新版本
 * 2. 与本地版本对比
 * 3. 如果有新版本，调用 installSkill 重新安装
 * 
 * @module commands/update
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import { installSkill } from './install.js';    // 安装函数（复用）
import { getInstalledSkills } from './registry.js';  // 注册表操作
import { fetchNpmPackage } from './npm.js';    // npm 查询

// -----------------------------------------------------------------------------
// 更新函数
// -----------------------------------------------------------------------------

/**
 * 更新指定的 skill 或所有 skills
 * 
 * @param {string} [skillId] - Skill 标识符（可选，不指定则更新所有）
 * @returns {Promise<void>}
 * 
 * @example
 * // 更新单个 skill
 * await updateSkill('brainstorming');
 * 
 * // 更新所有已安装的 skills
 * await updateSkill();
 */
export async function updateSkill(skillId?: string): Promise<void> {
  // ==========================================================================
  // 模式 1: 更新单个 skill
  // ==========================================================================
  
  if (skillId) {
    // 查询 npm 获取最新版本
    const pkgInfo = await fetchNpmPackage(`@this-is-skillmarket/${skillId}`);
    
    if (pkgInfo) {
      const latestVersion = pkgInfo['dist-tags']?.latest;
      console.log(`Updating ${skillId} to ${latestVersion}...`);
      
      // 复用 installSkill 安装最新版本
      await installSkill(skillId, latestVersion);
    }
    
    return;
  }
  
  // ==========================================================================
  // 模式 2: 更新所有 skills
  // ==========================================================================
  
  // 获取所有已安装的 skills
  const installed = await getInstalledSkills();
  
  // 无已安装 skills 时
  if (installed.length === 0) {
    console.log('No skills installed to update.');
    return;
  }
  
  console.log(`Checking updates for ${installed.length} skill(s)...\n`);
  
  // 标记是否有可用的更新
  let hasUpdates = false;
  
  // 遍历每个已安装的 skill
  for (const skill of installed) {
    // 查询 npm 获取最新版本信息
    const pkgInfo = await fetchNpmPackage(`@wanxuchen/${skill.id}`);
    
    if (pkgInfo) {
      const latestVersion = pkgInfo['dist-tags']?.latest;
      
      // 比较版本，判断是否需要更新
      if (latestVersion && latestVersion !== skill.version) {
        // 发现新版本
        console.log(`  ${skill.id}: ${skill.version} → ${latestVersion} [UPDATE]`);
        hasUpdates = true;
        
        try {
          // 执行更新
          await installSkill(skill.id, latestVersion);
        } catch (err) {
          // 更新失败，打印错误但继续处理其他 skill
          console.error(`  Failed to update ${skill.id}:`, err);
        }
      } else {
        // 已是最新版本
        console.log(`  ${skill.id}: ${skill.version} (up to date)`);
      }
    }
  }
  
  // 所有 skills 都已是最新
  if (!hasUpdates) {
    console.log('\nAll skills are up to date!');
  }
}

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
import { fetchSkillPackage } from './npm.js';    // npm 查询（自动尝试所有 scope）

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
    // 查询 npm 获取最新版本（自动尝试所有配置的 scope）
    const pkgInfo = await fetchSkillPackage(skillId);

    if (pkgInfo) {
      const latestVersion = pkgInfo['dist-tags']?.latest;
      if (!latestVersion) {
        console.log(`No latest version found for ${skillId}.`);
        return;
      }
      console.log(`Updating ${skillId} to ${latestVersion}...`);

      // 复用 installSkill 安装最新版本
      await installSkill(skillId, latestVersion);
    } else {
      console.log(`Skill "${skillId}" not found in any configured scope.`);
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
  
  // 并发检查所有已安装 skill 的远程版本
  const checkResults = await Promise.allSettled(
    installed.map(async (skill) => {
      const pkgInfo = await fetchSkillPackage(skill.id);
      if (!pkgInfo) {
        return { skill, latestVersion: null as string | null, error: 'failed to fetch remote' };
      }
      const latestVersion = pkgInfo['dist-tags']?.latest || null;
      return { skill, latestVersion, error: null };
    })
  );
  
  // 收集需要更新的 skills
  const toUpdate: { skill: typeof installed[0]; latestVersion: string }[] = [];
  let upToDate = 0;
  let fetchFailed = 0;
  
  for (const result of checkResults) {
    if (result.status === 'rejected') {
      fetchFailed++;
      continue;
    }
    const { skill, latestVersion, error } = result.value;
    if (error) {
      console.log(`  ${skill.id}: ${skill.version} (${error})`);
      fetchFailed++;
    } else if (latestVersion && latestVersion !== skill.version) {
      console.log(`  ${skill.id}: ${skill.version} → ${latestVersion} [UPDATE]`);
      toUpdate.push({ skill, latestVersion });
    } else {
      console.log(`  ${skill.id}: ${skill.version} (up to date)`);
      upToDate++;
    }
  }
  
  // 并行安装所有更新
  if (toUpdate.length > 0) {
    console.log(`\nUpdating ${toUpdate.length} skill(s)...\n`);
    
    const updateResults = await Promise.allSettled(
      toUpdate.map(async ({ skill, latestVersion }) => {
        try {
          await installSkill(skill.id, latestVersion);
          return { id: skill.id, success: true };
        } catch (err) {
          return { id: skill.id, success: false, error: err };
        }
      })
    );
    
    for (const result of updateResults) {
      if (result.status === 'fulfilled' && result.value.success) {
        console.log(`  ✅ ${result.value.id} updated`);
      } else if (result.status === 'fulfilled' && !result.value.success) {
        console.error(`  ❌ Failed to update ${result.value.id}:`, result.value.error);
      }
    }
  }
  
  // 汇总
  if (toUpdate.length === 0) {
    console.log('\nAll skills are up to date!');
  } else {
    console.log(`\n📊 Update summary: ${toUpdate.length} updated, ${upToDate} up-to-date, ${fetchFailed} failed`);
  }
}

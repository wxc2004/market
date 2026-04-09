/**
 * =============================================================================
 * SkillMarket 信息命令模块
 * =============================================================================
 * 
 * 本模块实现 `skm info` 命令，用于显示指定 skill 的详细信息。
 * 
 * 显示内容包括：
 * - 包名称和最新版本
 * - 描述信息
 * - SkillMarket 元数据（平台支持等）
 * - 所有可用版本
 * - 安装状态
 * 
 * @module commands/info
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import { fetchNpmPackage } from './npm.js';    // npm registry 查询
import { 
  isSkillInstalled,       // 检查 skill 是否已安装
  getInstalledSkills       // 获取已安装 skills 列表
} from './registry.js';

// -----------------------------------------------------------------------------
// 命令实现
// -----------------------------------------------------------------------------

/**
 * 显示指定 skill 的详细信息
 * 
 * 从 npm registry 获取 skill 包信息，并结合本地安装状态显示完整信息。
 * 
 * @param {string} skillId - Skill 的唯一标识符
 * @returns {Promise<void>}
 * 
 * @example
 * // 显示 brainstorming skill 的信息
 * await showSkillInfo('brainstorming');
 * 
 * // 显示 scoped 包的信息
 * await showSkillInfo('@custom/skill-name');
 */
export async function showSkillInfo(skillId: string): Promise<void> {
  // -------------------------------------------------------------------------
  // 处理包名格式
  // -------------------------------------------------------------------------
  
  /**
   * 转换 skillId 为完整的 npm 包名格式
   * 
   * 支持两种输入格式：
   * 1. 短格式: "brainstorming" → "@itismyskillmarket/brainstorming"
   * 2. 完整格式: "@custom/skill" → "@custom/skill"
   */
  const packageName = skillId.startsWith('@') 
    ? skillId                                          // 已经是 scoped 包名
    : `@itismyskillmarket/${skillId}`;                 // 转换为 scoped 包名
  
  console.log(`Fetching info for: ${packageName}\n`);
  
  try {
    // -------------------------------------------------------------------------
    // 从 npm 获取包信息
    // -------------------------------------------------------------------------
    
    const info = await fetchNpmPackage(packageName);
    
    // 包不存在
    if (!info) {
      console.log(`Skill "${skillId}" not found in npm registry.`);
      return;
    }
    
    // -------------------------------------------------------------------------
    // 提取关键信息
    // -------------------------------------------------------------------------
    
    // 获取最新版本号（从 dist-tags.latest）
    const latestVersion = info['dist-tags']?.latest;
    
    // 获取版本字典（安全访问）
    const versions = info.versions || {};
    
    // 获取最新版本的详细信息
    const pkg = latestVersion ? versions[latestVersion] : undefined;
    
    // -------------------------------------------------------------------------
    // 检查本地安装状态
    // -------------------------------------------------------------------------
    
    // 是否已安装
    const installed = await isSkillInstalled(skillId);
    
    // 获取已安装 skills 列表（用于显示已安装的版本）
    const installedSkills = await getInstalledSkills();
    const installedSkill = installedSkills.find(s => s.id === skillId);
    
    // -------------------------------------------------------------------------
    // 显示基本信息
    // -------------------------------------------------------------------------
    
    console.log(`=== ${info.name} ===`);
    
    // 版本信息（如果已安装，同时显示本地版本）
    const versionDisplay = installedSkill 
      ? `${latestVersion} (installed: ${installedSkill.version})`
      : latestVersion;
    console.log(`Version: ${versionDisplay}`);
    
    // 描述信息
    console.log(`Description: ${pkg?.description || 'N/A'}\n`);
    
    // -------------------------------------------------------------------------
    // 显示 SkillMarket 特有元数据
    // -------------------------------------------------------------------------
    
    const skillmarketMeta = pkg?.skillmarket;
    if (skillmarketMeta) {
      // 支持的平台列表
      console.log(`Platforms: ${skillmarketMeta.platforms?.join(', ') || 'N/A'}`);
      
      // 默认版本
      console.log(`Default Version: ${skillmarketMeta.defaultVersion || 'N/A'}\n`);
    }
    
    // -------------------------------------------------------------------------
    // 显示可用版本列表
    // -------------------------------------------------------------------------
    
    const versionKeys = Object.keys(versions);
    if (versionKeys.length > 0) {
      // 只显示最近 10 个版本
      const recentVersions = versionKeys.slice(-10);
      console.log(`Recent versions: ${recentVersions.join(', ')}`);
    }
    
    // -------------------------------------------------------------------------
    // 显示安装状态提示
    // -------------------------------------------------------------------------
    
    if (installed) {
      console.log(`\nStatus: Installed (use skm update ${skillId} to update)`);
    } else {
      console.log(`\nStatus: Not installed (use skm install ${skillId} to install)`);
    }
  } catch (error) {
    // 错误处理
    console.log(`Error fetching skill info: ${error}`);
  }
}

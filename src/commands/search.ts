/**
 * =============================================================================
 * SkillMarket 搜索命令模块
 * =============================================================================
 * 
 * 本模块实现 `skm search <keyword>` 命令，用于：
 * - 在 npm registry 上搜索匹配的 skills
 * - 只返回包名包含关键词的 skill
 * 
 * @module commands/search
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import { 
  searchSkillmarketPackages,  // 搜索 npm 上的 skill 包
  fetchNpmPackage             // 获取单个包的详细信息
} from './npm.js';

// -----------------------------------------------------------------------------
// 类型定义
// -----------------------------------------------------------------------------

/**
 * search 命令选项接口
 */
interface SearchOptions {
  /** 最大结果数量 */
  limit?: number;
}

// -----------------------------------------------------------------------------
// 命令实现
// -----------------------------------------------------------------------------

/**
 * 搜索 skills
 * 
 * 根据关键词在 npm registry 上搜索匹配的 skills
 * 只返回包名包含关键词的 skill
 * 
 * @param {string} keyword - 搜索关键词
 * @param {SearchOptions} options - 命令选项
 * @returns {Promise<void>}
 * 
 * @example
 * // 搜索包含 "test" 的 skills
 * await searchSkills('test', { limit: 20 });
 */
export async function searchSkills(keyword: string, options: SearchOptions = {}): Promise<void> {
  const limit = options.limit ?? 20;
  
  // 提示用户正在搜索
  console.log(`Searching for "${keyword}"...\n`);
  
  try {
    // 调用 npm search API 搜索 skillmarket 相关包
    const { packages } = await searchSkillmarketPackages({ keyword });
    
    // 精确匹配：只返回包名包含关键词的 skill
    const filtered = packages.filter(pkg => 
      pkg.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // 无搜索结果时
    if (filtered.length === 0) {
      console.log(`No skills found matching "${keyword}".`);
      return;
    }
    
    // 限制结果数量
    const results = filtered.slice(0, limit);
    
    // 打印找到的包数量
    console.log(`Found ${filtered.length} skill(s) (showing ${results.length}):\n`);
    
    // 遍历每个包，获取详细信息并显示
    for (const pkgName of results) {
      const info = await fetchNpmPackage(pkgName);
      
      if (info && info['dist-tags']?.latest) {
        const latestVersion = info['dist-tags'].latest;
        
        // 获取该版本的详细信息
        const pkg = info.versions?.[latestVersion];
        
        // 打印包名和版本
        console.log(`  ${info.name}@${latestVersion}`);
        
        // 打印描述（如果有的话）
        console.log(`    ${pkg?.description || 'No description'}`);
        
        // 空行分隔
        console.log();
      }
    }
  } catch (error) {
    // 网络错误处理
    console.log(`Error searching skills: ${error}`);
  }
}

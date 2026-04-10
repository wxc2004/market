/**
 * =============================================================================
 * SkillMarket 列表命令模块
 * =============================================================================
 * 
 * 本模块实现 `skm ls` 命令，用于：
 * - 列出 npm registry 上可用的 skills
 * - 显示本地已安装的 skills
 * 
 * @module commands/ls
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import { 
  loadRegistry,          // 加载本地注册表
  getInstalledSkills     // 获取已安装 skills 列表
} from './registry.js';

import { 
  searchSkillmarketPackages,  // 搜索 npm 上的 skill 包
  fetchNpmPackage             // 获取单个包的详细信息
} from './npm.js';

// -----------------------------------------------------------------------------
// 类型定义
// -----------------------------------------------------------------------------

/**
 * ls 命令选项接口
 */
interface LsOptions {
  /** 仅显示已安装的 skills */
  installed?: boolean;
  
  /** 检查更新（预留功能） */
  updates?: boolean;
}

// -----------------------------------------------------------------------------
// 命令实现
// -----------------------------------------------------------------------------

/**
 * 列出 skills
 * 
 * 根据选项显示 npm registry 上可用的 skills
 * 或本地已安装的 skills
 * 
 * @param {LsOptions} options - 命令选项
 * @returns {Promise<void>}
 * 
 * @example
 * // 列出 npm 上的可用 skills
 * await listSkills({});
 * 
 * // 列出已安装的 skills
 * await listSkills({ installed: true });
 */
export async function listSkills(options: LsOptions): Promise<void> {
  const { installed, updates } = options;
  
  // -------------------------------------------------------------------------
  // 模式1: 显示已安装的 skills
  // -------------------------------------------------------------------------
  if (installed) {
    const skills = await getInstalledSkills();
    
    // 无已安装 skills 时给出提示
    if (skills.length === 0) {
      console.log('No skills installed yet. Run "skm --ls" to see available skills.');
      return;
    }
    
    // 打印表头
    console.log('Installed Skills:\n');
    
    // 遍历并打印每个 skill 的详细信息
    for (const skill of skills) {
      // skill 名称和版本
      console.log(`  ${skill.id}@${skill.version}`);
      
      // 支持的平台列表
      console.log(`    Platforms: ${skill.platforms.join(', ')}`);
      
      // 安装时间
      console.log(`    Installed: ${skill.installedAt}`);
      
      // 空行分隔
      console.log();
    }
    
    return;
  }
  
  // -------------------------------------------------------------------------
  // 模式2: 显示 npm 上可用的 skills
  // -------------------------------------------------------------------------
  
  // 提示用户正在搜索
  console.log('Searching npm registry...\n');
  
  try {
    // 调用 npm search API 搜索 skillmarket 相关包
    const packages = await searchSkillmarketPackages();
    
    // 无搜索结果时
    if (packages.length === 0) {
      console.log('No skills found. Check back later!');
      return;
    }
    
    // 打印找到的包数量
    console.log(`Found ${packages.length} skill(s):\n`);
    
    // 遍历每个包，获取详细信息并显示
    for (const pkgName of packages) {
      const info = await fetchNpmPackage(pkgName);
      
      if (info) {
        // 获取最新版本号
        const latestVersion = info['dist-tags']?.latest;
        
        // 获取该版本的详细信息
        const pkg = info.versions[latestVersion];
        
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
    console.log(`Error fetching skills: ${error}`);
  }
}

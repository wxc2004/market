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
  
  /** 页码（从 1 开始） */
  page?: number;
  
  /** 每页数量 */
  limit?: number;
  
  /** 搜索关键字（支持 id, displayName, description） */
  search?: string;
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
// -----------------------------------------------------------------------------
// 搜索过滤函数
// -----------------------------------------------------------------------------

/**
 * 过滤已安装的 skills（按关键字）
 * 
 * 匹配 id, displayName, description 字段
 * 
 * @param skills - 已安装的 skills 列表
 * @param keyword - 搜索关键字
 * @returns 过滤后的 skills 列表
 */
function filterInstalledSkills(skills: any[], keyword: string): any[] {
  const lower = keyword.toLowerCase();
  return skills.filter(s => 
    s.id.toLowerCase().includes(lower) ||
    (s.displayName && s.displayName.toLowerCase().includes(lower)) ||
    (s.description && s.description.toLowerCase().includes(lower))
  );
}

// -----------------------------------------------------------------------------
// 命令实现
// -----------------------------------------------------------------------------

export async function listSkills(options: LsOptions): Promise<void> {
  const { installed, updates, page = 1, limit = 20, search } = options;
  
  // -------------------------------------------------------------------------
  // 模式1: 显示已安装的 skills
  // -------------------------------------------------------------------------
  if (installed) {
    let skills = await getInstalledSkills();
    
    // 搜索关键字过滤（仅本地）
    if (search) {
      skills = filterInstalledSkills(skills, search);
    }
    
    const total = skills.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = Math.min(Math.max(1, page), totalPages);
    
    // 无已安装 skills 时给出提示
    if (skills.length === 0) {
      if (search) {
        console.log(`No skills found matching "${search}".`);
      } else {
        console.log('No skills installed yet. Run "skm ls" to see available skills.');
      }
      return;
    }
    
    // 搜索结果提示
    if (search) {
      console.log(`Found ${total} match(es) for "${search}":\n`);
    } else {
      console.log(`Installed Skills (${total}):\n`);
    }
    
    // 计算分页范围
    const start = (currentPage - 1) * limit;
    const end = Math.min(start + limit, total);
    const pageSkills = skills.slice(start, end);
    
    // 遍历并打印每个 skill 的详细信息
    for (const skill of pageSkills) {
      // skill 名称和版本
      console.log(`  ${skill.id}@${skill.version}`);
      
      // 支持的平台列表
      console.log(`    Platforms: ${skill.platforms.join(', ')}`);
      
      // 安装时间
      console.log(`    Installed: ${skill.installedAt}`);
      
      // 空行分隔
      console.log();
    }
    
    // 打印分页信息
    console.log(`Page ${currentPage}/${totalPages} (${limit} per page) | Use --page N to navigate`);
    
    return;
  }
  
  // -------------------------------------------------------------------------
  // 模式2: 显示 npm 上可用的 skills
  // -------------------------------------------------------------------------
  
  // 提示用户正在搜索
  if (search) {
    console.log(`Searching npm for "${search}"...\n`);
  } else {
    console.log('Searching npm registry...\n');
  }
  
  try {
    // 计算分页偏移量
    const offset = (page - 1) * limit;
    
    // 调用 npm search API 搜索 skillmarket 相关包
    const { packages, total } = await searchSkillmarketPackages({
      from: offset,
      size: limit,
      keyword: search
    });
    
    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = Math.min(Math.max(1, page), totalPages);
    
    // 无搜索结果时
    if (packages.length === 0) {
      if (search) {
        console.log(`No skills found matching "${search}".`);
      } else {
        console.log('No skills found. Check back later!');
      }
      return;
    }
    
    // 打印找到的包数量
    if (search) {
      console.log(`Found ${total} match(es) for "${search}":\n`);
    } else {
      console.log(`Found ${total} skill(s):\n`);
    }
    
    // 遍历每个包，获取详细信息并显示
    for (const pkgName of packages) {
      try {
        const info = await fetchNpmPackage(pkgName);
        
        if (!info) {
          // 如果获取失败，仍然显示包名
          console.log(`📦 ${pkgName} (信息获取失败)`);
          console.log();
          continue;
        }
        
        // 获取最新版本号
        const latestVersion = info['dist-tags']?.latest || 'unknown';
        
        // 获取该版本的详细信息
        const pkg = info.versions?.[latestVersion];
        
        // 获取 skillmarket 元数据
        const skillMeta = pkg?.skillmarket;
        
        // 打印包名和版本
        console.log(`📦 ${info.name}@${latestVersion}`);
        
        // 打印显示名称
        const displayName = skillMeta?.displayName || info.name;
        console.log(`   名称: ${displayName}`);
        
        // 打印描述
        console.log(`   描述: ${pkg?.description || 'N/A'}`);
        
        // 打印支持平台
        const platforms = skillMeta?.platforms || [];
        console.log(`   平台: ${platforms.length > 0 ? platforms.join(', ') : 'N/A'}`);
        
        // 打印 npm 链接
        const npmLink = pkg?.links?.npm || `https://www.npmjs.com/package/${info.name}`;
        console.log(`   链接: ${npmLink}`);
        
        // 空行分隔
        console.log();
      } catch (e) {
        // 错误时仍显示包名
        console.log(`📦 ${pkgName} (获取失败: ${e})`);
        console.log();
      }
    }
    
    // 打印分页信息
    console.log(`Page ${currentPage}/${totalPages} (${limit} per page) | Use --page N to navigate`);
  } catch (error) {
    // 网络错误处理
    console.log(`Error fetching skills: ${error}`);
  }
}

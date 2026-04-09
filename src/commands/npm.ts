/**
 * =============================================================================
 * SkillMarket NPM Registry 查询模块
 * =============================================================================
 * 
 * 本模块负责与 npm registry 通信，实现以下功能：
 * - 获取指定 npm 包的信息
 * - 搜索带有 skillmarket 关键字的包
 * 
 * 使用原生 Node.js https 模块，无需额外依赖。
 * 
 * npm Registry API 文档: https://docs.npmjs.com/cli/v8/using-npm/registry
 * 
 * @module commands/npm
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import https from 'https';  // Node.js 原生 HTTPS 模块，用于发送 HTTP 请求
import { URL } from 'url';   // URL 解析和构建工具

// -----------------------------------------------------------------------------
// 类型定义
// -----------------------------------------------------------------------------

/**
 * npm 包版本信息
 * 
 * 定义从 npm registry 返回的单个版本对象的结构
 */
interface NpmPackage {
  /** 包名称 */
  name: string;
  
  /** 版本号，遵循 semver 规范 */
  version: string;
  
  /** 包描述信息 */
  description?: string;
  
  /** npm 链接 */
  links?: {
    npm?: string;
    homepage?: string;
    repository?: string;
    bugs?: string;
  };
  
  /**
   * SkillMarket 特有的元数据
   * 
   * 在 package.json 的 skillmarket 字段中定义，
   * 包含 skill 的平台兼容性等信息
   */
  skillmarket?: {
    /** Skill 唯一标识符 */
    id?: string;
    
    /** 友好显示名称 */
    displayName?: string;
    
    /** 详细描述 */
    description?: string;
    
    /** 支持的平台列表 */
    platforms?: string[];
    
    /** 默认版本标识 */
    defaultVersion?: string;
  };
}

/**
 * npm registry API 响应结构
 * 
 * 对应 npm registry 的完整包信息响应
 */
interface NpmRegistryResponse {
  /** 包名称 */
  name: string;
  
  /** 所有版本的字典，key 是版本号 */
  versions: Record<string, NpmPackage>;
  
  /** 发行标签，如 { latest: "1.0.0", beta: "1.1.0-beta.1" } */
  'dist-tags': Record<string, string>;
}

/**
 * npm search API 响应中的包对象
 */
interface SearchPackage {
  /** 包名 */
  name: string;
  /** 版本 */
  version: string;
}

// -----------------------------------------------------------------------------
// 获取包信息
// -----------------------------------------------------------------------------

/**
 * 获取指定 npm 包的完整信息
 * 
 * 向 npm registry API 发送请求，获取包的详细信息，
 * 包括所有版本、描述、依赖等。
 * 
 * API 端点: GET https://registry.npmjs.org/{package}
 * 
 * @param {string} packageName - 包名称（支持 @scope/name 格式）
 * @returns {Promise<NpmRegistryResponse | null>} 包信息，失败返回 null
 * 
 * @example
 * // 获取官方 commander 包信息
 * const info = await fetchNpmPackage('commander');
 * if (info) {
 *   console.log(`最新版本: ${info['dist-tags'].latest}`);
 * }
 * 
 * // 获取 scoped 包
 * const scoped = await fetchNpmPackage('@skillmarket/brainstorming');
 */
export async function fetchNpmPackage(packageName: string): Promise<NpmRegistryResponse | null> {
  return new Promise((resolve, reject) => {
    // 构建 npm registry URL
    // scoped 包（如 @foo/bar）需要特殊处理，保留 @ 符号
    // @foo/bar -> @foo%2Fbar (URL encoded)
    const isScoped = packageName.startsWith('@');
    let encodedName: string;
    
    if (isScoped) {
      // 对 scoped 包进行正确编码：@foo/bar -> @foo%2Fbar
      const scopeAndName = packageName.substring(1); // 去掉 @
      const slashIndex = scopeAndName.indexOf('/');
      if (slashIndex > 0) {
        const scope = scopeAndName.substring(0, slashIndex);
        const name = scopeAndName.substring(slashIndex + 1);
        encodedName = `@${encodeURIComponent(scope)}%2F${encodeURIComponent(name)}`;
      } else {
        encodedName = packageName; // fallback
      }
    } else {
      encodedName = encodeURIComponent(packageName);
    }
    
    const url = new URL(`https://registry.npmjs.org/${encodedName}`);
    
    // 发送 HTTPS GET 请求
    const req = https.get(url.toString(), { timeout: 10000 }, (res) => {
      let data = '';
      
      // 收集响应数据
      res.on('data', chunk => { data += chunk; });
      
      res.on('end', () => {
        try {
          // 解析 JSON 响应
          const parsed = JSON.parse(data);
          
          // 检查 npm 返回的错误
          // npm 对于不存在的包也返回 200，但 body 中有 error 字段
          if (parsed.error) {
            resolve(null);
            return;
          }
          
          // 成功解析，返回包信息
          resolve(parsed);
        } catch {
          // JSON 解析失败，返回 null
          resolve(null);
        }
      });
    });
    
    // 处理网络错误
    req.on('error', reject);
    
    // 处理请求超时（10秒）
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// -----------------------------------------------------------------------------
// 搜索包
// -----------------------------------------------------------------------------

/**
 * 搜索 SkillMarket 相关的 npm 包
 * 
 * 使用 npm search API 搜索带有 'skillmarket' 关键字的包
 * 
 * API 端点: GET https://registry.npmjs.org/-/v1/search
 * 
 * @returns {Promise<string[]>} 匹配的包名数组
 * 
 * @example
 * const packages = await searchSkillmarketPackages();
 * console.log(`找到 ${packages.length} 个 skill 包`);
 * packages.forEach(name => {
 *   console.log(`- ${name}`);
 * });
 */
export async function searchSkillmarketPackages(): Promise<string[]> {
  const packages: string[] = [];
  
  return new Promise((resolve, reject) => {
    // 构建 search API URL
    const url = new URL('https://registry.npmjs.org/-/v1/search');
    
    // 设置搜索参数
    // text: 搜索关键字
    // size: 返回结果数量上限
    url.searchParams.set('text', 'keywords:skillmarket');
    url.searchParams.set('size', '100');
    
    const req = https.get(url.toString(), { timeout: 10000 }, (res) => {
      let data = '';
      
      // 收集响应数据
      res.on('data', chunk => { data += chunk; });
      
      res.on('end', () => {
        try {
          // 解析搜索结果
          const result = JSON.parse(data);
          
          // 提取所有匹配的包名
          // npm search 返回结构: { objects: [{ package: { name: "..." } }] }
          if (result.objects) {
            for (const item of result.objects) {
              if (item?.package?.name) {
                packages.push(item.package.name);
              }
            }
          }
          
          resolve(packages);
        } catch {
          // 解析失败返回空数组
          resolve([]);
        }
      });
    });
    
    // 处理网络错误
    req.on('error', reject);
    
    // 处理请求超时
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

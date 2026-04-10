/**
 * =============================================================================
 * SkillMarket 常量定义文件
 * =============================================================================
 * 
 * 本文件定义了 SkillMarket CLI 工具的所有常量，包括：
 * - 市场目录名称
 * - 子目录结构
 * - 支持的平台列表
 * - 注册表文件名
 * - 最新版本软链接名称
 * 
 * @module constants
 */

// -----------------------------------------------------------------------------
// 目录结构常量
// -----------------------------------------------------------------------------

/**
 * SkillMarket 主目录名称
 * 用于构建 ~/.skillmarket 路径
 * 
 * @example
 * // 最终路径: ~/.skillmarket
 * const marketHome = path.join(os.homedir(), MARKET_DIR);
 */
export const MARKET_DIR = 'skillmarket';

/**
 * SkillMarket 子目录结构定义
 * 
 * 使用 `as const` 确保字面量类型推断正确：
 * - CACHE: npm 包下载缓存目录
 * - SKILLS: 已安装 skills 的存储目录
 * - PLATFORM_LINKS: 各平台适配层软链接目录
 * 
 * @example
 * // 完整目录结构:
 * // ~/.skillmarket/cache/          - npm 包缓存
 * // ~/.skillmarket/skills/         - 安装的 skills
 * // ~/.skillmarket/platform-links/ - 平台适配链接
 */
export const SUBDIRS = {
  /** npm 包下载缓存目录，用于存储从 npm 下载的 skill 包 */
  CACHE: 'cache',
  
  /** 已安装 skills 的主存储目录 */
  SKILLS: 'skills',
  
  /** 各平台适配层软链接目录，用于跨平台共享 skills */
  PLATFORM_LINKS: 'platform-links'
} as const;

// -----------------------------------------------------------------------------
// 平台支持常量
// -----------------------------------------------------------------------------

/**
 * SkillMarket 支持的 AI 编程工具平台列表
 * 
 * 使用 `as const` 创建只读元组类型，确保类型安全
 * 
 * 支持的平台:
 * - cursor: Cursor IDE
 * - vscode: Visual Studio Code
 * - codex: OpenAI Codex
 * - opencode: OpenCode
 * - claude: Claude Code
 * - antigravity: Antigravity
 * 
 * @example
 * // 类型推断为: ('cursor' | 'vscode' | 'codex' | 'opencode' | 'claude' | 'antigravity')[]
 * PLATFORMS.forEach(platform => {
 *   console.log(`Supporting platform: ${platform}`);
 * });
 */
export const PLATFORMS = [
  'cursor',      // Cursor IDE - AI 代码编辑器
  'vscode',      // Visual Studio Code - 微软代码编辑器
  'codex',       // OpenAI Codex - OpenAI 代码生成模型
  'opencode',    // OpenCode - 开源 AI 编程工具
  'claude',      // Claude Code - Anthropic CLI 工具
  'antigravity'  // Antigravity - AI 编程助手
] as const;

/**
 * 平台类型别名，方便在其他模块中使用
 * 从 PLATFORMS 推断出的联合类型
 * 
 * @example
 * const platform: Platform = 'opencode';
 */
export type Platform = typeof PLATFORMS[number];

// -----------------------------------------------------------------------------
// 文件名常量
// -----------------------------------------------------------------------------

/**
 * 本地注册表文件名
 * 
 * 存储已安装 skills 的元信息，包括：
 * - 每个 skill 的 ID、版本、安装时间
 * - 技能的平台兼容性信息
 * - 最后更新时间
 * 
 * @example
 * // 完整路径: ~/.skillmarket/registry.json
 * const registryPath = path.join(getMarketHome(), REGISTRY_FILE);
 */
export const REGISTRY_FILE = 'registry.json';

/**
 * 最新版本软链接的名称
 * 
 * 每个已安装 skill 目录下都有一个 'latest' 软链接，
 * 指向当前使用的版本目录，方便版本管理和快速访问
 * 
 * @example
 * // 目录结构:
 * // ~/.skillmarket/skills/brainstorming/
 * //   ├── latest -> v1.0.0/  (软链接)
 * //   └── v1.0.0/            (实际版本目录)
 */
export const LATEST_LINK = 'latest';

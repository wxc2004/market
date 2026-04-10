/**
 * =============================================================================
 * SkillMarket 类型定义文件
 * =============================================================================
 * 
 * 本文件定义了 SkillMarket 中使用的所有 TypeScript 接口类型，包括：
 * - Skill 元数据（用于 npm 包内的 skill 定义）
 * - 已安装 Skill 信息（用于本地注册表）
 * - 注册表数据结构
 * 
 * @module types
 */

// -----------------------------------------------------------------------------
// Skill 元数据接口
// -----------------------------------------------------------------------------

/**
 * Skill 元数据结构
 * 
 * 定义 npm 包中 skill 的元信息，通常存储在 package.json 的
 * skillmarket 字段或独立的 metadata.json 文件中
 * 
 * @interface SkillMetadata
 * 
 * @example
 * // package.json 中的 skillmarket 字段示例:
 * {
 *   "skillmarket": {
 *     "id": "brainstorming",
 *     "displayName": "Brainstorming",
 *     "description": "多智能体头脑风暴能力",
 *     "platforms": ["cursor", "opencode", "vscode"],
 *     "defaultVersion": "v1"
 *   }
 * }
 */
export interface SkillMetadata {
  /** Skill 唯一标识符，用于包名和命令行引用 */
  id: string;
  
  /** Skill 的友好显示名称，用于 UI 展示 */
  displayName: string;
  
  /** Skill 功能描述，说明其用途和功能 */
  description: string;
  
  /** 支持的平台列表，只有列表中的平台才能使用此 skill */
  platforms: string[];
  
  /** 默认版本标识，通常为 'v1', 'v2' 等 */
  defaultVersion: string;
}

// -----------------------------------------------------------------------------
// 已安装 Skill 接口
// -----------------------------------------------------------------------------

/**
 * 已安装 Skill 的信息结构
 * 
 * 存储在本地注册表 (registry.json) 中，
 * 记录用户已安装的 skill 及其相关信息
 * 
 * @interface InstalledSkill
 * 
 * @example
 * // registry.json 中的示例:
 * {
 *   "skills": {
 *     "brainstorming": {
 *       "id": "brainstorming",
 *       "version": "1.0.0",
 *       "installedAt": "2026-04-01T10:00:00.000Z",
 *       "platforms": ["opencode"]
 *     }
 *   }
 * }
 */
export interface InstalledSkill {
  /** Skill 唯一标识符，与 npm 包名对应 */
  id: string;
  
  /** 已安装的版本号，遵循 semver 规范 */
  version: string;
  
  /** 安装时间的 ISO 8601 格式时间戳 */
  installedAt: string;
  
  /** 安装时检测到的目标平台列表 */
  platforms: string[];
}

// -----------------------------------------------------------------------------
// 注册表数据结构
// -----------------------------------------------------------------------------

/**
 * SkillMarket 本地注册表数据结构
 * 
 * 存储在 ~/.skillmarket/registry.json 文件中，
 * 记录所有已安装的 skills 和注册表元信息
 * 
 * @interface RegistryData
 * 
 * @example
 * // 完整的 registry.json 结构:
 * {
 *   "skills": {
 *     "skill1": { id, version, installedAt, platforms },
 *     "skill2": { id, version, installedAt, platforms }
 *   },
 *   "lastUpdated": "2026-04-01T10:30:00.000Z"
 * }
 */
export interface RegistryData {
  /** 
   * 已安装 skills 的字典
   * 
   * - Key: skill ID (唯一标识符)
   * - Value: InstalledSkill 对象（包含版本、平台等信息）
   * 
   * @example
   * // 访问已安装的 skill:
   * const brainstorming = registry.skills['brainstorming'];
   * console.log(brainstorming.version); // "1.0.0"
   */
  skills: Record<string, InstalledSkill>;
  
  /** 
   * 注册表最后更新时间
   * 
   * ISO 8601 格式的时间戳，
   * 每次修改注册表时自动更新
   */
  lastUpdated: string;
}

/**
 * =============================================================================
 * SkillMarket 环境变量配置模块
 * =============================================================================
 *
 * 集中管理所有可从环境变量覆盖的配置项。
 * 所有配置都有合理的默认值，通过环境变量可覆盖。
 *
 * 支持的环境变量:
 *   SKM_NPM_SCOPE     - 主要 npm scope（默认: @itismyskillmarket）
 *   SKM_NPM_REGISTRY  - npm registry URL（默认: https://registry.npmjs.org）
 *   SKM_URL           - 个人/技能链接前缀（用于 publish 等命令的输出）
 *   SKM_NPM_SCOPES    - 搜索时尝试的 scope 列表（逗号分隔）
 *
 * @module config
 */

// -----------------------------------------------------------------------------
// npm 配置
// -----------------------------------------------------------------------------

/**
 * 主要 npm scope。
 * 当 `skm publish` 发布 skill 时使用的默认 scope。
 * 当 `skm update` 查找最新版本时的默认 scope。
 */
export const NPM_SCOPE: string = process.env.SKM_NPM_SCOPE || '@itismyskillmarket';

/**
 * 次要 npm scope。
 * 用于向后兼容已安装的旧 scope 包。
 */
export const NPM_SCOPE_FALLBACK: string = process.env.SKM_NPM_SCOPE_FALLBACK || '@wanxuchen';

/**
 * npm registry 地址。
 * 如果使用私有 registry 或镜像，可通过此变量覆盖。
 */
export const NPM_REGISTRY: string = process.env.SKM_NPM_REGISTRY || 'https://registry.npmjs.org';

/**
 * 搜索 skill 时尝试的 npm scope 列表（按优先级排序）。
 * 可通过 SKM_NPM_SCOPES 环境变量完全覆盖，逗号分隔。
 * 默认值包含目前已使用的所有 scope。
 */
const DEFAULT_SCOPES = [
  '@itismyskillmarket',
  '@wanxuchen',
  '@thisisskillmarket',
  '@this-is-skillmarket',
  '@skillmarket',
];

export const SKILL_SCOPES: string[] = process.env.SKM_NPM_SCOPES
  ? process.env.SKM_NPM_SCOPES.split(',').map(s => s.trim()).filter(Boolean)
  : DEFAULT_SCOPES;

// -----------------------------------------------------------------------------
// 链接/URL 配置
// -----------------------------------------------------------------------------

/**
 * 个人/技能基础 URL。
 * 用于 `skm publish` 等命令输出"View at"链接。
 * 例: https://www.npmjs.com/package/@itismyskillmarket/brainstorming
 *     如果设置 SKM_URL=https://my-registry.example.com/packages
 *     则显示: https://my-registry.example.com/packages/brainstorming
 */
export const SKM_URL: string = process.env.SKM_URL || `https://www.npmjs.com/package/${NPM_SCOPE}`;

/**
 * =============================================================================
 * SkillMarket 环境变量配置模块
 * =============================================================================
 *
 * 集中管理所有可从环境变量覆盖的配置项。
 * 配置优先级（高 → 低）:
 *   1. 环境变量 (SKM_NPM_SCOPE, SKM_NPM_REGISTRY, ...)
 *   2. 配置文件 ~/.skillmarket/config.json
 *   3. 硬编码默认值
 *
 * 支持的环境变量:
 *   SKM_NPM_SCOPE           - 主要 npm scope（默认: @itismyskillmarket）
 *   SKM_NPM_SCOPE_FALLBACK  - 回退 npm scope（默认: @wanxuchen）
 *   SKM_NPM_REGISTRY        - npm registry URL（默认: https://registry.npmjs.org）
 *   SKM_NPM_SCOPES          - 搜索时尝试的 scope 列表（逗号分隔）
 *   SKM_URL                 - 个人/技能链接前缀（用于 publish 等命令的输出）
 *
 * @module config
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import os from 'os';

// -----------------------------------------------------------------------------
// 配置文件同步读取
// -----------------------------------------------------------------------------

/** 配置文件路径 ~/.skillmarket/config.json */
const CONFIG_FILE_PATH = join(os.homedir(), '.skillmarket', 'config.json');

interface ConfigFile {
  npmScope?: string;
  npmScopeFallback?: string;
  npmRegistry?: string;
  npmScopes?: string;
  skmUrl?: string;
}

/** 同步读取配置文件（模块加载时执行一次） */
function loadConfigFileSync(): ConfigFile {
  try {
    if (existsSync(CONFIG_FILE_PATH)) {
      const raw = readFileSync(CONFIG_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // 配置文件不存在或格式错误，使用默认值
  }
  return {};
}

/** 从配置文件读取的值（仅作为 env var 未设置时的回退） */
const fileConfig = loadConfigFileSync();

// -----------------------------------------------------------------------------
// npm 配置
// -----------------------------------------------------------------------------

/**
 * 主要 npm scope。
 * 当 `skm publish` 发布 skill 时使用的默认 scope。
 * 当 `skm update` 查找最新版本时的默认 scope。
 *
 * 优先级: SKM_NPM_SCOPE 环境变量 > 配置文件 > 默认值
 */
export const NPM_SCOPE: string = process.env.SKM_NPM_SCOPE
  || fileConfig.npmScope
  || '@itismyskillmarket';

/**
 * 次要 npm scope。
 * 用于向后兼容已安装的旧 scope 包。
 *
 * 优先级: SKM_NPM_SCOPE_FALLBACK 环境变量 > 配置文件 > 默认值
 */
export const NPM_SCOPE_FALLBACK: string = process.env.SKM_NPM_SCOPE_FALLBACK
  || fileConfig.npmScopeFallback
  || '@wanxuchen';

/**
 * npm registry 地址。
 * 如果使用私有 registry 或镜像，可通过此变量覆盖。
 *
 * 优先级: SKM_NPM_REGISTRY 环境变量 > 配置文件 > 默认值
 */
export const NPM_REGISTRY: string = process.env.SKM_NPM_REGISTRY
  || fileConfig.npmRegistry
  || 'https://registry.npmjs.org';

/**
 * 搜索 skill 时尝试的 npm scope 列表（按优先级排序）。
 * 可通过 SKM_NPM_SCOPES 环境变量或配置文件完全覆盖，逗号分隔。
 * 默认值包含目前已使用的所有 scope。
 */
const DEFAULT_SCOPES = [
  '@itismyskillmarket',
  '@wanxuchen',
  '@thisisskillmarket',
  '@this-is-skillmarket',
  '@skillmarket',
];

const fileScopes = fileConfig.npmScopes
  ? fileConfig.npmScopes.split(',').map(s => s.trim()).filter(Boolean)
  : null;

export const SKILL_SCOPES: string[] = process.env.SKM_NPM_SCOPES
  ? process.env.SKM_NPM_SCOPES.split(',').map(s => s.trim()).filter(Boolean)
  : fileScopes || DEFAULT_SCOPES;

// -----------------------------------------------------------------------------
// 链接/URL 配置
// -----------------------------------------------------------------------------

/**
 * 个人/技能基础 URL。
 * 用于 `skm publish` 等命令输出"View at"链接。
 * 例: https://www.npmjs.com/package/@itismyskillmarket/brainstorming
 *     如果设置 SKM_URL=https://my-registry.example.com/packages
 *     则显示: https://my-registry.example.com/packages/brainstorming
 *
 * 优先级: SKM_URL 环境变量 > 配置文件 > 默认值
 */
export const SKM_URL: string = process.env.SKM_URL
  || fileConfig.skmUrl
  || `https://www.npmjs.com/package/${NPM_SCOPE}`;

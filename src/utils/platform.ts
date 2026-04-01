/**
 * =============================================================================
 * SkillMarket 平台检测模块
 * =============================================================================
 * 
 * 本模块负责检测当前运行的环境是哪个 AI 编程工具平台。
 * 通过检查环境变量来判断平台类型。
 * 
 * 支持的平台:
 * - Cursor IDE
 * - Visual Studio Code
 * - OpenAI Codex
 * - OpenCode
 * - Claude Code
 * - Antigravity
 * 
 * @module utils/platform
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import { PLATFORMS } from '../constants.js';

// -----------------------------------------------------------------------------
// 类型定义
// -----------------------------------------------------------------------------

/**
 * 平台类型
 * 
 * 从 PLATFORMS 常量推断出的联合类型，
 * 表示所有支持的平台
 * 
 * @typedef {typeof PLATFORMS[number]} Platform
 */
export type Platform = typeof PLATFORMS[number];

// -----------------------------------------------------------------------------
// 平台检测函数
// -----------------------------------------------------------------------------

/**
 * 检测当前运行环境所属的平台
 * 
 * 通过检查环境变量来判断当前运行在哪个 AI 编程工具中：
 * 
 * | 环境变量 | 平台 |
 * |---------|------|
 * | OPENCODE | opencode |
 * | CURSOR | cursor |
 * | VSCODE | vscode |
 * | CLAUDE_CODE | claude |
 * | ANTIGRAVITY | antigravity |
 * | (默认) | codex |
 * 
 * @returns {Platform} 检测到的平台标识符
 * 
 * @example
 * // 在 Cursor 中运行
 * const platform = detectPlatform();
 * console.log(platform); // 'cursor'
 * 
 * // 在 OpenCode 中运行
 * const platform = detectPlatform();
 * console.log(platform); // 'opencode'
 */
export function detectPlatform(): Platform {
  // 按优先级检查环境变量
  // 一旦找到匹配就立即返回
  
  // OpenCode 环境检测
  if (process.env.OPENCODE) return 'opencode';
  
  // Cursor 环境检测
  if (process.env.CURSOR) return 'cursor';
  
  // VSCode 环境检测
  if (process.env.VSCODE) return 'vscode';
  
  // Claude Code 环境检测
  if (process.env.CLAUDE_CODE) return 'claude';
  
  // Antigravity 环境检测
  if (process.env.ANTIGRAVITY) return 'antigravity';
  
  // 默认返回 codex（作为通用 fallback）
  return 'codex';
}

/**
 * 验证平台名称是否有效
 * 
 * 使用类型守卫（Type Guard）模式，
 * 可以在运行时验证字符串是否是有效的平台标识符
 * 
 * @param {string} name - 待验证的平台名称
 * @returns {boolean} 如果是有效平台返回 true，否则返回 false
 * 
 * @example
 * if (isValidPlatform('opencode')) {
 *   // 这里 TypeScript 知道 name 的类型收窄为 Platform
 *   console.log(`Valid platform: ${name}`);
 * }
 */
export function isValidPlatform(name: string): name is Platform {
  // Array.includes 需要类型断言，因为我们使用 as const 定义的数组
  return PLATFORMS.includes(name as Platform);
}

/**
 * 从用户输入获取平台类型
 * 
 * 将用户输入转换为有效的 Platform 类型，
 * 如果输入无效则返回 null
 * 
 * @param {string} name - 用户输入的平台名称
 * @returns {Platform | null} 有效的平台或 null
 * 
 * @example
 * const platform = getPlatformFromInput('OpenCode');
 * // 返回 'opencode'（小写化）
 * 
 * const invalid = getPlatformFromInput('unknown');
 * // 返回 null
 */
export function getPlatformFromInput(name: string): Platform | null {
  // 先转为小写，再验证是否有效
  const lowerName = name.toLowerCase();
  
  // 如果是有效平台，返回小写版本
  if (isValidPlatform(lowerName)) {
    return lowerName as Platform;
  }
  
  // 无效输入返回 null
  return null;
}

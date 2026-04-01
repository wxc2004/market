/**
 * =============================================================================
 * SkillMarket 目录工具模块
 * =============================================================================
 * 
 * 本模块提供获取和创建 SkillMarket 目录结构的工具函数。
 * 所有路径都遵循 ~/.skillmarket/ 的主目录结构。
 * 
 * 目录结构:
 *   ~/.skillmarket/
 *   ├── registry.json     # 注册表文件
 *   ├── cache/            # npm 包缓存
 *   ├── skills/           # 已安装的 skills
 *   └── platform-links/   # 平台适配软链接
 * 
 * @module utils/dirs
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import os from 'os';           // Node.js OS 模块，用于获取用户主目录
import path from 'path';       // Node.js 路径模块
import fs from 'fs-extra';    // fs-extra，提供 Promise 化的文件系统操作
import { 
  MARKET_DIR,        // 主目录名称常量
  SUBDIRS,           // 子目录名称常量
  REGISTRY_FILE      // 注册表文件名常量
} from '../constants.js';

// -----------------------------------------------------------------------------
// 路径获取函数
// -----------------------------------------------------------------------------

/**
 * 获取 SkillMarket 主目录路径
 * 
 * 返回 ~/.skillmarket 路径，这是所有 skill 相关数据的存储根目录
 * 
 * @returns {string} 技能市场主目录的绝对路径
 * 
 * @example
 * const home = getMarketHome();
 * // 在 Linux/Mac: '/home/username/.skillmarket'
 * // 在 Windows: 'C:\Users\username\.skillmarket'
 */
export function getMarketHome(): string {
  return path.join(os.homedir(), MARKET_DIR);
}

/**
 * 获取 npm 包缓存目录路径
 * 
 * 用于存储从 npm 下载的 skill 包（.tgz 文件）和解压后的内容
 * 
 * @returns {string} 缓存目录的绝对路径
 * 
 * @example
 * const cacheDir = getCacheDir();
 * // '~/.skillmarket/cache'
 */
export function getCacheDir(): string {
  return path.join(getMarketHome(), SUBDIRS.CACHE);
}

/**
 * 获取已安装 skills 的主存储目录路径
 * 
 * 所有安装的 skill 都会复制/链接到这个目录，
 * 每个 skill 有独立的子目录，内部包含版本目录和 latest 软链接
 * 
 * @returns {string} skills 存储目录的绝对路径
 * 
 * @example
 * const skillsDir = getSkillsDir();
 * // '~/.skillmarket/skills'
 * 
 * // 典型目录结构:
 * // skills/
 * // ├── brainstorming/
 * // │   ├── latest -> 1.0.0/
 * // │   └── 1.0.0/
 * // └── weather/
 * //     ├── latest -> 2.0.0/
 * //     └── 2.0.0/
 */
export function getSkillsDir(): string {
  return path.join(getMarketHome(), SUBDIRS.SKILLS);
}

/**
 * 获取平台适配层软链接目录路径
 * 
 * 这个目录为每个支持的平台创建独立的子目录，
 * 里面包含指向对应平台 skill 文件的软链接
 * 
 * @returns {string} 平台链接目录的绝对路径
 * 
 * @example
 * const platformLinksDir = getPlatformLinksDir();
 * // '~/.skillmarket/platform-links'
 * 
 * // 典型目录结构:
 * // platform-links/
 * // ├── cursor/
 * // │   └── skills/
 * // │       └── brainstorming -> ../../skills/brainstorming/latest/cursor
 * // ├── opencode/
 * // │   └── skills/
 * // │       └── brainstorming -> ../../skills/brainstorming/latest/opencode
 * // └── ...
 */
export function getPlatformLinksDir(): string {
  return path.join(getMarketHome(), SUBDIRS.PLATFORM_LINKS);
}

/**
 * 获取本地注册表文件路径
 * 
 * 注册表文件存储所有已安装 skill 的元信息，
 * 是一个 JSON 格式的文件
 * 
 * @returns {string} 注册表文件的绝对路径
 * 
 * @example
 * const registryPath = getRegistryPath();
 * // '~/.skillmarket/registry.json'
 */
export function getRegistryPath(): string {
  return path.join(getMarketHome(), REGISTRY_FILE);
}

// -----------------------------------------------------------------------------
// 目录创建函数
// -----------------------------------------------------------------------------

/**
 * 确保 SkillMarket 所有必要目录都已创建
 * 
 * 在首次使用或安装 skill 之前调用此函数，
 * 确保所有目录结构都存在
 * 
 * @returns {Promise<void>} 创建完成后 resolve
 * 
 * @example
 * // 安装 skill 前确保目录存在
 * await ensureMarketDirs();
 * 
 * // 这会依次创建:
 * // ~/.skillmarket/cache/
 * // ~/.skillmarket/skills/
 * // ~/.skillmarket/platform-links/
 */
export async function ensureMarketDirs(): Promise<void> {
  // 使用 fs-extra 的 ensureDir 确保目录存在
  // 如果目录已存在则不进行任何操作
  // 如果父目录不存在则递归创建
  
  await fs.ensureDir(getCacheDir());
  await fs.ensureDir(getSkillsDir());
  await fs.ensureDir(getPlatformLinksDir());
  
  // 注意: 注册表目录通过 getRegistryPath() 获取路径，
  // 实际文件由 registry.ts 模块在写入时自动创建
}

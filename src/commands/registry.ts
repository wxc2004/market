/**
 * =============================================================================
 * SkillMarket 本地注册表管理模块
 * =============================================================================
 * 
 * 本模块负责管理 SkillMarket 的本地注册表（registry.json），
 * 实现以下功能：
 * - 加载注册表数据
 * - 保存注册表变更
 * - 查询已安装的 skills
 * - 检查 skill 是否已安装
 * 
 * 注册表存储位置: ~/.skillmarket/registry.json
 * 
 * @module commands/registry
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import fs from 'fs-extra';           // fs-extra，Promise 化的文件系统操作
import { getRegistryPath, getMarketHome } from '../utils/dirs.js';  // 目录工具函数
import type { RegistryData, InstalledSkill } from '../types.js';    // 类型定义

// -----------------------------------------------------------------------------
// 常量定义
// -----------------------------------------------------------------------------

/**
 * 默认注册表数据
 * 
 * 当注册表文件不存在或读取失败时使用此默认值
 * 初始化一个空的 skills 字典和当前时间戳
 */
const DEFAULT_REGISTRY: RegistryData = {
  /** 空的 skills 字典，初始没有任何已安装的 skill */
  skills: {},
  
  /** 注册表创建时间 */
  lastUpdated: new Date().toISOString()
};

// -----------------------------------------------------------------------------
// 加载注册表
// -----------------------------------------------------------------------------

/**
 * 加载本地注册表
 * 
 * 从 ~/.skillmarket/registry.json 读取注册表数据。
 * 如果文件不存在或读取失败，返回默认的空注册表。
 * 
 * @returns {Promise<RegistryData>} 注册表数据对象
 * 
 * @example
 * const registry = await loadRegistry();
 * console.log(`已安装 ${Object.keys(registry.skills).length} 个 skills`);
 */
export async function loadRegistry(): Promise<RegistryData> {
  const registryPath = getRegistryPath();
  
  // 检查注册表文件是否存在
  if (!(await fs.pathExists(registryPath))) {
    // 文件不存在，返回默认空注册表
    return DEFAULT_REGISTRY;
  }
  
  try {
    // 读取并解析 JSON 文件
    const data = await fs.readJson(registryPath);
    return data as RegistryData;
  } catch {
    // 读取或解析失败，返回默认空注册表
    // 不抛出错误，保证程序继续运行
    return DEFAULT_REGISTRY;
  }
}

// -----------------------------------------------------------------------------
// 保存注册表
// -----------------------------------------------------------------------------

/**
 * 保存注册表到磁盘
 * 
 * 将注册表数据写入 ~/.skillmarket/registry.json 文件。
 * 保存时自动更新 lastUpdated 字段为当前时间。
 * 
 * @param {RegistryData} registry - 要保存的注册表数据
 * @returns {Promise<void>} 保存完成后 resolve
 * 
 * @example
 * const registry = await loadRegistry();
 * registry.skills['brainstorming'] = {
 *   id: 'brainstorming',
 *   version: '1.0.0',
 *   installedAt: new Date().toISOString(),
 *   platforms: ['opencode']
 * };
 * await saveRegistry(registry);
 */
export async function saveRegistry(registry: RegistryData): Promise<void> {
  // 确保主目录存在
  await fs.ensureDir(getMarketHome());
  
  // 自动更新最后修改时间
  registry.lastUpdated = new Date().toISOString();
  
  // 写入 JSON 文件，格式化输出便于调试
  await fs.writeJson(getRegistryPath(), registry, { spaces: 2 });
}

// -----------------------------------------------------------------------------
// 查询函数
// -----------------------------------------------------------------------------

/**
 * 获取所有已安装的 skills 列表
 * 
 * 从注册表中提取所有已安装 skill 的详细信息
 * 
 * @returns {Promise<InstalledSkill[]>} 已安装 skills 的数组
 * 
 * @example
 * const skills = await getInstalledSkills();
 * skills.forEach(skill => {
 *   console.log(`${skill.id}@${skill.version}`);
 * });
 */
export async function getInstalledSkills(): Promise<InstalledSkill[]> {
  const registry = await loadRegistry();
  
  // Object.values 返回所有 skill 对象的数组
  return Object.values(registry.skills);
}

/**
 * 检查指定 skill 是否已安装
 * 
 * 用于判断某个 skill 是否在本地注册表中
 * 
 * @param {string} skillId - Skill 的唯一标识符
 * @returns {Promise<boolean>} 已安装返回 true，否则返回 false
 * 
 * @example
 * const installed = await isSkillInstalled('brainstorming');
 * if (installed) {
 *   console.log('Brainstorming 已安装');
 * } else {
 *   console.log('Brainstorming 未安装');
 * }
 */
export async function isSkillInstalled(skillId: string): Promise<boolean> {
  const registry = await loadRegistry();
  
  // 使用 in 操作符检查 skillId 是否在 skills 字典的键中
  return skillId in registry.skills;
}

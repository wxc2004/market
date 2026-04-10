/**
 * =============================================================================
 * SkillMarket 安装命令模块
 * =============================================================================
 * 
 * 本模块实现 `skm install` 命令，用于安装 skill 到本地。
 * 
 * 安装流程:
 * 1. 确保目录结构存在
 * 2. 从 npm 获取包信息
 * 3. 下载包到缓存
 * 4. 解压并复制到 skills 目录
 * 5. 创建 latest 软链接
 * 6. 更新本地注册表
 * 
 * 安装后的目录结构:
 * ~/.skillmarket/
 * ├── skills/
 * │   └── <skillId>/
 * │       ├── latest -> <version>/  (软链接)
 * │       └── <version>/
 * │           ├── SKILL.md
 * │           └── metadata.json
 * └── ...
 * 
 * @module commands/install
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import fs from 'fs-extra';          // 文件系统操作
import path from 'path';             // 路径处理
import { exec } from 'child_process'; // 执行 shell 命令
import { promisify } from 'util';    // Promise 化工具

// 模块导入
import { fetchNpmPackage } from './npm.js';         // npm 查询
import { loadRegistry, saveRegistry } from './registry.js';  // 注册表操作
import { getCacheDir, getSkillsDir, ensureMarketDirs } from '../utils/dirs.js';  // 目录工具
import { detectPlatform, getPlatformFromInput, isValidPlatform, type Platform } from '../utils/platform.js';  // 平台检测
import { syncPlatformLinks } from './sync.js';  // 同步命令
import { LATEST_LINK, PLATFORMS } from '../constants.js';       // 常量
import type { InstalledSkill } from '../types.js';    // 类型定义

// 将 exec 转为 Promise 形式
const execAsync = promisify(exec);

// -----------------------------------------------------------------------------
// 安装函数
// -----------------------------------------------------------------------------

/**
 * 安装指定的 skill
 * 
 * @param {string} skillId - Skill 标识符（支持短格式或 scoped 格式）
 * @param {string} [version] - 指定版本号（可选，不指定则安装最新版本）
 * @param {string} [targetPlatform] - 目标平台（可选，不指定则使用当前检测到的平台）
 * @returns {Promise<void>}
 * 
 * @example
 * // 安装最新版本的 brainstorming
 * await installSkill('brainstorming');
 * 
 * // 安装指定版本
 * await installSkill('brainstorming', '1.0.0');
 * 
 * // 安装到指定平台
 * await installSkill('brainstorming', undefined, 'opencode');
 * 
 * // 安装 scoped 包
 * await installSkill('@custom/skill');
 */
export async function installSkill(
  skillId: string, 
  version?: string,
  targetPlatform?: string
): Promise<void> {
  // ==========================================================================
  // 步骤 0: 准备
  // ==========================================================================
  
  // 确保所有必要的目录都已创建
  await ensureMarketDirs();
  
  // 转换包名格式
  const packageName = skillId.startsWith('@') 
    ? skillId 
    : `@skillmarket/${skillId}`;
  
  console.log(`Installing ${packageName}${version ? `@${version}` : ''}...`);
  
  // ==========================================================================
  // 步骤 1: 获取包信息
  // ==========================================================================
  
  // 从 npm 查询包的元信息
  const pkgInfo = await fetchNpmPackage(packageName);
  if (!pkgInfo) {
    throw new Error(`Package ${packageName} not found`);
  }
  
  // 确定要安装的版本（用户指定版本 > 最新版本）
  const targetVersion = version || pkgInfo['dist-tags']?.latest;
  if (!targetVersion) {
    throw new Error(`No version found for ${packageName}`);
  }
  
  // ==========================================================================
  // 步骤 2: 下载包到缓存
  // ==========================================================================
  
  const cacheDir = getCacheDir();
  
  // 计算目标缓存目录路径
  // 例如: ~/.skillmarket/cache/@skillmarket%2Fbrainstorming@1.0.0/
  const targetDir = path.join(cacheDir, `${packageName}@${targetVersion}`);
  
  // 如果缓存已存在，跳过下载
  if (!(await fs.pathExists(targetDir))) {
    console.log('Downloading package...');
    await fs.ensureDir(cacheDir);
    
    try {
      // 使用 npm pack 下载包到指定目录
      // npm pack 会生成 .tgz 文件
      await execAsync(`npm pack ${packageName}@${targetVersion} --pack-destination ${cacheDir}`);
      
      // 查找下载的 tarball 文件
      const files = await fs.readdir(cacheDir);
      
      // npm pack 生成的文件名格式: <package-name>-<version>.tgz
      // scoped 包格式: @scope-package-name-<version>.tgz
      const tarball = files.find(f => 
        f.endsWith('.tgz') && 
        f.includes(packageName.replace('/', '-'))
      );
      
      if (tarball) {
        // 解压 tarball
        await execAsync(`tar -xzf "${path.join(cacheDir, tarball)}" -C "${cacheDir}"`);
        
        // 删除 tarball（不再需要）
        await fs.remove(path.join(cacheDir, tarball));
        
        // npm 解压后目录名固定为 'package'，需要重命名为目标版本目录
        const extractedDir = path.join(cacheDir, 'package');
        const finalDir = targetDir;
        
        // 移动并覆盖（如果已存在）
        await fs.move(extractedDir, finalDir, { overwrite: true });
      }
    } catch (err) {
      throw new Error(`Failed to download package: ${err}`);
    }
  }
  
  // ==========================================================================
  // 步骤 3: 复制到 skills 目录
  // ==========================================================================
  
  const skillsDir = getSkillsDir();
  
  // 创建版本目录: ~/.skillmarket/skills/<skillId>@<version>/
  const skillVersionDir = path.join(skillsDir, `${skillId}@${targetVersion}`);
  
  console.log('Setting up skill...');
  await fs.ensureDir(skillVersionDir);
  
  // 从缓存复制必要的文件到 skills 目录
  const pkgRoot = targetDir;
  
  // 复制 SKILL.md（skill 定义文件）
  if (await fs.pathExists(path.join(pkgRoot, 'SKILL.md'))) {
    await fs.copy(
      path.join(pkgRoot, 'SKILL.md'), 
      path.join(skillVersionDir, 'SKILL.md')
    );
  }
  
  // 复制 metadata.json（可选元数据文件）
  if (await fs.pathExists(path.join(pkgRoot, 'metadata.json'))) {
    await fs.copy(
      path.join(pkgRoot, 'metadata.json'), 
      path.join(skillVersionDir, 'metadata.json')
    );
  }
  
  // ==========================================================================
  // 步骤 4: 创建 latest 软链接
  // ==========================================================================
  
  // skill 主目录: ~/.skillmarket/skills/<skillId>/
  const skillDir = path.join(skillsDir, skillId);
  await fs.ensureDir(skillDir);
  
  // latest 软链接路径: ~/.skillmarket/skills/<skillId>/latest
  const latestLink = path.join(skillDir, LATEST_LINK);
  
  try {
    // 删除已存在的软链接（如果有）
    await fs.remove(latestLink);
    
    // 创建软链接指向版本目录
    // 'junction' 类型在 Windows 上不需要管理员权限
    await fs.symlink(skillVersionDir, latestLink, 'junction');
  } catch {
    // Windows 上 junction 可能失败，降级为目录复制
    await fs.copy(skillVersionDir, path.join(skillDir, LATEST_LINK), { overwrite: true });
  }
  
  // ==========================================================================
  // 步骤 5: 确定目标平台
  // ==========================================================================
  
  // 确定实际使用的平台
  let finalPlatform: Platform;
  
  if (targetPlatform) {
    // 验证用户指定的目标平台
    const parsed = getPlatformFromInput(targetPlatform);
    if (!parsed) {
      throw new Error(`Invalid platform: ${targetPlatform}. Valid platforms: ${PLATFORMS.join(', ')}`);
    }
    finalPlatform = parsed;
  } else {
    // 使用当前检测到的平台
    finalPlatform = detectPlatform();
  }
  
  console.log(`Target platform: ${finalPlatform}`);
  
  // ==========================================================================
  // 步骤 6: 更新注册表
  // ==========================================================================
  
  const registry = await loadRegistry();
  
  // 获取现有平台列表（如果 skill 已安装）
  const existingSkill = registry.skills[skillId];
  const existingPlatforms = existingSkill?.platforms || [];
  
  // 添加/更新注册表中的 skill 记录
  registry.skills[skillId] = {
    id: skillId,
    version: targetVersion,
    installedAt: new Date().toISOString(),
    platforms: existingPlatforms.includes(finalPlatform as string) 
      ? existingPlatforms 
      : [...existingPlatforms, finalPlatform as string]
  } as InstalledSkill;
  
  // 保存注册表
  await saveRegistry(registry);
  
  // ==========================================================================
  // 步骤 7: 同步到指定平台
  // ==========================================================================
  
  console.log(`Syncing to ${finalPlatform}...`);
  await syncPlatformLinks(finalPlatform);
  
  // ==========================================================================
  // 完成
  // ==========================================================================
  
  console.log(`\n✅ ${skillId}@${targetVersion} installed successfully!`);
  console.log(`   Use "skm info ${skillId}" for more details`);
}

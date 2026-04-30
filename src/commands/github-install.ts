/**
 * =============================================================================
 * GitHub Skill 安装模块
 * =============================================================================
 * 
 * 本模块实现从 GitHub 仓库安装 skill 的功能。
 * 
 * 功能：
 * 1. 检测 GitHub URL 格式
 * 2. 从 GitHub API 获取仓库内容
 * 3. 检测 skill 本体（SKILL.md、package.json）
 * 4. 判断所属平台（OpenCode/Cursor/VSCode/Claude 等）
 * 5. 格式转换（如果不全，则补充平台特定文件）
 * 6. 版本控制（支持 branch/tag/commit）
 * 
 * @module commands/github-install
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import fs from 'fs-extra';
import path from 'path';
import { getSkillsDir, ensureMarketDirs } from '../utils/dirs.js';
import { loadRegistry, saveRegistry } from './registry.js';
import { detectPlatforms, getAdapterByPlatform } from '../adapters/index.js';
import type { Platform } from '../constants.js';
import type { PlatformAdapter, InstalledSkill } from '../types.js';

// -----------------------------------------------------------------------------
// GitHub URL 解析
// -----------------------------------------------------------------------------

/**
 * GitHub URL 模式
 * 支持格式：
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch/path
 * - owner/repo
 * - owner/repo#branch
 * - owner/repo@commit
 */
const GITHUB_URL_PATTERNS = [
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)(?:\/(.+))?)?$/,
  /^([^/]+)\/([^/]+)(?:#(.+))?$/,  // owner/repo#branch
  /^([^/]+)\/([^/]+)@(.+)$/,  // owner/repo@commit
];

export interface GitHubSkillSource {
  owner: string;
  repo: string;
  branch?: string;
  commit?: string;
  path?: string;  // 子目录路径
}

/**
 * 解析 GitHub URL 或简写
 * 
 * @param {string} input - 用户输入（URL 或 owner/repo 格式）
 * @returns {GitHubSkillSource | null} 解析结果
 */
export function parseGitHubUrl(input: string): GitHubSkillSource | null {
  // 移除尾部斜杠
  input = input.replace(/\/$/, '');
  
  for (const pattern of GITHUB_URL_PATTERNS) {
    const match = input.match(pattern);
    if (match) {
      const owner = match[1];
      const repo = match[2].replace(/\.git$/, '');
      const branch = match[3] || 'main';  // 默认 main 分支
      const commitOrPath = match[4] || match[3];
      const path = match[5] || undefined;
      
      return {
        owner,
        repo,
        branch: commitOrPath && !commitOrPath.includes('/') ? commitOrPath : branch,
        commit: commitOrPath?.match(/^[0-9a-f]{40}$/) ? commitOrPath : undefined,
        path
      };
    }
  }
  
  return null;
}

// -----------------------------------------------------------------------------
// GitHub API 查询
// -----------------------------------------------------------------------------

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
  content?: string;
}

/**
 * 从 GitHub API 获取文件内容
 * 
 * @param {GitHubSkillSource} source - GitHub 源信息
 * @param {string} filePath - 文件路径
 * @returns {Promise<string | null>} 文件内容
 */
async function fetchGitHubFile(
  source: GitHubSkillSource,
  filePath: string
): Promise<string | null> {
  const ref = source.commit || source.branch || 'main';
  const url = `https://api.github.com/repos/${source.owner}/${source.repo}/contents/${filePath}?ref=${ref}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'SkillMarket'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * 从 GitHub API 获取目录列表
 * 
 * @param {GitHubSkillSource} source - GitHub 源信息
 * @param {string} dirPath - 目录路径
 * @returns {Promise<GitHubFile[]>} 文件列表
 */
async function fetchGitHubDir(
  source: GitHubSkillSource,
  dirPath: string = ''
): Promise<GitHubFile[]> {
  const ref = source.commit || source.branch || 'main';
  const url = `https://api.github.com/repos/${source.owner}/${source.repo}/contents/${dirPath}?ref=${ref}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SkillMarket'
      }
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data as GitHubFile[] : [];
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// Skill 检测
// -----------------------------------------------------------------------------

export interface DetectedSkill {
  hasSkillMd: boolean;
  hasPackageJson: boolean;
  hasMetadataJson: boolean;
  platforms: Platform[];
  files: string[];  // 检测到的相关文件
  skillId?: string;
  displayName?: string;
  description?: string;
}

/**
 * 检测 GitHub 仓库中的 skill 信息
 * 
 * @param {GitHubSkillSource} source - GitHub 源信息
 * @returns {Promise<DetectedSkill>} 检测结果
 */
export async function detectSkillFromGitHub(
  source: GitHubSkillSource
): Promise<DetectedSkill> {
  const result: DetectedSkill = {
    hasSkillMd: false,
    hasPackageJson: false,
    hasMetadataJson: false,
    platforms: [],
    files: []
  };
  
  const basePath = source.path || '';
  
  // 1. 检查 SKILL.md
  const skillMdPath = basePath ? `${basePath}/SKILL.md` : 'SKILL.md';
  const skillMdContent = await fetchGitHubFile(source, skillMdPath);
  if (skillMdContent !== null) {
    result.hasSkillMd = true;
    result.files.push(skillMdPath);
  }
  
  // 2. 检查 package.json
  const packageJsonPath = basePath ? `${basePath}/package.json` : 'package.json';
  const packageJsonContent = await fetchGitHubFile(source, packageJsonPath);
  if (packageJsonContent !== null) {
    result.hasPackageJson = true;
    result.files.push(packageJsonPath);
    
    try {
      const pkg = JSON.parse(packageJsonContent);
      result.skillId = pkg.name?.split('/').pop() || pkg.skillmarket?.id;
      result.displayName = pkg.skillmarket?.displayName;
      result.description = pkg.description;
      
      // 提取支持的平台
      if (pkg.skillmarket?.platforms) {
        result.platforms = pkg.skillmarket.platforms as Platform[];
      }
    } catch {
      // JSON 解析失败，忽略
    }
  }
  
  // 3. 检查 metadata.json
  const metadataPath = basePath ? `${basePath}/metadata.json` : 'metadata.json';
  const metadataContent = await fetchGitHubFile(source, metadataPath);
  if (metadataContent !== null) {
    result.hasMetadataJson = true;
    result.files.push(metadataPath);
  }
  
  // 4. 检查平台特定目录
  const platformDirs = ['opencode', 'cursor', 'vscode', 'claude', 'codex', 'antigravity'];
  for (const dir of platformDirs) {
    const dirPath = basePath ? `${basePath}/${dir}` : dir;
    const files = await fetchGitHubDir(source, dirPath);
    if (files.length > 0) {
      const platform = dir as Platform;
      if (!result.platforms.includes(platform)) {
        result.platforms.push(platform);
      }
      result.files.push(dirPath);
    }
  }
  
  // 5. 如果没有检测到平台，默认为 opencode
  if (result.platforms.length === 0) {
    result.platforms.push('opencode');
  }
  
  return result;
}

// -----------------------------------------------------------------------------
// 格式转换
// -----------------------------------------------------------------------------

/**
 * 为缺失的平台生成适配文件
 * 
 * @param {string} skillId - Skill ID
 * @param {Platform[]} existingPlatforms - 已存在的平台
 * @param {Platform[]} targetPlatforms - 目标平台
 * @param {string} sourceDir - 源目录（包含 SKILL.md）
 * @returns {Promise<void>}
 */
async function generatePlatformAdapters(
  skillId: string,
  existingPlatforms: Platform[],
  targetPlatforms: Platform[],
  sourceDir: string
): Promise<void> {
  const skillsDir = getSkillsDir();
  const skillVersionDir = path.join(skillsDir, `${skillId}@github`);
  
  for (const platform of targetPlatforms) {
    if (existingPlatforms.includes(platform)) {
      continue;  // 平台已存在，跳过
    }
    
    // 创建平台目录
    const platformDir = path.join(skillVersionDir, platform);
    await fs.ensureDir(platformDir);
    
    // 复制 SKILL.md（如果存在）
    const sourceSkillMd = path.join(sourceDir, 'SKILL.md');
    const targetSkillMd = path.join(platformDir, 'SKILL.md');
    if (await fs.pathExists(sourceSkillMd)) {
      await fs.copy(sourceSkillMd, targetSkillMd);
    }
    
    // 创建平台特定的配置文件（如果需要）
    if (platform === 'opencode' || platform === 'cursor' || platform === 'codex' || platform === 'antigravity') {
      // OpenCode 兼容平台，只需要 SKILL.md
    } else if (platform === 'vscode') {
      // VSCode 可能需要 skill.json
      const skillJson = {
        name: skillId,
        description: `Skill: ${skillId}`,
        version: '1.0.0'
      };
      await fs.writeJson(path.join(platformDir, 'skill.json'), skillJson, { spaces: 2 });
    } else if (platform === 'claude') {
      // Claude Code 可能需要 skill.json
      const skillJson = {
        name: skillId,
        description: `Skill: ${skillId}`,
        version: '1.0.0'
      };
      await fs.writeJson(path.join(platformDir, 'skill.json'), skillJson, { spaces: 2 });
    }
  }
}

// -----------------------------------------------------------------------------
// 主安装函数
// -----------------------------------------------------------------------------

export interface GitHubInstallOptions {
  platforms?: string[];  // 目标平台（留空则使用检测到的平台）
  force?: boolean;       // 强制覆盖
  branch?: string;       // 指定分支
  commit?: string;       // 指定 commit
}

/**
 * 从 GitHub 安装 skill
 * 
 * @param {string} input - GitHub URL 或 owner/repo 格式
 * @param {GitHubInstallOptions} [options] - 安装选项
 * @returns {Promise<void>}
 * 
 * @example
 * // 从 GitHub 安装
 * await installFromGitHub('owner/repo');
 * 
 * // 指定分支
 * await installFromGitHub('owner/repo#dev');
 * 
 * // 指定 commit
 * await installFromGitHub('owner/repo@abc123');
 * 
 * // 安装到特定平台
 * await installFromGitHub('owner/repo', { platforms: ['opencode', 'vscode'] });
 */
export async function installFromGitHub(
  input: string,
  options?: GitHubInstallOptions
): Promise<void> {
  // ==========================================================================
  // 步骤 1: 解析 GitHub URL
  // ==========================================================================
  
  let source = parseGitHubUrl(input);
  if (!source) {
    throw new Error(`Invalid GitHub URL or format: ${input}`);
  }
  
  // 覆盖分支/commit（如果命令行指定）
  if (options?.branch) source.branch = options.branch;
  if (options?.commit) source.commit = options.commit;
  
  console.log(`Installing from GitHub: ${source.owner}/${source.repo}`);
  if (source.branch) console.log(`  Branch: ${source.branch}`);
  if (source.commit) console.log(`  Commit: ${source.commit}`);
  if (source.path) console.log(`  Path: ${source.path}`);
  
  // ==========================================================================
  // 步骤 2: 检测 skill
  // ==========================================================================
  
  console.log('\nDetecting skill...');
  const detected = await detectSkillFromGitHub(source);
  
  if (!detected.hasSkillMd && !detected.hasPackageJson) {
    throw new Error('No skill found in this repository (missing SKILL.md and package.json)');
  }
  
  console.log(`  SKILL.md: ${detected.hasSkillMd ? '✅' : '❌'}`);
  console.log(`  package.json: ${detected.hasPackageJson ? '✅' : '❌'}`);
  console.log(`  Detected platforms: ${detected.platforms.join(', ') || 'none'}`);
  
  // ==========================================================================
  // 步骤 3: 确定 skill ID 和版本
  // ==========================================================================
  
  const skillId = detected.skillId || source.repo;
  const version = `github-${source.commit?.substring(0, 7) || source.branch || 'main'}`;
  
  console.log(`\nSetting up skill: ${skillId}@${version}`);
  
  // ==========================================================================
  // 步骤 4: 下载文件到本地
  // ==========================================================================
  
  await ensureMarketDirs();
  const skillsDir = getSkillsDir();
  const skillVersionDir = path.join(skillsDir, `${skillId}@${version}`);
  
  await fs.ensureDir(skillVersionDir);
  
  console.log('Downloading files...');
  
  // 下载 SKILL.md
  const basePath = source.path || '';
  const skillMdPath = basePath ? `${basePath}/SKILL.md` : 'SKILL.md';
  const skillMdContent = await fetchGitHubFile(source, skillMdPath);
  if (skillMdContent) {
    await fs.writeFile(path.join(skillVersionDir, 'SKILL.md'), skillMdContent);
    console.log('  ✅ SKILL.md');
  }
  
  // 下载 package.json
  const packageJsonPath = basePath ? `${basePath}/package.json` : 'package.json';
  const packageJsonContent = await fetchGitHubFile(source, packageJsonPath);
  if (packageJsonContent) {
    await fs.writeFile(path.join(skillVersionDir, 'package.json'), packageJsonContent);
    console.log('  ✅ package.json');
  }
  
  // 下载 metadata.json
  const metadataPath = basePath ? `${basePath}/metadata.json` : 'metadata.json';
  const metadataContent = await fetchGitHubFile(source, metadataPath);
  if (metadataContent) {
    await fs.writeFile(path.join(skillVersionDir, 'metadata.json'), metadataContent);
    console.log('  ✅ metadata.json');
  }
  
  // ==========================================================================
  // 步骤 5: 格式转换（如果不全）
  // ==========================================================================
  
  const targetPlatforms = (options?.platforms as Platform[]) || detected.platforms;
  const existingPlatforms = detected.platforms;
  
  const missingPlatforms = targetPlatforms.filter(p => !existingPlatforms.includes(p));
  
  if (missingPlatforms.length > 0) {
    console.log(`\nGenerating adapters for missing platforms: ${missingPlatforms.join(', ')}`);
    await generatePlatformAdapters(skillId, existingPlatforms, targetPlatforms, skillVersionDir);
    console.log('  ✅ Platform adapters generated');
  }
  
  // ==========================================================================
  // 步骤 6: 创建 latest 软链接
  // ==========================================================================
  
  const skillDir = path.join(skillsDir, skillId);
  await fs.ensureDir(skillDir);
  
  const latestLink = path.join(skillDir, 'latest');
  try {
    await fs.remove(latestLink);
    await fs.symlink(skillVersionDir, latestLink, 'junction');
  } catch {
    await fs.copy(skillVersionDir, path.join(skillDir, 'latest'), { overwrite: true });
  }
  
  // ==========================================================================
  // 步骤 6: 安装到目标平台
  // ==========================================================================
  
  console.log(`\nInstalling to ${targetPlatforms.length} platform(s)...\n`);
  
  const results: { name: string; status: 'installed' | 'skipped' | 'failed'; error?: string }[] = [];
  
  for (const platform of targetPlatforms) {
    const adapter = getAdapterByPlatform(platform as Platform);
    if (!adapter) {
      console.log(`${platform.padEnd(12)} ❌  Unknown platform`);
      results.push({ name: platform, status: 'failed', error: 'Unknown platform' });
      continue;
    }
    
    try {
      const isInstalled = await adapter.isInstalled(skillId);
      
      if (isInstalled && !options?.force) {
        console.log(`${adapter.name.padEnd(12)} ⚠️  Already installed (use --force to overwrite)`);
        results.push({ name: adapter.name, status: 'skipped' });
        continue;
      }
      
      // 安装 skill 到平台目录
      await adapter.install(skillId, skillVersionDir);
      console.log(`${adapter.name.padEnd(12)} ✅  Installed successfully`);
      results.push({ name: adapter.name, status: 'installed' });
    } catch (error) {
      console.log(`${adapter.name.padEnd(12)} ❌  Failed: ${error}`);
      results.push({ name: adapter.name, status: 'failed', error: String(error) });
    }
  }
  
  // 显示摘要
  const installed = results.filter(r => r.status === 'installed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`\n📊 Summary: ${installed} installed, ${skipped} skipped, ${failed} failed`);
  
  // ==========================================================================
  
  // 这里复用 install.ts 中的平台安装逻辑
  // 由于跨模块依赖，我将简化实现
  console.log(`\nInstalling to platforms: ${targetPlatforms.join(', ')}`);
  console.log('  (Platform installation logic needs to be completed)');
  
  // TODO: 调用平台适配器的 install 方法
  
  // ==========================================================================
  // 步骤 8: 更新注册表
  // ==========================================================================
  
  const registry = await loadRegistry();
  
  registry.skills[skillId] = {
    id: skillId,
    version: version,
    installedAt: new Date().toISOString(),
    platforms: targetPlatforms
  } as InstalledSkill;
  
  await saveRegistry(registry);
  
  // ==========================================================================
  // 完成
  // ==========================================================================
  
  console.log(`\n✅ ${skillId}@${version} installed successfully from GitHub!`);
  console.log(`   Source: ${source.owner}/${source.repo}`);
}

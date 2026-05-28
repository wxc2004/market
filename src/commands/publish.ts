/**
 * =============================================================================
 * SkillMarket 发布命令模块
 * =============================================================================
 * 
 * 本模块实现 `skm publish` 命令，用于发布 skill 到 npm。
 * 
 * 发布流程:
 * 1. 验证 skill 目录存在
 * 2. 运行 npm install（如果需要）
 * 3. 更新版本号（可选）
 * 4. 发布到 npm（--access=public）
 * 
 * 用法:
 * skm publish <skill-name>
 * skm publish <skill-name> --version 1.0.1
 * 
 * @module commands/publish
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { SKM_URL } from '../config.js';

// -----------------------------------------------------------------------------
// 发布函数
// -----------------------------------------------------------------------------

/**
 * 发布指定的 skill 到 npm
 * 
 * @param {string} skillName - Skill 名称（在 skills/ 目录下）
 * @param {PublishOptions} [options] - 发布选项
 * @returns {Promise<void>}
 * 
 * @example
 * // 发布 skill（自动递增 patch 版本）
 * await publishSkill('test-skill');
 * 
 * // 发布指定版本
 * await publishSkill('test-skill', { version: '1.0.1' });
 */
export interface PublishOptions {
  /** 指定版本号（可选，不指定则自动递增 patch） */
  version?: string;
  /** 跳过 npm install */
  skipInstall?: boolean;
}

export async function publishSkill(
  skillName: string,
  options?: PublishOptions
): Promise<void> {
  // ==========================================================================
  // 步骤 1: 验证 skill 目录
  // ==========================================================================
  
  const __dirname = fileURLToPath(new URL('.', import.meta.url));
  const projectRoot = join(__dirname, '..');
  const skillDir = join(projectRoot, 'skills', skillName);
  
  console.log(`Publishing ${skillName}...`);
  
  if (!existsSync(skillDir)) {
    throw new Error(`Skill '${skillName}' not found in skills/ directory`);
  }
  
  // ==========================================================================
  // 步骤 2: npm install（如果需要）
  // ==========================================================================
  
  if (!options?.skipInstall) {
    console.log('Running npm install...');
    try {
      execSync('npm install', {
        cwd: skillDir,
        stdio: 'inherit'
      });
    } catch (err) {
      console.warn('Warning: npm install failed, continuing anyway...');
    }
  }
  
  // ==========================================================================
  // 步骤 3: 更新版本号（如果指定）
  // ==========================================================================
  
  if (options?.version) {
    console.log(`Updating version to ${options.version}...`);
    try {
      execSync(`npm version ${options.version} --no-git-tag-version`, {
        cwd: skillDir,
        stdio: 'inherit'
      });
    } catch (err) {
      throw new Error(`Failed to update version: ${err}`);
    }
  }
  
  // ==========================================================================
  // 步骤 4: 发布到 npm
  // ==========================================================================
  
  console.log('Publishing to npm...');
  try {
    execSync('npm publish --access=public', {
      cwd: skillDir,
      stdio: 'inherit'
    });
  } catch (err) {
    throw new Error(`Failed to publish: ${err}`);
  }
  
  // ==========================================================================
  // 完成
  // ==========================================================================
  
  console.log(`\n✅ ${skillName} published successfully!`);
  console.log(`   View at: ${SKM_URL}/${skillName}`);
}

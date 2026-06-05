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

import { execSync, exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { NPM_SCOPE, SKILL_SCOPES } from '../config.js';

const execAsync = promisify(exec);

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
      await execAsync('npm install', { cwd: skillDir });
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
      await execAsync(`npm version ${options.version} --no-git-tag-version`, {
        cwd: skillDir,
      });
    } catch (err) {
      throw new Error(`Failed to update version: ${err}`);
    }
  }
  
  // ==========================================================================
  // 步骤 4: 标准化 package name 并发布到 npm
  // ==========================================================================
  //
  // 自动从 package.json 提取 base name，使用配置的 scope（环境变量优先）。
  // 如果 scope 不存在（npm 404），自动遍历备用 scope 重试。
  //
  // 环境变量 SKM_NPM_SCOPE 可控制目标 scope:
  //   $env:SKM_NPM_SCOPE='@wanxuchen'
  // ==========================================================================
  
  // 4a. 读取 package.json，提取 base name（去除 @scope/ 前缀）
  const pkgJsonPath = join(skillDir, 'package.json');
  let baseName = skillName;
  
  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
      if (pkg.name) {
        baseName = pkg.name.includes('/') ? pkg.name.split('/')[1] : pkg.name;
      }
    } catch {
      // 解析失败时使用 skillName 作为 base name
    }
  }
  
  // 4b. 构建 scope 尝试列表：主 scope → 去重备用 scope
  const scopesToTry = [
    NPM_SCOPE,
    ...SKILL_SCOPES.filter(s => s !== NPM_SCOPE),
  ];
  
  // 4c. 逐个 scope 尝试发布
  let lastError: Error | null = null;
  let publishedName = '';
  
  for (const scope of scopesToTry) {
    const targetName = `${scope}/${baseName}`;
    
    // 重写 package.json name 为目标 scope
    if (existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
        pkg.name = targetName;
        writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
      } catch { /* skip if unreadable */ }
    }
    
    console.log(`Publishing as ${targetName}...`);
    try {
      await execAsync('npm publish --access=public', { cwd: skillDir });
      publishedName = targetName;
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const errMsg = String(err);
      // 只有 404（scope/org 不存在）才重试下一个 scope
      if (!errMsg.includes('404')) {
        break;
      }
      console.log(`   Scope ${scope} not available, trying next...`);
    }
  }
  
  // ==========================================================================
  // 完成
  // ==========================================================================
  
  if (!publishedName) {
    throw lastError || new Error('Failed to publish to npm');
  }
  
  console.log(`\n✅ ${skillName} published successfully as ${publishedName}!`);
  console.log(`   View at: https://www.npmjs.com/package/${publishedName}`);
}

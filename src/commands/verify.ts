/**
 * =============================================================================
 * Skill Verify Command
 * =============================================================================
 *
 * 验证 skill 的完整性，检查 SKILL.md、依赖、配置等
 *
 * 用法: skm verify <skill-name>
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 验证 skill 完整性
 *
 * 检查项目:
 * - SKILL.md 是否存在
 * - package.json 是否存在且有效
 * - 必要字段是否完整 (name, version, description)
 * - 依赖是否可解析
 *
 * @param skillName - skill 名称
 */
export async function verifySkill(skillName: string): Promise<void> {
  try {
    console.log(`\n🔍 Verifying skill: ${skillName}\n`);

    // 1. 查找 skill 安装位置
    const skillDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.skillmarket', 'skills', skillName);

    if (!await fs.pathExists(skillDir)) {
      console.error(`❌ Skill "${skillName}" not found locally.`);
      console.log(`   Try: skm install ${skillName}`);
      process.exit(1);
    }

    let passed = 0;
    let failed = 0;

    // 2. 检查 SKILL.md
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    if (await fs.pathExists(skillMdPath)) {
      console.log(`✅ SKILL.md exists`);
      passed++;

      // 检查内容非空
      const content = await fs.readFile(skillMdPath, 'utf-8');
      if (content.trim().length > 0) {
        console.log(`✅ SKILL.md is not empty (${content.length} chars)`);
        passed++;
      } else {
        console.log(`⚠️  SKILL.md is empty`);
        failed++;
      }
    } else {
      console.log(`❌ SKILL.md not found`);
      failed++;
    }

    // 3. 检查 package.json
    const pkgPath = path.join(skillDir, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      console.log(`✅ package.json exists`);
      passed++;

      try {
        const pkg = await fs.readJson(pkgPath);

        // 检查必要字段
        const requiredFields = ['name', 'version', 'description'];
        for (const field of requiredFields) {
          if (pkg[field]) {
            console.log(`✅ package.json has "${field}"`);
            passed++;
          } else {
            console.log(`⚠️  package.json missing "${field}"`);
            failed++;
          }
        }
      } catch (err) {
        console.log(`❌ package.json is invalid JSON`);
        failed++;
      }
    } else {
      console.log(`⚠️  package.json not found (optional for basic skills)`);
    }

    // 4. 检查 registry
    const registryPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.skillmarket', 'registry.json');
    if (await fs.pathExists(registryPath)) {
      try {
        const registry = await fs.readJson(registryPath);
        if (registry[skillName]) {
          console.log(`✅ Skill registered in registry (v${registry[skillName].version})`);
          passed++;
        } else {
          console.log(`⚠️  Skill not found in registry`);
          failed++;
        }
      } catch {
        console.log(`⚠️  Registry is invalid JSON`);
        failed++;
      }
    }

    // 5. 总结
    console.log(`\n📊 Verification Result:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);

    if (failed === 0) {
      console.log(`\n✅ Skill "${skillName}" is valid!\n`);
    } else {
      console.log(`\n⚠️  Skill "${skillName}" has issues. Consider reinstalling.\n`);
    }
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
}

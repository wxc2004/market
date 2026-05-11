/**
 * =============================================================================
 * SkillMarket Admin 命令模块
 * =============================================================================
 *
 * 提供管理员级别的云端 skill 管理功能。
 * 直接操作 npm registry，管理已发布的 skill 内容。
 *
 * 命令:
 *   skm admin ls                   列出所有已发布的 skills
 *   skm admin info <skill>         查看 skill 完整信息
 *   skm admin search <keyword>     搜索已发布的 skills
 *   skm admin stats                查看发布统计
 *   skm admin verify <skill>       验证已发布 skill 的结构
 *   skm admin deprecate <skill>    弃用 skill（支持 --version, --message）
 *   skm admin unpublish <skill>    取消发布 skill（支持 --version, --force）
 *   skm admin tag set <skill> <tag> <ver>   设置 dist-tag
 *   skm admin tag rm <skill> <tag>          移除 dist-tag
 *   skm admin tag ls <skill>                列出 dist-tags
 *   skm admin owner add <skill> <user>      添加维护者
 *   skm admin owner rm <skill> <user>       移除维护者
 *   skm admin access <skill> <level>        设置访问权限 (public|restricted)
 *
 * @module commands/admin
 */

// -----------------------------------------------------------------------------
// 导入
// -----------------------------------------------------------------------------

import { execSync } from 'child_process';
import { searchSkillmarketPackages, fetchNpmPackage, fetchSkillPackage } from './npm.js';
import { NPM_SCOPE, SKILL_SCOPES, NPM_REGISTRY } from '../config.js';
import { PLATFORMS } from '../constants.js';

// -----------------------------------------------------------------------------
// 类型
// -----------------------------------------------------------------------------

interface VersionInfo {
  version: string;
  description?: string;
  skillmarket?: {
    id?: string;
    displayName?: string;
    description?: string;
    platforms?: string[];
  };
  publishTime?: string;
  dist?: { unpackedSize?: number };
}

// -----------------------------------------------------------------------------
// 辅助函数
// -----------------------------------------------------------------------------

/** 用 scope 搜索包名 */
export async function fetchScopePackages(): Promise<string[]> {
  const all: Set<string> = new Set();
  for (const scope of SKILL_SCOPES) {
    try {
      const { packages } = await searchSkillmarketPackages({ from: 0, size: 100, keyword: scope });
      for (const p of packages) {
        if (p.startsWith(scope)) all.add(p);
      }
    } catch { /* 单个 scope 失败不影响其他 */ }
  }
  return [...all].sort();
}

// -----------------------------------------------------------------------------
// Admin: ls — 列出所有已发布的 skills
// -----------------------------------------------------------------------------

export async function adminList(): Promise<void> {
  console.log('\n🔍 Fetching all published skills...\n');

  const packages = await fetchScopePackages();

  if (packages.length === 0) {
    console.log('No published skills found.');
    return;
  }

  // 获取每个包的详细信息（并行）
  const details = await Promise.all(
    packages.map(async (pkg) => {
      try {
        const info = await fetchNpmPackage(pkg);
        if (!info) return null;
        const ver = info['dist-tags']?.latest || '?';
        const p = info.versions?.[ver];
        return {
          name: info.name,
          version: ver,
          description: p?.description || '',
          hasSkillmarket: !!p?.skillmarket,
          platforms: (p?.skillmarket?.platforms || []).join(', '),
          updated: info.time?.[ver] || '',
        };
      } catch {
        return null;
      }
    }),
  );

  const valid = details.filter(Boolean) as NonNullable<typeof details[0]>[];

  console.log(`📦 ${valid.length} published skill(s):\n`);

  // 按名称排序
  valid.sort((a, b) => a.name.localeCompare(b.name));

  for (const d of valid) {
    const flag = d.hasSkillmarket ? '✅' : '📦';
    console.log(`  ${flag}  ${d.name}@${d.version}`);
    if (d.description) console.log(`       ${d.description.slice(0, 80)}`);
    if (d.platforms) console.log(`       Platforms: ${d.platforms}`);
    console.log();
  }
}

// -----------------------------------------------------------------------------
// Admin: info — 查看 skill 完整信息
// -----------------------------------------------------------------------------

export async function adminInfo(skillId: string): Promise<void> {
  console.log(`\n🔍 Fetching detailed info for "${skillId}"...\n`);

  const info = await fetchSkillPackage(skillId);
  if (!info) {
    console.error(`❌ Skill "${skillId}" not found in any configured scope.`);
    console.log(`   Scopes checked: ${SKILL_SCOPES.join(', ')}`);
    process.exit(1);
  }

  const latestVer = info['dist-tags']?.latest || 'unknown';
  const latestPkg = info.versions?.[latestVer];
  const meta = latestPkg?.skillmarket;
  const allVersions = Object.keys(info.versions || {});

  // 基本信息
  console.log(`📦 ${info.name}`);
  console.log(`   Description: ${info.description || 'N/A'}`);
  console.log(`   Latest: ${latestVer}`);
  console.log(`   Total versions: ${allVersions.length}`);
  console.log(`   Modified: ${info.time?.modified || 'N/A'}`);
  console.log(`   Author: ${info.author?.name || latestPkg?.author?.name || 'N/A'}`);
  console.log(`   License: ${info.license || latestPkg?.license || 'N/A'}`);

  // SkillMarket 元数据
  if (meta) {
    console.log(`\n📋 SkillMarket Metadata:`);
    if (meta.id) console.log(`   ID: ${meta.id}`);
    if (meta.displayName) console.log(`   Display Name: ${meta.displayName}`);
    if (meta.description) console.log(`   Description: ${meta.description}`);
    if (meta.platforms && meta.platforms.length > 0) {
      console.log(`   Platforms: ${meta.platforms.join(', ')}`);
      // 检查是否有未知平台
      const unknown = meta.platforms.filter(p => !(PLATFORMS as readonly string[]).includes(p));
      if (unknown.length > 0) {
        console.log(`   ⚠️  Unknown platforms: ${unknown.join(', ')}`);
      }
    }
  } else {
    console.log(`\n⚠️  No SkillMarket metadata (not a skillmarket skill)`);
  }

  // 所有版本及发布时间
  console.log(`\n📅 Version History:`);
  for (const ver of allVersions.slice().reverse()) {
    const v = info.versions?.[ver];
    const time = info.time?.[ver] ? new Date(info.time[ver]).toLocaleDateString() : '?';
    const size = v?.dist?.unpackedSize
      ? ` (${(v.dist.unpackedSize / 1024).toFixed(1)} KB)`
      : '';
    const tag = ver === latestVer ? ' ← latest' : '';
    console.log(`   ${ver}${tag} — ${time}${size}`);
  }

  // dist-tags
  const tags = info['dist-tags'] || {};
  const otherTags = Object.entries(tags).filter(([k]) => k !== 'latest');
  if (otherTags.length > 0) {
    console.log(`\n🏷️  dist-tags:`);
    for (const [tag, ver] of otherTags) {
      console.log(`   ${tag}: ${ver}`);
    }
  }

  // 注册表信息
  console.log(`\n🔗 Registry:`);
  console.log(`   ${NPM_REGISTRY}/${info.name}`);

  console.log();
}

// -----------------------------------------------------------------------------
// Admin: search — 搜索已发布的 skills
// -----------------------------------------------------------------------------

export async function adminSearch(keyword: string, limit = 20): Promise<void> {
  console.log(`\n🔍 Searching published skills for "${keyword}"...\n`);

  // 先在本地的 scope 包列表中搜索
  const scopePackages = await fetchScopePackages();
  const matched = scopePackages.filter(p =>
    p.toLowerCase().includes(keyword.toLowerCase()),
  );

  if (matched.length === 0) {
    // 也搜索 npm 上 keywords:skillmarket 的包
    const { packages } = await searchSkillmarketPackages({ keyword });
    const filtered = packages
      .filter(p => p.toLowerCase().includes(keyword.toLowerCase()))
      .slice(0, limit);

    if (filtered.length === 0) {
      console.log(`No skills found matching "${keyword}".`);
      return;
    }

    console.log(`Found ${filtered.length} skill(s) (from npm keyword search):\n`);
    for (const pkg of filtered) {
      const info = await fetchNpmPackage(pkg);
      const ver = info?.['dist-tags']?.latest || '?';
      const p = info?.versions?.[ver];
      console.log(`   ${pkg}@${ver}`);
      if (p?.description) console.log(`   ${p.description.slice(0, 80)}`);
      console.log();
    }
    return;
  }

  console.log(`Found ${matched.length} skill(s) in configured scopes:\n`);
  const show = matched.slice(0, limit);
  for (const pkg of show) {
    const info = await fetchNpmPackage(pkg);
    const ver = info?.['dist-tags']?.latest || '?';
    const p = info?.versions?.[ver];
    console.log(`   ${pkg}@${ver}`);
    if (p?.skillmarket) {
      console.log(`   📋 ${p.skillmarket.displayName || ''} — Platforms: ${(p.skillmarket.platforms || []).join(', ') || 'none'}`);
    }
    if (p?.description) console.log(`   ${p.description.slice(0, 80)}`);
    console.log();
  }
  if (matched.length > limit) {
    console.log(`   ... and ${matched.length - limit} more (use --limit to show more)`);
  }
}

// -----------------------------------------------------------------------------
// Admin: stats — 发布统计
// -----------------------------------------------------------------------------

export async function adminStats(): Promise<void> {
  console.log('\n📊 SkillMarket Publishing Statistics\n');

  const packages = await fetchScopePackages();

  if (packages.length === 0) {
    console.log('No published skills found.');
    return;
  }

  // 获取所有包详情（并行）
  const infos = (
    await Promise.all(
      packages.map(async (pkg) => {
        try {
          const info = await fetchNpmPackage(pkg);
          return info ? { name: pkg, info } : null;
        } catch {
          return null;
        }
      }),
    )
  ).filter(Boolean) as { name: string; info: NonNullable<Awaited<ReturnType<typeof fetchNpmPackage>>> }[];

  // 统计
  const totalSkills = infos.length;
  let totalVersions = 0;
  let totalSize = 0;
  const platformSet = new Set<string>();
  let withMetadata = 0;
  let mostVersions = { name: '', count: 0 };
  let mostRecent = { name: '', date: '' };

  for (const { name, info } of infos) {
    const versions = Object.keys(info.versions || {});
    totalVersions += versions.length;

    if (versions.length > mostVersions.count) {
      mostVersions = { name, count: versions.length };
    }

    const latestVer = info['dist-tags']?.latest;
    const latestPkg = latestVer ? info.versions?.[latestVer] : undefined;
    const meta = latestPkg?.skillmarket;

    if (meta) {
      withMetadata++;
      if (meta.platforms) {
        for (const p of meta.platforms) platformSet.add(p);
      }
    }

    if (latestPkg?.dist?.unpackedSize) {
      totalSize += latestPkg.dist.unpackedSize;
    }

    const modTime = info.time?.modified || '';
    if (modTime && modTime > mostRecent.date) {
      mostRecent = { name, date: modTime };
    }
  }

  // 输出
  console.log(`📦 Total published skills: ${totalSkills}`);
  console.log(`📝 Total versions: ${totalVersions}`);
  console.log(`   Avg versions/skill: ${(totalVersions / totalSkills).toFixed(1)}`);
  console.log(`📋 Skills with skillmarket metadata: ${withMetadata}/${totalSkills}`);
  console.log(`💾 Total unpacked size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🔧 Platforms covered: ${platformSet.size} (${[...platformSet].join(', ')})`);
  console.log(`🏆 Most versions: ${mostVersions.name} (${mostVersions.count})`);
  if (mostRecent.date) {
    console.log(`🕐 Most recent update: ${mostRecent.name} (${new Date(mostRecent.date).toLocaleDateString()})`);
  }
  console.log(`🔗 Registry: ${NPM_REGISTRY}`);
  console.log(`\nConfigured scopes: ${SKILL_SCOPES.join(', ')}`);
  console.log();
}

// -----------------------------------------------------------------------------
// Admin: verify — 验证已发布 skill 的结构
// -----------------------------------------------------------------------------

export async function adminVerify(skillId: string): Promise<void> {
  console.log(`\n🔍 Verifying published skill "${skillId}"...\n`);

  const info = await fetchSkillPackage(skillId);
  if (!info) {
    console.error(`❌ Skill "${skillId}" not found.`);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // 1. 包名检查
  const nameValid = /^@[^/]+\/[^/]+$/.test(info.name);
  if (nameValid) {
    console.log(`✅ Package name format: ${info.name}`);
    passed++;
  } else {
    console.log(`⚠️  Package name format unusual: ${info.name}`);
    warnings++;
  }

  // 2. dist-tags 检查
  const tags = info['dist-tags'] || {};
  if (tags.latest) {
    console.log(`✅ dist-tags.latest: ${tags.latest}`);
    passed++;
  } else {
    console.log(`❌ dist-tags.latest missing`);
    failed++;
  }

  // 3. latest 版本存在
  const latestVer = tags.latest;
  const latestPkg = latestVer ? info.versions?.[latestVer] : undefined;
  if (latestPkg) {
    console.log(`✅ Latest version ${latestVer} exists in versions`);
    passed++;
  } else {
    console.log(`❌ Latest version ${latestVer} not found in versions object`);
    failed++;
  }

  // 4. skillmarket 元数据
  const meta = latestPkg?.skillmarket;
  if (meta) {
    console.log(`✅ Has skillmarket metadata`);

    const checks = [
      { name: 'id', ok: !!meta.id },
      { name: 'displayName', ok: !!meta.displayName },
      { name: 'platforms (array)', ok: Array.isArray(meta.platforms) && meta.platforms.length > 0 },
    ];

    for (const c of checks) {
      if (c.ok) {
        console.log(`   ✅ skillmarket.${c.name}`);
        passed++;
      } else {
        console.log(`   ⚠️  skillmarket.${c.name} missing or empty`);
        warnings++;
      }
    }

    // 验证平台是否在已知列表中
    if (meta.platforms) {
      const unknown = meta.platforms.filter(
        p => !(PLATFORMS as readonly string[]).includes(p),
      );
      if (unknown.length > 0) {
        console.log(`   ⚠️  Unknown platforms: ${unknown.join(', ')}`);
        warnings++;
      } else {
        console.log(`   ✅ All platforms recognized`);
        passed++;
      }
    }
  } else {
    console.log(`⚠️  No skillmarket metadata (not a skillmarket-formatted skill)`);
    warnings++;
  }

  // 5. description 检查
  if (latestPkg?.description) {
    console.log(`✅ Has description (${latestPkg.description.length} chars)`);
    passed++;
  } else {
    console.log(`⚠️  No description`);
    warnings++;
  }

  // 6. 许可证
  if (info.license || latestPkg?.license) {
    console.log(`✅ License: ${info.license || latestPkg?.license}`);
    passed++;
  } else {
    console.log(`⚠️  No license specified`);
    warnings++;
  }

  // 7. 包大小
  if (latestPkg?.dist?.unpackedSize) {
    const sizeKB = (latestPkg.dist.unpackedSize / 1024).toFixed(1);
    console.log(`✅ Package size: ${sizeKB} KB (unpacked)`);
    passed++;
  }

  // 8. 版本数量
  const versionCount = Object.keys(info.versions || {}).length;
  console.log(`ℹ️  Total versions: ${versionCount}`);

  // 总结
  const total = passed + failed;
  console.log(`\n📊 Verification Result:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ⚠️  Warnings: ${warnings}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log(`\n✅ Skill "${skillId}" is valid!\n`);
  } else {
    console.log(`\n⚠️  Skill "${skillId}" has issues that need attention.\n`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// 辅助: 将 skillId 解析为完整包名（通过尝试多个 scope）
// -----------------------------------------------------------------------------

/**
 * 将 skillId 解析为完整的 npm 包名。
 * 如果已经是 scoped 包名则直接返回，否则在每个配置的 scope 下尝试。
 * 抛出错误如果找不到对应的包。
 */
export async function resolveFullPackageName(skillId: string): Promise<string> {
  if (skillId.startsWith('@')) {
    // 已经是 scoped 包名，确认存在
    const info = await fetchNpmPackage(skillId);
    if (info) return skillId;
    throw new Error(`Package "${skillId}" not found in npm registry`);
  }

  for (const scope of SKILL_SCOPES) {
    const fullName = `${scope}/${skillId}`;
    const info = await fetchNpmPackage(fullName);
    if (info) return fullName;
  }

  throw new Error(
    `Could not resolve "${skillId}" to any known scope.\n` +
    `   Scopes checked: ${SKILL_SCOPES.join(', ')}`
  );
}

/** 执行 npm CLI 命令并返回 stdout */
export function npmExec(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (err: any) {
    const msg = err.stderr?.toString() || err.message || 'Unknown error';
    throw new Error(`npm command failed: ${msg.trim()}`);
  }
}

// -----------------------------------------------------------------------------
// Admin: deprecate — 弃用 skill（或特定版本）
// -----------------------------------------------------------------------------

export interface AdminDeprecateOptions {
  version?: string;
  message?: string;
}

export async function adminDeprecate(skillId: string, options: AdminDeprecateOptions = {}): Promise<void> {
  const pkgName = await resolveFullPackageName(skillId);
  const version = options.version || '';
  const message = options.message || 'This skill is deprecated. Please use an alternative.';

  const target = version ? `${pkgName}@${version}` : pkgName;
  console.log(`\n⚠️  Deprecating ${target}...\n`);

  npmExec(`npm deprecate "${target}" "${message}"`);

  console.log(`✅ Successfully deprecated ${target}`);
  console.log(`   Message: "${message}"\n`);
}

// -----------------------------------------------------------------------------
// Admin: unpublish — 取消发布 skill（或特定版本）
// -----------------------------------------------------------------------------

export interface AdminUnpublishOptions {
  version?: string;
  force?: boolean;
}

export async function adminUnpublish(skillId: string, options: AdminUnpublishOptions = {}): Promise<void> {
  const pkgName = await resolveFullPackageName(skillId);
  const version = options.version;

  let target: string;
  if (version) {
    target = `${pkgName}@${version}`;
    console.log(`\n🗑️  Unpublishing ${target}...\n`);
  } else {
    target = pkgName;
    console.log(`\n🗑️  Unpublishing entire package ${target}...\n`);
    if (!options.force) {
      throw new Error(
        'Unpublishing entire package requires --force flag.\n' +
        '   Usage: skm admin unpublish <skill> --force\n' +
        '   Or unpublish a specific version: skm admin unpublish <skill> --version <ver>'
      );
    }
  }

  const forceFlag = options.force ? ' --force' : '';
  npmExec(`npm unpublish "${target}"${forceFlag}`);

  if (version) {
    console.log(`✅ Successfully unpublished ${target}\n`);
  } else {
    console.log(`✅ Successfully unpublished entire package ${target}\n`);
  }
}

// -----------------------------------------------------------------------------
// Admin: tag — dist-tag 管理
// -----------------------------------------------------------------------------

export async function adminTagSet(skillId: string, tag: string, version: string): Promise<void> {
  const pkgName = await resolveFullPackageName(skillId);
  console.log(`\n🏷️  Setting dist-tag "${tag}" for ${pkgName}@${version}...\n`);

  npmExec(`npm dist-tag add "${pkgName}@${version}" "${tag}"`);

  console.log(`✅ dist-tag "${tag}" set to ${pkgName}@${version}\n`);
}

export async function adminTagRemove(skillId: string, tag: string): Promise<void> {
  const pkgName = await resolveFullPackageName(skillId);
  console.log(`\n🏷️  Removing dist-tag "${tag}" from ${pkgName}...\n`);

  npmExec(`npm dist-tag rm "${pkgName}" "${tag}"`);

  console.log(`✅ dist-tag "${tag}" removed from ${pkgName}\n`);
}

export async function adminTagList(skillId: string): Promise<void> {
  const pkgName = await resolveFullPackageName(skillId);
  console.log(`\n🏷️  dist-tags for ${pkgName}:\n`);

  const output = npmExec(`npm dist-tag ls "${pkgName}"`);
  if (!output) {
    console.log('   (no dist-tags found)\n');
    return;
  }

  const lines = output.split('\n').filter(Boolean);
  for (const line of lines) {
    const [tag, version] = line.split(': ').map(s => s.trim());
    const isLatest = tag === 'latest' ? ' ← latest' : '';
    console.log(`   ${tag}: ${version}${isLatest}`);
  }
  console.log();
}

// -----------------------------------------------------------------------------
// Admin: owner — 维护者管理
// -----------------------------------------------------------------------------

export async function adminOwnerAdd(skillId: string, user: string): Promise<void> {
  const pkgName = await resolveFullPackageName(skillId);
  console.log(`\n👥 Adding owner "${user}" to ${pkgName}...\n`);

  npmExec(`npm owner add "${user}" "${pkgName}"`);

  console.log(`✅ Owner "${user}" added to ${pkgName}\n`);
}

export async function adminOwnerRemove(skillId: string, user: string): Promise<void> {
  const pkgName = await resolveFullPackageName(skillId);
  console.log(`\n👥 Removing owner "${user}" from ${pkgName}...\n`);

  npmExec(`npm owner rm "${user}" "${pkgName}"`);

  console.log(`✅ Owner "${user}" removed from ${pkgName}\n`);
}

// -----------------------------------------------------------------------------
// Admin: access — 设置访问权限
// -----------------------------------------------------------------------------

export async function adminAccess(skillId: string, level: 'public' | 'restricted'): Promise<void> {
  const pkgName = await resolveFullPackageName(skillId);
  console.log(`\n🔒 Setting access for ${pkgName} to "${level}"...\n`);

  npmExec(`npm access "${level}" "${pkgName}"`);

  console.log(`✅ Access for ${pkgName} set to "${level}"\n`);
}

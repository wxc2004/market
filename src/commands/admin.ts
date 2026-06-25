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
import { throttledMap } from '../utils/concurrency.js';

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
// 导出类型（供纯数据函数使用）
// -----------------------------------------------------------------------------

/** Scope 包详细信息（用于 admin ls / GUI 列表） */
export interface PackageDetail {
  name: string;
  version: string;
  description: string;
  hasSkillmarket: boolean;
  platforms: string;
  updated: string;
}

/** 发布统计数据结构（用于 admin stats / GUI admin stats） */
export interface StatsData {
  totalSkills: number;
  totalVersions: number;
  averageVersions: string;
  withMetadata: number;
  totalSizeMB: string;
  platformCount: number;
  platforms: string[];
  mostVersions: { name: string; count: number };
  mostRecent: { name: string; date: string };
  registry: string;
  scopes: string[];
}

/** 单个校验结果条目 */
export interface VerificationCheck {
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'info';
  message: string;
}

/** 校验完整结果 */
export interface VerificationResult {
  skillId: string;
  valid: boolean;
  passed: number;
  failed: number;
  warnings: number;
  checks: VerificationCheck[];
}

// -----------------------------------------------------------------------------
// 纯数据函数（无 console.log 副作用，可被 CLI 和 GUI 共用）
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

/**
 * 获取所有 scope 包的详细信息（纯数据，无 console.log 副作用）
 * 使用 throttledMap 限流以避免 npm 429
 */
export async function fetchScopePackageDetails(): Promise<PackageDetail[]> {
  const packages = await fetchScopePackages();
  if (packages.length === 0) return [];

  const details = await throttledMap(
    packages,
    async (pkg) => {
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
    },
    3,
    200,
  );

  const valid = details.filter(Boolean) as PackageDetail[];
  valid.sort((a, b) => a.name.localeCompare(b.name));
  return valid;
}

/**
 * 获取发布统计数据（纯数据，无 console.log 副作用）
 * 可供 CLI adminStats 和 GUI /api/admin/stats 共用
 */
export async function getPublishingStats(): Promise<StatsData> {
  const packages = await fetchScopePackages();
  if (packages.length === 0) {
    return {
      totalSkills: 0, totalVersions: 0, averageVersions: '0',
      withMetadata: 0, totalSizeMB: '0', platformCount: 0, platforms: [],
    };
  }

  const infos = (
    await throttledMap(
      packages,
      async (pkg) => {
        try {
          const info = await fetchNpmPackage(pkg);
          return info ? { name: pkg, info } : null;
        } catch {
          return null;
        }
      },
      3,
      200,
    )
  ).filter((item): item is { name: string; info: NonNullable<Awaited<ReturnType<typeof fetchNpmPackage>>> } => item !== null);

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
      if (meta.platforms) meta.platforms.forEach(p => platformSet.add(p));
    }
    if (latestPkg?.dist?.unpackedSize) totalSize += latestPkg.dist.unpackedSize;

    const modTime = info.time?.modified || '';
    if (modTime && modTime > mostRecent.date) {
      mostRecent = { name, date: modTime };
    }
  }

  return {
    totalSkills: infos.length,
    totalVersions,
    averageVersions: infos.length > 0 ? (totalVersions / infos.length).toFixed(1) : '0',
    withMetadata,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    platformCount: platformSet.size,
    platforms: [...platformSet],
    mostVersions,
    mostRecent,
    registry: NPM_REGISTRY,
    scopes: [...SKILL_SCOPES],
  };
}

/**
 * 校验已发布 skill 的结构（纯数据，无 console.log 副作用）
 */
export async function verifySkillData(skillId: string): Promise<VerificationResult | null> {
  const info = await fetchSkillPackage(skillId);
  if (!info) return null;

  const checks: VerificationCheck[] = [];
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // 1. 包名格式
  const nameValid = /^@[^/]+\/[^/]+$/.test(info.name);
  if (nameValid) {
    checks.push({ label: 'Package name format', status: 'pass', message: info.name });
    passed++;
  } else {
    checks.push({ label: 'Package name format', status: 'warn', message: `Unusual: ${info.name}` });
    warnings++;
  }

  // 2. dist-tags.latest
  const tags = info['dist-tags'] || {};
  if (tags.latest) {
    checks.push({ label: 'dist-tags.latest', status: 'pass', message: tags.latest });
    passed++;
  } else {
    checks.push({ label: 'dist-tags.latest', status: 'fail', message: 'Missing' });
    failed++;
  }

  // 3. Latest version exists
  const latestVer = tags.latest;
  const latestPkg = latestVer ? info.versions?.[latestVer] : undefined;
  if (latestPkg) {
    checks.push({ label: 'Latest version exists', status: 'pass', message: `${latestVer} exists in versions` });
    passed++;
  } else {
    checks.push({ label: 'Latest version exists', status: 'fail', message: `${latestVer} not found in versions` });
    failed++;
  }

  // 4. skillmarket metadata
  const meta = latestPkg?.skillmarket;
  if (meta) {
    checks.push({ label: 'skillmarket metadata', status: 'pass', message: 'Present' });
    passed++;

    const subChecks = [
      { label: 'skillmarket.id', ok: !!meta.id },
      { label: 'skillmarket.displayName', ok: !!meta.displayName },
      { label: 'skillmarket.platforms', ok: Array.isArray(meta.platforms) && meta.platforms.length > 0 },
    ];
    for (const c of subChecks) {
      if (c.ok) {
        checks.push({ label: c.label, status: 'pass', message: 'Present' });
        passed++;
      } else {
        checks.push({ label: c.label, status: 'warn', message: 'Missing or empty' });
        warnings++;
      }
    }

    if (meta.platforms) {
      const unknown = meta.platforms.filter(p => !(PLATFORMS as readonly string[]).includes(p));
      if (unknown.length > 0) {
        checks.push({ label: 'Platforms recognized', status: 'warn', message: `Unknown: ${unknown.join(', ')}` });
        warnings++;
      } else {
        checks.push({ label: 'Platforms recognized', status: 'pass', message: 'All recognized' });
        passed++;
      }
    }
  } else {
    checks.push({ label: 'skillmarket metadata', status: 'warn', message: 'Not a skillmarket-formatted skill' });
    warnings++;
  }

  // 5. description
  if (latestPkg?.description) {
    checks.push({ label: 'Description', status: 'pass', message: `${latestPkg.description.length} chars` });
    passed++;
  } else {
    checks.push({ label: 'Description', status: 'warn', message: 'Missing' });
    warnings++;
  }

  // 6. license
  if (info.license || latestPkg?.license) {
    checks.push({ label: 'License', status: 'pass', message: info.license || latestPkg?.license || '' });
    passed++;
  } else {
    checks.push({ label: 'License', status: 'warn', message: 'Missing' });
    warnings++;
  }

  // 7. package size
  if (latestPkg?.dist?.unpackedSize) {
    const sizeKB = (latestPkg.dist.unpackedSize / 1024).toFixed(1);
    checks.push({ label: 'Package size', status: 'pass', message: `${sizeKB} KB (unpacked)` });
    passed++;
  }

  // 8. total versions
  const versionCount = Object.keys(info.versions || {}).length;
  checks.push({ label: 'Total versions', status: 'info', message: String(versionCount) });

  return {
    skillId,
    valid: failed === 0,
    passed,
    failed,
    warnings,
    checks,
  };
}

// -----------------------------------------------------------------------------
// Admin: ls — 列出所有已发布的 skills
// -----------------------------------------------------------------------------

export async function adminList(): Promise<void> {
  console.log('\n🔍 Fetching all published skills...\n');

  const valid = await fetchScopePackageDetails();

  if (valid.length === 0) {
    console.log('No published skills found.');
    return;
  }

  let hasSkillmarketCount = 0;
  for (const d of valid) {
    if (d.hasSkillmarket) hasSkillmarketCount++;
    const flag = d.hasSkillmarket ? '✅' : '📦';
    console.log(`  ${flag}  ${d.name}@${d.version}`);
    if (d.description) console.log(`       ${d.description.slice(0, 80)}`);
    if (d.platforms) console.log(`       Platforms: ${d.platforms}`);
    console.log();
  }
  
  console.log(`📦 ${valid.length} published skill(s) （${hasSkillmarketCount} with skillmarket metadata）\n`);
}

// -----------------------------------------------------------------------------
// Admin: info — 查看 skill 完整信息
// -----------------------------------------------------------------------------

export async function adminInfo(skillId: string): Promise<void> {
  console.log(`\n🔍 Fetching detailed info for "${skillId}"...\n`);

  const info = await fetchSkillPackage(skillId);
  if (!info) {
    throw new Error(
      `Skill "${skillId}" not found in any configured scope.\n` +
      `   Scopes checked: ${SKILL_SCOPES.join(', ')}`
    );
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

  const stats = await getPublishingStats();

  if (stats.totalSkills === 0) {
    console.log('No published skills found.');
    return;
  }

  console.log(`📦 Total published skills: ${stats.totalSkills}`);
  console.log(`📝 Total versions: ${stats.totalVersions}`);
  console.log(`   Avg versions/skill: ${stats.averageVersions}`);
  console.log(`📋 Skills with skillmarket metadata: ${stats.withMetadata}/${stats.totalSkills}`);
  console.log(`💾 Total unpacked size: ${stats.totalSizeMB} MB`);
  console.log(`🔧 Platforms covered: ${stats.platformCount} (${stats.platforms.join(', ')})`);
  console.log(`🏆 Most versions: ${stats.mostVersions.name} (${stats.mostVersions.count})`);
  if (stats.mostRecent.date) {
    console.log(`🕐 Most recent update: ${stats.mostRecent.name} (${new Date(stats.mostRecent.date).toLocaleDateString()})`);
  }
  console.log(`🔗 Registry: ${stats.registry}`);
  console.log(`\nConfigured scopes: ${stats.scopes.join(', ')}`);
  console.log();
}

// -----------------------------------------------------------------------------
// Admin: verify — 验证已发布 skill 的结构
// -----------------------------------------------------------------------------

export async function adminVerify(skillId: string): Promise<void> {
  console.log(`\n🔍 Verifying published skill "${skillId}"...\n`);

  const result = await verifySkillData(skillId);
  if (!result) {
    throw new Error(`Skill "${skillId}" not found.`);
  }

  for (const check of result.checks) {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : check.status === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`  ${icon}  ${check.label}: ${check.message}`);
  }

  console.log(`\n📊 Verification Result:`);
  console.log(`   ✅ Passed: ${result.passed}`);
  console.log(`   ⚠️  Warnings: ${result.warnings}`);
  console.log(`   ❌ Failed: ${result.failed}`);

  if (result.valid) {
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
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'stderr' in err) {
      const stderr = (err as { stderr: string | Buffer }).stderr;
      const msg = Buffer.isBuffer(stderr) ? stderr.toString() : stderr;
      throw new Error(`npm command failed: ${msg.trim()}`);
    }
    if (err instanceof Error) {
      throw new Error(`npm command failed: ${err.message}`);
    }
    throw new Error('npm command failed with an unknown error');
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

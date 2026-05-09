/**
 * =============================================================================
 * SkillMarket Admin 命令模块
 * =============================================================================
 *
 * 提供管理员级别的云端 skill 管理功能。
 * 直接操作 npm registry，管理已发布的 skill 内容。
 *
 * 命令:
 *   skm admin ls             列出所有已发布的 skills
 *   skm admin info <skill>   查看 skill 完整信息
 *   skm admin search <keyword>  搜索已发布的 skills
 *   skm admin stats          查看发布统计
 *   skm admin verify <skill> 验证已发布 skill 的结构
 *
 * @module commands/admin
 */

// -----------------------------------------------------------------------------
// 导入
// -----------------------------------------------------------------------------

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
async function fetchScopePackages(): Promise<string[]> {
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

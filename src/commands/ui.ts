/**
 * =============================================================================
 * SkillMarket GUI Server
 * =============================================================================
 *
 * 提供本地 HTTP API 供 GUI 前端调用，封装 SkillMarket 命令功能。
 *
 * API 端点:
 *   GET    /api/skills?page=1&limit=20&search=  - 列出 npm skills
 *   GET    /api/installed                       - 列出已安装 skills
 *   GET    /api/platforms                       - 列出可用平台
 *   GET    /api/skill-info?skill=xxx            - skill 详情
 *   POST   /api/install                         - 安装 skill
 *   POST   /api/uninstall                       - 卸载 skill
 *   POST   /api/update                          - 更新 skill(s)
 *
 * @module commands/ui
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync, readdirSync, renameSync } from 'fs';
import { join, extname, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import AdmZip from 'adm-zip';

/** 上传文件大小限制：50 MB */
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

// 数据层函数（直接返回数据，无 console.log 副作用）
import { searchSkillmarketPackages, fetchNpmPackage, fetchSkillPackage } from './npm.js';
import type { NpmRegistryResponse } from './npm.js';
import { getInstalledSkills } from './registry.js';
import { detectPlatforms, getAllAdapters } from '../adapters/index.js';

// 命令函数（用于写操作）
import { installSkill } from './install.js';
import { uninstallSkill } from './uninstall.js';
import { updateSkill } from './update.js';
import { publishSkill } from './publish.js';

// Admin 功能
import { resolveFullPackageName, npmExec, getPublishingStats } from './admin.js';

// Config 文件读写（用于 GitHub token 持久化）
import { readConfigFile, writeConfigFile, removeConfigKeys } from './config.js';
import {
  NPM_SCOPE,
  NPM_SCOPE_FALLBACK,
  SKILL_SCOPES,
  NPM_REGISTRY,
  SKM_URL,
} from '../config.js';

// -----------------------------------------------------------------------------
// 路径常量
// -----------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GUI 静态文件目录: 从 dist/index.js 位置推算 → ../gui/
// tsup 将所有代码打包到 dist/index.js，故 __dirname = <project>/dist/
const guiDir = join(__dirname, '..', 'gui');

// -----------------------------------------------------------------------------
// 缓存 & 限流
// -----------------------------------------------------------------------------

import { TtlCache } from '../utils/cache.js';

/** UI 专用的缓存实例（默认 TTL 60 秒，与 npm 缓存的 30 秒区分） */
const uiCache = new TtlCache();

// -----------------------------------------------------------------------------
// 本地类型定义
// -----------------------------------------------------------------------------

/** 前端 skill 列表中的单个 skill 详情 */
interface SkillDetail {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  platforms: string[];
  author: string;
  homepage: string;
  repository: string;
  updated: string;
}

/** 上传解析的 package.json 信息 */
interface UploadPkgInfo {
  name?: string;
  version?: string;
  description?: string;
  displayName?: string;
  skillmarket?: {
    id?: string;
    platforms?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// -----------------------------------------------------------------------------
// npm registry 响应类型辅助函数
// -----------------------------------------------------------------------------

/**
 * 从 npm registry 的 author 字段中提取作者名称。
 * npm 的 author 可以是字符串 "name <email>" 或对象 { name, email, url }。
 */
function getAuthorName(author: string | { name?: string } | undefined): string {
  if (!author) return '';
  if (typeof author === 'string') return author.replace(/<[^>]*>/g, '').trim();
  return author.name || '';
}

/**
 * 从 npm registry 的 repository 字段中提取仓库 URL。
 * repository 可以是字符串或对象 { type, url, directory }。
 */
function getRepoUrl(repo: string | { url?: string } | undefined): string {
  if (!repo) return '';
  if (typeof repo === 'string') return repo;
  return repo.url || '';
}

import { throttledMap } from '../utils/concurrency.js';

// -----------------------------------------------------------------------------
// MIME 类型映射
// -----------------------------------------------------------------------------

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// -----------------------------------------------------------------------------
// JSON 响应辅助
// -----------------------------------------------------------------------------

function jsonResponse(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

// -----------------------------------------------------------------------------
// API 处理器
// -----------------------------------------------------------------------------

const API_ROUTES: Record<string, Record<string, (req: IncomingMessage, res: ServerResponse, url: URL) => Promise<void>>> = {
  GET: {},
  POST: {},
  DELETE: {},
};

// ---- GET /api/skills ----

API_ROUTES.GET['/api/skills'] = async (_req, res, url) => {
  try {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const search = url.searchParams.get('search') || '';
    const sort = url.searchParams.get('sort') || 'name';
    const platform = url.searchParams.get('platform') || '';

    const cacheKey = `search:${search}:limit:${limit}`;

    // 先从缓存获取搜索结果
    let searchResult = uiCache.get<{ packages: string[]; total: number }>(cacheKey);
    if (!searchResult) {
      searchResult = await searchSkillmarketPackages({
        from: 0,
        size: 100, // 一次拉取更多，避免分页
        keyword: search || undefined,
      });
      // 缓存 30 秒减少 registry 压力
      uiCache.set(cacheKey, searchResult, 30_000);
    }

    const { packages, total } = searchResult;

    // 逐个获取详情（限流，避免 npm 限流）
    let fetchErrors = 0;
    const skillDetails = await throttledMap(packages, async (pkgName) => {
      try {
        const pkgCacheKey = `pkg:${pkgName}`;
        let info = uiCache.get<NpmRegistryResponse>(pkgCacheKey);
        if (!info) {
          info = await fetchNpmPackage(pkgName);
          if (info) uiCache.set(pkgCacheKey, info, 30_000);
        }
        if (!info) { fetchErrors++; return null; }
        const latestVersion = info['dist-tags']?.latest || 'unknown';
        const pkg = info.versions?.[latestVersion];
        const meta = pkg?.skillmarket;
        return {
          id: meta?.id || info.name.replace(/^@[^/]+\//, ''),
          name: info.name,
          displayName: meta?.displayName || info.name,
          version: latestVersion,
          description: pkg?.description || '',
          platforms: meta?.platforms || [],
          author: getAuthorName(info.author) || getAuthorName(pkg?.author),
          homepage: pkg?.homepage || '',
          repository: getRepoUrl(pkg?.repository),
          updated: info.time?.[latestVersion] || info.time?.modified || '',
        };
      } catch {
        fetchErrors++;
        return null;
      }
    }, 3);

    let skills: SkillDetail[] = skillDetails.filter(Boolean) as SkillDetail[];

    // 按平台过滤
    if (platform) {
      skills = skills.filter(s =>
        Array.isArray(s.platforms) && s.platforms.includes(platform)
      );
    }

    // 排序
    skills.sort((a, b) => {
      const nameA = (a.displayName || a.id || '').toLowerCase();
      const nameB = (b.displayName || b.id || '').toLowerCase();
      switch (sort) {
        case '-name':
          return nameB.localeCompare(nameA);
        case 'updated':
          return (a.updated || '').localeCompare(b.updated || '');
        case '-updated':
          return (b.updated || '').localeCompare(a.updated || '');
        case 'name':
        default:
          return nameA.localeCompare(nameB);
      }
    });

    const filteredTotal = skills.length;
    const totalPages = Math.ceil(filteredTotal / limit) || 1;

    // 按当前页截取
    const start = (page - 1) * limit;
    const pagedSkills = skills.slice(start, start + limit);

    jsonResponse(res, 200, { skills: pagedSkills, page, totalPages, total: filteredTotal, fetchErrors });
  } catch (err) {
    jsonResponse(res, 500, {
      error: String(err),
      skills: [],
      page: 1,
      totalPages: 1,
      total: 0,
    });
  }
};

// ---- GET /api/installed ----

API_ROUTES.GET['/api/installed'] = async (_req, res, _url) => {
  try {
    const skills = await getInstalledSkills();
    jsonResponse(res, 200, skills.map(s => ({
      id: s.id,
      displayName: s.id,
      version: s.version,
      installedAt: s.installedAt,
      platforms: s.platforms,
    })));
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- GET /api/platforms ----

API_ROUTES.GET['/api/platforms'] = async (_req, res, _url) => {
  try {
    const available = await detectPlatforms();
    const allAdapters = getAllAdapters();

    const platforms = await Promise.all(
      allAdapters.map(async (adapter) => {
        const isAvailable = available.find(a => a.id === adapter.id);
        const installed = await adapter.listInstalled();
        return {
          id: adapter.id,
          name: adapter.name,
          available: !!isAvailable,
          installedCount: Array.isArray(installed) ? installed.length : 0,
          installedSkills: Array.isArray(installed) ? installed : [],
        };
      })
    );

    jsonResponse(res, 200, platforms);
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- GET /api/platform-info ----

API_ROUTES.GET['/api/platform-info'] = async (_req, res, url) => {
  try {
    const platformId = url.searchParams.get('id') || '';
    if (!platformId) {
      jsonResponse(res, 400, { error: 'Missing "id" query parameter' });
      return;
    }

    const allAdapters = getAllAdapters();
    const adapter = allAdapters.find(a => a.id === platformId);
    if (!adapter) {
      jsonResponse(res, 404, { error: `Platform "${platformId}" not found` });
      return;
    }

    const available = await detectPlatforms();
    const isAvailable = available.find(a => a.id === adapter.id);
    const installed = await adapter.listInstalled();
    const installedSkills = Array.isArray(installed) ? installed : [];

    jsonResponse(res, 200, {
      id: adapter.id,
      name: adapter.name,
      available: !!isAvailable,
      installedCount: installedSkills.length,
      installedSkills,
    });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- GET /api/skill-info ----

API_ROUTES.GET['/api/skill-info'] = async (_req, res, url) => {
  try {
    const skillName = url.searchParams.get('skill') || '';
    if (!skillName) {
      jsonResponse(res, 400, { error: 'Missing "skill" query parameter' });
      return;
    }

    const cacheKey = `skill-info:${skillName}`;
    let info = uiCache.get<NpmRegistryResponse>(cacheKey);
    if (!info) {
      info = await fetchSkillPackage(skillName);
      if (info) uiCache.set(cacheKey, info, 30_000);
    }
    if (!info) {
      jsonResponse(res, 404, { error: `Skill "${skillName}" not found` });
      return;
    }

    const latestVersion = info['dist-tags']?.latest || 'unknown';
    const pkg = latestVersion ? info.versions?.[latestVersion] : undefined;
    const meta = pkg?.skillmarket;
    const versionKeys = Object.keys(info.versions || {});
    const recentVersions = versionKeys.slice(-20);

    jsonResponse(res, 200, {
      id: meta?.id || info.name.replace(/^@[^/]+\//, ''),
      name: info.name,
      displayName: meta?.displayName || info.name,
      description: pkg?.description || '',
      version: latestVersion,
      platforms: meta?.platforms || [],
      versions: recentVersions,
      author: getAuthorName(info.author) || getAuthorName(pkg?.author),
      license: info.license || '',
      homepage: pkg?.homepage || '',
      repository: getRepoUrl(pkg?.repository),
      readme: info.readme || '',
    });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- GET /api/config ----

// ---- GET /api/version ----

API_ROUTES.GET['/api/version'] = async (_req, res, _url) => {
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    jsonResponse(res, 200, { version: pkg.version || '1.0.0' });
  } catch {
    jsonResponse(res, 200, { version: '1.0.0' });
  }
};

API_ROUTES.GET['/api/config'] = async (_req, res, _url) => {
  jsonResponse(res, 200, {
    npmScope: NPM_SCOPE,
    npmScopeFallback: NPM_SCOPE_FALLBACK,
    npmRegistry: NPM_REGISTRY,
    skmUrl: SKM_URL,
    skillScopes: SKILL_SCOPES,
  });
};

// ---- GET /api/github-token ----

API_ROUTES.GET['/api/github-token'] = async (_req, res, _url) => {
  try {
    const config = await readConfigFile();
    const token = config.githubToken || '';
    jsonResponse(res, 200, {
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 6) + '…' : '',
    });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- POST /api/github-token ----

API_ROUTES.POST['/api/github-token'] = async (req, res, _url) => {
  try {
    const body = await parseBody(req);
    const token = String(body.token || '').trim();
    if (!token) {
      jsonResponse(res, 400, { error: 'Token is required' });
      return;
    }
    await writeConfigFile({ githubToken: token });
    jsonResponse(res, 200, { success: true, message: 'GitHub token saved successfully' });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- DELETE /api/github-token ----

API_ROUTES.DELETE['/api/github-token'] = async (_req, res, _url) => {
  try {
    await removeConfigKeys(['githubToken']);
    jsonResponse(res, 200, { success: true, message: 'GitHub token removed successfully' });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- POST /api/install ----

API_ROUTES.POST['/api/install'] = async (req, res, _url) => {
  try {
    const body = await parseBody(req);
    const skillId = String(body.skillId || '');
    const version = body.version ? String(body.version) : undefined;
    const platform = body.platform ? String(body.platform) : undefined;

    if (!skillId) {
      jsonResponse(res, 400, { error: 'Missing skillId' });
      return;
    }

    await installSkill(skillId, version, {
      platforms: platform ? [platform] : undefined,
      force: true,
    });

    jsonResponse(res, 200, { success: true, message: `${skillId} installed successfully` });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- POST /api/uninstall ----

API_ROUTES.POST['/api/uninstall'] = async (req, res, _url) => {
  try {
    const body = await parseBody(req);
    const skillId = String(body.skillId || '');
    const platform = body.platform ? String(body.platform) : undefined;

    if (!skillId) {
      jsonResponse(res, 400, { error: 'Missing skillId' });
      return;
    }

    await uninstallSkill(skillId, {
      platforms: platform ? [platform] : undefined,
      yes: true,
    });

    jsonResponse(res, 200, { success: true, message: `${skillId} uninstalled successfully` });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- GET /api/admin/stats ----

API_ROUTES.GET['/api/admin/stats'] = async (_req, res, _url) => {
  try {
    const stats = await getPublishingStats();
    jsonResponse(res, 200, stats);
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- POST /api/admin/deprecate ----

API_ROUTES.POST['/api/admin/deprecate'] = async (req, res, _url) => {
  try {
    const body = await parseBody(req);
    const skillId = String(body.skillId || '');
    const version = body.version ? String(body.version) : '';
    const message = body.message ? String(body.message) : '';

    if (!skillId) {
      jsonResponse(res, 400, { error: 'Missing skillId' });
      return;
    }

    const pkgName = await resolveFullPackageName(skillId);
    const target = version ? `${pkgName}@${version}` : pkgName;
    const deprecateMsg = message || 'This skill is deprecated. Please use an alternative.';

    npmExec(`npm deprecate "${target}" "${deprecateMsg}"`);

    jsonResponse(res, 200, { success: true, message: `${target} deprecated` });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- POST /api/admin/unpublish ----

API_ROUTES.POST['/api/admin/unpublish'] = async (req, res, _url) => {
  try {
    const body = await parseBody(req);
    const skillId = String(body.skillId || '');
    const version = body.version ? String(body.version) : '';
    const force = !!body.force;

    if (!skillId) {
      jsonResponse(res, 400, { error: 'Missing skillId' });
      return;
    }

    const pkgName = await resolveFullPackageName(skillId);
    let target: string;

    if (version) {
      target = `${pkgName}@${version}`;
    } else {
      if (!force) {
        jsonResponse(res, 400, { error: 'Unpublishing entire package requires force=true' });
        return;
      }
      target = pkgName;
    }

    const forceFlag = force ? ' --force' : '';
    npmExec(`npm unpublish "${target}"${forceFlag}`);

    jsonResponse(res, 200, { success: true, message: `${target} unpublished` });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- POST /api/admin/tag ----

API_ROUTES.POST['/api/admin/tag'] = async (req, res, _url) => {
  try {
    const body = await parseBody(req);
    const skillId = String(body.skillId || '');
    const action = String(body.action || ''); // 'set', 'rm', 'ls'
    const tag = body.tag ? String(body.tag) : '';
    const version = body.version ? String(body.version) : '';

    if (!skillId || !action) {
      jsonResponse(res, 400, { error: 'Missing skillId or action' });
      return;
    }

    const pkgName = await resolveFullPackageName(skillId);

    if (action === 'set') {
      if (!tag || !version) {
        jsonResponse(res, 400, { error: 'Tag set requires tag and version' });
        return;
      }
      npmExec(`npm dist-tag add "${pkgName}@${version}" "${tag}"`);
      jsonResponse(res, 200, { success: true, message: `Tag "${tag}" set to ${pkgName}@${version}` });
    } else if (action === 'rm') {
      if (!tag) {
        jsonResponse(res, 400, { error: 'Tag rm requires tag' });
        return;
      }
      npmExec(`npm dist-tag rm "${pkgName}" "${tag}"`);
      jsonResponse(res, 200, { success: true, message: `Tag "${tag}" removed from ${pkgName}` });
    } else if (action === 'ls') {
      const output = npmExec(`npm dist-tag ls "${pkgName}"`);
      const tags: Record<string, string> = {};
      if (output) {
        output.split('\n').filter(Boolean).forEach((line: string) => {
          const parts = line.split(': ');
          if (parts.length >= 2) tags[parts[0].trim()] = parts[1].trim();
        });
      }
      jsonResponse(res, 200, { success: true, tags, packageName: pkgName });
    } else {
      jsonResponse(res, 400, { error: `Unknown action: ${action} (use set/rm/ls)` });
    }
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- POST /api/admin/owner ----

API_ROUTES.POST['/api/admin/owner'] = async (req, res, _url) => {
  try {
    const body = await parseBody(req);
    const skillId = String(body.skillId || '');
    const action = String(body.action || ''); // 'add', 'rm'
    const user = String(body.user || '');

    if (!skillId || !action || !user) {
      jsonResponse(res, 400, { error: 'Missing skillId, action, or user' });
      return;
    }

    const pkgName = await resolveFullPackageName(skillId);
    const npmAction = action === 'add' ? 'add' : 'rm';

    npmExec(`npm owner ${npmAction} "${user}" "${pkgName}"`);

    jsonResponse(res, 200, {
      success: true,
      message: `Owner ${npmAction === 'add' ? 'added' : 'removed'}: ${user} ${npmAction === 'add' ? 'to' : 'from'} ${pkgName}`,
    });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- POST /api/admin/access ----

API_ROUTES.POST['/api/admin/access'] = async (req, res, _url) => {
  try {
    const body = await parseBody(req);
    const skillId = String(body.skillId || '');
    const level = String(body.level || ''); // 'public' | 'restricted'

    if (!skillId || !level) {
      jsonResponse(res, 400, { error: 'Missing skillId or level' });
      return;
    }

    if (level !== 'public' && level !== 'restricted') {
      jsonResponse(res, 400, { error: 'Level must be "public" or "restricted"' });
      return;
    }

    const pkgName = await resolveFullPackageName(skillId);
    npmExec(`npm access "${level}" "${pkgName}"`);

    jsonResponse(res, 200, { success: true, message: `Access for ${pkgName} set to "${level}"` });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- POST /api/update ----

API_ROUTES.POST['/api/update'] = async (req, res, _url) => {
  try {
    const body = await parseBody(req);
    const skillId = body.skillId ? String(body.skillId) : undefined;

    await updateSkill(skillId);

    const msg = skillId
      ? `${skillId} updated successfully`
      : 'All skills updated successfully';
    jsonResponse(res, 200, { success: true, message: msg });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- POST /api/upload ----

API_ROUTES.POST['/api/upload'] = async (req, res, _url) => {
  try {
    const body = await parseBody(req);
    const fileData = String(body.fileData || '');     // base64 encoded zip
    const fileName = String(body.fileName || 'upload.zip');
    const skillNameOverride = body.skillNameOverride ? String(body.skillNameOverride).trim() : '';

    if (!fileData) {
      jsonResponse(res, 400, { error: 'Missing fileData' });
      return;
    }

    // Decode base64 zip
    const buffer = Buffer.from(fileData, 'base64');
    if (buffer.length === 0) {
      jsonResponse(res, 400, { error: 'Empty file data' });
      return;
    }

    // Size validation
    if (buffer.length > MAX_UPLOAD_SIZE) {
      const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
      jsonResponse(res, 400, { error: `File too large (${sizeMB} MB). Maximum is 50 MB.` });
      return;
    }

    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    if (entries.length === 0) {
      jsonResponse(res, 400, { error: 'ZIP archive is empty' });
      return;
    }

    // Normalize entry name helper: strip ./ prefix, normalize backslashes
    const normalizeEntryName = (name: string) => name.replace(/\\/g, '/').replace(/^\.\//, '');

    // Read package.json from zip to determine skill name
    // Handle various zip formats: package.json, ./package.json, my-skill/package.json, my-skill\package.json
    const pkgEntry = entries.find(e => {
      const normalized = normalizeEntryName(e.entryName);
      return normalized === 'package.json' || normalized.endsWith('/package.json');
    });
    let skillName = '';
    let pkgInfo: UploadPkgInfo = {};

    if (pkgEntry) {
      try {
        pkgInfo = JSON.parse(pkgEntry.getData().toString('utf-8'));
        skillName = pkgInfo.skillmarket?.id || pkgInfo.name?.replace(/^@[^/]+\//, '') || '';
      } catch { /* ignore invalid json */ }
    }

    // Override: use user-provided name if given
    if (skillNameOverride) {
      skillName = skillNameOverride;
    }

    // Fallback: use file name (without .zip) or extract from zip root dir name
    if (!skillName) {
      const rootDirs = [...new Set(entries.map(e => e.entryName.split('/')[0]))].filter(Boolean);
      skillName = rootDirs.length === 1 ? rootDirs[0] : basename(fileName, '.zip');
    }

    // Sanitize skill name
    skillName = skillName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    if (!skillName) skillName = 'untitled-skill';

    // 使用系统临时目录，不依赖 PROJECT_ROOT
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempDir = join(tmpdir(), `skm-upload-${uploadId}`);

    // Ensure target directory is clean
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });

    // Extract all entries
    zip.extractAllTo(tempDir, true);

    // Flatten: 如果解压后只有一个子目录（常见于文件夹压缩的 ZIP），将其内容提到根目录
    // 这样 publish / install 才能正确找到 package.json / SKILL.md
    const extractedItems = readdirSync(tempDir, { withFileTypes: true });
    const subDirs = extractedItems.filter(i => i.isDirectory());
    const files = extractedItems.filter(i => !i.isDirectory());
    if (subDirs.length === 1 && files.length === 0) {
      const subDirPath = join(tempDir, subDirs[0].name);
      const subItems = readdirSync(subDirPath, { withFileTypes: true });
      for (const item of subItems) {
        renameSync(join(subDirPath, item.name), join(tempDir, item.name));
      }
      rmSync(subDirPath, { recursive: true, force: true });
    }

    // 解压后从磁盘递归搜索 SKILL.md 和 package.json
    const skillMdPath = findFileSync(tempDir, 'SKILL.md');
    const skillMdExists = skillMdPath !== null;

    const pkgJsonPath = findFileSync(tempDir, 'package.json') || join(tempDir, 'package.json');

    if (existsSync(pkgJsonPath)) {
      try {
        pkgInfo = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
      } catch { /* keep existing pkgInfo */ }
    }

    const meta = pkgInfo?.skillmarket || {};

    const result = {
      skillName,
      displayName: meta.displayName || pkgInfo.displayName || skillName,
      version: pkgInfo.version || '0.0.0',
      description: pkgInfo.description || meta.description || '',
      platforms: meta.platforms || [],
      hasPackageJson: existsSync(pkgJsonPath),
      hasSkillMd: skillMdExists,
      fileCount: entries.length,
      tempDir, // 返回临时目录路径，供后续 action 使用
    };

    jsonResponse(res, 200, result);
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// ---- POST /api/upload/action ----

API_ROUTES.POST['/api/upload/action'] = async (req, res, _url) => {
  try {
    const body = await parseBody(req);
    const skillName = String(body.skillName || '');
    const action = String(body.action || ''); // 'publish' | 'install' | 'both'
    const tempDir = body.tempDir ? String(body.tempDir) : '';

    if (!skillName) {
      jsonResponse(res, 400, { error: 'Missing skillName' });
      return;
    }
    if (!['publish', 'install', 'both'].includes(action)) {
      jsonResponse(res, 400, { error: 'action must be "publish", "install", or "both"' });
      return;
    }

    if (!tempDir || !existsSync(tempDir)) {
      jsonResponse(res, 404, { error: 'Upload session expired or not found. Please upload again.' });
      return;
    }

    const results: Record<string, { success: boolean; message: string }> = {};

    if (action === 'publish' || action === 'both') {
      try {
        await publishSkill(skillName, { skillDir: tempDir });
        results.publish = { success: true, message: `${skillName} published to npm` };
      } catch (err) {
        results.publish = { success: false, message: String(err) };
      }
    }

    if (action === 'install' || action === 'both') {
      try {
        // 使用本地安装模式，从 tempDir 安装，不走 npm
        await installSkill(skillName, undefined, { force: true, sourceDir: tempDir });
        results.install = { success: true, message: `${skillName} installed locally` };
      } catch (err) {
        results.install = { success: false, message: String(err) };
      }
    }

    // 清理临时目录
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch { /* ignore cleanup errors */ }

    jsonResponse(res, 200, { success: true, skillName, action, results });
  } catch (err) {
    jsonResponse(res, 500, { error: String(err) });
  }
};

// -----------------------------------------------------------------------------
// 静态文件服务
// -----------------------------------------------------------------------------

/**
 * 递归搜索文件，在 dir 下找名为 filename 的文件
 * 解压后不知道 zip 的结构（是否有子目录），用这个来找 package.json / SKILL.md
 */
function findFileSync(dir: string, filename: string): string | null {
  try {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = join(dir, item.name);
      if (item.isDirectory()) {
        const found = findFileSync(fullPath, filename);
        if (found) return found;
      } else if (item.name === filename) {
        return fullPath;
      }
    }
  } catch { /* permission denied, skip */ }
  return null;
}

function serveStaticFile(res: ServerResponse, filePath: string): void {
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const content = readFileSync(filePath);
  const ext = extname(filePath);
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  // 禁用缓存，确保浏览器总是加载最新版本的前端文件
  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  res.end(content);
}

// -----------------------------------------------------------------------------
// 路由分发
// -----------------------------------------------------------------------------

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // API 路由
  const routeHandler = API_ROUTES[method]?.[pathname];
  if (routeHandler) {
    try {
      await routeHandler(req, res, url);
    } catch (err) {
      jsonResponse(res, 500, { error: String(err) });
    }
    return;
  }

  // API 404（未知 API 端点）
  if (pathname.startsWith('/api/')) {
    jsonResponse(res, 404, { error: `Unknown API endpoint: ${method} ${pathname}` });
    return;
  }

  // 静态文件
  const filePath = join(guiDir, pathname === '/' ? 'index.html' : pathname);
  if (filePath.startsWith(guiDir)) {
    serveStaticFile(res, filePath);
  } else {
    res.writeHead(403);
    res.end('Forbidden');
  }
}

// -----------------------------------------------------------------------------
// 导出
// -----------------------------------------------------------------------------

/**
 * 启动 GUI 服务器
 *
 * @param port - 监听端口（默认 18770）
 */
export function startGuiServer(port: number = 18770): import('http').Server {
  const server = createServer(handleRequest);

  server.listen(port, '127.0.0.1', () => {
    console.log(`\n🚀 SkillMarket GUI started!`);
    console.log(`   Local: http://localhost:${port}`);
    console.log(`\nPress Ctrl+C to stop\n`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use. Try: skm gui ${port + 1}`);
    } else {
      console.error('❌ Failed to start GUI server:', err.message);
    }
    process.exit(1);
  });

  return server;
}

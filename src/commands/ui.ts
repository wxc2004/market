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
import { readFileSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

// 数据层函数（直接返回数据，无 console.log 副作用）
import { searchSkillmarketPackages, fetchNpmPackage } from './npm.js';
import { getInstalledSkills } from './registry.js';
import { detectPlatforms, getAllAdapters } from '../adapters/index.js';

// 命令函数（用于写操作）
import { installSkill } from './install.js';
import { uninstallSkill } from './uninstall.js';
import { updateSkill } from './update.js';

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

/** 简单内存缓存 */
const cache = new Map<string, { data: unknown; expiry: number }>();
function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) { cache.delete(key); return null; }
  return entry.data as T;
}
function setCache(key: string, data: unknown, ttlMs = 60_000): void {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

/** 限制并发数的 map helper（每个 npm 请求间隔至少 200ms） */
async function throttledMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency = 3,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((item, idx) => fn(item, i + idx)));
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await new Promise(r => setTimeout(r, 200)); // 批次间延迟
    }
  }
  return results;
}

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
};

// ---- GET /api/skills ----

API_ROUTES.GET['/api/skills'] = async (_req, res, url) => {
  try {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const search = url.searchParams.get('search') || '';

    const cacheKey = `search:${search}:limit:${limit}`;

    // 先从缓存获取搜索结果
    let searchResult = getCached<{ packages: string[]; total: number }>(cacheKey);
    if (!searchResult) {
      searchResult = await searchSkillmarketPackages({
        from: 0,
        size: 100, // 一次拉取更多，避免分页
        keyword: search || undefined,
      });
      // 缓存 30 秒减少 registry 压力
      setCache(cacheKey, searchResult, 30_000);
    }

    const { packages, total } = searchResult;

    // 逐个获取详情（限流，避免 npm 限流）
    let fetchErrors = 0;
    const skillDetails = await throttledMap(packages, async (pkgName) => {
      try {
        const pkgCacheKey = `pkg:${pkgName}`;
        let info = getCached<any>(pkgCacheKey);
        if (!info) {
          info = await fetchNpmPackage(pkgName);
          if (info) setCache(pkgCacheKey, info, 30_000);
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
          author: info.author?.name || pkg?.author?.name || '',
          homepage: pkg?.homepage || '',
          repository: pkg?.repository?.url || '',
        };
      } catch {
        fetchErrors++;
        return null;
      }
    }, 3);

    const skills = skillDetails.filter(Boolean);
    const totalPages = Math.ceil(total / limit) || 1;

    jsonResponse(res, 200, { skills, page, totalPages, total, fetchErrors });
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
        };
      })
    );

    jsonResponse(res, 200, platforms);
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
    let info = getCached<any>(cacheKey);
    if (!info) {
      info = await fetchNpmPackage(skillName);
      if (info) setCache(cacheKey, info, 30_000);
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
      author: info.author?.name || pkg?.author?.name || '',
      license: info.license || '',
      homepage: pkg?.homepage || '',
      repository: pkg?.repository?.url || '',
      readme: info.readme || '',
    });
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

// -----------------------------------------------------------------------------
// 静态文件服务
// -----------------------------------------------------------------------------

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
export function startGuiServer(port: number = 18770): void {
  const server = createServer(handleRequest);

  server.listen(port, () => {
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
}

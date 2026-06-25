/**
 * Tests for commands/install.ts — skill installation
 *
 * Mocks: fs-extra, tar, child_process.exec, and all internal imports.
 * exec is mocked to call its callback so util.promisify works naturally.
 */

import path from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock adapters (shared test data) ──────────────────────────────────────
const { mockOpenCodeAdapter } = vi.hoisted(() => {
  const moc = {
    id: 'opencode',
    name: 'OpenCode',
    skillDir: '/mock/opencode',
    isAvailable: vi.fn(),
    isInstalled: vi.fn(),
    install: vi.fn(),
    uninstall: vi.fn(),
    listInstalled: vi.fn(),
  };
  return { mockOpenCodeAdapter: moc };
});

// ── Module-level mocks ─────────────────────────────────────────────────────
vi.mock('child_process', () => ({
  exec: vi.fn((_cmd: string, cb?: (err: Error | null, result: { stdout: string; stderr: string }) => void) => {
    cb?.(null, { stdout: 'package.tgz\n', stderr: '' });
  }),
}));

vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    ensureDir: vi.fn(),
    copy: vi.fn(),
    move: vi.fn(),
    remove: vi.fn(),
    symlink: vi.fn(),
    stat: vi.fn(),
  },
}));

vi.mock('tar', () => ({
  extract: vi.fn(),
}));

vi.mock('./npm.js', () => ({
  fetchSkillPackage: vi.fn(),
}));

vi.mock('./registry.js', () => ({
  loadRegistry: vi.fn(),
  saveRegistry: vi.fn(),
}));

vi.mock('../utils/dirs.js', () => ({
  getCacheDir: vi.fn(() => '/mock/cache'),
  getSkillsDir: vi.fn(() => '/mock/skills'),
  ensureMarketDirs: vi.fn(),
  getRegistryPath: vi.fn(() => '/mock/registry.json'),
  getMarketHome: vi.fn(() => '/mock/market'),
}));

vi.mock('../adapters/index.js', () => ({
  detectPlatforms: vi.fn(),
  getAdapterByPlatform: vi.fn(),
  getPlatformAdapter: vi.fn(),
  getAllAdapters: vi.fn(),
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────
import fs from 'fs-extra';
import * as tar from 'tar';
import { exec } from 'child_process';
import { fetchSkillPackage } from './npm.js';
import { loadRegistry, saveRegistry } from './registry.js';
import { ensureMarketDirs, getSkillsDir, getCacheDir } from '../utils/dirs.js';
import { detectPlatforms, getAdapterByPlatform } from '../adapters/index.js';
import { installSkill } from './install.js';
import type { Platform } from '../constants.js';

// ── Test data ──────────────────────────────────────────────────────────────

const mockNpmPkgInfo = {
  name: '@itismyskillmarket/test-skill',
  'dist-tags': { latest: '1.0.0' },
  versions: { '1.0.0': { name: '@itismyskillmarket/test-skill', version: '1.0.0' } },
};

const mockRegistryData = { skills: {}, lastUpdated: '2026-01-01T00:00:00.000Z' };

// ── Helpers ────────────────────────────────────────────────────────────────

function setupCommonMocks() {
  vi.mocked(ensureMarketDirs).mockResolvedValue(undefined);
  vi.mocked(loadRegistry).mockResolvedValue({ ...mockRegistryData, skills: {} });
  vi.mocked(saveRegistry).mockResolvedValue(undefined);
  vi.mocked(getSkillsDir).mockReturnValue('/mock/skills');
  vi.mocked(getCacheDir).mockReturnValue('/mock/cache');
  vi.mocked(tar.extract).mockResolvedValue(undefined as never);
}

/**
 * Mock fs.pathExists using normalized path matching (handles Windows \ and /).
 * Provide path substrings as keys, values are the boolean to return.
 */
function mockPathExists(overrides: Record<string, boolean>, defaultVal = false) {
  // Sort keys by length ascending so shorter/substring keys match before longer ones.
  // This prevents a prefix like '@itismyskillmarket/test-skill@1.0.0' from blocking
  // a more specific check like 'SKILL.md' that shares the same prefix.
  const entries = Object.entries(overrides).sort((a, b) => a[0].length - b[0].length);
  vi.mocked(fs.pathExists).mockImplementation(async (p: string) => {
    const normalized = p.replace(/\\/g, '/');
    for (const [key, val] of entries) {
      if (normalized.includes(key.replace(/\\/g, '/'))) return val;
    }
    return defaultVal;
  });
}

function mockDetectedPlatforms(adapters: object[]) {
  vi.mocked(detectPlatforms).mockResolvedValue(adapters as never[]);
}

function mockGetAdapterByPlatform(platform: string, adapter: object | undefined) {
  vi.mocked(getAdapterByPlatform).mockImplementation(
    (p: Platform) => (String(p) === platform ? adapter : undefined) as never,
  );
}

function freshAdapter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'opencode',
    name: 'OpenCode',
    skillDir: '/mock/opencode',
    isAvailable: vi.fn(),
    isInstalled: vi.fn(),
    install: vi.fn(),
    uninstall: vi.fn(),
    listInstalled: vi.fn(),
    ...overrides,
  };
}

/** Check if any exec call matches the given substring */
function execCalledWith(substring: string): boolean {
  return (vi.mocked(exec).mock.calls as unknown[][]).some(
    (call) => typeof call[0] === 'string' && (call[0] as string).includes(substring),
  );
}

/** Count exec calls matching given substring */
function execCallsMatching(substring: string): number {
  return (vi.mocked(exec).mock.calls as unknown[][]).filter(
    (call) => typeof call[0] === 'string' && (call[0] as string).includes(substring),
  ).length;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('installSkill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupCommonMocks();
  });

  // ── Local source (sourceDir) ──────────────────────────────────────────

  describe('local source installation (sourceDir)', () => {
    it('installs from local source directory', async () => {
      mockPathExists({
        '/local/source/SKILL.md': true,
        '/local/source/metadata.json': true,
      });
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ version: '0.0.0' }));
      mockDetectedPlatforms([]);

      await installSkill('test-skill', undefined, { sourceDir: '/local/source' });

      expect(fs.copy).toHaveBeenCalledTimes(2);
      // Use path-agnostic assertions (works on both win32 and posix)
      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringMatching(/SKILL\.md$/),
        expect.stringMatching(/test-skill@0\.0\.0/),
      );
      expect(saveRegistry).toHaveBeenCalled();
    });

    it('reads version from local package.json', async () => {
      mockPathExists({
        '/local/source/package.json': true,
        '/local/source/SKILL.md': true,
        '/local/source/metadata.json': true,
      });
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ version: '2.1.0' }));
      mockDetectedPlatforms([]);

      await installSkill('test-skill', undefined, { sourceDir: '/local/source' });

      expect(fs.copy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/test-skill@2\.1\.0/),
      );
    });

    it('uses 0.0.0 when no package.json', async () => {
      mockPathExists({
        '/local/source/SKILL.md': true,
        '/local/source/metadata.json': true,
      });
      mockDetectedPlatforms([]);

      await installSkill('test-skill', undefined, { sourceDir: '/local/source' });

      expect(fs.copy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/test-skill@0\.0\.0/),
      );
    });

    it('handles package.json parse error gracefully', async () => {
      mockPathExists({
        '/local/source/package.json': true,
        '/local/source/SKILL.md': true,
        '/local/source/metadata.json': true,
      });
      vi.mocked(fs.readFile).mockResolvedValue('not valid json');
      mockDetectedPlatforms([]);

      await expect(
        installSkill('test-skill', undefined, { sourceDir: '/local/source' }),
      ).resolves.toBeUndefined();

      expect(fs.copy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/test-skill@0\.0\.0/),
      );
    });
  });

  // ── npm installation ──────────────────────────────────────────────────

  describe('npm installation', () => {
    beforeEach(() => {
      vi.mocked(fetchSkillPackage).mockResolvedValue(mockNpmPkgInfo as never);
    });

    function npmPathExists() {
      mockPathExists({
        '/mock/cache/@itismyskillmarket/test-skill@1.0.0': false,
        'package.tgz': true,
        'SKILL.md': true,
        'metadata.json': true,
      });
    }

    it('installs from npm registry', async () => {
      npmPathExists();
      await installSkill('test-skill');

      expect(fetchSkillPackage).toHaveBeenCalledWith('test-skill');
      expect(fs.copy).toHaveBeenCalled();
      expect(saveRegistry).toHaveBeenCalled();
    });

    it('uses specified version', async () => {
      npmPathExists();
      await installSkill('test-skill', '1.0.0');

      expect(execCalledWith('npm pack')).toBe(true);
    });

    it('throws when package not found', async () => {
      vi.mocked(fetchSkillPackage).mockResolvedValue(null);
      mockPathExists({});
      mockDetectedPlatforms([]);

      await expect(installSkill('nonexistent')).rejects.toThrow('not found');
    });

    it('throws when no version available', async () => {
      vi.mocked(fetchSkillPackage).mockResolvedValue({
        name: '@itismyskillmarket/empty',
        'dist-tags': {},
        versions: {},
      } as never);
      mockPathExists({});
      mockDetectedPlatforms([]);

      await expect(installSkill('empty')).rejects.toThrow('No version');
    });

    it('falls back to copy when symlink fails', async () => {
      npmPathExists();
      // Make symlink throw so the catch block does fs.copy
      vi.mocked(fs.symlink).mockRejectedValue(new Error('symlink not supported'));

      await installSkill('test-skill');

      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringMatching(/test-skill@1\.0\.0/),
        expect.stringMatching(/latest/),
        expect.objectContaining({ overwrite: true }),
      );
    });

    it('skips download when package already cached', async () => {
      mockPathExists({
        '/mock/cache/@itismyskillmarket/test-skill@1.0.0': true,
        'SKILL.md': true,
        'metadata.json': true,
      });

      await installSkill('test-skill');

      // npm pack should NOT be called (cache hit — no download needed)
      expect(execCallsMatching('npm pack')).toBe(0);
    });
  });

  // ── Platform installation ────────────────────────────────────────────

  describe('platform installation', () => {
    beforeEach(() => {
      vi.mocked(fetchSkillPackage).mockResolvedValue(mockNpmPkgInfo as never);
      mockPathExists({
        '/mock/cache/@itismyskillmarket/test-skill@1.0.0': false,
        'package.tgz': true,
        'SKILL.md': true,
        'metadata.json': true,
      });
    });

    it('installs to specified platform', async () => {
      const adapter = freshAdapter();
      vi.mocked(adapter.isInstalled).mockResolvedValue(false);
      vi.mocked(adapter.install).mockResolvedValue(undefined);
      mockGetAdapterByPlatform('opencode', adapter);

      await installSkill('test-skill', undefined, { platforms: ['opencode'] });

      expect(adapter.install).toHaveBeenCalledWith('test-skill', expect.any(String));
    });

    it('skips platform if already installed (no force)', async () => {
      const adapter = freshAdapter();
      vi.mocked(adapter.isInstalled).mockResolvedValue(true);
      mockGetAdapterByPlatform('opencode', adapter);

      await installSkill('test-skill', undefined, { platforms: ['opencode'] });

      expect(adapter.install).not.toHaveBeenCalled();
    });

    it('forces install when --force is used', async () => {
      const adapter = freshAdapter();
      vi.mocked(adapter.isInstalled).mockResolvedValue(true);
      vi.mocked(adapter.install).mockResolvedValue(undefined);
      mockGetAdapterByPlatform('opencode', adapter);

      await installSkill('test-skill', undefined, { platforms: ['opencode'], force: true });

      expect(adapter.install).toHaveBeenCalled();
    });

    it('warns on unknown platform but does not throw', async () => {
      mockGetAdapterByPlatform('unknown' as string, undefined);

      await expect(
        installSkill('test-skill', undefined, { platforms: ['unknown' as string] }),
      ).resolves.toBeUndefined();

      expect(saveRegistry).toHaveBeenCalled();
    });

    it('auto-detects platforms when none specified', async () => {
      const adapter = freshAdapter();
      vi.mocked(adapter.isInstalled).mockResolvedValue(false);
      vi.mocked(adapter.install).mockResolvedValue(undefined);
      mockDetectedPlatforms([adapter]);

      await installSkill('test-skill');

      expect(detectPlatforms).toHaveBeenCalled();
      expect(adapter.install).toHaveBeenCalledWith('test-skill', expect.any(String));
    });

    it('installs to multiple auto-detected platforms', async () => {
      const a1 = freshAdapter({ id: 'opencode', name: 'OpenCode' });
      const a2 = freshAdapter({ id: 'claude', name: 'Claude Code' });
      vi.mocked(a1.isInstalled).mockResolvedValue(false);
      vi.mocked(a2.isInstalled).mockResolvedValue(false);
      vi.mocked(a1.install).mockResolvedValue(undefined);
      vi.mocked(a2.install).mockResolvedValue(undefined);
      mockDetectedPlatforms([a1, a2]);

      await installSkill('test-skill');

      expect(a1.install).toHaveBeenCalled();
      expect(a2.install).toHaveBeenCalled();
    });

    it('saves registry with empty platforms when none detected', async () => {
      mockPathExists({
        '/local/source/SKILL.md': true,
        '/local/source/metadata.json': true,
      });
      mockDetectedPlatforms([]);

      await installSkill('test-skill', undefined, { sourceDir: '/local/source' });

      expect(detectPlatforms).toHaveBeenCalled();
      expect(saveRegistry).toHaveBeenCalled();
      const saved = vi.mocked(saveRegistry).mock.calls[0][0];
      expect(saved.skills['test-skill']).toBeDefined();
      expect(saved.skills['test-skill'].platforms).toEqual([]);
    });
  });
});

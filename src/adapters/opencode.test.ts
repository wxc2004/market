/**
 * Tests for adapters/opencode.ts — OpenCodeAdapter
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { OpenCodeAdapter } from './opencode.js';

let tmpDir: string;
let adapter: OpenCodeAdapter;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skm-opencode-test-'));
  process.env.OPENCODE_CONFIG_DIR = path.join(tmpDir, '.config', 'opencode');
  adapter = new OpenCodeAdapter();
});

afterEach(async () => {
  delete process.env.OPENCODE_CONFIG_DIR;
  await fs.remove(tmpDir);
});

describe('OpenCodeAdapter', () => {
  it('has id "opencode"', () => {
    expect(adapter.id).toBe('opencode');
  });

  it('has name "OpenCode"', () => {
    expect(adapter.name).toBe('OpenCode');
  });

  it('uses OPENCODE_CONFIG_DIR env var for skillDir', () => {
    expect(adapter.skillDir).toBe(path.join(tmpDir, '.config', 'opencode', 'skills'));
  });

  it('isAvailable returns true when directory can be created', async () => {
    const result = await adapter.isAvailable();
    expect(result).toBe(true);
  });

  it('isAvailable returns true when OPENCODE env var is set', async () => {
    process.env.OPENCODE = '1';
    // Delete config dir so only env var triggers availability
    await fs.remove(path.join(tmpDir, '.config'));
    const result = await adapter.isAvailable();
    expect(result).toBe(true);
    delete process.env.OPENCODE;
  });

  it('install copies SKILL.md to skillDir', async () => {
    const sourceDir = path.join(tmpDir, 'source');
    await fs.ensureDir(sourceDir);
    await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Skill content');

    await adapter.install('test-skill', sourceDir);

    const targetFile = path.join(adapter.skillDir, 'test-skill', 'SKILL.md');
    expect(await fs.pathExists(targetFile)).toBe(true);
    expect(await fs.readFile(targetFile, 'utf-8')).toBe('# Skill content');
  });

  it('uninstall removes skill directory', async () => {
    const sourceDir = path.join(tmpDir, 'source');
    await fs.ensureDir(sourceDir);
    await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Skill');
    await adapter.install('test-skill', sourceDir);

    expect(await adapter.isInstalled('test-skill')).toBe(true);

    await adapter.uninstall('test-skill');
    expect(await adapter.isInstalled('test-skill')).toBe(false);
  });
});

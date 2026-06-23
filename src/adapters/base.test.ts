/**
 * Tests for adapters/base.ts — BaseAdapter
 *
 * Uses a temporary directory to test filesystem operations.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { BaseAdapter } from './base.js';

// ── Concrete adapter for testing ─────────────────────────────────────────

class TestAdapter extends BaseAdapter {
  readonly id = 'test';
  readonly name = 'Test Platform';
  readonly skillDir: string;

  constructor(tmpDir: string) {
    super();
    this.skillDir = path.join(tmpDir, 'skills');
  }
}

// ── Fixtures ─────────────────────────────────────────────────────────────

let tmpDir: string;
let adapter: TestAdapter;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skm-base-test-'));
  adapter = new TestAdapter(tmpDir);
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

// ── Tests ────────────────────────────────────────────────────────────────

describe('BaseAdapter', () => {
  describe('identity', () => {
    it('has id "test"', () => {
      expect(adapter.id).toBe('test');
    });

    it('has name "Test Platform"', () => {
      expect(adapter.name).toBe('Test Platform');
    });

    it('uses provided skillDir', () => {
      expect(adapter.skillDir).toBe(path.join(tmpDir, 'skills'));
    });
  });

  describe('isAvailable', () => {
    it('returns false when skillDir does not exist', async () => {
      const result = await adapter.isAvailable();
      expect(result).toBe(false);
    });

    it('returns true when skillDir already exists', async () => {
      await fs.ensureDir(adapter.skillDir);
      const result = await adapter.isAvailable();
      expect(result).toBe(true);
    });
  });

  describe('install', () => {
    it('copies SKILL.md from source to target', async () => {
      // Arrange: create a source with SKILL.md
      const sourceDir = path.join(tmpDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Test Skill\n\nHello world');

      // Act
      await adapter.install('my-skill', sourceDir);

      // Assert
      const targetFile = path.join(adapter.skillDir, 'my-skill', 'SKILL.md');
      expect(await fs.pathExists(targetFile)).toBe(true);
      const content = await fs.readFile(targetFile, 'utf-8');
      expect(content).toBe('# Test Skill\n\nHello world');
    });

    it('throws when source has no SKILL.md', async () => {
      const sourceDir = path.join(tmpDir, 'empty-source');
      await fs.ensureDir(sourceDir);

      await expect(adapter.install('my-skill', sourceDir)).rejects.toThrow('SKILL.md not found');
    });

    it('overwrites existing SKILL.md', async () => {
      // Arrange: pre-install a skill
      const sourceDir = path.join(tmpDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# v1');

      await adapter.install('my-skill', sourceDir);

      // Arrange: new version
      await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# v2');

      // Act
      await adapter.install('my-skill', sourceDir);

      // Assert
      const targetFile = path.join(adapter.skillDir, 'my-skill', 'SKILL.md');
      const content = await fs.readFile(targetFile, 'utf-8');
      expect(content).toBe('# v2');
    });
  });

  describe('isInstalled', () => {
    it('returns false when skill is not installed', async () => {
      const result = await adapter.isInstalled('nonexistent');
      expect(result).toBe(false);
    });

    it('returns true when skill SKILL.md exists', async () => {
      const sourceDir = path.join(tmpDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Test');
      await adapter.install('my-skill', sourceDir);

      const result = await adapter.isInstalled('my-skill');
      expect(result).toBe(true);
    });
  });

  describe('uninstall', () => {
    it('removes skill directory', async () => {
      // Arrange: install a skill
      const sourceDir = path.join(tmpDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Test');
      await adapter.install('my-skill', sourceDir);

      expect(await adapter.isInstalled('my-skill')).toBe(true);

      // Act
      await adapter.uninstall('my-skill');

      // Assert
      expect(await adapter.isInstalled('my-skill')).toBe(false);
      expect(await fs.pathExists(path.join(adapter.skillDir, 'my-skill'))).toBe(false);
    });

    it('does not error when uninstalling nonexistent skill', async () => {
      await expect(adapter.uninstall('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('listInstalled', () => {
    it('returns empty array when no skills installed', async () => {
      const list = await adapter.listInstalled();
      expect(list).toEqual([]);
    });

    it('returns list of installed skill IDs', async () => {
      const sourceDir = path.join(tmpDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Test');

      await adapter.install('skill-a', sourceDir);
      await adapter.install('skill-b', sourceDir);

      const list = await adapter.listInstalled();
      expect(list).toEqual(expect.arrayContaining(['skill-a', 'skill-b']));
      expect(list.length).toBe(2);
    });

    it('only counts directories with SKILL.md', async () => {
      // Create a directory without SKILL.md (should not be listed)
      await fs.ensureDir(path.join(adapter.skillDir, 'not-a-skill'));

      // Install a real skill
      const sourceDir = path.join(tmpDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Test');
      await adapter.install('real-skill', sourceDir);

      const list = await adapter.listInstalled();
      expect(list).toEqual(['real-skill']);
    });
  });
});

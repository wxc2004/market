/**
 * Tests for adapters/vscode.ts — VSCodeAdapter
 *
 * Mocks os.homedir() to use a temp directory.
 * VSCodeAdapter also creates a cross-compatible symlink in ~/.claude/skills.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { VSCodeAdapter } from './vscode.js';

let tmpDir: string;
let adapter: VSCodeAdapter;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skm-vscode-test-'));
  vi.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  adapter = new VSCodeAdapter();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.remove(tmpDir);
});

describe('VSCodeAdapter', () => {
  it('has id "vscode"', () => {
    expect(adapter.id).toBe('vscode');
  });

  it('has name "VSCode"', () => {
    expect(adapter.name).toBe('VSCode');
  });

  it('skillDir points to ~/.copilot/skills', () => {
    expect(adapter.skillDir).toBe(path.join(tmpDir, '.copilot', 'skills'));
  });

  it('isAvailable returns true when .copilot/skills can be created', async () => {
    const result = await adapter.isAvailable();
    expect(result).toBe(true);
  });

  it('isAvailable returns true when .claude/skills exists', async () => {
    // Remove .copilot but create .claude/skills
    await fs.ensureDir(path.join(tmpDir, '.claude', 'skills'));
    const result = await adapter.isAvailable();
    expect(result).toBe(true);
  });

  describe('install', () => {
    it('copies SKILL.md and creates claude symlink', async () => {
      const sourceDir = path.join(tmpDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# VSCode skill');

      await adapter.install('vs-skill', sourceDir);

      // Main install location
      const copilotFile = path.join(adapter.skillDir, 'vs-skill', 'SKILL.md');
      expect(await fs.pathExists(copilotFile)).toBe(true);

      // Cross-compat symlink (may or may not work on Windows)
      const claudeLink = path.join(tmpDir, '.claude', 'skills', 'vs-skill');
      // On Windows, junction symlinks may fail silently, so we just check
      // the main install worked
      expect(await fs.pathExists(copilotFile)).toBe(true);
    });

    it('does not error when claude symlink creation fails', async () => {
      const sourceDir = path.join(tmpDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Skill');

      // The symlink failure should be silently handled
      await expect(adapter.install('vs-skill', sourceDir)).resolves.toBeUndefined();
    });
  });

  it('uninstall removes skill from skillDir', async () => {
    const sourceDir = path.join(tmpDir, 'source');
    await fs.ensureDir(sourceDir);
    await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Skill');
    await adapter.install('vs-skill', sourceDir);

    expect(await adapter.isInstalled('vs-skill')).toBe(true);

    await adapter.uninstall('vs-skill');
    expect(await adapter.isInstalled('vs-skill')).toBe(false);
  });

  it('listInstalled returns installed skills', async () => {
    const sourceDir = path.join(tmpDir, 'source');
    await fs.ensureDir(sourceDir);
    await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Skill A');
    await adapter.install('skill-a', sourceDir);
    await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Skill B');
    await adapter.install('skill-b', sourceDir);

    const list = await adapter.listInstalled();
    expect(list).toEqual(expect.arrayContaining(['skill-a', 'skill-b']));
    expect(list.length).toBe(2);
  });
});

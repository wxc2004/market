/**
 * Tests for adapters/claude.ts — ClaudeAdapter
 *
 * Mocks os.homedir() to use a temp directory.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { ClaudeAdapter } from './claude.js';

let tmpDir: string;
let adapter: ClaudeAdapter;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skm-claude-test-'));
  vi.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  adapter = new ClaudeAdapter();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.remove(tmpDir);
});

describe('ClaudeAdapter', () => {
  it('has id "claude"', () => {
    expect(adapter.id).toBe('claude');
  });

  it('has name "Claude Code"', () => {
    expect(adapter.name).toBe('Claude Code');
  });

  it('skillDir points to ~/.claude/skills', () => {
    expect(adapter.skillDir).toBe(path.join(tmpDir, '.claude', 'skills'));
  });

  it('isAvailable returns true when CLAUDE_CODE env var is set', async () => {
    delete process.env.OPENCODE;
    process.env.CLAUDE_CODE = '1';
    const result = await adapter.isAvailable();
    expect(result).toBe(true);
    delete process.env.CLAUDE_CODE;
  });

  it('isAvailable returns true when .claude directory exists', async () => {
    await fs.ensureDir(path.join(tmpDir, '.claude'));
    const result = await adapter.isAvailable();
    expect(result).toBe(true);
  });

  it('isAvailable returns false when .claude does not exist and no env var', async () => {
    delete process.env.CLAUDE_CODE;
    delete process.env.OPENCODE;
    const result = await adapter.isAvailable();
    expect(result).toBe(false);
  });

  it('install copies SKILL.md', async () => {
    const sourceDir = path.join(tmpDir, 'source');
    await fs.ensureDir(sourceDir);
    await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Claude skill');

    await adapter.install('claude-skill', sourceDir);

    const targetFile = path.join(adapter.skillDir, 'claude-skill', 'SKILL.md');
    expect(await fs.pathExists(targetFile)).toBe(true);
  });

  it('uninstall removes skill', async () => {
    const sourceDir = path.join(tmpDir, 'source');
    await fs.ensureDir(sourceDir);
    await fs.writeFile(path.join(sourceDir, 'SKILL.md'), '# Skill');
    await adapter.install('claude-skill', sourceDir);
    expect(await adapter.isInstalled('claude-skill')).toBe(true);

    await adapter.uninstall('claude-skill');
    expect(await adapter.isInstalled('claude-skill')).toBe(false);
  });
});

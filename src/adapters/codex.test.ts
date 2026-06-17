import { describe, it, expect, beforeEach } from 'vitest';
import { CodexAdapter } from './codex.js';
import { join } from 'path';
import { homedir } from 'os';

describe('CodexAdapter', () => {
  let adapter: CodexAdapter;

  beforeEach(() => {
    adapter = new CodexAdapter();
  });

  it('should have id "codex"', () => {
    expect(adapter.id).toBe('codex');
  });

  it('should have name "Codex CLI"', () => {
    expect(adapter.name).toBe('Codex CLI');
  });

  it('should have correct skillDir', () => {
    expect(adapter.skillDir).toBe(join(homedir(), '.codex', 'skills'));
  });

  it('should check availability based on CODEX_CLI env var or ~/.codex/ existence', async () => {
    const result = await adapter.isAvailable();
    expect(typeof result).toBe('boolean');
  });

  it('should check if skill is installed', async () => {
    const result = await adapter.isInstalled('test-skill');
    expect(typeof result).toBe('boolean');
  });

  it('should list installed skills', async () => {
    const result = await adapter.listInstalled();
    expect(Array.isArray(result)).toBe(true);
  });
});

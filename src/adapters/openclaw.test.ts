import { describe, it, expect, beforeEach } from 'vitest';
import { OpenClawAdapter } from './openclaw.js';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

describe('OpenClawAdapter', () => {
  let adapter: OpenClawAdapter;

  beforeEach(() => {
    adapter = new OpenClawAdapter();
  });

  it('should have id "openclaw"', () => {
    expect(adapter.id).toBe('openclaw');
  });

  it('should have name "OpenClaw"', () => {
    expect(adapter.name).toBe('OpenClaw');
  });

  it('should have correct skillDir', () => {
    expect(adapter.skillDir).toBe(join(homedir(), '.openclaw', 'skills'));
  });

  it('should check availability based on ~/.openclaw/ existence', async () => {
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

import { describe, it, expect, beforeEach } from 'vitest';
import { HermesAdapter } from './hermes.js';
import { join } from 'path';
import { homedir } from 'os';

describe('HermesAdapter', () => {
  let adapter: HermesAdapter;

  beforeEach(() => {
    adapter = new HermesAdapter();
  });

  it('should have id "hermes"', () => {
    expect(adapter.id).toBe('hermes');
  });

  it('should have name "Hermes Agent"', () => {
    expect(adapter.name).toBe('Hermes Agent');
  });

  it('should have correct skillDir', () => {
    expect(adapter.skillDir).toBe(join(homedir(), '.hermes', 'skills'));
  });

  it('should check availability based on ~/.hermes/ existence', async () => {
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

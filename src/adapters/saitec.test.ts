import { describe, it, expect, beforeEach } from 'vitest';
import { SaitecAdapter } from './saitec.js';
import { join } from 'path';
import { homedir } from 'os';

describe('SaitecAdapter', () => {
  let adapter: SaitecAdapter;

  beforeEach(() => {
    adapter = new SaitecAdapter();
  });

  it('should have id "saitec"', () => {
    expect(adapter.id).toBe('saitec');
  });

  it('should have name "Saitec TUI"', () => {
    expect(adapter.name).toBe('Saitec TUI');
  });

  it('should have correct skillDir', () => {
    expect(adapter.skillDir).toBe(join(homedir(), '.saitec_tui', 'skills'));
  });

  it('should check availability based on ~/.saitec_tui/ existence', async () => {
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

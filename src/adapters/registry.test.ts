import { describe, it, expect } from 'vitest';
import { getAdapterByPlatform } from './registry.js';
import { OpenClawAdapter } from './openclaw.js';
import { HermesAdapter } from './hermes.js';

describe('getAdapterByPlatform', () => {
  it('should return OpenClawAdapter for "openclaw"', () => {
    const adapter = getAdapterByPlatform('openclaw');
    expect(adapter.id).toBe('openclaw');
    expect(adapter.name).toBe('OpenClaw');
  });

  it('should return HermesAdapter for "hermes"', () => {
    const adapter = getAdapterByPlatform('hermes');
    expect(adapter.id).toBe('hermes');
    expect(adapter.name).toBe('Hermes Agent');
  });

  it('should return adapter for "opencode"', () => {
    const adapter = getAdapterByPlatform('opencode');
    expect(adapter).toBeDefined();
    expect(adapter.id).toBe('opencode');
  });

  it('should return undefined for unknown platform', () => {
    const adapter = getAdapterByPlatform('unknown' as any);
    expect(adapter).toBeUndefined();
  });
});

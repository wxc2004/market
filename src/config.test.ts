/**
 * Tests for config.ts
 *
 * Config values are evaluated at module-import time,
 * so we use vi.resetModules() + dynamic import for each test.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Restore original env before each test
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe('NPM_SCOPE', () => {
  it('uses default @itismyskillmarket when no env or config', async () => {
    delete process.env.SKM_NPM_SCOPE;
    const { NPM_SCOPE } = await import('./config.js');
    expect(NPM_SCOPE).toBe('@itismyskillmarket');
  });

  it('reads from SKM_NPM_SCOPE env var', async () => {
    process.env.SKM_NPM_SCOPE = '@my-custom-scope';
    const { NPM_SCOPE } = await import('./config.js');
    expect(NPM_SCOPE).toBe('@my-custom-scope');
  });
});

describe('NPM_SCOPE_FALLBACK', () => {
  it('uses default @wanxuchen when no env or config', async () => {
    delete process.env.SKM_NPM_SCOPE_FALLBACK;
    const { NPM_SCOPE_FALLBACK } = await import('./config.js');
    expect(NPM_SCOPE_FALLBACK).toBe('@wanxuchen');
  });

  it('reads from SKM_NPM_SCOPE_FALLBACK env var', async () => {
    process.env.SKM_NPM_SCOPE_FALLBACK = '@fallback-scope';
    const { NPM_SCOPE_FALLBACK } = await import('./config.js');
    expect(NPM_SCOPE_FALLBACK).toBe('@fallback-scope');
  });
});

describe('NPM_REGISTRY', () => {
  it('uses default npmjs.org when no env or config', async () => {
    delete process.env.SKM_NPM_REGISTRY;
    const { NPM_REGISTRY } = await import('./config.js');
    expect(NPM_REGISTRY).toBe('https://registry.npmjs.org');
  });

  it('reads from SKM_NPM_REGISTRY env var', async () => {
    process.env.SKM_NPM_REGISTRY = 'https://registry.npmmirror.com';
    const { NPM_REGISTRY } = await import('./config.js');
    expect(NPM_REGISTRY).toBe('https://registry.npmmirror.com');
  });
});

describe('SKILL_SCOPES', () => {
  it('default scope list contains primary scopes', async () => {
    delete process.env.SKM_NPM_SCOPES;
    const { SKILL_SCOPES } = await import('./config.js');
    expect(SKILL_SCOPES).toContain('@itismyskillmarket');
    expect(SKILL_SCOPES).toContain('@wanxuchen');
    expect(SKILL_SCOPES).toContain('@skillmarket');
    expect(SKILL_SCOPES.length).toBeGreaterThanOrEqual(5);
  });

  it('reads from SKM_NPM_SCOPES env var', async () => {
    process.env.SKM_NPM_SCOPES = '@scope-a,@scope-b';
    const { SKILL_SCOPES } = await import('./config.js');
    expect(SKILL_SCOPES).toEqual(['@scope-a', '@scope-b']);
  });

  it('trims whitespace from scope list', async () => {
    process.env.SKM_NPM_SCOPES = ' @scope-a , @scope-b ';
    const { SKILL_SCOPES } = await import('./config.js');
    expect(SKILL_SCOPES).toEqual(['@scope-a', '@scope-b']);
  });

  it('filters empty entries from scope list', async () => {
    process.env.SKM_NPM_SCOPES = '@scope-a,,@scope-b,';
    const { SKILL_SCOPES } = await import('./config.js');
    expect(SKILL_SCOPES).toEqual(['@scope-a', '@scope-b']);
  });
});

describe('SKM_URL', () => {
  it('uses default npmjs URL when no env or config', async () => {
    delete process.env.SKM_URL;
    const { SKM_URL } = await import('./config.js');
    expect(SKM_URL).toContain('npmjs.com');
  });

  it('reads from SKM_URL env var', async () => {
    process.env.SKM_URL = 'https://my-registry.example.com/packages';
    const { SKM_URL } = await import('./config.js');
    expect(SKM_URL).toBe('https://my-registry.example.com/packages');
  });
});

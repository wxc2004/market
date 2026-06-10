import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoisted state to control adapter availability from vi.mock factories
// vi.mock is hoisted, so we use vi.hoisted to create shared mutable state
const { mockAvailability, clearAvailability } = vi.hoisted(() => {
  const state: Record<string, boolean> = {};
  return {
    mockAvailability: state,
    clearAvailability: () => {
      for (const key of Object.keys(state)) {
        delete state[key];
      }
    },
  };
});

// Mock all 5 adapter modules so registry.ts gets controlled instances
// at module load time (registerAdapters() runs at import time)
vi.mock('./opencode.js', () => ({
  OpenCodeAdapter: class {
    id = 'opencode';
    name = 'OpenCode';
    skillDir = '/mock/opencode/skills';
    isAvailable = () => Promise.resolve(!!mockAvailability['opencode']);
    isInstalled = () => Promise.resolve(false);
    install = () => Promise.resolve();
    uninstall = () => Promise.resolve();
    listInstalled = () => Promise.resolve([]);
  },
}));

vi.mock('./claude.js', () => ({
  ClaudeAdapter: class {
    id = 'claude';
    name = 'Claude Code';
    skillDir = '/mock/claude/skills';
    isAvailable = () => Promise.resolve(!!mockAvailability['claude']);
    isInstalled = () => Promise.resolve(false);
    install = () => Promise.resolve();
    uninstall = () => Promise.resolve();
    listInstalled = () => Promise.resolve([]);
  },
}));

vi.mock('./vscode.js', () => ({
  VSCodeAdapter: class {
    id = 'vscode';
    name = 'VSCode';
    skillDir = '/mock/vscode/skills';
    isAvailable = () => Promise.resolve(!!mockAvailability['vscode']);
    isInstalled = () => Promise.resolve(false);
    install = () => Promise.resolve();
    uninstall = () => Promise.resolve();
    listInstalled = () => Promise.resolve([]);
  },
}));

vi.mock('./openclaw.js', () => ({
  OpenClawAdapter: class {
    id = 'openclaw';
    name = 'OpenClaw';
    skillDir = '/mock/openclaw/skills';
    isAvailable = () => Promise.resolve(!!mockAvailability['openclaw']);
    isInstalled = () => Promise.resolve(false);
    install = () => Promise.resolve();
    uninstall = () => Promise.resolve();
    listInstalled = () => Promise.resolve([]);
  },
}));

vi.mock('./hermes.js', () => ({
  HermesAdapter: class {
    id = 'hermes';
    name = 'Hermes Agent';
    skillDir = '/mock/hermes/skills';
    isAvailable = () => Promise.resolve(!!mockAvailability['hermes']);
    isInstalled = () => Promise.resolve(false);
    install = () => Promise.resolve();
    uninstall = () => Promise.resolve();
    listInstalled = () => Promise.resolve([]);
  },
}));

vi.mock('./saitec.js', () => ({
  SaitecAdapter: class {
    id = 'saitec';
    name = 'Saitec TUI';
    skillDir = '/mock/saitec/skills';
    isAvailable = () => Promise.resolve(!!mockAvailability['saitec']);
    isInstalled = () => Promise.resolve(false);
    install = () => Promise.resolve();
    uninstall = () => Promise.resolve();
    listInstalled = () => Promise.resolve([]);
  },
}));

import { detectPlatforms, getPlatformAdapter, getAllAdapters, getAdapterByPlatform } from './registry.js';

// ---------------------------------------------------------------------------
// getAllAdapters
// ---------------------------------------------------------------------------
describe('getAllAdapters', () => {
  it('should return all 6 registered adapters', () => {
    const adapters = getAllAdapters();
    expect(adapters).toHaveLength(6);
  });

  it('should include all expected adapter IDs', () => {
    const adapters = getAllAdapters();
    const ids = adapters.map(a => a.id).sort();
    expect(ids).toEqual(['claude', 'hermes', 'openclaw', 'opencode', 'saitec', 'vscode']);
  });
});

// ---------------------------------------------------------------------------
// getPlatformAdapter
// ---------------------------------------------------------------------------
describe('getPlatformAdapter', () => {
  it('should return opencode adapter for "opencode"', () => {
    const adapter = getPlatformAdapter('opencode');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('opencode');
  });

  it('should return claude adapter for "claude"', () => {
    const adapter = getPlatformAdapter('claude');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('claude');
  });

  it('should return vscode adapter for "vscode"', () => {
    const adapter = getPlatformAdapter('vscode');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('vscode');
  });

  it('should return openclaw adapter for "openclaw"', () => {
    const adapter = getPlatformAdapter('openclaw');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('openclaw');
  });

  it('should return hermes adapter for "hermes"', () => {
    const adapter = getPlatformAdapter('hermes');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('hermes');
  });

  it('should return saitec adapter for "saitec"', () => {
    const adapter = getPlatformAdapter('saitec');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('saitec');
  });

  it('should return undefined for unknown platform id', () => {
    const adapter = getPlatformAdapter('unknown-platform');
    expect(adapter).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    const adapter = getPlatformAdapter('');
    expect(adapter).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getAdapterByPlatform
// ---------------------------------------------------------------------------
describe('getAdapterByPlatform', () => {
  it('should return opencode adapter for "opencode"', () => {
    const adapter = getAdapterByPlatform('opencode');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('opencode');
  });

  it('should return claude adapter for "claude"', () => {
    const adapter = getAdapterByPlatform('claude');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('claude');
  });

  it('should return vscode adapter for "vscode"', () => {
    const adapter = getAdapterByPlatform('vscode');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('vscode');
  });

  it('should return opencode adapter for "cursor" (compatible structure)', () => {
    const adapter = getAdapterByPlatform('cursor');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('opencode');
  });

  it('should return opencode adapter for "codex" (compatible structure)', () => {
    const adapter = getAdapterByPlatform('codex');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('opencode');
  });

  it('should return opencode adapter for "antigravity" (compatible structure)', () => {
    const adapter = getAdapterByPlatform('antigravity');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('opencode');
  });

  it('should return openclaw adapter for "openclaw"', () => {
    const adapter = getAdapterByPlatform('openclaw');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('openclaw');
    expect(adapter!.name).toBe('OpenClaw');
  });

  it('should return hermes adapter for "hermes"', () => {
    const adapter = getAdapterByPlatform('hermes');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('hermes');
    expect(adapter!.name).toBe('Hermes Agent');
  });

  it('should return saitec adapter for "saitec"', () => {
    const adapter = getAdapterByPlatform('saitec');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('saitec');
    expect(adapter!.name).toBe('Saitec TUI');
  });

  it('should return undefined for unknown platform', () => {
    const adapter = getAdapterByPlatform('unknown' as any);
    expect(adapter).toBeUndefined();
  });

  it('should return undefined for null platform', () => {
    const adapter = getAdapterByPlatform(null as any);
    expect(adapter).toBeUndefined();
  });

  it('should return undefined for undefined platform', () => {
    const adapter = getAdapterByPlatform(undefined as any);
    expect(adapter).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// detectPlatforms
// ---------------------------------------------------------------------------
describe('detectPlatforms', () => {
  beforeEach(() => {
    clearAvailability();
  });

  afterEach(() => {
    clearAvailability();
  });

  it('should return empty array when no adapters are available', async () => {
    const available = await detectPlatforms();
    expect(available).toHaveLength(0);
  });

  it('should return only opencode when only opencode is available', async () => {
    mockAvailability['opencode'] = true;
    const available = await detectPlatforms();
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe('opencode');
  });

  it('should return only claude when only claude is available', async () => {
    mockAvailability['claude'] = true;
    const available = await detectPlatforms();
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe('claude');
  });

  it('should return multiple platforms when several are available', async () => {
    mockAvailability['opencode'] = true;
    mockAvailability['claude'] = true;
    mockAvailability['vscode'] = true;
    const available = await detectPlatforms();
    expect(available).toHaveLength(3);
    const ids = available.map(a => a.id).sort();
    expect(ids).toEqual(['claude', 'opencode', 'vscode']);
  });

  it('should return all 5 platforms when all are available', async () => {
    mockAvailability['opencode'] = true;
    mockAvailability['claude'] = true;
    mockAvailability['vscode'] = true;
    mockAvailability['openclaw'] = true;
    mockAvailability['hermes'] = true;
    mockAvailability['saitec'] = true;
    const available = await detectPlatforms();
    expect(available).toHaveLength(6);
    const ids = available.map(a => a.id).sort();
    expect(ids).toEqual(['claude', 'hermes', 'openclaw', 'opencode', 'saitec', 'vscode']);
  });

  it('should not include adapters whose availability returns false', async () => {
    mockAvailability['opencode'] = true;
    mockAvailability['claude'] = false;
    mockAvailability['vscode'] = false;
    mockAvailability['openclaw'] = true;
    mockAvailability['hermes'] = false;
    mockAvailability['saitec'] = false;
    const available = await detectPlatforms();
    expect(available).toHaveLength(2);
    const ids = available.map(a => a.id).sort();
    expect(ids).toEqual(['openclaw', 'opencode']);
  });
});

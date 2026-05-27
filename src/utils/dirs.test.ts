/**
 * Tests for utils/dirs.ts
 *
 * Pure path-computation functions. No mocking needed.
 */
import { describe, it, expect } from 'vitest';
import path from 'path';
import os from 'os';

// Import after clearing module state
import {
  getMarketHome,
  getCacheDir,
  getSkillsDir,
  getPlatformLinksDir,
  getRegistryPath,
} from './dirs.js';

const HOMEDIR = os.homedir();

describe('getMarketHome', () => {
  it('returns ~/.skillmarket', () => {
    expect(getMarketHome()).toBe(path.join(HOMEDIR, 'skillmarket'));
  });
});

describe('getCacheDir', () => {
  it('returns ~/.skillmarket/cache', () => {
    expect(getCacheDir()).toBe(path.join(HOMEDIR, 'skillmarket', 'cache'));
  });
});

describe('getSkillsDir', () => {
  it('returns ~/.skillmarket/skills', () => {
    expect(getSkillsDir()).toBe(path.join(HOMEDIR, 'skillmarket', 'skills'));
  });
});

describe('getPlatformLinksDir', () => {
  it('returns ~/.skillmarket/platform-links', () => {
    expect(getPlatformLinksDir()).toBe(path.join(HOMEDIR, 'skillmarket', 'platform-links'));
  });
});

describe('getRegistryPath', () => {
  it('returns ~/.skillmarket/registry.json', () => {
    expect(getRegistryPath()).toBe(path.join(HOMEDIR, 'skillmarket', 'registry.json'));
  });
});

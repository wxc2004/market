/**
 * Tests for utils/platform.ts
 *
 * Tests: detectPlatform(), isValidPlatform(), getPlatformFromInput()
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectPlatform, isValidPlatform, getPlatformFromInput } from './platform.js';

// Save and restore env vars
const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('detectPlatform', () => {
  it('returns "opencode" when OPENCODE env var is set', () => {
    process.env.OPENCODE = '1';
    expect(detectPlatform()).toBe('opencode');
  });

  it('returns "cursor" when CURSOR env var is set', () => {
    delete process.env.OPENCODE;
    process.env.CURSOR = '1';
    expect(detectPlatform()).toBe('cursor');
  });

  it('returns "vscode" when VSCODE env var is set', () => {
    delete process.env.OPENCODE;
    process.env.VSCODE = '1';
    expect(detectPlatform()).toBe('vscode');
  });

  it('returns "claude" when CLAUDE_CODE env var is set', () => {
    delete process.env.OPENCODE;
    process.env.CLAUDE_CODE = '1';
    expect(detectPlatform()).toBe('claude');
  });

  it('returns "antigravity" when ANTIGRAVITY env var is set', () => {
    delete process.env.OPENCODE;
    process.env.ANTIGRAVITY = '1';
    expect(detectPlatform()).toBe('antigravity');
  });

  it('returns "codex" when CODEX_CLI env var is set', () => {
    delete process.env.OPENCODE;
    process.env.CODEX_CLI = '1';
    expect(detectPlatform()).toBe('codex');
  });

  it('respects priority order (OPENCODE > CURSOR > VSCODE > ...)', () => {
    process.env.OPENCODE = '1';
    process.env.CURSOR = '1';
    process.env.VSCODE = '1';
    process.env.CODEX_CLI = '1';
    // OPENCODE is checked first
    expect(detectPlatform()).toBe('opencode');
  });

  it('returns "codex" as fallback when no env var is set', () => {
    delete process.env.OPENCODE;
    delete process.env.CURSOR;
    delete process.env.VSCODE;
    delete process.env.CLAUDE_CODE;
    delete process.env.ANTIGRAVITY;
    delete process.env.CODEX_CLI;
    expect(detectPlatform()).toBe('codex');
  });
});

describe('isValidPlatform', () => {
  it('returns true for "opencode"', () => {
    expect(isValidPlatform('opencode')).toBe(true);
  });

  it('returns true for "cursor"', () => {
    expect(isValidPlatform('cursor')).toBe(true);
  });

  it('returns true for "vscode"', () => {
    expect(isValidPlatform('vscode')).toBe(true);
  });

  it('returns true for "claude"', () => {
    expect(isValidPlatform('claude')).toBe(true);
  });

  it('returns true for "codex"', () => {
    expect(isValidPlatform('codex')).toBe(true);
  });

  it('returns true for "antigravity"', () => {
    expect(isValidPlatform('antigravity')).toBe(true);
  });

  it('returns true for "openclaw"', () => {
    expect(isValidPlatform('openclaw')).toBe(true);
  });

  it('returns true for "hermes"', () => {
    expect(isValidPlatform('hermes')).toBe(true);
  });

  it('returns true for "saitec"', () => {
    expect(isValidPlatform('saitec')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isValidPlatform('')).toBe(false);
  });

  it('returns false for unknown platform', () => {
    expect(isValidPlatform('unknown-platform')).toBe(false);
  });

  it('returns false for random string', () => {
    expect(isValidPlatform('foobar')).toBe(false);
  });
});

describe('getPlatformFromInput', () => {
  it('returns platform for lowercase input', () => {
    expect(getPlatformFromInput('opencode')).toBe('opencode');
  });

  it('normalizes mixed case input', () => {
    expect(getPlatformFromInput('OpenCode')).toBe('opencode');
  });

  it('normalizes uppercase input', () => {
    expect(getPlatformFromInput('OPENCODE')).toBe('opencode');
  });

  it('returns null for unknown platform', () => {
    expect(getPlatformFromInput('unknown')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getPlatformFromInput('')).toBeNull();
  });
});

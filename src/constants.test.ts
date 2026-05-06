import { describe, it, expect } from 'vitest';
import { PLATFORMS } from './constants.js';

describe('PLATFORMS', () => {
  it('should include openclaw', () => {
    expect(PLATFORMS).toContain('openclaw');
  });

  it('should include hermes', () => {
    expect(PLATFORMS).toContain('hermes');
  });

  it('should maintain existing platforms', () => {
    expect(PLATFORMS).toContain('opencode');
    expect(PLATFORMS).toContain('claude');
    expect(PLATFORMS).toContain('vscode');
  });
});

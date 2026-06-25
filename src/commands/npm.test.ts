/**
 * Tests for commands/npm.ts — npm registry interaction
 *
 * Mocks https.get to control network responses.
 * Clears cache between tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cache } from '../utils/cache.js';
import { fetchNpmPackage, fetchSkillPackage, searchSkillmarketPackages } from './npm.js';

// ── Mock https.get ─────────────────────────────────────────────────────────
// https.get is called as: https.get(url, options, callback)
// where options = { timeout: 10000 } and callback = (res) => void

vi.mock('https', () => {
  const mockOn = vi.fn();
  const mockDestroy = vi.fn();
  const mockResume = vi.fn();

  function createRes(data: unknown, statusCode: number) {
    return {
      statusCode,
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (event === 'data') {
          const str = typeof data === 'string' ? data : JSON.stringify(data);
          handler(str);
        }
        if (event === 'end') handler();
        return this;
      }),
      resume: mockResume,
    };
  }

  return {
    default: {
      get: vi.fn((_url: unknown, _options: unknown, callback?: (res: unknown) => void) => {
        if (callback) callback(createRes({ error: 'unconfigured mock' }, 500));
        return { on: mockOn, destroy: mockDestroy };
      }),
    },
  };
});

import https from 'https';

// ── Sample data ────────────────────────────────────────────────────────────

const samplePackage = {
  name: '@itismyskillmarket/brainstorming',
  'dist-tags': { latest: '1.0.0' },
  versions: {
    '1.0.0': {
      name: '@itismyskillmarket/brainstorming',
      version: '1.0.0',
      description: 'Test skill',
    },
  },
  time: { modified: '2026-01-01', '1.0.0': '2026-01-01' },
  description: 'A brainstorming skill',
};

const sampleSearchResponse = {
  objects: [
    { package: { name: '@itismyskillmarket/brainstorming', description: 'Generate creative ideas' } },
    { package: { name: '@itismyskillmarket/test-skill', description: 'A test utility' } },
    { package: { name: 'unrelated-package', description: 'Not a skillmarket skill' } },
  ],
  total: 3,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function mockResponse(data: unknown, statusCode = 200) {
  const res = {
    statusCode,
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'data') {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        handler(str);
      }
      if (event === 'end') handler();
      return res;
    }),
    resume: vi.fn(),
  };
  vi.mocked(https.get).mockImplementation(
    (_url: unknown, _options: unknown, callback?: (res: unknown) => void) => {
      if (callback) callback(res);
      return { on: vi.fn(), destroy: vi.fn() };
    },
  );
}

function mockErrorResponse(error: Error) {
  const req = {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'error') setTimeout(() => handler(error), 1);
      return req;
    }),
    destroy: vi.fn(),
  };
  vi.mocked(https.get).mockReturnValue(req as unknown as ReturnType<typeof https.get>);
}

function mockTimeoutResponse() {
  const req = {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'timeout') setTimeout(() => handler(), 1);
      return req;
    }),
    destroy: vi.fn(),
  };
  vi.mocked(https.get).mockReturnValue(req as unknown as ReturnType<typeof https.get>);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('fetchNpmPackage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache.clear();
  });

  it('returns parsed package data on success', async () => {
    mockResponse(samplePackage);
    const result = await fetchNpmPackage('@itismyskillmarket/brainstorming');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('@itismyskillmarket/brainstorming');
    expect(result!['dist-tags'].latest).toBe('1.0.0');
  });

  it('returns null on HTTP 404', async () => {
    mockResponse({ error: 'Not found' }, 404);
    const result = await fetchNpmPackage('nonexistent');
    expect(result).toBeNull();
  });

  it('returns null on HTTP 429 (rate limit)', async () => {
    mockResponse({ error: 'rate limited' }, 429);
    const result = await fetchNpmPackage('some-pkg');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockErrorResponse(new Error('ECONNREFUSED'));
    const result = await fetchNpmPackage('some-package');
    expect(result).toBeNull();
  });

  it('returns null on timeout', async () => {
    mockTimeoutResponse();
    const result = await fetchNpmPackage('some-package');
    expect(result).toBeNull();
  });

  it('returns cached result on second call', async () => {
    // First call populates cache
    mockResponse(samplePackage);
    const first = await fetchNpmPackage('@itismyskillmarket/brainstorming');
    expect(first).not.toBeNull();
    expect(first!.name).toBe('@itismyskillmarket/brainstorming');

    // Second call with different mock — cache should return original
    mockResponse({ ...samplePackage, name: 'different' });
    const cached = await fetchNpmPackage('@itismyskillmarket/brainstorming');
    expect(cached!.name).toBe('@itismyskillmarket/brainstorming');
  });

  it('retries once on failure then succeeds', async () => {
    let callCount = 0;
    vi.mocked(https.get).mockImplementation(
      (_url: unknown, _options: unknown, callback?: (res: unknown) => void) => {
        callCount++;
        if (callCount === 1) {
          // First call: error
          const req = {
            on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
              if (event === 'error') setTimeout(() => handler(new Error('fail')), 1);
              return req;
            }),
            destroy: vi.fn(),
          };
          return req as unknown as ReturnType<typeof https.get>;
        }
        // Second call: success
        const res = {
          statusCode: 200,
          on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
            if (event === 'data') handler(JSON.stringify(samplePackage));
            if (event === 'end') handler();
            return res;
          }),
          resume: vi.fn(),
        };
        if (callback) callback(res);
        return { on: vi.fn(), destroy: vi.fn() };
      },
    );

    const result = await fetchNpmPackage('retry-pkg', 1);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('@itismyskillmarket/brainstorming');
    expect(callCount).toBe(2);
  }, 10000);
});

describe('fetchSkillPackage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache.clear();
  });

  it('returns package info for a matching scope', async () => {
    mockResponse(samplePackage);
    const result = await fetchSkillPackage('brainstorming');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('@itismyskillmarket/brainstorming');
  });

  it('tries multiple scopes and returns first match', async () => {
    let callIdx = 0;
    vi.mocked(https.get).mockImplementation(
      (_url: unknown, _options: unknown, callback?: (res: unknown) => void) => {
        callIdx++;
        const data = callIdx === 1 ? { error: 'not found' } : samplePackage;
        const statusCode = callIdx === 1 ? 404 : 200;
        const res = {
          statusCode,
          on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
            if (event === 'data') handler(JSON.stringify(data));
            if (event === 'end') handler();
            return res;
          }),
          resume: vi.fn(),
        };
        if (callback) callback(res);
        return { on: vi.fn(), destroy: vi.fn() };
      },
    );

    const result = await fetchSkillPackage('brainstorming');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('@itismyskillmarket/brainstorming');
    expect(callIdx).toBeGreaterThanOrEqual(2);
  });

  it('returns null when no scope matches', async () => {
    mockResponse({ error: 'not found' }, 404);
    const result = await fetchSkillPackage('nonexistent-skill');
    expect(result).toBeNull();
  });

  it('accepts scoped package name directly', async () => {
    mockResponse(samplePackage);
    const result = await fetchSkillPackage('@itismyskillmarket/brainstorming');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('@itismyskillmarket/brainstorming');
  });
});

describe('searchSkillmarketPackages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all packages without keyword filter', async () => {
    mockResponse(sampleSearchResponse);
    const result = await searchSkillmarketPackages();
    expect(result.packages).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('filters by keyword matching package name', async () => {
    mockResponse(sampleSearchResponse);
    const result = await searchSkillmarketPackages({ keyword: 'brainstorming' });
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]).toBe('@itismyskillmarket/brainstorming');
    expect(result.total).toBe(1);
  });

  it('filters by keyword matching description', async () => {
    mockResponse(sampleSearchResponse);
    const result = await searchSkillmarketPackages({ keyword: 'utility' });
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]).toBe('@itismyskillmarket/test-skill');
    expect(result.total).toBe(1);
  });

  it('filters by short name (without scope)', async () => {
    mockResponse(sampleSearchResponse);
    const result = await searchSkillmarketPackages({ keyword: 'test' });
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]).toBe('@itismyskillmarket/test-skill');
    expect(result.total).toBe(1);
  });

  it('returns empty when keyword has no match', async () => {
    mockResponse(sampleSearchResponse);
    const result = await searchSkillmarketPackages({ keyword: 'zzznonexistent' });
    expect(result.packages).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('handles malformed API response (null objects)', async () => {
    mockResponse({ objects: null });
    const result = await searchSkillmarketPackages();
    expect(result.packages).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('handles JSON parse error gracefully', async () => {
    const res = {
      statusCode: 200,
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (event === 'data') handler('not valid json!!!');
        if (event === 'end') handler();
        return res;
      }),
      resume: vi.fn(),
    };
    vi.mocked(https.get).mockImplementation(
      (_url: unknown, _options: unknown, callback?: (res: unknown) => void) => {
        if (callback) callback(res);
        return { on: vi.fn(), destroy: vi.fn() };
      },
    );

    const result = await searchSkillmarketPackages();
    expect(result.packages).toEqual([]);
    expect(result.total).toBe(0);
  });
});

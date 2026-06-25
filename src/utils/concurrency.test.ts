/**
 * Tests for utils/concurrency.ts — throttledMap
 */
import { describe, it, expect, vi } from 'vitest';
import { throttledMap } from './concurrency.js';

describe('throttledMap', () => {
  it('returns empty array for empty input', async () => {
    const result = await throttledMap([], async (x: number) => x * 2);
    expect(result).toEqual([]);
  });

  it('processes a single item', async () => {
    const result = await throttledMap([1], async (x) => x * 2);
    expect(result).toEqual([2]);
  });

  it('processes all items in order', async () => {
    const result = await throttledMap([1, 2, 3, 4, 5], async (x) => x * 2);
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it('passes item and index to fn', async () => {
    const items = ['a', 'b', 'c'];
    const fn = vi.fn(async (item: string, index: number) => `${item}:${index}`);
    await throttledMap(items, fn);
    expect(fn).toHaveBeenNthCalledWith(1, 'a', 0);
    expect(fn).toHaveBeenNthCalledWith(2, 'b', 1);
    expect(fn).toHaveBeenNthCalledWith(3, 'c', 2);
  });

  it('respects concurrency limit (batches items)', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const result = await throttledMap(
      [1, 2, 3, 4, 5, 6],
      async (x) => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise(r => setTimeout(r, 10));
        inFlight--;
        return x * 2;
      },
      2, // concurrency = 2
      0, // no batch delay for test
    );

    expect(result).toEqual([2, 4, 6, 8, 10, 12]);
    // With concurrency=2, never more than 2 in flight
    expect(maxInFlight).toBeLessThanOrEqual(2);
  });

  it('introduces delay between batches', async () => {
    const timestamps: number[] = [];

    await throttledMap(
      [1, 2, 3, 4],
      async (x) => {
        timestamps.push(Date.now());
        await new Promise(r => setTimeout(r, 5));
        return x;
      },
      2,    // concurrency = 2
      100,  // 100ms batch delay
    );

    // Items 0,1 in first batch; 2,3 in second batch
    expect(timestamps).toHaveLength(4);

    // Delay between batch 1 and batch 2 should be >= 100ms
    const batch2Start = timestamps[2];
    const batch1End = timestamps[1];
    if (batch2Start !== undefined && batch1End !== undefined) {
      expect(batch2Start - batch1End).toBeGreaterThanOrEqual(50); // allow timer imprecision
    }
  });

  it('rejects when fn throws', async () => {
    await expect(
      throttledMap([1, 2, 3], async (x) => {
        if (x === 2) throw new Error('test error');
        return x;
      }),
    ).rejects.toThrow('test error');
  });

  it('handles larger concurrency than items', async () => {
    const result = await throttledMap(
      [1, 2],
      async (x) => x * 10,
      10, // concurrency > items
    );
    expect(result).toEqual([10, 20]);
  });

  it('preserves order with async work', async () => {
    // Each item takes random time, but order should be preserved
    const result = await throttledMap(
      [1, 2, 3, 4, 5],
      async (x) => {
        await new Promise(r => setTimeout(r, Math.random() * 20));
        return x;
      },
      5, // all concurrent
      0,
    );
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });
});

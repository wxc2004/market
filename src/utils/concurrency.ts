/**
 * =============================================================================
 * SkillMarket 并发控制工具模块
 * =============================================================================
 *
 * 提供限流（throttle）等并发控制函数，用于控制对 npm registry 等
 * 外部服务的并发请求数量，避免触发限流（429 Too Many Requests）。
 *
 * @module utils/concurrency
 */

/**
 * 限制并发数的 map 函数
 *
 * 将 items 分批并发执行，每批 concurrency 个任务并行，
 * 批次间可选延迟，避免对上游服务造成过大压力。
 *
 * @param items - 待处理的元素数组
 * @param fn - 异步处理函数，接收 (item, index)
 * @param concurrency - 每批最大并发数（默认 3）
 * @param batchDelayMs - 批次间延迟毫秒数（默认 200）
 * @returns 按输入顺序排列的结果数组
 *
 * @example
 * const results = await throttledMap(
 *   ['pkg-a', 'pkg-b', 'pkg-c'],
 *   async (name) => fetchNpmPackage(name),
 *   3,     // 最多 3 并发
 *   200,   // 每批间隔 200ms
 * );
 */
export async function throttledMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency = 3,
  batchDelayMs = 200,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((item, idx) => fn(item, i + idx)),
    );
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await new Promise(r => setTimeout(r, batchDelayMs));
    }
  }
  return results;
}

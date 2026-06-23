/**
 * =============================================================================
 * SkillMarket 通用内存缓存模块
 * =============================================================================
 *
 * 提供带 TTL（生存时间）的通用内存缓存，用于减少对 npm registry 等
 * 外部服务的重复请求。
 *
 * 使用方式:
 * ```ts
 * import { cache } from '../utils/cache.js';
 * const data = cache.get<MyType>('key');
 * if (!data) {
 *   const fresh = await fetchData();
 *   cache.set('key', fresh, 30_000);
 * }
 * ```
 *
 * @module utils/cache
 */

// -----------------------------------------------------------------------------
// 类型定义
// -----------------------------------------------------------------------------

/** 缓存条目 */
interface CacheEntry {
  data: unknown;
  expiry: number;
}

// -----------------------------------------------------------------------------
// TtlCache 类
// -----------------------------------------------------------------------------

/**
 * 带 TTL 的通用内存缓存
 *
 * 特性:
 * - 自动过期清除（get 时惰性删除）
 * - 泛型支持（TypeScript 类型安全）
 * - 可配置 TTL（默认 30 秒）
 * - 统计信息（size 属性）
 *
 * @example
 * const apiCache = new TtlCache();
 * apiCache.set('users', [{ id: 1 }], 60_000);
 * const users = apiCache.get<User[]>('users');
 */
export class TtlCache {
  private store = new Map<string, CacheEntry>();

  /**
   * 获取缓存值。如果 key 不存在或已过期，返回 null。
   * 过期条目会被惰性删除。
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * 设置缓存值
   *
   * @param key - 缓存键
   * @param data - 缓存数据
   * @param ttlMs - 生存时间（毫秒），默认 30 秒
   */
  set(key: string, data: unknown, ttlMs = 30_000): void {
    this.store.set(key, { data, expiry: Date.now() + ttlMs });
  }

  /**
   * 删除指定的缓存条目
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * 当前缓存条目数量
   */
  get size(): number {
    return this.store.size;
  }
}

// -----------------------------------------------------------------------------
// 全局共享的默认缓存实例
// -----------------------------------------------------------------------------

/**
 * 全局共享缓存实例，供 npm registry 查询等场景使用。
 * TTL 默认 30 秒。
 */
export const cache = new TtlCache();

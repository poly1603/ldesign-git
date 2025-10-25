/**
 * Git 缓存系统
 * @module cache
 */

/**
 * 缓存条目接口
 */
interface CacheEntry<T> {
  /** 缓存值 */
  value: T
  /** 过期时间戳 */
  expiresAt?: number
  /** 最后访问时间 */
  lastAccessed: number
}

/**
 * LRU 缓存配置
 */
export interface LRUCacheConfig {
  /** 最大缓存数量 */
  maxSize?: number
  /** 默认过期时间（毫秒），0 表示永不过期 */
  defaultTTL?: number
  /** 是否在访问时更新过期时间 */
  updateExpiryOnGet?: boolean
}

/**
 * LRU (Least Recently Used) 缓存
 * 
 * 实现了基于最近最少使用策略的缓存，支持：
 * - 自动淘汰最少使用的项
 * - TTL (Time To Live) 过期策略
 * - 缓存统计信息
 * 
 * @template K - 键类型
 * @template V - 值类型
 */
export class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>()
  private readonly config: Required<LRUCacheConfig>
  private hits = 0
  private misses = 0

  constructor(config: LRUCacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? 100,
      defaultTTL: config.defaultTTL ?? 0,
      updateExpiryOnGet: config.updateExpiryOnGet ?? false
    }
  }

  /**
   * 获取缓存值
   * 
   * @param key - 缓存键
   * @returns 缓存值，不存在或已过期则返回 undefined
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      this.misses++
      return undefined
    }

    // 检查是否过期
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.misses++
      return undefined
    }

    // 更新访问时间
    entry.lastAccessed = Date.now()

    // 更新过期时间（如果启用）
    if (this.config.updateExpiryOnGet && this.config.defaultTTL > 0) {
      entry.expiresAt = Date.now() + this.config.defaultTTL
    }

    // 移到最后（表示最近使用）
    this.cache.delete(key)
    this.cache.set(key, entry)

    this.hits++
    return entry.value
  }

  /**
   * 设置缓存值
   * 
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（毫秒），不指定则使用默认值
   */
  set(key: K, value: V, ttl?: number): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // 如果达到最大容量，删除最旧的项
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    const effectiveTTL = ttl ?? this.config.defaultTTL
    const entry: CacheEntry<V> = {
      value,
      lastAccessed: Date.now(),
      expiresAt: effectiveTTL > 0 ? Date.now() + effectiveTTL : undefined
    }

    this.cache.set(key, entry)
  }

  /**
   * 检查缓存是否存在且未过期
   * 
   * @param key - 缓存键
   * @returns 是否存在
   */
  has(key: K): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // 检查是否过期
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * 删除缓存
   * 
   * @param key - 缓存键
   * @returns 是否删除成功
   */
  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  /**
   * 获取缓存大小
   * 
   * @returns 缓存项数量
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 获取所有键
   * 
   * @returns 键的迭代器
   */
  keys(): IterableIterator<K> {
    return this.cache.keys()
  }

  /**
   * 获取所有值
   * 
   * @returns 值的数组
   */
  values(): V[] {
    return Array.from(this.cache.values()).map(entry => entry.value)
  }

  /**
   * 获取所有键值对
   * 
   * @returns 键值对数组
   */
  entries(): Array<[K, V]> {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value])
  }

  /**
   * 清理过期的缓存项
   * 
   * @returns 清理的项数
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * 获取缓存统计信息
   * 
   * @returns 统计信息
   */
  getStats(): {
    size: number
    maxSize: number
    hits: number
    misses: number
    hitRate: number
  } {
    const total = this.hits + this.misses
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.hits = 0
    this.misses = 0
  }

  /**
   * 获取或设置缓存值
   * 
   * 如果缓存不存在，则调用 factory 函数生成值并缓存
   * 
   * @param key - 缓存键
   * @param factory - 值工厂函数
   * @param ttl - 过期时间（毫秒）
   * @returns 缓存值
   */
  async getOrSet(key: K, factory: () => Promise<V>, ttl?: number): Promise<V> {
    const cached = this.get(key)
    if (cached !== undefined) {
      return cached
    }

    const value = await factory()
    this.set(key, value, ttl)
    return value
  }

  /**
   * 同步版本的 getOrSet
   * 
   * @param key - 缓存键
   * @param factory - 值工厂函数
   * @param ttl - 过期时间（毫秒）
   * @returns 缓存值
   */
  getOrSetSync(key: K, factory: () => V, ttl?: number): V {
    const cached = this.get(key)
    if (cached !== undefined) {
      return cached
    }

    const value = factory()
    this.set(key, value, ttl)
    return value
  }
}

/**
 * 创建 LRU 缓存实例
 * 
 * @param config - 缓存配置
 * @returns LRU 缓存实例
 */
export function createLRUCache<K, V>(config?: LRUCacheConfig): LRUCache<K, V> {
  return new LRUCache<K, V>(config)
}

/**
 * 简单的内存缓存（不带 LRU 策略）
 * 
 * @template K - 键类型
 * @template V - 值类型
 */
export class SimpleCache<K, V> {
  private cache = new Map<K, V>()

  /**
   * 获取缓存值
   * 
   * @param key - 缓存键
   * @returns 缓存值
   */
  get(key: K): V | undefined {
    return this.cache.get(key)
  }

  /**
   * 设置缓存值
   * 
   * @param key - 缓存键
   * @param value - 缓存值
   */
  set(key: K, value: V): void {
    this.cache.set(key, value)
  }

  /**
   * 检查缓存是否存在
   * 
   * @param key - 缓存键
   * @returns 是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key)
  }

  /**
   * 删除缓存
   * 
   * @param key - 缓存键
   * @returns 是否删除成功
   */
  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   * 
   * @returns 缓存项数量
   */
  get size(): number {
    return this.cache.size
  }
}



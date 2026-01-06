/**
 * 持久化缓存实现
 * @module cache/persistent-cache
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

/**
 * 缓存条目接口
 */
interface CacheEntry<T> {
  /** 缓存值 */
  value: T
  /** 过期时间戳 */
  expiresAt?: number
  /** 创建时间戳 */
  createdAt: number
  /** 最后访问时间 */
  lastAccessed: number
  /** 版本号（用于数据迁移） */
  version: number
}

/**
 * 持久化缓存配置
 */
export interface PersistentCacheConfig {
  /** 缓存目录 */
  cacheDir?: string
  /** 缓存文件名 */
  cacheName?: string
  /** 默认过期时间（毫秒），0 表示永不过期 */
  defaultTTL?: number
  /** 最大缓存数量 */
  maxSize?: number
  /** 是否在启动时自动加载 */
  autoLoad?: boolean
  /** 是否在写入时自动保存 */
  autoSave?: boolean
  /** 自动保存间隔（毫秒） */
  saveInterval?: number
  /** 数据版本号 */
  version?: number
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  /** 缓存大小 */
  size: number
  /** 命中次数 */
  hits: number
  /** 未命中次数 */
  misses: number
  /** 命中率 */
  hitRate: number
  /** 最后保存时间 */
  lastSaved?: Date
  /** 最后加载时间 */
  lastLoaded?: Date
}

/**
 * 持久化缓存
 *
 * 支持将缓存数据持久化到文件系统，适用于需要跨进程或跨会话共享缓存的场景
 *
 * @template K - 键类型
 * @template V - 值类型
 *
 * @example
 * ```ts
 * const cache = new PersistentCache<string, object>({
 *   cacheName: 'git-cache',
 *   defaultTTL: 1000 * 60 * 60, // 1 小时
 *   autoSave: true
 * })
 *
 * await cache.load()
 * cache.set('key', { data: 'value' })
 * await cache.save()
 * ```
 */
export class PersistentCache<K extends string, V> {
  private cache = new Map<K, CacheEntry<V>>()
  private config: Required<PersistentCacheConfig>
  private hits = 0
  private misses = 0
  private lastSaved?: Date
  private lastLoaded?: Date
  private saveTimer?: ReturnType<typeof setInterval>
  private dirty = false

  constructor(config: PersistentCacheConfig = {}) {
    const defaultCacheDir = path.join(os.homedir(), '.ldesign-git', 'cache')

    this.config = {
      cacheDir: config.cacheDir ?? defaultCacheDir,
      cacheName: config.cacheName ?? 'default',
      defaultTTL: config.defaultTTL ?? 0,
      maxSize: config.maxSize ?? 1000,
      autoLoad: config.autoLoad ?? true,
      autoSave: config.autoSave ?? true,
      saveInterval: config.saveInterval ?? 30000, // 30 秒
      version: config.version ?? 1
    }

    // 确保缓存目录存在
    this.ensureCacheDir()

    // 自动加载
    if (this.config.autoLoad) {
      this.loadSync()
    }

    // 设置自动保存
    if (this.config.autoSave && this.config.saveInterval > 0) {
      this.startAutoSave()
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
      this.dirty = true
      this.misses++
      return undefined
    }

    // 更新访问时间
    entry.lastAccessed = Date.now()
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
      this.evictOldest()
    }

    const effectiveTTL = ttl ?? this.config.defaultTTL
    const now = Date.now()

    const entry: CacheEntry<V> = {
      value,
      createdAt: now,
      lastAccessed: now,
      expiresAt: effectiveTTL > 0 ? now + effectiveTTL : undefined,
      version: this.config.version
    }

    this.cache.set(key, entry)
    this.dirty = true
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
      this.dirty = true
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
    const result = this.cache.delete(key)
    if (result) {
      this.dirty = true
    }
    return result
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
    this.dirty = true
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 获取所有键
   */
  keys(): IterableIterator<K> {
    return this.cache.keys()
  }

  /**
   * 获取所有值
   */
  values(): V[] {
    return Array.from(this.cache.values())
      .filter(entry => !entry.expiresAt || Date.now() <= entry.expiresAt)
      .map(entry => entry.value)
  }

  /**
   * 获取所有键值对
   */
  entries(): Array<[K, V]> {
    return Array.from(this.cache.entries())
      .filter(([, entry]) => !entry.expiresAt || Date.now() <= entry.expiresAt)
      .map(([key, entry]) => [key, entry.value])
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

    if (cleaned > 0) {
      this.dirty = true
    }

    return cleaned
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      lastSaved: this.lastSaved,
      lastLoaded: this.lastLoaded
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
   * 获取或设置缓存值（异步）
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
   * 获取或设置缓存值（同步）
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

  /**
   * 保存缓存到文件
   */
  async save(): Promise<void> {
    if (!this.dirty) {
      return
    }

    const data = this.serialize()
    const filePath = this.getCacheFilePath()

    await fs.promises.writeFile(filePath, data, 'utf-8')
    this.lastSaved = new Date()
    this.dirty = false
  }

  /**
   * 同步保存缓存到文件
   */
  saveSync(): void {
    if (!this.dirty) {
      return
    }

    const data = this.serialize()
    const filePath = this.getCacheFilePath()

    fs.writeFileSync(filePath, data, 'utf-8')
    this.lastSaved = new Date()
    this.dirty = false
  }

  /**
   * 从文件加载缓存
   */
  async load(): Promise<void> {
    const filePath = this.getCacheFilePath()

    try {
      const data = await fs.promises.readFile(filePath, 'utf-8')
      this.deserialize(data)
      this.lastLoaded = new Date()
    } catch (error) {
      // 文件不存在或读取失败时忽略
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Failed to load cache:', error)
      }
    }
  }

  /**
   * 同步从文件加载缓存
   */
  loadSync(): void {
    const filePath = this.getCacheFilePath()

    try {
      const data = fs.readFileSync(filePath, 'utf-8')
      this.deserialize(data)
      this.lastLoaded = new Date()
    } catch (error) {
      // 文件不存在或读取失败时忽略
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Failed to load cache:', error)
      }
    }
  }

  /**
   * 删除缓存文件
   */
  async deleteFile(): Promise<void> {
    const filePath = this.getCacheFilePath()
    try {
      await fs.promises.unlink(filePath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  /**
   * 销毁缓存（清空并停止自动保存）
   */
  destroy(): void {
    this.stopAutoSave()
    this.cache.clear()
    this.dirty = false
  }

  /**
   * 确保缓存目录存在
   */
  private ensureCacheDir(): void {
    if (!fs.existsSync(this.config.cacheDir)) {
      fs.mkdirSync(this.config.cacheDir, { recursive: true })
    }
  }

  /**
   * 获取缓存文件路径
   */
  private getCacheFilePath(): string {
    return path.join(this.config.cacheDir, `${this.config.cacheName}.json`)
  }

  /**
   * 序列化缓存数据
   */
  private serialize(): string {
    const data: Record<string, CacheEntry<V>> = {}

    for (const [key, entry] of this.cache.entries()) {
      // 跳过已过期的条目
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        continue
      }
      data[key] = entry
    }

    return JSON.stringify({
      version: this.config.version,
      data
    }, null, 2)
  }

  /**
   * 反序列化缓存数据
   */
  private deserialize(json: string): void {
    try {
      const parsed = JSON.parse(json)

      // 版本检查
      if (parsed.version !== this.config.version) {
        console.warn('Cache version mismatch, clearing cache')
        this.cache.clear()
        return
      }

      const now = Date.now()

      for (const [key, entry] of Object.entries(parsed.data || {})) {
        const typedEntry = entry as CacheEntry<V>

        // 跳过已过期的条目
        if (typedEntry.expiresAt && now > typedEntry.expiresAt) {
          continue
        }

        this.cache.set(key as K, typedEntry)
      }
    } catch (error) {
      console.warn('Failed to deserialize cache:', error)
      this.cache.clear()
    }
  }

  /**
   * 淘汰最旧的条目
   */
  private evictOldest(): void {
    let oldestKey: K | undefined
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * 开始自动保存
   */
  private startAutoSave(): void {
    if (this.saveTimer) {
      return
    }

    this.saveTimer = setInterval(() => {
      this.saveSync()
    }, this.config.saveInterval)
  }

  /**
   * 停止自动保存
   */
  private stopAutoSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
      this.saveTimer = undefined
    }
  }
}

/**
 * 创建持久化缓存实例
 *
 * @param config - 缓存配置
 * @returns 持久化缓存实例
 */
export function createPersistentCache<K extends string, V>(
  config?: PersistentCacheConfig
): PersistentCache<K, V> {
  return new PersistentCache<K, V>(config)
}

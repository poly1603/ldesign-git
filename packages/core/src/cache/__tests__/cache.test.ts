import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LRUCache, createLRUCache } from '../index'

describe('LRUCache', () => {
  let cache: LRUCache<string, string>

  beforeEach(() => {
    cache = new LRUCache({ maxSize: 3 })
  })

  it('should create cache with default config', () => {
    const defaultCache = new LRUCache()
    expect(defaultCache.size).toBe(0)
  })

  it('should set and get values', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('should return undefined for missing keys', () => {
    expect(cache.get('missing')).toBeUndefined()
  })

  it('should check if key exists', () => {
    cache.set('key1', 'value1')
    expect(cache.has('key1')).toBe(true)
    expect(cache.has('missing')).toBe(false)
  })

  it('should delete values', () => {
    cache.set('key1', 'value1')
    expect(cache.has('key1')).toBe(true)

    cache.delete('key1')
    expect(cache.has('key1')).toBe(false)
  })

  it('should clear all values', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    expect(cache.size).toBe(2)

    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('should respect max size (LRU eviction)', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.set('key3', 'value3')
    cache.set('key4', 'value4') // Should evict key1

    expect(cache.has('key1')).toBe(false)
    expect(cache.has('key2')).toBe(true)
    expect(cache.has('key3')).toBe(true)
    expect(cache.has('key4')).toBe(true)
    expect(cache.size).toBe(3)
  })

  it('should update access order on get', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.set('key3', 'value3')

    // Access key1 to make it most recently used
    cache.get('key1')

    // Add new item, should evict key2 (least recently used)
    cache.set('key4', 'value4')

    expect(cache.has('key1')).toBe(true)
    expect(cache.has('key2')).toBe(false)
    expect(cache.has('key3')).toBe(true)
    expect(cache.has('key4')).toBe(true)
  })

  it('should handle TTL expiration', (done) => {
    const ttlCache = new LRUCache({ defaultTTL: 100 })
    ttlCache.set('key1', 'value1')

    expect(ttlCache.get('key1')).toBe('value1')

    setTimeout(() => {
      expect(ttlCache.get('key1')).toBeUndefined()
      done()
    }, 150)
  })

  it('should override TTL per item', (done) => {
    cache.set('key1', 'value1', 100)

    expect(cache.get('key1')).toBe('value1')

    setTimeout(() => {
      expect(cache.get('key1')).toBeUndefined()
      done()
    }, 150)
  })

  it('should get keys', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')

    const keys = Array.from(cache.keys())
    expect(keys).toContain('key1')
    expect(keys).toContain('key2')
  })

  it('should get values', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')

    const values = cache.values()
    expect(values).toContain('value1')
    expect(values).toContain('value2')
  })

  it('should get entries', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')

    const entries = cache.entries()
    expect(entries).toEqual([
      ['key1', 'value1'],
      ['key2', 'value2']
    ])
  })

  it('should cleanup expired entries', () => {
    const ttlCache = new LRUCache({ defaultTTL: 50 })
    ttlCache.set('key1', 'value1')
    ttlCache.set('key2', 'value2', 200)

    setTimeout(() => {
      const cleaned = ttlCache.cleanup()
      expect(cleaned).toBe(1) // Only key1 expired
      expect(ttlCache.has('key1')).toBe(false)
      expect(ttlCache.has('key2')).toBe(true)
    }, 100)
  })

  it('should track cache statistics', () => {
    cache.set('key1', 'value1')

    cache.get('key1') // Hit
    cache.get('missing') // Miss

    const stats = cache.getStats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
    expect(stats.hitRate).toBe(0.5)
    expect(stats.size).toBe(1)
    expect(stats.maxSize).toBe(3)
  })

  it('should reset statistics', () => {
    cache.set('key1', 'value1')
    cache.get('key1')

    let stats = cache.getStats()
    expect(stats.hits).toBe(1)

    cache.resetStats()

    stats = cache.getStats()
    expect(stats.hits).toBe(0)
    expect(stats.misses).toBe(0)
  })

  it('should support getOrSet pattern', async () => {
    const factory = vi.fn().mockResolvedValue('computed-value')

    const value1 = await cache.getOrSet('key1', factory)
    expect(value1).toBe('computed-value')
    expect(factory).toHaveBeenCalledTimes(1)

    // Second call should use cached value
    const value2 = await cache.getOrSet('key1', factory)
    expect(value2).toBe('computed-value')
    expect(factory).toHaveBeenCalledTimes(1) // Not called again
  })

  it('should support synchronous getOrSet', () => {
    const factory = vi.fn().mockReturnValue('computed-value')

    const value1 = cache.getOrSetSync('key1', factory)
    expect(value1).toBe('computed-value')
    expect(factory).toHaveBeenCalledTimes(1)

    const value2 = cache.getOrSetSync('key1', factory)
    expect(value2).toBe('computed-value')
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('should update expiry on get when configured', () => {
    const updateCache = new LRUCache({
      defaultTTL: 100,
      updateExpiryOnGet: true
    })

    updateCache.set('key1', 'value1')

    setTimeout(() => {
      // Access the key to update expiry
      updateCache.get('key1')

      setTimeout(() => {
        // Should still be available because expiry was updated
        expect(updateCache.get('key1')).toBe('value1')
      }, 50)
    }, 60)
  })
})

describe('createLRUCache', () => {
  it('should create LRU cache instance', () => {
    const cache = createLRUCache({ maxSize: 10 })
    expect(cache).toBeInstanceOf(LRUCache)
  })
})



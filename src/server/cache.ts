/**
 * Memory-bounded TTL + LRU in-memory cache for upstream telemetry & geocoding responses.
 * Uses JavaScript Map insertion order for O(1) get/set/eviction.
 */
export class TtlLruCache<V> {
  private readonly store = new Map<string, { value: V; expiresAt: number }>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(options: { maxEntries: number; ttlMs: number }) {
    this.maxEntries = Math.max(1, options.maxEntries);
    this.ttlMs = Math.max(100, options.ttlMs);
  }

  get(key: string, now = Date.now()): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (now >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh recency for LRU behavior
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V, now = Date.now()): void {
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: now + this.ttlMs });

    if (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
  }

  size(): number {
    return this.store.size;
  }
}

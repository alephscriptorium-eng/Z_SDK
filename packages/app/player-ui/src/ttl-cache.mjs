/**
 * TTL cache with in-flight promise deduplication.
 * @template T
 * @param {(...args: unknown[]) => Promise<T>} fn
 * @param {{ ttlMs?: number }} [options]
 */
export function createTtlCache(fn, { ttlMs = 3000 } = {}) {
  /** @type {T | null} */
  let cached = null;
  let cachedAt = 0;
  /** @type {Promise<T> | null} */
  let inFlight = null;

  async function fetchFresh(...args) {
    if (inFlight) return inFlight;
    inFlight = Promise.resolve(fn(...args))
      .then((result) => {
        if (ttlMs > 0) {
          cached = result;
          cachedAt = Date.now();
        }
        return result;
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  }

  return {
    /** @param {...unknown} args */
    async get(...args) {
      if (ttlMs > 0 && cached !== null && Date.now() - cachedAt < ttlMs) {
        return cached;
      }
      return fetchFresh(...args);
    },
    invalidate() {
      cached = null;
      cachedAt = 0;
    }
  };
}

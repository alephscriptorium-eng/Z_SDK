/**
 * Generic cascade runner with bounded concurrency.
 * No domain-tree nouns — composition maps zones → leaf ids.
 *
 * Techo típico del consumidor de zonas: 24 (mismo orden que POBLACION_MAX).
 */

/** Default concurrency ceiling for zone/leaf cascades (composition may override). */
export const CASCADE_CONCURRENCY_DEFAULT = 24;

/**
 * Run `worker` over `items` with at most `concurrency` in flight.
 * Preserves completion order in `results` aligned to `items` indices.
 *
 * @template T, R
 * @param {T[]} items
 * @param {(item: T, index: number) => Promise<R>} worker
 * @param {{ concurrency?: number }} [opts]
 * @returns {Promise<R[]>}
 */
export async function runCascade(items, worker, opts = {}) {
  const list = Array.isArray(items) ? items : [];
  const concurrency = Math.max(
    1,
    Math.min(
      opts.concurrency ?? CASCADE_CONCURRENCY_DEFAULT,
      list.length || 1
    )
  );
  /** @type {R[]} */
  const results = new Array(list.length);
  let next = 0;

  async function pump() {
    while (next < list.length) {
      const i = next;
      next += 1;
      results[i] = await worker(list[i], i);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, list.length) }, () =>
    pump()
  );
  await Promise.all(runners);
  return results;
}

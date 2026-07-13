/**
 * View kit · ring layout — evenly place entries on a circle around origin.
 * Pure math; entries expose { position, mesh? } (THREE-compatible objects).
 */

/**
 * @param {object} [opts]
 * @param {number} [opts.radius]
 * @param {number} [opts.y]
 */
export function createRingLayout(opts = {}) {
  const radius = opts.radius ?? 8;
  const y = opts.y ?? 0.5;

  return {
    radius,
    /**
     * Re-place every entry evenly on the ring (insertion order).
     * @param {Iterable<{position:{set:Function}, mesh?:{position:{copy:Function}}}>} entries
     */
    layout(entries) {
      const list = [...entries];
      const n = list.length;
      list.forEach((entry, i) => {
        const angle = (i / Math.max(1, n)) * Math.PI * 2;
        entry.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        if (entry.mesh) entry.mesh.position.copy(entry.position);
      });
    }
  };
}

/**
 * View kit · HUD helpers — write into the server-rendered HUD fields.
 */

export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value == null ? '—' : String(value);
}

/**
 * Counters bound to HUD fields: bump('events') increments and re-renders
 * the element whose id was given for that key.
 *
 * @param {Record<string, string>} fieldIds e.g. { events: 'hud-events' }
 */
export function createCounters(fieldIds) {
  const counts = Object.fromEntries(Object.keys(fieldIds).map((key) => [key, 0]));
  return {
    bump(key, by = 1) {
      if (!(key in counts)) return 0;
      counts[key] += by;
      setText(fieldIds[key], counts[key]);
      return counts[key];
    },
    set(key, value) {
      if (!(key in counts)) return;
      counts[key] = value;
      setText(fieldIds[key], value);
    },
    get: (key) => counts[key] ?? 0
  };
}

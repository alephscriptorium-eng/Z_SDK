/**
 * View kit · helpers de HUD — escriben en los campos server-rendered del HUD.
 */

export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value == null ? '—' : String(value);
}

/**
 * Contadores ligados a campos del HUD: bump('events') incrementa y
 * re-renderiza el elemento cuyo id se dio para esa clave.
 *
 * @param {Record<string, string>} fieldIds p.ej. { events: 'hud-events' }
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

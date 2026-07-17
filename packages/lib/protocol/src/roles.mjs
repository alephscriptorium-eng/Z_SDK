/**
 * Roles del contrato único: player | dj | operator.
 * Cada intent declara `roles` autorizados; el reducer/authority rechaza el resto.
 */

export const ROLES = Object.freeze(['player', 'dj', 'operator']);

const ROLE_SET = new Set(ROLES);

/**
 * @param {string} role
 */
export function isRole(role) {
  return ROLE_SET.has(role);
}

/**
 * Construye un catálogo de intents a partir de definiciones.
 * @param {Record<string, { roles: string[], description?: string }>} defs
 * @returns {Map<string, { roles: readonly string[], description?: string }>}
 */
export function createIntentCatalog(defs) {
  /** @type {Map<string, { roles: readonly string[], description?: string }>} */
  const catalog = new Map();
  for (const [name, def] of Object.entries(defs)) {
    if (!def || !Array.isArray(def.roles) || def.roles.length === 0) {
      throw new TypeError(`createIntentCatalog: ${name} necesita roles[] no vacío`);
    }
    for (const r of def.roles) {
      if (!isRole(r)) {
        throw new TypeError(`createIntentCatalog: rol desconocido "${r}" en ${name}`);
      }
    }
    catalog.set(name, {
      roles: Object.freeze([...def.roles]),
      ...(def.description ? { description: def.description } : {})
    });
  }
  return catalog;
}

/**
 * ¿El rol puede emitir este intent según el catálogo?
 * @param {string} intentName
 * @param {string} role
 * @param {Map<string, { roles: readonly string[] }>|Record<string, { roles: string[] }>} catalog
 */
export function intentAllowsRole(intentName, role, catalog) {
  const entry = catalog instanceof Map ? catalog.get(intentName) : catalog[intentName];
  if (!entry) return false;
  return entry.roles.includes(role);
}

/**
 * Resuelve el rol efectivo del payload (default `player` si ausente).
 * @param {object} payload
 */
export function resolveIntentRole(payload) {
  if (payload && typeof payload.role === 'string' && payload.role) {
    return payload.role;
  }
  return 'player';
}

/**
 * Rechaza intents cuyo rol no está en la definición.
 * @returns {{ ok: true, role: string } | { ok: false, error: string }}
 */
export function assertIntentRole(payload, catalog) {
  const role = resolveIntentRole(payload);
  if (!isRole(role)) {
    return { ok: false, error: 'rol_desconocido' };
  }
  const intentName = payload?.intent;
  if (!intentAllowsRole(intentName, role, catalog)) {
    return { ok: false, error: 'rol_no_autorizado' };
  }
  return { ok: true, role };
}

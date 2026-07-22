/**
 * ACL direccional peer→recurso (game-agnostic).
 *
 * Roles globales (`roles.mjs`) siguen gobernando qué intents existen por rol.
 * Este módulo resuelve **poder real** sobre un recurso concreto:
 *   - read / idempotent → default allow (acciones seguras)
 *   - mutate → default deny; owner o capability
 *   - destructive → default deny; **solo** capability explícita
 *     (ownership no basta)
 *
 * El juego anota power + resourceId; el engine autoriza.
 * Sin nombres de juego.
 */

/** Clases de poder sobre un recurso. */
export const POWER = Object.freeze({
  READ: 'read',
  IDEMPOTENT: 'idempotent',
  MUTATE: 'mutate',
  DESTRUCTIVE: 'destructive'
});

const POWER_SET = new Set(Object.values(POWER));

const CAP_PREFIX = 'cap:';

/**
 * @param {string} power
 * @returns {power is typeof POWER[keyof typeof POWER]}
 */
export function isPower(power) {
  return POWER_SET.has(power);
}

/**
 * Scope de capability compatible con peer-card.scopes.
 * Ej.: `cap:destructive:go:barrio:salud` · `cap:mutate:*`
 * @param {string} power
 * @param {string} resourceId — id opaco o `*` (wildcard)
 */
export function capabilityScope(power, resourceId) {
  if (!isPower(power)) {
    throw new TypeError(`capabilityScope: poder desconocido ${power}`);
  }
  if (typeof resourceId !== 'string' || !resourceId) {
    throw new TypeError('capabilityScope: resourceId (string no vacío) requerido');
  }
  return `${CAP_PREFIX}${power}:${resourceId}`;
}

/**
 * @param {unknown} scope
 * @returns {{ power: string, resourceId: string } | null}
 */
export function parseCapabilityScope(scope) {
  if (typeof scope !== 'string' || !scope.startsWith(CAP_PREFIX)) return null;
  const rest = scope.slice(CAP_PREFIX.length);
  const colon = rest.indexOf(':');
  if (colon <= 0) return null;
  const power = rest.slice(0, colon);
  const resourceId = rest.slice(colon + 1);
  if (!isPower(power) || !resourceId) return null;
  return { power, resourceId };
}

/**
 * ¿La lista de capabilities concede `power` sobre `resourceId`?
 * Wildcard de recurso: `cap:<power>:*`. Capability `destructive` implica
 * poder de mutate sobre el mismo recurso (no al revés).
 * @param {Iterable<string>|null|undefined} capabilities
 * @param {string} power
 * @param {string} resourceId
 */
export function hasCapability(capabilities, power, resourceId) {
  if (!isPower(power) || typeof resourceId !== 'string' || !resourceId) {
    return false;
  }
  if (capabilities == null) return false;
  const needed = [power];
  if (power === POWER.MUTATE) needed.push(POWER.DESTRUCTIVE);

  for (const scope of capabilities) {
    const parsed = parseCapabilityScope(scope);
    if (!parsed) continue;
    if (!needed.includes(parsed.power)) continue;
    if (parsed.resourceId === '*' || parsed.resourceId === resourceId) {
      return true;
    }
  }
  return false;
}

/**
 * Extrae scopes `cap:*` de un peer-card o lista cruda.
 * @param {string[]|{ scopes?: string[] }|null|undefined} scopesOrCard
 * @returns {string[]}
 */
export function capabilitiesFromScopes(scopesOrCard) {
  const scopes = Array.isArray(scopesOrCard)
    ? scopesOrCard
    : scopesOrCard?.scopes;
  if (!Array.isArray(scopes)) return [];
  return scopes.filter((s) => typeof s === 'string' && s.startsWith(CAP_PREFIX));
}

/**
 * @param {Map<string, string>|null|undefined} ownership
 * @param {string} resourceId
 * @returns {string|null}
 */
export function ownerOf(ownership, resourceId) {
  if (!ownership || typeof resourceId !== 'string' || !resourceId) return null;
  if (ownership instanceof Map) {
    return ownership.has(resourceId) ? ownership.get(resourceId) : null;
  }
  if (typeof ownership.get === 'function') {
    const v = ownership.get(resourceId);
    return v == null ? null : v;
  }
  return null;
}

/**
 * @param {Map<string, string>} ownership
 * @param {string} resourceId
 * @param {string} subjectId
 */
export function setOwner(ownership, resourceId, subjectId) {
  if (!(ownership instanceof Map)) {
    throw new TypeError('setOwner: ownership debe ser Map');
  }
  if (typeof resourceId !== 'string' || !resourceId) {
    throw new TypeError('setOwner: resourceId requerido');
  }
  if (typeof subjectId !== 'string' || !subjectId) {
    throw new TypeError('setOwner: subjectId requerido');
  }
  ownership.set(resourceId, subjectId);
  return ownership;
}

/**
 * @param {Map<string, string>} ownership
 * @param {string} resourceId
 */
export function clearOwner(ownership, resourceId) {
  if (!(ownership instanceof Map)) {
    throw new TypeError('clearOwner: ownership debe ser Map');
  }
  ownership.delete(resourceId);
  return ownership;
}

/**
 * Autoriza subject→resource con clase de poder.
 * Default deny donde hay poder real (mutate / destructive).
 *
 * @param {object} input
 * @param {string} input.subject — peer / actorId
 * @param {string} input.resource — id opaco de gameobject / peer / barrio…
 * @param {string} input.power — POWER.*
 * @param {Map<string, string>|null} [input.ownership]
 * @param {Iterable<string>|null} [input.capabilities]
 * @returns {{ ok: true, reason: string } | { ok: false, error: string }}
 */
export function authorizeAcl({
  subject,
  resource,
  power,
  ownership = null,
  capabilities = null
}) {
  if (!isPower(power)) {
    return { ok: false, error: 'poder_desconocido' };
  }
  if (typeof subject !== 'string' || !subject) {
    return { ok: false, error: 'sujeto_requerido' };
  }
  if (typeof resource !== 'string' || !resource) {
    return { ok: false, error: 'recurso_requerido' };
  }

  if (power === POWER.READ || power === POWER.IDEMPOTENT) {
    return { ok: true, reason: 'default_allow_safe' };
  }

  if (power === POWER.DESTRUCTIVE) {
    if (hasCapability(capabilities, POWER.DESTRUCTIVE, resource)) {
      return { ok: true, reason: 'capability' };
    }
    return { ok: false, error: 'capability_required' };
  }

  // MUTATE — default deny; owner o capability
  if (hasCapability(capabilities, POWER.MUTATE, resource)) {
    return { ok: true, reason: 'capability' };
  }
  const owner = ownerOf(ownership, resource);
  if (owner != null && owner === subject) {
    return { ok: true, reason: 'ownership' };
  }
  return { ok: false, error: 'acl_denied' };
}

/**
 * Política de intents: el juego declara power + cómo extraer resourceId.
 * @param {Record<string, { power: string, resourceFrom?: (payload: object) => string|null|undefined }>} defs
 */
export function createAclPolicy(defs) {
  if (!defs || typeof defs !== 'object') {
    throw new TypeError('createAclPolicy: defs object requerido');
  }
  /** @type {Map<string, { power: string, resourceFrom: ((payload: object) => string|null|undefined)|null }>} */
  const policy = new Map();
  for (const [intentName, def] of Object.entries(defs)) {
    if (!def || !isPower(def.power)) {
      throw new TypeError(`createAclPolicy: ${intentName} necesita power válido`);
    }
    policy.set(intentName, {
      power: def.power,
      resourceFrom: typeof def.resourceFrom === 'function' ? def.resourceFrom : null
    });
  }
  return policy;
}

/**
 * ResourceId por defecto: `resourceId` | `targetId` | `barrioId` | `gameObjectId`.
 * @param {object} payload
 * @returns {string|null}
 */
export function defaultResourceFrom(payload) {
  if (!payload || typeof payload !== 'object') return null;
  for (const key of ['resourceId', 'targetId', 'barrioId', 'gameObjectId']) {
    const v = payload[key];
    if (typeof v === 'string' && v) return v;
  }
  return null;
}

/**
 * Resuelve capabilities del payload (lista + peer-card.scopes `cap:*`).
 * @param {object} payload
 * @param {Map<string, object>|null} [peerCards] — actorId → card
 */
export function resolveIntentCapabilities(payload, peerCards = null) {
  /** @type {string[]} */
  const out = [];
  if (Array.isArray(payload?.capabilities)) {
    for (const c of payload.capabilities) {
      if (typeof c === 'string') out.push(c);
    }
  }
  out.push(...capabilitiesFromScopes(payload?.peerCard));
  out.push(...capabilitiesFromScopes(payload?.scopes));
  if (peerCards && payload?.actorId) {
    const card = peerCards.get(payload.actorId);
    if (card) out.push(...capabilitiesFromScopes(card));
  }
  return out;
}

/**
 * Gate ACL sobre un intent según política.
 * Intents no listados en la política → ok (solo rol global aplica).
 *
 * @param {object} payload
 * @param {Map<string, { power: string, resourceFrom: Function|null }>} policy
 * @param {object} [ctx]
 * @param {Map<string, string>|null} [ctx.ownership]
 * @param {Map<string, object>|null} [ctx.peerCards]
 * @param {Iterable<string>|null} [ctx.capabilities] — override; si null, se resuelven del payload
 * @returns {{ ok: true, reason?: string, power?: string, resource?: string } | { ok: false, error: string }}
 */
export function assertIntentAcl(payload, policy, ctx = {}) {
  if (!policy || typeof policy.get !== 'function') {
    throw new TypeError('assertIntentAcl: policy Map requerido');
  }
  const intentName = payload?.intent;
  if (typeof intentName !== 'string' || !intentName) {
    return { ok: false, error: 'intent_requerido' };
  }
  const entry = policy.get(intentName);
  if (!entry) {
    return { ok: true, reason: 'not_in_acl_policy' };
  }

  const resourceFrom = entry.resourceFrom ?? defaultResourceFrom;
  const resource = resourceFrom(payload);
  if (typeof resource !== 'string' || !resource) {
    return { ok: false, error: 'recurso_requerido' };
  }

  const subject =
    typeof payload?.actorId === 'string' && payload.actorId
      ? payload.actorId
      : typeof payload?.from === 'string' && payload.from
        ? payload.from
        : null;
  if (!subject) {
    return { ok: false, error: 'sujeto_requerido' };
  }

  const capabilities =
    ctx.capabilities != null
      ? ctx.capabilities
      : resolveIntentCapabilities(payload, ctx.peerCards ?? null);

  const result = authorizeAcl({
    subject,
    resource,
    power: entry.power,
    ownership: ctx.ownership ?? null,
    capabilities
  });

  if (!result.ok) return result;
  return { ok: true, reason: result.reason, power: entry.power, resource };
}

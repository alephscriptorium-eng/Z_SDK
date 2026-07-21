/**
 * Zone / district interest for gamechannel — pure, game-agnostic (D-8).
 *
 * Opaque zone ids only. Consumers map their topology (nodes, districts,
 * barrio parents, seed `zones[]`) onto those ids via optional indexes.
 * Default empty / `*` interest = today's firehose (no filter).
 */

export const ZONE_INTEREST_ALL = '*';

/**
 * @param {string | string[] | Set<string> | null | undefined} zones
 * @returns {Set<string> | null} null means "all zones" (unfiltered)
 */
export function normalizeZoneInterest(zones) {
  if (zones == null) return null;
  if (zones === ZONE_INTEREST_ALL) return null;
  if (typeof zones === 'string') {
    const t = zones.trim();
    if (!t || t === ZONE_INTEREST_ALL) return null;
    return new Set([t]);
  }
  const list = zones instanceof Set ? [...zones] : Array.isArray(zones) ? zones : [];
  if (list.length === 0) return null;
  if (list.some((z) => String(z) === ZONE_INTEREST_ALL)) return null;
  return new Set(list.map((z) => String(z)));
}

/** @param {Set<string> | null} interest */
export function interestCoversAll(interest) {
  return interest == null;
}

/**
 * Build lookup tables from a seed-style zones catalog.
 * Each entry: `{ id, nodeId?, barrios?: string[] }`.
 *
 * @param {Array<{ id: string, nodeId?: string, barrios?: string[] }> | null | undefined} catalog
 */
export function buildZoneIndexFromCatalog(catalog) {
  /** @type {Record<string, string>} */
  const zoneByBarrio = {};
  /** @type {Record<string, string>} */
  const zoneByNode = {};
  for (const z of catalog || []) {
    if (!z?.id) continue;
    const zid = String(z.id);
    zoneByNode[zid] = zid;
    if (z.nodeId) zoneByNode[String(z.nodeId)] = zid;
    for (const b of z.barrios || []) {
      zoneByBarrio[String(b)] = zid;
    }
  }
  return { zoneByBarrio, zoneByNode };
}

/**
 * Collect candidate zone ids carried by an entity (opaque field names only).
 *
 * @param {object | null | undefined} entity
 * @param {{
 *   zoneByBarrio?: Record<string, string>,
 *   zoneByNode?: Record<string, string>,
 * }} [opts]
 * @returns {string[]}
 */
export function resolveEntityZones(entity, opts = {}) {
  if (!entity || typeof entity !== 'object') return [];
  const out = new Set();
  const add = (v) => {
    if (v == null || v === '') return;
    out.add(String(v));
  };
  const { zoneByBarrio = {}, zoneByNode = {} } = opts;

  add(entity.zone);
  add(entity.nodeId);
  add(entity.parent);

  if (entity.nodeId != null && zoneByNode[entity.nodeId]) {
    add(zoneByNode[entity.nodeId]);
  }
  if (entity.zone != null && zoneByNode[entity.zone]) {
    add(zoneByNode[entity.zone]);
  }
  if (entity.parent != null && zoneByNode[entity.parent]) {
    add(zoneByNode[entity.parent]);
  }
  if (entity.barrioId != null) {
    add(entity.barrioId);
    if (zoneByBarrio[entity.barrioId]) add(zoneByBarrio[entity.barrioId]);
  }
  if (entity.id != null && zoneByBarrio[entity.id]) {
    add(zoneByBarrio[entity.id]);
  }

  return [...out];
}

/**
 * @param {object | null | undefined} entity
 * @param {Set<string> | null} interest
 * @param {{
 *   zoneByBarrio?: Record<string, string>,
 *   zoneByNode?: Record<string, string>,
 *   keepUnzoned?: boolean,
 * }} [opts]
 */
export function entityMatchesInterest(entity, interest, opts = {}) {
  if (interestCoversAll(interest)) return true;
  const zones = resolveEntityZones(entity, opts);
  if (zones.length === 0) return opts.keepUnzoned === true;
  for (const z of zones) {
    if (interest.has(z)) return true;
  }
  return false;
}

/**
 * Slice a state / snapshot payload to the given zone interest.
 * Preserves envelope fields; filters actors, anchors/anclas, barrios, nodos.
 *
 * @param {object} snapshot
 * @param {string | string[] | Set<string> | null | undefined} zones
 * @param {{
 *   zoneByBarrio?: Record<string, string>,
 *   zoneByNode?: Record<string, string>,
 *   keepUnzoned?: boolean,
 * }} [opts]
 */
export function filterSnapshotByZones(snapshot, zones, opts = {}) {
  /** @type {Set<string> | null} */
  let interest;
  if (zones == null) {
    interest = null;
  } else if (zones instanceof Set) {
    interest =
      zones.size === 0 || zones.has(ZONE_INTEREST_ALL)
        ? null
        : zones;
  } else {
    interest = normalizeZoneInterest(zones);
  }

  if (!snapshot || typeof snapshot !== 'object') {
    return snapshot;
  }

  if (interestCoversAll(interest)) {
    return {
      ...snapshot,
      zoneFilter: { mode: 'all' },
    };
  }

  const filterOpts = {
    zoneByBarrio: opts.zoneByBarrio || {},
    zoneByNode: opts.zoneByNode || {},
    keepUnzoned: opts.keepUnzoned === true,
  };

  const out = {
    ...snapshot,
    zoneFilter: { mode: 'include', zones: [...interest].sort() },
  };

  if (snapshot.actors && typeof snapshot.actors === 'object') {
    out.actors = Object.fromEntries(
      Object.entries(snapshot.actors).filter(([, actor]) =>
        entityMatchesInterest(actor, interest, filterOpts)
      )
    );
  }

  if (snapshot.barrios && typeof snapshot.barrios === 'object') {
    out.barrios = Object.fromEntries(
      Object.entries(snapshot.barrios).filter(([id, barrio]) =>
        entityMatchesInterest({ ...barrio, id }, interest, filterOpts)
      )
    );
  }

  if (snapshot.anclas && typeof snapshot.anclas === 'object') {
    out.anclas = Object.fromEntries(
      Object.entries(snapshot.anclas).filter(([id, ancla]) =>
        entityMatchesInterest({ ...ancla, id }, interest, filterOpts)
      )
    );
  }

  if (snapshot.anchors && typeof snapshot.anchors === 'object') {
    // Thin map-engine snapshot anchors lack parent; keep those occupied by kept actors.
    const keptActors = out.actors || {};
    const occupiedKeep = new Set(
      Object.values(keptActors)
        .map((a) => a?.anchorId)
        .filter(Boolean)
    );
    out.anchors = Object.fromEntries(
      Object.entries(snapshot.anchors).filter(([id, a]) => {
        if (occupiedKeep.has(id)) return true;
        return entityMatchesInterest({ ...a, id, zone: a?.parent }, interest, filterOpts);
      })
    );
  }

  if (snapshot.nodos && typeof snapshot.nodos === 'object') {
    out.nodos = Object.fromEntries(
      Object.entries(snapshot.nodos).filter(([id, nodo]) =>
        entityMatchesInterest({ ...nodo, id, nodeId: id }, interest, filterOpts)
      )
    );
  }

  if (snapshot.enlaces && typeof snapshot.enlaces === 'object') {
    const keptNodes = new Set(Object.keys(out.nodos || {}));
    if (keptNodes.size > 0) {
      out.enlaces = Object.fromEntries(
        Object.entries(snapshot.enlaces).filter(([, link]) => {
          const a = link?.a ?? link?.from;
          const b = link?.b ?? link?.to;
          return keptNodes.has(a) || keptNodes.has(b);
        })
      );
    }
  }

  return out;
}

/**
 * Wrap a state listener so the callback only sees zone-filtered payloads.
 *
 * @param {string | string[] | Set<string> | null | undefined} zones
 * @param {(filtered: object, meta: { interest: Set<string> | null, raw: object }) => void} onFiltered
 * @param {Parameters<typeof filterSnapshotByZones>[2]} [opts]
 */
export function createZoneStateHandler(zones, onFiltered, opts = {}) {
  const interest = normalizeZoneInterest(zones);
  return (raw) => {
    const filtered = filterSnapshotByZones(raw, interest, opts);
    onFiltered(filtered, { interest, raw });
  };
}

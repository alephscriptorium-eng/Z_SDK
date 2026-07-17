/**
 * event-choreographer — reactive-marionette choreography for the 3D viewer.
 *
 * Translates scriptorium room events into map intents plus puppet animations.
 *
 * **Local mode** (tests): mutates a local map-engine via walk-driver.
 * **Remote mode** (M2): emits `game:intent` to the session master; poses derive
 * from `mapSource` / session snapshot — no per-viewer map authority.
 */

const DEFAULT_MODELS = {
  ping: '/models/SK_Alephillo.glb',
  pong: '/models/RobotExpressive.glb',
  alt: ['/models/SK_Alephillo.glb', '/models/RobotExpressive.glb'],
};

const DEFAULT_EMOTES = {
  pong: 'wave',
  selection: 'thumbsUp',
};

const DEFAULT_DECK_NODES = { A: 'nodo-a', B: 'nodo-b' };

/**
 * @param {object} deps
 * @param {object} deps.adapter map-scene-adapter (spawnActor, getPuppet, applySnapshot).
 * @param {object} deps.scene engine scene def (nodos/enlaces/anclas).
 * @param {object} [deps.engine] local map-engine (local mode only).
 * @param {object} [deps.walkDriver] kit walk-driver (local mode only).
 * @param {object} [deps.mapSource] authoritative map slice `{ getSnapshot() }` (remote mode).
 * @param {(payload: object) => void} [deps.emitGameIntent] emit game:intent to session master.
 * @param {(fromNode: string, toNode: string) => { linkId: string, direction: string } | null} [deps.resolveWalk]
 * @param {Map} [deps.puppets]
 * @param {object} [deps.hud]
 * @param {object} [deps.models]
 * @param {object} [deps.emotes]
 * @param {object} [deps.deckNodes]
 * @param {boolean} [deps.spawnFromSnapshot=true]
 */
export function createEventChoreographer({
  engine,
  adapter,
  walkDriver,
  mapSource,
  emitGameIntent,
  resolveWalk: resolveWalkFn,
  scene,
  puppets,
  hud,
  models = DEFAULT_MODELS,
  emotes = DEFAULT_EMOTES,
  deckNodes = DEFAULT_DECK_NODES,
  spawnFromSnapshot = true,
} = {}) {
  const remote = typeof emitGameIntent === 'function';

  if (!adapter) throw new Error('createEventChoreographer: adapter is required');
  if (!scene) throw new Error('createEventChoreographer: scene is required');
  if (!remote && !engine) throw new Error('createEventChoreographer: engine is required');
  if (!remote && !walkDriver) throw new Error('createEventChoreographer: walkDriver is required');

  const modelCfg = { ...DEFAULT_MODELS, ...models };
  const emoteCfg = { ...DEFAULT_EMOTES, ...emotes };
  const deckNodeMap = { ...DEFAULT_DECK_NODES, ...deckNodes };

  const nodeIds = Object.keys(scene.nodos ?? {});
  const homeNode = nodeIds[0] ?? null;
  const farNode = nodeIds[nodeIds.length - 1] ?? homeNode;

  const known = new Set();
  const occupiedAnchors = new Set();
  const actorAnchor = new Map();
  const labels = new Map();
  const zoneHints = new Map();
  let modelSeq = 0;

  function getPuppet(id) {
    return adapter.getPuppet?.(id) ?? puppets?.get?.(id) ?? null;
  }

  function currentMapSnapshot() {
    return mapSource?.getSnapshot?.() ?? engine?.getSnapshot?.() ?? null;
  }

  function syncAnchorsFromMap() {
    const anchors = currentMapSnapshot()?.anchors;
    if (!anchors) return;
    occupiedAnchors.clear();
    for (const [aid, a] of Object.entries(anchors)) {
      if (a?.occupiedBy) occupiedAnchors.add(aid);
    }
  }

  function pickFreeAnchor(preferNode) {
    syncAnchorsFromMap();
    const anclas = Object.values(scene.anclas ?? {});
    const inPreferred = anclas.find(
      (a) => a.parent === preferNode && !occupiedAnchors.has(a.id),
    );
    return inPreferred ?? anclas.find((a) => !occupiedAnchors.has(a.id)) ?? null;
  }

  function actorZone(actorId) {
    return currentMapSnapshot()?.actors?.[actorId]?.zone ?? zoneHints.get(actorId) ?? null;
  }

  function applySit(actorId, anchorId) {
    if (!anchorId) return { ok: false };
    if (remote) {
      emitGameIntent({ actorId, intent: 'sit', anchorId });
      return { ok: true };
    }
    return engine.applyIntent(actorId, { intent: 'sit', anchorId });
  }

  function walkToward(actorId, destNode) {
    if (remote) {
      const zone = actorZone(actorId);
      if (zone == null) return { ok: false, error: 'actor_sin_zona' };
      if (zone === destNode) return { ok: false, error: 'ya_en_destino' };
      if (!resolveWalkFn) return { ok: false, error: 'sin_resolver' };
      const resolved = resolveWalkFn(zone, destNode);
      if (!resolved) return { ok: false, error: 'sin_enlace' };
      emitGameIntent({
        actorId,
        intent: 'walk',
        linkId: resolved.linkId,
        direction: resolved.direction,
      });
      zoneHints.set(actorId, resolved.linkId);
      return { ok: true };
    }
    return walkDriver.walkToward(actorId, destNode);
  }

  function modelForActor(id) {
    const lc = String(id).toLowerCase();
    if (lc.includes('pong')) return modelCfg.pong;
    if (lc.includes('ping')) return modelCfg.ping;
    const alt = modelCfg.alt?.length ? modelCfg.alt : DEFAULT_MODELS.alt;
    const url = alt[modelSeq % alt.length];
    modelSeq += 1;
    return url;
  }

  function playEmote(puppet, name) {
    if (!puppet || typeof puppet.playAdditive !== 'function' || !name) return;
    try {
      puppet.playAdditive(name);
    } catch {
      /* silent */
    }
  }

  function defaultAnchorForNode(node) {
    return (
      scene.defaultAnchorByNode?.[node] ??
      Object.values(scene.anclas ?? {}).find((a) => a.parent === node)?.id ??
      null
    );
  }

  function nodeForDeck(deckId) {
    if (deckId == null) return null;
    return deckNodeMap[deckId] ?? deckNodeMap[String(deckId).toUpperCase()] ?? null;
  }

  async function ensurePresence(id, opts = {}) {
    if (id == null) return null;
    if (known.has(id)) return getPuppet(id);
    known.add(id);

    const preferNode = opts.node ?? homeNode;
    const anchor = pickFreeAnchor(preferNode);

    if (!remote && engine) {
      try {
        engine.registerActor(
          id,
          anchor
            ? { zone: anchor.parent, anchorId: anchor.id, pose: 'sit' }
            : { zone: preferNode, pose: 'idle' },
        );
      } catch {
        /* already registered */
      }
    } else if (remote && anchor && !currentMapSnapshot()?.actors?.[id]) {
      emitGameIntent({ actorId: id, intent: 'sit', anchorId: anchor.id });
      zoneHints.set(id, anchor.parent);
    }

    if (anchor) {
      occupiedAnchors.add(anchor.id);
      actorAnchor.set(id, anchor.id);
    }

    const model = opts.url ?? modelForActor(id);
    let puppet = null;
    try {
      puppet = await adapter.spawnActor(id, { url: model, model, ...opts });
      puppet?.setBase?.('idle');
    } catch (err) {
      console.warn?.('[choreographer] spawn failed for', id, err);
    }
    hud?.presence?.({ actorId: id, model });
    return puppet;
  }

  async function onPing(payload) {
    const id = payload?.from ?? payload?.actorId;
    if (id == null) return;
    await ensurePresence(id);
    walkToward(id, farNode);
    syncAnchorsFromMap();
    hud?.event?.({ kind: 'PING', actorId: id });
  }

  async function onPong(payload) {
    const id = payload?.from ?? payload?.actorId;
    if (id == null) return;
    await ensurePresence(id);
    walkToward(id, homeNode);
    syncAnchorsFromMap();
    playEmote(getPuppet(id), emoteCfg.pong);
    hud?.event?.({ kind: 'PONG', actorId: id });
  }

  async function onSelection(payload) {
    const actorId = payload?.actorId ?? payload?.from;
    if (actorId == null) return;
    const { targetId, label, deckId } = payload ?? {};
    await ensurePresence(actorId);

    const node = nodeForDeck(deckId);
    if (node) {
      const zone = actorZone(actorId);
      if (zone === node) {
        const anchorId = defaultAnchorForNode(node);
        if (anchorId) applySit(actorId, anchorId);
      } else {
        walkToward(actorId, node);
      }
      syncAnchorsFromMap();
    }

    const puppet = getPuppet(actorId);
    const text = label ?? (targetId != null ? String(targetId) : null);
    if (text != null && puppet?.setLabel) {
      puppet.setLabel(text);
      labels.set(actorId, text);
    }
    playEmote(puppet, emoteCfg.selection);

    hud?.selection?.({
      actorId,
      targetId,
      label,
      deckId,
      text: `${actorId} escogió ${targetId ?? '—'}${label ? ` (${label})` : ''}`,
    });
  }

  function onSnapshot(snapshot, envelope) {
    if (!snapshot) return;
    hud?.reflect?.(snapshot, envelope);

    const mapActors = snapshot.map?.actors;
    if (mapActors) {
      for (const [actorId, actor] of Object.entries(mapActors)) {
        if (actor?.zone != null) zoneHints.set(actorId, actor.zone);
      }
    }

    const byActor = snapshot.selections?.byActor;
    if (!byActor || typeof byActor !== 'object') return;

    for (const [actorId, sel] of Object.entries(byActor)) {
      const text = sel?.label ?? (sel?.targetId != null ? String(sel.targetId) : null);
      if (text == null) continue;

      const puppet = getPuppet(actorId);
      if (puppet?.setLabel) {
        if (labels.get(actorId) !== text) {
          puppet.setLabel(text);
          labels.set(actorId, text);
        }
      } else if (spawnFromSnapshot && !known.has(actorId)) {
        ensurePresence(actorId).then((p) => {
          if (p?.setLabel && labels.get(actorId) !== text) {
            p.setLabel(text);
            labels.set(actorId, text);
          }
        });
      }
    }
  }

  function onEvent(name, payload) {
    switch (name) {
      case 'PING':
        return onPing(payload);
      case 'PONG':
        return onPong(payload);
      case 'selection:cast':
        return onSelection(payload);
      default: {
        const id = payload?.from ?? payload?.actorId;
        return id != null ? ensurePresence(id) : undefined;
      }
    }
  }

  function update(_dt) {}

  return {
    homeNode,
    farNode,
    ensurePresence,
    hasActor: (id) => known.has(id),
    onPing,
    onPong,
    onSelection,
    onSnapshot,
    onEvent,
    update,
  };
}

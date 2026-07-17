/**
 * @zeus/operator-bridge — puente puro contrato único → bot-hub AlephMessage.
 *
 * Traduce `state` / `ledger` del contrato único (proyección de slice) al modelo
 * AlephMessage que anima `@zeus/threejs-ui-lib`. Sin Angular, sin red, sin Node.
 * Outbound (controles → intents rol `operator`) vive en el host operator-ui.
 */

import { makeIntent, EVENTS as PROTOCOL_EVENTS } from '@zeus/protocol';

/** AlephMessage channels (COMPATIBLE_MESSAGES) → hub animation colour buckets. */
export const CHANNELS = Object.freeze({
  SYS: 'sys',
  APP: 'app',
  UI: 'ui',
  AGENT: 'agent',
  GAME: 'game',
});

/** AlephMessage types (COMPATIBLE_MESSAGES). */
export const TYPES = Object.freeze({
  BOT_TO_CENTER: 'bot-to-center',
  CENTER_TO_BOT: 'center-to-bot',
  BOT_TO_BOT: 'bot-to-bot',
});

/** Canonical hub bot name (centre of the circle). */
export const HUB = 'CentralHub';

/** Wire events the operator vista listens to (canónico + dual delta donde aplica). */
export const WIRE = Object.freeze({
  STATE: Object.freeze([PROTOCOL_EVENTS.STATE, 'arg:state']),
  /** Solo canónico — authority dual-escucha; emitir ambos duplicaría applyIntent. */
  INTENT: Object.freeze([PROTOCOL_EVENTS.INTENT]),
  LEDGER: Object.freeze([PROTOCOL_EVENTS.LEDGER, 'arg:ledger']),
});

/** Scene ids for operator / sibling visors (HUD slice). */
export const SCENE_IDS = Object.freeze({
  operator: 'operator',
  player3d: 'player-3d',
  firehose: 'firehose',
});

/**
 * Ledger kind → short content for the hub. Table, not switch (PRACTICAS §1.2).
 * @type {Record<string, (entry: object) => string>}
 */
const LEDGER_CONTENT = Object.freeze({
  inspect: (e) => {
    const target = e.detail?.targetId ?? e.targetId ?? '—';
    const label = e.detail?.label ? ` (${e.detail.label})` : '';
    return `inspect ${target}${label}`;
  },
  label: (e) => `label ${e.detail?.label ?? '—'}`,
  cache: (e) => `cache ${e.detail?.registroId ?? e.ref?.id ?? '—'}`,
  curate: (e) => `curate ${e.detail?.registroId ?? '—'} → ${e.detail?.status ?? ''}`,
  milestone: (e) => `milestone ${e.detail?.registroId ?? '—'}`,
  excavate: (e) => `excavate ${e.detail?.corridorId ?? '—'}`,
  join: (e) => `${e.actorId ?? 'actor'} join`,
  objetivo: () => 'objetivo cumplido',
  burst: (e) => `burst ${e.detail?.riverId ?? ''}`,
  collapse: () => 'collapse',
  error: (e) => `error: ${e.detail?.message ?? e.detail?.reason ?? '—'}`,
});

/**
 * Project operator HUD slice from a game `state` envelope/snapshot.
 * @param {object} [state]
 * @param {string} [_sceneId]
 */
export function projectOperatorSlice(state = {}, _sceneId = SCENE_IDS.operator) {
  const actors = state.actors ?? {};
  const lines = state.lines ?? {};
  const objetivo = state.objetivo ?? null;
  const actorIds = Object.keys(actors);
  return {
    sceneId: state.sceneId ?? null,
    gamemapId: state.gamemapId ?? null,
    reason: state.reason ?? null,
    ts: state.ts ?? null,
    actorCount: actorIds.length,
    actors,
    lines,
    objetivo,
    maze: state.maze ?? null,
    contacts: state.contacts ?? null,
  };
}

/**
 * Build an intent with role `operator` (caller injects game id — PRACTICAS §1.11).
 * @param {string} actorId
 * @param {string} intent
 * @param {object} [args]
 * @param {{ game?: string, from?: string, ts?: number }} [opts]
 */
export function makeOperatorIntent(actorId, intent, args = {}, opts = {}) {
  return makeIntent(actorId, intent, args, {
    from: opts.from ?? actorId,
    game: opts.game,
    role: 'operator',
    ...(opts.ts != null ? { ts: opts.ts } : {}),
  });
}

/**
 * Create a stateful-but-deterministic bridge. State is only a monotonic message
 * counter and the set of actors already announced — pure function of inputs.
 *
 * @param {{ hub?: string }} [opts]
 */
export function createOperatorBridge({ hub = HUB } = {}) {
  let seq = 0;
  const announced = new Set();

  function make({ channel, from, to = hub, type = TYPES.BOT_TO_CENTER, content, ts }) {
    seq += 1;
    return {
      id: `${channel}-${seq}`,
      fromBot: from,
      toBot: to,
      channel,
      content: content ?? '',
      timestamp: Number.isFinite(ts) ? ts : 0,
      type,
    };
  }

  /**
   * Reconcile a full game `state` snapshot: announce actors not seen yet.
   * Idempotent across repeated snapshots.
   * @param {object} [state]
   * @returns {Array<object>} AlephMessage[]
   */
  function onState(state = {}) {
    const actors = state.actors ?? {};
    const ts = state.ts;
    const out = [];

    for (const id of Object.keys(actors)) {
      if (announced.has(id)) continue;
      announced.add(id);
      const zone = actors[id]?.zone;
      const tail = zone ? ` · ${zone}` : '';
      out.push(make({ channel: CHANNELS.SYS, from: id, content: `${id} presente${tail}`, ts }));
    }

    return out;
  }

  /**
   * Map one ledger entry to zero or more AlephMessages.
   * @param {object} [entry]
   * @returns {Array<object>} AlephMessage[]
   */
  function onLedger(entry = {}) {
    const kind = entry.kind ?? entry.entryKind;
    if (!kind || typeof kind !== 'string') return [];
    const actorId = entry.actorId ?? entry.from ?? HUB;
    const formatter = LEDGER_CONTENT[kind];
    const content = formatter
      ? formatter(entry)
      : `${kind}${entry.detail ? ` ${JSON.stringify(entry.detail)}` : ''}`;
    return [
      make({
        channel: CHANNELS.GAME,
        from: actorId,
        content,
        ts: entry.ts,
      }),
    ];
  }

  /** Reset announced-actor tracking (e.g. on reconnect). Keeps the id counter. */
  function reset() {
    announced.clear();
  }

  return { onState, onLedger, reset, projectSlice: projectOperatorSlice };
}

export { PROTOCOL_EVENTS, makeIntent };

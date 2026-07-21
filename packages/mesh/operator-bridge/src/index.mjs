/**
 * @zeus/operator-bridge — puente puro contrato único → bot-hub AlephMessage.
 *
 * Traduce `state` / `ledger` del contrato único (proyección de slice) al modelo
 * AlephMessage que anima `@zeus/threejs-ui-lib`. Sin Angular, sin red, sin Node.
 * Outbound (controles → intents rol `operator`) vive en el host operator-ui.
 */

import { makeIntent, EVENTS as PROTOCOL_EVENTS } from '@zeus/protocol';
import {
  LEDGER_PARTE,
  LEDGER_PARTE_RECHAZADO,
  campanasDesdeParte,
} from '@zeus/parte-kit';

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

/** Wire events the operator vista listens to (canónico + dual-wire alias donde aplica). */
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
 * Barrio estado → hub channel (particle colour). Game-agnostic field `state.barrios`.
 * vivo=ui(green) · latente=agent(orange) · muerto=sys(red) · roto=app(blue).
 */
export const BARRIO_CHANNEL = Object.freeze({
  vivo: CHANNELS.UI,
  latente: CHANNELS.AGENT,
  muerto: CHANNELS.SYS,
  roto: CHANNELS.APP,
});

export const BARRIO_ESTADOS = Object.freeze(['vivo', 'latente', 'muerto', 'roto']);

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
  wake: (e) => `wake ${e.detail?.barrioId ?? e.barrioId ?? '—'}`,
  sleep: (e) => `sleep ${e.detail?.barrioId ?? e.barrioId ?? '—'}`,
  announce: (e) => `announce ${e.detail?.message ?? e.message ?? ''}`.trim(),
  parte: (e) => {
    const tick = e.detail?.parte?.tick;
    const n = Array.isArray(e.detail?.parte?.titulares)
      ? e.detail.parte.titulares.length
      : 0;
    return `parte tick=${tick ?? '—'} titulares=${n}`;
  },
  parte_rechazado: (e) => {
    const n = Array.isArray(e.detail?.matches) ? e.detail.matches.length : 0;
    return `parte_rechazado matches=${n}`;
  },
  objetivo: () => 'objetivo cumplido',
  burst: (e) => `burst ${e.detail?.riverId ?? ''}`,
  collapse: () => 'collapse',
  error: (e) => `error: ${e.detail?.message ?? e.detail?.reason ?? '—'}`,
});

/**
 * Campanas from a ledger entry (`entryKind`/`kind` = parte).
 * Pure: returns [] if not a published parte or titulares sin clase.
 * @param {object} [entry]
 * @returns {Array<{ clase: 'despertar'|'degradar'|'roto', titular: string }>}
 */
export function campanasFromLedger(entry = {}) {
  const kind = entry.kind ?? entry.entryKind;
  if (kind !== LEDGER_PARTE && kind !== 'parte') return [];
  return campanasDesdeParte(entry.detail?.parte);
}

/**
 * Count barrios by estado (unknown estados ignored in tallies).
 * @param {Record<string, { estado?: string }>} barrios
 */
export function tallyBarrioEstados(barrios = {}) {
  const barrioByEstado = Object.fromEntries(BARRIO_ESTADOS.map((e) => [e, 0]));
  for (const b of Object.values(barrios)) {
    const e = b?.estado;
    if (e && Object.prototype.hasOwnProperty.call(barrioByEstado, e)) {
      barrioByEstado[e] += 1;
    }
  }
  return barrioByEstado;
}

/**
 * Project operator HUD slice from a game `state` envelope/snapshot.
 * Includes optional `barrios` (ciudad snapshot shape) without naming a game id.
 * @param {object} [state]
 * @param {string} [_sceneId]
 */
export function projectOperatorSlice(state = {}, _sceneId = SCENE_IDS.operator) {
  const actors = state.actors ?? {};
  const lines = state.lines ?? {};
  const barrios = state.barrios ?? {};
  const objetivo = state.objetivo ?? null;
  const actorIds = Object.keys(actors);
  const barrioIds = Object.keys(barrios);
  return {
    sceneId: state.sceneId ?? null,
    gamemapId: state.gamemapId ?? null,
    reason: state.reason ?? null,
    ts: state.ts ?? null,
    actorCount: actorIds.length,
    actors,
    lines,
    barrios,
    barrioCount: barrioIds.length,
    barrioByEstado: tallyBarrioEstados(barrios),
    objetivo,
    maze: state.maze ?? null,
    contacts: state.contacts ?? null,
    lastWake: state.lastWake ?? null,
    lastSleep: state.lastSleep ?? null,
  };
}

/**
 * Build an intent with role `operator` (caller injects game id — PRACTICAS §1.11).
 * `game` (string no vacío) es obligatorio vía `makeIntent`.
 * @param {string} actorId
 * @param {string} intent
 * @param {object} [args]
 * @param {{ game: string, from?: string, ts?: number }} [opts]
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
  /** @type {Map<string, string>} barrioId → last seen estado */
  const barrioEstados = new Map();

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
   * Reconcile a full game `state` snapshot: announce actors not seen yet,
   * and project `barrios` (id → estado) as hub bots coloured by estado.
   * Idempotent across repeated snapshots; re-emits when barrio estado changes.
   * @param {object} [state]
   * @returns {Array<object>} AlephMessage[]
   */
  function onState(state = {}) {
    const actors = state.actors ?? {};
    const barrios = state.barrios ?? {};
    const ts = state.ts;
    const out = [];

    for (const id of Object.keys(actors)) {
      if (announced.has(id)) continue;
      announced.add(id);
      const zone = actors[id]?.zone ?? actors[id]?.nodeId;
      const tail = zone ? ` · ${zone}` : '';
      out.push(make({ channel: CHANNELS.SYS, from: id, content: `${id} presente${tail}`, ts }));
    }

    for (const [id, barrio] of Object.entries(barrios)) {
      const estado = typeof barrio?.estado === 'string' ? barrio.estado : 'latente';
      const prev = barrioEstados.get(id);
      if (prev === estado) continue;
      barrioEstados.set(id, estado);
      const channel = BARRIO_CHANNEL[estado] ?? CHANNELS.GAME;
      const content =
        prev == null ? `${id} · ${estado}` : `${id} · ${prev}→${estado}`;
      out.push(make({ channel, from: id, content, ts }));
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

  /** Reset announced-actor + barrio tracking (e.g. on reconnect). Keeps the id counter. */
  function reset() {
    announced.clear();
    barrioEstados.clear();
  }

  return { onState, onLedger, reset, projectSlice: projectOperatorSlice };
}

export { PROTOCOL_EVENTS, makeIntent, LEDGER_PARTE, LEDGER_PARTE_RECHAZADO };

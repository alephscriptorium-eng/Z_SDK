/**
 * @zeus/operator-bridge — protocol bridge (block-13 AV-B).
 *
 * Translates the zeus session (the single source of truth: `session:state`
 * snapshots + room events on /runtime) into the **bot-hub AlephMessage** model
 * that the gamify-ui Angular framework (`@zeus/threejs-ui-lib`) already knows how
 * to animate (see COMPATIBLE_MESSAGES). This is the reconstruction, as code, of
 * the lost `INTEGRATION-GAMIFY-UI.md` — the mapping IS the integration contract.
 *
 * PURE: no Angular, no three, no network, no node builtins. A caller (the
 * operator-ui data source, or a test) feeds it session events/snapshots and gets
 * AlephMessage[] back. Direction is inbound only (session → UI); outbound
 * (controls → intents) is L-outbound, not here.
 */

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

/** Session room events this bridge understands (mirror of player-3d choreographer). */
export const SESSION_EVENTS = Object.freeze([
  'presence',
  'PING',
  'PONG',
  'selection:cast',
]);

/**
 * Create a stateful-but-deterministic bridge. State is only a monotonic message
 * counter (for stable ids) and the set of actors already announced — both are a
 * pure function of the inputs fed so far, so tests are reproducible.
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
   * Map one session room event to zero or more AlephMessages.
   * @param {string} event  one of SESSION_EVENTS
   * @param {object} [payload]
   * @returns {Array<object>} AlephMessage[]
   */
  function onSessionEvent(event, payload = {}) {
    const actorId = payload.actorId ?? payload.from ?? null;
    const ts = payload.ts;

    switch (event) {
      case 'presence': {
        if (!actorId) return [];
        announced.add(actorId);
        return [make({ channel: CHANNELS.SYS, from: actorId, content: `${actorId} conectado`, ts })];
      }
      case 'PING': {
        if (!actorId) return [];
        const n = payload.n != null ? ` #${payload.n}` : '';
        const expr = payload.expr ? ` · ${payload.expr}` : '';
        return [make({ channel: CHANNELS.GAME, from: actorId, content: `PING${n}${expr}`, ts })];
      }
      case 'PONG': {
        if (!actorId) return [];
        const ans = payload.answer != null ? ` = ${payload.answer}` : '';
        const err = payload.error ? ` · error: ${payload.error}` : '';
        return [make({ channel: CHANNELS.GAME, from: actorId, content: `PONG${ans}${err}`, ts })];
      }
      case 'selection:cast': {
        if (!actorId) return [];
        const { targetId, label } = payload;
        const tail = label ? ` (${label})` : '';
        return [make({
          channel: CHANNELS.GAME,
          from: actorId,
          content: `escogió ${targetId ?? '—'}${tail}`,
          ts,
        })];
      }
      default:
        return [];
    }
  }

  /**
   * Reconcile a full `session:state` snapshot: announce actors not seen yet, and
   * surface the last attributed selection. Idempotent across repeated snapshots.
   * @param {object} [snapshot]
   * @returns {Array<object>} AlephMessage[]
   */
  function onSnapshot(snapshot = {}) {
    const actors = snapshot.actors ?? snapshot.map?.actors ?? {};
    const ts = snapshot.ts;
    const out = [];

    for (const id of Object.keys(actors)) {
      if (announced.has(id)) continue;
      announced.add(id);
      out.push(make({ channel: CHANNELS.SYS, from: id, content: `${id} presente`, ts }));
    }

    const last = snapshot.selections?.last;
    if (last?.actorId) {
      const tail = last.label ? ` (${last.label})` : '';
      out.push(make({
        channel: CHANNELS.GAME,
        from: last.actorId,
        content: `escogió ${last.targetId ?? '—'}${tail}`,
        ts: last.ts ?? ts,
      }));
    }

    return out;
  }

  /** Reset announced-actor tracking (e.g. on reconnect). Keeps the id counter. */
  function reset() {
    announced.clear();
  }

  return { onSessionEvent, onSnapshot, reset };
}

/**
 * session-participant — opt-in helper that lets a rooms client act as a
 * participant of a ZEUS player deck (DJ stack).
 *
 * The player-ui deck-io (and any relay that forwards it) broadcasts contrato
 * `state` snapshots (`{ phase, playhead, decks, … }`). Participants cache that
 * snapshot and can emit an attributed `selection:cast` back to the room:
 *
 *   ROOM_MESSAGE { event:'selection:cast', room, data:{ actorId, kind, deckId, targetId, label, meta } }
 *
 * which the master applies (registers the selection in context `selections`,
 * re-resolves deck B, and re-broadcasts `state`).
 *
 * This module is pure glue: it never imports the game logic, and PING/PONG is
 * unaffected unless an app opts in.
 */

/**
 * Pick a rev `oldid` from a session snapshot's deck.
 * @param {object|null|undefined} snapshot  the master snapshot (`msg` or `msg.snapshot`)
 * @param {string} [deckId]
 * @param {(items: any[]) => number} [strategy] index selector over the items array
 * @returns {string|number|null} an `oldid`, or null when unavailable
 */
export function pickRevFromSnapshot(snapshot, deckId = 'B', strategy = strategies.first) {
  const items = snapshot?.decks?.[deckId]?.resolved?.registros?.items;
  if (!Array.isArray(items) || items.length === 0) return null;

  let idx = 0;
  try {
    idx = strategy(items);
  } catch {
    idx = 0;
  }
  if (!Number.isInteger(idx) || idx < 0 || idx >= items.length) idx = 0;

  const oldid = items[idx]?.oldid;
  return oldid ?? null;
}

/**
 * Index-selection strategies for {@link pickRevFromSnapshot}. Each returns an
 * index into the items array.
 */
export const strategies = {
  /** always the first rev */
  first: (_items) => 0,
  /** always the last rev */
  last: (items) => items.length - 1,
  /**
   * Deterministic pseudo-random over the items length. Same length -> same
   * index, so runs are reproducible while still spreading across the deck.
   */
  deterministic: (items) => {
    const n = items.length;
    // simple stable hash of the length + first/last oldids
    const seed = `${n}:${items[0]?.oldid ?? ''}:${items[n - 1]?.oldid ?? ''}`;
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return h % n;
  }
};

/**
 * Emit an attributed selection to the session room.
 * @param {{ room: (event:string,data:unknown,room:string)=>void, io?: any }} client rooms client (SocketClient)
 * @param {string} room session room
 * @param {{ actorId:string, kind?:string, deckId?:string, targetId:string|number, label?:string, meta?:object }} sel
 */
export function castSelection(client, room, sel) {
  const { actorId, kind = 'registro', deckId = 'B', targetId, label, meta } = sel ?? {};
  const data = { actorId, kind, deckId, targetId };
  if (label !== undefined) data.label = label;
  if (meta !== undefined) data.meta = meta;
  client.room('selection:cast', data, room);
  return data;
}

/**
 * Normalize inbound wire payloads to a deck snapshot.
 * Accepts contrato `state` (snapshot object) or wrapped `{ snapshot }`.
 * @param {unknown} msg
 * @returns {object|null}
 */
function snapshotFromWire(msg) {
  if (!msg || typeof msg !== 'object') return null;
  if (msg.decks) return msg;
  if (msg.snapshot?.decks) return msg.snapshot;
  return null;
}

/**
 * Attach a session participant to an already-connected rooms client.
 *
 * Caches the last `state` snapshot and exposes helpers to read it and cast
 * selections. It does NOT join the room itself — the caller is expected to
 * have joined `room` already (the SAME room the master owns), keeping room
 * ownership in one place.
 *
 * @param {import('@zeus/socket-core/client').SocketClient} client
 * @param {{ room: string, actorId: string, deckId?: string }} opts
 */
export function attachSessionParticipant(client, opts) {
  const { room, actorId, deckId = 'B' } = opts ?? {};
  if (!room) throw new Error('attachSessionParticipant: room is required');
  if (!actorId) throw new Error('attachSessionParticipant: actorId is required');

  let lastSnapshot = null;
  const listeners = [];

  const onState = (msg) => {
    const snapshot = snapshotFromWire(msg);
    if (!snapshot) return;
    lastSnapshot = snapshot;
    for (const cb of listeners) {
      try { cb(snapshot); } catch { /* participant callbacks must not crash the socket */ }
    }
  };

  client.io.on('state', onState);

  return {
    room,
    actorId,
    /** register a callback fired on every new snapshot; returns unsubscribe */
    onSnapshot(cb) {
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
    /** last cached snapshot, or null */
    getSnapshot() {
      return lastSnapshot;
    },
    /** pick a rev oldid from the cached (or given) snapshot */
    pickRev(strategy, snapshot = lastSnapshot) {
      return pickRevFromSnapshot(snapshot, deckId, strategy);
    },
    /**
     * Cast a selection into the session room. Returns the emitted data, or null
     * if no valid target could be derived (silent no-op).
     * @param {{ strategy?:(items:any[])=>number, targetId?:string|number, kind?:string, label?:string, meta?:object }} [sel]
     */
    cast(sel = {}) {
      const kind = sel.kind ?? 'registro';
      let targetId = sel.targetId;
      if (targetId === undefined || targetId === null) {
        targetId = pickRevFromSnapshot(lastSnapshot, deckId, sel.strategy);
      }
      if (kind === 'registro' && (targetId === undefined || targetId === null)) {
        return null; // no rev available yet -> silent no-op
      }
      return castSelection(client, room, {
        actorId,
        kind,
        deckId,
        targetId,
        label: sel.label,
        meta: sel.meta
      });
    },
    /** detach the state listener */
    dispose() {
      client.io.off('state', onState);
      listeners.length = 0;
    }
  };
}

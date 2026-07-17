/**
 * View kit · event → channel/role classification (pure, no three/DOM).
 *
 * Channels feed the kit's TrajectoryManager color buckets; roles map room
 * traffic onto the demo:bots cast (ping/pong/rabbit/spider/horse) plus the
 * session master.
 */

// Raw event names → trajectory channel color bucket.
export const EVENT_CHANNEL = {
  PING: 'sys',
  PONG: 'sys',
  HORSE: 'agent',
  RABBIT: 'agent',
  SPIDER: 'agent',
  'selection:cast': 'game',
  SET_STATE: 'ui',
  ROOM_MESSAGE: 'app'
};

export function channelFor(event) {
  return EVENT_CHANNEL[event] || 'app';
}

/** Extract the emitter id from a room payload, with fallback. */
export function emitterOf(payload, fallback) {
  if (payload && typeof payload === 'object') {
    return payload.usuario || payload.user || payload.from || payload.actorId || payload.clientId || fallback;
  }
  return fallback;
}

/** Role presentation used by markers, log lines and counters. */
export const ROLE_STYLES = {
  ping: { color: 0x00d4ff, css: '#00d4ff', emoji: '🏓', label: 'ping' },
  pong: { color: 0xffa64d, css: '#ffa64d', emoji: '🏓', label: 'pong' },
  rabbit: { color: 0x00ff41, css: '#00ff41', emoji: '🐰', label: 'rabbit' },
  spider: { color: 0xff44aa, css: '#ff44aa', emoji: '🕷️', label: 'spider' },
  horse: { color: 0xffd479, css: '#ffd479', emoji: '🐴', label: 'horse' },
  master: { color: 0xffffff, css: '#ffffff', emoji: '🧭', label: 'master' },
  other: { color: 0x8899aa, css: '#8899aa', emoji: '▫️', label: 'other' }
};

export const KNOWN_ROLES = Object.keys(ROLE_STYLES);

/**
 * Classify an observed room event into a bot role. Event name wins (the demo
 * bots broadcast under their own channel), emitter id prefix breaks ties
 * (e.g. selection:cast from `ping-demo`).
 */
export function classifyRole(event, payload) {
  const name = String(event || '');
  if (name === 'SET_STATE' || name === 'state' || name === 'arg:state') return 'master';
  if (name === 'RABBIT') return 'rabbit';
  if (name === 'SPIDER') return 'spider';
  if (name === 'HORSE' || name.startsWith('HORSE_') || name.startsWith('HORSE.')) return 'horse';
  if (name === 'PING') return 'ping';
  if (name === 'PONG') return 'pong';
  const id = String(emitterOf(payload, '') || '').toLowerCase();
  for (const role of ['rabbit', 'spider', 'horse', 'ping', 'pong']) {
    if (id.startsWith(role)) return role;
  }
  return 'other';
}

export function roleStyle(role) {
  return ROLE_STYLES[role] || ROLE_STYLES.other;
}

/**
 * Pure campanas schedule (Node-smoke twin of campanas-audio.ts).
 */

export const CAMPANA_HZ = Object.freeze({
  despertar: 660,
  degradar: 392,
  roto: 220,
});

export const CAMPANA_MS = 180;
export const CAMPANA_GAP_MS = 90;

const MUTE_KEY = 'zeus.operator.campanas.muted';

export function readCampanasMuted(store) {
  if (!store || typeof store.getItem !== 'function') return false;
  return store.getItem(MUTE_KEY) === '1';
}

export function writeCampanasMuted(store, muted) {
  if (!store || typeof store.setItem !== 'function') return;
  store.setItem(MUTE_KEY, muted ? '1' : '0');
}

export function scheduleCampanas(events, muted) {
  if (muted || !Array.isArray(events) || events.length === 0) return [];
  const out = [];
  let at = 0;
  for (const e of events) {
    const hz = CAMPANA_HZ[e.clase];
    if (!hz) continue;
    out.push({ clase: e.clase, hz, atMs: at, durMs: CAMPANA_MS });
    at += CAMPANA_MS + CAMPANA_GAP_MS;
  }
  return out;
}

/**
 * Campanas audio — frecuencias y mute (puro; Web Audio vive en el host Angular).
 * Un tono por clase: despertar · degradar · roto.
 */

export const CAMPANA_HZ = Object.freeze({
  despertar: 660,
  degradar: 392,
  roto: 220,
});

export const CAMPANA_MS = 180;
export const CAMPANA_GAP_MS = 90;

const MUTE_KEY = 'zeus.operator.campanas.muted';

export type ClaseCampanaHz = keyof typeof CAMPANA_HZ;

export interface CampanaEvent {
  clase: string;
  titular?: string;
}

export interface CampanaStep {
  clase: string;
  hz: number;
  atMs: number;
  durMs: number;
}

export interface MuteStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * @param store localStorage-like
 */
export function readCampanasMuted(store: MuteStore | null | undefined): boolean {
  if (!store || typeof store.getItem !== 'function') return false;
  return store.getItem(MUTE_KEY) === '1';
}

/**
 * @param store localStorage-like
 * @param muted muted flag
 */
export function writeCampanasMuted(store: MuteStore | null | undefined, muted: boolean): void {
  if (!store || typeof store.setItem !== 'function') return;
  store.setItem(MUTE_KEY, muted ? '1' : '0');
}

/**
 * Schedule of tones to play (empty if muted).
 */
export function scheduleCampanas(
  events: CampanaEvent[] | null | undefined,
  muted: boolean,
): CampanaStep[] {
  if (muted || !Array.isArray(events) || events.length === 0) return [];
  const out: CampanaStep[] = [];
  let at = 0;
  for (const e of events) {
    const key = e.clase as ClaseCampanaHz;
    const hz = CAMPANA_HZ[key];
    if (!hz) continue;
    out.push({ clase: e.clase, hz, atMs: at, durMs: CAMPANA_MS });
    at += CAMPANA_MS + CAMPANA_GAP_MS;
  }
  return out;
}

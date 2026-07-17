/**
 * Poses paramétricas del monigote stick (WP-07) — módulo PURO, sin three.
 *
 * Cada pose base es una función tiempo→ángulos por articulación (radianes),
 * hecha de puro seno/coseno; los emotes son capas ADITIVAS temporales que
 * decaen a cero. El stick-puppet (three) solo aplica estos números a su
 * jerarquía de grupos — así la cinemática se testea en node sin renderer.
 *
 * Convención de la pose (todos los valores en radianes salvo bob/crouch,
 * en unidades de mundo):
 *   bob      desplazamiento vertical de la pelvis
 *   crouch   cuánto baja la pelvis (agachado)
 *   lean     pitch del cuerpo entero (nadar ≈ horizontal)
 *   spineBend / spineTwist
 *   headNod / headTurn / headTilt
 *   armSwingL/R (hombro, adelante-atrás) · armRaiseL/R (hombro, lateral)
 *   elbowL/R (flexión de codo)
 *   legSwingL/R (cadera, adelante-atrás) · kneeL/R (flexión de rodilla)
 */

export const WALK_PERIOD_SEC = 0.7;
export const IDLE_BREATH_PERIOD_SEC = 3.6;
export const EMOTE_DURATION_SEC = 1.5;

export const STICK_POSES = ['idle', 'walk', 'ride', 'swim', 'sit', 'menu'];
export const STICK_EMOTES = ['wave', 'nod', 'shake', 'thumbsUp'];

const TAU = Math.PI * 2;

/** Pose neutra: todo a cero. */
export function zeroPose() {
  return {
    bob: 0, crouch: 0, lean: 0,
    spineBend: 0, spineTwist: 0,
    headNod: 0, headTurn: 0, headTilt: 0,
    armSwingL: 0, armSwingR: 0,
    armRaiseL: 0, armRaiseR: 0,
    elbowL: 0, elbowR: 0,
    legSwingL: 0, legSwingR: 0,
    kneeL: 0, kneeR: 0
  };
}

/** Suma dos poses (la aditiva ya viene ponderada por su envolvente). */
export function blendPose(a, b) {
  const out = zeroPose();
  for (const key of Object.keys(out)) out[key] = (a[key] ?? 0) + (b[key] ?? 0);
  return out;
}

const BASES = {
  /** Respiración sinusoidal sutil; brazos vivos, nunca congelado. */
  idle(t) {
    const p = zeroPose();
    const breath = Math.sin((t * TAU) / IDLE_BREATH_PERIOD_SEC);
    p.bob = 0.012 * breath;
    p.spineBend = 0.05 + 0.025 * breath;
    p.headNod = 0.04 * Math.sin((t * TAU) / 5.1);
    p.armRaiseL = 0.08 + 0.02 * breath;
    p.armRaiseR = 0.08 + 0.02 * breath;
    p.elbowL = 0.18;
    p.elbowR = 0.18;
    p.armSwingL = 0.03 * Math.sin((t * TAU) / 4.3);
    p.armSwingR = -0.03 * Math.sin((t * TAU) / 4.3);
    return p;
  },

  /** Ciclo de piernas/brazos en contrafase, doble bob por zancada. */
  walk(t) {
    const p = zeroPose();
    const phi = (t * TAU) / WALK_PERIOD_SEC;
    const s = Math.sin(phi);
    p.legSwingL = 0.62 * s;
    p.legSwingR = -0.62 * s;
    p.kneeL = 0.55 * Math.max(0, -s);
    p.kneeR = 0.55 * Math.max(0, s);
    p.armSwingL = -0.48 * s;
    p.armSwingR = 0.48 * s;
    p.elbowL = 0.35;
    p.elbowR = 0.35;
    p.bob = 0.03 * Math.abs(s);
    p.spineBend = 0.1;
    p.spineTwist = 0.08 * s;
    p.headNod = 0.05;
    return p;
  },

  /** Agachado sobre la gota, brazos atrás, vibración del cauce. */
  ride(t) {
    const p = zeroPose();
    p.crouch = 0.32;
    p.spineBend = 0.55;
    p.legSwingL = 0.95;
    p.legSwingR = 0.95;
    p.kneeL = 1.25;
    p.kneeR = 1.25;
    p.armSwingL = -0.75;
    p.armSwingR = -0.75;
    p.elbowL = 0.35;
    p.elbowR = 0.35;
    p.headNod = -0.25;
    p.bob = 0.012 * Math.sin(t * 11);
    return p;
  },

  /** Braza horizontal: cuerpo tumbado, brazadas simétricas, patada suave. */
  swim(t) {
    const p = zeroPose();
    const phi = (t * TAU) / 1.4;
    p.lean = Math.PI / 2 - 0.22;
    p.bob = 0.05 * Math.sin(phi);
    p.armSwingL = 0.45 + 0.75 * Math.sin(phi);
    p.armSwingR = 0.45 + 0.75 * Math.sin(phi);
    p.armRaiseL = 0.25 * (1 + Math.cos(phi)) * 0.5;
    p.armRaiseR = 0.25 * (1 + Math.cos(phi)) * 0.5;
    p.elbowL = 0.45 * (1 + Math.cos(phi)) * 0.5;
    p.elbowR = 0.45 * (1 + Math.cos(phi)) * 0.5;
    p.legSwingL = 0.28 * Math.sin(2 * phi);
    p.legSwingR = -0.28 * Math.sin(2 * phi);
    p.kneeL = 0.3 + 0.2 * Math.max(0, Math.sin(2 * phi));
    p.kneeR = 0.3 + 0.2 * Math.max(0, -Math.sin(2 * phi));
    p.headNod = -0.5;
    return p;
  },

  /** Sentado: muslos adelante, rodillas dobladas, manos en el regazo. */
  sit(t) {
    const p = zeroPose();
    const breath = Math.sin((t * TAU) / IDLE_BREATH_PERIOD_SEC);
    p.crouch = 0.42;
    p.legSwingL = 1.4;
    p.legSwingR = 1.4;
    p.kneeL = 1.3;
    p.kneeR = 1.3;
    p.spineBend = 0.12 + 0.02 * breath;
    p.armSwingL = 0.35;
    p.armSwingR = 0.35;
    p.elbowL = 0.65;
    p.elbowR = 0.65;
    return p;
  },

  /** En menú: brazos cruzados, cabeza levemente inclinada, respira. */
  menu(t) {
    const p = zeroPose();
    const breath = Math.sin((t * TAU) / IDLE_BREATH_PERIOD_SEC);
    p.bob = 0.01 * breath;
    p.spineBend = 0.06 + 0.02 * breath;
    p.armSwingL = 0.55;
    p.armSwingR = 0.55;
    p.armRaiseL = -0.28;
    p.armRaiseR = -0.28;
    p.elbowL = 1.9;
    p.elbowR = 1.9;
    p.headNod = 0.12;
    p.headTilt = 0.08;
    return p;
  }
};

/**
 * Pose base en el instante t (segundos). Nombre desconocido → idle.
 * @param {string} name
 * @param {number} t
 */
export function basePose(name, t) {
  return (BASES[name] ?? BASES.idle)(t);
}

/**
 * Envolvente del emote: sube en 0.15 s, sostiene, baja en 0.35 s. Cero
 * fuera de [0, dur] — la capa aditiva SIEMPRE decae a nada.
 * @param {number} t segundos desde el arranque del emote
 * @param {number} [dur]
 */
export function emoteWeight(t, dur = EMOTE_DURATION_SEC) {
  if (t < 0 || t >= dur) return 0;
  return Math.max(0, Math.min(1, t / 0.15, (dur - t) / 0.35));
}

const EMOTES = {
  /** Brazo derecho arriba, antebrazo saludando. */
  wave(t) {
    const p = zeroPose();
    p.armRaiseR = -2.5;
    p.elbowR = 0.7 + 0.55 * Math.sin((t * TAU) / 0.35);
    p.headTilt = 0.12;
    return p;
  },
  /** Asentir. */
  nod(t) {
    const p = zeroPose();
    p.headNod = 0.45 * Math.sin((t * TAU) / 0.5);
    return p;
  },
  /** Negar. */
  shake(t) {
    const p = zeroPose();
    p.headTurn = 0.6 * Math.sin((t * TAU) / 0.45);
    return p;
  },
  /** Puño adelante-arriba (pulgar imaginario — es un monigote). */
  thumbsUp(t) {
    const p = zeroPose();
    p.armSwingR = -1.15;
    p.elbowR = 1.25 + 0.08 * Math.sin((t * TAU) / 0.4);
    p.headNod = 0.1;
    return p;
  }
};

/**
 * Capa aditiva del emote en t segundos desde su arranque, YA ponderada por
 * la envolvente (fuera de ventana devuelve la pose cero).
 * @param {string} name
 * @param {number} t
 * @param {number} [dur]
 */
export function additivePose(name, t, dur = EMOTE_DURATION_SEC) {
  const w = emoteWeight(t, dur);
  if (w === 0 || !EMOTES[name]) return zeroPose();
  const raw = EMOTES[name](t);
  const out = zeroPose();
  for (const key of Object.keys(out)) out[key] = raw[key] * w;
  return out;
}

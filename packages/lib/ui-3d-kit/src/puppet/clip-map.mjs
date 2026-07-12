/**
 * Clip maps: Alephillo spec clip names (ALP_LOC_* / ALP_IDLE_* / ALP_ADD_*, see
 * gea-sdk/packages/game/gameobjects/alephillo/TECHNICAL.md + ANIMATION.md) → real
 * clip names inside the GLB on disk.
 *
 * Placeholder GLB clip names verified by parsing JSON chunks:
 *   Xbot.glb            → agree, headShake, idle, run, sad_pose, sneak_pose, walk
 *   RobotExpressive.glb → Dance, Death, Idle, Jump, No, Punch, Running,
 *                         Sitting, Standing, ThumbsUp, Walking, WalkJump, Wave, Yes
 *
 * SK_Alephillo.glb — canonical filename; mesh is Xbot placeholder until ALP_* rig ships.
 *
 * Pure data module — NO three.js import, safe for node --test.
 */

/** Puppet pose name → spec base-layer clip name. */
export const POSE_TO_BASE = {
  idle: 'ALP_IDLE_breathe',
  walk: 'ALP_LOC_walk',
  sit: 'ALP_ADD_sit_start',
};

/**
 * Canonical Alephillo clip catalog (identity names for SK_Alephillo.glb).
 * Exported so tests and docs can assert spec coverage without loading the GLB.
 */
export const ALEPHILLO_SPEC_BASE = [
  'ALP_LOC_walk',
  'ALP_LOC_walk_slow',
  'ALP_LOC_turn_L',
  'ALP_LOC_turn_R',
  'ALP_LOC_stop',
  'ALP_IDLE_breathe',
  'ALP_IDLE_slow',
  'ALP_IDLE_shift',
  'ALP_IDLE_fidget',
  'ALP_IDLE_look_horizon',
  'ALP_ADD_sit_start',
];

export const ALEPHILLO_SPEC_ADDITIVE = [
  'ALP_ADD_nod_slow',
  'ALP_ADD_nod_quick',
  'ALP_ADD_shake_head',
  'ALP_ADD_head_down',
  'ALP_ADD_look_up',
  'ALP_ADD_look_away',
  'ALP_ADD_tilt_curious',
  'ALP_ADD_shrug',
  'ALP_ADD_scratch_head',
  'ALP_ADD_hands_open',
  'ALP_ADD_hands_pockets',
  'ALP_ADD_finger_up',
  'ALP_ADD_cross_arms',
  'ALP_ADD_point',
  'ALP_ADD_wave_soft',
  'ALP_ADD_step_back',
  'ALP_ADD_kick_dust',
  'ALP_ADD_hat_tip',
  'ALP_ADD_hat_brush',
  'ALP_ADD_hold_object',
];

/**
 * Per-GLB clip maps, keyed by asset basename.
 *
 * base entries:     { clip, fallback?, note? }
 * additive entries: { clip, additiveSafe, poseFrame?, fallback?, note? }
 *   - additiveSafe: true  → convertible with AnimationUtils.makeClipAdditive
 *   - additiveSafe: false → full-body override; playAdditive() crossfade fallback
 *   - poseFrame: single-frame pose clips (Xbot *_pose) need subclip before additive
 */
/** Clip map for Xbot mesh (also used by SK_Alephillo.glb placeholder). */
const XBOT_CLIP_MAP = {
  base: {
    ALP_IDLE_breathe: { clip: 'idle' },
    ALP_LOC_walk: { clip: 'walk' },
    ALP_LOC_walk_slow: {
      clip: 'walk',
      fallback: true,
      note: 'no walk_slow clip; walk used as proxy',
    },
    ALP_ADD_sit_start: {
      clip: 'idle',
      fallback: true,
      note: 'no sit clip; idle used as placeholder',
    },
  },
  additive: {
    // REFERENCIA-ANIMACION-ADITIVA.md — Xbot → Alephillo
    ALP_ADD_nod_slow: { clip: 'agree', additiveSafe: true },
    ALP_ADD_shake_head: { clip: 'headShake', additiveSafe: true },
    ALP_ADD_head_down: { clip: 'sad_pose', additiveSafe: true, poseFrame: 2 },
    ALP_ADD_hands_pockets: { clip: 'sneak_pose', additiveSafe: true, poseFrame: 2 },
    ALP_ADD_wave: {
      clip: 'agree',
      additiveSafe: true,
      fallback: true,
      note: 'nod proxy until canonical wave clip',
    },
    ALP_ADD_thumbsUp: {
      clip: 'agree',
      additiveSafe: true,
      fallback: true,
      note: 'nod proxy until canonical thumbsUp clip',
    },
  },
};

export const DEFAULT_CLIP_MAPS = {
  'SK_Alephillo.glb': {
    placeholderMesh: 'Xbot.glb',
    note: 'Canonical Alephillo filename; Xbot mesh until ALP_* rig art lands',
    ...XBOT_CLIP_MAP,
  },

  'Xbot.glb': XBOT_CLIP_MAP,

  'RobotExpressive.glb': {
    base: {
      ALP_IDLE_breathe: { clip: 'Idle' },
      ALP_LOC_walk: { clip: 'Walking' },
      ALP_ADD_sit_start: { clip: 'Sitting' },
    },
    additive: {
      // CATALOGO-MODELOS.md mood mapping + choreographer aliases
      ALP_ADD_wave_soft: { clip: 'Wave', additiveSafe: false },
      ALP_ADD_wave: { clip: 'Wave', additiveSafe: false, note: 'choreographer alias for wave_soft' },
      ALP_ADD_finger_up: { clip: 'ThumbsUp', additiveSafe: false },
      ALP_ADD_thumbsUp: { clip: 'ThumbsUp', additiveSafe: false, note: 'choreographer alias' },
      ALP_ADD_nod_quick: { clip: 'Yes', additiveSafe: false },
      ALP_ADD_shake_head: { clip: 'No', additiveSafe: false },
      ALP_ADD_shrug: { clip: 'No', additiveSafe: false, fallback: true },
      ALP_ADD_jump: { clip: 'Jump', additiveSafe: false },
      ALP_ADD_dance: { clip: 'Dance', additiveSafe: false },
    },
  },
};

/**
 * Resolve the default clip map for a model URL/path by basename.
 * @param {string} url e.g. '/assets/models/Xbot.glb?v=1'
 * @returns {object|null}
 */
export function resolveClipMap(url) {
  if (typeof url !== 'string') return null;
  const basename = url.split(/[?#]/)[0].split(/[\\/]/).pop();
  return DEFAULT_CLIP_MAPS[basename] ?? null;
}

/**
 * Resolve the real clip name for a base pose ('idle' | 'walk' | 'sit'
 * or a spec name like 'ALP_LOC_walk').
 * @returns {{ specName: string, clip: string, fallback: boolean } | null}
 */
export function resolveBaseClip(clipMap, pose) {
  if (!clipMap?.base) return null;
  const specName = POSE_TO_BASE[pose] ?? pose;
  const entry = clipMap.base[specName];
  if (!entry) return null;
  return { specName, clip: entry.clip, fallback: Boolean(entry.fallback) };
}

/**
 * Resolve an additive gesture ('wave' or spec name 'ALP_ADD_wave_soft').
 * @returns {{ specName: string, clip: string, additiveSafe: boolean, poseFrame?: number, fallback?: boolean } | null}
 */
export function resolveAdditiveClip(clipMap, name) {
  if (!clipMap?.additive) return null;
  const specName = name.startsWith('ALP_ADD_') ? name : `ALP_ADD_${name}`;
  const entry = clipMap.additive[specName];
  if (!entry) return null;
  return {
    specName,
    clip: entry.clip,
    additiveSafe: Boolean(entry.additiveSafe),
    ...(entry.poseFrame !== undefined ? { poseFrame: entry.poseFrame } : {}),
    ...(entry.fallback !== undefined ? { fallback: entry.fallback } : {}),
  };
}

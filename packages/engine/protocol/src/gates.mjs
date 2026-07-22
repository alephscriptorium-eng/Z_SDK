/**
 * Gates genéricos del contrato único (heredan disciplina G-ARG.1..5).
 * Constantes documentales + helpers medibles (presupuesto snapshot).
 */

export const GATES = Object.freeze({
  /** Una sola autoridad por room; vistas no mutan dominio. */
  SINGLE_AUTHORITY: 'G-PROTO.1',
  /** Vistas proyectan state/ledger/track y emiten intents; no corren engine. */
  VIEWS_PROJECT: 'G-PROTO.2',
  /** Dominio browser-safe: sin red, sin fs, sin Date.now() escondido en reducers. */
  DOMAIN_PURE: 'G-PROTO.3',
  /** Reducers: tabla de handlers; inválido = no-op explicable. */
  REDUCER_TABLE: 'G-PROTO.4',
  /** Snapshot con presupuesto medible (arrays compactos / diffs). */
  SNAPSHOT_BUDGET: 'G-PROTO.5',
  /**
   * Poder real (mutate/destructive) = default deny direccional;
   * destructive exige capability explícita (ownership no basta).
   */
  ACL_DEFAULT_DENY_POWER: 'G-PROTO.6'
});

/** Presupuesto por defecto (mismo orden que G-ARG.5: ≤32 KiB). */
export const SNAPSHOT_BUDGET_BYTES = 32 * 1024;

const textEncoder = new TextEncoder();

/**
 * Mide el tamaño JSON de un snapshot en bytes UTF-8 (browser-safe).
 * @param {unknown} snapshot
 * @returns {number}
 */
export function measureSnapshotBytes(snapshot) {
  return textEncoder.encode(JSON.stringify(snapshot)).byteLength;
}

/**
 * @param {unknown} snapshot
 * @param {number} [budget=SNAPSHOT_BUDGET_BYTES]
 * @returns {{ ok: boolean, bytes: number, budget: number }}
 */
export function checkSnapshotBudget(snapshot, budget = SNAPSHOT_BUDGET_BYTES) {
  const bytes = measureSnapshotBytes(snapshot);
  return { ok: bytes <= budget, bytes, budget };
}

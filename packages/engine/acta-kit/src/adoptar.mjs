/**
 * Adopción: visitante recupera el acta del barrio desde la plaza (ledger).
 * Última entryKind `acta` válida gana; sin acta → null (caller → wake `roto`).
 */

import { LEDGER_ACTA, isActaDeBarrioShaped } from './tipos.mjs';

/**
 * Extrae acta de un mensaje/payload ledger (plaza).
 * Acepta: protocolo `{ payload: { entryKind:'acta', detail:{acta} } }`
 * o domain-local `{ kind:'acta', detail:{acta} }`.
 * @param {unknown} entry
 * @returns {import('./tipos.mjs').ActaDeBarrio|null}
 */
export function actaDesdeEntry(entry) {
  if (entry == null || typeof entry !== 'object') return null;
  const e = /** @type {Record<string, unknown>} */ (entry);
  const payload =
    e.payload != null && typeof e.payload === 'object'
      ? /** @type {Record<string, unknown>} */ (e.payload)
      : null;

  const entryKind =
    (payload && payload.entryKind) ||
    e.entryKind ||
    e.kind ||
    null;
  if (entryKind !== LEDGER_ACTA) return null;

  const detailRaw = (payload && payload.detail) || e.detail;
  const detail =
    detailRaw != null && typeof detailRaw === 'object'
      ? /** @type {Record<string, unknown>} */ (detailRaw)
      : null;
  const acta = detail?.acta ?? e.acta ?? null;
  if (!isActaDeBarrioShaped(acta)) return null;
  return acta;
}

/**
 * @param {unknown[]} entries — mensajes ledger / outbox plaza (orden cronológico)
 * @param {string} barrioId
 * @returns {{ ok: true, acta: import('./tipos.mjs').ActaDeBarrio|null } | { ok: false, error: string }}
 */
export function adoptarActaDesdePlaza(entries, barrioId) {
  if (typeof barrioId !== 'string' || !barrioId.trim()) {
    return { ok: false, error: 'barrioId_requerido' };
  }
  if (!Array.isArray(entries)) {
    return { ok: false, error: 'entries_requeridas' };
  }
  const id = barrioId.trim();
  /** @type {import('./tipos.mjs').ActaDeBarrio|null} */
  let last = null;
  for (const entry of entries) {
    const acta = actaDesdeEntry(entry);
    if (!acta) continue;
    if (acta.barrioId !== id) continue;
    last = acta;
  }
  return { ok: true, acta: last };
}

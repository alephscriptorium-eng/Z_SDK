/**
 * Publicación del acta en el canal plaza existente (ledger) — cero canal nuevo.
 */

import { PROTOCOL_VERSION, EVENTS } from '@zeus/protocol';
import { LEDGER_ACTA, LEDGER_ACTA_RECHAZADA } from './tipos.mjs';
import { validarActa } from './validar.mjs';

/**
 * @param {object} opts
 * @param {string} opts.game
 * @param {number} [opts.ts]
 * @param {number} [opts.seq]
 * @param {string} [opts.from]
 */
function baseEnvelope(opts) {
  return {
    v: PROTOCOL_VERSION,
    game: opts.game,
    kind: EVENTS.LEDGER,
    ts: opts.ts ?? 0,
    ...(opts.from != null ? { from: opts.from } : {}),
    ...(opts.seq != null ? { seq: opts.seq } : {})
  };
}

/**
 * @param {import('./tipos.mjs').ActaDeBarrio} acta
 * @param {object} meta
 */
export function mensajeActa(acta, meta) {
  return {
    event: EVENTS.LEDGER,
    payload: {
      ...baseEnvelope(meta),
      entryKind: LEDGER_ACTA,
      detail: { acta }
    }
  };
}

/**
 * @param {import('./tipos.mjs').ActaDeBarrio} acta
 * @param {string[]} matches
 * @param {object} meta
 */
export function mensajeActaRechazada(acta, matches, meta) {
  return {
    event: EVENTS.LEDGER,
    payload: {
      ...baseEnvelope(meta),
      entryKind: LEDGER_ACTA_RECHAZADA,
      detail: { matches, acta }
    }
  };
}

/**
 * @param {import('./tipos.mjs').ActaDeBarrio} acta
 * @param {string|RegExp|null|undefined} patronCeguera
 * @param {object} opts
 * @param {(event: string, payload: object) => void} opts.publish
 * @param {string} opts.game
 * @param {number} [opts.ts]
 * @param {number} [opts.seq]
 * @param {string} [opts.from]
 * @returns {{ ok: boolean, published: boolean, matches: string[], message: object }}
 */
export function intentarPublicarActa(acta, patronCeguera, opts) {
  const gate = validarActa(acta, patronCeguera);
  const meta = {
    game: opts.game,
    ts: opts.ts,
    seq: opts.seq,
    from: opts.from
  };
  if (!gate.ok) {
    const message = mensajeActaRechazada(acta, gate.matches, meta);
    opts.publish(message.event, message.payload);
    return { ok: false, published: false, matches: gate.matches, message };
  }
  const message = mensajeActa(acta, meta);
  opts.publish(message.event, message.payload);
  return { ok: true, published: true, matches: [], message };
}

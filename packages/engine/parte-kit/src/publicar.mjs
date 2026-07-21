/**
 * Publicación del parte en el canal existente (ledger) — cero canal nuevo.
 * Si validarParte falla → no publica el parte; emite entryKind parte_rechazado.
 */

import { PROTOCOL_VERSION, EVENTS } from '@zeus/protocol';
import { LEDGER_PARTE, LEDGER_PARTE_RECHAZADO } from './tipos.mjs';
import { validarParte } from './validar.mjs';

/**
 * @param {object} opts
 * @param {string} opts.game
 * @param {number} [opts.ts] — inyectado (pureza: no Date.now dentro del kit)
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
 * Mensaje ledger listo para el canal (parte OK).
 * @param {import('./tipos.mjs').ParteDeCiudad} parte
 * @param {object} meta
 */
export function mensajeParte(parte, meta) {
  return {
    event: EVENTS.LEDGER,
    payload: {
      ...baseEnvelope(meta),
      entryKind: LEDGER_PARTE,
      detail: { parte }
    }
  };
}

/**
 * Mensaje ledger parte_rechazado (ceguera fallida).
 * @param {import('./tipos.mjs').ParteDeCiudad} parte
 * @param {string[]} matches
 * @param {object} meta
 */
export function mensajeParteRechazado(parte, matches, meta) {
  return {
    event: EVENTS.LEDGER,
    payload: {
      ...baseEnvelope(meta),
      entryKind: LEDGER_PARTE_RECHAZADO,
      detail: { matches, parte }
    }
  };
}

/**
 * Valida y publica (o rechaza) en el canal existente vía `publish(event, payload)`.
 *
 * @param {import('./tipos.mjs').ParteDeCiudad} parte
 * @param {string|RegExp|null|undefined} patronCeguera
 * @param {object} opts
 * @param {(event: string, payload: object) => void} opts.publish
 * @param {string} opts.game
 * @param {number} [opts.ts]
 * @param {number} [opts.seq]
 * @param {string} [opts.from]
 * @returns {{ ok: boolean, published: boolean, matches: string[], message: object }}
 */
export function intentarPublicarParte(parte, patronCeguera, opts) {
  const gate = validarParte(parte, patronCeguera);
  const meta = {
    game: opts.game,
    ts: opts.ts,
    seq: opts.seq,
    from: opts.from
  };
  if (!gate.ok) {
    const message = mensajeParteRechazado(parte, gate.matches, meta);
    opts.publish(message.event, message.payload);
    return { ok: false, published: false, matches: gate.matches, message };
  }
  const message = mensajeParte(parte, meta);
  opts.publish(message.event, message.payload);
  return { ok: true, published: true, matches: [], message };
}

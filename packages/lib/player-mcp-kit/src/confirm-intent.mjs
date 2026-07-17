/**
 * Semántica verificable: emitir intent → esperar evidencia en state/ledger.
 * Si la autoridad rechaza en silencio, ventana noop + dry-run (`explain`)
 * devuelve la regla probable — jamás aplica ops.
 */

import { DEFAULT_POLL_MS, fail, sleep } from './util.mjs';

/**
 * @param {object} bridge — createPlayerRoomBridge (o compatible)
 * @param {{ confirmTimeoutMs: number, noopMs: number, pollMs?: number }} cfg
 * @param {{
 *   intent: string,
 *   args?: object,
 *   done: (state: object) => unknown,
 *   unchanged?: (state: object) => boolean,
 *   evidence?: (state: object|null, value: unknown) => object,
 *   explain?: (state: object) => { ok: boolean, error?: string|null },
 *   timeoutMs?: number,
 *   timeoutHint?: string
 * }} spec
 */
export async function confirmIntent(bridge, cfg, spec) {
  if (!bridge.connected) return fail('room_desconectada');
  const { intent, args = {}, done, unchanged, evidence, explain, timeoutHint } = spec;
  const timeoutMs = spec.timeoutMs ?? cfg.confirmTimeoutMs;
  const pollMs = cfg.pollMs ?? DEFAULT_POLL_MS;
  const noopMs = cfg.noopMs;

  bridge.emitIntent(intent, args);

  const start = Date.now();
  let explainedOnce = false;
  while (Date.now() - start < timeoutMs) {
    const state = bridge.lastState();
    if (state) {
      const value = done(state);
      if (value) {
        return { ok: true, evidencia: evidence ? evidence(state, value) : value };
      }
      if (
        !explainedOnce &&
        Date.now() - start >= noopMs &&
        (!unchanged || unchanged(state)) &&
        typeof explain === 'function'
      ) {
        explainedOnce = true;
        const verdict = explain(state);
        if (!verdict.ok) {
          return fail(verdict.error, {
            reglaProbable: verdict.error,
            evidencia: evidence ? evidence(state, null) : null
          });
        }
      }
    }
    await sleep(pollMs);
  }
  const state = bridge.lastState();
  return fail('timeout_confirmacion', {
    ...(timeoutHint ? { nota: timeoutHint } : {}),
    evidencia: evidence ? evidence(state, null) : null
  });
}

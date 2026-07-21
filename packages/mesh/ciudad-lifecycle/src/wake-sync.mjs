/**
 * Wake ↔ process bridge — one room client, no second brain.
 *
 * Z03 domain (injected) owns game barrio estado via wake intent.
 * This module only: apply wake → dispatchMando(start) → compare snapshots.
 */

/**
 * @typedef {{
 *   applyIntent: (payload: object) => { ok: boolean, error?: string|null },
 *   snapshot: (reason?: string) => object,
 *   drainOutbox?: () => { ledger?: object[], tracks?: object[] }
 * }} WakeDomain
 */

/**
 * @typedef {(actorId: string, intent: string, args?: object) => object} MakeIntentFn
 */

/**
 * Minimal makeIntent if composition does not inject @zeus/ciudad contract.
 * @type {MakeIntentFn}
 */
export function defaultMakeIntent(actorId, intent, args = {}) {
  return {
    actorId,
    intent,
    from: actorId,
    args: args || {},
    ...args
  };
}

/**
 * Round-trip: join/walk (optional) → wake → process start → dual snapshot.
 *
 * @param {{
 *   domain: WakeDomain,
 *   makeIntent?: MakeIntentFn,
 *   runtime: { dispatchMando: Function, snapshot: Function, resolveWake?: Function },
 *   actorId: string,
 *   barrioId: string,
 *   tool?: string,
 *   walk?: { nodeId?: string, anchorId?: string },
 *   horseMode?: 'stub'|'horse',
 *   skipProcess?: boolean
 * }} opts
 */
export async function roundTripWake(opts) {
  const {
    domain,
    runtime,
    actorId,
    barrioId,
    tool = 'city.start',
    walk,
    horseMode = 'horse',
    skipProcess = false
  } = opts;
  const makeIntent = opts.makeIntent || defaultMakeIntent;

  if (!domain || typeof domain.applyIntent !== 'function') {
    return { ok: false, error: 'wake_domain_requerido' };
  }
  if (!runtime || typeof runtime.dispatchMando !== 'function') {
    return { ok: false, error: 'runtime_requerido' };
  }

  const steps = [];

  const join = domain.applyIntent(makeIntent(actorId, 'join', {}));
  steps.push({ step: 'join', ...join });
  if (!join.ok) return { ok: false, error: join.error, steps };

  if (walk) {
    const w = domain.applyIntent(makeIntent(actorId, 'walk', walk));
    steps.push({ step: 'walk', ...w });
    if (!w.ok) return { ok: false, error: w.error, steps };
  }

  const wake = domain.applyIntent(
    makeIntent(actorId, 'wake', {
      tool,
      barrioId,
      horseMode
    })
  );
  steps.push({ step: 'wake', ...wake });
  if (!wake.ok) return { ok: false, error: wake.error, steps, gameSnap: domain.snapshot('wake-fail') };

  let processResult = null;
  if (!skipProcess) {
    if (typeof runtime.resolveWake === 'function') {
      const mapped = runtime.resolveWake(barrioId);
      if (!mapped.ok) {
        return {
          ok: false,
          error: mapped.error || 'wake_map_miss',
          steps,
          gameSnap: domain.snapshot('after-wake'),
          wakeMap: mapped
        };
      }
    }
    processResult = await runtime.dispatchMando('start', { nodo: barrioId });
    steps.push({ step: 'process_start', ok: processResult?.ok, barrioId });
  }

  const gameSnap = domain.snapshot('after-wake-roundtrip');
  const processSnap = runtime.snapshot();
  const outbox =
    typeof domain.drainOutbox === 'function' ? domain.drainOutbox() : null;

  const gameEstado = gameSnap?.barrios?.[barrioId]?.estado;
  const processEstado = processSnap?.barrios?.[barrioId]?.estado;

  return {
    ok:
      wake.ok &&
      gameEstado === 'vivo' &&
      (skipProcess || (processResult?.ok && processEstado === 'vivo')),
    barrioId,
    gameEstado,
    processEstado,
    gameSnap,
    processSnap,
    processResult,
    ledger: outbox?.ledger || null,
    tracks: outbox?.tracks || null,
    steps
  };
}

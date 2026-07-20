/**
 * High-level viaje runner: plan → (optional materialize) → cache → segment.
 */

import { buildRecorrido, materializeRecorrido, advanceEtapa } from './cache.mjs';
import { planPath, enrichPasosWithCandidates } from './plan.mjs';
import { segmentarViaje } from './segmentar-viaje.mjs';
import { assertGraphSource } from './graph-source.mjs';

/**
 * @param {{
 *   id: string,
 *   origin: string,
 *   destination: string,
 *   source: import('./graph-source.mjs').GraphSource,
 *   cacheDir?: string,
 *   prune?: string[]|Set<string>,
 *   maxDepth?: number,
 *   curation_status?: string,
 *   materializeNode?: (nodeId: string) => object|Promise<object>,
 *   segment?: boolean|object
 * }} options
 */
export async function runViaje(options) {
  const check = assertGraphSource(options.source);
  if (!check.ok) return check;

  if (!options.id || !options.origin || !options.destination) {
    return {
      ok: false,
      error: 'id, origin, and destination are required',
      rule: 'viaje.run.args'
    };
  }

  let draft = buildRecorrido({
    id: options.id,
    origin: options.origin,
    destination: options.destination,
    source_kind: options.source.kind ?? 'custom',
    etapa: 'idle',
    curation_status: options.curation_status ?? 'raw'
  });
  if (!draft.ok) return draft;

  draft = advanceEtapa(draft.recorrido, 'planning');
  if (!draft.ok) return draft;

  const planned = await planPath(
    options.source,
    options.origin,
    options.destination,
    { maxDepth: options.maxDepth, prune: options.prune }
  );
  if (!planned.ok) {
    const blocked = advanceEtapa(draft.recorrido, 'blocked');
    return {
      ...planned,
      recorrido: blocked.ok ? blocked.recorrido : draft.recorrido
    };
  }

  let pasos = await enrichPasosWithCandidates(options.source, planned.pasos);
  draft = buildRecorrido({
    ...draft.recorrido,
    etapa: 'traversing',
    pasos,
    candidatos_podados: planned.candidatos_podados ?? []
  });
  if (!draft.ok) return draft;

  /** @type {object[]} */
  const snapshots = [];
  if (typeof options.materializeNode === 'function') {
    const nodeIds = planned.path;
    for (const nodeId of nodeIds) {
      const snap = await options.materializeNode(nodeId);
      if (!snap?.ok) {
        const blocked = advanceEtapa(draft.recorrido, 'blocked');
        return {
          ok: false,
          error: snap?.error ?? `materialize failed for ${nodeId}`,
          rule: snap?.rule ?? 'viaje.run.materialize',
          nodeId,
          detail: snap,
          recorrido: blocked.ok ? blocked.recorrido : draft.recorrido
        };
      }
      snapshots.push({
        node_id: snap.node_id ?? nodeId,
        oldid: snap.oldid,
        wikitext_path: snap.wikitext_path ?? snap.wikitextPath,
        meta_path: snap.meta_path ?? snap.metaPath
      });
    }
  }

  draft = buildRecorrido({
    ...draft.recorrido,
    etapa: 'completed',
    snapshots,
    curation_status: options.curation_status ?? 'candidate'
  });
  if (!draft.ok) return draft;

  if (options.segment) {
    const segOpts = options.segment === true ? {} : options.segment;
    draft = segmentarViaje(draft.recorrido, segOpts);
    if (!draft.ok) return draft;
  }

  if (options.cacheDir) {
    const written = materializeRecorrido({
      cacheDir: options.cacheDir,
      recorrido: draft.recorrido,
      curation_status: draft.recorrido.curation_status
    });
    if (!written.ok) return written;
    return {
      ok: true,
      path: planned.path,
      hops: planned.hops,
      recorrido: written.recorrido,
      cachePath: written.path,
      snapshots
    };
  }

  return {
    ok: true,
    path: planned.path,
    hops: planned.hops,
    recorrido: draft.recorrido,
    snapshots
  };
}

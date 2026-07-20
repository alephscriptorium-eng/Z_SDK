/**
 * Materialize / validate viaje recorridos using kit schemas + curation.
 * Prior tree.json-like shapes are a departure format to normalize, not the target.
 */

import path from 'node:path';
import { normalizeCurationStatus, isCurationStatus } from '../curation.mjs';
import { validate } from '../validate.mjs';
import { ensureDir, nowIso, writeJson } from '../tools/fs-util.mjs';
import { canTransition, isViajeEtapa } from './etapas.mjs';

/**
 * @param {{
 *   id: string,
 *   origin: string,
 *   destination: string,
 *   source_kind?: string,
 *   etapa?: string,
 *   pasos?: object[],
 *   candidatos_podados?: string[],
 *   milestones?: string[],
 *   curation_status?: string,
 *   snapshots?: object[],
 *   tree_normalized_from?: string
 * }} draft
 */
export function buildRecorrido(draft) {
  const curation =
    normalizeCurationStatus(draft.curation_status) ??
    (isCurationStatus(draft.curation_status) ? draft.curation_status : 'raw');

  const etapa = draft.etapa ?? 'idle';
  if (!isViajeEtapa(etapa)) {
    return {
      ok: false,
      error: `Invalid etapa "${etapa}"`,
      rule: 'viaje.etapa'
    };
  }

  const recorrido = {
    id: draft.id,
    origin: draft.origin,
    destination: draft.destination,
    source_kind: draft.source_kind ?? 'custom',
    etapa,
    pasos: Array.isArray(draft.pasos) ? draft.pasos : [],
    candidatos_podados: Array.isArray(draft.candidatos_podados)
      ? draft.candidatos_podados
      : [],
    milestones: Array.isArray(draft.milestones) ? draft.milestones : [],
    curation_status: curation,
    snapshots: Array.isArray(draft.snapshots) ? draft.snapshots : [],
    generated_at: nowIso(),
    ...(draft.tree_normalized_from
      ? { tree_normalized_from: draft.tree_normalized_from }
      : {})
  };

  const result = validate('viaje-recorrido', recorrido);
  if (!result.ok) {
    return {
      ok: false,
      error: 'viaje-recorrido schema invalid',
      validation: result,
      rule: 'viaje.cache.schema'
    };
  }

  return { ok: true, recorrido };
}

/**
 * Write recorrido JSON under cacheDir/viajes/<id>.json after schema validation.
 * @param {{
 *   cacheDir: string,
 *   recorrido: object,
 *   curation_status?: string
 * }} options
 */
export function materializeRecorrido(options) {
  if (!options.cacheDir) {
    return { ok: false, error: 'cacheDir required', rule: 'viaje.cache.dir' };
  }
  const built = buildRecorrido({
    ...options.recorrido,
    curation_status:
      options.curation_status ?? options.recorrido?.curation_status ?? 'candidate'
  });
  if (!built.ok) return built;

  const dir = path.join(path.resolve(options.cacheDir), 'viajes');
  ensureDir(dir);
  const filePath = path.join(dir, `${built.recorrido.id}.json`);
  writeJson(filePath, built.recorrido);

  // Snapshots (if present) already went through fetchSnapshot → cache-sidecar-meta.
  for (const snap of built.recorrido.snapshots ?? []) {
    if (snap.meta && typeof snap.meta === 'object') {
      const metaResult = validate('cache-sidecar-meta', snap.meta);
      if (!metaResult.ok) {
        return {
          ok: false,
          error: 'snapshot meta failed cache-sidecar-meta',
          validation: metaResult,
          rule: 'viaje.cache.snapshot_meta'
        };
      }
    }
  }

  return {
    ok: true,
    path: filePath,
    recorrido: built.recorrido
  };
}

/**
 * Normalize a minimal tree.json-like object into a viaje draft.
 * Shape expected: { root?, nodes?: { [id]: { links?: string[] } }, path?: string[] }
 * @param {object} tree
 * @param {{ id?: string, origin?: string, destination?: string }} [opts]
 */
export function normalizeTreeJson(tree, opts = {}) {
  if (!tree || typeof tree !== 'object') {
    return { ok: false, error: 'tree object required', rule: 'viaje.tree.args' };
  }

  const pathNodes = Array.isArray(tree.path)
    ? tree.path.map(String)
    : Array.isArray(tree.recorrido)
      ? tree.recorrido.map(String)
      : [];

  const origin = opts.origin ?? tree.origin ?? pathNodes[0] ?? tree.root;
  const destination =
    opts.destination ?? tree.destination ?? pathNodes[pathNodes.length - 1];

  if (!origin || !destination) {
    return {
      ok: false,
      error: 'Cannot infer origin/destination from tree',
      rule: 'viaje.tree.endpoints'
    };
  }

  /** @type {object[]} */
  const pasos = [];
  if (pathNodes.length >= 2) {
    for (let i = 0; i < pathNodes.length - 1; i += 1) {
      const from = pathNodes[i];
      const to = pathNodes[i + 1];
      const links = tree.nodes?.[from]?.links ?? tree.nodes?.[from]?.edges ?? [];
      pasos.push({
        from,
        to,
        via: null,
        chosen_from: Array.isArray(links) ? links.map(String) : [to]
      });
    }
  }

  return buildRecorrido({
    id: opts.id ?? tree.id ?? `viaje-${origin}-${destination}`,
    origin: String(origin),
    destination: String(destination),
    source_kind: 'wiki',
    etapa: pathNodes.length >= 2 ? 'completed' : 'idle',
    pasos,
    curation_status: 'raw',
    tree_normalized_from: 'tree.json'
  });
}

/**
 * Advance etapa with transition guard.
 * @param {object} recorrido
 * @param {string} nextEtapa
 */
export function advanceEtapa(recorrido, nextEtapa) {
  const from = recorrido?.etapa ?? 'idle';
  if (!canTransition(from, nextEtapa)) {
    return {
      ok: false,
      error: `Illegal transition ${from} → ${nextEtapa}`,
      rule: 'viaje.etapa.transition'
    };
  }
  return buildRecorrido({ ...recorrido, etapa: nextEtapa });
}

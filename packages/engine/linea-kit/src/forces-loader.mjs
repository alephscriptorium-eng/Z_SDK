/**
 * Node-only fs loader for force/cota corpora under DISK_03/FORCES.
 * Refs `linea:*` that are not mounted are pending, never hard errors.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'yaml';

/**
 * Classify typed pairs_with refs. Unmounted `linea:*` refs are pending, not errors.
 * Local force/cota/boot refs missing from the volume are also pending.
 *
 * @param {string[]} pairs
 * @param {{
 *   localIds?: Set<string>|Iterable<string>,
 *   mountedLineaIds?: Set<string>|Iterable<string>
 * }} [ctx]
 * @returns {{
 *   pairs_with: string[],
 *   pending_refs: Array<{ ref: string, status: 'pending', reason: string }>,
 *   resolved_refs: Array<{ ref: string, status: 'ok', kind: string }>
 * }}
 */
export function classifyPairsWith(pairs, ctx = {}) {
  const localIds = ctx.localIds instanceof Set ? ctx.localIds : new Set(ctx.localIds ?? []);
  const mountedLineaIds =
    ctx.mountedLineaIds instanceof Set
      ? ctx.mountedLineaIds
      : new Set(ctx.mountedLineaIds ?? []);
  const list = Array.isArray(pairs) ? pairs : [];
  /** @type {Array<{ ref: string, status: 'pending', reason: string }>} */
  const pending_refs = [];
  /** @type {Array<{ ref: string, status: 'ok', kind: string }>} */
  const resolved_refs = [];

  for (const ref of list) {
    if (typeof ref !== 'string' || !ref.includes(':')) {
      pending_refs.push({ ref: String(ref), status: 'pending', reason: 'malformed ref' });
      continue;
    }
    const colon = ref.indexOf(':');
    const kind = ref.slice(0, colon);
    const id = ref.slice(colon + 1);
    if (kind === 'linea') {
      if (mountedLineaIds.has(id)) {
        resolved_refs.push({ ref, status: 'ok', kind });
      } else {
        pending_refs.push({
          ref,
          status: 'pending',
          reason: 'linea not mounted'
        });
      }
      continue;
    }
    if (kind === 'force' || kind === 'cota' || kind === 'boot') {
      if (localIds.has(id)) {
        resolved_refs.push({ ref, status: 'ok', kind });
      } else {
        pending_refs.push({
          ref,
          status: 'pending',
          reason: `${kind} not in volume registry`
        });
      }
      continue;
    }
    pending_refs.push({ ref, status: 'pending', reason: `unknown ref kind "${kind}"` });
  }

  return { pairs_with: list, pending_refs, resolved_refs };
}

async function loadMountedLineaIds(lineasBasePath) {
  if (!lineasBasePath) return new Set();
  try {
    const raw = await fs.readFile(path.join(lineasBasePath, 'registry.yaml'), 'utf8');
    const registry = yaml.parse(raw);
    if (!Array.isArray(registry)) return new Set();
    return new Set(registry.map((e) => e?.id).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function loadCorpusEntry(forcesRoot, entry, kind) {
  const rel = String(entry.path || '').replace(/\\/g, '/').replace(/\/+$/, '');
  const corpusDir = path.join(forcesRoot, rel);
  const cardName = kind === 'cota' ? 'cota.json' : 'force.json';
  const cardPath = path.join(corpusDir, cardName);
  const manifestPath = path.join(corpusDir, 'manifest.json');
  const card = JSON.parse(await fs.readFile(cardPath, 'utf8'));
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

  /** @type {Map<string, object>} */
  const scenesByKey = new Map();
  for (const scene of manifest.scenes ?? []) {
    const session = scene.session ?? '';
    const slug = scene.slug ?? '';
    const key = session && slug ? `${session}/${slug}` : scene.id;
    scenesByKey.set(key, scene);
    if (scene.id) scenesByKey.set(scene.id, scene);
  }

  return {
    id: entry.id ?? card.id,
    kind: card.kind ?? entry.kind ?? kind,
    bound: entry.bound ?? card.bound,
    entry,
    card,
    manifest,
    corpusDir,
    scenesByKey,
    anchor_scene: card.anchor_scene ?? entry.anchor_scene ?? manifest.anchor_scene
  };
}

/**
 * Loads FORCES registry + all force/cota corpora under basePath (read-only).
 * @param {string} basePath — absolute FORCES root (e.g. DISK_03/FORCES)
 * @param {{
 *   mountedLineaIds?: Iterable<string>,
 *   lineasBasePath?: string
 * }} [options]
 */
export async function loadForcesData(basePath, options = {}) {
  if (!basePath || typeof basePath !== 'string') {
    throw new Error('loadForcesData requires basePath (absolute FORCES root)');
  }
  const registry = JSON.parse(await fs.readFile(path.join(basePath, 'registry.json'), 'utf8'));
  const mountedLineaIds =
    options.mountedLineaIds != null
      ? new Set(options.mountedLineaIds)
      : await loadMountedLineaIds(options.lineasBasePath);

  /** @type {Record<string, object>} */
  const forces = {};
  /** @type {Record<string, object>} */
  const cotas = {};

  for (const entry of registry.forces ?? []) {
    forces[entry.id] = await loadCorpusEntry(basePath, entry, 'force');
  }
  for (const entry of registry.cotas ?? []) {
    cotas[entry.id] = await loadCorpusEntry(basePath, entry, 'cota');
  }

  const localIds = new Set([...Object.keys(forces), ...Object.keys(cotas)]);
  const pairCtx = { localIds, mountedLineaIds };

  for (const corpus of [...Object.values(forces), ...Object.values(cotas)]) {
    const classified = classifyPairsWith(corpus.card.pairs_with ?? [], pairCtx);
    corpus.pairs_with = classified.pairs_with;
    corpus.pending_refs = classified.pending_refs;
    corpus.resolved_refs = classified.resolved_refs;
  }

  return {
    basePath,
    registry,
    forces,
    cotas,
    localIds,
    mountedLineaIds,
    pairCtx
  };
}

/**
 * @param {object} data — result of loadForcesData
 */
export function buildForcesRegistryView(data) {
  const registry = data.registry;
  return {
    registry: registry.registry,
    version: registry.version,
    description: registry.description,
    imported_at: registry.imported_at,
    boot: registry.boot,
    activation: registry.activation,
    session_budget: registry.activation?.session_budget ?? null,
    force_ids: (registry.forces ?? []).map((f) => f.id),
    cota_ids: (registry.cotas ?? []).map((c) => c.id),
    force_count: (registry.forces ?? []).length,
    cota_count: (registry.cotas ?? []).length
  };
}

/**
 * @param {object} data
 * @param {string} id
 */
export function resolveForce(data, id) {
  if (!id || typeof id !== 'string') {
    return { error: `Invalid force id "${id}"` };
  }
  const corpus = data.forces[id] ?? data.cotas[id];
  if (!corpus) {
    return {
      error: `Unknown force/cota id "${id}"`,
      hint: 'Read force://registry for force_ids and cota_ids'
    };
  }
  const isCota = Boolean(data.cotas[id]);
  return {
    id: corpus.id,
    kind: corpus.kind,
    ...(isCota ? { bound: corpus.bound ?? corpus.card.bound, pole: corpus.card.pole } : {}),
    card: corpus.card,
    anchor_scene: corpus.anchor_scene,
    scene_count: corpus.manifest.scene_count ?? (corpus.manifest.scenes ?? []).length,
    scene_ids: (corpus.manifest.scenes ?? []).map((s) => s.id),
    pairs_with: corpus.pairs_with,
    pending_refs: corpus.pending_refs,
    resolved_refs: corpus.resolved_refs
  };
}

/**
 * @param {object} data
 * @param {string} id
 * @param {string} session
 * @param {string} slug
 */
export async function resolveForceScene(data, id, session, slug) {
  const force = resolveForce(data, id);
  if (force.error) return force;
  if (!session || !slug) {
    return { error: 'scene requires session and slug path segments' };
  }
  const corpus = data.forces[id] ?? data.cotas[id];
  const sceneKey = `${session}/${slug}`;
  const scene = corpus.scenesByKey.get(sceneKey) ?? corpus.scenesByKey.get(slug);
  if (!scene) {
    return {
      error: `Scene "${sceneKey}" not found on "${id}"`,
      hint: 'Use force://{id} scene_ids / anchor_scene'
    };
  }

  /** @type {Record<string, string|null>} */
  const layers = {};
  for (const [layer, rel] of Object.entries(scene.files ?? {})) {
    if (!rel) {
      layers[layer] = null;
      continue;
    }
    const abs = path.join(corpus.corpusDir, rel);
    try {
      layers[layer] = await fs.readFile(abs, 'utf8');
    } catch (err) {
      layers[layer] = null;
      layers[`${layer}_error`] = err.message;
    }
  }

  return {
    force_id: id,
    scene_key: sceneKey,
    scene: {
      id: scene.id,
      session: scene.session,
      slug: scene.slug,
      title: scene.title,
      tags: scene.tags,
      rol: scene.rol,
      anomalies: scene.anomalies
    },
    layers,
    is_anchor: corpus.anchor_scene === sceneKey
  };
}

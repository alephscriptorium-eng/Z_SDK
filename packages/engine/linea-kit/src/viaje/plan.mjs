/**
 * Path planning over a GraphSource (BFS): candidates, choice, prune.
 */

import { assertGraphSource } from './graph-source.mjs';

/**
 * @param {import('./graph-source.mjs').GraphSource} source
 * @param {string} origin
 * @param {string} destination
 * @param {{ maxDepth?: number, prune?: Set<string>|string[] }} [opts]
 */
export async function planPath(source, origin, destination, opts = {}) {
  const check = assertGraphSource(source);
  if (!check.ok) return check;

  if (!origin || !destination) {
    return {
      ok: false,
      error: 'origin and destination are required',
      rule: 'viaje.plan.args'
    };
  }

  const maxDepth = opts.maxDepth ?? 64;
  const prune = new Set(
    Array.isArray(opts.prune)
      ? opts.prune
      : opts.prune instanceof Set
        ? [...opts.prune]
        : []
  );

  if (origin === destination) {
    return {
      ok: true,
      path: [origin],
      pasos: [],
      hops: 0,
      candidatos_podados: [...prune]
    };
  }

  /** @type {Map<string, string|null>} */
  const parent = new Map([[origin, null]]);
  /** @type {string[]} */
  const queue = [origin];
  let depth = 0;
  let qStart = 0;

  while (qStart < queue.length && depth < maxDepth) {
    const levelSize = queue.length - qStart;
    for (let i = 0; i < levelSize; i += 1) {
      const current = queue[qStart++];
      const edges = await source.neighbors(current);
      if (!Array.isArray(edges)) {
        return {
          ok: false,
          error: `neighbors(${current}) must return an array`,
          rule: 'viaje.plan.neighbors'
        };
      }
      for (const edge of edges) {
        const next = edge?.to;
        if (!next || typeof next !== 'string') continue;
        if (prune.has(next)) continue;
        if (parent.has(next)) continue;
        parent.set(next, current);
        if (next === destination) {
          const path = reconstruct(parent, destination);
          return {
            ok: true,
            path,
            pasos: pathToPasos(path, edgesByHop(source, path)),
            hops: path.length - 1,
            candidatos_podados: [...prune]
          };
        }
        queue.push(next);
      }
    }
    depth += 1;
  }

  return {
    ok: false,
    error: `No path from ${origin} to ${destination} within depth ${maxDepth}`,
    rule: 'viaje.plan.unreachable',
    candidatos_podados: [...prune]
  };
}

/**
 * @param {Map<string, string|null>} parent
 * @param {string} destination
 * @returns {string[]}
 */
function reconstruct(parent, destination) {
  /** @type {string[]} */
  const path = [];
  let cur = /** @type {string|null} */ (destination);
  while (cur != null) {
    path.push(cur);
    cur = parent.get(cur) ?? null;
  }
  path.reverse();
  return path;
}

/**
 * @param {string[]} path
 * @param {Map<string, string[]>} hopCandidates
 */
function pathToPasos(path, hopCandidates) {
  /** @type {object[]} */
  const pasos = [];
  for (let i = 0; i < path.length - 1; i += 1) {
    const from = path[i];
    const to = path[i + 1];
    pasos.push({
      from,
      to,
      via: null,
      chosen_from: hopCandidates.get(`${from}->${to}`) ?? [to]
    });
  }
  return pasos;
}

/**
 * Best-effort: collect neighbor ids at each hop for audit (sync fallback empty).
 * @param {import('./graph-source.mjs').GraphSource} _source
 * @param {string[]} path
 */
function edgesByHop(_source, path) {
  /** @type {Map<string, string[]>} */
  const map = new Map();
  for (let i = 0; i < path.length - 1; i += 1) {
    map.set(`${path[i]}->${path[i + 1]}`, [path[i + 1]]);
  }
  return map;
}

/**
 * Enrich pasos with live neighbor candidates at each from-node (choice audit).
 * @param {import('./graph-source.mjs').GraphSource} source
 * @param {object[]} pasos
 */
export async function enrichPasosWithCandidates(source, pasos) {
  const out = [];
  for (const paso of pasos) {
    const edges = await source.neighbors(paso.from);
    const ids = (edges ?? []).map((e) => e.to).filter(Boolean);
    out.push({
      ...paso,
      chosen_from: ids.length ? ids : paso.chosen_from ?? [paso.to]
    });
  }
  return out;
}

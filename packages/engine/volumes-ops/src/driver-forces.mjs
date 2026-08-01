/**
 * Family driver · FORCES (WP-U203) — soporte RO-INMUTABLE (H-01 §④).
 *
 * Regla de reconciliación: IGUALDAD DE HASH por UNIDAD (dir de force o de
 * cota, según registry.json). Unidad nueva aterriza; unidad idéntica se
 * salta; unidad cuyo árbol difiere en CUALQUIER cosa (fichero cambiado,
 * añadido o quitado) = **colisión que aborta** antes de mover nada (pase
 * dry de importPack). NO es la regla de LINEAS: aquí no hay divergencia
 * reportada ni curación — las escenas `.md` (prompt/think/output) son
 * contenido RO del corpus, `isCuratedSidecarPath` NO aplica.
 *
 * Índice: `registry.json` es derivado-del-contenido. Puede reemplazarse
 * por el del pack SOLO cuando (a) cero colisiones de unidad y (b) el
 * registry del pack es SUPERCONJUNTO del registry destino (ninguna unidad
 * existente queda huérfana) — si no, `registro_incompleto`. Cualquier otro
 * fichero fuera de unidad que difiera = `colision_indice`.
 *
 * Snapshot por hash: el plan devuelve `snapshot { <unitDir>: sha256 del
 * árbol de la unidad }`; importPack lo sella en el manifiesto
 * (`source.imported.snapshot`) — el driver no sella ni mueve nada.
 * Node-only.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { validateFile } from '@zeus/linea-kit/validate';

export const FORCES_FAMILY = 'forces';

/** @param {string} abs */
function sha256File(abs) {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

/** @param {string} rel */
function toAbs(dir, rel) {
  return join(dir, rel.split('/').join(sep));
}

/** Normalize a registry unit path: posix, no trailing slash. */
function unitDirOf(entry) {
  return String(entry.path || entry.id).replace(/\\/g, '/').replace(/\/+$/, '');
}

/** Files-only walk, posix rels. */
function walkRel(rootDir) {
  /** @type {string[]} */
  const out = [];
  function walk(dir, rel) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(dir, entry.name), childRel);
      else if (entry.isFile()) out.push(childRel);
    }
  }
  if (existsSync(rootDir)) walk(rootDir, '');
  return out.sort();
}

/**
 * Content hash of a directory tree (sorted rel:sha lines).
 *
 * Exported since WP-U206 **sin cambiar una coma de su cuerpo**: es el
 * algoritmo con el que este driver sella `source.imported.snapshot`, y el
 * verificador de integridad (src/verify.mjs) tiene que recomputarlo con el
 * MISMO algoritmo. Reimplementarlo allí sería plantar dos copias que derivan
 * — el defecto vive en la juntura, no en la pieza.
 * @param {string} rootDir
 * @returns {string} sha256 hex
 */
export function hashUnitTree(rootDir) {
  const h = createHash('sha256');
  for (const rel of walkRel(rootDir)) {
    h.update(`${rel}:${sha256File(toAbs(rootDir, rel))}\n`);
  }
  return h.digest('hex');
}

/** Alias interno histórico (el cuerpo del driver lo usa por este nombre). */
const hashTree = hashUnitTree;

/** Parse a registry.json into normalized units. */
function readUnits(registryPath) {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  /** @type {{ kind: 'force'|'cota', id: string, dir: string }[]} */
  const units = [];
  for (const e of registry.forces || []) {
    units.push({ kind: 'force', id: e.id, dir: unitDirOf(e) });
  }
  for (const e of registry.cotas || []) {
    units.push({ kind: 'cota', id: e.id, dir: unitDirOf(e) });
  }
  return { registry, units };
}

/**
 * detect — family declared or the FORCES signature: registry.json at the
 * volume root (LINEAS uses registry.yaml — disjoint signatures).
 * @param {{ volumeEntry: object, volumeFiles: string[] }} ctx
 */
function detect({ volumeEntry, volumeFiles }) {
  if (volumeEntry?.family === FORCES_FAMILY) return true;
  return volumeFiles.includes('registry.json');
}

/**
 * validate — staged tree against the REAL linea-kit validators (U80):
 * force-registry, force, cota, force-manifest. Cero shapes inventadas.
 * @param {{ stagedDir: string }} ctx
 * @returns {{ ok: boolean, results: object[] }}
 */
function validate({ stagedDir }) {
  /** @type {object[]} */
  const results = [];
  const push = (r) => results.push(r);
  const registryPath = join(stagedDir, 'registry.json');
  if (!existsSync(registryPath)) {
    return {
      ok: false,
      results: [
        {
          ok: false,
          schemaId: 'force-registry',
          errors: [{ message: 'registry.json ausente en el pack (familia FORCES es autoconsistente)' }]
        }
      ]
    };
  }
  push(validateFile('force-registry', registryPath));
  let parsed;
  try {
    parsed = readUnits(registryPath);
  } catch {
    return { ok: false, results };
  }
  for (const unit of parsed.units) {
    const unitAbs = toAbs(stagedDir, unit.dir);
    const own = unit.kind === 'force' ? 'force.json' : 'cota.json';
    const ownAbs = join(unitAbs, own);
    if (!existsSync(ownAbs)) {
      push({
        ok: false,
        schemaId: unit.kind === 'force' ? 'force' : 'cota',
        path: ownAbs,
        errors: [{ message: `${own} ausente para la unidad ${unit.id}` }]
      });
      continue;
    }
    push(validateFile(unit.kind === 'force' ? 'force' : 'cota', ownAbs));
    const manifestAbs = join(unitAbs, 'manifest.json');
    if (existsSync(manifestAbs)) {
      push(validateFile('force-manifest', manifestAbs));
    }
  }
  return { ok: results.every((r) => r.ok), results };
}

/**
 * merge — RO-immutable PLAN. Returns `{ error }` on collision (importPack
 * aborts in the dry pass) or `{ moves, skips, snapshot, replacedIndex }`.
 * @param {{ stagedDir: string, destDir: string, volumeFiles: string[] }} ctx
 */
function merge({ stagedDir, destDir, volumeFiles }) {
  const { units } = readUnits(join(stagedDir, 'registry.json'));

  // Superset guard: no existing unit may be orphaned by the pack registry.
  const destRegistryPath = join(destDir, 'registry.json');
  if (existsSync(destRegistryPath)) {
    const dest = readUnits(destRegistryPath);
    const stagedKey = new Set(units.map((u) => `${u.kind}:${u.id}:${u.dir}`));
    const missing = dest.units.filter((u) => !stagedKey.has(`${u.kind}:${u.id}:${u.dir}`));
    if (missing.length > 0) {
      return {
        error: {
          code: 'registro_incompleto',
          detail: { missing: missing.map((u) => `${u.kind}:${u.id}`) }
        }
      };
    }
  }

  /** @type {string[]} */
  const moves = [];
  /** @type {string[]} */
  const skips = [];
  /** @type {Record<string, string>} */
  const snapshot = {};
  const unitDirs = units.map((u) => u.dir);

  for (const unit of units) {
    const stagedUnit = toAbs(stagedDir, unit.dir);
    const destUnit = toAbs(destDir, unit.dir);
    const stagedHash = hashTree(stagedUnit);
    snapshot[unit.dir] = stagedHash;
    if (existsSync(destUnit) && walkRel(destUnit).length > 0) {
      if (hashTree(destUnit) === stagedHash) {
        skips.push(unit.dir); // idéntico: no-op de unidad
        continue;
      }
      // RO-inmutable: la unidad existente difiere → colisión, no merge.
      return {
        error: {
          code: 'colision_force',
          detail: { unit: unit.dir, id: unit.id, kind: unit.kind }
        }
      };
    }
    for (const rel of volumeFiles) {
      if (rel.startsWith(`${unit.dir}/`)) moves.push(rel);
    }
  }

  // Non-unit files (index & friends): registry.json may be REPLACED (the
  // guards above already ran); any other differing file = colision_indice.
  let replacedIndex = false;
  for (const rel of volumeFiles) {
    if (unitDirs.some((d) => rel.startsWith(`${d}/`))) continue;
    const destAbs = toAbs(destDir, rel);
    if (!existsSync(destAbs)) {
      moves.push(rel); // lo que falta
      continue;
    }
    if (sha256File(destAbs) === sha256File(toAbs(stagedDir, rel))) {
      skips.push(rel);
      continue;
    }
    if (rel === 'registry.json') {
      moves.push(rel); // replace: superset + cero colisiones garantizados
      replacedIndex = true;
      continue;
    }
    return { error: { code: 'colision_indice', detail: { file: rel } } };
  }

  return { moves, skips, snapshot, replacedIndex };
}

export const FORCES_DRIVER = Object.freeze({
  family: FORCES_FAMILY,
  detect,
  validate,
  merge
});

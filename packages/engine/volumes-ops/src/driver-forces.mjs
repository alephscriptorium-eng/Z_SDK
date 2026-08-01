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
 *
 * ── U259 · el mismo cuerpo SELLA y VERIFICA ───────────────────────────────
 * `snapshotOf(volumeDir)` calcula el snapshot desde un volumen VIVO y
 * `verifySnapshot(volumeDir, sellado)` lo contrasta. Desde U259 el paso SELLAR
 * de `importPack` llama a `snapshotOf` sobre el DESTINO tras FUSIONAR (misma
 * doctrina que el sello por fichero de U258) y `verify.mjs` llama a
 * `verifySnapshot`: quien sella y quien verifica son la misma función, así que
 * no pueden divergir. `hashUnitTree` se mudó a `unit-tree.mjs` —cuerpo
 * verbatim— porque LINEAS lo necesita también; aquí se RE-EXPORTA para que
 * ningún importador anterior cambie.
 * Node-only.
 */

import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { validateFile } from '@zeus/linea-kit/validate';
import {
  hashUnitTree,
  isUnitTreeSnapshot,
  verifyUnitTreeSnapshot
} from './unit-tree.mjs';
import { blockingAncestor } from './fusion-guard.mjs';

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
 * Exportado desde WP-U206 **sin cambiar una coma de su cuerpo**; mudado a
 * `unit-tree.mjs` en U259 —también verbatim— porque LINEAS pasó a sellar
 * snapshot de unidad y la alternativa era una tercera copia. Se re-exporta
 * desde aquí para que `verify.mjs`, `index.mjs` y los tests que ya lo
 * importaban de este módulo no cambien una línea.
 */
export { hashUnitTree };

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
 *
 * ── U255 · EL MISMO HUECO QUE LINEAS, MEDIDO AQUÍ TAMBIÉN ─────────────────
 * El enunciado del WP señalaba a LINEAS y decía «comprueba tú si alguno más lo
 * tiene». FORCES lo tenía, y con el mismo peaje: destino con un FICHERO en
 * `forces/hondo` y un pack que declara la unidad `forces/hondo/force-ccc/` →
 * `existsSync(destUnit)` responde NO, la unidad entra entera en `moves`, y el
 * `mkdirSync` de la aplicación lanza **ENOTDIR con DOS ficheros de otra unidad
 * ya aterrizados**. Se cierra con `ruta_bloqueada_por_fichero`, la misma guarda
 * y el mismo código que las otras tres familias.
 *
 * Y el hermano del pase dry: un FICHERO exactamente en la ruta de una unidad
 * declarada hacía `readdirSync` sobre un fichero → **ENOTDIR (scandir)** dentro
 * de `walkRel`, así que `importPack` LANZABA en vez de devolver
 * `{ok:false, step, error}`. Ahora es `unidad_bloqueada_por_fichero`. La regla
 * RO-inmutable no se toca: una unidad presente que DIFIERE sigue abortando con
 * `colision_force`, y una idéntica sigue siendo no-op.
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
    // U255 · la ruta de la unidad tiene que ser un DIRECTORIO para poder
    // recorrerla: con un fichero ahí, `walkRel` lanzaba ENOTDIR en el pase dry.
    if (existsSync(destUnit) && !lstatSync(destUnit).isDirectory()) {
      return {
        error: {
          code: 'unidad_bloqueada_por_fichero',
          detail: {
            unit: unit.dir,
            id: unit.id,
            kind: unit.kind,
            ocupadoPor: lstatSync(destUnit).isSymbolicLink() ? 'enlace' : 'fichero'
          }
        }
      };
    }
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
    // U255 · el pack trae un FICHERO: si el destino tiene otra cosa, `sha256File`
    // lanzaba EISDIR aquí mismo. Mismo tratamiento que en LINEAS.
    const st = lstatSync(destAbs);
    if (st.isSymbolicLink()) {
      return { error: { code: 'enlace_en_destino', detail: { file: rel } } };
    }
    if (!st.isFile()) {
      return {
        error: {
          code: 'destino_no_es_fichero',
          detail: { file: rel, ocupadoPor: st.isDirectory() ? 'directorio' : 'otro' }
        }
      };
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

  // Garantía estructural (U255): idéntica a la de FIREHOSE·D3, SSB y LINEAS,
  // con UNA excepción que esta familia sí tiene y que hay que decir en voz alta.
  //
  // **`registry.json` es la única sobrescritura DELIBERADA de todo el carril.**
  // Cuando el índice del destino difiere, esta familia lo REEMPLAZA (las dos
  // guardas de arriba —superconjunto y cero colisiones de unidad— son lo que lo
  // hace seguro), y lo hacía apoyándose en que `renameSync` pisa en silencio.
  // Eso era invisible en el plan: para quien mira `moves` era un movimiento como
  // los demás. Desde U255 el plan lo DECLARA en `overwrites`, y la guarda del
  // plan entero (`fusion-guard.mjs`) sólo tolera un destino ocupado si viene
  // declarado ahí. Un import legítimo de FORCES sigue aterrizando —hay rojo y
  // verde que lo fijan—, y la sobrescritura deja de ser un efecto del sistema de
  // ficheros para ser una línea del plan.
  //
  // `sobrescritura_imposible` queda por tanto **inalcanzable por orden** (todo
  // lo demás que entra en `moves` no existe en el destino); se conserva como
  // última línea. `ruta_bloqueada_por_fichero` **sí se alcanza** y tiene rojo
  // propio: es el vector del WP, medido también en esta familia.
  const overwrites = replacedIndex ? ['registry.json'] : [];
  for (const rel of moves) {
    if (!overwrites.includes(rel) && existsSync(toAbs(destDir, rel))) {
      return { error: { code: 'sobrescritura_imposible', detail: { file: rel } } };
    }
    const blocked = blockingAncestor(destDir, rel);
    if (blocked) {
      return { error: { code: 'ruta_bloqueada_por_fichero', detail: { file: rel, blockedBy: blocked } } };
    }
  }

  return { moves, skips, snapshot, replacedIndex, overwrites };
}

/**
 * snapshotOf (U259) — el snapshot de la familia calculado desde un volumen
 * VIVO. Es EL MISMO valor que `merge` devuelve en su plan (mismo `hashTree`
 * sobre las mismas unidades del mismo `registry.json`); la diferencia es de
 * momento, no de fórmula: `merge` lo calcula sobre el STAGING y esto sobre el
 * DESTINO. Un test lo asevera, no lo supone.
 *
 * Por qué el sello pasa a tomarse del DESTINO: es la lección de U258 con
 * `hashes`. En FORCES los dos coinciden siempre (una unidad que difiera aborta
 * el import con `colision_force`, así que el destino tras fusionar ES el
 * staging), pero la regla tiene que ser una sola para las cuatro familias, y en
 * LINEAS no coinciden — ahí sellar el staging sería sellar una mentira.
 *
 * `null` cuando el volumen no tiene índice: sin `registry.json` no hay unidades
 * declaradas y no se inventa ninguna.
 * @param {string} volumeDir — directorio absoluto del volumen (vivo)
 * @returns {Record<string,string>|null}
 */
export function snapshotOf(volumeDir) {
  const registryPath = join(volumeDir, 'registry.json');
  if (!existsSync(registryPath)) return null;
  /** @type {{ units: {dir: string}[] }} */
  let parsed;
  try {
    parsed = readUnits(registryPath);
  } catch {
    return null; // índice ilegible: el leg `familia` es quien lo denuncia
  }
  /** @type {Record<string,string>} */
  const snapshot = {};
  for (const unit of parsed.units) snapshot[unit.dir] = hashTree(toAbs(volumeDir, unit.dir));
  return Object.keys(snapshot).length > 0 ? snapshot : null;
}

/**
 * verifySnapshot (U259) — contrasta el snapshot SELLADO contra el árbol vivo.
 * Recomputa con `hashUnitTree`, la misma primitiva que lo selló.
 * @param {string} volumeDir @param {unknown} sealed
 * @returns {object[]} hallazgos (vacío = íntegro)
 */
export function verifySnapshot(volumeDir, sealed) {
  if (!isUnitTreeSnapshot(sealed)) {
    return [
      {
        error: 'snapshot_ilegible',
        note:
          'la familia FORCES sella «árbol por unidad» y el snapshot sellado no tiene esa forma'
      }
    ];
  }
  return verifyUnitTreeSnapshot(volumeDir, /** @type {Record<string,string>} */ (sealed));
}

export const FORCES_DRIVER = Object.freeze({
  family: FORCES_FAMILY,
  detect,
  validate,
  merge,
  snapshotOf,
  verifySnapshot
});

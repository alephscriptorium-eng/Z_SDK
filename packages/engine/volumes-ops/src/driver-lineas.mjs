/**
 * Family driver · LINEAS (WP-U202) — detect → validate → index → merge,
 * mounted ON TOP of importPack (CONTRATO-IMPORT-PACK-v1): the driver never
 * touches the manifest nor moves files itself — it validates the staged
 * family tree with the REAL linea-kit gates and returns a merge PLAN that
 * importPack executes (rename-only, staging inside the root).
 *
 * Site note (razonado, WP-U202): the family KNOWLEDGE stays in linea-kit —
 * schemas via `@zeus/linea-kit/validate` (U80 gate) and the curated-sidecar
 * predicate `isCuratedSidecarPath` in `@zeus/linea-kit/curation`. The
 * driver MECHANICS live here, next to importPack, because linea-kit's
 * `exports` map is frozen this WP (package.json untouchable) and
 * volumes-ops already declares the linea-kit dependency. Seed for the U242
 * generalization — intentionally minimal and internal.
 *
 * Merge rules (reconciliación por soporte, H-01 §④ — LINEAS = curado):
 * - escribe lo que falta: files missing in the destination land;
 * - divergencia se REPORTA, no se pisa: existing file with different
 *   content → `{ path, kind:'contenido_distinto', destSha256, packSha256 }`
 *   in the report; the destination file stays byte-identical;
 * - curación intocable: TODO `*.md` del volumen (DATOS §2: el markdown
 *   es índice y curación) already present in the destination are DISCARDED from
 *   the merge and reported as `curacion_protegida` — never overwritten;
 *   when absent in the destination they land («lo que falta»);
 * - a family pack is self-consistent: `registry.yaml` at the volume root
 *   is REQUIRED in the pack (identical files skip by themselves).
 *
 * ── U259 · ESTA FAMILIA YA SELLA SNAPSHOT DE UNIDAD ───────────────────────
 * Hasta U259 el plan de este driver no devolvía `snapshot`, y eso dejaba a la
 * familia sin el único tramo que caza un ALTA: medido sobre un root sellado,
 * copiar un `meta.json` VÁLIDO a `demo/nodos/N02/meta.json` **arrancaba** —el
 * schema no se queja (el fichero es válido), el leg `ficheros` de U258 sólo
 * comprueba PERTENENCIA de lo sellado (un fichero nuevo no es hallazgo) y sin
 * snapshot no hay igualdad de conjunto que romper—. Con el snapshot de unidad
 * ese mismo vector niega el arranque.
 *
 * **La UNIDAD de LINEAS es la LÍNEA**: cada entrada de `registry.yaml`, por su
 * `path`. La elección no es cómoda, es la del índice: `registry.yaml` es lo que
 * el validador real recorre (`lineas-registry` + `entry.path` en `validate`), lo
 * que el lector del mundo resuelve, y lo que este mismo driver ya usa para
 * validar. Misma doctrina que FORCES, cuyas unidades salen de `registry.json`.
 *
 * **Consecuencia deliberada, medida y declarada**: lo que NO está en
 * `registry.yaml` NO es unidad, así que una línea local no registrada
 * (`LINEAS/espana/…`, que `.gitignore:26-32` permite a propósito como copia de
 * operador) **no entra en el snapshot y sigue arrancando**. El snapshot cierra
 * el perímetro de lo DECLARADO, no del directorio; es exactamente la asimetría
 * que FORCES ya tenía y que U258 midió al declarar por qué el sello no exige
 * igualdad de conjunto de volumen.
 * Node-only.
 */

import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { createHash } from 'node:crypto';
import {
  validateFile,
  readYamlFile
} from '@zeus/linea-kit/validate';
import { isCuratedSidecarPath } from '@zeus/linea-kit/curation';
import {
  hashUnitTree,
  isUnitTreeSnapshot,
  verifyUnitTreeSnapshot
} from './unit-tree.mjs';
import { blockingAncestor } from './fusion-guard.mjs';

export const LINEAS_FAMILY = 'lineas';

/** @param {string} abs */
function sha256File(abs) {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

/** @param {string} rel */
function toAbs(dir, rel) {
  return join(dir, rel.split('/').join(sep));
}

/**
 * detect — the volume declares the family (`family: 'lineas'`) or carries
 * the family signature: `registry.yaml` at the volume root.
 * @param {{ volumeEntry: object, volumeFiles: string[] }} ctx
 */
function detect({ volumeEntry, volumeFiles }) {
  if (volumeEntry?.family === LINEAS_FAMILY) return true;
  return volumeFiles.includes('registry.yaml');
}

/**
 * validate — staged family tree against the REAL linea-kit validators
 * (schemas U80): lineas-registry, manifest-tronco, nodos-document,
 * nodo-meta, manifest-satelite, nodo-sections. No invented shapes.
 * @param {{ stagedDir: string }} ctx — absolute staged volume dir
 * @returns {{ ok: boolean, results: object[] }}
 */
function validate({ stagedDir }) {
  /** @type {object[]} */
  const results = [];
  const push = (r) => {
    results.push(r);
    return r.ok;
  };
  const registryPath = join(stagedDir, 'registry.yaml');
  if (!existsSync(registryPath)) {
    return {
      ok: false,
      results: [
        {
          ok: false,
          schemaId: 'lineas-registry',
          errors: [{ message: 'registry.yaml ausente en el pack (familia LINEAS es autoconsistente)' }]
        }
      ]
    };
  }
  push(validateFile('lineas-registry', registryPath, 'yaml'));
  const registry = /** @type {object[]} */ (readYamlFile(registryPath)) || [];
  for (const entry of registry) {
    const lineDir = join(stagedDir, entry.path);
    const trunkManifest = join(lineDir, 'manifest.json');
    if (existsSync(trunkManifest)) {
      push(validateFile('manifest-tronco', trunkManifest));
    }
    const nodosYaml = join(lineDir, 'nodos.yaml');
    if (existsSync(nodosYaml)) {
      push(validateFile('nodos-document', nodosYaml, 'yaml'));
    }
    const nodosDir = join(lineDir, 'nodos');
    if (existsSync(nodosDir)) {
      // nodo metas are validated one by one when present.
      for (const rel of walkRel(nodosDir)) {
        if (rel.endsWith('meta.json')) {
          push(validateFile('nodo-meta', join(nodosDir, rel.split('/').join(sep))));
        }
      }
    }
    let satRel = null;
    try {
      satRel = JSON.parse(readFileSync(trunkManifest, 'utf8'))?.meta?.satelite_wp || null;
    } catch {
      satRel = null;
    }
    if (satRel) {
      const satDir = join(lineDir, satRel);
      const satManifest = join(satDir, 'manifest.json');
      if (existsSync(satManifest)) {
        push({ ...validateFile('manifest-satelite', satManifest) });
      }
      const sections = join(satDir, 'nodo-sections.json');
      if (existsSync(sections)) {
        push(validateFile('nodo-sections', sections));
      }
    }
  }
  return { ok: results.every((r) => r.ok), results };
}

/** Minimal relative walk (files only, posix rels). */
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
  walk(rootDir, '');
  return out.sort();
}

/**
 * merge — per-file PLAN with the family rules (header). Never moves
 * anything itself; importPack executes `moves` with rename-only.
 *
 * ── U255 · LO QUE ESTE `merge` SUPONÍA DEL DESTINO Y NO COMPROBABA ────────
 * La regla de la familia («escribe lo que falta, la divergencia se reporta, la
 * curación no se pisa») se decidía preguntando `existsSync(destAbs)`, que
 * responde SÍ para un directorio, para un enlace y para un fichero por igual.
 * De ahí salían los dos huecos que este WP cierra, ambos medidos sobre la base:
 *
 * 1. **`ruta_bloqueada_por_fichero`** — el destino tiene un FICHERO donde el
 *    pack trae un DIRECTORIO (`…/registros/r0002-oldid-3`). El fichero del pack
 *    (`…/r0002-oldid-3/registro.md`) no existe en el destino, así que entraba
 *    en `moves` como «lo que falta», y el `mkdirSync` de la fase de aplicación
 *    lanzaba **EEXIST a mitad de los renombrados** — con el volumen A MEDIAS y
 *    sin sellar. Es el hueco que FIREHOSE (U204·D3) y SSB (U205) ya tapaban y
 *    esta familia no.
 * 2. **`destino_no_es_fichero` / `enlace_en_destino`** — el destino tiene un
 *    DIRECTORIO (o un enlace) donde el pack trae un FICHERO. `sha256File` sobre
 *    un directorio lanzaba **EISDIR en el propio pase dry**. Ahí el destino
 *    quedaba intacto, pero `importPack` LANZABA en vez de devolver
 *    `{ok:false, step, error}`, que es lo que el contrato promete en TODO fallo.
 *
 * **La conducta de la familia no se toca**: la divergencia se sigue reportando
 * sin pisar el fichero del destino, y un `.md` curado presente se sigue
 * descartando del merge. Lo único que cambia es que un destino cuya FORMA
 * impide aplicar esa regla —no se puede hashear un directorio, no se puede
 * «conservar» un enlace como si fuera el fichero curado— aborta con nombre en
 * vez de reventar. Un `.md` que en el destino sea un directorio ya no se
 * reporta como `curacion_protegida`: eso no es curación, es una obstrucción, y
 * el lector real de la familia (`loader.mjs readRegistro`) sólo lee FICHEROS
 * markdown.
 * @param {{ stagedDir: string, destDir: string, volumeFiles: string[] }} ctx
 *   volumeFiles: posix rels of the staged volume (from importPack's walk)
 * @returns {{ moves: string[], skips: string[], divergences: object[], protectedSidecars: object[] }
 *   | { error: { code: string, detail?: object } }}
 */
function merge({ stagedDir, destDir, volumeFiles }) {
  /** @type {string[]} */
  const moves = [];
  /** @type {string[]} */
  const skips = [];
  /** @type {object[]} */
  const divergences = [];
  /** @type {object[]} */
  const protectedSidecars = [];

  for (const rel of volumeFiles) {
    const destAbs = toAbs(destDir, rel);
    const stagedAbs = toAbs(stagedDir, rel);
    const destExists = existsSync(destAbs);
    if (destExists) {
      // El pack trae un FICHERO: el destino tiene que ser un fichero para que
      // las reglas de la familia (comparar, conservar, proteger) signifiquen
      // algo. `lstat` y no `stat`: un enlace se declara como enlace, no como
      // aquello a lo que apunta — misma doctrina que D-B de FIREHOSE/SSB, y
      // el paso NO-LINK ya rechaza el árbol resultante, sólo que DESPUÉS de
      // sellar. Aquí se adelanta a antes del primer renombrado.
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
    }
    if (isCuratedSidecarPath(rel)) {
      if (destExists) {
        // Curación intocable: discard from merge, report.
        protectedSidecars.push({ path: rel, kind: 'curacion_protegida' });
      } else {
        moves.push(rel); // lo que falta
      }
      continue;
    }
    if (!destExists) {
      moves.push(rel); // lo que falta
      continue;
    }
    const destSha = sha256File(destAbs);
    const packSha = sha256File(stagedAbs);
    if (destSha === packSha) {
      skips.push(rel);
    } else {
      // Divergencia: se reporta con ruta y naturaleza; el root queda intacto.
      divergences.push({
        path: rel,
        kind: 'contenido_distinto',
        destSha256: destSha,
        packSha256: packSha
      });
    }
  }

  // Garantía estructural (U255, misma que FIREHOSE·D3 y SSB): cero moves sobre
  // ruta existente y cero moves cuyo ancestro exista como FICHERO. `importPack`
  // aplica con `renameSync` desnudo, que sobre un fichero existente PISA en
  // silencio, y con `mkdirSync`, que sobre un ancestro-fichero LANZA a mitad de
  // la fusión: la imposibilidad la garantiza este guardián, no el sistema de
  // ficheros.
  //
  // **Alcance honesto**, dicho porque presentar como garantía activa lo que no
  // se alcanza es la clase de defecto que este carril persigue:
  // - `ruta_bloqueada_por_fichero` es **alcanzable**, y es el vector del WP:
  //   tiene rojo propio con el destino medido antes y después;
  // - `sobrescritura_imposible` es hoy **INALCANZABLE por orden** — el bucle de
  //   arriba sólo mete en `moves` lo que NO existe en el destino, y entre ese
  //   bucle y este guardián no hay nada que toque el disco. Se conserva como
  //   última línea por si el orden cambiara, igual que SSB conserva la suya, y
  //   la red de verdad para ese caso está en la guarda del plan entero
  //   (`fusion-guard.mjs`), que sí lo alcanza por otras vías.
  for (const rel of moves) {
    if (existsSync(toAbs(destDir, rel))) {
      return { error: { code: 'sobrescritura_imposible', detail: { file: rel } } };
    }
    const blocked = blockingAncestor(destDir, rel);
    if (blocked) {
      return { error: { code: 'ruta_bloqueada_por_fichero', detail: { file: rel, blockedBy: blocked } } };
    }
  }

  return { moves, skips, divergences, protectedSidecars };
}

/**
 * Directorios de línea DECLARADOS por el índice del volumen, normalizados a
 * posix sin barra final. `null` si no hay índice legible: sin `registry.yaml`
 * no hay unidades declaradas y no se inventa ninguna (el leg `familia` es quien
 * denuncia un índice ausente o roto — cada tramo dice una cosa).
 * @param {string} volumeDir
 * @returns {string[]|null}
 */
function declaredLineDirs(volumeDir) {
  const registryPath = join(volumeDir, 'registry.yaml');
  if (!existsSync(registryPath)) return null;
  /** @type {any} */
  let registry;
  try {
    registry = readYamlFile(registryPath);
  } catch {
    return null;
  }
  if (!Array.isArray(registry)) return null;
  /** @type {string[]} */
  const dirs = [];
  for (const entry of registry) {
    const raw = entry?.path ?? entry?.id;
    if (typeof raw !== 'string' || raw.length === 0) continue;
    const dir = raw.replace(/\\/g, '/').replace(/\/+$/, '');
    // Una entrada cuyo `path` escapa del volumen no es una unidad de este
    // volumen: no se hashea nada fuera del árbol que se está sellando.
    if (dir === '' || dir === '.' || dir.startsWith('/') || dir.split('/').includes('..')) continue;
    if (!dirs.includes(dir)) dirs.push(dir);
  }
  return dirs.length > 0 ? dirs : null;
}

/**
 * snapshotOf (U259) — `{ <dirDeLínea>: sha256 del árbol de la línea }`,
 * calculado desde el volumen VIVO.
 *
 * **Se calcula del DESTINO, jamás del staging, y ésta es la familia por la que
 * la regla existe.** LINEAS conserva el fichero del destino cuando diverge
 * (`merge` :184) y NUNCA pisa un `.md` curado (:169): el árbol que queda tras
 * fusionar **no es** el del pack. Sellar el hash del staging anotaría un árbol
 * que el volumen no tiene, y el root dejaría de arrancar **por haber importado
 * bien** — el mismo defecto que U258 cerró para el sello por fichero, aquí para
 * el sello por unidad. Hay un test por cada una de las dos reglas.
 * @param {string} volumeDir
 * @returns {Record<string,string>|null}
 */
export function snapshotOf(volumeDir) {
  const dirs = declaredLineDirs(volumeDir);
  if (!dirs) return null;
  /** @type {Record<string,string>} */
  const snapshot = {};
  for (const dir of dirs) snapshot[dir] = hashUnitTree(toAbs(volumeDir, dir));
  return snapshot;
}

/**
 * verifySnapshot (U259) — misma forma y mismo verificador que FORCES: «árbol
 * por unidad». Recomputa con `hashUnitTree`, la primitiva que lo selló.
 * @param {string} volumeDir @param {unknown} sealed
 * @returns {object[]}
 */
export function verifySnapshot(volumeDir, sealed) {
  if (!isUnitTreeSnapshot(sealed)) {
    return [
      {
        error: 'snapshot_ilegible',
        note: 'la familia LINEAS sella «árbol por unidad» y el snapshot sellado no tiene esa forma'
      }
    ];
  }
  return verifyUnitTreeSnapshot(volumeDir, /** @type {Record<string,string>} */ (sealed));
}

export const LINEAS_DRIVER = Object.freeze({
  family: LINEAS_FAMILY,
  detect,
  validate,
  merge,
  snapshotOf,
  verifySnapshot
});

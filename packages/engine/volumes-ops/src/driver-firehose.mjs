/**
 * Family driver · FIREHOSE (WP-U204) — caché CRECIENTE: **unión ADITIVA por
 * CLAVE, jamás sobrescritura** (H-01 §④; BACKLOG :261).
 *
 * ── Z-D9 · la UNIDAD y su CLAVE (decisión, con la evidencia que la sostiene)
 *
 * La unidad NO es el fichero ni su ruta: es el **registro ATProto**. Su clave
 * es el **AT-URI canónico DERIVADO** `at://<did>/<commit.collection>/<commit.rkey>`.
 *
 * Por qué derivada y no leída de un campo:
 * - el lector canónico del mundo ya trata `uri` como OPCIONAL y cae a `rkey`
 *   (`packages/engine/firehose-core/src/schema.mjs:40`
 *   `id = uri || raw.commit?.rkey || raw.commit?.cid || null`) — un campo que
 *   el formato real puede no traer no puede ser la clave;
 * - `did`, `commit.collection` y `commit.rkey` son los tres campos que el
 *   PRODUCTOR del mundo escribe y el lector exige
 *   (`packages/engine/feed-kit/src/jetstream-sync.mjs` `writeJetstreamPost`,
 *   `firehose-core/src/schema.mjs:58-61` `isJetstreamPost`).
 *
 * Por qué NO la ruta (`<corpus>/<batch>/<rkey>.json`, la que escribe hoy
 * `writeJetstreamPost`):
 * 1. `rkey` es único **por repo (did) y colección**, no globalmente: dos DIDs
 *    distintos pueden producir el mismo nombre de fichero en el mismo batch —
 *    deduplicar por ruta CONFUNDE dos registros y pisar uno de ellos sería
 *    pérdida de dato;
 * 2. `batch` es el nombre de la CORRIDA de sync, no del dato: el mismo
 *    registro reaparece en batches distintos entre corridas → dedup por ruta
 *    duplicaría material y rompería la idempotencia incremental;
 * 3. el `corpus` es **estado de triage vivo** (`raw→candidate→labeled→
 *    discarded`, `plan/DATOS.md` §3 y `linea-kit/schemas/curation-status.json`):
 *    un registro ya triado vive en otro corpus, y reimportarlo en `raw`
 *    resucitaría lo descartado. La clave es única a nivel de VOLUMEN, no de
 *    corpus — por eso el índice del destino se construye sobre los cuatro.
 * Doctrina concordante: `plan/DATOS.md` §5.1 «los objetos pesados ya son
 * inmutables y con clave natural (… **JSON de firehose por hash/rkey** …)».
 *
 * Sin clave no hay unidad: un fichero bajo corpus que no rinde clave es
 * `unidad_sin_clave` (fallo-cerrado en VALIDAR, staging borrado, root
 * intacto). No se inventa una clave por comodidad.
 *
 * ── Reglas de reconciliación (NO son las de LINEAS ni las de FORCES)
 * - clave NUEVA → aterriza (unión aditiva);
 * - clave YA PRESENTE en cualquier corpus del destino → **dedup**: no se mueve
 *   nada, no se pisa nada, se reporta dónde vive ya. Es un no-op observable —
 *   NO es divergencia (LINEAS) ni colisión que aborta (FORCES): una caché que
 *   crece no aborta el import entero porque un registro ya estuviera;
 * - misma RUTA ocupada por clave DISTINTA → `colision_ruta`: aborta en el pase
 *   dry (sobrescribir sería pérdida de dato, no reconciliación);
 * - sidecar de raíz del volumen (p.ej. `triage-manifest.json`): falta →
 *   aterriza; idéntico → no-op; distinto → **divergencia reportada, jamás
 *   pisada** (el triage del destino es decisión local viva, no dato del pack);
 * - clave duplicada DENTRO del pack → `clave_duplicada_en_pack` en VALIDAR
 *   (pack malformado; deduplicarlo en silencio ocultaría el defecto).
 *
 * Garantía estructural: antes de devolver el plan se verifica que NINGÚN
 * `move` apunta a una ruta ya existente en el destino; si alguno lo hiciera el
 * driver devuelve `sobrescritura_imposible` en vez de plan. `importPack`
 * ejecuta con `renameSync` (que SÍ pisaría) — la imposibilidad la garantiza
 * este guardián, no el sistema de ficheros.
 *
 * ── Cursor sellado
 * `snapshot = { unit:'at-uri', units:<n>, unitsSha256:<sha256 del conjunto de
 * claves ordenado> }` — O(1) en tamaño (8.388 unidades caben en dos campos),
 * amarrado por `importPack` en `source.imported.snapshot`. El driver NO sella
 * ni mueve nada: devuelve un PLAN (semilla U242, herencia U202/U203).
 *
 * ── Nota de sitio (razonada, como en U202)
 * `isFirehoseUnit`/`firehoseUnitKey` REPLICAN aquí el predicado canónico de
 * `@zeus/firehose-core/schema.mjs` (`isJetstreamPost` :58-61,
 * `normalizeFirehosePost` :40) porque los 48 manifests
 * `packages/<grupo>/<pieza>/package.json` están CONGELADOS en esta ola
 * (GOBIERNO-EJECUCION-F2 §2, owner U237) y volumes-ops
 * no declara la dependencia `@zeus/firehose-core`: importarla sería una dep
 * fantasma. Cuando la dep exista, este par de funciones se re-apunta al
 * canónico. Mismo desvío declarado que U200 con linea-kit.
 * Node-only.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { validateFile } from '@zeus/linea-kit/validate';

export const FIREHOSE_FAMILY = 'firehose';

/** Índice de triage en la raíz del volumen (schema real U80: `triage-manifest`). */
export const TRIAGE_INDEX_FILE = 'triage-manifest.json';

/** Tope de lecturas de contenido en `detect` (firma derivada, no fichero-firma). */
const DETECT_SAMPLE_CAP = 64;

/** @param {string} abs */
function sha256File(abs) {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

/** @param {string} dir @param {string} rel */
function toAbs(dir, rel) {
  return join(dir, rel.split('/').join(sep));
}

/** Files-only walk, posix rels, sorted. */
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
 * A unit lives UNDER a corpus dir (rel with at least one `/`); a rel without
 * `/` is a volume-root sidecar (índice, no unidad). La forma se DERIVA del
 * árbol — no se hardcodea la lista de corpus.
 * @param {string} rel
 */
export function isUnitSlot(rel) {
  return rel.includes('/');
}

/**
 * Predicado de unidad (réplica declarada de `isJetstreamPost`,
 * firehose-core/src/schema.mjs:58-61).
 * @param {any} raw
 */
export function isFirehoseUnit(raw) {
  const collection = raw?.commit?.collection;
  return collection === 'app.bsky.feed.post' || Boolean(raw?.commit?.record?.text != null);
}

/**
 * Clave de la unidad — AT-URI canónico DERIVADO (Z-D9, cabecera).
 * Devuelve `null` cuando el material no permite una clave inequívoca: quien
 * llama decide (VALIDAR aborta; el índice del destino la cuenta como no
 * indexable). Jamás se fabrica una clave a partir de la ruta.
 * @param {any} raw
 * @returns {string|null}
 */
export function firehoseUnitKey(raw) {
  if (!isFirehoseUnit(raw)) return null;
  const did = typeof raw?.did === 'string' ? raw.did.trim() : '';
  const collection = typeof raw?.commit?.collection === 'string' ? raw.commit.collection.trim() : '';
  const rkey = typeof raw?.commit?.rkey === 'string' ? raw.commit.rkey.trim() : '';
  if (did && collection && rkey) return `at://${did}/${collection}/${rkey}`;
  // Fallback declarado: el AT-URI explícito, cuando el productor lo trajo.
  const uri = typeof raw?.uri === 'string' ? raw.uri.trim() : '';
  return uri || null;
}

/** Lee la clave de un fichero de unidad; null si no parsea o no rinde clave. */
function keyOfFile(abs) {
  try {
    return firehoseUnitKey(JSON.parse(readFileSync(abs, 'utf8')));
  } catch {
    return null;
  }
}

/**
 * Índice del destino: clave → rel, sobre TODO el volumen (los cuatro corpus).
 * Lo no indexable se cuenta y se reporta; el driver no repara el destino.
 * @param {string} dir
 */
function indexByKey(dir) {
  /** @type {Map<string,string>} */
  const byKey = new Map();
  /** @type {string[]} */
  const unkeyed = [];
  /** @type {string[]} */
  const duplicated = [];
  for (const rel of walkRel(dir)) {
    if (!isUnitSlot(rel)) continue; // sidecar de raíz
    const key = rel.endsWith('.json') ? keyOfFile(toAbs(dir, rel)) : null;
    if (!key) {
      unkeyed.push(rel);
      continue;
    }
    if (byKey.has(key)) duplicated.push(rel);
    else byKey.set(key, rel);
  }
  return { byKey, unkeyed, duplicated };
}

/**
 * detect — SIN fichero-firma: se deriva de lo que hay. El volumen declara la
 * familia, o trae al menos un `.json` bajo un corpus cuyo CONTENIDO es una
 * unidad firehose con clave (lectura acotada a DETECT_SAMPLE_CAP ficheros;
 * `triage-manifest.json` en raíz solo corrobora, nunca es requisito — hoy
 * `linea-kit/src/validate.mjs:217-221` ya lo trata como opcional).
 * @param {{ volumeEntry: object, volumeFiles: string[], volumeDir?: string }} ctx
 */
function detect({ volumeEntry, volumeFiles, volumeDir }) {
  if (volumeEntry?.family === FIREHOSE_FAMILY) return true;
  if (!volumeDir) return false; // sin contenido no hay detección honesta
  const candidates = volumeFiles.filter((rel) => isUnitSlot(rel) && rel.endsWith('.json'));
  if (candidates.length === 0) return false;
  let read = 0;
  for (const rel of candidates) {
    if (read >= DETECT_SAMPLE_CAP) break;
    read += 1;
    if (keyOfFile(toAbs(volumeDir, rel))) return true;
  }
  return false;
}

/**
 * validate — árbol staged de la familia:
 * - todo fichero bajo corpus rinde clave, o `unidad_sin_clave`;
 * - cero claves duplicadas dentro del pack (`clave_duplicada_en_pack`);
 * - `triage-manifest.json` de raíz, cuando existe, contra el schema REAL
 *   `triage-manifest` de linea-kit (gate U80). Cero shapes inventadas.
 * @param {{ stagedDir: string }} ctx
 * @returns {{ ok: boolean, results: object[] }}
 */
function validate({ stagedDir }) {
  /** @type {object[]} */
  const results = [];
  /** @type {Map<string,string>} */
  const seen = new Map();
  let units = 0;

  for (const rel of walkRel(stagedDir)) {
    if (!isUnitSlot(rel)) continue;
    const abs = toAbs(stagedDir, rel);
    const key = rel.endsWith('.json') ? keyOfFile(abs) : null;
    if (!key) {
      results.push({
        ok: false,
        schemaId: 'firehose-unit',
        path: rel,
        errors: [
          {
            message: `unidad_sin_clave: ${rel} no rinde AT-URI (did+collection+rkey ni uri) — la familia FIREHOSE se une por clave, no por ruta`
          }
        ]
      });
      continue;
    }
    if (seen.has(key)) {
      results.push({
        ok: false,
        schemaId: 'firehose-unit',
        path: rel,
        errors: [
          {
            message: `clave_duplicada_en_pack: ${key} aparece en ${seen.get(key)} y en ${rel}`
          }
        ]
      });
      continue;
    }
    seen.set(key, rel);
    units += 1;
  }

  const triage = join(stagedDir, TRIAGE_INDEX_FILE);
  if (existsSync(triage)) {
    results.push(validateFile('triage-manifest', triage));
  }

  if (units === 0) {
    results.push({
      ok: false,
      schemaId: 'firehose-unit',
      errors: [{ message: 'el pack no trae ninguna unidad FIREHOSE con clave' }]
    });
  }

  return { ok: results.every((r) => r.ok), results };
}

/**
 * merge — PLAN de unión aditiva por clave (reglas en la cabecera). No mueve
 * nada: `importPack` ejecuta `moves` con rename-only.
 * @param {{ stagedDir: string, destDir: string, volumeFiles: string[] }} ctx
 * @returns {{ moves: string[], skips: string[], dedup: object[], divergences: object[], snapshot: object }
 *   | { error: { code: string, detail?: object } }}
 */
function merge({ stagedDir, destDir, volumeFiles }) {
  const dest = indexByKey(destDir);

  /** @type {string[]} */
  const moves = [];
  /** @type {string[]} */
  const skips = [];
  /** @type {object[]} */
  const dedup = [];
  /** @type {object[]} */
  const divergences = [];
  /** Claves que quedarán en el volumen tras el merge (destino ∪ nuevas). */
  const finalKeys = new Set(dest.byKey.keys());

  for (const rel of volumeFiles) {
    const stagedAbs = toAbs(stagedDir, rel);
    const destAbs = toAbs(destDir, rel);

    if (!isUnitSlot(rel)) {
      // Sidecar de raíz (índice de triage y compañía): aditivo por ruta,
      // divergencia reportada, JAMÁS pisado.
      if (!existsSync(destAbs)) {
        moves.push(rel);
      } else {
        const destSha = sha256File(destAbs);
        const packSha = sha256File(stagedAbs);
        if (destSha === packSha) skips.push(rel);
        else divergences.push({ path: rel, kind: 'contenido_distinto', destSha256: destSha, packSha256: packSha });
      }
      continue;
    }

    const key = rel.endsWith('.json') ? keyOfFile(stagedAbs) : null;
    if (!key) {
      // Inalcanzable tras VALIDAR; guardián por si el orden cambiara.
      return { error: { code: 'unidad_sin_clave', detail: { file: rel } } };
    }

    const at = dest.byKey.get(key);
    if (at !== undefined) {
      // Unión aditiva: la clave YA vive en el volumen (en este corpus o en
      // otro, si el triage la movió). No se mueve nada, no se pisa nada.
      dedup.push({ path: rel, key, at });
      skips.push(rel);
      continue;
    }

    if (existsSync(destAbs)) {
      // La ruta está ocupada por una unidad de clave DISTINTA (mismo `rkey`,
      // otro `did`, o material no indexable): mover aquí sería sobrescribir.
      return {
        error: {
          code: 'colision_ruta',
          detail: { file: rel, key, destKey: keyOfFile(destAbs) }
        }
      };
    }

    moves.push(rel);
    dest.byKey.set(key, rel);
    finalKeys.add(key);
  }

  // Garantía estructural: cero moves sobre ruta existente (la sobrescritura no
  // es «no deseada»: es imposible por construcción del plan).
  for (const rel of moves) {
    if (existsSync(toAbs(destDir, rel))) {
      return { error: { code: 'sobrescritura_imposible', detail: { file: rel } } };
    }
  }

  const sorted = [...finalKeys].sort();
  const digest = createHash('sha256');
  for (const key of sorted) digest.update(`${key}\n`);

  return {
    moves,
    skips,
    dedup,
    divergences,
    snapshot: {
      unit: 'at-uri',
      units: sorted.length,
      unitsSha256: digest.digest('hex'),
      ...(dest.unkeyed.length > 0 ? { destSinClave: dest.unkeyed.length } : {}),
      ...(dest.duplicated.length > 0 ? { destDuplicadas: dest.duplicated.length } : {})
    }
  };
}

export const FIREHOSE_DRIVER = Object.freeze({
  family: FIREHOSE_FAMILY,
  detect,
  validate,
  merge
});

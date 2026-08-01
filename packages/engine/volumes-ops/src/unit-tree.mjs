/**
 * Hash de contenido de un ÁRBOL DE UNIDAD (WP-U259).
 *
 * ── POR QUÉ ESTE FICHERO EXISTE ───────────────────────────────────────────
 * Este cuerpo nació en `driver-forces.mjs` (U203) y U206 lo exportó «sin
 * cambiar una coma» porque el verificador de integridad tenía que recomputarlo
 * con el MISMO algoritmo. U259 añade un tercer consumidor —la familia LINEAS,
 * que ahora sella snapshot de unidad— y la elección era: una tercera copia, o
 * una pieza. Se toma la pieza.
 *
 * El defecto vive en la juntura, no en la pieza: dos copias de un hash de
 * árbol divergen a la primera decisión sobre enlaces, orden o codificación, y
 * la divergencia se manifiesta como «el root que sellé no arranca», que es
 * justo el modo de fallo más caro (U258 §6.2 lo pagó con los finales de línea).
 *
 * ── EL CUERPO NO CAMBIA, Y ESO IMPORTA ────────────────────────────────────
 * Se mueve VERBATIM desde `driver-forces.mjs:72-78` (con su `walkRel` y su
 * `sha256File`). `driver-forces.mjs` lo RE-EXPORTA, así que todo importador
 * anterior (`verify.mjs`, `index.mjs`, tests) sigue funcionando sin cambiar una
 * línea, y los snapshots FORCES ya sellados en `VOLUMES/volumes.json` siguen
 * validando byte a byte. Hay un test que lo asevera contra los valores
 * literales del manifiesto de referencia: si alguien toca este cuerpo, el root
 * de referencia se pone rojo antes que CI.
 *
 * ── LO QUE NO SE UNIFICA, Y POR QUÉ ───────────────────────────────────────
 * `hashTree` de `import.mjs:111-118` es la MISMA fórmula en otra copia, y
 * sigue ahí. No se unifica en este WP porque **no es la misma función**: aquélla
 * recorre con `lstat` (declara y salta enlaces) y ésta con `Dirent`, así que
 * unificarlas exige decidir y MEDIR el caso de los enlaces, que es una decisión
 * de contrato con su propio precio. Enrutable declarado por U258 (§11.1), no
 * empeorado aquí: este WP no añade una copia, la quita.
 * Node-only.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { createHash } from 'node:crypto';

/** @param {string} abs */
function sha256File(abs) {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

/** @param {string} dir @param {string} rel */
function toAbs(dir, rel) {
  return join(dir, rel.split('/').join(sep));
}

/**
 * Recorrido de ficheros (rels posix ordenados). Un directorio inexistente
 * rinde la lista VACÍA — no lanza: quien pregunta por la ausencia de una
 * unidad es el verificador, y ahí la ausencia es un hallazgo con nombre
 * (`unidad_ausente`), no una excepción.
 * @param {string} rootDir
 * @returns {string[]}
 */
export function walkUnitFiles(rootDir) {
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
 * Hash de contenido de un árbol: sha256 sobre las líneas `rel:shaDelFichero`
 * ordenadas por `rel`.
 *
 * Es un hash de CONJUNTO además de contenido: si sobra un fichero, si falta o
 * si cambia un byte, cambia. Ésa es exactamente la propiedad que el leg
 * `ficheros` (U258) NO tiene —comprueba pertenencia, no igualdad de conjunto—
 * y por la que un snapshot de unidad no es redundante con él: **el snapshot es
 * lo único que caza un ALTA dentro de una unidad sellada.**
 * @param {string} rootDir
 * @returns {string} sha256 hex
 */
export function hashUnitTree(rootDir) {
  const h = createHash('sha256');
  for (const rel of walkUnitFiles(rootDir)) {
    h.update(`${rel}:${sha256File(toAbs(rootDir, rel))}\n`);
  }
  return h.digest('hex');
}

/**
 * Verificador de un snapshot con forma «árbol por unidad»
 * (`{ <dirDeUnidad>: <sha256 del árbol> }`), compartido por las dos familias
 * que lo sellan (FORCES y, desde U259, LINEAS).
 *
 * Vive aquí y no en `verify.mjs` por la razón de siempre en este carril: quien
 * SELLA y quien VERIFICA tienen que ser el mismo cuerpo. En `verify.mjs` era
 * una función privada más una tabla `SNAPSHOT_VERIFIERS` mantenida a mano, y
 * una tabla a mano es la juntura por la que una familia nueva se cuela en
 * silencio como «omitido».
 *
 * @param {string} volumeAbsPath — directorio VIVO del volumen
 * @param {Record<string,string>} sealed
 * @returns {object[]} hallazgos (vacío = íntegro)
 */
export function verifyUnitTreeSnapshot(volumeAbsPath, sealed) {
  /** @type {object[]} */
  const findings = [];
  for (const [unitDir, hash] of Object.entries(sealed)) {
    const abs = toAbs(volumeAbsPath, unitDir);
    if (!existsSync(abs)) {
      findings.push({ error: 'unidad_ausente', unit: unitDir, sealed: hash });
      continue;
    }
    const actual = hashUnitTree(abs);
    if (actual !== hash) {
      findings.push({ error: 'unidad_corrupta', unit: unitDir, sealed: hash, actual });
    }
  }
  return findings;
}

/**
 * ¿El snapshot tiene forma «árbol por unidad»? Un mapa NO VACÍO de
 * `<dir>` → sha256 hex.
 * @param {unknown} snapshot
 */
export function isUnitTreeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return false;
  const entries = Object.entries(snapshot);
  return (
    entries.length > 0 &&
    entries.every(([, v]) => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v))
  );
}

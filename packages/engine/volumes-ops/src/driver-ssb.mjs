/**
 * Family driver · SSB (WP-U205) — **unión ADITIVA por CLAVE + POSICIÓN DE FEED
 * INMUTABLE**: el volumen solo crece, ninguna clave se pisa y ninguna posición
 * `(author, sequence)` ya aterrizada se reescribe jamás (H-01 §④; herencia
 * U204).
 *
 * ── Z-D10 · la UNIDAD y su CLAVE (decisión, con la evidencia que la sostiene)
 *
 * La unidad es el **mensaje SSB** tal y como lo aterriza el exportador:
 * `{ key, value, type, corpus }` (`packages/mesh/ssb-system/src/export.mjs`,
 * objeto escrito en el bucle de escritura). Su clave es `key` — la cadena
 * OPACA del protocolo, tomada VERBATIM, sin normalizar y sin derivar.
 *
 * Por qué `key` y no una terna derivada (a diferencia de FIREHOSE):
 * - es el único identificador que el material trae y el único por el que el
 *   lector del mundo resuelve un mensaje: `loadSsbMessage`
 *   (ssb-system/src/loader.mjs:131-146) calcula `messageFileName(key)` y lo
 *   busca corpus a corpus, devolviendo el PRIMER acierto en orden
 *   `SSB_CORPORA`;
 * - `messageFileName` (ssb-system/src/types.mjs, `Buffer.from(raw,'utf8')
 *   .toString('base64url')`) es INYECTIVA **COMO CADENA** sobre la clave que
 *   reciba, y su alfabeto no contiene `/` ni `.`: no hay travesía de rutas.
 *
 * **PERO NO ES INYECTIVA COMO RUTA** (defecto de la 3.ª contrarrevisión,
 * cerrado). El alfabeto base64url distingue `A` de `a`; NTFS y APFS **no**. Dos
 * claves distintas cuyas codificaciones solo difieran en la caja son DOS
 * cadenas y **UN FICHERO**. Medido:
 *   `%vg9Wb079…` → `JXZnOVdiMDc5…json`
 *   `%vM9Wb079…` → `JXZNOVdiMDc5…json`   (misma ruta en minúsculas)
 * Antes de este cierre, `validate` y `merge` decían `ok` y el plan movía DOS
 * rutas que en este FS son UNA: un mensaje se perdía en silencio y el recuento
 * decía dos — la clase D1 exacta por la que U204 fue devuelto. Y es alcanzable
 * **por el camino normal del producto**, sin malicia y sin material legado: un
 * pack construido en Linux trae los dos ficheros legítimamente y se importa en
 * Windows.
 * Lección de método, no solo de código: **ancla la operación, no su notación.**
 * La inyectividad hacía de notación; la operación es «qué fichero se crea». Por
 * eso TODO lo que decide «esta ruta está libre» compara por `foldRel()`, y nada
 * compara rutas crudas — en VALIDAR (`colision_de_caja_en_pack`), en el plan
 * (`colision_ruta`) y en el índice del destino (`destino_con_colision_de_caja`).
 *
 * **LO QUE NO SE AFIRMA** (y no puede aparecer como hecho en ningún reporte):
 * que `key` sea el sha256 del mensaje firmado. Ninguna línea de este repo lo
 * comprueba, y el único material existente lo desmiente — las diez claves de
 * `ssb-system/fixtures/ssb-log.json` son etiquetas legibles
 * (`%tribeCreate001=.sha256`). La unicidad de la clave es por tanto
 * CONVENCIÓN DE PROTOCOLO IMPORTADA DE FUERA, no propiedad medida aquí: el
 * driver la VERIFICA en la puerta en vez de suponerla — `clave_duplicada_en_
 * pack` (dos ficheros del pack con la misma clave) y `clave_divergente` (la
 * clave ya vive en el destino con otro `value`). Deduplicar en silencio en
 * cualquiera de los dos casos sería el defecto D1 por el que U204 fue devuelto.
 *
 * ── EL SEGUNDO EJE: EL FEED, Y HASTA DÓNDE SE PUEDE PROMETER
 *
 * Un volumen FIREHOSE es una caché plana: basta la clave. Un volumen SSB son
 * **cadenas append-only por autor**: `value.author` + `value.sequence` +
 * `value.previous`. Deduplicar solo por clave dejaría pasar una bifurcación:
 * un pack que trae `@a` seq 3 con contenido DISTINTO cuando el volumen ya
 * tiene la seq 3 de `@a` — clave nueva, cero colisión de clave, y aun así una
 * reescritura de historia.
 *
 * **LO QUE SE PROMETE** (y se enforce):
 * 1. `(author, sequence)` ocupada en el destino por OTRA clave →
 *    `reescritura_de_feed`, aborto en el pase dry. Una posición aterrizada es
 *    inmutable.
 * 2. `(author, sequence)` repetida DENTRO del pack →
 *    `secuencia_duplicada_en_pack` en VALIDAR (pack malformado).
 * 3. Coherencia de cadena DONDE ES VERIFICABLE: `previous === null` ⟺
 *    `sequence === 1`; y si `previous` nombra una clave que el volumen (pack ∪
 *    destino) SÍ contiene, esa clave debe ser del MISMO autor y de secuencia
 *    ESTRICTAMENTE MENOR → si no, `cadena_rota_en_pack` / `cadena_rota`.
 *
 * **LO QUE NO SE PROMETE, Y POR QUÉ** (medido, no supuesto): NO se exige que
 * las secuencias de un feed sean CONTIGUAS, ni que el `previous` de cada
 * mensaje esté presente. El exportador FILTRA por tipo — solo aterriza
 * `tribe*`/`parliament*`/`votes*` (`CORPUS_BY_TYPE` + fallback por prefijo,
 * ssb-system/src/types.mjs) — así que un feed que mezcle gobernanza con
 * charla normal aterriza con AGUJEROS por construcción: si `@a` publica
 * `tribe`(1), `post`(2), `tribe-open-invite`(3), el volumen recibe `{1,3}` y
 * el `previous` del 3 nombra un mensaje que no existe en el volumen. Exigir
 * contigüidad volvería NO IMPORTABLE todo export real. Es el mismo criterio
 * por el que tampoco se exige que el corpus del fichero case con
 * `CORPUS_BY_TYPE[type]`: la tabla es explícitamente forward-compatible, así
 * que un mensaje aterrizado bajo un mapeo ANTERIOR vive legítimamente en otro
 * corpus — y ésa es justamente la razón de que el índice sea de VOLUMEN y no
 * de corpus, igual que el lector resuelve cross-corpus (loader.mjs:133-139).
 * Los agujeros no se callan: se CUENTAN en `snapshot.feedsConHueco`.
 *
 * **CONSECUENCIA DECLARADA, con nombre y apellidos**: `ssb-system/fixtures/
 * ssb-log.json` —el único material SSB del repo— NO satisface la regla 3, y
 * por tanto un pack construido con su export NO es importable. Medido, no
 * deducido: su `sequence` es un contador GLOBAL (alice {1,2,3,5,8,10}, bob
 * {4,7,9}, carol {6}) y su `previous` cruza de feed (bob/4 apunta a un mensaje
 * de alice; alice/5 a uno de bob). Es una fixture sintética de WP-U84, no un
 * volcado de pub. Fallar cerrado ante ella es lo correcto —ese material no es
 * un conjunto de feeds SSB válido— y por eso U205 añade una fixture NUEVA
 * por-feed (`ssb-system/fixtures/ssb-feed-log.json`) en vez de reescribir la
 * vieja, que dos suites vivas anclan con conteos exactos.
 * **INCÓGNITA que queda abierta**: no hay ningún volcado real del pub OASIS en
 * el repo (`ZEUS_SSB_LOG_PATH` es un placeholder en `VOLUMES/volumes.json`),
 * así que no está medido si el productor real emite `sequence` por feed (como
 * exige el protocolo) o un contador global (como la fixture). Si aparece
 * material real con contador global, la regla 3 debe redefinirse contra él.
 *
 * ── EL LAYOUT ES PARTE DEL CONTRATO (y aquí sí, a diferencia de FIREHOSE)
 * En FIREHOSE la ruta era libre («la clave no es la ruta»). En SSB la ruta es
 * OBSERVABLE por el lector: `loadSsbMessage` busca literalmente
 * `<corpus>/<base64url(key)>.json`. Un mensaje bien formado con otro nombre de
 * fichero es material INALCANZABLE — existe en disco y no existe para el
 * mundo. Por eso VALIDAR exige profundidad exacta 2 (`<corpus>/<fichero>`, con
 * `<corpus>` ∈ `SSB_CORPUS_DIRS`) y `basename === messageFileName(key)`.
 *
 * ── DÓNDE VIVE LA REGLA (decisión, tras la 1.ª devolución)
 *
 * Este volumen tiene DOS escritores: el import (este driver) y el sync vivo
 * (`ssb-system/src/export.mjs`). No pueden compartir código —ninguno de los dos
 * paquetes puede declarar al otro con los 48 manifests congelados— así que la
 * regla se REPLICA, con nota de sitio, y se parte en dos niveles con
 * consecuencias distintas **a propósito**:
 *
 * **Nivel 1 · ADMISIÓN DE LA UNIDAD** — clave usable, coordenada de feed
 * (`author`+`sequence`), ruta canónica `<corpus>/messageFileName(key)`,
 * unicidad de clave con `value` coherente, unicidad de POSICIÓN
 * `(author, sequence)`. Un mensaje que no la pasa **no entra en el volumen por
 * ningún camino**: el import ABORTA, y el export lo DESCARTA con motivo o
 * aborta si es conflicto. Los dos escritores aplican las cinco.
 *
 * **Nivel 2 · COHERENCIA DEL CONJUNTO** — la cadena `previous ⟺ sequence`. Es
 * propiedad del CONJUNTO, no de la unidad. El import **aborta** (un pack es
 * material curado que alguien preparó). El export la **mide y la declara**
 * (`feedIncoherencias`) pero NO tira dato: un volcado de pub llega con lo que
 * llega, y descartar mensajes de gobernanza por una cadena que el productor
 * numeró mal sería peor que aterrizarlos. Asimetría DECLARADA, con ejemplo
 * medido: `ssb-system/fixtures/ssb-log.json` es exportable y su pack NO es
 * importable (ver abajo).
 *
 * ── Reglas de reconciliación
 * - clave NUEVA cuya posición de feed está libre → aterriza (unión aditiva);
 * - clave YA PRESENTE en cualquier parte del volumen **con el mismo `value`**
 *   → **dedup**: no se mueve nada, no se pisa nada, se reporta dónde vive ya.
 *   Es un no-op observable, no divergencia ni colisión;
 * - clave YA PRESENTE **con `value` DISTINTO** → `clave_divergente`: aborta;
 * - **misma RUTA reclamada por clave DISTINTA → `colision_ruta`: aborta.** La
 *   comparación es por ruta PLEGADA (`foldRel`), no cruda: la ruta la deriva la
 *   clave, pero derivarla no la hace única EN EL SISTEMA DE FICHEROS (ver arriba).
 *   En la 2.ª vuelta esta guarda se eliminó por creerla imposible por
 *   construcción; la afirmación era cierta sobre cadenas y falsa sobre ficheros,
 *   y con ella se fue una protección real. Repuesta y ampliada;
 * - `manifest.json` de la raíz del volumen: sidecar propio (schema REAL
 *   `ssb-manifest`, linea-kit/schemas/ssb-manifest.json). Falta → aterriza;
 *   idéntico → no-op; distinto → **divergencia reportada, jamás pisada**: la
 *   marca `syncedAt` del destino es decisión local viva, no dato del pack.
 *
 * ── EL ÍNDICE DEL DESTINO NO ADMITE AGUJEROS (doctrina D-B/D-F de U204,
 * heredada entera y no re-litigada)
 * - enlace en el destino → `enlace_en_destino` (`readdirSync` no lo sigue: lo
 *   que vive detrás sería invisible al índice y se replantaría DUPLICADO);
 * - fichero del destino que no rinde clave/coordenada y no es sidecar
 *   declarado → `destino_sin_clave` / `destino_sin_coordenada_de_feed`, aborto
 *   en el pase dry, simétrico con VALIDAR. Precio declarado, idéntico al de
 *   U204: un volumen que YA contenga material así queda NO IMPORTABLE hasta
 *   que el operador lo retire, con la ruta citada;
 * - material del destino que SÍ rinde clave pero NO vive en su ruta canónica
 *   —raíz, `<corpus>/<sub>/`, o nombre que no deriva de la clave— →
 *   `destino_fuera_de_layout`, aborto citando la ruta y la ESPERADA (D-G). No
 *   se indexa y no se cuenta: el lector no puede resolverlo, así que
 *   deduplicar contra él sería un `dedup` que miente —«la clave ya vive ahí»
 *   cuando para el mundo no vive en ninguna parte—, que es el defecto D1 de
 *   U204 trasladado a la juntura destino↔pack;
 * - dos claves distintas en la MISMA posición de feed del destino →
 *   `destino_con_feed_bifurcado` (D-G). Antes el índice hacía `feed.set(seq,
 *   key)` y la segunda PISABA a la primera: la garantía central de la familia
 *   se medía contra un índice que ya mentía.
 *
 * Garantía estructural antes de devolver el plan (D3 de U204): ningún `move`
 * apunta a una ruta existente (`sobrescritura_imposible`) ni tiene un ancestro
 * que exista como FICHERO (`ruta_bloqueada_por_fichero`) — `importPack` ejecuta
 * con `renameSync` desnudo (import.mjs:459-461), que SÍ pisaría.
 *
 * **ALCANCE HONESTO de esos dos guardianes tras D-G** (se dice porque presentar
 * como garantía activa lo que no se alcanza es la clase de defecto que este
 * carril persigue):
 * - `sobrescritura_imposible` es **alcanzable, y estrecho**: un FICHERO en la
 *   ruta de destino ya salió antes por `dedup`, `clave_divergente` o
 *   `destino_fuera_de_layout`; lo que sí llega hasta aquí es un **DIRECTORIO**
 *   ocupando la ruta de una unidad (resto de una operación manual). Tiene probe.
 * - `ruta_bloqueada_por_fichero` es hoy **INALCANZABLE por orden**: el único
 *   ancestro posible de `<corpus>/<fichero>` es la entrada de raíz `<corpus>`, y
 *   un fichero de raíz ya aborta antes por `destino_sin_clave` (si no rinde
 *   clave) o por `destino_fuera_de_layout` (si la rinde). La protección no se
 *   ha perdido: se ha ADELANTADO y es más precisa. Se conserva como última
 *   línea por si el orden de comprobaciones cambiara — igual que
 *   `unidad_sin_clave` dentro de `merge`, que también depende de que VALIDAR
 *   corra antes.
 *
 * ── LO QUE ESTE DRIVER NO PUEDE PROMETER: LA AUTORÍA
 * No hay verificación de firma en ninguna parte de este carril. `value.author`
 * se toma como dicho. Consecuencia, con todas las letras: **cualquiera puede
 * ocupar el feed de cualquiera, de forma permanente**. Un pack hostil que
 * fabrique mensajes en `(@victima, 1..n)` aterriza (`ok:true`), y cuando llegue
 * el material REAL de ese feed abortará con `reescritura_de_feed` **para
 * siempre**, porque la posición es justamente lo único inviolable. La regla
 * fuerte y la ausencia de autenticación se combinan mal: está medido en la
 * suite (probe `m4`) y anotado como riesgo del eslabón siguiente.
 *
 * ── Cursor sellado
 * `snapshot = { unit:'ssb-key', units, unitsSha256, feeds, feedsSha256 }` —
 * O(1) en tamaño. `feedsSha256` resume `<author>:<maxSeq>` ordenado: es el
 * cursor de «hasta dónde está replicado cada feed», justo lo que una réplica
 * A→B necesita comparar. El driver NO sella ni mueve nada: devuelve un PLAN
 * (herencia U202/U203/U204).
 *
 * ── Nota de sitio (razonada, como en U202 y U204)
 * `SSB_CORPUS_DIRS`, `SSB_MANIFEST_FILE` y `messageFileName` REPLICAN aquí lo
 * canónico de `@zeus/ssb-system/src/types.mjs` (`SSB_CORPORA`, `MANIFEST_NAME`,
 * `messageFileName`) porque los 48 manifests `packages/<grupo>/<pieza>/
 * package.json` están CONGELADOS en esta ola (GOBIERNO-EJECUCION-F2 §2, owner
 * U237) y volumes-ops no declara `@zeus/ssb-system`: importarla sería una dep
 * fantasma, y además invertiría la dirección engine←mesh. Cuando la dep exista,
 * estas tres piezas se re-apuntan a lo canónico. Mismo desvío declarado que
 * U204 con firehose-core y que U200 con linea-kit.
 * Node-only.
 */

import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { validateFile } from '@zeus/linea-kit/validate';

export const SSB_FAMILY = 'ssb';

/** Sidecar propio del volumen (schema REAL `ssb-manifest`, gate U80). */
export const SSB_MANIFEST_FILE = 'manifest.json';

/** ALLOWLIST de la raíz del volumen: solo el sidecar. Los mensajes van bajo corpus. */
export const SSB_ROOT_FILES = Object.freeze([SSB_MANIFEST_FILE]);

/** Réplica declarada de `SSB_CORPORA` (ssb-system/src/types.mjs). */
export const SSB_CORPUS_DIRS = Object.freeze(['tribes', 'parliament', 'votes']);

/** Tope de lecturas de contenido en `detect` (firma derivada, no fichero-firma). */
const DETECT_SAMPLE_CAP = 64;

/**
 * Réplica declarada de `messageFileName` (ssb-system/src/types.mjs).
 * base64url sobre bytes utf8: inyectiva, y su alfabeto no contiene `/` ni `.`.
 * @param {string} key
 */
export function messageFileName(key) {
  return `${Buffer.from(String(key ?? ''), 'utf8').toString('base64url')}.json`;
}

/** @param {string} dir @param {string} rel */
function toAbs(dir, rel) {
  return join(dir, rel.split('/').join(sep));
}

/** @param {string} text */
function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** @param {string} abs */
function sha256File(abs) {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

/**
 * Serialización estable (claves ordenadas, recursiva) para comparar el `value`
 * de dos mensajes con la MISMA clave. No se comparan los bytes del fichero:
 * `corpus` y `type` son ANOTACIONES derivadas del exportador y cambian
 * legítimamente entre corpus; el mensaje es `{key, value}`. Comparar bytes
 * haría imposible el dedup cross-corpus, que es justo lo que el lector del
 * mundo necesita (loader.mjs:133-139).
 * @param {unknown} value
 * @returns {string}
 */
export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/**
 * Clave de la unidad: la cadena OPACA `key`, verbatim. `null` cuando el
 * material no es un mensaje SSB aterrizado.
 *
 * Sin normalizar y sin charset: la inyectividad es la identidad sobre la
 * cadena, y `messageFileName` la codifica sin `/` ni `.`. Añadir reglas de
 * caracteres aquí sería inventar un contrato que ninguna línea del repo
 * sostiene (ver cabecera, «LO QUE NO SE AFIRMA»).
 * @param {any} raw
 * @returns {string|null}
 */
export function ssbMessageKey(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const key = raw.key;
  if (typeof key !== 'string' || key.length === 0) return null;
  const value = raw.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return key;
}

/**
 * Coordenada de feed: `{ author, sequence, previous }`, o `null`.
 * `previous` ausente se lee como `null` (convención JSON: ausencia); un
 * `previous` presente que no sea cadena no vacía ni `null` es material
 * incoherente y no rinde coordenada.
 * @param {any} raw
 * @returns {{ author: string, sequence: number, previous: string|null }|null}
 */
export function ssbFeedCoords(raw) {
  const value = raw?.value;
  if (!value || typeof value !== 'object') return null;
  const author = value.author;
  if (typeof author !== 'string' || author.length === 0) return null;
  const sequence = value.sequence;
  if (!Number.isInteger(sequence) || sequence < 1) return null;
  const previous = value.previous;
  if (previous === undefined || previous === null) return { author, sequence, previous: null };
  if (typeof previous !== 'string' || previous.length === 0) return null;
  return { author, sequence, previous };
}

/**
 * Ruta PLEGADA para comparar como el sistema de ficheros, no como cadena.
 *
 * NTFS y APFS son INSENSIBLES A LA CAJA; el alfabeto base64url NO lo es
 * (distingue `A` de `a`). Dos rutas que solo difieran en la caja son DOS
 * cadenas y UN fichero. Todo lo que decida «esta ruta está libre» compara por
 * aquí; nada compara rutas crudas.
 *
 * ALCANCE MEDIDO del plegado: cubre la CAJA. NO cubre la normalización Unicode
 * (macOS almacena NFD), y no hace falta: el nombre canónico de una unidad es
 * `base64url(key) + '.json'`, cuyo alfabeto es `[A-Za-z0-9_-]` más el punto —
 * ASCII puro, donde NFC y NFD coinciden. Es propiedad del alfabeto, no
 * suposición. Los nombres de corpus (`tribes`/`parliament`/`votes`) son también
 * ASCII. Cualquier otro nombre ya lo rechaza `nombre_no_deriva_de_clave` /
 * `destino_fuera_de_layout` antes de llegar a compararse.
 * @param {string} rel
 */
export function foldRel(rel) {
  return rel.toLowerCase();
}

/**
 * Ranura de unidad: EXACTAMENTE `<corpus>/<fichero>` con corpus declarado.
 * @param {string} rel
 */
export function isUnitSlot(rel) {
  const parts = rel.split('/');
  return parts.length === 2 && SSB_CORPUS_DIRS.includes(parts[0]);
}

/**
 * Lee `{ key, raw, coords, valueSha }` de un fichero; null si no parsea o no
 * rinde clave. NO filtra por extensión: el CONTENIDO manda, no el nombre
 * (doctrina D-F de U204).
 * @param {string} abs
 */
function unitOfFile(abs) {
  /** @type {any} */
  let raw;
  try {
    raw = JSON.parse(readFileSync(abs, 'utf8'));
  } catch {
    return null;
  }
  const key = ssbMessageKey(raw);
  if (!key) return null;
  return { key, raw, coords: ssbFeedCoords(raw), valueSha: sha256(stableStringify(raw.value)) };
}

/**
 * Walk de un árbol: `{ files, others }` en rels posix ordenados. `others` =
 * entradas que no son fichero ni directorio (enlaces/junctions), DECLARADAS y
 * nunca descartadas en silencio — doctrina D-B de U204.
 * @param {string} rootDir
 * @returns {{ files: string[], others: string[] }}
 */
function walkRel(rootDir) {
  /** @type {string[]} */
  const files = [];
  /** @type {string[]} */
  const others = [];
  function walk(dir, rel) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(dir, entry.name), childRel);
      else if (entry.isFile()) files.push(childRel);
      else others.push(childRel);
    }
  }
  if (existsSync(rootDir)) walk(rootDir, '');
  return { files: files.sort(), others: others.sort() };
}

/**
 * ¿Algún ancestro del destino de `rel` existe como FICHERO? (D3 de U204)
 * @param {string} destDir @param {string} rel
 * @returns {string|null}
 */
function blockingAncestor(destDir, rel) {
  const parts = rel.split('/');
  let acc = '';
  for (let i = 0; i < parts.length - 1; i += 1) {
    acc = acc ? `${acc}/${parts[i]}` : parts[i];
    const abs = toAbs(destDir, acc);
    if (existsSync(abs) && lstatSync(abs).isFile()) return acc;
  }
  return null;
}

/**
 * Índice del destino sobre TODO el árbol RECORRIBLE del volumen (incluida la
 * raíz y cualquier profundidad). Clasificación por CONTENIDO, no por ruta.
 * @param {string} dir
 */
function indexVolume(dir) {
  /** @type {Map<string,{rel:string, valueSha:string, author:string, sequence:number}>} */
  const byKey = new Map();
  /** @type {Map<string,Map<number,string>>} author → (sequence → key) */
  const feeds = new Map();
  /** @type {string[]} */
  const unkeyable = [];
  /** @type {string[]} */
  const withoutCoords = [];
  /** @type {string[]} */
  const duplicated = [];
  /** @type {{file:string, key:string, esperado:string|null}[]} */
  const outOfLayout = [];
  /** @type {{author:string, sequence:number, keys:string[], files:string[]}[]} */
  const forks = [];
  /** @type {Map<string,{rel:string, key:string}>} ruta PLEGADA → ocupante */
  const byFolded = new Map();
  /** @type {{files:string[], keys:string[]}[]} */
  const caseCollisions = [];
  const { files, others } = walkRel(dir);

  for (const rel of files) {
    const unit = unitOfFile(toAbs(dir, rel));
    if (!unit) {
      // Sidecar de raíz DECLARADO: no es unidad y no es defecto.
      if (!SSB_ROOT_FILES.includes(rel)) unkeyable.push(rel);
      continue;
    }
    if (!unit.coords) {
      withoutCoords.push(rel);
      continue;
    }
    // D-G · MISMA prueba de admisión que VALIDAR aplica al PACK. Antes esto
    // solo miraba `isUnitSlot` (profundidad + corpus) y el fichero MAL NOMBRADO
    // se indexaba como unidad de primera clase: el pack traía el mismo mensaje
    // con el nombre bueno, deduplicaba contra él y el nombre bueno NUNCA
    // aterrizaba — un `dedup` que decía «la clave ya vive ahí» cuando para el
    // lector no vivía en ninguna parte. Idéntico defecto para el material de
    // raíz o de profundidad 3, que antes se CONTABA en `destFueraDeLayout`: ese
    // campo era la coartada, igual que el `destSinClave` que U204 mató en D-F.
    if (!isUnitSlot(rel) || rel.split('/')[1] !== messageFileName(unit.key)) {
      outOfLayout.push({
        file: rel,
        key: unit.key,
        esperado: isUnitSlot(rel) ? `${rel.split('/')[0]}/${messageFileName(unit.key)}` : null
      });
      continue; // NO se indexa: `merge` aborta con la ruta y la ruta esperada
    }
    if (byKey.has(unit.key)) {
      duplicated.push(rel);
      continue;
    }
    // Un volumen construido en Linux puede traer DOS ficheros cuyas rutas solo
    // difieren en la caja: en Windows/macOS serían UNO. Ese volumen no es
    // replicable y no se puede planificar sobre él.
    const folded = foldRel(rel);
    const ocupanteRuta = byFolded.get(folded);
    if (ocupanteRuta) {
      caseCollisions.push({ files: [ocupanteRuta.rel, rel], keys: [ocupanteRuta.key, unit.key] });
      continue;
    }
    byFolded.set(folded, { rel, key: unit.key });
    byKey.set(unit.key, {
      rel,
      valueSha: unit.valueSha,
      author: unit.coords.author,
      sequence: unit.coords.sequence
    });
    const feed = feeds.get(unit.coords.author) ?? new Map();
    const ocupante = feed.get(unit.coords.sequence);
    if (ocupante !== undefined && ocupante !== unit.key) {
      // BIFURCACIÓN YA ATERRIZADA. Antes esto era `feed.set(...)` a secas y la
      // segunda clave PISABA a la primera en el Map: último en escribir gana,
      // en silencio. Con el índice así, `reescritura_de_feed` comparaba contra
      // un ganador arbitrario — la garantía central de esta familia medida
      // contra un índice que ya mentía.
      forks.push({
        author: unit.coords.author,
        sequence: unit.coords.sequence,
        keys: [ocupante, unit.key],
        files: [byKey.get(ocupante)?.rel ?? '(desconocido)', rel]
      });
      continue;
    }
    feed.set(unit.coords.sequence, unit.key);
    feeds.set(unit.coords.author, feed);
  }
  return {
    byKey,
    feeds,
    byFolded,
    caseCollisions,
    unkeyable,
    withoutCoords,
    duplicated,
    outOfLayout,
    forks,
    links: others
  };
}

/**
 * detect — SIN fichero-firma. El volumen declara la familia, o trae al menos
 * un `.json` en una ranura de unidad DECLARADA cuyo CONTENIDO es un mensaje
 * SSB con clave Y coordenada de feed (lectura acotada a DETECT_SAMPLE_CAP).
 * `manifest.json` en la raíz NO sirve de firma: ese nombre lo usan varias
 * familias.
 * @param {{ volumeEntry: object, volumeFiles: string[], volumeDir?: string }} ctx
 */
function detect({ volumeEntry, volumeFiles, volumeDir }) {
  if (volumeEntry?.family === SSB_FAMILY) return true;
  if (!volumeDir) return false; // sin contenido no hay detección honesta
  const candidates = volumeFiles.filter((rel) => isUnitSlot(rel) && rel.endsWith('.json'));
  let read = 0;
  for (const rel of candidates) {
    if (read >= DETECT_SAMPLE_CAP) break;
    read += 1;
    const unit = unitOfFile(toAbs(volumeDir, rel));
    if (unit && unit.coords) return true;
  }
  return false;
}

/**
 * validate — árbol staged de la familia. Ver cabecera para el porqué de cada
 * regla. Todo lo que falla cita la RUTA.
 * @param {{ stagedDir: string }} ctx
 * @returns {{ ok: boolean, results: object[] }}
 */
function validate({ stagedDir }) {
  /** @type {object[]} */
  const results = [];
  const bad = (schemaId, path, message) =>
    results.push({ ok: false, schemaId, path, errors: [{ message }] });

  /** @type {Map<string,string>} clave → rel */
  const seenKeys = new Map();
  /** @type {Map<string,string>} `author#seq` → rel */
  const seenSeq = new Map();
  /** @type {Map<string,{rel:string, key:string}>} ruta PLEGADA → ocupante */
  const seenFolded = new Map();
  /** @type {Map<string,{author:string, sequence:number, previous:string|null, rel:string}>} */
  const byKeyCoords = new Map();
  let units = 0;

  const staged = walkRel(stagedDir);
  // El staging es una COPIA materializada (importPack rechaza enlaces en el
  // pack, contrato §0.4), así que `others` debería ser vacío; si no lo es, se
  // dice — nunca se descarta en silencio (D-B).
  for (const rel of staged.others) {
    bad('ssb-layout', rel, `enlace_en_staging: ${rel} no es fichero ni directorio`);
  }

  for (const rel of staged.files) {
    const abs = toAbs(stagedDir, rel);
    const parts = rel.split('/');
    const unit = unitOfFile(abs);

    if (parts.length === 1) {
      // Raíz del volumen: allowlist declarada (doctrina D2 de U204).
      if (!SSB_ROOT_FILES.includes(rel)) {
        bad(
          'ssb-layout',
          rel,
          unit
            ? `fichero_de_raiz_no_declarado: ${rel} es un mensaje SSB (${unit.key}) y los mensajes viven bajo un corpus, no en la raíz del volumen`
            : `fichero_de_raiz_no_declarado: ${rel} — la raíz del volumen solo admite ${SSB_ROOT_FILES.join(', ')}`
        );
        continue;
      }
      // Sidecar propio: schema REAL de linea-kit (gate U80). Cero shapes inventadas.
      results.push(validateFile('ssb-manifest', abs));
      continue;
    }

    if (!isUnitSlot(rel)) {
      bad(
        'ssb-layout',
        rel,
        `ruta_no_declarada: ${rel} — la familia SSB aterriza en <corpus>/<fichero> con corpus ∈ ${SSB_CORPUS_DIRS.join(', ')}`
      );
      continue;
    }

    if (!unit) {
      bad(
        'ssb-message',
        rel,
        `unidad_sin_clave: ${rel} no rinde mensaje SSB ({key:string no vacía, value:objeto}) — la familia SSB se une por clave`
      );
      continue;
    }
    const expected = messageFileName(unit.key);
    if (parts[1] !== expected) {
      bad(
        'ssb-layout',
        rel,
        `nombre_no_deriva_de_clave: ${rel} debería llamarse ${parts[0]}/${expected} — el lector busca <corpus>/base64url(key).json (loader.mjs:131-140); con otro nombre el mensaje es INALCANZABLE`
      );
      continue;
    }
    if (!unit.coords) {
      bad(
        'ssb-message',
        rel,
        `unidad_sin_coordenada_de_feed: ${rel} no declara value.author + value.sequence usables — sin coordenada no hay posición de feed que proteger`
      );
      continue;
    }
    if (unit.raw.corpus !== undefined && unit.raw.corpus !== parts[0]) {
      bad(
        'ssb-message',
        rel,
        `corpus_incoherente: ${rel} declara corpus "${unit.raw.corpus}" y vive bajo "${parts[0]}"`
      );
      continue;
    }
    const already = seenKeys.get(unit.key);
    if (already !== undefined) {
      bad(
        'ssb-message',
        rel,
        `clave_duplicada_en_pack: ${unit.key} aparece en ${already} y en ${rel}`
      );
      continue;
    }
    const seqId = `${unit.coords.author}#${unit.coords.sequence}`;
    const seqAt = seenSeq.get(seqId);
    if (seqAt !== undefined) {
      bad(
        'ssb-message',
        rel,
        `secuencia_duplicada_en_pack: ${seqId} aparece en ${seqAt} y en ${rel}`
      );
      continue;
    }
    // La clave es inyectiva como CADENA, no como RUTA en un FS insensible a la
    // caja. Dos claves distintas cuyas rutas solo difieran en la caja son UN
    // fichero en Windows/macOS: aterrizarlas perdería un mensaje en silencio y
    // el conteo diría dos. Un pack construido en Linux las trae legítimamente.
    const foldedAt = seenFolded.get(foldRel(rel));
    if (foldedAt !== undefined) {
      bad(
        'ssb-layout',
        rel,
        `colision_de_caja_en_pack: ${rel} y ${foldedAt.rel} son rutas distintas como cadena pero EL MISMO fichero en un sistema insensible a la caja (claves ${foldedAt.key} y ${unit.key}) — aterrizarlas perdería un mensaje en silencio`
      );
      continue;
    }
    seenFolded.set(foldRel(rel), { rel, key: unit.key });
    seenKeys.set(unit.key, rel);
    seenSeq.set(seqId, rel);
    byKeyCoords.set(unit.key, { ...unit.coords, rel });
    units += 1;
  }

  // Coherencia de cadena, solo donde es VERIFICABLE (ver cabecera).
  for (const [, coords] of byKeyCoords) {
    if (coords.previous === null && coords.sequence !== 1) {
      bad(
        'ssb-feed',
        coords.rel,
        `cadena_rota_en_pack: ${coords.author} seq ${coords.sequence} declara previous=null — solo el primer mensaje de un feed carece de anterior`
      );
      continue;
    }
    if (coords.previous !== null && coords.sequence === 1) {
      bad(
        'ssb-feed',
        coords.rel,
        `cadena_rota_en_pack: ${coords.author} seq 1 declara previous=${JSON.stringify(coords.previous)} — el primer mensaje de un feed no tiene anterior`
      );
      continue;
    }
    if (coords.previous === null) continue;
    const target = byKeyCoords.get(coords.previous);
    if (!target) continue; // el anterior no viaja en el pack: no verificable aquí
    if (target.author !== coords.author) {
      bad(
        'ssb-feed',
        coords.rel,
        `cadena_rota_en_pack: ${coords.author} seq ${coords.sequence} encadena con ${coords.previous}, que pertenece al feed ${target.author}`
      );
      continue;
    }
    if (target.sequence >= coords.sequence) {
      bad(
        'ssb-feed',
        coords.rel,
        `cadena_rota_en_pack: ${coords.author} seq ${coords.sequence} encadena con ${coords.previous}, de seq ${target.sequence} (no es anterior)`
      );
    }
  }

  if (units === 0) {
    results.push({
      ok: false,
      schemaId: 'ssb-message',
      errors: [{ message: 'el pack no trae ningún mensaje SSB con clave' }]
    });
  }

  return { ok: results.every((r) => r.ok), results };
}

/**
 * merge — PLAN de unión aditiva por clave con posición de feed inmutable.
 * No mueve nada: `importPack` ejecuta `moves` con rename-only.
 * @param {{ stagedDir: string, destDir: string, volumeFiles: string[] }} ctx
 * @returns {{ moves: string[], skips: string[], dedup: object[], divergences: object[], snapshot: object }
 *   | { error: { code: string, detail?: object } }}
 */
function merge({ stagedDir, destDir, volumeFiles }) {
  const dest = indexVolume(destDir);

  // El índice del destino no admite agujeros (doctrina D-B/D-F de U204): sin
  // índice completo no se puede planificar «jamás duplicar».
  if (dest.links.length > 0) {
    return { error: { code: 'enlace_en_destino', detail: { links: dest.links } } };
  }
  if (dest.unkeyable.length > 0) {
    return { error: { code: 'destino_sin_clave', detail: { files: dest.unkeyable } } };
  }
  if (dest.withoutCoords.length > 0) {
    return {
      error: { code: 'destino_sin_coordenada_de_feed', detail: { files: dest.withoutCoords } }
    };
  }
  // D-G · material del destino que rinde clave pero NO vive en su ruta canónica
  // `<corpus>/messageFileName(key)`: el lector no lo encuentra
  // (loader.mjs:131-146), así que deduplicar contra él sería mentir. Aborta
  // citando la ruta y la ruta ESPERADA — que es lo que el operador necesita
  // para repararlo.
  if (dest.outOfLayout.length > 0) {
    return { error: { code: 'destino_fuera_de_layout', detail: { files: dest.outOfLayout } } };
  }
  // D-G · el volumen ya trae dos claves distintas en la MISMA posición de feed.
  // No se puede planificar «la posición es inmutable» contra un índice que ya
  // tiene una bifurcación: `reescritura_de_feed` compararía contra un ganador
  // arbitrario.
  if (dest.forks.length > 0) {
    return { error: { code: 'destino_con_feed_bifurcado', detail: { forks: dest.forks } } };
  }
  // El destino ya trae dos ficheros que en un FS insensible a la caja serían
  // uno (volumen construido en Linux): no es replicable y no se puede
  // planificar sobre él sin decidir en silencio cuál de los dos existe.
  if (dest.caseCollisions.length > 0) {
    return {
      error: { code: 'destino_con_colision_de_caja', detail: { colisiones: dest.caseCollisions } }
    };
  }

  /** @type {string[]} */
  const moves = [];
  /** @type {string[]} */
  const skips = [];
  /** @type {object[]} */
  const dedup = [];
  /** @type {object[]} */
  const divergences = [];
  /** @type {{author:string, sequence:number, previous:string|null, key:string, rel:string}[]} */
  const incoming = [];
  const finalKeys = new Set(dest.byKey.keys());
  // Rutas PLEGADAS ya reclamadas: las del destino más las que va reclamando el
  // propio plan. Es lo que hace que «esta ruta está libre» signifique lo mismo
  // que significará en el sistema de ficheros.
  /** @type {Map<string,{rel:string, key:string}>} */
  const foldedTaken = new Map(dest.byFolded);

  for (const rel of volumeFiles) {
    const stagedAbs = toAbs(stagedDir, rel);
    const destAbs = toAbs(destDir, rel);
    const unit = unitOfFile(stagedAbs);

    if (!unit) {
      if (isUnitSlot(rel)) {
        // Inalcanzable mientras VALIDAR corra antes que FUSIONAR; guardián por
        // si el orden cambiara. A diferencia de `mensaje_en_raiz`, que SÍ se
        // alcanza.
        return { error: { code: 'unidad_sin_clave', detail: { file: rel } } };
      }
      // Sidecar de raíz: aditivo por ruta, divergencia reportada, JAMÁS pisado.
      if (!existsSync(destAbs)) {
        moves.push(rel);
      } else {
        const destSha = sha256File(destAbs);
        const packSha = sha256File(stagedAbs);
        if (destSha === packSha) skips.push(rel);
        else
          divergences.push({
            path: rel,
            kind: 'contenido_distinto',
            destSha256: destSha,
            packSha256: packSha
          });
      }
      continue;
    }

    if (!isUnitSlot(rel)) {
      // ALCANZABLE: la allowlist de VALIDAR es por NOMBRE y el schema
      // `ssb-manifest` tiene `additionalProperties:true` (schemas/
      // ssb-manifest.json:8), así que un `manifest.json` que ADEMÁS traiga
      // {key, value} pasa VALIDAR y llega aquí. Falla cerrado: aborta en el
      // pase dry, root intacto.
      return { error: { code: 'mensaje_en_raiz', detail: { file: rel, key: unit.key } } };
    }

    const at = dest.byKey.get(unit.key);
    if (at !== undefined) {
      if (at.valueSha !== unit.valueSha) {
        // Dos mensajes DISTINTOS bajo la misma clave: deduplicar aquí sería
        // descartar uno en silencio con un `dedup` que miente (defecto D1 de
        // U204, en la juntura pack↔destino). La unicidad de la clave es
        // convención ajena: se verifica, no se supone.
        return {
          error: {
            code: 'clave_divergente',
            detail: {
              key: unit.key,
              file: rel,
              at: at.rel,
              destValueSha256: at.valueSha,
              packValueSha256: unit.valueSha
            }
          }
        };
      }
      dedup.push({ path: rel, key: unit.key, at: at.rel });
      skips.push(rel);
      continue;
    }

    // `colision_ruta`, por RUTA PLEGADA (3.ª vuelta). La clave es inyectiva
    // como CADENA, no como RUTA: dos claves cuyas codificaciones base64url solo
    // difieran en la caja reclaman EL MISMO fichero en NTFS/APFS. La comparación
    // cruda decía «ruta libre» y el plan movía dos rutas que son un fichero —
    // un mensaje perdido en silencio con un conteo que dice dos.
    const folded = foldRel(rel);
    const ocupante = foldedTaken.get(folded);
    if (ocupante !== undefined) {
      return {
        error: {
          code: 'colision_ruta',
          detail: { file: rel, key: unit.key, at: ocupante.rel, destKey: ocupante.key }
        }
      };
    }
    foldedTaken.set(folded, { rel, key: unit.key });

    incoming.push({ ...unit.coords, key: unit.key, rel });
    moves.push(rel);
    finalKeys.add(unit.key);
  }

  // ── Posición de feed INMUTABLE + cadena donde es verificable ──────────────
  for (const msg of incoming) {
    const destFeed = dest.feeds.get(msg.author);
    const occupied = destFeed?.get(msg.sequence);
    if (occupied !== undefined) {
      // Clave NUEVA reclamando una posición ya aterrizada: bifurcación del
      // feed. Aterrizarla dejaría dos mensajes distintos en la misma posición.
      return {
        error: {
          code: 'reescritura_de_feed',
          detail: {
            author: msg.author,
            sequence: msg.sequence,
            file: msg.rel,
            key: msg.key,
            destKey: occupied
          }
        }
      };
    }
    if (msg.previous === null) continue;
    const target = dest.byKey.get(msg.previous);
    if (!target) continue; // el anterior no vive en el destino: no verificable
    if (target.author !== msg.author || target.sequence >= msg.sequence) {
      return {
        error: {
          code: 'cadena_rota',
          detail: {
            author: msg.author,
            sequence: msg.sequence,
            file: msg.rel,
            previous: msg.previous,
            previousAuthor: target.author,
            previousSequence: target.sequence
          }
        }
      };
    }
  }

  // Garantía estructural (D3 de U204): cero moves sobre ruta existente y cero
  // moves cuyo ancestro exista como fichero.
  for (const rel of moves) {
    if (existsSync(toAbs(destDir, rel))) {
      return { error: { code: 'sobrescritura_imposible', detail: { file: rel } } };
    }
    const blocked = blockingAncestor(destDir, rel);
    if (blocked) {
      return {
        error: { code: 'ruta_bloqueada_por_fichero', detail: { file: rel, blockedBy: blocked } }
      };
    }
  }

  // ── Cursor sellado ────────────────────────────────────────────────────────
  const sortedKeys = [...finalKeys].sort();
  const keyDigest = createHash('sha256');
  for (const key of sortedKeys) keyDigest.update(`${key}\n`);

  /** @type {Map<string, Set<number>>} author → secuencias tras el merge */
  const finalFeeds = new Map();
  for (const [author, seqs] of dest.feeds) finalFeeds.set(author, new Set(seqs.keys()));
  for (const msg of incoming) {
    const set = finalFeeds.get(msg.author) ?? new Set();
    set.add(msg.sequence);
    finalFeeds.set(msg.author, set);
  }
  // `feedsSha256` resume `<author>:<min>:<max>:<count>` por feed. NO es solo el
  // máximo: con el máximo a secas, dos volúmenes con distinto relleno del mismo
  // feed daban el MISMO cursor, y el eslabón de réplica A→B cuelga justo de
  // aquí. Con min+max+count, dos volúmenes que coincidan en `unitsSha256` y en
  // `feedsSha256` coinciden en claves y en frontera y densidad de cada feed.
  // Lo que sigue sin probar: QUÉ posiciones exactas faltan (para eso está
  // `unitsSha256`, que sí es el conjunto exacto de claves).
  const feedDigest = createHash('sha256');
  let feedsConHueco = 0;
  for (const author of [...finalFeeds.keys()].sort()) {
    const seqs = finalFeeds.get(author);
    const max = Math.max(...seqs);
    const min = Math.min(...seqs);
    if (max - min + 1 !== seqs.size) feedsConHueco += 1;
    feedDigest.update(`${author}:${min}:${max}:${seqs.size}\n`);
  }

  return {
    moves,
    skips,
    dedup,
    divergences,
    snapshot: {
      unit: 'ssb-key',
      units: sortedKeys.length,
      unitsSha256: keyDigest.digest('hex'),
      feeds: finalFeeds.size,
      feedsSha256: feedDigest.digest('hex'),
      // Agujeros: LEGÍTIMOS (el exportador filtra por tipo) pero declarados,
      // no callados — el siguiente eslabón de réplica los necesita ver.
      ...(feedsConHueco > 0 ? { feedsConHueco } : {}),
      // `destFueraDeLayout` DESAPARECE (D-G): ya no puede haber material fuera
      // de layout al llegar aquí — `merge` aborta antes. Contarlo era la vía
      // débil; el campo era la coartada. Misma lección que `destSinClave` en
      // D-F de U204.
      ...(dest.duplicated.length > 0 ? { destDuplicadas: dest.duplicated.length } : {})
    }
  };
}

export const SSB_DRIVER = Object.freeze({
  family: SSB_FAMILY,
  detect,
  validate,
  merge
});

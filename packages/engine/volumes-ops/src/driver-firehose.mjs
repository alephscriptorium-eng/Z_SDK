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
 * ── INYECTIVIDAD de la clave (defecto D1 de la contrarrevisión, cerrado)
 * Concatenar tres componentes con `/` sin validarlos NO es inyectivo: el par
 * `{did:'d', collection:'c', rkey:'x/y'}` y `{did:'d', collection:'c/x',
 * rkey:'y'}` rendía la MISMA clave — dos registros distintos, uno descartado
 * en silencio y un `dedup` que mentía sobre dónde vivía la clave. Era el
 * mismo modo de fallo que motivó descartar la ruta (§2.2 del reporte).
 * Cerrado por construcción: **cada componente debe pasar `keyComponent()`**
 * (no vacío, sin `/`, sin espacios ni caracteres de control). Con `/` prohibido
 * en los tres, `at://A/B/C` se parte de forma única en exactamente 3 partes:
 * la aplicación (did, collection, rkey) → clave es INYECTIVA. Lo que no case
 * NO rinde clave (null) → `unidad_sin_clave`, fallo-cerrado, nunca descarte
 * silencioso. Sin `trim()`: normalizar espacios volvía a colapsar material
 * distinto (`'  d  '` y `'d'`); un componente con espacios se RECHAZA.
 * Charset: ATProto prohíbe `/` en NSID y en rkey, así que la regla no rechaza
 * material legítimo; rechaza material malformado, que es exactamente lo que
 * llega por red no confiada.
 *
 * ── UNA SOLA VÍA (defecto D-A de la 2.ª contrarrevisión, cerrado)
 * Cerrar la terna dejaba abierta la puerta de al lado: mientras `uri` fue una
 * vía ALTERNATIVA, un registro con la terna inválida (`rkey:'x/y'`) keyaba por
 * `uri`, **deduplicaba contra OTRO registro** y se descartaba en silencio con
 * un `dedup` que mentía sobre dónde vivía la clave — el defecto D1 exacto,
 * resucitado. Y el `trim()` retirado se había mudado ahí (`rkey:'r1 '` sin
 * `uri` → null; con `uri` → clave). Desde D-A la clave sale SIEMPRE de la
 * terna y `uri` solo puede CORROBORAR: presente y discrepante = material
 * incoherente = `unidad_sin_clave`. Ver `firehoseUnitKey` para la consecuencia
 * declarada (un registro sin `rkey` ya no se keya por su `uri`).
 * Lección de método, no solo de código: los probes de D1 usaban `withUri:false`
 * y nunca cruzaban las dos vías, mientras el material real de este mundo SÍ
 * trae `uri` (`feed-kit/src/jetstream-sync.mjs` SAMPLE_POSTS). Los probes de
 * clave ejercitan ahora **ambas vías cruzadas**.
 *
 * ── Reglas de reconciliación (NO son las de LINEAS ni las de FORCES)
 * - clave NUEVA → aterriza (unión aditiva);
 * - clave YA PRESENTE en cualquier parte del volumen destino → **dedup**: no se
 *   mueve nada, no se pisa nada, se reporta dónde vive ya. Es un no-op
 *   observable — NO es divergencia (LINEAS) ni colisión que aborta (FORCES):
 *   una caché que crece no aborta el import porque un registro ya estuviera;
 * - misma RUTA ocupada por clave DISTINTA → `colision_ruta`: aborta en el pase
 *   dry (sobrescribir sería pérdida de dato, no reconciliación);
 * - sidecar de raíz del volumen (`triage-manifest.json`): falta → aterriza;
 *   idéntico → no-op; distinto → **divergencia reportada, jamás pisada** (el
 *   triage del destino es decisión local viva, no dato del pack);
 * - clave duplicada DENTRO del pack → `clave_duplicada_en_pack` en VALIDAR
 *   (pack malformado; deduplicarlo en silencio ocultaría el defecto).
 *
 * ── LA RAÍZ DEL VOLUMEN LA VALIDA ESTE DRIVER (defecto D2, cerrado)
 * `importPack:256-267` exime a los volúmenes de familia del control
 * `fichero_fuera_de_corpus` con el comentario «family volumes own their layout
 * via the driver». Antes, este driver aceptaba esa responsabilidad y NO la
 * ejercía: todo fichero de raíz distinto de `triage-manifest.json` aterrizaba
 * sin validar, y una unidad plantada en la raíz era invisible al índice por
 * clave (⇒ el mismo registro se duplicaba y `snapshot.units` descuadraba).
 * Cerrado en dos mitades:
 * 1. VALIDAR: la raíz tiene ALLOWLIST declarada (`FIREHOSE_ROOT_FILES`,
 *    derivada de `presets-sdk/src/paths/firehose.mjs:8` y del validador real
 *    `linea-kit/src/validate.mjs:217-221`). Cualquier otro fichero de raíz =
 *    `fichero_de_raiz_no_declarado`; si además rinde clave, el mensaje dice que
 *    una unidad vive bajo un corpus. El pack ya no cuela nada por la raíz.
 * 2. ÍNDICE y MERGE clasifican por CONTENIDO, no por profundidad de ruta: el
 *    índice del destino cubre todo el árbol RECORRIBLE (incluida la raíz), así
 *    que una unidad heredada en la raíz sí deduplica y sí cuenta en
 *    `snapshot.units`. «Recorrible» es literal: ver D-B.
 *
 * ── EL ÍNDICE DEL DESTINO NO ADMITE AGUJEROS (defecto D-F, cerrado)
 * D2 y D-B taparon dos agujeros del índice; quedaba el tercero, y ahí este
 * driver tomaba **la vía que él mismo rechaza por escrito**: un fichero del
 * destino que no rendía clave se CONTABA (`destSinClave`) y se seguía, con lo
 * que el pack replantaba el registro que ese fichero contenía —`moved` donde
 * tocaba `dedup`, duplicado irreversible porque el sello ya se movió—. El
 * vector más puro no tiene ni excusa de contenido: renombrar una unidad ya
 * aterrizada `u1.json` → `u1.JSON`; mismos bytes, unidad válida, fuera del
 * índice por una comparación de nombre. Igual con BOM UTF-8, sin extensión o
 * en UTF-16LE.
 * Cerrado con la MISMA doctrina que los enlaces: (a) `keyOfFile` ya no filtra
 * por extensión — **el contenido manda, no el nombre**; (b) lo que no rinde
 * clave y no es sidecar declarado ABORTA en el pase dry con
 * `destino_sin_clave`. Queda simétrico con VALIDAR, que ya fallaba cerrado
 * ante lo mismo en el PACK: no puede ser fallo-cerrado a la entrada y
 * fallo-abierto en el destino.
 * Precio declarado: un volumen que YA contenga material así (un `.md` suelto
 * en un corpus, un JSON roto, un fichero con BOM) queda **no importable**
 * hasta que el operador lo retire — con la ruta citada en el error. Es el
 * mismo precio que la vía fuerte de D-B, y se paga por la misma razón.
 *
 * ── ENLACES EN EL DESTINO (defecto D-B de la 2.ª contrarrevisión, cerrado)
 * `readdirSync` no sigue enlaces y el walk los descartaba **en silencio**
 * (`isDirectory()/isFile()` deja fuera junctions), a diferencia de
 * `destSinClave`/`destDuplicadas`/`destUnidadesEnRaiz`, que sí se declaran. Con
 * una unidad viviendo tras un enlace el índice tenía un agujero: el pack la
 * volvía a plantar (`moved:1` donde tocaba `dedup:1`), el volumen quedaba con
 * el registro DUPLICADO, el sello se movía y el paso NO-LINK devolvía
 * `ok:false` **después** de SELLAR — irreversible, porque el reintento ya es
 * no-op por `packHash`. De las dos salidas posibles (declarar el conteo o
 * rechazar) se toma la **fuerte**: `merge` aborta con `enlace_en_destino` en el
 * pase dry, antes de mover y antes de sellar. Una caché cuyo contrato es
 * «jamás duplicar» no puede planificar sobre un índice con agujeros, y el
 * mundo ya rechaza enlaces en el pack (contrato §0.4) y en el árbol aterrizado
 * (paso NO-LINK): rechazarlos en el destino es la misma doctrina, aplicada
 * antes de que haga daño. `walkRel` devuelve `others` para que nada se
 * descarte callando.
 *
 * Garantía estructural: antes de devolver el plan se verifica que ningún
 * `move` (a) apunta a una ruta ya existente → `sobrescritura_imposible`, ni
 * (b) tiene un ancestro que exista como FICHERO en el destino →
 * `ruta_bloqueada_por_fichero` (defecto D3: sin esa guarda `importPack`
 * LANZABA `EEXIST` a mitad de los renames, modo de fallo no declarado por el
 * contrato y volumen a medias). `importPack` ejecuta con `renameSync`, que SÍ
 * pisaría: la imposibilidad la garantiza este guardián, no el sistema de
 * ficheros. **Alcance honesto (acotado tras D-C):** la guarda cubre las
 * colisiones DENTRO de un volumen. NO cubre el caso de dos volúmenes ANIDADOS
 * en el mismo pack (`DISK_01/FIREHOSE` y `DISK_01/FIREHOSE/raw`), donde el
 * mismo fichero entra en dos planes y `importPack` lo renombra dos veces: eso
 * ocurre en el bucle por volumen de `import.mjs:379-477`, fuera del alcance de
 * cualquier driver, y sigue siendo deuda de U201 — citada, no arreglada aquí.
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

import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { validateFile } from '@zeus/linea-kit/validate';

export const FIREHOSE_FAMILY = 'firehose';

/** Índice de triage en la raíz del volumen (schema real U80: `triage-manifest`). */
export const TRIAGE_INDEX_FILE = 'triage-manifest.json';

/**
 * ALLOWLIST de la raíz del volumen (D2). Derivada de lo declarado en el árbol:
 * `presets-sdk/src/paths/firehose.mjs:8` (`TRIAGE_MANIFEST_PATH`) y el
 * validador real `linea-kit/src/validate.mjs:217-221`. Las unidades viven bajo
 * un corpus; la raíz solo aloja el índice.
 */
export const FIREHOSE_ROOT_FILES = Object.freeze([TRIAGE_INDEX_FILE]);

/** Cualquier espacio en blanco, incluidos los unicode (NBSP, separadores). */
const ANY_WHITESPACE = /\s/;

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

/**
 * Walk de un árbol: `{ files, others }`, ambos en rels posix ordenados.
 *
 * `others` = entradas que NO son fichero ni directorio — en la práctica
 * symlinks y junctions (D-B de la contrarrevisión). ANTES se descartaban en
 * silencio, que es como una unidad viviendo tras un enlace se volvía invisible
 * al índice por clave: el pack la volvía a plantar, el volumen quedaba con el
 * registro DUPLICADO y el sello se movía. `readdirSync` no sigue enlaces, así
 * que lo que hay detrás nunca se recorre: por eso no se puede indexar, y por
 * eso el driver los DECLARA en vez de tragárselos.
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
      else others.push(childRel); // enlace/junction/socket/fifo: se declara
    }
  }
  if (existsSync(rootDir)) walk(rootDir, '');
  return { files: files.sort(), others: others.sort() };
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
 * Componente admisible de la clave, o `null` (D1): string no vacío, SIN `/`
 * (es lo que hace inyectivo el AT-URI compuesto), sin espacios en blanco y sin
 * caracteres de control. Sin `trim()`: normalizar espacios colapsaría material
 * distinto en la misma clave, que es justo el defecto que se cierra.
 * @param {any} value
 * @returns {string|null}
 */
function keyComponent(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (value.includes('/') || ANY_WHITESPACE.test(value)) return null;
  for (const ch of value) {
    const code = ch.codePointAt(0);
    if (code < 0x20 || code === 0x7f) return null;
  }
  return value;
}

/**
 * AT-URI bien formado, o `null`: `at://` + exactamente 3 componentes
 * admisibles. Se usa SOLO para CORROBORAR la terna (ver `firehoseUnitKey`):
 * desde D-A ya no es una vía alternativa para producir clave.
 * @param {any} value
 * @returns {string|null}
 */
export function parseAtUri(value) {
  if (typeof value !== 'string' || !value.startsWith('at://')) return null;
  const parts = value.slice('at://'.length).split('/');
  if (parts.length !== 3) return null;
  const [did, collection, rkey] = parts.map(keyComponent);
  if (!did || !collection || !rkey) return null;
  return `at://${did}/${collection}/${rkey}`;
}

/**
 * Clave de la unidad — AT-URI canónico DERIVADO e INYECTIVO (Z-D9 + D1 + D-A).
 *
 * **UNA SOLA VÍA** (D-A): la clave sale SIEMPRE de la terna
 * `did` + `commit.collection` + `commit.rkey`, y los tres deben pasar
 * `keyComponent`. `uri` ya NO es una vía alternativa: cuando está PRESENTE
 * solo puede CORROBORAR — si no coincide exactamente con la clave derivada,
 * el material es incoherente y no rinde clave. «Presente» excluye `null` y
 * `undefined` (M1): ambos son AUSENCIA por convención JSON, y un campo
 * ausente no corrobora ni desmiente; el probe `M1` lo fija para que código y
 * prosa no vuelvan a discrepar.
 *
 * Por qué se retiró el fallback: mientras existió, un registro con la terna
 * inválida (p.ej. `rkey:'x/y'`) keyaba por `uri` y **deduplicaba contra otro
 * registro**, quedando descartado en silencio con un `dedup` que mentía sobre
 * dónde vivía la clave — el defecto D1 exacto, resucitado por la puerta de al
 * lado. Y el `trim()` retirado en D1b se había mudado ahí: `rkey:'r1 '` sin
 * `uri` daba `null`, con `uri` daba clave. Dos vías que no se cruzaban.
 *
 * Consecuencia declarada (no es efecto colateral, es decisión): un registro
 * sin `commit.rkey` —forma que el productor tolera: `writeJetstreamPost`
 * (`feed-kit/src/jetstream-sync.mjs:139`) cae en `:144` a `norm.id` para
 * NOMBRAR el fichero— ya no se keya por su `uri`: se rechaza como
 * `unidad_sin_clave`,
 * citando su ruta. Es §2.4 aplicada: fallo-cerrado antes que adivinar. Se
 * revisará si alguna vez aparece material real así, con la evidencia delante.
 * Sustituye al «límite del fallback» que este driver declaraba antes (AT-URI
 * por handle): ese caso ahora es simplemente material incoherente.
 *
 * Devuelve `null` cuando el material no permite una clave inequívoca: quien
 * llama decide (VALIDAR aborta con la ruta; el índice del destino la cuenta
 * como no indexable). Jamás se fabrica una clave a partir de la ruta, y jamás
 * se normaliza para que «encaje».
 * @param {any} raw
 * @returns {string|null}
 */
export function firehoseUnitKey(raw) {
  if (!isFirehoseUnit(raw)) return null;
  const did = keyComponent(raw?.did);
  const collection = keyComponent(raw?.commit?.collection);
  const rkey = keyComponent(raw?.commit?.rkey);
  if (!did || !collection || !rkey) return null; // sin terna válida no hay clave
  const derived = `at://${did}/${collection}/${rkey}`;
  const uri = raw?.uri;
  if (uri !== undefined && uri !== null && parseAtUri(uri) !== derived) {
    return null; // `uri` presente que no corrobora = material incoherente
  }
  return derived;
}

/**
 * Lee la clave de un fichero; null si no parsea o no rinde clave.
 *
 * NO filtra por extensión (D-F): el CONTENIDO manda, no el nombre. La puerta
 * `rel.endsWith('.json')` que había antes dejaba fuera del índice a una unidad
 * real llamada `u1.JSON` —mismos bytes, perfectamente legible— y el pack la
 * volvía a plantar. Coste declarado de «el contenido manda»: se intenta leer
 * cada fichero del destino; en esta familia todos son posts de kilobytes, pero
 * un fichero grande extraviado en el volumen se leería entero antes de fallar.
 */
function keyOfFile(abs) {
  try {
    return firehoseUnitKey(JSON.parse(readFileSync(abs, 'utf8')));
  } catch {
    return null;
  }
}

/**
 * ¿Algún ancestro del destino de `rel` existe como FICHERO? (D3) Si lo hay,
 * `mkdirSync`/`renameSync` lanzarían EEXIST/ENOTDIR a mitad de la fusión.
 * @param {string} destDir @param {string} rel
 * @returns {string|null} el ancestro bloqueante, o null
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
 * Índice del destino: clave → rel, sobre TODO el árbol RECORRIBLE del volumen
 * — incluida la RAÍZ (D2): una unidad heredada fuera de corpus tiene que
 * deduplicar y contar, no ser invisible. La clasificación es por CONTENIDO, no
 * por profundidad de ruta. Lo no indexable bajo corpus se cuenta y se reporta;
 * el driver no repara el destino.
 *
 * «Recorrible» es literal (D-B): lo que hay tras un enlace NO se recorre, así
 * que `links` sale aparte y `merge` lo trata como causa de aborto — un índice
 * con agujeros no puede sostener «unión aditiva, jamás duplicar».
 * @param {string} dir
 */
function indexByKey(dir) {
  /** @type {Map<string,string>} */
  const byKey = new Map();
  /** Ficheros del destino que no rinden clave y no son sidecar declarado. */
  /** @type {string[]} */
  const unkeyable = [];
  /** @type {string[]} */
  const duplicated = [];
  /** @type {string[]} */
  const rootUnits = [];
  const { files, others } = walkRel(dir);
  for (const rel of files) {
    const key = keyOfFile(toAbs(dir, rel)); // D-F: por contenido, sin puerta de extensión
    if (!key) {
      // Sidecar de raíz DECLARADO (allowlist): no es unidad y no es defecto.
      // Cualquier otra cosa deja el índice con un agujero → `merge` aborta.
      if (isUnitSlot(rel) || !FIREHOSE_ROOT_FILES.includes(rel)) unkeyable.push(rel);
      continue;
    }
    if (!isUnitSlot(rel)) rootUnits.push(rel);
    if (byKey.has(key)) duplicated.push(rel);
    else byKey.set(key, rel);
  }
  return { byKey, unkeyable, duplicated, rootUnits, links: others };
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

  const staged = walkRel(stagedDir);
  // El staging es una COPIA materializada (importPack ya rechaza enlaces en el
  // pack, contrato §0.4), así que `others` debería ser vacío; si no lo es, se
  // dice — nunca se descarta en silencio (D-B).
  for (const rel of staged.others) {
    results.push({
      ok: false,
      schemaId: 'firehose-layout',
      path: rel,
      errors: [{ message: `enlace_en_staging: ${rel} no es fichero ni directorio` }]
    });
  }

  for (const rel of staged.files) {
    const abs = toAbs(stagedDir, rel);
    const key = rel.endsWith('.json') ? keyOfFile(abs) : null;
    if (!isUnitSlot(rel)) {
      // D2 · la raíz del volumen la valida ESTE driver (allowlist declarada).
      if (!FIREHOSE_ROOT_FILES.includes(rel)) {
        results.push({
          ok: false,
          schemaId: 'firehose-layout',
          path: rel,
          errors: [
            {
              message: key
                ? `fichero_de_raiz_no_declarado: ${rel} es una unidad FIREHOSE (${key}) y las unidades viven bajo un corpus, no en la raíz del volumen`
                : `fichero_de_raiz_no_declarado: ${rel} — la raíz del volumen solo admite ${FIREHOSE_ROOT_FILES.join(', ')}`
            }
          ]
        });
      }
      continue;
    }
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

  // D-B · un destino con enlaces NO se puede planificar: `readdirSync` no los
  // sigue, así que el índice por clave tiene agujeros y una unidad que viva
  // detrás reaparecería DUPLICADA (y de forma irreversible: el pack quedaría
  // sellado con su packHash y el reintento sería no-op). Se aborta en el pase
  // dry — ANTES de mover y ANTES de sellar — en vez de fallar en el paso
  // NO-LINK, que corre DESPUÉS de SELLAR. Coherente con el cerco §10.8 y con
  // el rechazo de enlaces en el pack (contrato §0.4).
  if (dest.links.length > 0) {
    return { error: { code: 'enlace_en_destino', detail: { links: dest.links } } };
  }

  // D-F · MISMA doctrina, aplicada a la otra mitad del agujero: un fichero del
  // destino que no rinde clave y no es sidecar declarado deja el índice
  // incompleto, y el pack replantaría el registro que ese fichero contiene
  // (`moved` donde tocaba `dedup`, duplicado irreversible tras SELLAR). Antes
  // se CONTABA (`destSinClave`) y se seguía: era la vía débil que este mismo
  // driver rechaza por escrito para los enlaces. Ahora aborta, simétrico con
  // VALIDAR, que ya falla cerrado ante lo mismo en el PACK.
  if (dest.unkeyable.length > 0) {
    return { error: { code: 'destino_sin_clave', detail: { files: dest.unkeyable } } };
  }

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
    // D2 · clasificación por CONTENIDO, no por profundidad de ruta.
    const key = rel.endsWith('.json') ? keyOfFile(stagedAbs) : null;

    if (!key) {
      if (isUnitSlot(rel)) {
        // Inalcanzable mientras VALIDAR corra antes que FUSIONAR (VALIDAR
        // rechaza todo fichero de corpus sin clave); guardián por si el
        // orden cambiara. A diferencia de `unidad_en_raiz`, que SÍ se alcanza.
        return { error: { code: 'unidad_sin_clave', detail: { file: rel } } };
      }
      // Sidecar de raíz (índice de triage): aditivo por ruta, divergencia
      // reportada, JAMÁS pisado. VALIDAR ya limitó la raíz a la allowlist.
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

    if (!isUnitSlot(rel)) {
      // ALCANZABLE (D-E): la allowlist de VALIDAR es por NOMBRE, y el schema
      // `triage-manifest` es permisivo (additionalProperties, todo opcional),
      // así que un `triage-manifest.json` cuyo payload sea una unidad pasa
      // VALIDAR y llega aquí. Falla cerrado: aborta en el pase dry, root
      // intacto. (Antes este comentario decía «inalcanzable»; era falso.)
      return { error: { code: 'unidad_en_raiz', detail: { file: rel, key } } };
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
  // es «no deseada»: es imposible por construcción del plan) y cero moves cuyo
  // ancestro exista como fichero (D3 — si no, `importPack` LANZA a mitad de
  // los renames y el volumen queda a medias).
  for (const rel of moves) {
    if (existsSync(toAbs(destDir, rel))) {
      return { error: { code: 'sobrescritura_imposible', detail: { file: rel } } };
    }
    const blocked = blockingAncestor(destDir, rel);
    if (blocked) {
      return { error: { code: 'ruta_bloqueada_por_fichero', detail: { file: rel, blockedBy: blocked } } };
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
      // `destSinClave` DESAPARECE (D-F): ya no puede haber ficheros del destino
      // sin clave al llegar aquí — `merge` aborta antes. Contarlos era la vía
      // débil; el campo era la coartada.
      ...(dest.duplicated.length > 0 ? { destDuplicadas: dest.duplicated.length } : {}),
      // Unidades heredadas fuera de corpus en el destino: cuentan y deduplican
      // (D2), pero se declaran porque el layout de la familia no las admite.
      ...(dest.rootUnits.length > 0 ? { destUnidadesEnRaiz: dest.rootUnits.length } : {})
    }
  };
}

export const FIREHOSE_DRIVER = Object.freeze({
  family: FIREHOSE_FAMILY,
  detect,
  validate,
  merge
});

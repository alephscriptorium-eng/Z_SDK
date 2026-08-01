/**
 * Cerco del ROOT (WP-U206 · paso 7 del CA local-first).
 *
 * El cerco del lado del PACK ya existía y es duro: `importPack` rechaza
 * symlinks en el pack (import.mjs:191-193), rechaza material de identidad por
 * denylist de basename (import.mjs:59, :195-199) y vuelve a barrer el árbol
 * aterrizado en el paso NO-LINK (import.mjs:602-611). Del lado del ROOT no
 * había nada: un root puede haber recibido material por vías que no son el
 * import, y la réplica A→B copia lo que encuentre.
 *
 * Este módulo vive en `src/` por el mismo motivo que el verificador de
 * integridad: si vive sólo en el runner, el CA pasa y el producto sigue
 * desprotegido.
 *
 * ── LOS CUATRO PREDICADOS, ESCRITOS ──────────────────────────────────────
 *
 * 1 · ENLACE VIVO. Toda entrada cuyo `lstatSync().isSymbolicLink()` sea
 *     cierto. Mismo criterio que import.mjs:81-104 (lstat, jamás se sigue).
 *     En Windows las junctions de directorio entran por aquí: Node las
 *     reporta como symlink en `lstat`.
 *
 * 2 · RUTA node_modules. Toda entrada con un segmento de ruta exactamente
 *     igual a `node_modules`. Un root que viva —o que apunte— dentro de
 *     `node_modules` es un pack usado como root vivo, que es lo que el
 *     resolvedor canónico ya rechaza (presets-sdk/volumes/resolve.mjs:38-42).
 *
 * 3 · MATERIAL DE IDENTIDAD. Basename contra la denylist del contrato, que
 *     se **importa de import.mjs** en vez de copiarse: una segunda copia de
 *     la lista es una juntura por la que se cuela lo que se añada a la otra.
 *
 * 4 · URL VIVA — **el predicado, reescrito en U259**. Ver el bloque siguiente:
 *     es la mitad de ese WP y una decisión de contrato, no un detalle.
 *
 * ── EL PREDICADO DE URL VIVA (U259) ──────────────────────────────────────
 *
 * **Qué se estaba decidiendo.** U206 dejó escrito, con la medida delante, que
 * «0 URLs vivas» **no distingue procedencia registrada de ancla de arranque**
 * (boot.mjs:19-31): sobre el root de referencia el cerco daba TRES hallazgos
 * —dos `urls.revision` de una fixture de LINEAS y un enlace de repositorio en
 * `README.md`—, ninguno de ellos un ancla, y por eso el cerco no puede abortar.
 * Un gate que, aplicado, negaría el arranque a todo el monorepo no es un gate.
 *
 * **La pregunta, formulada de modo que se pueda contestar.** Un ANCLA DE
 * ARRANQUE es una URL que el PRODUCTO puede dereferenciar: si se corta la red,
 * algo del root deja de funcionar. Un METADATO INERTE es una URL que sólo
 * puede leer una persona, o que nombra un original **del que el root ya guarda
 * copia o coordenada**. El cerco no puede ejecutar el producto, así que la
 * distinción se toma con **cuatro exenciones, cada una decidible sobre los
 * bytes del propio fichero**. Todo lo que no caiga en una de las cuatro es
 * URL VIVA: el default es fallo-cerrado, no al revés.
 *
 * **I1 · AUTORIDAD NO RESOLUBLE.** El **host** de la URL —la autoridad ya
 *   descontadas userinfo y puerto, tal y como la parte `new URL()`— está vacío
 *   o contiene un placeholder `${…}`. Nadie puede dereferenciarla sin que
 *   alguien la rellene: no es un ancla, es una plantilla.
 *   **Esto ESTRECHA la exención (a) de U206, no la ensancha**, y ahí había un
 *   agujero real: la regla vieja era `/^https?:\/\/\$\{/i`, o sea «empieza por
 *   `https://${`», y con eso **`https://${TOKEN}@servidor.real/x` quedaba
 *   exenta** — su autoridad de verdad es `servidor.real`, el `${…}` está en la
 *   userinfo. Ese caso hoy pasa y con esta regla CAE. (El literal, además,
 *   antes ni se capturaba entero: el patrón excluía `}`, así que casaba
 *   `https://${TOKEN` y se iba por la exención por prefijo. El patrón ahora
 *   admite grupos `${…}` completos — capturar MÁS, decidir después.)
 *
 * **I2 · REFERENCIA COORDINADA.** La URL es el **valor completo** de un campo
 *   de un documento **estructurado** (JSON), y el **registro que la contiene**
 *   coordina con ella un par nombre=valor: existe un parámetro de consulta de
 *   la URL cuyo nombre es una clave del registro y cuyo valor es, verbatim, el
 *   valor de esa clave (o el mismo par expresado como `/<clave>/<valor>` en la
 *   ruta). Leído en voz alta: **la URL no apunta a un servicio, apunta al MISMO
 *   objeto que el registro está describiendo, y lo demuestra repitiendo su
 *   coordenada.** Un endpoint nunca coordina —`https://pub.example/` no repite
 *   ningún dato del root—; una referencia a un original concreto casi siempre
 *   sí, porque el registro existe justamente para anotar CUÁL original es.
 *   Es la regla que hace inerte `registros[i].urls.revision =
 *   "…?oldid=2"` junto a `registros[i].oldid = 2`, **sin nombrar el campo**.
 *   «Registro» = el objeto que contiene el campo y sus ancestros, subiendo
 *   hasta el primero que sea ELEMENTO DE UN ARRAY (o hasta la raíz del
 *   documento si no hay ninguno): es la frontera natural de «una entrada».
 *
 * **I3 · PROCEDENCIA SELLADA DEL MANIFIESTO** — heredada de U206 **sin tocar
 *   un carácter**: los valores de `volumes.<id>.source.imported.origin` dentro
 *   de `volumes.json`. El contrato dice literalmente que la URL de origen
 *   viaja «solo como metadato inerte» (CONTRATO-IMPORT-PACK-v1 §3,
 *   import.mjs · paso SELLAR). La exención sigue siendo **por ruta de clave
 *   exacta y sólo en el manifiesto**: la misma URL en cualquier otro sitio del
 *   root —incluido cualquier otro campo del propio `volumes.json`— es viva.
 *   No se ensancha a `source.imported.*` ni a `source.*` **a propósito**:
 *   ensanchar una exención existente es debilitar una guarda, y este WP no
 *   hace eso ni para que le pasen sus propios casos.
 *
 * **I4 · PROSA DE RAÍZ.** Dos condiciones, las dos necesarias:
 *   (a) el fichero es un `.md` **suelto en la raíz del root**, sin directorio
 *       de disco por encima. Esa categoría **ya existe declarada** en el
 *       constructor de packs: un fichero suelto en el dataRoot se descarta con
 *       motivo `manifiesto_de_root` porque «un pack sólo transporta discos»
 *       (pack-adapter.mjs). O sea: **no es dato de ningún volumen, no viaja en
 *       ninguna réplica por import y ningún cargador de familia lo abre**;
 *   (b) la URL aparece dentro de un **enlace de Markdown** (`[t](url)`,
 *       `<url>` o `[id]: url`), o sea material dirigido a una persona y no el
 *       valor de un campo que un cargador pudiera leer.
 *   Un `.md` **de datos** (escena de FORCES bajo `DISK_03/…`, curación de
 *   LINEAS bajo `DISK_02/…`) **no** cumple (a): ahí una URL sigue siendo viva.
 *   El `.ops-ledger.jsonl` y `volumes.state.json`, que también son de raíz,
 *   **no** cumplen (b): son JSON, no prosa, y se siguen barriendo enteros —
 *   el alcance que U206 declaró no se recorta.
 *
 * **LO QUE ESTE PREDICADO NO ES.** No es a prueba de adversario, y decirlo
 * importa: I2 se puede fabricar (basta añadir al registro un campo con el
 * nombre y el valor del parámetro que uno quiera colar). Es del mismo estatuto
 * que el ledger, que es «append-only por convención, no a prueba de
 * manipulación»: protege contra DERIVA, no contra alguien con escritura en el
 * root — y quien tiene escritura en el root tiene delante los otros tres
 * predicados y los ocho tramos del verificador de integridad.
 * **Tampoco cubre YAML**: un `.yaml`/`.yml` no se parsea, se barre como texto,
 * así que no obtiene I2 y cualquier URL suya es viva. Es fallo-cerrado
 * deliberado: antes de exentar hay que poder leer la estructura.
 *
 * Ficheros binarios: se detectan por byte NUL en los primeros 8 kB y NO se
 * escanean en busca de URLs; se reportan en `binaries[]`. Un `.md` o un
 * `.json` nunca cae ahí. Se declara porque un escaneo silencioso de binarios
 * daría falsos negativos que parecerían limpieza.
 *
 * Alcance: TODO lo que cuelga del root, incluido `.ops-ledger.jsonl`
 * (ledger.mjs:10,19) y `volumes.state.json`. Los dos viven DENTRO del root y
 * viajan en la copia A→B, así que son material cercado como cualquier otro.
 * Node-only.
 */

import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, sep } from 'node:path';
import { resolveVolumesRoot } from '@zeus/presets-sdk/volumes';
import { IDENTITY_DENYLIST } from './import.mjs';
import { MANIFEST_FILE_NAME } from './manifest.mjs';

/**
 * Literal de URL con esquema http(s). INSENSIBLE A MAYÚSCULAS (U206·m3): sin
 * la bandera `i`, `HTTPS://EJEMPLO.TEST` no se detectaba — y la denylist de
 * identidad sí era insensible, o sea que el módulo aplicaba dos varas.
 *
 * U259 · admite grupos `${…}` COMPLETOS. Antes `}` cerraba el literal siempre,
 * así que `https://${TOKEN}@servidor.real/x` se capturaba como `https://${TOKEN`
 * y salía exenta por «empieza por `https://${`» — con la autoridad real
 * (`servidor.real`) fuera del literal y fuera de la decisión. Se captura MÁS y
 * se decide después, sobre el host parseado (I1).
 */
const URL_LITERAL_RE = /https?:\/\/(?:\$\{[^}\s]*\}|[^\s"'`<>)\]}\\])*/gi;

/** Bytes iniciales que se miran para CLASIFICAR un fichero como binario. */
const BINARY_SNIFF_BYTES = 8192;

/**
 * Recorrido del root: ficheros, enlaces y rutas con `node_modules`.
 * No sigue enlaces (lstat), igual que import.mjs.
 * @param {string} rootDir
 * @returns {{ files: string[], symlinks: string[] }}
 */
function walkRoot(rootDir) {
  /** @type {string[]} */
  const files = [];
  /** @type {string[]} */
  const symlinks = [];
  /** @param {string} dir @param {string} rel */
  function walk(dir, rel) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      const st = lstatSync(abs);
      if (st.isSymbolicLink()) {
        symlinks.push(childRel);
        continue;
      }
      if (st.isDirectory()) walk(abs, childRel);
      else if (st.isFile()) files.push(childRel);
    }
  }
  if (existsSync(rootDir)) walk(rootDir, '');
  return { files: files.sort(), symlinks: symlinks.sort() };
}

/**
 * I1 · ¿la AUTORIDAD de la URL es resoluble?
 *
 * Se parsea con `new URL()` y se mira el **host**, no el prefijo: `${…}` en la
 * userinfo NO exenta, porque la autoridad de verdad está detrás del `@`. Una
 * URL que ni siquiera parsea se trata como resoluble (fallo-cerrado: no se
 * regala una exención por ser rara).
 * @param {string} match
 * @returns {boolean} true = NO resoluble ⇒ inerte por I1
 */
function tieneAutoridadNoResoluble(match) {
  /** @type {URL} */
  let u;
  try {
    u = new URL(match);
  } catch {
    return false;
  }
  return u.hostname === '' || u.hostname.includes('${') || u.hostname.includes('%7b');
}

/**
 * Coordenadas que la URL expone: pares `nombre → valor` de la consulta, más
 * los pares `/<nombre>/<valor>` consecutivos de la ruta.
 * @param {string} match
 * @returns {Map<string,string>|null}
 */
function coordenadasDeUrl(match) {
  /** @type {URL} */
  let u;
  try {
    u = new URL(match);
  } catch {
    return null;
  }
  /** @type {Map<string,string>} */
  const pares = new Map();
  for (const [k, v] of u.searchParams) if (!pares.has(k)) pares.set(k, v);
  const segs = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  for (let i = 0; i + 1 < segs.length; i += 1) {
    if (!pares.has(segs[i])) pares.set(segs[i], segs[i + 1]);
  }
  return pares;
}

/**
 * I2 · ¿el REGISTRO que contiene la URL coordina con ella un par nombre=valor?
 *
 * `record` es la unión de los escalares del objeto que contiene el campo y de
 * sus ancestros hasta el primer elemento de array (lo arma `scanStructuredUrls`).
 * @param {string} match @param {Map<string,string>} record
 * @returns {{ key: string, value: string }|null}
 */
function coordinaConElRegistro(match, record) {
  const pares = coordenadasDeUrl(match);
  if (!pares || record.size === 0) return null;
  for (const [nombre, valor] of pares) {
    if (record.has(nombre) && record.get(nombre) === valor) {
      return { key: nombre, value: valor };
    }
  }
  return null;
}

/**
 * I4·(b) · ¿la URL aparece como ENLACE de Markdown? Se mira lo que hay
 * inmediatamente ANTES de la aparición: `](` (enlace inline), `<` (autolink) o
 * `]: ` (definición de referencia).
 * @param {string} text @param {number} index
 */
function esEnlaceMarkdown(text, index) {
  const antes = text.slice(Math.max(0, index - 64), index);
  return /\]\($/.test(antes) || /<$/.test(antes) || /\]:\s*$/.test(antes);
}

/** I4·(a) · fichero suelto en la RAÍZ del root (sin disco por encima) y `.md`. */
function esProsaDeRaiz(rel) {
  return !rel.includes('/') && /\.md$/i.test(rel);
}

/**
 * ¿La ruta de clave es EXACTAMENTE la procedencia inerte que declara el
 * contrato? `volumes.<id>.source.imported.origin`, y nada más.
 * @param {(string|number)[]} keyPath
 */
function isInertOriginPath(keyPath) {
  return (
    keyPath.length === 5 &&
    keyPath[0] === 'volumes' &&
    keyPath[2] === 'source' &&
    keyPath[3] === 'imported' &&
    keyPath[4] === 'origin'
  );
}

/**
 * URLs vivas de un documento ESTRUCTURADO (JSON), resueltas por RUTA DE CLAVE
 * y por REGISTRO.
 *
 * Se parsea y se recorre el objeto en vez de barrer el texto por dos razones
 * distintas, las dos aprendidas a base de defecto:
 * - la exención del contrato (I3) es por ruta de clave exacta, y una exención
 *   por VALOR sería mucho más ancha de lo declarado: la misma cadena bajo
 *   cualquier otra clave quedaría exenta de rebote. (Ese defecto exacto existió
 *   en la primera versión de este módulo y lo cazó `cerco-root.test.mjs`.)
 * - la exención por coordenada (I2, U259) necesita saber **qué registro**
 *   contiene la URL; sobre texto plano no hay registro que mirar.
 *
 * Un JSON ilegible NO obtiene barra libre: se cae al barrido de texto, donde
 * sólo queda I1.
 * @param {string} text
 * @param {string} rel
 * @param {boolean} isManifest — habilita I3 (sólo el manifiesto la tiene)
 * @returns {object[]}
 */
function scanStructuredUrls(text, rel, isManifest) {
  /** @type {any} */
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    return scanTextUrls(text, rel);
  }
  /** @type {object[]} */
  const urls = [];

  /**
   * Escalares del REGISTRO que contiene el campo: el objeto propietario y sus
   * ancestros, subiendo hasta el primero que sea ELEMENTO DE UN ARRAY (incluido)
   * o hasta la raíz. Es la frontera natural de «una entrada» y evita que un
   * ancestro lejano exente por casualidad.
   * @param {{obj: object, isArrayElement: boolean}[]} stack
   * @param {string} ownKey — el campo de la propia URL, que no se cuenta
   */
  const registroDe = (stack, ownKey) => {
    /** @type {Map<string,string>} */
    const record = new Map();
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      const frame = stack[i];
      for (const [k, v] of Object.entries(frame.obj)) {
        if (i === stack.length - 1 && k === ownKey) continue;
        if (v === null || typeof v === 'object') continue;
        if (!record.has(k)) record.set(k, String(v));
      }
      if (frame.isArrayElement) break;
    }
    return record;
  };

  /**
   * @param {unknown} node
   * @param {(string|number)[]} keyPath
   * @param {{obj: object, isArrayElement: boolean}[]} stack
   * @param {string|null} ownKey
   */
  function walk(node, keyPath, stack, ownKey) {
    if (typeof node === 'string') {
      for (const m of node.matchAll(URL_LITERAL_RE)) {
        const value = m[0];
        if (tieneAutoridadNoResoluble(value)) continue; // I1
        if (isManifest && isInertOriginPath(keyPath)) continue; // I3
        // I2 · sólo si la URL es el VALOR COMPLETO del campo: una URL incrustada
        // en una frase no la lee ningún cargador por ese campo, y aun así no se
        // exenta — no hay registro que la coordine.
        if (ownKey !== null && node.trim() === value) {
          const coord = coordinaConElRegistro(value, registroDe(stack, ownKey));
          if (coord) continue;
        }
        urls.push({ path: rel, keyPath: keyPath.join('.'), url: value, line: lineOf(text, value) });
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, [...keyPath, i], stack, null));
      return;
    }
    if (node && typeof node === 'object') {
      const frame = { obj: node, isArrayElement: ownKey === null && stack.length > 0 };
      const childStack = [...stack, frame];
      for (const [k, v] of Object.entries(node)) {
        // Las CLAVES también se miran: una URL como nombre de campo es una URL.
        for (const m of k.matchAll(URL_LITERAL_RE)) {
          if (!tieneAutoridadNoResoluble(m[0])) {
            urls.push({
              path: rel,
              keyPath: [...keyPath, k].join('.'),
              url: m[0],
              line: lineOf(text, m[0])
            });
          }
        }
        walk(v, [...keyPath, k], childStack, k);
      }
    }
  }
  walk(doc, [], [], null);
  return urls;
}

/** Línea 1-based de la primera aparición de `needle` (para que el hallazgo se pueda abrir). */
function lineOf(text, needle) {
  const idx = text.indexOf(needle);
  return idx < 0 ? null : text.slice(0, idx).split('\n').length;
}

/**
 * URLs vivas de un fichero de texto cualquiera: sólo I1, y I4 cuando el fichero
 * es prosa de raíz. Sin estructura no hay registro que coordine (I2) ni ruta de
 * clave que exentar (I3) — fallo-cerrado.
 * @param {string} text @param {string} rel
 * @returns {object[]}
 */
function scanTextUrls(text, rel) {
  /** @type {object[]} */
  const urls = [];
  const prosaDeRaiz = esProsaDeRaiz(rel);
  for (const m of text.matchAll(URL_LITERAL_RE)) {
    const value = m[0];
    if (tieneAutoridadNoResoluble(value)) continue; // I1
    if (prosaDeRaiz && esEnlaceMarkdown(text, m.index)) continue; // I4
    urls.push({ path: rel, line: text.slice(0, m.index).split('\n').length, url: value });
  }
  return urls;
}

/**
 * URLs vivas de un fichero.
 * @param {string} abs @param {string} rel @param {boolean} isManifest
 * @returns {{ urls: object[], binary: boolean }}
 */
function scanUrls(abs, rel, isManifest) {
  const buf = readFileSync(abs);
  const binary = buf.subarray(0, BINARY_SNIFF_BYTES).includes(0);
  if (binary) {
    // U206·m4 — antes los binarios se SALTABAN: se declaraban en `binaries[]`
    // «para que no pareciera limpieza», pero el gate CONCEDÍA igual, así que
    // un solo byte NUL al principio de un fichero escondía una URL viva. Ya no
    // hay exención: se leen como latin1 (byte a byte) para que cualquier URL
    // ASCII incrustada aparezca. `binaries[]` queda como clasificación
    // informativa, no como salvoconducto.
    return { urls: scanTextUrls(buf.toString('latin1'), rel), binary: true };
  }
  const text = buf.toString('utf8');
  // U259 · la lectura ESTRUCTURADA ya no es privilegio del manifiesto: cualquier
  // `.json` del root se parsea, porque I2 necesita el registro. El manifiesto se
  // distingue sólo en que además tiene I3.
  const estructurado = isManifest || /\.json$/i.test(rel);
  return {
    urls: estructurado ? scanStructuredUrls(text, rel, isManifest) : scanTextUrls(text, rel),
    binary: false
  };
}

/**
 * Barre un volumes root y aplica los cuatro predicados del cerco.
 *
 * @param {{ root?: string, scanUrls?: boolean }} [opts] — `root` por defecto
 *   es el canónico (`resolveVolumesRoot()`); se admite explícito para poder
 *   barrer la réplica B sin reconfigurar el entorno.
 * @returns {{ ok: boolean, root: string, files: number,
 *             symlinks: string[], nodeModules: string[], identity: string[],
 *             liveUrls: object[], binaries: string[], findings: object[] }}
 */
export function scanRootCerco(opts = {}) {
  const root = opts.root ? String(opts.root) : resolveVolumesRoot();
  const withUrls = opts.scanUrls !== false;

  // Un cerco sobre un directorio que NO EXISTE no está «limpio»: está vacío,
  // que es otra cosa. Sin esta guarda, barrer una ruta equivocada devuelve
  // `ok:true` con 0 hallazgos y el gate concede sobre la nada — el modo de
  // fallo más caro de un gate (se cazó ejecutando el runner sin la variable
  // del mundo hermano: barría una ruta inexistente y daba verde).
  const vacio = (kind) => ({
    ok: false,
    root,
    files: 0,
    symlinks: [],
    nodeModules: [],
    identity: [],
    liveUrls: [],
    binaries: [],
    findings: [{ kind, path: root }]
  });

  if (!existsSync(root)) return vacio('root_no_encontrado');

  // U206·D2 — LA VACUIDAD, que es la otra mitad de la inexistencia. Nada
  // comprobaba que lo barrido FUERA un volumes root: un directorio vacío, o
  // uno cualquiera sin manifiesto, devolvía `ok:true · files:0 · findings:0` y
  // `assertRootCerco` no lanzaba. Un gate que concede sobre terreno que no es
  // el suyo es el modo de fallo más caro que hay: no protege y parece que sí.
  // El manifiesto es la firma de un root (U199: sin él, el root no es
  // operable), así que es el predicado correcto de identidad.
  if (!existsSync(join(root, MANIFEST_FILE_NAME))) return vacio('root_sin_manifiesto');

  const { files, symlinks } = walkRoot(root);

  // 2 · node_modules en cualquier segmento (del propio root o de las entradas).
  const rootSegments = root.split(/[\\/]+/);
  /** @type {string[]} */
  const nodeModules = [];
  if (rootSegments.includes('node_modules')) nodeModules.push('<root>');
  for (const rel of [...files, ...symlinks]) {
    if (rel.split('/').includes('node_modules')) nodeModules.push(rel);
  }

  // 3 · material de identidad, con LA denylist del contrato (importada).
  const identity = files.filter((rel) =>
    IDENTITY_DENYLIST.some((re) => re.test(basename(rel)))
  );

  // 4 · URLs vivas.
  /** @type {object[]} */
  const liveUrls = [];
  /** @type {string[]} */
  const binaries = [];
  if (withUrls) {
    for (const rel of files) {
      const abs = join(root, rel.split('/').join(sep));
      const res = scanUrls(abs, rel, rel === MANIFEST_FILE_NAME);
      // `binaries` es CLASIFICACIÓN, no exención: sus URLs cuentan igual (m4).
      if (res.binary) binaries.push(rel);
      liveUrls.push(...res.urls);
    }
  }

  /** @type {object[]} */
  const findings = [];
  for (const p of symlinks) findings.push({ kind: 'enlace_vivo', path: p });
  for (const p of nodeModules) findings.push({ kind: 'ruta_node_modules', path: p });
  for (const p of identity) findings.push({ kind: 'material_de_identidad', path: p });
  for (const u of liveUrls) findings.push({ kind: 'url_viva', ...u });

  return {
    ok: findings.length === 0,
    root,
    files: files.length,
    symlinks,
    nodeModules,
    identity,
    liveUrls,
    binaries,
    findings
  };
}

/**
 * Gate: barre y ABORTA si el cerco no está limpio.
 * @param {{ root?: string, scanUrls?: boolean }} [opts]
 * @returns {object} el reporte, cuando ok
 * @throws {Error} con `.report` adjunto cuando no
 */
export function assertRootCerco(opts = {}) {
  const report = scanRootCerco(opts);
  if (!report.ok) {
    const summary = report.findings.map((f) => `${f.kind}:${f.path}`).join(' · ');
    const err = new Error(
      `Cerco del root roto (${report.findings.length} hallazgo(s)): ${summary}`
    );
    // @ts-ignore — evidencia adjunta para el llamador
    err.report = report;
    throw err;
  }
  return report;
}

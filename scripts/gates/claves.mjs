/**
 * WP-U231 — el invariante de secretos en el plano de datos.
 *
 * QUÉ DOCTRINA APLICA Y DE QUIÉN ES. `GATE-O-CLAVES` es doctrina de **O** y en
 * este árbol sólo está CITADA, nunca implementada: `plan/BACKLOG.md:333` y
 * `:403`, `plan/GOBIERNO-EJECUCION-F2.md:478` («GATE-O-CLAVES = doctrina de O
 * (solo citada)») y `plan/REPORTES/U228-cinco-datos-servicios-O.md:176`. Lo que
 * SÍ es de este mundo, y por eso puede vivir aquí, es su derivada al plano de
 * datos, escrita dos veces en las notas de Z:
 *
 *   «ningún volumen aloja material de identidad —claves de pub, tokens de
 *   registry, credenciales de VPS—. Es la misma línea que O trazó con
 *   GATE-O-CLAVES, y aquí se aplica al plano de datos: un volumen que necesita
 *   un secreto para leerse está mal diseñado; el secreto va por env del
 *   operador, nunca en el árbol.»
 *   — `sincronia/notas/archivo/NOTA-Z-2026-07-26-R6-matriz-volumenes.md:55-59`
 *
 *   «uno solo, gitignored y fuera del contexto de build de Docker — misma
 *   lección que el GATE-O-CLAVES de O: el `.dockerignore` es la segunda puerta
 *   y es la que falla.»
 *   — `sincronia/notas/NOTA-Z-2026-07-26-R7-matriz-migracion-y-loadstartpack.md:71-74`
 *
 * O sea: la política de build de O no se decide aquí (o-sdk es de sólo lectura
 * y no se toca). Aquí se vigila lo que este árbol posee: `VOLUMES/**`, el
 * contrato de lectura de un volumen, y la segunda puerta del contexto de imagen
 * el día que exista un Dockerfile — hoy no existe ninguno, y eso está medido,
 * no supuesto (ver `scanContextoImagen` y el reporte del WP).
 *
 * POR QUÉ NO HAY DETECCIÓN POR ENTROPÍA. Es lo primero que uno escribe y aquí
 * es exactamente lo que no sirve: `VOLUMES/volumes.json` y
 * `VOLUMES/.ops-ledger.jsonl` están LLENOS de sha256 legítimos (`packHash`,
 * `hashes`, `snapshot`, `manifestSha256`). Un umbral de entropía sobre base64 o
 * hex enrojece el árbol limpio de hoy en la primera pasada, y un gate que
 * enrojece en verde se desactiva a la semana. La detección es por FORMA
 * (marcador estructural: cabecera PEM, tres segmentos de JWT, `usuario:clave@`)
 * o por CLAVE (un campo cuyo NOMBRE es de identidad, con un valor que no es un
 * hueco). Lo que no tiene ni forma ni nombre no se caza; está declarado abajo.
 *
 * ESTAS TRES REGLAS NO ADMITEN EXCEPCIÓN, y no es una postura: la doctrina
 * citada dice «sin excepción» (R6:55) y «⛔ la clave del pub NO entra: exclusión
 * absoluta» (R6:48). Un `EXCEPTIONS` con el nombre de una de estas reglas no
 * exime — se convierte él mismo en ofensa, con su fichero y su motivo. Es la
 * diferencia entre no tener agujeros y tener agujeros con permiso. Los huecos
 * legítimos (`"${ZEUS_SSB_PUB_URL}"`) no se resuelven con excepciones sino con
 * precisión: un `${VAR}` no es un secreto, y el detector lo sabe.
 *
 * LO QUE ESTE FICHERO NO CUBRE. Está escrito aquí y repetido en el reporte
 * porque un gate es lo más fácil de sobrevender:
 *
 *   1. **El árbol de datos VIVO.** Los DISK reales viven FUERA del monorepo
 *      (`ZEUS_VOLUMES_ROOT`, `VOLUMES/README.md:6-8`). Por defecto esto barre
 *      `VOLUMES/` EN EL REPO, que hoy son 16 ficheros de fixture. Para un root
 *      de operador: `--barrido --root <ruta>` (contenido) y `--censo --root`
 *      (contrato). Los dos caminos tienen test de punta a punta; la primera
 *      versión sólo cableaba el censo y respondía VERDE sobre un root con una
 *      clave sembrada.
 *   2. **El historial de git.** Un secreto ya commiteado y luego borrado no lo
 *      ve nadie aquí: esto mira el árbol de trabajo. Purgar historial es otro
 *      trabajo y otro coste (reescritura + rotación de la credencial).
 *   3. **El tarball de npm.** `files`/`.npmignore` es otro contexto de
 *      publicación; lo mira `test/gates/paridad-publicacion.test.mjs`, no esto.
 *   4. **Contextos de build que no sean el directorio de la receta ni la raíz.**
 *      Se exigen cerrados esos DOS, que son los convenios reales; un `compose`
 *      con `build.context` a un tercer sitio no se modela. Hoy no hay ni
 *      Dockerfile ni compose.
 *   5. **Secreto cifrado, comprimido o en UTF-16.** El barrido decodifica UTF-8
 *      (que cubre ASCII y el castellano con tilde). Un `.tar.gz` con una clave
 *      dentro, o un fichero en UTF-16, pasan.
 *   6. **La FORMA del valor, en tres casos corrientes** — `{"tokens": ["…"]}`
 *      (la comilla corta la captura), YAML de bloque (`api_key: |` con el valor
 *      en la línea siguiente) y `ENV API_KEY valor` sin `=`. Los tres exigen
 *      parseo real de JSON/YAML/Dockerfile y no más expresiones regulares;
 *      están abiertos como **WP-U269**. El tercero cae dentro del corpus de
 *      `contexto-imagen`, o sea dentro de la mitad de imagen de CA1.
 *   7. **Un campo llamado `key` a secas.** Fuera del léxico por coste medido
 *      (+178 hallazgos sobre el árbol; ver `LEXICO_IDENTIDAD`).
 *   8. **Identidad sin forma ni nombre.** Una cadena de alta entropía en un
 *      campo llamado `blob` no la caza nada: es el precio de no usar entropía.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXCEPTIONS } from './exceptions.mjs';

/** WP-U257: una sola definición, en `reglas.mjs`. Aquí sólo se le da nombre local. */
/** @typedef {import('./reglas.mjs').GateRule} GateRule */

/**
 * @typedef {object} Ofensa
 * @property {GateRule} rule
 * @property {string} path
 * @property {number} [line]
 * @property {string} detail
 */

const AQUI = path.dirname(fileURLToPath(import.meta.url));

/**
 * Raíz por defecto. Se deriva de la posición de ESTE fichero, no se copia de
 * `scan.mjs`: importarla de allí crearía un ciclo (scan → claves → scan) y el
 * gate de un P0 no se apoya en sutilezas de inicialización de ESM.
 */
const RAIZ = path.resolve(AQUI, '../..');

/** Directorios que no se barren nunca (mismo criterio que `scan.mjs`). */
const DIRS_SALTADOS = new Set([
  'node_modules',
  '.git',
  '.worktrees',
  'dist',
  'build',
  'coverage',
  '.turbo',
  'vendor'
]);

/**
 * YA NO HAY TOPE DE INSPECCIÓN, y la constante se queda escrita para que quede
 * el registro de por qué se fue: había un tope de 8 MB que denunciaba el
 * fichero en vez de leerlo. Con el firehose cifrado en 38 MB por el README de
 * este mismo árbol, eso enrojecía estado local normal y sin secretos. Ver
 * `hallazgosEnFichero`, que lee por tramos con memoria acotada.
 *
 * @deprecated sin uso desde la devolución de U231; no reintroducir un tope sin
 * leer antes ese comentario.
 */
export const TOPE_BYTES = null;

// ---------------------------------------------------------------------------
// Léxico
// ---------------------------------------------------------------------------

/**
 * Nombres que declaran identidad. Se usa en dos sitios: el nombre de un campo
 * dentro de un fichero de volumen, y el nombre de una variable de entorno de la
 * que depende la lectura de un volumen.
 *
 * ESTABA SÓLO EN INGLÉS, y era un agujero grande en un repo escrito en
 * castellano cuya regla se llama `clave-en-volumen`. La doctrina que este
 * módulo cita habla de «**claves** de pub, tokens de registry, **credenciales**
 * de VPS» (R6:55-56): dos de esas tres palabras no las reconocía el detector.
 * Medido con el gate real sembrando en un volumen, pasaban limpios `clave`,
 * `contraseña`, `contrasena`, `secreto`, `credencial`, `auth`, `authorization`
 * y `privkey` — este último porque el ancla lo rompía (`secret` + `o` no es
 * `secreto`). Cerrado aquí; el censo de fugas vive en el test.
 *
 * `clave` A SECAS ENTRA; `key` a secas NO, y la asimetría es MEDIDA, no de
 * gusto. Mismo detector, mismo corpus —los 1741 ficheros trackeados—, moviendo
 * sólo el léxico:
 *
 *   sin `clave` ni `key` a secas ....  104 hallazgos
 *   con `clave`  (el elegido) .......  121   (+17)
 *   con `clave` y `key` .............  300  (+196)
 *
 * `key` cuesta once veces más que `clave` porque en YAML/JSON `key:` es
 * vocabulario general de mapa; `clave` tiene ese uso mucho más raro. Diecisiete
 * de más sobre el árbol entero es asumible para no perder la palabra que la
 * doctrina usa literalmente; ciento noventa y seis no lo es. El comando que
 * produce las tres cifras está en el reporte del WP.
 *
 * (Ojo: el corpus de ESTE gate no es el árbol entero sino `VOLUMES/**` y las
 * recetas de imagen, donde las tres variantes dan CERO. Las cifras de arriba
 * son la cota superior si el corpus creciera, no lo que se paga hoy.)
 */
export const LEXICO_IDENTIDAD = new RegExp(
  [
    // inglés
    'pass(?:word|phrase|wd)?',
    'pwd',
    'secrets?',
    'tokens?',
    'credentials?',
    'api[_-]?key',
    'apikey',
    'access[_-]?key',
    'secret[_-]?key',
    'private[_-]?key',
    'privkey',
    'signing[_-]?key',
    'session[_-]?key',
    'auth(?:orization|entication)?',
    'bearer',
    // castellano
    'contrase(?:ñ|n)as?',
    'secretos?',
    'secretas?',
    'credencial(?:es)?',
    // los compuestos primero: legibilidad, no corrección (la alternancia
    // retrocede sola, pero leerlo al revés confunde a quien dé de alta uno)
    'clave[_-]?(?:privada|secreta|api|de[_-]?api|maestra)',
    'claveprivada',
    'claveapi',
    'claves?',
    'semillas?'
  ].join('|'),
  'i'
);

/** El mismo léxico, anclado como palabra completa dentro de un nombre. */
const LEXICO_ANCLADO = new RegExp(`(?<![A-Za-z0-9])${LEXICO_IDENTIDAD.source}(?![A-Za-z0-9])`, 'i');

/**
 * Valores que NO son un secreto aunque estén sobre un campo de identidad. No es
 * una lista de excepciones —no exime un hallazgo— es precisión del detector:
 * `"${ZEUS_SSB_PUB_URL}"` nunca fue una credencial.
 */
const HUECOS = [
  // --- plantillas de sustitución. La primera versión sólo conocía `${VAR}`:
  //     cerraba el CASO, no la CLASE, y seguían enrojeciendo las otras tres
  //     sintaxis corrientes. Son huecos por la misma razón exacta.
  /^\$\{[^}]*\}$/, // ${VAR} — la forma que usa volumes.json
  /^\{\{[^}]*\}\}$/, // {{VAR}} — Helm, Jinja, Handlebars, GitHub Actions
  /^\$\([^)]*\)$/, // $(VAR) — Make, Azure Pipelines, sustitución de shell
  /^%[A-Za-z0-9_]+%$/, // %VAR% — cmd de Windows
  /^\$[A-Za-z_][A-Za-z0-9_]*$/, // $VAR de shell
  /^<[^>]*>$/, // <pon-aqui-lo-tuyo>
  // --- referencia a otra configuración, no un valor. `.Values.global.…` de
  //     Helm es el caso censado; se exige que empiece por punto para no
  //     tragarse por accidente una credencial que lleve puntos dentro.
  /^\.[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+$/,
  /^process\.env\./,
  // --- relleno y centinelas de una sola palabra
  /^(?:x+|\*+|\.+|-+|0+)$/i,
  /^(?:changeme|change_me|example|redacted|null|undefined|true|false|todo|tbd|none|empty|placeholder|pendiente)$/i,
  /^(?:your|my|tu|mi)[_-]/i,
  /_(?:here|aqui)$/i
];

/**
 * Palabras de configuración. Un valor en kebab/snake minúsculo que contenga
 * alguna es un CENTINELA (`inherit-from-operator-env`), no una credencial.
 *
 * Se exige una de estas palabras en vez de aceptar todo kebab minúsculo porque
 * una frase de paso de diceware —`correct-horse-battery-staple`— es kebab
 * minúsculo Y ES un secreto. Ésa es la línea, y es estrecha a propósito.
 */
const CENTINELAS =
  /(?:^|[_-])(?:inherit|inherited|default|defaults|none|disabled|enabled|env|environment|operator|external|managed|vault|unset|auto|from|via|see|ref|reference|same|inline|file|path|url|host|port|local|remote|fixture|sample|dummy|fake|test|mock)(?:$|[_-])/;

/** Un valor que es exactamente el nombre de su campo, ignorando caja y tildes. */
function sinTildes(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * ¿Es una URL de referencia (documentación, portal) y no material?
 *
 * Una URL NO es en general un hueco: un webhook de Slack ES la credencial. Por
 * eso se exige que no lleve consulta, ni fragmento, ni ningún tramo de ruta con
 * pinta de material (20+ caracteres de alfabeto de token). Así
 * `https://docs…/rotacion-de-claves` es hueco y
 * `https://hooks…/T0/B0/XXXXXXXXXXXXXXXXXXXXXXXX` no lo es.
 *
 * @param {string} v
 */
function esUrlDeReferencia(v) {
  if (!/^https?:\/\//i.test(v)) return false;
  if (/[?#]/.test(v)) return false;
  const tramos = v.replace(/^https?:\/\//i, '').split('/');
  return !tramos.some((t) => /^[A-Za-z0-9_-]{20,}$/.test(t));
}

/**
 * ¿El valor es un hueco —plantilla, referencia, centinela, texto humano— en vez
 * de material de identidad?
 *
 * `nombre` es el nombre del campo del que cuelga, y se usa para un caso que no
 * se puede decidir mirando sólo el valor: una cadena de i18n cuyo texto repite
 * su propia etiqueta («contraseña» → «Contraseña olvidada»). Ninguna credencial
 * es igual al nombre de su campo.
 *
 * @param {string} valor
 * @param {string} [nombre] nombre del campo, si se conoce
 */
export function esHueco(valor, nombre = '') {
  const v = valor.trim();
  if (v.length < 8) return true; // demasiado corto para ser una credencial
  if (HUECOS.some((re) => re.test(v))) return true;
  if (esUrlDeReferencia(v)) return true;
  if (/^[a-z][a-z0-9]*(?:[_-][a-z0-9]+)+$/.test(v) && CENTINELAS.test(v)) return true;
  if (nombre && sinTildes(v) === sinTildes(nombre)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Patrones. Cada uno con id propio: el censo de mutación de CA5 desactiva uno y
// exige que su vector se ponga verde — una regla que nadie puede matar no
// vigila nada, y una que al matarla no cambia nada es decorado.
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Patron
 * @property {string} id
 * @property {string} que
 * @property {RegExp} re
 * @property {(m: RegExpExecArray) => boolean} [valida] filtro sobre el match
 */

/** @type {readonly Patron[]} */
export const PATRONES_IDENTIDAD = Object.freeze([
  {
    id: 'pem-privada',
    que: 'bloque PEM de clave privada',
    re: /-----BEGIN(?:[A-Z0-9 ]{0,40})PRIVATE KEY-----/
  },
  {
    id: 'jwt',
    que: 'JSON Web Token (tres segmentos base64url)',
    re: /(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/
  },
  {
    id: 'url-con-credencial',
    que: 'cadena de conexión con contraseña embebida (esquema://usuario:clave@)',
    re: /(?<![A-Za-z0-9])[a-z][a-z0-9+.-]{1,20}:\/\/[^\s/@:"'<>]{1,120}:[^\s/@"'<>]{1,120}@/
  },
  {
    id: 'ssb-privada',
    que: 'clave privada ed25519 en formato `secret` de SSB',
    re: /"(?:private|secret)"\s*:\s*"[A-Za-z0-9+/=]{32,}\.ed25519"/
  },
  {
    id: 'ssb-invitacion',
    que: 'código de invitación SSB (la semilla tras `~` ES la identidad)',
    re: /\.ed25519~[A-Za-z0-9+/=]{16,}/
  },
  {
    id: 'token-de-proveedor',
    que: 'token con prefijo de proveedor conocido',
    re: /(?<![A-Za-z0-9])(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|npm_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|glpat-[A-Za-z0-9_-]{16,})(?![A-Za-z0-9])/
  },
  {
    id: 'campo-identidad',
    que: 'campo de identidad con valor literal (no es un hueco de plantilla)',
    // LAS PLANTILLAS VAN PRIMERO, y son CUATRO, no una. `}` y `)` están fuera
    // de la clase de la rama general (son delimitadores de JSON y de lista), así
    // que sin ramas propias el valor capturado se trunca —`${ZEUS_ALGO_TOKEN`,
    // `{{DB_PASSWORD`, `$(DB_PASSWORD)`— deja de parecer un hueco y enrojece.
    //
    // La primera versión añadió sólo la rama de `${VAR}`: cerró EL CASO que
    // tenía delante y no LA CLASE, y las otras tres sintaxis seguían en rojo.
    // Ésta es la clase entera, y las cuatro tienen contraprueba.
    re: new RegExp(
      `(?<![A-Za-z0-9])["']?(${LEXICO_IDENTIDAD.source})["']?\\s*[:=]\\s*["']?` +
        `(\\$\\{[^}]*\\}|\\{\\{[^}]*\\}\\}|\\$\\([^)]*\\)|%[A-Za-z0-9_]+%|[^\\s,;"'}\\])]{8,200})`,
      'i'
    ),
    // El nombre del campo (m[1]) viaja al clasificador: hay un hueco —el texto
    // de i18n que repite su propia etiqueta— que no se puede decidir mirando
    // sólo el valor.
    valida: (m) => !esHueco(m[2], m[1])
  }
]);

/**
 * Los hallazgos de un texto. Recibe la lista de patrones como PARÁMETRO —así se
 * la puede mutar desde el test sin tocar el disco— y **lanza** si esa lista
 * llegase vacía o inválida: un barrido con cero patrones devuelve cero
 * hallazgos, que es indistinguible de un árbol limpio. Ése es el fallo en
 * abierto que ya costó una devolución en este programa; aquí es ruidoso.
 *
 * @param {string} texto
 * @param {readonly Patron[]} [patrones]
 * @returns {{ id: string, que: string, line: number }[]}
 */
export function hallazgosEnTexto(texto, patrones = PATRONES_IDENTIDAD) {
  // `Object.freeze([])` sigue siendo un array: congelar la lista no la disfraza.
  if (!Array.isArray(patrones)) {
    throw new TypeError('hallazgosEnTexto: la lista de patrones no es una lista');
  }
  if (patrones.length === 0) {
    throw new TypeError(
      'hallazgosEnTexto: lista de patrones VACÍA. Un barrido sin patrones no dice ' +
        '«limpio», dice «no miré». Fallo ruidoso a propósito (WP-U231 · CA3).'
    );
  }
  /** @type {{ id: string, que: string, line: number }[]} */
  const out = [];
  const lineas = texto.split('\n');
  for (const p of patrones) {
    if (!p || typeof p.id !== 'string' || !(p.re instanceof RegExp)) {
      throw new TypeError(`hallazgosEnTexto: patrón malformado: ${JSON.stringify(p)}`);
    }
    // Multilínea: los patrones son de una línea salvo la cabecera PEM, que
    // también lo es (el bloque empieza en su propia línea).
    for (let i = 0; i < lineas.length; i += 1) {
      const m = new RegExp(p.re.source, p.re.flags.replace('g', '')).exec(lineas[i]);
      if (!m) continue;
      if (typeof p.valida === 'function' && !p.valida(m)) continue;
      out.push({ id: p.id, que: p.que, line: i + 1 });
    }
  }
  return out.sort((a, b) => a.line - b.line || a.id.localeCompare(b.id));
}

/**
 * Los hallazgos de un FICHERO, leyéndolo por tramos.
 *
 * POR QUÉ NO SE LEE ENTERO. La primera versión leía el fichero de una vez y
 * denunciaba lo que pasara de 8 MB —«no se salta en silencio, se denuncia»—.
 * Suena fail-closed y es un tiro en el pie: el README de este mismo árbol cifra
 * el firehose en **38 MB**, y `.gitignore:51` da por hecho que ese DISK puede
 * aparecer localmente. O sea que el gate enrojecía sobre estado local NORMAL,
 * sin ningún secreto, y por un motivo que el operador no puede arreglar. Es
 * exactamente la presión de desactivación contra la que avisa la cabecera de
 * este módulo, construida dentro de él.
 *
 * Ahora se lee por tramos de 1 MiB con un solape de 64 KiB, se cuentan los
 * saltos de línea para no perder el número de línea, y no hay tope: un DISK de
 * 38 MB se inspecciona entero con memoria acotada.
 *
 * LÍMITE DECLARADO: una coincidencia que se extendiera más allá del solape
 * —64 KiB— y cayera justo sobre una frontera de tramo se perdería. Ninguno de
 * los patrones de hoy puede acercarse a eso.
 *
 * @param {string} abs
 * @param {readonly Patron[]} [patrones]
 * @returns {{ id: string, que: string, line: number }[]}
 */
export function hallazgosEnFichero(abs, patrones = PATRONES_IDENTIDAD) {
  const TRAMO = 1024 * 1024;
  const SOLAPE = 64 * 1024;
  const tam = fs.statSync(abs).size;
  if (tam <= TRAMO) {
    // UTF-8, no latin1. Se leía en latin1 «porque los patrones son ASCII y así
    // byte↔carácter es 1:1», y con el léxico sólo inglés eso se sostenía. En
    // cuanto el léxico aprendió castellano dejó de sostenerse: `contraseña` en
    // un fichero UTF-8 son los bytes C3 B1, que en latin1 se leen `Ã±` y no
    // casan con nada. O sea que el campo con tilde se le escapaba al gate. Lo
    // cazó el test del léxico corriendo POR EL GATE, no el del detector puro.
    //
    // No se pierde nada al cambiar: una secuencia ASCII nunca es UTF-8
    // inválido, así que PEM, JWT y los tokens de proveedor siguen casando
    // igual dentro de un binario. UTF-16 sigue siendo punto ciego declarado.
    return hallazgosEnTexto(fs.readFileSync(abs).toString('utf8'), patrones);
  }
  const fd = fs.openSync(abs, 'r');
  try {
    const buf = Buffer.allocUnsafe(TRAMO);
    /** @type {{ id: string, que: string, line: number }[]} */
    const out = [];
    const vistos = new Set();
    let pos = 0;
    // Saltos de línea que quedan ESTRICTAMENTE antes de `pos`. Invariante: la
    // primera línea del tramo que empieza en `pos` es la global `lineaBase + 1`,
    // así que la línea global de un hallazgo es `lineaBase + h.line`. Nada más.
    // (La primera versión sumaba y luego restaba las líneas del solape, con lo
    // que las contaba dos veces: 61 726 donde tocaba 60 001. Lo cazó su test.)
    let lineaBase = 0;
    while (pos < tam) {
      const leidos = fs.readSync(fd, buf, 0, TRAMO, pos);
      if (leidos <= 0) break;
      // Ver la nota de codificación arriba. En el troceado, un carácter
      // multibyte partido por la frontera da un carácter de reemplazo en la
      // costura; el solape hace que la coincidencia se vea igual en el tramo
      // siguiente, donde ya está entera.
      const texto = buf.subarray(0, leidos).toString('utf8');
      for (const h of hallazgosEnTexto(texto, patrones)) {
        const linea = lineaBase + h.line;
        const llave = `${h.id}:${linea}`;
        if (vistos.has(llave)) continue; // el solape ve dos veces lo mismo
        vistos.add(llave);
        out.push({ id: h.id, que: h.que, line: linea });
      }
      if (pos + leidos >= tam) break;
      const avance = Math.max(1, leidos - SOLAPE);
      lineaBase += (texto.slice(0, avance).match(/\n/g) ?? []).length;
      pos += avance;
    }
    return out.sort((a, b) => a.line - b.line || a.id.localeCompare(b.id));
  } finally {
    fs.closeSync(fd);
  }
}

// ---------------------------------------------------------------------------
// La prohibición de eximir
// ---------------------------------------------------------------------------

/**
 * Motivos por los que el fichero de excepciones está fuera de contrato para una
 * de estas reglas. Devuelve strings, no ofensas: quien llama pone su propio
 * nombre de regla (WP-U257: la lista de reglas no se reescribe fuera de
 * `reglas.mjs`, tampoco en forma de tabla local).
 *
 * La lista entra por PARÁMETRO —con la real por defecto— para que la rama de
 * «no hay lista» sea demostrable desde el test. Si el módulo entero faltase,
 * el `import` de arriba revienta y `npm run gates` muere: eso ya es ruidoso por
 * construcción. Lo que había que poder probar es lo otro: que una lista
 * presente pero inservible NO se lee como «nadie eximió nada».
 *
 * @param {string} regla
 * @param {unknown} [lista]
 * @returns {string[]}
 */
export function motivosDeExcepcionProhibida(regla, lista = EXCEPTIONS) {
  if (!Array.isArray(lista)) {
    return [
      'la lista de excepciones no es una lista: sin ella no se puede afirmar que ' +
        'nadie eximió esta regla, y no poder afirmarlo es rojo (CA3 · hostil-omite)'
    ];
  }
  return lista.filter((ex) => ex && ex.rule === regla).map(
    (ex) =>
      `esta regla NO admite excepción (doctrina «sin excepción», NOTA-Z R6:55) y hay ` +
      `una anotada para ${ex.path ?? ex.pathPrefix ?? JSON.stringify(ex.pathPrefixes)}: ` +
      `«${ex.reason ?? '(sin motivo escrito)'}»`
  );
}

// ---------------------------------------------------------------------------
// Recorrido del árbol de datos
// ---------------------------------------------------------------------------

/**
 * Ruta para el informe. Relativa a la raíz cuando cuelga de ella; ABSOLUTA
 * cuando no.
 *
 * Un `../../../Users/…/Temp/…` no es una ruta, es un síntoma: fue lo que delató
 * que el camino de `--root` nunca se había ejercido de punta a punta. Un
 * barrido sobre un root de operador vive fuera del repo por definición, así que
 * ésa es la ruta que hay que imprimir.
 *
 * @param {string} base @param {string} abs
 */
function rel(base, abs) {
  const r = path.relative(base, abs).split(path.sep).join('/');
  if (r === '' || r.startsWith('../') || path.isAbsolute(r)) {
    return abs.split(path.sep).join('/');
  }
  return r;
}

/**
 * Todo lo que hay bajo un directorio de volúmenes: TODAS las extensiones, no
 * sólo fuentes. `scan.mjs` filtra por `SOURCE_EXT` y por eso no ve ni un solo
 * fichero de `VOLUMES/` — los 16 de hoy son `.json`, `.yaml`, `.md` y `.jsonl`.
 *
 * Lo que no es fichero ni directorio (enlace simbólico, fifo) se DENUNCIA en
 * vez de saltarse: un enlace a `~/.ssh/id_ed25519` dentro de un volumen es
 * exactamente el vector de este WP, y saltarlo callando sería fallo en abierto.
 *
 * @param {string} dir
 * @param {string} raiz
 * @returns {{ ficheros: string[], rarezas: { path: string, detail: string }[] }}
 */
export function recorrerVolumen(dir, base) {
  /** @type {string[]} */
  const ficheros = [];
  /** @type {{ path: string, detail: string }[]} */
  const rarezas = [];
  /** @param {string} d */
  const anda = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(d, e.name);
      if (e.isDirectory()) {
        if (DIRS_SALTADOS.has(e.name)) {
          rarezas.push({
            path: rel(base, abs),
            detail: `directorio excluido del barrido (${e.name}) DENTRO de un árbol de volúmenes: no debería existir aquí`
          });
          continue;
        }
        anda(abs);
        continue;
      }
      if (e.isFile()) {
        ficheros.push(abs);
        continue;
      }
      rarezas.push({
        path: rel(base, abs),
        detail:
          'entrada que no es fichero ni directorio (enlace simbólico u otro): el barrido no puede ' +
          'afirmar qué contiene, y un enlace a material de identidad es el vector exacto de este WP'
      });
    }
  };
  anda(dir);
  return { ficheros, rarezas };
}

// ---------------------------------------------------------------------------
// CA1 · identidad DENTRO de un volumen
// ---------------------------------------------------------------------------

/**
 * @param {{ repoRoot?: string, volumesDir?: string, baseInforme?: string, patrones?: readonly Patron[] }} [opts]
 * @returns {Ofensa[]}
 */
export function scanClaveEnVolumen(opts = {}) {
  const raiz = opts.repoRoot ?? RAIZ;
  // `base` es contra QUE se imprimen las rutas; `raiz` es donde vive el repo.
  // Separarlos es lo que permite apuntar `--root` a un arbol de operador sin que
  // el informe salga en `../../../` ni el censo busque el contrato de lectura
  // dentro de los datos del operador.
  const base = opts.baseInforme ?? raiz;
  const patrones = opts.patrones ?? PATRONES_IDENTIDAD;
  const dirVol = opts.volumesDir ?? path.join(raiz, 'VOLUMES');
  /** @type {Ofensa[]} */
  const ofensas = [];

  for (const detalle of motivosDeExcepcionProhibida('clave-en-volumen')) {
    ofensas.push({ rule: 'clave-en-volumen', path: 'scripts/gates/exceptions.mjs', detail: detalle });
  }

  // Patrones inservibles: se denuncia y se para. No se «barre igual».
  if (!Array.isArray(patrones)) {
    ofensas.push({
      rule: 'clave-en-volumen',
      path: 'scripts/gates/claves.mjs',
      detail: 'la lista de patrones de identidad no es una lista'
    });
    return ofensas;
  }
  if (patrones.length === 0) {
    ofensas.push({
      rule: 'clave-en-volumen',
      path: 'scripts/gates/claves.mjs',
      detail:
        'lista de patrones VACÍA: el barrido no puede afirmar «limpio», sólo «no miré» (CA3 · hostil-omite)'
    });
    return ofensas;
  }

  if (!fs.existsSync(dirVol)) {
    ofensas.push({
      rule: 'clave-en-volumen',
      path: rel(base, dirVol),
      detail:
        'el árbol de volúmenes NO existe: sin árbol no hay barrido, y «cero ficheros barridos» ' +
        'no es «cero secretos». Rojo por ausencia (CA3 · hostil-omite)'
    });
    return ofensas;
  }
  if (!fs.statSync(dirVol).isDirectory()) {
    ofensas.push({
      rule: 'clave-en-volumen',
      path: rel(base, dirVol),
      detail: 'la ruta del árbol de volúmenes existe pero no es un directorio'
    });
    return ofensas;
  }

  const { ficheros, rarezas } = recorrerVolumen(dirVol, base);
  for (const r of rarezas) ofensas.push({ rule: 'clave-en-volumen', path: r.path, detail: r.detail });

  // «Cero ficheros barridos» tampoco es «cero secretos». Un `volumesDir` que
  // existe pero está vacío —o que sólo trae el manifiesto— es el modo de fallo
  // natural del camino `--root`: se apunta a la carpeta equivocada, sale verde
  // y el operador se queda tranquilo. Rojo.
  if (ficheros.length === 0) {
    ofensas.push({
      rule: 'clave-en-volumen',
      path: rel(base, dirVol),
      detail:
        'el árbol de volúmenes existe pero NO tiene ni un fichero que barrer: «cero ficheros ' +
        'barridos» no es «cero secretos» (CA3 · hostil-omite). ¿Es éste el root que se quería?'
    });
    return ofensas;
  }

  for (const abs of ficheros) {
    const relPath = rel(base, abs);
    for (const h of hallazgosEnFichero(abs, patrones)) {
      ofensas.push({
        rule: 'clave-en-volumen',
        path: relPath,
        line: h.line,
        // El valor NO se transcribe: el informe del gate va a los logs de CI y
        // un gate que imprime el secreto que caza lo publica una segunda vez.
        detail: `${h.que} [patrón ${h.id}] — valor no transcrito a propósito`
      });
    }
  }
  return ofensas;
}

// ---------------------------------------------------------------------------
// CA2 · el volumen que EXIGE un secreto para leerse
// ---------------------------------------------------------------------------

/** Ficheros que forman el contrato de lectura de un volumen (API pública U200). */
const API_LECTURA = 'packages/engine/presets-sdk/src/volumes';

/** Extensiones de código del contrato de lectura. No sólo `.mjs`. */
const EXT_CODIGO = /\.(?:mjs|js|cjs|mts|cts|ts|tsx)$/i;

/**
 * Los ficheros de código bajo un directorio, RECURSIVAMENTE. La primera versión
 * hacía un `readdirSync` plano y filtraba por `.mjs`: un submódulo o un `.ts`
 * que leyera una credencial quedaba fuera del censo sin que nadie lo notara.
 *
 * @param {string} dir
 * @returns {string[]} absolutos, ordenados
 */
function ficherosDeCodigo(dir) {
  /** @type {string[]} */
  const out = [];
  /** @param {string} d */
  const anda = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (DIRS_SALTADOS.has(e.name)) continue;
      const abs = path.join(d, e.name);
      if (e.isDirectory()) anda(abs);
      else if (e.isFile() && EXT_CODIGO.test(e.name)) out.push(abs);
    }
  };
  anda(dir);
  return out;
}

/**
 * Las cuatro formas de leer el entorno. Las tres últimas se le escapaban a la
 * primera versión, que sólo conocía `process.env.X` y `process.env['X']`:
 *
 *   1 `process.env.X` y `process.env?.X`
 *   2 `process.env['X']`
 *   3 `const { X, Y } = process.env` (desestructuración)
 *   4 `process.env[loQueSea]` — DINÁMICA: no se puede enumerar
 */
const RE_LECTURA_ENV = new RegExp(
  [
    'process\\.env\\??\\.([A-Za-z_][A-Za-z0-9_]*)',
    "process\\.env\\??\\[\\s*['\"]([A-Za-z_][A-Za-z0-9_]*)['\"]\\s*\\]",
    '(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*process\\.env',
    "process\\.env\\??\\[\\s*(?!['\"])([^\\]]+)\\]"
  ].join('|'),
  'g'
);

/**
 * @typedef {object} FilaCenso
 * @property {string} id
 * @property {string[]} envs variables de entorno de las que depende su lectura
 * @property {string[]} identidades envs o campos clasificados como identidad
 * @property {string} veredicto
 * @property {number} [line] línea de la entrada dentro del manifiesto
 */

/**
 * El censo de CA2: qué volumen exige qué para ser leído. Devuelve LISTA, no
 * impresión — el veredicto de cada fila es derivado, no opinado.
 *
 * Dos superficies, porque un volumen puede exigir un secreto por dos vías:
 *   - el MANIFIESTO: cualquier `${VAR}` o campo de identidad declarado en la
 *     entrada del volumen (`VOLUMES/volumes.json`); es lo que
 *     `resolveVolume` expande en `resolve.mjs:66-75`.
 *   - el CÓDIGO de lectura: cualquier `process.env.X` que lean los módulos de
 *     `packages/engine/presets-sdk/src/volumes/`.
 *
 * @param {{ repoRoot?: string, volumesDir?: string, baseInforme?: string }} [opts]
 * @returns {{ manifiesto: string, estado: string, filas: FilaCenso[], envsDeCodigo: { name: string, path: string, line: number, clase: string }[], problemas: { path: string, detail: string }[] }}
 */
export function censarVolumenes(opts = {}) {
  const raiz = opts.repoRoot ?? RAIZ;
  // `base` es contra QUE se imprimen las rutas; `raiz` es donde vive el repo.
  // Separarlos es lo que permite apuntar `--root` a un arbol de operador sin que
  // el informe salga en `../../../` ni el censo busque el contrato de lectura
  // dentro de los datos del operador.
  const base = opts.baseInforme ?? raiz;
  const dirVol = opts.volumesDir ?? path.join(raiz, 'VOLUMES');
  const manifiestoAbs = path.join(dirVol, 'volumes.json');
  const manifiesto = rel(base, manifiestoAbs);
  /** @type {{ path: string, detail: string }[]} */
  const problemas = [];
  /** @type {FilaCenso[]} */
  const filas = [];

  // --- superficie 1: el manifiesto -----------------------------------------
  let estado = 'ok';
  if (!fs.existsSync(manifiestoAbs)) {
    estado = 'ausente';
    problemas.push({
      path: manifiesto,
      detail:
        'el manifiesto de volúmenes NO existe: sin él no hay censo posible y «cero volúmenes ' +
        'que exigen secreto» sería una afirmación sin sujeto. Rojo por ausencia (CA3)'
    });
  } else {
    let datos = null;
    try {
      datos = JSON.parse(fs.readFileSync(manifiestoAbs, 'utf8'));
    } catch (e) {
      estado = 'ilegible';
      problemas.push({ path: manifiesto, detail: `manifiesto ilegible: ${e.message}` });
    }
    if (datos !== null) {
      if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
        estado = 'malformado';
        problemas.push({ path: manifiesto, detail: 'el manifiesto no es un objeto' });
      } else if (typeof datos.volumes !== 'object' || datos.volumes === null || Array.isArray(datos.volumes)) {
        estado = 'malformado';
        problemas.push({
          path: manifiesto,
          detail:
            'el manifiesto no declara el mapa `volumes`: un censo sobre cero entradas no es un censo limpio, es un censo que no se hizo'
        });
      } else {
        const lineas = fs.readFileSync(manifiestoAbs, 'utf8').split('\n');
        for (const [id, entrada] of Object.entries(datos.volumes)) {
          if (typeof entrada !== 'object' || entrada === null) {
            problemas.push({ path: manifiesto, detail: `la entrada del volumen «${id}» no es un objeto` });
            continue;
          }
          const envs = new Set();
          const identidades = new Set();
          /** @param {unknown} nodo @param {string} camino */
          const anda = (nodo, camino) => {
            if (typeof nodo === 'string') {
              for (const m of nodo.matchAll(/\$\{([A-Za-z0-9_]+)\}/g)) {
                envs.add(m[1]);
                if (LEXICO_ANCLADO.test(m[1])) identidades.add(`env:${m[1]} (en ${camino})`);
              }
              return;
            }
            if (Array.isArray(nodo)) {
              nodo.forEach((v, i) => anda(v, `${camino}[${i}]`));
              return;
            }
            if (nodo && typeof nodo === 'object') {
              for (const [k, v] of Object.entries(nodo)) {
                if (LEXICO_ANCLADO.test(k)) identidades.add(`campo:${camino}.${k}`);
                anda(v, `${camino}.${k}`);
              }
            }
          };
          anda(entrada, id);
          // El id se ESCAPA antes de entrar en un RegExp. Sin esto, un volumen
          // llamado `demo(` lanza SyntaxError y se lleva por delante las diez
          // reglas del arnés — el fallo en abierto contra el que argumenta §3
          // de este mismo módulo, cometido dentro de él.
          const idEscapado = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const linea = lineas.findIndex((l) => new RegExp(`"${idEscapado}"\\s*:\\s*\\{`).test(l)) + 1;
          filas.push({
            id,
            envs: [...envs].sort(),
            identidades: [...identidades].sort(),
            veredicto:
              identidades.size === 0
                ? 'no exige identidad para leerse'
                : `EXIGE identidad: ${[...identidades].sort().join(', ')}`,
            ...(linea > 0 ? { line: linea } : {})
          });
        }
      }
    }
  }

  // --- superficie 2: el código de lectura -----------------------------------
  /** @type {{ name: string, path: string, line: number, clase: string }[]} */
  const envsDeCodigo = [];
  const dirApi = path.join(raiz, API_LECTURA);
  if (!fs.existsSync(dirApi)) {
    problemas.push({
      path: API_LECTURA,
      detail:
        'el contrato de lectura de volúmenes no está donde se le cita (¿movido?): sin leerlo no ' +
        'se puede afirmar que leer un volumen no pide una identidad. Rojo por ausencia (CA3)'
    });
  } else {
    for (const abs of ficherosDeCodigo(dirApi)) {
      const lineas = fs.readFileSync(abs, 'utf8').split('\n');
      lineas.forEach((l, i) => {
        for (const m of l.matchAll(RE_LECTURA_ENV)) {
          // m[1] `process.env.X` · m[2] `process.env['X']` · m[3] destructuring
          // · m[4] presente cuando el índice NO es un literal → lectura dinámica
          if (m[4] !== undefined) {
            envsDeCodigo.push({
              name: `[${m[4].trim()}]`,
              path: rel(base, abs),
              line: i + 1,
              clase: 'dinamico'
            });
            continue;
          }
          for (const name of (m[3] ?? m[1] ?? m[2]).split(',').map((s) => s.trim().split(':')[0].trim())) {
            if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) continue;
            envsDeCodigo.push({
              name,
              path: rel(base, abs),
              line: i + 1,
              clase: LEXICO_ANCLADO.test(name) ? 'identidad' : 'localizador'
            });
          }
        }
      });
    }
  }

  // Una sola lectura dinámica basta para que este censo NO sea exhaustivo, y
  // hay que decirlo aquí y no en la prosa: `resolve.mjs:71` hace
  // `process.env[envKey]`, con la clave decidida por el MANIFIESTO. O sea que
  // la superficie de env del contrato de lectura no se puede enumerar leyendo
  // el código; lo que la acota es la superficie 1. La primera versión de este
  // censo ni veía esa línea y afirmaba «hoy hay uno»: era un subconteo
  // presentado como inventario.
  const enumerable = !envsDeCodigo.some((e) => e.clase === 'dinamico');

  return { manifiesto, estado, filas, envsDeCodigo, enumerable, problemas };
}

/**
 * @param {{ repoRoot?: string, volumesDir?: string }} [opts]
 * @returns {Ofensa[]}
 */
export function scanVolumenExigeSecreto(opts = {}) {
  /** @type {Ofensa[]} */
  const ofensas = [];
  for (const detalle of motivosDeExcepcionProhibida('volumen-exige-secreto')) {
    ofensas.push({ rule: 'volumen-exige-secreto', path: 'scripts/gates/exceptions.mjs', detail: detalle });
  }
  const censo = censarVolumenes(opts);
  for (const p of censo.problemas) {
    ofensas.push({ rule: 'volumen-exige-secreto', path: p.path, detail: p.detail });
  }
  for (const fila of censo.filas) {
    if (fila.identidades.length === 0) continue;
    ofensas.push({
      rule: 'volumen-exige-secreto',
      path: censo.manifiesto,
      ...(fila.line ? { line: fila.line } : {}),
      detail: `volumen «${fila.id}» ${fila.veredicto} — un volumen que exige un secreto para leerse está mal diseñado (NOTA-Z R6:58-59)`
    });
  }
  for (const env of censo.envsDeCodigo) {
    if (env.clase !== 'identidad') continue;
    ofensas.push({
      rule: 'volumen-exige-secreto',
      path: env.path,
      line: env.line,
      detail: `el contrato de lectura de volúmenes lee process.env.${env.name}, que es material de identidad: leer un volumen no puede pedir una credencial`
    });
  }
  return ofensas;
}

// ---------------------------------------------------------------------------
// CA1 (segunda mitad) · el contexto de construcción de una imagen
// ---------------------------------------------------------------------------

/**
 * Rutas que un `.dockerignore` DEBE excluir del contexto, cada una con el
 * motivo por el que porta identidad. No es una lista de gustos: son las tres
 * que este árbol ya mantiene fuera de git por la misma razón.
 */
export const RUTAS_FUERA_DEL_CONTEXTO = Object.freeze([
  { ruta: '.env', porque: 'es donde vive la identidad del operador (.gitignore:74; .env.example es la plantilla, no el fichero)' },
  { ruta: 'VOLUMES/DISK_01', porque: 'slot de datos vivos, gitignorado por completo (.gitignore:51)' },
  { ruta: 'VOLUMES/DISK_04', porque: 'slot de datos vivos del pub SSB, gitignorado por completo (.gitignore:52)' }
]);

/**
 * ¿El patrón de `.dockerignore` alcanza esta ruta?
 *
 * El comodín doble matchea CERO o más directorios, no «uno o más»: la forma
 * «doble asterisco, barra, .env» cubre el `.env` de la raíz, y traducirla
 * exigiendo la barra lo dejaba fuera —el vector que este gate existe para
 * cerrar—. Lo cazó la contraprueba del `.dockerignore` bien escrito, que salía
 * roja con la traducción ingenua.
 *
 * (Los comodines se nombran en palabras y no en símbolos porque su secuencia
 * literal cierra este mismo bloque de comentario. La primera versión los
 * escribió en símbolos y los separó con un espacio de ancho cero, que es
 * invisible al leer y `no-irregular-whitespace` en `npm run lint`. Fue el
 * único fichero de `scripts/gates/` que rompió la línea base del lint.)
 *
 * @param {string} patron
 * @param {string} ruta
 */
function patronCubre(patron, ruta) {
  const p = patron
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  if (p === '') return false;
  let re = '';
  // Se tokeniza en «dos asteriscos y barra», «dos asteriscos», «un asterisco»,
  // «interrogante», CLASE DE CARACTERES o tramo literal. El tramo literal se
  // traga la barra que precede a los dos asteriscos, de modo que VOLUMES/**
  // sale como VOLUMES/.*: cubre lo que cuelga y no el directorio en si, que es
  // la semantica de Docker.
  //
  // La clase `[...]` es de Go `filepath.Match`, que es lo que Docker usa. La
  // primera version la escapaba como literal, asi que un `.dockerignore`
  // CORRECTO con `VOLUMES/DISK_0[14]` se leia como «no excluye DISK_01» y salia
  // rojo. Falso positivo sobre configuracion buena, que es la peor clase.
  for (const t of p.match(/\*\*\/|\*\*|\*|\?|\[!?\]?[^\]]*\]|[^*?[]+/g) ?? []) {
    if (t === '**/') re += '(?:.*/)?';
    else if (t === '**') re += '.*';
    else if (t === '*') re += '[^/]*';
    else if (t === '?') re += '[^/]';
    else if (t.startsWith('[') && t.endsWith(']')) re += t.startsWith('[!') ? `[^${t.slice(2, -1)}]` : t;
    else re += t.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '(?:/.*)?$').test(ruta);
}

/**
 * ¿Queda esta ruta FUERA del contexto de imagen, según las reglas dadas?
 *
 * Docker aplica **la última regla que casa**, no «alguna excluye y alguna
 * re-incluye». La primera version modelaba eso con dos `some()` independientes
 * y por eso daba falso positivo sobre un `.dockerignore` correcto que pusiera
 * la re-inclusion ANTES de la exclusion —donde el orden dice que gana la
 * exclusion—. Se cambia el modelo entero en vez de parchear el sintoma: una
 * pasada, la ultima que casa manda.
 *
 * Se considera que casa tambien la re-inclusion de un TROZO de lo excluido
 * (`!VOLUMES/DISK_01/semillas`): un trozo de un disco vivo dentro de la imagen
 * es el mismo fallo que el disco entero.
 *
 * @param {string[]} reglas lineas utiles del .dockerignore, en orden
 * @param {string} ruta
 * @returns {{ fuera: boolean, decide: string|null }}
 */
function quedaFueraDelContexto(reglas, ruta) {
  let fuera = false;
  let decide = null;
  for (const r of reglas) {
    const niega = r.startsWith('!');
    const patron = niega ? r.slice(1) : r;
    const casa = niega
      ? patronCubre(patron, ruta) || patronCubre(ruta, patron)
      : patronCubre(patron, ruta);
    if (!casa) continue;
    fuera = !niega;
    decide = r;
  }
  return { fuera, decide };
}

/**
 * Ficheros que declaran una imagen. Hoy este barrido devuelve CERO sobre este
 * árbol —medido en `test/gates/claves.test.mjs`, no supuesto— y por eso la
 * regla está ARMADA Y SIN DISPARAR. El día que alguien añada la primera receta,
 * la segunda puerta ya está vigilada; es exactamente la lección de
 * `sincronia/notas/NOTA-Z-2026-07-26-R7-matriz-migracion-y-loadstartpack.md:71-74`.
 *
 * Un directorio ILEGIBLE se denuncia, no se traga. La primera versión hacía
 * `catch { return; }` y seguía como si nada: asimétrico con `recorrerVolumen`,
 * que denuncia cualquier rareza, y fallo en abierto de manual — «no pude mirar»
 * saliendo como «no hay nada».
 *
 * @param {string} raiz
 * @returns {{ recetas: string[], rarezas: { path: string, detail: string }[] }}
 */
export function buscarDockerfiles(raiz, base = raiz) {
  /** @type {string[]} */
  const recetas = [];
  /** @type {{ path: string, detail: string }[]} */
  const rarezas = [];
  /** @param {string} d */
  const anda = (d) => {
    let entradas;
    try {
      entradas = fs.readdirSync(d, { withFileTypes: true });
    } catch (e) {
      rarezas.push({
        path: rel(base, d),
        detail:
          `directorio ilegible durante la búsqueda de recetas de imagen (${e.code ?? e.message}): ` +
          'no se puede afirmar que no haya un Dockerfile dentro'
      });
      return;
    }
    for (const e of entradas.sort((a, b) => a.name.localeCompare(b.name))) {
      if (DIRS_SALTADOS.has(e.name)) continue;
      const abs = path.join(d, e.name);
      if (e.isDirectory()) {
        anda(abs);
        continue;
      }
      if (!e.isFile()) continue;
      if (
        /^(?:dockerfile|containerfile)(?:\..+)?$/i.test(e.name) ||
        /\.(?:dockerfile|containerfile)$/i.test(e.name)
      ) {
        recetas.push(abs);
      }
    }
  };
  anda(raiz);
  return { recetas, rarezas };
}

/**
 * @param {{ repoRoot?: string, patrones?: readonly Patron[] }} [opts]
 * @returns {Ofensa[]}
 */
export function scanContextoImagen(opts = {}) {
  const raiz = opts.repoRoot ?? RAIZ;
  // `base` es contra QUE se imprimen las rutas; `raiz` es donde vive el repo.
  // Separarlos es lo que permite apuntar `--root` a un arbol de operador sin que
  // el informe salga en `../../../` ni el censo busque el contrato de lectura
  // dentro de los datos del operador.
  const base = opts.baseInforme ?? raiz;
  const patrones = opts.patrones ?? PATRONES_IDENTIDAD;
  /** @type {Ofensa[]} */
  const ofensas = [];
  for (const detalle of motivosDeExcepcionProhibida('contexto-imagen')) {
    ofensas.push({ rule: 'contexto-imagen', path: 'scripts/gates/exceptions.mjs', detail: detalle });
  }

  const { recetas, rarezas } = buscarDockerfiles(raiz, base);
  for (const r of rarezas) ofensas.push({ rule: 'contexto-imagen', path: r.path, detail: r.detail });

  for (const abs of recetas) {
    const relDockerfile = rel(base, abs);
    // (a) identidad escrita DENTRO del Dockerfile (ENV/ARG con valor).
    for (const h of hallazgosEnFichero(abs, patrones)) {
      ofensas.push({
        rule: 'contexto-imagen',
        path: relDockerfile,
        line: h.line,
        detail: `${h.que} [patrón ${h.id}] en la receta de imagen — valor no transcrito a propósito`
      });
    }

    // (b) la SEGUNDA PUERTA.
    //
    // EL CONTEXTO NO SE PUEDE ADIVINAR: lo fija quien lanza `docker build`, y
    // el `.dockerignore` que Docker lee es el del CONTEXTO, no el de al lado
    // del Dockerfile. La primera versión asumía «el directorio del Dockerfile»
    // y con eso certificaba VERDE un `ops/.dockerignore` que un
    // `docker build -f ops/Dockerfile .` ni abriría. «No mira» y «mira el
    // fichero equivocado y dice OK» no son lo mismo, y lo segundo es peor.
    //
    // Se exige por tanto que TODO contexto plausible esté cerrado: el
    // directorio de la receta y la raíz del repo. Un contexto que no sea
    // ninguno de los dos sigue sin modelarse, y sigue declarado.
    const candidatos = [...new Set([path.dirname(abs), raiz])];
    for (const dirContexto of candidatos) {
      const di = path.join(dirContexto, '.dockerignore');
      const relDi = rel(base, di);
      const comoSeLanza =
        dirContexto === raiz
          ? `docker build -f ${relDockerfile} .` // contexto = raíz
          : `docker build ${rel(base, dirContexto)}`; // contexto = dir de la receta
      if (!fs.existsSync(di)) {
        ofensas.push({
          rule: 'contexto-imagen',
          path: relDockerfile,
          detail:
            `no hay .dockerignore en un contexto plausible (${relDi}, el de \`${comoSeLanza}\`): ` +
            'sin él el contexto es el árbol entero, .env y los DISK vivos incluidos. ' +
            '«El .dockerignore es la segunda puerta y es la que falla» (NOTA-Z R7:73)'
        });
        continue;
      }
      const reglas = fs
        .readFileSync(di, 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l !== '' && !l.startsWith('#'));
      if (reglas.length === 0) {
        ofensas.push({
          rule: 'contexto-imagen',
          path: relDi,
          detail: '.dockerignore presente pero SIN reglas: la puerta está puesta y abierta (CA3 · hostil-omite)'
        });
        continue;
      }
      for (const { ruta, porque } of RUTAS_FUERA_DEL_CONTEXTO) {
        const { fuera, decide } = quedaFueraDelContexto(reglas, ruta);
        if (fuera) continue;
        ofensas.push({
          rule: 'contexto-imagen',
          path: relDi,
          detail: decide
            ? `deja \`${ruta}\` DENTRO del contexto de imagen: la última regla que casa es \`${decide}\` — ${porque}`
            : `no excluye \`${ruta}\` del contexto de imagen — ${porque}`
        });
      }
    }
  }
  return ofensas;
}

// ---------------------------------------------------------------------------
// CLI. El gate del repo va por `npm run gates` (runAllGates); esto es para
// apuntar a un root de operador, que es donde vive el árbol de datos VIVO.
//
//   --censo    [--root <ruta>]   CA2: qué exige cada volumen para ser leído
//   --barrido  [--root <ruta>]   CA1: identidad DENTRO del árbol de datos
//   --root <ruta>                sin más banderas, hace los dos
//
// POR QUÉ EXISTE `--barrido`. La primera versión sólo cableaba `--root` al
// censo, y el censo es CA2. O sea que la mitigación que este mismo módulo y el
// `VOLUMES/README.md` le ofrecían al operador para cerrar el límite grande
// —«apúntalo a tu root»— respondía VERDE sobre un root con una clave sembrada,
// porque el barrido de CONTENIDO no tenía CLI ninguno. Un límite declarado
// sobre una mitigación que no existe no es un límite declarado: es un falso
// verde con documentación.
// ---------------------------------------------------------------------------

/** @param {ReturnType<typeof censarVolumenes>} censo */
export function formatearCenso(censo) {
  const out = [`manifiesto: ${censo.manifiesto} (estado: ${censo.estado})`, ''];
  out.push('volumen              | envs que exige su lectura            | veredicto');
  out.push('---------------------|--------------------------------------|----------');
  for (const f of censo.filas) {
    out.push(`${f.id.padEnd(20)} | ${(f.envs.join(', ') || '(ninguno)').padEnd(36)} | ${f.veredicto}`);
  }
  out.push('');
  out.push(`contrato de lectura (${API_LECTURA}) — process.env leídos:`);
  if (censo.envsDeCodigo.length === 0) out.push('  (ninguno)');
  for (const e of censo.envsDeCodigo) {
    out.push(`  ${e.name} — ${e.clase} — ${e.path}:${e.line}`);
  }
  if (!censo.enumerable) {
    out.push(
      '  ⚠ hay lectura DINÁMICA de entorno: esta superficie NO es enumerable leyendo el código.',
      '    La clave la decide el manifiesto, así que lo que acota de verdad es la tabla de arriba.'
    );
  }
  out.push('');
  out.push(
    censo.problemas.length === 0
      ? 'problemas: 0'
      : `problemas: ${censo.problemas.length}\n${censo.problemas.map((p) => `  ${p.path} — ${p.detail}`).join('\n')}`
  );
  const exigentes = censo.filas.filter((f) => f.identidades.length > 0);
  out.push('');
  out.push(
    exigentes.length === 0
      ? 'volúmenes que EXIGEN una identidad para leerse: 0 (lista vacía, no impresión)'
      : `volúmenes que EXIGEN una identidad para leerse: ${exigentes.map((f) => f.id).join(', ')}`
  );
  return out.join('\n');
}

const USO = [
  'uso:',
  '  node scripts/gates/claves.mjs --censo   [--root <ruta a un arbol VOLUMES>]',
  '  node scripts/gates/claves.mjs --barrido [--root <ruta a un arbol VOLUMES>]',
  '  node scripts/gates/claves.mjs --root <ruta>          (censo + barrido)',
  '',
  'salida: 0 limpio · 1 hay hallazgos o problemas · 2 error de uso'
].join('\n');

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const iRoot = args.indexOf('--root');
  let opts = {};
  if (iRoot >= 0) {
    const valor = args[iRoot + 1];
    // `--root` sin valor lanzaba un TypeError de `path.resolve(undefined)`. Un
    // error de uso se contesta con el uso, no con una traza.
    if (!valor || valor.startsWith('--')) {
      console.error('error: `--root` necesita una ruta.\n');
      console.error(USO);
      process.exit(2);
    }
    const volumesDir = path.resolve(valor);
    if (!fs.existsSync(volumesDir)) {
      console.error(`error: la ruta de --root no existe: ${volumesDir}\n`);
      console.error(USO);
      process.exit(2);
    }
    // `repoRoot` pasa a ser el propio root: así las rutas del informe salen
    // relativas a lo que el operador apuntó y no como `../../../…`.
    opts = { volumesDir, repoRoot: volumesDir };
  }

  const quiereCenso = args.includes('--censo');
  const quiereBarrido = args.includes('--barrido');
  const ambos = !quiereCenso && !quiereBarrido && iRoot >= 0;
  if (!quiereCenso && !quiereBarrido && !ambos) {
    console.log(USO);
    process.exit(2);
  }

  let sucio = false;
  if (quiereCenso || ambos) {
    const censo = censarVolumenes(opts);
    console.log(formatearCenso(censo));
    if (censo.problemas.length > 0 || censo.filas.some((f) => f.identidades.length > 0)) sucio = true;
  }
  if (quiereBarrido || ambos) {
    if (quiereCenso || ambos) console.log('');
    // `repoRoot` se ajusta arriba, así que el barrido mira el root apuntado y
    // no `<root>/VOLUMES`: un root de operador YA es el árbol de volúmenes.
    const ofensas = scanClaveEnVolumen(opts);
    console.log(`barrido de identidad: ${ofensas.length === 0 ? 'limpio (0 hallazgos)' : `${ofensas.length} hallazgo(s)`}`);
    for (const o of ofensas) {
      console.log(`  ${o.path}${o.line != null ? `:${o.line}` : ''} — ${o.detail}`);
    }
    if (ofensas.length > 0) sucio = true;
  }
  process.exit(sucio ? 1 : 0);
}

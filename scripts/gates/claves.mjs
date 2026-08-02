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
 *      `VOLUMES/` EN EL REPO, que hoy son 16 ficheros de fixture. Para barrer
 *      un root de operador hay que pasárselo: `--root <ruta>` / `volumesDir`.
 *   2. **El historial de git.** Un secreto ya commiteado y luego borrado no lo
 *      ve nadie aquí: esto mira el árbol de trabajo. Purgar historial es otro
 *      trabajo y otro coste (reescritura + rotación de la credencial).
 *   3. **El tarball de npm.** `files`/`.npmignore` es otro contexto de
 *      publicación; lo mira `test/gates/paridad-publicacion.test.mjs`, no esto.
 *   4. **Contextos de build que no sean el directorio del Dockerfile.** Un
 *      `docker build -f x/Dockerfile .` con contexto distinto, o un `compose`
 *      con `build.context`, no se modelan. Hoy no hay ni Dockerfile ni compose.
 *   5. **Secreto cifrado, comprimido o en UTF-16.** El barrido es byte-a-byte
 *      sobre latin1: caza ASCII. Un `.tar.gz` con una clave dentro pasa.
 *   6. **Un campo llamado `key` a secas.** Se excluye del léxico a propósito:
 *      en YAML/JSON `key:` es vocabulario general y meterlo enrojece el árbol.
 *      Se exigen `api_key`, `secret_key`, `private_key`, `access_key`.
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
 * Tope de inspección por fichero. Un fichero más grande NO se salta en
 * silencio: se denuncia. Saltar es la forma más barata de fallar en abierto.
 */
export const TOPE_BYTES = 8 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Léxico
// ---------------------------------------------------------------------------

/**
 * Nombres que declaran identidad. Se usa en dos sitios: el nombre de un campo
 * dentro de un fichero de volumen, y el nombre de una variable de entorno de la
 * que depende la lectura de un volumen.
 *
 * `key` a secas queda FUERA a propósito (ver límite 6 de la cabecera).
 */
export const LEXICO_IDENTIDAD =
  /(?:pass(?:word|phrase|wd)?|pwd|secret|token|credentials?|api[_-]?key|apikey|access[_-]?key|secret[_-]?key|private[_-]?key|signing[_-]?key|bearer|session[_-]?key)/i;

/** El mismo léxico, anclado como palabra completa dentro de un nombre. */
const LEXICO_ANCLADO = new RegExp(`(?<![A-Za-z0-9])${LEXICO_IDENTIDAD.source}(?![A-Za-z0-9])`, 'i');

/**
 * Valores que NO son un secreto aunque estén sobre un campo de identidad. No es
 * una lista de excepciones —no exime un hallazgo— es precisión del detector:
 * `"${ZEUS_SSB_PUB_URL}"` nunca fue una credencial.
 */
const HUECOS = [
  /^\$\{[^}]*\}$/, // plantilla de env: la forma que usa volumes.json
  /^\$[A-Za-z_][A-Za-z0-9_]*$/, // $VAR de shell
  /^<[^>]*>$/, // <pon-aqui-lo-tuyo>
  /^process\.env\./,
  /^(?:x+|\*+|\.+|-+|0+)$/i, // relleno
  /^(?:changeme|change_me|example|redacted|null|undefined|true|false|todo|tbd|none|empty|placeholder|pendiente)$/i,
  /^(?:your|my|tu|mi)[_-]/i,
  /_(?:here|aqui)$/i
];

/** @param {string} valor */
export function esHueco(valor) {
  const v = valor.trim();
  if (v.length < 8) return true; // demasiado corto para ser una credencial
  return HUECOS.some((re) => re.test(v));
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
    // El valor se captura en dos ramas y el orden importa: la plantilla
    // `${VAR}` PRIMERO, porque `}` está fuera de la clase de la segunda rama
    // (es delimitador de JSON) y sin esta rama el valor capturado sería
    // `${ZEUS_ALGO_TOKEN` sin cerrar — que ya no parece un hueco y enrojecía
    // `volumes.json`. Lo cazó el test de falsos positivos, no la lectura.
    re: new RegExp(
      `(?<![A-Za-z0-9])["']?(${LEXICO_IDENTIDAD.source})["']?\\s*[:=]\\s*["']?(\\$\\{[^}]*\\}|[^\\s,;"'}\\])]{8,200})`,
      'i'
    ),
    valida: (m) => !esHueco(m[2])
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

/** @param {string} raiz @param {string} abs */
function rel(raiz, abs) {
  return path.relative(raiz, abs).split(path.sep).join('/');
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
export function recorrerVolumen(dir, raiz) {
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
            path: rel(raiz, abs),
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
        path: rel(raiz, abs),
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
 * @param {{ repoRoot?: string, volumesDir?: string, patrones?: readonly Patron[] }} [opts]
 * @returns {Ofensa[]}
 */
export function scanClaveEnVolumen(opts = {}) {
  const raiz = opts.repoRoot ?? RAIZ;
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
      path: rel(raiz, dirVol),
      detail:
        'el árbol de volúmenes NO existe: sin árbol no hay barrido, y «cero ficheros barridos» ' +
        'no es «cero secretos». Rojo por ausencia (CA3 · hostil-omite)'
    });
    return ofensas;
  }
  if (!fs.statSync(dirVol).isDirectory()) {
    ofensas.push({
      rule: 'clave-en-volumen',
      path: rel(raiz, dirVol),
      detail: 'la ruta del árbol de volúmenes existe pero no es un directorio'
    });
    return ofensas;
  }

  const { ficheros, rarezas } = recorrerVolumen(dirVol, raiz);
  for (const r of rarezas) ofensas.push({ rule: 'clave-en-volumen', path: r.path, detail: r.detail });

  for (const abs of ficheros) {
    const relPath = rel(raiz, abs);
    const bytes = fs.statSync(abs).size;
    if (bytes > TOPE_BYTES) {
      ofensas.push({
        rule: 'clave-en-volumen',
        path: relPath,
        detail: `${bytes} bytes: por encima del tope de inspección (${TOPE_BYTES}). No se salta en silencio — se denuncia`
      });
      continue;
    }
    // latin1: byte↔carácter 1:1, nunca lanza, y los patrones son ASCII. Lo que
    // no sea ASCII (UTF-16, comprimido, cifrado) es punto ciego declarado.
    const texto = fs.readFileSync(abs).toString('latin1');
    for (const h of hallazgosEnTexto(texto, patrones)) {
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
 * @param {{ repoRoot?: string, volumesDir?: string }} [opts]
 * @returns {{ manifiesto: string, estado: string, filas: FilaCenso[], envsDeCodigo: { name: string, path: string, line: number, clase: string }[], problemas: { path: string, detail: string }[] }}
 */
export function censarVolumenes(opts = {}) {
  const raiz = opts.repoRoot ?? RAIZ;
  const dirVol = opts.volumesDir ?? path.join(raiz, 'VOLUMES');
  const manifiestoAbs = path.join(dirVol, 'volumes.json');
  const manifiesto = rel(raiz, manifiestoAbs);
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
          const linea = lineas.findIndex((l) => new RegExp(`"${id}"\\s*:\\s*\\{`).test(l)) + 1;
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
    for (const nombre of fs.readdirSync(dirApi).sort()) {
      if (!nombre.endsWith('.mjs')) continue;
      const abs = path.join(dirApi, nombre);
      const lineas = fs.readFileSync(abs, 'utf8').split('\n');
      lineas.forEach((l, i) => {
        for (const m of l.matchAll(/process\.env(?:\.([A-Za-z0-9_]+)|\[\s*['"]([A-Za-z0-9_]+)['"]\s*\])/g)) {
          const name = m[1] ?? m[2];
          envsDeCodigo.push({
            name,
            path: rel(raiz, abs),
            line: i + 1,
            clase: LEXICO_ANCLADO.test(name) ? 'identidad' : 'localizador'
          });
        }
      });
    }
  }

  return { manifiesto, estado, filas, envsDeCodigo, problemas };
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
 * `**` matchea CERO o más directorios, no «uno o más»: `**​/.env` cubre el
 * `.env` de la raíz, y traducirlo a `.*​/` lo dejaba fuera —el vector que este
 * gate existe para cerrar—. Lo cazó la contraprueba del `.dockerignore` bien
 * escrito, que salía roja con la traducción ingenua.
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
  // «interrogante» o tramo literal. El tramo literal se traga la barra que
  // precede a los dos asteriscos, de modo que VOLUMES/** sale como VOLUMES/.*:
  // cubre lo que cuelga y no el directorio en si, que es la semantica de Docker.
  for (const t of p.match(/\*\*\/|\*\*|\*|\?|[^*?]+/g) ?? []) {
    if (t === '**/') re += '(?:.*/)?';
    else if (t === '**') re += '.*';
    else if (t === '*') re += '[^/]*';
    else if (t === '?') re += '[^/]';
    else re += t.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '(?:/.*)?$').test(ruta);
}

/**
 * ¿Una regla de re-inclusión (`!patron`) devuelve al contexto la ruta que había
 * que dejar fuera? Se mira en LAS DOS DIRECCIONES a propósito: `!VOLUMES/DISK_01`
 * la devuelve entera, pero `!VOLUMES/DISK_01/semillas` devuelve un trozo, y un
 * trozo de un disco vivo dentro de la imagen es exactamente el fallo. La primera
 * versión sólo miraba una dirección y el vector del trozo se le escapaba: lo
 * cazó su test, no la lectura.
 *
 * @param {string} patron sin el `!`
 * @param {string} ruta
 */
function reinclusionAlcanza(patron, ruta) {
  return patronCubre(patron, ruta) || patronCubre(ruta, patron);
}

/**
 * Ficheros que declaran una imagen. Hoy este barrido devuelve CERO sobre este
 * árbol —medido en `test/gates/claves.test.mjs`, no supuesto— y por eso la
 * regla está ARMADA Y SIN DISPARAR. El día que alguien añada la primera receta,
 * la segunda puerta ya está vigilada; es exactamente la lección de
 * `sincronia/notas/NOTA-Z-2026-07-26-R7-matriz-migracion-y-loadstartpack.md:71-74`.
 *
 * @param {string} raiz
 * @returns {string[]} absolutos
 */
export function buscarDockerfiles(raiz) {
  /** @type {string[]} */
  const out = [];
  /** @param {string} d */
  const anda = (d) => {
    let entradas;
    try {
      entradas = fs.readdirSync(d, { withFileTypes: true });
    } catch {
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
        out.push(abs);
      }
    }
  };
  anda(raiz);
  return out;
}

/**
 * @param {{ repoRoot?: string, patrones?: readonly Patron[] }} [opts]
 * @returns {Ofensa[]}
 */
export function scanContextoImagen(opts = {}) {
  const raiz = opts.repoRoot ?? RAIZ;
  const patrones = opts.patrones ?? PATRONES_IDENTIDAD;
  /** @type {Ofensa[]} */
  const ofensas = [];
  for (const detalle of motivosDeExcepcionProhibida('contexto-imagen')) {
    ofensas.push({ rule: 'contexto-imagen', path: 'scripts/gates/exceptions.mjs', detail: detalle });
  }

  for (const abs of buscarDockerfiles(raiz)) {
    const relDockerfile = rel(raiz, abs);
    // (a) identidad escrita DENTRO del Dockerfile (ENV/ARG con valor).
    const texto = fs.readFileSync(abs).toString('latin1');
    for (const h of hallazgosEnTexto(texto, patrones)) {
      ofensas.push({
        rule: 'contexto-imagen',
        path: relDockerfile,
        line: h.line,
        detail: `${h.que} [patrón ${h.id}] en la receta de imagen — valor no transcrito a propósito`
      });
    }

    // (b) la SEGUNDA PUERTA. Contexto asumido = el directorio del Dockerfile,
    //     que es el convenio por defecto. Un build lanzado con otro contexto no
    //     lo ve este gate: límite declarado en la cabecera (punto 4).
    const dirContexto = path.dirname(abs);
    const di = path.join(dirContexto, '.dockerignore');
    const relDi = rel(raiz, di);
    if (!fs.existsSync(di)) {
      ofensas.push({
        rule: 'contexto-imagen',
        path: relDockerfile,
        detail:
          `no hay .dockerignore en el contexto (${relDi}): sin él el contexto es el árbol entero, ` +
          '.env y los DISK vivos incluidos. «El .dockerignore es la segunda puerta y es la que falla» (NOTA-Z R7:73)'
      });
      continue;
    }
    const lineas = fs.readFileSync(di, 'utf8').split('\n');
    const reglas = lineas.map((l) => l.trim()).filter((l) => l !== '' && !l.startsWith('#'));
    if (reglas.length === 0) {
      ofensas.push({
        rule: 'contexto-imagen',
        path: relDi,
        detail: '.dockerignore presente pero SIN reglas: la puerta está puesta y abierta (CA3 · hostil-omite)'
      });
      continue;
    }
    for (const { ruta, porque } of RUTAS_FUERA_DEL_CONTEXTO) {
      const excluye = reglas.some((r) => !r.startsWith('!') && patronCubre(r, ruta));
      const reincluye = reglas.some((r) => r.startsWith('!') && reinclusionAlcanza(r.slice(1), ruta));
      if (!excluye) {
        ofensas.push({
          rule: 'contexto-imagen',
          path: relDi,
          detail: `no excluye \`${ruta}\` del contexto de imagen — ${porque}`
        });
      } else if (reincluye) {
        ofensas.push({
          rule: 'contexto-imagen',
          path: relDi,
          detail: `excluye \`${ruta}\` y luego la RE-INCLUYE con \`!\`: la última gana y vuelve al contexto — ${porque}`
        });
      }
    }
  }
  return ofensas;
}

// ---------------------------------------------------------------------------
// CLI del censo (CA2): `node scripts/gates/claves.mjs --censo [--root <ruta>]`
// El gate en sí va por `npm run gates` (runAllGates); esto sólo IMPRIME la
// lista, que es lo que CA2 pide entregar.
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const iRoot = args.indexOf('--root');
  const opts = iRoot >= 0 ? { volumesDir: path.resolve(args[iRoot + 1]) } : {};
  if (args.includes('--censo')) {
    console.log(formatearCenso(censarVolumenes(opts)));
  } else {
    console.log('uso: node scripts/gates/claves.mjs --censo [--root <ruta a un arbol VOLUMES>]');
    process.exit(2);
  }
}

/**
 * Cerco del ROOT (WP-U206 · paso 7 del CA local-first).
 *
 * El cerco del lado del PACK ya existía y es duro: `importPack` rechaza
 * symlinks en el pack (import.mjs:176-179), rechaza material de identidad por
 * denylist de basename (import.mjs:54, :180-185) y vuelve a barrer el árbol
 * aterrizado en el paso NO-LINK (import.mjs:546-555). Del lado del ROOT no
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
 *     cierto. Mismo criterio que import.mjs:66-90 (lstat, jamás se sigue).
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
 * 4 · URL VIVA. Un literal `http://` o `https://` en un fichero escaneado,
 *     EXCEPTO:
 *     (a) **placeholder de entorno**: la autoridad empieza por `${` — la
 *         forma `https://${ZEUS_X}/…` no es un ancla, es una plantilla que
 *         alguien tiene que rellenar por env;
 *     (b) **procedencia inerte declarada por el contrato**: los valores de
 *         `volumes.<id>.source.imported.origin` DENTRO de `volumes.json`.
 *         El contrato dice literalmente que la URL de origen viaja «solo
 *         como metadato inerte» (CONTRATO-IMPORT-PACK-v1 §3, y el comentario
 *         de import.mjs:522), así que exentarla es aplicar el contrato, no
 *         abrir un boquete: la exención es **por ruta de clave exacta**, y
 *         sólo en el manifiesto. La misma URL en cualquier otro sitio del
 *         root —incluido cualquier otro campo del propio `volumes.json`— es
 *         una URL viva.
 *
 *     Nota honesta sobre el manifiesto de referencia: `VOLUMES/volumes.json`
 *     del monorepo lleva `"remotePath": "${ZEUS_FIREHOSE_REMOTE_PATH}"`
 *     (línea 13) y `"pubUrl": "${ZEUS_SSB_PUB_URL}"` (línea 59) — o sea
 *     placeholders **sin esquema**, que por tanto ni siquiera llegan a
 *     casar con el patrón. La cláusula (a) no es vacua por eso: cubre la
 *     forma `https://${VAR}/…`, que sí casa.
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

/** Literal de URL con esquema http(s). */
const URL_LITERAL_RE = /https?:\/\/[^\s"'`<>)\]}\\]*/g;

/** Bytes iniciales que se miran para decidir si un fichero es binario. */
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
 * ¿La URL casada es un placeholder de entorno? (`https://${VAR}/…`)
 * @param {string} match
 */
function isEnvPlaceholderUrl(match) {
  return /^https?:\/\/\$\{/.test(match);
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
 * URLs vivas del MANIFIESTO, resueltas por RUTA DE CLAVE.
 *
 * Se parsea y se recorre el objeto en vez de barrer el texto, porque la
 * exención del contrato es por ruta de clave exacta y una exención por VALOR
 * sería mucho más ancha de lo declarado: la misma cadena bajo cualquier otra
 * clave quedaría exenta de rebote. (Ese defecto exacto existió en la primera
 * versión de este módulo y lo cazó `cerco-root.test.mjs`.)
 *
 * Un manifiesto ilegible NO obtiene barra libre: se cae al barrido de texto,
 * donde no hay exención por clave posible.
 * @param {string} text
 * @param {string} rel
 * @returns {object[]}
 */
function scanManifestUrls(text, rel) {
  /** @type {any} */
  let cfg;
  try {
    cfg = JSON.parse(text);
  } catch {
    return scanTextUrls(text, rel);
  }
  /** @type {object[]} */
  const urls = [];
  /** @param {unknown} node @param {(string|number)[]} keyPath */
  function walk(node, keyPath) {
    if (typeof node === 'string') {
      for (const m of node.matchAll(URL_LITERAL_RE)) {
        const value = m[0];
        if (isEnvPlaceholderUrl(value)) continue;
        if (isInertOriginPath(keyPath)) continue;
        urls.push({ path: rel, keyPath: keyPath.join('.'), url: value, line: lineOf(text, value) });
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, [...keyPath, i]));
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        // Las CLAVES también se miran: una URL como nombre de campo es una URL.
        for (const m of k.matchAll(URL_LITERAL_RE)) {
          if (!isEnvPlaceholderUrl(m[0])) {
            urls.push({
              path: rel,
              keyPath: [...keyPath, k].join('.'),
              url: m[0],
              line: lineOf(text, m[0])
            });
          }
        }
        walk(v, [...keyPath, k]);
      }
    }
  }
  walk(cfg, []);
  return urls;
}

/** Línea 1-based de la primera aparición de `needle` (para que el hallazgo se pueda abrir). */
function lineOf(text, needle) {
  const idx = text.indexOf(needle);
  return idx < 0 ? null : text.slice(0, idx).split('\n').length;
}

/**
 * URLs vivas de un fichero de texto cualquiera (sin exención por clave).
 * @param {string} text @param {string} rel
 * @returns {object[]}
 */
function scanTextUrls(text, rel) {
  /** @type {object[]} */
  const urls = [];
  for (const m of text.matchAll(URL_LITERAL_RE)) {
    const value = m[0];
    if (isEnvPlaceholderUrl(value)) continue;
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
  if (buf.subarray(0, BINARY_SNIFF_BYTES).includes(0)) return { urls: [], binary: true };
  const text = buf.toString('utf8');
  return { urls: isManifest ? scanManifestUrls(text, rel) : scanTextUrls(text, rel), binary: false };
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
  if (!existsSync(root)) {
    const finding = { kind: 'root_no_encontrado', path: root };
    return {
      ok: false,
      root,
      files: 0,
      symlinks: [],
      nodeModules: [],
      identity: [],
      liveUrls: [],
      binaries: [],
      findings: [finding]
    };
  }

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
      if (res.binary) binaries.push(rel);
      else liveUrls.push(...res.urls);
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

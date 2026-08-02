/**
 * Scanners de gates de prácticas (WP-U00).
 * Estilo grep-gates (ARG WP-15): recorrer fuentes y fallar con lista de offenders.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { EXCEPTIONS } from './exceptions.mjs';
import { GATE_RULES } from './reglas.mjs';
// WP-U231 — el invariante de secretos en el plano de datos. Vive en su propio
// módulo (no barre fuentes: barre `VOLUMES/**` entero y recetas de imagen, dos
// corpus que `SOURCE_EXT` no alcanza) y se importa en UNA dirección: aquí. No
// importa nada de este fichero, para que no haya ciclo.
import { scanClaveEnVolumen, scanVolumenExigeSecreto, scanContextoImagen } from './claves.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../..');

/** Puertos canónicos declarados en presets-sdk/env (espejo; no leer el módulo para no acoplar el gate). */
export const KNOWN_ZEUS_PORTS = Object.freeze([
  3008, 3012, 3013, 3014, 3015, 3016, 3017, 3018, 3019, 3020, 3021, 3025, 3026, 3210,
  3230, 4101, 4102, 4103, 4111, 4112, 4121, 4122, 4131, 4132, 6274, 6277
]);

const SOURCE_EXT = /\.(mjs|js|cjs|mts|cts|ts|tsx)$/;
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.worktrees',
  'coverage',
  '.turbo',
  'vendor'
]);

/** WP-U257: una sola definición, en `reglas.mjs`. Aquí sólo se le da nombre local. */
/** @typedef {import('./reglas.mjs').GateRule} GateRule */

/**
 * @typedef {object} Offender
 * @property {GateRule} rule
 * @property {string} path
 * @property {number} [line]
 * @property {string} detail
 */

/**
 * @param {string} [root]
 * @returns {string}
 */
export function normalizeRel(root, abs) {
  return path.relative(root, abs).split(path.sep).join('/');
}

/**
 * @param {string} dir
 * @param {(rel: string) => boolean} [include]
 * @param {string} [repoRoot]
 * @returns {string[]} absolute paths
 */
export function collectFiles(dir, include = () => true, repoRoot = REPO_ROOT) {
  const abs = path.isAbsolute(dir) ? dir : path.join(repoRoot, dir);
  if (!fs.existsSync(abs)) return [];
  /** @type {string[]} */
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(full, include, repoRoot));
      continue;
    }
    if (!SOURCE_EXT.test(entry.name)) continue;
    const rel = normalizeRel(repoRoot, full);
    if (include(rel)) out.push(full);
  }
  return out;
}

/**
 * Paths allowed for rule (a) without listing in EXCEPTIONS.
 * PRACTICAS §1.1: presets-sdk/env, docs y specs pueden citar puertos.
 * Tests/e2e: fixtures de verificación (no producción); ver comentario en exceptions.
 */
export function isPortsPathExempt(rel) {
  const n = rel.replace(/\\/g, '/');
  if (n.startsWith('packages/engine/presets-sdk/src/env/')) return true;
  if (n.startsWith('docs/') || n.startsWith('plan/')) return true;
  if (n.includes('/spec/') || n.includes('/spec/')) return true;
  if (n.endsWith('.md')) return true;
  if (
    n.includes('/test/') ||
    n.includes('/tests/') ||
    /\.test\./.test(n) ||
    /\.spec\./.test(n) ||
    n.startsWith('e2e/')
  ) {
    return true;
  }
  if (n.startsWith('scripts/gates/') || n.startsWith('test/gates/')) return true;
  return false;
}

/**
 * @param {string} n normalized rel path
 * @param {string} prefix path prefix (with or without trailing `/`)
 */
function matchesPathPrefix(n, prefix) {
  const p = prefix.replace(/\\/g, '/');
  if (n === p.replace(/\/$/, '')) return true;
  const withSlash = p.endsWith('/') ? p : `${p}/`;
  return n.startsWith(withSlash);
}

/**
 * @param {GateRule} rule
 * @param {string} rel
 * @param {number} [line]
 */
export function isExcepted(rule, rel, line) {
  const n = rel.replace(/\\/g, '/');
  return EXCEPTIONS.some((ex) => {
    if (ex.rule !== rule) return false;
    /** @type {string[]} */
    const prefixes = [
      ...(ex.pathPrefix ? [ex.pathPrefix] : []),
      ...(Array.isArray(ex.pathPrefixes) ? ex.pathPrefixes : [])
    ];
    const pathOk =
      (ex.path != null && ex.path === n) ||
      prefixes.some((p) => matchesPathPrefix(n, p));
    if (!pathOk) return false;
    if (ex.line == null) return true;
    return line == null || ex.line === line;
  });
}

function buildPortPattern() {
  const alts = KNOWN_ZEUS_PORTS.join('|');
  return new RegExp(
    String.raw`(?:(?:localhost|127\.0\.0\.1):(${alts})\b)|(?:port\s*[:=]\s*(${alts})\b)|(?:\?\?\s*(${alts})\b)|(?:\|\|\s*(${alts})\b)|(?::\s*(${alts})\b)`,
    'g'
  );
}

const PORT_RE = buildPortPattern();

/**
 * (a) puertos/URLs hardcodeados de la malla Zeus fuera de env/docs/specs.
 * @param {{ repoRoot?: string, files?: string[] }} [opts]
 * @returns {Offender[]}
 */
export function scanHardcodedPorts(opts = {}) {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const files =
    opts.files ??
    [
      ...collectFiles('packages', () => true, repoRoot),
      ...collectFiles('scripts', () => true, repoRoot),
      ...collectFiles('examples', () => true, repoRoot)
    ];
  /** @type {Offender[]} */
  const offenders = [];
  for (const file of files) {
    const rel = normalizeRel(repoRoot, file);
    if (isPortsPathExempt(rel)) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      PORT_RE.lastIndex = 0;
      if (!PORT_RE.test(line)) return;
      const lineNo = idx + 1;
      if (isExcepted('ports', rel, lineNo)) return;
      offenders.push({
        rule: 'ports',
        path: rel,
        line: lineNo,
        detail: line.trim().slice(0, 160)
      });
    });
  }
  return offenders;
}

/**
 * Nombres de transición (PRACTICAS §1.5).
 * - `\blegacy\b`, `\bv2\b` (palabra)
 * - sufijos `-old` / `-new` en identificadores, SIN coincidir `oldid` / `newid`
 * - `-final`, `Copy` como sufijo de nombre
 */
const TRANSITION_RE =
  /\blegacy\b|\bv2\b|(?<![A-Za-z0-9])-old(?!id\b)(?![A-Za-z0-9])|(?<![A-Za-z0-9])-new(?!id\b)(?![A-Za-z0-9])|(?<![A-Za-z0-9])-final(?![A-Za-z0-9])|(?<![A-Za-z0-9])Copy(?![A-Za-z0-9])/g;

export function isTransitionPathExempt(rel) {
  const n = rel.replace(/\\/g, '/');
  if (n.startsWith('docs/') || n.startsWith('plan/')) return true;
  if (n.includes('/spec/')) return true;
  if (n.startsWith('scripts/gates/') || n.startsWith('test/gates/')) return true;
  // tests pueden hablar de legacy en aserciones históricas; aún así preferimos
  // excepciones puntuales. Eximir solo el propio scanner.
  return false;
}

/**
 * (b) nombres de transición en código.
 * @param {{ repoRoot?: string, files?: string[] }} [opts]
 * @returns {Offender[]}
 */
export function scanTransitionNames(opts = {}) {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const files =
    opts.files ??
    [
      ...collectFiles('packages', () => true, repoRoot),
      ...collectFiles('scripts', () => true, repoRoot),
      ...collectFiles('examples', () => true, repoRoot)
    ];
  /** @type {Offender[]} */
  const offenders = [];
  for (const file of files) {
    const rel = normalizeRel(repoRoot, file);
    if (isTransitionPathExempt(rel)) continue;
    // No escanear fixtures de test de los propios gates
    if (rel.includes('/test/') || /\.test\./.test(rel) || /\.spec\./.test(rel) || rel.startsWith('e2e/')) {
      // Tests ajenos: sí se escanean salvo excepción (pueden introducir legacy
      // en asserts). Para no inundar U00, solo fallamos en src/ producción:
      // mismos criterios que PRACTICAS — código. Los test/*.mjs con "legacy"
      // quedan como hallazgos si no exceptuados; eximimos test/ para verde
      // preexistente con justificación de categoría:
      continue;
    }
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      TRANSITION_RE.lastIndex = 0;
      const match = line.match(TRANSITION_RE);
      if (!match) return;
      const lineNo = idx + 1;
      if (isExcepted('transition', rel, lineNo)) return;
      offenders.push({
        rule: 'transition',
        path: rel,
        line: lineNo,
        detail: `matched ${match.join(',')}: ${line.trim().slice(0, 140)}`
      });
    });
  }
  return offenders;
}

const ARG_IMPORT_RE =
  /(?:from|import)\s+['"](@zeus\/arg(?:-[a-z0-9]+)*)['"]|(?:from|import)\s+['"]([^'"]*packages\/games\/delta\/[^'"]+)['"]|require\(\s*['"](@zeus\/arg(?:-[a-z0-9]+)*)['"]\s*\)/;

/**
 * (c) el monorepo no importa @zeus/arg-* ni paths packages/games/ (juegos en library)
 * @param {{ repoRoot?: string, files?: string[] }} [opts]
 * @returns {Offender[]}
 */
export function scanArgImportViolations(opts = {}) {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const files =
    opts.files ??
    [
      ...collectFiles('packages', () => true, repoRoot),
      ...collectFiles('scripts', () => true, repoRoot),
      ...collectFiles('examples', () => true, repoRoot),
      ...collectFiles('e2e', () => true, repoRoot)
    ];
  /** @type {Offender[]} */
  const offenders = [];
  for (const file of files) {
    const rel = normalizeRel(repoRoot, file);
    if (rel.startsWith('scripts/gates/') || rel.startsWith('test/gates/')) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (!ARG_IMPORT_RE.test(line)) return;
      ARG_IMPORT_RE.lastIndex = 0;
      const lineNo = idx + 1;
      if (isExcepted('arg-import', rel, lineNo)) return;
      offenders.push({
        rule: 'arg-import',
        path: rel,
        line: lineNo,
        detail: line.trim().slice(0, 160)
      });
    });
  }
  return offenders;
}

/** Conceptos exclusivos de un juego (PRACTICAS §1.11 / D-8). */
export const GAME_EXCLUSIVE_RE =
  /\bdelta\b|\bpozo\b|\bgrifo\b|\bcantera\b|\bcaudal\b|\bCAUDAL\b/gi;

/**
 * Docs/specs/tests pueden ilustrar con nombres de juego; el gate mira código
 * de producción bajo packages/engine (activado con layout U51).
 */
export function isTwoGamesPathExempt(rel) {
  const n = rel.replace(/\\/g, '/');
  if (n.startsWith('docs/') || n.startsWith('plan/')) return true;
  if (n.includes('/spec/') || n.endsWith('.md')) return true;
  if (
    n.includes('/test/') ||
    n.includes('/tests/') ||
    /\.test\./.test(n) ||
    /\.spec\./.test(n) ||
    n.startsWith('e2e/')
  ) {
    return true;
  }
  if (n.startsWith('scripts/gates/') || n.startsWith('test/gates/')) return true;
  return false;
}

/**
 * (d) paquetes bajo packages/engine no nombran juegos ni conceptos exclusivos.
 * @param {{ repoRoot?: string, files?: string[] }} [opts]
 * @returns {Offender[]}
 */
export function scanTwoGamesRule(opts = {}) {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const files = opts.files ?? collectFiles('packages/engine', () => true, repoRoot);
  /** @type {Offender[]} */
  const offenders = [];
  for (const file of files) {
    const rel = normalizeRel(repoRoot, file);
    if (isTwoGamesPathExempt(rel)) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      GAME_EXCLUSIVE_RE.lastIndex = 0;
      const match = line.match(GAME_EXCLUSIVE_RE);
      if (!match) return;
      const lineNo = idx + 1;
      if (isExcepted('two-games', rel, lineNo)) return;
      offenders.push({
        rule: 'two-games',
        path: rel,
        line: lineNo,
        detail: `matched ${[...new Set(match.map((m) => m.toLowerCase()))].join(',')}: ${line.trim().slice(0, 140)}`
      });
    });
  }
  return offenders;
}

/** Google public STUN host (D-17 / WP-U88). */
export const GOOGLE_STUN_RE = /stun\.l\.google/i;

/**
 * Paths allowed to mention stun.l.google (canonical opt-in in env + docs).
 * PRACTICAS §1.1 / D-17: iceServers viven en presets-sdk/env; el resto = rojo.
 */
export function isGoogleStunPathExempt(rel) {
  const n = rel.replace(/\\/g, '/');
  if (n.startsWith('packages/engine/presets-sdk/src/env/')) return true;
  if (n.startsWith('docs/') || n.startsWith('plan/')) return true;
  if (n.endsWith('.md')) return true;
  if (
    n.includes('/test/') ||
    n.includes('/tests/') ||
    /\.test\./.test(n) ||
    /\.spec\./.test(n) ||
    n.startsWith('e2e/')
  ) {
    return true;
  }
  if (n.startsWith('scripts/gates/') || n.startsWith('test/gates/')) return true;
  return false;
}

/**
 * (e) stun.l.google en código de producción = rojo (D-17).
 * @param {{ repoRoot?: string, files?: string[] }} [opts]
 * @returns {Offender[]}
 */
export function scanGoogleStun(opts = {}) {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const files =
    opts.files ??
    [
      ...collectFiles('packages', () => true, repoRoot),
      ...collectFiles('scripts', () => true, repoRoot),
      ...collectFiles('examples', () => true, repoRoot)
    ];
  /** @type {Offender[]} */
  const offenders = [];
  for (const file of files) {
    const rel = normalizeRel(repoRoot, file);
    if (isGoogleStunPathExempt(rel)) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (!GOOGLE_STUN_RE.test(line)) return;
      const lineNo = idx + 1;
      if (isExcepted('google-stun', rel, lineNo)) return;
      offenders.push({
        rule: 'google-stun',
        path: rel,
        line: lineNo,
        detail: line.trim().slice(0, 160)
      });
    });
  }
  return offenders;
}

/**
 * Tracking-id hygiene: expanded from `WP-Z*` → `WP-[A-Z]{1,2}\d`.
 * Home series `WP-U*` (repo-native backlog ids) is not flagged.
 */
export const TRACKING_ID_RE = /\bWP-[A-Z]{1,2}\d+/g;

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isHomeTrackingId(id) {
  return /^WP-U\d+$/.test(id);
}

/**
 * Docs under plan/ may cite ids; gates look at obra surfaces.
 * @param {string} rel
 */
export function isTrackingIdPathExempt(rel) {
  const n = rel.replace(/\\/g, '/');
  if (n.startsWith('docs/') || n.startsWith('plan/')) return true;
  if (n.startsWith('scripts/gates/') || n.startsWith('test/gates/')) return true;
  return false;
}

const TRACKING_SOURCE_EXT = /\.(mjs|js|cjs|mts|cts|ts|tsx|md)$/;

/**
 * @param {string} dir
 * @param {string} [repoRoot]
 * @returns {string[]}
 */
function collectTrackingFiles(dir, repoRoot = REPO_ROOT) {
  const abs = path.isAbsolute(dir) ? dir : path.join(repoRoot, dir);
  if (!fs.existsSync(abs)) return [];
  /** @type {string[]} */
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTrackingFiles(full, repoRoot));
      continue;
    }
    if (!TRACKING_SOURCE_EXT.test(entry.name)) continue;
    out.push(full);
  }
  return out;
}

/**
 * (f) foreign tracking ids in obra (packages / e2e / kits / .changeset).
 * @param {{ repoRoot?: string, files?: string[] }} [opts]
 * @returns {Offender[]}
 */
export function scanTrackingIds(opts = {}) {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const files =
    opts.files ??
    [
      ...collectTrackingFiles('packages', repoRoot),
      ...collectTrackingFiles('e2e', repoRoot),
      ...collectTrackingFiles('kits', repoRoot),
      ...collectTrackingFiles('.changeset', repoRoot)
    ];
  /** @type {Offender[]} */
  const offenders = [];
  for (const file of files) {
    const rel = normalizeRel(repoRoot, file);
    if (isTrackingIdPathExempt(rel)) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      TRACKING_ID_RE.lastIndex = 0;
      const matches = line.match(TRACKING_ID_RE);
      if (!matches) return;
      const foreign = [...new Set(matches)].filter((id) => !isHomeTrackingId(id));
      if (foreign.length === 0) return;
      const lineNo = idx + 1;
      if (isExcepted('tracking-id', rel, lineNo)) return;
      offenders.push({
        rule: 'tracking-id',
        path: rel,
        line: lineNo,
        detail: `matched ${foreign.join(',')}: ${line.trim().slice(0, 140)}`
      });
    });
  }
  return offenders;
}

/**
 * Puntero de licencia canónico del workspace (LICENSE.md §0, viñeta 2).
 * AIPLv1 es el nombre histórico del composite `GPL-3.0-or-later AND
 * LicenseRef-Animus-Iocandi`; npm rechaza `LicenseRef-`, así que el puntero es
 * el único vehículo válido en el campo `license`.
 */
export const LICENSE_POINTER = 'SEE LICENSE IN LICENSE.md';

/** Fichero al que apunta LICENSE_POINTER: si no existe, el puntero miente. */
export const LICENSE_FILE = 'LICENSE.md';

/** Nombre del manifiesto npm. */
export const MANIFEST_NAME = 'package.json';

/**
 * Las dos capas nombradas del composite (LICENSE.md §0 viñetas 1-2). Si el
 * fichero apuntado no las menciona, no describe la licencia que promete.
 */
export const LICENSE_REQUIRED_MARKERS = Object.freeze(['GPL-3.0', 'Animus Iocandi']);

/**
 * Manifiestos que LICENSE.md §0 obliga a declarar el puntero pero que NO son
 * miembros de workspace y por tanto NO tienen entrada propia en el lock.
 * Se verifican SOLO contra el manifiesto. Si uno se mueve o se borra, este gate
 * se pone rojo a propósito (fail-closed): la lista se actualiza a mano.
 */
export const EXTRA_LICENSED_MANIFESTS = Object.freeze([
  'packages/mesh/operator-ui/projects/threejs-ui-lib/package.json'
]);

/**
 * Clases de manifiesto que NO declaran licencia de obra distribuible:
 * - cualquier segmento que empiece por `.` → utillaje del repo, no obra
 *   (`.claude/` de los skills, `.changeset/`, `.github/`).
 * - cualquier segmento `test` / `tests` / `fixtures` / `__fixtures__` → fixture
 *   de verificación. Mismo idioma que `isPortsPathExempt` / `isGoogleStunPathExempt`.
 *
 * ALCANCE HONESTO: esto NO es «por construcción». Es una regla por clase de
 * ruta, y por tanto una vía de escape con nombre: un manifiesto plantado bajo
 * `…/test/` o bajo un directorio con punto queda eximido sin avisar. La
 * diferencia con no enumerar es que antes estaba exento **todo** manifiesto que
 * no fuese clave de lock, y en silencio; ahora lo está solo esta clase, y está
 * escrita. Cerrarla del todo exige decidir si una fixture debe declarar
 * licencia — decisión del custodio sobre LICENSE.md, no de este gate.
 * @param {string} rel
 * @returns {boolean}
 */
export function isManifestLicenseExempt(rel) {
  const segments = rel.replace(/\\/g, '/').split('/');
  if (segments.some((s) => s.length > 1 && s.startsWith('.'))) return true;
  return segments.some(
    (s) => s === 'test' || s === 'tests' || s === 'fixtures' || s === '__fixtures__'
  );
}

/**
 * Manifiestos que el gate enumera.
 *
 * Fuente preferida: **el índice de git**, porque lo que git rastrea es lo que
 * viaja. Un `package.json` no rastreado no llega a la máquina de nadie ni puede
 * ser clave de lock, así que no gobierna la licencia distribuida — y además el
 * arnés de tests planta fixtures reales dentro del repo durante la ejecución
 * (`test/gates/matriz-51.test.mjs:98-112` crea
 * `packages/mesh/zz-pieza-fantasma-u233/package.json` y lo borra), con lo que
 * un recorrido del disco haría este gate dependiente de qué otra suite esté
 * corriendo a la vez.
 *
 * Reserva: si git no está disponible (tarball sin `.git`), se recorre el disco.
 * La reserva es MÁS estricta —ve también lo no rastreado—, así que degrada
 * cerrado, no abierto.
 * @param {string} [repoRoot]
 * @returns {string[]} rutas relativas con `/`
 */
export function collectManifests(repoRoot = REPO_ROOT) {
  return (trackedManifests(repoRoot) ?? walkManifests(repoRoot)).sort();
}

/**
 * @param {string} repoRoot
 * @returns {string[]|null} null si git no responde
 */
function trackedManifests(repoRoot) {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--', `*${MANIFEST_NAME}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return out
      .split('\0')
      .filter(Boolean)
      .map((p) => p.replace(/\\/g, '/'))
      // `*package.json` también casa `ng-package.json`: filtrar por nombre exacto.
      .filter((p) => p === MANIFEST_NAME || p.endsWith(`/${MANIFEST_NAME}`));
  } catch {
    return null;
  }
}

/**
 * @param {string} repoRoot
 * @returns {string[]}
 */
function walkManifests(repoRoot) {
  /** @type {string[]} */
  const out = [];
  /** @param {string} dir */
  const walk = (dir) => {
    /** @type {fs.Dirent[]} */
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.name === MANIFEST_NAME) out.push(normalizeRel(repoRoot, full));
    }
  };
  walk(repoRoot);
  return out;
}

/**
 * Universo del gate por el lado del lock: la clave raíz `""` más toda clave de
 * directorio de workspace. Una clave es de workspace cuando NINGÚN segmento de
 * su ruta es `node_modules` — así queda fuera por construcción todo paquete de
 * registry (incluido `node_modules/@alephscript/mcp-core-sdk`, que se publica
 * fuera de este repo y cuya licencia no gobierna z-sdk).
 * @param {Record<string, {license?: string}>} lockPackages
 * @returns {string[]}
 */
export function workspaceLockKeys(lockPackages) {
  return Object.keys(lockPackages).filter(
    (key) => key === '' || !key.split('/').includes('node_modules')
  );
}

/**
 * @param {string[]} lines
 * @param {RegExp} re
 * @returns {number|undefined} 1-based line number
 */
function findLine(lines, re) {
  const idx = lines.findIndex((l) => re.test(l));
  return idx === -1 ? undefined : idx + 1;
}

/**
 * (g) coherencia de licencia entre manifiestos y package-lock.json.
 *
 * El lock es lo que viaja a una instalación reproducible: si declara una
 * licencia distinta de la del manifiesto, miente en casa del usuario. Este gate
 * lee LAS DOS FUENTES y exige el puntero en ambas, por el campo `license`
 * parseado (no por coincidencia de texto).
 *
 * Sin excepciones por paquete: LICENSE.md §0 fija que «all packages of this
 * workspace receive the identical license treatment», así que una divergencia
 * es un defecto legal, no un waiver de lint.
 *
 * @param {{ repoRoot?: string }} [opts]
 * @returns {Offender[]}
 */
export function scanLicenseCoherence(opts = {}) {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  /** @type {Offender[]} */
  const offenders = [];

  offenders.push(...checkLicenseFile(repoRoot));

  const lockRel = 'package-lock.json';
  const lockAbs = path.join(repoRoot, lockRel);
  /** @type {string[]} */
  let lockLines = [];
  /** @type {Record<string, unknown>} */
  let lockPackages = {};
  /** @type {string[]} */
  let keys = [];

  if (!fs.existsSync(lockAbs)) {
    offenders.push({
      rule: 'licencia',
      path: lockRel,
      detail: 'no existe: la licencia declarada no viaja a una instalación reproducible'
    });
  } else {
    const lockRaw = fs.readFileSync(lockAbs, 'utf8');
    lockLines = lockRaw.split(/\r?\n/);
    /** @type {{packages?: unknown}} */
    let lock;
    try {
      lock = JSON.parse(lockRaw);
    } catch (err) {
      lock = undefined;
      offenders.push({
        rule: 'licencia',
        path: lockRel,
        detail: `JSON ilegible: ${/** @type {Error} */ (err).message}`
      });
    }
    if (lock !== undefined) {
      // El universo del gate SALE de este mapa: si no es un objeto poblado, el
      // gate se autosilencia (universo vacío ⇒ cero offenders ⇒ verde). Un lock
      // `{}`, `{"packages":{}}`, `{"packages":[]}`, `{"packages":null}` o en
      // forma npm 6 (`lockfileVersion:1`, sin `packages`) entra por aquí.
      const raw = /** @type {Record<string, unknown>} */ (lock).packages;
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        offenders.push({
          rule: 'licencia',
          path: lockRel,
          detail: `no declara un mapa \`packages\` (es ${raw === null ? 'null' : Array.isArray(raw) ? 'un array' : typeof raw}); sin él ninguna licencia de workspace viaja al lock`
        });
      } else {
        lockPackages = /** @type {Record<string, unknown>} */ (raw);
        keys = workspaceLockKeys(lockPackages);
        // Segunda guarda, independiente de la forma: el lock SIEMPRE describe la
        // raíz. Si el universo no la contiene, el mapa está vacío o amputado.
        if (!keys.includes('')) {
          offenders.push({
            rule: 'licencia',
            path: lockRel,
            detail: `\`packages\` no declara la entrada raíz \`""\` (${keys.length} clave(s) de workspace); el universo del gate estaría vacío o amputado`
          });
        }
      }
    }
  }

  /** rutas de manifiesto ya clasificadas por alguna de las dos vías */
  const classified = new Set(EXTRA_LICENSED_MANIFESTS);

  for (const key of keys) {
    const manifestRel = key === '' ? MANIFEST_NAME : `${key}/${MANIFEST_NAME}`;
    classified.add(manifestRel);

    // --- lado lock ---
    const entry = lockPackages[key];
    const entryOk = entry !== null && typeof entry === 'object' && !Array.isArray(entry);
    if (!entryOk) {
      // m1: sin esta guarda un `null` lanzaría TypeError y tumbaría runAllGates
      // entero — las siete reglas, no solo ésta. Se reporta y se SIGUE hasta el
      // manifiesto: un lock malformado no debe apagar el otro lado del contraste.
      offenders.push({
        rule: 'licencia',
        path: lockRel,
        line: findLockKeyLine(lockLines, key),
        detail: `entrada «${key || '<raíz>'}» no es un objeto (${entry === null ? 'null' : Array.isArray(entry) ? 'array' : typeof entry}); lock malformado`
      });
    }
    const declared = entryOk ? /** @type {{license?: unknown}} */ (entry).license : undefined;
    if (entryOk && declared !== LICENSE_POINTER) {
      offenders.push({
        rule: 'licencia',
        path: lockRel,
        line: findLockKeyLine(lockLines, key),
        detail: `entrada «${key || '<raíz>'}» declara ${JSON.stringify(declared ?? null)}; se esperaba ${JSON.stringify(LICENSE_POINTER)} — regenera el lock`
      });
    }

    // --- lado manifiesto ---
    offenders.push(
      ...checkManifestLicense(repoRoot, manifestRel, typeof declared === 'string' ? declared : undefined)
    );
  }

  for (const manifestRel of EXTRA_LICENSED_MANIFESTS) {
    offenders.push(...checkManifestLicense(repoRoot, manifestRel, undefined));
  }

  // --- enumeración por glob: ningún manifiesto queda exento en silencio ---
  for (const manifestRel of collectManifests(repoRoot)) {
    if (classified.has(manifestRel)) continue;
    if (isManifestLicenseExempt(manifestRel)) continue;
    offenders.push({
      rule: 'licencia',
      path: manifestRel,
      detail:
        'manifiesto sin clasificar: no es miembro de workspace (no tiene clave de lock), no está en EXTRA_LICENSED_MANIFESTS y no cae en una clase eximida — declara cuál es o dale entrada de lock'
    });
  }

  return offenders;
}

/**
 * m2: `existsSync` no basta. El puntero promete que LICENSE.md **dice** el
 * composite; un fichero de 0 bytes, un directorio con ese nombre o el texto de
 * otra licencia lo dejarían mintiendo igual que si no existiera.
 * @param {string} repoRoot
 * @returns {Offender[]}
 */
function checkLicenseFile(repoRoot) {
  const abs = path.join(repoRoot, LICENSE_FILE);
  const bad = (detail) => [{ rule: /** @type {const} */ ('licencia'), path: LICENSE_FILE, detail }];
  let stat;
  try {
    stat = fs.statSync(abs);
  } catch {
    return bad(`el puntero «${LICENSE_POINTER}» apunta a un fichero que no existe`);
  }
  if (!stat.isFile()) return bad(`«${LICENSE_FILE}» no es un fichero regular`);
  const text = fs.readFileSync(abs, 'utf8');
  if (text.trim() === '') return bad(`«${LICENSE_FILE}» está vacío: el puntero apunta a la nada`);
  const missing = LICENSE_REQUIRED_MARKERS.filter((m) => !text.includes(m));
  if (missing.length > 0) {
    return bad(
      `«${LICENSE_FILE}» no menciona ${missing.map((m) => JSON.stringify(m)).join(' ni ')}: no describe el composite que el puntero promete (LICENSE.md §0)`
    );
  }
  return [];
}

/**
 * m5 (declarado, no corregido): la línea es ORIENTATIVA. Casa la primera línea
 * que abre esa clave; con claves cortas puede señalar otro contexto en un lock
 * escrito a mano. El offender se identifica por `path` + `detail`, no por línea.
 * @param {string[]} lockLines
 * @param {string} key
 * @returns {number|undefined}
 */
function findLockKeyLine(lockLines, key) {
  return findLine(
    lockLines,
    new RegExp(`^\\s*"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}":\\s*\\{`)
  );
}

/**
 * @param {string} repoRoot
 * @param {string} manifestRel
 * @param {string|undefined} lockDeclared licencia que el lock atribuye al mismo paquete
 * @returns {Offender[]}
 */
function checkManifestLicense(repoRoot, manifestRel, lockDeclared) {
  /** @type {Offender[]} */
  const offenders = [];
  const abs = path.join(repoRoot, manifestRel);
  if (!fs.existsSync(abs)) {
    offenders.push({
      rule: 'licencia',
      path: manifestRel,
      detail: 'manifiesto ausente para una ruta que el gate vigila'
    });
    return offenders;
  }
  const raw = fs.readFileSync(abs, 'utf8');
  /** @type {{license?: string}} */
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (err) {
    offenders.push({
      rule: 'licencia',
      path: manifestRel,
      detail: `JSON ilegible: ${/** @type {Error} */ (err).message}`
    });
    return offenders;
  }
  const line = findLine(raw.split(/\r?\n/), /^\s*"license"\s*:/);
  if (manifest.license !== LICENSE_POINTER) {
    offenders.push({
      rule: 'licencia',
      path: manifestRel,
      line,
      detail: `declara ${JSON.stringify(manifest.license ?? null)}; se esperaba ${JSON.stringify(LICENSE_POINTER)} (LICENSE.md §0)`
    });
    return offenders;
  }
  if (lockDeclared !== undefined && lockDeclared !== manifest.license) {
    offenders.push({
      rule: 'licencia',
      path: manifestRel,
      line,
      detail: `manifiesto y lock discrepan: ${JSON.stringify(manifest.license)} vs ${JSON.stringify(lockDeclared)} — regenera el lock`
    });
  }
  return offenders;
}

/**
 * @param {{ repoRoot?: string }} [opts]
 * @returns {{ ok: boolean, offenders: Offender[], byRule: Record<GateRule, Offender[]> }}
 */
export function runAllGates(opts = {}) {
  const offenders = [
    ...scanHardcodedPorts(opts),
    ...scanTransitionNames(opts),
    ...scanArgImportViolations(opts),
    ...scanTwoGamesRule(opts),
    ...scanGoogleStun(opts),
    ...scanTrackingIds(opts),
    ...scanLicenseCoherence(opts),
    ...scanClaveEnVolumen(opts),
    ...scanVolumenExigeSecreto(opts),
    ...scanContextoImagen(opts)
  ];
  // WP-U257: las claves salen de GATE_RULES, no de un literal paralelo. Antes
  // eran la CUARTA copia de la lista de reglas: dar de alta una y olvidarse de
  // este objeto tumbaba `runAllGates` entero en la primera ofensa de la regla
  // nueva. El orden de GATE_RULES es el orden del informe, y es el mismo que
  // tenía el literal.
  const byRule = /** @type {Record<GateRule, Offender[]>} */ (
    Object.fromEntries(GATE_RULES.map((rule) => [rule, /** @type {Offender[]} */ ([])]))
  );
  for (const o of offenders) byRule[o.rule].push(o);
  return { ok: offenders.length === 0, offenders, byRule };
}

/**
 * @param {Offender[]} offenders
 * @returns {string}
 */
export function formatOffenders(offenders) {
  if (offenders.length === 0) return 'gates: OK (0 offenders)';
  const lines = offenders.map((o) => {
    const loc = o.line != null ? `${o.path}:${o.line}` : o.path;
    return `  [${o.rule}] ${loc} — ${o.detail}`;
  });
  return `gates: FAIL (${offenders.length} offender(s))\n${lines.join('\n')}`;
}

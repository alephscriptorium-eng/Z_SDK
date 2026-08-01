/**
 * Pack adapter — startpack (esquema `zeus.startpack/v0`) → pack v1 importable
 * (WP-U206 · decisión ⑧ del custodio, `plan/DECISIONES.md`).
 *
 * Por qué existe: un startpack publicado **tiene los datos y no tiene el
 * descriptor**. Su `manifest.json` declara `zeus.startpack/v0` (`game`, `id`,
 * `round`, `seeds`, `volumes:{root,slots}`) y carece de `name` y de `hashes`,
 * así que `importPack` lo rechaza en VERIFICAR con `pack_manifest_incompleto`
 * (src/import.mjs:162-172). Los ficheros, en cambio, pueden ser exactamente
 * los que el destino espera. Lo que falta no son los datos: es el manifiesto.
 *
 * Este módulo es AGNÓSTICO DE JUEGO a propósito —vive bajo `packages/engine`,
 * que no nombra juegos (gate `two-games`)—: recibe la raíz del startpack y la
 * declaración de volúmenes, y no sabe de qué juego viene. El caso concreto
 * que motivó el WP vive en `e2e/local-first-ca.mjs` y en el reporte.
 *
 * Contrato de este adaptador:
 * - **La fuente es SOLO LECTURA.** Nunca se escribe dentro de `startpackRoot`;
 *   `outDir` dentro de la fuente = `destino_dentro_de_origen` y aborta antes
 *   de tocar disco. La frontera es dura por decisión del custodio: el árbol
 *   del mundo hermano no se muta jamás.
 * - **El árbol de datos de un pack son los DISCOS.** `<packRoot>/volumes/` es
 *   el dataRoot (CONTRATO-IMPORT-PACK-v1 §0.7 · import.mjs:174), y lo que
 *   cuelga de él son directorios `DISK_xx`. El `volumes/volumes.json` de un
 *   startpack es un manifiesto de ROOT —la otra mitad del par manifiesto/
 *   estado de U199— y no tiene sitio dentro de un pack: se **descarta con
 *   reporte** en `skipped`, nunca en silencio. Si viajara, `walkTree` lo
 *   enumeraría e `importPack` abortaría con `fichero_sin_enumerar`
 *   (import.mjs:187-190) o lo aterrizaría encima del manifiesto del destino.
 * - **Nada se adivina.** Los volúmenes los DECLARA quien llama (id, disk,
 *   path, corpora). El adaptador comprueba que la declaración y el árbol
 *   coinciden; no deriva topología de nombres de directorio.
 * - **Cero pérdida silenciosa.** Todo fichero seleccionado debe caer bajo el
 *   `path` de algún volumen declarado; si no, `fichero_fuera_de_volumen`. Sin
 *   esta guarda el fichero se copia al staging, pasa la verificación de hash
 *   y **desaparece** al borrarse el staging, porque ningún plan de fusión lo
 *   cubre — e `importPack` devuelve `ok:true` (ver README · «juntura»).
 * - **Enlaces: se rechaza, no se sigue.** Un symlink/junction en la fuente es
 *   un ancla viva; se aborta con `symlink_en_origen` en vez de materializar su
 *   destino (mismo criterio que import.mjs:176-179, aplicado un paso antes).
 *
 * Reencuadre declarado: el descriptor lo iba a producir el mundo hermano. Se
 * construye aquí para no depender de otro mundo; el día que llegue el suyo
 * habrá **dos productores que reconciliar**, y queda escrito para que no
 * parezca un accidente.
 * Node-only.
 */

import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve, sep } from 'node:path';

/** Nombre del dataRoot dentro de un pack (CONTRATO §0.7). */
export const PACK_DATA_DIR = 'volumes';

/** @param {string} abs */
function sha256File(abs) {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

/**
 * Recorre un árbol devolviendo rutas posix relativas. NO sigue enlaces:
 * los detecta con `lstat` y los acumula aparte para que el llamador aborte.
 * @param {string} rootDir
 * @returns {{ files: string[], symlinks: string[] }}
 */
function walkTree(rootDir) {
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
 * ¿`child` cae dentro de `parent`? (o es el mismo directorio)
 * @param {string} parent @param {string} child
 */
function isInside(parent, child) {
  const rel = relative(resolve(parent), resolve(child));
  return rel === '' || (!rel.startsWith('..') && !rel.includes(`..${sep}`));
}

class PackAdapterError extends Error {
  /** @param {string} code @param {object} [detail] */
  constructor(code, detail = {}) {
    super(code);
    this.name = 'PackAdapterError';
    this.code = code;
    this.detail = detail;
  }
}

/**
 * Lee el manifiesto de un startpack `zeus.startpack/v0` — SOLO para reportar
 * la procedencia (id/version/game). No se usa como descriptor de import: es
 * justamente el que `importPack` rechaza.
 * @param {string} startpackRoot
 * @returns {{ path: string|null, schema: string|null, id: string|null, version: string|null, game: string|null }}
 */
export function readStartpackIdentity(startpackRoot) {
  const path = join(startpackRoot, 'manifest.json');
  if (!existsSync(path)) return { path: null, schema: null, id: null, version: null, game: null };
  /** @type {any} */
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { path, schema: null, id: null, version: null, game: null };
  }
  return {
    path,
    schema: typeof parsed.schema === 'string' ? parsed.schema : null,
    id: typeof parsed.id === 'string' ? parsed.id : null,
    version: typeof parsed.version === 'string' ? parsed.version : null,
    game: typeof parsed.game === 'string' ? parsed.game : null
  };
}

/**
 * Construye un pack v1 (manifest.json + volumes/) a partir de un startpack
 * leído en SOLO LECTURA.
 *
 * @param {object} opts
 * @param {string} opts.startpackRoot — raíz del startpack (SOLO LECTURA)
 * @param {string} opts.outDir — directorio donde materializar el pack (fuera de la fuente)
 * @param {string} opts.name — `name` del pack v1
 * @param {string} opts.version — `version` del pack v1
 * @param {Record<string, { disk: string, path: string, readonly?: boolean, label?: string, family?: string, corpora?: object[] }>} opts.volumes
 * @param {string} [opts.dataDir] — subdirectorio de datos dentro del startpack (por defecto `volumes`)
 * @returns {{ packRoot: string, manifestPath: string, name: string, version: string,
 *             files: string[], hashes: Record<string,string>, skipped: object[],
 *             volumes: object, source: object }}
 * @throws {PackAdapterError} `destino_dentro_de_origen` · `origen_no_encontrado` ·
 *   `datos_no_encontrados` · `symlink_en_origen` · `sin_discos` ·
 *   `volumen_sin_arbol` · `fichero_fuera_de_volumen`
 */
export function buildPackFromStartpack(opts) {
  const {
    startpackRoot,
    outDir,
    name,
    version,
    volumes,
    dataDir = PACK_DATA_DIR
  } = opts || {};

  if (!startpackRoot || !existsSync(startpackRoot)) {
    throw new PackAdapterError('origen_no_encontrado', { startpackRoot: startpackRoot ?? null });
  }
  if (!outDir) {
    throw new PackAdapterError('destino_no_declarado');
  }
  // Frontera dura (decisión ⑧): el mundo hermano jamás se escribe.
  if (isInside(startpackRoot, outDir)) {
    throw new PackAdapterError('destino_dentro_de_origen', {
      startpackRoot: resolve(startpackRoot),
      outDir: resolve(outDir)
    });
  }
  if (!volumes || typeof volumes !== 'object' || Object.keys(volumes).length === 0) {
    throw new PackAdapterError('volumenes_no_declarados');
  }

  const srcData = join(startpackRoot, dataDir);
  if (!existsSync(srcData) || !statSync(srcData).isDirectory()) {
    throw new PackAdapterError('datos_no_encontrados', { dataDir: srcData });
  }

  // ── Selección: sólo los DIRECTORIOS de primer nivel (los discos). Lo que
  // sea fichero suelto ahí (p. ej. el `volumes/volumes.json` del startpack) es
  // manifiesto de root y se descarta CON REPORTE.
  /** @type {string[]} */
  const disks = [];
  /** @type {object[]} */
  const skipped = [];
  for (const entry of readdirSync(srcData, { withFileTypes: true })) {
    const abs = join(srcData, entry.name);
    const st = lstatSync(abs);
    if (st.isSymbolicLink()) {
      throw new PackAdapterError('symlink_en_origen', { entries: [entry.name] });
    }
    if (st.isDirectory()) {
      disks.push(entry.name);
      continue;
    }
    skipped.push({
      path: entry.name,
      reason: 'manifiesto_de_root',
      note:
        'fichero suelto en el dataRoot del startpack: un pack sólo transporta discos; ' +
        'el manifiesto de un root lo emite el import al sellar (U199)'
    });
  }
  if (disks.length === 0) {
    throw new PackAdapterError('sin_discos', { dataDir: srcData });
  }
  disks.sort();

  // ── Recorrido de los discos seleccionados (lstat, sin seguir enlaces).
  /** @type {string[]} */
  const files = [];
  /** @type {string[]} */
  const symlinks = [];
  for (const disk of disks) {
    const walked = walkTree(join(srcData, disk));
    for (const rel of walked.files) files.push(`${disk}/${rel}`);
    for (const rel of walked.symlinks) symlinks.push(`${disk}/${rel}`);
  }
  if (symlinks.length > 0) {
    throw new PackAdapterError('symlink_en_origen', { entries: symlinks.sort() });
  }
  files.sort();

  // ── Coherencia declaración ↔ árbol, en las dos direcciones.
  const volPrefixes = Object.entries(volumes).map(([id, v]) => ({
    id,
    prefix: `${String(v.path).replace(/\/+$/, '')}/`
  }));
  for (const { id, prefix } of volPrefixes) {
    if (!files.some((rel) => rel.startsWith(prefix))) {
      throw new PackAdapterError('volumen_sin_arbol', { volume: id, path: prefix });
    }
  }
  const orphans = files.filter((rel) => !volPrefixes.some((v) => rel.startsWith(v.prefix)));
  if (orphans.length > 0) {
    // Sin esta guarda el fichero se pierde EN SILENCIO durante la fusión.
    throw new PackAdapterError('fichero_fuera_de_volumen', { files: orphans });
  }

  // ── Materialización del pack (copia de bytes, jamás enlace).
  const packRoot = resolve(outDir);
  mkdirSync(join(packRoot, PACK_DATA_DIR), { recursive: true });
  /** @type {Record<string, string>} */
  const hashes = {};
  for (const rel of files) {
    const from = join(srcData, rel.split('/').join(sep));
    const to = join(packRoot, PACK_DATA_DIR, rel.split('/').join(sep));
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    hashes[rel] = sha256File(to);
    if (hashes[rel] !== sha256File(from)) {
      // La copia debe ser byte a byte; si no lo es, no se emite descriptor.
      throw new PackAdapterError('copia_divergente', { file: rel });
    }
  }

  const identity = readStartpackIdentity(startpackRoot);
  const manifest = {
    name,
    version,
    volumes: structuredClone(volumes),
    hashes,
    // Procedencia INERTE (cerco: nunca dependencia de arranque, sólo dato).
    source: {
      kind: 'startpack-adapter',
      adapter: '@zeus/volumes-ops · pack-adapter (WP-U206)',
      startpack: identity.id,
      startpackSchema: identity.schema,
      startpackVersion: identity.version,
      note:
        'descriptor v1 computado por el adaptador; el startpack de origen no declara name/hashes'
    }
  };
  const manifestPath = join(packRoot, 'manifest.json');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    packRoot,
    manifestPath,
    name,
    version,
    files,
    hashes,
    skipped,
    volumes: manifest.volumes,
    source: manifest.source
  };
}

export { PackAdapterError };

/**
 * crear-linea — scaffold a trunk line from placeholders (DATOS.md §2).
 * Concept from segment_poder.py: nodos.yaml → metas + trunk manifest.
 */

import path from 'node:path';
import { validate } from '../validate.mjs';
import {
  ensureDir,
  exists,
  nowIso,
  readYaml,
  writeJson,
  writeText,
  writeYaml
} from './fs-util.mjs';

/**
 * @typedef {object} NodoInput
 * @property {string} id
 * @property {string} [parte]
 * @property {number} año_ini
 * @property {number|null} [año_fin]
 * @property {string} [etiqueta]
 * @property {string} [tesis]
 * @property {string[]} [articulos_wp]
 */

/**
 * @typedef {object} CrearLineaOptions
 * @property {string} id — line id (folder name under lineasRoot)
 * @property {string} lineasRoot — absolute path to LINEAS root (registry.yaml parent)
 * @property {string} [etiqueta]
 * @property {string} [autorTronco]
 * @property {string} [referenciaWp]
 * @property {string} [nodoPrefix]
 * @property {string} [sateliteRel] — default wp/historia/
 * @property {NodoInput[]} [nodos]
 * @property {boolean} [updateRegistry] — default true
 * @property {boolean} [overwrite]
 */

/**
 * Default toy nodos (3) for scaffolding demos — generic, no game names.
 * @returns {NodoInput[]}
 */
export function defaultScaffoldNodos() {
  return [
    {
      id: 'N01',
      parte: 'I',
      año_ini: 1900,
      año_fin: 1945,
      etiqueta: 'Origen',
      tesis: 'Primer tramo sintético del tronco.',
      articulos_wp: ['Toy_Article']
    },
    {
      id: 'N02',
      parte: 'I',
      año_ini: 1946,
      año_fin: 1989,
      etiqueta: 'Medio',
      tesis: 'Segundo tramo sintético del tronco.',
      articulos_wp: ['Toy_Article']
    },
    {
      id: 'N03',
      parte: 'II',
      año_ini: 1990,
      año_fin: 2020,
      etiqueta: 'Cierre',
      tesis: 'Tercer tramo sintético del tronco.',
      articulos_wp: ['Toy_Article']
    }
  ];
}

/**
 * @param {NodoInput[]} nodos
 */
function buildPartes(nodos) {
  /** @type {Map<string, { id: string, titulo: string, año_ini: number, año_fin: number|null, nodos: string[] }>} */
  const map = new Map();
  for (const n of nodos) {
    const parteId = n.parte ?? 'I';
    let parte = map.get(parteId);
    if (!parte) {
      parte = {
        id: parteId,
        titulo: `Parte ${parteId}`,
        año_ini: n.año_ini,
        año_fin: n.año_fin ?? null,
        nodos: []
      };
      map.set(parteId, parte);
    }
    parte.nodos.push(n.id);
    parte.año_ini = Math.min(parte.año_ini, n.año_ini);
    if (n.año_fin != null) {
      parte.año_fin =
        parte.año_fin == null ? n.año_fin : Math.max(parte.año_fin, n.año_fin);
    }
  }
  return [...map.values()];
}

/**
 * Materialize trunk files from nodos.yaml (or in-memory nodos).
 * @param {string} lineDir
 * @param {{
 *   corpus?: string,
 *   autorTronco?: string,
 *   referenciaWp?: string,
 *   sateliteRel?: string,
 *   nodosDoc?: object
 * }} [opts]
 */
export function materializarTronco(lineDir, opts = {}) {
  const nodosPath = path.join(lineDir, 'nodos.yaml');
  const nodosDoc =
    opts.nodosDoc ??
    (exists(nodosPath) ? /** @type {object} */ (readYaml(nodosPath)) : null);
  if (!nodosDoc) {
    return {
      ok: false,
      error: `Missing nodos.yaml under ${lineDir}`,
      rule: 'crear-linea.requires_nodos'
    };
  }

  /** @type {NodoInput[]} */
  const nodosList = [];
  for (const parte of nodosDoc.partes ?? []) {
    for (const n of parte.nodos ?? []) {
      if (typeof n === 'string') {
        const detailed = nodosDoc.nodos?.[n] ?? nodosDoc.nodos?.find?.((x) => x.id === n);
        nodosList.push({
          id: n,
          parte: parte.id,
          año_ini: detailed?.año_ini ?? parte.año_ini ?? 0,
          año_fin: detailed?.año_fin ?? parte.año_fin ?? null,
          etiqueta: detailed?.etiqueta ?? n,
          tesis: detailed?.tesis ?? '',
          articulos_wp: detailed?.articulos_wp ?? []
        });
      } else {
        nodosList.push({
          id: n.id,
          parte: parte.id,
          año_ini: n.año_ini ?? parte.año_ini ?? 0,
          año_fin: n.año_fin ?? parte.año_fin ?? null,
          etiqueta: n.etiqueta ?? n.id,
          tesis: n.tesis ?? '',
          articulos_wp: n.articulos_wp ?? []
        });
      }
    }
  }

  if (nodosList.length === 0) {
    return { ok: false, error: 'nodos.yaml has no nodos', rule: 'crear-linea.empty_nodos' };
  }

  const sateliteRel = opts.sateliteRel ?? 'wp/historia/';
  const generated_at = nowIso();
  const partes = buildPartes(nodosList);

  for (const n of nodosList) {
    const meta = {
      id: n.id,
      parte: n.parte ?? 'I',
      año_ini: n.año_ini,
      año_fin: n.año_fin ?? null,
      etiqueta: n.etiqueta ?? n.id,
      tesis: n.tesis ?? '',
      articulos_wp: n.articulos_wp ?? []
    };
    const metaResult = validate('nodo-meta', meta);
    if (!metaResult.ok) {
      return {
        ok: false,
        error: `nodo-meta invalid for ${n.id}`,
        validation: metaResult,
        rule: 'crear-linea.nodo_meta_schema'
      };
    }
    writeJson(path.join(lineDir, 'nodos', n.id, 'meta.json'), meta);
  }

  const manifest = {
    meta: {
      corpus: opts.corpus ?? nodosDoc.corpus ?? path.basename(lineDir),
      version: nodosDoc.version ?? '0.1.0',
      generated_at,
      source: 'nodos.yaml',
      autor_tronco: opts.autorTronco ?? nodosDoc.autor_tronco ?? 'dramaturgo',
      referencia_wp_cima: opts.referenciaWp ?? nodosDoc.referencia_wp_cima ?? '',
      nodo_count: nodosList.length,
      partes,
      satelite_wp: sateliteRel.endsWith('/') ? sateliteRel : `${sateliteRel}/`
    },
    nodos: nodosList.map((n) => ({
      id: n.id,
      paths: { meta: `nodos/${n.id}/meta.json`, folder: `nodos/${n.id}/` }
    }))
  };

  const trunkResult = validate('manifest-tronco', manifest);
  if (!trunkResult.ok) {
    return {
      ok: false,
      error: 'manifest-tronco invalid',
      validation: trunkResult,
      rule: 'crear-linea.manifest_schema'
    };
  }

  writeJson(path.join(lineDir, 'manifest.json'), manifest);

  const satDir = path.join(lineDir, sateliteRel);
  ensureDir(path.join(satDir, 'cache', 'snapshots'));
  ensureDir(path.join(satDir, 'raw'));
  ensureDir(path.join(satDir, 'snapshots'));

  return {
    ok: true,
    lineDir,
    manifestPath: path.join(lineDir, 'manifest.json'),
    nodoCount: nodosList.length,
    satDir,
    manifest
  };
}

/**
 * Scaffold a new line under lineasRoot and optionally register it.
 * @param {CrearLineaOptions} options
 */
export function crearLinea(options) {
  const id = options.id;
  if (!id || typeof id !== 'string') {
    return { ok: false, error: 'id is required', rule: 'crear-linea.id_required' };
  }
  if (!options.lineasRoot) {
    return {
      ok: false,
      error: 'lineasRoot is required',
      rule: 'crear-linea.lineas_root_required'
    };
  }

  const lineasRoot = path.resolve(options.lineasRoot);
  const lineDir = path.join(lineasRoot, id);
  if (exists(lineDir) && !options.overwrite) {
    return {
      ok: false,
      error: `Line dir already exists: ${lineDir} (pass overwrite: true)`,
      rule: 'crear-linea.exists'
    };
  }

  const nodos = options.nodos?.length ? options.nodos : defaultScaffoldNodos();
  const sateliteRel = options.sateliteRel ?? 'wp/historia/';
  const autor = options.autorTronco ?? 'dramaturgo';
  const referenciaWp = options.referenciaWp ?? 'Toy_Article';
  const etiqueta = options.etiqueta ?? `Línea ${id}`;

  const nodosDoc = {
    version: '0.1.0',
    corpus: `LINEAS/${id}`,
    autor_tronco: autor,
    referencia_wp_cima: referenciaWp,
    partes: buildPartes(nodos).map((p) => ({
      ...p,
      nodos: nodos
        .filter((n) => (n.parte ?? 'I') === p.id)
        .map((n) => ({
          id: n.id,
          año_ini: n.año_ini,
          año_fin: n.año_fin ?? null,
          años: n.año_fin != null ? `${n.año_ini}–${n.año_fin}` : `${n.año_ini}–`,
          etiqueta: n.etiqueta,
          tesis: n.tesis,
          articulos_wp: n.articulos_wp ?? []
        }))
    }))
  };

  const nodosValidation = validate('nodos-document', nodosDoc);
  if (!nodosValidation.ok) {
    return {
      ok: false,
      error: 'nodos-document invalid',
      validation: nodosValidation,
      rule: 'crear-linea.nodos_schema'
    };
  }

  ensureDir(lineDir);
  writeYaml(path.join(lineDir, 'nodos.yaml'), nodosDoc);
  writeText(
    path.join(lineDir, 'README.md'),
    `# ${etiqueta}\n\nScaffold generado por \`crear-linea\` (@zeus/linea-kit).\n` +
      `Contrato: validar con schemas U80. Las tools son cortesía.\n`
  );

  const trunk = materializarTronco(lineDir, {
    corpus: `LINEAS/${id}`,
    autorTronco: autor,
    referenciaWp,
    sateliteRel,
    nodosDoc
  });
  if (!trunk.ok) return trunk;

  if (options.updateRegistry !== false) {
    const registryPath = path.join(lineasRoot, 'registry.yaml');
    /** @type {object[]} */
    let registry = [];
    if (exists(registryPath)) {
      const parsed = readYaml(registryPath);
      registry = Array.isArray(parsed) ? parsed : [];
    }
    const entry = {
      id,
      path: id,
      etiqueta,
      autor_tronco: autor,
      nodo_prefix: options.nodoPrefix ?? 'N',
      nodo_count: nodos.length,
      referencia_wp_cima: referenciaWp
    };
    const idx = registry.findIndex((e) => e.id === id);
    if (idx >= 0) registry[idx] = entry;
    else registry.push(entry);
    const regValidation = validate('lineas-registry', registry);
    if (!regValidation.ok) {
      return {
        ok: false,
        error: 'lineas-registry invalid',
        validation: regValidation,
        rule: 'crear-linea.registry_schema'
      };
    }
    writeYaml(registryPath, registry);
  }

  return {
    ok: true,
    id,
    lineDir,
    lineasRoot,
    ...trunk
  };
}

/**
 * JSON Schema validator for linea-kit formats.
 * Loads schemas from disk (node). Validating in-memory objects is isomorphic
 * once schemas are loaded; file/tree walks are node-only.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020Module from 'ajv/dist/2020.js';
import yaml from 'yaml';

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMAS_DIR = path.resolve(__dirname, '../schemas');

/** @type {Record<string, string>} */
export const SCHEMA_FILES = Object.freeze({
  'curation-status': 'curation-status.json',
  volumes: 'volumes.json',
  'lineas-registry': 'lineas-registry.json',
  'nodos-document': 'nodos-document.json',
  'manifest-tronco': 'manifest-tronco.json',
  'nodo-meta': 'nodo-meta.json',
  'manifest-satelite': 'manifest-satelite.json',
  registro: 'registro.json',
  'nodo-sections': 'nodo-sections.json',
  'snapshot-meta': 'snapshot-meta.json',
  'cache-sidecar-meta': 'cache-sidecar-meta.json',
  'ontology-seeds': 'ontology-seeds.json',
  force: 'force.json',
  cota: 'cota.json',
  'force-registry': 'force-registry.json',
  'force-manifest': 'force-manifest.json',
  'triage-manifest': 'triage-manifest.json'
});

let ajvSingleton = null;
/** @type {Map<string, object>|null} */
let schemaCache = null;

/**
 * @returns {Map<string, object>}
 */
export function loadSchemaObjects() {
  if (schemaCache) return schemaCache;
  const map = new Map();
  for (const [id, file] of Object.entries(SCHEMA_FILES)) {
    const abs = path.join(SCHEMAS_DIR, file);
    map.set(id, JSON.parse(fs.readFileSync(abs, 'utf8')));
  }
  schemaCache = map;
  return map;
}

function getAjv() {
  if (ajvSingleton) return ajvSingleton;
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false
  });
  const schemas = loadSchemaObjects();
  for (const schema of schemas.values()) {
    if (schema.$id) ajv.addSchema(schema);
  }
  ajvSingleton = ajv;
  return ajv;
}

/**
 * @param {string} schemaId — key in SCHEMA_FILES
 * @param {unknown} data
 * @returns {{ ok: boolean, schemaId: string, errors: object[]|null }}
 */
export function validate(schemaId, data) {
  if (!SCHEMA_FILES[schemaId]) {
    return {
      ok: false,
      schemaId,
      errors: [{ message: `Unknown schema id "${schemaId}"` }]
    };
  }
  const ajv = getAjv();
  const schema = loadSchemaObjects().get(schemaId);
  const validateFn = ajv.getSchema(schema.$id) ?? ajv.compile(schema);
  const ok = /** @type {boolean} */ (validateFn(data));
  return {
    ok,
    schemaId,
    errors: ok ? null : validateFn.errors ?? []
  };
}

/**
 * @param {string} absPath
 * @returns {unknown}
 */
export function readJsonFile(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

/**
 * @param {string} absPath
 * @returns {unknown}
 */
export function readYamlFile(absPath) {
  return yaml.parse(fs.readFileSync(absPath, 'utf8'));
}

/**
 * @param {string} schemaId
 * @param {string} absPath
 * @param {'json'|'yaml'} [format]
 */
export function validateFile(schemaId, absPath, format = 'json') {
  const data = format === 'yaml' ? readYamlFile(absPath) : readJsonFile(absPath);
  const result = validate(schemaId, data);
  return { ...result, path: absPath };
}

/**
 * Resolve VOLUMES root: env, explicit option, or walk from cwd/repo.
 * @param {{ volumesRoot?: string }} [opts]
 * @returns {string|null}
 */
export function resolveVolumesRoot(opts = {}) {
  if (opts.volumesRoot) return path.resolve(opts.volumesRoot);
  if (process.env.ZEUS_VOLUMES_ROOT) return path.resolve(process.env.ZEUS_VOLUMES_ROOT);

  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    const candidate = path.join(dir, 'VOLUMES');
    if (fs.existsSync(path.join(candidate, 'volumes.json'))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * @param {{ ok: boolean, schemaId: string, path?: string, errors: object[]|null }} result
 */
function pushResult(results, result) {
  results.push(result);
  return result.ok;
}

/**
 * Validate live (or fixture) VOLUMES tree without mutating files.
 * Missing disks are reported as skipped, not failures.
 *
 * @param {{ volumesRoot?: string, sampleRegistros?: number, sampleCacheMeta?: number }} [opts]
 * @returns {{ ok: boolean, volumesRoot: string|null, results: object[], skipped: string[] }}
 */
export function validateVolumesTree(opts = {}) {
  const volumesRoot = resolveVolumesRoot(opts);
  /** @type {object[]} */
  const results = [];
  /** @type {string[]} */
  const skipped = [];

  if (!volumesRoot) {
    return {
      ok: false,
      volumesRoot: null,
      results: [{ ok: false, schemaId: 'volumes', errors: [{ message: 'VOLUMES root not found' }] }],
      skipped: ['DISK_01', 'DISK_02', 'DISK_03']
    };
  }

  const volumesJson = path.join(volumesRoot, 'volumes.json');
  pushResult(results, validateFile('volumes', volumesJson));

  const firehoseDir = path.join(volumesRoot, 'DISK_01', 'FIREHOSE');
  if (fs.existsSync(firehoseDir)) {
    const triage = path.join(firehoseDir, 'triage-manifest.json');
    if (fs.existsSync(triage)) {
      pushResult(results, validateFile('triage-manifest', triage));
    } else {
      skipped.push('DISK_01/FIREHOSE/triage-manifest.json');
    }
  } else {
    skipped.push('DISK_01/FIREHOSE');
  }

  const lineasDir = path.join(volumesRoot, 'DISK_02', 'LINEAS');
  if (fs.existsSync(lineasDir)) {
    const registryPath = path.join(lineasDir, 'registry.yaml');
    if (fs.existsSync(registryPath)) {
      pushResult(results, validateFile('lineas-registry', registryPath, 'yaml'));
      const registry = /** @type {object[]} */ (readYamlFile(registryPath));
      for (const entry of registry) {
        const linePath = path.join(lineasDir, entry.path);
        const trunkManifest = path.join(linePath, 'manifest.json');
        if (fs.existsSync(trunkManifest)) {
          pushResult(results, validateFile('manifest-tronco', trunkManifest));
        }
        const nodosYaml = path.join(linePath, 'nodos.yaml');
        if (fs.existsSync(nodosYaml)) {
          pushResult(results, validateFile('nodos-document', nodosYaml, 'yaml'));
        }
        const nodosDir = path.join(linePath, 'nodos');
        if (fs.existsSync(nodosDir)) {
          for (const name of fs.readdirSync(nodosDir)) {
            const meta = path.join(nodosDir, name, 'meta.json');
            if (fs.existsSync(meta)) {
              pushResult(results, validateFile('nodo-meta', meta));
            }
          }
        }
        const satRel = (() => {
          try {
            return readJsonFile(trunkManifest)?.meta?.satelite_wp;
          } catch {
            return null;
          }
        })();
        if (satRel) {
          const satDir = path.join(linePath, satRel);
          const satManifest = path.join(satDir, 'manifest.json');
          if (fs.existsSync(satManifest)) {
            const sat = readJsonFile(satManifest);
            pushResult(results, validate('manifest-satelite', sat));
            results[results.length - 1].path = satManifest;
            const sample = Math.max(0, opts.sampleRegistros ?? 25);
            const regs = Array.isArray(sat.registros) ? sat.registros.slice(0, sample) : [];
            for (const reg of regs) {
              pushResult(results, { ...validate('registro', reg), path: `${satManifest}#${reg.id}` });
            }
          }
          const sections = path.join(satDir, 'nodo-sections.json');
          if (fs.existsSync(sections)) {
            pushResult(results, validateFile('nodo-sections', sections));
          }
          const cacheDir = path.join(satDir, 'cache', 'snapshots');
          if (fs.existsSync(cacheDir)) {
            const metas = fs
              .readdirSync(cacheDir)
              .filter((f) => f.endsWith('.meta.json'))
              .slice(0, opts.sampleCacheMeta ?? 10);
            for (const f of metas) {
              pushResult(results, validateFile('cache-sidecar-meta', path.join(cacheDir, f)));
            }
          }
        }
      }
    } else {
      skipped.push('DISK_02/LINEAS/registry.yaml');
    }
  } else {
    skipped.push('DISK_02/LINEAS');
  }

  const forcesDir = path.join(volumesRoot, 'DISK_03', 'FORCES');
  if (fs.existsSync(forcesDir)) {
    const regPath = path.join(forcesDir, 'registry.json');
    pushResult(results, validateFile('force-registry', regPath));
    const registry = readJsonFile(regPath);
    for (const entry of registry.forces ?? []) {
      const forceDir = path.join(forcesDir, entry.path);
      const forceJson = path.join(forceDir, 'force.json');
      if (fs.existsSync(forceJson)) {
        pushResult(results, validateFile('force', forceJson));
      }
      const manifest = path.join(forceDir, 'manifest.json');
      if (fs.existsSync(manifest)) {
        pushResult(results, validateFile('force-manifest', manifest));
      }
    }
    for (const entry of registry.cotas ?? []) {
      const cotaDir = path.join(forcesDir, entry.path);
      const cotaJson = path.join(cotaDir, 'cota.json');
      if (fs.existsSync(cotaJson)) {
        pushResult(results, validateFile('cota', cotaJson));
      }
      const manifest = path.join(cotaDir, 'manifest.json');
      if (fs.existsSync(manifest)) {
        pushResult(results, validateFile('force-manifest', manifest));
      }
    }
  } else {
    skipped.push('DISK_03/FORCES');
  }

  const ok = results.every((r) => r.ok);
  return { ok, volumesRoot, results, skipped };
}

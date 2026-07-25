/**
 * Escritura de la salida del importador a un directorio (inyectado por env).
 * Estructura por obra bajo `<out>/LINEAS/`:
 *   registry.yaml                         (lineas-registry, todas las obras)
 *   <lineId>/nodos.yaml                   (nodos-document)
 *   <lineId>/manifest.json                (manifest-tronco)
 *   <lineId>/nodos/<nodoId>/meta.json     (nodo-meta)
 *   <lineId>/story-board.json             (story-board)
 *   <lineId>/reparto.json                 (reparto/1)
 *
 * El directorio de salida es del operador y NO entra en git. Aquí no hay rutas
 * horneadas: `outDir` se recibe por argumento.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

/** @param {string} p */
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

/** @param {string} file @param {unknown} obj */
function writeJson(file, obj) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

/** @param {string} file @param {unknown} obj */
function writeYaml(file, obj) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, yaml.stringify(obj), 'utf8');
}

/**
 * @param {ReturnType<import('./importar.mjs').importarCorpus>} bundle
 * @param {string} outDir — directorio inyectado
 * @returns {{ outDir: string, lineasRoot: string, escritos: string[] }}
 */
export function escribirBundle(bundle, outDir) {
  const lineasRoot = path.join(outDir, 'LINEAS');
  /** @type {string[]} */
  const escritos = [];
  const push = (f) => escritos.push(path.relative(outDir, f).split(path.sep).join('/'));

  const registryPath = path.join(lineasRoot, 'registry.yaml');
  writeYaml(registryPath, bundle.registry);
  push(registryPath);

  for (const item of bundle.items) {
    const dir = path.join(lineasRoot, item.lineId);

    const nodosPath = path.join(dir, 'nodos.yaml');
    writeYaml(nodosPath, item.linea.nodosDocument);
    push(nodosPath);

    const manifestPath = path.join(dir, 'manifest.json');
    writeJson(manifestPath, item.linea.manifestTronco);
    push(manifestPath);

    for (const meta of item.linea.metas) {
      const metaPath = path.join(dir, 'nodos', meta.id, 'meta.json');
      writeJson(metaPath, meta);
      push(metaPath);
    }

    const boardPath = path.join(dir, 'story-board.json');
    writeJson(boardPath, item.board);
    push(boardPath);

    const repartoPath = path.join(dir, 'reparto.json');
    writeJson(repartoPath, item.reparto);
    push(repartoPath);
  }

  return { outDir, lineasRoot, escritos };
}

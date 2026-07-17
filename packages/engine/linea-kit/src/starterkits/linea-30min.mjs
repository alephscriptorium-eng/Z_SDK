/**
 * Starterkit: crea tu línea en 30 minutos — synthetic E2E toy line.
 * Trunk 3 nodos + satélite 10 registros; validates against U80 schemas.
 */

import path from 'node:path';
import { validate } from '../validate.mjs';
import { crearLinea, defaultScaffoldNodos } from '../tools/crear-linea.mjs';
import { segmentar } from '../tools/segmentar.mjs';
import { conectarSatelite } from '../tools/conectar-satelite.mjs';
import { fetchSnapshot } from '../tools/fetch.mjs';

/**
 * Build 10 synthetic historial registros (newest-first oldids).
 * @returns {object[]}
 */
export function toyHistorialRegistros() {
  const base = [
    { oldid: 100, byte_delta: 100, summary: 'birth', section: 'Intro', user: 'alice' },
    { oldid: 110, byte_delta: 20, summary: 'typo', section: 'Intro', user: 'bob' },
    { oldid: 120, byte_delta: 600, summary: 'ampliada sección', section: 'Intro', user: 'alice' },
    { oldid: 130, byte_delta: 15, summary: 'fix', section: 'Medio', user: 'carol' },
    { oldid: 140, byte_delta: 40, summary: 'cite', section: 'Medio', user: 'bob' },
    { oldid: 150, byte_delta: 800, summary: 'fusión de artículos', section: 'Medio', user: 'alice' },
    { oldid: 160, byte_delta: 10, summary: 'link', section: 'Cierre', user: 'carol' },
    { oldid: 170, byte_delta: 25, summary: 'style', section: 'Cierre', user: 'bob' },
    { oldid: 180, byte_delta: 550, summary: 'traducción parcial', section: 'Cierre', user: 'alice' },
    { oldid: 190, byte_delta: 5, summary: 'null', section: 'Cierre', user: 'dave' }
  ];
  return base.map((r, i) => ({
    ...r,
    parent_oldid: i === 0 ? 0 : base[i - 1].oldid,
    timestamp: `12:00 1 ene ${1900 + i * 10}`
  }));
}

/**
 * @param {{
 *   lineasRoot: string,
 *   id?: string,
 *   fetchSample?: boolean,
 *   overwrite?: boolean
 * }} options
 */
export function createLineaJuguete(options) {
  const id = options.id ?? 'juguete';
  const lineasRoot = path.resolve(options.lineasRoot);

  const created = crearLinea({
    id,
    lineasRoot,
    etiqueta: 'Línea juguete (starterkit)',
    autorTronco: 'starterkit',
    referenciaWp: 'Toy_Article',
    nodos: defaultScaffoldNodos(),
    overwrite: options.overwrite,
    updateRegistry: true
  });
  if (!created.ok) return created;

  const satDir = created.satDir;
  const segmented = segmentar({
    satDir,
    registros: toyHistorialRegistros(),
    corpus: `linea-${id}-historia`,
    title: 'Toy Article',
    nodoIds: ['N01', 'N02', 'N03'],
    writeNodoSections: true
  });
  if (!segmented.ok) return segmented;

  const connected = conectarSatelite({
    lineDir: created.lineDir,
    lineaId: id,
    wiki: { title: 'Toy_Article' }
  });
  if (!connected.ok) return connected;

  /** @type {object[]} */
  const fetches = [];
  if (options.fetchSample !== false) {
    const sample = fetchSnapshot({
      satDir,
      oldid: 190,
      wikitext: '== Toy Article ==\nSynthetic wikitext for starterkit.\n',
      approve: true,
      title: 'Toy_Article',
      sourceUrl: 'https://example.test/w/index.php?oldid=190'
    });
    if (!sample.ok) return sample;
    fetches.push(sample);
  }

  const validations = [
    validate('manifest-tronco', created.manifest),
    validate('manifest-satelite', segmented.manifest),
    ...segmented.manifest.registros.map((r) => validate('registro', r))
  ];
  const failed = validations.filter((v) => !v.ok);
  if (failed.length) {
    return {
      ok: false,
      error: 'U80 validation failed after starterkit',
      failed,
      rule: 'starterkit.linea.validate'
    };
  }

  return {
    ok: true,
    id,
    lineasRoot,
    lineDir: created.lineDir,
    satDir,
    nodoCount: 3,
    registroCount: 10,
    milestoneCount: segmented.milestoneCount,
    fetches,
    paths: {
      trunkManifest: path.join(created.lineDir, 'manifest.json'),
      satManifest: path.join(satDir, 'manifest.json'),
      registry: path.join(lineasRoot, 'registry.yaml')
    }
  };
}

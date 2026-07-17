/**
 * Starterkit: crea tu force en 30 minutos — synthetic force + cotas stubs.
 */

import path from 'node:path';
import { validate } from '../validate.mjs';
import { segmentarForce } from '../tools/segmentar-force.mjs';
import { crearCotas } from '../tools/crear-cotas.mjs';
import { writeJson } from '../tools/fs-util.mjs';

const TOY_RAW = [
  'User: Outline the viewpoint.',
  'Tool noise: Found 3 web pages',
  'Thinking: map the lore hook to an anchor scene.',
  'Thinking: keep coverage complete.',
  'Output: Scene one establishes the origin of gaze.',
  'User: Deepen the lore.',
  'Tool noise: Read 2 pages',
  'Thinking: pair with lower cota.',
  'Output: Scene two closes the loop without naming a game.'
].join('\n');

/**
 * @param {{
 *   forcesRoot: string,
 *   forceId?: string,
 *   withCotas?: boolean,
 *   overwrite?: boolean
 * }} options
 */
export function createForceJuguete(options) {
  const forceId = options.forceId ?? 'force-juguete';
  const forcesRoot = path.resolve(options.forcesRoot);
  const forceDir = path.join(forcesRoot, 'forces', forceId);

  const segmented = segmentarForce({
    outDir: forceDir,
    forceId,
    kind: 'boot',
    rawText: TOY_RAW,
    session: 'sesion-01',
    viewpoint: 'synthetic origin of gaze',
    lore: 'toy lore hook',
    triggers: ['toy'],
    pairsWith: ['cota:sima'],
    overwrite: options.overwrite,
    scenes: [
      {
        id: 's01-01',
        slug: '01-origen',
        title: 'Origen de mirada',
        lines: [1, 5],
        prompt: [1, 1],
        trace: [2],
        think: [3, 4],
        output: [5, 5],
        tags: ['toy', 'boot'],
        anchor: true
      },
      {
        id: 's01-02',
        slug: '02-cierre',
        title: 'Cierre',
        lines: [6, 9],
        prompt: [6, 6],
        trace: [7],
        think: [8, 8],
        output: [9, 9],
        tags: ['toy']
      }
    ]
  });
  if (!segmented.ok) return segmented;

  /** @type {object[]} */
  const cotas = [];
  if (options.withCotas !== false) {
    for (const spec of [
      { id: 'sima', bound: /** @type {'lower'} */ ('lower') },
      { id: 'cima', bound: /** @type {'upper'} */ ('upper') }
    ]) {
      const cota = crearCotas({
        outDir: path.join(forcesRoot, 'cotas', spec.id),
        id: spec.id,
        bound: spec.bound,
        pairsWith: [`boot:${forceId}`],
        overwrite: options.overwrite
      });
      if (!cota.ok) return cota;
      cotas.push(cota);
    }
  }

  const registry = {
    registry: 'forces',
    version: '0.1.0',
    description: 'Starterkit toy force registry',
    activation: {
      session_budget: { max_active_forces: 2, boot_always_on: true },
      exclusions: [],
      cotas: { lower: 'sima', upper: 'cima' }
    },
    boot: forceId,
    forces: [
      {
        id: forceId,
        kind: 'boot',
        type: 'synthetic',
        viewpoint: segmented.force.viewpoint,
        anchor_scene: segmented.anchor_scene,
        triggers: ['toy'],
        pairs_with: ['cota:sima'],
        scene_count: segmented.scene_count,
        path: `forces/${forceId}/`
      }
    ],
    cotas: cotas.map((c) => ({
      id: c.id,
      kind: 'cota',
      bound: c.bound,
      pole: c.pole,
      scene_count: 1,
      path: `cotas/${c.id}/`
    }))
  };

  const regResult = validate('force-registry', registry);
  if (!regResult.ok) {
    return {
      ok: false,
      error: 'force-registry invalid',
      validation: regResult,
      rule: 'starterkit.force.registry'
    };
  }
  writeJson(path.join(forcesRoot, 'registry.json'), registry);

  return {
    ok: true,
    forceId,
    forcesRoot,
    forceDir,
    coverage: segmented.coverage,
    cotas: cotas.map((c) => c.id),
    registryPath: path.join(forcesRoot, 'registry.json')
  };
}

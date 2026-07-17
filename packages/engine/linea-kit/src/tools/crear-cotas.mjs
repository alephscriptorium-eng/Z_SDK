/**
 * crear-cotas — author cota lines (sima|cima / lower|upper). DATOS.md §8 / D-19.
 */

import path from 'node:path';
import { validate } from '../validate.mjs';
import { ensureDir, exists, nowIso, writeJson, writeText } from './fs-util.mjs';

const BOUND_BY_POLE = Object.freeze({
  colapso: 'lower',
  victoria: 'upper'
});

const POLE_BY_BOUND = Object.freeze({
  lower: 'colapso',
  upper: 'victoria'
});

/**
 * @param {'sima'|'cima'|string} id
 * @param {'lower'|'upper'|undefined} bound
 */
function resolveBound(id, bound) {
  if (bound === 'lower' || bound === 'upper') return bound;
  if (id === 'sima') return 'lower';
  if (id === 'cima') return 'upper';
  return 'lower';
}

/**
 * @param {{
 *   outDir: string,
 *   id: string,
 *   bound?: 'lower'|'upper',
 *   pole?: 'colapso'|'victoria',
 *   viewpoint?: string,
 *   lore?: string|null,
 *   anchorScene?: string,
 *   triggers?: string[],
 *   pairsWith?: string[],
 *   scenes?: object[],
 *   overwrite?: boolean
 * }} options
 */
export function crearCotas(options) {
  if (!options.outDir || !options.id) {
    return {
      ok: false,
      error: 'outDir and id are required',
      rule: 'crear-cotas.args'
    };
  }

  const cotaDir = path.resolve(options.outDir);
  if (exists(path.join(cotaDir, 'cota.json')) && !options.overwrite) {
    return {
      ok: false,
      error: `cota.json exists in ${cotaDir} (pass overwrite: true)`,
      rule: 'crear-cotas.exists'
    };
  }

  const bound = resolveBound(options.id, options.bound);
  const pole = options.pole ?? POLE_BY_BOUND[bound];
  if (BOUND_BY_POLE[pole] !== bound) {
    return {
      ok: false,
      error: `pole ${pole} incompatible with bound ${bound}`,
      rule: 'crear-cotas.pole_bound'
    };
  }

  const session = 'sesion-01';
  const defaultSlug = '01-bound';
  const anchor_scene = options.anchorScene ?? `${session}/${defaultSlug}`;

  const scenes =
    options.scenes?.length > 0
      ? options.scenes
      : [
          {
            id: 's01-01',
            session,
            slug: defaultSlug,
            title: `Cota ${options.id} anchor`,
            rol: [bound === 'lower' ? 'ruptura' : 'confluencia'],
            tags: [`cota:${options.id}`, bound],
            files: {
              prompt: `escenas/${session}/${defaultSlug}/prompt.md`,
              think: `escenas/${session}/${defaultSlug}/think.md`,
              output: `escenas/${session}/${defaultSlug}/output.md`
            }
          }
        ];

  ensureDir(path.join(cotaDir, 'escenas', session, defaultSlug));
  if (!options.scenes?.length) {
    for (const layer of ['prompt', 'think', 'output']) {
      writeText(
        path.join(cotaDir, 'escenas', session, defaultSlug, `${layer}.md`),
        [
          '---',
          `cota: ${options.id}`,
          `bound: ${bound}`,
          `layer: ${layer}`,
          '---',
          '',
          `Synthetic ${layer} for cota ${options.id} (${bound}/${pole}).`,
          ''
        ].join('\n')
      );
    }
  }

  const manifest = {
    id: options.id,
    kind: 'cota',
    description: `Cota ${options.id} (${bound}) — crear-cotas @ ${nowIso()}`,
    anchor_scene,
    scene_count: scenes.length,
    scenes
  };

  const cotaJson = {
    id: options.id,
    kind: 'cota',
    bound,
    pole,
    viewpoint: options.viewpoint ?? `${bound} bound`,
    lore: options.lore ?? null,
    anchor_scene,
    triggers: options.triggers ?? ['bound'],
    pairs_with: options.pairsWith ?? [],
    scene_count: scenes.length,
    provenance: { created_at: nowIso(), tool: 'crear-cotas' }
  };

  const mResult = validate('force-manifest', manifest);
  if (!mResult.ok) {
    return {
      ok: false,
      error: 'force-manifest invalid',
      validation: mResult,
      rule: 'crear-cotas.manifest_schema'
    };
  }
  const cResult = validate('cota', cotaJson);
  if (!cResult.ok) {
    return {
      ok: false,
      error: 'cota.json invalid',
      validation: cResult,
      rule: 'crear-cotas.cota_schema'
    };
  }

  writeJson(path.join(cotaDir, 'manifest.json'), manifest);
  writeJson(path.join(cotaDir, 'cota.json'), cotaJson);
  writeText(
    path.join(cotaDir, 'README.md'),
    `# Cota ${options.id}\n\nbound=${bound} pole=${pole}\n\nScaffold \`crear-cotas\` (@zeus/linea-kit).\n`
  );

  return {
    ok: true,
    cotaDir,
    id: options.id,
    bound,
    pole,
    anchor_scene,
    manifest,
    cota: cotaJson
  };
}

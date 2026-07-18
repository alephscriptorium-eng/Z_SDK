/**
 * Materialize a world draft into @zeus/startpack-sketch (U62 pack shape).
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createLineaJuguete } from '@zeus/linea-kit/starterkits';
import { listCasoIds, checkPlaybookCoherence } from '@zeus/playbook-kit';
import { SCENE_CATALOG, validateDraft } from './materials.mjs';
import { resolveStartpackDir } from './resolve-library.mjs';

/**
 * @param {object} draft
 * @param {{ libraryRoot: string, game?: string }} opts
 */
export function materializeStartPack(draft, opts) {
  const checked = validateDraft(draft);
  if (!checked.ok) {
    return { ok: false, error: checked.error, rule: checked.rule };
  }
  const d = checked.draft;
  const game = opts.game || d.gameId;
  const packRoot = resolveStartpackDir(opts.libraryRoot, game);
  const sceneEntry = SCENE_CATALOG[d.sceneId];

  const coherence = checkPlaybookCoherence(d.casosMd, {
    expectedIds: listCasoIds(d.casosMd),
    toolPattern: /`\w+\s*\{/
  });
  if (!coherence.ok) {
    return {
      ok: false,
      error: `casos coherence: ${coherence.errors.join('; ')}`,
      rule: 'world.release.casos'
    };
  }

  mkdirSync(path.join(packRoot, 'seeds'), { recursive: true });
  mkdirSync(path.join(packRoot, 'acta'), { recursive: true });
  mkdirSync(path.join(packRoot, 'volumes', 'DISK_02', 'LINEAS'), { recursive: true });

  const scene = structuredClone(sceneEntry.scene);
  const gamemap = {
    id: `${game}-demo`,
    sceneId: scene.id,
    scene: 'seeds/scene.json',
    lineId: d.lineId,
    labelset: [...d.labelset],
    startPack: Array.isArray(d.cloakIds) ? [...d.cloakIds] : [],
    objetivo: { cases: coherence.ids.length },
    seeds: { feedSeed: 1 },
    cues: []
  };

  writeFileSync(path.join(packRoot, 'seeds', 'scene.json'), JSON.stringify(scene, null, 2), 'utf8');
  writeFileSync(path.join(packRoot, 'seeds', 'gamemap.json'), JSON.stringify(gamemap, null, 2), 'utf8');
  writeFileSync(path.join(packRoot, 'seeds', 'casos.md'), d.casosMd, 'utf8');

  const lineRoot = path.join(packRoot, 'volumes', 'DISK_02', 'LINEAS');
  const lineResult = createLineaJuguete({
    lineasRoot: lineRoot,
    id: d.lineId,
    overwrite: true
  });
  if (!lineResult.ok) {
    return {
      ok: false,
      error: lineResult.error || 'createLineaJuguete failed',
      rule: lineResult.rule || 'world.release.line',
      detail: lineResult
    };
  }

  const volumesJson = {
    root: '.',
    volumes: {
      lineas: {
        disk: 'DISK_02',
        path: 'DISK_02/LINEAS',
        readonly: true,
        label: 'Lineas (startpack sketch)'
      },
      forces: {
        disk: 'DISK_03',
        path: 'DISK_03/FORCES',
        readonly: true,
        label: 'Forces (startpack synthetic fixture)'
      }
    }
  };
  writeFileSync(
    path.join(packRoot, 'volumes', 'volumes.json'),
    JSON.stringify(volumesJson, null, 2),
    'utf8'
  );

  const pkgPath = path.join(packRoot, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    pkg.version = d.version || pkg.version;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }

  const manifestPath = path.join(packRoot, 'manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.version = d.version || manifest.version;
    manifest.round = {
      ...(manifest.round || {}),
      gamemapId: gamemap.id,
      lineId: d.lineId,
      seed: 1,
      feeds: 'synthetic'
    };
    manifest.objetivo = gamemap.objetivo;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }

  return {
    ok: true,
    packRoot,
    gamemap,
    sceneId: scene.id,
    lineId: d.lineId,
    casoIds: coherence.ids,
    line: lineResult
  };
}

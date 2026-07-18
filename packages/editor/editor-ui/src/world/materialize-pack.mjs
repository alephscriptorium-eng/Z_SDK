/**
 * Materialize a world draft into @zeus/startpack-<game> (U62 pack shape).
 * Table of materializers by GAME_CATALOG.kind — sketch is a preset, not a ceiling.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createLineaJuguete } from '@zeus/linea-kit/starterkits';
import { listCasoIds, checkPlaybookCoherence } from '@zeus/playbook-kit';
import { SCENE_CATALOG, GAME_CATALOG, validateDraft } from './materials.mjs';
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
  const entry = GAME_CATALOG[game];
  if (!entry) {
    return {
      ok: false,
      error: `unknown game "${game}" for materialize`,
      rule: 'world.release.gameId'
    };
  }
  const materializer = MATERIALIZERS[entry.kind];
  if (!materializer) {
    return {
      ok: false,
      error: `no materializer for kind "${entry.kind}"`,
      rule: 'world.release.kind'
    };
  }
  return materializer(d, { ...opts, game, entry });
}

/**
 * @param {object} d
 * @param {{ libraryRoot: string, game: string, entry: object }} ctx
 */
function ensurePackScaffold(d, ctx) {
  const packRoot = resolveStartpackDir(ctx.libraryRoot, ctx.game);
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
  return { ok: true, packRoot, coherence };
}

/**
 * @param {string} packRoot
 * @param {string} lineId
 */
function writeLinea(packRoot, lineId) {
  const lineRoot = path.join(packRoot, 'volumes', 'DISK_02', 'LINEAS');
  return createLineaJuguete({
    lineasRoot: lineRoot,
    id: lineId,
    overwrite: true
  });
}

/**
 * @param {string} packRoot
 * @param {object} d
 * @param {object} gamemap
 * @param {object} volumesJson
 */
function bumpPackMeta(packRoot, d, gamemap, volumesJson) {
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
}

/**
 * Toy path (sketch preset): scene + labelset + line + casos.
 * @param {object} d
 * @param {{ libraryRoot: string, game: string }} ctx
 */
function materializeToyPack(d, ctx) {
  const scaffold = ensurePackScaffold(d, ctx);
  if (!scaffold.ok) return scaffold;
  const { packRoot, coherence } = scaffold;
  const sceneEntry = SCENE_CATALOG[d.sceneId];
  if (!sceneEntry) {
    return { ok: false, error: `unknown sceneId "${d.sceneId}"`, rule: 'world.release.sceneId' };
  }

  const scene = structuredClone(sceneEntry.scene);
  const gamemap = {
    id: `${ctx.game}-demo`,
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

  const lineResult = writeLinea(packRoot, d.lineId);
  if (!lineResult.ok) {
    return {
      ok: false,
      error: lineResult.error || 'createLineaJuguete failed',
      rule: lineResult.rule || 'world.release.line',
      detail: lineResult
    };
  }

  bumpPackMeta(packRoot, d, gamemap, {
    root: '.',
    volumes: {
      lineas: {
        disk: 'DISK_02',
        path: 'DISK_02/LINEAS',
        readonly: true,
        label: `Lineas (startpack ${ctx.game})`
      },
      forces: {
        disk: 'DISK_03',
        path: 'DISK_03/FORCES',
        readonly: true,
        label: 'Forces (startpack synthetic fixture)'
      }
    }
  });

  return {
    ok: true,
    packRoot,
    gamemap,
    sceneId: scene.id,
    lineId: d.lineId,
    casoIds: coherence.ids,
    line: lineResult,
    kind: 'toy'
  };
}

/**
 * Narrative path (plaza): story-board + actos + line + casos (+ uichain stubs).
 * @param {object} d
 * @param {{ libraryRoot: string, game: string, entry: object }} ctx
 */
function materializeNarrativePack(d, ctx) {
  const scaffold = ensurePackScaffold(d, ctx);
  if (!scaffold.ok) return scaffold;
  const { packRoot, coherence } = scaffold;

  const storyBoard = structuredClone(d.storyBoard);
  const gamemap = {
    id: `${ctx.game}-demo`,
    lineId: d.lineId,
    labelset: [...d.labelset],
    storyBoard: 'seeds/story-board.json',
    startPack: Array.isArray(d.cloakIds) ? [...d.cloakIds] : [],
    objetivo: { cases: coherence.ids.length, acts: storyBoard.acts?.length || 0 },
    seeds: { feedSeed: 1 },
    cues: []
  };

  writeFileSync(
    path.join(packRoot, 'seeds', 'story-board.json'),
    JSON.stringify(storyBoard, null, 2),
    'utf8'
  );
  writeFileSync(path.join(packRoot, 'seeds', 'gamemap.json'), JSON.stringify(gamemap, null, 2), 'utf8');
  writeFileSync(path.join(packRoot, 'seeds', 'casos.md'), d.casosMd, 'utf8');

  // Minimal carpeta-shaped dramaturgia stubs (REIC / seed panels as prompts)
  const uichainDir = path.join(packRoot, 'seeds', 'uichain');
  mkdirSync(uichainDir, { recursive: true });
  writeFileSync(
    path.join(uichainDir, 'panel-seed.prompt.md'),
    '# panel-seed\n\nWidget semilla (materializado desde editor mundo A).\n',
    'utf8'
  );
  writeFileSync(
    path.join(uichainDir, 'panel-reic.prompt.md'),
    '# panel-reic\n\nREIC mínimo (materializado desde editor mundo A).\n',
    'utf8'
  );
  mkdirSync(path.join(packRoot, 'seeds', 'agentchain'), { recursive: true });
  writeFileSync(
    path.join(packRoot, 'seeds', 'agentchain', 'block-0.md'),
    '# agentchain block-0\n\nStub narrativo plaza.\n',
    'utf8'
  );

  const lineResult = writeLinea(packRoot, d.lineId);
  if (!lineResult.ok) {
    return {
      ok: false,
      error: lineResult.error || 'createLineaJuguete failed',
      rule: lineResult.rule || 'world.release.line',
      detail: lineResult
    };
  }

  bumpPackMeta(packRoot, d, gamemap, {
    root: '.',
    volumes: {
      lineas: {
        disk: 'DISK_02',
        path: 'DISK_02/LINEAS',
        readonly: true,
        label: `Lineas (startpack ${ctx.game})`
      }
    }
  });

  const manifestPath = path.join(packRoot, 'manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.seeds = {
      ...(manifest.seeds || {}),
      gamemap: 'seeds/gamemap.json',
      storyBoard: 'seeds/story-board.json',
      casos: 'seeds/casos.md'
    };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }

  return {
    ok: true,
    packRoot,
    gamemap,
    storyBoard,
    lineId: d.lineId,
    casoIds: coherence.ids,
    line: lineResult,
    kind: 'narrative',
    dialect: ctx.entry.dialect || 'solve-inline'
  };
}

/** @type {Record<string, Function>} */
const MATERIALIZERS = {
  toy: materializeToyPack,
  narrative: materializeNarrativePack
};

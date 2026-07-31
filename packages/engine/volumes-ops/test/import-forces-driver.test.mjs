/**
 * WP-U203 · Driver FORCES sobre importPack — soporte RO-INMUTABLE.
 * CA-1 import entero (shape pozo sintética) · CA-2 idéntico=no-op /
 * distinto=ERROR sin root a medias · CA-3 escenas .md = soporte RO (cero
 * camino de curación) · snapshot por hash sellado en el manifiesto.
 * Fixture sintética con la MISMA forma que la canónica de linea-kit
 * (test/fixtures/forces: registry.json + force.json + manifest.json +
 * escenas prompt/think/output.md + cotas/sima) — el pack real
 * startpack-pozo es obra de G y queda ⏳ para U206.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import { importPack, hashManifest } from '../src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORCES_FIXTURE = path.resolve(__dirname, '../../linea-kit/test/fixtures/forces');
const VOL_REL = 'DISK_03/FORCES';
const SCENE_OUTPUT = 'forces/force-sample/escenas/sesion-01/01-sample/output.md';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function collectFiles(dir, rel = '') {
  /** @type {string[]} */
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...collectFiles(path.join(dir, entry.name), childRel));
    else if (entry.isFile()) out.push(childRel);
  }
  return out.sort();
}

function setupRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u203-root-'));
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    `${JSON.stringify({ root: '.', volumes: {} }, null, 2)}\n`,
    'utf8'
  );
  const prev = process.env.ZEUS_VOLUMES_ROOT;
  process.env.ZEUS_VOLUMES_ROOT = root;
  resetZeusEnvLoader();
  resetVolumesCache();
  return {
    root,
    restore() {
      if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
      else process.env.ZEUS_VOLUMES_ROOT = prev;
      resetZeusEnvLoader();
      resetVolumesCache();
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
}

/**
 * Pack FORCES sintético (shape pozo): copia de la fixture canónica de
 * linea-kit + mutaciones opcionales.
 * @param {{ name?: string, version?: string, mutate?: (dataDir: string) => void }} [opts]
 */
function buildForcesPack(opts = {}) {
  const { name = 'pack-pozo-sintetico', version = '1.0.0', mutate = null } = opts;
  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u203-pack-'));
  const dataDir = path.join(packRoot, 'volumes', ...VOL_REL.split('/'));
  for (const rel of collectFiles(FORCES_FIXTURE)) {
    const to = path.join(dataDir, rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(FORCES_FIXTURE, rel.split('/').join(path.sep)), to);
  }
  if (mutate) mutate(dataDir);

  const volumesDir = path.join(packRoot, 'volumes');
  /** @type {Record<string, string>} */
  const hashes = {};
  for (const rel of collectFiles(volumesDir)) {
    hashes[rel] = sha256(fs.readFileSync(path.join(volumesDir, rel.split('/').join(path.sep))));
  }
  fs.writeFileSync(
    path.join(packRoot, 'manifest.json'),
    JSON.stringify(
      {
        name,
        version,
        volumes: {
          forces: {
            disk: 'DISK_03',
            path: VOL_REL,
            readonly: true,
            label: 'Forces (pack sintetico U203)',
            corpora: [
              { id: 'forces', path: 'forces', label: 'Forces' },
              { id: 'cotas', path: 'cotas', label: 'Cotas' }
            ]
          }
        },
        hashes
      },
      null,
      2
    ),
    'utf8'
  );
  return { packRoot, dataDir };
}

/** Añade una unidad force nueva clonando force-sample + registry superset. */
function addForceUnit(dataDir, forceId, { position = 'end' } = {}) {
  const srcDir = path.join(dataDir, 'forces', 'force-sample');
  const dstDir = path.join(dataDir, 'forces', forceId);
  fs.mkdirSync(dstDir, { recursive: true });
  const force = JSON.parse(fs.readFileSync(path.join(srcDir, 'force.json'), 'utf8'));
  force.id = forceId;
  force.kind = 'force'; // enum real del schema: ['force','boot']
  force.lore = `lore sintetico de ${forceId} (U203)`;
  fs.writeFileSync(path.join(dstDir, 'force.json'), JSON.stringify(force, null, 2), 'utf8');

  const regPath = path.join(dataDir, 'registry.json');
  const registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  const entry = structuredClone(registry.forces.find((f) => f.id === 'force-sample'));
  entry.id = forceId;
  entry.kind = 'force';
  entry.path = `forces/${forceId}/`;
  if (position === 'start') registry.forces.unshift(entry);
  else registry.forces.push(entry);
  fs.writeFileSync(regPath, JSON.stringify(registry, null, 2), 'utf8');
}

const manifestBytes = (root) => fs.readFileSync(path.join(root, 'volumes.json'), 'utf8');
const rootFile = (root, rel) =>
  path.join(root, VOL_REL.split('/').join(path.sep), rel.split('/').join(path.sep));
const noStagingLeft = (root) => fs.readdirSync(root).every((n) => !n.startsWith('.import-staging'));

test('CA-1: pack shape-pozo importa ENTERO — familia sellada, snapshot por hash, corpora medidos', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildForcesPack();
  try {
    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.ok(res.steps.some((s) => s.step === 'familia' && s.families.forces === 'forces'));

    // Todas las piezas aterrizan: registry, force, manifest, escenas, cota.
    for (const rel of [
      'registry.json',
      'forces/force-sample/force.json',
      'forces/force-sample/manifest.json',
      SCENE_OUTPUT,
      'forces/force-sample/escenas/sesion-01/01-sample/prompt.md',
      'cotas/sima/cota.json',
      'cotas/sima/manifest.json'
    ]) {
      assert.ok(fs.existsSync(rootFile(root, rel)), `falta ${rel}`);
    }

    // CA-3 (parcial): cero camino de curación en FORCES.
    const fam = res.families.find((f) => f.id === 'forces');
    assert.equal(fam.family, 'forces');
    assert.equal(fam.divergences.length, 0);
    assert.equal(fam.protectedSidecars.length, 0);

    // Snapshot por hash sellado en el manifiesto (vía importPack).
    const cfg = JSON.parse(manifestBytes(root));
    assert.equal(cfg.volumes.forces.family, 'forces');
    const snapshot = cfg.volumes.forces.source.imported.snapshot;
    assert.match(snapshot['forces/force-sample'], /^[0-9a-f]{64}$/);
    assert.match(snapshot['cotas/sima'], /^[0-9a-f]{64}$/);

    // Corpora del manifiesto poblados con conteo medido (U199/U201).
    const forcesCorpus = cfg.volumes.forces.corpora.find((c) => c.id === 'forces');
    assert.equal(forcesCorpus.files, 5); // force.json + manifest + 3 escenas
    assert.equal(cfg.volumes.forces.corpora.find((c) => c.id === 'cotas').files, 2);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('CA-2: unidad idéntica = no-op; incremental aterriza; registry reemplazado como superset', () => {
  const { root, restore } = setupRoot();
  const packA = buildForcesPack();
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);

    // Reimport global → no-op por packHash (CA-3 de U201 sigue vivo aquí).
    const again = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(again.noop, true);
    assert.equal(again.manifestSha256, first.manifestSha256);

    // Pack B incremental: force-b nuevo + registry superconjunto.
    const packB = buildForcesPack({
      name: 'pack-pozo-b',
      version: '1.1.0',
      mutate(dataDir) {
        addForceUnit(dataDir, 'force-b');
      }
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res.steps));

    assert.ok(fs.existsSync(rootFile(root, 'forces/force-b/force.json')));
    const fam = res.families.find((f) => f.id === 'forces');
    assert.ok(fam.skipped >= 2, 'force-sample y cotas/sima idénticos → no-op de unidad');

    // El registry del root ahora lista force-b (índice reemplazado con guardas).
    const rootRegistry = JSON.parse(fs.readFileSync(rootFile(root, 'registry.json'), 'utf8'));
    assert.ok(rootRegistry.forces.some((f) => f.id === 'force-b'));

    // Snapshot re-sellado con las dos unidades force + la cota.
    const cfg = JSON.parse(manifestBytes(root));
    const snapshot = cfg.volumes.forces.source.imported.snapshot;
    assert.ok(snapshot['forces/force-b']);
    assert.ok(snapshot['forces/force-sample']);

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('CA-2/CA-3: escena .md modificada = COLISIÓN que aborta — sin root a medias, sin curación', () => {
  const { root, restore } = setupRoot();
  const packA = buildForcesPack();
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    const bytesAfterA = manifestBytes(root);
    const sceneBefore = fs.readFileSync(rootFile(root, SCENE_OUTPUT));

    // Pack C: force-c nuevo ENCOLADO PRIMERO + escena de force-sample
    // alterada (RO-inmutable violado). El pase dry debe abortar TODO.
    const packC = buildForcesPack({
      name: 'pack-pozo-c',
      version: '2.0.0',
      mutate(dataDir) {
        addForceUnit(dataDir, 'force-c', { position: 'start' });
        fs.writeFileSync(
          path.join(dataDir, SCENE_OUTPUT.split('/').join(path.sep)),
          '# ESCENA ALTERADA (pack sintetico)\n',
          'utf8'
        );
      }
    });
    const res = importPack({ packRoot: packC.packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'colision_force');
    assert.equal(res.unit, 'forces/force-sample');

    // Sin root a medias: sello intacto, force-c NO aterrizó, escena intacta
    // byte a byte (soporte RO — jamás tratada como curación/divergencia).
    assert.equal(manifestBytes(root), bytesAfterA);
    assert.equal(hashManifest().sha256, first.manifestSha256);
    assert.ok(!fs.existsSync(rootFile(root, 'forces/force-c')));
    assert.deepEqual(fs.readFileSync(rootFile(root, SCENE_OUTPUT)), sceneBefore);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packC.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('guardas del índice: registry que huérfana una unidad existente = registro_incompleto', () => {
  const { root, restore } = setupRoot();
  const packA = buildForcesPack();
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    const bytesAfterA = manifestBytes(root);

    const packD = buildForcesPack({
      name: 'pack-pozo-d',
      version: '3.0.0',
      mutate(dataDir) {
        // Sustituye force-sample por force-x: el registry del pack ya no
        // lista la unidad existente → huérfano. (El schema real exige
        // forces con minItems 1 y kind del enum — no vale vaciar el array.)
        addForceUnit(dataDir, 'force-x');
        const regPath = path.join(dataDir, 'registry.json');
        const registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));
        registry.forces = registry.forces.filter((f) => f.id !== 'force-sample');
        registry.boot = 'force-x';
        fs.writeFileSync(regPath, JSON.stringify(registry, null, 2), 'utf8');
        fs.rmSync(path.join(dataDir, 'forces', 'force-sample'), {
          recursive: true,
          force: true
        });
      }
    });
    const res = importPack({ packRoot: packD.packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'registro_incompleto');
    assert.deepEqual(res.missing, ['force:force-sample']);
    assert.equal(manifestBytes(root), bytesAfterA);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packD.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('validate real: registry.json ausente con familia declarada → familia_invalida (gate U80)', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildForcesPack({
    mutate(dataDir) {
      fs.rmSync(path.join(dataDir, 'registry.json'));
    }
  });
  // Sin registry.json no hay firma: declaramos la familia en el manifest.
  const manifest = JSON.parse(fs.readFileSync(path.join(packRoot, 'manifest.json'), 'utf8'));
  manifest.volumes.forces.family = 'forces';
  fs.writeFileSync(path.join(packRoot, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    assert.match(JSON.stringify(res.results), /registry\.json ausente/);
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
    assert.ok(!fs.existsSync(path.join(root, 'DISK_03')));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

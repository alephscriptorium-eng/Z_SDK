/**
 * WP-U201 · CONTRATO-IMPORT-PACK-v1 (plan/CONTRATO-IMPORT-PACK-v1.md).
 * 7 pasos con test + casos rojos: verificar (hash roto, sin enumerar,
 * identidad, symlink), staging limpio, validar (schema), fusionar
 * (colisión CA-2), sellar (corpora poblados), no-op (CA-3), no-link (CA-4).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import { importPack, hashManifest, readOpsLedger } from '../src/index.mjs';

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/** Destination sandbox: volumes root with a minimal sealed manifest. */
function setupRoot(manifest = { root: '.', volumes: {} }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u201-root-'));
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
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
 * Synthetic pack fixture (shape declared in contract §0.7).
 * @param {{ name?: string, version?: string, volumes?: object, files?: Record<string,string> }} [opts]
 */
function buildPack(opts = {}) {
  const {
    name = 'pack-demo',
    version = '1.0.0',
    volumes = {
      demo: {
        disk: 'DISK_07',
        path: 'DISK_07/DEMO',
        readonly: true,
        label: 'Demo pack volume',
        corpora: [
          { id: 'raw', path: 'raw', label: 'Raw' },
          { id: 'curated', path: 'curated', label: 'Curated' }
        ]
      }
    },
    files = {
      'DISK_07/DEMO/raw/a.json': '{"post":"uno"}',
      'DISK_07/DEMO/raw/b.json': '{"post":"dos"}',
      'DISK_07/DEMO/curated/keep.md': '# curado\n'
    }
  } = opts;

  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u201-pack-'));
  const hashes = {};
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(packRoot, 'volumes', rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
    hashes[rel] = sha256(Buffer.from(content, 'utf8'));
  }
  fs.writeFileSync(
    path.join(packRoot, 'manifest.json'),
    JSON.stringify({ name, version, volumes, hashes }, null, 2),
    'utf8'
  );
  return { packRoot, files, hashes };
}

function manifestBytes(root) {
  return fs.readFileSync(path.join(root, 'volumes.json'), 'utf8');
}

function noStagingLeft(root) {
  return fs.readdirSync(root).every((n) => !n.startsWith('.import-staging'));
}

test('pipeline verde: verificar→staging→validar→fusionar→sellar→no-link, corpora poblados, ledger', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildPack();
  try {
    const before = manifestBytes(root);
    const res = importPack({
      packRoot,
      role: 'operator',
      actorId: 'op-1',
      origin: 'https://example.test/release/pack-demo-1.0.0.tgz'
    });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(res.noop, false);
    assert.deepEqual(
      res.steps.map((s) => s.step),
      ['verificar', 'staging', 'validar', 'fusionar', 'sellar', 'no-link']
    );
    assert.ok(res.steps.every((s) => s.ok === true));

    // Datos aterrizados.
    assert.ok(fs.existsSync(path.join(root, 'DISK_07', 'DEMO', 'raw', 'a.json')));
    assert.ok(fs.existsSync(path.join(root, 'DISK_07', 'DEMO', 'curated', 'keep.md')));

    // SELLAR: manifiesto re-sellado por el único escritor legítimo —
    // corpora con conteos MEDIDOS (import pobla corpora) + procedencia inerte.
    const cfg = JSON.parse(manifestBytes(root));
    const demo = cfg.volumes.demo;
    assert.equal(demo.disk, 'DISK_07');
    assert.equal(demo.source.imported.name, 'pack-demo');
    assert.equal(demo.source.imported.packHash, res.packHash);
    assert.equal(demo.source.imported.origin, 'https://example.test/release/pack-demo-1.0.0.tgz');
    const raw = demo.corpora.find((c) => c.id === 'raw');
    const curated = demo.corpora.find((c) => c.id === 'curated');
    assert.equal(raw.files, 2);
    assert.equal(curated.files, 1);
    assert.ok(raw.bytes > 0);

    // Sello nuevo y verificable.
    assert.notEqual(res.manifestSha256, res.manifestSha256Before);
    assert.equal(hashManifest().sha256, res.manifestSha256);
    assert.notEqual(manifestBytes(root), before);

    // Estado (U199) y ledger.
    const state = JSON.parse(
      fs.readFileSync(path.join(root, 'volumes.state.json'), 'utf8')
    );
    assert.equal(state.volumes.demo.files, 3);
    assert.equal(state.manifest.sha256, res.manifestSha256);
    const ledger = readOpsLedger({ volumesRoot: root });
    assert.ok(ledger.some((e) => e.kind === 'import_pack' && e.role === 'operator'));

    // Staging nunca sobrevive.
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('CA-3 no-op: reimportar el mismo pack = cero cambio, sello idéntico', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildPack();
  try {
    const first = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(first.ok, true);
    const bytesAfterFirst = manifestBytes(root);

    const second = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(second.ok, true);
    assert.equal(second.noop, true);
    assert.equal(second.manifestSha256, first.manifestSha256);
    assert.equal(manifestBytes(root), bytesAfterFirst);
    assert.ok(second.steps.some((s) => s.step === 'no-op' && s.ok));
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('VERIFICAR rojos: hash roto · fichero sin enumerar · material de identidad — root intacto', () => {
  const { root, restore } = setupRoot();
  try {
    const before = manifestBytes(root);

    // hash roto
    const tampered = buildPack();
    fs.writeFileSync(
      path.join(tampered.packRoot, 'volumes', 'DISK_07', 'DEMO', 'raw', 'a.json'),
      '{"post":"alterado"}',
      'utf8'
    );
    const r1 = importPack({ packRoot: tampered.packRoot, role: 'operator' });
    assert.equal(r1.ok, false);
    assert.equal(r1.step, 'verificar');
    assert.equal(r1.error, 'hash_no_coincide');

    // fichero sin enumerar
    const stray = buildPack();
    fs.writeFileSync(
      path.join(stray.packRoot, 'volumes', 'DISK_07', 'DEMO', 'raw', 'colado.bin'),
      'x',
      'utf8'
    );
    const r2 = importPack({ packRoot: stray.packRoot, role: 'operator' });
    assert.equal(r2.ok, false);
    assert.equal(r2.error, 'fichero_sin_enumerar');

    // material de identidad (denylist §0.5)
    const secret = buildPack({
      files: {
        'DISK_07/DEMO/raw/a.json': '{"post":"uno"}',
        'DISK_07/DEMO/raw/.env': 'ZEUS_SECRET=nope'
      },
      volumes: {
        demo: {
          disk: 'DISK_07',
          path: 'DISK_07/DEMO',
          corpora: [{ id: 'raw', path: 'raw' }]
        }
      }
    });
    const r3 = importPack({ packRoot: secret.packRoot, role: 'operator' });
    assert.equal(r3.ok, false);
    assert.equal(r3.error, 'material_de_identidad');

    // Root intacto en los tres rojos: mismo contenido, cero staging, cero datos.
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
    assert.ok(!fs.existsSync(path.join(root, 'DISK_07')));

    fs.rmSync(tampered.packRoot, { recursive: true, force: true });
    fs.rmSync(stray.packRoot, { recursive: true, force: true });
    fs.rmSync(secret.packRoot, { recursive: true, force: true });
  } finally {
    restore();
  }
});

test('CA-4 sin symlinks: junction plantada en el pack → rechazo en VERIFICAR', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildPack();
  try {
    const before = manifestBytes(root);
    const target = path.join(packRoot, 'fuera-del-volumen');
    fs.mkdirSync(target, { recursive: true });
    fs.symlinkSync(
      target,
      path.join(packRoot, 'volumes', 'DISK_07', 'DEMO', 'raw', 'ancla-viva'),
      'junction'
    );
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'verificar');
    assert.equal(res.error, 'symlink_en_pack');
    assert.ok(res.symlinks.some((s) => s.includes('ancla-viva')));
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('VALIDAR rojo: schema inválido (disk fuera de patrón) → aborta, staging limpio', () => {
  const { root, restore } = setupRoot();
  const bad = buildPack({
    volumes: {
      demo: {
        disk: 'BADDISK',
        path: 'DISK_07/DEMO',
        corpora: [
          { id: 'raw', path: 'raw' },
          { id: 'curated', path: 'curated' }
        ]
      }
    }
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot: bad.packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'schema_invalido');
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
    assert.ok(!fs.existsSync(path.join(root, 'DISK_07')));
  } finally {
    restore();
    fs.rmSync(bad.packRoot, { recursive: true, force: true });
  }
});

test('CA-2 colisión de corpus: aborta ANTES de fusionar — sin root a medias', () => {
  const { root, restore } = setupRoot();
  const packA = buildPack();
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    const bytesAfterA = manifestBytes(root);
    const rawBefore = fs.readFileSync(
      path.join(root, 'DISK_07', 'DEMO', 'raw', 'a.json'),
      'utf8'
    );

    // Pack B: mismo volumen, corpus NUEVO primero (encola move) y colisión
    // en `raw` (contenido distinto) después → el pase dry debe abortar TODO.
    const packB = buildPack({
      name: 'pack-demo-b',
      version: '2.0.0',
      volumes: {
        demo: {
          disk: 'DISK_07',
          path: 'DISK_07/DEMO',
          corpora: [
            { id: 'extra', path: 'extra', label: 'Nuevo' },
            { id: 'raw', path: 'raw', label: 'Raw distinto' }
          ]
        }
      },
      files: {
        'DISK_07/DEMO/extra/nuevo.json': '{"post":"extra"}',
        'DISK_07/DEMO/raw/a.json': '{"post":"DISTINTO"}'
      }
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'colision_corpus');
    assert.equal(res.corpus, 'raw');

    // Sin root a medias: sello intacto, corpus nuevo NO aterrizó, contenido
    // previo intacto, staging limpio.
    assert.equal(manifestBytes(root), bytesAfterA);
    assert.equal(hashManifest().sha256, first.manifestSha256);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_07', 'DEMO', 'extra')));
    assert.equal(
      fs.readFileSync(path.join(root, 'DISK_07', 'DEMO', 'raw', 'a.json'), 'utf8'),
      rawBefore
    );
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('fusión por corpus: corpus idéntico = no-op de corpus, corpus nuevo aterriza', () => {
  const { root, restore } = setupRoot();
  const packA = buildPack();
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);

    // Pack C: mismo `raw` (idéntico) + corpus nuevo `extra`.
    const packC = buildPack({
      name: 'pack-demo-c',
      version: '1.1.0',
      volumes: {
        demo: {
          disk: 'DISK_07',
          path: 'DISK_07/DEMO',
          corpora: [
            { id: 'raw', path: 'raw' },
            { id: 'extra', path: 'extra', label: 'Extra' }
          ]
        }
      },
      files: {
        'DISK_07/DEMO/raw/a.json': '{"post":"uno"}',
        'DISK_07/DEMO/raw/b.json': '{"post":"dos"}',
        'DISK_07/DEMO/extra/nuevo.json': '{"post":"extra"}'
      }
    });
    const res = importPack({ packRoot: packC.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.deepEqual(res.noopCorpora, [{ volId: 'demo', corpusId: 'raw' }]);
    assert.ok(fs.existsSync(path.join(root, 'DISK_07', 'DEMO', 'extra', 'nuevo.json')));
    const cfg = JSON.parse(manifestBytes(root));
    assert.equal(cfg.volumes.demo.source.imported.name, 'pack-demo-c');
    assert.equal(cfg.volumes.demo.corpora.find((c) => c.id === 'extra').files, 1);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packC.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('hostiles: rol omitido → denegado · root inconsistente · destino sin manifiesto', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildPack();
  try {
    // Rol omitido resuelve a player → denegado (hostil-omite §0.6).
    const noRole = importPack({ packRoot });
    assert.equal(noRole.ok, false);
    assert.equal(noRole.step, 'precondicion-rol');
    assert.equal(noRole.error, 'rol_no_autorizado');

    // volumesRoot explícito ≠ canónico → aserción falla.
    const other = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u201-other-'));
    const inconsistent = importPack({ packRoot, role: 'operator', volumesRoot: other });
    assert.equal(inconsistent.ok, false);
    assert.equal(inconsistent.error, 'root_inconsistente');
    fs.rmSync(other, { recursive: true, force: true });

    // Destino sin volumes.json → not operable (U199), nada se inventa.
    fs.rmSync(path.join(root, 'volumes.json'));
    resetVolumesCache();
    const noManifest = importPack({ packRoot, role: 'operator' });
    assert.equal(noManifest.ok, false);
    assert.equal(noManifest.step, 'verificar');
    assert.match(noManifest.error, /not operable/);
    assert.ok(!fs.existsSync(path.join(root, 'volumes.json')));
    assert.ok(!fs.existsSync(path.join(root, 'DISK_07')));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

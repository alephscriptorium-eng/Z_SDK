/**
 * WP-U206 · Adaptador startpack → pack v1 (src/pack-adapter.mjs).
 *
 * Hermético a propósito: NO depende del mundo hermano. Se sintetiza un
 * startpack con la MISMA forma que el real (`volumes/DISK_xx/**` + un
 * `volumes/volumes.json` de root) a partir de la fixture canónica de
 * linea-kit, que es byte a byte la del pozo. El runner `e2e/local-first-ca.mjs`
 * es el que corre contra el pozo REAL.
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
import { buildPackFromStartpack, importPack, readStartpackIdentity } from '../src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORCES_FIXTURE = path.resolve(__dirname, '../../linea-kit/test/fixtures/forces');
const VOL_REL = 'DISK_03/FORCES';

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

const TEMPS = [];
function mkTemp(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `zeus-u206-${label}-`));
  TEMPS.push(dir);
  return dir;
}
test.after(() => {
  for (const dir of TEMPS) fs.rmSync(dir, { recursive: true, force: true });
});

/** Startpack sintético con la forma del real (incluido el 9.º fichero). */
function makeStartpack({ withRootManifest = true, extra = null } = {}) {
  const root = mkTemp('startpack');
  const dataDir = path.join(root, 'volumes', ...VOL_REL.split('/'));
  for (const rel of collectFiles(FORCES_FIXTURE)) {
    const to = path.join(dataDir, rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(FORCES_FIXTURE, rel.split('/').join(path.sep)), to);
  }
  if (withRootManifest) {
    fs.writeFileSync(
      path.join(root, 'volumes', 'volumes.json'),
      `${JSON.stringify({ root: '.', volumes: {} }, null, 2)}\n`,
      'utf8'
    );
  }
  fs.writeFileSync(
    path.join(root, 'manifest.json'),
    `${JSON.stringify(
      {
        schema: 'zeus.startpack/v0',
        game: 'pozo',
        id: 'startpack-sintetico',
        version: '0.1.0',
        volumes: { root: 'volumes', slots: ['DISK_03'] }
      },
      null,
      2
    )}\n`,
    'utf8'
  );
  if (extra) extra(root);
  return root;
}

const VOLUMES = {
  forces: {
    disk: 'DISK_03',
    path: VOL_REL,
    readonly: true,
    label: 'Forces (adaptador U206)',
    corpora: [
      { id: 'forces', path: 'forces', label: 'Forces' },
      { id: 'cotas', path: 'cotas', label: 'Cotas' }
    ]
  }
};

function setupRoot() {
  const root = mkTemp('root');
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
    }
  };
}

test('emite manifiesto v1 con los 8 hashes y el pack resultante IMPORTA', () => {
  const startpack = makeStartpack();
  const out = mkTemp('pack');
  const pack = buildPackFromStartpack({
    startpackRoot: startpack,
    outDir: out,
    name: 'pack-sintetico-v1',
    version: '1.0.0',
    volumes: VOLUMES
  });

  assert.equal(pack.files.length, 8);
  assert.equal(Object.keys(pack.hashes).length, 8);
  for (const h of Object.values(pack.hashes)) assert.match(h, /^[0-9a-f]{64}$/);

  // Los hashes declarados son los de los bytes reales del origen.
  for (const rel of pack.files) {
    const src = path.join(startpack, 'volumes', rel.split('/').join(path.sep));
    assert.equal(pack.hashes[rel], sha256(fs.readFileSync(src)), rel);
  }

  const m = JSON.parse(fs.readFileSync(pack.manifestPath, 'utf8'));
  assert.equal(m.name, 'pack-sintetico-v1');
  assert.equal(m.version, '1.0.0');
  assert.ok(m.volumes.forces);
  assert.equal(Object.keys(m.hashes).length, 8);

  const { root, restore } = setupRoot();
  try {
    const res = importPack({ packRoot: pack.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(res.noop, false);
    assert.ok(fs.existsSync(path.join(root, 'DISK_03', 'FORCES', 'registry.json')));
  } finally {
    restore();
  }
});

test('el 9.º fichero (volumes/volumes.json) se DESCARTA CON REPORTE, no en silencio', () => {
  const startpack = makeStartpack({ withRootManifest: true });
  const pack = buildPackFromStartpack({
    startpackRoot: startpack,
    outDir: mkTemp('pack'),
    name: 'p',
    version: '1.0.0',
    volumes: VOLUMES
  });
  assert.equal(pack.skipped.length, 1);
  assert.equal(pack.skipped[0].path, 'volumes.json');
  assert.equal(pack.skipped[0].reason, 'manifiesto_de_root');
  assert.ok(!pack.files.includes('volumes.json'));
  // Y no viajó al pack materializado.
  assert.ok(!fs.existsSync(path.join(pack.packRoot, 'volumes', 'volumes.json')));
});

test('ROJO · outDir dentro del origen = destino_dentro_de_origen y CERO escritura', () => {
  const startpack = makeStartpack();
  const before = collectFiles(startpack);
  assert.throws(
    () =>
      buildPackFromStartpack({
        startpackRoot: startpack,
        outDir: path.join(startpack, 'pack-dentro'),
        name: 'p',
        version: '1.0.0',
        volumes: VOLUMES
      }),
    (err) => err.code === 'destino_dentro_de_origen'
  );
  assert.deepEqual(collectFiles(startpack), before, 'el adaptador escribió en el origen');
  assert.ok(!fs.existsSync(path.join(startpack, 'pack-dentro')));
});

test('ROJO · fichero fuera de todo volumen declarado = fichero_fuera_de_volumen', () => {
  // Sin esta guarda el fichero se copia al staging, PASA la verificación de
  // hash y desaparece al borrarse el staging: importPack devuelve ok:true y
  // el dato se pierde en silencio (ningún plan de fusión lo cubre).
  const startpack = makeStartpack({
    extra(root) {
      const stray = path.join(root, 'volumes', 'DISK_09', 'huerfano.json');
      fs.mkdirSync(path.dirname(stray), { recursive: true });
      fs.writeFileSync(stray, '{"dato":"huerfano"}', 'utf8');
    }
  });
  assert.throws(
    () =>
      buildPackFromStartpack({
        startpackRoot: startpack,
        outDir: mkTemp('pack'),
        name: 'p',
        version: '1.0.0',
        volumes: VOLUMES
      }),
    (err) =>
      err.code === 'fichero_fuera_de_volumen' &&
      err.detail.files.includes('DISK_09/huerfano.json')
  );
});

test('ROJO · volumen declarado sin árbol en el origen = volumen_sin_arbol', () => {
  const startpack = makeStartpack();
  assert.throws(
    () =>
      buildPackFromStartpack({
        startpackRoot: startpack,
        outDir: mkTemp('pack'),
        name: 'p',
        version: '1.0.0',
        volumes: { fantasma: { disk: 'DISK_03', path: 'DISK_03/NO_EXISTE' } }
      }),
    (err) => err.code === 'volumen_sin_arbol'
  );
});

test('ROJO · enlace en el origen = symlink_en_origen (no se materializa el destino)', (t) => {
  const startpack = makeStartpack();
  const link = path.join(startpack, 'volumes', 'DISK_LINK');
  try {
    fs.symlinkSync(
      path.join(startpack, 'volumes', 'DISK_03'),
      link,
      process.platform === 'win32' ? 'junction' : 'dir'
    );
  } catch (err) {
    // Sin privilegios para crear enlaces: se DECLARA el skip, no se finge verde.
    t.skip(`no se pudo crear el enlace de prueba: ${err.message}`);
    return;
  }
  assert.throws(
    () =>
      buildPackFromStartpack({
        startpackRoot: startpack,
        outDir: mkTemp('pack'),
        name: 'p',
        version: '1.0.0',
        volumes: VOLUMES
      }),
    (err) => err.code === 'symlink_en_origen'
  );
});

test('el manifiesto del startpack se lee SÓLO como procedencia (es el que import rechaza)', () => {
  const startpack = makeStartpack();
  const identity = readStartpackIdentity(startpack);
  assert.equal(identity.schema, 'zeus.startpack/v0');
  assert.equal(identity.id, 'startpack-sintetico');

  // La prueba de que ese manifiesto NO sirve como descriptor de import.
  const { restore } = setupRoot();
  try {
    const crudo = mkTemp('pack-crudo');
    fs.cpSync(path.join(startpack, 'volumes'), path.join(crudo, 'volumes'), { recursive: true });
    fs.copyFileSync(path.join(startpack, 'manifest.json'), path.join(crudo, 'manifest.json'));
    const res = importPack({ packRoot: crudo, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'verificar');
    assert.equal(res.error, 'pack_manifest_incompleto');
  } finally {
    restore();
  }
});

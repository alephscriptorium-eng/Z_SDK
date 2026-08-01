/**
 * WP-U206 · Guardián de arranque (src/boot.mjs · decisión ⑩).
 *
 * Regla de método que este fichero defiende: **un verificador que nadie llama
 * no es una protección, es una biblioteca.** Aquí se prueba el punto único por
 * el que los servicios entran a los dos verificadores, y se prueba con su rojo:
 * integridad ABORTA, cerco REPORTA (y aborta sólo en modo estricto).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import { assertVolumesRootBootable, buildPackFromStartpack, importPack } from '../src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORCES_FIXTURE = path.resolve(__dirname, '../../linea-kit/test/fixtures/forces');
const VOL_REL = 'DISK_03/FORCES';

const TEMPS = [];
function mkTemp(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `zeus-u206b-${label}-`));
  TEMPS.push(dir);
  return dir;
}
test.after(() => {
  for (const dir of TEMPS) fs.rmSync(dir, { recursive: true, force: true });
});

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

const VOLUMES = {
  forces: {
    disk: 'DISK_03',
    path: VOL_REL,
    readonly: true,
    label: 'Forces',
    corpora: [
      { id: 'forces', path: 'forces', label: 'Forces' },
      { id: 'cotas', path: 'cotas', label: 'Cotas' }
    ]
  }
};

/** Root importado y sellado. */
function importedRoot() {
  const startpack = mkTemp('startpack');
  const dataDir = path.join(startpack, 'volumes', ...VOL_REL.split('/'));
  for (const rel of collectFiles(FORCES_FIXTURE)) {
    const to = path.join(dataDir, rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(FORCES_FIXTURE, rel.split('/').join(path.sep)), to);
  }
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
  const pack = buildPackFromStartpack({
    startpackRoot: startpack,
    outDir: mkTemp('pack'),
    name: 'pack-boot',
    version: '1.0.0',
    volumes: VOLUMES
  });
  assert.equal(importPack({ packRoot: pack.packRoot, role: 'operator' }).ok, true);
  return {
    root,
    volDir: path.join(root, ...VOL_REL.split('/')),
    restore() {
      if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
      else process.env.ZEUS_VOLUMES_ROOT = prev;
      resetZeusEnvLoader();
      resetVolumesCache();
    }
  };
}

/** Silencia el warn del cerco para no ensuciar la salida del runner de tests. */
const mudo = { warn() {} };

test('VERDE · root íntegro = arrancable', () => {
  const ctx = importedRoot();
  try {
    const res = assertVolumesRootBootable({ service: 'test', logger: mudo });
    assert.equal(res.integrity.ok, true);
    assert.equal(res.cerco.ok, true);
  } finally {
    ctx.restore();
  }
});

test('ROJO · integridad rota = ABORTA el arranque (fatal, sin opción)', () => {
  const ctx = importedRoot();
  try {
    fs.appendFileSync(
      path.join(ctx.volDir, ...'forces/force-sample/escenas/sesion-01/01-sample/think.md'.split('/')),
      'x'
    );
    assert.throws(
      () => assertVolumesRootBootable({ service: 'test', logger: mudo }),
      /arranque ABORTADO — el volumes root no está íntegro/
    );
  } finally {
    ctx.restore();
  }
});

test('cerco roto: REPORTA y deja arrancar; con ZEUS_VOLUMES_CERCO=strict ABORTA', () => {
  const ctx = importedRoot();
  const prev = process.env.ZEUS_VOLUMES_CERCO;
  try {
    // Una URL viva plantada dentro del root.
    fs.writeFileSync(path.join(ctx.root, 'ancla.txt'), 'http://ancla-viva.test/x\n', 'utf8');

    /** @type {string[]} */
    const avisos = [];
    const res = assertVolumesRootBootable({
      service: 'test',
      logger: { warn: (m) => avisos.push(String(m)) }
    });
    assert.equal(res.integrity.ok, true);
    assert.equal(res.cerco.ok, false, 'el cerco debería haber visto la URL');
    assert.equal(avisos.length, 1, 'el hallazgo del cerco tiene que REPORTARSE, no callarse');
    assert.match(avisos[0], /ancla-viva\.test/);

    // Modo estricto: el mismo root deja de arrancar.
    process.env.ZEUS_VOLUMES_CERCO = 'strict';
    assert.throws(
      () => assertVolumesRootBootable({ service: 'test', logger: mudo }),
      /arranque ABORTADO — cerco del root roto/
    );
  } finally {
    if (prev == null) delete process.env.ZEUS_VOLUMES_CERCO;
    else process.env.ZEUS_VOLUMES_CERCO = prev;
    ctx.restore();
  }
});

test('el guardián acota por volumen cuando se le pide', () => {
  const ctx = importedRoot();
  try {
    // Un volumen que no existe en el manifiesto se reporta como hallazgo.
    assert.throws(
      () => assertVolumesRootBootable({ service: 'test', volumeIds: ['fantasma'], logger: mudo }),
      /volumen_no_declarado/
    );
  } finally {
    ctx.restore();
  }
});

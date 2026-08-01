/**
 * WP-U206 · Verificador de INTEGRIDAD (src/verify.mjs) — paso 6 del CA
 * local-first: «corromper un corpus FALLA; no degrada a root parcial que
 * arranca».
 *
 * El contraste con la maquinaria anterior está aseverado, no contado: para la
 * corrupción de una escena `.md`, `validateVolumesTree` devuelve ok:true y el
 * verificador nuevo devuelve ok:false. Esa asimetría ES lo que este WP añade.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import { validateVolumesTree } from '@zeus/linea-kit/validate';
import {
  assertRootIntegrity,
  buildPackFromStartpack,
  importPack,
  syncVolumeCounters,
  verifyRootIntegrity
} from '../src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORCES_FIXTURE = path.resolve(__dirname, '../../linea-kit/test/fixtures/forces');
const VOL_REL = 'DISK_03/FORCES';
const SCENE = 'forces/force-sample/escenas/sesion-01/01-sample/think.md';

const TEMPS = [];
function mkTemp(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `zeus-u206v-${label}-`));
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

/** Root importado y sellado, listo para corromper. */
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
    name: 'pack-verify',
    version: '1.0.0',
    volumes: VOLUMES
  });
  const res = importPack({ packRoot: pack.packRoot, role: 'operator' });
  assert.equal(res.ok, true, JSON.stringify(res));
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

test('VERDE · root recién importado = íntegro, con los legs esperados', () => {
  const ctx = importedRoot();
  try {
    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, true, JSON.stringify(rep.findings));
    const legs = rep.checks.filter((c) => c.ok).map((c) => c.check);
    for (const leg of ['manifiesto', 'sello_vs_ledger', 'volumen', 'snapshot', 'familia', 'corpora']) {
      assert.ok(legs.includes(leg), `falta el leg ${leg}: ${JSON.stringify(legs)}`);
    }
    assert.doesNotThrow(() => assertRootIntegrity());
  } finally {
    ctx.restore();
  }
});

test('ROJO (a) · un byte de una escena .md → unidad_corrupta; la maquinaria ANTERIOR no lo ve', () => {
  const ctx = importedRoot();
  try {
    fs.appendFileSync(path.join(ctx.volDir, ...SCENE.split('/')), 'x');

    // Lo que había antes: valida contra SCHEMAS, no contra hashes. Un `.md`
    // no lo mira ningún schema → pasa sin una queja.
    const legado = validateVolumesTree({ volumesRoot: ctx.root });
    assert.equal(legado.ok, true, 'premisa rota: el legado ya detectaba esto');

    // Lo que añade U206.
    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, false);
    assert.ok(
      rep.findings.some((f) => f.check === 'snapshot' && f.error === 'unidad_corrupta'),
      JSON.stringify(rep.findings)
    );
    assert.throws(() => assertRootIntegrity(), /no está íntegro/);
  } finally {
    ctx.restore();
  }
});

test('ROJO (b) · registry.json roto contra su schema → familia_invalida', () => {
  const ctx = importedRoot();
  try {
    const abs = path.join(ctx.volDir, 'registry.json');
    const reg = JSON.parse(fs.readFileSync(abs, 'utf8'));
    delete reg.forces;
    fs.writeFileSync(abs, JSON.stringify(reg, null, 2), 'utf8');

    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, false);
    assert.ok(
      rep.findings.some((f) => f.check === 'familia' && f.error === 'familia_invalida'),
      JSON.stringify(rep.findings)
    );
  } finally {
    ctx.restore();
  }
});

test('ROJO (c) · volumes.json editado a mano → sello_roto, y SIGUE rojo tras remedir', () => {
  const ctx = importedRoot();
  try {
    const abs = path.join(ctx.root, 'volumes.json');
    const cfg = JSON.parse(fs.readFileSync(abs, 'utf8'));
    cfg.volumes.forces.label = 'editado a mano';
    fs.writeFileSync(abs, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
    resetVolumesCache();

    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, false);
    assert.ok(
      rep.findings.some((f) => f.check === 'sello_vs_ledger' && f.error === 'sello_roto'),
      JSON.stringify(rep.findings)
    );

    // La clave del leg: medir RE-ANOTA el sello en volumes.state.json
    // (counters.mjs:39-40 → state.mjs:128-130), así que el leg de estado se
    // vuelve verde y borra la evidencia. El leg de ledger NO se deja borrar.
    syncVolumeCounters('forces');
    const rep2 = verifyRootIntegrity();
    assert.ok(
      rep2.checks.some((c) => c.check === 'sello_vs_estado' && c.ok === true),
      'premisa rota: el estado no se re-anotó al medir'
    );
    assert.equal(rep2.ok, false, 'tras remedir la corrupción quedó tapada');
    assert.ok(rep2.findings.some((f) => f.error === 'sello_roto'));
  } finally {
    ctx.restore();
  }
});

test('ROJO · unidad borrada del árbol → unidad_ausente', () => {
  const ctx = importedRoot();
  try {
    fs.rmSync(path.join(ctx.volDir, 'cotas', 'sima'), { recursive: true, force: true });
    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, false);
    assert.ok(
      rep.findings.some((f) => f.check === 'snapshot' && f.error === 'unidad_ausente'),
      JSON.stringify(rep.findings)
    );
  } finally {
    ctx.restore();
  }
});

test('ROJO · fichero intruso dentro de un corpus → corpus_desviado', () => {
  const ctx = importedRoot();
  try {
    fs.writeFileSync(path.join(ctx.volDir, 'cotas', 'intruso.json'), '{}', 'utf8');
    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, false);
    assert.ok(
      rep.findings.some((f) => f.check === 'corpora' && f.error === 'corpus_desviado'),
      JSON.stringify(rep.findings)
    );
  } finally {
    ctx.restore();
  }
});

test('root sin manifiesto = manifiesto_ausente (no se inventa nada)', () => {
  const root = mkTemp('vacio');
  const prev = process.env.ZEUS_VOLUMES_ROOT;
  process.env.ZEUS_VOLUMES_ROOT = root;
  resetZeusEnvLoader();
  resetVolumesCache();
  try {
    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, false);
    assert.equal(rep.findings[0].error, 'manifiesto_ausente');
  } finally {
    if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = prev;
    resetZeusEnvLoader();
    resetVolumesCache();
  }
});

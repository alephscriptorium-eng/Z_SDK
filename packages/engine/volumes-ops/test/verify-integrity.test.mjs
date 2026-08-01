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
import { createHash } from 'node:crypto';
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
    for (const leg of [
      'manifiesto',
      'sello_vs_ledger',
      'volumen',
      'ficheros',
      'snapshot',
      'familia',
      'corpora'
    ]) {
      assert.ok(legs.includes(leg), `falta el leg ${leg}: ${JSON.stringify(legs)}`);
    }
    assert.doesNotThrow(() => assertRootIntegrity());
  } finally {
    ctx.restore();
  }
});

test('U258 · el leg `ficheros` sella TODO el árbol del volumen que trajo el import', () => {
  const ctx = importedRoot();
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(ctx.root, 'volumes.json'), 'utf8'));
    const sellados = Object.keys(cfg.volumes.forces.source.imported.hashes);
    const enDisco = collectFiles(ctx.volDir);
    assert.deepEqual(
      sellados.sort(),
      enDisco,
      'el sello no cubre exactamente los ficheros del volumen'
    );
    const leg = verifyRootIntegrity().checks.find((c) => c.check === 'ficheros');
    assert.equal(leg.ok, true);
    assert.equal(leg.files, enDisco.length);
  } finally {
    ctx.restore();
  }
});

test('ROJO (U258) · registry.json alterado y AÚN VÁLIDO → fichero_corrupto; los demás legs lo dejan pasar', () => {
  // El fichero que ninguna unidad del snapshot cubre y ningún corpus mide.
  // Antes de U258 su única cobertura era el schema, así que una edición que
  // siguiera siendo válida contra `force-registry` pasaba sin una queja. La
  // asimetría se asevera: `familia` y `snapshot` VERDES, `ficheros` ROJO.
  const ctx = importedRoot();
  try {
    const abs = path.join(ctx.volDir, 'registry.json');
    const reg = JSON.parse(fs.readFileSync(abs, 'utf8'));
    reg.description = 'editado a mano, sigue válido contra el schema';
    fs.writeFileSync(abs, `${JSON.stringify(reg, null, 2)}\n`, 'utf8');

    const rep = verifyRootIntegrity();
    assert.ok(
      rep.checks.some((c) => c.check === 'familia' && c.ok === true),
      'premisa rota: el leg de familia ya lo veía'
    );
    assert.ok(
      rep.checks.some((c) => c.check === 'snapshot' && c.ok === true),
      'premisa rota: el snapshot de unidad ya lo veía'
    );
    assert.equal(rep.ok, false);
    const f = rep.findings.find((x) => x.check === 'ficheros');
    assert.ok(f, JSON.stringify(rep.findings));
    assert.equal(f.error, 'fichero_corrupto');
    assert.equal(f.file, 'registry.json');
    assert.throws(() => assertRootIntegrity(), /no está íntegro/);
  } finally {
    ctx.restore();
  }
});

test('ROJO (U258) · un fichero sellado BORRADO → fichero_ausente', () => {
  const ctx = importedRoot();
  try {
    fs.rmSync(path.join(ctx.volDir, 'registry.json'));
    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, false);
    assert.ok(
      rep.findings.some((f) => f.check === 'ficheros' && f.error === 'fichero_ausente'),
      JSON.stringify(rep.findings)
    );
  } finally {
    ctx.restore();
  }
});

test('U258 · un volumen sellado ANTES del contrato omite el leg con motivo (no lo inventa)', () => {
  // Un root importado por una versión anterior no lleva `hashes`. El leg tiene
  // que declararse OMITIDO con motivo, no adivinar hashes ni dar falso verde
  // silencioso: es el mismo estatuto que el resto de omisiones honestas.
  const ctx = importedRoot();
  try {
    const abs = path.join(ctx.root, 'volumes.json');
    const cfg = JSON.parse(fs.readFileSync(abs, 'utf8'));
    delete cfg.volumes.forces.source.imported.hashes;
    fs.writeFileSync(abs, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
    // El sello del manifiesto cambia: se re-ancla el ledger para aislar el leg.
    const ledgerPath = path.join(ctx.root, '.ops-ledger.jsonl');
    const seats = fs
      .readFileSync(ledgerPath, 'utf8')
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l));
    seats[seats.length - 1].manifestSha256.after = createHash('sha256')
      .update(fs.readFileSync(abs))
      .digest('hex');
    fs.writeFileSync(ledgerPath, `${seats.map((s) => JSON.stringify(s)).join('\n')}\n`, 'utf8');
    resetVolumesCache();

    const rep = verifyRootIntegrity();
    const om = rep.skipped.find((s) => s.check === 'ficheros');
    assert.ok(om, JSON.stringify(rep.skipped));
    assert.equal(om.reason, 'sin_hashes_sellados');
    assert.ok(!rep.findings.some((f) => f.check === 'ficheros'));
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

test('ROJO (m6) · borrar el ledger NO apaga la comprobación: ledger_ausente', () => {
  // El leg tenía su propio interruptor de apagado: sin fichero de asientos
  // pasaba a `omitido`, así que BORRAR el ledger degradaba el caso «volumes.json
  // editado a mano» de ROJO a verde. Lo declarado era que el ledger no protege
  // contra MANIPULACIÓN de asientos; su AUSENCIA, en un root que el manifiesto
  // dice haber importado, es en sí misma evidencia que falta.
  const ctx = importedRoot();
  try {
    assert.equal(verifyRootIntegrity().ok, true);

    // Se corrompe el manifiesto Y se borra el ledger: la tapadera perfecta.
    const abs = path.join(ctx.root, 'volumes.json');
    const cfg = JSON.parse(fs.readFileSync(abs, 'utf8'));
    cfg.volumes.forces.label = 'editado a mano';
    fs.writeFileSync(abs, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
    fs.rmSync(path.join(ctx.root, '.ops-ledger.jsonl'), { force: true });
    resetVolumesCache();

    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, false, 'borrar el ledger tapó la corrupción del manifiesto');
    assert.ok(
      rep.findings.some((f) => f.check === 'sello_vs_ledger' && f.error === 'ledger_ausente'),
      JSON.stringify(rep.findings)
    );
  } finally {
    ctx.restore();
  }
});

test('un root NUNCA importado sí puede omitir el leg de ledger (sin falso positivo)', () => {
  const root = mkTemp('nunca-importado');
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    `${JSON.stringify({ root: '.', volumes: {} }, null, 2)}\n`,
    'utf8'
  );
  const prev = process.env.ZEUS_VOLUMES_ROOT;
  process.env.ZEUS_VOLUMES_ROOT = root;
  resetZeusEnvLoader();
  resetVolumesCache();
  try {
    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, true, JSON.stringify(rep.findings));
    assert.ok(rep.skipped.some((s) => s.check === 'sello_vs_ledger'));
  } finally {
    if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = prev;
    resetZeusEnvLoader();
    resetVolumesCache();
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

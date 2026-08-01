/**
 * WP-U255 · «todo error aborta ANTES del primer movimiento» — de frase a
 * garantía.
 *
 * El contrato (`plan/CONTRATO-IMPORT-PACK-v1.md` §1, paso 4) promete que el
 * pase dry detecta TODA colisión antes del primer `rename` y que todo fallo
 * devuelve `{ok:false, step, error}`. Sobre la base, siete vectores rompían las
 * dos cosas: `importPack` LANZABA, y cinco de los siete dejaban el volumen a
 * medias.
 *
 * Cada rojo de aquí mide el destino **byte a byte antes y después** y afirma
 * tres cosas juntas, porque cualquiera de las tres sola es más estrecha que el
 * contrato:
 *   (1) la salida es `{ok:false, step:'fusionar', error:<código>}`;
 *   (2) el destino es IDÉNTICO — mismo conjunto de rutas y mismo sha256 en cada
 *       una: **cero renombrados**, no «pocos»;
 *   (3) el manifiesto no se re-selló y no queda staging.
 *
 * Y cada rojo tiene su **contra-verde**: el MISMO pack, sobre el MISMO destino
 * sin la obstrucción, aterriza. Sin eso, un rojo no prueba que la guarda vea el
 * vector — prueba que algo falló.
 *
 * Fixtures: las canónicas de linea-kit (`test/fixtures/lineas`,
 * `test/fixtures/forces`) más material sintético marcado como tal.
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
import {
  importPack,
  blockingAncestor,
  inspectFusionPlan,
  applyFusion,
  deshacerFusion,
  FAMILY_DRIVERS
} from '../src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FX_LINEAS = path.resolve(__dirname, '../../linea-kit/test/fixtures/lineas');
const FX_FORCES = path.resolve(__dirname, '../../linea-kit/test/fixtures/forces');
const VOL_LINEAS = 'DISK_02/LINEAS';
const VOL_FORCES = 'DISK_03/FORCES';

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

/**
 * Retrato byte a byte del root, saltando el staging vivo. Es la unidad de
 * medida de todo este fichero: «intacto» significa el MISMO conjunto de rutas
 * con el MISMO sha256, no «parece igual».
 */
function retrato(root) {
  /** @type {Record<string,string>} */
  const out = {};
  for (const rel of collectFiles(root)) {
    if (rel.startsWith('.import-staging')) continue;
    out[rel] = sha256(fs.readFileSync(path.join(root, rel.split('/').join(path.sep))));
  }
  return out;
}

function setupRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u255-root-'));
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    `${JSON.stringify({ root: '.', volumes: {} }, null, 2)}\n`,
    'utf8'
  );
  const prev = process.env.ZEUS_VOLUMES_ROOT;
  process.env.ZEUS_VOLUMES_ROOT = root;
  resetZeusEnvLoader();
  resetVolumesCache();
  const packs = [];
  return {
    root,
    /** Registra un pack para que se borre al final pase lo que pase. */
    pack(spec) {
      const p = buildPack(spec);
      packs.push(p);
      return p;
    },
    restore() {
      if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
      else process.env.ZEUS_VOLUMES_ROOT = prev;
      resetZeusEnvLoader();
      resetVolumesCache();
      fs.rmSync(root, { recursive: true, force: true });
      for (const p of packs) fs.rmSync(p, { recursive: true, force: true });
    }
  };
}

/**
 * Pack sintético: fixtures canónicas por volumen (`__fixture`) + ficheros
 * sembrados a mano (`seed`, rels bajo `volumes/`). El `hashes` del manifiesto
 * se recomputa siempre del árbol real, así que VERIFICAR nunca es el que falla.
 * @param {{name:string, version?:string, volumes:Record<string,object>, seed?:Record<string,string>}} spec
 */
function buildPack(spec) {
  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u255-pack-'));
  const volumesDir = path.join(packRoot, 'volumes');
  for (const vol of Object.values(spec.volumes)) {
    if (!vol.__fixture) continue;
    const dataDir = path.join(volumesDir, ...vol.path.split('/'));
    for (const rel of collectFiles(vol.__fixture)) {
      const to = path.join(dataDir, rel.split('/').join(path.sep));
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(path.join(vol.__fixture, rel.split('/').join(path.sep)), to);
    }
  }
  for (const [rel, content] of Object.entries(spec.seed || {})) {
    const abs = path.join(volumesDir, rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }
  /** @type {Record<string,string>} */
  const hashes = {};
  for (const rel of collectFiles(volumesDir)) {
    hashes[rel] = sha256(fs.readFileSync(path.join(volumesDir, rel.split('/').join(path.sep))));
  }
  /** @type {Record<string, object>} */
  const volumes = {};
  for (const [id, vol] of Object.entries(spec.volumes)) {
    const entrada = { ...vol };
    delete entrada.__fixture; // marca del montaje, no del manifiesto del pack
    volumes[id] = entrada;
  }
  fs.writeFileSync(
    path.join(packRoot, 'manifest.json'),
    JSON.stringify({ name: spec.name, version: spec.version || '1.0.0', volumes, hashes }, null, 2),
    'utf8'
  );
  return packRoot;
}

const LINEAS = { disk: 'DISK_02', path: VOL_LINEAS, readonly: true, label: 'Lineas (U255)', __fixture: FX_LINEAS };
const FORCES = { disk: 'DISK_03', path: VOL_FORCES, readonly: true, label: 'Forces (U255)', __fixture: FX_FORCES };

const META = (id) =>
  `${JSON.stringify(
    {
      id,
      parte: 'I',
      'año_ini': 1950,
      'año_fin': 2000,
      etiqueta: `Nodo sintetico ${id} (U255)`,
      tesis: 'tesis inventada para el test U255',
      articulos_wp: ['Demo_Article']
    },
    null,
    2
  )}\n`;

const rootAbs = (root, rel) => path.join(root, rel.split('/').join(path.sep));
const noStagingLeft = (root) => fs.readdirSync(root).every((n) => !n.startsWith('.import-staging'));

/** Las tres afirmaciones juntas: error declarado, destino intacto, root sin sellar. */
function abortoEnSeco(t, { res, antes, root, error }) {
  assert.equal(res.ok, false, `esperaba ok:false y salió ${JSON.stringify(res).slice(0, 400)}`);
  assert.equal(res.step, 'fusionar');
  assert.equal(res.error, error, JSON.stringify(res));
  const despues = retrato(root);
  const rutasAntes = Object.keys(antes).sort();
  const rutasDespues = Object.keys(despues).sort();
  assert.deepEqual(
    rutasDespues,
    rutasAntes,
    `el destino cambió de conjunto: altas=${JSON.stringify(rutasDespues.filter((r) => !(r in antes)))} bajas=${JSON.stringify(rutasAntes.filter((r) => !(r in despues)))}`
  );
  for (const rel of rutasAntes) {
    assert.equal(despues[rel], antes[rel], `${rel} cambió de bytes: el aborto no fue en seco`);
  }
  assert.ok(noStagingLeft(root), 'quedó staging');
  t.diagnostic(`${error}: ${rutasAntes.length} rutas del destino idénticas, cero renombrados`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 · EL VECTOR DEL WP · LINEAS: fichero en el destino, directorio en el pack
// ═══════════════════════════════════════════════════════════════════════════

/**
 * El pack B trae DOS cosas a propósito:
 *  - `demo/nodos/N02/meta.json`, que ordena ANTES y aterrizaría sin problema;
 *  - `demo/wp/historia/registros/r0002-oldid-3/registro.md`, cuyo directorio
 *    padre existe en el destino como FICHERO.
 * Sobre la base eso daba `EEXIST` en el `mkdirSync` del segundo **con el
 * primero ya renombrado**: volumen a medias, sin sellar y sin asiento.
 * Que N02 NO aparezca es la parte que cuenta — y es lo que hace NO VACUO el
 * rojo: el contra-verde de abajo demuestra que ese mismo N02 sí aterriza
 * cuando la obstrucción no está.
 */
const BLOQUEO = 'demo/wp/historia/registros/r0002-oldid-3';
const packLineasBloqueante = (ctx) =>
  ctx.pack({
    name: 'pack-lineas-u255',
    version: '2.0.0',
    volumes: { lineas: LINEAS },
    seed: {
      [`${VOL_LINEAS}/demo/nodos/N02/meta.json`]: META('N02'),
      [`${VOL_LINEAS}/${BLOQUEO}/registro.md`]: '# registro nuevo del pack (sintetico U255)\n'
    }
  });

test('U255·LINEAS ROJO: fichero del destino donde el pack trae un directorio → aborta en seco', (t) => {
  const ctx = setupRoot();
  try {
    assert.equal(importPack({ packRoot: ctx.pack({ name: 'pa', volumes: { lineas: LINEAS } }), role: 'operator' }).ok, true);

    // El destino hereda un registro PLANO (fichero) donde el pack nuevo trae
    // un directorio de registro. Es el vector del enunciado.
    const blk = rootAbs(ctx.root, `${VOL_LINEAS}/${BLOQUEO}`);
    fs.mkdirSync(path.dirname(blk), { recursive: true });
    fs.writeFileSync(blk, 'registro plano heredado (sintetico U255)\n', 'utf8');

    const antes = retrato(ctx.root);
    const res = importPack({ packRoot: packLineasBloqueante(ctx), role: 'operator' });

    abortoEnSeco(t, { res, antes, root: ctx.root, error: 'ruta_bloqueada_por_fichero' });
    assert.equal(res.volume, 'lineas');
    assert.equal(res.file, `${BLOQUEO}/registro.md`);
    assert.equal(res.blockedBy, BLOQUEO);
    // La parte que este WP existe para garantizar: el fichero que SÍ habría
    // aterrizado no aterrizó.
    assert.ok(!fs.existsSync(rootAbs(ctx.root, `${VOL_LINEAS}/demo/nodos/N02/meta.json`)));
  } finally {
    ctx.restore();
  }
});

test('U255·LINEAS VERDE (no vacuidad): el MISMO pack, sin la obstrucción, aterriza entero', () => {
  const ctx = setupRoot();
  try {
    assert.equal(importPack({ packRoot: ctx.pack({ name: 'pa', volumes: { lineas: LINEAS } }), role: 'operator' }).ok, true);
    const res = importPack({ packRoot: packLineasBloqueante(ctx), role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.ok(fs.existsSync(rootAbs(ctx.root, `${VOL_LINEAS}/demo/nodos/N02/meta.json`)));
    assert.ok(fs.existsSync(rootAbs(ctx.root, `${VOL_LINEAS}/${BLOQUEO}/registro.md`)));
    assert.equal(res.families.find((f) => f.id === 'lineas').moved, 2);
  } finally {
    ctx.restore();
  }
});

test('U255·LINEAS: la conducta de la familia NO se toca — divergencia reportada y curación intacta', () => {
  // La otra mitad del encargo: la guarda no puede cambiar un fallo por otro.
  // Un import legítimo con divergencia y con `.md` curado presente sigue
  // aterrizando, reportando y sin pisar un byte.
  const ctx = setupRoot();
  const SIDECAR = 'demo/wp/historia/registros/r0001-oldid-2/registro.md';
  try {
    const packA = ctx.pack({
      name: 'pa',
      volumes: { lineas: LINEAS },
      seed: { [`${VOL_LINEAS}/${SIDECAR}`]: '# curacion del destino (sintetica U255)\n' }
    });
    assert.equal(importPack({ packRoot: packA, role: 'operator' }).ok, true);
    const curadoAntes = fs.readFileSync(rootAbs(ctx.root, `${VOL_LINEAS}/${SIDECAR}`));
    const metaAntes = fs.readFileSync(rootAbs(ctx.root, `${VOL_LINEAS}/demo/nodos/N01/meta.json`));

    const packB = ctx.pack({
      name: 'pb',
      version: '2.0.0',
      volumes: { lineas: LINEAS },
      seed: {
        [`${VOL_LINEAS}/${SIDECAR}`]: '# curacion DISTINTA en el pack\n',
        [`${VOL_LINEAS}/demo/nodos/N01/meta.json`]: META('N01'),
        [`${VOL_LINEAS}/demo/nodos/N03/meta.json`]: META('N03')
      }
    });
    const res = importPack({ packRoot: packB, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res));
    const fam = res.families.find((f) => f.id === 'lineas');
    assert.equal(fam.moved, 1, 'sólo el nodo nuevo aterriza');
    assert.equal(fam.divergences.length, 1, 'la divergencia se sigue REPORTANDO');
    assert.equal(fam.divergences[0].path, 'demo/nodos/N01/meta.json');
    assert.ok(fam.protectedSidecars.some((p) => p.path === SIDECAR));
    // Byte a byte: ni la curación ni el fichero divergente se movieron.
    assert.deepEqual(fs.readFileSync(rootAbs(ctx.root, `${VOL_LINEAS}/${SIDECAR}`)), curadoAntes);
    assert.deepEqual(fs.readFileSync(rootAbs(ctx.root, `${VOL_LINEAS}/demo/nodos/N01/meta.json`)), metaAntes);
    assert.ok(fs.existsSync(rootAbs(ctx.root, `${VOL_LINEAS}/demo/nodos/N03/meta.json`)));
  } finally {
    ctx.restore();
  }
});

test('U255·LINEAS ROJO: directorio del destino donde el pack trae un fichero → `destino_no_es_fichero`', (t) => {
  // Hermano del anterior por la otra cara: aquí el pase dry LANZABA `EISDIR`
  // al intentar hashear un directorio. El destino quedaba intacto, pero
  // `importPack` no devolvía `{ok:false, step, error}`, que es lo que el
  // contrato promete en TODO fallo.
  const ctx = setupRoot();
  try {
    assert.equal(importPack({ packRoot: ctx.pack({ name: 'pa', volumes: { lineas: LINEAS } }), role: 'operator' }).ok, true);
    const meta = rootAbs(ctx.root, `${VOL_LINEAS}/demo/nodos/N01/meta.json`);
    fs.rmSync(meta);
    fs.mkdirSync(meta);
    fs.writeFileSync(path.join(meta, 'dentro.txt'), 'resto de operacion manual\n', 'utf8');

    const antes = retrato(ctx.root);
    const res = importPack({ packRoot: ctx.pack({ name: 'pb', version: '2.0.0', volumes: { lineas: LINEAS } }), role: 'operator' });
    abortoEnSeco(t, { res, antes, root: ctx.root, error: 'destino_no_es_fichero' });
    assert.equal(res.file, 'demo/nodos/N01/meta.json');
    assert.equal(res.ocupadoPor, 'directorio');
  } finally {
    ctx.restore();
  }
});

test('U255·LINEAS ROJO: un ENLACE en la ruta del destino → `enlace_en_destino` antes de mover', (t) => {
  // El paso 7 (NO-LINK) ya rechazaba un árbol con enlaces, pero corre DESPUÉS
  // de SELLAR: el import fallaba con el manifiesto ya re-sellado. Aquí el
  // enlace se caza en el pase dry, con la misma doctrina D-B que FIREHOSE y
  // SSB aplican a su índice. No se retira nada del paso 7: se adelanta.
  const ctx = setupRoot();
  try {
    assert.equal(importPack({ packRoot: ctx.pack({ name: 'pa', volumes: { lineas: LINEAS } }), role: 'operator' }).ok, true);
    const meta = rootAbs(ctx.root, `${VOL_LINEAS}/demo/nodos/N01/meta.json`);
    const señuelo = rootAbs(ctx.root, `${VOL_LINEAS}/demo/nodos/senuelo`);
    fs.mkdirSync(señuelo, { recursive: true });
    fs.rmSync(meta);
    try {
      // `junction` es lo único que un Windows sin privilegios permite plantar;
      // en POSIX Node ignora el tipo y crea un symlink. Los dos son enlace.
      fs.symlinkSync(señuelo, meta, 'junction');
    } catch {
      t.skip('el entorno no permite plantar enlaces');
      return;
    }
    const antes = retrato(ctx.root);
    const res = importPack({ packRoot: ctx.pack({ name: 'pb', version: '2.0.0', volumes: { lineas: LINEAS } }), role: 'operator' });
    abortoEnSeco(t, { res, antes, root: ctx.root, error: 'enlace_en_destino' });
    assert.equal(res.file, 'demo/nodos/N01/meta.json');
  } finally {
    ctx.restore();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · EL HERMANO QUE EL ENUNCIADO PEDÍA BUSCAR · FORCES
// ═══════════════════════════════════════════════════════════════════════════

const forceUnit = (id, dir) => ({
  id,
  kind: 'boot',
  type: 'fixture',
  viewpoint: `viewpoint de ${id}`,
  anchor_scene: 'sesion-01/01-sample',
  triggers: [id],
  pairs_with: [],
  scene_count: 1,
  path: dir
});

function registryCon(extraForces) {
  const base = JSON.parse(fs.readFileSync(path.join(FX_FORCES, 'registry.json'), 'utf8'));
  base.forces.push(...extraForces);
  return `${JSON.stringify(base, null, 2)}\n`;
}

const forceJsonDe = (id) =>
  fs.readFileSync(path.join(FX_FORCES, 'forces/force-sample/force.json'), 'utf8').replace(/force-sample/g, id);
const escenaFixture = () =>
  fs.readFileSync(path.join(FX_FORCES, 'forces/force-sample/escenas/sesion-01/01-sample/prompt.md'), 'utf8');

/** Pack FORCES con una unidad limpia (`aaa-force`) y otra bajo `forces/hondo/`. */
const packForcesBloqueante = (ctx) =>
  ctx.pack({
    name: 'pack-forces-u255',
    version: '2.0.0',
    volumes: { forces: FORCES },
    seed: {
      [`${VOL_FORCES}/registry.json`]: registryCon([
        forceUnit('force-aaa', 'forces/aaa-force/'),
        forceUnit('force-ccc', 'forces/hondo/force-ccc/')
      ]),
      [`${VOL_FORCES}/forces/aaa-force/force.json`]: forceJsonDe('force-aaa'),
      [`${VOL_FORCES}/forces/aaa-force/escenas/sesion-01/01-sample/prompt.md`]: escenaFixture(),
      [`${VOL_FORCES}/forces/hondo/force-ccc/force.json`]: forceJsonDe('force-ccc'),
      [`${VOL_FORCES}/forces/hondo/force-ccc/escenas/sesion-01/01-sample/prompt.md`]: escenaFixture()
    }
  });

test('U255·FORCES ROJO: el mismo hueco que LINEAS — dejaba DOS ficheros aterrizados', (t) => {
  const ctx = setupRoot();
  try {
    assert.equal(importPack({ packRoot: ctx.pack({ name: 'pa', volumes: { forces: FORCES } }), role: 'operator' }).ok, true);
    fs.writeFileSync(rootAbs(ctx.root, `${VOL_FORCES}/forces/hondo`), 'resto de operacion manual\n', 'utf8');

    const antes = retrato(ctx.root);
    const res = importPack({ packRoot: packForcesBloqueante(ctx), role: 'operator' });
    abortoEnSeco(t, { res, antes, root: ctx.root, error: 'ruta_bloqueada_por_fichero' });
    assert.equal(res.blockedBy, 'forces/hondo');
    // La unidad limpia, que sobre la base ya había aterrizado entera, no está.
    assert.ok(!fs.existsSync(rootAbs(ctx.root, `${VOL_FORCES}/forces/aaa-force`)));
  } finally {
    ctx.restore();
  }
});

test('U255·FORCES VERDE (no vacuidad): sin la obstrucción, las dos unidades aterrizan y el índice se reemplaza', () => {
  const ctx = setupRoot();
  try {
    assert.equal(importPack({ packRoot: ctx.pack({ name: 'pa', volumes: { forces: FORCES } }), role: 'operator' }).ok, true);
    const res = importPack({ packRoot: packForcesBloqueante(ctx), role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.ok(fs.existsSync(rootAbs(ctx.root, `${VOL_FORCES}/forces/aaa-force/force.json`)));
    assert.ok(fs.existsSync(rootAbs(ctx.root, `${VOL_FORCES}/forces/hondo/force-ccc/force.json`)));
    // El `registry.json` es la ÚNICA sobrescritura deliberada del carril: la
    // guarda del plan la tolera porque el driver la DECLARA en `overwrites`.
    const reg = JSON.parse(fs.readFileSync(rootAbs(ctx.root, `${VOL_FORCES}/registry.json`), 'utf8'));
    assert.ok(reg.forces.some((f) => f.id === 'force-ccc'), 'el índice del destino no se reemplazó');
  } finally {
    ctx.restore();
  }
});

test('U255·FORCES: `overwrites` declara el reemplazo del índice, y sólo ése', () => {
  // Si esto se rompiera, la guarda del plan pasaría a bloquear un import
  // legítimo de FORCES: es el cable exacto entre el driver y `fusion-guard`.
  const ctx = setupRoot();
  try {
    const packA = ctx.pack({ name: 'pa', volumes: { forces: FORCES } });
    assert.equal(importPack({ packRoot: packA, role: 'operator' }).ok, true);
    const stagedDir = path.join(packA, 'volumes', ...VOL_FORCES.split('/'));
    const destDir = rootAbs(ctx.root, VOL_FORCES);

    // Mismo pack contra el destino ya poblado: cero moves, cero overwrites.
    const plan1 = FAMILY_DRIVERS.forces.merge({
      stagedDir,
      destDir,
      volumeFiles: collectFiles(stagedDir)
    });
    assert.deepEqual(plan1.overwrites, []);
    assert.equal(plan1.replacedIndex, false);

    // Pack que crece: el índice se reemplaza y se DECLARA.
    const packB = packForcesBloqueante(ctx);
    const stagedB = path.join(packB, 'volumes', ...VOL_FORCES.split('/'));
    const plan2 = FAMILY_DRIVERS.forces.merge({
      stagedDir: stagedB,
      destDir,
      volumeFiles: collectFiles(stagedB)
    });
    assert.deepEqual(plan2.overwrites, ['registry.json']);
    assert.ok(plan2.moves.includes('registry.json'));
  } finally {
    ctx.restore();
  }
});

test('U255·FORCES ROJO: fichero en la ruta de una unidad declarada → `unidad_bloqueada_por_fichero`', (t) => {
  const ctx = setupRoot();
  try {
    assert.equal(importPack({ packRoot: ctx.pack({ name: 'pa', volumes: { forces: FORCES } }), role: 'operator' }).ok, true);
    fs.writeFileSync(rootAbs(ctx.root, `${VOL_FORCES}/forces/aaa-force`), 'no soy un directorio\n', 'utf8');

    const antes = retrato(ctx.root);
    const res = importPack({
      packRoot: ctx.pack({
        name: 'pb',
        version: '2.0.0',
        volumes: { forces: FORCES },
        seed: {
          [`${VOL_FORCES}/registry.json`]: registryCon([forceUnit('force-aaa', 'forces/aaa-force/')]),
          [`${VOL_FORCES}/forces/aaa-force/force.json`]: forceJsonDe('force-aaa')
        }
      }),
      role: 'operator'
    });
    abortoEnSeco(t, { res, antes, root: ctx.root, error: 'unidad_bloqueada_por_fichero' });
    assert.equal(res.unit, 'forces/aaa-force');
    assert.equal(res.ocupadoPor, 'fichero');
  } finally {
    ctx.restore();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · LOS QUE NINGÚN DRIVER VE (volumen sin familia, corpus, pack anidado)
// ═══════════════════════════════════════════════════════════════════════════

test('U255·genérico ROJO: corpus nuevo con ancestro FICHERO — no pasa por ningún driver', (t) => {
  const ctx = setupRoot();
  const GEN = { disk: 'DISK_09', path: 'DISK_09/GEN', readonly: true, label: 'gen' };
  try {
    assert.equal(
      importPack({
        packRoot: ctx.pack({
          name: 'pg1',
          volumes: { gen: { ...GEN, corpora: [{ id: 'c1', path: 'c1' }] } },
          seed: { 'DISK_09/GEN/c1/a.txt': 'uno\n' }
        }),
        role: 'operator'
      }).ok,
      true
    );
    fs.writeFileSync(rootAbs(ctx.root, 'DISK_09/GEN/sub'), 'fichero heredado\n', 'utf8');

    const antes = retrato(ctx.root);
    const res = importPack({
      packRoot: ctx.pack({
        name: 'pg2',
        version: '2.0.0',
        volumes: {
          gen: {
            ...GEN,
            corpora: [
              { id: 'c1', path: 'c1' },
              { id: 'c2', path: 'c2' },
              { id: 'c3', path: 'sub/c3' }
            ]
          }
        },
        seed: {
          'DISK_09/GEN/c1/a.txt': 'uno\n',
          'DISK_09/GEN/c2/b.txt': 'dos\n',
          'DISK_09/GEN/sub/c3/c.txt': 'tres\n'
        }
      }),
      role: 'operator'
    });
    abortoEnSeco(t, { res, antes, root: ctx.root, error: 'ruta_bloqueada_por_fichero' });
    assert.equal(res.kind, 'corpus');
    // `c2` es el corpus que sobre la base YA había aterrizado antes de reventar.
    assert.ok(!fs.existsSync(rootAbs(ctx.root, 'DISK_09/GEN/c2/b.txt')));
  } finally {
    ctx.restore();
  }
});

test('U255·genérico ROJO: dos volúmenes ANIDADOS en el mismo pack (deuda U201) → `plan_con_destinos_anidados`', (t) => {
  // `driver-firehose.mjs` declaraba este caso «fuera del alcance de cualquier
  // driver … deuda de U201». Lo es: ocurre en el bucle POR VOLUMEN de
  // `importPack`, y por eso la guarda vive sobre el plan entero.
  const ctx = setupRoot();
  try {
    const antes = retrato(ctx.root);
    const res = importPack({
      packRoot: ctx.pack({
        name: 'pn',
        volumes: {
          padre: { disk: 'DISK_07', path: 'DISK_07/V', readonly: true, label: 'padre' },
          hijo: { disk: 'DISK_07', path: 'DISK_07/V/sub', readonly: true, label: 'hijo' }
        },
        seed: { 'DISK_07/V/a.txt': 'a\n', 'DISK_07/V/sub/b.txt': 'b\n' }
      }),
      role: 'operator'
    });
    abortoEnSeco(t, { res, antes, root: ctx.root, error: 'plan_con_destinos_anidados' });
    assert.deepEqual([...res.volumes].sort(), ['hijo', 'padre']);
    assert.ok(!fs.existsSync(rootAbs(ctx.root, 'DISK_07')));
  } finally {
    ctx.restore();
  }
});

test('U255·genérico VERDE: slot de volumen que existe VACÍO no es slot ocupado — aterriza', () => {
  // Sobre la base esto daba `EPERM` en el `rename` **en Windows** y aterrizaba
  // en POSIX (`rename(2)`: el destino puede ser un directorio vacío), con un
  // fichero de otro volumen ya movido. El contrato ya decía que un directorio
  // sin ficheros NO es `slot_ocupado`; ahora las dos plataformas hacen eso.
  const ctx = setupRoot();
  try {
    fs.mkdirSync(rootAbs(ctx.root, 'DISK_09/GEN'), { recursive: true });
    const res = importPack({
      packRoot: ctx.pack({
        name: 'pg',
        volumes: {
          primero: { disk: 'DISK_08', path: 'DISK_08/UNO', readonly: true, label: 'uno' },
          gen: { disk: 'DISK_09', path: 'DISK_09/GEN', readonly: true, label: 'gen' }
        },
        seed: { 'DISK_08/UNO/a.txt': 'uno\n', 'DISK_09/GEN/b.txt': 'dos\n' }
      }),
      role: 'operator'
    });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(fs.readFileSync(rootAbs(ctx.root, 'DISK_09/GEN/b.txt'), 'utf8'), 'dos\n');
    assert.equal(fs.readFileSync(rootAbs(ctx.root, 'DISK_08/UNO/a.txt'), 'utf8'), 'uno\n');
  } finally {
    ctx.restore();
  }
});

test('U255·genérico: un slot con UN SOLO fichero sigue siendo `slot_ocupado` (la guarda no ensancha)', (t) => {
  const ctx = setupRoot();
  try {
    fs.mkdirSync(rootAbs(ctx.root, 'DISK_09/GEN'), { recursive: true });
    fs.writeFileSync(rootAbs(ctx.root, 'DISK_09/GEN/heredado.txt'), 'x\n', 'utf8');
    const antes = retrato(ctx.root);
    const res = importPack({
      packRoot: ctx.pack({
        name: 'pg',
        volumes: { gen: { disk: 'DISK_09', path: 'DISK_09/GEN', readonly: true, label: 'gen' } },
        seed: { 'DISK_09/GEN/b.txt': 'dos\n' }
      }),
      role: 'operator'
    });
    abortoEnSeco(t, { res, antes, root: ctx.root, error: 'slot_ocupado' });
  } finally {
    ctx.restore();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4 · LO QUE NO SE PUEDE PREVER · el deshacer, y lo que vale su inventario
// ═══════════════════════════════════════════════════════════════════════════

/** Escenario mínimo de fusión: un «staging» y un «destino» en el mismo temporal. */
function montaFusion(nFicheros, { destinoPrevio = {} } = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u255-fus-'));
  const staging = path.join(base, '.import-staging-x');
  const destino = path.join(base, 'DISK', 'V');
  fs.mkdirSync(destino, { recursive: true });
  for (const [rel, content] of Object.entries(destinoPrevio)) {
    const abs = path.join(destino, rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }
  /** @type {{kind:string,volId:string,from:string,to:string}[]} */
  const moves = [];
  for (let i = 0; i < nFicheros; i += 1) {
    const rel = `hondo/n${i}/dato.txt`;
    const from = path.join(staging, rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(from), { recursive: true });
    fs.writeFileSync(from, `contenido ${i}\n`, 'utf8');
    moves.push({ kind: 'file', volId: 'v', from, to: path.join(destino, rel.split('/').join(path.sep)) });
  }
  return { base, staging, destino, moves, limpia: () => fs.rmSync(base, { recursive: true, force: true }) };
}

test('U255·deshacer: un fallo a mitad de la aplicación deja el destino byte a byte como estaba', (t) => {
  // El vector real de esta clase (permiso denegado, fichero tomado por otro
  // proceso, EXDEV) no es reproducible en una suite portable, así que el fallo
  // se INYECTA: un movimiento cuyo origen no existe. Lo que se mide es el
  // deshacer, que es lo mismo pase lo que pase antes.
  const f = montaFusion(3, { destinoPrevio: { 'ya-estaba.txt': 'del destino\n' } });
  try {
    const antes = retrato(f.destino);
    const moves = [...f.moves];
    moves.splice(2, 0, {
      kind: 'file',
      volId: 'v',
      from: path.join(f.staging, 'no-existe.txt'),
      to: path.join(f.destino, 'no-existe.txt')
    });

    const res = applyFusion(moves, []);
    assert.ok(res.error, 'la aplicación tenía que fallar');
    assert.equal(res.error.code, 'fusion_interrumpida');
    assert.equal(res.error.detail.causa.code, 'ENOENT');
    assert.equal(res.error.detail.renombradosHechos, 2, 'dos movimientos habían llegado a aterrizar');
    assert.equal(res.error.detail.renombradosDeshechos, 2);
    assert.deepEqual(res.error.detail.sinDeshacer, [], 'el inventario dice que no quedó nada sin deshacer');

    // Y la comprobación que hace valer al inventario: el destino, medido.
    assert.deepEqual(retrato(f.destino), antes);
    // Los directorios que la fusión creó tampoco quedan de resto.
    assert.ok(!fs.existsSync(path.join(f.destino, 'hondo')));
    // Y lo deshecho volvió al staging, listo para que el `finally` lo borre.
    for (const m of f.moves) assert.ok(fs.existsSync(m.from), `${m.from} no volvió al staging`);
    t.diagnostic(`deshechos 2/2, destino con ${Object.keys(antes).length} rutas idénticas`);
  } finally {
    f.limpia();
  }
});

test('U255·deshacer: un reemplazo DECLARADO también se deshace — el fichero pisado vuelve', () => {
  // `renameSync` pisa en silencio, así que sin apartar el fichero del destino
  // el deshacer sería una promesa a medias: el reemplazo quedaría «deshecho»
  // con el destino SIN lo que tenía.
  const f = montaFusion(1, { destinoPrevio: { 'indice.json': '{"del":"destino"}\n' } });
  try {
    const antes = retrato(f.destino);
    const desdeStaging = path.join(f.staging, 'indice.json');
    fs.writeFileSync(desdeStaging, '{"del":"pack"}\n', 'utf8');
    const moves = [
      { kind: 'file', volId: 'v', sobrescribe: true, from: desdeStaging, to: path.join(f.destino, 'indice.json') },
      { kind: 'file', volId: 'v', from: path.join(f.staging, 'no-existe.txt'), to: path.join(f.destino, 'x.txt') }
    ];
    const res = applyFusion(moves, []);
    assert.ok(res.error);
    assert.equal(res.error.code, 'fusion_interrumpida');
    assert.deepEqual(res.error.detail.sinDeshacer, []);
    assert.deepEqual(retrato(f.destino), antes, 'el índice pisado no volvió byte a byte');
    assert.equal(fs.readFileSync(path.join(f.destino, 'indice.json'), 'utf8'), '{"del":"destino"}\n');
  } finally {
    f.limpia();
  }
});

test('U255·deshacer: lo que NO se puede deshacer se ENUMERA, no se calla', () => {
  // El inventario tiene que decir la verdad también cuando la vuelta falla.
  // Se fuerza ocupando la ruta de staging a la que el fichero tendría que
  // volver: la vuelta lanza y el fichero se queda en el destino.
  const f = montaFusion(1);
  try {
    const aplicado = { from: f.moves[0].from, to: f.moves[0].to, slotVaciado: false, apartado: null, dirCreado: undefined };
    fs.mkdirSync(path.dirname(aplicado.to), { recursive: true });
    fs.renameSync(aplicado.from, aplicado.to); // simula el rename ya hecho
    fs.mkdirSync(aplicado.from); // la ruta de vuelta queda ocupada por un DIRECTORIO

    const vuelta = deshacerFusion([aplicado]);
    assert.deepEqual(vuelta.deshechos, []);
    assert.equal(vuelta.sinDeshacer.length, 1);
    assert.equal(vuelta.sinDeshacer[0].to, aplicado.to);
    assert.ok(vuelta.sinDeshacer[0].causa.code, 'la causa viaja entera');
    assert.ok(fs.existsSync(aplicado.to), 'el fichero sigue en el destino, y el inventario lo dice');
  } finally {
    f.limpia();
  }
});

test('U255·deshacer: los directorios que NO quedan vacíos se conservan (jamás `rm -r`)', () => {
  const f = montaFusion(1);
  try {
    const res1 = applyFusion([f.moves[0]], []);
    assert.ok(res1.ok);
    // Alguien deja material propio dentro del directorio que la fusión creó.
    fs.writeFileSync(path.join(f.destino, 'hondo', 'ajeno.txt'), 'no lo puso el import\n', 'utf8');
    // Se deshace lo aplicado: el fichero vuelve, el directorio se queda.
    const vuelta = deshacerFusion([
      { from: f.moves[0].from, to: f.moves[0].to, slotVaciado: false, apartado: null, dirCreado: path.join(f.destino, 'hondo') }
    ]);
    assert.deepEqual(vuelta.sinDeshacer, []);
    assert.ok(!fs.existsSync(f.moves[0].to));
    assert.equal(fs.readFileSync(path.join(f.destino, 'hondo', 'ajeno.txt'), 'utf8'), 'no lo puso el import\n');
    assert.ok(!fs.existsSync(path.join(f.destino, 'hondo', 'n0')), 'el subdirectorio vacío sí se retira');
  } finally {
    f.limpia();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 5 · LA PIEZA COMPARTIDA · un solo cuerpo para las cuatro familias
// ═══════════════════════════════════════════════════════════════════════════

test('U255: `blockingAncestor` es UN cuerpo y los cuatro drivers lo usan', () => {
  // U259 movió `hashUnitTree` a su propia pieza por este mismo motivo: dos
  // copias de una guarda divergen a la primera decisión, y la divergencia se
  // manifiesta como «el volumen quedó a medias». Aquí eran DOS copias
  // (FIREHOSE·D3 y SSB) y hacían falta CUATRO.
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u255-anc-'));
  try {
    fs.mkdirSync(path.join(base, 'a', 'b'), { recursive: true });
    fs.writeFileSync(path.join(base, 'a', 'b', 'bloqueante'), 'x', 'utf8');
    fs.writeFileSync(path.join(base, 'suelto'), 'x', 'utf8');

    assert.equal(blockingAncestor(base, 'a/b/bloqueante/dentro/x.json'), 'a/b/bloqueante');
    assert.equal(blockingAncestor(base, 'suelto/x.json'), 'suelto');
    assert.equal(blockingAncestor(base, 'a/b/nuevo/x.json'), null, 'un directorio no bloquea');
    assert.equal(blockingAncestor(base, 'nada/de/nada/x.json'), null, 'lo inexistente no bloquea');
    // El propio fichero destino NO es su ancestro: eso lo juzga
    // `sobrescritura_imposible`, no esta función.
    assert.equal(blockingAncestor(base, 'suelto'), null);

    // Los cuatro drivers están cableados a la misma pieza: si alguno volviera
    // a declarar la suya, este probe no lo vería — lo que sí se asevera es que
    // los cuatro exponen `merge` y que ninguno duplica el cuerpo (grep del
    // fuente, que es la única forma honesta de comprobarlo desde aquí).
    for (const [family, driver] of Object.entries(FAMILY_DRIVERS)) {
      assert.equal(typeof driver.merge, 'function', `${family} sin merge`);
      const fuente = fs.readFileSync(
        path.resolve(__dirname, `../src/driver-${family}.mjs`),
        'utf8'
      );
      assert.ok(
        /import \{ blockingAncestor \} from '\.\/fusion-guard\.mjs'/.test(fuente),
        `driver-${family}.mjs no importa la pieza compartida`
      );
      assert.ok(
        !/function blockingAncestor/.test(fuente),
        `driver-${family}.mjs volvió a declarar su propia copia`
      );
    }
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('U255: `inspectFusionPlan` tolera el reemplazo DECLARADO sólo entre ficheros', () => {
  const f = montaFusion(0, { destinoPrevio: { 'indice.json': 'destino\n' } });
  try {
    const from = path.join(f.staging, 'indice.json');
    fs.mkdirSync(f.staging, { recursive: true });
    fs.writeFileSync(from, 'pack\n', 'utf8');
    const to = path.join(f.destino, 'indice.json');

    // (a) declarado + fichero↔fichero → pasa
    assert.ok(
      inspectFusionPlan([{ kind: 'file', volId: 'v', sobrescribe: true, from, to }], f.base).ok
    );
    // (b) el MISMO movimiento sin declarar → aborta
    const sinDeclarar = inspectFusionPlan([{ kind: 'file', volId: 'v', from, to }], f.base);
    assert.equal(sinDeclarar.error.code, 'sobrescritura_imposible');
    assert.equal(sinDeclarar.error.detail.ocupadoPor, 'fichero');
    // (c) declarado pero el destino es un DIRECTORIO → aborta igual
    const dir = path.join(f.destino, 'comoDir');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'dentro.txt'), 'x', 'utf8');
    const contraDir = inspectFusionPlan(
      [{ kind: 'file', volId: 'v', sobrescribe: true, from, to: dir }],
      f.base
    );
    assert.equal(contraDir.error.code, 'sobrescritura_imposible');
    assert.equal(contraDir.error.detail.ocupadoPor, 'directorio');
  } finally {
    f.limpia();
  }
});

test('U255: `inspectFusionPlan` caza dos movimientos con el MISMO destino', () => {
  const f = montaFusion(2);
  try {
    const moves = [f.moves[0], { ...f.moves[1], to: f.moves[0].to }];
    const res = inspectFusionPlan(moves, f.base);
    assert.equal(res.error.code, 'plan_con_destinos_anidados');
    assert.equal(res.error.detail.movimientos.length, 2);
  } finally {
    f.limpia();
  }
});

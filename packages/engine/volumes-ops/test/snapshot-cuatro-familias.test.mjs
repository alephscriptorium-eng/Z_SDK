/**
 * WP-U259 · La detección de corrupción cubre las CUATRO familias.
 *
 * ── EL HUECO, MEDIDO ANTES DE TOCAR NADA ─────────────────────────────────
 * Tras U258 el único vector que seguía **arrancando** en un root sellado era
 * el ALTA, y sólo FORCES lo cazaba (su snapshot de unidad es un hash de
 * CONJUNTO). Medido sobre un root con las cuatro familias importado por el
 * camino del producto:
 *
 *   vector                                   ANTES      DESPUÉS
 *   lineas · ALTA en unidad (schema-válida)  ARRANCA    SE NIEGA (unidad_corrupta)
 *   firehose · ALTA de unidad                ARRANCA    SE NIEGA (cursor_desviado)
 *   ssb · ALTA de mensaje                    ARRANCA    SE NIEGA (cursor_desviado + feed_desviado)
 *   forces · ALTA en unidad                  SE NIEGA   SE NIEGA (ya lo cubría)
 *
 * Y lo que NO debía moverse, y no se movió — las copias locales que
 * `.gitignore` (WP-U108/A-15) permite a propósito:
 *   lineas · ALTA FUERA de unidad (LINEAS/espana)   ARRANCA → ARRANCA
 *   forces · ALTA FUERA de unidad (forces/force-*)  ARRANCA → ARRANCA
 *
 * ── LO QUE ESTE FICHERO ASEVERA ──────────────────────────────────────────
 *  1. CONTRATO — todo driver del registro expone el par `snapshotOf` /
 *     `verifySnapshot`. Es la aserción que impide que esto se reabra con la
 *     quinta familia: antes había una tabla a mano en `verify.mjs` con una
 *     entrada, y una familia nueva se colaba en silencio como «omitida».
 *  2. SIMETRÍA — el snapshot que sella `importPack` (recomputado del DESTINO)
 *     es el que `verifySnapshot` recomputa. No se comparan dos algoritmos: se
 *     comprueba que sellar y verificar sean el MISMO cuerpo.
 *  3. UN ROJO POR FAMILIA — cuatro vectores, cuatro negativas de arranque por
 *     el camino del producto (`assertVolumesRootBootable`), cada una con su
 *     hallazgo nombrado.
 *  4. NO VACUIDAD — cada rojo va con su premisa: se asevera que los OTROS
 *     tramos dejan pasar el vector, para que el rojo sea del tramo nuevo y no
 *     de rebote.
 *  5. TOLERANCIA declarada — el alta FUERA del perímetro sellado sigue
 *     arrancando, en las dos familias donde el repo declara permitirla.
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
  assertVolumesRootBootable,
  FAMILY_DRIVERS,
  importPack,
  verifyRootIntegrity
} from '../src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LINEAS_FIXTURE = path.resolve(__dirname, '../../linea-kit/test/fixtures/lineas');
const FORCES_FIXTURE = path.resolve(__dirname, '../../linea-kit/test/fixtures/forces');
const COLLECTION = 'app.bsky.feed.post';
const ALICE = '@alice.ed25519';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const MUDO = { warn() {} };

const TEMPS = [];
function mkTemp(label) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), `zeus-u259-${label}-`));
  TEMPS.push(d);
  return d;
}
test.after(() => {
  for (const d of TEMPS) fs.rmSync(d, { recursive: true, force: true });
});

function collectFiles(dir, rel = '') {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...collectFiles(path.join(dir, e.name), r));
    else if (e.isFile()) out.push(r);
  }
  return out.sort();
}
function copyTree(from, to) {
  for (const rel of collectFiles(from)) {
    const dst = path.join(to, rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(from, rel.split('/').join(path.sep)), dst);
  }
}
function write(abs, obj) {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(
    abs,
    typeof obj === 'string' ? obj : `${JSON.stringify(obj, null, 2)}\n`,
    'utf8'
  );
}

/** Payload jetstream crudo, la forma que escribe `writeJetstreamPost`. */
const post = (rkey, did = 'did:plc:alpha') => ({
  did,
  kind: 'commit',
  handle: 'alpha.bsky.social',
  uri: `at://${did}/${COLLECTION}/${rkey}`,
  commit: {
    collection: COLLECTION,
    rkey,
    record: { text: `post ${rkey}`, createdAt: '2026-07-31T00:00:00.000Z' }
  }
});
/** Réplica de `messageFileName` (ssb-system/src/types.mjs). */
const messageFileName = (key) => `${Buffer.from(String(key), 'utf8').toString('base64url')}.json`;
/** Mensaje SSB aterrizado, la forma que escribe `ssb-system/src/export.mjs`. */
const msg = (key, sequence, previous) => ({
  key,
  value: {
    previous,
    author: ALICE,
    sequence,
    timestamp: 1730000000000 + sequence,
    hash: 'sha256',
    content: { type: 'tribe' },
    signature: 'fixture'
  },
  type: 'tribe',
  corpus: 'tribes'
});

const VOL_REL = {
  lineas: 'DISK_02/LINEAS',
  forces: 'DISK_03/FORCES',
  firehose: 'DISK_01/FIREHOSE',
  ssb: 'DISK_04/SSB'
};

/**
 * Root con las CUATRO familias, sellado por el camino del producto.
 * Nada de manifiestos a mano: se construye un pack y se importa.
 */
function rootDeCuatroFamilias(label = 'root') {
  const packRoot = mkTemp('pack');
  const dataRoot = path.join(packRoot, 'volumes');
  copyTree(LINEAS_FIXTURE, path.join(dataRoot, ...VOL_REL.lineas.split('/')));
  copyTree(FORCES_FIXTURE, path.join(dataRoot, ...VOL_REL.forces.split('/')));

  const fh = path.join(dataRoot, ...VOL_REL.firehose.split('/'));
  write(path.join(fh, 'raw', 'b1', 'u1.json'), post('u1'));
  write(path.join(fh, 'raw', 'b1', 'u2.json'), post('u2'));
  write(path.join(fh, 'candidate', 'b1', 'u3.json'), post('u3'));

  const ssb = path.join(dataRoot, ...VOL_REL.ssb.split('/'));
  for (const [i, key] of ['%m1=.sha256', '%m2=.sha256', '%m3=.sha256'].entries()) {
    write(
      path.join(ssb, 'tribes', messageFileName(key)),
      msg(key, i + 1, i === 0 ? null : `%m${i}=.sha256`)
    );
  }

  /** @type {Record<string, object>} */
  const volumes = {};
  for (const [id, rel] of Object.entries(VOL_REL)) {
    volumes[id] = { disk: rel.split('/')[0], path: rel, readonly: true, label: id };
  }
  /** @type {Record<string,string>} */
  const hashes = {};
  for (const rel of collectFiles(dataRoot)) {
    hashes[rel] = sha256(fs.readFileSync(path.join(dataRoot, rel.split('/').join(path.sep))));
  }
  write(path.join(packRoot, 'manifest.json'), {
    name: `pack-u259-${label}`,
    version: '1.0.0',
    volumes,
    hashes
  });

  const root = mkTemp(label);
  write(path.join(root, 'volumes.json'), { root: '.', volumes: {} });
  const prev = process.env.ZEUS_VOLUMES_ROOT;
  process.env.ZEUS_VOLUMES_ROOT = root;
  resetZeusEnvLoader();
  resetVolumesCache();

  const res = importPack({ packRoot, role: 'operator', actorId: 'u259' });
  assert.equal(res.ok, true, JSON.stringify(res, null, 2));
  return {
    root,
    res,
    packRoot,
    volDir: (id) => path.join(root, ...VOL_REL[id].split('/')),
    manifiesto: () => JSON.parse(fs.readFileSync(path.join(root, 'volumes.json'), 'utf8')),
    restore() {
      if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
      else process.env.ZEUS_VOLUMES_ROOT = prev;
      resetZeusEnvLoader();
      resetVolumesCache();
    }
  };
}

/** El camino del PRODUCTO, acotado al volumen como lo acota cada servicio. */
function arranca(volumeId) {
  resetVolumesCache();
  try {
    assertVolumesRootBootable({ service: `u259-${volumeId}`, volumeIds: [volumeId], logger: MUDO });
    return { arranca: true, motivo: null };
  } catch (err) {
    return { arranca: false, motivo: String(err.message) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 · CONTRATO DEL DRIVER
// ═══════════════════════════════════════════════════════════════════════════

test('CONTRATO · todo driver del registro sabe SELLAR y VERIFICAR su snapshot', () => {
  // La aserción que impide que U259 se reabra: antes el verificador llevaba una
  // tabla a mano (`SNAPSHOT_VERIFIERS = { forces }`) y una familia nueva salía
  // «omitida» sin que nadie se enterara — que es exactamente cómo FIREHOSE y
  // SSB acabaron sellando un cursor que nadie contrastaba.
  const familias = Object.keys(FAMILY_DRIVERS);
  assert.ok(familias.length >= 4, `sólo ${familias.length} familias en el registro`);
  for (const [family, driver] of Object.entries(FAMILY_DRIVERS)) {
    assert.equal(
      typeof driver.snapshotOf,
      'function',
      `el driver «${family}» no expone snapshotOf(): no puede sellar snapshot`
    );
    assert.equal(
      typeof driver.verifySnapshot,
      'function',
      `el driver «${family}» no expone verifySnapshot(): sellaría sin poder verificar`
    );
  }
});

test('CONTRATO · un snapshot ILEGIBLE para su familia es hallazgo, no omisión', () => {
  for (const [family, driver] of Object.entries(FAMILY_DRIVERS)) {
    const found = driver.verifySnapshot(mkTemp(`vacio-${family}`), { forma: 'que no es' });
    assert.ok(
      found.length > 0 && found.some((f) => f.error === 'snapshot_ilegible'),
      `el driver «${family}» acepta un snapshot con forma ajena: ${JSON.stringify(found)}`
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · SIMETRÍA SELLAR ↔ VERIFICAR
// ═══════════════════════════════════════════════════════════════════════════

test('SIMETRÍA · las cuatro familias sellan snapshot, y es el que su driver recomputa', () => {
  const ctx = rootDeCuatroFamilias('simetria');
  try {
    const cfg = ctx.manifiesto();
    for (const id of Object.keys(VOL_REL)) {
      const sellado = cfg.volumes[id]?.source?.imported?.snapshot;
      assert.ok(sellado, `el volumen «${id}» NO lleva snapshot sellado`);
      const driver = FAMILY_DRIVERS[cfg.volumes[id].family];
      assert.ok(driver, `el volumen «${id}» no quedó con familia`);
      // Mismo cuerpo: `snapshotOf` es lo que selló y lo que se recomputa.
      assert.deepEqual(
        driver.snapshotOf(ctx.volDir(id)),
        sellado,
        `«${id}»: el snapshot sellado no es el que su driver recomputa del árbol vivo`
      );
      assert.deepEqual(
        driver.verifySnapshot(ctx.volDir(id), sellado),
        [],
        `«${id}»: el verificador ve hallazgos en un volumen recién importado`
      );
    }
    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, true, JSON.stringify(rep.findings));
    // Y NINGÚN volumen queda con el tramo omitido: era 1 de 4, ahora es 4 de 4.
    const conSnapshotVerde = rep.checks.filter((c) => c.check === 'snapshot' && c.ok);
    assert.equal(
      conSnapshotVerde.length,
      4,
      `sólo ${conSnapshotVerde.length} familias con snapshot VERDE: ${JSON.stringify(rep.skipped)}`
    );
    assert.ok(
      !rep.skipped.some((s) => s.check === 'snapshot'),
      `queda snapshot omitido: ${JSON.stringify(rep.skipped.filter((s) => s.check === 'snapshot'))}`
    );
  } finally {
    ctx.restore();
  }
});

test('SIMETRÍA · el snapshot sellado sale del DESTINO, y coincide con el PLAN del driver', () => {
  // U258 aprendió esto con `hashes`; U259 lo aplica al snapshot. En FORCES los
  // dos momentos coinciden siempre (una unidad divergente aborta el import), y
  // se asevera para que el cambio de momento quede MEDIDO, no supuesto.
  const ctx = rootDeCuatroFamilias('plan-vs-destino');
  try {
    const cfg = ctx.manifiesto();
    const planPorId = new Map(ctx.res.families.map((f) => [f.id, f.snapshot]));
    for (const id of ['forces', 'firehose', 'ssb']) {
      assert.deepEqual(
        cfg.volumes[id].source.imported.snapshot,
        planPorId.get(id),
        `«${id}»: el snapshot del destino difiere del plan en un import sin divergencia`
      );
    }
    // LINEAS es la familia por la que la regla existe: su plan NO trae snapshot
    // (el driver planifica por fichero, no por unidad), así que el único origen
    // posible es el destino.
    assert.equal(planPorId.get('lineas'), null);
    assert.ok(cfg.volumes.lineas.source.imported.snapshot);
  } finally {
    ctx.restore();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · UN ROJO POR FAMILIA — el ALTA, que es lo que quedaba vivo tras U258
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cada vector: qué se planta, qué hallazgo debe salir, y qué tramos NO deben
 * verlo (la premisa que hace que el rojo sea del tramo nuevo).
 */
const VECTORES = [
  {
    id: 'lineas',
    titulo: 'ALTA schema-VÁLIDA dentro de la línea sellada (copia de un meta.json real)',
    error: 'unidad_corrupta',
    ciegos: ['ficheros', 'familia', 'corpora'],
    plantar(volDir) {
      const src = path.join(volDir, 'demo', 'nodos', 'N01', 'meta.json');
      const dst = path.join(volDir, 'demo', 'nodos', 'N02', 'meta.json');
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    }
  },
  {
    id: 'forces',
    titulo: 'ALTA dentro de la unidad sellada',
    error: 'unidad_corrupta',
    ciegos: ['ficheros', 'familia', 'corpora'],
    plantar(volDir) {
      write(path.join(volDir, 'forces', 'force-sample', 'nota-lateral.txt'), 'alta\n');
    }
  },
  {
    id: 'firehose',
    titulo: 'ALTA de una unidad con clave NUEVA (la caché creció fuera del import)',
    error: 'cursor_desviado',
    ciegos: ['ficheros', 'familia', 'corpora'],
    plantar(volDir) {
      write(path.join(volDir, 'raw', 'b1', 'u9.json'), post('u9'));
    }
  },
  {
    id: 'ssb',
    titulo: 'ALTA de un mensaje con clave NUEVA (el feed creció fuera del import)',
    error: 'cursor_desviado',
    ciegos: ['ficheros', 'familia', 'corpora'],
    plantar(volDir) {
      const key = '%m9=.sha256';
      write(path.join(volDir, 'tribes', messageFileName(key)), msg(key, 9, '%m3=.sha256'));
    }
  }
];

for (const vec of VECTORES) {
  test(`ROJO · ${vec.id}: ${vec.titulo} → ${vec.error} y el arranque SE NIEGA`, () => {
    const ctx = rootDeCuatroFamilias(`rojo-${vec.id}`);
    try {
      assert.equal(arranca(vec.id).arranca, true, 'premisa rota: el root sano no arranca');
      vec.plantar(ctx.volDir(vec.id));
      resetVolumesCache();

      const rep = verifyRootIntegrity({ volumeIds: [vec.id] });
      // NO VACUIDAD: los otros tramos dejan pasar este vector. Sin esta
      // aserción el rojo podría venir de rebote y el tramo nuevo ser adorno.
      for (const leg of vec.ciegos) {
        assert.ok(
          !rep.findings.some((f) => f.check === leg),
          `premisa rota: el tramo «${leg}» ya veía este vector — ` +
            `${JSON.stringify(rep.findings.filter((f) => f.check === leg))}`
        );
      }
      const hallazgo = rep.findings.find((f) => f.check === 'snapshot');
      assert.ok(hallazgo, `sin hallazgo de snapshot: ${JSON.stringify(rep.findings)}`);
      assert.equal(hallazgo.error, vec.error);
      assert.equal(hallazgo.volume, vec.id);

      const r = arranca(vec.id);
      assert.equal(r.arranca, false, `el arranque de «${vec.id}» NO se negó`);
      assert.match(r.motivo, /arranque ABORTADO/);
      assert.match(r.motivo, new RegExp(vec.error));
    } finally {
      ctx.restore();
    }
  });
}

test('ROJO · SSB: el segundo eje (posición de feed) se declara APARTE del conjunto de claves', () => {
  // `feedsSha256` puede desviarse con el MISMO conjunto de claves: la clave SSB
  // es opaca, así que reescribir `value.sequence` no la cambia. Es la garantía
  // central de la familia y ningún otro tramo la mira.
  const ctx = rootDeCuatroFamilias('rojo-ssb-feed');
  try {
    const abs = path.join(ctx.volDir('ssb'), 'tribes', messageFileName('%m3=.sha256'));
    const j = JSON.parse(fs.readFileSync(abs, 'utf8'));
    j.value.sequence = 7; // misma clave, otra posición de feed
    write(abs, j);
    resetVolumesCache();

    const rep = verifyRootIntegrity({ volumeIds: ['ssb'] });
    const errores = rep.findings.filter((f) => f.check === 'snapshot').map((f) => f.error);
    assert.ok(errores.includes('feed_desviado'), JSON.stringify(rep.findings));
    assert.ok(
      !errores.includes('cursor_desviado'),
      'premisa rota: el conjunto de claves también cambió, así que el eje de feed no se está probando solo'
    );
    assert.equal(arranca('ssb').arranca, false);
  } finally {
    ctx.restore();
  }
});

test('ROJO · un índice CON AGUJEROS no rinde verde: se declara en vez de contar lo inalcanzable', () => {
  // Doctrina propia de estas dos familias (D-B/D-F de U204, D-G de U205): un
  // cursor recomputado sobre un índice incompleto no prueba nada. Si un fichero
  // del volumen no rinde clave, el conjunto de claves puede seguir casando y el
  // tramo daría VERDE sobre un volumen que el driver declara no importable.
  const ctx = rootDeCuatroFamilias('agujero');
  try {
    write(path.join(ctx.volDir('firehose'), 'raw', 'b1', 'nota.txt'), 'material lateral\n');
    resetVolumesCache();
    const rep = verifyRootIntegrity({ volumeIds: ['firehose'] });
    const h = rep.findings.find((f) => f.check === 'snapshot');
    assert.ok(h, JSON.stringify(rep.findings));
    assert.equal(h.error, 'indice_con_agujero');
    assert.equal(h.kind, 'material_sin_clave');
    assert.equal(arranca('firehose').arranca, false);
  } finally {
    ctx.restore();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4 · LO QUE NO SE ROMPE — la tolerancia declarada
// ═══════════════════════════════════════════════════════════════════════════

test('TOLERANCIA · un alta FUERA del perímetro sellado sigue arrancando (copias locales)', () => {
  // `.gitignore` (WP-U108/A-15) permite a propósito copias locales no
  // rastreadas dentro de DISK_02/DISK_03 — `LINEAS/espana`, `forces/force-a..g`.
  // El snapshot cierra el perímetro de lo DECLARADO en el índice, no el del
  // directorio: si esto se pusiera rojo, cualquier operador con una copia local
  // se quedaría sin arranque por material que el repo declara no controlar.
  const ctx = rootDeCuatroFamilias('tolerancia');
  try {
    // LINEAS: una línea entera que `registry.yaml` NO declara.
    const src = path.join(ctx.volDir('lineas'), 'demo');
    copyTree(src, path.join(ctx.volDir('lineas'), 'espana'));
    // FORCES: una force que `registry.json` NO declara.
    copyTree(
      path.join(ctx.volDir('forces'), 'forces', 'force-sample'),
      path.join(ctx.volDir('forces'), 'forces', 'force-local')
    );
    resetVolumesCache();

    for (const id of ['lineas', 'forces']) {
      const r = arranca(id);
      assert.equal(
        r.arranca,
        true,
        `una copia local no declarada dejó a «${id}» sin arrancar: ${r.motivo}`
      );
    }
  } finally {
    ctx.restore();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 5 · OMISIONES HONESTAS Y MODO ESTRICTO
// ═══════════════════════════════════════════════════════════════════════════

test('un root sellado ANTES del contrato omite el tramo con motivo; strictSnapshot lo hace hallazgo', () => {
  const ctx = rootDeCuatroFamilias('anterior');
  try {
    // Se simula un root de la versión anterior: se le quita el snapshot y se
    // re-ancla el ledger, para AISLAR el tramo (si no, saltaría `sello_roto`).
    const abs = path.join(ctx.root, 'volumes.json');
    const cfg = JSON.parse(fs.readFileSync(abs, 'utf8'));
    delete cfg.volumes.lineas.source.imported.snapshot;
    fs.writeFileSync(abs, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
    const ledgerPath = path.join(ctx.root, '.ops-ledger.jsonl');
    const seats = fs
      .readFileSync(ledgerPath, 'utf8')
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l));
    seats[seats.length - 1].manifestSha256.after = sha256(fs.readFileSync(abs));
    fs.writeFileSync(ledgerPath, `${seats.map((s) => JSON.stringify(s)).join('\n')}\n`, 'utf8');
    // El estado se regenera al medir (D-45) y aquí sólo estorbaría con un
    // `estado_desfasado` que no es lo que se está probando.
    fs.rmSync(path.join(ctx.root, 'volumes.state.json'), { force: true });
    resetVolumesCache();

    const laxo = verifyRootIntegrity({ volumeIds: ['lineas'] });
    const om = laxo.skipped.find((s) => s.check === 'snapshot');
    assert.ok(om, JSON.stringify(laxo.skipped));
    assert.equal(om.reason, 'sin_snapshot_sellado');
    assert.equal(
      laxo.ok,
      true,
      `un root anterior al contrato no puede volverse no-arrancable de golpe: ${JSON.stringify(laxo.findings)}`
    );

    resetVolumesCache();
    const estricto = verifyRootIntegrity({ volumeIds: ['lineas'], strictSnapshot: true });
    assert.equal(estricto.ok, false);
    assert.ok(
      estricto.findings.some((f) => f.check === 'snapshot' && f.error === 'snapshot_no_sellado'),
      JSON.stringify(estricto.findings)
    );
  } finally {
    ctx.restore();
  }
});

test('NO-OP · un root sellado antes del contrato GANA el snapshot al reimportar; después SÍ es no-op', () => {
  // El defecto que esto cierra: el gate NO-OP se decidía sólo por `packHash`,
  // así que un root sellado por una versión anterior respondía «ya está
  // sellado» y NUNCA llegaba a anclar el snapshot — el tramo se quedaba en
  // «omitido honesto» para siempre. Es literalmente el caso del root de
  // referencia del monorepo, que por eso hubo que re-sellar en este WP.
  const ctx = rootDeCuatroFamilias('noop');
  try {
    // 1 · el MISMO pack sobre el root ya sellado (con snapshot) → no-op.
    const yaSellado = importPack({ packRoot: ctx.packRoot, role: 'operator' });
    assert.equal(yaSellado.ok, true, JSON.stringify(yaSellado));
    assert.equal(yaSellado.noop, true, 'la idempotencia del contrato se rompió');

    // 2 · se degrada el root a «versión anterior»: sin snapshot. El sello del
    // manifiesto cambia y el ledger se re-ancla para AISLAR lo que se prueba.
    const abs = path.join(ctx.root, 'volumes.json');
    const cfg = JSON.parse(fs.readFileSync(abs, 'utf8'));
    for (const id of Object.keys(VOL_REL)) delete cfg.volumes[id].source.imported.snapshot;
    fs.writeFileSync(abs, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
    const ledgerPath = path.join(ctx.root, '.ops-ledger.jsonl');
    const seats = fs
      .readFileSync(ledgerPath, 'utf8')
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l));
    seats[seats.length - 1].manifestSha256.after = sha256(fs.readFileSync(abs));
    fs.writeFileSync(ledgerPath, `${seats.map((s) => JSON.stringify(s)).join('\n')}\n`, 'utf8');
    resetVolumesCache();
    assert.equal(
      verifyRootIntegrity().skipped.filter((s) => s.check === 'snapshot').length,
      4,
      'premisa rota: el root degradado no quedó sin snapshot'
    );

    // 3 · el MISMO pack, mismo `packHash`: con la regla vieja sería no-op y el
    // root se quedaría sin snapshot. Con la condición de FORMA, re-sella.
    const reimport = importPack({ packRoot: ctx.packRoot, role: 'operator' });
    assert.equal(reimport.ok, true, JSON.stringify(reimport));
    assert.equal(
      reimport.noop,
      false,
      'el NO-OP tapó un root sin snapshot: el tramo se quedaría omitido para siempre'
    );
    assert.equal(reimport.steps.find((s) => s.step === 'fusionar')?.moved, 0, 'un re-sello movió datos');

    resetVolumesCache();
    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, true, JSON.stringify(rep.findings));
    assert.equal(rep.checks.filter((c) => c.check === 'snapshot' && c.ok).length, 4);

    // 4 · y vuelve a ser idempotente: la condición es de FORMA, no de VALOR.
    const tercero = importPack({ packRoot: ctx.packRoot, role: 'operator' });
    assert.equal(tercero.noop, true, 'el re-sello dejó de ser idempotente');
  } finally {
    ctx.restore();
  }
});

test('NO-OP · la condición es de FORMA, no de VALOR: un volumen CORROMPIDO no se blanquea reimportando', () => {
  // La vía que NO se tomó, y por qué. Comparar el snapshot sellado con el
  // recomputado habría abierto un blanqueo: un volumen corrompido dejaría de
  // ser no-op, el import correría y volvería a sellar la corrupción como
  // legítima. Con la condición de forma, un root corrompido sigue siendo
  // no-op ante el mismo pack — y su corrupción sigue siendo visible donde
  // tiene que serlo: en el verificador.
  const ctx = rootDeCuatroFamilias('sin-blanqueo');
  try {
    const src = path.join(ctx.volDir('lineas'), 'demo', 'nodos', 'N01', 'meta.json');
    const dst = path.join(ctx.volDir('lineas'), 'demo', 'nodos', 'N02', 'meta.json');
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    resetVolumesCache();
    assert.equal(arranca('lineas').arranca, false, 'premisa rota: el vector no corrompe');

    const otra = importPack({ packRoot: ctx.packRoot, role: 'operator' });
    assert.equal(otra.noop, true, 'el import re-selló un volumen corrompido: blanqueo');
    resetVolumesCache();
    assert.equal(arranca('lineas').arranca, false, 'la corrupción quedó blanqueada');
  } finally {
    ctx.restore();
  }
});

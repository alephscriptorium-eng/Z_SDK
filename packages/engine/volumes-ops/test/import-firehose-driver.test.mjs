/**
 * WP-U204 · Driver FIREHOSE sobre importPack — caché CRECIENTE:
 * UNIÓN ADITIVA POR CLAVE, jamás sobrescritura.
 *
 * Z-D9 (unidad/clave) probado aquí: la clave es el AT-URI DERIVADO
 * `at://<did>/<collection>/<rkey>`, no la ruta. Los casos que lo demuestran:
 * - mismo registro en OTRO batch → dedup, no duplica (la ruta habría fallado);
 * - mismo registro ya triado en OTRO corpus → no resucita en `raw`;
 * - mismo `rkey` con OTRO `did` (misma ruta, clave distinta) → `colision_ruta`
 *   que aborta (dedup por ruta habría PISADO un registro ajeno);
 * - unidad sin `uri` (formato jetstream crudo) → la clave se deriva igual.
 *
 * Fixture sintética con la forma que el productor del mundo escribe hoy
 * (`feed-kit/src/jetstream-sync.mjs` `writeJetstreamPost`:
 * `<corpus>/<batch>/<rkey>.json` con el payload jetstream crudo). El corpus
 * real (38 MB · 8.388 ficheros, censo `sincronia/notas/
 * NOTA-Z-2026-07-26-R7-matriz-migracion-y-loadstartpack.md:23`) vive fuera del
 * repo: la cota se demuestra por medida propia (test de escala, al final).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import {
  importPack,
  hashManifest,
  firehoseUnitKey,
  parseAtUri,
  recordVolumeSync
} from '../src/index.mjs';

const VOL_REL = 'DISK_01/FIREHOSE';
const CORPORA = ['raw', 'candidate', 'discarded', 'labeled'];
const COLLECTION = 'app.bsky.feed.post';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/**
 * Payload jetstream crudo, misma forma que SAMPLE_POSTS de feed-kit.
 * @param {{ did?: string, rkey: string, text?: string, withUri?: boolean }} o
 */
function post({
  did = 'did:plc:alpha',
  rkey,
  collection = COLLECTION,
  text = `post ${rkey}`,
  withUri = true,
  uri = null
}) {
  return {
    did,
    kind: 'commit',
    handle: `${String(did).split(':').pop()}.bsky.social`,
    ...(uri !== null ? { uri } : withUri ? { uri: `at://${did}/${collection}/${rkey}` } : {}),
    commit: {
      collection,
      rkey,
      record: { text, createdAt: '2026-07-31T00:00:00.000Z' }
    }
  };
}

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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u204-root-'));
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
 * Pack FIREHOSE sintético.
 * @param {{
 *   name?: string, version?: string,
 *   units?: { corpus?: string, batch?: string, name?: string, raw: object }[],
 *   triage?: object|null,
 *   declareFamily?: string|null,
 *   mutate?: (dataDir: string) => void
 * }} [opts]
 */
function buildFirehosePack(opts = {}) {
  const {
    name = 'pack-firehose-a',
    version = '1.0.0',
    units = [
      { raw: post({ rkey: 'u204a' }) },
      { raw: post({ rkey: 'u204b' }) }
    ],
    triage = null,
    declareFamily = null,
    mutate = null
  } = opts;

  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u204-pack-'));
  const dataDir = path.join(packRoot, 'volumes', ...VOL_REL.split('/'));
  for (const unit of units) {
    const corpus = unit.corpus || 'raw';
    const batch = unit.batch || 'jetstream';
    const file = `${unit.name || unit.raw.commit.rkey}.json`;
    const abs = path.join(dataDir, corpus, batch, file);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `${JSON.stringify(unit.raw, null, 2)}\n`, 'utf8');
  }
  if (triage) {
    fs.writeFileSync(
      path.join(dataDir, 'triage-manifest.json'),
      `${JSON.stringify(triage, null, 2)}\n`,
      'utf8'
    );
  }
  if (mutate) mutate(dataDir);

  const volumesDir = path.join(packRoot, 'volumes');
  /** @type {Record<string,string>} */
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
          firehose: {
            disk: 'DISK_01',
            path: VOL_REL,
            readonly: true,
            label: 'Firehose (pack sintetico U204)',
            ...(declareFamily ? { family: declareFamily } : {}),
            corpora: CORPORA.map((id) => ({ id, path: id, label: id }))
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

const manifestBytes = (root) => fs.readFileSync(path.join(root, 'volumes.json'), 'utf8');
const rootFile = (root, rel) =>
  path.join(root, VOL_REL.split('/').join(path.sep), rel.split('/').join(path.sep));
const noStagingLeft = (root) => fs.readdirSync(root).every((n) => !n.startsWith('.import-staging'));
const volumeFiles = (root) => collectFiles(path.join(root, VOL_REL.split('/').join(path.sep)));

// ── Z-D9: la clave, aislada ────────────────────────────────────────────────

test('Z-D9: la clave es el AT-URI DERIVADO — did+collection+rkey; sin `uri` funciona igual', () => {
  const withUri = post({ rkey: 'k1' });
  const withoutUri = post({ rkey: 'k1', withUri: false });
  assert.equal(firehoseUnitKey(withUri), 'at://did:plc:alpha/app.bsky.feed.post/k1');
  assert.equal(firehoseUnitKey(withoutUri), firehoseUnitKey(withUri));

  // Mismo rkey, otro did = OTRA clave (la ruta `<batch>/k1.json` sería la MISMA).
  assert.notEqual(firehoseUnitKey(post({ rkey: 'k1', did: 'did:plc:beta' })), firehoseUnitKey(withUri));

  // Sin material que rinda clave: null. Jamás se fabrica desde la ruta.
  assert.equal(firehoseUnitKey({ did: 'did:plc:alpha', commit: { collection: COLLECTION } }), null);
  assert.equal(firehoseUnitKey({ hola: 'mundo' }), null);
});

// ── CA-1 · import entero ───────────────────────────────────────────────────

test('CA-1: pack FIREHOSE importa entero — detect SIN fichero-firma, cursor sellado, corpora medidos', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildFirehosePack({
    units: [
      { raw: post({ rkey: 'u204a' }) },
      { raw: post({ rkey: 'u204b' }) },
      { corpus: 'candidate', batch: 'triaje-1', raw: post({ rkey: 'u204c' }) }
    ]
  });
  try {
    // El pack NO trae triage-manifest.json: la familia se detecta por el
    // CONTENIDO de lo que hay, no por un fichero-firma.
    assert.ok(!fs.existsSync(path.join(packRoot, 'volumes', ...VOL_REL.split('/'), 'triage-manifest.json')));

    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.ok(res.steps.some((s) => s.step === 'familia' && s.families.firehose === 'firehose'));

    for (const rel of [
      'raw/jetstream/u204a.json',
      'raw/jetstream/u204b.json',
      'candidate/triaje-1/u204c.json'
    ]) {
      assert.ok(fs.existsSync(rootFile(root, rel)), `falta ${rel}`);
    }

    const fam = res.families.find((f) => f.id === 'firehose');
    assert.equal(fam.family, 'firehose');
    assert.equal(fam.moved, 3);
    assert.equal(fam.dedup.length, 0);
    assert.equal(fam.divergences.length, 0);

    // Cursor sellado por importPack (el driver no sella).
    const cfg = JSON.parse(manifestBytes(root));
    assert.equal(cfg.volumes.firehose.family, 'firehose');
    const snapshot = cfg.volumes.firehose.source.imported.snapshot;
    assert.equal(snapshot.unit, 'at-uri');
    assert.equal(snapshot.units, 3);
    assert.match(snapshot.unitsSha256, /^[0-9a-f]{64}$/);

    // Corpora del manifiesto poblados con conteo medido (U199/U201).
    const byId = Object.fromEntries(cfg.volumes.firehose.corpora.map((c) => [c.id, c.files]));
    assert.equal(byId.raw, 2);
    assert.equal(byId.candidate, 1);
    assert.equal(byId.discarded, 0);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

// ── CA-2 · idempotencia incremental + unión aditiva ────────────────────────

test('CA-2: reimport del MISMO pack = no-op observable (sello idéntico, cero escrituras)', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildFirehosePack();
  try {
    const first = importPack({ packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    const bytesAfter = manifestBytes(root);
    const treeAfter = volumeFiles(root);

    const again = importPack({ packRoot, role: 'operator' });
    assert.equal(again.noop, true);
    assert.equal(again.manifestSha256, first.manifestSha256);
    assert.equal(manifestBytes(root), bytesAfter);
    assert.deepEqual(volumeFiles(root), treeAfter);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('CA-2: unión ADITIVA por clave — mismo registro en OTRO batch NO duplica; lo nuevo se suma', () => {
  const { root, restore } = setupRoot();
  const packA = buildFirehosePack();
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    const bytesA = fs.readFileSync(rootFile(root, 'raw/jetstream/u204a.json'));

    // Pack B: corrida de sync posterior. u204a y u204b VUELVEN (mismo
    // registro, batch distinto) + u204d nuevo. Dedup por RUTA los habría
    // duplicado; dedup por CLAVE los reconoce.
    const packB = buildFirehosePack({
      name: 'pack-firehose-b',
      version: '2.0.0',
      units: [
        { batch: 'jetstream-2', raw: post({ rkey: 'u204a' }) },
        { batch: 'jetstream-2', raw: post({ rkey: 'u204b' }) },
        { batch: 'jetstream-2', raw: post({ rkey: 'u204d' }) }
      ]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res.steps));

    const fam = res.families.find((f) => f.id === 'firehose');
    assert.equal(fam.moved, 1); // solo u204d
    assert.equal(fam.dedup.length, 2);
    assert.deepEqual(
      fam.dedup.map((d) => d.at).sort(),
      ['raw/jetstream/u204a.json', 'raw/jetstream/u204b.json']
    );

    // Aditivo: lo nuevo aterrizó; lo viejo sigue donde estaba, byte a byte;
    // el batch nuevo NO contiene copias de lo ya presente.
    assert.ok(fs.existsSync(rootFile(root, 'raw/jetstream-2/u204d.json')));
    assert.ok(!fs.existsSync(rootFile(root, 'raw/jetstream-2/u204a.json')));
    assert.ok(!fs.existsSync(rootFile(root, 'raw/jetstream-2/u204b.json')));
    assert.deepEqual(fs.readFileSync(rootFile(root, 'raw/jetstream/u204a.json')), bytesA);
    assert.equal(volumeFiles(root).length, 3);

    const cfg = JSON.parse(manifestBytes(root));
    assert.equal(cfg.volumes.firehose.source.imported.snapshot.units, 3);

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('CA-2: la clave es de VOLUMEN — un registro ya triado no resucita en `raw`', () => {
  const { root, restore } = setupRoot();
  const packA = buildFirehosePack({
    units: [{ corpus: 'labeled', batch: 'triaje-1', raw: post({ rkey: 'u204e' }) }]
  });
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    assert.ok(fs.existsSync(rootFile(root, 'labeled/triaje-1/u204e.json')));

    // El pack posterior lo trae otra vez como crudo: NO debe reaparecer en raw.
    const packB = buildFirehosePack({
      name: 'pack-firehose-triage',
      version: '2.0.0',
      units: [{ corpus: 'raw', batch: 'jetstream', raw: post({ rkey: 'u204e' }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res.steps));
    const fam = res.families.find((f) => f.id === 'firehose');
    assert.equal(fam.moved, 0);
    assert.deepEqual(fam.dedup.map((d) => d.at), ['labeled/triaje-1/u204e.json']);
    assert.ok(!fs.existsSync(rootFile(root, 'raw/jetstream/u204e.json')));
    assert.equal(volumeFiles(root).length, 1);

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('CA-2: unidad SIN `uri` (jetstream crudo) dedupe contra la que sí lo trae', () => {
  const { root, restore } = setupRoot();
  const packA = buildFirehosePack({ units: [{ raw: post({ rkey: 'u204f' }) }] });
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    const packB = buildFirehosePack({
      name: 'pack-firehose-sin-uri',
      version: '2.0.0',
      units: [{ batch: 'jetstream-2', raw: post({ rkey: 'u204f', withUri: false }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true);
    const fam = res.families.find((f) => f.id === 'firehose');
    assert.equal(fam.moved, 0);
    assert.equal(fam.dedup.length, 1);
    assert.equal(volumeFiles(root).length, 1);
    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

// ── ROJOS · sobrescritura imposible ────────────────────────────────────────

test('ROJO: misma RUTA con clave DISTINTA (otro did, mismo rkey) = colision_ruta que aborta', () => {
  const { root, restore } = setupRoot();
  const packA = buildFirehosePack({ units: [{ raw: post({ rkey: 'shared' }) }] });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    const bytesBefore = fs.readFileSync(rootFile(root, 'raw/jetstream/shared.json'));
    const manifestBefore = manifestBytes(root);

    // Otro repo (did) con el MISMO rkey → misma ruta, otro registro.
    const packB = buildFirehosePack({
      name: 'pack-firehose-colision',
      version: '2.0.0',
      units: [
        { raw: post({ rkey: 'nuevo-ok' }) },
        { raw: post({ rkey: 'shared', did: 'did:plc:beta' }) }
      ]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'colision_ruta');
    assert.equal(res.file, 'raw/jetstream/shared.json');
    assert.equal(res.key, 'at://did:plc:beta/app.bsky.feed.post/shared');
    assert.equal(res.destKey, 'at://did:plc:alpha/app.bsky.feed.post/shared');

    // Sin root a medias: el registro ajeno intacto byte a byte, lo nuevo no
    // aterrizó, sello idéntico, staging borrado.
    assert.deepEqual(fs.readFileSync(rootFile(root, 'raw/jetstream/shared.json')), bytesBefore);
    assert.ok(!fs.existsSync(rootFile(root, 'raw/jetstream/nuevo-ok.json')));
    assert.equal(manifestBytes(root), manifestBefore);
    assert.equal(hashManifest().sha256, first.manifestSha256);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('ROJO: fichero bajo corpus que no rinde clave = familia_invalida (VALIDAR, antes de fusionar)', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildFirehosePack({
    mutate(dataDir) {
      const abs = path.join(dataDir, 'raw', 'jetstream', 'no-es-post.json');
      fs.writeFileSync(abs, `${JSON.stringify({ hola: 'mundo' }, null, 2)}\n`, 'utf8');
    }
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    assert.match(JSON.stringify(res.results), /unidad_sin_clave/);
    assert.equal(manifestBytes(root), before);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_01')));
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('ROJO: clave duplicada DENTRO del pack = familia_invalida (no se deduplica en silencio)', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildFirehosePack({
    units: [
      { raw: post({ rkey: 'dup' }) },
      { batch: 'otro-batch', name: 'copia', raw: post({ rkey: 'dup' }) }
    ]
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    assert.match(JSON.stringify(res.results), /clave_duplicada_en_pack/);
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('ROJO: familia desconocida declarada = error ANTES de staging, root intacto', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildFirehosePack({ declareFamily: 'firehose-v2' });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'familia');
    assert.equal(res.error, 'familia_desconocida');
    assert.equal(res.family, 'firehose-v2');
    assert.ok(!res.steps.some((s) => s.step === 'staging'));
    assert.equal(manifestBytes(root), before);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_01')));
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

// ── PROBES PERMANENTES de la contrarrevisión (D1-D4) ──────────────────────
// Cada uno reproduce el vector exacto con el que la contrarrevisión tumbó una
// afirmación de cabecera. No son arreglos de una vez: se quedan.

/**
 * Terna INVÁLIDA: no rinde clave venga como venga el `uri`.
 *
 * Honestidad sobre lo que cada combinación aporta (medido por la
 * contrarrevisión inyectando la regresión de D-A sobre los 8 vectores): contra
 * el código actual **solo `uri` ajeno caza el defecto (8/8)**; las otras tres
 * salen por el `return null` de la terna ANTES de mirar `uri`, así que hoy
 * cazan 0/8. Se conservan porque FIJAN el contrato —si alguien reordena y la
 * corroboración pasa a evaluarse primero, siguen siendo las que hablan— pero
 * NO son cuatro ángulos: es uno efectivo y tres de fijación. El segundo ángulo
 * real es `assertCorroboracionRechaza`, con terna VÁLIDA.
 * @param {object} fields — { did?, collection?, rkey }
 * @param {string} etiqueta
 */
function assertTernaInvalidaSinClave(fields, etiqueta) {
  const sinUri = post({ ...fields, withUri: false });
  assert.equal(firehoseUnitKey(sinUri), null, `${etiqueta}: sin uri`);
  // (a) EL ángulo que caza: un `uri` ajeno que "arreglaría" el registro.
  assert.equal(
    firehoseUnitKey(post({ ...fields, uri: `at://did:plc:alpha/${COLLECTION}/r1` })),
    null,
    `${etiqueta}: con uri ajeno (no puede resucitar)`
  );
  // (b)/(c) fijación: uri auto-coherente (degenera en basura porque lleva el
  // componente inválido dentro) y uri basura.
  const propio = `at://${fields.did ?? 'did:plc:alpha'}/${fields.collection ?? COLLECTION}/${fields.rkey}`;
  assert.equal(firehoseUnitKey(post({ ...fields, uri: propio })), null, `${etiqueta}: con uri propio`);
  assert.equal(firehoseUnitKey(post({ ...fields, uri: 'no-soy-un-at-uri' })), null, `${etiqueta}: con uri basura`);
}

/**
 * Terna VÁLIDA + `uri` que no corrobora = sin clave. Éste es el segundo ángulo
 * real: es el único que EJECUTA la rama de corroboración.
 * @param {any} uri
 * @param {string} etiqueta
 */
function assertCorroboracionRechaza(uri, etiqueta) {
  assert.equal(firehoseUnitKey(post({ rkey: 'ok1', uri })), null, `corroboración: ${etiqueta}`);
}

test('D1: la clave es INYECTIVA — un `/` en cualquier componente NO rinde clave (ambas vías)', () => {
  // El vector: dos registros DISTINTOS que antes colapsaban en la misma clave
  // `at://did:plc:alpha/app.bsky.feed.post/x/y`.
  assertTernaInvalidaSinClave({ rkey: 'x/y' }, 'rkey con /');
  assertTernaInvalidaSinClave({ rkey: 'y', collection: `${COLLECTION}/x` }, 'collection con /');
  assertTernaInvalidaSinClave({ did: 'did:plc:al/pha', rkey: 'z' }, 'did con /');

  // Inyectividad por construcción: sin `/` en los componentes, la clave se
  // parte de forma única en exactamente 3 partes.
  const key = firehoseUnitKey(post({ rkey: 'z', withUri: false }));
  assert.deepEqual(key.slice('at://'.length).split('/'), [
    'did:plc:alpha',
    COLLECTION,
    'z'
  ]);
});

test('D-A: `uri` NO es vía alternativa — no resucita lo que la terna rechaza', () => {
  // El vector exacto de la 2.ª contrarrevisión: registro cuyo rkey es el
  // vector D1 y cuyo `uri` apunta a OTRO registro existente.
  const resucitador = {
    did: 'did:plc:alpha',
    uri: `at://did:plc:alpha/${COLLECTION}/r1`,
    kind: 'commit',
    commit: { collection: COLLECTION, rkey: 'x/y', record: { text: 'OTRO REGISTRO' } }
  };
  assert.equal(firehoseUnitKey(resucitador), null);

  // `uri` presente que DISCREPA de una terna válida = material incoherente.
  assert.equal(
    firehoseUnitKey(post({ rkey: 'r2', uri: `at://did:plc:alpha/${COLLECTION}/r1` })),
    null
  );
  // `uri` presente y coherente = corrobora, y la clave sigue siendo la derivada.
  assert.equal(
    firehoseUnitKey(post({ rkey: 'r2' })),
    `at://did:plc:alpha/${COLLECTION}/r2`
  );
  // `uri` ausente = la terna manda igual.
  assert.equal(
    firehoseUnitKey(post({ rkey: 'r2', withUri: false })),
    `at://did:plc:alpha/${COLLECTION}/r2`
  );
  // `uri` de tipo hostil = no corrobora = null (nunca excepción).
  // Segundo ángulo REAL (M2): terna VÁLIDA + `uri` que no corrobora. Es el
  // único camino que ejecuta la rama de corroboración.
  for (const uri of [
    42,
    {},
    [],
    true,
    'no-soy-un-at-uri',
    '../../etc/passwd',
    `at://did:plc:alpha/${COLLECTION}/r1`,
    `at://did:plc:alpha/${COLLECTION}/r1/extra`,
    `at://did:plc:beta/${COLLECTION}/ok1`
  ]) {
    assertCorroboracionRechaza(uri, JSON.stringify(uri));
  }

  // Consecuencia DECLARADA: sin `rkey` ya no se keya por `uri`.
  assert.equal(
    firehoseUnitKey({
      did: 'did:plc:alpha',
      uri: `at://did:plc:alpha/${COLLECTION}/r3`,
      commit: { collection: COLLECTION, record: { text: 'sin rkey' } }
    }),
    null
  );
});

test('M1: `uri` ausente es `null`/`undefined`/no-declarado — los tres corroboran igual', () => {
  const esperada = `at://did:plc:alpha/${COLLECTION}/m1`;
  // Convención JSON: null y undefined son AUSENCIA, no un `uri` que discrepa.
  assert.equal(firehoseUnitKey(post({ rkey: 'm1', uri: null })), esperada);
  assert.equal(firehoseUnitKey(post({ rkey: 'm1', uri: undefined })), esperada);
  assert.equal(firehoseUnitKey(post({ rkey: 'm1', withUri: false })), esperada);
  // Y con el campo presente y coherente, la misma clave (corrobora).
  assert.equal(firehoseUnitKey(post({ rkey: 'm1' })), esperada);
});

test('D-A: el resucitador no deduplica contra otro registro — importPack lo RECHAZA', () => {
  const { root, restore } = setupRoot();
  const packA = buildFirehosePack({ units: [{ raw: post({ rkey: 'r1' }) }] });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    const bytesR1 = fs.readFileSync(rootFile(root, 'raw/jetstream/r1.json'));
    const manifestBefore = manifestBytes(root);

    // Pack B: registro DISTINTO cuyo rkey es el vector D1 y cuyo `uri`
    // apunta al r1 que ya vive en el destino.
    const packB = buildFirehosePack({
      name: 'pack-firehose-resucitador',
      version: '2.0.0',
      units: [
        // Corpus sano (si TODAS las unidades fueran malformadas el volumen no
        // se detectaría firehose y caería al camino genérico de U201).
        { batch: 'jetstream-2', raw: post({ rkey: 'nuevo-sano' }) },
        {
          batch: 'jetstream-2',
          name: 'resucitador',
          raw: {
            did: 'did:plc:alpha',
            uri: `at://did:plc:alpha/${COLLECTION}/r1`,
            kind: 'commit',
            commit: { collection: COLLECTION, rkey: 'x/y', record: { text: 'OTRO REGISTRO' } }
          }
        }
      ]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });

    // Antes: ok:true · moved:0 · dedup contra r1 · disco sin cambios (descarte
    // silencioso). Ahora: rechazo explícito citando la ruta.
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    assert.match(JSON.stringify(res.results), /unidad_sin_clave: raw\/jetstream-2\/resucitador\.json/);

    assert.deepEqual(fs.readFileSync(rootFile(root, 'raw/jetstream/r1.json')), bytesR1);
    assert.equal(manifestBytes(root), manifestBefore);
    assert.ok(!fs.existsSync(rootFile(root, 'raw/jetstream-2')));
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('D1: el par ambiguo no se descarta en silencio — importPack lo RECHAZA', () => {
  const { root, restore } = setupRoot();
  // Vector real: corpus sano con DOS registros malformados que antes
  // colapsaban en la misma clave. Ninguno se descarta en silencio: ambos se
  // citan por ruta y el import entero aborta antes de fusionar.
  const packA = buildFirehosePack({
    units: [
      { raw: post({ rkey: 'sano' }) },
      { raw: post({ rkey: 'x/y', withUri: false }) },
      { raw: post({ rkey: 'y', collection: `${COLLECTION}/x`, withUri: false }) }
    ]
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.steps));
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    const dump = JSON.stringify(res.results);
    assert.match(dump, /unidad_sin_clave: raw\/jetstream\/x\/y\.json/);
    assert.match(dump, /unidad_sin_clave: raw\/jetstream\/y\.json/);
    // Y jamás `clave_duplicada_en_pack`: la ambigüedad ya no existe, así que
    // tampoco puede abortar un import legítimo con un duplicado falso.
    assert.doesNotMatch(dump, /clave_duplicada_en_pack/);
    assert.equal(manifestBytes(root), before);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_01')));
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('D1b: SIN trim — componentes con espacios se rechazan por AMBAS vías', () => {
  // El `trim()` retirado se había MUDADO al fallback: `rkey:'r1 '` sin uri daba
  // null y con uri daba clave. Las cuatro combinaciones deben dar null.
  assertTernaInvalidaSinClave({ did: '  did:plc:alpha  ', rkey: 'z' }, 'did con espacios');
  assertTernaInvalidaSinClave({ rkey: ' z ' }, 'rkey con espacios');
  assertTernaInvalidaSinClave({ rkey: 'r1 ' }, 'rkey con espacio final (vector D1b)');
  assertTernaInvalidaSinClave({ rkey: 'a\tb' }, 'rkey con tab');
  assertTernaInvalidaSinClave({ rkey: '' }, 'rkey vacio');
});

test('D1c: `parseAtUri` solo acepta AT-URI bien formado (y solo CORROBORA)', () => {
  assert.equal(parseAtUri('no-soy-un-at-uri'), null);
  assert.equal(parseAtUri('../../etc/passwd'), null);
  assert.equal(parseAtUri('at://solo/dos'), null);
  assert.equal(parseAtUri('at://a/b/c/d'), null);
  assert.equal(parseAtUri('at:// /b/c'), null);
  assert.equal(parseAtUri(42), null);
  assert.equal(parseAtUri(`at://did:plc:alpha/${COLLECTION}/z`), `at://did:plc:alpha/${COLLECTION}/z`);

  // Terna inservible: NINGÚN `uri` produce ya clave (D-A). Antes, el tercero
  // de estos rendía `at://did:plc:beta/…/z` y viajaba sellado como at-uri.
  for (const uri of ['no-soy-un-at-uri', '../../etc/passwd', `at://did:plc:beta/${COLLECTION}/z`]) {
    assert.equal(firehoseUnitKey(post({ did: 42, rkey: 'z', uri })), null, `uri=${uri}`);
  }
});

test('D2: fichero de raíz NO declarado = familia_invalida (la allowlist la ejerce el driver)', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildFirehosePack({
    mutate(dataDir) {
      fs.writeFileSync(path.join(dataDir, 'basura.txt'), 'ruido\n', 'utf8');
      fs.writeFileSync(path.join(dataDir, 'payload.html'), '<html></html>\n', 'utf8');
    }
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    const dump = JSON.stringify(res.results);
    assert.match(dump, /fichero_de_raiz_no_declarado: basura\.txt/);
    assert.match(dump, /fichero_de_raiz_no_declarado: payload\.html/);
    assert.equal(manifestBytes(root), before);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_01')));
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('D2: unidad plantada en la RAÍZ del pack = familia_invalida citando el corpus', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildFirehosePack({
    mutate(dataDir) {
      fs.writeFileSync(
        path.join(dataDir, 'fantasma.json'),
        `${JSON.stringify(post({ rkey: 'fantasma' }), null, 2)}\n`,
        'utf8'
      );
    }
  });
  try {
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'validar');
    assert.match(
      JSON.stringify(res.results),
      /fichero_de_raiz_no_declarado: fantasma\.json es una unidad FIREHOSE .*viven bajo un corpus/
    );
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('D2: unidad HEREDADA en la raíz del destino SÍ deduplica y SÍ cuenta', () => {
  const { root, restore } = setupRoot();
  const packA = buildFirehosePack({ units: [{ raw: post({ rkey: 'u1' }) }] });
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);

    // Material heredado (anterior a la regla de layout): una unidad en la raíz
    // del volumen destino. El índice del driver DEBE verla.
    const huerfano = rootFile(root, 'huerfano.json');
    fs.writeFileSync(huerfano, `${JSON.stringify(post({ rkey: 'u2' }), null, 2)}\n`, 'utf8');

    const packB = buildFirehosePack({
      name: 'pack-firehose-raiz',
      version: '2.0.0',
      units: [{ batch: 'jetstream-2', raw: post({ rkey: 'u2' }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res.steps));

    const fam = res.families.find((f) => f.id === 'firehose');
    assert.equal(fam.moved, 0, 'el registro ya vive en el volumen: no se duplica');
    assert.deepEqual(fam.dedup.map((d) => d.at), ['huerfano.json']);
    assert.ok(!fs.existsSync(rootFile(root, 'raw/jetstream-2/u2.json')));
    assert.equal(volumeFiles(root).length, 2);

    // snapshot.units cuadra con el disco y declara la anomalía de layout.
    const snapshot = JSON.parse(manifestBytes(root)).volumes.firehose.source.imported.snapshot;
    assert.equal(snapshot.units, 2);
    assert.equal(snapshot.destUnidadesEnRaiz, 1);

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('D3: ancestro que existe como FICHERO = fallo declarado, nunca excepción a medias', () => {
  const { root, restore } = setupRoot();
  const packA = buildFirehosePack({ units: [{ raw: post({ rkey: 'u1' }) }] });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    // `raw/zzz` existe como FICHERO en el destino; el pack trae `raw/zzz/y.json`.
    // El fichero es una unidad VÁLIDA sin extensión (material heredado
    // plausible): así el que caza es el guardián de ancestros y no el de
    // `destino_sin_clave`, que desde D-F cubre el otro caso.
    fs.writeFileSync(
      rootFile(root, 'raw/zzz'),
      `${JSON.stringify(post({ rkey: 'zzz-unidad' }), null, 2)}\n`,
      'utf8'
    );
    const manifestBefore = manifestBytes(root);
    const treeBefore = volumeFiles(root);

    const packB = buildFirehosePack({
      name: 'pack-firehose-bloqueado',
      version: '2.0.0',
      units: [{ corpus: 'raw', batch: 'zzz', raw: post({ rkey: 'y' }) }]
    });

    // No lanza: devuelve el contrato observable de fallo.
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'ruta_bloqueada_por_fichero');
    assert.equal(res.file, 'raw/zzz/y.json');
    assert.equal(res.blockedBy, 'raw/zzz');

    // Root intacto: sello, árbol y staging.
    assert.equal(manifestBytes(root), manifestBefore);
    assert.equal(hashManifest().sha256, first.manifestSha256);
    assert.deepEqual(volumeFiles(root), treeBefore);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('D-F: unidad del destino con la extensión en OTRA CAJA (u1.JSON) SÍ deduplica', () => {
  const { root, restore } = setupRoot();
  const packA = buildFirehosePack({ units: [{ raw: post({ rkey: 'u1' }) }] });
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    // Mismos bytes, unidad válida y legible: solo cambia la caja del nombre.
    fs.renameSync(rootFile(root, 'raw/jetstream/u1.json'), rootFile(root, 'raw/jetstream/u1.JSON'));

    // El pack la trae en OTRO batch (para aislar el índice de la comprobación
    // de ruta): sin el arreglo, el índice no la ve y la replanta.
    const packB = buildFirehosePack({
      name: 'pack-firehose-caja',
      version: '2.0.0',
      units: [
        { batch: 'jetstream-2', raw: post({ rkey: 'u1' }) },
        { batch: 'jetstream-2', raw: post({ rkey: 'u2' }) }
      ]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res.error ?? res.steps));

    const fam = res.families.find((f) => f.id === 'firehose');
    assert.equal(fam.moved, 1, 'solo u2 aterriza');
    assert.deepEqual(fam.dedup.map((d) => d.at), ['raw/jetstream/u1.JSON']);
    assert.ok(!fs.existsSync(rootFile(root, 'raw/jetstream-2/u1.json')));
    assert.equal(volumeFiles(root).length, 2, 'cero copias de mas');

    const snapshot = JSON.parse(manifestBytes(root)).volumes.firehose.source.imported.snapshot;
    assert.equal(snapshot.units, 2);
    assert.equal(snapshot.destSinClave, undefined, 'el campo-coartada ya no existe');

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('D-F: fichero del destino que no rinde clave = destino_sin_clave, aborta en dry', () => {
  const { root, restore } = setupRoot();
  const packA = buildFirehosePack({ units: [{ raw: post({ rkey: 'u1' }) }] });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);

    // (a) unidad con BOM UTF-8: JSON.parse la rechaza — en este mundo nadie
    // pela BOM, y un `Set-Content` de PowerShell basta para producirlo;
    // (b) nota suelta dentro de un corpus.
    fs.writeFileSync(
      rootFile(root, 'raw/jetstream/con-bom.json'),
      `\uFEFF${JSON.stringify(post({ rkey: 'con-bom' }), null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(rootFile(root, 'raw/jetstream/nota.md'), '# nota suelta\n', 'utf8');

    const manifestBefore = manifestBytes(root);
    const sealBefore = hashManifest().sha256;
    const treeBefore = volumeFiles(root);

    const packB = buildFirehosePack({
      name: 'pack-firehose-sin-clave-destino',
      version: '2.0.0',
      units: [
        { batch: 'jetstream-2', raw: post({ rkey: 'con-bom' }) },
        { batch: 'jetstream-2', raw: post({ rkey: 'u9' }) }
      ]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });

    // Antes: ok:true, con-bom REPLANTADO (duplicado irreversible) y el campo
    // `destSinClave` como coartada. Ahora: aborta antes de mover y de sellar.
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'destino_sin_clave');
    assert.deepEqual(res.files.sort(), ['raw/jetstream/con-bom.json', 'raw/jetstream/nota.md']);
    assert.ok(!res.steps.some((s) => s.step === 'sellar'), 'no se llegó a SELLAR');

    assert.equal(manifestBytes(root), manifestBefore);
    assert.equal(hashManifest().sha256, sealBefore);
    assert.deepEqual(volumeFiles(root), treeBefore);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('D-B: enlace en el DESTINO = aborto en el pase dry, ANTES de sellar', (t) => {
  const { root, restore } = setupRoot();
  const packA = buildFirehosePack({ units: [{ raw: post({ rkey: 'u1' }) }] });
  let planted = false;
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);

    // Un corpus enlazado a otro disco (operación normal en Windows) con una
    // unidad viviendo detrás: `readdirSync` no lo sigue, así que el índice por
    // clave tendría un agujero y u2 se duplicaría.
    const fuera = path.join(root, 'fuera-del-volumen');
    fs.mkdirSync(fuera, { recursive: true });
    fs.writeFileSync(
      path.join(fuera, 'u2.json'),
      `${JSON.stringify(post({ rkey: 'u2' }), null, 2)}\n`,
      'utf8'
    );
    try {
      fs.symlinkSync(fuera, rootFile(root, 'raw/enlazado'), 'junction');
      planted = true;
    } catch {
      planted = false;
    }
    if (!planted) {
      // M3: abstenerse es `skip`, no `ok`. Un verde silencioso ES fingir.
      t.skip('el entorno no permite plantar junctions');
      return;
    }

    const manifestBefore = manifestBytes(root);
    const sealBefore = hashManifest().sha256;

    const packB = buildFirehosePack({
      name: 'pack-firehose-enlace',
      version: '2.0.0',
      units: [{ batch: 'jetstream-2', raw: post({ rkey: 'u2' }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });

    // Antes: moved:1 (duplicado en disco), manifiesto RESELLADO y luego
    // ok:false en no-link — irreversible. Ahora: aborta antes de tocar nada.
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'enlace_en_destino');
    assert.ok(res.links.includes('raw/enlazado'), JSON.stringify(res.links));
    assert.ok(!res.steps.some((s) => s.step === 'sellar'), 'no se llegó a SELLAR');

    assert.equal(manifestBytes(root), manifestBefore);
    assert.equal(hashManifest().sha256, sealBefore);
    assert.ok(!fs.existsSync(rootFile(root, 'raw/jetstream-2/u2.json')));
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    if (planted) {
      try {
        fs.unlinkSync(rootFile(root, 'raw/enlazado'));
      } catch {
        /* limpieza best-effort */
      }
    }
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('D-E: el guardián `unidad_en_raiz` SÍ es alcanzable (la allowlist es por nombre)', () => {
  const { root, restore } = setupRoot();
  // `triage-manifest.json` cuyo PAYLOAD es una unidad: pasa la allowlist (por
  // nombre) y el schema real (permisivo), y aborta un paso más tarde.
  const { packRoot } = buildFirehosePack({
    units: [{ raw: post({ rkey: 'u1' }) }],
    triage: post({ rkey: 'disfrazado' })
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'unidad_en_raiz');
    assert.equal(res.file, 'triage-manifest.json');
    assert.equal(res.key, `at://did:plc:alpha/${COLLECTION}/disfrazado`);
    // Falla cerrado: root intacto, sin staging.
    assert.equal(manifestBytes(root), before);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_01')));
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('D4: recordVolumeSync es fallo CERRADO — ni inventa manifiesto ni inventa entrada', () => {
  const { root, restore } = setupRoot();
  try {
    // (a) manifiesto presente que NO declara el volumen → aborta sin escribir.
    assert.throws(() => recordVolumeSync('firehose'), /Unknown volume id: firehose/);
    assert.ok(!fs.existsSync(path.join(root, 'volumes.state.json')));

    // (b) root sin manifiesto → no operable, aborta antes de nada.
    fs.rmSync(path.join(root, 'volumes.json'));
    resetVolumesCache();
    assert.throws(() => recordVolumeSync('firehose'), /not operable|not found/i);
    assert.ok(!fs.existsSync(path.join(root, 'volumes.state.json')));
  } finally {
    restore();
  }
});

// ── Índice de triage: sidecar de raíz, divergencia reportada ──────────────

test('índice: triage-manifest.json aterriza si falta; distinto = divergencia reportada, JAMÁS pisado', () => {
  const { root, restore } = setupRoot();
  const packA = buildFirehosePack({
    triage: { timestamp: '2026-07-31T00:00:00.000Z', source: 'jetstream', counts: { raw: 2 } }
  });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true, JSON.stringify(first));
    const triagePath = rootFile(root, 'triage-manifest.json');
    assert.ok(fs.existsSync(triagePath));
    const triageBefore = fs.readFileSync(triagePath);

    // Pack posterior con OTRO triage: el del destino es decisión local viva.
    const packB = buildFirehosePack({
      name: 'pack-firehose-triage-b',
      version: '2.0.0',
      units: [{ batch: 'jetstream-2', raw: post({ rkey: 'u204g' }) }],
      triage: { timestamp: '2026-08-01T00:00:00.000Z', source: 'jetstream', counts: { raw: 99 } }
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res.steps));
    const fam = res.families.find((f) => f.id === 'firehose');
    assert.deepEqual(
      fam.divergences.map((d) => ({ path: d.path, kind: d.kind })),
      [{ path: 'triage-manifest.json', kind: 'contenido_distinto' }]
    );
    assert.deepEqual(fs.readFileSync(triagePath), triageBefore);
    assert.ok(fs.existsSync(rootFile(root, 'raw/jetstream-2/u204g.json')));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('índice: triage-manifest.json roto = familia_invalida por el schema REAL de linea-kit (U80)', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildFirehosePack({ triage: { timestamp: 12345 } });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    assert.match(JSON.stringify(res.results), /triage-manifest/);
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

// ── Cota realista ─────────────────────────────────────────────────────────

test('cota: import incremental a escala (ZEUS_U204_SCALE, por defecto 1200 unidades)', () => {
  const total = Number(process.env.ZEUS_U204_SCALE || 1200);
  const { root, restore } = setupRoot();
  const mk = (from, to, batch) =>
    Array.from({ length: to - from }, (_, i) => ({
      batch,
      raw: post({ rkey: `esc${String(from + i).padStart(6, '0')}`, text: `escala ${from + i}` })
    }));

  // Pack A: el 60% del censo. Pack B: el 100% (solapa el 60% + añade el 40%).
  const cut = Math.floor(total * 0.6);
  const packA = buildFirehosePack({ name: 'pack-escala-a', units: mk(0, cut, 'lote-1') });
  const packB = buildFirehosePack({
    name: 'pack-escala-b',
    version: '2.0.0',
    units: [...mk(0, cut, 'lote-2'), ...mk(cut, total, 'lote-2')]
  });
  try {
    const t0 = Date.now();
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    const tA = Date.now() - t0;
    assert.equal(first.ok, true, JSON.stringify(first.error));

    const t1 = Date.now();
    const second = importPack({ packRoot: packB.packRoot, role: 'operator' });
    const tB = Date.now() - t1;
    assert.equal(second.ok, true, JSON.stringify(second.error));

    const fam = second.families.find((f) => f.id === 'firehose');
    assert.equal(fam.dedup.length, cut, 'el solape se deduplica por clave');
    assert.equal(fam.moved, total - cut, 'solo lo nuevo aterriza');
    assert.equal(volumeFiles(root).length, total, 'unión aditiva: ni una copia de más');

    const cfg = JSON.parse(manifestBytes(root));
    assert.equal(cfg.volumes.firehose.source.imported.snapshot.units, total);

    // Tercer pase: reimport de B = no-op por packHash (idempotencia estable).
    const third = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(third.noop, true);
    assert.equal(third.manifestSha256, second.manifestSha256);

    console.log(
      `[U204·cota] unidades=${total} · import A (${cut} nuevas)=${tA}ms · ` +
        `import B (${cut} dedup + ${total - cut} nuevas)=${tB}ms`
    );
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  }
});

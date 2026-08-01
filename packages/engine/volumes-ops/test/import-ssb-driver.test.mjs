/**
 * WP-U205 · Driver SSB sobre importPack — UNIÓN ADITIVA POR CLAVE con
 * POSICIÓN DE FEED INMUTABLE.
 *
 * Z-D10 (unidad/clave) probado aquí: la clave es la cadena OPACA `key` del
 * mensaje, y la ruta se DERIVA de ella (`<corpus>/base64url(key).json`, que es
 * literalmente lo que busca `loadSsbMessage`). Los casos que lo demuestran:
 * - la misma clave en OTRO corpus → dedup, no duplica (CA-3, la central);
 * - la misma clave con `value` DISTINTO → aborta (no hay dedup que mienta);
 * - dos ficheros del pack con la misma clave → aborta en VALIDAR (CA-8);
 * - un fichero cuyo nombre no deriva de su clave → aborta: sería material
 *   inalcanzable para el lector.
 *
 * Fixtures sintéticas con la forma que el exportador del mundo escribe hoy
 * (`ssb-system/src/export.mjs`: `<corpus>/<base64url(key)>.json` con payload
 * `{key, value, type, corpus}`). No existe constructor de packs SSB en el
 * repo: se construyen a mano aquí.
 *
 * NOTA DE ALCANCE, medida y declarada: NO se exige contigüidad de secuencias.
 * El exportador filtra por tipo, así que un feed real aterriza con agujeros
 * (ver test «hueco»). Lo que sí es inviolable es la POSICIÓN: una
 * `(author, sequence)` aterrizada jamás se reescribe.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import { importPack, hashManifest, FIREHOSE_DRIVER, detectVolumeFamily } from '../src/index.mjs';
import {
  SSB_DRIVER,
  SSB_FAMILY,
  SSB_CORPUS_DIRS,
  SSB_ROOT_FILES,
  messageFileName,
  ssbMessageKey,
  ssbFeedCoords,
  stableStringify
} from '../src/driver-ssb.mjs';

const VOL_REL = 'DISK_04/SSB';
const CORPORA = ['tribes', 'parliament', 'votes'];
const ALICE = '@alice.ed25519';
const BOB = '@bob.ed25519';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/**
 * Mensaje SSB crudo, misma forma que la fixture del paquete.
 * @param {{ key: string, author?: string, sequence?: number, previous?: string|null,
 *   type?: string, body?: object }} o
 */
function msg({
  key,
  author = ALICE,
  sequence = 1,
  previous = null,
  type = 'tribe',
  body = {}
}) {
  return {
    key,
    value: {
      previous,
      author,
      sequence,
      timestamp: 1730000000000 + sequence,
      hash: 'sha256',
      content: { type, ...body },
      signature: 'fixture'
    }
  };
}

/** Fichero aterrizado tal y como lo escribe el exportador. */
function landed(m, corpus) {
  return {
    key: m.key,
    value: m.value,
    type: typeof m.value.content?.type === 'string' ? m.value.content.type : 'unknown',
    corpus
  };
}

function collectFiles(dir, rel = '') {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...collectFiles(path.join(dir, entry.name), childRel));
    else if (entry.isFile()) out.push(childRel);
  }
  return out.sort();
}

function setupRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u205-root-'));
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

/** Sidecar `ssb-manifest` válido contra el schema REAL de linea-kit. */
function ssbManifest(over = {}) {
  return {
    schema: 'ssb-manifest',
    version: 1,
    volume: 'ssb',
    disk: 'DISK_04',
    path: VOL_REL,
    syncedAt: '2026-07-31T00:00:00.000Z',
    corpora: CORPORA.map((id) => ({ id, path: id, label: id })),
    ...over
  };
}

/**
 * Pack SSB sintético.
 * @param {{
 *   name?: string, version?: string,
 *   units?: { corpus?: string, name?: string, msg: object }[],
 *   manifest?: object|null,
 *   declareFamily?: string|null,
 *   mutate?: (dataDir: string) => void
 * }} [opts]
 */
function buildSsbPack(opts = {}) {
  const {
    name = 'pack-ssb-a',
    version = '1.0.0',
    units = [{ msg: msg({ key: '%u205a=.sha256' }) }],
    manifest = null,
    declareFamily = null,
    mutate = null
  } = opts;

  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u205-pack-'));
  const dataDir = path.join(packRoot, 'volumes', ...VOL_REL.split('/'));
  for (const unit of units) {
    const corpus = unit.corpus || 'tribes';
    const file = unit.name || messageFileName(unit.msg.key);
    const abs = path.join(dataDir, corpus, file);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(landed(unit.msg, corpus), null, 2), 'utf8');
  }
  if (manifest) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(
      path.join(dataDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
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
          ssb: {
            disk: 'DISK_04',
            path: VOL_REL,
            readonly: true,
            label: 'SSB (pack sintetico U205)',
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
const unitRel = (corpus, key) => `${corpus}/${messageFileName(key)}`;

// ── Z-D10: la clave, aislada ───────────────────────────────────────────────

test('Z-D10: la clave es `key` VERBATIM y la ruta se DERIVA de ella (base64url sin `/` ni `.`)', () => {
  const m = msg({ key: '%tribeCreate001=.sha256' });
  assert.equal(ssbMessageKey(landed(m, 'tribes')), '%tribeCreate001=.sha256');

  // Inyectividad: base64url sobre bytes utf8. Dos claves distintas, dos nombres
  // distintos; y el alfabeto no trae separador de ruta ni punto interior.
  const a = messageFileName('%a=.sha256');
  const b = messageFileName('%b=.sha256');
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]+\.json$/);
  assert.equal(
    Buffer.from(a.replace(/\.json$/, ''), 'base64url').toString('utf8'),
    '%a=.sha256'
  );
  // Clave hostil: no hay travesía de rutas posible.
  assert.match(messageFileName('../../etc/passwd'), /^[A-Za-z0-9_-]+\.json$/);

  // Sin material que rinda clave: null. Jamás se fabrica desde la ruta.
  assert.equal(ssbMessageKey({ key: '', value: {} }), null);
  assert.equal(ssbMessageKey({ key: '%k', value: null }), null);
  assert.equal(ssbMessageKey({ value: { author: ALICE } }), null);
  assert.equal(ssbMessageKey([{ key: '%k', value: {} }]), null);
  assert.equal(ssbMessageKey('%k'), null);
});

test('Z-D10: la coordenada de feed exige author + sequence usables; `previous` ausente = null', () => {
  const ok = ssbFeedCoords(landed(msg({ key: '%k', author: BOB, sequence: 4, previous: '%j' }), 'tribes'));
  assert.deepEqual(ok, { author: BOB, sequence: 4, previous: '%j' });

  assert.equal(ssbFeedCoords({ value: { author: BOB } }), null); // sin sequence
  assert.equal(ssbFeedCoords({ value: { author: '', sequence: 1 } }), null);
  assert.equal(ssbFeedCoords({ value: { author: BOB, sequence: 0 } }), null);
  assert.equal(ssbFeedCoords({ value: { author: BOB, sequence: 1.5 } }), null);
  assert.equal(ssbFeedCoords({ value: { author: BOB, sequence: 2, previous: 42 } }), null);
  assert.deepEqual(ssbFeedCoords({ value: { author: BOB, sequence: 1 } }), {
    author: BOB,
    sequence: 1,
    previous: null
  });
});

test('Z-D10: `stableStringify` compara VALUE, no bytes — mismo mensaje en otro corpus es el mismo mensaje', () => {
  const m = msg({ key: '%same=.sha256' });
  const enTribes = landed(m, 'tribes');
  const enVotes = landed(m, 'votes');
  assert.notEqual(JSON.stringify(enTribes), JSON.stringify(enVotes)); // los BYTES difieren
  assert.equal(stableStringify(enTribes.value), stableStringify(enVotes.value)); // el MENSAJE no
  // Y el orden de claves no cambia el resumen.
  assert.equal(stableStringify({ a: 1, b: 2 }), stableStringify({ b: 2, a: 1 }));
});

// ── CA-1 · import entero + extensión del feed ──────────────────────────────

test('CA-1: pack SSB importa entero — detect SIN fichero-firma, cursor sellado, corpora medidos', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildSsbPack({
    units: [
      { corpus: 'tribes', msg: msg({ key: '%a1=.sha256', sequence: 1 }) },
      {
        corpus: 'tribes',
        msg: msg({ key: '%a2=.sha256', sequence: 2, previous: '%a1=.sha256', type: 'tribe-open-invite' })
      },
      {
        corpus: 'parliament',
        msg: msg({ key: '%a3=.sha256', sequence: 3, previous: '%a2=.sha256', type: 'parliamentTerm' })
      }
    ]
  });
  try {
    // El pack NO trae `manifest.json`: la familia se detecta por el CONTENIDO.
    assert.ok(!fs.existsSync(path.join(packRoot, 'volumes', ...VOL_REL.split('/'), 'manifest.json')));

    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.ok(res.steps.some((s) => s.step === 'familia' && s.families.ssb === 'ssb'));

    for (const rel of [
      unitRel('tribes', '%a1=.sha256'),
      unitRel('tribes', '%a2=.sha256'),
      unitRel('parliament', '%a3=.sha256')
    ]) {
      assert.ok(fs.existsSync(rootFile(root, rel)), `falta ${rel}`);
    }

    const fam = res.families.find((f) => f.id === 'ssb');
    assert.equal(fam.family, 'ssb');
    assert.equal(fam.moved, 3);
    assert.equal(fam.dedup.length, 0);
    assert.equal(fam.divergences.length, 0);

    const cfg = JSON.parse(manifestBytes(root));
    assert.equal(cfg.volumes.ssb.family, 'ssb');
    const snapshot = cfg.volumes.ssb.source.imported.snapshot;
    assert.equal(snapshot.unit, 'ssb-key');
    assert.equal(snapshot.units, 3);
    assert.equal(snapshot.feeds, 1);
    assert.match(snapshot.unitsSha256, /^[0-9a-f]{64}$/);
    assert.match(snapshot.feedsSha256, /^[0-9a-f]{64}$/);
    assert.equal(snapshot.feedsConHueco, undefined, 'alice 1..3 no tiene agujeros');

    const byId = Object.fromEntries(cfg.volumes.ssb.corpora.map((c) => [c.id, c.files]));
    assert.equal(byId.tribes, 2);
    assert.equal(byId.parliament, 1);
    assert.equal(byId.votes, 0);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('CA-1: el feed se EXTIENDE — pack A seq 1..3 + pack B seq 4..5 = 5 unidades, moves de B = 2', () => {
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({
    units: [
      { msg: msg({ key: '%a1=.sha256', sequence: 1 }) },
      { msg: msg({ key: '%a2=.sha256', sequence: 2, previous: '%a1=.sha256' }) },
      { msg: msg({ key: '%a3=.sha256', sequence: 3, previous: '%a2=.sha256' }) }
    ]
  });
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    const bytesA1 = fs.readFileSync(rootFile(root, unitRel('tribes', '%a1=.sha256')));

    const packB = buildSsbPack({
      name: 'pack-ssb-b',
      version: '2.0.0',
      units: [
        { msg: msg({ key: '%a4=.sha256', sequence: 4, previous: '%a3=.sha256' }) },
        { msg: msg({ key: '%a5=.sha256', sequence: 5, previous: '%a4=.sha256' }) }
      ]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res));

    const fam = res.families.find((f) => f.id === 'ssb');
    assert.equal(fam.moved, 2);
    assert.equal(fam.dedup.length, 0);
    assert.equal(volumeFiles(root).length, 5);
    assert.deepEqual(fs.readFileSync(rootFile(root, unitRel('tribes', '%a1=.sha256'))), bytesA1);

    const snapshot = JSON.parse(manifestBytes(root)).volumes.ssb.source.imported.snapshot;
    assert.equal(snapshot.units, 5);
    assert.equal(snapshot.feeds, 1);
    assert.equal(snapshot.feedsConHueco, undefined);

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('ROJO CA-1: la POSICIÓN de feed es inmutable — seq 3 con otro contenido = reescritura_de_feed', () => {
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({
    units: [
      { msg: msg({ key: '%a1=.sha256', sequence: 1 }) },
      { msg: msg({ key: '%a2=.sha256', sequence: 2, previous: '%a1=.sha256' }) },
      { msg: msg({ key: '%a3=.sha256', sequence: 3, previous: '%a2=.sha256' }) }
    ]
  });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    const manifestBefore = manifestBytes(root);
    const treeBefore = volumeFiles(root);
    const bytesA3 = fs.readFileSync(rootFile(root, unitRel('tribes', '%a3=.sha256')));

    // Otro mensaje (otra clave, otro contenido) reclamando la seq 3 de alice:
    // bifurcación del feed. Sin esta guarda aterrizaría en silencio, porque la
    // clave es nueva y la ruta también.
    const packB = buildSsbPack({
      name: 'pack-ssb-fork',
      version: '2.0.0',
      units: [
        {
          msg: msg({
            key: '%a3-bis=.sha256',
            sequence: 3,
            previous: '%a2=.sha256',
            body: { title: 'historia reescrita' }
          })
        }
      ]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'reescritura_de_feed');
    assert.equal(res.author, ALICE);
    assert.equal(res.sequence, 3);
    assert.equal(res.key, '%a3-bis=.sha256');
    assert.equal(res.destKey, '%a3=.sha256');
    assert.ok(!res.steps.some((s) => s.step === 'sellar'), 'no se llegó a SELLAR');

    // Root intacto: sello, bytes y árbol.
    assert.equal(manifestBytes(root), manifestBefore);
    assert.equal(hashManifest().sha256, first.manifestSha256);
    assert.deepEqual(volumeFiles(root), treeBefore);
    assert.deepEqual(fs.readFileSync(rootFile(root, unitRel('tribes', '%a3=.sha256'))), bytesA3);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('DECISIÓN DECLARADA: un HUECO de secuencia NO es error — el exportador filtra por tipo', () => {
  // El brief proponía como rojo «@a seq 7 sobre un volumen que llega a 5».
  // No se implementa así, y la razón es medible: el exportador solo aterriza
  // tribe*/parliament*/votes*, luego un feed que mezcle gobernanza y charla
  // aterriza con agujeros por construcción. Rechazarlos volvería NO IMPORTABLE
  // todo export real. Se ACEPTAN y se DECLARAN en el snapshot.
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({ units: [{ msg: msg({ key: '%a1=.sha256', sequence: 1 }) }] });
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    const packB = buildSsbPack({
      name: 'pack-ssb-hueco',
      version: '2.0.0',
      // seq 7; el `previous` nombra la seq 6, que el exportador filtró y por
      // tanto no vive en el volumen: no verificable, no se inventa nada.
      units: [{ msg: msg({ key: '%a7=.sha256', sequence: 7, previous: '%a6-filtrada=.sha256' }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res.error ?? res.steps));

    const snapshot = JSON.parse(manifestBytes(root)).volumes.ssb.source.imported.snapshot;
    assert.equal(snapshot.units, 2);
    assert.equal(snapshot.feeds, 1);
    assert.equal(snapshot.feedsConHueco, 1, 'el agujero se DECLARA, no se calla');

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

// ── CA-2 · reimport no reordena ────────────────────────────────────────────

test('CA-2: reimport del MISMO pack = no-op observable (sello idéntico, árbol idéntico)', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildSsbPack({ declareFamily: SSB_FAMILY });
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

test('CA-2: otro packHash con el MISMO contenido no reordena nada — listado y mtimes intactos', () => {
  const { root, restore } = setupRoot();
  const units = [
    { corpus: 'tribes', msg: msg({ key: '%r1=.sha256', sequence: 1 }) },
    {
      corpus: 'parliament',
      msg: msg({ key: '%r2=.sha256', sequence: 2, previous: '%r1=.sha256', type: 'parliamentTerm' })
    }
  ];
  // `family:'ssb'` DECLARADA: sin ella el volumen podría irse por el camino
  // genérico de U201 y el test no mediría a U205.
  const packA = buildSsbPack({ units, declareFamily: SSB_FAMILY });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    assert.ok(first.steps.some((s) => s.step === 'familia' && s.families.ssb === 'ssb'));

    const before = volumeFiles(root).map((rel) => ({
      rel,
      mtimeMs: fs.statSync(rootFile(root, rel)).mtimeMs,
      bytes: fs.readFileSync(rootFile(root, rel)).toString('hex')
    }));

    // Mismo contenido, OTRO packHash (otro nombre/versión): no es no-op, entra
    // hasta FUSIONAR y debe deduplicarlo todo.
    const packB = buildSsbPack({
      name: 'pack-ssb-rehash',
      version: '9.9.9',
      units,
      declareFamily: SSB_FAMILY
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.notEqual(res.packHash, first.packHash);

    const fam = res.families.find((f) => f.id === 'ssb');
    assert.equal(fam.moved, 0, 'nada nuevo que mover');
    assert.equal(fam.dedup.length, 2);

    const after = volumeFiles(root).map((rel) => ({
      rel,
      mtimeMs: fs.statSync(rootFile(root, rel)).mtimeMs,
      bytes: fs.readFileSync(rootFile(root, rel)).toString('hex')
    }));
    assert.deepEqual(after, before, 'ni un byte ni un mtime se movieron');

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

// ── CA-3 · dedup CROSS-CORPUS (la central) ─────────────────────────────────

test('CA-3: la clave es de VOLUMEN — la misma clave bajo OTRO corpus deduplica, no duplica', () => {
  const { root, restore } = setupRoot();
  const compartido = msg({ key: '%K=.sha256', sequence: 1, type: 'parliamentTerm' });
  // K vive en `parliament` del destino…
  const packA = buildSsbPack({ units: [{ corpus: 'parliament', msg: compartido }] });
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    const relK = unitRel('parliament', '%K=.sha256');
    assert.ok(fs.existsSync(rootFile(root, relK)));
    const bytesK = fs.readFileSync(rootFile(root, relK));

    // …y el pack la trae bajo `tribes` (mapeo anterior de CORPUS_BY_TYPE, que
    // es forward-compatible por diseño). El lector resuelve cross-corpus
    // (loader.mjs:133-139): plantarla de nuevo daría DOS mensajes para una
    // clave, con resolución dependiente del orden de SSB_CORPORA.
    const packB = buildSsbPack({
      name: 'pack-ssb-cross',
      version: '2.0.0',
      units: [
        { corpus: 'tribes', msg: compartido },
        { corpus: 'tribes', msg: msg({ key: '%nuevo=.sha256', author: BOB, sequence: 1 }) }
      ]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res));

    const fam = res.families.find((f) => f.id === 'ssb');
    assert.equal(fam.moved, 1, 'solo el mensaje nuevo aterriza');
    assert.deepEqual(
      fam.dedup.map((d) => ({ path: d.path, key: d.key, at: d.at })),
      [{ path: unitRel('tribes', '%K=.sha256'), key: '%K=.sha256', at: relK }]
    );

    // Destino intacto byte a byte y sin copia en `tribes`.
    assert.deepEqual(fs.readFileSync(rootFile(root, relK)), bytesK);
    assert.ok(!fs.existsSync(rootFile(root, unitRel('tribes', '%K=.sha256'))));
    // CONTEO de unidades aseverado, no solo la ausencia de error.
    assert.equal(volumeFiles(root).length, 2);
    const snapshot = JSON.parse(manifestBytes(root)).volumes.ssb.source.imported.snapshot;
    assert.equal(snapshot.units, 2);
    assert.equal(snapshot.feeds, 2);

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('ROJO CA-3: misma clave con `value` DISTINTO = clave_divergente (jamás un dedup que mienta)', () => {
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({ units: [{ msg: msg({ key: '%K=.sha256', sequence: 1 }) }] });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    const bytesK = fs.readFileSync(rootFile(root, unitRel('tribes', '%K=.sha256')));
    const manifestBefore = manifestBytes(root);

    const packB = buildSsbPack({
      name: 'pack-ssb-divergente',
      version: '2.0.0',
      units: [
        { msg: msg({ key: '%otro=.sha256', author: BOB, sequence: 1 }) },
        { msg: msg({ key: '%K=.sha256', sequence: 1, body: { title: 'OTRO MENSAJE' } }) }
      ]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'clave_divergente');
    assert.equal(res.key, '%K=.sha256');
    assert.equal(res.at, unitRel('tribes', '%K=.sha256'));
    assert.notEqual(res.destValueSha256, res.packValueSha256);

    assert.deepEqual(fs.readFileSync(rootFile(root, unitRel('tribes', '%K=.sha256'))), bytesK);
    assert.ok(!fs.existsSync(rootFile(root, unitRel('tribes', '%otro=.sha256'))));
    assert.equal(manifestBytes(root), manifestBefore);
    assert.equal(hashManifest().sha256, first.manifestSha256);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

// ── CA-8 · clave duplicada DENTRO del pack (obligatoria) ───────────────────

test('CA-8: dos ficheros del pack con la MISMA clave = clave_duplicada_en_pack, citando ambas rutas', () => {
  const { root, restore } = setupRoot();
  const uno = msg({ key: '%dup=.sha256', sequence: 1 });
  const otro = msg({ key: '%dup=.sha256', sequence: 1, body: { title: 'contenido distinto' } });
  // Mismo nombre derivado, corpus distinto: DOS ficheros, una sola clave.
  const { packRoot } = buildSsbPack({
    units: [
      { corpus: 'tribes', msg: uno },
      { corpus: 'votes', msg: otro },
      { corpus: 'tribes', msg: msg({ key: '%sano=.sha256', author: BOB, sequence: 1 }) }
    ]
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.steps));
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    const dump = JSON.stringify(res.results);
    assert.match(dump, /clave_duplicada_en_pack: %dup=\.sha256 aparece en/);
    assert.match(dump, new RegExp(messageFileName('%dup=.sha256').replace(/[-]/g, '\\-')));
    // Root intacto: ni el mensaje sano aterrizó.
    assert.equal(manifestBytes(root), before);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_04')));
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('CA-8: `(author, sequence)` repetida dentro del pack = secuencia_duplicada_en_pack', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildSsbPack({
    units: [
      { msg: msg({ key: '%s1=.sha256', sequence: 1 }) },
      { msg: msg({ key: '%s1-bis=.sha256', sequence: 1, body: { title: 'gemelo' } }) }
    ]
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    assert.match(JSON.stringify(res.results), /secuencia_duplicada_en_pack: @alice\.ed25519#1/);
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('CA-8: nombre de fichero que NO deriva de la clave = material inalcanzable, rechazado', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildSsbPack({
    units: [{ name: 'me-llamo-como-quiero.json', msg: msg({ key: '%x=.sha256', sequence: 1 }) }]
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.steps));
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    assert.match(
      JSON.stringify(res.results),
      /nombre_no_deriva_de_clave: tribes\/me-llamo-como-quiero\.json/
    );
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

// ── CA-7 · detect disjunto (vector CRUZADO, sin pasar por el registro) ─────

test('CA-7: un volumen FIREHOSE válido NO es detectado como `ssb` (la dirección con vector real)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u205-fh-'));
  try {
    // Árbol firehose real: `<corpus>/<batch>/<rkey>.json` con payload jetstream.
    const post = {
      did: 'did:plc:alpha',
      kind: 'commit',
      uri: 'at://did:plc:alpha/app.bsky.feed.post/u1',
      commit: {
        collection: 'app.bsky.feed.post',
        rkey: 'u1',
        record: { text: 'hola', createdAt: '2026-07-31T00:00:00.000Z' }
      }
    };
    const rel = 'raw/jetstream/u1.json';
    const abs = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `${JSON.stringify(post, null, 2)}\n`, 'utf8');

    const ctx = { volumeEntry: {}, volumeFiles: [rel], volumeDir: dir };
    assert.equal(FIREHOSE_DRIVER.detect(ctx), true, 'control: el árbol ES firehose');
    assert.equal(SSB_DRIVER.detect(ctx), false, 'un volumen FIREHOSE no es SSB');
    // Disjunción también a nivel de CONTENIDO, no solo de nombres de corpus.
    assert.equal(ssbMessageKey(post), null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('CA-7 (mide U202/U203/U204, no U205): un volumen SSB válido no es firehose — cerrado por construcción', () => {
  // Declarado como lo que es: esta mitad pasa HOY sin escribir una línea de
  // U205 (FIREHOSE exige `commit` en la raíz del fichero y el export SSB
  // escribe {key,value,type,corpus}). Se conserva como fijación del contrato.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u205-ssb-'));
  try {
    const rel = unitRel('tribes', '%d1=.sha256');
    const abs = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(landed(msg({ key: '%d1=.sha256' }), 'tribes'), null, 2), 'utf8');

    const ctx = { volumeEntry: {}, volumeFiles: [rel], volumeDir: dir };
    assert.equal(SSB_DRIVER.detect(ctx), true, 'control: el árbol ES ssb');
    assert.equal(FIREHOSE_DRIVER.detect(ctx), false);
    // Y el registro congelado resuelve la familia sin ambigüedad.
    assert.deepEqual(detectVolumeFamily({}, [rel], dir), { family: 'ssb' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('CA-7: `detect` mira el CONTENIDO, no la ruta — una ranura SSB con material ajeno no detecta', () => {
  // Vector que separa «detect por nombre de corpus» de «detect por contenido»:
  // el árbol tiene la forma EXACTA de un volumen SSB (`tribes/<algo>.json`) y
  // dentro lleva un post de firehose. Sin la lectura de contenido, `detect`
  // devolvería true y el volumen se importaría por la familia equivocada.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u205-disfraz-'));
  try {
    const post = {
      did: 'did:plc:alpha',
      kind: 'commit',
      commit: { collection: 'app.bsky.feed.post', rkey: 'u1', record: { text: 'hola' } }
    };
    const rel = 'tribes/u1.json';
    const abs = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `${JSON.stringify(post, null, 2)}\n`, 'utf8');
    assert.equal(SSB_DRIVER.detect({ volumeEntry: {}, volumeFiles: [rel], volumeDir: dir }), false);

    // Y un mensaje SSB SIN coordenada de feed tampoco firma la familia.
    const sinCoords = { key: '%k=.sha256', value: { content: { type: 'tribe' } } };
    fs.writeFileSync(abs, `${JSON.stringify(sinCoords, null, 2)}\n`, 'utf8');
    assert.equal(SSB_DRIVER.detect({ volumeEntry: {}, volumeFiles: [rel], volumeDir: dir }), false);

    // Control positivo: con material SSB completo, sí.
    fs.writeFileSync(abs, JSON.stringify(landed(msg({ key: '%k=.sha256' }), 'tribes'), null, 2), 'utf8');
    assert.equal(SSB_DRIVER.detect({ volumeEntry: {}, volumeFiles: [rel], volumeDir: dir }), true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('CA-7: `detect` es honesto sin contenido — sin `volumeDir` no adivina', () => {
  assert.equal(SSB_DRIVER.detect({ volumeEntry: {}, volumeFiles: ['tribes/x.json'] }), false);
  // Salvo que el volumen DECLARE la familia: eso no es adivinar.
  assert.equal(SSB_DRIVER.detect({ volumeEntry: { family: 'ssb' }, volumeFiles: [] }), true);
});

// ── La fixture del propio repo: consecuencia declarada ─────────────────────

test('consecuencia declarada: la fixture ssb-log.json del repo NO es un conjunto de feeds válido', () => {
  const { root, restore } = setupRoot();
  // Réplica EXACTA de la forma medida en packages/mesh/ssb-system/fixtures/
  // ssb-log.json: `sequence` es un contador GLOBAL y `previous` cruza de feed
  // (bob/4 encadena con un mensaje de alice). No es material SSB válido, y el
  // driver falla cerrado ante él en vez de aterrizar una cadena rota.
  const { packRoot } = buildSsbPack({
    units: [
      { msg: msg({ key: '%tribeCreate001=.sha256', author: ALICE, sequence: 1, previous: null }) },
      {
        msg: msg({
          key: '%parliamentTerm001=.sha256',
          author: ALICE,
          sequence: 3,
          previous: null,
          type: 'parliamentTerm'
        }),
        corpus: 'parliament'
      },
      {
        msg: msg({
          key: '%parliamentProposal001=.sha256',
          author: BOB,
          sequence: 4,
          previous: '%parliamentTerm001=.sha256',
          type: 'parliamentProposal'
        }),
        corpus: 'parliament'
      }
    ]
  });
  try {
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.steps));
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    const dump = JSON.stringify(res.results);
    // (a) previous=null con sequence 3 (el contador es global, no por feed);
    assert.match(dump, /cadena_rota_en_pack: @alice\.ed25519 seq 3 declara previous=null/);
    // (b) bob/4 encadena con un mensaje del feed de alice.
    assert.match(dump, /cadena_rota_en_pack: @bob\.ed25519 seq 4 encadena con .*pertenece al feed @alice\.ed25519/);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_04')));
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

// ── Layout y raíz del volumen ──────────────────────────────────────────────

test('layout: fichero de raíz NO declarado = familia_invalida (la allowlist la ejerce el driver)', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildSsbPack({
    mutate(dataDir) {
      fs.writeFileSync(path.join(dataDir, 'basura.txt'), 'ruido\n', 'utf8');
    }
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'validar');
    assert.match(JSON.stringify(res.results), /fichero_de_raiz_no_declarado: basura\.txt/);
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('layout: mensaje plantado en la RAÍZ del pack = familia_invalida citando el corpus', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildSsbPack({
    mutate(dataDir) {
      const m = msg({ key: '%fantasma=.sha256' });
      fs.writeFileSync(
        path.join(dataDir, messageFileName(m.key)),
        JSON.stringify(landed(m, 'tribes'), null, 2),
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
      /fichero_de_raiz_no_declarado: .* es un mensaje SSB .*viven bajo un corpus/
    );
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('layout: profundidad distinta de <corpus>/<fichero> = ruta_no_declarada', () => {
  const { root, restore } = setupRoot();
  const m = msg({ key: '%hondo=.sha256' });
  const { packRoot } = buildSsbPack({
    units: [{ msg: msg({ key: '%sano=.sha256' }) }],
    mutate(dataDir) {
      const abs = path.join(dataDir, 'tribes', 'sub', messageFileName(m.key));
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, JSON.stringify(landed(m, 'tribes'), null, 2), 'utf8');
    }
  });
  try {
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.steps));
    assert.equal(res.step, 'validar');
    assert.match(JSON.stringify(res.results), /ruta_no_declarada: tribes\/sub\//);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('sidecar: manifest.json aterriza si falta; distinto = divergencia reportada, JAMÁS pisado', () => {
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({ manifest: ssbManifest() });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true, JSON.stringify(first));
    const sidecar = rootFile(root, 'manifest.json');
    assert.ok(fs.existsSync(sidecar));
    const antes = fs.readFileSync(sidecar);

    const packB = buildSsbPack({
      name: 'pack-ssb-sidecar',
      version: '2.0.0',
      units: [{ msg: msg({ key: '%s2=.sha256', author: BOB, sequence: 1 }) }],
      manifest: ssbManifest({ syncedAt: '2026-08-01T00:00:00.000Z' })
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res.steps));
    const fam = res.families.find((f) => f.id === 'ssb');
    assert.deepEqual(
      fam.divergences.map((d) => ({ path: d.path, kind: d.kind })),
      [{ path: 'manifest.json', kind: 'contenido_distinto' }]
    );
    // La marca de sync del destino es decisión local viva: no se pisa.
    assert.deepEqual(fs.readFileSync(sidecar), antes);
    assert.ok(fs.existsSync(rootFile(root, unitRel('tribes', '%s2=.sha256'))));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('sidecar: manifest.json roto = familia_invalida por el schema REAL ssb-manifest (U80)', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildSsbPack({ manifest: ssbManifest({ disk: 'DISK_09' }) });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    assert.match(JSON.stringify(res.results), /ssb-manifest/);
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('sidecar: manifest.json que ADEMÁS es un mensaje = mensaje_en_raiz (el guardián SÍ es alcanzable)', () => {
  const { root, restore } = setupRoot();
  // El schema `ssb-manifest` tiene additionalProperties:true, así que un
  // sidecar válido puede llevar {key, value} dentro y pasar VALIDAR.
  const m = msg({ key: '%disfrazado=.sha256' });
  const { packRoot } = buildSsbPack({
    manifest: ssbManifest({ key: m.key, value: m.value })
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'mensaje_en_raiz');
    assert.equal(res.file, 'manifest.json');
    assert.equal(res.key, '%disfrazado=.sha256');
    assert.equal(manifestBytes(root), before);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_04')));
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

// ── El índice del destino no admite agujeros ───────────────────────────────

test('destino: fichero que no rinde clave = destino_sin_clave, aborta en el pase dry', () => {
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({ units: [{ msg: msg({ key: '%d1=.sha256' }) }] });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    fs.writeFileSync(rootFile(root, 'tribes/nota.md'), '# nota suelta\n', 'utf8');
    const manifestBefore = manifestBytes(root);
    const treeBefore = volumeFiles(root);

    const packB = buildSsbPack({
      name: 'pack-ssb-destino-sucio',
      version: '2.0.0',
      units: [{ msg: msg({ key: '%d2=.sha256', author: BOB, sequence: 1 }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'destino_sin_clave');
    assert.deepEqual(res.files, ['tribes/nota.md']);
    assert.ok(!res.steps.some((s) => s.step === 'sellar'), 'no se llegó a SELLAR');
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

test('D-G: fichero del destino MAL NOMBRADO = destino_fuera_de_layout, jamás un dedup que mienta', () => {
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({ units: [{ msg: msg({ key: '%viejo=.sha256' }) }] });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    // Material heredado: el fichero de `%viejo` con un nombre que NO deriva de
    // su clave. Para `loadSsbMessage` ese mensaje no existe en ninguna parte.
    fs.renameSync(
      rootFile(root, unitRel('tribes', '%viejo=.sha256')),
      rootFile(root, 'tribes/nombre-legado.json')
    );
    const manifestBefore = manifestBytes(root);
    const treeBefore = volumeFiles(root);

    // El pack trae EL MISMO mensaje con el nombre BUENO. Antes de D-G esto daba
    // `ok:true, moved:0, dedup:1`: el nombre bueno no aterrizaba nunca y el
    // lector seguía sin encontrar nada, con un `dedup` diciendo que la clave ya
    // vivía ahí.
    const packB = buildSsbPack({
      name: 'pack-ssb-mal-nombrado',
      version: '2.0.0',
      units: [{ msg: msg({ key: '%viejo=.sha256' }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'destino_fuera_de_layout');
    assert.deepEqual(res.files, [
      {
        file: 'tribes/nombre-legado.json',
        key: '%viejo=.sha256',
        esperado: unitRel('tribes', '%viejo=.sha256')
      }
    ]);
    assert.ok(!res.steps.some((s) => s.step === 'sellar'), 'no se llegó a SELLAR');
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

test('D-G: mensaje del destino con profundidad 3 o en la raíz = destino_fuera_de_layout', () => {
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({ units: [{ msg: msg({ key: '%l1=.sha256' }) }] });
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    // Mensaje aterrizado con profundidad 3 (layout anterior): invisible para
    // `loadSsbMessage`. Antes se INDEXABA y se contaba en `destFueraDeLayout` —
    // ese campo era la coartada, como el `destSinClave` que U204 mató en D-F.
    const huerfano = msg({ key: '%l2=.sha256', author: BOB, sequence: 1 });
    const abs = rootFile(root, `tribes/heredado/${messageFileName(huerfano.key)}`);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(landed(huerfano, 'tribes'), null, 2), 'utf8');

    const packB = buildSsbPack({
      name: 'pack-ssb-heredado',
      version: '2.0.0',
      units: [{ msg: huerfano }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'destino_fuera_de_layout');
    assert.equal(res.files[0].file, `tribes/heredado/${messageFileName('%l2=.sha256')}`);
    assert.equal(res.files[0].key, '%l2=.sha256');
    assert.equal(res.files[0].esperado, null, 'no hay ruta canónica que sugerir: ni el corpus vale');
    // Y el campo-coartada ya no existe en ningún snapshot.
    assert.ok(!JSON.stringify(res).includes('destFueraDeLayout'));
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('D-G: dos claves en la MISMA posición del destino = destino_con_feed_bifurcado', () => {
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({ units: [{ msg: msg({ key: '%f1=.sha256', sequence: 1 }) }] });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    // Bifurcación YA aterrizada (la puede haber dejado un escritor externo).
    // Antes el índice hacía `feed.set(seq, key)` y la segunda clave PISABA a la
    // primera en el Map: `reescritura_de_feed` comparaba contra un ganador
    // arbitrario y la bifurcación no se veía ni desde el cursor de réplica.
    const gemelo = msg({ key: '%f1-bis=.sha256', sequence: 1, body: { title: 'bifurcado' } });
    fs.writeFileSync(
      rootFile(root, unitRel('tribes', gemelo.key)),
      JSON.stringify(landed(gemelo, 'tribes'), null, 2),
      'utf8'
    );
    const manifestBefore = manifestBytes(root);

    const packB = buildSsbPack({
      name: 'pack-ssb-fork-destino',
      version: '2.0.0',
      units: [{ msg: msg({ key: '%f2=.sha256', author: BOB, sequence: 1 }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'destino_con_feed_bifurcado');
    assert.equal(res.forks.length, 1);
    assert.equal(res.forks[0].author, ALICE);
    assert.equal(res.forks[0].sequence, 1);
    assert.deepEqual(res.forks[0].keys.sort(), ['%f1-bis=.sha256', '%f1=.sha256']);
    assert.equal(manifestBytes(root), manifestBefore);
    assert.equal(hashManifest().sha256, first.manifestSha256);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('m1: destino sin coordenada de feed = destino_sin_coordenada_de_feed (guarda antes sin test)', () => {
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({ units: [{ msg: msg({ key: '%c1=.sha256' }) }] });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    // Mensaje con clave y ruta canónica pero SIN author/sequence: el driver no
    // puede protegerle la posición, así que no lo admite en el índice.
    const sinCoords = { key: '%c2=.sha256', value: { content: { type: 'tribe' } } };
    fs.writeFileSync(
      rootFile(root, unitRel('tribes', sinCoords.key)),
      JSON.stringify({ ...sinCoords, type: 'tribe', corpus: 'tribes' }, null, 2),
      'utf8'
    );
    const manifestBefore = manifestBytes(root);

    const packB = buildSsbPack({
      name: 'pack-ssb-sin-coords-destino',
      version: '2.0.0',
      units: [{ msg: msg({ key: '%c3=.sha256', author: BOB, sequence: 1 }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'destino_sin_coordenada_de_feed');
    assert.deepEqual(res.files, [unitRel('tribes', '%c2=.sha256')]);
    assert.equal(manifestBytes(root), manifestBefore);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('m1: `corpus` del fichero incoherente con su directorio = corpus_incoherente (guarda antes sin test)', () => {
  const { root, restore } = setupRoot();
  const m = msg({ key: '%ci=.sha256' });
  const { packRoot } = buildSsbPack({
    units: [{ msg: msg({ key: '%sano=.sha256', author: BOB, sequence: 1 }) }],
    mutate(dataDir) {
      const abs = path.join(dataDir, 'tribes', messageFileName(m.key));
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      // Vive bajo `tribes` y se declara de `votes`: fichero contradictorio.
      fs.writeFileSync(abs, JSON.stringify(landed(m, 'votes'), null, 2), 'utf8');
    }
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.steps));
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    assert.match(
      JSON.stringify(res.results),
      /corpus_incoherente: tribes\/.* declara corpus \\"votes\\" y vive bajo \\"tribes\\"/
    );
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('m1: `cadena_rota` en MERGE (no en validar) — el previous vive en el DESTINO y no encadena', () => {
  const { root, restore } = setupRoot();
  // Destino: un mensaje de ALICE en seq 1.
  const packA = buildSsbPack({ units: [{ msg: msg({ key: '%ancla=.sha256', sequence: 1 }) }] });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    const manifestBefore = manifestBytes(root);

    // Pack: mensaje de BOB cuyo `previous` apunta al ancla de ALICE. Dentro del
    // pack la cadena NO es verificable (el anterior no viaja), así que VALIDAR
    // lo deja pasar: solo `merge`, que ve el destino, puede cazarlo. Antes,
    // los dos aciertos de `cadena_rota` en esta suite eran subcadenas de
    // `cadena_rota_en_pack` y esta mitad tenía cobertura CERO.
    const packB = buildSsbPack({
      name: 'pack-ssb-cadena-merge',
      version: '2.0.0',
      units: [{ msg: msg({ key: '%b2=.sha256', author: BOB, sequence: 2, previous: '%ancla=.sha256' }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'cadena_rota', 'exactamente cadena_rota, NO cadena_rota_en_pack');
    assert.equal(res.author, BOB);
    assert.equal(res.sequence, 2);
    assert.equal(res.previous, '%ancla=.sha256');
    assert.equal(res.previousAuthor, ALICE);
    assert.equal(res.previousSequence, 1);
    assert.equal(manifestBytes(root), manifestBefore);
    assert.equal(hashManifest().sha256, first.manifestSha256);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('m1: `sobrescritura_imposible` SÍ es alcanzable — un DIRECTORIO ocupando la ruta de una unidad', () => {
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({ units: [{ msg: msg({ key: '%s1=.sha256' }) }] });
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);
    // Resto de una operación manual: un directorio VACÍO con el nombre canónico
    // de una unidad. `walkRel` no lo ve (no tiene ficheros dentro), así que el
    // índice está limpio y el plan lo da por ruta libre; solo el guardián
    // estructural lo caza antes de que `renameSync` reviente a medias.
    const ocupada = rootFile(root, unitRel('tribes', '%s2=.sha256'));
    fs.mkdirSync(ocupada, { recursive: true });
    const manifestBefore = manifestBytes(root);

    const packB = buildSsbPack({
      name: 'pack-ssb-dir-ocupando',
      version: '2.0.0',
      units: [{ msg: msg({ key: '%s2=.sha256', author: BOB, sequence: 1 }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'sobrescritura_imposible');
    assert.equal(res.file, unitRel('tribes', '%s2=.sha256'));
    assert.ok(!res.steps.some((s) => s.step === 'sellar'));
    assert.equal(manifestBytes(root), manifestBefore);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('destino: enlace = aborto en el pase dry, ANTES de sellar', (t) => {
  const { root, restore } = setupRoot();
  const packA = buildSsbPack({ units: [{ msg: msg({ key: '%e1=.sha256' }) }] });
  let planted = false;
  try {
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true);

    const fuera = path.join(root, 'fuera-del-volumen');
    fs.mkdirSync(fuera, { recursive: true });
    try {
      fs.symlinkSync(fuera, rootFile(root, 'enlazado'), 'junction');
      planted = true;
    } catch {
      planted = false;
    }
    if (!planted) {
      t.skip('el entorno no permite plantar junctions');
      return;
    }

    const manifestBefore = manifestBytes(root);
    const packB = buildSsbPack({
      name: 'pack-ssb-enlace',
      version: '2.0.0',
      units: [{ msg: msg({ key: '%e2=.sha256', author: BOB, sequence: 1 }) }]
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, false, JSON.stringify(res.families ?? res.steps));
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'enlace_en_destino');
    assert.ok(res.links.includes('enlazado'), JSON.stringify(res.links));
    assert.ok(!res.steps.some((s) => s.step === 'sellar'), 'no se llegó a SELLAR');
    assert.equal(manifestBytes(root), manifestBefore);
    assert.equal(hashManifest().sha256, first.manifestSha256);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    if (planted) {
      try {
        fs.unlinkSync(rootFile(root, 'enlazado'));
      } catch {
        /* limpieza best-effort */
      }
    }
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

// ── Alta en el registro ────────────────────────────────────────────────────

test('registro: familia desconocida declarada = error ANTES de staging, root intacto', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildSsbPack({ declareFamily: 'ssb-v2' });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'familia');
    assert.equal(res.error, 'familia_desconocida');
    assert.equal(res.family, 'ssb-v2');
    assert.ok(!res.steps.some((s) => s.step === 'staging'));
    assert.equal(manifestBytes(root), before);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_04')));
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('registro: el driver expone las CUATRO claves del contrato y sus constantes', () => {
  assert.deepEqual(Object.keys(SSB_DRIVER).sort(), ['detect', 'family', 'merge', 'validate']);
  assert.equal(SSB_DRIVER.family, SSB_FAMILY);
  assert.ok(Object.isFrozen(SSB_DRIVER));
  assert.deepEqual([...SSB_CORPUS_DIRS], ['tribes', 'parliament', 'votes']);
  assert.deepEqual([...SSB_ROOT_FILES], ['manifest.json']);
});

test('cursor: `feedsSha256` distingue el RELLENO del feed, no solo su frontera', () => {
  // Lo que el 8.º eslabón (réplica A→B) va a comparar. Con el máximo a secas,
  // dos volúmenes con el mismo frente y distinta densidad daban el MISMO cursor
  // y la réplica los habría dado por iguales.
  const snapshotDe = (secuencias) => {
    const { root, restore } = setupRoot();
    const { packRoot } = buildSsbPack({
      name: `pack-cursor-${secuencias.join('-')}`,
      units: secuencias.map((seq) => ({
        msg: msg({
          key: `%cur${seq}=.sha256`,
          sequence: seq,
          previous: seq === 1 ? null : `%cur${seq - 1}=.sha256`
        })
      }))
    });
    try {
      const res = importPack({ packRoot, role: 'operator' });
      assert.equal(res.ok, true, JSON.stringify(res.error ?? res.results));
      return JSON.parse(manifestBytes(root)).volumes.ssb.source.imported.snapshot;
    } finally {
      restore();
      fs.rmSync(packRoot, { recursive: true, force: true });
    }
  };

  const completo = snapshotDe([1, 2, 3]);
  const conHueco = snapshotDe([1, 3]);
  assert.equal(completo.feeds, 1);
  assert.equal(conHueco.feeds, 1);
  assert.equal(completo.feedsConHueco, undefined);
  assert.equal(conHueco.feedsConHueco, 1);
  // MISMA frontera (max=3), MISMO autor, distinto relleno → cursores DISTINTOS.
  assert.notEqual(
    completo.feedsSha256,
    conHueco.feedsSha256,
    'el cursor debe ver el relleno, no solo el máximo'
  );
  assert.notEqual(completo.unitsSha256, conHueco.unitsSha256);
});

// ── LA JUNTURA export ↔ import ─────────────────────────────────────────────
// Los tres bloqueantes de la 1.ª devolución eran la misma cosa: dos escritores
// del mismo volumen con reglas distintas. Estas pruebas cruzan la frontera de
// verdad — exportan con el escritor REAL y luego importan el resultado.
//
// ACOPLAMIENTO DECLARADO: import relativo entre paquetes, y solo en el test.
// `@zeus/ssb-system` no es dependencia de volumes-ops (ni puede serlo: los 48
// manifests están congelados, owner U237), y replicar aquí el exportador no
// probaría nada — probaría la réplica. `export.mjs` solo importa `node:*` y su
// propio `types.mjs`, así que el import relativo resuelve sin tocar deps.

test('JUNTURA: todo volumen que produce el export es importable por el driver', async () => {
  const { exportSsbLogToVolumes } = await import('../../../mesh/ssb-system/src/export.mjs');
  const { root, restore } = setupRoot();
  try {
    // El root debe declarar `ssb`: el export es fallo cerrado (U205 · CA-4).
    fs.writeFileSync(
      path.join(root, 'volumes.json'),
      `${JSON.stringify(
        {
          root: '.',
          volumes: {
            ssb: { disk: 'DISK_04', path: VOL_REL, readonly: true, label: 'ssb', corpora: [] }
          }
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    const log = [
      { key: '%j1=.sha256', value: { author: ALICE, sequence: 1, previous: null, content: { type: 'tribe' } } },
      { key: '%j2=.sha256', value: { author: ALICE, sequence: 2, previous: '%j1=.sha256', content: { type: 'post' } } },
      { key: '%j3=.sha256', value: { author: ALICE, sequence: 3, previous: '%j2=.sha256', content: { type: 'parliamentTerm' } } },
      { key: '%j4=.sha256', value: { author: BOB, sequence: 1, previous: null, content: 'cifrado==.box' } },
      { key: '%j5=.sha256', value: { author: BOB, sequence: 2, previous: '%j4=.sha256', content: { type: 'votesVote' } } }
    ];
    const exported = exportSsbLogToVolumes({ log, volumesRoot: root });
    assert.equal(exported.ok, true);
    assert.equal(exported.added, 3, 'el `post` y el DM cifrado no aterrizan');

    // El árbol aterrizado, empaquetado tal cual, DEBE pasar VALIDAR y FUSIONAR.
    const landedRels = volumeFiles(root).filter((rel) => rel !== 'manifest.json');
    const units = landedRels.map((rel) => {
      const [corpus, name] = rel.split('/');
      const raw = JSON.parse(fs.readFileSync(rootFile(root, rel), 'utf8'));
      return { corpus, name, msg: { key: raw.key, value: raw.value } };
    });
    const pack = buildSsbPack({ name: 'pack-juntura', units, declareFamily: SSB_FAMILY });

    // Se importa sobre un root LIMPIO: es el escenario de réplica A→B.
    const destino = setupRoot();
    try {
      const res = importPack({ packRoot: pack.packRoot, role: 'operator' });
      assert.equal(res.ok, true, JSON.stringify(res.error ?? res.results ?? res.steps));
      const fam = res.families.find((f) => f.id === 'ssb');
      assert.equal(fam.moved, 3);
      const snapshot = JSON.parse(manifestBytes(destino.root)).volumes.ssb.source.imported.snapshot;
      assert.equal(snapshot.units, 3);
      assert.equal(snapshot.feeds, 2);
      // alice queda {1,3}: el `post` filtrado deja un hueco LEGÍTIMO, declarado.
      assert.equal(snapshot.feedsConHueco, 1);
    } finally {
      destino.restore();
      fs.rmSync(pack.packRoot, { recursive: true, force: true });
    }
  } finally {
    restore();
  }
});

test('JUNTURA: el export ya no puede fabricar los tres volúmenes que el driver rechaza', async () => {
  const { exportSsbLogToVolumes } = await import('../../../mesh/ssb-system/src/export.mjs');
  const { root, restore } = setupRoot();
  try {
    fs.writeFileSync(
      path.join(root, 'volumes.json'),
      `${JSON.stringify(
        {
          root: '.',
          volumes: {
            ssb: { disk: 'DISK_04', path: VOL_REL, readonly: true, label: 'ssb', corpora: [] }
          }
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    const ssbRoot = path.join(root, ...VOL_REL.split('/'));

    // (1) BIFURCACIÓN: dos claves distintas en (@alice, 1). Antes: ok:true,
    // added:2, y el import posterior no lo veía (el Map se pisaba).
    assert.throws(
      () =>
        exportSsbLogToVolumes({
          log: [
            { key: '%x1=.sha256', value: { author: ALICE, sequence: 1, previous: null, content: { type: 'tribe', t: 'a' } } },
            { key: '%x2=.sha256', value: { author: ALICE, sequence: 1, previous: null, content: { type: 'tribe', t: 'b' } } }
          ],
          volumesRoot: root
        }),
      /posicion_duplicada_en_log/
    );
    assert.ok(!fs.existsSync(path.join(ssbRoot, 'tribes')) || fs.readdirSync(path.join(ssbRoot, 'tribes')).length === 0);

    // (2) SIN COORDENADA: antes aterrizaba y el import abortaba el volumen
    // ENTERO con `destino_sin_coordenada_de_feed`. Ahora se DESCARTA con motivo.
    const r2 = exportSsbLogToVolumes({
      log: [
        { key: '%y1=.sha256', value: { content: { type: 'tribe' } } },
        { key: '%y2=.sha256', value: { author: ALICE, sequence: 1, previous: null, content: { type: 'tribe' } } }
      ],
      volumesRoot: root
    });
    assert.equal(r2.added, 1);
    assert.equal(r2.skippedReasons.coordenada_de_feed_ausente, 1);
    assert.ok(!fs.existsSync(path.join(ssbRoot, 'tribes', messageFileName('%y1=.sha256'))));

    // (3) POSICIÓN OCUPADA en el volumen (no solo dentro del volcado).
    assert.throws(
      () =>
        exportSsbLogToVolumes({
          log: [
            { key: '%y3=.sha256', value: { author: ALICE, sequence: 1, previous: null, content: { type: 'tribe', t: 'otro' } } }
          ],
          volumesRoot: root
        }),
      /posicion_ocupada/
    );

    // (4) LAYOUT INVÁLIDO en el volumen: mismo criterio que `destino_fuera_de_
    // layout` del driver — el export tampoco deduplica contra lo inalcanzable.
    fs.renameSync(
      path.join(ssbRoot, 'tribes', messageFileName('%y2=.sha256')),
      path.join(ssbRoot, 'tribes', 'legado.json')
    );
    assert.throws(
      () =>
        exportSsbLogToVolumes({
          log: [
            { key: '%y2=.sha256', value: { author: ALICE, sequence: 1, previous: null, content: { type: 'tribe' } } }
          ],
          volumesRoot: root
        }),
      /layout_invalido_en_volumen[\s\S]*fuera_de_layout/
    );
  } finally {
    restore();
  }
});

test('m4 · LÍMITE MEDIDO: sin verificación de firma, cualquiera OCUPA el feed de otro para siempre', () => {
  const { restore } = setupRoot();
  // Pack hostil: 5 mensajes fabricados en el feed de la víctima. No hay
  // comprobación de firma en ninguna parte del carril, así que aterrizan.
  const victima = '@victima.ed25519';
  const hostil = buildSsbPack({
    name: 'pack-hostil',
    units: Array.from({ length: 5 }, (_, i) => ({
      msg: msg({
        key: `%falso${i + 1}=.sha256`,
        author: victima,
        sequence: i + 1,
        previous: i === 0 ? null : `%falso${i}=.sha256`,
        body: { title: 'fabricado' }
      })
    }))
  });
  try {
    const res = importPack({ packRoot: hostil.packRoot, role: 'operator' });
    assert.equal(res.ok, true, 'medido: el material fabricado ATERRIZA');
    assert.equal(res.families.find((f) => f.id === 'ssb').moved, 5);

    // Y ahora el material REAL de ese feed queda fuera PARA SIEMPRE, porque la
    // posición aterrizada es justamente lo único inviolable.
    const real = buildSsbPack({
      name: 'pack-real',
      version: '2.0.0',
      units: [{ msg: msg({ key: '%real1=.sha256', author: victima, sequence: 1, previous: null }) }]
    });
    const rechazo = importPack({ packRoot: real.packRoot, role: 'operator' });
    assert.equal(rechazo.ok, false);
    assert.equal(rechazo.error, 'reescritura_de_feed');
    assert.equal(rechazo.author, victima);
    assert.equal(rechazo.destKey, '%falso1=.sha256');
    fs.rmSync(real.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(hostil.packRoot, { recursive: true, force: true });
  }
});

// ── Cota realista ──────────────────────────────────────────────────────────

test('cota: import incremental a escala (ZEUS_U205_SCALE, por defecto 800 mensajes)', () => {
  const total = Number(process.env.ZEUS_U205_SCALE || 800);
  const { root, restore } = setupRoot();
  const key = (i) => `%esc${String(i).padStart(6, '0')}=.sha256`;
  const mk = (from, to) =>
    Array.from({ length: to - from }, (_, i) => ({
      corpus: CORPORA[(from + i) % CORPORA.length],
      msg: msg({
        key: key(from + i),
        sequence: from + i + 1,
        previous: from + i === 0 ? null : key(from + i - 1),
        type: 'tribe'
      })
    }));

  const cut = Math.floor(total * 0.6);
  const packA = buildSsbPack({ name: 'pack-escala-a', units: mk(0, cut) });
  const packB = buildSsbPack({ name: 'pack-escala-b', version: '2.0.0', units: mk(0, total) });
  try {
    const t0 = Date.now();
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    const tA = Date.now() - t0;
    assert.equal(first.ok, true, JSON.stringify(first.error ?? first.results));

    const t1 = Date.now();
    const second = importPack({ packRoot: packB.packRoot, role: 'operator' });
    const tB = Date.now() - t1;
    assert.equal(second.ok, true, JSON.stringify(second.error ?? second.results));

    const fam = second.families.find((f) => f.id === 'ssb');
    assert.equal(fam.dedup.length, cut, 'el solape se deduplica por clave');
    assert.equal(fam.moved, total - cut, 'solo lo nuevo aterriza');
    assert.equal(volumeFiles(root).length, total, 'unión aditiva: ni una copia de más');

    const snapshot = JSON.parse(manifestBytes(root)).volumes.ssb.source.imported.snapshot;
    assert.equal(snapshot.units, total);
    assert.equal(snapshot.feeds, 1);

    const third = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(third.noop, true);
    assert.equal(third.manifestSha256, second.manifestSha256);

    console.log(
      `[U205·cota] mensajes=${total} · import A (${cut} nuevos)=${tA}ms · ` +
        `import B (${cut} dedup + ${total - cut} nuevos)=${tB}ms`
    );
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  }
});

/**
 * WP-U202 · Driver LINEAS sobre importPack (detect→validate→merge plan).
 * CA-1 escribe lo que falta · CA-2 divergencia reportada, root intacto ·
 * CA-3 registro.md/delta.md jamás pisados · CA-4 familia desconocida = error.
 * Fixture sintética: base = fixture canónica de linea-kit (test/fixtures/
 * lineas) + sidecars de curación INVENTADOS (marcados sintéticos).
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
import { importPack, readOpsLedger, verifyRootIntegrity } from '../src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LINEAS_FIXTURE = path.resolve(__dirname, '../../linea-kit/test/fixtures/lineas');
const VOL_REL = 'DISK_02/LINEAS';
const SIDECAR_REGISTRO = 'demo/wp/historia/registros/r0001-oldid-2/registro.md';
const SIDECAR_DELTA = 'demo/wp/historia/registros/r0001-oldid-2/delta.md';

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u202-root-'));
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
 * Pack LINEAS sintético: fixture canónica + sidecars de curación sintéticos.
 * @param {{ name?: string, version?: string, family?: string|null, sidecars?: boolean, mutate?: (dataDir: string) => void }} [opts]
 */
function buildLineasPack(opts = {}) {
  const {
    name = 'pack-lineas',
    version = '1.0.0',
    family = null,
    sidecars = true,
    mutate = null
  } = opts;
  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u202-pack-'));
  const dataDir = path.join(packRoot, 'volumes', ...VOL_REL.split('/'));
  for (const rel of collectFiles(LINEAS_FIXTURE)) {
    const to = path.join(dataDir, rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(LINEAS_FIXTURE, rel.split('/').join(path.sep)), to);
  }
  if (sidecars) {
    for (const [rel, content] of [
      [SIDECAR_REGISTRO, '# registro sintetico (pack)\n\ncuracion inventada para el test U202\n'],
      [SIDECAR_DELTA, 'delta sintetico (pack): lectura inventada\n']
    ]) {
      const abs = path.join(dataDir, rel.split('/').join(path.sep));
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, 'utf8');
    }
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
          lineas: {
            disk: 'DISK_02',
            path: VOL_REL,
            readonly: true,
            label: 'Lineas (pack sintetico U202)',
            ...(family ? { family } : {})
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
const rootFile = (root, rel) => path.join(root, VOL_REL.split('/').join(path.sep), rel.split('/').join(path.sep));
const noStagingLeft = (root) => fs.readdirSync(root).every((n) => !n.startsWith('.import-staging'));

test('CA-1: primer import LINEAS — detect por firma, todo aterriza, family sellada', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildLineasPack();
  try {
    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.ok(res.steps.some((s) => s.step === 'familia' && s.families.lineas === 'lineas'));

    // Aterrizó la familia completa, sidecars incluidos (root no tenía → lo que falta).
    assert.ok(fs.existsSync(rootFile(root, 'registry.yaml')));
    assert.ok(fs.existsSync(rootFile(root, 'demo/manifest.json')));
    assert.ok(fs.existsSync(rootFile(root, SIDECAR_REGISTRO)));

    const fam = res.families.find((f) => f.id === 'lineas');
    assert.equal(fam.family, 'lineas');
    assert.ok(fam.moved > 0);
    assert.equal(fam.divergences.length, 0);
    assert.equal(fam.protectedSidecars.length, 0);

    // Manifiesto re-sellado por importPack con la familia declarada.
    const cfg = JSON.parse(manifestBytes(root));
    assert.equal(cfg.volumes.lineas.family, 'lineas');
    assert.equal(cfg.volumes.lineas.source.imported.name, 'pack-lineas');
    assert.notEqual(res.manifestSha256, res.manifestSha256Before);
    assert.ok(noStagingLeft(root));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('CA-1b: nodo nuevo aterriza (escribe lo que falta); idénticos se saltan', () => {
  const { root, restore } = setupRoot();
  const packA = buildLineasPack();
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    const registroHashBefore = sha256(fs.readFileSync(rootFile(root, SIDECAR_REGISTRO)));

    const packB = buildLineasPack({
      name: 'pack-lineas-b',
      version: '1.1.0',
      mutate(dataDir) {
        const n02 = path.join(dataDir, 'demo', 'nodos', 'N02', 'meta.json');
        fs.mkdirSync(path.dirname(n02), { recursive: true });
        fs.writeFileSync(
          n02,
          JSON.stringify(
            {
              id: 'N02',
              parte: 'I',
              'año_ini': 1950,
              'año_fin': 2000,
              etiqueta: 'Nodo sintetico U202',
              tesis: 'tesis inventada para el test',
              articulos_wp: ['Demo_Article']
            },
            null,
            2
          ),
          'utf8'
        );
      }
    });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res.steps));

    // Lo que falta aterriza; lo idéntico se salta; los sidecars homónimos
    // existentes se descartan con reporte (aunque sean idénticos).
    assert.ok(fs.existsSync(rootFile(root, 'demo/nodos/N02/meta.json')));
    const fam = res.families.find((f) => f.id === 'lineas');
    assert.equal(fam.moved, 1);
    assert.ok(fam.skipped > 0);
    assert.equal(fam.divergences.length, 0);
    assert.equal(fam.protectedSidecars.length, 2);

    // Curación intacta byte a byte y sello re-emitido por importPack.
    assert.equal(sha256(fs.readFileSync(rootFile(root, SIDECAR_REGISTRO))), registroHashBefore);
    const cfg = JSON.parse(manifestBytes(root));
    assert.equal(cfg.volumes.lineas.source.imported.name, 'pack-lineas-b');

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('CA-2: divergencia se REPORTA con ruta y naturaleza; el fichero del root queda intacto', () => {
  const { root, restore } = setupRoot();
  const packA = buildLineasPack();
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    const targetRel = 'demo/nodos/N01/meta.json';
    const hashBefore = sha256(fs.readFileSync(rootFile(root, targetRel)));

    const packC = buildLineasPack({
      name: 'pack-lineas-c',
      version: '2.0.0',
      mutate(dataDir) {
        const meta = path.join(dataDir, 'demo', 'nodos', 'N01', 'meta.json');
        const parsed = JSON.parse(fs.readFileSync(meta, 'utf8'));
        parsed.etiqueta = 'ETIQUETA DIVERGENTE (pack)';
        fs.writeFileSync(meta, JSON.stringify(parsed, null, 2), 'utf8');
      }
    });
    const res = importPack({ packRoot: packC.packRoot, role: 'operator' });
    assert.equal(res.ok, true);

    const fam = res.families.find((f) => f.id === 'lineas');
    const div = fam.divergences.find((d) => d.path === targetRel);
    assert.ok(div, JSON.stringify(fam.divergences));
    assert.equal(div.kind, 'contenido_distinto');
    assert.equal(div.destSha256, hashBefore);
    assert.notEqual(div.packSha256, div.destSha256);

    // Root intacto: hash del fichero divergente idéntico antes/después.
    assert.equal(sha256(fs.readFileSync(rootFile(root, targetRel))), hashBefore);

    // La divergencia queda también asentada en el ledger.
    const ledger = readOpsLedger({ volumesRoot: root });
    const seat = ledger.filter((e) => e.kind === 'import_pack').pop();
    assert.equal(seat.families.find((f) => f.id === 'lineas').divergences, 1);
    assert.ok(noStagingLeft(root));

    fs.rmSync(packC.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('U258: el sello por fichero es de lo que ATERRIZÓ, no del pack — un import divergente deja el root íntegro', () => {
  // La trampa que este test cierra: si el paso SELLAR copiara `pack.hashes`,
  // un import con divergencia sellaría el hash del PACK mientras el destino
  // conserva el suyo (regla de familia LINEAS, driver-lineas.mjs:184) — y el
  // root quedaría anotando una mentira sobre sí mismo: `fichero_corrupto` en
  // el siguiente arranque, por haber importado correctamente. Por eso el
  // sello se recomputa del DESTINO, después de FUSIONAR.
  const { root, restore } = setupRoot();
  const packA = buildLineasPack();
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    const targetRel = 'demo/nodos/N01/meta.json';
    const hashDestino = sha256(fs.readFileSync(rootFile(root, targetRel)));

    const packC = buildLineasPack({
      name: 'pack-lineas-div',
      version: '2.0.0',
      mutate(dataDir) {
        const meta = path.join(dataDir, 'demo', 'nodos', 'N01', 'meta.json');
        const parsed = JSON.parse(fs.readFileSync(meta, 'utf8'));
        parsed.etiqueta = 'ETIQUETA DIVERGENTE (pack)';
        fs.writeFileSync(meta, JSON.stringify(parsed, null, 2), 'utf8');
      }
    });
    const res = importPack({ packRoot: packC.packRoot, role: 'operator' });
    assert.equal(res.ok, true);
    assert.equal(res.families.find((f) => f.id === 'lineas').divergences.length, 1);

    const cfg = JSON.parse(manifestBytes(root));
    const sellado = cfg.volumes.lineas.source.imported.hashes;
    assert.ok(sellado, 'el import no selló hashes');
    assert.equal(
      sellado[targetRel],
      hashDestino,
      'se selló el hash del PACK: el manifiesto miente sobre su propio árbol'
    );
    // Y la consecuencia que importa: el root sigue siendo arrancable.
    const rep = verifyRootIntegrity();
    assert.equal(rep.ok, true, JSON.stringify(rep.findings));
    assert.ok(rep.checks.some((c) => c.check === 'ficheros' && c.ok === true));

    fs.rmSync(packC.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('U258: `.md` curado NO pisado — el sello anota el del destino, no el del pack', () => {
  const { root, restore } = setupRoot();
  const packA = buildLineasPack();
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    const destinoSha = sha256(fs.readFileSync(rootFile(root, SIDECAR_REGISTRO)));

    const packB = buildLineasPack({ name: 'pack-lineas-cur', version: '3.0.0' });
    // El pack trae OTRO contenido para el sidecar curado: el destino lo conserva.
    fs.writeFileSync(
      path.join(packB.dataDir, ...SIDECAR_REGISTRO.split('/')),
      '# registro DISTINTO en el pack\n',
      'utf8'
    );
    // El manifiesto del pack tiene que volver a enumerar el hash real.
    const pm = path.join(packB.packRoot, 'manifest.json');
    const parsed = JSON.parse(fs.readFileSync(pm, 'utf8'));
    parsed.hashes[`${VOL_REL}/${SIDECAR_REGISTRO}`] = sha256(
      fs.readFileSync(path.join(packB.dataDir, ...SIDECAR_REGISTRO.split('/')))
    );
    fs.writeFileSync(pm, JSON.stringify(parsed, null, 2), 'utf8');

    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res));
    const protegidos = res.families.find((f) => f.id === 'lineas').protectedSidecars;
    assert.ok(
      protegidos.some((p) => p.path === SIDECAR_REGISTRO),
      JSON.stringify(protegidos)
    );

    const cfg = JSON.parse(manifestBytes(root));
    assert.equal(cfg.volumes.lineas.source.imported.hashes[SIDECAR_REGISTRO], destinoSha);
    assert.equal(verifyRootIntegrity().ok, true);

    fs.rmSync(packB.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('CA-3: registro.md / delta.md JAMÁS pisados — descarte reportado, bytes intactos', () => {
  const { root, restore } = setupRoot();
  const packA = buildLineasPack();
  try {
    assert.equal(importPack({ packRoot: packA.packRoot, role: 'operator' }).ok, true);
    const registroBytes = fs.readFileSync(rootFile(root, SIDECAR_REGISTRO));
    const deltaBytes = fs.readFileSync(rootFile(root, SIDECAR_DELTA));

    const packD = buildLineasPack({
      name: 'pack-lineas-d',
      version: '3.0.0',
      mutate(dataDir) {
        for (const rel of [SIDECAR_REGISTRO, SIDECAR_DELTA]) {
          fs.writeFileSync(
            path.join(dataDir, rel.split('/').join(path.sep)),
            'INTENTO DE PISAR LA CURACION (pack sintetico)\n',
            'utf8'
          );
        }
      }
    });
    const res = importPack({ packRoot: packD.packRoot, role: 'operator' });
    assert.equal(res.ok, true);

    const fam = res.families.find((f) => f.id === 'lineas');
    const protectedPaths = fam.protectedSidecars.map((p) => p.path).sort();
    assert.deepEqual(protectedPaths, [SIDECAR_DELTA, SIDECAR_REGISTRO].sort());
    assert.ok(fam.protectedSidecars.every((p) => p.kind === 'curacion_protegida'));

    // Byte a byte: la curación del root no cambió.
    assert.deepEqual(fs.readFileSync(rootFile(root, SIDECAR_REGISTRO)), registroBytes);
    assert.deepEqual(fs.readFileSync(rootFile(root, SIDECAR_DELTA)), deltaBytes);
    assert.ok(
      !fs.readFileSync(rootFile(root, SIDECAR_REGISTRO), 'utf8').includes('INTENTO DE PISAR')
    );
    assert.ok(noStagingLeft(root));

    fs.rmSync(packD.packRoot, { recursive: true, force: true });
  } finally {
    restore();
    fs.rmSync(packA.packRoot, { recursive: true, force: true });
  }
});

test('CA-4: familia desconocida declarada = error, sin staging, root intacto', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildLineasPack({ family: 'tarot' });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'familia');
    assert.equal(res.error, 'familia_desconocida');
    assert.equal(res.family, 'tarot');
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
    assert.ok(!fs.existsSync(path.join(root, 'DISK_02')));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

test('familia_invalida: familia declarada sin registry.yaml → gate real de linea-kit aborta', () => {
  const { root, restore } = setupRoot();
  const { packRoot } = buildLineasPack({
    family: 'lineas',
    mutate(dataDir) {
      fs.rmSync(path.join(dataDir, 'registry.yaml'));
    }
  });
  try {
    const before = manifestBytes(root);
    const res = importPack({ packRoot, role: 'operator' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'validar');
    assert.equal(res.error, 'familia_invalida');
    assert.match(JSON.stringify(res.results), /registry\.yaml ausente/);
    assert.equal(manifestBytes(root), before);
    assert.ok(noStagingLeft(root));
    assert.ok(!fs.existsSync(path.join(root, 'DISK_02')));
  } finally {
    restore();
    fs.rmSync(packRoot, { recursive: true, force: true });
  }
});

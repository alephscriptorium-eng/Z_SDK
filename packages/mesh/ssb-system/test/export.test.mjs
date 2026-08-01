/**
 * Unit + partition behaviour for SSB export (no network).
 *
 * WP-U205 añade aquí las CA de las DOS demoliciones de `src/export.mjs`:
 * - CA-4 · el manifiesto NO se inventa (root sin `volumes.json` = abortar), con
 *   el contraste contra la versión anterior, que lo creaba;
 * - CA-5 · único escritor del manifiesto, probado por RUTA DERIVADA (probe
 *   dinámico) y por co-ocurrencia con allowlist declarada (probe estático),
 *   más la prueba de que el probe heredado era CIEGO a este escritor;
 * - CA-6 · el descarte se REPORTA con motivo (DM cifrados), y lo que NO se
 *   promete se mide en vez de prometerse;
 * - unión aditiva: el export deja de borrar y aplica la misma regla que el
 *   driver SSB (dedup por clave, cross-corpus, aborto ante clave divergente).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate, validateVolumesTree } from '@zeus/linea-kit/validate';
import {
  classifyMessage,
  classifyMessageDetailed,
  exportSsbLogFile,
  exportSsbLogToVolumes,
  partitionExportable,
  requireDeclaredSsbVolume
} from '../src/export.mjs';
import {
  corpusForContent,
  classifyContent,
  messageFileName,
  SKIP_REASONS,
  SSB_CORPORA,
  SSB_DISK,
  SSB_VOLUME_ID,
  SSB_VOLUME_PATH
} from '../src/types.mjs';
import { runSsbSync } from '../src/sync-cli.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, '..');
const MONOREPO_ROOT = path.resolve(__dirname, '../../../..');
const FIXTURE = path.resolve(PKG_ROOT, 'fixtures/ssb-log.json');
const FEED_FIXTURE = path.resolve(PKG_ROOT, 'fixtures/ssb-feed-log.json');

/**
 * Manifiesto mínimo del root con la entrada `ssb` DECLARADA. Desde U205 el
 * export ya no la siembra: la siembra el import (U201) y aquí la siembra el
 * arnés, igual que hace `test-utils/src/smoke-env.mjs:52` para las suites de
 * app. Patrón, no atajo.
 * @param {string} root
 */
function seedManifest(root, over = {}) {
  const config = {
    root: '.',
    volumes: {
      [SSB_VOLUME_ID]: {
        disk: SSB_DISK,
        path: SSB_VOLUME_PATH,
        readonly: true,
        label: 'SSB OASIS (Tribes & Parliament)',
        corpora: [],
        ...over
      }
    }
  };
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    `${JSON.stringify(config, null, 2)}\n`,
    'utf8'
  );
  return config;
}

/** @param {string} prefix */
function tempRoot(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// ── Tabla de tipos ─────────────────────────────────────────────────────────

test('corpusForContent maps tribe*/parliament*/votes* via table', () => {
  assert.equal(corpusForContent({ type: 'tribe' }), 'tribes');
  assert.equal(corpusForContent({ type: 'parliamentProposal' }), 'parliament');
  assert.equal(corpusForContent({ type: 'votesVote' }), 'votes');
  assert.equal(corpusForContent({ type: 'post' }), null);
});

test('partitionExportable skips unrelated types', () => {
  const log = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const { byCorpus, skipped, total } = partitionExportable(log);
  assert.equal(total, 10);
  assert.equal(skipped, 1);
  assert.equal(byCorpus.tribes.length, 2);
  assert.equal(byCorpus.parliament.length, 5);
  assert.equal(byCorpus.votes.length, 2);
  assert.equal(classifyMessage(log[9]), null);
});

// ── CA-6(a) · el descarte se REPORTA, con motivo que DISCRIMINA ────────────

test('CA-6a: un DM cifrado no se exporta y se dice POR QUÉ — motivo distinto al de un tipo desconocido', () => {
  // El contenido de un mensaje privado SSB viaja como CADENA cifrada.
  const cifrado = {
    key: '%dm001=.sha256',
    value: { author: '@alice.ed25519', sequence: 1, previous: null, content: 'aBcDeF==.box' }
  };
  const desconocido = {
    key: '%post001=.sha256',
    value: { author: '@alice.ed25519', sequence: 2, previous: '%dm001=.sha256', content: { type: 'post' } }
  };

  // El motivo DISCRIMINA: si el descarte fuera un contador mudo, un test que
  // solo mirase `skipped>0` pasaría con cualquiera de los dos.
  assert.equal(classifyContent('aBcDeF==.box').reason, SKIP_REASONS.CONTENIDO_CIFRADO);
  assert.equal(classifyContent({ type: 'post' }).reason, SKIP_REASONS.TIPO_NO_EXPORTABLE);
  assert.equal(classifyContent(null).reason, SKIP_REASONS.CONTENIDO_AUSENTE);
  assert.equal(classifyContent({}).reason, SKIP_REASONS.TIPO_AUSENTE);
  assert.equal(classifyMessageDetailed(cifrado).reason, SKIP_REASONS.CONTENIDO_CIFRADO);

  const part = partitionExportable([cifrado, desconocido]);
  assert.equal(part.skipped, 2);
  assert.deepEqual(part.skippedReasons, { contenido_cifrado: 1, tipo_no_exportable: 1 });
  assert.deepEqual(part.skippedDetail, [
    { index: 0, key: '%dm001=.sha256', reason: SKIP_REASONS.CONTENIDO_CIFRADO },
    { index: 1, key: '%post001=.sha256', reason: SKIP_REASONS.TIPO_NO_EXPORTABLE }
  ]);

  // Y el árbol aterrizado tiene CONTEO 0 para ese material.
  const root = tempRoot('zeus-ssb-cifrado-');
  try {
    seedManifest(root);
    const res = exportSsbLogToVolumes({ log: [cifrado, desconocido], volumesRoot: root });
    assert.deepEqual(res.counts, { tribes: 0, parliament: 0, votes: 0 });
    assert.equal(res.skipped, 2);
    assert.deepEqual(res.skippedReasons, { contenido_cifrado: 1, tipo_no_exportable: 1 });
    assert.equal(res.manifest.totals.exported, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CA-6b: cero material de identidad en el paquete (probe de BACKLOG:266, patrones declarados)', () => {
  // Alcance HONESTO: esto mide el PAQUETE (src/ + fixtures/), no el contenido
  // exportado. Ver el test siguiente para el límite real.
  const PATRONES = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\bprivateKey\b/,
    /\bsecretKey\b/,
    /\bmnemonic\b/,
    /\bpassphrase\b/,
    /\bcurve\b\s*:\s*['"]ed25519['"]/
  ];
  /** @type {string[]} */
  const hits = [];
  const walk = (abs, rel) => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const childAbs = path.join(abs, entry.name);
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(childAbs, childRel);
      else if (entry.isFile() && /\.(mjs|js|json)$/.test(entry.name)) {
        const src = fs.readFileSync(childAbs, 'utf8');
        for (const re of PATRONES) if (re.test(src)) hits.push(`${childRel} ~ ${re}`);
      }
    }
  };
  for (const dir of ['src', 'fixtures']) walk(path.join(PKG_ROOT, dir), dir);
  assert.deepEqual(hits, []);
});

test('CA-6b · LÍMITE MEDIDO: `value` es passthrough VERBATIM — el export no filtra por contenido', () => {
  // Lo que NO se promete (y aquí se mide en vez de prometerse): si un volcado
  // trae material de identidad DENTRO de `value`, aterriza tal cual. La única
  // denylist del carril (`import.mjs:47`, usada en :173-178) filtra por
  // BASENAME de fichero, jamás por contenido. Cerrarlo es un WP, no una nota.
  const root = tempRoot('zeus-ssb-passthrough-');
  try {
    seedManifest(root);
    const marcador = '-----BEGIN OPENSSH PRIVATE KEY----- (marcador sintetico de test)';
    const res = exportSsbLogToVolumes({
      log: [
        {
          key: '%leak=.sha256',
          value: {
            author: '@alice.ed25519',
            sequence: 1,
            previous: null,
            content: { type: 'tribe', nota: marcador }
          }
        }
      ],
      volumesRoot: root
    });
    assert.equal(res.counts.tribes, 1);
    const abs = path.join(res.ssbRoot, 'tribes', messageFileName('%leak=.sha256'));
    assert.ok(fs.readFileSync(abs, 'utf8').includes(marcador), 'passthrough: el export no lo filtra');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── CA-4 · EL MANIFIESTO NO SE INVENTA ─────────────────────────────────────

test('CA-4: root SIN volumes.json = abortar, y NO se crea nada (ni el manifiesto ni el volumen)', () => {
  const root = tempRoot('zeus-ssb-sin-manifiesto-');
  try {
    assert.ok(!fs.existsSync(path.join(root, 'volumes.json')));
    assert.throws(
      () => exportSsbLogFile({ logPath: FIXTURE, volumesRoot: root }),
      /volumes\.json not found at .* not operable/
    );
    // Fallo CERRADO: ni manifiesto inventado ni árbol a medias.
    assert.ok(!fs.existsSync(path.join(root, 'volumes.json')));
    assert.ok(!fs.existsSync(path.join(root, 'DISK_04')));
    assert.deepEqual(fs.readdirSync(root), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CA-4: manifiesto presente que NO declara `ssb` = abortar (un sync vivo no inventa topología)', () => {
  const root = tempRoot('zeus-ssb-sin-entrada-');
  try {
    fs.writeFileSync(
      path.join(root, 'volumes.json'),
      `${JSON.stringify({ root: '.', volumes: {} }, null, 2)}\n`,
      'utf8'
    );
    const antes = fs.readFileSync(path.join(root, 'volumes.json'), 'utf8');
    assert.throws(
      () => exportSsbLogFile({ logPath: FIXTURE, volumesRoot: root }),
      /no declara el volumen 'ssb'/
    );
    assert.equal(fs.readFileSync(path.join(root, 'volumes.json'), 'utf8'), antes);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_04')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CA-4: manifiesto que declara `ssb` en OTRO sitio = abortar antes que escribir donde no toca', () => {
  const root = tempRoot('zeus-ssb-otro-path-');
  try {
    seedManifest(root, { path: 'DISK_09/OTRO' });
    assert.throws(() => requireDeclaredSsbVolume(root), /declara 'ssb' en path='DISK_09\/OTRO'/);
    seedManifest(root, { pathOverride: 'C:/otro/sitio' });
    assert.throws(() => requireDeclaredSsbVolume(root), /pathOverride/);
    seedManifest(root, { disk: 'DISK_01' });
    assert.throws(() => requireDeclaredSsbVolume(root), /disk='DISK_01'/);
    assert.ok(!fs.existsSync(path.join(root, 'DISK_04')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CA-4 · CONTRASTE: la versión ANTERIOR de export.mjs SÍ creaba el manifiesto (la CA discrimina)', () => {
  // Réplica VERBATIM de `upsertVolumesJsonEntry`, tal y como vivía en
  // `packages/mesh/ssb-system/src/export.mjs:173-208` del commit 87bd93f
  // (obtenida con `git show 87bd93f:...`). Se conserva aquí como PRUEBA de
  // discriminación: si la CA-4 anterior pasara también con el código viejo, no
  // estaría midiendo nada.
  const upsertVolumesJsonEntryVIEJO = (volumesRoot, meta) => {
    const configPath = path.join(volumesRoot, 'volumes.json');
    let config = { root: '.', volumes: {} };
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!config.volumes || typeof config.volumes !== 'object') config.volumes = {};
    }
    const prev = config.volumes[SSB_VOLUME_ID] || {};
    config.volumes[SSB_VOLUME_ID] = {
      ...prev,
      disk: SSB_DISK,
      path: SSB_VOLUME_PATH,
      readonly: true,
      label: prev.label || 'SSB OASIS (Tribes & Parliament)',
      source: { ...(prev.source ?? {}), syncedAt: meta.syncedAt, kind: 'ssb-pub-export' },
      corpora: SSB_CORPORA.map((c) => ({
        id: c.id,
        path: c.path,
        label: c.label,
        files: meta.counts[c.id] ?? 0
      }))
    };
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  };

  const root = tempRoot('zeus-ssb-viejo-');
  try {
    assert.ok(!fs.existsSync(path.join(root, 'volumes.json')));
    upsertVolumesJsonEntryVIEJO(root, { syncedAt: '2026-01-01T00:00:00.000Z', counts: {} });
    // Lo INVENTABA: root sin manifiesto → manifiesto nuevo con la entrada.
    assert.ok(fs.existsSync(path.join(root, 'volumes.json')));
    const cfg = JSON.parse(fs.readFileSync(path.join(root, 'volumes.json'), 'utf8'));
    assert.equal(cfg.volumes.ssb.path, SSB_VOLUME_PATH);
    assert.equal(cfg.volumes.ssb.source.syncedAt, '2026-01-01T00:00:00.000Z');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CA-4 · CLI: `runSsbSync` devuelve {ok:false, error} citando la ruta, sin stack trace suelto', () => {
  const root = tempRoot('zeus-ssb-cli-');
  const prev = process.env.ZEUS_VOLUMES_ROOT;
  try {
    process.env.ZEUS_VOLUMES_ROOT = root;
    // Antes: `runSsbSync` no envolvía la llamada y devolvía {ok:true,...}
    // incondicionalmente (:76), así que un throw salía como excepción no
    // capturada. Ahora es la misma forma de error que ya usaba en :50-59.
    const result = runSsbSync({ logPath: FIXTURE, volumesRoot: root });
    assert.equal(result.ok, false);
    assert.match(result.error, /SSB export aborted for volumes root/);
    assert.match(result.error, /volumes\.json not found at/);
    assert.equal(result.volumesRoot, path.resolve(root));
    assert.equal(result.logPath, path.resolve(FIXTURE));
    // Y el `if (!result.ok)` del main imprime y sale con 1: `ok` es el contrato.
    assert.ok(!fs.existsSync(path.join(root, 'volumes.json')));

    // Con el manifiesto sembrado, el mismo CLI pasa: la CA no es «siempre rojo».
    seedManifest(root);
    const ok = runSsbSync({ logPath: FIXTURE, volumesRoot: root });
    assert.equal(ok.ok, true, JSON.stringify(ok.error));
    assert.equal(ok.counts.tribes, 2);
  } finally {
    if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = prev;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── CA-5 · ÚNICO ESCRITOR DEL MANIFIESTO ───────────────────────────────────

test('CA-5a · POR RUTA DERIVADA: un export completo no escribe NI UNA VEZ en <root>/volumes.json', () => {
  const root = tempRoot('zeus-ssb-probe-din-');
  try {
    seedManifest(root);
    const manifestPath = path.join(root, 'volumes.json');
    const antes = fs.readFileSync(manifestPath);

    // Instrumentación por RUTA RESUELTA: no mira el texto del código, mira a
    // dónde apunta cada escritura. Es justo lo que el probe heredado no podía
    // ver, porque aquí la ruta viajaba en una variable (`configPath`).
    const primitivas = ['writeFileSync', 'appendFileSync', 'rmSync', 'unlinkSync', 'renameSync', 'copyFileSync'];
    const originales = {};
    /** @type {string[]} */
    const destinos = [];
    for (const nombre of primitivas) {
      originales[nombre] = fs[nombre];
      fs[nombre] = (target, ...rest) => {
        destinos.push(path.resolve(String(target)));
        return originales[nombre](target, ...rest);
      };
    }
    try {
      exportSsbLogFile({ logPath: FIXTURE, volumesRoot: root, provenance: { fixture: true } });
    } finally {
      for (const nombre of primitivas) fs[nombre] = originales[nombre];
    }

    assert.ok(destinos.length > 0, 'control: el export SÍ escribe (si no, el probe no probaría nada)');
    const contraManifiesto = destinos.filter((d) => d === path.resolve(manifestPath));
    assert.deepEqual(contraManifiesto, [], `escrituras contra el manifiesto: ${contraManifiesto}`);
    // Y el sello no se movió ni un byte.
    assert.deepEqual(fs.readFileSync(manifestPath), antes);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CA-5b · el probe HEREDADO era CIEGO a este escritor; el endurecido lo caza', () => {
  // Fragmento VERBATIM del escritor legado (87bd93f, export.mjs:174 y :207).
  const VIEJO = [
    "  const configPath = path.join(volumesRoot, 'volumes.json');",
    '  // …',
    '  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\\n`, \'utf8\');'
  ].join('\n');

  // (a) El probe heredado (BACKLOG:262, reejecutado literal por la
  //     contrarrevisión) exige AMBAS cosas en la MISMA línea: no ve nada.
  const HEREDADO = /sealManifest|writeFileSync.*volumes\.json/;
  assert.equal(HEREDADO.test(VIEJO), false, 'el probe heredado no ve el escritor legado');

  // (b) El endurecido es por CO-OCURRENCIA en el fichero: sí lo ve.
  assert.equal(marcaEscritorDeManifiesto(VIEJO), true);
  // Y no marca cualquier cosa: hace falta la primitiva Y el token.
  assert.equal(marcaEscritorDeManifiesto("const p = join(root, 'volumes.json');"), false);
  assert.equal(marcaEscritorDeManifiesto('fs.writeFileSync(abs, payload);'), false);
});

/** Predicado del probe endurecido: sobre-aproximación CONSERVADORA por fichero. */
const PRIMITIVAS_DE_ESCRITURA =
  /\b(writeFileSync|appendFileSync|createWriteStream|rmSync|unlinkSync|renameSync|copyFileSync)\b/;
const TOKEN_DE_MANIFIESTO = /(['"`])volumes\.json\1|MANIFEST_FILE_NAME/;
function marcaEscritorDeManifiesto(source) {
  return PRIMITIVAS_DE_ESCRITURA.test(source) && TOKEN_DE_MANIFIESTO.test(source);
}

test('CA-5c · repo entero: cada fichero marcado está en la ALLOWLIST, razonado uno a uno', () => {
  // El probe sobre-aproxima a propósito (co-ocurrencia por FICHERO, no
  // dataflow): prefiere falsos positivos a ceguera. Por eso la allowlist es
  // parte de la CA y cada entrada lleva su razón; sin ella, la CA nacería roja
  // por motivos legítimos y se «arreglaría» relajando el probe.
  const ALLOWLIST = {
    // EL escritor legítimo: `sealManifest`, usado solo por importPack (U199/U201).
    'packages/engine/volumes-ops/src/manifest.mjs': 'sealManifest — el único escritor legítimo',
    // volumes.json INTERNO de un pack: fuente de import, jamás un root vivo.
    'packages/editor/editor-ui/src/world/materialize-pack.mjs':
      'escribe <packRoot>/volumes/volumes.json (manifiesto del PACK, no de un root vivo)',
    // Semilla de arnés en un temp root (CI sin VOLUMES/).
    'packages/engine/test-utils/src/smoke-env.mjs': 'siembra un root temporal de test',
    // Falso positivo por co-ocurrencia: el token solo aparece en la NOTA DE
    // DEMOLICIÓN de U204; sus escrituras van a <corpus>/<batch>/<rkey>.json.
    'packages/engine/feed-kit/src/jetstream-sync.mjs':
      'el token solo aparece en prosa (cabecera U204); ninguna escritura lo apunta',
    // U205: menciona `volumes.json` SOLO para NEGARSE a operar sin él; sus
    // escrituras van a <corpus>/<key>.json y al sidecar del volumen. Descargado
    // por el probe dinámico de CA-5a, que mide la ruta resuelta.
    'packages/mesh/ssb-system/src/export.mjs':
      'solo lo nombra para abortar; probe dinámico CA-5a demuestra 0 escrituras contra él'
  };
  const SALTAR = new Set(['node_modules', 'test', 'tests', '__tests__', 'fixtures', 'dist', '.git']);
  /** @type {string[]} */
  const marcados = [];
  const walk = (abs, rel) => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (SALTAR.has(entry.name)) continue;
      const childAbs = path.join(abs, entry.name);
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(childAbs, childRel);
      else if (entry.isFile() && /\.(mjs|js|cjs)$/.test(entry.name)) {
        if (marcaEscritorDeManifiesto(fs.readFileSync(childAbs, 'utf8'))) marcados.push(childRel);
      }
    }
  };
  for (const dir of ['packages', 'scripts', 'e2e']) {
    const abs = path.join(MONOREPO_ROOT, dir);
    if (fs.existsSync(abs)) walk(abs, dir);
  }
  assert.deepEqual(marcados.sort(), Object.keys(ALLOWLIST).sort());
});

// ── Unión aditiva (tensión 1) ──────────────────────────────────────────────

test('export fixture → DISK_04/SSB validates U80 volumes + ssb-manifest', () => {
  const root = tempRoot('zeus-ssb-export-');
  try {
    seedManifest(root);
    const result = exportSsbLogFile({
      logPath: FIXTURE,
      volumesRoot: root,
      provenance: { fixture: true, pubUrl: null }
    });
    assert.equal(result.ok, true);
    assert.equal(result.counts.tribes, 2);
    assert.equal(result.counts.parliament, 5);
    assert.equal(result.counts.votes, 2);
    assert.equal(result.skipped, 1);

    const manifestPath = path.join(root, 'DISK_04', 'SSB', 'manifest.json');
    assert.ok(fs.existsSync(manifestPath));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const schema = validate('ssb-manifest', manifest);
    assert.equal(schema.ok, true, JSON.stringify(schema.errors));

    const tree = validateVolumesTree({ volumesRoot: root });
    assert.equal(tree.ok, true, JSON.stringify(tree.results.filter((r) => !r.ok)));
    const ssb = tree.results.find((r) => r.schemaId === 'ssb-manifest');
    assert.ok(ssb?.ok, 'expected ssb-manifest in validateVolumesTree');

    const volumes = JSON.parse(fs.readFileSync(path.join(root, 'volumes.json'), 'utf8'));
    assert.equal(volumes.volumes.ssb.disk, 'DISK_04');
    assert.equal(volumes.volumes.ssb.path, 'DISK_04/SSB');
    assert.equal(volumes.volumes.ssb.readonly, true);
    console.log(
      `Export OK: ssbRoot=${result.ssbRoot}; counts=${JSON.stringify(result.counts)}`
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('unión aditiva: el export ya NO borra — el material previo sobrevive y el re-sync es idempotente', () => {
  const root = tempRoot('zeus-ssb-aditivo-');
  try {
    seedManifest(root);
    const first = exportSsbLogFile({ logPath: FIXTURE, volumesRoot: root });
    assert.equal(first.added, 9);
    assert.equal(first.unchanged, 0);

    // Material que el volcado NO trae, aterrizado antes (p.ej. por importPack).
    const heredado = {
      key: '%heredado=.sha256',
      value: {
        author: '@dave.ed25519',
        sequence: 1,
        previous: null,
        content: { type: 'tribe', title: 'heredado' }
      }
    };
    const heredadoAbs = path.join(
      first.ssbRoot,
      'tribes',
      messageFileName('%heredado=.sha256')
    );
    fs.writeFileSync(
      heredadoAbs,
      JSON.stringify({ ...heredado, type: 'tribe', corpus: 'tribes' }, null, 2),
      'utf8'
    );
    const bytesHeredado = fs.readFileSync(heredadoAbs);

    // Re-sync del MISMO volcado: nada nuevo, nada borrado, nada reescrito.
    const antes = fs
      .readdirSync(path.join(first.ssbRoot, 'tribes'))
      .map((n) => ({ n, m: fs.statSync(path.join(first.ssbRoot, 'tribes', n)).mtimeMs }));
    const second = exportSsbLogFile({ logPath: FIXTURE, volumesRoot: root });
    assert.equal(second.added, 0, 'idempotente: cero escrituras nuevas');
    assert.equal(second.unchanged, 9);
    assert.equal(second.counts.tribes, 3, 'el heredado sigue contando');
    assert.ok(fs.existsSync(heredadoAbs), 'el antiguo `sync replaces snapshot` lo habría BORRADO');
    assert.deepEqual(fs.readFileSync(heredadoAbs), bytesHeredado);
    const despues = fs
      .readdirSync(path.join(first.ssbRoot, 'tribes'))
      .map((n) => ({ n, m: fs.statSync(path.join(first.ssbRoot, 'tribes', n)).mtimeMs }));
    assert.deepEqual(despues, antes, 'ni un mtime se movió');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('unión aditiva: misma clave con `value` DISTINTO aborta ANTES de escribir (defecto D1)', () => {
  const root = tempRoot('zeus-ssb-divergente-');
  try {
    seedManifest(root);
    const base = {
      key: '%K=.sha256',
      value: {
        author: '@alice.ed25519',
        sequence: 1,
        previous: null,
        content: { type: 'tribe', title: 'original' }
      }
    };
    const first = exportSsbLogToVolumes({ log: [base], volumesRoot: root });
    const abs = path.join(first.ssbRoot, 'tribes', messageFileName('%K=.sha256'));
    const bytes = fs.readFileSync(abs);

    const impostor = {
      key: '%K=.sha256',
      value: { ...base.value, content: { type: 'tribe', title: 'OTRO MENSAJE' } }
    };
    const nuevo = {
      key: '%N=.sha256',
      value: {
        author: '@bob.ed25519',
        sequence: 1,
        previous: null,
        content: { type: 'votes', question: 'nuevo' }
      }
    };
    assert.throws(
      () => exportSsbLogToVolumes({ log: [nuevo, impostor], volumesRoot: root }),
      /clave_divergente/
    );
    // Pase dry: ni el mensaje sano llegó a escribirse.
    assert.deepEqual(fs.readFileSync(abs), bytes);
    assert.ok(!fs.existsSync(path.join(first.ssbRoot, 'votes', messageFileName('%N=.sha256'))));

    // Y dentro del MISMO volcado: dos mensajes distintos con la misma clave.
    assert.throws(
      () => exportSsbLogToVolumes({ log: [base, impostor], volumesRoot: root }),
      /clave_duplicada_en_log/
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('unión aditiva: el índice es CROSS-CORPUS — una clave que ya vive en otro corpus no se replanta', () => {
  const root = tempRoot('zeus-ssb-cross-');
  try {
    seedManifest(root);
    const m = {
      key: '%X=.sha256',
      value: {
        author: '@alice.ed25519',
        sequence: 1,
        previous: null,
        content: { type: 'tribe', title: 'x' }
      }
    };
    const first = exportSsbLogToVolumes({ log: [m], volumesRoot: root });
    assert.equal(first.counts.tribes, 1);

    // El mismo mensaje ya aterrizado bajo OTRO corpus (mapeo anterior). El
    // lector resuelve cross-corpus (loader.mjs:133-139): replantarlo daría dos
    // ficheros para una clave.
    const enVotes = path.join(first.ssbRoot, 'votes', messageFileName('%X=.sha256'));
    fs.renameSync(path.join(first.ssbRoot, 'tribes', messageFileName('%X=.sha256')), enVotes);

    const second = exportSsbLogToVolumes({ log: [m], volumesRoot: root });
    assert.equal(second.added, 0);
    assert.equal(second.unchanged, 1);
    assert.equal(second.counts.tribes, 0, 'no se replanta en tribes');
    assert.equal(second.counts.votes, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── Fixture NUEVA por-feed ─────────────────────────────────────────────────

test('fixture por-feed: secuencias POR AUTOR, y el filtro de tipo deja un HUECO legítimo', () => {
  const log = JSON.parse(fs.readFileSync(FEED_FIXTURE, 'utf8'));
  const part = partitionExportable(log);
  assert.equal(part.total, 8);
  assert.equal(part.skipped, 2);
  assert.deepEqual(part.skippedReasons, { tipo_no_exportable: 1, contenido_cifrado: 1 });
  assert.equal(part.byCorpus.tribes.length, 2);
  assert.equal(part.byCorpus.parliament.length, 2);
  assert.equal(part.byCorpus.votes.length, 2);

  // Cada feed numera desde 1 y `previous` no cruza de feed — a diferencia de
  // `fixtures/ssb-log.json`, cuyo `sequence` es un contador GLOBAL.
  const porAutor = {};
  const autorDe = Object.fromEntries(log.map((m) => [m.key, m.value.author]));
  for (const m of log) {
    (porAutor[m.value.author] ??= []).push(m.value.sequence);
    if (m.value.previous !== null) {
      assert.equal(autorDe[m.value.previous], m.value.author, `previous cruzado en ${m.key}`);
    } else {
      assert.equal(m.value.sequence, 1, `previous=null con sequence≠1 en ${m.key}`);
    }
  }
  assert.deepEqual(porAutor['@alice.ed25519'], [1, 2, 3]);
  assert.deepEqual(porAutor['@bob.ed25519'], [1, 2, 3]);
  assert.deepEqual(porAutor['@carol.ed25519'], [1, 2]);

  // Y el HUECO: alice publica `post` en seq 2, que el exportador filtra, así
  // que el volumen recibe {1,3}. Es la razón medida por la que el driver SSB
  // NO exige contigüidad de secuencias.
  const seqsAterrizadas = part.byCorpus.tribes
    .filter((r) => r.value.author === '@alice.ed25519')
    .map((r) => r.value.sequence)
    .sort();
  assert.deepEqual(seqsAterrizadas, [1, 3]);
});

test('fixture por-feed: export completo válido contra el schema real ssb-manifest', () => {
  const root = tempRoot('zeus-ssb-feed-');
  try {
    seedManifest(root);
    const res = exportSsbLogFile({ logPath: FEED_FIXTURE, volumesRoot: root });
    assert.equal(res.ok, true);
    assert.deepEqual(res.counts, { tribes: 2, parliament: 2, votes: 2 });
    assert.equal(res.added, 6);
    assert.equal(res.manifest.totals.input, 8);
    assert.equal(res.manifest.totals.exported, 6);
    assert.equal(res.manifest.totals.skipped, 2);
    const schema = validate('ssb-manifest', res.manifest);
    assert.equal(schema.ok, true, JSON.stringify(schema.errors));
    // El nombre de cada fichero deriva de la clave: es lo que el lector busca.
    for (const corpus of SSB_CORPORA) {
      for (const name of fs.readdirSync(path.join(res.ssbRoot, corpus.path))) {
        const row = JSON.parse(fs.readFileSync(path.join(res.ssbRoot, corpus.path, name), 'utf8'));
        assert.equal(name, messageFileName(row.key));
      }
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

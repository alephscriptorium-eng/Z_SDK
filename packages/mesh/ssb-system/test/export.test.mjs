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
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
  foldRel,
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

test('CA-6b: cero material de identidad EN EL CORPUS DEL REPO (probe de BACKLOG:266, patrones declarados)', () => {
  // Alcance HONESTO, y el título lo dice: esto mide `src/` + `fixtures/` de
  // ESTE paquete —corpus que escribimos nosotros—, no el material que un pub
  // real emita ni el contenido exportado. Ver el test siguiente para el límite.
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
    //
    // ── DEPENDENCIA DECLARADA (WP-U253c) ─────────────────────────────────
    // Este monkey-patch sustituye una PROPIEDAD del objeto `fs`. Sólo alcanza
    // a quien lee esa propiedad EN EL MOMENTO DE LLAMAR. Medido en §U253c-3a:
    // ve `import fs from 'node:fs'` y `createRequire(...)('fs')`; NO ve
    // `import { writeFileSync } from 'node:fs'`, `import * as fs`, ni nada de
    // `node:fs/promises`. Que esta CA pase hoy depende de que `src/export.mjs`
    // use el default (`:114`) — no de que el export sea inocente.
    //
    // Esa dependencia no se deja implícita:
    // - §U253c-3d la GUARDA: declara la notación de cada fichero de `src/` y
    //   enrojece si cambia, ANTES de que esta CA se quede ciega en silencio;
    // - §U253c-3c mide LO MISMO sin depender de la notación, en un proceso
    //   hijo con hooks de cargador (`test/probe/`).
    // Censo de mutación: con `import * as fs` esta CA cae por su CONTROL (no
    // ve ninguna escritura); con una escritura oculta por import nombrado cae
    // por la comparación de bytes de abajo; y con una que reescriba bytes
    // IDÉNTICOS esta CA pasa VERDE mientras el manifiesto se escribe. Ese
    // último caso lo caza §U253c-3c y no lo caza esta. Está en el reporte.
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

/**
 * Predicado del censo estático: sobre-aproximación CONSERVADORA por fichero.
 *
 * WP-U253c lo re-mide y lo ensancha por DOS lados independientes, cada uno con
 * su ofensor rojo en la sección «WP-U253c» de más abajo:
 *
 * (1) LAS PRIMITIVAS. La lista heredada era sólo la cara SÍNCRONA de `node:fs`.
 *     Un `writeFile` de `node:fs/promises` contra `<root>/volumes.json` pasaba
 *     por delante del censo AUNQUE ESCRIBIERA EL TOKEN a la vista: el token
 *     casaba y la primitiva no. Se añade la cara `fs/promises`.
 *
 * (2) LAS ANCLAS DEL NOMBRE. Anclar en el literal `'volumes.json'` y en
 *     `MANIFEST_FILE_NAME` deja fuera dos notaciones que no necesitan escribir
 *     ninguno de los dos: llamar al localizador público `resolveManifestPath()`
 *     y montar el nombre por composición de piezas. Se añaden dos anclas más.
 *     La ancla `fragmento` (un literal `'volumes'` suelto) es deliberadamente
 *     grosera: sube el censo de 6 a 9 ficheros marcados y los tres nuevos son
 *     falsos positivos razonados en la ALLOWLIST. Ese es el precio elegido —
 *     un falso positivo cuesta una línea de allowlist; una ceguera no cuesta
 *     nada hasta el día que cuesta el manifiesto.
 *
 * Las anclas van SEPARADAS y con nombre a propósito: así el censo de mutación
 * (§WP-U253c-4) puede amputar una y exigir que el ofensor que la usaba quede
 * ciego. Con una sola regex monolítica eso no se puede medir.
 */
const PRIMITIVAS_DE_ESCRITURA =
  /\b(writeFileSync|appendFileSync|createWriteStream|rmSync|unlinkSync|renameSync|copyFileSync|truncateSync|writeFile|appendFile|rm|unlink|rename|copyFile|truncate)\b/;
/** @type {{ id: string, re: RegExp, porque: string }[]} */
const ANCLAS_DE_MANIFIESTO = [
  { id: 'literal', re: /(['"`])volumes\.json\1/, porque: 'el nombre, entrecomillado' },
  { id: 'constante', re: /\bMANIFEST_FILE_NAME\b/, porque: 'la constante pública de volumes-ops' },
  {
    id: 'localizador',
    re: /\bresolveManifestPath\b/,
    porque: 'el localizador público: devuelve la ruta sin que el nombre aparezca'
  },
  {
    id: 'fragmento',
    re: /(['"`])volumes\1/,
    porque: 'una PIEZA del nombre, para la composición de cadena'
  }
];
const TOKEN_DE_MANIFIESTO = {
  test: (source) => ANCLAS_DE_MANIFIESTO.some((a) => a.re.test(source))
};
function marcaEscritorDeManifiesto(source) {
  return PRIMITIVAS_DE_ESCRITURA.test(source) && TOKEN_DE_MANIFIESTO.test(source);
}

/** Directorios que el censo NO baja. Es una CEGUERA declarada, no un descuido. */
const SALTAR_POR_DEFECTO = new Set([
  'node_modules',
  'test',
  'tests',
  '__tests__',
  'fixtures',
  'dist',
  '.git'
]);
/** Extensiones que el censo mira. Todo lo demás le es invisible. */
const EXTENSIONES_CENSADAS = /\.(mjs|js|cjs)$/;

/**
 * Recorre un árbol y devuelve las rutas RELATIVAS marcadas por el censo.
 * Se extrae de CA-5c para que el censo pueda correrse también sobre árboles
 * SINTÉTICOS: así la lista de cegueras (§WP-U253c-5) se MIDE en vez de
 * prometerse en prosa.
 * @param {{ raices: {abs: string, rel: string}[], saltar?: Set<string>, extensiones?: RegExp, marca?: (s: string) => boolean }} opts
 * @returns {string[]}
 */
function censaArbol({
  raices,
  saltar = SALTAR_POR_DEFECTO,
  extensiones = EXTENSIONES_CENSADAS,
  marca = marcaEscritorDeManifiesto
}) {
  /** @type {string[]} */
  const marcados = [];
  const walk = (abs, rel) => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (saltar.has(entry.name)) continue;
      const childAbs = path.join(abs, entry.name);
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(childAbs, childRel);
      else if (entry.isFile() && extensiones.test(entry.name)) {
        if (marca(fs.readFileSync(childAbs, 'utf8'))) marcados.push(childRel);
      }
    }
  };
  for (const raiz of raices) if (fs.existsSync(raiz.abs)) walk(raiz.abs, raiz.rel);
  return marcados;
}

test('CA-5c · el escritor legado está muerto EN `src/` — el probe excluye `test/`, y ahí vive una copia', () => {
  // Honestidad sobre el alcance del probe de abajo: salta cualquier directorio
  // `test|tests|fixtures`, y este mismo fichero contiene una réplica VERBATIM
  // del escritor demolido (el contraste de CA-4). Esa copia recibe la ruta como
  // PARÁMETRO y solo apunta a un temporal del propio test: no es escritor vivo.
  // Pero la frase que se puede sostener es «muerto en `src/`», no «muerto».
  const probeVeElTest = ['test', 'tests', '__tests__', 'fixtures'].includes('test');
  assert.equal(probeVeElTest, true, 'el probe salta `test/` por diseño');
  const esteFichero = fs.readFileSync(path.join(PKG_ROOT, 'test', 'export.test.mjs'), 'utf8');
  assert.equal(marcaEscritorDeManifiesto(esteFichero), true, 'la copia existe y el predicado la vería');
  // Y en `src/` no queda ninguna: la función demolida no existe y no hay
  // escritura contra `configPath`. Lo que SÍ queda es prosa que cita el código
  // viejo en la nota de demolición — por eso esta asersión mira DEFINICIONES y
  // LLAMADAS, no menciones. El comportamiento lo prueba CA-5a por ruta derivada.
  const src = fs.readFileSync(path.join(PKG_ROOT, 'src', 'export.mjs'), 'utf8');
  assert.doesNotMatch(src, /function upsertVolumesJsonEntry/);
  assert.doesNotMatch(src, /upsertVolumesJsonEntry\s*\(/);
  assert.doesNotMatch(src, /writeFileSync\s*\(\s*configPath/);
});

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
      'solo lo nombra para abortar; probe dinámico CA-5a demuestra 0 escrituras contra él',
    // U206: arnés del CA local-first. SÍ escribe manifiestos, y a propósito:
    // siembra roots TEMPORALES (`mkdtempSync`) y, en sus vectores rojos, edita
    // a mano el `volumes.json` de un root temporal para demostrar que el
    // verificador de integridad lo caza (paso 4 `pathOverride`, paso 6 caso c).
    // Nunca toca un root vivo ni `VOLUMES/` del repo. Misma clase que
    // `smoke-env.mjs`: sembrador de arnés, no escritor de producción.
    'e2e/local-first-ca.mjs':
      'arnés U206: siembra y corrompe roots TEMPORALES para probar el gate; jamás un root vivo',

    // ── Los TRES que entran con WP-U253c, todos por el ancla `fragmento` ──
    // El ancla nueva marca un literal `'volumes'` suelto. Los tres siguientes
    // lo tienen por motivos legítimos y NINGUNO escribe `<root>/volumes.json`.
    // Se aceptan como el precio de ver la composición de cadena (ofensor C).
    // U201: el pipeline de import. Sí toca el manifiesto, pero SIEMPRE a través
    // de `sealManifest` (import.mjs:700), nunca con un `writeFileSync` propio;
    // el `writeFileSync` que casa la primitiva está en su docstring (:10), que
    // precisamente promete no usarlo. El `'volumes'` es el DIRECTORIO de datos
    // del pack (:221) y el id de schema (:399,:425).
    'packages/engine/volumes-ops/src/import.mjs':
      'escribe el manifiesto SOLO vía sealManifest; el `volumes` literal es el dir de datos del pack',
    // U206: adaptador startpack → pack. `PACK_DATA_DIR = 'volumes'` (:63) es el
    // fragmento; su único `writeFileSync` (:290) apunta a `<packRoot>/manifest.json`,
    // el DESCRIPTOR del pack — otro fichero, otro contrato.
    'packages/engine/volumes-ops/src/pack-adapter.mjs':
      'su writeFileSync apunta a <packRoot>/manifest.json (descriptor del pack), no al manifiesto del root',
    // U199/U204: volumes.state.json. Por contrato NUNCA entra en el hash del
    // manifiesto. El fragmento viene de un EJEMPLO JSON en su docstring (:20).
    'packages/engine/volumes-ops/src/state.mjs':
      'escribe volumes.state.json; el `volumes` literal está en un ejemplo JSON del docstring'
  };
  const marcados = censaArbol({
    raices: ['packages', 'scripts', 'e2e'].map((dir) => ({
      abs: path.join(MONOREPO_ROOT, dir),
      rel: dir
    }))
  });
  assert.deepEqual(marcados.sort(), Object.keys(ALLOWLIST).sort());
});

// ═══ WP-U253c · EL CENSO Y LA SONDA, RE-MEDIDOS ════════════════════════════
//
// Dos hallazgos sobre lo que U205 dejó montado, re-medidos aquí de cero:
//
// (1) El censo estático no veía tres notaciones de escritura contra el
//     manifiesto, y una cuarta se le escapaba por la lista de primitivas.
// (2) La sonda dinámica CA-5a pasa HOY porque `src/export.mjs` escribe
//     `import fs from 'node:fs'`. Con cualquiera de las otras dos notaciones
//     ESM, el monkey-patch no intercepta NADA y la sonda seguiría verde: una
//     guarda que se queda ciega sin un solo test rojo. Aquí se cierra por los
//     dos lados — sonda que no depende de la notación (§3a-3c) Y guarda que
//     enrojece si la notación cambia (§3d, §4).

const URL_VOLUMES_OPS = JSON.stringify(import.meta.resolve('@zeus/volumes-ops'));
const CORRER_SONDA = path.join(PKG_ROOT, 'test', 'probe', 'correr.mjs');

/**
 * Cada ofensor es un módulo `.mjs` REAL: se escribe a disco, se importa y se
 * ejecuta contra un root temporal. No son cadenas que imiten código; son
 * escritores vivos del manifiesto. Que el censo los marque sólo significa algo
 * si antes está probado que escriben de verdad (§1a).
 *
 * `A` y `B` importan el localizador PÚBLICO de `@zeus/volumes-ops`, que es
 * dependencia DECLARADA de este paquete. La evasión no necesita nada privado.
 */
const OFENSORES = {
  'N · ingenua — la única que el censo heredado ya veía': `
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
export function ataca(root, payload) {
  writeFileSync(join(root, 'volumes.json'), payload, 'utf8');
}
`,
  'A · indirección por el localizador público': `
import { writeFileSync } from 'node:fs';
import { resolveManifestPath } from ${URL_VOLUMES_OPS};
export const donde = () => resolveManifestPath();
export function ataca(root, payload) {
  writeFileSync(resolveManifestPath(), payload, 'utf8');
}
`,
  'B · alias de la primitiva Y del localizador': `
import { writeFileSync as escribeBytes } from 'node:fs';
import { resolveManifestPath as dondeVive } from ${URL_VOLUMES_OPS};
export const donde = () => dondeVive();
export function ataca(root, payload) {
  escribeBytes(dondeVive(), payload, 'utf8');
}
`,
  'C · composición de cadena — el literal nunca existe': `
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const PIEZAS = ['volumes', 'json'];
export function ataca(root, payload) {
  writeFileSync(join(root, PIEZAS.join('.')), payload, 'utf8');
}
`,
  'D · asíncrona por fs/promises, CON el token a la vista': `
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export async function ataca(root, payload) {
  await writeFile(join(root, 'volumes.json'), payload, 'utf8');
}
`
};

let semilla = 0;
/** Escribe una fuente a disco como módulo real y la importa. */
async function cargaModulo(fuente, prefijo = 'u253c-ofensor-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefijo));
  const abs = path.join(dir, `mod-${semilla++}.mjs`);
  fs.writeFileSync(abs, fuente, 'utf8');
  const mod = await import(pathToFileURL(abs).href);
  return { mod, limpia: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

/** El censo TAL COMO ESTABA antes de este WP. Copiado, no importado: es un fósil. */
const PRIMITIVAS_HEREDADAS =
  /\b(writeFileSync|appendFileSync|createWriteStream|rmSync|unlinkSync|renameSync|copyFileSync)\b/;
const TOKEN_HEREDADO = /(['"`])volumes\.json\1|MANIFEST_FILE_NAME/;
const marcaHeredada = (s) => PRIMITIVAS_HEREDADAS.test(s) && TOKEN_HEREDADO.test(s);
/** La propuesta que estaba ESCRITA para `:397`: añadir `|resolveManifestPath`. */
const TOKEN_PROPUESTO = /(['"`])volumes\.json\1|MANIFEST_FILE_NAME|resolveManifestPath/;
const marcaPropuesta = (s) => PRIMITIVAS_HEREDADAS.test(s) && TOKEN_PROPUESTO.test(s);

test('U253c-1a · los cinco ofensores son escritores VIVOS del manifiesto', async () => {
  const previo = process.env.ZEUS_VOLUMES_ROOT;
  for (const [nombre, fuente] of Object.entries(OFENSORES)) {
    const root = tempRoot('u253c-vivo-');
    const manifiesto = path.join(root, 'volumes.json');
    const { mod, limpia } = await cargaModulo(fuente);
    try {
      seedManifest(root);
      const antes = fs.readFileSync(manifiesto);
      // `A` y `B` resuelven la ruta por su cuenta: hay que darles el root.
      process.env.ZEUS_VOLUMES_ROOT = root;
      // CERROJO. `A` y `B` escriben DONDE LES DIGA el localizador público. Si
      // por lo que fuera resolviese fuera del root temporal —un `.env` del
      // repo, una caché— este test estaría machacando un manifiesto vivo. Se
      // comprueba ANTES de escribir, con el mismo resolutor que usará el
      // ofensor, y si no cuadra no se escribe nada.
      if (typeof mod.donde === 'function') {
        const objetivo = path.resolve(mod.donde());
        assert.equal(
          objetivo,
          path.resolve(manifiesto),
          `${nombre}: el localizador apunta FUERA del root temporal — abortando sin escribir`
        );
      }
      await mod.ataca(root, `{"secuestrado":"${nombre}"}\n`);
      const despues = fs.readFileSync(manifiesto);
      assert.notDeepEqual(despues, antes, `${nombre}: NO escribió — no es un ofensor, es un adorno`);
      assert.match(despues.toString('utf8'), /secuestrado/, `${nombre}: escribió otra cosa`);
    } finally {
      if (previo == null) delete process.env.ZEUS_VOLUMES_ROOT;
      else process.env.ZEUS_VOLUMES_ROOT = previo;
      limpia();
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('U253c-1b · matriz del censo: heredado 1/5 · propuesta escrita 3/5 · vigente 5/5', () => {
  /** Lo que cada predicado ve, ofensor a ofensor. Escrito, no inferido. */
  const ESPERADO = {
    'N · ingenua — la única que el censo heredado ya veía': { heredado: true, propuesta: true },
    'A · indirección por el localizador público': { heredado: false, propuesta: true },
    'B · alias de la primitiva Y del localizador': { heredado: false, propuesta: true },
    'C · composición de cadena — el literal nunca existe': { heredado: false, propuesta: false },
    'D · asíncrona por fs/promises, CON el token a la vista': { heredado: false, propuesta: false }
  };
  const medido = {};
  for (const [nombre, fuente] of Object.entries(OFENSORES)) {
    medido[nombre] = { heredado: marcaHeredada(fuente), propuesta: marcaPropuesta(fuente) };
    // Y el censo VIGENTE los caza a los cinco. Esa es la CA.
    assert.equal(marcaEscritorDeManifiesto(fuente), true, `el censo vigente NO ve a ${nombre}`);
  }
  assert.deepEqual(medido, ESPERADO);
  // La cuenta, explícita: la propuesta que estaba escrita cerraba dos de las
  // tres puertas nuevas y dejaba abiertas la composición de cadena y fs/promises.
  const cuenta = (f) => Object.values(OFENSORES).filter(f).length;
  assert.equal(cuenta(marcaHeredada), 1);
  assert.equal(cuenta(marcaPropuesta), 3);
  assert.equal(cuenta(marcaEscritorDeManifiesto), 5);
});

test('U253c-1c · cada ofensor entra por un ANCLA nombrada, y no por casualidad', () => {
  /** Qué ancla es la que lo caza. Si una deja de servir, se ve cuál. */
  const VECTOR = {
    'N · ingenua — la única que el censo heredado ya veía': ['literal'],
    'A · indirección por el localizador público': ['localizador'],
    'B · alias de la primitiva Y del localizador': ['localizador'],
    'C · composición de cadena — el literal nunca existe': ['fragmento'],
    'D · asíncrona por fs/promises, CON el token a la vista': ['literal']
  };
  // Nota medida: `fragmento` NO casa dentro de `'volumes.json'`, porque exige
  // la comilla de cierre pegada a `volumes`. No es un ancla más laxa que
  // englobe a `literal`: son dos anclas disjuntas, y por eso las dos hacen
  // falta. (Esta línea corrige una predicción que este mismo test tumbó.)
  const medido = {};
  for (const [nombre, fuente] of Object.entries(OFENSORES)) {
    medido[nombre] = ANCLAS_DE_MANIFIESTO.filter((a) => a.re.test(fuente)).map((a) => a.id);
  }
  assert.deepEqual(medido, VECTOR);
  // `C` es el que no tiene salvación por nombre: ni el literal completo ni la
  // constante ni el localizador aparecen. Sólo la pieza.
  assert.equal(/(['"`])volumes\.json\1/.test(OFENSORES['C · composición de cadena — el literal nunca existe']), false);
  assert.equal(/\bresolveManifestPath\b/.test(OFENSORES['C · composición de cadena — el literal nunca existe']), false);
});

test('U253c-2 · `fs/promises`: el ofensor D escribía el TOKEN y el censo no lo veía · CASO ROJO', () => {
  const D = OFENSORES['D · asíncrona por fs/promises, CON el token a la vista'];
  // El token estaba a la vista. Literalmente.
  assert.equal(TOKEN_HEREDADO.test(D), true, 'el token SÍ casaba con el censo heredado');
  // Y aun así el censo no lo marcaba, porque la lista de primitivas era sólo
  // la cara síncrona de `node:fs`. Esto es el caso rojo de la CA-2.
  assert.equal(PRIMITIVAS_HEREDADAS.test(D), false, 'la primitiva asíncrona no estaba en la lista');
  assert.equal(marcaHeredada(D), false);
  assert.equal(marcaPropuesta(D), false, 'añadir `|resolveManifestPath` no arregla esto: es otra puerta');
  // Con la cara `fs/promises` en las primitivas, entra.
  assert.equal(PRIMITIVAS_DE_ESCRITURA.test(D), true);
  assert.equal(marcaEscritorDeManifiesto(D), true);
  // Y `\bwriteFile\b` no es `writeFileSync` disfrazado: son dos anclas distintas.
  assert.equal(/\bwriteFileSync\b/.test('await writeFile(p, x);'), false);
  assert.equal(/\bwriteFile\b/.test('writeFileSync(p, x);'), false);
});

// ── §3 · LA SONDA DINÁMICA Y LA NOTACIÓN DE IMPORT ─────────────────────────

/**
 * Las cinco notaciones con las que un módulo puede llegar a una primitiva de
 * escritura. Cada una es un módulo real que se ejecuta.
 */
const NOTACIONES = {
  default: "import fs from 'node:fs';\nexport function escribe(p) { fs.writeFileSync(p, 'x'); }\n",
  named:
    "import { writeFileSync } from 'node:fs';\nexport function escribe(p) { writeFileSync(p, 'x'); }\n",
  namespace:
    "import * as fs from 'node:fs';\nexport function escribe(p) { fs.writeFileSync(p, 'x'); }\n",
  require:
    "import { createRequire } from 'node:module';\nconst req = createRequire(import.meta.url);\nconst fs = req('node:fs');\nexport function escribe(p) { fs.writeFileSync(p, 'x'); }\n",
  promises:
    "import { writeFile } from 'node:fs/promises';\nexport async function escribe(p) { await writeFile(p, 'x'); }\n"
};

test('U253c-3a · el monkey-patch de CA-5a sólo ve DOS de las cinco notaciones · MEDIDO', async () => {
  const destino = tempRoot('u253c-notacion-');
  /** @type {string[]} */
  const vistos = [];
  const original = fs.writeFileSync;
  try {
    // El monkey-patch exacto de CA-5a: sustituir la PROPIEDAD del objeto `fs`.
    fs.writeFileSync = (target, ...rest) => {
      vistos.push(path.resolve(String(target)));
      return original(target, ...rest);
    };
    const medido = {};
    for (const [nombre, fuente] of Object.entries(NOTACIONES)) {
      const { mod, limpia } = await cargaModulo(fuente, 'u253c-notacion-mod-');
      const objetivo = path.join(destino, `${nombre}.txt`);
      try {
        await mod.escribe(objetivo);
        medido[nombre] = vistos.includes(path.resolve(objetivo));
        assert.ok(fs.existsSync(objetivo), `control: ${nombre} debe haber escrito de verdad`);
      } finally {
        limpia();
      }
    }
    // Este es el hallazgo, medido y no recordado. Un monkey-patch de `fs` sólo
    // alcanza a quien LEE la propiedad en el momento de llamar: el default de
    // `node:fs` (que es el mismo objeto CJS) y `createRequire`. Un binding
    // nombrado queda congelado en el import, un namespace ESM es inmutable, y
    // `fs/promises` es otro módulo entero.
    assert.deepEqual(medido, {
      default: true,
      named: false,
      namespace: false,
      require: true,
      promises: false
    });
  } finally {
    fs.writeFileSync = original;
    fs.rmSync(destino, { recursive: true, force: true });
  }
});

/** Lanza la sonda por hooks en un proceso hijo y devuelve su parte. */
function correSonda(modo, ...args) {
  const dirParte = fs.mkdtempSync(path.join(os.tmpdir(), 'u253c-parte-'));
  const parte = path.join(dirParte, 'parte.json');
  const r = spawnSync(process.execPath, [CORRER_SONDA, modo, parte, ...args], {
    encoding: 'utf8'
  });
  assert.equal(r.status, 0, `la sonda salió ${r.status}: ${r.stderr || r.stdout}`);
  const leido = JSON.parse(fs.readFileSync(parte, 'utf8'));
  fs.rmSync(dirParte, { recursive: true, force: true });
  assert.equal(leido.ok, true, `la sonda reportó error: ${leido.error}`);
  return leido;
}

test('U253c-3b · la sonda por HOOKS ve las CINCO notaciones · no depende de ninguna', () => {
  const dirVictimas = fs.mkdtempSync(path.join(os.tmpdir(), 'u253c-victimas-'));
  const dirDestino = fs.mkdtempSync(path.join(os.tmpdir(), 'u253c-destino-'));
  try {
    for (const [nombre, fuente] of Object.entries(NOTACIONES)) {
      fs.writeFileSync(path.join(dirVictimas, `victima-${nombre}.mjs`), fuente, 'utf8');
    }
    const parte = correSonda('notaciones', dirVictimas, dirDestino);
    const medido = {};
    for (const nombre of Object.keys(NOTACIONES)) {
      const objetivo = path.resolve(path.join(dirDestino, `victima-${nombre}.txt`));
      medido[nombre] = parte.destinos.some((d) => d.destino === objetivo);
      assert.ok(fs.existsSync(objetivo), `control: ${nombre} debe haber escrito de verdad`);
    }
    assert.deepEqual(medido, {
      default: true,
      named: true,
      namespace: true,
      require: true,
      promises: true
    });
    // Y ninguna de las dos mitades sola basta: los hooks ESM no gobiernan la
    // resolución CJS, así que `require` sólo cae por el parche del objeto CJS;
    // y `named`/`namespace`/`promises` sólo caen por los hooks. Los orígenes
    // vienen etiquetados en el parte, así que esto se comprueba, no se cree.
    const porOrigen = new Set(parte.destinos.map((d) => d.origen));
    assert.ok(porOrigen.has('cjs'), 'el parche CJS tiene que haber anotado algo');
    assert.ok(porOrigen.has('fs'), 'los hooks sobre node:fs tienen que haber anotado algo');
    assert.ok(porOrigen.has('fs/promises'), 'los hooks sobre node:fs/promises también');
  } finally {
    fs.rmSync(dirVictimas, { recursive: true, force: true });
    fs.rmSync(dirDestino, { recursive: true, force: true });
  }
});

test('U253c-3c · export completo bajo la sonda por HOOKS: 0 escrituras contra el manifiesto', () => {
  const root = tempRoot('u253c-sonda-hooks-');
  try {
    seedManifest(root);
    const manifiesto = path.resolve(path.join(root, 'volumes.json'));
    const antes = fs.readFileSync(manifiesto);
    const parte = correSonda('export', root, FIXTURE);

    assert.ok(parte.destinos.length > 0, 'control: el export SÍ escribe');
    const contra = parte.destinos.filter((d) => d.destino === manifiesto);
    assert.deepEqual(contra, [], `escrituras contra el manifiesto: ${JSON.stringify(contra)}`);
    assert.deepEqual(fs.readFileSync(manifiesto), antes, 'el sello no se movió');
    // Esta es la afirmación que CA-5a NO podía hacer: el resultado no depende
    // de con qué notación `src/export.mjs` importe `node:fs`. Hoy usa el
    // default; con named, namespace o fs/promises esta sonda mediría igual.
    // Lo que esta sonda NO promete: mide la LLAMADA, no la TERMINACIÓN.
    const origenes = new Set(parte.destinos.map((d) => d.origen));
    assert.ok(origenes.size > 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

/**
 * Clasifica cómo un fuente llega a `node:fs`. Es la pregunta que decide si el
 * monkey-patch en proceso de CA-5a puede verlo o no.
 * @param {string} fuente
 * @returns {string[]} notaciones halladas, ordenadas
 */
function clasificaNotacionFs(fuente) {
  const halladas = new Set();
  if (/^\s*import\s+[A-Za-z_$][\w$]*\s*(?:,\s*\{[^}]*\}\s*)?from\s*['"](?:node:)?fs['"]/m.test(fuente))
    halladas.add('default');
  if (/^\s*import\s*\{[^}]*\}\s*from\s*['"](?:node:)?fs['"]/m.test(fuente)) halladas.add('named');
  if (/^\s*import\s*\*\s*as\s+[A-Za-z_$][\w$]*\s*from\s*['"](?:node:)?fs['"]/m.test(fuente))
    halladas.add('namespace');
  if (/['"](?:node:)?fs\/promises['"]/.test(fuente)) halladas.add('promises');
  if (/createRequire\s*\(/.test(fuente) && /['"](?:node:)?fs['"]/.test(fuente))
    halladas.add('require');
  return [...halladas].sort();
}

/** Las notaciones que el monkey-patch en proceso SÍ intercepta (medido en §3a). */
const INTERCEPTABLES_EN_PROCESO = new Set(['default', 'require']);

test('U253c-3d · GUARDA: la dependencia de CA-5a sobre la notación queda DECLARADA', () => {
  // CA-5a se queda ciega EN SILENCIO si un fichero de `src/` cambia su forma de
  // importar `node:fs`. Esta guarda convierte ese silencio en un test rojo.
  // La tabla es el contrato: cualquier alta, baja o cambio de notación la parte.
  const NOTACION_DECLARADA = {
    'export.mjs': ['default'],
    'loader.mjs': ['default'],
    'sync-cli.mjs': ['default']
  };
  const medido = {};
  for (const nombre of fs.readdirSync(path.join(PKG_ROOT, 'src')).sort()) {
    if (!/\.(mjs|js|cjs)$/.test(nombre)) continue;
    const fuente = fs.readFileSync(path.join(PKG_ROOT, 'src', nombre), 'utf8');
    const notaciones = clasificaNotacionFs(fuente);
    if (notaciones.length) medido[nombre] = notaciones;
  }
  assert.deepEqual(
    medido,
    NOTACION_DECLARADA,
    'cambió cómo `src/` importa node:fs — revisa si CA-5a sigue viendo algo'
  );
  // Y la consecuencia, dicha en voz alta: todas son interceptables por el
  // monkey-patch. El día que una deje de serlo, la línea de arriba enrojece
  // ANTES de que CA-5a se quede ciega en silencio.
  for (const [fichero, notaciones] of Object.entries(medido)) {
    for (const n of notaciones) {
      assert.ok(
        INTERCEPTABLES_EN_PROCESO.has(n),
        `${fichero} usa la notación \`${n}\`, que CA-5a NO intercepta`
      );
    }
  }
});

test('U253c-4a · censo de mutación · cambiar la notación de import pone ROJA la guarda', () => {
  const original = fs.readFileSync(path.join(PKG_ROOT, 'src', 'export.mjs'), 'utf8');
  assert.deepEqual(clasificaNotacionFs(original), ['default'], 'control: hoy es el default');
  const MUTANTES = {
    named: "import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';",
    namespace: "import * as fs from 'node:fs';",
    promises: "import { writeFile as escribe } from 'node:fs/promises';"
  };
  for (const [esperado, linea] of Object.entries(MUTANTES)) {
    const mutado = original.replace("import fs from 'node:fs';", linea);
    assert.notEqual(mutado, original, `control: la mutación \`${esperado}\` se aplicó`);
    const notaciones = clasificaNotacionFs(mutado);
    assert.deepEqual(notaciones, [esperado], `la guarda debe LEER la notación nueva`);
    // Y la guarda la rechaza: ninguna de las tres es interceptable en proceso.
    assert.equal(
      notaciones.every((n) => INTERCEPTABLES_EN_PROCESO.has(n)),
      false,
      `la guarda dejaría pasar \`${esperado}\` — entonces no guarda nada`
    );
  }
});

test('U253c-4b · censo de mutación · amputar un ancla o una primitiva ciega a su ofensor', () => {
  /** Qué ofensor deja de verse si se quita cada ancla. Uno a uno. */
  const AMPUTACIONES = {
    literal: [
      'N · ingenua — la única que el censo heredado ya veía',
      'D · asíncrona por fs/promises, CON el token a la vista'
    ],
    localizador: [
      'A · indirección por el localizador público',
      'B · alias de la primitiva Y del localizador'
    ],
    fragmento: ['C · composición de cadena — el literal nunca existe']
  };
  for (const [ancla, cegados] of Object.entries(AMPUTACIONES)) {
    const restantes = ANCLAS_DE_MANIFIESTO.filter((a) => a.id !== ancla);
    const mutilado = (s) => PRIMITIVAS_DE_ESCRITURA.test(s) && restantes.some((a) => a.re.test(s));
    for (const nombre of cegados) {
      assert.equal(
        mutilado(OFENSORES[nombre]),
        false,
        `sin el ancla \`${ancla}\` el censo DEBERÍA quedarse ciego a ${nombre}; no lo hace, así que esa ancla no es la que lo caza`
      );
      assert.equal(marcaEscritorDeManifiesto(OFENSORES[nombre]), true);
    }
  }
  // Y la amputación de la cara `fs/promises` de las primitivas ciega a D.
  const D = OFENSORES['D · asíncrona por fs/promises, CON el token a la vista'];
  assert.equal(PRIMITIVAS_HEREDADAS.test(D), false);
  assert.equal(marcaEscritorDeManifiesto(D), true);
});

// ── §5 · LO QUE ESTE CENSO SIGUE SIN VER ───────────────────────────────────

/**
 * La lista de cegueras, MEDIDA. Cada entrada es un escritor real del manifiesto
 * que el censo vigente NO marca. Escribirlas en prosa sería una promesa; aquí
 * cada una tiene que seguir siendo invisible o el test enrojece — de modo que
 * si un día una deja de ser ceguera, se sabe.
 *
 * Un censo que no declara su ceguera es peor que uno que la declara, porque
 * invita a confiar. Esta es la declaración, y es ejecutable.
 */
const CEGUERAS_DEL_CENSO = {
  'nombre montado sin NINGÚN literal (ni la pieza `volumes` aparece)': `
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const N = ['v', 'o', 'l', 'u', 'm', 'e', 's'].join('') + String.fromCharCode(46) + 'js' + 'on';
export function ataca(root, payload) { writeFileSync(join(root, N), payload, 'utf8'); }
`,
  'primitiva alcanzada por índice COMPUTADO (su nombre nunca se escribe)': `
import fs from 'node:fs';
import { join } from 'node:path';
const K = 'write' + 'File' + 'Sync';
export function ataca(root, payload) { fs[K](join(root, 'volumes.json'), payload, 'utf8'); }
`,
  // Medido, no supuesto: la primera versión de esta muestra llevaba el
  // `writeFileSync` LITERAL dentro del `-e`, y el censo la marcaba. El test
  // la tumbó. La primitiva tiene que montarse también aquí; lo que este caso
  // añade de propio es el CRUCE DE PROCESO, que ciega además a la sonda
  // dinámica — se mide aparte, en §5e.
  'escritura delegada a un PROCESO HIJO (ni la primitiva ni el proceso se ven)': `
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const CODIGO = 'require("fs")["write" + "File" + "Sync"](process.argv[1], process.argv[2])';
export function ataca(root, payload) {
  execFileSync(process.execPath, ['-e', CODIGO, join(root, 'volumes.json'), payload]);
}
`
};

test('U253c-5a · las tres cegueras por NOTACIÓN son escritores vivos e INVISIBLES', async () => {
  for (const [nombre, fuente] of Object.entries(CEGUERAS_DEL_CENSO)) {
    // (a) el censo no las ve …
    assert.equal(marcaEscritorDeManifiesto(fuente), false, `${nombre}: ya NO es ceguera — actualiza la lista`);
    // (b) … y sin embargo escriben el manifiesto de verdad.
    const root = tempRoot('u253c-ciego-');
    const { mod, limpia } = await cargaModulo(fuente, 'u253c-ciego-mod-');
    try {
      seedManifest(root);
      const manifiesto = path.join(root, 'volumes.json');
      const antes = fs.readFileSync(manifiesto);
      await mod.ataca(root, `{"invisible":"${nombre.slice(0, 20)}"}\n`);
      assert.notDeepEqual(
        fs.readFileSync(manifiesto),
        antes,
        `${nombre}: no escribió — entonces no prueba ninguna ceguera`
      );
    } finally {
      limpia();
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('U253c-5b · ceguera por REPARTO entre ficheros: el censo es por FICHERO, no por flujo', async () => {
  // El censo es co-ocurrencia POR FICHERO. Partir el ofensor en dos módulos —
  // uno que tiene el nombre y ninguna primitiva, otro que tiene la primitiva y
  // ningún nombre — lo hace invisible sin ninguna astucia de notación.
  const RUTA = `
import { join } from 'node:path';
export const donde = (root) => join(root, 'volumes.json');
`;
  const ESCRITOR = `
import { writeFileSync } from 'node:fs';
export function escribeEn(ruta, payload) { writeFileSync(ruta, payload, 'utf8'); }
`;
  assert.equal(marcaEscritorDeManifiesto(RUTA), false, 'el que sabe el nombre no escribe');
  assert.equal(marcaEscritorDeManifiesto(ESCRITOR), false, 'el que escribe no sabe el nombre');
  // Y juntos escriben el manifiesto.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'u253c-reparto-'));
  const root = tempRoot('u253c-reparto-root-');
  try {
    fs.writeFileSync(path.join(dir, 'ruta.mjs'), RUTA, 'utf8');
    fs.writeFileSync(path.join(dir, 'escritor.mjs'), ESCRITOR, 'utf8');
    const { donde } = await import(pathToFileURL(path.join(dir, 'ruta.mjs')).href);
    const { escribeEn } = await import(pathToFileURL(path.join(dir, 'escritor.mjs')).href);
    seedManifest(root);
    const antes = fs.readFileSync(path.join(root, 'volumes.json'));
    escribeEn(donde(root), '{"repartido":true}\n');
    assert.notDeepEqual(fs.readFileSync(path.join(root, 'volumes.json')), antes);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('U253c-5c · ceguera por ALCANCE: directorios saltados y extensiones no censadas', () => {
  // Se mide sobre un árbol SINTÉTICO con el MISMO recorrido que usa CA-5c.
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'u253c-alcance-'));
  const OFENSOR = OFENSORES['N · ingenua — la única que el censo heredado ya veía'];
  try {
    // (a) un escritor vivo en cada directorio que el censo salta
    for (const dir of ['test', 'tests', '__tests__', 'fixtures', 'dist', 'node_modules']) {
      fs.mkdirSync(path.join(raiz, dir), { recursive: true });
      fs.writeFileSync(path.join(raiz, dir, 'escritor.mjs'), OFENSOR, 'utf8');
    }
    // (b) el mismo escritor con extensiones que el censo no mira
    for (const ext of ['ts', 'mts', 'cts', 'jsx', 'tsx']) {
      fs.writeFileSync(path.join(raiz, `escritor.${ext}`), OFENSOR, 'utf8');
    }
    assert.deepEqual(
      censaArbol({ raices: [{ abs: raiz, rel: '' }] }),
      [],
      'el censo no marcó NADA de esto — así es como está construido, y por eso se declara'
    );
    // Control: el mismo fichero, en un sitio y con una extensión censados, SÍ sale.
    fs.writeFileSync(path.join(raiz, 'escritor.mjs'), OFENSOR, 'utf8');
    assert.deepEqual(censaArbol({ raices: [{ abs: raiz, rel: '' }] }), ['escritor.mjs']);
  } finally {
    fs.rmSync(raiz, { recursive: true, force: true });
  }
});

test('U253c-5d · ceguera por NATURALEZA: el censo es estático — no sabe si la línea corre', () => {
  // Un fichero marcado puede no escribir NUNCA (por eso existe la ALLOWLIST:
  // tres de sus nueve entradas son falsos positivos razonados) …
  const NUNCA_CORRE = `
import { writeFileSync } from 'node:fs';
if (false) { writeFileSync(join(root, 'volumes.json'), x); }
`;
  assert.equal(marcaEscritorDeManifiesto(NUNCA_CORRE), true, 'marcado, y no escribe jamás');
  // … y el censo tampoco dice nada sobre CUÁNDO termina una escritura. Eso no
  // es un defecto del censo: es que no es su pregunta. La pregunta «¿escribió?»
  // la responde la sonda dinámica (§3c); la pregunta «¿ya terminó?» no la
  // responde ninguna de las dos, y no se afirma que la respondan.
  const raices = ['packages', 'scripts', 'e2e'];
  const NO_BARRIDAS = fs
    .readdirSync(MONOREPO_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !raices.includes(e.name))
    .map((e) => e.name)
    .sort();
  // Se afirma sólo esto: hay raíces del repo que el censo NO baja, y son estas.
  assert.ok(NO_BARRIDAS.includes('examples'), 'examples/ no está censado');
  assert.ok(NO_BARRIDAS.includes('test'), 'test/ del repo no está censado');
  assert.ok(NO_BARRIDAS.length > 0);
});

test('U253c-5e · el CRUCE DE PROCESO ciega también a la sonda dinámica, a las dos mitades', () => {
  // La sonda de §3 sustituye módulos y parchea objetos DENTRO de su proceso.
  // Una escritura hecha por un proceso hijo no pasa por ninguno de los dos.
  // Esto no es un fallo a corregir: es el límite, y se mide para que conste.
  const VICTIMA = `
import { execFileSync } from 'node:child_process';
const CODIGO = 'require("fs")["write" + "File" + "Sync"](process.argv[1], "x")';
export function escribe(p) { execFileSync(process.execPath, ['-e', CODIGO, p]); }
`;
  const dirVictimas = fs.mkdtempSync(path.join(os.tmpdir(), 'u253c-nieto-'));
  const dirDestino = fs.mkdtempSync(path.join(os.tmpdir(), 'u253c-nieto-dst-'));
  try {
    fs.writeFileSync(path.join(dirVictimas, 'victima-hijo.mjs'), VICTIMA, 'utf8');
    const parte = correSonda('notaciones', dirVictimas, dirDestino);
    const objetivo = path.resolve(path.join(dirDestino, 'victima-hijo.txt'));
    // Control duro: la escritura OCURRIÓ.
    assert.ok(fs.existsSync(objetivo), 'control: el nieto tiene que haber escrito');
    // Y ni los hooks ESM ni el parche CJS la anotaron.
    assert.equal(
      parte.destinos.some((d) => d.destino === objetivo),
      false,
      'la sonda vio una escritura de otro proceso — entonces esta ceguera ya no existe'
    );
    // Y el censo estático tampoco la ve: la primitiva va montada.
    assert.equal(marcaEscritorDeManifiesto(VICTIMA), false);
  } finally {
    fs.rmSync(dirVictimas, { recursive: true, force: true });
    fs.rmSync(dirDestino, { recursive: true, force: true });
  }
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

test('NIVEL 1: la POSICIÓN de feed también es única en el export (bifurcación, dentro del volcado y contra el volumen)', () => {
  const root = tempRoot('zeus-ssb-posicion-');
  try {
    seedManifest(root);
    const uno = {
      key: '%p1=.sha256',
      value: { author: '@alice.ed25519', sequence: 1, previous: null, content: { type: 'tribe', t: 'a' } }
    };
    const gemelo = {
      key: '%p2=.sha256',
      value: { author: '@alice.ed25519', sequence: 1, previous: null, content: { type: 'tribe', t: 'b' } }
    };
    // (a) dentro del MISMO volcado: dos claves distintas en (@alice, 1).
    assert.throws(
      () => exportSsbLogToVolumes({ log: [uno, gemelo], volumesRoot: root }),
      /posicion_duplicada_en_log/
    );
    assert.ok(!fs.existsSync(path.join(root, 'DISK_04', 'SSB', 'tribes', messageFileName('%p1=.sha256'))));

    // (b) contra el volumen ya aterrizado.
    const first = exportSsbLogToVolumes({ log: [uno], volumesRoot: root });
    assert.equal(first.added, 1);
    const bytes = fs.readFileSync(path.join(first.ssbRoot, 'tribes', messageFileName('%p1=.sha256')));
    assert.throws(
      () => exportSsbLogToVolumes({ log: [gemelo], volumesRoot: root }),
      /posicion_ocupada/
    );
    assert.deepEqual(
      fs.readFileSync(path.join(first.ssbRoot, 'tribes', messageFileName('%p1=.sha256'))),
      bytes
    );
    assert.ok(!fs.existsSync(path.join(first.ssbRoot, 'tribes', messageFileName('%p2=.sha256'))));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('NIVEL 1: la ruta canónica es única EN EL FS, no solo como cadena (colisión por CAJA)', () => {
  // `messageFileName` es inyectiva como CADENA y NO como RUTA: base64url
  // distingue la caja y NTFS/APFS no. Sin esta guarda el export escribía dos
  // veces sobre EL MISMO fichero y `added` decía dos: pérdida silenciosa con un
  // conteo que miente. Mismo defecto y misma regla que en el driver.
  const CAJA_A = '%vg9Wb079DoMD5hNnObxZyKEgRVCU4O7y+OoW4InJljw==.sha256';
  const CAJA_B = '%vM9Wb079DoMD5hNnObxZyKEgRVCU4O7y+OoW4InJljw==.sha256';
  assert.notEqual(messageFileName(CAJA_A), messageFileName(CAJA_B));
  assert.equal(foldRel(messageFileName(CAJA_A)), foldRel(messageFileName(CAJA_B)));

  const root = tempRoot('zeus-ssb-caja-');
  try {
    seedManifest(root);
    const mk = (key, author) => ({
      key,
      value: { author, sequence: 1, previous: null, content: { type: 'tribe' } }
    });
    // (a) las dos en el MISMO volcado.
    assert.throws(
      () => exportSsbLogToVolumes({ log: [mk(CAJA_A, '@a.ed25519'), mk(CAJA_B, '@b.ed25519')], volumesRoot: root }),
      /colision_de_caja/
    );
    const ssbRoot = path.join(root, 'DISK_04', 'SSB');
    assert.equal(
      fs.existsSync(path.join(ssbRoot, 'tribes')) ? fs.readdirSync(path.join(ssbRoot, 'tribes')).length : 0,
      0,
      'aborta en pase dry: ni la primera se escribe'
    );

    // (b) la segunda contra el volumen ya aterrizado.
    const first = exportSsbLogToVolumes({ log: [mk(CAJA_A, '@a.ed25519')], volumesRoot: root });
    assert.equal(first.added, 1);
    const bytes = fs.readFileSync(path.join(ssbRoot, 'tribes', messageFileName(CAJA_A)));
    assert.throws(
      () => exportSsbLogToVolumes({ log: [mk(CAJA_B, '@b.ed25519')], volumesRoot: root }),
      /colision_de_caja/
    );
    assert.deepEqual(
      fs.readFileSync(path.join(ssbRoot, 'tribes', messageFileName(CAJA_A))),
      bytes,
      'el mensaje que ya vivía, intacto'
    );
    assert.equal(fs.readdirSync(path.join(ssbRoot, 'tribes')).length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('NIVEL 1: sin coordenada de feed el mensaje NO entra — antes aterrizaba y volvía el volumen inimportable', () => {
  const root = tempRoot('zeus-ssb-coords-');
  try {
    seedManifest(root);
    const sinCoords = { key: '%q1=.sha256', value: { content: { type: 'tribe' } } };
    const sano = {
      key: '%q2=.sha256',
      value: { author: '@alice.ed25519', sequence: 1, previous: null, content: { type: 'tribe' } }
    };
    assert.equal(classifyMessageDetailed(sinCoords).reason, SKIP_REASONS.COORDENADA_DE_FEED_AUSENTE);
    // Discrimina: secuencia 0 o autor vacío tampoco valen.
    assert.equal(
      classifyMessageDetailed({ key: '%q3', value: { author: '@a', sequence: 0, content: { type: 'tribe' } } }).reason,
      SKIP_REASONS.COORDENADA_DE_FEED_AUSENTE
    );

    const res = exportSsbLogToVolumes({ log: [sinCoords, sano], volumesRoot: root });
    assert.equal(res.added, 1);
    assert.equal(res.skippedReasons.coordenada_de_feed_ausente, 1);
    assert.ok(!fs.existsSync(path.join(res.ssbRoot, 'tribes', messageFileName('%q1=.sha256'))));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('NIVEL 1: un volumen con layout inválido bloquea el sync (mismo criterio que el driver)', () => {
  const root = tempRoot('zeus-ssb-layout-');
  try {
    seedManifest(root);
    const m = {
      key: '%r1=.sha256',
      value: { author: '@alice.ed25519', sequence: 1, previous: null, content: { type: 'tribe' } }
    };
    const first = exportSsbLogToVolumes({ log: [m], volumesRoot: root });
    // Nombre que no deriva de la clave: para `loadSsbMessage` no existe.
    fs.renameSync(
      path.join(first.ssbRoot, 'tribes', messageFileName('%r1=.sha256')),
      path.join(first.ssbRoot, 'tribes', 'legado.json')
    );
    assert.throws(
      () => exportSsbLogToVolumes({ log: [m], volumesRoot: root }),
      /layout_invalido_en_volumen[\s\S]*fuera_de_layout[\s\S]*esperado/
    );
    // Sigue sin haber una segunda copia: aborta en pase dry.
    assert.equal(fs.readdirSync(path.join(first.ssbRoot, 'tribes')).length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('NIVEL 2: la cadena se MIDE y se DECLARA, no se tira dato (asimetría deliberada con el import)', () => {
  const log = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const part = partitionExportable(log);
  // La fixture del repo tiene contador GLOBAL y `previous` que cruza de feed.
  assert.ok(part.feedIncoherencias.length > 0);
  const motivos = new Set(part.feedIncoherencias.map((i) => i.motivo));
  assert.ok(motivos.has('previous_null_con_sequence_distinta_de_1'));
  assert.ok(motivos.has('previous_de_otro_feed'));
  // Y aun así se exporta ENTERA: no se descarta gobernanza por una cadena que
  // el productor numeró mal. El pack de ese árbol SÍ lo rechaza el driver.
  assert.equal(part.byCorpus.tribes.length, 2);
  assert.equal(part.byCorpus.parliament.length, 5);
  assert.equal(part.byCorpus.votes.length, 2);
  // La fixture NUEVA, en cambio, es coherente: cero incoherencias.
  const feedLog = JSON.parse(fs.readFileSync(FEED_FIXTURE, 'utf8'));
  assert.deepEqual(partitionExportable(feedLog).feedIncoherencias, []);
});

test('m2: el sidecar NOMBRA la diferencia entre lo exportado y lo que hay en el volumen (huérfanos)', () => {
  const root = tempRoot('zeus-ssb-huerfanos-');
  try {
    seedManifest(root);
    const a = {
      key: '%h1=.sha256',
      value: { author: '@alice.ed25519', sequence: 1, previous: null, content: { type: 'tribe' } }
    };
    const b = {
      key: '%h2=.sha256',
      value: { author: '@alice.ed25519', sequence: 2, previous: '%h1=.sha256', content: { type: 'tribe' } }
    };
    const first = exportSsbLogToVolumes({ log: [a, b], volumesRoot: root });
    assert.equal(first.manifest.totals.orphans, 0, 'primer sync: todo lo del volumen viene del volcado');

    // Segundo volcado con ventana más corta (solo trae `b`). Antes de U205 el
    // borrado destructivo hacía concordar `exported` y `files` por construcción;
    // al dejar de borrar dejan de concordar, y el sidecar lo DICE en vez de
    // callarlo. El huérfano NO es un error: un mensaje SSB es inmutable y un
    // feed no se despublica.
    const second = exportSsbLogToVolumes({ log: [b], volumesRoot: root });
    assert.equal(second.manifest.totals.input, 1);
    assert.equal(second.manifest.totals.exported, 1);
    assert.equal(second.manifest.totals.volumeFiles, 2);
    assert.equal(second.manifest.totals.orphans, 1, 'la diferencia tiene nombre');
    assert.equal(second.counts.tribes, 2);
    const schema = validate('ssb-manifest', second.manifest);
    assert.equal(schema.ok, true, JSON.stringify(schema.errors));
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

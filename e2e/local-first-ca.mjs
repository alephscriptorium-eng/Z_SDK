/**
 * CA LOCAL-FIRST + RÉPLICA A→B — runner de los 7 pasos (WP-U206).
 *
 *   node e2e/local-first-ca.mjs                → 7 pasos verdes, exit 0
 *   node e2e/local-first-ca.mjs --legado       → el paso 6 usa la maquinaria
 *                                                ANTERIOR: la corrupción NO se
 *                                                detecta y el runner sale ≠0.
 *                                                Es la prueba de que el paso 6
 *                                                construye algo.
 *   node e2e/local-first-ca.mjs --json         → reporte JSON por stdout
 *
 * Requiere `ZEUS_GAMES_LIBRARY` apuntando al mundo hermano (el pozo se lee en
 * SOLO LECTURA). Falla ruidoso si falta: el fallback de `games-root.mjs:18,23`
 * busca un directorio llamado `Z_SDK-games-library`, que no es el nuestro.
 *
 * ── LA SHAPE DEL CA: DOS VOLÚMENES, Y POR QUÉ ────────────────────────────
 *
 * · `forces` (los 8 ficheros del `startpack-pozo`, familia FORCES) sostiene
 *   los pasos 1-4, 6 y 7.
 * · `lineas` (fixture canónica de linea-kit + sidecars sintéticos, familia
 *   LINEAS) sostiene EL PASO 5.
 *
 * El paso 5 necesita otro volumen porque FORCES **por diseño no tiene camino
 * de divergencia**: es RO-inmutable y una unidad que difiere es
 * `colision_force`, que aborta (driver-forces.mjs:200-207). Pedirle
 * «divergencia reportada» al pozo es pedir lo que la familia se niega a
 * hacer: el paso sería infalsable.
 *
 * Se elige LINEAS y no FIREHOSE porque LINEAS da LAS DOS conductas del paso 5
 * en un solo volumen —divergencia reportada (`contenido_distinto`,
 * driver-lineas.mjs:185-190) y curación intocable (`curacion_protegida`,
 * :166-173, predicado real `isCuratedSidecarPath`)— y su fixture es canónica
 * y vive en este árbol. FIREHOSE sólo aporta la primera. El volumen `ssb` NO
 * entra: no hay fixture SSB válida (decisión ⑧-bis.3).
 *
 * ── RÉPLICA A→B ES LOCAL ────────────────────────────────────────────────
 * Dos raíces en directorios temporales de ESTA máquina (decisión ⑨: el VPS
 * sigue DEFERRED). «Réplica» aquí = el mismo material medido igual en dos
 * rutas. Cero host remoto, cero Docker.
 *
 * ── QUÉ SE COMPARA EN EL PASO 4, Y QUÉ NO ───────────────────────────────
 * Dos raíces en rutas distintas DIVERGEN POR DISEÑO en los campos de ruta
 * absoluta: `measureAllVolumes()` devuelve `volumesRoot` (measure.mjs:140) y,
 * por volumen, `absPath` (measure.mjs:85). Un `deepEqual` A vs B fallaría
 * siempre y no probaría nada. Se comparan SÓLO los campos de contenido, y se
 * declaran aquí: por volumen `disk`, `label`, `files`, `bytes`, `missing`; por
 * corpus `id`, `path`, `label`, `files`, `bytes`, `missing`; y los totales
 * `files`/`bytes`. Se ASEVERA ADEMÁS que `volumesRoot` de A y de B difieren,
 * para que quede probado que la comparación no es trivial.
 *
 * ── PROCEDENCIA DEL DOCUMENTO DEL CERCO ─────────────────────────────────
 * El «§10.8» numerado NO está en este árbol (`plan/DECISIONES.md:694-695` lo
 * remite al repo `scriptorium-cuadernos`). El texto operable aquí es la COPIA
 * local `sincronia/notas/NOTA-Z-2026-07-26-H01-volumes-concepto.md`, cuyo
 * §⑦ (líneas 190-208) trae el CA-LOCAL-FIRST-v0 de siete pasos que este
 * runner ejecuta, y cuya línea 71 enuncia el ancla viva prohibida. Se cita
 * esa nota DECLARANDO que es la copia.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { resolveGamesLibraryRoot } from './games-root.mjs';
import { armNetTrap } from './net-trap.mjs';

import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import { MONOREPO_ROOT } from '@zeus/presets-sdk/env';
import {
  buildPackFromStartpack,
  hashManifest,
  importPack,
  measureAllVolumes,
  readOpsLedger,
  scanRootCerco,
  assertRootCerco,
  verifyRootIntegrity,
  assertRootIntegrity
} from '@zeus/volumes-ops';
import { validateVolumesTree } from '@zeus/linea-kit/validate';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const LINEAS_FIXTURE = path.join(
  REPO_ROOT,
  'packages/engine/linea-kit/test/fixtures/lineas'
);

const ARGS = new Set(process.argv.slice(2));
const LEGADO = ARGS.has('--legado');
const AS_JSON = ARGS.has('--json');

/** Rutas temporales creadas por el runner (se borran al final). */
const TEMPS = [];
const mkTemp = (label) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `zeus-u206-${label}-`));
  TEMPS.push(dir);
  return dir;
};

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const sha256File = (abs) => sha256(fs.readFileSync(abs));

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

/** Copia de bytes de un árbol (JAMÁS enlace) — es la réplica A→B. */
function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    const st = fs.lstatSync(src);
    if (st.isSymbolicLink()) {
      throw new Error(`réplica abortada: enlace en el origen (${src}) — se copia, no se ancla`);
    }
    if (st.isDirectory()) copyTree(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

/** Crea un volumes root vacío con manifiesto mínimo sellable. */
function newRoot(label) {
  const root = mkTemp(label);
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    `${JSON.stringify({ root: '.', volumes: {} }, null, 2)}\n`,
    'utf8'
  );
  return root;
}

/** Apunta el resolvedor canónico a `root` (y tira las cachés). */
function useRoot(root) {
  // Un root nulo se convertiría en la cadena "null" y el resolvedor la
  // anclaría contra MONOREPO_ROOT: se mediría/barrería una ruta inexistente
  // y los pasos darían verde sobre la nada. Se aborta aquí.
  if (typeof root !== 'string' || root === '') {
    throw new Error(`useRoot() sin root válido (recibido: ${JSON.stringify(root)})`);
  }
  process.env.ZEUS_VOLUMES_ROOT = root;
  resetZeusEnvLoader();
  // Obligatorio entre A y B: `loadVolumesConfig` cachea (resolve.mjs:5,50)
  // y sin esto la segunda medición mediría el primer root.
  resetVolumesCache();
}

const manifestBytes = (root) => fs.readFileSync(path.join(root, 'volumes.json'), 'utf8');
const noStagingLeft = (root) =>
  fs.readdirSync(root).every((n) => !n.startsWith('.import-staging'));

// ─────────────────────────────────────────────────────────────────────────
// Reporte
// ─────────────────────────────────────────────────────────────────────────
/** @type {object[]} */
const REPORT = [];
let CURRENT = null;

/**
 * Ejecuta un paso. Acepta `fn` síncrona o asíncrona: el paso 2 tiene que
 * esperar al arranque real, y tener dos caminos de reporte era justamente la
 * juntura por la que se colaba una cabecera duplicada.
 * @param {number} n @param {string} title @param {() => any} fn
 */
async function step(n, title, fn) {
  CURRENT = { paso: n, titulo: title, ok: true, verde: [], rojos: [], evidencia: {}, error: null };
  REPORT.push(CURRENT);
  log(`\n· PASO ${n} · ${title}`);
  try {
    await fn(CURRENT);
  } catch (err) {
    CURRENT.ok = false;
    CURRENT.error = err instanceof Error ? `${err.message}` : String(err);
  }
  log(`  [${CURRENT.ok ? 'OK ' : 'FAIL'}]`);
  for (const v of CURRENT.verde) log(`       verde · ${v}`);
  for (const r of CURRENT.rojos) log(`       ROJO  · ${r}`);
  for (const n2 of CURRENT.notas || []) log(`       nota  · ${n2}`);
  if (CURRENT.error) log(`       error · ${CURRENT.error}`);
  return CURRENT;
}

const log = (...a) => {
  if (!AS_JSON) console.log(...a);
};
const green = (msg) => CURRENT.verde.push(msg);
const red = (msg) => CURRENT.rojos.push(msg);
// U259 · `nota()` se retira con su único uso: el «informativo, FUERA del
// alcance del paso 7» del root LINEAS, que ahora es una ASERCIÓN. El canal de
// notas del reporte (`CURRENT.notas`, línea 190) se conserva por si vuelve a
// hacer falta; lo que se quita es el helper sin llamadas, que lint marcaba.
const evid = (k, v) => {
  CURRENT.evidencia[k] = v;
};

/**
 * Aserción de vector ROJO: `fn` DEBE fallar, y fallar por lo que se espera.
 * Que un rojo salga verde es un fallo del paso — un paso que no puede fallar
 * no es un paso.
 * @param {string} label @param {() => any} fn @param {(res:any)=>boolean} expect
 */
function expectRed(label, fn, expect) {
  let outcome;
  try {
    outcome = { threw: false, value: fn() };
  } catch (err) {
    outcome = { threw: true, value: err };
  }
  const ok = expect(outcome);
  assert.ok(
    ok,
    `vector rojo «${label}» NO se puso rojo: ${JSON.stringify(
      outcome.threw ? String(outcome.value?.message ?? outcome.value) : outcome.value,
      null,
      0
    ).slice(0, 400)}`
  );
  red(label);
  return outcome.value;
}

// ─────────────────────────────────────────────────────────────────────────
// Fixtures de pack
// ─────────────────────────────────────────────────────────────────────────

const FORCES_VOLUMES = {
  forces: {
    disk: 'DISK_03',
    path: 'DISK_03/FORCES',
    readonly: true,
    label: 'Forces (startpack-pozo · adaptador U206)',
    corpora: [
      { id: 'forces', path: 'forces', label: 'Forces' },
      { id: 'cotas', path: 'cotas', label: 'Cotas' }
    ]
  }
};

const LINEAS_VOL_REL = 'DISK_02/LINEAS';
const SIDECAR_REGISTRO = 'demo/wp/historia/registros/r0001-oldid-2/registro.md';
const SIDECAR_DELTA = 'demo/wp/historia/registros/r0001-oldid-2/delta.md';

/**
 * Pack LINEAS: fixture canónica de linea-kit + sidecars de curación
 * SINTÉTICOS (la fixture no trae `registros/`; mismo recurso declarado que
 * usa import-lineas-driver.test.mjs:5-6).
 */
function buildLineasPack({ name = 'pack-lineas-u206', version = '1.0.0', mutate = null } = {}) {
  const packRoot = mkTemp('pack-lineas');
  const dataDir = path.join(packRoot, 'volumes', ...LINEAS_VOL_REL.split('/'));
  for (const rel of collectFiles(LINEAS_FIXTURE)) {
    const to = path.join(dataDir, rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(LINEAS_FIXTURE, rel.split('/').join(path.sep)), to);
  }
  for (const [rel, content] of [
    [SIDECAR_REGISTRO, '# registro sintetico (pack U206)\n\ncuracion inventada\n'],
    [SIDECAR_DELTA, 'delta sintetico (pack U206)\n']
  ]) {
    const abs = path.join(dataDir, rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }
  if (mutate) mutate(dataDir);

  const volumesDir = path.join(packRoot, 'volumes');
  /** @type {Record<string,string>} */
  const hashes = {};
  for (const rel of collectFiles(volumesDir)) {
    hashes[rel] = sha256File(path.join(volumesDir, rel.split('/').join(path.sep)));
  }
  fs.writeFileSync(
    path.join(packRoot, 'manifest.json'),
    `${JSON.stringify(
      {
        name,
        version,
        volumes: {
          lineas: {
            disk: 'DISK_02',
            path: LINEAS_VOL_REL,
            readonly: true,
            label: 'Lineas (fixture canónica + sidecars sintéticos U206)'
          }
        },
        hashes
      },
      null,
      2
    )}\n`,
    'utf8'
  );
  return { packRoot, dataDir };
}

// ─────────────────────────────────────────────────────────────────────────
// Contexto compartido
// ─────────────────────────────────────────────────────────────────────────
const CTX = {
  gamesRoot: null,
  startpackRoot: null,
  packDir: null,
  pack: null,
  rootA: null,
  rootB: null,
  rootC: null,
  sealA: null,
  measureA: null
};

// ═════════════════════════════════════════════════════════════════════════
// PASO 1 · IMPORT DEL POZO REAL
// ═════════════════════════════════════════════════════════════════════════
async function paso1() {
  await step(1, 'IMPORT · el pozo real entra por el adaptador', () => {
    if (!process.env.ZEUS_GAMES_LIBRARY) {
      throw new Error(
        'ZEUS_GAMES_LIBRARY no está definida. El resolvedor de e2e/games-root.mjs ' +
          'sólo cae al hermano si se llama Z_SDK-games-library, que no es nuestro caso: ' +
          'exporta ZEUS_GAMES_LIBRARY=/ruta/al/mundo/hermano.'
      );
    }
    CTX.gamesRoot = resolveGamesLibraryRoot();
    CTX.startpackRoot = path.join(CTX.gamesRoot, 'packages', 'startpack-pozo');
    assert.ok(
      fs.existsSync(CTX.startpackRoot),
      `no encuentro el startpack-pozo en ${CTX.startpackRoot}`
    );
    evid('startpackRoot', CTX.startpackRoot);

    // Huella del mundo hermano ANTES de tocar nada: la frontera es dura.
    const beforeSrc = collectFiles(CTX.startpackRoot).map(
      (rel) => `${rel}:${sha256File(path.join(CTX.startpackRoot, rel.split('/').join(path.sep)))}`
    );

    // ── Adaptador: lee en SOLO LECTURA, computa hashes, emite manifiesto v1.
    CTX.packDir = mkTemp('pack-pozo');
    CTX.pack = buildPackFromStartpack({
      startpackRoot: CTX.startpackRoot,
      outDir: CTX.packDir,
      name: 'startpack-pozo-v1',
      version: '0.1.0',
      volumes: FORCES_VOLUMES
    });
    assert.equal(CTX.pack.files.length, 8, 'el pozo trae 8 ficheros de datos');
    assert.equal(Object.keys(CTX.pack.hashes).length, 8);
    green(`adaptador: 8 ficheros hasheados, manifiesto v1 emitido en ${CTX.pack.manifestPath}`);
    evid('hashes', CTX.pack.hashes);

    // El NOVENO fichero: `volumes/volumes.json` del startpack es manifiesto de
    // ROOT y se descarta CON REPORTE, nunca en silencio.
    assert.equal(CTX.pack.skipped.length, 1);
    assert.equal(CTX.pack.skipped[0].path, 'volumes.json');
    assert.equal(CTX.pack.skipped[0].reason, 'manifiesto_de_root');
    green('el 9.º fichero (volumes/volumes.json del startpack) se descarta CON REPORTE');
    evid('skipped', CTX.pack.skipped);

    // El mundo hermano no se tocó.
    const afterSrc = collectFiles(CTX.startpackRoot).map(
      (rel) => `${rel}:${sha256File(path.join(CTX.startpackRoot, rel.split('/').join(path.sep)))}`
    );
    assert.deepEqual(afterSrc, beforeSrc, 'el startpack de origen cambió: frontera violada');
    green(`origen intacto byte a byte (${beforeSrc.length} ficheros rehasheados)`);

    // ── Import sobre root A.
    CTX.rootA = newRoot('rootA');
    useRoot(CTX.rootA);
    const sealBefore = hashManifest().sha256;
    const res = importPack({
      packRoot: CTX.pack.packRoot,
      role: 'operator',
      actorId: 'u206',
      // Procedencia INERTE: viaja como metadato, jamás como dependencia de
      // arranque (CONTRATO §3 · import.mjs:522). El paso 7 la exenta por
      // ruta de clave exacta y sólo dentro de volumes.json.
      origin: 'https://example.test/release/startpack-pozo-v1-0.1.0.tgz'
    });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(res.noop, false);
    assert.deepEqual(
      res.steps.map((s) => s.step),
      ['verificar', 'familia', 'staging', 'validar', 'fusionar', 'sellar', 'no-link']
    );
    assert.equal(res.steps.find((s) => s.step === 'familia').families.forces, 'forces');
    green(`importPack ok:true noop:false · 7 pasos en steps[] · familia detectada = forces`);
    evid('packHash', res.packHash);
    evid('sello', { antes: sealBefore, despues: res.manifestSha256 });
    CTX.sealA = res.manifestSha256;

    for (const rel of [
      'registry.json',
      'forces/force-sample/force.json',
      'forces/force-sample/escenas/sesion-01/01-sample/think.md',
      'cotas/sima/cota.json'
    ]) {
      assert.ok(
        fs.existsSync(path.join(CTX.rootA, 'DISK_03', 'FORCES', ...rel.split('/'))),
        `no aterrizó ${rel}`
      );
    }
    green('los 8 ficheros aterrizan bajo DISK_03/FORCES del root A');
    assert.ok(noStagingLeft(CTX.rootA));

    // ── ROJO A · un byte alterado antes de importar.
    expectRed(
      'A · byte alterado en el pack → hash_no_coincide, sello del destino intacto',
      () => {
        const rootTmp = newRoot('rojo1a');
        useRoot(rootTmp);
        const sealPre = hashManifest().sha256;
        const packTmp = mkTemp('pack-rojo1a');
        buildPackFromStartpack({
          startpackRoot: CTX.startpackRoot,
          outDir: packTmp,
          name: 'startpack-pozo-v1',
          version: '0.1.0',
          volumes: FORCES_VOLUMES
        });
        const victim = path.join(
          packTmp,
          'volumes',
          ...'DISK_03/FORCES/forces/force-sample/escenas/sesion-01/01-sample/think.md'.split('/')
        );
        fs.appendFileSync(victim, 'x');
        const r = importPack({ packRoot: packTmp, role: 'operator' });
        return { r, sealPre, sealPost: hashManifest().sha256 };
      },
      (o) =>
        !o.threw &&
        o.value.r.ok === false &&
        o.value.r.step === 'verificar' &&
        o.value.r.error === 'hash_no_coincide' &&
        o.value.sealPre === o.value.sealPost
    );

    // ── ROJO B · el manifiesto ORIGINAL del pozo (esquema v0).
    expectRed(
      'B · manifest.json original del pozo (zeus.startpack/v0) → pack_manifest_incompleto',
      () => {
        const rootTmp = newRoot('rojo1b');
        useRoot(rootTmp);
        // Pack «crudo»: los datos del pozo + SU manifiesto, sin adaptador.
        const packTmp = mkTemp('pack-rojo1b');
        fs.mkdirSync(path.join(packTmp, 'volumes'), { recursive: true });
        copyTree(
          path.join(CTX.startpackRoot, 'volumes'),
          path.join(packTmp, 'volumes')
        );
        fs.copyFileSync(
          path.join(CTX.startpackRoot, 'manifest.json'),
          path.join(packTmp, 'manifest.json')
        );
        return importPack({ packRoot: packTmp, role: 'operator' });
      },
      (o) => !o.threw && o.value.ok === false && o.value.error === 'pack_manifest_incompleto'
    );

    // ── ROJO C · un fichero omitido de `hashes`.
    expectRed(
      'C · fichero omitido de hashes → fichero_sin_enumerar',
      () => {
        const rootTmp = newRoot('rojo1c');
        useRoot(rootTmp);
        const packTmp = mkTemp('pack-rojo1c');
        buildPackFromStartpack({
          startpackRoot: CTX.startpackRoot,
          outDir: packTmp,
          name: 'startpack-pozo-v1',
          version: '0.1.0',
          volumes: FORCES_VOLUMES
        });
        const mPath = path.join(packTmp, 'manifest.json');
        const m = JSON.parse(fs.readFileSync(mPath, 'utf8'));
        delete m.hashes['DISK_03/FORCES/registry.json'];
        fs.writeFileSync(mPath, `${JSON.stringify(m, null, 2)}\n`, 'utf8');
        return importPack({ packRoot: packTmp, role: 'operator' });
      },
      (o) => !o.threw && o.value.ok === false && o.value.error === 'fichero_sin_enumerar'
    );

    // ── ROJO D · el adaptador se niega a escribir dentro del mundo hermano.
    expectRed(
      'D · outDir dentro del startpack → destino_dentro_de_origen (frontera dura, cero escritura)',
      () =>
        buildPackFromStartpack({
          startpackRoot: CTX.startpackRoot,
          outDir: path.join(CTX.startpackRoot, '.pack-u206'),
          name: 'x',
          version: '1.0.0',
          volumes: FORCES_VOLUMES
        }),
      (o) => o.threw && o.value.code === 'destino_dentro_de_origen'
    );
    assert.ok(
      !fs.existsSync(path.join(CTX.startpackRoot, '.pack-u206')),
      'el adaptador creó un directorio en el mundo hermano'
    );

    // ── ROJO E · fichero fuera de todo volumen declarado.
    // Sin esta guarda el fichero se copia al staging, PASA la verificación de
    // hash y desaparece cuando el staging se borra: `importPack` devuelve
    // ok:true y el dato se pierde EN SILENCIO (ver reporte · «juntura»).
    expectRed(
      'E · fichero fuera de todo volumen declarado → fichero_fuera_de_volumen',
      () => {
        const fakeSrc = mkTemp('startpack-huerfano');
        fs.mkdirSync(path.join(fakeSrc, 'volumes', 'DISK_03', 'FORCES'), { recursive: true });
        fs.mkdirSync(path.join(fakeSrc, 'volumes', 'DISK_09'), { recursive: true });
        fs.writeFileSync(
          path.join(fakeSrc, 'volumes', 'DISK_03', 'FORCES', 'registry.json'),
          '{}',
          'utf8'
        );
        fs.writeFileSync(
          path.join(fakeSrc, 'volumes', 'DISK_09', 'huerfano.json'),
          '{"dato":"que se perdería en silencio"}',
          'utf8'
        );
        return buildPackFromStartpack({
          startpackRoot: fakeSrc,
          outDir: mkTemp('pack-huerfano'),
          name: 'x',
          version: '1.0.0',
          volumes: FORCES_VOLUMES
        });
      },
      (o) =>
        o.threw &&
        o.value.code === 'fichero_fuera_de_volumen' &&
        o.value.detail.files.includes('DISK_09/huerfano.json')
    );

    useRoot(CTX.rootA);
  });
}

// ═════════════════════════════════════════════════════════════════════════
// PASO 2 · ARRANQUE SIN RED
// ═════════════════════════════════════════════════════════════════════════
async function paso2() {
  await step(2, 'ARRANQUE SIN RED · cero salidas a destino no-loopback', async () => {
    useRoot(CTX.rootA);

    // ── ROJO 1 · auto-prueba de la trampa, PUERTA POR PUERTA.
    //
    // La versión anterior sólo plantaba un `dns.lookup`. La puerta `connect`
    // no se ejercitaba en rojo JAMÁS — y resultó estar rota: `net.connect()`
    // llama a `Socket.prototype.connect` con el Array normalizado
    // [options, cb], el parche leía `.host` de un Array (undefined), lo
    // trataba como «host omitido → localhost» y anotaba la salida como
    // PERMITIDA. `net.createConnection`, `http.request` sobre IP literal y
    // toda la familia `dns.resolve*` evadían la trampa. Un verde de «0
    // violaciones» no distinguía «no salió» de «salió y no lo vi».
    //
    // Se usa una IP de TEST-NET-3 (RFC 5737, no enruta) y `block:true`, así
    // que la trampa lanza ANTES de abrir nada: no sale un solo paquete.
    const IP_EXTERNA = '203.0.113.7';
    const NOMBRE_EXTERNO = 'ejemplo-no-loopback.invalid';

    /** Ejercita una vía bajo la trampa y devuelve las violaciones que registró. */
    const puerta = async (fn) => {
      const t = armNetTrap({ block: true });
      try {
        await fn();
      } catch {
        /* la trampa lanza: es lo esperado */
      } finally {
        t.disarm();
      }
      return t.violations;
    };

    const net = await import('node:net');
    const http = await import('node:http');
    const dnsMod = await import('node:dns');

    const casos = [
      {
        label: 'net.Socket.connect({host,port})',
        gate: 'net.Socket.connect',
        run: () =>
          new Promise((res) => {
            const s = new net.default.Socket();
            s.on('error', () => res(null));
            try { s.connect({ host: IP_EXTERNA, port: 80 }); } catch { /* trampa */ }
            setTimeout(() => { s.destroy(); res(null); }, 30);
          })
      },
      {
        label: 'net.createConnection({host,port})  ← EVADÍA',
        gate: 'net.Socket.connect',
        run: () =>
          new Promise((res) => {
            try {
              const s = net.default.createConnection({ host: IP_EXTERNA, port: 80 });
              s.on('error', () => res(null));
              setTimeout(() => { s.destroy(); res(null); }, 30);
            } catch { res(null); }
          })
      },
      {
        label: 'http.request({host: IP})  ← EVADÍA (la vía más común)',
        gate: 'net.Socket.connect',
        run: () =>
          new Promise((res) => {
            try {
              const q = http.default.request({ host: IP_EXTERNA, port: 80, path: '/' });
              q.on('error', () => res(null));
              q.end();
              setTimeout(() => { q.destroy(); res(null); }, 30);
            } catch { res(null); }
          })
      },
      {
        label: 'dns.resolve4  ← EVADÍA (no instrumentado)',
        gate: 'dns.resolve4',
        run: () => new Promise((res) => {
          try { dnsMod.default.resolve4(NOMBRE_EXTERNO, () => res(null)); } catch { res(null); }
          setTimeout(() => res(null), 30);
        })
      },
      {
        label: 'new dns.Resolver().resolve4  ← EVADÍA',
        gate: 'dns.Resolver.resolve4',
        run: () => new Promise((res) => {
          try { new dnsMod.default.Resolver().resolve4(NOMBRE_EXTERNO, () => res(null)); } catch { res(null); }
          setTimeout(() => res(null), 30);
        })
      },
      {
        label: 'dns.lookup',
        gate: 'dns.lookup',
        run: () => new Promise((res) => {
          try { dnsMod.default.lookup(NOMBRE_EXTERNO, () => res(null)); } catch { res(null); }
          setTimeout(() => res(null), 30);
        })
      }
    ];

    for (const caso of casos) {
      const violaciones = await puerta(caso.run);
      assert.ok(
        violaciones.length >= 1,
        `la trampa NO vio la salida por «${caso.label}»: el instrumento no sirve para esa vía`
      );
      assert.ok(
        violaciones.some((v) => v.gate === caso.gate),
        `«${caso.label}» se registró por otra puerta (${violaciones.map((v) => v.gate).join(',')}), ` +
          `se esperaba ${caso.gate}`
      );
    }
    red(`1 · las SEIS vías de salida, cada una plantada y cazada: ${casos.map((c) => c.gate).join(' · ')}`);
    evid('rojo1Vias', casos.map((c) => c.label));

    // ── ROJO 2 (el que faltaba) · trampa armada, NADA plantado, arranque REAL.
    // Si el arranque toca la red, esto sale ≠0 nombrando el módulo.
    // La trampa se arma ANTES del import dinámico a propósito.
    // Se ejercita EL CAMINO DEL PRODUCTO: `startAll()` de @zeus/force-system —
    // el mismo que corre `npm run start:forces` (start.mjs:24) — que ahora
    // pasa por el guardián de arranque y levanta el servidor MCP. Puerto 0
    // para no chocar con nada. Medido de nuevo tras arreglar la trampa: el 0
    // anterior se tomó con un instrumento que no veía tres de las vías.
    const prevPort = process.env.ZEUS_MCP_FORCES;
    process.env.ZEUS_MCP_FORCES = '0';
    resetZeusEnvLoader();
    const trap = armNetTrap({ block: true });
    /** @type {any} */
    let view = null;
    /** @type {any[]} */
    let handles = [];
    try {
      const { startAll, loadForcesData, buildForcesRegistryView } = await import(
        '@zeus/force-system'
      );
      handles = await startAll();
      const forcesData = await loadForcesData();
      view = buildForcesRegistryView(forcesData);
    } finally {
      for (const h of handles) {
        try {
          await h.close();
        } catch {
          /* ya cerrado */
        }
      }
      trap.disarm();
      if (prevPort == null) delete process.env.ZEUS_MCP_FORCES;
      else process.env.ZEUS_MCP_FORCES = prevPort;
      resetZeusEnvLoader();
    }
    assert.equal(
      trap.violations.length,
      0,
      `el arranque real tocó la red: ${JSON.stringify(trap.violations)}`
    );
    assert.ok(handles.length >= 1, 'el arranque no devolvió handle de servidor');
    assert.ok(view.force_count >= 1, 'el arranque no vio ninguna force');
    assert.ok(view.cota_count >= 1, 'el arranque no vio ninguna cota');
    green(
      `arranque REAL (startAll de @zeus/force-system, servidor MCP levantado en ` +
        `:${handles[0].port} y cerrado) con la trampa arreglada: 0 violaciones · ` +
        `${trap.allowed.length} salidas loopback permitidas · force_count=${view.force_count} · ` +
        `cota_count=${view.cota_count}`
    );
    evid('arranque', {
      force_count: view.force_count,
      cota_count: view.cota_count,
      salidasPermitidas: trap.allowed.length,
      violaciones: trap.violations.length
    });

    // ── ZEUS_HOST no-loopback: el predicado sigue siendo FALSABLE.
    // `resolveZeusHost` (presets-sdk/src/env/index.mjs:180-183) devuelve lo que
    // diga ZEUS_HOST. Eso cambia a qué host se ANUNCIAN/atan los servicios, no
    // introduce por sí solo una salida; pero si algo del arranque conectara a
    // ese host, la trampa lo cazaría. Se comprueba que el predicado clasifica
    // ese host como NO-loopback, que es lo que lo mantiene falsable.
    const { isLoopbackHost } = await import('./net-trap.mjs');
    assert.equal(isLoopbackHost('10.0.0.7'), false);
    assert.equal(isLoopbackHost('localhost'), true);
    assert.equal(isLoopbackHost('127.0.0.1'), true);
    assert.equal(isLoopbackHost('::1'), true);
    assert.equal(isLoopbackHost(undefined), true);
    green('predicado loopback: localhost/127.x/::1/omitido = permitido · 10.0.0.7 = violación');
  });
}

// ═════════════════════════════════════════════════════════════════════════
// PASO 3 · NO-OP
// ═════════════════════════════════════════════════════════════════════════
async function paso3() {
  await step(3, 'NO-OP · reimportar el mismo pack no escribe nada', () => {
    useRoot(CTX.rootA);
    const before = manifestBytes(CTX.rootA);
    const filesBefore = collectFiles(CTX.rootA);

    const again = importPack({ packRoot: CTX.pack.packRoot, role: 'operator' });
    assert.equal(again.ok, true);
    assert.equal(again.noop, true);
    assert.equal(again.manifestSha256, CTX.sealA);
    assert.equal(manifestBytes(CTX.rootA), before);
    // NOTA-REGRESIÓN (no vector rojo): que reimportar sea no-op es tautología
    // de import.mjs:109-116 + :279-285 y pasa hoy sin construir nada. Se
    // conserva como aserción de NO-REGRESIÓN, etiquetada como tal.
    green('[no-regresión] noop:true · sello idéntico · bytes del manifiesto idénticos');

    const filesAfter = collectFiles(CTX.rootA);
    assert.deepEqual(filesAfter, filesBefore, 'el no-op creó o borró ficheros');
    green(`[no-regresión] cero ficheros nuevos (${filesAfter.length} antes y después)`);
    assert.ok(noStagingLeft(CTX.rootA));
    green('[no-regresión] cero .import-staging* en el root');
    evid('noop', { seal: again.manifestSha256, ficheros: filesAfter.length });

    // ── ROJO · el predicado `noStagingLeft` no es vacuo.
    // Un predicado que no puede fallar no prueba nada: se planta un staging y
    // se exige que lo cace.
    expectRed(
      'predicado de staging: se planta .import-staging-u206 y noStagingLeft debe cazarlo',
      () => {
        const planted = path.join(CTX.rootA, '.import-staging-u206-plantado');
        fs.mkdirSync(planted, { recursive: true });
        const caught = noStagingLeft(CTX.rootA);
        fs.rmSync(planted, { recursive: true, force: true });
        return caught;
      },
      (o) => !o.threw && o.value === false
    );
    assert.ok(noStagingLeft(CTX.rootA), 'el vector rojo dejó basura en el root');
  });
}

// ═════════════════════════════════════════════════════════════════════════
// PASO 4 · RÉPLICA A→B
// ═════════════════════════════════════════════════════════════════════════
async function paso4() {
  await step(4, 'RÉPLICA A→B · copia de bytes, misma medida de contenido', () => {
    useRoot(CTX.rootA);
    const sealA = hashManifest().sha256;
    const measureA = measureAllVolumes();
    const integrityA = verifyRootIntegrity();
    CTX.measureA = measureA;

    // Réplica: COPIA DE BYTES, jamás enlace (copyTree aborta ante symlink).
    CTX.rootB = mkTemp('rootB');
    fs.rmSync(CTX.rootB, { recursive: true, force: true });
    copyTree(CTX.rootA, CTX.rootB);
    green(`réplica por copia de bytes: ${collectFiles(CTX.rootB).length} ficheros en B`);

    useRoot(CTX.rootB); // resetVolumesCache() dentro: obligatorio
    const sealB = hashManifest().sha256;
    const measureB = measureAllVolumes();
    const integrityB = verifyRootIntegrity();

    // (a) sello idéntico
    assert.equal(sealB, sealA, 'el sello del manifiesto difiere entre A y B');
    green(`(a) hashManifest() idéntico en A y B: ${sealA}`);

    // La comparación NO es trivial: las rutas absolutas SÍ difieren.
    assert.notEqual(measureA.volumesRoot, measureB.volumesRoot);
    assert.notEqual(measureA.volumes[0].absPath, measureB.volumes[0].absPath);
    green(
      `campos de ruta DIVERGEN por diseño y quedan fuera de la comparación: ` +
        `volumesRoot (measure.mjs:140) y absPath (measure.mjs:85)`
    );

    // (b) misma medida de CONTENIDO — campos declarados en el encabezado.
    const contentShape = (m) => ({
      files: m.files,
      bytes: m.bytes,
      volumes: m.volumes.map((v) => ({
        volumeId: v.volumeId,
        disk: v.disk,
        label: v.label,
        files: v.files,
        bytes: v.bytes,
        missing: v.missing,
        corpora: v.corpora.map((c) => ({
          id: c.id,
          path: c.path,
          label: c.label,
          files: c.files,
          bytes: c.bytes,
          missing: c.missing
        }))
      }))
    });
    const shapeA = contentShape(measureA);
    const shapeB = contentShape(measureB);
    assert.deepEqual(shapeB, shapeA, 'la medida de contenido difiere entre A y B');
    green(
      `(b) measureAllVolumes() coincide en contenido: ${shapeA.files} ficheros · ` +
        `${shapeA.bytes} bytes · corpora ${JSON.stringify(
          shapeA.volumes[0].corpora.map((c) => `${c.id}=${c.files}/${c.bytes}`)
        )}`
    );
    evid('medida', shapeA);

    // (c) el snapshot sellado coincide con el árbol vivo en A y en B.
    assert.equal(integrityA.ok, true, JSON.stringify(integrityA.findings));
    assert.equal(integrityB.ok, true, JSON.stringify(integrityB.findings));
    const snapA = integrityA.checks.find((c) => c.check === 'snapshot');
    const snapB = integrityB.checks.find((c) => c.check === 'snapshot');
    assert.ok(snapA?.ok && snapB?.ok, 'el snapshot sellado no casa con el árbol vivo');
    green(`(c) source.imported.snapshot casa con el árbol vivo en A y en B (${snapA.units} unidades)`);

    // El ledger viajó en la copia y su último asiento sigue casando con el sello.
    const ledgerB = readOpsLedger({ volumesRoot: CTX.rootB }).filter(
      (e) => e.kind === 'import_pack'
    );
    assert.ok(ledgerB.length >= 1);
    assert.equal(ledgerB[ledgerB.length - 1].manifestSha256.after, sealB);
    green(`el .ops-ledger.jsonl viaja en la réplica: ${ledgerB.length} asiento(s) de import en B`);

    // ── ROJO · `pathOverride` inyectado a mano en el manifiesto de B.
    // Nadie lo escribe en todo el árbol; el schema lo admite por
    // additionalProperties. Lo FABRICA el runner. `resolve.mjs:109-110` lo
    // ancla a MONOREPO_ROOT, así que B deja de medir su propio volumen.
    expectRed(
      'pathOverride inyectado en B → el volumen se resuelve contra MONOREPO_ROOT y la medida diverge',
      () => {
        const mPath = path.join(CTX.rootB, 'volumes.json');
        const original = fs.readFileSync(mPath, 'utf8');
        try {
          const cfg = JSON.parse(original);
          cfg.volumes.forces.pathOverride = '.u206-ruta-inexistente/DISK_03/FORCES';
          fs.writeFileSync(mPath, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
          useRoot(CTX.rootB);
          const m = measureAllVolumes();
          const vol = m.volumes.find((v) => v.volumeId === 'forces');
          return {
            absPath: vol.absPath,
            files: vol.files,
            missing: vol.missing,
            anclado: path.resolve(vol.absPath).startsWith(path.resolve(MONOREPO_ROOT)),
            fueraDeB: !path.resolve(vol.absPath).startsWith(path.resolve(CTX.rootB))
          };
        } finally {
          fs.writeFileSync(mPath, original, 'utf8');
          useRoot(CTX.rootB);
        }
      },
      (o) =>
        !o.threw &&
        o.value.anclado === true &&
        o.value.fueraDeB === true &&
        o.value.files !== CTX.measureA.volumes[0].files
    );
    // El root B quedó como estaba.
    assert.equal(hashManifest().sha256, sealA, 'el vector rojo dejó B alterado');
    green('tras el vector rojo, el sello de B vuelve a ser el de A');
  });
}

// ═════════════════════════════════════════════════════════════════════════
// PASO 5 · DIVERGENCIA (familia LINEAS) + CONTRASTE (familia FORCES)
// ═════════════════════════════════════════════════════════════════════════
async function paso5() {
  await step(5, 'DIVERGENCIA · reportada en LINEAS, colisión que aborta en FORCES', () => {
    CTX.rootC = newRoot('rootC');
    useRoot(CTX.rootC);

    const packA = buildLineasPack();
    const first = importPack({ packRoot: packA.packRoot, role: 'operator' });
    assert.equal(first.ok, true, JSON.stringify(first));
    assert.equal(
      first.steps.find((s) => s.step === 'familia').families.lineas,
      'lineas'
    );
    green('root C: pack LINEAS importado, familia detectada por firma (registry.yaml)');

    const rootFileC = (rel) =>
      path.join(CTX.rootC, ...LINEAS_VOL_REL.split('/'), ...rel.split('/'));

    // Se toca un fichero en el DESTINO (es lo que el paso pide: «tocar en B»).
    const targetRel = 'demo/nodos/N01/meta.json';
    const touched = JSON.parse(fs.readFileSync(rootFileC(targetRel), 'utf8'));
    touched.etiqueta = 'TOCADO A MANO EN EL DESTINO (U206)';
    fs.writeFileSync(rootFileC(targetRel), JSON.stringify(touched, null, 2), 'utf8');
    const touchedHash = sha256File(rootFileC(targetRel));

    // Y también la curación, para probar las dos conductas.
    fs.writeFileSync(rootFileC(SIDECAR_REGISTRO), '# curación HUMANA en el destino\n', 'utf8');
    const curatedHash = sha256File(rootFileC(SIDECAR_REGISTRO));

    // ⚠ JUNTURA: reimportar el MISMO pack sería `noop:true` y NO reportaría
    // nada — la puerta de no-op se decide por el sello del manifiesto
    // (import.mjs:279-285), que no ha cambiado, no por el estado del árbol.
    // Para cruzarla hace falta un pack de identidad distinta. Queda declarado:
    // es exactamente el agujero que justifica el paso 6.
    const noopProbe = importPack({ packRoot: packA.packRoot, role: 'operator' });
    evid('noopCiegoALaCorrupcion', {
      noop: noopProbe.noop,
      nota:
        'con el destino ya tocado, reimportar el mismo pack devuelve noop y no mira el árbol'
    });

    const packB = buildLineasPack({ name: 'pack-lineas-u206-b', version: '2.0.0' });
    const res = importPack({ packRoot: packB.packRoot, role: 'operator' });
    assert.equal(res.ok, true, JSON.stringify(res.steps));
    const fam = res.families.find((f) => f.id === 'lineas');

    // Divergencia REPORTADA con ruta y naturaleza; destino byte a byte intacto.
    const div = fam.divergences.find((d) => d.path === targetRel);
    assert.ok(div, `sin divergencia para ${targetRel}: ${JSON.stringify(fam.divergences)}`);
    assert.equal(div.kind, 'contenido_distinto');
    assert.equal(div.destSha256, touchedHash);
    assert.notEqual(div.packSha256, div.destSha256);
    assert.equal(sha256File(rootFileC(targetRel)), touchedHash, 'el destino fue pisado');
    green(
      `LINEAS · divergencia reportada {path:${div.path}, kind:${div.kind}} y destino INTACTO`
    );

    // Curación protegida — predicado REAL `isCuratedSidecarPath` (todo *.md).
    const prot = fam.protectedSidecars.find((p) => p.path === SIDECAR_REGISTRO);
    assert.ok(prot, JSON.stringify(fam.protectedSidecars));
    assert.equal(prot.kind, 'curacion_protegida');
    assert.equal(sha256File(rootFileC(SIDECAR_REGISTRO)), curatedHash, 'la curación fue pisada');
    green(`LINEAS · curación protegida {path:${prot.path}, kind:${prot.kind}} y bytes intactos`);
    evid('lineas', {
      divergencias: fam.divergences.length,
      curacionProtegida: fam.protectedSidecars.length
    });

    // ── CONTRASTE OBLIGATORIO · el mismo escenario sobre FORCES.
    // La diferencia ES la regla de familia: FORCES es RO-inmutable.
    const rootD = newRoot('rootD');
    useRoot(rootD);
    const packF = buildPackFromStartpack({
      startpackRoot: CTX.startpackRoot,
      outDir: mkTemp('pack-contraste'),
      name: 'startpack-pozo-v1',
      version: '0.1.0',
      volumes: FORCES_VOLUMES
    });
    assert.equal(importPack({ packRoot: packF.packRoot, role: 'operator' }).ok, true);
    const sceneRel = 'forces/force-sample/escenas/sesion-01/01-sample/output.md';
    const sceneAbs = path.join(rootD, ...'DISK_03/FORCES'.split('/'), ...sceneRel.split('/'));
    const sceneBefore = fs.readFileSync(sceneAbs);
    fs.appendFileSync(sceneAbs, '\nTOCADO A MANO EN EL DESTINO (U206)\n');
    const sealD = hashManifest().sha256;
    const packF2 = buildPackFromStartpack({
      startpackRoot: CTX.startpackRoot,
      outDir: mkTemp('pack-contraste-b'),
      name: 'startpack-pozo-v1',
      version: '0.2.0',
      volumes: FORCES_VOLUMES
    });
    const resF = importPack({ packRoot: packF2.packRoot, role: 'operator' });
    assert.equal(resF.ok, false, JSON.stringify(resF));
    assert.equal(resF.step, 'fusionar');
    assert.equal(resF.error, 'colision_force');
    assert.equal(hashManifest().sha256, sealD, 'FORCES dejó el root a medias');
    green(
      `CONTRASTE FORCES · el MISMO escenario da colision_force que aborta en el pase dry ` +
        `(unidad ${resF.unit}) — cero divergencia, root intacto`
    );
    evid('contrasteForces', { step: resF.step, error: resF.error, unit: resF.unit });

    // ── ROJO · el predicado de divergencia no es vacuo: sin tocar nada, 0.
    expectRed(
      'sin tocar el destino, divergencias = 0 (el reporte de divergencia no es un adorno)',
      () => {
        const rootE = newRoot('rootE');
        useRoot(rootE);
        const p1 = buildLineasPack({ name: 'p-limpio', version: '1.0.0' });
        assert.equal(importPack({ packRoot: p1.packRoot, role: 'operator' }).ok, true);
        const p2 = buildLineasPack({ name: 'p-limpio-b', version: '2.0.0' });
        const r2 = importPack({ packRoot: p2.packRoot, role: 'operator' });
        return r2.families.find((f) => f.id === 'lineas').divergences.length;
      },
      (o) => !o.threw && o.value === 0
    );
    // Restaura el estado del contraste para no dejar rastro raro.
    fs.writeFileSync(sceneAbs, sceneBefore);
  });
}

// ═════════════════════════════════════════════════════════════════════════
// PASO 6 · LA CORRUPCIÓN FALLA AL ARRANCAR
// ═════════════════════════════════════════════════════════════════════════
async function paso6() {
  await step(6, 'CORRUPCIÓN · un root corrupto NO arranca a medias', async () => {
    // Cada caso sobre su propia réplica del root A: se corrompe y se exige que
    // el verificador FALLE y que el arranque ABORTE.
    const casos = [
      {
        id: 'a',
        titulo: 'un byte de think.md (escena .md — ningún schema la mira)',
        corromper(root) {
          const abs = path.join(
            root,
            ...'DISK_03/FORCES/forces/force-sample/escenas/sesion-01/01-sample/think.md'.split('/')
          );
          fs.appendFileSync(abs, 'x');
        },
        espera: (r) =>
          r.findings.some((f) => f.check === 'snapshot' && f.error === 'unidad_corrupta')
      },
      {
        id: 'b',
        titulo: 'registry.json roto contra su schema',
        corromper(root) {
          const abs = path.join(root, ...'DISK_03/FORCES/registry.json'.split('/'));
          const reg = JSON.parse(fs.readFileSync(abs, 'utf8'));
          delete reg.forces;
          fs.writeFileSync(abs, JSON.stringify(reg, null, 2), 'utf8');
        },
        espera: (r) =>
          r.findings.some((f) => f.check === 'familia' && f.error === 'familia_invalida')
      },
      {
        id: 'c',
        titulo: 'volumes.json editado a mano (fuera del único escritor legítimo)',
        corromper(root) {
          const abs = path.join(root, 'volumes.json');
          const cfg = JSON.parse(fs.readFileSync(abs, 'utf8'));
          cfg.volumes.forces.label = 'editado a mano (U206)';
          fs.writeFileSync(abs, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
        },
        espera: (r) => r.findings.some((f) => f.check === 'sello_vs_ledger' && f.error === 'sello_roto')
      }
    ];

    // Verde primero: el root íntegro pasa.
    useRoot(CTX.rootA);
    const sano = verifyRootIntegrity();
    assert.equal(sano.ok, true, JSON.stringify(sano.findings));
    green(
      `root íntegro → verifyRootIntegrity ok:true (${sano.checks.length} checks, ` +
        `${sano.skipped.length} omitidos declarados)`
    );
    evid('checksVerdes', sano.checks.map((c) => `${c.check}${c.volume ? `[${c.volume}]` : ''}`));

    // ── EL CAMINO DEL PRODUCTO. Un verificador que nadie llama no es una
    // protección: es una biblioteca. Así que el paso 6 no se conforma con que
    // `assertRootIntegrity()` lance — exige que **el servicio real se niegue a
    // arrancar**. `arrancaElProducto()` invoca `startAll()` de
    // @zeus/force-system, que desde U206 pasa por `assertVolumesRootBootable`
    // (start.mjs:17).
    const arrancaElProducto = async () => {
      const prevPort = process.env.ZEUS_MCP_FORCES;
      process.env.ZEUS_MCP_FORCES = '0';
      resetZeusEnvLoader();
      /** @type {any[]} */
      let handles = [];
      try {
        const { startAll } = await import('@zeus/force-system');
        handles = await startAll();
        return { arranco: true, error: null };
      } catch (err) {
        return { arranco: false, error: err instanceof Error ? err.message : String(err) };
      } finally {
        for (const h of handles) {
          try {
            await h.close();
          } catch {
            /* ya cerrado */
          }
        }
        if (prevPort == null) delete process.env.ZEUS_MCP_FORCES;
        else process.env.ZEUS_MCP_FORCES = prevPort;
        resetZeusEnvLoader();
      }
    };
    const sanoArranca = await arrancaElProducto();
    assert.equal(sanoArranca.arranco, true, `el root sano NO arrancó: ${sanoArranca.error}`);
    green('camino del producto: con el root íntegro, startAll() de force-system ARRANCA');

    for (const caso of casos) {
      const root = mkTemp(`corrupto-${caso.id}`);
      fs.rmSync(root, { recursive: true, force: true });
      copyTree(CTX.rootA, root);
      caso.corromper(root);
      useRoot(root);

      const rep = verifyRootIntegrity();
      assert.equal(rep.ok, false, `(${caso.id}) la corrupción NO se detectó: ${caso.titulo}`);
      assert.ok(
        caso.espera(rep),
        `(${caso.id}) se detectó, pero no por donde debía: ${JSON.stringify(rep.findings)}`
      );

      // El arranque ABORTA — comprobado por las DOS vías: la biblioteca y,
      // sobre todo, EL PRODUCTO.
      let aborto = null;
      try {
        assertRootIntegrity();
      } catch (err) {
        aborto = err;
      }
      assert.ok(aborto, `(${caso.id}) assertRootIntegrity no abortó`);

      const intento = await arrancaElProducto();
      assert.equal(
        intento.arranco,
        false,
        `(${caso.id}) EL PRODUCTO ARRANCÓ sobre un root corrupto — la guarda no está cableada`
      );
      assert.match(
        intento.error,
        /arranque ABORTADO/,
        `(${caso.id}) el producto falló, pero no por la guarda: ${intento.error}`
      );
      red(
        `${caso.id} · ${caso.titulo} → ${rep.findings.map((f) => f.error).join(',')} · ` +
          `startAll() de force-system SE NIEGA A ARRANCAR`
      );

      // Contraste con la maquinaria ANTERIOR, sólo para el caso (a): así queda
      // medido qué se ha construido y no sólo verificado.
      if (caso.id === 'a') {
        const legado = validateVolumesTree({ volumesRoot: root });
        evid('legadoAnteCorrupcionMd', { ok: legado.ok, results: legado.results.length });
        if (LEGADO) {
          // --legado: se exige a la maquinaria anterior lo que NO puede dar.
          assert.equal(
            legado.ok,
            false,
            'MODO --legado: validateVolumesTree() da ok:true ante una escena .md corrompida — ' +
              'valida contra SCHEMAS, no contra hashes (linea-kit/src/validate.mjs:187-213). ' +
              'Este es el agujero que el paso 6 cierra; con la maquinaria anterior el CA no puede pasar.'
          );
        } else {
          green(
            `contraste: ante la MISMA corrupción, validateVolumesTree() devuelve ok:${legado.ok} ` +
              `(valida schemas, no hashes) — el paso 6 no era verificación, era construcción`
          );
        }
      }
    }
    useRoot(CTX.rootA);
  });
}

// ═════════════════════════════════════════════════════════════════════════
// PASO 7 · CERCO LIMPIO EN A Y EN B
// ═════════════════════════════════════════════════════════════════════════
async function paso7() {
  await step(7, 'CERCO · 0 enlaces · 0 node_modules · 0 identidad · 0 URLs vivas', () => {
    for (const [label, root] of [
      ['A', CTX.rootA],
      ['B', CTX.rootB]
    ]) {
      const rep = scanRootCerco({ root });
      assert.equal(rep.ok, true, `cerco roto en ${label}: ${JSON.stringify(rep.findings)}`);
      green(
        `root ${label}: ${rep.files} ficheros barridos · symlinks=${rep.symlinks.length} · ` +
          `node_modules=${rep.nodeModules.length} · identidad=${rep.identity.length} · ` +
          `urlsVivas=${rep.liveUrls.length} · binarios (escaneados como latin1)=${rep.binaries.length}`
      );
      evid(`cerco${label}`, {
        files: rep.files,
        binaries: rep.binaries,
        symlinks: rep.symlinks.length,
        urlsVivas: rep.liveUrls.length
      });
    }
    // El `.ops-ledger.jsonl` ENTRA en el barrido: vive dentro del root y viaja
    // en la copia. Se comprueba explícitamente que se está mirando.
    const barridoA = scanRootCerco({ root: CTX.rootA });
    assert.ok(
      fs.existsSync(path.join(CTX.rootA, '.ops-ledger.jsonl')),
      'no hay ledger que barrer: el paso no probaría nada'
    );
    green('.ops-ledger.jsonl y volumes.state.json entran en el barrido (viven dentro del root)');
    evid('cercoAlcance', { ficheros: barridoA.files });

    // La exención de procedencia inerte es ESTRECHA: el mismo literal exento en
    // volumes.json es URL VIVA en cualquier otro fichero.
    const ORIGIN = 'https://example.test/release/startpack-pozo-v1-0.1.0.tgz';
    const cfgA = JSON.parse(manifestBytes(CTX.rootA));
    assert.equal(cfgA.volumes.forces.source.imported.origin, ORIGIN);
    green(
      `exención por contrato: source.imported.origin («${ORIGIN}») está en volumes.json y NO se marca`
    );

    // ── ROJO · se planta material en B: secreto + enlace + URL viva.
    expectRed(
      'B con secret.txt + enlace + URL viva → los tres salen NOMBRADOS y el gate aborta',
      () => {
        const secret = path.join(CTX.rootB, 'secret.txt');
        const urlFile = path.join(CTX.rootB, 'DISK_03', 'nota-con-url.txt');
        const linkPath = path.join(CTX.rootB, 'enlace-vivo');
        const linkTarget = path.join(CTX.rootB, 'DISK_03');
        fs.writeFileSync(secret, 'material de identidad plantado (U206)\n', 'utf8');
        // La MISMA URL exenta dentro de volumes.json: aquí es URL VIVA.
        fs.writeFileSync(urlFile, `ancla: ${ORIGIN}\n`, 'utf8');
        fs.symlinkSync(linkTarget, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
        try {
          const rep = scanRootCerco({ root: CTX.rootB });
          let threw = false;
          try {
            assertRootCerco({ root: CTX.rootB });
          } catch {
            threw = true;
          }
          return { rep, threw };
        } finally {
          fs.rmSync(secret, { force: true });
          fs.rmSync(urlFile, { force: true });
          fs.rmSync(linkPath, { recursive: true, force: true });
        }
      },
      (o) =>
        !o.threw &&
        o.value.threw === true &&
        o.value.rep.ok === false &&
        o.value.rep.identity.includes('secret.txt') &&
        o.value.rep.symlinks.includes('enlace-vivo') &&
        o.value.rep.liveUrls.some((u) => u.path === 'DISK_03/nota-con-url.txt' && u.url === ORIGIN)
    );

    // B vuelve a estar limpio tras el vector rojo.
    const after = scanRootCerco({ root: CTX.rootB });
    assert.equal(after.ok, true, JSON.stringify(after.findings));
    green('tras el vector rojo, el cerco de B vuelve a 0 hallazgos');

    // ── U259 · el root LINEAS ENTRA en el paso, con ASERCIÓN.
    // U206 lo dejó fuera y lo dijo: la fixture canónica lleva URLs de
    // PROCEDENCIA de revisión (`urls.revision`) que el predicado de entonces no
    // distinguía de un ancla de arranque, así que aseverar «0 URLs vivas» aquí
    // habría sido exigir un rojo permanente. Con el predicado reescrito
    // (cerco.mjs · I1-I4) esas URLs quedan clasificadas POR REGLA —coordinan
    // `?oldid=N` con el `oldid` de su propio registro—, así que el root C se
    // asevera como A y B. Ya no hay «informativo» que arrastrar.
    if (CTX.rootC) {
      const repC = scanRootCerco({ root: CTX.rootC });
      assert.equal(
        repC.ok,
        true,
        `cerco roto en el root LINEAS (C): ${JSON.stringify(repC.findings, null, 2)}`
      );
      evid('cercoLineas', { ok: repC.ok, files: repC.files, urlsVivas: repC.liveUrls.length });
      green(
        `root C (LINEAS): ${repC.files} ficheros barridos · urlsVivas=${repC.liveUrls.length} — ` +
          'el paso 7 ya cubre las URLs de procedencia por REGLA, no por excepción'
      );

      // ── ROJO · y no es vacuo: un ancla de verdad en el mismo root sí cae.
      // La diferencia con `urls.revision` es la regla, no el fichero: esta URL
      // no repite ninguna coordenada del registro que la contiene.
      expectRed(
        'C con un endpoint que NO coordina con su registro → URL viva, y el gate aborta',
        () => {
          const ancla = path.join(CTX.rootC, ...LINEAS_VOL_REL.split('/'), 'endpoint.json');
          fs.writeFileSync(
            ancla,
            `${JSON.stringify({ oldid: 2, endpoint: 'https://servidor.real/v1/feed' }, null, 2)}\n`,
            'utf8'
          );
          try {
            const rep = scanRootCerco({ root: CTX.rootC });
            let threw = false;
            try {
              assertRootCerco({ root: CTX.rootC });
            } catch {
              threw = true;
            }
            return { rep, threw };
          } finally {
            fs.rmSync(ancla, { force: true });
          }
        },
        (o) =>
          !o.threw &&
          o.value.threw === true &&
          o.value.rep.ok === false &&
          o.value.rep.liveUrls.some((u) => u.url === 'https://servidor.real/v1/feed')
      );

      const despues = scanRootCerco({ root: CTX.rootC });
      assert.equal(despues.ok, true, JSON.stringify(despues.findings));
      green('tras el vector rojo, el cerco de C vuelve a 0 hallazgos');
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════
async function main() {
  log('═'.repeat(74));
  log('CA LOCAL-FIRST + RÉPLICA A→B (WP-U206)' + (LEGADO ? '  ·  MODO --legado' : ''));
  log('═'.repeat(74));

  try {
    await paso1();
    // Los pasos 2-4, 6 y 7 montan SOBRE el root A. Si el paso 1 no lo produjo,
    // seguir sólo genera siete fallos en cascada que esconden la causa —y, peor,
    // pasos que dan verde sobre material que no existe. Se corta aquí.
    if (!REPORT[0].ok) {
      log('\n  ⛔ el paso 1 no produjo el root A: se abortan los pasos que montan sobre él.');
      throw new Error('paso 1 en rojo');
    }
    await paso2();
    await paso3();
    await paso4();
    await paso5();
    await paso6();
    await paso7();
  } catch (err) {
    if (!(err instanceof Error) || err.message !== 'paso 1 en rojo') throw err;
  } finally {
    delete process.env.ZEUS_VOLUMES_ROOT;
    resetZeusEnvLoader();
    resetVolumesCache();
    for (const dir of TEMPS) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        /* temporal ya retirado */
      }
    }
  }

  const failed = REPORT.filter((s) => !s.ok);
  if (AS_JSON) {
    console.log(JSON.stringify({ ok: failed.length === 0, pasos: REPORT }, null, 2));
  } else {
    log(`\n${'─'.repeat(74)}`);
    for (const s of REPORT) {
      log(
        `  paso ${s.paso}  ${s.ok ? 'VERDE' : 'ROJO '}  ${s.titulo}` +
          `   (${s.verde.length} verde / ${s.rojos.length} rojos)`
      );
    }
    log('─'.repeat(74));
    log(
      failed.length === 0
        ? `\n7/7 pasos verdes · ${REPORT.reduce((n, s) => n + s.rojos.length, 0)} vectores rojos comprobados\n`
        : `\n${failed.length} paso(s) en rojo: ${failed.map((s) => s.paso).join(', ')}\n`
    );
  }
  process.exit(failed.length === 0 ? 0 : 1);
}

await main();

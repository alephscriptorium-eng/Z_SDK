/**
 * WP-U258 · VIGILANCIA del sello del root de REFERENCIA del monorepo.
 *
 * ── POR QUÉ ES UN TEST Y NO UN SCRIPT SUELTO ─────────────────────────────
 * Un sello que nadie comprueba caduca al primer commit. Este fichero corre en
 * el job `test @zeus/volumes-ops` de CI (ci.yml, matriz `test`) y en cualquier
 * `npm test -w @zeus/volumes-ops` local, así que la comprobación viaja con el
 * carril de datos en vez de depender de que alguien se acuerde.
 *
 * ── NO SE APOYA EN EL ENTORNO ────────────────────────────────────────────
 * Resuelve `VOLUMES/` desde `import.meta.url`, NO desde `ZEUS_VOLUMES_ROOT`:
 * lo que vigila es el fichero RASTREADO del repo, no el root que un operador
 * tenga configurado. Si el árbol de referencia no está, FALLA — no se
 * auto-omite. Una omisión silenciosa que cuenta como `pass` es el defecto que
 * WP-U256 vino a cerrar; no se reintroduce aquí.
 *
 * ── LO QUE ASEVERA, Y POR QUÉ CADA COSA ──────────────────────────────────
 *  1. VERDE — los cuatro puntos de arranque cableados arrancan sobre el root.
 *  2. NO VACUO — el reporte de integridad trae VERDES los legs `manifiesto`,
 *     `sello_vs_ledger` y `ficheros`. Sin esto la vigilancia se apaga sola: un
 *     root DES-sellado deja todos los legs en «omitido honesto», los cuatro
 *     servicios arrancan y el paso 1 daría verde sin haber comprobado nada.
 *     Ése es literalmente el defecto que abrió este WP.
 *  3. ROJO — alterar CUALQUIER fichero sellado, editar el manifiesto a mano o
 *     borrar el ledger tiene que NEGAR el arranque. Se ejecuta vector a vector
 *     sobre COPIAS en tmp; el árbol vivo del repo no se toca nunca.
 *  4. El cableado que este fichero dice vigilar sigue donde dice. Una
 *     vigilancia que cita un cableado que ya no existe no vigila: recita.
 *  5. PORTABILIDAD — el sello coincide con los bytes que ENTREGA GIT, no con
 *     los de la máquina que lo tomó. Sin esto, un sello tomado en Windows con
 *     `core.autocrlf=true` pone a CI en rojo y al revés (ver el test).
 *
 * Nota de alcance: la aserción de cobertura es «todo volumen con árbol en
 * disco tiene al menos un hash sellado», NO igualdad de conjunto contra el
 * disco. El candado de `.gitignore` (WP-U108/A-15) permite a propósito copias
 * locales no rastreadas dentro de `DISK_02`/`DISK_03`; exigir igualdad de
 * conjunto pondría en rojo a cualquiera que las tenga, por material que el
 * repo declara no controlar.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
  hashUnitTree,
  scanRootCerco,
  verifyRootIntegrity
} from '../src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const REF_ROOT = path.join(REPO_ROOT, 'VOLUMES');
const MANIFEST = path.join(REF_ROOT, 'volumes.json');
const LEDGER = path.join(REF_ROOT, '.ops-ledger.jsonl');

/** Los cuatro puntos de arranque cableados, con el fichero que los contiene. */
const PUNTOS_DE_ARRANQUE = [
  { service: 'forces-system', volumeIds: ['forces'], file: 'packages/mesh/force-system/src/start.mjs' },
  { service: 'linea-system', volumeIds: ['lineas'], file: 'packages/mesh/linea-system/src/start.mjs' },
  { service: 'firehose-browser', volumeIds: ['firehose'], file: 'packages/mesh/firehose-browser/src/server.mjs' },
  { service: 'ssb-system', volumeIds: ['ssb'], file: 'packages/mesh/ssb-system/src/start.mjs' }
];

/** El cerco REPORTA y no aborta (boot.mjs): se silencia para no ensuciar. */
const MUDO = { warn() {} };

const TEMPS = [];
test.after(() => {
  for (const d of TEMPS) fs.rmSync(d, { recursive: true, force: true });
});

/** Corre la guarda de arranque de un servicio contra `root`. */
function arranca(root, punto) {
  const prev = process.env.ZEUS_VOLUMES_ROOT;
  process.env.ZEUS_VOLUMES_ROOT = root;
  resetZeusEnvLoader();
  resetVolumesCache();
  try {
    assertVolumesRootBootable({ service: punto.service, volumeIds: punto.volumeIds, logger: MUDO });
    return { arranca: true, motivo: null };
  } catch (err) {
    return { arranca: false, motivo: String(err.message) };
  } finally {
    if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = prev;
    resetZeusEnvLoader();
    resetVolumesCache();
  }
}

/** Copia del root de referencia en tmp. El árbol vivo no se toca jamás. */
function copiaDelRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u258-'));
  TEMPS.push(dir);
  const dst = path.join(dir, 'VOLUMES');
  fs.cpSync(REF_ROOT, dst, { recursive: true });
  return dst;
}

/** Sobre `root`, ejecuta el reporte de integridad completo. */
function reporte(root) {
  const prev = process.env.ZEUS_VOLUMES_ROOT;
  process.env.ZEUS_VOLUMES_ROOT = root;
  resetZeusEnvLoader();
  resetVolumesCache();
  try {
    return verifyRootIntegrity();
  } finally {
    if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = prev;
    resetZeusEnvLoader();
    resetVolumesCache();
  }
}

const manifiesto = () => JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

/** ¿El directorio del volumen existe y tiene algo dentro? */
function tieneArbol(root, entry) {
  if (!entry?.path) return false;
  const abs = path.join(root, String(entry.path).split('/').join(path.sep));
  return fs.existsSync(abs) && fs.readdirSync(abs).length > 0;
}

test('el árbol de referencia existe y trae su evidencia (si no, esto FALLA, no se omite)', () => {
  assert.ok(fs.existsSync(REF_ROOT), `no hay root de referencia en ${REF_ROOT}`);
  assert.ok(fs.existsSync(MANIFEST), `no hay manifiesto en ${MANIFEST}`);
  assert.ok(
    fs.existsSync(LEDGER),
    `no hay ledger en ${LEDGER}: sin él, un manifiesto que declara volúmenes ` +
      'importados es `ledger_ausente` y los cuatro servicios NO arrancan'
  );
});

test('VERDE · los cuatro puntos de arranque cableados arrancan sobre el root de referencia', () => {
  for (const p of PUNTOS_DE_ARRANQUE) {
    const r = arranca(REF_ROOT, p);
    assert.ok(r.arranca, `${p.service} no arranca sobre el root de referencia: ${r.motivo}`);
  }
});

test('el cableado que esta vigilancia dice vigilar sigue donde dice', () => {
  for (const p of PUNTOS_DE_ARRANQUE) {
    const abs = path.join(REPO_ROOT, p.file.split('/').join(path.sep));
    assert.ok(fs.existsSync(abs), `el punto de arranque ${p.file} ya no existe`);
    const src = fs.readFileSync(abs, 'utf8');
    assert.match(
      src,
      /assertVolumesRootBootable\(/,
      `${p.file} ya no llama a la guarda: el servicio dejó de pasar por ella`
    );
    for (const v of p.volumeIds) {
      assert.ok(src.includes(`'${v}'`), `${p.file} ya no acota por volumeIds ['${v}']`);
    }
  }
});

test('NO VACUO · el sello está PUESTO: los legs que lo comprueban salen VERDES, no omitidos', () => {
  const rep = reporte(REF_ROOT);
  assert.equal(rep.ok, true, JSON.stringify(rep.findings));
  const verdes = new Set(rep.checks.filter((c) => c.ok).map((c) => c.check));
  // U259 · `snapshot` entra en la lista: era el tramo que en este root salía
  // `omitido: sin_snapshot_sellado` para LINEAS, y con él omitido un ALTA
  // schema-válida dentro de la línea ARRANCABA.
  for (const leg of ['manifiesto', 'sello_vs_ledger', 'ficheros', 'snapshot']) {
    assert.ok(
      verdes.has(leg),
      `el leg «${leg}» no está VERDE: el root dejó de estar sellado y la guarda ` +
        `volvió a pasar de largo (omitidos: ${JSON.stringify(rep.skipped.map((s) => s.check))})`
    );
  }
});

test('cobertura · todo volumen CON árbol está sellado; todo volumen SIN árbol NO lo está', () => {
  const cfg = manifiesto();
  let sellados = 0;
  for (const [id, entry] of Object.entries(cfg.volumes)) {
    const hashes = entry?.source?.imported?.hashes ?? null;
    if (tieneArbol(REF_ROOT, entry)) {
      assert.ok(
        hashes && Object.keys(hashes).length > 0,
        `el volumen «${id}» tiene árbol en disco y CERO hashes sellados: vuelve a estar desprotegido`
      );
      sellados += Object.keys(hashes).length;
    } else {
      // Sellar un volumen cuyo directorio no existe lo convierte en
      // `volumen_ausente` (verify.mjs, leg `volumen`) y NIEGA el arranque al
      // servicio que lo usa. Un sello vacío no es «más seguridad»: es un
      // servicio caído.
      assert.equal(
        entry?.source?.imported,
        undefined,
        `el volumen «${id}» NO tiene árbol en disco y sin embargo está sellado: ` +
          'su servicio no arrancaría (volumen_ausente)'
      );
    }
  }
  assert.ok(sellados > 0, 'CERO ficheros sellados en todo el root: no hay nada que vigilar');
});

test('PORTABILIDAD · el sello coincide con los BYTES QUE GIT ENTREGA, no con los de esta máquina', () => {
  // El defecto que este test caza, medido durante WP-U258: el repo corría con
  // `core.autocrlf=true` y SIN `.gitattributes`, así que el árbol de trabajo de
  // Windows llegaba en CRLF mientras el blob guardaba LF. Sobre
  // `DISK_03/FORCES/registry.json`: blob 824 bytes, árbol de trabajo 864. Un
  // sello tomado en Windows dejaba a los cuatro servicios sin arrancar en CI —
  // `fichero_corrupto` en los 13 ficheros— y al revés. El candado es
  // `.gitattributes` (`VOLUMES/** -text`); esto es el observador que comprueba
  // que sigue puesto, y lo comprueba por EFECTO (bytes del blob), no leyendo el
  // fichero de configuración.
  const cfg = manifiesto();
  let comparados = 0;
  for (const [id, entry] of Object.entries(cfg.volumes)) {
    const hashes = entry?.source?.imported?.hashes;
    if (!hashes) continue;
    for (const [rel, sellado] of Object.entries(hashes)) {
      // Se contrasta contra el ÍNDICE (`:ruta`), que es lo que se convierte en
      // commit: así el fallo es «el sello no coincide con lo que se va a
      // publicar», y un fichero sellado pero NO rastreado cae aquí en vez de
      // colarse hasta un clon donde no existe.
      const gitPath = `VOLUMES/${entry.path}/${rel}`;
      let blob;
      try {
        blob = execFileSync('git', ['show', `:${gitPath}`], {
          cwd: REPO_ROOT,
          encoding: 'buffer',
          maxBuffer: 1 << 28,
          stdio: ['ignore', 'pipe', 'ignore']
        });
      } catch {
        assert.fail(`${gitPath} está sellado pero git no lo tiene en el índice: no viajaría en el clon`);
      }
      assert.equal(
        createHash('sha256').update(blob).digest('hex'),
        sellado,
        `${id}/${rel}: el sello no coincide con los bytes que git entrega — ` +
          'un checkout en otra plataforma (o con otro `core.autocrlf`) no arrancaría'
      );
      comparados += 1;
    }
  }
  assert.ok(comparados > 0, 'no se comparó ningún fichero contra el blob de git');
});

test('U259 · cobertura de SNAPSHOT: todo volumen con árbol y familia que sabe sellar, lo lleva', () => {
  const cfg = manifiesto();
  let conSnapshot = 0;
  for (const [id, entry] of Object.entries(cfg.volumes)) {
    if (!tieneArbol(REF_ROOT, entry)) continue;
    const driver = entry.family ? FAMILY_DRIVERS[entry.family] : null;
    assert.ok(driver, `el volumen «${id}» tiene árbol y quedó sin familia con driver`);
    if (!driver.snapshotOf) continue;
    const sellado = entry?.source?.imported?.snapshot;
    assert.ok(
      sellado && Object.keys(sellado).length > 0,
      `el volumen «${id}» (familia ${entry.family}) tiene árbol y CERO snapshot sellado: ` +
        'un ALTA dentro de una unidad volvería a arrancar'
    );
    // Y es el que su propio driver recomputa: sellar y verificar, un solo cuerpo.
    assert.deepEqual(
      driver.verifySnapshot(
        path.join(REF_ROOT, String(entry.path).split('/').join(path.sep)),
        sellado
      ),
      [],
      `el snapshot sellado de «${id}» no casa con el árbol vivo del repo`
    );
    conSnapshot += 1;
  }
  assert.ok(conSnapshot >= 2, `sólo ${conSnapshot} volúmenes con snapshot: se perdió cobertura`);
});

test('U259 · PORTABILIDAD del snapshot: se recomputa igual desde los BLOBS DE GIT', () => {
  // Misma lección que U258 con `hashes`, aplicada al hash de ÁRBOL: si el
  // checkout de CI entrega otros bytes (finales de línea), el árbol de la unidad
  // hashea distinto y los servicios no arrancan. Se recomputa la unidad
  // ENTERAMENTE desde el índice de git, en un directorio temporal.
  const cfg = manifiesto();
  let unidades = 0;
  for (const [id, entry] of Object.entries(cfg.volumes)) {
    const sellado = entry?.source?.imported?.snapshot;
    // Sólo la forma «árbol por unidad» se puede reconstruir así; los cursores
    // O(1) de FIREHOSE/SSB no aplican (y en este root no hay volúmenes de esas
    // familias con árbol).
    if (!sellado || Object.values(sellado).some((v) => typeof v !== 'string')) continue;
    for (const [unitDir, hash] of Object.entries(sellado)) {
      const prefijo = `VOLUMES/${entry.path}/${unitDir}/`;
      const listado = execFileSync('git', ['ls-files', '-z', '--', prefijo], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        maxBuffer: 1 << 28
      })
        .split('\0')
        .filter(Boolean);
      assert.ok(
        listado.length > 0,
        `la unidad ${id}/${unitDir} está sellada y git no rastrea nada bajo ${prefijo}`
      );
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u259-blob-'));
      TEMPS.push(tmp);
      for (const gitPath of listado) {
        const rel = gitPath.slice(prefijo.length);
        const abs = path.join(tmp, rel.split('/').join(path.sep));
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(
          abs,
          execFileSync('git', ['show', `:${gitPath}`], {
            cwd: REPO_ROOT,
            encoding: 'buffer',
            maxBuffer: 1 << 28
          })
        );
      }
      assert.equal(
        hashUnitTree(tmp),
        hash,
        `${id}/${unitDir}: el snapshot no coincide con el árbol que git entrega — ` +
          'un checkout en otra plataforma no arrancaría'
      );
      unidades += 1;
    }
  }
  assert.ok(unidades > 0, 'no se reconstruyó ninguna unidad desde los blobs de git');
});

test('U259 · ROJO: un ALTA schema-VÁLIDA dentro de una unidad sellada niega el arranque', () => {
  // El vector que ANTES de este WP arrancaba en LINEAS: copiar un fichero
  // VÁLIDO dentro de la línea. Ningún schema se queja, el leg `ficheros` sólo
  // mira pertenencia de lo sellado y los corpora no están medidos. Sólo el
  // snapshot —que es un hash de CONJUNTO— lo ve.
  const cfg = manifiesto();
  const porVolumen = new Map(PUNTOS_DE_ARRANQUE.map((p) => [p.volumeIds[0], p]));
  let vectores = 0;
  for (const [id, entry] of Object.entries(cfg.volumes)) {
    const sellado = entry?.source?.imported?.snapshot;
    if (!sellado || Object.values(sellado).some((v) => typeof v !== 'string')) continue;
    const punto = porVolumen.get(id);
    assert.ok(punto, `el volumen «${id}» tiene snapshot y ningún punto de arranque lo acota`);
    for (const unitDir of Object.keys(sellado)) {
      const root = copiaDelRoot();
      const unidad = path.join(
        root,
        String(entry.path).split('/').join(path.sep),
        unitDir.split('/').join(path.sep)
      );
      // Copia EXACTA de un fichero que ya vive en la unidad: schema-válida por
      // construcción, así que el rojo no puede venir del validador de familia.
      const alguno = fs.readdirSync(unidad, { withFileTypes: true }).find((e) => e.isFile());
      assert.ok(alguno, `la unidad ${id}/${unitDir} no tiene ficheros en su raíz`);
      fs.copyFileSync(
        path.join(unidad, alguno.name),
        path.join(unidad, `copia-${alguno.name}`)
      );
      const r = arranca(root, punto);
      assert.equal(
        r.arranca,
        false,
        `un ALTA en ${id}/${unitDir} NO impidió el arranque de ${punto.service}`
      );
      assert.match(r.motivo, /unidad_corrupta/);
      vectores += 1;
    }
  }
  assert.ok(vectores > 0, 'el vector ALTA no llegó a correr sobre ninguna unidad');
});

test('U259 · el CERCO del root de referencia queda LIMPIO (modo estricto ya es usable)', () => {
  // U206 midió TRES hallazgos aquí —dos `urls.revision` de la fixture de LINEAS
  // y un enlace de repositorio en `README.md`—, ninguno un ancla de arranque, y
  // por eso el cerco no podía abortar: hacerlo negaría el arranque a todo el
  // monorepo. Con el predicado de U259 los tres quedan clasificados por REGLA
  // (I2 y I4), así que `ZEUS_VOLUMES_CERCO=strict` deja de ser un interruptor
  // que nadie puede pulsar. Si alguien planta un ancla de verdad, esto se pone
  // rojo — que es lo que un cerco tiene que hacer.
  const rep = scanRootCerco({ root: REF_ROOT });
  assert.equal(
    rep.ok,
    true,
    `el cerco del root de referencia tiene hallazgos: ${JSON.stringify(rep.findings, null, 2)}`
  );
  assert.ok(rep.files > 0, 'el cerco barrió CERO ficheros: no probaría nada');
});

test('U259 · y NO es vacuo: una URL viva plantada en el root de referencia sí se caza', () => {
  const root = copiaDelRoot();
  fs.writeFileSync(
    path.join(root, 'DISK_02', 'LINEAS', 'demo', 'ancla.json'),
    `${JSON.stringify({ endpoint: 'https://servidor.real/v1/x' }, null, 2)}\n`,
    'utf8'
  );
  const rep = scanRootCerco({ root });
  assert.equal(rep.ok, false, 'el cerco quedó limpio ante una URL viva plantada: es vacuo');
  assert.ok(rep.liveUrls.some((u) => u.url === 'https://servidor.real/v1/x'));
});

test('ROJO · alterar CUALQUIER fichero sellado niega el arranque del servicio que lo usa', () => {
  const cfg = manifiesto();
  const porVolumen = new Map(PUNTOS_DE_ARRANQUE.map((p) => [p.volumeIds[0], p]));
  let vectores = 0;
  for (const [id, entry] of Object.entries(cfg.volumes)) {
    const hashes = entry?.source?.imported?.hashes;
    if (!hashes) continue;
    const punto = porVolumen.get(id);
    assert.ok(punto, `el volumen «${id}» está sellado y ningún punto de arranque lo acota`);
    for (const rel of Object.keys(hashes)) {
      const root = copiaDelRoot();
      const abs = path.join(
        root,
        String(entry.path).split('/').join(path.sep),
        rel.split('/').join(path.sep)
      );
      fs.writeFileSync(abs, `${fs.readFileSync(abs, 'utf8')}\n`, 'utf8');
      const r = arranca(root, punto);
      assert.equal(r.arranca, false, `alterar ${id}/${rel} NO impidió el arranque de ${punto.service}`);
      assert.match(r.motivo, /arranque ABORTADO/);
      vectores += 1;
    }
  }
  assert.ok(vectores > 0, 'el vector «dato alterado» no llegó a correr sobre ningún fichero');
});

test('ROJO · el manifiesto editado a mano niega el arranque de LOS CUATRO servicios', () => {
  // Incluidos `firehose` y `ssb`, cuyos volúmenes no tienen árbol y por tanto
  // no están sellados: su cobertura es exactamente ésta (legs 1-3), y sin el
  // sello del root no la tenían.
  for (const p of PUNTOS_DE_ARRANQUE) {
    const root = copiaDelRoot();
    const abs = path.join(root, 'volumes.json');
    const cfg = JSON.parse(fs.readFileSync(abs, 'utf8'));
    cfg.note = `${cfg.note ?? ''} (editado a mano)`;
    fs.writeFileSync(abs, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
    const r = arranca(root, p);
    assert.equal(r.arranca, false, `${p.service} arrancó con el manifiesto editado a mano`);
    assert.match(r.motivo, /sello_roto/);
  }
});

test('ROJO · borrar el ledger no apaga la comprobación: los cuatro se niegan', () => {
  for (const p of PUNTOS_DE_ARRANQUE) {
    const root = copiaDelRoot();
    fs.rmSync(path.join(root, '.ops-ledger.jsonl'), { force: true });
    const r = arranca(root, p);
    assert.equal(r.arranca, false, `${p.service} arrancó sin ledger`);
    assert.match(r.motivo, /ledger_ausente/);
  }
});

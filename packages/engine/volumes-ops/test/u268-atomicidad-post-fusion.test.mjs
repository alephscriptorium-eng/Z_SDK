/**
 * WP-U268 · QUÉ HACE `importPack` CUANDO EL FALLO SÓLO SE CONOCE **DESPUÉS**
 * DE FUSIONAR.
 *
 * U253b cerró la familia conocible ANTES de fusionar (precondiciones) y dejó
 * escrito, en su propia cabecera, que quedaban SEIS puntos posteriores. Los seis
 * se volvieron a medir sobre la base antes de tocar nada (reporte §2) y los
 * cinco posteriores al sello daban lo mismo: **corpus aterrizado, manifiesto
 * re-sellado, CERO asiento**; cuatro además salían LANZANDO.
 *
 * La decisión de U268 —con su argumento en la cabecera de `src/import.mjs`— es
 * **declarar el medio-aterrizaje**, y **revertir sólo en el único tramo donde
 * revertir es honesto**: SELLAR lanzando, con la fusión aplicada y el manifiesto
 * todavía intacto. Es una mezcla y está dicha.
 *
 * Qué vigila este fichero, y en qué orden:
 *   §2 · el `finally` — el peor de los seis: una excepción ahí SUSTITUÍA al
 *        `return` de un import completo. Ahora la limpieza no puede cambiar el
 *        desenlace, y hay prueba DIRECTA de la pieza además de la integrada;
 *   §3 · las cuatro entradas + las dos vecinas como CONTRATO: `{ok:false, step,
 *        error}` con el medio-aterrizaje nombrado, y la huella del ÁRBOL ENTERO
 *        antes/después en vez de inspección;
 *   §4 · las recuperaciones, EJECUTADAS. Una recuperación que no se corre es
 *        una frase;
 *   §5 · censo de mutación, una amputación por pieza portante y por separado:
 *        cada guardián se desactiva SOLO y se exige que su caso enrojezca con la
 *        conducta medida en la base. Un negativo con la guarda puesta no prueba
 *        nada si no se comprueba que sin ella enrojece.
 *
 * ── LO QUE ESTA PRUEBA **NO** VE (declarado, como U253a y U253b declaran lo
 * suyo) ───────────────────────────────────────────────────────────────────
 * - **Flujos de datos alternos de NTFS**: `fs.readdir` no los enumera, así que
 *   un `fichero:flujo` escrito dentro de una entrada existente NO mueve la
 *   huella. Misma ceguera y mismo motivo que en `ledger-cerco.mjs`.
 * - **Marcas de tiempo** (`mtime`/`atime`): fuera a propósito — las mueve
 *   cualquier lectura y volverían la huella inútil. Consecuencia concreta: el
 *   revert de §3·E6 se declara «byte a byte» en CONTENIDO, tipo, modo y
 *   estructura; los `mtime` de los directorios que la fusión tocó NO vuelven, y
 *   `deshacerFusion` ya lo dice en su alcance.
 * - **Rutas fuera del root**: un residuo en `os.tmpdir()` no entra en la huella.
 * - **Concurrencia real**: los bloqueos se plantan desde este mismo proceso
 *   (atributo, modo, ACL, cwd). Un handle abierto por OTRO proceso —el `EBUSY`
 *   clásico de Windows— no se reproduce aquí; lo que se ejercita es el mismo
 *   código de error por una vía plantable.
 * - **Root**: como superusuario los bloqueos de modo no bloquean. Por eso cada
 *   vector se AUTOVERIFICA sobre un directorio de usar y tirar antes de que
 *   ninguna prueba se apoye en él, y si no bloquea el caso se ABSTIENE con
 *   `skip`. Un verde sin vector sería fingir.
 * - **El errno del sistema NO se asevera**, y esto se aprendió con el CI en
 *   rojo: había `assert.equal(causa.code, 'EPERM')` y en Linux el mismo hecho
 *   —una escritura denegada— llega como `EACCES`. Un errno es un detalle de la
 *   plataforma; lo que este WP defiende es que se salió por la frontera con
 *   NUESTRO código y que el diagnóstico viaja entero. Eso es lo que se
 *   comprueba (`causaViaja`). Los `code` fijados por valor son sólo los que
 *   inyectamos nosotros, y ahí el valor no lo pone ningún sistema.
 *   Consecuencia declarada: **esta suite no distingue POR QUÉ se denegó la
 *   escritura**, sólo que se denegó y que el import lo declaró.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import {
  appendOpsLedger,
  importPack,
  limpiarStaging,
  scanRootCerco,
  syncVolumeCounters,
  verifyRootIntegrity
} from '../src/index.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(AQUI, '..', 'src');
const WIN = process.platform === 'win32';
const sha256 = (b) => createHash('sha256').update(b).digest('hex');

// ── §1 · Arnés ─────────────────────────────────────────────────────────────

/**
 * Huella del ÁRBOL ENTERO del root: tipo, MODO, destino si es enlace y sha256
 * de los bytes si es fichero. Cuerpo hermano del de `u253b-import-atomico`, con
 * UNA diferencia necesaria: un directorio que no se puede listar se anota como
 * tal en vez de hacer reventar la medida — porque uno de los vectores de este WP
 * es exactamente ése, y una huella que muere al medirlo no mide.
 * @param {string} root
 */
function huellaArbol(root) {
  /** @type {string[]} */
  const lineas = [];
  const walk = (dir, rel) => {
    /** @type {fs.Dirent[]} */
    let entradas;
    try {
      entradas = fs
        .readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => (a.name < b.name ? -1 : 1));
    } catch (err) {
      lineas.push(`D? ${rel} ilegible:${err.code}`);
      return;
    }
    for (const e of entradas) {
      const abs = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      const st = fs.lstatSync(abs);
      const modo = st.mode.toString(8);
      if (st.isSymbolicLink()) {
        let destino = '?';
        try {
          destino = fs.readlinkSync(abs);
        } catch {
          /* enlace roto: se anota como tal, que también es un cambio */
        }
        lineas.push(`L ${r} ${modo} → ${destino}`);
      } else if (st.isDirectory()) {
        lineas.push(`D ${r} ${modo}`);
        walk(abs, r);
      } else lineas.push(`F ${r} ${modo}:${sha256(fs.readFileSync(abs))}`);
    }
  };
  walk(root, '');
  return sha256(Buffer.from(lineas.join('\n'), 'utf8'));
}

function setupRoot(manifiesto = { root: '.', volumes: {} }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'u268-root-'));
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    `${JSON.stringify(manifiesto, null, 2)}\n`,
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
      try {
        fs.rmSync(root, { recursive: true, force: true });
      } catch {
        /* residuo con permiso denegado: vive en tmp y no contamina el repo */
      }
    }
  };
}

const FICHEROS_BASE = {
  'DISK_07/DEMO/raw/a.json': '{"post":"uno"}',
  'DISK_07/DEMO/curated/keep.md': '# curado\n'
};
const NOMBRE_PACK = 'pack-demo';

const VOLUMEN_DEL_PACK = {
  demo: {
    disk: 'DISK_07',
    path: 'DISK_07/DEMO',
    readonly: true,
    label: 'Demo',
    corpora: [
      { id: 'raw', path: 'raw', label: 'Raw' },
      { id: 'curated', path: 'curated', label: 'Curated' }
    ]
  }
};

function buildPack(ficheros = FICHEROS_BASE) {
  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'u268-pack-'));
  /** @type {Record<string,string>} */
  const hashes = {};
  for (const [rel, contenido] of Object.entries(ficheros)) {
    const abs = path.join(packRoot, 'volumes', rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, contenido, 'utf8');
    hashes[rel] = sha256(Buffer.from(contenido, 'utf8'));
  }
  fs.writeFileSync(
    path.join(packRoot, 'manifest.json'),
    JSON.stringify(
      { name: NOMBRE_PACK, version: '1.0.0', volumes: VOLUMEN_DEL_PACK, hashes },
      null,
      2
    ),
    'utf8'
  );
  return { packRoot, limpia: () => fs.rmSync(packRoot, { recursive: true, force: true }) };
}

/**
 * Root con el volumen YA DECLARADO y su corpus `curated` en disco e idéntico al
 * del pack. Lo necesitan los dos vectores que exigen tocar el DESTINO antes del
 * import (un subdirectorio ilegible, un ancla viva): sobre un volumen nuevo el
 * destino no existe hasta el rename y no hay dónde plantarlos.
 */
function setupRootConVolumen() {
  const s = setupRoot({
    root: '.',
    volumes: {
      demo: {
        disk: 'DISK_07',
        path: 'DISK_07/DEMO',
        readonly: true,
        label: 'Demo',
        corpora: [{ id: 'curated', path: 'curated', label: 'Curated' }]
      }
    }
  });
  const curated = path.join(s.root, 'DISK_07', 'DEMO', 'curated');
  fs.mkdirSync(curated, { recursive: true });
  fs.writeFileSync(path.join(curated, 'keep.md'), '# curado\n', 'utf8');
  return s;
}

/**
 * El diagnóstico VIAJA — que es la propiedad, no el errno.
 *
 * Aquí había `assert.equal(causa.code, 'EPERM')` y **puso el CI en rojo**:
 * Windows deniega una escritura con `EPERM` y Linux con `EACCES`. El errno es un
 * detalle de la plataforma; lo que este WP defiende es que la escritura fue
 * denegada, que salimos por la frontera con NUESTRO código y que la causa llega
 * entera al llamante (U255: «convertir un throw en `{ok:false}` sólo es
 * cumplimiento del contrato si el diagnóstico viaja»). Eso es lo que se asevera:
 * que hay `code`, `message` y `name`, no cuáles.
 *
 * Los `code` que SÍ se fijan por valor en este fichero son los que INYECTAMOS
 * nosotros (`ENOSPC`, `EIO`, `ETEST`, el `EPERM` del sustituto de
 * `deshacerFusion`): ahí el valor es nuestro y comprobarlo prueba justamente que
 * la causa llega verbatim, sin que ningún sistema opine.
 * @param {any} causa @param {string} donde
 */
function causaViaja(causa, donde) {
  assert.ok(causa, `${donde}: la causa no viajó`);
  assert.equal(typeof causa.code, 'string', `${donde}: sin código: ${JSON.stringify(causa)}`);
  assert.ok(causa.code.length > 0, `${donde}: código vacío`);
  assert.equal(typeof causa.message, 'string', `${donde}: sin mensaje`);
  assert.ok(causa.message.length > 0, `${donde}: mensaje vacío`);
}

const rutaLedger = (root) => path.join(root, '.ops-ledger.jsonl');
const rutaEstado = (root) => path.join(root, 'volumes.state.json');
const rutaManifiesto = (root) => path.join(root, 'volumes.json');
const aterrizo = (root) => fs.existsSync(path.join(root, 'DISK_07', 'DEMO', 'raw', 'a.json'));
/** Se pregunta por el TEXTO: hay casos que dejan el ledger sin parsear. */
function hayAsientoDeImport(root) {
  const p = rutaLedger(root);
  return fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes('"kind":"import_pack"');
}
const selloDe = (root) => sha256(fs.readFileSync(rutaManifiesto(root)));

// ── Bloqueos portables, cada uno con su autoverificación ───────────────────

const usuarioWin = () => `${process.env.USERDOMAIN}\\${process.env.USERNAME}`;

function bloqueaEscritura(f) {
  if (WIN) execFileSync('attrib', ['+R', f]);
  else fs.chmodSync(f, 0o444);
}
function sueltaEscritura(f) {
  try {
    if (WIN) execFileSync('attrib', ['-R', f]);
    else fs.chmodSync(f, 0o644);
  } catch {
    /* ya suelto o ya borrado */
  }
}
function bloqueaListado(d) {
  if (WIN) execFileSync('icacls', [d, '/deny', `${usuarioWin()}:(RD)`], { stdio: 'ignore' });
  else fs.chmodSync(d, 0o000);
}
function sueltaListado(d) {
  try {
    if (WIN) execFileSync('icacls', [d, '/remove:d', usuarioWin()], { stdio: 'ignore' });
    else fs.chmodSync(d, 0o755);
  } catch {
    /* ya suelto o ya borrado */
  }
}
/**
 * Impide BORRAR el contenido de `dir`. Windows: el cwd dentro de un directorio
 * lo hace irremovible (`EBUSY` en `rmdir`, medido). POSIX: sin permiso de
 * escritura en el directorio, `unlink` de sus hijos da `EACCES`. Devuelve la
 * suelta.
 * @param {string} dir
 */
function bloqueaBorrado(dir) {
  if (WIN) {
    const prev = process.cwd();
    process.chdir(dir);
    return () => {
      try {
        process.chdir(prev);
      } catch {
        /* el previo desapareció: irrelevante para la prueba */
      }
    };
  }
  fs.chmodSync(dir, 0o500);
  return () => {
    try {
      fs.chmodSync(dir, 0o755);
    } catch {
      /* ya borrado */
    }
  };
}

/**
 * ¿Existe el vector en ESTA máquina? Se planta sobre un directorio de usar y
 * tirar y se comprueba que de verdad bloquea. Como root los modos POSIX no
 * bloquean nada, y sin esta pregunta el caso saldría VERDE sin haber ejercitado
 * nada — que es la forma más silenciosa de mentir en una suite.
 * @param {'escritura'|'listado'|'borrado'} cual
 */
function vectorDisponible(cual) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'u268-vector-'));
  let bloquea = false;
  let suelta = () => {};
  try {
    if (cual === 'escritura') {
      const f = path.join(d, 'x.txt');
      fs.writeFileSync(f, 'x');
      bloqueaEscritura(f);
      suelta = () => sueltaEscritura(f);
      try {
        fs.appendFileSync(f, 'y');
      } catch {
        bloquea = true;
      }
    } else if (cual === 'listado') {
      const sub = path.join(d, 'opaco');
      fs.mkdirSync(sub);
      fs.writeFileSync(path.join(sub, 'x.txt'), 'x');
      bloqueaListado(sub);
      suelta = () => sueltaListado(sub);
      try {
        fs.readdirSync(sub);
      } catch {
        bloquea = true;
      }
    } else {
      const sub = path.join(d, 'bloqueo');
      fs.mkdirSync(sub);
      fs.writeFileSync(path.join(sub, 'x.txt'), 'x');
      suelta = bloqueaBorrado(sub);
      try {
        fs.rmSync(d, { recursive: true, force: true });
      } catch {
        bloquea = true;
      }
    }
  } finally {
    suelta();
    try {
      fs.rmSync(d, { recursive: true, force: true });
    } catch {
      /* nada que limpiar */
    }
  }
  return bloquea;
}

/**
 * Hace PREDECIBLE la ruta del staging congelando `Date.now`, que es el único
 * ingrediente no conocido del nombre (`.import-staging-<pack>-<pid>-<now>`).
 * Sin esto no hay forma de plantar un bloqueo DENTRO del staging antes de que
 * `importPack` lo use, y el vector del `finally` no se podría ejercitar de
 * verdad. Un directorio de más ahí dentro no altera el import: los movimientos
 * apuntan a `<staging>/<vol.path>/…` y nadie enumera la raíz del staging.
 * @param {string} root @param {(dir:string)=>any} fn
 */
function conStagingPredecible(root, fn) {
  const t = Date.now();
  const real = Date.now;
  const dir = path.join(
    root,
    `.import-staging-${NOMBRE_PACK.replace(/[^a-z0-9-]/gi, '_')}-${process.pid}-${t}`
  );
  Date.now = () => t;
  try {
    return fn(dir);
  } finally {
    Date.now = real;
  }
}

// ── §2 · CA-3 · EL `finally` NO PUEDE SUSTITUIR AL DESENLACE ───────────────

test('CA-3 · un import COMPLETO cuyo staging no se puede retirar sigue siendo ok:true y lo DICE', (t) => {
  if (!vectorDisponible('borrado')) {
    t.skip('este entorno no sabe impedir el borrado de un directorio (¿superusuario?)');
    return;
  }
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  let suelta = () => {};
  try {
    conStagingPredecible(root, (stagingDir) => {
      const bloqueo = path.join(stagingDir, 'bloqueo');
      fs.mkdirSync(bloqueo, { recursive: true });
      fs.writeFileSync(path.join(bloqueo, 'x.txt'), 'x', 'utf8');
      suelta = bloqueaBorrado(bloqueo);

      // En la base esto LANZABA `EBUSY` y se llevaba por delante el `return` de
      // un import que había terminado — con asiento y todo (medido, §2·E4).
      const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });

      assert.equal(res.ok, true, `el import terminó: ${JSON.stringify(res).slice(0, 300)}`);
      assert.equal(res.noop, false);
      assert.equal(res.staging.eliminado, false, 'y NO se calla que el staging quedó');
      causaViaja(res.staging.causa, 'staging no retirado');
      assert.equal(res.staging.dir, stagingDir);
      assert.equal(aterrizo(root), true, 'el corpus aterrizó');
      assert.equal(hayAsientoDeImport(root), true, 'y el asiento está escrito');
      assert.equal(res.ledger.kind, 'import_pack');
      // El root arranca: un conserje que no pudo barrer no rompe la integridad.
      const v = verifyRootIntegrity();
      assert.equal(v.ok, true, JSON.stringify(v.findings));
    });
  } finally {
    suelta();
    limpia();
    restore();
  }
});

test('CA-3 control · sin bloqueo, el staging se retira y el resultado lo dice', () => {
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  try {
    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.ok, true, JSON.stringify(res).slice(0, 300));
    assert.deepEqual(res.ledger.volumes, ['demo'], 'el asiento nombra los volúmenes');
    assert.equal(res.ledger.manifestSha256.after, res.manifestSha256);
    assert.deepEqual(
      res.steps.map((s) => s.step),
      ['verificar', 'familia', 'staging', 'validar', 'fusionar', 'sellar', 'no-link'],
      'el orden del parte no cambia aunque `sellar` se anote detrás del asiento'
    );
    assert.equal(res.staging.eliminado, true);
    assert.equal(res.staging.causa, null);
    assert.equal(fs.existsSync(res.staging.dir), false, 'el staging nunca sobrevive (contrato §1)');
    assert.equal(
      fs.readdirSync(root).some((n) => n.startsWith('.import-staging-')),
      false
    );
  } finally {
    limpia();
    restore();
  }
});

test('CA-3 · `limpiarStaging` a solas: devuelve el fallo, no lo lanza', (t) => {
  if (!vectorDisponible('borrado')) {
    t.skip('este entorno no sabe impedir el borrado de un directorio (¿superusuario?)');
    return;
  }
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'u268-limpia-'));
  const bloqueo = path.join(base, 'bloqueo');
  fs.mkdirSync(bloqueo, { recursive: true });
  fs.writeFileSync(path.join(bloqueo, 'x.txt'), 'x', 'utf8');
  const suelta = bloqueaBorrado(bloqueo);
  try {
    const r = limpiarStaging(base);
    assert.equal(r.eliminado, false);
    assert.equal(r.dir, base);
    causaViaja(r.causa, 'limpiarStaging bloqueado');
  } finally {
    suelta();
    fs.rmSync(base, { recursive: true, force: true });
  }
  // Y sobre uno normal, retira y lo dice.
  const otro = fs.mkdtempSync(path.join(os.tmpdir(), 'u268-limpia2-'));
  fs.writeFileSync(path.join(otro, 'y.txt'), 'y', 'utf8');
  const ok = limpiarStaging(otro);
  assert.deepEqual(ok, { dir: otro, eliminado: true, causa: null });
  assert.equal(fs.existsSync(otro), false);
  // Un directorio que no existe no es un fallo (force:true), y tampoco lanza.
  assert.equal(limpiarStaging(path.join(otro, 'no-existe')).eliminado, true);
});

// ── §3 · CA-1 y CA-2 · las entradas, como CONTRATO ─────────────────────────

test('E1 · asiento no escribible → post-fusion/asiento_no_escribible, con el sello puesto', (t) => {
  if (!vectorDisponible('escritura')) {
    t.skip('este entorno no sabe hacer un fichero no escribible (¿superusuario?)');
    return;
  }
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  const ledger = rutaLedger(root);
  try {
    fs.writeFileSync(ledger, '', 'utf8');
    bloqueaEscritura(ledger);
    const selloAntes = selloDe(root);
    const antes = huellaArbol(root);

    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });

    assert.equal(res.ok, false);
    assert.equal(res.step, 'post-fusion');
    assert.equal(res.error, 'asiento_no_escribible');
    assert.equal(res.aterrizado, true, 'el medio-aterrizaje se NOMBRA');
    assert.equal(res.asiento, false);
    assert.equal(res.sellado.before, selloAntes);
    assert.equal(res.sellado.after, selloDe(root));
    assert.notEqual(res.sellado.after, res.sellado.before);
    causaViaja(res.causa, 'E1');
    assert.equal(res.staging.eliminado, true);
    assert.notEqual(huellaArbol(root), antes, 'y el árbol del root CAMBIÓ, como dice');
    assert.equal(aterrizo(root), true);
    assert.equal(hayAsientoDeImport(root), false);

    // Consecuencia declarada, no supuesta: sin asiento el root NO arranca.
    const v = verifyRootIntegrity();
    assert.equal(v.ok, false);
    assert.ok(
      v.findings.some((f) => f.error === 'ledger_ausente'),
      JSON.stringify(v.findings)
    );
    // Y repetir el import NO lo repara: el gate NO-OP responde `noop:true`.
    sueltaEscritura(ledger);
    const r2 = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(r2.ok, true);
    assert.equal(r2.noop, true, 'la segunda pasada es NO-OP');
    assert.equal(
      hayAsientoDeImport(root),
      false,
      'y sigue sin asiento: por eso hace falta la recuperación'
    );
  } finally {
    sueltaEscritura(ledger);
    limpia();
    restore();
  }
});

test('E2 · estado vivo no escribible → post-fusion/estado_no_escribible, y el root SÍ arranca', (t) => {
  if (!vectorDisponible('escritura')) {
    t.skip('este entorno no sabe hacer un fichero no escribible (¿superusuario?)');
    return;
  }
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  const estado = rutaEstado(root);
  try {
    fs.writeFileSync(estado, `${JSON.stringify({ version: 1, volumes: {} }, null, 2)}\n`, 'utf8');
    bloqueaEscritura(estado);
    const antes = huellaArbol(root);

    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });

    assert.equal(res.ok, false);
    assert.equal(res.step, 'post-fusion');
    assert.equal(res.error, 'estado_no_escribible');
    assert.equal(res.aterrizado, true);
    assert.notEqual(huellaArbol(root), antes);
    // LA PRUEBA DEL REORDEN: el asiento ya está, porque el sello y el asiento
    // pasaron a ser un par sin nada en medio. En la base este mismo vector
    // dejaba el root SIN asiento y por tanto sin arrancar (§2·E2).
    assert.equal(res.asiento.kind, 'import_pack');
    assert.equal(hayAsientoDeImport(root), true);
    const v = verifyRootIntegrity();
    assert.equal(v.ok, true, JSON.stringify(v.findings));
  } finally {
    sueltaEscritura(estado);
    limpia();
    restore();
  }
});

test('E3 · árbol resultante ilegible → post-fusion/resultado_no_inspeccionable', (t) => {
  if (!vectorDisponible('listado')) {
    t.skip('este entorno no sabe denegar el listado de un directorio (¿superusuario?)');
    return;
  }
  const { root, restore } = setupRootConVolumen();
  const { packRoot, limpia } = buildPack();
  const opaco = path.join(root, 'DISK_07', 'DEMO', 'opaco');
  try {
    fs.mkdirSync(opaco, { recursive: true });
    fs.writeFileSync(path.join(opaco, 'x.txt'), 'x', 'utf8');
    bloqueaListado(opaco);

    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });

    assert.equal(res.ok, false);
    assert.equal(res.step, 'post-fusion');
    assert.equal(res.error, 'resultado_no_inspeccionable');
    assert.equal(res.aterrizado, true);
    assert.equal(res.asiento.kind, 'import_pack', 'el asiento va ANTES: el root arranca');
    causaViaja(res.causa, 'E3');
    assert.equal(aterrizo(root), true);
    assert.equal(res.staging.eliminado, true);
    const v = verifyRootIntegrity();
    assert.equal(v.ok, true, JSON.stringify(v.findings));
  } finally {
    sueltaListado(opaco);
    limpia();
    restore();
  }
});

test('E5 · ancla viva en el resultado → post-fusion/symlink_en_resultado, diciendo que aterrizó', (t) => {
  const { root, restore } = setupRootConVolumen();
  const { packRoot, limpia } = buildPack();
  try {
    try {
      fs.symlinkSync(
        path.join(root, 'DISK_07', 'DEMO', 'curated'),
        path.join(root, 'DISK_07', 'DEMO', 'ancla'),
        WIN ? 'junction' : 'dir'
      );
    } catch (err) {
      t.skip(`el entorno no permite plantar enlaces: ${err.message}`);
      return;
    }
    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });

    assert.equal(res.ok, false);
    // En la base era `step:'no-link'` y callaba que el corpus estaba aterrizado
    // y el manifiesto re-sellado: cumplía la letra y rompía la frase.
    assert.equal(res.step, 'post-fusion');
    assert.equal(res.error, 'symlink_en_resultado');
    assert.equal(res.aterrizado, true);
    assert.ok(res.symlinks.includes('ancla'), JSON.stringify(res.symlinks));
    assert.equal(res.asiento.kind, 'import_pack');
    assert.ok(res.sellado.after);
    // El cerco de arranque sigue viendo el ancla: la declaración no la absuelve.
    const c = scanRootCerco({ root });
    assert.ok(
      c.findings.some((f) => f.kind === 'enlace_vivo'),
      JSON.stringify(c.findings)
    );
    // Y la recuperación se EJECUTA, no se observa: retirada el ancla que la
    // respuesta enumera, el cerco deja de verla y el root queda íntegro.
    for (const rel of res.recuperacion.rutas) {
      fs.rmSync(path.join(root, 'DISK_07', 'DEMO', rel.split('/').join(path.sep)), {
        recursive: true,
        force: true
      });
    }
    assert.deepEqual(
      scanRootCerco({ root }).findings.filter((f) => f.kind === 'enlace_vivo'),
      []
    );
    assert.equal(verifyRootIntegrity().ok, true);
  } finally {
    limpia();
    restore();
  }
});

test('E6 · SELLAR lanzando → se REVIERTE: el root vuelve byte a byte y el import se puede repetir', (t) => {
  if (!vectorDisponible('escritura')) {
    t.skip('este entorno no sabe hacer un fichero no escribible (¿superusuario?)');
    return;
  }
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  const manifiesto = rutaManifiesto(root);
  try {
    bloqueaEscritura(manifiesto);
    // La huella se toma CON el bloqueo puesto: el atributo de sólo lectura es
    // parte del modo y entraría en la comparación si se tomara antes.
    const antes = huellaArbol(root);

    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });

    assert.equal(res.ok, false);
    assert.equal(res.step, 'sellar');
    assert.equal(res.error, 'sellar_interrumpido');
    assert.equal(res.aterrizado, false, 'se revirtió: NO quedó medio aterrizado');
    assert.equal(res.sellado, null);
    assert.equal(res.asiento, false);
    assert.deepEqual(res.revertido.sinDeshacer, []);
    assert.ok(res.revertido.renombradosHechos > 0, 'hubo fusión que deshacer');
    assert.equal(res.revertido.renombradosDeshechos, res.revertido.renombradosHechos);
    causaViaja(res.causa, 'E6');
    assert.equal(res.staging.eliminado, true);
    // CA-5 · hash del ÁRBOL ENTERO, no inspección de una ruta.
    assert.equal(huellaArbol(root), antes, 'el root volvió a lo que era');
    assert.equal(aterrizo(root), false);

    // La recuperación anunciada, ejecutada.
    assert.equal(res.recuperacion.via, 'importPack');
    sueltaEscritura(manifiesto);
    const r2 = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(r2.ok, true, JSON.stringify(r2).slice(0, 300));
    assert.equal(aterrizo(root), true);
    assert.equal(hayAsientoDeImport(root), true);
  } finally {
    sueltaEscritura(manifiesto);
    limpia();
    restore();
  }
});

// ── §3b · B1 · EL SELLO SE MUEVE ANTES DE QUE `sealManifest` DEVUELVA ───────
//
// `manifest.mjs:72-77` escribe en (b) y hashea en (d). La primera versión de
// este WP revertía en cuanto SELLAR lanzaba, **suponiendo** el manifiesto
// intacto; en la subventana entre (b) y (d) esa suposición es falsa y el revert
// devolvía el corpus al staging, donde el `finally` lo BORRABA. Los dos casos
// van aquí porque son el defecto que la contrarrevisión encontró, no un extra.

test('B1 · escritura COMPLETA y fallo después → NO se revierte, y el corpus SIGUE en destino', async () => {
  const inestable = escribeManifiestoInestable('completa');
  const mutante = await cargaMutante([], { 'manifest.mjs': inestable.url });
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  try {
    const selloAntes = selloDe(root);
    let lanzo = null;
    let res = null;
    try {
      res = mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    } catch (err) {
      lanzo = err;
    }
    assert.equal(lanzo, null, 'sigue sin escaparse como excepción');
    assert.equal(res.step, 'post-fusion');
    assert.equal(res.error, 'sello_sin_confirmar');
    // Lo que la versión anterior decía al revés:
    assert.equal(res.aterrizado, true, 'el corpus aterrizó y se DICE');
    assert.equal(aterrizo(root), true, 'y sigue en destino: NO se revirtió');
    assert.notEqual(res.sellado.after, null, 'el sello se midió, no se supuso');
    assert.equal(res.sellado.before, selloAntes);
    assert.notEqual(res.sellado.after, selloAntes, 'y CAMBIÓ');
    assert.equal(res.sellado.after, selloDe(root), 'el sello declarado es el que hay en disco');
    assert.equal(res.asiento, false);
    // Valor NUESTRO (lo lanza el sustituto de `manifest.mjs`), no del sistema:
    // fijarlo prueba que la causa llega verbatim. Ver `causaViaja`.
    assert.equal(res.causa.code, 'EIO');
    // Recuperación EJECUTABLE, y es la misma que E1 porque el estado es el mismo.
    assert.equal(res.recuperacion.via, 'appendOpsLedger');
    assert.equal(res.recuperacion.entrada.manifestSha256.after, selloDe(root));
    assert.deepEqual(res.recuperacion.entrada.volumes, ['demo']);
    assert.equal(verifyRootIntegrity().ok, false);
    appendOpsLedger(res.recuperacion.entrada, { ledgerPath: res.recuperacion.ledgerPath });
    const v = verifyRootIntegrity();
    assert.equal(v.ok, true, JSON.stringify(v.findings));
  } finally {
    limpia();
    restore();
    mutante.limpia();
    inestable.limpia();
  }
});

test('B1 · escritura TRUNCADA (disco lleno) → manifiesto_a_medias, y tampoco se borran los datos', async () => {
  const inestable = escribeManifiestoInestable('trunca');
  const mutante = await cargaMutante([], { 'manifest.mjs': inestable.url });
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  try {
    const selloAntes = selloDe(root);
    const res = mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.step, 'post-fusion');
    assert.equal(res.error, 'manifiesto_a_medias');
    assert.equal(res.aterrizado, true);
    assert.equal(aterrizo(root), true, 'el corpus sigue en destino: revertir lo habría borrado');
    assert.notEqual(res.sellado.after, selloAntes);
    assert.equal(res.asiento, false);
    assert.equal(res.causa.code, 'ENOSPC'); // inyectado por nosotros (ver `causaViaja`)
    assert.equal(res.recuperacion.via, 'operador');
    assert.deepEqual(res.recuperacion.volumenesEnDestino, [{ id: 'demo', path: 'DISK_07/DEMO' }]);
    // El manifiesto está roto de verdad: no se finge que se puede seguir.
    assert.throws(() => JSON.parse(fs.readFileSync(rutaManifiesto(root), 'utf8')));
  } finally {
    limpia();
    restore();
    mutante.limpia();
    inestable.limpia();
  }
});

test('B1 censo · sin la pregunta por el sello, el revert vuelve y BORRA el corpus', async () => {
  // Amputación exacta: se sustituye la comprobación por la suposición anterior
  // («si sealManifest lanzó, el sello está intacto»). Si esta prueba se quedara
  // verde, la guarda de B1 no estaría sosteniendo nada.
  const inestable = escribeManifiestoInestable('completa');
  const mutante = await cargaMutante(
    {
      re: /const selloIntacto = vivo !== null && vivo\.sha256 === sealBefore\.sha256;/g,
      con: 'const selloIntacto = true;',
      veces: 1
    },
    { 'manifest.mjs': inestable.url }
  );
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  try {
    const res = mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.error, 'sellar_interrumpido', 'vuelve a la salida de la versión anterior');
    assert.equal(res.aterrizado, false, 'y vuelve a declararlo al revés…');
    assert.equal(res.sellado, null);
    assert.equal(aterrizo(root), false, '…mientras BORRA el corpus del usuario');
    const v = verifyRootIntegrity();
    assert.equal(v.ok, false);
    assert.ok(
      v.findings.some((f) => f.error === 'volumen_ausente'),
      `el manifiesto declara un volumen cuyos ficheros ya no existen: ${JSON.stringify(v.findings)}`
    );
  } finally {
    limpia();
    restore();
    mutante.limpia();
    inestable.limpia();
  }
});

/**
 * Sustituto de `fusion-guard.mjs` cuyo `deshacerFusion` deja el PRIMER
 * movimiento sin deshacer y lo declara. Es la forma exacta que produce el
 * módulo real cuando un rename de vuelta falla — conducta ya probada con un
 * fallo REAL en `fusion-guard.test.mjs:721-723`. Lo que se ejercita aquí es la
 * otra mitad: la TRADUCCIÓN de ese inventario al contrato de `importPack`, que
 * es la rama que sostiene el argumento «un rollback que puede fallar exige
 * declarar el medio-aterrizaje igual». No hay vector portable para hacer
 * fracasar un rename de vuelta desde dentro de `importPack` (declarado).
 */
function escribeFusionParcial() {
  const abs = path.join(AQUI, `.fusion-parcial-${process.pid}-${semillaMutante++}.mjs`);
  fs.writeFileSync(
    abs,
    `import { deshacerFusion as deshacerDeVerdad } from ${JSON.stringify(urlSrc('fusion-guard.mjs'))};
export * from ${JSON.stringify(urlSrc('fusion-guard.mjs'))};
export function deshacerFusion(aplicados) {
  const r = deshacerDeVerdad(aplicados.slice(1));
  return {
    deshechos: r.deshechos,
    sinDeshacer: [
      ...r.sinDeshacer,
      {
        to: aplicados[0].to,
        from: aplicados[0].from,
        causa: { name: 'Error', code: 'EPERM', syscall: 'rename', message: 'inyectado' }
      }
    ]
  };
}
`,
    'utf8'
  );
  return { url: pathToFileURL(abs).href, limpia: () => fs.rmSync(abs, { force: true }) };
}

test('E6b · revert que NO consigue deshacerlo todo → aterrizado:true y recuperación de operador', async (t) => {
  if (!vectorDisponible('escritura')) {
    t.skip('este entorno no sabe hacer un fichero no escribible (¿superusuario?)');
    return;
  }
  const parcial = escribeFusionParcial();
  const mutante = await cargaMutante([], { 'fusion-guard.mjs': parcial.url });
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  const manifiesto = rutaManifiesto(root);
  try {
    bloqueaEscritura(manifiesto);
    const res = mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.step, 'sellar');
    assert.equal(res.error, 'sellar_interrumpido');
    // La rama que faltaba por cubrir, y es la que sostiene la razón #1 de la
    // decisión: cuando el rollback no llega, se DICE que aterrizó.
    assert.equal(res.aterrizado, true);
    assert.equal(res.revertido.sinDeshacer.length, 1);
    // Inyectado por el sustituto de `fusion-guard.mjs`, no por el sistema.
    assert.equal(res.revertido.sinDeshacer[0].causa.code, 'EPERM');
    assert.equal(res.recuperacion.via, 'operador');
    assert.deepEqual(res.recuperacion.rutas, [path.join(root, 'DISK_07', 'DEMO')]);
    // Y el disco le da la razón al parte: lo no deshecho sigue en destino.
    assert.equal(aterrizo(root), true);
  } finally {
    sueltaEscritura(manifiesto);
    limpia();
    restore();
    mutante.limpia();
    parcial.limpia();
  }
});

// ── §4 · Las recuperaciones, EJECUTADAS ────────────────────────────────────

test('CA-2 · recuperación del asiento: apendar la entrada devuelta hace arrancar el root', (t) => {
  if (!vectorDisponible('escritura')) {
    t.skip('este entorno no sabe hacer un fichero no escribible (¿superusuario?)');
    return;
  }
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  const ledger = rutaLedger(root);
  try {
    fs.writeFileSync(ledger, '', 'utf8');
    bloqueaEscritura(ledger);
    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.error, 'asiento_no_escribible');
    assert.equal(res.recuperacion.via, 'appendOpsLedger');
    assert.equal(res.recuperacion.ledgerPath, ledger);
    assert.equal(res.recuperacion.entrada.kind, 'import_pack');
    assert.equal(res.recuperacion.entrada.manifestSha256.after, selloDe(root));
    assert.equal(res.recuperacion.entrada.manifestSha256.before, res.sellado.before);
    // El asiento debe nombrar los volúmenes: un `volumes: []` pasaba antes.
    assert.deepEqual(res.recuperacion.entrada.volumes, ['demo']);
    assert.equal(res.recuperacion.entrada.role, 'operator');
    assert.equal(res.recuperacion.entrada.pack.packHash.length, 64);
    assert.equal(verifyRootIntegrity().ok, false);

    // La recuperación es EJECUTABLE, no un consejo: la entrada exacta viaja.
    sueltaEscritura(ledger);
    appendOpsLedger(res.recuperacion.entrada, { ledgerPath: res.recuperacion.ledgerPath });
    const v = verifyRootIntegrity();
    assert.equal(v.ok, true, JSON.stringify(v.findings));
  } finally {
    sueltaEscritura(ledger);
    limpia();
    restore();
  }
});

test('CA-2 · recuperación del estado vivo: re-medir escribe lo que faltaba', (t) => {
  if (!vectorDisponible('escritura')) {
    t.skip('este entorno no sabe hacer un fichero no escribible (¿superusuario?)');
    return;
  }
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  const estado = rutaEstado(root);
  try {
    fs.writeFileSync(estado, `${JSON.stringify({ version: 1, volumes: {} }, null, 2)}\n`, 'utf8');
    bloqueaEscritura(estado);
    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.error, 'estado_no_escribible');
    assert.equal(res.recuperacion.via, 'syncVolumeCounters');
    assert.deepEqual(res.recuperacion.volumenes, ['demo']);

    sueltaEscritura(estado);
    for (const volId of res.recuperacion.volumenes) syncVolumeCounters(volId);
    const st = JSON.parse(fs.readFileSync(estado, 'utf8'));
    assert.ok(st.volumes.demo.files > 0, JSON.stringify(st));
    assert.equal(st.manifest.sha256, selloDe(root));
  } finally {
    sueltaEscritura(estado);
    limpia();
    restore();
  }
});

test('CA-2 · recuperación de la inspección: recuperado el permiso, la pregunta se vuelve a hacer', (t) => {
  if (!vectorDisponible('listado')) {
    t.skip('este entorno no sabe denegar el listado de un directorio (¿superusuario?)');
    return;
  }
  const { root, restore } = setupRootConVolumen();
  const { packRoot, limpia } = buildPack();
  const opaco = path.join(root, 'DISK_07', 'DEMO', 'opaco');
  try {
    fs.mkdirSync(opaco, { recursive: true });
    fs.writeFileSync(path.join(opaco, 'x.txt'), 'x', 'utf8');
    bloqueaListado(opaco);
    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.error, 'resultado_no_inspeccionable');
    assert.equal(res.recuperacion.via, 'assertVolumesRootBootable');

    sueltaListado(opaco);
    const c = scanRootCerco({ root });
    assert.deepEqual(
      c.findings.filter((f) => f.kind === 'enlace_vivo'),
      [],
      'recorrido ya legible: ninguna ancla viva'
    );
    assert.equal(verifyRootIntegrity().ok, true);
  } finally {
    sueltaListado(opaco);
    limpia();
    restore();
  }
});

// ── §5 · CENSO DE MUTACIÓN ─────────────────────────────────────────────────

/**
 * Construye un `import.mjs` MUTANTE. Normalmente con UNA amputación —la regla es
 * que un negativo no está verificado hasta que se desactiva **su** guardián y se
 * comprueba que enrojece, y con las amputaciones mezcladas no se sabría cuál
 * sostiene cuál—; cuando hacen falta dos se dice y se dice por qué.
 *
 * `redirige` cambia el MÓDULO al que apunta un `import` relativo, sin tocar una
 * sola línea de la lógica de `import.mjs`. Es lo que permite ejercitar el
 * `catch` de SELLAR con un `sealManifest` que falla como falla un disco lleno:
 * el código bajo prueba queda **idéntico al que se entrega**, y lo sustituido es
 * la pieza que no se puede reventar de verdad en una suite portable.
 *
 * El mutante se escribe DENTRO de `test/` para que sus especificadores desnudos
 * (`@zeus/…`) sigan resolviendo por la cadena del paquete; los relativos se
 * reescriben a URL absoluta de `src/`, así que usa los MISMOS módulos que el
 * original. Lee del DISCO: corriendo esto contra una base sin las guardas, la
 * prueba enrojece por no encontrar qué amputar, que también es información.
 *
 * @param {{re:RegExp, con:string, veces:number}|{re:RegExp, con:string, veces:number}[]} amputaciones
 * @param {Record<string,string>} [redirige] — `'manifest.mjs' → <url del sustituto>`
 */
let semillaMutante = 0;
async function cargaMutante(amputaciones = [], redirige = {}) {
  const lista = Array.isArray(amputaciones) ? amputaciones : [amputaciones];
  let mutada = fs.readFileSync(path.join(SRC, 'import.mjs'), 'utf8');
  for (const amputacion of lista) {
    const casados = mutada.match(amputacion.re);
    assert.equal(
      casados ? casados.length : 0,
      amputacion.veces,
      `la amputación ${amputacion.re} debía tocar ${amputacion.veces} sitio(s)`
    );
    mutada = mutada.replace(amputacion.re, amputacion.con);
  }
  mutada = mutada.replace(
    / from '\.\/([^']+)'/g,
    (_, f) => ` from ${JSON.stringify(redirige[f] ?? pathToFileURL(path.join(SRC, f)).href)}`
  );
  const abs = path.join(AQUI, `.mutante-u268-${process.pid}-${semillaMutante++}.mjs`);
  fs.writeFileSync(abs, mutada, 'utf8');
  try {
    const mod = await import(pathToFileURL(abs).href);
    return { importPack: mod.importPack, limpia: () => fs.rmSync(abs, { force: true }) };
  } catch (err) {
    fs.rmSync(abs, { force: true });
    throw err;
  }
}

const urlSrc = (f) => pathToFileURL(path.join(SRC, f)).href;

/**
 * Sustituto de `manifest.mjs` que reproduce el ESTADO EN DISCO de los dos fallos
 * que dejan el sello movido y hacen lanzar a `sealManifest`
 * (`manifest.mjs:72-77` escribe en (b) y hashea en (d)):
 *  - `trunca`: `writeFileSync` trunca al abrir y muere a media escritura —
 *    disco lleno. El manifiesto queda TRUNCADO y sealManifest lanza `ENOSPC`;
 *  - `completa`: la escritura termina (se usa el sellador REAL, así que los
 *    bytes son exactamente los suyos) y el fallo llega después, donde el hash.
 * Todo lo demás del módulo se re-exporta sin tocar.
 * @param {'trunca'|'completa'} modo
 */
function escribeManifiestoInestable(modo) {
  const abs = path.join(AQUI, `.manifiesto-inestable-${process.pid}-${semillaMutante++}.mjs`);
  fs.writeFileSync(
    abs,
    `import fs from 'node:fs';
import { sealManifest as sellarDeVerdad, resolveManifestPath } from ${JSON.stringify(urlSrc('manifest.mjs'))};
export * from ${JSON.stringify(urlSrc('manifest.mjs'))};
export function sealManifest(config) {
  if (${JSON.stringify(modo)} === 'trunca') {
    fs.writeFileSync(resolveManifestPath(), \`\${JSON.stringify(config, null, 2)}\\n\`.slice(0, 40), 'utf8');
    const e = new Error('ENOSPC: no space left on device, write');
    e.code = 'ENOSPC';
    e.syscall = 'write';
    throw e;
  }
  sellarDeVerdad(config);
  const e = new Error('EIO: i/o error, read');
  e.code = 'EIO';
  e.syscall = 'read';
  throw e;
}
`,
    'utf8'
  );
  return { url: pathToFileURL(abs).href, limpia: () => fs.rmSync(abs, { force: true }) };
}

/** `throw err;` al principio del `catch`: desactiva ESE tramo con nombre. */
const relanza = (codigo) => ({
  re: new RegExp(`return trasFusion\\('${codigo}'`, 'g'),
  con: `throw err; return trasFusion('${codigo}'`,
  veces: 1
});
/** La red de última línea, desactivada. */
const SIN_RED = relanza('post_sello_interrumpido');

/**
 * Amputado un envoltorio con nombre, la red de abajo lo recoge: el fallo ya no
 * se escapa, pero **pierde su código y su recuperación**, que es exactamente lo
 * que ese envoltorio compra. Se comprueba las dos cosas: que el código
 * específico desaparece y que la red da el genérico.
 */
async function censoDeEnvoltorio({ codigo, prepara, suelta, conVolumen = false }) {
  const mutante = await cargaMutante(relanza(codigo));
  const s = conVolumen ? setupRootConVolumen() : setupRoot();
  const { packRoot, limpia } = buildPack();
  try {
    prepara(s.root);
    const res = mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.ok, false);
    assert.notEqual(
      res.error,
      codigo,
      `amputado el envoltorio, ${codigo} NO puede seguir saliendo`
    );
    assert.equal(res.error, 'post_sello_interrumpido', 'lo recoge la red, sin nombre propio');
    assert.equal(res.aterrizado, true);
    return { res, root: s.root };
  } finally {
    suelta?.(s.root);
    limpia();
    s.restore();
    mutante.limpia();
  }
}

test('CENSO · sin el envoltorio del asiento, se pierde el código y la nota propios', async (t) => {
  if (!vectorDisponible('escritura')) {
    t.skip('este entorno no sabe hacer un fichero no escribible (¿superusuario?)');
    return;
  }
  await censoDeEnvoltorio({
    codigo: 'asiento_no_escribible',
    prepara: (root) => {
      fs.writeFileSync(rutaLedger(root), '', 'utf8');
      bloqueaEscritura(rutaLedger(root));
    },
    suelta: (root) => sueltaEscritura(rutaLedger(root))
  });
});

test('CENSO · sin el envoltorio de los contadores, se pierde su código', async (t) => {
  if (!vectorDisponible('escritura')) {
    t.skip('este entorno no sabe hacer un fichero no escribible (¿superusuario?)');
    return;
  }
  await censoDeEnvoltorio({
    codigo: 'estado_no_escribible',
    prepara: (root) => {
      fs.writeFileSync(
        rutaEstado(root),
        `${JSON.stringify({ version: 1, volumes: {} }, null, 2)}\n`,
        'utf8'
      );
      bloqueaEscritura(rutaEstado(root));
    },
    suelta: (root) => sueltaEscritura(rutaEstado(root))
  });
});

test('CENSO · sin el envoltorio de NO-LINK, se pierde su código', async (t) => {
  if (!vectorDisponible('listado')) {
    t.skip('este entorno no sabe denegar el listado de un directorio (¿superusuario?)');
    return;
  }
  const opacoDe = (root) => path.join(root, 'DISK_07', 'DEMO', 'opaco');
  await censoDeEnvoltorio({
    codigo: 'resultado_no_inspeccionable',
    conVolumen: true,
    prepara: (root) => {
      fs.mkdirSync(opacoDe(root), { recursive: true });
      fs.writeFileSync(path.join(opacoDe(root), 'x.txt'), 'x', 'utf8');
      bloqueaListado(opacoDe(root));
    },
    suelta: (root) => sueltaListado(opacoDe(root))
  });
});

test('CENSO · sin la RED y sin el envoltorio, la excepción vuelve a ESCAPARSE (conducta de la base)', async (t) => {
  if (!vectorDisponible('escritura')) {
    t.skip('este entorno no sabe hacer un fichero no escribible (¿superusuario?)');
    return;
  }
  // Dos amputaciones a la vez, y se dice por qué: la promesa «ninguna excepción
  // escapa de la zona posterior a FUSIONAR» la sostienen ENTRE LOS DOS, así que
  // el negativo de esa frase exige quitar los dos. Con uno solo, el otro tapa.
  const mutante = await cargaMutante([SIN_RED, relanza('asiento_no_escribible')]);
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  const ledger = rutaLedger(root);
  try {
    fs.writeFileSync(ledger, '', 'utf8');
    bloqueaEscritura(ledger);
    const antes = huellaArbol(root);
    let lanzo = null;
    try {
      mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    } catch (err) {
      lanzo = err;
    }
    assert.ok(lanzo, 'sin red ni envoltorio DEBE volver a lanzar');
    causaViaja(lanzo, 'excepción escapada');
    assert.notEqual(huellaArbol(root), antes, 'y con el root ya mutado');
    assert.equal(aterrizo(root), true);
    assert.equal(hayAsientoDeImport(root), false);
  } finally {
    sueltaEscritura(ledger);
    limpia();
    restore();
    mutante.limpia();
  }
});

test('B2 · un fallo en el hueco sello↔asiento sale por la RED, no como excepción', async () => {
  // El hueco exacto que señaló la contrarrevisión: el `steps.push` de `sellar`
  // corría sin envolver entre el sello y el asiento. Se le inyecta un fallo ahí
  // —no hay vector natural para que un `.map` reviente— y se exige que salga por
  // el contrato con el asiento YA escrito.
  // El ancla evita saltos de línea: `src/` está en CRLF y un patrón con `\n`
  // no casaría (lo aprendimos enrojeciendo, no razonándolo).
  const mutante = await cargaMutante({
    re: / {8}step: 'sellar',/g,
    con: "        step: (() => { const e = new Error('inyectado en el hueco'); e.code = 'ETEST'; throw e; })(),",
    veces: 1
  });
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  try {
    let lanzo = null;
    let res = null;
    try {
      res = mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    } catch (err) {
      lanzo = err;
    }
    assert.equal(lanzo, null, 'la red impide que se escape');
    assert.equal(res.ok, false);
    assert.equal(res.step, 'post-fusion');
    assert.equal(res.error, 'post_sello_interrumpido');
    assert.equal(res.causa.code, 'ETEST'); // inyectado por nosotros (ver `causaViaja`)
    assert.equal(res.aterrizado, true);
    // El asiento ya estaba: por eso el root sigue arrancando pese al fallo.
    assert.equal(res.asiento.kind, 'import_pack');
    assert.equal(hayAsientoDeImport(root), true);
    assert.equal(verifyRootIntegrity().ok, true);
  } finally {
    limpia();
    restore();
    mutante.limpia();
  }
});

test('CENSO · restaurado el ORDEN de la base (contadores antes del asiento), el root deja de arrancar', async (t) => {
  if (!vectorDisponible('escritura')) {
    t.skip('este entorno no sabe hacer un fichero no escribible (¿superusuario?)');
    return;
  }
  // Se REINSERTA la llamada donde estaba en la base —entre el sello y el
  // asiento, sin envolver— sin quitar la de después. Es la amputación que aísla
  // el REORDEN de los envoltorios: si el orden no fuera portante, este caso
  // seguiría dando asiento y root arrancable, y no lo hace.
  // El ancla no lleva salto de línea a propósito: `src/` está en CRLF y un
  // patrón con `\n` no casaría (lo aprendimos enrojeciendo, no razonándolo).
  const mutante = await cargaMutante({
    re: / {4}let seat = null;/g,
    con: '    for (const volId of Object.keys(pack.volumes)) syncVolumeCounters(volId);\n    let seat = null;',
    veces: 1
  });
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  const estado = rutaEstado(root);
  try {
    fs.writeFileSync(estado, `${JSON.stringify({ version: 1, volumes: {} }, null, 2)}\n`, 'utf8');
    bloqueaEscritura(estado);
    const selloAntes = selloDe(root);
    let lanzo = null;
    let res = null;
    try {
      res = mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    } catch (err) {
      lanzo = err;
    }
    // Con el orden de la base el fallo cae ENTRE el sello y el asiento. La red
    // de última línea impide que se escape —por eso ya no se exige «lanza»—,
    // pero lo que el REORDEN compraba se pierde igual, y eso es lo que se mide.
    assert.ok(lanzo || res?.error === 'post_sello_interrumpido', JSON.stringify(res));
    assert.equal(aterrizo(root), true, 'corpus aterrizado');
    assert.notEqual(selloDe(root), selloAntes, 'manifiesto ya re-sellado');
    assert.equal(hayAsientoDeImport(root), false, 'y CERO asiento: eso es lo que el orden evita');
    const v = verifyRootIntegrity();
    assert.equal(v.ok, false, 'y el root NO arranca');
    assert.ok(
      v.findings.some((f) => f.error === 'ledger_ausente'),
      JSON.stringify(v.findings)
    );
  } finally {
    sueltaEscritura(estado);
    limpia();
    restore();
    mutante.limpia();
  }
});

test('CENSO · sin el deshacer de SELLAR, el root queda a medias y el import NO se puede repetir', async (t) => {
  if (!vectorDisponible('escritura')) {
    t.skip('este entorno no sabe hacer un fichero no escribible (¿superusuario?)');
    return;
  }
  const mutante = await cargaMutante({
    re: /const vuelta = deshacerFusion\(aplicacion\.movimientos\);/g,
    con: 'const vuelta = { deshechos: [], sinDeshacer: [] };',
    veces: 1
  });
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  const manifiesto = rutaManifiesto(root);
  try {
    bloqueaEscritura(manifiesto);
    const antes = huellaArbol(root);
    const res = mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.error, 'sellar_interrumpido');
    assert.notEqual(huellaArbol(root), antes, 'sin el deshacer el root SÍ queda tocado');
    assert.equal(aterrizo(root), true, 'con el corpus en destino y sin entrada en el manifiesto');
    // Y por eso hacía falta: la segunda pasada ya no puede reparar nada.
    sueltaEscritura(manifiesto);
    const r2 = mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(r2.ok, false);
    assert.equal(r2.error, 'slot_ocupado', JSON.stringify(r2).slice(0, 200));
  } finally {
    sueltaEscritura(manifiesto);
    limpia();
    restore();
    mutante.limpia();
  }
});

test('CENSO · con el `finally` desnudo, el import COMPLETO vuelve a morir por el conserje', async (t) => {
  if (!vectorDisponible('borrado')) {
    t.skip('este entorno no sabe impedir el borrado de un directorio (¿superusuario?)');
    return;
  }
  const mutante = await cargaMutante({
    re: /const r = limpiarStaging\(stagingDir\);/g,
    con: 'const r = { eliminado: true, causa: null }; rmSync(stagingDir, { recursive: true, force: true });',
    veces: 1
  });
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  let suelta = () => {};
  try {
    conStagingPredecible(root, (stagingDir) => {
      const bloqueo = path.join(stagingDir, 'bloqueo');
      fs.mkdirSync(bloqueo, { recursive: true });
      fs.writeFileSync(path.join(bloqueo, 'x.txt'), 'x', 'utf8');
      suelta = bloqueaBorrado(bloqueo);
      let lanzo = null;
      let salida = null;
      try {
        salida = mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
      } catch (err) {
        lanzo = err;
      }
      assert.ok(lanzo, 'sin `limpiarStaging` el `finally` vuelve a lanzar');
      assert.equal(salida, null, 'y se lleva por delante el return');
      // Lo que hace que éste fuera el peor: el import HABÍA TERMINADO.
      assert.equal(aterrizo(root), true);
      assert.equal(
        hayAsientoDeImport(root),
        true,
        'con asiento y todo: éxito indistinguible de fallo'
      );
    });
  } finally {
    suelta();
    limpia();
    restore();
    mutante.limpia();
  }
});

test('CENSO · sin la declaración del ancla, `symlink_en_resultado` vuelve a callar que aterrizó', async (t) => {
  const mutante = await cargaMutante({
    re: /return trasFusion\('symlink_en_resultado', \{/g,
    con: "return fail('no-link', 'symlink_en_resultado', {",
    veces: 1
  });
  const { root, restore } = setupRootConVolumen();
  const { packRoot, limpia } = buildPack();
  try {
    try {
      fs.symlinkSync(
        path.join(root, 'DISK_07', 'DEMO', 'curated'),
        path.join(root, 'DISK_07', 'DEMO', 'ancla'),
        WIN ? 'junction' : 'dir'
      );
    } catch (err) {
      t.skip(`el entorno no permite plantar enlaces: ${err.message}`);
      return;
    }
    const res = mutante.importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'no-link', 'vuelve al paso de la base');
    assert.equal(res.aterrizado, undefined, 'y deja de decir que el corpus aterrizó');
    assert.equal(res.sellado, undefined, 'y de decir con qué sello');
    assert.equal(aterrizo(root), true, 'aunque aterrizó');
  } finally {
    limpia();
    restore();
    mutante.limpia();
  }
});

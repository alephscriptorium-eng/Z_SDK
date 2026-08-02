/**
 * WP-U253 · Dos evasiones que ningún probe del carril D veía.
 *
 * (1) SONDA POR OPERACIÓN. El censo heredado (WP-U205,
 *     `packages/mesh/ssb-system/test/export.test.mjs:394-400`) marca un
 *     escritor del manifiesto por CO-OCURRENCIA de texto: una primitiva de
 *     escritura Y el token del manifiesto (`'volumes.json'` entrecomillado o
 *     `MANIFEST_FILE_NAME`). Como `resolveManifestPath()` es pública, un
 *     escritor puede no contener NINGUNO de los dos tokens. Aquí la sonda no
 *     lee código: fotografía el FICHERO en la ruta que ella misma resuelve,
 *     antes y después. Lo que ancla es la OPERACIÓN, no la NOTACIÓN.
 *
 * (2) CERCO DE `ledgerPath`. Se devolvía verbatim y sin validar.
 *
 * Alcance declarado de la sonda (lo que NO promete):
 * - Es DINÁMICA: sólo ve lo que se EJECUTA. No sustituye al censo estático
 *   del repo, que cubre ficheros sin ejecutarlos. Son complementarias.
 * - Detecta por bytes (existencia + sha256 + tamaño). Una reescritura de
 *   bytes IDÉNTICOS es invisible para ella. Medido en este WP: `mtime` no
 *   sirve para cerrar ese hueco (cambia de forma INTERMITENTE ante
 *   reescrituras idénticas en win32), así que no se usa como canal y el
 *   hueco se declara. Nótese que el sello ES el sha256 de los bytes: una
 *   escritura que preserva los bytes preserva el sello, aunque viole la
 *   lectura-sólo.
 * - Es CIEGA A LA ESCRITURA QUE TERMINA MÁS TARDE: mide justo después de que
 *   `fn` retorna. Una escritura diferida no está en la foto (pinchado en la
 *   prueba «LÍMITE»). Con `fs/promises.writeFile` sin esperar es peor que un
 *   hueco: es una CARRERA, medida aquí como cazada en unas ejecuciones y
 *   perdida en otras. Por eso NO se afirma que la notación le sea
 *   indiferente: le es indiferente cómo se NOMBRE la ruta, no cuándo
 *   termine la escritura.
 * - Es ciega al FLUJO DE DATOS ALTERNO: `volumes.json:x` cambia el fichero
 *   sin cambiar los bytes del flujo principal, que es lo que ella lee. El
 *   cerco sí lo deniega (§6bis); la sonda no lo vería.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import {
  appendOpsLedger,
  readOpsLedger,
  resolveOpsLedgerPath,
  resolveManifestPath,
  sealManifest,
  hashManifest,
  scanRootCerco,
  measureAllVolumes,
  importPack,
  DEFAULT_LEDGER_NAME,
  ARTEFACTOS_VEDADOS
} from '../src/index.mjs';

const SRC = path.resolve(import.meta.dirname, '..', 'src');
const sha256 = (b) => createHash('sha256').update(b).digest('hex');

// ── Arnés: root temporal sellado ───────────────────────────────────────────

function setupRoot(manifest = { root: '.', volumes: {} }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'u253-'));
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
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

// ── §1 · LA SONDA (ancla la operación) ─────────────────────────────────────

/** Canales de evidencia. `sha256` es el que caza cambio a igual tamaño. */
const CANALES = Object.freeze(['existe', 'sha256', 'bytes']);

function fotografia(ruta) {
  if (!fs.existsSync(ruta)) return { existe: false, sha256: null, bytes: -1 };
  const raw = fs.readFileSync(ruta);
  return { existe: true, sha256: sha256(raw), bytes: raw.length };
}

/**
 * Ejecuta `fn` y responde si el FICHERO del manifiesto cambió. No mira el
 * código de `fn`: la ruta la resuelve la sonda. `canales` existe para el
 * censo de mutación (§4): amputarlo debe cegarla.
 */
function vigilaManifiesto(fn, { canales = CANALES } = {}) {
  const ruta = resolveManifestPath();
  const antes = fotografia(ruta);
  let error = null;
  try {
    fn();
  } catch (e) {
    error = e;
  }
  const despues = fotografia(ruta);
  const tocados = canales.filter((c) => antes[c] !== despues[c]);
  return { ruta, antes, despues, tocados, mutado: tocados.length > 0, error };
}

/** `assert.throws` NO devuelve el error; para mirarle el `code` hay que cazarlo. */
function capturaError(fn, motivo) {
  try {
    fn();
  } catch (e) {
    return e;
  }
  assert.fail(`${motivo}: debía lanzar y no lanzó`);
  return null;
}

/** Predicado del censo heredado, copiado VERBATIM de export.test.mjs:394-400. */
const PRIMITIVAS_DE_ESCRITURA =
  /\b(writeFileSync|appendFileSync|createWriteStream|rmSync|unlinkSync|renameSync|copyFileSync)\b/;
const TOKEN_DE_MANIFIESTO = /(['"`])volumes\.json\1|MANIFEST_FILE_NAME/;
function marcaEscritorDeManifiesto(source) {
  return PRIMITIVAS_DE_ESCRITURA.test(source) && TOKEN_DE_MANIFIESTO.test(source);
}

// ── §2 · Tres NOTACIONES del vector (1), como ficheros REALES ──────────────

const URL_MANIFEST = JSON.stringify(pathToFileURL(path.join(SRC, 'manifest.mjs')).href);

/**
 * Cada ofensor es un módulo .mjs de verdad, escrito a disco, importado y
 * ejecutado. No son imitaciones en una cadena: son escritores vivos.
 */
const OFENSORES = {
  'A · indirección por función': `
import { writeFileSync } from 'node:fs';
import { resolveManifestPath } from ${URL_MANIFEST};
export function ataca(root, payload) {
  writeFileSync(resolveManifestPath(), payload, 'utf8');
}
`,
  'B · alias de la primitiva y del localizador': `
import { writeFileSync as escribeBytes } from 'node:fs';
import { resolveManifestPath as dondeVive } from ${URL_MANIFEST};
export function ataca(root, payload) {
  escribeBytes(dondeVive(), payload, 'utf8');
}
`,
  'C · composición de cadena (el literal nunca existe)': `
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const PIEZAS = ['volumes', 'json'];
export function ataca(root, payload) {
  writeFileSync(join(root, PIEZAS.join('.')), payload, 'utf8');
}
`
};

let semilla = 0;
async function cargaOfensor(fuente) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'u253-ofensor-'));
  const abs = path.join(dir, `ofensor-${semilla++}.mjs`);
  fs.writeFileSync(abs, fuente, 'utf8');
  const mod = await import(pathToFileURL(abs).href);
  return { ataca: mod.ataca, fuente, limpia: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('CA-1 · los TRES ofensores son INVISIBLES al censo por notación', async () => {
  for (const [nombre, fuente] of Object.entries(OFENSORES)) {
    assert.equal(
      marcaEscritorDeManifiesto(fuente),
      false,
      `el censo heredado NO marca al ofensor ${nombre} — esa es la puerta`
    );
  }
  // Y no es que el predicado esté roto: un escritor con la notación ingenua
  // SÍ lo marca. El predicado funciona; lo que falla es lo que ancla.
  assert.equal(
    marcaEscritorDeManifiesto(
      "import { writeFileSync } from 'node:fs';\nwriteFileSync(join(root, 'volumes.json'), x);"
    ),
    true
  );
});

test('CA-1 · la sonda por OPERACIÓN caza a los tres, ejecutados de verdad', async () => {
  for (const [nombre, fuente] of Object.entries(OFENSORES)) {
    const { root, restore } = setupRoot();
    const ofensor = await cargaOfensor(fuente);
    try {
      const sello = hashManifest().sha256;
      const r = vigilaManifiesto(() => ofensor.ataca(root, '{"secuestrado":true}\n'));
      assert.equal(r.error, null, `${nombre}: el ofensor debía escribir sin fallar`);
      assert.equal(r.mutado, true, `${nombre}: la sonda DEBE cazar la escritura`);
      assert.deepEqual(r.tocados, ['sha256', 'bytes'], `${nombre}: canales tocados`);
      assert.notEqual(hashManifest().sha256, sello, `${nombre}: el sello se rompió`);
    } finally {
      ofensor.limpia();
      restore();
    }
  }
});

// ── §3 · CONTROLES: la sonda no es un sí-constante ni un no-constante ──────

test('CA-1 control · sin escritura la sonda calla; con el escritor LEGÍTIMO habla', () => {
  const { root, restore } = setupRoot();
  try {
    // (a) no-constante: una operación que no toca el manifiesto no lo marca.
    const quieto = vigilaManifiesto(() => {});
    assert.equal(quieto.mutado, false);
    assert.deepEqual(quieto.tocados, []);

    // (b) sí-constante: `sealManifest` es el ÚNICO escritor legítimo y la
    //     sonda lo ve igual que a un intruso. La sonda mide operación, no
    //     legitimidad: quién puede escribir es una decisión de otra capa.
    const legitimo = vigilaManifiesto(() =>
      sealManifest({ root: '.', volumes: {}, note: 'resellado por el escritor legitimo' })
    );
    assert.equal(legitimo.error, null);
    assert.equal(legitimo.mutado, true);
  } finally {
    restore();
  }
});

// ── §4 · CENSO DE MUTACIÓN: la sonda no es tautológica ─────────────────────

test('CA-4 · amputada la vigilancia, la sonda deja de cazar a los tres', async () => {
  for (const [nombre, fuente] of Object.entries(OFENSORES)) {
    const { root, restore } = setupRoot();
    const ofensor = await cargaOfensor(fuente);
    try {
      // MUTANTE: se le quitan TODOS los canales — el trozo que dice vigilar.
      const ciega = vigilaManifiesto(() => ofensor.ataca(root, '{"secuestrado":true}\n'), {
        canales: []
      });
      assert.equal(
        ciega.mutado,
        false,
        `${nombre}: sin canales la sonda DEBE quedarse ciega (si no, la aserción no la sostenía la vigilancia)`
      );
      // Y la escritura ocurrió de verdad: el mutante no es que no pasara nada.
      assert.notEqual(ciega.antes.sha256, ciega.despues.sha256);
    } finally {
      ofensor.limpia();
      restore();
    }
  }
});

test('CA-4 · el canal `sha256` es portante: sin él, un cambio a IGUAL TAMAÑO pasa', () => {
  const { root, restore } = setupRoot();
  try {
    const ruta = path.join(root, 'volumes.json');
    const original = fs.readFileSync(ruta);
    // Payload del MISMO tamaño y contenido distinto: `bytes` no se entera.
    const mismoTam = Buffer.from(original);
    mismoTam[mismoTam.length - 2] = mismoTam[mismoTam.length - 2] === 0x20 ? 0x09 : 0x20;
    assert.equal(mismoTam.length, original.length);
    assert.notDeepEqual(mismoTam, original);

    const escribe = () => fs.writeFileSync(ruta, mismoTam);

    const conHash = vigilaManifiesto(escribe, { canales: ['existe', 'sha256', 'bytes'] });
    assert.equal(conHash.mutado, true);
    assert.deepEqual(conHash.tocados, ['sha256']);

    fs.writeFileSync(ruta, original);
    const sinHash = vigilaManifiesto(escribe, { canales: ['existe', 'bytes'] });
    assert.equal(
      sinHash.mutado,
      false,
      'sin el canal de hash el cambio a igual tamaño es invisible: el canal es portante, no decorativo'
    );
  } finally {
    restore();
  }
});

// ── §5 · Regresión de producto bajo la sonda ───────────────────────────────

test('CA-1 · operaciones reales del paquete NO escriben el manifiesto', () => {
  const { root, restore } = setupRoot();
  try {
    const r = vigilaManifiesto(() => {
      hashManifest();
      measureAllVolumes();
      scanRootCerco();
      appendOpsLedger({ kind: 'ops', actorId: 'probe' });
      readOpsLedger();
    });
    assert.equal(r.error, null, `no debía fallar: ${r.error && r.error.message}`);
    assert.equal(r.mutado, false, `alguna operación escribió el manifiesto: ${r.tocados}`);
    // Control de que el bloque SÍ hizo algo (si no, la aserción no vale nada).
    assert.equal(fs.existsSync(path.join(root, DEFAULT_LEDGER_NAME)), true);
  } finally {
    restore();
  }
});

// ── §6 · VECTOR (2): cerco de `ledgerPath` ─────────────────────────────────

test('CA-2 · `ledgerPath` apuntando al manifiesto sellado: DENEGADO y sin tocarlo', () => {
  const { root, restore } = setupRoot();
  try {
    const manifiesto = path.join(root, 'volumes.json');
    const r = vigilaManifiesto(() =>
      appendOpsLedger({ kind: 'import_pack', actorId: 'ops' }, { ledgerPath: manifiesto })
    );
    assert.ok(r.error, 'debe fallar CERRADO, no pasar de largo');
    assert.equal(r.error.code, 'ledger_path_artefacto_sellado');
    assert.equal(r.mutado, false, 'el manifiesto no se tocó ni un byte');
  } finally {
    restore();
  }
});

test('CA-2 · el resto del cerco: estado, fuera del root, otro root, extensión, enlace', () => {
  const { root, restore } = setupRoot();
  const otro = fs.mkdtempSync(path.join(os.tmpdir(), 'u253-otro-'));
  try {
    fs.writeFileSync(path.join(otro, 'volumes.json'), '{}\n', 'utf8');
    const deniega = (ledgerPath, code, motivo) => {
      const e = capturaError(() => resolveOpsLedgerPath({ ledgerPath }), motivo);
      assert.equal(e.name, 'LedgerPathDenegada', `${motivo}: clase de error`);
      assert.equal(e.code, code, `${motivo}: código`);
    };

    // (a) el otro artefacto de máquina del root.
    deniega(path.join(root, 'volumes.state.json'), 'ledger_path_artefacto_sellado', 'estado');
    // (b) fuera del cerco, absoluta.
    deniega(path.join(otro, 'x.jsonl'), 'ledger_path_fuera_del_cerco', 'fuera del root');
    // (c) el manifiesto de OTRO root: si el cerco sólo mirase «mi» manifiesto,
    //     ésta pasaría. Es la evasión evidente de un cerco por nombre.
    deniega(path.join(otro, 'volumes.json'), 'ledger_path_fuera_del_cerco', 'manifiesto ajeno');
    // (d) escape por relativa con `..`.
    deniega(path.join('..', path.basename(otro), 'x.jsonl'), 'ledger_path_fuera_del_cerco', '..');
    // (e) dentro del root pero sin ser JSONL: el ledger no ocupa otros ficheros.
    deniega(path.join(root, 'corpus', 'dato.json'), 'ledger_path_extension_no_jsonl', 'extensión');
    // (f) el root mismo.
    deniega(root, 'ledger_path_fuera_del_cerco', 'el root');

    // (g) legítima: dentro, .jsonl, no artefacto → pasa y se normaliza.
    assert.equal(
      resolveOpsLedgerPath({ ledgerPath: path.join(root, 'auditoria.jsonl') }),
      fs.realpathSync(root) + path.sep + 'auditoria.jsonl'
    );

    // (h) ENLACE DURO con nombre inocente: dentro del root, `.jsonl`, y su
    //     `realpath` es él mismo (medido: win32/NTFS no lo deshace). Sólo la
    //     identidad física del inodo lo delata. Un cerco léxico —o incluso uno
    //     con realpath— lo dejaría apendar sobre el manifiesto.
    const duro = path.join(root, 'inocente.jsonl');
    fs.linkSync(path.join(root, 'volumes.json'), duro);
    assert.equal(fs.realpathSync(duro), duro, 'control: realpath NO deshace el enlace duro');
    deniega(duro, 'ledger_path_artefacto_sellado', 'enlace duro al manifiesto');
    fs.rmSync(duro);

    // (i) enlace simbólico a fichero: requiere privilegio en win32.
    const blando = path.join(root, 'blando.jsonl');
    try {
      fs.symlinkSync(path.join(root, 'volumes.json'), blando, 'file');
      deniega(blando, 'ledger_path_artefacto_sellado', 'enlace blando al manifiesto');
    } catch (e) {
      assert.equal(e.code, 'EPERM', `sólo se tolera EPERM, no ${e.code}`);
      // PENDIENTE en esta máquina: sin privilegio de symlink. La defensa
      // (realpath) está implementada pero NO queda verificada por aquí; (j)
      // sí verifica realpath por la vía del directorio.
    }

    // (j) verifica el canal REALPATH sin necesitar symlinks: una JUNCTION de
    //     directorio dentro del root que salta fuera. Léxicamente está dentro.
    const salto = path.join(root, 'salto');
    if (process.platform === 'win32') {
      // La junction de directorio NO requiere privilegio; el symlink sí.
      execFileSync('cmd', ['/c', 'mklink', '/J', salto, otro], { stdio: 'ignore' });
    } else {
      fs.symlinkSync(otro, salto, 'dir');
    }
    assert.equal(fs.realpathSync(salto), fs.realpathSync(otro), 'control: la junction salta fuera');
    deniega(path.join(salto, 'x.jsonl'), 'ledger_path_fuera_del_cerco', 'junction fuera del root');
  } finally {
    fs.rmSync(otro, { recursive: true, force: true });
    restore();
  }
});

test('CA-2 · importPack con `ledgerPath` al manifiesto: denegado, pero el manifiesto YA está resellado (→ U253b)', () => {
  const { root, restore } = setupRoot();
  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'u253-pack-'));
  try {
    const files = { 'DISK_07/DEMO/raw/a.json': '{"post":"uno"}' };
    const hashes = {};
    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(packRoot, 'volumes', rel.split('/').join(path.sep));
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, 'utf8');
      hashes[rel] = sha256(Buffer.from(content, 'utf8'));
    }
    fs.writeFileSync(
      path.join(packRoot, 'manifest.json'),
      JSON.stringify(
        {
          name: 'pack-demo',
          version: '1.0.0',
          volumes: {
            demo: {
              disk: 'DISK_07',
              path: 'DISK_07/DEMO',
              readonly: true,
              label: 'Demo',
              corpora: [{ id: 'raw', path: 'raw', label: 'Raw' }]
            }
          },
          hashes
        },
        null,
        2
      ),
      'utf8'
    );

    const r = vigilaManifiesto(() =>
      importPack({
        packRoot,
        role: 'operator',
        actorId: 'ops',
        ledger: { ledgerPath: path.join(root, 'volumes.json') }
      })
    );
    assert.ok(r.error, 'el import debe fallar CERRADO por el cerco del ledger');
    assert.equal(r.error.code, 'ledger_path_artefacto_sellado');
    const texto = fs.readFileSync(path.join(root, 'volumes.json'), 'utf8');
    assert.doesNotMatch(texto, /"kind":"import_pack"/, 'ni una línea de JSONL en el manifiesto');
    JSON.parse(texto); // sigue siendo JSON válido

    // Lo que el cerco impide es la ESCRITURA DEL LEDGER sobre el artefacto.
    // NO impide que el import ya hubiera resellado antes de llegar ahí: la
    // sonda tiene el dato y aquí se asevera en vez de omitirlo. El título
    // anterior («manifiesto intacto») avalaba algo que esta misma prueba
    // desmiente.
    assert.equal(
      r.mutado,
      true,
      'el manifiesto YA fue resellado por el paso 5 antes de que el cerco denegara el asiento'
    );
    const cfg = JSON.parse(texto);
    assert.ok(cfg.volumes && cfg.volumes.demo, 'el volumen quedó declarado en el manifiesto');
    assert.equal(
      fs.existsSync(path.join(root, 'DISK_07', 'DEMO', 'raw', 'a.json')),
      true,
      'y el corpus ya aterrizó'
    );
    // La atomicidad de `importPack` NO es de este WP: vive en `import.mjs`,
    // fuera del ALCANCE_DIFF, y su arreglo es linaje de U255
    // («NOTHING LANDS HALFWAY»). Enrutado a U253b. Aquí sólo queda medido y
    // dicho, para que nadie lea este verde como «el root queda limpio».
  } finally {
    fs.rmSync(packRoot, { recursive: true, force: true });
    restore();
  }
});

// ── §6bis · FLUJO DE DATOS ALTERNO (NTFS) ──────────────────────────────────

test('CA-2 · flujo alterno: `volumes.json:oculto.jsonl` escribía DENTRO del artefacto', (t) => {
  if (process.platform !== 'win32') {
    t.skip('los flujos de datos alternos son de NTFS; en POSIX `:` es un carácter normal');
    return;
  }
  const { root, restore } = setupRoot();
  try {
    const deniega = (ledgerPath, code, motivo) => {
      const e = capturaError(() => resolveOpsLedgerPath({ ledgerPath }), motivo);
      assert.equal(e.name, 'LedgerPathDenegada', `${motivo}: clase`);
      assert.equal(e.code, code, `${motivo}: código`);
    };
    // Las tres barreras fallaban a la vez: el nombre completo ya no era el del
    // artefacto, la ruta sí terminaba en `.jsonl`, y el inodo no existía aún.
    deniega('volumes.json:oculto.jsonl', 'ledger_path_artefacto_sellado', 'flujo sobre manifiesto');
    deniega('volumes.state.json:x.jsonl', 'ledger_path_artefacto_sellado', 'flujo sobre estado');
    deniega('sub/volumes.json:x.jsonl', 'ledger_path_extension_no_jsonl', 'flujo sobre anidado');
    // Aun cuando el fichero base sea admisible, el flujo es un escondite: un
    // asiento ahí es invisible para quien lea la ruta normal.
    deniega('ok.jsonl:escondite', 'ledger_path_flujo_alterno', 'flujo sobre fichero legítimo');

    // Y el manifiesto no recibió ni un byte por esa vía.
    const r = vigilaManifiesto(() => {
      try {
        appendOpsLedger({ kind: 'import_pack' }, { ledgerPath: 'volumes.json:oculto.jsonl' });
      } catch {
        /* denegado, que es el punto */
      }
    });
    assert.equal(r.mutado, false);
    assert.equal(
      fs.readdirSync(root).some((n) => n.includes(':')),
      false
    );
  } finally {
    restore();
  }
});

// ── §6ter · MUTANTES DE LA NORMALIZACIÓN DE RUTAS ──────────────────────────
// Cinco mutantes sobrevivían con la suite en verde. Cada aserción de aquí
// existe para matar uno concreto; se nombra cuál.

test('CA-4 · M4 · ruta absoluta a OTRO volumen o UNC no es «relativa»: DENIEGA', () => {
  const { root, restore } = setupRoot();
  try {
    const deniega = (ledgerPath, motivo) => {
      const e = capturaError(() => resolveOpsLedgerPath({ ledgerPath }), motivo);
      assert.equal(e.code, 'ledger_path_fuera_del_cerco', `${motivo}: código`);
    };
    // MATA M4 (quitar `isAbsolute(rel)`): `relative()` entre volúmenes
    // distintos devuelve una ruta ABSOLUTA que no empieza por `..`, así que
    // sin ese término se colaba entera.
    if (process.platform === 'win32') {
      const otraUnidad = root.toLowerCase().startsWith('d:') ? 'E:' : 'D:';
      deniega(`${otraUnidad}\\evil\\x.jsonl`, 'otra unidad');
      deniega('\\\\servidor\\comparte\\x.jsonl', 'UNC');
      // MENOR: un prefijo `\\?\` reventaba con `EISDIR ... lstat 'C:'` crudo.
      // Ahora degrada a denegación reconocible del cerco.
      deniega('\\\\?\\C:\\Windows\\x.jsonl', 'prefijo \\\\?\\');
    } else {
      deniega('/evil/x.jsonl', 'absoluta POSIX');
    }
  } finally {
    restore();
  }
});

test('CA-4 · M6 · `.jsonl` debe TERMINAR la ruta, no aparecer en medio', () => {
  const { root, restore } = setupRoot();
  try {
    // MATA M6 (`endsWith` → `includes`): un ejecutable con `.jsonl` incrustado.
    const e = capturaError(
      () => resolveOpsLedgerPath({ ledgerPath: path.join(root, 'x.jsonl.exe') }),
      'x.jsonl.exe'
    );
    assert.equal(e.code, 'ledger_path_extension_no_jsonl');
  } finally {
    restore();
  }
});

test('CA-4 · M9 · una ruta relativa se ancla al ROOT, jamás al cwd del proceso', () => {
  const { root, restore } = setupRoot();
  try {
    // MATA M9 (anclar a cwd): con `resolve(candidata)` esto daría una ruta
    // bajo el directorio de trabajo, que además está fuera del root.
    assert.equal(
      resolveOpsLedgerPath({ ledgerPath: path.join('sub', 'a.jsonl') }),
      path.join(fs.realpathSync(root), 'sub', 'a.jsonl')
    );
    assert.notEqual(path.resolve('sub', 'a.jsonl'), resolveOpsLedgerPath({ ledgerPath: 'sub/a.jsonl' }));
  } finally {
    restore();
  }
});

test('CA-4 · M1 · la comparación respeta la sensibilidad a mayúsculas de la plataforma', () => {
  const { root, restore } = setupRoot();
  try {
    if (process.platform === 'win32') {
      // MATA M1 (`normaliza` → identidad): sin plegar mayúsculas, `VOLUMES.JSON`
      // dejaría de reconocerse como el artefacto y caería en el código de
      // extensión — denegado, sí, pero por el motivo equivocado.
      const e = capturaError(
        () => resolveOpsLedgerPath({ ledgerPath: 'VOLUMES.JSON' }),
        'artefacto en mayúsculas'
      );
      assert.equal(e.code, 'ledger_path_artefacto_sellado');
      // Y, del otro lado, una extensión en mayúsculas SÍ es válida en win32.
      assert.equal(
        resolveOpsLedgerPath({ ledgerPath: 'OK.JSONL' }),
        path.join(fs.realpathSync(root), 'OK.JSONL')
      );
    } else {
      // En POSIX los nombres distinguen mayúsculas: `VOLUMES.JSON` no es el
      // artefacto, y `.JSONL` no es la extensión del contrato.
      const e = capturaError(
        () => resolveOpsLedgerPath({ ledgerPath: 'OK.JSONL' }),
        'extensión en mayúsculas en POSIX'
      );
      assert.equal(e.code, 'ledger_path_extension_no_jsonl');
    }
  } finally {
    restore();
  }
});

test('CA-4 · M3 · `..` escapa sólo como SEGMENTO completo; `..raro.jsonl` es legítimo', () => {
  const { root, restore } = setupRoot();
  const otro = fs.mkdtempSync(path.join(os.tmpdir(), 'u253-m3-'));
  try {
    // MATA el mutante inverso (`startsWith('..' + sep)` → `startsWith('..')`):
    // un fichero cuyo nombre EMPIEZA por dos puntos no escapa de ningún sitio.
    // Antes se denegaba con `fuera_del_cerco`, un código que mentía.
    assert.equal(
      resolveOpsLedgerPath({ ledgerPath: '..raro.jsonl' }),
      path.join(fs.realpathSync(root), '..raro.jsonl')
    );
    // Y el escape de verdad sigue denegado.
    const e = capturaError(
      () => resolveOpsLedgerPath({ ledgerPath: path.join('..', path.basename(otro), 'x.jsonl') }),
      'escape real por segmento ..'
    );
    assert.equal(e.code, 'ledger_path_fuera_del_cerco');
  } finally {
    fs.rmSync(otro, { recursive: true, force: true });
    restore();
  }
});

test('CA-2 · un directorio `.jsonl` se deniega en el cerco, no revienta al apendar', () => {
  const { root, restore } = setupRoot();
  try {
    fs.mkdirSync(path.join(root, 'dir.jsonl'));
    const e = capturaError(() => resolveOpsLedgerPath({ ledgerPath: 'dir.jsonl' }), 'directorio');
    assert.equal(e.name, 'LedgerPathDenegada');
    assert.equal(e.code, 'ledger_path_es_directorio');
  } finally {
    restore();
  }
});

test('CA-5 · `opts` NULO (no sólo el campo ausente) no revienta en las tres funciones', () => {
  const { root, restore } = setupRoot();
  try {
    // El CA anterior cubrió la ausencia del CAMPO; nunca la del OBJETO.
    assert.equal(resolveOpsLedgerPath(null), path.join(root, DEFAULT_LEDGER_NAME));
    assert.deepEqual(readOpsLedger(null), []);
    assert.equal(appendOpsLedger({ kind: 'ops' }, null).seq, 1);
    assert.equal(appendOpsLedger(null, null).kind, 'ops', 'ni el propio asiento nulo');
  } finally {
    restore();
  }
});

// ── §6quater · LÍMITE DECLARADO DE LA SONDA ────────────────────────────────

test('LÍMITE · la sonda es CIEGA a la escritura DIFERIDA (declarado, no cubierto)', async () => {
  const { root, restore } = setupRoot();
  try {
    const ruta = path.join(root, 'volumes.json');
    const antes = fs.readFileSync(ruta, 'utf8');
    // La sonda fotografía justo después de que `fn` RETORNA. Una escritura que
    // termina más tarde no está en la foto. No es un problema de notación: es
    // que el instante de medida es SÍNCRONO.
    //
    // Se difiere con `setTimeout` a propósito, para que la prueba sea
    // determinista. Con `fs/promises.writeFile` sin esperar el resultado es
    // una CARRERA —medido en este WP: cazada en unas ejecuciones y perdida en
    // otras—, y una barrera que a veces ve y a veces no es peor que un hueco
    // declarado: no se puede razonar sobre ella.
    let hecho;
    const escrito = new Promise((res) => {
      hecho = res;
    });
    const r = vigilaManifiesto(() => {
      setTimeout(() => {
        fs.writeFileSync(ruta, '{"diferido":true}\n', 'utf8');
        hecho();
      }, 0);
    });
    await escrito;
    const despues = fs.readFileSync(ruta, 'utf8');

    assert.equal(r.mutado, false, 'la sonda NO lo vio');
    assert.notEqual(despues, antes, 'y sin embargo el fichero cambió');
    // Si alguien hace la sonda consciente de lo asíncrono, esta prueba se
    // pondrá roja: entonces hay que actualizarla, no silenciarla. Está aquí
    // para que el hueco sea visible en la salida de la suite, no sólo en el
    // reporte. Lo que SÍ resiste, medido: `openSync`+`writeSync`,
    // `copyFileSync`, `renameSync`, `truncateSync` y `appendFileSync`.
  } finally {
    restore();
  }
});

// ── §7 · HOSTIL-OMITE (CA-5): la AUSENCIA cae en la ruta segura ────────────

test('CA-5 · omitido / undefined / null / cadena vacía → ruta segura por defecto', () => {
  const { root, restore } = setupRoot();
  try {
    const esperada = path.join(root, DEFAULT_LEDGER_NAME);
    for (const [nombre, opts] of [
      ['omitido por completo', {}],
      ['sin argumento', undefined],
      ['undefined explícito', { ledgerPath: undefined }],
      ['null', { ledgerPath: null }],
      ['cadena vacía', { ledgerPath: '' }],
      // Los demás falsy se tratan TAMBIÉN como ausencia. La frontera es
      // explícita: falsy = ausencia → ruta segura; truthy ilegible = propuesta
      // rota → denegación (prueba siguiente). Ninguno de los dos acaba jamás
      // sobre un artefacto de máquina, que es lo que exige el CA.
      ['cero', { ledgerPath: 0 }],
      ['false', { ledgerPath: false }],
      ['NaN', { ledgerPath: Number.NaN }]
    ]) {
      const obtenida = opts === undefined ? resolveOpsLedgerPath() : resolveOpsLedgerPath(opts);
      assert.equal(obtenida, esperada, `${nombre}: debe caer en la ruta segura`);
      assert.equal(path.dirname(obtenida), root, `${nombre}: dentro del root`);
      for (const vedado of ARTEFACTOS_VEDADOS) {
        assert.notEqual(path.basename(obtenida), vedado, `${nombre}: nunca un artefacto`);
      }
    }
  } finally {
    restore();
  }
});

test('CA-5 · lo presente-pero-basura DENIEGA; no cae al defecto ni pasa de largo', () => {
  const { root, restore } = setupRoot();
  try {
    // Estos valores son TRUTHY: no son ausencia. Tratarlos como ausencia sería
    // convertir una propuesta ilegible en la ruta por defecto en silencio.
    for (const basura of ['   ', 123, {}, [], true, path]) {
      const e = capturaError(
        () => resolveOpsLedgerPath({ ledgerPath: basura }),
        `basura ${String(basura)} debe denegar`
      );
      assert.equal(e.name, 'LedgerPathDenegada', `clase de error para ${String(basura)}`);
      assert.ok(
        ['ledger_path_no_es_cadena', 'ledger_path_fuera_del_cerco', 'ledger_path_extension_no_jsonl'].includes(
          e.code
        ),
        `código inesperado para ${String(basura)}: ${e.code}`
      );
    }
  } finally {
    restore();
  }
});

test('CA-5 · el ledger por defecto sigue funcionando de punta a punta', () => {
  const { root, restore } = setupRoot();
  try {
    appendOpsLedger({ kind: 'ops', actorId: 'a' });
    appendOpsLedger({ kind: 'ops', actorId: 'b' });
    const asientos = readOpsLedger();
    assert.equal(asientos.length, 2);
    assert.deepEqual(
      asientos.map((s) => s.seq),
      [1, 2]
    );
    assert.equal(fs.existsSync(path.join(root, DEFAULT_LEDGER_NAME)), true);
  } finally {
    restore();
  }
});

test('CA-5 · `volumesRoot` explícito viaja hasta la relectura (no lo mide el entorno)', () => {
  const { restore } = setupRoot();
  const propio = fs.mkdtempSync(path.join(os.tmpdir(), 'u253-propio-'));
  try {
    const ledgerPath = path.join(propio, 'auditoria.jsonl');
    appendOpsLedger({ kind: 'ops', actorId: 'a' }, { volumesRoot: propio, ledgerPath });
    const r = appendOpsLedger({ kind: 'ops', actorId: 'b' }, { volumesRoot: propio, ledgerPath });
    // Si la relectura no recibiera `volumesRoot`, mediría contra el root del
    // entorno, denegaría por «fuera del cerco» y `seq` nunca llegaría a 2.
    assert.equal(r.seq, 2);
    assert.equal(readOpsLedger({ volumesRoot: propio, ledgerPath }).length, 2);
  } finally {
    fs.rmSync(propio, { recursive: true, force: true });
    restore();
  }
});

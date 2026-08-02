/**
 * WP-U253b · «NOTHING LANDS HALFWAY» por el FINAL: el asiento del ledger.
 *
 * `import.mjs` promete en su cabecera, desde U201 y con más letra desde U255,
 * que «every failure leaves the root intact» y que TODO fallo sale por
 * `{ok:false, step, error}`. La llamada a `appendOpsLedger` era la última
 * operación de `importPack` y estaba **sin envolver**, detrás de FUSIONAR y de
 * SELLAR. Como el cerco de la ruta del ledger (U253a) falla cerrado LANZANDO,
 * cualquier `ledger.ledgerPath` denegada rompía las dos frases a la vez.
 *
 * Lo que vigila este fichero, y en qué orden:
 *   §2 · seis clases de denegación del cerco → contrato `{ok:false}` y árbol
 *        del root IDÉNTICO (hash del árbol entero, no inspección de una ruta);
 *   §3 · hostil-omite: `ledger` ausente, `null`, `{}` y con `ledgerPath`
 *        `undefined` siguen aterrizando y siguen dejando asiento;
 *   §4 · los dos residuos que la precondición sola NO cubría, medidos:
 *        un ledger existente ILEGIBLE (ocurre en la ruta por defecto, sin que
 *        nadie proponga nada) y una ruta admisible al entrar que la PROPIA
 *        fusión sepulta. Con su control verde, para que la guarda no se pase;
 *   §5 · censo de mutación: un `import.mjs` MUTANTE con las guardas amputadas
 *        —el fichero se escribe a disco y se importa de verdad— y la exigencia
 *        de que los mismos casos vuelvan a lanzar Y a mutar el root. Sin esto,
 *        §2 podría estar verde por motivos ajenos a la guarda.
 *
 * NO cubría (y estaba dicho en su reporte, §4): los demás puntos que podían
 * lanzar después de FUSIONAR y que no son el asiento — `sealManifest` sobre un
 * manifiesto no escribible, `syncVolumeCounters`, el walk de NO-LINK y el
 * `rmSync` del staging en el `finally`. **Los cierra WP-U268**, en
 * `test/u268-atomicidad-post-fusion.test.mjs`; el §5 de aquí lleva anotado qué
 * cambió esa decisión en su propio censo.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import { importPack, readOpsLedger } from '../src/index.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.join(AQUI, '..');
const SRC = path.join(PKG_ROOT, 'src');

const sha256 = (b) => createHash('sha256').update(b).digest('hex');

// ── §1 · Arnés ─────────────────────────────────────────────────────────────

/**
 * Huella del ÁRBOL ENTERO del root: cada entrada con su tipo, su MODO, el
 * DESTINO si es enlace, y el sha256 de sus bytes si es fichero. Es lo que exige
 * la CA-2 («no con inspección visual»).
 *
 * ── LO QUE ESTA HUELLA NO VE (declarado, como U253a declara lo suyo) ───────
 * - **Flujos de datos alternos de NTFS.** `fs.readdir` no los enumera: un
 *   `fichero:flujo` escrito dentro de una entrada existente NO mueve el hash.
 *   Es la misma ceguera que `ledger-cerco.mjs` declara en su cabecera, y por el
 *   mismo motivo (el API de ficheros de Node no los expone). No es hipotético:
 *   el cerco existe justamente porque ese canal escribe DENTRO del manifiesto.
 * - **Metadatos de tiempo** (`mtime`/`atime`): fuera a propósito, porque los
 *   mueve cualquier lectura y volverían la huella inútil.
 * - **Rutas FUERA del root.** Un residuo en `os.tmpdir()` o en otro volumen no
 *   entra. Los vectores de §2 que apuntan fuera se comprueban por separado.
 * Lo que sí ve, y basta para la CA: altas, bajas, cambios de contenido byte a
 * byte, cambios de tipo, de permisos y de destino de enlace.
 * @param {string} root
 */
function huellaArbol(root) {
  /** @type {string[]} */
  const lineas = [];
  const walk = (dir, rel) => {
    const entradas = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : 1));
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
          /* enlace roto o ilegible: se anota como tal, que también es un cambio */
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'u253b-root-'));
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
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
}

const FICHEROS_BASE = {
  'DISK_07/DEMO/raw/a.json': '{"post":"uno"}',
  'DISK_07/DEMO/curated/keep.md': '# curado\n'
};

/** @param {Record<string,string>} [ficheros] @param {object} [volumesDelPack] */
function buildPack(ficheros = FICHEROS_BASE, volumesDelPack = null) {
  const volumes = volumesDelPack ?? {
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
  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'u253b-pack-'));
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
    JSON.stringify({ name: 'pack-demo', version: '1.0.0', volumes, hashes }, null, 2),
    'utf8'
  );
  return { packRoot, limpia: () => fs.rmSync(packRoot, { recursive: true, force: true }) };
}

/** El corpus del pack aterrizó (una sola pregunta, para leerla de un vistazo). */
const aterrizo = (root) => fs.existsSync(path.join(root, 'DISK_07', 'DEMO', 'raw', 'a.json'));

/**
 * ¿Hay asiento de import en el ledger por defecto? Se pregunta por el TEXTO y
 * no con `readOpsLedger`, porque uno de los casos del censo siembra un ledger
 * ilegible a propósito: parsearlo aquí haría que la aserción reventara en vez
 * de responder.
 * @param {string} root
 */
function hayAsientoDeImport(root) {
  const p = path.join(root, '.ops-ledger.jsonl');
  return fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes('"kind":"import_pack"');
}

// ── §2 · CA-1 y CA-2 · ninguna entrada denegada llega a mutar el root ───────

/**
 * Entradas denegadas, con el código que cada una devuelve MEDIDO, no supuesto.
 *
 * Las seis primeras son los vectores obvios, y entre las seis sólo ejercitan
 * CUATRO de los códigos del cerco: `es_directorio` y `flujo_alterno` no se
 * alcanzan por ninguna de ellas (a `<root>` le gana la comprobación léxica, y a
 * `volumes.json:x.jsonl` le gana la de artefacto vedado). Las dos últimas
 * existen para cerrar ese hueco de EVIDENCIA — la conducta ya era correcta.
 *
 * `soloWin32` marca las que no existen fuera de NTFS: en POSIX `:` es un
 * carácter legítimo de nombre y esa misma cadena nombra un fichero válido, así
 * que exigirlas allí sería exigir un falso positivo.
 */
const DENEGADAS = [
  {
    nombre: 'artefacto sellado del root',
    code: 'ledger_path_artefacto_sellado',
    ledger: (root) => ({ ledgerPath: path.join(root, 'volumes.json') })
  },
  {
    nombre: 'extensión que no es .jsonl',
    code: 'ledger_path_extension_no_jsonl',
    ledger: (root) => ({ ledgerPath: path.join(root, 'nota.txt') })
  },
  {
    nombre: 'fuera del cerco del root',
    code: 'ledger_path_fuera_del_cerco',
    ledger: () => ({ ledgerPath: path.join(os.tmpdir(), 'u253b-ops-fuera.jsonl') })
  },
  {
    nombre: 'presente pero no es cadena',
    code: 'ledger_path_no_es_cadena',
    ledger: () => ({ ledgerPath: 42 })
  },
  {
    nombre: 'el propio root',
    code: 'ledger_path_fuera_del_cerco',
    ledger: (root) => ({ ledgerPath: root })
  },
  {
    nombre: 'flujo alterno sobre el artefacto sellado (NTFS)',
    code: 'ledger_path_artefacto_sellado',
    soloWin32: true,
    ledger: (root) => ({ ledgerPath: `${path.join(root, 'volumes.json')}:oculto.jsonl` })
  },
  {
    // Cierra el hueco de evidencia: el código `es_directorio` NO lo emite
    // `ledgerPath: <root>` (le gana la comprobación léxica). Hace falta un
    // directorio EXISTENTE, dentro del root, con nombre acabado en `.jsonl`.
    nombre: 'directorio existente con nombre .jsonl',
    code: 'ledger_path_es_directorio',
    prepara: (root) => fs.mkdirSync(path.join(root, 'carpeta.jsonl')),
    ledger: (root) => ({ ledgerPath: path.join(root, 'carpeta.jsonl') })
  },
  {
    // Y el código `flujo_alterno`: hace falta que el fichero BASE sea admisible
    // (si es el manifiesto, gana `artefacto_sellado`, que es la fila de arriba).
    nombre: 'flujo alterno sobre un fichero admisible (NTFS)',
    code: 'ledger_path_flujo_alterno',
    soloWin32: true,
    ledger: (root) => ({ ledgerPath: `${path.join(root, 'inocente.jsonl')}:oculto.jsonl` })
  }
];

for (const caso of DENEGADAS) {
  test(`CA-1/CA-2 · ${caso.nombre}: contrato \`{ok:false}\` y árbol del root idéntico`, (t) => {
    if (caso.soloWin32 && process.platform !== 'win32') {
      t.skip('el flujo alterno sólo existe en NTFS');
      return;
    }
    const { root, restore } = setupRoot();
    const { packRoot, limpia } = buildPack();
    try {
      caso.prepara?.(root);
      const antes = huellaArbol(root);
      let lanzo = null;
      let res = null;
      try {
        res = importPack({
          packRoot,
          role: 'operator',
          actorId: 'op-1',
          ledger: caso.ledger(root)
        });
      } catch (err) {
        lanzo = err;
      }
      assert.equal(lanzo, null, `no debe lanzar; lanzó ${lanzo && lanzo.code}`);
      assert.equal(res.ok, false);
      assert.equal(res.step, 'precondicion-ledger');
      assert.equal(res.error, caso.code);
      // CA-2 · el root, byte a byte, como se lo encontró.
      assert.equal(huellaArbol(root), antes, 'el árbol del root cambió');
      // Y las consecuencias concretas, por si el hash se leyera como magia.
      assert.equal(aterrizo(root), false, 'ningún corpus aterrizó');
      assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'volumes.json'), 'utf8')).volumes, {});
      assert.equal(fs.existsSync(path.join(root, '.ops-ledger.jsonl')), false);
      assert.deepEqual(
        fs.readdirSync(root).filter((n) => n.startsWith('.import-staging')),
        [],
        'ni staging residual'
      );
    } finally {
      limpia();
      restore();
    }
  });
}

test('CA-1 · la denegación llega ANTES de VERIFICAR: ni un paso se registró', () => {
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  try {
    const res = importPack({
      packRoot,
      role: 'operator',
      actorId: 'op-1',
      ledger: { ledgerPath: path.join(root, 'nota.txt') }
    });
    assert.equal(res.step, 'precondicion-ledger');
    assert.deepEqual(res.steps, [], 'la precondición corre antes del primer paso del contrato');
  } finally {
    limpia();
    restore();
  }
});

test('CA-1 · el rol se sigue juzgando PRIMERO: un ledger malo no tapa un rol denegado', () => {
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  try {
    // Rol omitido → player → denegado (hostil-omite del contrato §0.6).
    const res = importPack({
      packRoot,
      actorId: 'op-1',
      ledger: { ledgerPath: path.join(root, 'nota.txt') }
    });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'precondicion-rol');
    assert.equal(huellaArbol(root) !== null, true);
  } finally {
    limpia();
    restore();
  }
});

// ── §3 · CA-4 · hostil-omite: lo AUSENTE no muta y luego lanza ──────────────

const OMISIONES = [
  ['`ledger` omitido', (opts) => opts],
  ['`ledger` null', (opts) => ({ ...opts, ledger: null })],
  ['`ledger` objeto vacío', (opts) => ({ ...opts, ledger: {} })],
  ['`ledgerPath` undefined', (opts) => ({ ...opts, ledger: { ledgerPath: undefined } })]
];

for (const [nombre, decora] of OMISIONES) {
  test(`CA-4 · ${nombre}: aterriza, sella y deja asiento en la ruta por defecto`, () => {
    const { root, restore } = setupRoot();
    const { packRoot, limpia } = buildPack();
    try {
      const res = importPack(decora({ packRoot, role: 'operator', actorId: 'op-1' }));
      assert.equal(res.ok, true, JSON.stringify(res));
      assert.equal(res.noop, false);
      assert.equal(aterrizo(root), true);
      assert.equal(fs.existsSync(path.join(root, '.ops-ledger.jsonl')), true);
      const asientos = readOpsLedger();
      assert.equal(asientos.length, 1);
      assert.equal(asientos[0].kind, 'import_pack');
      assert.equal(res.ledger.seq, 1);
    } finally {
      limpia();
      restore();
    }
  });
}

// ── §4 · Los dos residuos que la precondición de ruta NO cubría ─────────────

test('CA-2 · ledger existente ILEGIBLE: se caza en la precondición, sin tocar el root', () => {
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  try {
    // Ocurre SIN proponer ruta: la de por defecto, con una línea que no es
    // JSON. La relectura con la que `appendOpsLedger` numera el asiento
    // reventaba con el corpus ya aterrizado y el manifiesto ya re-sellado.
    fs.writeFileSync(path.join(root, '.ops-ledger.jsonl'), 'esto-no-es-json\n', 'utf8');
    const antes = huellaArbol(root);
    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1' });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'precondicion-ledger');
    assert.equal(res.error, 'ledger_ilegible');
    assert.equal(res.ledger.path, path.join(root, '.ops-ledger.jsonl'));
    assert.equal(huellaArbol(root), antes);
    assert.equal(aterrizo(root), false);
  } finally {
    limpia();
    restore();
  }
});

test('CA-2 · ruta admisible al entrar que la PROPIA fusión sepulta: cero renames', () => {
  const { root, restore } = setupRoot();
  // El pack trae un DIRECTORIO llamado `a.jsonl`. La ruta propuesta no existe
  // al empezar (el cerco la admite) y es un directorio al terminar.
  const { packRoot, limpia } = buildPack({
    'DISK_07/DEMO/raw/a.jsonl/dentro.txt': 'x\n',
    'DISK_07/DEMO/curated/keep.md': '# curado\n'
  });
  const ledgerPath = path.join(root, 'DISK_07', 'DEMO', 'raw', 'a.jsonl');
  try {
    const antes = huellaArbol(root);
    const res = importPack({
      packRoot,
      role: 'operator',
      actorId: 'op-1',
      ledger: { ledgerPath }
    });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'ledger_en_ruta_de_fusion');
    assert.equal(res.ledgerPath, path.resolve(ledgerPath));
    assert.equal(huellaArbol(root), antes, 'la guarda corre antes del primer rename');
    assert.equal(fs.existsSync(path.join(root, 'DISK_07')), false);
  } finally {
    limpia();
    restore();
  }
});

test('B2 · `ledgerPath` se lee UNA vez: un getter que cambia de idea no llega al asiento', () => {
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  try {
    // El hueco que `ledger.mjs:28-31` cierra un nivel más abajo, reabierto por
    // pasar el objeto VIVO hasta el apéndice: primera lectura inocente (pasa la
    // precondición), segunda lectura al manifiesto sellado (deniega, ya con
    // todo aterrizado). Sólo se cierra si la ruta que viaja al asiento es la
    // YA RESUELTA, no la propuesta.
    let lecturas = 0;
    const ledger = {
      get ledgerPath() {
        lecturas += 1;
        return lecturas === 1
          ? path.join(root, 'inocente.jsonl')
          : path.join(root, 'volumes.json');
      }
    };
    let lanzo = null;
    let res = null;
    try {
      res = importPack({ packRoot, role: 'operator', actorId: 'op-1', ledger });
    } catch (err) {
      lanzo = err;
    }
    assert.equal(lanzo, null, `no debe lanzar; lanzó ${lanzo && lanzo.code}`);
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(lecturas, 1, 'el campo se leyó exactamente una vez');
    // El asiento está donde dijo la PRIMERA (y única) lectura, y el manifiesto
    // no tiene ni una línea de JSONL encima.
    assert.equal(fs.existsSync(path.join(root, 'inocente.jsonl')), true);
    assert.doesNotMatch(
      fs.readFileSync(path.join(root, 'volumes.json'), 'utf8'),
      /"kind":"import_pack"/
    );
  } finally {
    limpia();
    restore();
  }
});

test('B3 · un fichero que aterriza COMO ANCESTRO de la ruta del ledger: cero renames', () => {
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  // El pack trae el FICHERO `raw/a.json`; la ruta propuesta cuelga de él. La
  // precondición la admite (no existe nada aún) y el `mkdirSync` del apéndice
  // choca después contra un fichero. Es la tercera forma, y vive DENTRO de la
  // zona que el control de abajo bendice como legítima.
  const ledgerPath = path.join(root, 'DISK_07', 'DEMO', 'raw', 'a.json', 'ops.jsonl');
  try {
    const antes = huellaArbol(root);
    let lanzo = null;
    let res = null;
    try {
      res = importPack({ packRoot, role: 'operator', actorId: 'op-1', ledger: { ledgerPath } });
    } catch (err) {
      lanzo = err;
    }
    assert.equal(lanzo, null, `no debe lanzar; lanzó ${lanzo && lanzo.code}`);
    assert.equal(res.ok, false);
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'ledger_en_ruta_de_fusion');
    assert.equal(huellaArbol(root), antes);
    assert.equal(fs.existsSync(path.join(root, 'DISK_07')), false);
  } finally {
    limpia();
    restore();
  }
});

test('B3 · la guarda mira también los movimientos `kind:"corpus"`, no sólo los de volumen', () => {
  // Volumen YA declarado en el destino: el pack añade un corpus nuevo, así que
  // el plan trae un movimiento `kind:'corpus'` y no uno de volumen entero.
  const { root, restore } = setupRoot({
    root: '.',
    volumes: {
      demo: {
        disk: 'DISK_07',
        path: 'DISK_07/DEMO',
        readonly: true,
        label: 'Demo',
        corpora: [{ id: 'raw', path: 'raw', label: 'Raw' }]
      }
    }
  });
  const { packRoot, limpia } = buildPack(
    { 'DISK_07/DEMO/curated/x.jsonl/dentro.txt': 'x\n' },
    {
      demo: {
        disk: 'DISK_07',
        path: 'DISK_07/DEMO',
        readonly: true,
        label: 'Demo',
        corpora: [{ id: 'curated', path: 'curated', label: 'Curated' }]
      }
    }
  );
  const ledgerPath = path.join(root, 'DISK_07', 'DEMO', 'curated', 'x.jsonl');
  try {
    const antes = huellaArbol(root);
    const res = importPack({ packRoot, role: 'operator', actorId: 'op-1', ledger: { ledgerPath } });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'fusionar');
    assert.equal(res.error, 'ledger_en_ruta_de_fusion');
    assert.equal(res.kind, 'corpus', 'el movimiento que choca es de corpus');
    assert.equal(huellaArbol(root), antes);
  } finally {
    limpia();
    restore();
  }
});

test('B4 · `ledger` con campos inutilizables: `{volumesRoot: 42}` no se traga en silencio', () => {
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  try {
    // `volumesRoot` es campo del contrato y hasta este WP ninguna prueba del
    // repo lo tocaba. La resolución revienta con `TypeError`; tragárselo dejaba
    // `ledgerPath` en `null` y con ello DESACTIVADA también la guarda de fusión.
    const antes = huellaArbol(root);
    let lanzo = null;
    let res = null;
    try {
      res = importPack({ packRoot, role: 'operator', actorId: 'op-1', ledger: { volumesRoot: 42 } });
    } catch (err) {
      lanzo = err;
    }
    assert.equal(lanzo, null, `no debe lanzar; lanzó ${lanzo && lanzo.name}`);
    assert.equal(res.ok, false);
    assert.equal(res.step, 'precondicion-ledger');
    assert.equal(res.error, 'ledger_opts_invalidas');
    assert.equal(res.ledger.causa.name, 'TypeError');
    assert.equal(huellaArbol(root), antes);
    assert.equal(aterrizo(root), false);
  } finally {
    limpia();
    restore();
  }
});

test('B4 · un fallo del ENTORNO no cambia de paso: sin `ZEUS_VOLUMES_ROOT` sigue siendo `verificar`', () => {
  const { packRoot, limpia } = buildPack();
  const prev = process.env.ZEUS_VOLUMES_ROOT;
  delete process.env.ZEUS_VOLUMES_ROOT;
  resetZeusEnvLoader();
  resetVolumesCache();
  try {
    // Es la afirmación portante de la precondición: sólo se juzga el ledger
    // cuando el root canónico SÍ resuelve. Si esta distinción se cayera, un
    // root sin resolver pasaría a reportarse como `precondicion-ledger` —un
    // `step` que no le corresponde— por efecto secundario de este WP.
    const res = importPack({
      packRoot,
      role: 'operator',
      actorId: 'op-1',
      ledger: { ledgerPath: 'cualquiera.jsonl' }
    });
    assert.equal(res.ok, false);
    assert.equal(res.step, 'verificar', JSON.stringify(res));
    assert.notEqual(res.error, 'ledger_opts_invalidas');
  } finally {
    if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = prev;
    resetZeusEnvLoader();
    resetVolumesCache();
    limpia();
  }
});

test('B4 · `ledger.volumesRoot` explícito viaja hasta el asiento (no lo mide el entorno)', () => {
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  // Conducta YA existente en la base (`ledger.mjs:49-51` la documenta): el
  // llamante puede anclar el cerco del ledger a un root explícito distinto del
  // canónico. Se fija aquí porque es el único eje que hace portante el reenvío
  // de `volumesRoot` al apéndice: si se perdiera, la RELECTURA volvería a medir
  // contra el root canónico y denegaría por `fuera_del_cerco` — otra vez,
  // después de mutar.
  const otroRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'u253b-otro-'));
  try {
    const res = importPack({
      packRoot,
      role: 'operator',
      actorId: 'op-1',
      ledger: { volumesRoot: otroRoot, ledgerPath: 'ops.jsonl' }
    });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(fs.existsSync(path.join(otroRoot, 'ops.jsonl')), true);
    assert.equal(fs.existsSync(path.join(root, '.ops-ledger.jsonl')), false);
    assert.equal(aterrizo(root), true);
  } finally {
    fs.rmSync(otroRoot, { recursive: true, force: true });
    limpia();
    restore();
  }
});

test('CA-2 control · un ledger DENTRO de un volumen que el pack trae sigue verde', () => {
  const { root, restore } = setupRoot();
  const { packRoot, limpia } = buildPack();
  // Cuelga del destino de la fusión, pero ningún fichero del pack cae en esa
  // ruta ni debajo. Si la guarda mirara los `to` del plan en vez de los
  // ficheros que aterrizan, este caso —hoy verde— se volvería rojo.
  const ledgerPath = path.join(root, 'DISK_07', 'DEMO', 'ops.jsonl');
  try {
    const res = importPack({
      packRoot,
      role: 'operator',
      actorId: 'op-1',
      ledger: { ledgerPath }
    });
    assert.equal(res.ok, true, JSON.stringify(res));
    assert.equal(fs.existsSync(ledgerPath), true, 'el asiento vive donde se pidió');
    assert.equal(res.ledger.kind, 'import_pack');
    assert.equal(aterrizo(root), true);
  } finally {
    limpia();
    restore();
  }
});

// ── §5 · CENSO DE MUTACIÓN: sin la guarda, los casos DEBEN enrojecer ────────

/**
 * Amputaciones que devuelven `import.mjs` a la conducta de la base, una por
 * pieza portante. Cada entrada dice qué restaura; si alguna dejara de casar, el
 * «mutante» sería el original y el censo pasaría en verde sin haber amputado
 * nada — por eso se cuentan y se aseveran.
 */
const AMPUTACIONES = [
  // Las tres salidas de la precondición (cerco, `ledger_opts_invalidas`,
  // `ledger_ilegible`): la guarda sigue calculándose —el mutante no compila
  // «por otra razón»— pero deja de detener el pipeline.
  { re: /return (fail\('precondicion-ledger')/g, con: '$1', veces: 3 },
  // La salida de la guarda de fusión.
  { re: /return (fail\('fusionar', 'ledger_en_ruta_de_fusion')/g, con: '$1', veces: 1 },
  // La tercera forma de la guarda (el fichero que aterriza como ANCESTRO).
  { re: / \|\| cuelgaDe\(d, ledgerAbs\)/g, con: '', veces: 1 },
  // El reenvío de la ruta YA RESUELTA al asiento: restaura la doble lectura.
  { re: /\{ \.\.\.ledgerFijo, ledgerPath \}/g, con: 'ledgerOpts', veces: 1 }
];

/**
 * Construye un `import.mjs` MUTANTE aplicando las cuatro amputaciones a la vez.
 *
 * El mutante se escribe DENTRO de `test/` para que sus especificadores desnudos
 * (`@zeus/…`) sigan resolviendo por la cadena del paquete; los relativos se
 * reescriben a URL absoluta de `src/`, así que usa los MISMOS módulos que el
 * original y no una copia paralela.
 *
 * Lee del DISCO, no del grafo de módulos ya cargado. Consecuencia declarada: si
 * `src/import.mjs` no contiene las guardas (p.ej. corriendo este fichero contra
 * la base), esta prueba enrojece por no encontrar qué amputar, no por un
 * hallazgo propio. Es lo que hace que la partición del reporte se cuente 10/6
 * por disco y 9/7 sin este caso.
 */
let semillaMutante = 0;
async function cargaMutante() {
  let mutada = fs.readFileSync(path.join(SRC, 'import.mjs'), 'utf8');
  for (const { re, con, veces } of AMPUTACIONES) {
    const casados = mutada.match(re);
    assert.equal(
      casados ? casados.length : 0,
      veces,
      `la amputación ${re} debía tocar ${veces} sitio(s)`
    );
    mutada = mutada.replace(re, con);
  }
  mutada = mutada.replace(
    / from '\.\/([^']+)'/g,
    (_, f) => ` from ${JSON.stringify(pathToFileURL(path.join(SRC, f)).href)}`
  );
  const abs = path.join(AQUI, `.mutante-u253b-${process.pid}-${semillaMutante++}.mjs`);
  fs.writeFileSync(abs, mutada, 'utf8');
  try {
    const mod = await import(pathToFileURL(abs).href);
    return { importPack: mod.importPack, limpia: () => fs.rmSync(abs, { force: true }) };
  } catch (err) {
    fs.rmSync(abs, { force: true });
    throw err;
  }
}

test('CA-5 · amputadas las guardas, TODOS los casos vuelven a lanzar tras mutar el root', async () => {
  const mutante = await cargaMutante();
  try {
    const casos = [
      ...DENEGADAS.filter((c) => !c.soloWin32 || process.platform === 'win32').map((c) => ({
        nombre: c.nombre,
        ledger: c.ledger,
        prepara: c.prepara ?? null,
        ficheros: FICHEROS_BASE
      })),
      {
        nombre: 'ledger existente ilegible',
        ledger: () => ({}),
        prepara: (root) =>
          fs.writeFileSync(path.join(root, '.ops-ledger.jsonl'), 'esto-no-es-json\n', 'utf8'),
        ficheros: FICHEROS_BASE
      },
      {
        nombre: '`ledger` con campos inutilizables',
        ledger: () => ({ volumesRoot: 42 }),
        prepara: null,
        ficheros: FICHEROS_BASE
      },
      {
        nombre: '`ledgerPath` con getter que cambia de idea',
        ledger: (root) => {
          let n = 0;
          return {
            get ledgerPath() {
              n += 1;
              return n === 1 ? path.join(root, 'inocente.jsonl') : path.join(root, 'volumes.json');
            }
          };
        },
        prepara: null,
        ficheros: FICHEROS_BASE
      },
      {
        nombre: 'ruta que la fusión sepulta',
        ledger: (root) => ({
          ledgerPath: path.join(root, 'DISK_07', 'DEMO', 'raw', 'a.jsonl')
        }),
        prepara: null,
        ficheros: {
          'DISK_07/DEMO/raw/a.jsonl/dentro.txt': 'x\n',
          'DISK_07/DEMO/curated/keep.md': '# curado\n'
        }
      },
      {
        nombre: 'fichero que aterriza como ANCESTRO de la ruta del ledger',
        ledger: (root) => ({
          ledgerPath: path.join(root, 'DISK_07', 'DEMO', 'raw', 'a.json', 'ops.jsonl')
        }),
        prepara: null,
        ficheros: FICHEROS_BASE
      }
    ];

    for (const caso of casos) {
      const { root, restore } = setupRoot();
      const { packRoot, limpia } = buildPack(caso.ficheros);
      try {
        caso.prepara?.(root);
        const antes = huellaArbol(root);
        let lanzo = null;
        let salida = null;
        try {
          salida = mutante.importPack({
            packRoot,
            role: 'operator',
            actorId: 'op-1',
            ledger: caso.ledger(root)
          });
        } catch (err) {
          lanzo = err;
        }
        // ── U268 · POR QUÉ ESTE CENSO YA NO EXIGE «LANZA» ──────────────────
        // Hasta U268 la marca de la amputación era una EXCEPCIÓN, porque el
        // apéndice del asiento corría desnudo. U268 envuelve toda la zona
        // posterior a FUSIONAR, así que el mutante ya no lanza: devuelve
        // `post-fusion/asiento_no_escribible` (medido: los nueve casos).
        //
        // Eso NO vuelve redundantes las guardas de U253b, y es justo lo que
        // vigila esta aserción: sin ellas el root SIGUE MUTANDO. Lo que la
        // precondición compra es que el fallo se conozca con el root todavía
        // intacto; lo que U268 compra es que, cuando ya no se puede, el daño se
        // DECLARE en vez de escaparse. Exigir aquí «lanza» mediría la conducta
        // de otro WP. Se exige lo que la guarda protege: que el import deje de
        // salir por su propio paso, y que el root se mueva.
        assert.notEqual(
          salida?.step ?? null,
          'precondicion-ledger',
          `${caso.nombre}: amputada la guarda, no puede seguir saliendo por la precondición`
        );
        assert.notEqual(
          salida?.error ?? null,
          'ledger_en_ruta_de_fusion',
          `${caso.nombre}: amputada la guarda, no puede seguir saliendo por la guarda de fusión`
        );
        // Medido: los NUEVE devuelven `post-fusion`, así que se exige eso y no
        // un «o lanza o…» que aceptaría de más. Si un día uno volviera a
        // lanzar, esta prueba lo dirá en vez de taparlo.
        assert.equal(lanzo, null, `${caso.nombre}: U268 ya no deja escapar excepciones`);
        assert.equal(
          salida?.step,
          'post-fusion',
          `${caso.nombre}: sin la guarda el fallo se descubre TARDE, con el root ya tocado`
        );
        assert.equal(salida?.aterrizado, true, `${caso.nombre}: y el resultado lo declara`);
        assert.notEqual(
          huellaArbol(root),
          antes,
          `${caso.nombre}: y DEBE haber mutado el root — es lo que la precondición evitaba`
        );
        // «A medias» literal: el volumen está en disco (no todos los casos del
        // censo traen el mismo fichero, así que se pregunta por el volumen).
        assert.equal(
          fs.existsSync(path.join(root, 'DISK_07', 'DEMO')),
          true,
          `${caso.nombre}: el volumen aterriza a medias`
        );
        assert.equal(hayAsientoDeImport(root), false, `${caso.nombre}: y se queda sin asiento`);
      } finally {
        limpia();
        restore();
      }
    }
  } finally {
    mutante.limpia();
  }
});

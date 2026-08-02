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
 * NO cubre (y está dicho en el reporte, §4): los demás puntos que pueden
 * lanzar después de FUSIONAR y que no son el asiento — `sealManifest` sobre un
 * manifiesto no escribible (medido, EPERM), `syncVolumeCounters`, el walk de
 * NO-LINK y el `rmSync` del staging en el `finally`.
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
 * Huella del ÁRBOL ENTERO del root: cada entrada con su tipo y, si es fichero,
 * el sha256 de sus bytes. Es lo que exige la CA-2 («no con inspección visual»):
 * un cambio en CUALQUIER punto del root —manifiesto, estado, corpus, ledger,
 * staging residual— mueve el hash.
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
      if (st.isSymbolicLink()) lineas.push(`L ${r}`);
      else if (st.isDirectory()) {
        lineas.push(`D ${r}`);
        walk(abs, r);
      } else lineas.push(`F ${r}:${sha256(fs.readFileSync(abs))}`);
    }
  };
  walk(root, '');
  return sha256(Buffer.from(lineas.join('\n'), 'utf8'));
}

function setupRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'u253b-root-'));
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

const FICHEROS_BASE = {
  'DISK_07/DEMO/raw/a.json': '{"post":"uno"}',
  'DISK_07/DEMO/curated/keep.md': '# curado\n'
};

/** @param {Record<string,string>} [ficheros] */
function buildPack(ficheros = FICHEROS_BASE) {
  const volumes = {
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
 * Las clases del cerco de U253a, con el código que cada una devuelve MEDIDO,
 * no supuesto. `soloWin32` marca la que no existe fuera de NTFS: en POSIX `:`
 * es un carácter legítimo de nombre y esa misma cadena nombra un fichero
 * válido, así que exigirla allí sería exigir un falso positivo.
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
    nombre: 'flujo de datos alterno (NTFS)',
    code: 'ledger_path_artefacto_sellado',
    soloWin32: true,
    ledger: (root) => ({ ledgerPath: `${path.join(root, 'volumes.json')}:oculto.jsonl` })
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
 * Construye un `import.mjs` MUTANTE: el mismo fichero, con los `return` de las
 * dos guardas de U253b amputados. La guarda sigue calculándose (así el mutante
 * no compila «por otra razón»), pero deja de detener el pipeline — que es
 * exactamente el estado de la base antes de este WP.
 *
 * El mutante se escribe DENTRO de `test/` para que sus especificadores
 * desnudos (`@zeus/…`) sigan resolviendo por la cadena del paquete; los
 * relativos se reescriben a URL absoluta de `src/`, así que el mutante usa los
 * MISMOS módulos que el original y no una copia paralela.
 */
let semillaMutante = 0;
async function cargaMutante() {
  const fuente = fs.readFileSync(path.join(SRC, 'import.mjs'), 'utf8');
  let amputados = 0;
  const mutada = fuente
    .replace(/return (fail\('precondicion-ledger')/g, (_, m) => {
      amputados += 1;
      return m;
    })
    .replace(/return (fail\('fusionar', 'ledger_en_ruta_de_fusion')/g, (_, m) => {
      amputados += 1;
      return m;
    })
    .replace(/ from '\.\/([^']+)'/g, (_, f) => ` from ${JSON.stringify(pathToFileURL(path.join(SRC, f)).href)}`);
  // Si el regex dejara de casar, el «mutante» sería el original y el censo
  // pasaría en verde sin haber amputado nada: eso es lo que hay que impedir.
  assert.equal(amputados, 3, `la amputación debe tocar las 3 salidas; tocó ${amputados}`);
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
        prepara: null,
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
        nombre: 'ruta que la fusión sepulta',
        ledger: (root) => ({
          ledgerPath: path.join(root, 'DISK_07', 'DEMO', 'raw', 'a.jsonl')
        }),
        prepara: null,
        ficheros: {
          'DISK_07/DEMO/raw/a.jsonl/dentro.txt': 'x\n',
          'DISK_07/DEMO/curated/keep.md': '# curado\n'
        }
      }
    ];

    for (const caso of casos) {
      const { root, restore } = setupRoot();
      const { packRoot, limpia } = buildPack(caso.ficheros);
      try {
        caso.prepara?.(root);
        const antes = huellaArbol(root);
        let lanzo = null;
        try {
          mutante.importPack({
            packRoot,
            role: 'operator',
            actorId: 'op-1',
            ledger: caso.ledger(root)
          });
        } catch (err) {
          lanzo = err;
        }
        assert.ok(lanzo, `${caso.nombre}: sin la guarda DEBE volver a lanzar`);
        assert.notEqual(
          huellaArbol(root),
          antes,
          `${caso.nombre}: y DEBE haber mutado el root antes de lanzar`
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

/**
 * WP-U206 · Cerco del ROOT (src/cerco.mjs) — paso 7 del CA local-first.
 * Los cuatro predicados (enlace vivo · node_modules · material de identidad ·
 * URL viva) con su rojo, y las dos exenciones con su límite.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertRootCerco, scanRootCerco, IDENTITY_DENYLIST } from '../src/index.mjs';

const TEMPS = [];
function mkRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u206c-'));
  TEMPS.push(dir);
  fs.writeFileSync(
    path.join(dir, 'volumes.json'),
    `${JSON.stringify({ root: '.', volumes: {} }, null, 2)}\n`,
    'utf8'
  );
  return dir;
}
test.after(() => {
  for (const dir of TEMPS) fs.rmSync(dir, { recursive: true, force: true });
});

test('VERDE · root limpio = 0 hallazgos', () => {
  const root = mkRoot();
  fs.mkdirSync(path.join(root, 'DISK_03'), { recursive: true });
  fs.writeFileSync(path.join(root, 'DISK_03', 'a.json'), '{"x":1}', 'utf8');
  const rep = scanRootCerco({ root });
  assert.equal(rep.ok, true, JSON.stringify(rep.findings));
  assert.equal(rep.files, 2);
  assert.doesNotThrow(() => assertRootCerco({ root }));
});

test('ROJO · material de identidad, con LA denylist del contrato (no una copia)', () => {
  const root = mkRoot();
  // La lista se importa de import.mjs: si allí se añade un patrón, aquí entra
  // solo. Se comprueba que es la misma referencia de criterio.
  assert.ok(IDENTITY_DENYLIST.some((re) => re.test('secret.txt')));
  fs.writeFileSync(path.join(root, 'secret.txt'), 'x', 'utf8');
  fs.writeFileSync(path.join(root, 'clave.pem'), 'x', 'utf8');
  const rep = scanRootCerco({ root });
  assert.equal(rep.ok, false);
  assert.deepEqual(rep.identity.sort(), ['clave.pem', 'secret.txt']);
  assert.throws(() => assertRootCerco({ root }), /Cerco del root roto/);
});

test('ROJO · enlace vivo (symlink/junction) sale NOMBRADO y no se sigue', (t) => {
  const root = mkRoot();
  fs.mkdirSync(path.join(root, 'DISK_03'), { recursive: true });
  fs.writeFileSync(path.join(root, 'DISK_03', 'a.json'), '{}', 'utf8');
  try {
    fs.symlinkSync(
      path.join(root, 'DISK_03'),
      path.join(root, 'enlace'),
      process.platform === 'win32' ? 'junction' : 'dir'
    );
  } catch (err) {
    t.skip(`no se pudo crear el enlace de prueba: ${err.message}`);
    return;
  }
  const rep = scanRootCerco({ root });
  assert.equal(rep.ok, false);
  assert.deepEqual(rep.symlinks, ['enlace']);
  // No se siguió: `a.json` se cuenta UNA vez (root + manifiesto = 2 ficheros).
  assert.equal(rep.files, 2);
});

test('ROJO · ruta con node_modules', () => {
  const root = mkRoot();
  fs.mkdirSync(path.join(root, 'node_modules', '@zeus'), { recursive: true });
  fs.writeFileSync(path.join(root, 'node_modules', '@zeus', 'x.json'), '{}', 'utf8');
  const rep = scanRootCerco({ root });
  assert.equal(rep.ok, false);
  assert.ok(rep.nodeModules.includes('node_modules/@zeus/x.json'));
});

test('URL VIVA · el predicado, con sus dos exenciones y el límite de cada una', () => {
  const root = mkRoot();
  const ORIGIN = 'https://example.test/release/pack-1.0.0.tgz';

  // (b) exención por contrato: source.imported.origin DENTRO de volumes.json.
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    `${JSON.stringify(
      {
        root: '.',
        volumes: {
          forces: {
            disk: 'DISK_03',
            path: 'DISK_03/FORCES',
            source: {
              imported: { name: 'p', version: '1.0.0', origin: ORIGIN },
              // (a) placeholder de entorno CON esquema: también exento.
              remotePath: 'https://${ZEUS_REMOTE_HOST}/corpus',
              // Placeholder SIN esquema: ni siquiera casa con el patrón.
              pubUrl: '${ZEUS_SSB_PUB_URL}'
            }
          }
        }
      },
      null,
      2
    )}\n`,
    'utf8'
  );
  let rep = scanRootCerco({ root });
  assert.equal(rep.ok, true, JSON.stringify(rep.findings));

  // Límite de la exención (b): la MISMA URL en otro fichero es URL VIVA.
  fs.mkdirSync(path.join(root, 'DISK_03'), { recursive: true });
  fs.writeFileSync(path.join(root, 'DISK_03', 'nota.md'), `ancla: ${ORIGIN}\n`, 'utf8');
  rep = scanRootCerco({ root });
  assert.equal(rep.ok, false);
  assert.equal(rep.liveUrls.length, 1);
  assert.equal(rep.liveUrls[0].path, 'DISK_03/nota.md');
  assert.equal(rep.liveUrls[0].url, ORIGIN);
  assert.equal(rep.liveUrls[0].line, 1);
  fs.rmSync(path.join(root, 'DISK_03', 'nota.md'));

  // Límite de la exención (b), segunda cara: la misma URL en OTRA clave del
  // propio volumes.json tampoco está exenta (la exención es por ruta exacta).
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'volumes.json'), 'utf8'));
  cfg.volumes.forces.source.otraClave = ORIGIN;
  fs.writeFileSync(path.join(root, 'volumes.json'), `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
  rep = scanRootCerco({ root });
  assert.equal(rep.ok, false, 'la exención por clave exacta se está aplicando de más');
  assert.ok(rep.liveUrls.some((u) => u.path === 'volumes.json'));
});

// ═══════════════════════════════════════════════════════════════════════════
// WP-U259 · EL PREDICADO DE URL VIVA, reescrito — el «hermano menor» del WP.
//
// U206 dejó escrito, con la medida delante, que «0 URLs vivas» NO distingue
// procedencia registrada de ancla de arranque, y por eso el cerco no puede
// abortar (boot.mjs). Aquí se fija la regla nueva CASO A CASO: cada exención
// con su límite, y el caso que ANTES pasaba y ahora cae.
// ═══════════════════════════════════════════════════════════════════════════

/** Planta ficheros en un root nuevo y devuelve el reporte. */
function cercoCon(ficheros) {
  const root = mkRoot();
  for (const [rel, contenido] of Object.entries(ficheros)) {
    const abs = path.join(root, rel.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(
      abs,
      typeof contenido === 'string' ? contenido : `${JSON.stringify(contenido, null, 2)}\n`,
      'utf8'
    );
  }
  return scanRootCerco({ root });
}

test('U259·I1 · el placeholder exenta por HOST, no por prefijo — `${VAR}@host.real` CAE', () => {
  // EL CASO QUE HOY PASA Y CON LA REGLA NUEVA CAE. La regla vieja era
  // `/^https?:\/\/\$\{/i` («empieza por https://${»), así que una URL cuya
  // autoridad de verdad está DETRÁS del `@` quedaba exenta: el `${…}` estaba en
  // la userinfo, no en el host. Y el literal ni siquiera se capturaba entero,
  // porque el patrón cortaba en `}`.
  const rep = cercoCon({
    'DISK_09/nota.txt': 'ancla: https://${TOKEN}@servidor.real/pack.tgz\n'
  });
  assert.equal(rep.ok, false, 'un `${…}` en la userinfo sigue exentando una autoridad REAL');
  assert.equal(rep.liveUrls.length, 1);
  assert.equal(
    rep.liveUrls[0].url,
    'https://${TOKEN}@servidor.real/pack.tgz',
    'el literal se captura entero: `}` ya no corta cuando cierra un `${`'
  );
});

test('U259·I1 · el placeholder EN EL HOST sigue exento (la exención legítima no se pierde)', () => {
  for (const url of ['https://${ZEUS_HOST}/pack.tgz', 'https://${A}.${B}/x']) {
    const rep = cercoCon({ 'DISK_09/nota.txt': `plantilla: ${url}\n` });
    assert.equal(rep.ok, true, `${url} dejó de estar exenta: ${JSON.stringify(rep.findings)}`);
  }
});

test('U259·I2 · una URL COORDINADA con su registro es procedencia, no ancla', () => {
  // El caso legítimo que hoy sale rojo sobre el root de referencia:
  // `registros[i].urls.revision = "…?oldid=2"` junto a `registros[i].oldid = 2`.
  // La regla no nombra el campo: exige que la URL REPITA una coordenada del
  // registro que la contiene — o sea que apunte al MISMO objeto que el registro
  // describe, no a un servicio.
  const rep = cercoCon({
    'DISK_09/manifest.json': {
      registros: [
        { id: 'r1', oldid: 2, urls: { revision: 'https://example.test/w/index.php?oldid=2' } }
      ]
    }
  });
  assert.equal(rep.ok, true, JSON.stringify(rep.findings));
});

test('U259·I2 · los CUATRO límites de la coordinación', () => {
  const casos = [
    [
      'la coordenada NO casa (oldid=99 junto a oldid:2)',
      {
        'DISK_09/manifest.json': {
          registros: [
            { id: 'r1', oldid: 2, urls: { revision: 'https://example.test/w/index.php?oldid=99' } }
          ]
        }
      }
    ],
    [
      'un ENDPOINT junto a escalares que no coordinan',
      { 'DISK_09/manifest.json': { kind: 'ssb-pub-export', id: 1, pubUrl: 'https://pub.example/v1/x' } }
    ],
    [
      'la URL va INCRUSTADA en prosa dentro del campo (no es valor completo)',
      {
        'DISK_09/manifest.json': {
          oldid: 2,
          nota: 'baja el pack de https://example.test/w/index.php?oldid=2 antes de arrancar'
        }
      }
    ],
    [
      'un ancestro LEJANO no exenta: el registro termina en el elemento de array',
      {
        'DISK_09/manifest.json': {
          oldid: 2,
          entradas: [{ id: 'a' }, { id: 'b', hijo: { nieto: { url: 'https://e.test/x?oldid=2' } } }]
        }
      }
    ]
  ];
  for (const [titulo, ficheros] of casos) {
    const rep = cercoCon(ficheros);
    assert.equal(rep.ok, false, `la exención por coordenada se aplica de más: ${titulo}`);
  }
});

test('U259·I2 · YAML no obtiene la exención: sin estructura leída, todo es URL viva', () => {
  // Fallo-cerrado declarado: antes de exentar hay que poder leer el registro, y
  // el cerco no parsea YAML. Se dice en vez de dar una exención a ciegas.
  const rep = cercoCon({
    'DISK_09/registry.yaml': '- id: demo\n  oldid: 2\n  url: https://e.test/x?oldid=2\n'
  });
  assert.equal(rep.ok, false);
});

test('U259·I4 · prosa de RAÍZ enlazada es inerte; la URL desnuda y el `.md` de DATOS no', () => {
  // (a) `.md` suelto en la RAÍZ: categoría que el constructor de packs ya
  //     declara (`manifiesto_de_root` — «un pack sólo transporta discos»), o sea
  //     material que no viaja en ninguna réplica y que ningún cargador abre.
  // (b) dentro de un ENLACE de Markdown: dirigido a una persona.
  assert.equal(
    cercoCon({ 'README.md': 'Ver [la library](https://github.com/org/repo).\n' }).ok,
    true
  );
  // Falta (b): una URL desnuda en el mismo README NO está exenta.
  assert.equal(cercoCon({ 'README.md': 'Ver https://github.com/org/repo\n' }).ok, false);
  // Falta (a): un `.md` de DATOS bajo un disco NO está exento, aunque sea enlace.
  assert.equal(
    cercoCon({ 'DISK_09/escena/think.md': 'Ver [esto](https://github.com/org/repo).\n' }).ok,
    false
  );
});

test('U259 · el alcance de U206 NO se recorta: ledger y estado se siguen barriendo enteros', () => {
  // I4 exenta PROSA de raíz. El ledger y el estado también viven en la raíz y
  // NO son prosa: siguen siendo material cercado como cualquier otro, que es
  // exactamente lo que U206 declaró.
  for (const rel of ['.ops-ledger.jsonl', 'volumes.state.json']) {
    const rep = cercoCon({ [rel]: '{"kind":"import_pack","origin":"https://evil.test/x"}\n' });
    assert.equal(rep.ok, false, `${rel} dejó de barrerse: el alcance de U206 se recortó`);
    assert.ok(rep.liveUrls.some((u) => u.path === rel));
  }
});

test('ROJO · una URL viva detrás de un byte NUL NO obtiene salvoconducto', () => {
  // Antes: el fichero se clasificaba binario, se declaraba en `binaries[]` y
  // NO se escaneaba — así que un solo NUL inicial escondía una URL viva y el
  // gate concedía igual. Declarar no es proteger.
  const root = mkRoot();
  const bin = Buffer.concat([
    Buffer.from([0x00, 0x01, 0x02]),
    Buffer.from('http://oculto-en-binario.test/x')
  ]);
  fs.writeFileSync(path.join(root, 'blob.bin'), bin);
  const rep = scanRootCerco({ root });
  assert.deepEqual(rep.binaries, ['blob.bin'], 'sigue clasificándose como binario (informativo)');
  assert.equal(rep.ok, false, 'el gate concedió sobre una URL escondida tras un NUL');
  assert.ok(rep.liveUrls.some((u) => u.url === 'http://oculto-en-binario.test/x'));
});

test('ROJO · URL en MAYÚSCULAS también se detecta (m3)', () => {
  const root = mkRoot();
  fs.writeFileSync(path.join(root, 'nota.txt'), 'ANCLA: HTTPS://EJEMPLO.TEST/X\n', 'utf8');
  const rep = scanRootCerco({ root });
  assert.equal(rep.ok, false, 'el patrón de URL sigue siendo sensible a mayúsculas');
  assert.ok(rep.liveUrls.some((u) => /EJEMPLO\.TEST/i.test(u.url)));
});

test('ROJO · un root que NO EXISTE no está «limpio»: root_no_encontrado', () => {
  // Un gate que barre una ruta equivocada y devuelve verde es el modo de
  // fallo más caro: concede sobre la nada.
  const rep = scanRootCerco({ root: path.join(os.tmpdir(), 'zeus-u206-no-existe-jamas') });
  assert.equal(rep.ok, false);
  assert.equal(rep.findings[0].kind, 'root_no_encontrado');
  assert.equal(rep.files, 0);
});

test('ROJO · un directorio que EXISTE pero no es un volumes root: root_sin_manifiesto', () => {
  // La otra mitad de la inexistencia: la VACUIDAD. Un directorio vacío, o uno
  // cualquiera sin manifiesto, devolvía ok:true · files:0 · findings:0 y
  // assertRootCerco NO lanzaba. El paso 7 usa el root explícito, o sea la vía
  // que esquiva el resolvedor canónico: era la puerta abierta.
  const vacio = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u206c-vacio-'));
  TEMPS.push(vacio);
  const rep = scanRootCerco({ root: vacio });
  assert.equal(rep.ok, false);
  assert.equal(rep.findings[0].kind, 'root_sin_manifiesto');
  assert.throws(() => assertRootCerco({ root: vacio }), /Cerco del root roto/);

  // Y un directorio con contenido pero sin manifiesto tampoco pasa.
  const conCosas = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u206c-nolo-'));
  TEMPS.push(conCosas);
  fs.writeFileSync(path.join(conCosas, 'a.txt'), 'x', 'utf8');
  assert.equal(scanRootCerco({ root: conCosas }).findings[0].kind, 'root_sin_manifiesto');
});

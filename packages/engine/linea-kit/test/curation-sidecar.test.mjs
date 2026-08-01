/**
 * WP-U202-B2 · fija `isCuratedSidecarPath` (gate two-games / D-8).
 *
 * El predicado se resuelve por FORMA: en un volumen LINEAS todo `*.md` es
 * sidecar curado. Este fichero ata lo que el arreglo promete con PROPIEDADES
 * sobre un universo generado —no con una lista de rutas escogidas a mano—
 * porque una lista sólo cubre la vuelta atrás que uno imagina:
 *
 *   P1 · SUPERCONJUNTO: todo lo que protegía el predicado de `87bd93f` sigue
 *        protegido. Es el guardián de «no se ablanda la curación».
 *   P2 · INDEPENDENCIA DE RUTA: el resultado depende SÓLO del nombre base.
 *   P3 · SÓLO LA EXTENSIÓN: para cualquier nombre base el resultado es
 *        exactamente `base.endsWith('.md')`. Es la especificación entera.
 *   P4 · SIN RAMAS: el cuerpo del predicado no tiene `if`, tiene un único
 *        `return`, y ese `return` es exactamente la forma.
 *
 * ALCANCE HONESTO, medido intentando esquivar el guardián en vez de suponerlo.
 * P1-P3 recorren un universo generado (>20.000 rutas), pero **son exhaustivas
 * sólo sobre su propio alfabeto**: un estrechamiento cazado a un directorio o
 * a un nombre base que no aparezcan en él las pasa entera. Comprobado, no
 * deducido: `p.startsWith('inventadisimo-zzz/')` y `base.startsWith('z')`
 * pasaban P1-P3 en verde mientras ablandaban la protección.
 *
 * Por eso existe P4, y por eso es estructural y no de comportamiento: ningún
 * muestreo del espacio de entradas cierra la clase, pero **todo**
 * estrechamiento —esté o no en el alfabeto— necesita una RAMA. Prohibir la
 * rama cierra las dos vías a la vez sin adivinar ningún nombre. Lo que P4 no
 * cubre es reescribir el predicado entero con otra forma sin ramas; para eso
 * queda P1, y para el nombre de juego, el gate.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isCuratedSidecarPath } from '../src/curation.mjs';

/** El predicado TAL COMO ERA en la base 87bd93f. */
function isCuratedSidecarPathLegacy(relPath) {
  const p = String(relPath || '')
    .replace(/\\/g, '/')
    .toLowerCase();
  const base = p.split('/').pop() || '';
  if (base === 'registro.md' || base === 'delta.md') return true;
  return base.endsWith('.md') && p.includes('/registros/');
}

/** PRNG con semilla: universo grande pero reproducible. */
function mulberry32(seed) {
  let s = seed >>> 0;
  return function rnd() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(202220602);

/** Segmentos de directorio, incluidos los que un estrechamiento elegiría. */
const DIR_SEGMENTS = [
  'demo',
  'wp',
  'historia',
  'registros',
  'r0001-oldid-2',
  'borradores',
  'tmp',
  'raw',
  'cache',
  'snapshots',
  'nodos',
  'privado',
  'draft',
  '.oculto',
  'a',
  'zz',
  '0',
  '_x',
  'ñ',
  'con espacio'
];

/** Nombres base fijos: los canónicos, los de la tabla y formas frontera. */
const FIXED_BASENAMES = [
  'registro.md',
  'delta.md',
  'notas.md',
  'cualquier-nombre.md',
  'linea.md',
  'README.md',
  'LEER.MD',
  'a.md',
  '.md',
  '..md',
  'md',
  'archivo.md.bak',
  'sin-extension',
  'data.json',
  'registry.yaml',
  '1.wikitext'
];

/** Nombres base pseudoaleatorios, para no depender sólo de lo que imagino. */
function randomBasenames(n) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789-_';
  const exts = ['.md', '.MD', '.json', '.yaml', '', '.md.bak', '.markdown'];
  const out = [];
  for (let i = 0; i < n; i += 1) {
    let stem = '';
    const len = 1 + Math.floor(rnd() * 12);
    for (let j = 0; j < len; j += 1) stem += chars[Math.floor(rnd() * chars.length)];
    out.push(stem + exts[Math.floor(rnd() * exts.length)]);
  }
  return out;
}

const BASENAMES = [...FIXED_BASENAMES, ...randomBasenames(40)];

/** Prefijos de directorio: profundidad 0..4, exhaustivos + muestreados. */
function buildPrefixes() {
  const out = new Set(['']);
  for (const a of DIR_SEGMENTS) {
    out.add(`${a}/`);
    for (const b of DIR_SEGMENTS) out.add(`${a}/${b}/`);
  }
  for (let i = 0; i < 150; i += 1) {
    const depth = 3 + Math.floor(rnd() * 2);
    let p = '';
    for (let d = 0; d < depth; d += 1) {
      p += `${DIR_SEGMENTS[Math.floor(rnd() * DIR_SEGMENTS.length)]}/`;
    }
    out.add(p);
  }
  return [...out];
}
const PREFIXES = buildPrefixes();

describe('isCuratedSidecarPath · forma, no nombre (WP-U202-B2)', () => {
  it('el universo generado es grande (no es una lista escogida a mano)', () => {
    assert.ok(PREFIXES.length > 400, `prefijos: ${PREFIXES.length}`);
    assert.ok(BASENAMES.length >= 50, `nombres base: ${BASENAMES.length}`);
    assert.ok(PREFIXES.length * BASENAMES.length > 20000);
  });

  it('P1 · SUPERCONJUNTO: nada de lo protegido en 87bd93f deja de estarlo', () => {
    let checked = 0;
    let protectedBefore = 0;
    for (const prefix of PREFIXES) {
      for (const base of BASENAMES) {
        const rel = prefix + base;
        checked += 1;
        if (isCuratedSidecarPathLegacy(rel)) {
          protectedBefore += 1;
          assert.equal(
            isCuratedSidecarPath(rel),
            true,
            `REGRESIÓN: "${rel}" estaba protegido antes de U202-B2 y ya no lo está`
          );
        }
      }
    }
    assert.ok(checked > 20000, `rutas comprobadas: ${checked}`);
    assert.ok(protectedBefore > 500, `rutas protegidas por el legacy: ${protectedBefore}`);
  });

  it('P2 · INDEPENDENCIA DE RUTA: el resultado sólo mira el nombre base', () => {
    for (const base of BASENAMES) {
      const first = isCuratedSidecarPath(PREFIXES[0] + base);
      for (const prefix of PREFIXES) {
        assert.equal(
          isCuratedSidecarPath(prefix + base),
          first,
          `"${base}" cambia de resultado según el directorio ("${prefix}${base}"): ` +
            'el predicado discrimina por ruta, y por ahí se ablanda la protección'
        );
      }
    }
  });

  it('P3 · SÓLO LA EXTENSIÓN decide', () => {
    for (const base of BASENAMES) {
      const expected = base.toLowerCase().endsWith('.md');
      for (const prefix of PREFIXES) {
        assert.equal(
          isCuratedSidecarPath(prefix + base),
          expected,
          `"${prefix}${base}" debería dar ${expected} (sólo decide la extensión)`
        );
      }
    }
  });

  it('tabla de verdad del reporte, fila a fila', () => {
    const TABLE = [
      ['demo/wp/historia/registros/r0001-oldid-2/cualquier-nombre.md', true],
      ['demo/wp/historia/registros/r1/registro.md', true],
      ['demo/wp/historia/registro.md', true],
      ['registros/r1/delta.md', true],
      ['registros/r1/notas.md', true],
      ['demo/wp/historia/delta.md', true],
      // precio declarado del ensanche: export CRUDO protegido a propósito
      ['demo/raw/linea.md', true],
      ['demo/wp/historia/registros/r1/data.json', false],
      ['registry.yaml', false],
      ['demo/cache/snapshots/1.wikitext', false]
    ];
    for (const [rel, expected] of TABLE) {
      assert.equal(isCuratedSidecarPath(rel), expected, `${rel} debería dar ${expected}`);
    }
  });

  it('normaliza separador de Windows y mayúsculas; entradas basura no revientan', () => {
    assert.equal(isCuratedSidecarPath('demo\\wp\\historia\\registro.md'), true);
    assert.equal(isCuratedSidecarPath('demo/wp/historia/REGISTRO.MD'), true);
    assert.equal(isCuratedSidecarPath(''), false);
    assert.equal(isCuratedSidecarPath(null), false);
    assert.equal(isCuratedSidecarPath(undefined), false);
    assert.equal(isCuratedSidecarPath(0), false);
    assert.equal(isCuratedSidecarPath({}), false);
    assert.equal(isCuratedSidecarPath([]), false);
  });

  it('P4 · el predicado es SIN RAMAS: no puede discriminar por ruta ni por nombre', () => {
    // Ésta es la propiedad que cierra de verdad la clase, y la razón de que
    // exista: P1-P3 sólo son exhaustivas sobre el alfabeto generado, así que
    // un estrechamiento cazado a un directorio o a un nombre base que no estén
    // en ese alfabeto las pasa entera (comprobado: `p.startsWith('zzz-x/')` y
    // `base.startsWith('z')` las pasan). Pero CUALQUIER estrechamiento —lo
    // esté o no en el alfabeto— necesita una RAMA que devuelva algo distinto.
    // Prohibiendo la rama se cierran las dos vías a la vez, sin adivinar nada.
    const body = isCuratedSidecarPath.toString();

    assert.equal(
      /\bif\s*\(/.test(body),
      false,
      'el predicado tiene un `if`: sólo puede servir para excluir algo, y eso ablanda la protección'
    );
    assert.equal(
      (body.match(/\breturn\b/g) ?? []).length,
      1,
      'el predicado tiene más de un `return`: hay una salida temprana que excluye casos'
    );
    // El único `return` devuelve EXACTAMENTE la forma, sin condicionales
    // compuestos (ternario, `&&`, `||`) que pudieran recortar el conjunto.
    assert.match(
      body,
      /\n\s*return\s+base\.endsWith\(\s*['"`]\.md['"`]\s*\)\s*;?\s*\n?\s*\}\s*$/,
      'el `return` final ya no es exactamente `base.endsWith(".md")`'
    );

    // Y, como aviso temprano barato, cero literales de nombre de fichero.
    // ALCANCE: caza el literal de UNA pieza (`'registro.md'`); NO caza la
    // concatenación (`'delta' + '.md'`) ni `String.fromCharCode`. Para ésas la
    // barrera es el gate, que sí las ve cuando el nombre es de juego
    // (comprobado: `'delta' + '.md'` → gates FAIL, 1 offender).
    const filenameLiterals = body.match(/['"`][a-z0-9_-]+\.md['"`]/gi) ?? [];
    assert.deepEqual(
      filenameLiterals,
      [],
      `el predicado volvió a hardcodear nombres de fichero (${filenameLiterals.join(', ')}); ` +
        'eso reabre el offender two-games bajo packages/engine'
    );
  });
});

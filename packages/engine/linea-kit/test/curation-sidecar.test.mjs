/**
 * WP-U202-B2 · fija `isCuratedSidecarPath` (gate two-games / D-8).
 *
 * El predicado se resuelve por FORMA: en un volumen LINEAS todo `*.md` es
 * sidecar curado. Este fichero ata las tres cosas que el arreglo promete y
 * que un cambio posterior no debe poder deshacer en silencio:
 *   1. la tabla de verdad literal que describe el JSDoc de curation.mjs;
 *   2. la propiedad de SUPERCONJUNTO: nada de lo que el predicado anterior
 *      (`registro.md`/`delta.md` + `*.md` bajo `/registros/`) protegía ha
 *      dejado de estar protegido — la protección de curación no se ablanda;
 *   3. cero literales de nombre de sidecar en el cuerpo del predicado, que
 *      es lo que el gate `two-games` prohíbe bajo packages/engine.
 *
 * Sin (3) el WP sería reversible sin poner rojo: como el predicado ya
 * devuelve true para todo `*.md`, reintroducir `base === '<juego>.md'` no
 * cambiaría NINGUNA salida y ningún test de entrada/salida lo notaría —
 * pero el gate volvería a rojo. Por eso (3) mira el cuerpo de la función.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isCuratedSidecarPath } from '../src/curation.mjs';

/** El predicado TAL COMO ERA antes de U202-B2, para la prueba de superconjunto. */
function isCuratedSidecarPathLegacy(relPath) {
  const p = String(relPath || '')
    .replace(/\\/g, '/')
    .toLowerCase();
  const base = p.split('/').pop() || '';
  if (base === 'registro.md' || base === 'delta.md') return true;
  return base.endsWith('.md') && p.includes('/registros/');
}

/** Rutas fijas del reporte del WP: [ruta, esperado]. */
const TRUTH_TABLE = [
  // (i) cualquier nombre dentro de un registro: el caso que sostiene el loader real
  ['demo/wp/historia/registros/r0001-oldid-2/cualquier-nombre.md', true],
  // (ii) sidecar canónico de la capa de curación (DATOS §2)
  ['demo/wp/historia/registro.md', true],
  // (iii) `registros/` como PRIMER segmento: antes false para notas, true sólo por el literal
  ['registros/r1/delta.md', true],
  ['registros/r1/notas.md', true],
  // (iv) sidecar fuera de `registros/`
  ['demo/wp/historia/delta.md', true],
  // (v) export CRUDO en markdown (DATOS §2 `raw/linea.md`): protegido a propósito.
  //     Es el precio declarado del ensanche, escrito aquí para que sea visible.
  ['demo/raw/linea.md', true],
  // soporte que NO es markdown: nunca sidecar
  ['demo/wp/historia/registros/r1/data.json', false],
  ['registry.yaml', false],
  ['demo/cache/snapshots/12345.wikitext', false],
  ['demo/manifest.json', false]
];

describe('isCuratedSidecarPath · forma, no nombre (WP-U202-B2)', () => {
  it('cumple la tabla de verdad que declara el JSDoc', () => {
    for (const [rel, expected] of TRUTH_TABLE) {
      assert.equal(
        isCuratedSidecarPath(rel),
        expected,
        `${rel} debería dar ${expected}`
      );
    }
  });

  it('normaliza separador de Windows y mayúsculas', () => {
    assert.equal(isCuratedSidecarPath('demo\\wp\\historia\\registro.md'), true);
    assert.equal(isCuratedSidecarPath('demo/wp/historia/REGISTRO.MD'), true);
    assert.equal(isCuratedSidecarPath(''), false);
    assert.equal(isCuratedSidecarPath(null), false);
    assert.equal(isCuratedSidecarPath(undefined), false);
  });

  it('es SUPERCONJUNTO del predicado anterior: no se ablanda ninguna protección', () => {
    const universe = [
      ...TRUTH_TABLE.map(([rel]) => rel),
      'registro.md',
      'delta.md',
      'demo/registros/r1/x.md',
      'demo/wp/historia/registros/r1/registro.md',
      'demo/wp/historia/registros/r1/delta.md',
      'demo/wp/historia/notas.md',
      'demo/wp/historia/registros/r1/nota.txt',
      'a/b/c/d/e/f.md'
    ];
    for (const rel of universe) {
      if (isCuratedSidecarPathLegacy(rel)) {
        assert.equal(
          isCuratedSidecarPath(rel),
          true,
          `REGRESIÓN: ${rel} estaba protegido antes de U202-B2 y ya no lo está`
        );
      }
    }
  });

  it('no hardcodea ningún nombre de sidecar en el cuerpo del predicado (gate two-games / D-8)', () => {
    const body = isCuratedSidecarPath.toString();
    // Sólo la EXTENSIÓN puede aparecer como literal: `'.md'` no casa aquí,
    // `'registro.md'` o `'<juego>.md'` sí.
    const filenameLiterals = body.match(/['"`][a-z0-9_-]+\.md['"`]/gi) ?? [];
    assert.deepEqual(
      filenameLiterals,
      [],
      `el predicado volvió a hardcodear nombres de fichero (${filenameLiterals.join(', ')}); ` +
        'eso reabre el offender two-games bajo packages/engine'
    );
    assert.match(body, /endsWith\(\s*['"`]\.md['"`]\s*\)/);
  });
});

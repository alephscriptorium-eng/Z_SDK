/**
 * WP-U266 · B3 · `oasis-webrtc` resuelve su puerto por la fuente única.
 *
 * Sexto fichero, y entró por la MISMA puerta que el quinto: lee el entorno
 * **por parámetro** (`resolveOasisWebrtcListen(env = process.env)`), y la
 * validación de `resolveZeusUiPorts()` sólo mira `process.env`.
 *
 * Lo que lo delataba era el contraste entre los dos canales, con la MISMA
 * clave:
 *
 *   resolveOasisWebrtcListen({ ZEUS_PORT_OASIS_WEBRTC: '0x10' }).port -> 16, rc=0
 *   ZEUS_PORT_OASIS_WEBRTC=0x10  (por process.env)                    -> ABORTA, rc=1
 *
 * Y punta a punta con `"0"` declarado: ataba en un efímero (61432) y lo
 * anunciaba como si fuera el configurado.
 *
 * **Por qué se me escapó, que es la parte útil**: en la 3ª vuelta escribí
 * «oasis-webrtc está cubierto y sin alias — medido, no razonado». «Sin alias»
 * era cierto; «cubierto» lo medí **por `process.env`**, que es justo el canal
 * donde el guardián ancho lo tapa — y no por el canal que había producido B2,
 * cuya lección acababa de escribir. Medir por el canal equivocado es no medir.
 *
 * Por eso los asertos de aquí van **por parámetro**: es el canal que ningún
 * otro guardián ve.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOasisWebrtcListen } from '../src/http-api.mjs';
import { DEFAULT_ZEUS_UI_MESH, uiPortEnvChain } from '@zeus/presets-sdk/env';

/** Los siete de la ficha, más `abc` (que daba `NaN`). */
const MALOS = ['0', '-1', '65536', '3.5', '0x10', '  ', '03012', 'abc'];

const DEFECTO = DEFAULT_ZEUS_UI_MESH.oasisWebrtc.port;

test('U266/B3 · un puerto mal formado POR PARÁMETRO aborta (el canal que se escapó)', () => {
  for (const raw of MALOS) {
    assert.throws(
      () => resolveOasisWebrtcListen({ ZEUS_PORT_OASIS_WEBRTC: raw }),
      { code: 'ZEUS_PUERTO_MAL_FORMADO' },
      `${JSON.stringify(raw)} deberia abortar en vez de resolver`
    );
  }
});

test('U266/B3 · y por process.env también (ahí ya lo tapaba resolveZeusUiPorts)', () => {
  const prev = process.env.ZEUS_PORT_OASIS_WEBRTC;
  try {
    for (const raw of MALOS) {
      process.env.ZEUS_PORT_OASIS_WEBRTC = raw;
      assert.throws(() => resolveOasisWebrtcListen(), { code: 'ZEUS_PUERTO_MAL_FORMADO' });
    }
  } finally {
    if (prev === undefined) delete process.env.ZEUS_PORT_OASIS_WEBRTC;
    else process.env.ZEUS_PORT_OASIS_WEBRTC = prev;
  }
});

test('U266/B3 · el mapa explícito manda en la CLAVE; el FALLBACK sigue saliendo de process.env', () => {
  // Escrito tal cual porque mi primera versión de este test afirmaba «el mapa
  // explícito NO se mezcla con process.env» a secas, y **es más ancho que la
  // verdad**: el mapa gobierna la búsqueda de la clave, pero el valor por
  // defecto es `resolveZeusUiPorts().oasisWebrtc.port`, que sí lee
  // `process.env`. Medido, no supuesto. Es preexistente y lo mismo ocurre en
  // `webrtc-viewer/src/game-bridge.mjs`; queda declarado en el reporte (§7).
  const prev = process.env.ZEUS_PORT_OASIS_WEBRTC;
  try {
    process.env.ZEUS_PORT_OASIS_WEBRTC = '14099';
    // la CLAVE la manda el mapa:
    assert.equal(resolveOasisWebrtcListen({ ZEUS_PORT_OASIS_WEBRTC: '14022' }).port, 14022);
    // el FALLBACK no: con mapa vacío hereda lo que diga process.env.
    assert.equal(resolveOasisWebrtcListen({}).port, 14099, 'el fallback viene del mesh');
    // y un mapa vacío con process.env limpio sí da el defecto declarado.
    delete process.env.ZEUS_PORT_OASIS_WEBRTC;
    assert.equal(resolveOasisWebrtcListen({}).port, DEFECTO);
  } finally {
    if (prev === undefined) delete process.env.ZEUS_PORT_OASIS_WEBRTC;
    else process.env.ZEUS_PORT_OASIS_WEBRTC = prev;
  }
});

test('U266/B3 · legítimos, defecto y `null` (M-i)', () => {
  assert.equal(resolveOasisWebrtcListen({ ZEUS_PORT_OASIS_WEBRTC: '14022' }).port, 14022);
  assert.equal(resolveOasisWebrtcListen({ ZEUS_PORT_OASIS_WEBRTC: '' }).port, DEFECTO);
  assert.equal(resolveOasisWebrtcListen({}).port, DEFECTO);
  // `null` explícito: antes reventaba con un TypeError opaco (M-i).
  assert.equal(resolveOasisWebrtcListen(null).port, DEFECTO);
  assert.equal(resolveOasisWebrtcListen().port, DEFECTO);
});

test('U266/B3 · este slot no tiene alias, y la cadena lo dice', () => {
  assert.deepEqual(uiPortEnvChain('oasisWebrtc'), ['ZEUS_PORT_OASIS_WEBRTC']);
});

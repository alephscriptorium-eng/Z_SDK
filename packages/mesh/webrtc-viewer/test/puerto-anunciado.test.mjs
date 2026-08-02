/**
 * WP-U266 · B2 · lo que se ANUNCIA es lo que se ATA.
 *
 * `src/game-bridge.mjs` construye las URLs del visor que el juego reparte. Se
 * le escapó a dos censos seguidos —y a un comentario mío que afirmaba que el
 * alias «no lo conoce nadie más»— porque lee el entorno **por parámetro**
 * (`resolveWebRtcViewerEndpoint(env = process.env)`), y mi instrumento estaba
 * anclado en el literal `process.env.`.
 *
 * Tenía las dos mitades del defecto de la ficha:
 *
 *  1. valor mal formado por el alias -> anunciaba y punto, rc=0:
 *       WEBRTC_VIEWER_PORT=0     -> http://localhost:0
 *       WEBRTC_VIEWER_PORT=0x10  -> http://localhost:16
 *       WEBRTC_VIEWER_PORT=abc   -> http://localhost:NaN
 *
 *  2. **y ésta sin un solo valor malo**: precedencia OPUESTA a la de
 *     `serve.mjs`, que es quien ata. Con configuración enteramente válida
 *     `ZEUS_PORT_WEBRTC_VIEWER=4001 WEBRTC_VIEWER_PORT=4002`, serve.mjs ataba
 *     en 4002 y game-bridge anunciaba 4001.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveWebRtcViewerEndpoint, WEBRTC_VIEWER_PORT_ENV } from '../src/game-bridge.mjs';
import { readEnvPortAlias, uiPortEnvChain, resetZeusEnvLoader } from '@zeus/presets-sdk/env';

/** Los siete de la ficha, más `abc` (que también anunciaba, como `:NaN`). */
const MALOS = ['0', '-1', '65536', '3.5', '0x10', '  ', '03012', 'abc'];

const CLAVES = ['WEBRTC_VIEWER_PORT', 'ZEUS_PORT_WEBRTC_VIEWER'];

/**
 * @param {Record<string,string|undefined>} vars
 * @param {() => void} fn
 */
function conEntorno(vars, fn) {
  const prev = {};
  for (const k of CLAVES) prev[k] = process.env[k];
  resetZeusEnvLoader();
  try {
    for (const k of CLAVES) delete process.env[k];
    for (const [k, v] of Object.entries(vars)) if (v !== undefined) process.env[k] = v;
    fn();
  } finally {
    for (const k of CLAVES) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
    resetZeusEnvLoader();
  }
}

// OJO al leer los verdes de este fichero: por `process.env` el guardián que
// dispara NO es el de aquí, sino `resolveZeusUiPorts()` (línea 41), que desde
// M-a conoce la cadena de alias. Ablacionado el cuerpo de `resolveWebRtcViewerEndpoint`,
// este test SIGUE en verde. Los que sostienen el cableado de este fichero son
// los dos siguientes: el del `env` por parámetro —canal que `resolveZeusUiPorts`
// no puede ver— y el de anunciar==atar.
test('U266/B2 · alias mal formado por process.env (guardián: resolveZeusUiPorts)', () => {
  for (const raw of MALOS) {
    conEntorno({ WEBRTC_VIEWER_PORT: raw }, () => {
      assert.throws(
        () => resolveWebRtcViewerEndpoint(),
        { code: 'ZEUS_PUERTO_MAL_FORMADO' },
        `${JSON.stringify(raw)} deberia abortar en vez de anunciar`
      );
    });
  }
});

test('U266/B2 · el `env` por parámetro también se valida (era la puerta de atrás)', () => {
  // La API pública recibe el mapa por parámetro. Si la validación mirara sólo
  // `process.env`, esta vía seguiría cruda — y es justo la que se escapó.
  for (const raw of MALOS) {
    assert.throws(
      () => resolveWebRtcViewerEndpoint({ WEBRTC_VIEWER_PORT: raw }),
      { code: 'ZEUS_PUERTO_MAL_FORMADO' },
      JSON.stringify(raw)
    );
  }
  // Y con un mapa explícito bien formado, resuelve contra ESE mapa.
  assert.equal(resolveWebRtcViewerEndpoint({ WEBRTC_VIEWER_PORT: '4444' }).port, 4444);
});

test('U266/B2 · anunciar y atar leen la MISMA cadena, en el mismo orden', () => {
  // La prueba que importa: no que cada uno sea correcto por su cuenta, sino
  // que coincidan. Con las dos claves declaradas y ambas válidas.
  conEntorno({ ZEUS_PORT_WEBRTC_VIEWER: '4001', WEBRTC_VIEWER_PORT: '4002' }, () => {
    const anuncia = resolveWebRtcViewerEndpoint().port;
    const ata = readEnvPortAlias(WEBRTC_VIEWER_PORT_ENV, 3023);
    assert.equal(anuncia, ata, 'lo anunciado y lo atado se han separado');
    assert.equal(anuncia, 4002, 'gana el alias legado, que es lo que hacía serve.mjs');
  });
});

test('U266/B2 · el orden vive en la fuente única, no copiado aquí', () => {
  // Si alguien reescribe la lista a mano en cualquiera de los dos ficheros,
  // esto cae. Es lo que impide que vuelvan a divergir.
  assert.deepEqual([...WEBRTC_VIEWER_PORT_ENV], uiPortEnvChain('webrtcViewer'));
  assert.deepEqual([...WEBRTC_VIEWER_PORT_ENV], [
    'WEBRTC_VIEWER_PORT',
    'ZEUS_PORT_WEBRTC_VIEWER'
  ]);
});

test('U266/B2 · lo legítimo y el defecto siguen igual', () => {
  conEntorno({}, () => {
    assert.equal(resolveWebRtcViewerEndpoint().port, 3023);
  });
  conEntorno({ WEBRTC_VIEWER_PORT: '14023' }, () => {
    assert.equal(resolveWebRtcViewerEndpoint().baseUrl, 'http://localhost:14023');
  });
  conEntorno({ ZEUS_PORT_WEBRTC_VIEWER: '14023' }, () => {
    assert.equal(resolveWebRtcViewerEndpoint().port, 14023);
  });
});

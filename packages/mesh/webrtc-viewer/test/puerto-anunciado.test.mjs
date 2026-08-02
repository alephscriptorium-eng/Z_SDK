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
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { resolveWebRtcViewerEndpoint, WEBRTC_VIEWER_PORT_ENV } from '../src/game-bridge.mjs';
import { uiPortEnvChain, resetZeusEnvLoader } from '@zeus/presets-sdk/env';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SERVE = pathToFileURL(path.join(AQUI, '..', 'serve.mjs')).href;
const BRIDGE = pathToFileURL(path.join(AQUI, '..', 'src', 'game-bridge.mjs')).href;

/**
 * Arranca el servidor DE VERDAD y devuelve el puerto que ATA (leído de
 * `server.address()`, no recalculado) junto con el que ANUNCIA game-bridge.
 *
 * En proceso hijo y por el entrypoint real a propósito. La versión anterior de
 * este guardián calculaba el lado «ata» como
 * `readEnvPortAlias(WEBRTC_VIEWER_PORT_ENV, …)`, o sea **lo re-derivaba de la
 * constante en vez de preguntárselo a quien ata** — y por eso no cazaba que
 * alguien reescribiera la lista a mano dentro de `serve.mjs`. Con esa ablación
 * la suite quedaba 25/25 en VERDE **con B2 reintroducido** (WP-U266 · B4).
 *
 * @param {Record<string,string>} env
 * @returns {{ rc: number, ata: number|null, anuncia: number|null, salida: string }}
 */
function ataYAnuncia(env) {
  const guion = `
    const serve = await import(${JSON.stringify(SERVE)});
    const bridge = await import(${JSON.stringify(BRIDGE)});
    const handle = await serve.createWebRtcViewerServer({});
    const anuncia = bridge.resolveWebRtcViewerEndpoint().port;
    console.log('RESULTADO ' + JSON.stringify({ ata: handle.port, anuncia }));
    await handle.close();
  `;
  try {
    const salida = execFileSync(process.execPath, ['--input-type=module', '-e', guion], {
      env: { ...process.env, ...env },
      encoding: 'utf8',
      timeout: 40000,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const m = /RESULTADO (\{.*\})/.exec(salida);
    const j = m ? JSON.parse(m[1]) : {};
    return { rc: 0, ata: j.ata ?? null, anuncia: j.anuncia ?? null, salida };
  } catch (err) {
    return {
      rc: err.status ?? -1,
      ata: null,
      anuncia: null,
      salida: String(err.stdout || '') + String(err.stderr || '')
    };
  }
}

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

test('U266/B4 · anunciar == ATAR, con el puerto REAL del bind', () => {
  // Las dos claves declaradas y ambas válidas: el escenario de B2, que no
  // necesita ningún valor mal formado. `ata` sale de `server.address()`.
  const r = ataYAnuncia({ ZEUS_PORT_WEBRTC_VIEWER: '4001', WEBRTC_VIEWER_PORT: '4002' });
  assert.equal(r.rc, 0, `el servidor debía arrancar · salida: ${r.salida.slice(0, 300)}`);
  assert.equal(r.ata, r.anuncia, `lo atado (${r.ata}) y lo anunciado (${r.anuncia}) se han separado`);
  assert.equal(r.ata, 4002, 'gana el alias legado, que es el orden de la fuente única');
});

test('U266/B4 · el octavo vector, contra el bind real: clave vacía = defecto, no efímero', () => {
  // `WEBRTC_VIEWER_PORT=""` con el código viejo daba `Number("")` = 0 -> el SO
  // asignaba un efímero y el servidor lo presentaba como suyo. Este aserto
  // muerde a `serve.mjs` directamente: no lo tapa `resolveZeusUiPorts`, porque
  // lo que se mira es el puerto realmente atado.
  const r = ataYAnuncia({ WEBRTC_VIEWER_PORT: '' });
  assert.equal(r.rc, 0, `salida: ${r.salida.slice(0, 300)}`);
  assert.equal(r.ata, 3023, 'clave vacía debe caer al defecto, no a un efímero');
  assert.equal(r.anuncia, 3023);
});

test('U266/B4 · sin configurar, ata y anuncia el defecto', () => {
  const r = ataYAnuncia({});
  assert.equal(r.rc, 0, `salida: ${r.salida.slice(0, 300)}`);
  assert.equal(r.ata, 3023);
  assert.equal(r.anuncia, 3023);
});

test('U266/B4 · un override legítimo se ata y se anuncia igual', () => {
  const porCanonica = ataYAnuncia({ ZEUS_PORT_WEBRTC_VIEWER: '14023' });
  assert.equal(porCanonica.rc, 0, porCanonica.salida.slice(0, 300));
  assert.equal(porCanonica.ata, 14023);
  assert.equal(porCanonica.anuncia, 14023);

  const porAlias = ataYAnuncia({ WEBRTC_VIEWER_PORT: '14024' });
  assert.equal(porAlias.rc, 0, porAlias.salida.slice(0, 300));
  assert.equal(porAlias.ata, 14024);
  assert.equal(porAlias.anuncia, 14024);
});

test('U266/B4 · un valor mal formado impide ATAR (no sólo anunciar)', () => {
  for (const raw of ['0', '-1', '65536', '0x10', '03012', 'abc']) {
    const r = ataYAnuncia({ WEBRTC_VIEWER_PORT: raw });
    assert.equal(r.rc, 1, `${JSON.stringify(raw)}: el proceso debía abortar`);
    assert.match(r.salida, /ZEUS_PUERTO_MAL_FORMADO/, JSON.stringify(raw));
    assert.equal(r.ata, null, `${JSON.stringify(raw)}: no debió llegar a atar`);
  }
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

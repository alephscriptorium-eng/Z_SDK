/**
 * WP-U266 · `webrtc-viewer` resuelve su puerto por la fuente unica.
 *
 * Tercer servidor que salio del censo re-hecho, PERO con una diferencia que hay
 * que decir porque cambia de quien es el merito — se descubrio ablacionando:
 *
 *  - `ZEUS_PORT_WEBRTC_VIEWER` (canonica) **ya estaba cubierta** antes de tocar
 *    este fichero. `resolveViewerPort` llama a `resolveZeusUiPorts()` para
 *    calcular su defecto, y ese resolver valida todas las claves del mesh. Con
 *    el `Number(...)` viejo restaurado, el caso sigue abortando: **salta OTRO
 *    guardian**, no el de aqui. El test 1 pasa en la ablacion y por eso NO
 *    demuestra el cableado de este fichero.
 *  - `WEBRTC_VIEWER_PORT` (alias legado) no la conoce ningun resolver de la
 *    fuente unica. Ese era el hueco real, y es el unico caso que enrojece al
 *    ablacionar ESTE fichero.
 *
 * CORRECCION (WP-U266 · B2): una version anterior de este comentario decia que
 * el alias «no lo conoce nadie mas». **Era falso**: `src/game-bridge.mjs` lo
 * leia por su cuenta y anunciaba `http://localhost:0` con rc=0. Lo cubre ahora
 * `game-bridge.test` / `puerto-anunciado.test.mjs`. La frase estaba escrita con
 * la confianza de un censo cuyo instrumento no podia ver ese fichero.
 *
 * `resolveViewerPort` no se exporta, asi que se ejerce por el entrypoint real
 * en un proceso hijo: es ademas lo que de verdad significa "falla al arrancar".
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SERVE = path.join(AQUI, '..', 'serve.mjs');

/** Los siete valores medidos por la contrarrevision de U181. */
const SIETE = ['0', '-1', '65536', '3.5', '0x10', '  ', '03012'];

/**
 * Arranca el entrypoint real y devuelve `{ rc, salida }`.
 * @param {Record<string,string>} env
 */
function arrancar(env) {
  try {
    const salida = execFileSync(process.execPath, [SERVE], {
      env: { ...process.env, ...env },
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { rc: 0, salida: String(salida) };
  } catch (err) {
    return {
      rc: err.status ?? -1,
      salida: String(err.stdout || '') + String(err.stderr || '')
    };
  }
}

test('U266 · los siete valores abortan el arranque por la clave canonica (guardian: resolveZeusUiPorts)', () => {
  for (const raw of SIETE) {
    const { rc, salida } = arrancar({ ZEUS_PORT_WEBRTC_VIEWER: raw });
    assert.equal(rc, 1, `${JSON.stringify(raw)}: codigo de salida`);
    assert.match(salida, /ZEUS_PUERTO_MAL_FORMADO/, `${JSON.stringify(raw)}: motivo`);
    // Si abortase por OTRA razon (un import roto, por ejemplo) el codigo de
    // salida seria 1 igual y esto pasaria en verde por la razon equivocada.
    assert.match(salida, /ZEUS_PORT_WEBRTC_VIEWER/, `${JSON.stringify(raw)}: nombra la clave`);
  }
});

test('U266 · el alias legado WEBRTC_VIEWER_PORT (guardian: resolveZeusUiPorts, desde M-a)', () => {
  // CORRECCION (WP-U266 · B4). Este comentario decia: «el caso que NADIE mas
  // cubre: resolveZeusUiPorts no conoce el alias legado». **Dejo de ser cierto
  // dentro de este mismo WP**: el arreglo M-a metio los alias en
  // `UI_PORT_ENV_CHAIN`, asi que `resolveZeusUiPorts` SI los conoce — y con
  // ello RETRO-ENMASCARO este test, que hasta entonces si mordia.
  //
  // O sea: un arreglo que ensancha un guardian ancho puede dejar ciego un test
  // que ayer mordia. Por eso las ablaciones se corren DESPUES del ultimo
  // cambio, no antes. Lo que hoy muerde el cableado de `serve.mjs` esta en
  // `puerto-anunciado.test.mjs`, contra el puerto REALMENTE atado.
  for (const raw of SIETE) {
    const { rc, salida } = arrancar({ WEBRTC_VIEWER_PORT: raw });
    assert.equal(rc, 1, `${JSON.stringify(raw)}: codigo de salida`);
    assert.match(salida, /ZEUS_PUERTO_MAL_FORMADO/, `${JSON.stringify(raw)}: motivo`);
    assert.match(salida, /WEBRTC_VIEWER_PORT/, `${JSON.stringify(raw)}: nombra el alias`);
  }
});

test('U266 · el alias legado gana sobre la canonica, y solo se valida el que gana', () => {
  // El legado malo NO se tapa con una canonica buena.
  const malo = arrancar({ WEBRTC_VIEWER_PORT: '0', ZEUS_PORT_WEBRTC_VIEWER: '13023' });
  assert.equal(malo.rc, 1, 'el que gana es el legado, y esta mal');
  assert.match(malo.salida, /WEBRTC_VIEWER_PORT="0"/);
});

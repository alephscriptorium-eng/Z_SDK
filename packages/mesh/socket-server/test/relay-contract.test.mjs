import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { SocketClient } from '@zeus/socket-core/client';
import { createScriptoriumServer } from '../src/index.mjs';
import { relayDiscardLedger, resetRelayDiscardLedger } from '../src/relay.mjs';
import { NAMESPACE, RELAY_DOWNSTREAM_TOP, RELAY_UPSTREAM } from '../src/config.mjs';
import {
  RELAY_CONTRACT,
  RELAY_CONTRACT_SEAL,
  RELAY_CONTRACT_VERSION,
  assertRelayContract,
  computeRelaySeal,
  relayContractDescriptor
} from '../src/relay-contract.mjs';

/**
 * WP-U194 · la allowlist del relay como contrato.
 *
 * Este fichero NO reproduce los nombres de los eventos: si lo hiciera sería
 * la segunda lista viva que U194 existe para eliminar. Ancla tres escalares
 * — versión, sello sha256 y cuentas — y todo lo demás lo deriva del propio
 * contrato o lo prueba por comportamiento contra un puente real.
 *
 * Escrito para el lector hostil. Cazan:
 *  - añadir/quitar un evento sin re-sellar → el módulo NO carga (gate de
 *    carga) y toda la suite cae;
 *  - añadir/quitar re-sellando pero sin subir versión → ancla del sello roja;
 *  - declarar una segunda lista en otro `src/*.mjs` → «sin segunda lista» roja;
 *  - ampliar la allowlist en caliente con `.add()` → «inmutable» roja;
 *  - borrar la guarda `RELAY_DOWNSTREAM_TOP.has(event)` o el bucle de subida
 *    → cierre e2e rojo (los intrusos pasan / lo permitido deja de pasar);
 *  - colar un evento por una rama nueva y hardcodeada dentro de `relay.mjs`
 *    → el corpus del cierre e2e se extrae de los literales del propio
 *    `relay.mjs`, así que el nombre colado se prueba a sí mismo.
 */

/** Ancla literal: cambiarla es declarar un cambio de contrato. */
const VERSION_ANCLADA = '1.0.0';
const SELLO_ANCLADO = '57adb96df059db58ee86e20b725012f37adb9f5d20f99f901863cff3b637335e';
const CUENTA_SUBIDA = 3;
const CUENTA_BAJADA = 8;

/** Nombres que socket.io reserva y no se pueden emitir como evento. */
const RESERVADOS_SOCKETIO = new Set([
  'connect',
  'connection',
  'connect_error',
  'disconnect',
  'disconnecting',
  'new_namespace',
  'newListener',
  'removeListener'
]);

/** Espera activa con tope; falla con etiqueta si no se cumple. */
function waitFor(predicate, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (predicate()) {
        clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`timeout esperando: ${label}`));
      }
    }, 25);
  });
}

/** Lee el texto de un fuente del paquete. */
function fuente(rutaRelativa) {
  return readFileSync(new URL(rutaRelativa, import.meta.url), 'utf8');
}

/**
 * Literales de cadena con pinta de nombre de evento presentes en los
 * fuentes dados. Sirve de corpus de sondas: cualquier nombre hardcodeado en
 * el relay que no esté en el contrato tiene que ser probado y rechazado.
 * @param {string[]} rutas
 */
function literalesDeFuente(rutas) {
  const encontrados = new Set();
  for (const ruta of rutas) {
    for (const m of fuente(ruta).matchAll(/'([^'\n\\]{1,64})'|"([^"\n\\]{1,64})"/g)) {
      const s = m[1] ?? m[2];
      if (s && !/\s/.test(s) && !RESERVADOS_SOCKETIO.has(s)) encontrados.add(s);
    }
  }
  return [...encontrados];
}

/** Declaración plana equivalente al contrato vivo (para sondear el gate). */
function declaracionViva() {
  return {
    version: RELAY_CONTRACT_VERSION,
    seal: RELAY_CONTRACT_SEAL,
    upstream: [...RELAY_CONTRACT.upstream],
    downstream: [...RELAY_CONTRACT.downstream]
  };
}

// ── 1 · Ancla ────────────────────────────────────────────────────────────

test('ancla del contrato: versión, sello y cuentas son literales fijados', () => {
  assert.equal(
    RELAY_CONTRACT_VERSION,
    VERSION_ANCLADA,
    'la versión del contrato cambió: es un cambio de política, decláralo aquí y en el reporte del WP'
  );
  assert.equal(
    RELAY_CONTRACT_SEAL,
    SELLO_ANCLADO,
    'el sello del contrato cambió: la allowlist NO es la misma. Sube la versión y actualiza este ancla a conciencia'
  );
  assert.equal(RELAY_CONTRACT.upstream.length, CUENTA_SUBIDA, 'la tabla de subida cambió de tamaño');
  assert.equal(RELAY_CONTRACT.downstream.size, CUENTA_BAJADA, 'la allowlist de bajada cambió de tamaño');
  assert.deepEqual(relayContractDescriptor().counts, {
    upstream: CUENTA_SUBIDA,
    downstream: CUENTA_BAJADA
  });
});

// ── 2 · El sello es del contenido, en las dos direcciones ────────────────

test('el sello es del contenido: añadir o quitar un evento lo cambia y el gate lo caza', () => {
  const viva = declaracionViva();

  assert.equal(
    computeRelaySeal(viva),
    SELLO_ANCLADO,
    'el sello declarado no corresponde a la allowlist viva'
  );

  const mutaciones = {
    'AÑADIR un evento a la bajada': {
      ...viva,
      downstream: [...viva.downstream, 'evento:colado']
    },
    'QUITAR un evento de la bajada': { ...viva, downstream: viva.downstream.slice(1) },
    'AÑADIR un evento a la subida': { ...viva, upstream: [...viva.upstream, 'EVENTO_COLADO'] },
    'QUITAR un evento de la subida': { ...viva, upstream: viva.upstream.slice(1) },
    'REORDENAR la subida (el orden de registro es política)': {
      ...viva,
      upstream: [...viva.upstream].reverse()
    },
    'misma allowlist con OTRA versión': { ...viva, version: '9.9.9' }
  };

  for (const [etiqueta, mutada] of Object.entries(mutaciones)) {
    assert.notEqual(
      computeRelaySeal(mutada),
      SELLO_ANCLADO,
      `${etiqueta}: el sello NO cambió — el sello no está sellando nada`
    );
    assert.throws(
      () => assertRelayContract({ ...mutada, seal: SELLO_ANCLADO }),
      /el sello NO corresponde a la allowlist declarada/,
      `${etiqueta}: el gate del contrato no lanzó`
    );
  }

  // Y el camino legítimo existe: re-sellar con la versión subida sí valida.
  const legitima = { ...viva, downstream: [...viva.downstream, 'evento:nuevo'], version: '1.1.0' };
  assert.doesNotThrow(() =>
    assertRelayContract({ ...legitima, seal: computeRelaySeal(legitima) })
  );
});

// ── 3 · Fuente única ─────────────────────────────────────────────────────

test('fuente única: el runtime consume el contrato por identidad, no por copia', () => {
  assert.equal(
    RELAY_UPSTREAM,
    RELAY_CONTRACT.upstream,
    'config.mjs no re-exporta el contrato: hay una tabla de subida paralela'
  );
  assert.equal(
    RELAY_DOWNSTREAM_TOP,
    RELAY_CONTRACT.downstream,
    'config.mjs no re-exporta el contrato: hay una allowlist de bajada paralela'
  );
});

test('sin segunda lista: ningún otro fuente del paquete declara nombres del contrato', () => {
  const nombres = [...RELAY_CONTRACT.upstream, ...RELAY_CONTRACT.downstream];
  // Excepciones declaradas: relay.mjs desempaqueta ROOM_MESSAGE y da a
  // SET_STATE un camino propio (comportamiento heredado de la base, probado
  // por relay-trace.test.mjs). No son listas: son dos ramas nombradas.
  const permitido = { 'relay.mjs': new Set(['ROOM_MESSAGE', 'SET_STATE']) };
  // Se enumera el directorio, no una lista fija: un fuente nuevo con una
  // tabla paralela entra solo en el barrido.
  const otrosFuentes = readdirSync(new URL('../src/', import.meta.url))
    .filter((f) => f.endsWith('.mjs') && f !== 'relay-contract.mjs');
  assert.ok(otrosFuentes.length >= 5, `barrido vacío o truncado (${otrosFuentes.length} fuentes)`);
  assert.ok(otrosFuentes.includes('config.mjs') && otrosFuentes.includes('relay.mjs'));

  const infracciones = [];
  for (const nombre of otrosFuentes) {
    const texto = fuente(`../src/${nombre}`);
    for (const evento of nombres) {
      if (permitido[nombre]?.has(evento)) continue;
      if (texto.includes(`'${evento}'`) || texto.includes(`"${evento}"`)) {
        infracciones.push(`src/${nombre} declara '${evento}'`);
      }
    }
  }
  assert.deepEqual(
    infracciones,
    [],
    'segunda lista viva detectada: los nombres de evento solo pueden estar en src/relay-contract.mjs'
  );
});

// ── 4 · Gate fail-closed (cara hostil-omite) ─────────────────────────────

test('gate fail-closed: sin versión, sin sello o con tabla inválida el contrato no carga', () => {
  const viva = declaracionViva();
  // Campo AUSENTE de verdad (no `undefined` puesto a mano): la cara
  // hostil-omite exige que el default de lo que no viene sea denegar.
  const sinCampo = (obj, campo) =>
    Object.fromEntries(Object.entries(obj).filter(([k]) => k !== campo));
  const sinVersion = sinCampo(viva, 'version');
  const sinSello = sinCampo(viva, 'seal');
  assert.equal('version' in sinVersion, false);
  assert.equal('seal' in sinSello, false);

  assert.throws(() => assertRelayContract(null), /no hay declaración de contrato/);
  assert.throws(() => assertRelayContract(sinVersion), /versión no declarada o malformada/);
  assert.throws(() => assertRelayContract({ ...viva, version: undefined }), /versión no declarada/);
  assert.throws(() => assertRelayContract({ ...viva, version: '' }), /versión no declarada/);
  assert.throws(() => assertRelayContract({ ...viva, version: 'v1' }), /versión no declarada/);
  assert.throws(() => assertRelayContract({ ...viva, version: 1 }), /versión no declarada/);

  assert.throws(() => assertRelayContract(sinSello), /sello no declarado o malformado/);
  assert.throws(() => assertRelayContract({ ...viva, seal: 'no-es-un-sha256' }), /sello no declarado/);
  assert.throws(() => assertRelayContract({ ...viva, seal: SELLO_ANCLADO.toUpperCase() }), /sello no declarado/);

  assert.throws(() => assertRelayContract({ ...viva, downstream: [] }), /'downstream' está vacía/);
  assert.throws(() => assertRelayContract({ ...viva, upstream: [] }), /'upstream' está vacía/);
  assert.throws(() => assertRelayContract({ ...viva, downstream: 'track' }), /tabla iterable/);
  assert.throws(() => assertRelayContract({ ...viva, upstream: undefined }), /tabla iterable/);
  assert.throws(
    () => assertRelayContract({ ...viva, downstream: [...viva.downstream, viva.downstream[0]] }),
    /nombres duplicados/
  );
  assert.throws(
    () => assertRelayContract({ ...viva, downstream: [...viva.downstream.slice(1), 42] }),
    /no es cadena no vacía/
  );
  assert.throws(
    () => assertRelayContract({ ...viva, upstream: [...viva.upstream.slice(1), '  '] }),
    /no es cadena no vacía/
  );
});

// ── 5 · Inmutable en caliente ────────────────────────────────────────────

test('la allowlist no se amplía en caliente: add/delete/clear denegados', () => {
  assert.throws(() => RELAY_DOWNSTREAM_TOP.add('evento:colado'), /inmutable en runtime/);
  assert.equal(RELAY_DOWNSTREAM_TOP.has('evento:colado'), false, 'el add denegado no debe entrar');
  assert.throws(() => RELAY_DOWNSTREAM_TOP.delete([...RELAY_DOWNSTREAM_TOP][0]), /inmutable en runtime/);
  assert.throws(() => RELAY_DOWNSTREAM_TOP.clear(), /inmutable en runtime/);
  assert.equal(RELAY_DOWNSTREAM_TOP.size, CUENTA_BAJADA);

  assert.throws(() => RELAY_UPSTREAM.push('EVENTO_COLADO'), TypeError);
  assert.equal(RELAY_UPSTREAM.length, CUENTA_SUBIDA);

  // El descriptor es copia: mutarlo no toca el contrato.
  const copia = relayContractDescriptor();
  copia.downstream.push('evento:colado');
  copia.upstream.push('EVENTO_COLADO');
  assert.equal(RELAY_DOWNSTREAM_TOP.size, CUENTA_BAJADA);
  assert.equal(RELAY_UPSTREAM.length, CUENTA_SUBIDA);
  assert.equal(RELAY_DOWNSTREAM_TOP.has('evento:colado'), false);
});

// ── 6 · Cierre e2e: lo AUSENTE del contrato no pasa el relay ─────────────

test('cierre del relay contra puente real: pasa exactamente el contrato y nada más', async () => {
  resetRelayDiscardLedger();

  const enContrato = new Set([...RELAY_CONTRACT.upstream, ...RELAY_CONTRACT.downstream]);
  const intrusos = [
    ...literalesDeFuente(['../src/relay.mjs', '../src/config.mjs', '../src/relay-contract.mjs']),
    'EVENTO_INTRUSO_U194',
    'deck:colado',
    'SET_STATE_',
    'set_state',
    'TRACK',
    'ledger:extra'
  ].filter((ev) => !enContrato.has(ev));

  // Si el corpus se queda vacío o pierde los literales del relay, la sonda
  // no está sondeando: eso también es rojo.
  assert.ok(intrusos.length >= 10, `corpus de sondas demasiado pequeño (${intrusos.length})`);
  assert.ok(intrusos.includes('MAKE_MASTER'), 'el corpus no leyó los literales de src/relay.mjs');

  /** @type {Array<{ event: string, data: unknown }>} */
  const vistosArriba = [];
  /** @type {Array<{ event: string, data: unknown }>} */
  const vistosAbajo = [];

  const arriba = await createScriptoriumServer({ port: 0, host: '127.0.0.1', bridge: 'local' });
  const nsArriba = arriba.socketServer.io.of(`/${NAMESPACE}`);
  nsArriba.on('connection', (socket) => {
    socket.onAny((event, data) => vistosArriba.push({ event, data }));
  });

  process.env.ZEUS_SCRIPTORIUM_BRIDGE_URL = arriba.url;
  let abajo;
  let observador;
  try {
    abajo = await createScriptoriumServer({ port: 0, host: '127.0.0.1', bridge: 'remote' });
    await waitFor(() => abajo.bridgeClient?.io?.connected, 8000, 'puente conectado');

    observador = new SocketClient('observador-u194', abajo.url, `/${NAMESPACE}`, {
      auth: { token: 'test', room: 'PUBLIC_ROOM', user: 'observador-u194' }
    });
    observador.io.onAny((event, data) => vistosAbajo.push({ event, data }));
    await waitFor(() => observador.io.connected, 8000, 'observador conectado');

    // ── BAJADA ────────────────────────────────────────────────────────────
    // Primero los intrusos; después los del contrato. socket.io conserva el
    // orden sobre la misma conexión: si llegan los últimos, los intrusos ya
    // fueron procesados y su ausencia abajo es concluyente.
    for (const ev of intrusos) nsArriba.emit(ev, { sonda: 'u194', ev });
    for (const ev of RELAY_CONTRACT.downstream) nsArriba.emit(ev, { contrato: ev });

    await waitFor(
      () =>
        [...RELAY_CONTRACT.downstream].every((ev) =>
          vistosAbajo.some((v) => v.event === ev && v.data?.contrato === ev)
        ),
      8000,
      'los eventos del contrato llegan abajo (control positivo)'
    );

    const coladosAbajo = intrusos.filter((ev) => vistosAbajo.some((v) => v.event === ev));
    assert.deepEqual(
      coladosAbajo,
      [],
      'eventos AUSENTES del contrato cruzaron hacia abajo: la guarda de allowlist no está cerrando'
    );

    // Y cada corte dejó rastro con motivo (herencia de U192, aquí exigida
    // para todo el corpus, no solo para un intruso de muestra).
    let ledger = relayDiscardLedger();
    const sinRastro = intrusos.filter(
      (ev) =>
        !ledger.some(
          (e) =>
            e.event === ev && e.direction === 'downstream' && e.reason === 'fuera-de-allowlist-de-bajada'
        )
    );
    assert.deepEqual(sinRastro, [], 'hubo cortes de bajada sin registro de descarte');

    const contratoComoDescarte = [...RELAY_CONTRACT.downstream].filter((ev) =>
      ledger.some((e) => e.event === ev && e.direction === 'downstream')
    );
    assert.deepEqual(contratoComoDescarte, [], 'un evento del contrato figura como descartado');

    // ── SUBIDA ────────────────────────────────────────────────────────────
    for (const ev of intrusos) observador.io.emit(ev, { sonda: 'u194-subida', ev });
    for (const ev of RELAY_CONTRACT.upstream) observador.io.emit(ev, { contratoSubida: ev });

    await waitFor(
      () =>
        [...RELAY_CONTRACT.upstream].every((ev) =>
          vistosArriba.some((v) => v.event === ev && v.data?.contratoSubida === ev)
        ),
      8000,
      'los eventos de subida del contrato cruzan el puente (control positivo)'
    );

    const coladosArriba = intrusos.filter((ev) => vistosArriba.some((v) => v.event === ev));
    assert.deepEqual(
      coladosArriba,
      [],
      'eventos AUSENTES del contrato cruzaron hacia arriba: el bucle de subida no está cerrando'
    );

    ledger = relayDiscardLedger();
    const sinRastroArriba = intrusos.filter(
      (ev) =>
        !ledger.some(
          (e) =>
            e.event === ev &&
            e.direction === 'upstream' &&
            e.reason === 'fuera-del-conjunto-de-subida'
        )
    );
    assert.deepEqual(sinRastroArriba, [], 'hubo cortes de subida sin registro de descarte');
  } finally {
    delete process.env.ZEUS_SCRIPTORIUM_BRIDGE_URL;
    observador?.io?.disconnect();
    observador?.io?.close();
    if (abajo) await abajo.close();
    await arriba.close();
  }
});

/**
 * WP-U187 · Peercard en vivo — e2e de CLIENT_REGISTER en 2 modalidades.
 * Servidor socket-server REAL en proceso (puerto efímero) + cliente
 * @zeus/rooms (dep declarada de este paquete).
 *
 * Contrato OBSERVADO (evidencia, no prescripción):
 * - La card VIAJA en el mensaje: el cliente rooms adjunta `peerCard`
 *   SOLO si se aporta (packages/engine/rooms/src/index.mjs:70-72) —
 *   modalidad opt-in. Sin card no hay clave `peerCard` en el payload
 *   (ausencia real, no null).
 * - El socket-server NO toca peercard en su src (hallazgo U179,
 *   re-verificado hoy: `grep -rn "peerCard" packages/mesh/socket-server/src`
 *   = 0 hits). El registro lo maneja socket-core
 *   (packages/engine/socket-core/src/server.mjs:254-262,
 *   `onClientRegister`): copia el payload TAL CUAL a `this.sockets`
 *   (map por socket.id), deriva `name` = usuario+sesion, y nada más:
 *   NO valida la card, NO la verifica, NO la loguea, NO responde ack.
 *   La VERIFICACIÓN de peercard vive en los consumidores del protocolo
 *   (torno packages/engine/webrtc-signaling/src/peer-card-gate.mjs,
 *   packages/engine/reparto-kit/src/permisos.mjs), no en este server.
 *   Endurecer este plano es obra de U188/U193 — aquí solo evidencia.
 * - Transporte sin card = sesión anónima (frontera U186): este server
 *   no exige credencial para conectar (SocketServer sin authValidator).
 *
 * LOG LITERAL: el servidor es SILENCIOSO en el registro (cero console.*
 * en socket-core/src/server.mjs). El log literal exigido por el CA lo
 * produce este e2e desde la observación server-side del evento — línea
 * `[U187][…] CLIENT_REGISTER en servidor ← <payload JSON>`.
 *
 * ID REPRODUCIBLE (definición honesta): id de sesión = campo `sesion`
 * del CLIENT_REGISTER, generado por el cliente rooms como
 * `${user}-${Date.now()}` (packages/engine/rooms/src/index.mjs:66).
 * Reproducible = mismo formato y misma semilla (usuario + reloj epoch
 * ms) en cada re-ejecución: `/^<usuario>-\d+$/`, prefijo estable,
 * sufijo monótono. NO es un uuid opaco; NO se promete el mismo valor.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient, connectAndJoin } from '@zeus/rooms';
import { createScriptoriumServer } from '../src/index.mjs';
import { NAMESPACE } from '../src/config.mjs';

/** Espera activa con tope; falla con etiqueta (patrón U192). */
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

/**
 * Espejo LOCAL de la forma mínima de la peer-card
 * (packages/engine/protocol/src/peer-card.mjs:4-6:
 * `{ roomId, endpoint, token, scopes, expiresAt }`).
 * Se espeja en vez de importar `@zeus/protocol` porque protocol NO es
 * dependencia declarada de @zeus/socket-server y el package.json está
 * congelado en este WP (regla de ola: solo su owner lo toca).
 */
function tieneFormaMinimaDeCard(card) {
  return (
    !!card &&
    typeof card === 'object' &&
    !Array.isArray(card) &&
    typeof card.roomId === 'string' &&
    typeof card.endpoint === 'string' &&
    typeof card.token === 'string' &&
    Array.isArray(card.scopes) &&
    card.scopes.length > 0 &&
    typeof card.expiresAt === 'string'
  );
}

/** Card válida por construcción según la forma mínima del contrato. */
function cardValidaU187(sessionId) {
  return {
    roomId: 'PUBLIC_ROOM',
    endpoint: `socket-server/${NAMESPACE}`,
    token: 'token-u187',
    scopes: ['role:player', 'presence:join'],
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    issuedAt: new Date().toISOString(),
    displayName: 'peercard-vivo-u187',
    sessionId
  };
}

/** Log literal de evidencia: se imprime Y se conserva para asserts. */
function crearBitacora() {
  const lineas = [];
  return {
    lineas,
    log(linea) {
      lineas.push(linea);
      console.log(linea);
    }
  };
}

/**
 * Levanta el server real y captura, server-side, cada CLIENT_REGISTER
 * crudo tal como llega al namespace (observador pasivo: no altera el
 * handler propio de socket-core, que corre en paralelo).
 */
async function levantarServerConObservador() {
  const server = await createScriptoriumServer({
    port: 0,
    host: '127.0.0.1',
    bridge: 'local'
  });
  /** @type {Array<{ socketId: string, data: any }>} */
  const registros = [];
  const ns = server.socketServer.io.of(`/${NAMESPACE}`);
  ns.on('connection', (socket) => {
    socket.on('CLIENT_REGISTER', (data) => {
      registros.push({ socketId: socket.id, data });
    });
  });
  return { server, registros };
}

async function conectar(server, user, opciones = {}) {
  const client = createClient(user, { url: server.url });
  /** @type {any[]} */
  const authErrors = [];
  client.io.on('auth_error', (p) => authErrors.push(p));
  const resultado = await connectAndJoin(client, user, {
    room: 'PUBLIC_ROOM',
    ...opciones
  });
  return { client, resultado, authErrors };
}

test('modalidad A (anónima): CLIENT_REGISTER sin card — conectado, log literal, id reproducible', async () => {
  const bitacora = crearBitacora();
  const { server, registros } = await levantarServerConObservador();
  const clientes = [];
  try {
    // Re-ejecución interna: dos registros de la misma modalidad para
    // probar coherencia de ids dentro de un mismo run.
    for (const n of [1, 2]) {
      const { client, resultado, authErrors } = await conectar(server, 'anon-u187');
      clientes.push(client);
      await waitFor(() => registros.length >= n, 8000, `registro anónimo ${n} llega al servidor`);

      const reg = registros[n - 1];
      bitacora.log(
        `[U187][modalidad-A][registro-${n}] CLIENT_REGISTER en servidor ← ` +
          `${JSON.stringify(reg.data)} · peerCard=AUSENTE · id-sesion=${reg.data.sesion}`
      );

      // Conectado de verdad (transporte sin credencial: frontera U186).
      assert.ok(resultado.socketId, 'el cliente anónimo queda conectado');
      assert.equal(authErrors.length, 0, 'sin auth_error: el transporte no exige card');

      // Hostil-omite: la ausencia es ausencia real — ni clave ni null.
      assert.ok(!('peerCard' in reg.data), 'sin card aportada NO viaja clave peerCard');

      // Id reproducible: formato `<usuario>-<epochMs>` (rooms index.mjs:66).
      assert.match(reg.data.sesion, /^anon-u187-\d+$/, 'id de sesión con formato reproducible');
      assert.equal(reg.data.usuario, 'anon-u187');

      // Lo que el server RETIENE hoy: payload tal cual + name derivado
      // (socket-core server.mjs:254-262). Sesión anónima registrada.
      const retenido = server.socketServer.sockets.get(reg.socketId);
      assert.ok(retenido, 'el server retiene el registro en su map de sockets');
      assert.equal(retenido.name, `${reg.data.usuario}${reg.data.sesion}`);
      assert.ok(!('peerCard' in retenido), 'nada inyecta card donde no la hubo');
    }

    // Coherencia entre re-ejecuciones: mismo formato, misma semilla de
    // usuario, sufijo epoch monótono no decreciente.
    const [s1, s2] = registros.map((r) => r.data.sesion);
    const epoch = (s) => Number(s.slice('anon-u187-'.length));
    assert.ok(epoch(s2) >= epoch(s1), 'sufijo epoch monótono entre registros');
    bitacora.log(
      `[U187][modalidad-A] ids coherentes entre re-ejecuciones: ${s1} → ${s2} (formato ^anon-u187-\\d+$)`
    );
    assert.equal(bitacora.lineas.length, 3, 'log literal capturado para evidencia');
  } finally {
    for (const c of clientes) {
      c.io.disconnect();
      c.io.close();
    }
    await server.close();
  }
});

test('modalidad B (card opt-in): CLIENT_REGISTER con peercard válida — la card viaja intacta; el server la retiene sin verificar', async () => {
  const bitacora = crearBitacora();
  const { server, registros } = await levantarServerConObservador();
  let client;
  try {
    const card = cardValidaU187('sesion-b-u187');
    assert.ok(tieneFormaMinimaDeCard(card), 'la card enviada cumple la forma mínima del contrato');

    const conexion = await conectar(server, 'card-u187', { peerCard: card });
    client = conexion.client;
    await waitFor(() => registros.length >= 1, 8000, 'registro con card llega al servidor');

    const reg = registros[0];
    bitacora.log(
      `[U187][modalidad-B] CLIENT_REGISTER en servidor ← ` +
        `${JSON.stringify(reg.data)} · peerCard=PRESENTE · id-sesion=${reg.data.sesion}`
    );

    // La card VIAJA en el mensaje y llega INTACTA (payload server-side).
    assert.deepEqual(reg.data.peerCard, card, 'la peercard recibida es exactamente la enviada');
    assert.match(reg.data.sesion, /^card-u187-\d+$/, 'id de sesión con formato reproducible');
    assert.equal(conexion.authErrors.length, 0, 'sin auth_error');
    assert.ok(conexion.resultado.socketId, 'conectado');

    // HONESTIDAD — qué hace HOY el server con la card recibida: NADA.
    // La retiene tal cual en su map (socket-core server.mjs:261) sin
    // validar forma, frescura, firma ni scopes; no emite respuesta.
    // La verificación vive en los consumidores del protocolo
    // (peer-card-gate / permisos), no aquí. Endurecerlo = U188/U193.
    const retenido = server.socketServer.sockets.get(reg.socketId);
    assert.deepEqual(retenido.peerCard, card, 'retenida tal cual, sin verificación alguna');
    bitacora.log(
      `[U187][modalidad-B] server retiene card SIN verificar (socket-core onClientRegister): ` +
        `name=${retenido.name} · scopes=${JSON.stringify(retenido.peerCard.scopes)}`
    );
    assert.equal(bitacora.lineas.length, 2, 'log literal capturado para evidencia');
  } finally {
    client?.io.disconnect();
    client?.io.close();
    await server.close();
  }
});

test('caso rojo (contrarrevisión): card inválida/malformada en CLIENT_REGISTER — comportamiento de facto documentado, sin taparlo', async () => {
  const bitacora = crearBitacora();
  const { server, registros } = await levantarServerConObservador();
  const clientes = [];
  try {
    const invalidas = [
      { etiqueta: 'objeto-sin-forma', card: { basura: 'sin-forma-de-card' } },
      { etiqueta: 'no-objeto', card: 'texto-que-no-es-card' }
    ];

    for (const [i, { etiqueta, card }] of invalidas.entries()) {
      assert.equal(tieneFormaMinimaDeCard(card), false, `la card «${etiqueta}» es de verdad malformada`);
      const { client, resultado, authErrors } = await conectar(server, `rojo-u187-${etiqueta}`, {
        peerCard: card
      });
      clientes.push(client);
      await waitFor(() => registros.length >= i + 1, 8000, `registro rojo «${etiqueta}» llega al servidor`);

      const reg = registros[i];
      bitacora.log(
        `[U187][caso-rojo][${etiqueta}] CLIENT_REGISTER en servidor ← ${JSON.stringify(reg.data)}`
      );

      // COMPORTAMIENTO OBSERVADO DE FACTO (no deseable, NO se arregla
      // aquí — el plano único de card es U188 y la identidad del puente
      // U193): el server ACEPTA la card malformada, la retiene tal
      // cual, la sesión sigue conectada y no queda rastro ni rechazo.
      assert.deepEqual(reg.data.peerCard, card, 'de facto: la card malformada viaja y llega');
      assert.ok(resultado.socketId, 'de facto: la sesión queda conectada pese a la card malformada');
      assert.equal(authErrors.length, 0, 'de facto: ningún auth_error ni rechazo');
      const retenido = server.socketServer.sockets.get(reg.socketId);
      assert.deepEqual(
        retenido.peerCard,
        card,
        'de facto: retenida sin validar — el server no distingue válida de malformada'
      );
      bitacora.log(
        `[U187][caso-rojo][${etiqueta}] de facto: aceptada+retenida sin validar, sesión viva, ` +
          `cero rastro (endurecer = U188/U193, no este WP)`
      );
    }
    assert.equal(bitacora.lineas.length, 4, 'log literal del caso rojo capturado');
  } finally {
    for (const c of clientes) {
      c.io.disconnect();
      c.io.close();
    }
    await server.close();
  }
});

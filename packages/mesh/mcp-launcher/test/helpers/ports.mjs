/**
 * WP-U267 — reserva de puertos efímeros para los tests de arranque del launcher.
 *
 * El intermitente histórico de esta suite (`intentional-stops-read.test.mjs`,
 * diagnosticado en U181) no era una carrera de lógica: eran PUERTOS FIJOS.
 * 19121/19122 estaban escritos a mano en dos ficheros distintos de este mismo
 * paquete, y 13050/14121/14122 chocaban con `e2e/` y con `linea-system`. Basta
 * que alguien —un TIME_WAIT tras el trasiego de puertos, un hijo de fixture
 * filtrado, otro job de CI en paralelo— tenga el puerto para que el `launch`
 * muera con `Health check failed after launch … "ok":false,"error":"timeout"`.
 *
 * La cura es la que ya aplican los paquetes hermanos: `port: 0` +
 * `server.address().port`. Se aplica en dos formas según quién ata:
 *
 *  1. Servidor EN PROCESO (`createServer({ port: 0 })` del launcher): no hace
 *     falta nada de aquí. `createMcpHttpStart` de presets-sdk ya resuelve
 *     `httpServer.address().port` y lo devuelve en `handle.port`. Cero carrera.
 *
 *  2. Fixture SPAWNEADA (dual-peer, ipv6-peer): el padre necesita el puerto
 *     ANTES del spawn, porque `ProcessManager` construye `healthUrl` desde el
 *     catálogo antes de arrancar al hijo. Para eso está `reservePorts`: hace el
 *     mismo `listen(0)` + `address().port`, y suelta el socket para cedérselo
 *     al hijo. Soltarlo no reintroduce la enfermedad: un socket a la escucha
 *     que nunca aceptó una conexión NO pasa por TIME_WAIT — TIME_WAIT es de
 *     conexiones establecidas, no de listeners.
 *
 * Lo que esto NO promete: no es una reserva atómica. Queda una ventana de
 * milisegundos entre soltar y que el hijo ate. Lo que se elimina es la colisión
 * DETERMINISTA (dos tests con el mismo literal, un residuo en un puerto
 * conocido); lo que queda es una carrera genuinamente rara contra el rango
 * efímero del SO, que es exactamente el trato que aceptan los hermanos.
 */

import net from 'node:net';

/**
 * Reserva `n` puertos efímeros DISTINTOS y los libera.
 *
 * Los ata todos a la vez antes de soltar ninguno: así el SO está obligado a dar
 * `n` números distintos. Pedirlos de uno en uno podría devolver el mismo dos
 * veces y volveríamos a tener tronco y satélite peleándose por un puerto.
 *
 * @param {number} n
 * @param {string} [host]
 * @returns {Promise<number[]>}
 */
export function reservePorts(n, host = '127.0.0.1') {
  if (!Number.isInteger(n) || n < 0) {
    return Promise.reject(new TypeError(`reservePorts: n inválido (${n})`));
  }
  if (n === 0) return Promise.resolve([]);

  return new Promise((resolve, reject) => {
    /** @type {import('node:net').Server[]} */
    const servers = [];
    let settled = false;

    const closeAll = () =>
      Promise.all(servers.map((s) => new Promise((r) => s.close(() => r(undefined)))));

    const fail = (err) => {
      if (settled) return;
      settled = true;
      closeAll().then(() => reject(err));
    };

    let pending = n;
    for (let i = 0; i < n; i++) {
      const srv = net.createServer();
      servers.push(srv);
      srv.once('error', fail);
      srv.listen(0, host, () => {
        if (--pending > 0 || settled) return;
        const ports = servers.map((s) => {
          const addr = s.address();
          return addr && typeof addr === 'object' ? addr.port : 0;
        });
        if (ports.some((p) => !p)) {
          fail(new Error('reservePorts: address() no devolvió puerto'));
          return;
        }
        settled = true;
        closeAll().then(() => resolve(ports));
      });
    }
  });
}

/**
 * Un solo puerto efímero, ya liberado.
 * @param {string} [host]
 * @returns {Promise<number>}
 */
export async function reservePort(host = '127.0.0.1') {
  const [port] = await reservePorts(1, host);
  return port;
}

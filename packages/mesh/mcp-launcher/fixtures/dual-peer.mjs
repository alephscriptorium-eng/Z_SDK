/**
 * Dual-port peer — one process, two /mcp/health endpoints (linea-system shape).
 * Usage: node fixtures/dual-peer.mjs <portA> <portB>
 */

import http from 'node:http';

// WP-U267: los defaults eran `19111` / `19112`. Nadie los usaba —los tests
// siempre pasan puerto— pero eran el sitio exacto donde una invocación sin
// argumentos vuelve a atar un puerto fijo en silencio. Ahora falta el puerto y
// se grita, que es lo contrario de un intermitente.
const portA = requirePort(process.argv[2], 'portA');
const portB = requirePort(process.argv[3], 'portB');

function requirePort(raw, label) {
  const n = Number(raw);
  if (!raw || !Number.isInteger(n) || n < 1 || n > 65535) {
    console.error(
      `[dual-peer] falta ${label}: usa \`node fixtures/dual-peer.mjs <portA> <portB>\` ` +
        'con puertos efímeros (test/helpers/ports.mjs reservePorts). Sin defaults fijos.'
    );
    process.exit(2);
  }
  return n;
}

function makeServer(port, name) {
  const server = http.createServer((req, res) => {
    if (req.url === '/mcp/health' || req.url?.startsWith('/mcp/health')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', server: name, port }));
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });
  server.listen(port, '127.0.0.1');
  return server;
}

const a = makeServer(portA, 'fixture-tronco');
const b = makeServer(portB, 'fixture-satelite');
console.log(`[dual-peer] ${portA}+${portB}`);

function shutdown() {
  a.close();
  b.close();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

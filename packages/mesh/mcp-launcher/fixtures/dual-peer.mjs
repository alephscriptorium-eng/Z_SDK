/**
 * Dual-port peer — one process, two /mcp/health endpoints (linea-system shape).
 * Usage: node fixtures/dual-peer.mjs <portA> <portB>
 */

import http from 'node:http';

const portA = Number(process.argv[2] || 19111);
const portB = Number(process.argv[3] || 19112);

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

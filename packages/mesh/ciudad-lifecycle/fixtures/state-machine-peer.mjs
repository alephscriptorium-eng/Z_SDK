/**
 * Minimal HTTP peer for StateMachine barrio e2e (one maquinaria).
 * Usage: node fixtures/state-machine-peer.mjs <port>
 */

import http from 'node:http';

const port = Number(process.argv[2] || 13004);
const name = process.argv[3] || 'state-machine-server';

const server = http.createServer((req, res) => {
  if (req.url === '/mcp/health' || req.url?.startsWith('/mcp/health')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: name, port }));
    return;
  }
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[${name}] ${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

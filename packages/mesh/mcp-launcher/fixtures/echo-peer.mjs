/**
 * Minimal HTTP peer with /mcp/health for ProcessManager tests.
 * Usage: node fixtures/echo-peer.mjs <port>
 */

import http from 'node:http';

// WP-U267: el default era `19050`. Esta fixture no la usa hoy ningún test, pero
// el vicio es el mismo y el próximo que la adopte heredaría el puerto fijo.
const port = Number(process.argv[2]);
if (!process.argv[2] || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('[echo-peer] falta <port>: node fixtures/echo-peer.mjs <port> [name]. Sin default fijo.');
  process.exit(2);
}
const name = process.argv[3] || 'echo-peer';

const server = http.createServer((req, res) => {
  if (req.url === '/mcp/health' || req.url?.startsWith('/mcp/health')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: name, port }));
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[${name}] listening ${port}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

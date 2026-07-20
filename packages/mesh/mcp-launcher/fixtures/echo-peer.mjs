/**
 * Minimal HTTP peer with /mcp/health for ProcessManager tests.
 * Usage: node fixtures/echo-peer.mjs <port>
 */

import http from 'node:http';

const port = Number(process.argv[2] || 19050);
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

/**
 * IPv6-loopback peer (U234-B1) — one /mcp/health endpoint bound to `::1` ONLY.
 *
 * Why a NEW fixture instead of a flag on dual-peer.mjs: dual-peer binds
 * 127.0.0.1 and is the subject of the IPv4 e2e (test/orchestrator.test.mjs);
 * parameterising it would drag that test — and anything else that adopts it —
 * into a family it does not mean to exercise. This one exists to reproduce the
 * shape that `netstat -ano -p tcp` cannot see: socket-server, cache-browser and
 * firehose-browser all resolve host `localhost`, which under Node's default
 * `verbatim` DNS order binds `::1` first.
 *
 * Health answers over `http://localhost:<port>/mcp/health` (localhost → ::1)
 * and over `http://[::1]:<port>/...`, but NOT over 127.0.0.1 — which is the
 * field symptom: healthy over the catalog URL while invisible to the sweep.
 *
 * Usage: node fixtures/ipv6-peer.mjs <port>
 */

import http from 'node:http';

// WP-U267: el default era `19861`, cabeza del bloque fijo 19861-19866. Fuera:
// el puerto lo reserva quien spawnea (test/helpers/ports.mjs, familia '::1').
const port = Number(process.argv[2]);
if (!process.argv[2] || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('[ipv6-peer] falta <port>: node fixtures/ipv6-peer.mjs <port>. Sin default fijo.');
  process.exit(2);
}

const server = http.createServer((req, res) => {
  if (req.url === '/mcp/health' || req.url?.startsWith('/mcp/health')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'ipv6-peer', port, family: 'IPv6' }));
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

server.on('error', (err) => {
  // Loud, not silent: a host without IPv6 loopback must fail the test, not hang it.
  console.error(`[ipv6-peer] no pude atar [::1]:${port} — ${err.code || err.message}`);
  process.exit(1);
});

server.listen(port, '::1', () => {
  console.log(`[ipv6-peer] ${JSON.stringify(server.address())}`);
});

function shutdown() {
  server.close();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/**
 * In-process HTTP fixture for `/x/blobstore/v0` control plane (tests / CA).
 * Does not implement ssb-blobs gossip or product sidecar — control JSON only.
 */

import http from 'node:http';
import { assertSsbBlobCid } from './cid.mjs';
import { validateOutboundManifest } from './manifest.mjs';

/**
 * @typedef {{
 *   cid: string,
 *   manifest?: object,
 *   estado: 'ausente' | 'pendiente' | 'listo'
 * }} FixtureObjeto
 */

/**
 * @param {{ token?: string | null }} [opts]
 */
export function createFixtureBlobstore(opts = {}) {
  /** @type {Map<string, FixtureObjeto>} */
  const objetos = new Map();
  /** @type {Set<string>} */
  const deseos = new Set();
  const requiredToken =
    typeof opts.token === 'string' && opts.token.trim()
      ? opts.token.trim()
      : null;

  /**
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @param {number} status
   * @param {unknown} body
   */
  function send(req, res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    });
    res.end(payload);
  }

  /**
   * @param {http.IncomingMessage} req
   */
  function authed(req) {
    if (!requiredToken) return true;
    const h = req.headers.authorization || '';
    return h === `Bearer ${requiredToken}`;
  }

  /**
   * @param {http.IncomingMessage} req
   * @returns {Promise<unknown>}
   */
  function readJson(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (!raw) return resolve(null);
        try {
          resolve(JSON.parse(raw));
        } catch (err) {
          reject(err);
        }
      });
      req.on('error', reject);
    });
  }

  const server = http.createServer(async (req, res) => {
    try {
      if (!authed(req)) {
        return send(req, res, 401, { error: 'unauthorized' });
      }

      const url = new URL(req.url || '/', 'http://fixture.local');
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const method = req.method || 'GET';

      if (method === 'GET' && path === '/salud') {
        return send(req, res, 200, {
          status: 'ok',
          service: 'blobstore-fixture',
          plane: 'control'
        });
      }

      if (method === 'GET' && path === '/objetos') {
        return send(req, res, 200, {
          objetos: [...objetos.values()].map((o) => ({
            cid: o.cid,
            estado: o.estado
          }))
        });
      }

      if (method === 'POST' && path === '/objetos') {
        const body = await readJson(req);
        const v = validateOutboundManifest(body);
        if (!v.ok) return send(req, res, 400, { error: v.error });
        const cid = v.canonicalCid;
        objetos.set(cid, {
          cid,
          manifest: /** @type {object} */ (body),
          estado: 'listo'
        });
        return send(req, res, 201, { ok: true, cid, estado: 'listo' });
      }

      const objetoMatch = path.match(/^\/objetos\/(.+)$/);
      if (method === 'GET' && objetoMatch) {
        const cid = decodeURIComponent(objetoMatch[1]);
        const gate = assertSsbBlobCid(cid);
        if (!gate.ok) return send(req, res, 400, { error: gate.error });
        const hit = objetos.get(cid);
        if (!hit) return send(req, res, 404, { error: 'objeto ausente', cid });
        return send(req, res, 200, hit);
      }

      const estadoMatch = path.match(/^\/estado\/(.+)$/);
      if (method === 'GET' && estadoMatch) {
        const cid = decodeURIComponent(estadoMatch[1]);
        const gate = assertSsbBlobCid(cid);
        if (!gate.ok) return send(req, res, 400, { error: gate.error });
        const hit = objetos.get(cid);
        const estado = hit
          ? hit.estado
          : deseos.has(cid)
            ? 'pendiente'
            : 'ausente';
        return send(req, res, 200, { cid, estado });
      }

      if (method === 'GET' && path === '/deseos') {
        return send(req, res, 200, { deseos: [...deseos] });
      }

      if (method === 'POST' && path === '/deseos') {
        const body = /** @type {{ cid?: unknown }} */ (await readJson(req));
        const gate = assertSsbBlobCid(body?.cid);
        if (!gate.ok) return send(req, res, 400, { error: gate.error });
        deseos.add(gate.cid);
        if (!objetos.has(gate.cid)) {
          objetos.set(gate.cid, { cid: gate.cid, estado: 'pendiente' });
        }
        return send(req, res, 201, { ok: true, cid: gate.cid, estado: 'pendiente' });
      }

      return send(req, res, 404, { error: `unknown path ${path}` });
    } catch (err) {
      return send(req, res, 500, {
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  return {
    server,
    objetos,
    deseos,
    /**
     * @param {number} [port=0]
     * @returns {Promise<{ port: number, baseUrl: string }>}
     */
    listen(port = 0) {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => {
          const addr = server.address();
          if (!addr || typeof addr === 'string') {
            reject(new Error('fixture listen failed'));
            return;
          }
          const baseUrl = `http://127.0.0.1:${addr.port}`;
          resolve({ port: addr.port, baseUrl });
        });
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  };
}

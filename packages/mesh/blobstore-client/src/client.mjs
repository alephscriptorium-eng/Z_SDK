/**
 * HTTP control-plane client for Oasis `/x/blobstore/v0/*` (D-21 cara ciega).
 * Data plane remains gossip `ssb-blobs` — not implemented here (zero `blobs.*`).
 *
 * Base URL = `ZEUS_BLOB_SIDECAR_URL` (already includes `/x/blobstore/v0`).
 * Auth: nothing on LAN; optional Bearer via `ZEUS_BLOB_HTTP_TOKEN` / opts.token.
 */

import { encodeCidPath, assertSsbBlobCid } from './cid.mjs';
import { validateOutboundManifest } from './manifest.mjs';

export const BLOBSTORE_CONTROL_PATHS = Object.freeze({
  salud: 'salud',
  objetos: 'objetos',
  estado: 'estado',
  deseos: 'deseos'
});

/**
 * @param {string} baseUrl
 */
export function normalizeBlobstoreBaseUrl(baseUrl) {
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) {
    throw new TypeError('blobstore baseUrl required (ZEUS_BLOB_SIDECAR_URL)');
  }
  return baseUrl.trim().replace(/\/+$/, '');
}

/**
 * @param {{
 *   baseUrl: string,
 *   token?: string | null,
 *   fetchImpl?: typeof fetch
 * }} opts
 */
export function createBlobstoreClient(opts) {
  const baseUrl = normalizeBlobstoreBaseUrl(opts.baseUrl);
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('fetchImpl required (Node 18+ global fetch)');
  }
  const token =
    typeof opts.token === 'string' && opts.token.trim()
      ? opts.token.trim()
      : null;

  /**
   * @param {string} method
   * @param {string} path
   * @param {unknown} [body]
   */
  async function request(method, path, body) {
    /** @type {Record<string, string>} */
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    /** @type {RequestInit} */
    const init = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    const url = `${baseUrl}/${path.replace(/^\/+/, '')}`;
    const res = await fetchImpl(url, init);
    const text = await res.text();
    let json = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
    }
    if (!res.ok) {
      const errMsg =
        json && typeof json === 'object' && 'error' in json
          ? String(/** @type {{ error: unknown }} */ (json).error)
          : `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: errMsg, body: json };
    }
    return { ok: true, status: res.status, body: json };
  }

  return {
    baseUrl,
    /**
     * GET /salud
     */
    async salud() {
      return request('GET', BLOBSTORE_CONTROL_PATHS.salud);
    },

    /**
     * GET /objetos
     */
    async listObjetos() {
      return request('GET', BLOBSTORE_CONTROL_PATHS.objetos);
    },

    /**
     * GET /objetos/:cid
     * @param {string} cid
     */
    async getObjeto(cid) {
      const gate = assertSsbBlobCid(cid);
      if (!gate.ok) return { ok: false, status: 0, error: gate.error, body: null };
      return request(
        'GET',
        `${BLOBSTORE_CONTROL_PATHS.objetos}/${encodeCidPath(cid)}`
      );
    },

    /**
     * POST /objetos — announce / register a manifest (control only).
     * @param {object} manifest
     */
    async putObjeto(manifest) {
      const v = validateOutboundManifest(manifest);
      if (!v.ok) return { ok: false, status: 0, error: v.error, body: null };
      return request('POST', BLOBSTORE_CONTROL_PATHS.objetos, {
        ...manifest,
        canonicalCid: v.canonicalCid
      });
    },

    /**
     * GET /estado/:cid — poll completion (veredicto ①: no webhook in v0).
     * @param {string} cid
     */
    async estado(cid) {
      const gate = assertSsbBlobCid(cid);
      if (!gate.ok) return { ok: false, status: 0, error: gate.error, body: null };
      return request(
        'GET',
        `${BLOBSTORE_CONTROL_PATHS.estado}/${encodeCidPath(cid)}`
      );
    },

    /**
     * GET /deseos
     */
    async listDeseos() {
      return request('GET', BLOBSTORE_CONTROL_PATHS.deseos);
    },

    /**
     * POST /deseos — register a want (control); gossip fills bytes off-band.
     * @param {string} cid
     */
    async want(cid) {
      const gate = assertSsbBlobCid(cid);
      if (!gate.ok) return { ok: false, status: 0, error: gate.error, body: null };
      return request('POST', BLOBSTORE_CONTROL_PATHS.deseos, { cid });
    }
  };
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function blobstoreClientFromEnv(env = process.env) {
  const baseUrl = env.ZEUS_BLOB_SIDECAR_URL;
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) {
    return null;
  }
  const token = env.ZEUS_BLOB_HTTP_TOKEN ?? null;
  return createBlobstoreClient({ baseUrl, token });
}

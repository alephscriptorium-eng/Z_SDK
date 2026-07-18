/**
 * Live ops probe for WP-U101 outbound blobstore.
 *
 * Env:
 *   ZEUS_BLOB_SIDECAR_URL — base of `/x/blobstore/v0` namespace
 *   ZEUS_BLOB_SYNC_NODE_A — cliente Oasis local
 *   ZEUS_BLOB_SYNC_NODE_B — pub VPS 0.8.8
 *   ZEUS_BLOB_HTTP_TOKEN  — optional Bearer (LAN may omit)
 *
 * Unset ⇒ ⏳ honest (no network). When set ⇒ GET `{base}/salud`.
 */

import { createBlobstoreClient } from './client.mjs';

export const LIVE_ENV_KEYS = Object.freeze([
  'ZEUS_BLOB_SIDECAR_URL',
  'ZEUS_BLOB_SYNC_NODE_A',
  'ZEUS_BLOB_SYNC_NODE_B'
]);

/**
 * @param {NodeJS.ProcessEnv} [env=process.env]
 */
export function readLiveBlobstoreEnv(env = process.env) {
  /** @type {Record<string, string | null>} */
  const values = {};
  for (const key of LIVE_ENV_KEYS) {
    const raw = env[key];
    values[key] =
      typeof raw === 'string' && raw.trim() ? raw.trim() : null;
  }
  const tokenRaw = env.ZEUS_BLOB_HTTP_TOKEN;
  values.ZEUS_BLOB_HTTP_TOKEN =
    typeof tokenRaw === 'string' && tokenRaw.trim() ? tokenRaw.trim() : null;
  return values;
}

/**
 * Env-only probe (no dial). Same shape as U100 for unset → ⏳.
 * @param {NodeJS.ProcessEnv} [env=process.env]
 */
export function probeLiveBlobstoreEnv(env = process.env) {
  const values = readLiveBlobstoreEnv(env);
  const missing = LIVE_ENV_KEYS.filter((k) => !values[k]);
  if (missing.length > 0) {
    return {
      status: 'pending',
      evidence: '⏳',
      missing,
      env: values,
      note:
        'ZEUS_BLOB_* unset — live outbound ⏳ (ops: follows mutuos A↔B + sidecar). ' +
        'No se abre red. Fixture HTTP cubre el contrato offline.'
    };
  }
  return {
    status: 'ready',
    evidence: 'live-env',
    missing: [],
    env: values,
    note: 'Env completo — dial GET /salud para evidencia live.'
  };
}

/**
 * When env complete, dial control-plane `/salud`. Unset ⇒ ⏳ without dial.
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @param {{ fetchImpl?: typeof fetch }} [opts]
 */
export async function probeLiveBlobstore(env = process.env, opts = {}) {
  const base = probeLiveBlobstoreEnv(env);
  if (base.status !== 'ready') return base;

  const client = createBlobstoreClient({
    baseUrl: /** @type {string} */ (base.env.ZEUS_BLOB_SIDECAR_URL),
    token: base.env.ZEUS_BLOB_HTTP_TOKEN,
    fetchImpl: opts.fetchImpl
  });

  try {
    const salud = await client.salud();
    if (!salud.ok) {
      return {
        status: 'unreachable',
        evidence: '⏳',
        missing: [],
        env: base.env,
        salud,
        note: `Env set but /salud failed: ${salud.error}`
      };
    }
    return {
      status: 'live',
      evidence: 'live',
      missing: [],
      env: base.env,
      salud,
      note: 'Control plane /salud OK — datos siguen ssb-blobs (fuera monorepo).'
    };
  } catch (err) {
    return {
      status: 'unreachable',
      evidence: '⏳',
      missing: [],
      env: base.env,
      note: `Env set but dial failed: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

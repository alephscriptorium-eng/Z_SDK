/**
 * Live ops probe for Oasis 2-node blob-sync (WP-U100).
 *
 * Env (all optional until the pub team delivers the sidecar):
 *   ZEUS_BLOB_SIDECAR_URL — base URL of the blobs sidecar HTTP/API
 *   ZEUS_BLOB_SYNC_NODE_A — identity / endpoint hint for node A
 *   ZEUS_BLOB_SYNC_NODE_B — identity / endpoint hint for node B
 *
 * Unset / empty ⇒ honest ⏳ (no network dial attempted).
 */

const LIVE_ENV_KEYS = Object.freeze([
  'ZEUS_BLOB_SIDECAR_URL',
  'ZEUS_BLOB_SYNC_NODE_A',
  'ZEUS_BLOB_SYNC_NODE_B'
]);

/**
 * @param {NodeJS.ProcessEnv} [env=process.env]
 */
export function readLiveBlobSyncEnv(env = process.env) {
  /** @type {Record<string, string | null>} */
  const values = {};
  for (const key of LIVE_ENV_KEYS) {
    const raw = env[key];
    values[key] =
      typeof raw === 'string' && raw.trim() ? raw.trim() : null;
  }
  return values;
}

/**
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {{
 *   status: 'ready' | 'pending',
 *   evidence: 'live' | '⏳',
 *   missing: string[],
 *   env: Record<string, string | null>,
 *   note: string
 * }}
 */
export function probeLiveBlobSync(env = process.env) {
  const values = readLiveBlobSyncEnv(env);
  const missing = LIVE_ENV_KEYS.filter((k) => !values[k]);
  if (missing.length > 0) {
    return {
      status: 'pending',
      evidence: '⏳',
      missing,
      env: values,
      note:
        'Pub/cliente blob-sync no entregado en este entorno (D-21 fila 5 ops). ' +
        'No se abre red. Fixture harness cubre el contrato offline.'
    };
  }
  return {
    status: 'ready',
    evidence: 'live',
    missing: [],
    env: values,
    note:
      'Env completo — ejecutar sync contra sidecar del pub (fuera de este harness mínimo).'
  };
}

export { LIVE_ENV_KEYS };

/**
 * Health probe for Streamable HTTP MCP peers.
 */

/**
 * @param {string} healthUrl
 * @param {{ timeoutMs?: number }} [opts]
 */
export async function probeHealth(healthUrl, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 2_000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(healthUrl, { signal: ctrl.signal });
    const body = await res.json().catch(() => null);
    return {
      ok: res.ok,
      statusCode: res.status,
      body
    };
  } catch (err) {
    return {
      ok: false,
      error: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err)
    };
  } finally {
    clearTimeout(timer);
  }
}

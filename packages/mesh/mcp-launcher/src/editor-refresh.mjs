/**
 * Best-effort editor-ui discovery refresh after launch/stop.
 * Editor remains discovery-only; launcher is the process actuator.
 */

/**
 * @param {{
 *   editorBaseUrl?: string,
 *   timeoutMs?: number
 * }} [opts]
 */
export async function refreshEditorMcpCatalog(opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 3_000;
  let base = opts.editorBaseUrl;
  if (!base) {
    try {
      const env = await import('@zeus/presets-sdk/env');
      const ui = env.resolveZeusUiPorts();
      const host = env.resolveZeusHost();
      const port = ui.editor?.port;
      if (port == null) {
        return {
          ok: false,
          skipped: true,
          url: null,
          error: 'editor port unresolved (presets-sdk/env)'
        };
      }
      base = `http://${host}:${port}`;
    } catch (err) {
      return {
        ok: false,
        skipped: true,
        url: null,
        error: String(err?.message || err)
      };
    }
  }

  const url = `${base.replace(/\/$/, '')}/api/mcp/refresh`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'POST', signal: ctrl.signal });
    const body = await res.json().catch(() => null);
    return {
      ok: res.ok,
      statusCode: res.status,
      url,
      body
    };
  } catch (err) {
    return {
      ok: false,
      skipped: true,
      url,
      error: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err)
    };
  } finally {
    clearTimeout(timer);
  }
}

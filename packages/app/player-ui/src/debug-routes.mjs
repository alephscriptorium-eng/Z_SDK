/**
 * Player UI debug monitor proxy routes.
 */

import express from 'express';
import { resolvePlayerDebugEndpoint } from '@zeus/presets-sdk/env';

const DEBUG_FETCH_MS = 800;

export function getDebugMonitorBase(config) {
  if (config.debugMonitor?.enabled === false) return null;
  if (config.debugMonitor?.baseUrl) return config.debugMonitor.baseUrl;
  return resolvePlayerDebugEndpoint().baseUrl;
}

export async function fetchDebugMonitor(baseUrl, pathname) {
  const url = `${baseUrl.replace(/\/$/, '')}${pathname}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEBUG_FETCH_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return { available: false, status: res.status };
    return await res.json();
  } catch {
    return { available: false };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {{ config: object }} deps
 */
export function createDebugRoutes(deps) {
  const router = express.Router();
  const debugMonitorBase = getDebugMonitorBase(deps.config);

  router.get('/debug/health', async (_req, res) => {
    if (!debugMonitorBase) {
      return res.json({ available: false, reason: 'debugMonitor disabled' });
    }
    const data = await fetchDebugMonitor(debugMonitorBase, '/mcp/health');
    if (data.available === false) {
      return res.status(503).json(data);
    }
    res.json({ available: true, ...data });
  });

  router.get('/debug/snapshot', async (_req, res) => {
    if (!debugMonitorBase) {
      return res.json({ available: false, reason: 'debugMonitor disabled' });
    }
    const data = await fetchDebugMonitor(debugMonitorBase, '/snapshot');
    if (data.available === false) {
      return res.json(data);
    }
    res.json(data);
  });

  router.get('/debug/at', async (req, res) => {
    const pathParam = req.query.path || 'session';
    if (!debugMonitorBase) {
      return res.json({ available: false, reason: 'debugMonitor disabled' });
    }
    const encoded = encodeURIComponent(String(pathParam));
    const data = await fetchDebugMonitor(debugMonitorBase, `/snapshot/at?path=${encoded}`);
    if (data.available === false) {
      return res.json(data);
    }
    res.json(data);
  });

  return router;
}

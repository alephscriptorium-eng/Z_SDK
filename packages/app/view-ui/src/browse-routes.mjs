/**
 * View UI browse API routes (extracted from server.mjs).
 */

import express from 'express';
import { z } from 'zod';
import { validate } from '@zeus/http-contract/express';

/**
 * @param {object} deps
 * @param {string} deps.basePath
 * @param {number} deps.port
 * @param {() => object} deps.getConfig
 * @param {() => object} deps.getViewersConfig
 * @param {object} deps.mcp
 * @param {typeof import('../server.mjs').setFocus} deps.setFocus
 * @param {() => object} deps.buildFocusSnapshot
 * @param {Function} deps.listLineas
 * @param {Function} deps.browseDirectory
 * @param {Function} deps.readLineFile
 * @param {Function} deps.getCacheStats
 * @param {Function} deps.buildAnchorsGrid
 * @param {Function} deps.resolveWikitextPath
 */
export function createBrowseRoutes(deps) {
  const router = express.Router();

  router.get('/lineas', async (_req, res) => {
    const result = await deps.listLineas(deps.basePath);
    if (result.error) {
      res.status(404).json({ ...result, success: false });
      return;
    }
    res.json(result);
  });

  router.get(
    '/browse',
    validate({
      query: z.object({
        linea: z.string().min(1),
        path: z.string().optional(),
        offset: z.coerce.number().optional(),
        limit: z.coerce.number().optional()
      })
    }, { routeId: 'browse' }),
    async (req, res) => {
      const result = await deps.browseDirectory(deps.basePath, String(req.query.linea), req.query.path || '', {
        offset: req.query.offset,
        limit: req.query.limit,
        handlers: deps.getViewersConfig().handlers
      });
      if (result.error) {
        res.status(result.error.includes('unknown') ? 404 : 400).json({ ...result, success: false });
        return;
      }
      res.json(result);
    }
  );

  router.get(
    '/file',
    validate({
      query: z.object({
        linea: z.string().min(1),
        path: z.string().min(1)
      })
    }, { routeId: 'file' }),
    async (req, res) => {
      const result = await deps.readLineFile(deps.basePath, String(req.query.linea), String(req.query.path), {
        handlers: deps.getViewersConfig().handlers
      });
      if (result.error) {
        res.status(400).json({ ...result, success: false });
        return;
      }
      deps.setFocus({
        linea: result.linea,
        path: result.path,
        viewer: result.viewer,
        name: result.name,
        summary: `${result.kind} · ${result.size} bytes`
      });
      res.json(result);
    }
  );

  router.get('/stats', async (req, res) => {
    const lineaId = req.query.linea || deps.getConfig().defaultLinea || 'espana';
    const cfg = deps.getConfig();
    const lineaServers = cfg.lineaServers?.[lineaId];

    let mcpStats = null;
    if (lineaServers?.satelite) {
      const mcpResult = await deps.mcp.fetchCacheStats(lineaServers);
      if (!mcpResult.error) {
        mcpStats = mcpResult.data;
      }
    }

    const fsResult = await deps.getCacheStats(deps.basePath, String(lineaId));
    if (fsResult.error && !mcpStats) {
      res.status(404).json({ ...fsResult, success: false });
      return;
    }

    res.json({
      linea: lineaId,
      source: mcpStats ? 'mcp+filesystem' : 'filesystem',
      stats: mcpStats || fsResult.stats,
      filesystem: fsResult.stats || null,
      mcp: mcpStats
    });
  });

  router.get('/anchors', async (req, res) => {
    const lineaId = req.query.linea || deps.getConfig().defaultLinea || 'espana';
    const result = await deps.buildAnchorsGrid(deps.basePath, String(lineaId));
    if (result.error) {
      res.status(404).json({ ...result, success: false });
      return;
    }
    res.json(result);
  });

  router.get('/focus', (_req, res) => {
    res.json(deps.buildFocusSnapshot());
  });

  router.get('/view/info', async (_req, res) => {
    const lineas = await deps.listLineas(deps.basePath);
    res.json({
      service: 'view-ui',
      port: deps.port,
      basePath: deps.basePath,
      lineas: lineas.error ? [] : lineas.lineas.map((l) => l.id),
      focus: deps.buildFocusSnapshot()
    });
  });

  router.get(
    '/view/wikitext-path',
    validate({
      query: z.object({
        linea: z.string().min(1),
        oldid: z.coerce.number()
      })
    }, { routeId: 'view.wikitext-path' }),
    (req, res) => {
      const result = deps.resolveWikitextPath(deps.basePath, String(req.query.linea), req.query.oldid);
      if (result.error) {
        res.status(404).json({ ...result, success: false });
        return;
      }
      res.json(result);
    }
  );

  return router;
}

/**
 * Player UI ALEPH + presets + servers API routes.
 */

import express from 'express';
import { z } from 'zod';
import { validate } from '@zeus/http-contract/express';
import { resolveAppPort } from '@zeus/presets-sdk/env';
import { firehoseDeckContextFromSession } from '@zeus/session-protocol/projection';

/**
 * @param {object} deps — injected handlers from server.mjs
 */
export function createAlephRoutes(deps) {
  const router = express.Router();

  router.get('/presets', (_req, res) => {
    res.json(deps.store.getAll().map((p) => ({ id: p.id, name: p.name, description: p.description })));
  });

  router.get('/aleph/config', (_req, res) => {
    res.json(deps.getAlephConfig(deps.config));
  });

  router.get(
    '/aleph/view-links',
    validate({ query: z.object({ deckId: z.enum(['A', 'B', 'a', 'b']).optional() }) }, { routeId: 'aleph.view-links' }),
    (req, res) => {
      try {
        const deckId = String(req.query.deckId || 'B').toUpperCase();
        // Domain guard when ZEUS_VALIDATE=off skips http-contract middleware enforcement.
        if (deckId !== 'A' && deckId !== 'B') {
          res.status(400).json({ error: 'deckId must be A or B', success: false });
          return;
        }

        const snapshot = deps.actor.getSnapshot().context;
        const resolved = snapshot.decks[deckId]?.resolved;
        const lineaId = deps.alephConfig.defaultLinea || 'espana';
        const manifest = deps.loadManifestForLinea(lineaId, deps.alephConfig.paths);
        const satRel = deps.normalizeSatRel(manifest?.meta?.satelite_wp);
        const dataDir = deps.resolveDataDir(deps.config);
        const mesh = deps.resolveUiMesh({ dataDir, localConfig: deps.config, selfUiId: 'player' });
        const viewFromMesh = mesh.uis?.view;
        const viewEntry = {
          host: deps.config.view?.host || viewFromMesh?.host || 'localhost',
          port: deps.config.view?.port || viewFromMesh?.port || resolveAppPort('view', 3015),
          path: viewFromMesh?.path || '/'
        };

        if (!resolved) {
          res.json({ linea: lineaId, items: [], wikitext: null, byOldid: {} });
          return;
        }

        const payload = deps.buildViewLinksResponse({
          lineaId,
          satRel,
          viewEntry,
          deckId,
          resolved
        });
        res.json(payload);
      } catch (error) {
        res.status(500).json({ error: error.message, success: false });
      }
    }
  );

  router.get('/aleph/firehose-links', async (req, res) => {
    try {
      const dataDir = deps.resolveDataDir(deps.config);
      const mesh = deps.resolveUiMesh({ dataDir, localConfig: deps.config, selfUiId: 'player' });
      const firehoseEntry = mesh.uis?.firehose;
      if (!firehoseEntry) {
        res.status(503).json({ error: 'firehose UI mesh entry not configured', success: false });
        return;
      }

      let triage = null;
      try {
        const file = await deps.readVolumeFile('firehose', deps.TRIAGE_MANIFEST_PATH);
        triage = JSON.parse(file.content);
      } catch {
        triage = null;
      }

      const sessionSnap = deps.getSessionSnapshot?.() ?? null;
      const projected = sessionSnap ? firehoseDeckContextFromSession(sessionSnap) : {};

      const deckContext = {
        corpus: req.query.corpus ? String(req.query.corpus) : projected.corpus,
        path: req.query.path != null ? String(req.query.path) : projected.path,
        selectedFilePath: req.query.file ? String(req.query.file) : projected.selectedFilePath
      };

      const payload = await deps.buildFirehoseLinksResponse({
        firehoseEntry,
        triage,
        deckContext
      });
      res.json(payload);
    } catch (error) {
      res.status(500).json({ error: error.message, success: false });
    }
  });

  router.get('/aleph/lineas', (_req, res) => {
    const registry = deps.loadLineaRegistry();
    if (registry.error) {
      res.status(500).json({ ...registry, success: false });
      return;
    }
    res.json(registry);
  });

  router.get('/aleph/anchors', async (req, res) => {
    try {
      const lineaId = String(req.query.linea || deps.config.aleph?.defaultLinea || 'espana');
      const servers = deps.resolveLineaServers(deps.config, lineaId);
      let cacheStats = null;
      const sateliteName = servers?.satelite || 'linea-wp-historia';
      const extractor = deps.registry.extractors.get(sateliteName);
      if (extractor) {
        try {
          const statsRes = await extractor.readResource('linea://cache/stats');
          cacheStats = deps.parseResourceJson(statsRes);
        } catch {
          cacheStats = { error: `${sateliteName} unavailable` };
        }
      } else {
        cacheStats = { error: `${sateliteName} not registered` };
      }
      const cachedOldids = cacheStats?.cached_oldids || [];
      const grid = deps.buildAnchorGrid({ lineaId, cachedOldids });
      if (grid.error) {
        res.status(404).json({ ...grid, success: false });
        return;
      }
      res.json({ linea: grid.linea, cacheStats, grid: { cells: grid.cells, summary: grid.summary } });
    } catch (error) {
      res.status(500).json({ error: error.message, success: false });
    }
  });

  router.get('/aleph/medicion/:casoId', (req, res) => {
    const data = deps.loadMedicion(req.params.casoId, deps.config.aleph?.paths);
    if (data.error) {
      res.status(404).json({ ...data, success: false });
      return;
    }
    res.json(data);
  });

  router.get(
    '/aleph/registros/:year',
    validate({ params: z.object({ year: z.coerce.number() }) }, { routeId: 'aleph.registros' }),
    async (req, res) => {
      try {
        const year = Number(req.params.year);
        const lineaId = deps.config.aleph?.defaultLinea || 'espana';
        const servers = deps.resolveLineaServers(deps.config, lineaId);
        const sateliteName = servers?.satelite || 'linea-wp-historia';
        const extractor = deps.registry.extractors.get(sateliteName);
        if (!extractor) {
          res.status(503).json({ error: `${sateliteName} unavailable`, success: false });
          return;
        }
        const regRes = await extractor.readResource(`linea://registros/year/${year}`);
        res.json(deps.parseResourceJson(regRes));
      } catch (error) {
        res.status(500).json({ error: error.message, success: false });
      }
    }
  );

  router.get('/aleph/topology', async (_req, res) => {
    try {
      const cards = {};
      const serverNames = deps.resolveTopologyServerNames(deps.config);
      for (const [key, serverName] of Object.entries(serverNames)) {
        const extractor = deps.registry.extractors.get(serverName);
        if (extractor) {
          try {
            const cardRes = await extractor.readResource('server://card');
            cards[key] = deps.parseResourceJson(cardRes);
          } catch {
            cards[key] = { error: 'unavailable' };
          }
        }
      }
      res.json(deps.buildTopology(cards));
    } catch (error) {
      res.status(500).json({ error: error.message, success: false });
    }
  });

  router.get('/servers', async (_req, res) => {
    try {
      const servers = await deps.listServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: error.message, success: false });
    }
  });

  return router;
}

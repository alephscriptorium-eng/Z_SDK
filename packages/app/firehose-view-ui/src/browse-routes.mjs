/**
 * Firehose view UI browse API routes (extracted from server.mjs).
 */

import express from 'express';
import { z } from 'zod';
import { validate } from '@zeus/http-contract/express';

/**
 * @param {object} deps
 */
export function createBrowseRoutes(deps) {
  const router = express.Router();

  router.get('/corpora', (_req, res) => {
    res.json({ corpora: deps.listCorpora() });
  });

  router.get(
    '/browse',
    validate({
      query: z.object({
        corpus: z.string().min(1),
        path: z.string().optional(),
        offset: z.coerce.number().optional(),
        limit: z.coerce.number().optional()
      })
    }, { routeId: 'browse' }),
    async (req, res) => {
      try {
        const result = await deps.browseCorpus(String(req.query.corpus), req.query.path || '', {
          offset: req.query.offset,
          limit: req.query.limit
        });
        res.json(result);
      } catch (err) {
        res.status(400).json({ error: err.message, success: false });
      }
    }
  );

  router.get(
    '/file',
    validate({
      query: z.object({
        corpus: z.string().min(1),
        path: z.string().min(1)
      })
    }, { routeId: 'file' }),
    async (req, res) => {
      const result = await deps.readCorpusFile(String(req.query.corpus), String(req.query.path));
      if (result.error) {
        res.status(400).json({ ...result, success: false });
        return;
      }
      deps.setFocus({
        corpus: result.corpus,
        path: result.path,
        mode: 'raw',
        name: result.name,
        summary: `${result.kind} · ${result.size} bytes`
      });
      res.json(result);
    }
  );

  router.get(
    '/posts',
    validate({
      query: z.object({
        corpus: z.string().min(1),
        path: z.string().optional(),
        recursive: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional()
      })
    }, { routeId: 'posts' }),
    async (req, res) => {
      try {
        const result = await deps.listPosts(String(req.query.corpus), req.query.path || '', {
          recursive: req.query.recursive !== 'false',
          limit: req.query.limit,
          offset: req.query.offset
        });
        deps.setFocus({
          corpus: result.corpus,
          path: result.path,
          mode: 'preview',
          name: null,
          summary: `${result.posts.length} posts`
        });
        res.json(result);
      } catch (err) {
        res.status(400).json({ error: err.message, success: false });
      }
    }
  );

  router.get('/triage', async (_req, res) => {
    try {
      const manifest = await deps.loadTriageManifest();
      res.json({ manifest });
    } catch (err) {
      res.status(500).json({ error: err.message, success: false });
    }
  });

  router.get('/stats', (_req, res) => {
    try {
      const stats = deps.getFirehoseStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message, success: false });
    }
  });

  router.get('/focus', (_req, res) => {
    res.json(deps.buildFocusSnapshot());
  });

  router.get('/view/info', (_req, res) => {
    res.json({
      service: 'firehose-view-ui',
      port: deps.port,
      corpora: deps.listCorpora().map((c) => c.id),
      focus: deps.buildFocusSnapshot()
    });
  });

  return router;
}

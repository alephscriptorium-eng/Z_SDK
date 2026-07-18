/**
 * World-A API: draft + materials + release via U62 Notario.
 */

import express from 'express';
import { listMaterials, validateDraft } from './materials.mjs';
import { materializeStartPack } from './materialize-pack.mjs';
import { runNotarioRelease } from './notario.mjs';
import { resolveGamesLibraryRoot } from './resolve-library.mjs';

/**
 * @param {object} deps
 * @param {ReturnType<import('./draft-store.mjs').createDraftStore>} deps.draftStore
 * @param {import('@zeus/presets-sdk').PresetStore} [deps.store] cloaks = presets
 */
export function createWorldRoutes({ draftStore, store }) {
  const router = express.Router();

  router.get('/world/materials', (_req, res) => {
    const materials = listMaterials();
    const cloaks = store
      ? store.getAll().map((p) => ({ id: p.id, name: p.name, description: p.description }))
      : [];
    res.json({ success: true, materials, cloaks });
  });

  router.get('/world/draft', (_req, res) => {
    res.json({ success: true, draft: draftStore.read() });
  });

  router.put('/world/draft', (req, res) => {
    try {
      const draft = draftStore.write(req.body || {});
      res.json({ success: true, draft });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
        rule: error.details?.rule || 'world.draft'
      });
    }
  });

  router.post('/world/draft/reset', (_req, res) => {
    res.json({ success: true, draft: draftStore.reset() });
  });

  /**
   * Release = materialize pack + Notario (start pack + acta + tarball).
   * Body: { dryRun?: boolean, skipTests?: boolean, publishGithub?: boolean, draft?: object }
   */
  router.post('/world/release', (req, res) => {
    try {
      const body = req.body || {};
      let draft = draftStore.read();
      if (body.draft) {
        const checked = validateDraft({ ...draft, ...body.draft });
        if (!checked.ok) {
          return res.status(400).json({
            success: false,
            error: checked.error,
            rule: checked.rule
          });
        }
        draft = draftStore.write(checked.draft);
      }

      let libraryRoot;
      try {
        libraryRoot = resolveGamesLibraryRoot();
      } catch (error) {
        return res.status(503).json({
          success: false,
          error: error.message,
          rule: 'world.release.library'
        });
      }

      const materialized = materializeStartPack(draft, { libraryRoot, game: draft.gameId });
      if (!materialized.ok) {
        return res.status(400).json({
          success: false,
          error: materialized.error,
          rule: materialized.rule
        });
      }

      const notario = runNotarioRelease({
        game: draft.gameId,
        libraryRoot,
        dryRun: Boolean(body.dryRun),
        skipTests: body.skipTests !== false,
        publishGithub: Boolean(body.publishGithub)
      });

      if (!notario.ok) {
        return res.status(500).json({
          success: false,
          error: notario.error,
          rule: 'world.release.notario',
          materialized,
          notario: {
            status: notario.status,
            stdout: notario.stdout?.slice(-2000),
            stderr: notario.stderr?.slice(-2000)
          }
        });
      }

      res.json({
        success: true,
        draft,
        packRoot: materialized.packRoot,
        tarball: notario.tarball,
        summary: notario.summary,
        installHint: notario.tarball
          ? `npm install ${notario.tarball}`
          : 'see .release-startpack/ in games-library'
      });
    } catch (error) {
      console.error('world/release failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        rule: 'world.release'
      });
    }
  });

  return router;
}

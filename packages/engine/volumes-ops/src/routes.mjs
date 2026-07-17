/**
 * Express route handlers for volumes-ops.
 */

import { validate } from '@zeus/http-contract/express';
import { VOLUMES_OPS_ROUTES } from './contract.mjs';
import { measureAllVolumes, measureCorpus, measureVolume } from './measure.mjs';
import { emptyVolume } from './empty.mjs';
import { syncVolumeCounters } from './counters.mjs';

/**
 * @param {import('express').Express} app
 * @param {{ ledger?: { volumesRoot?: string, ledgerPath?: string } }} [opts]
 */
export function mountVolumesOpsRoutes(app, opts = {}) {
  const byId = new Map(VOLUMES_OPS_ROUTES.map((r) => [r.id, r]));

  const health = byId.get('health');
  app.get(health.path, (_req, res) => {
    res.json({
      status: 'ok',
      service: 'volumes-ops',
      timestamp: new Date().toISOString()
    });
  });

  const measureAll = byId.get('volumes.measure.all');
  app.get(measureAll.path, (_req, res) => {
    res.json(measureAllVolumes());
  });

  const measureOne = byId.get('volumes.measure');
  app.get(
    measureOne.path,
    validate(measureOne.request || {}, { routeId: measureOne.id }),
    (req, res) => {
      try {
        const linePath =
          typeof req.query.linePath === 'string' ? req.query.linePath : undefined;
        res.json(measureVolume(req.params.volumeId, { linePath }));
      } catch (err) {
        res.status(404).json({
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
  );

  const measureCorpusRoute = byId.get('volumes.measure.corpus');
  app.get(
    measureCorpusRoute.path,
    validate(measureCorpusRoute.request || {}, { routeId: measureCorpusRoute.id }),
    (req, res) => {
      const result = measureCorpus(req.params.volumeId, req.params.corpusId);
      res.status(result.ok === false ? 404 : 200).json(result);
    }
  );

  const emptyRoute = byId.get('volumes.empty');
  app.post(
    emptyRoute.path,
    validate(emptyRoute.request || {}, { routeId: emptyRoute.id }),
    (req, res) => {
      const body = req.body || {};
      const result = emptyVolume({
        volumeId: req.params.volumeId,
        corpusId: body.corpusId ?? null,
        role: body.role,
        actorId: body.actorId || 'ops',
        intent: body.intent || 'empty_volume',
        forceCurated: Boolean(body.forceCurated),
        ledger: opts.ledger
      });
      if (!result.ok) {
        /** @type {Record<string, number>} */
        const statusByError = {
          rol_no_autorizado: 403,
          rol_desconocido: 403,
          corpus_no_encontrado: 404,
          corpus_curado_requiere_force: 400
        };
        res.status(statusByError[result.error] ?? 400).json(result);
        return;
      }
      res.json(result);
    }
  );

  // Optional: sync counters without emptying (measure write-back).
  app.post('/api/volumes/:volumeId/sync-counters', (req, res) => {
    try {
      res.json({ ok: true, ...syncVolumeCounters(req.params.volumeId) });
    } catch (err) {
      res.status(404).json({
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });
}

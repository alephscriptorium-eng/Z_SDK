/**
 * City lifecycle runtime — brain over Z06 ProcessManager (actuators only).
 */

import { createAggregateController } from '@zeus/lifecycle-kit';
import { probeHealth } from '@zeus/mcp-launcher';
import {
  ARBOL_F1,
  catalogIdsForBarrio,
  resolveExtendedCatalog
} from './catalog-extend.mjs';
import { mandoToEvents } from './mando.mjs';
import { projectSnapshot } from './project.mjs';

export class CityLifecycleRuntime {
  /**
   * @param {{
   *   manager: import('@zeus/mcp-launcher').ProcessManager,
   *   catalog?: ReturnType<typeof resolveExtendedCatalog>,
   *   healthPollMs?: number,
   *   barrioIds?: string[]
   * }} opts
   */
  constructor(opts) {
    this.manager = opts.manager;
    this.catalog = opts.catalog || resolveExtendedCatalog();
    this.healthPollMs = opts.healthPollMs ?? 300;
    this.ledger = [];
    this.ledgerSeq = 0;
    this.barrioIds = opts.barrioIds || Object.keys(ARBOL_F1.barrios);
    /** @type {Map<string, ReturnType<typeof createAggregateController>>} */
    this.byBarrio = new Map();

    for (const barrioId of this.barrioIds) {
      const ids = catalogIdsForBarrio(barrioId, this.catalog);
      if (ids.length === 0) continue;
      const leafOpts = ids.map((catalogId) => this.#leafOpts(catalogId));
      this.byBarrio.set(barrioId, createAggregateController(leafOpts));
    }
  }

  #leafOpts(catalogId) {
    const entry = this.catalog.find((e) => e.id === catalogId);
    const manager = this.manager;
    const self = this;
    return {
      catalogId,
      autoRestart: entry?.autoRestart !== false,
      maxRestarts: 3,
      backoffMs: 200,
      async launch(id) {
        const result = await manager.launch(id);
        if (!result.ok) {
          throw new Error(result.error || 'launch_failed');
        }
        self.#hecho('MAQUINARIA_ARRANCADA', { catalogId: id, result });
        return {
          ok: true,
          adopted: result.adopted,
          identity: {
            pid: result.pid ?? result.health?.[0]?.pid ?? null,
            health: result.health,
            spawnGroup: result.spawnGroup
          }
        };
      },
      async stop(id) {
        const result = await manager.stop(id);
        self.#hecho('MAQUINARIA_PARADA', { catalogId: id, result });
        return result;
      },
      watch(input, sendBack) {
        const id = input.catalogId;
        const entry = self.catalog.find((e) => e.id === id);
        if (!entry) return () => {};
        const timer = setInterval(async () => {
          try {
            const probe = await probeHealth(entry.healthUrl, { timeoutMs: 800 });
            if (probe.ok) {
              sendBack({
                type: 'PROCESO_VIVO',
                identity: { healthUrl: entry.healthUrl, probe }
              });
            } else if (!manager.isManaged(id)) {
              sendBack({
                type: 'PROCESO_TERMINADO',
                diagnosis: probe.error || 'process_gone'
              });
            } else {
              sendBack({
                type: 'SALUD_FALLIDA',
                diagnosis: probe.error || 'unhealthy'
              });
            }
          } catch (err) {
            sendBack({
              type: 'SALUD_FALLIDA',
              diagnosis: String(err?.message || err)
            });
          }
        }, self.healthPollMs);
        return () => clearInterval(timer);
      }
    };
  }

  #hecho(kind, detail) {
    this.ledgerSeq += 1;
    this.ledger.push({
      kind,
      seq: this.ledgerSeq,
      ts: Date.now(),
      detail
    });
    if (this.ledger.length > 200) this.ledger.shift();
  }

  rollupBarrio(barrioId) {
    const ctrl = this.byBarrio.get(barrioId);
    if (!ctrl) return 'latente';
    return ctrl.rollup();
  }

  snapshotsBarrio(barrioId) {
    const ctrl = this.byBarrio.get(barrioId);
    return ctrl ? ctrl.snapshots() : {};
  }

  /**
   * Unique mando surface — tools and secondary client call this.
   * @param {string} command
   * @param {{ nodo?: string, barrioId?: string }} target
   */
  async dispatchMando(command, target = {}) {
    const mando = mandoToEvents(command, target);
    const barrioId = mando.barrioId;
    if (!barrioId) return { ok: false, error: 'nodo_requerido' };
    const ctrl = this.byBarrio.get(barrioId);
    if (!ctrl) return { ok: false, error: 'barrio_desconocido', barrioId };

    if (mando.action === 'status') {
      return {
        ok: true,
        barrioId,
        snapshot: projectSnapshot(this).barrios[barrioId]
      };
    }

    const before = projectSnapshot(this).barrios[barrioId];
    ctrl.sendAll(mando.event);

    if (mando.action === 'start') {
      await ctrl.waitFor((c) => c.rollup() === 'vivo' || c.rollup() === 'roto', {
        timeoutMs: 30_000
      });
    } else if (mando.action === 'stop') {
      // graceful: leaves stop via PARADA_SOLICITADA (children before parent — single level f1)
      await ctrl.waitFor((c) => c.rollup() === 'latente', { timeoutMs: 30_000 });
    }

    const after = projectSnapshot(this).barrios[barrioId];
    this.#hecho('BARRIO_CAMBIO', {
      barrioId,
      action: mando.action,
      before: before.estado,
      after: after.estado
    });

    return {
      ok: after.estado !== 'roto' || mando.action === 'stop',
      barrioId,
      before,
      after,
      ledgerTail: this.ledger.slice(-5)
    };
  }

  snapshot() {
    return projectSnapshot(this);
  }

  dispose() {
    for (const ctrl of this.byBarrio.values()) ctrl.stop();
  }
}

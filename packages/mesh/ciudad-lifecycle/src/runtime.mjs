/**
 * City lifecycle runtime — brain over Z06 ProcessManager (actuators only).
 * f2: zone cascade + ciudad rollup + wake→authority bridge (injected domain).
 */

import {
  createAggregateController,
  readActuatorIntentionalStop,
  resolveIntentionalStop,
  runCascade,
  CASCADE_CONCURRENCY_DEFAULT,
  projectTreeLife
} from '@zeus/lifecycle-kit';
import { probeHealth } from '@zeus/mcp-launcher';
import { resolveWakeLaunch } from '@zeus/mcp-launcher/wake-bridge';
import {
  ARBOL_F1,
  catalogIdsForBarrio,
  resolveExtendedCatalog,
  buildWakeMap
} from './catalog-extend.mjs';
import { mandoToEvents } from './mando.mjs';
import { projectSnapshot } from './project.mjs';
import { roundTripWake } from './wake-sync.mjs';

/** Techo cascada zonas (patrón Z08 POBLACION_MAX). Override via opts / env. */
export const POBLACION_MAX =
  Number(process.env.POBLACION_MAX) || CASCADE_CONCURRENCY_DEFAULT;

export class CityLifecycleRuntime {
  /**
   * @param {{
   *   manager: import('@zeus/mcp-launcher').ProcessManager,
   *   catalog?: ReturnType<typeof resolveExtendedCatalog>,
   *   healthPollMs?: number,
   *   barrioIds?: string[],
   *   concurrency?: number,
   *   wakeDomain?: import('./wake-sync.mjs').WakeDomain,
   *   makeIntent?: import('./wake-sync.mjs').MakeIntentFn
   * }} opts
   */
  constructor(opts) {
    this.manager = opts.manager;
    this.catalog = opts.catalog || resolveExtendedCatalog();
    this.healthPollMs = opts.healthPollMs ?? 300;
    this.concurrency = opts.concurrency ?? POBLACION_MAX;
    this.wakeDomain = opts.wakeDomain || null;
    this.makeIntent = opts.makeIntent || null;
    this.ledger = [];
    this.ledgerSeq = 0;
    this.barrioIds = opts.barrioIds || Object.keys(ARBOL_F1.barrios);
    /** @type {Map<string, ReturnType<typeof createAggregateController>>} */
    this.byBarrio = new Map();
    this.wakeMap = buildWakeMap(this.catalog, this.barrioIds);

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
      isIntentionalStop: (id) =>
        resolveIntentionalStop({
          actuatorIntentional: readActuatorIntentionalStop(manager, id)
        }),
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
              const intentional = resolveIntentionalStop({
                actuatorIntentional: readActuatorIntentionalStop(manager, id)
              });
              sendBack({
                type: 'PROCESO_TERMINADO',
                diagnosis: intentional
                  ? 'intentional_stop'
                  : probe.error || 'process_gone',
                intentionalStop: intentional
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

  /**
   * Read intentional-stop from the actuator (Z06), not only leaf context.
   * @param {string} catalogId
   */
  isIntentionalStop(catalogId) {
    return resolveIntentionalStop({
      actuatorIntentional: readActuatorIntentionalStop(this.manager, catalogId)
    });
  }

  rollupBarrio(barrioId) {
    const ctrl = this.byBarrio.get(barrioId);
    if (!ctrl) return 'latente';
    return ctrl.rollup();
  }

  /** Ciudad-level rollup over barrio lives. */
  rollupCiudad() {
    const lives = this.barrioIds.map((id) => this.rollupBarrio(id));
    return projectTreeLife(lives);
  }

  snapshotsBarrio(barrioId) {
    const ctrl = this.byBarrio.get(barrioId);
    return ctrl ? ctrl.snapshots() : {};
  }

  /**
   * Resolve wake → catalog ids (Z06 bridge; map owned by composition).
   * @param {string} barrioId
   */
  resolveWake(barrioId) {
    return resolveWakeLaunch(barrioId, {
      map: this.wakeMap,
      catalog: this.catalog
    });
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
      // graceful: leaves stop via PARADA_SOLICITADA (children before parent — single level)
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

  /**
   * Cascada por zonas con concurrencia acotada (techo POBLACION_MAX).
   * @param {'start'|'stop'} command
   * @param {{ nodos?: string[], concurrency?: number }} [opts]
   */
  async dispatchCascade(command, opts = {}) {
    const nodos = opts.nodos?.length
      ? opts.nodos
      : [...this.byBarrio.keys()];
    const concurrency = opts.concurrency ?? this.concurrency;
    const beforeCiudad = this.rollupCiudad();

    const results = await runCascade(
      nodos,
      async (nodo) => {
        try {
          return await this.dispatchMando(command, { nodo });
        } catch (err) {
          return { ok: false, barrioId: nodo, error: String(err?.message || err) };
        }
      },
      { concurrency }
    );

    const afterCiudad = this.rollupCiudad();
    this.#hecho('CIUDAD_CASCADA', {
      command,
      concurrency,
      nodos,
      beforeCiudad,
      afterCiudad,
      okCount: results.filter((r) => r?.ok).length
    });

    return {
      ok: results.every((r) => r?.ok),
      concurrency,
      techo: POBLACION_MAX,
      beforeCiudad,
      afterCiudad,
      results,
      snapshot: this.snapshot()
    };
  }

  /**
   * Wake authority (Z03 domain injected) → process start → dual snapshot.
   * Does not invent a second reducer; domain is the game brain.
   * @param {Parameters<typeof roundTripWake>[0]} params
   */
  async wakeAndStart(params) {
    const domain = params.domain || this.wakeDomain;
    const makeIntent = params.makeIntent || this.makeIntent;
    if (!domain || typeof domain.applyIntent !== 'function') {
      return { ok: false, error: 'wake_domain_requerido' };
    }
    const out = await roundTripWake({
      ...params,
      domain,
      makeIntent,
      runtime: this
    });
    this.#hecho('WAKE_ROUNDTRIP', {
      barrioId: params.barrioId,
      ok: out.ok,
      gameEstado: out.gameSnap?.barrios?.[params.barrioId]?.estado,
      processEstado: out.processSnap?.barrios?.[params.barrioId]?.estado
    });
    return out;
  }

  snapshot() {
    return projectSnapshot(this);
  }

  dispose() {
    for (const ctrl of this.byBarrio.values()) ctrl.stop();
  }
}

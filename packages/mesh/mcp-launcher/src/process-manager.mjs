/**
 * Process actuator for catalogued MCP servers only.
 * No arbitrary spawn; no XState / supervision (Z12).
 */

import { spawn } from 'node:child_process';
import {
  resolveCatalog,
  getCatalogEntry,
  entriesForSpawnGroup,
  buildSpawnSpec
} from './catalog.mjs';
import { probeHealth } from './health.mjs';

/**
 * @typedef {object} ManagedProcess
 * @property {string} spawnGroup
 * @property {import('node:child_process').ChildProcess} child
 * @property {number} pid
 * @property {string[]} serverIds
 * @property {number} startedAt
 */

export class ProcessManager {
  /**
   * @param {{
   *   catalog?: ReturnType<typeof resolveCatalog>,
   *   repoRoot?: string,
   *   healthTimeoutMs?: number,
   *   healthPollMs?: number
   * }} [opts]
   */
  constructor(opts = {}) {
    this.catalog = opts.catalog || resolveCatalog();
    this.repoRoot = opts.repoRoot;
    this.healthTimeoutMs = opts.healthTimeoutMs ?? 30_000;
    this.healthPollMs = opts.healthPollMs ?? 400;
    /** @type {Map<string, ManagedProcess>} */
    this.byGroup = new Map();
    /** @type {Set<string>} intentional stops (no auto-restart — Z12 owns policy) */
    this.intentionalStops = new Set();
  }

  listCatalog() {
    return this.catalog;
  }

  /**
   * @param {string} serverId
   */
  getEntry(serverId) {
    return getCatalogEntry(serverId, this.catalog);
  }

  /**
   * @param {string} serverId
   */
  isManaged(serverId) {
    const entry = this.getEntry(serverId);
    const group = entry.spawnGroup || entry.id;
    return this.byGroup.has(group);
  }

  /**
   * Resolve spawnGroup for a catalog server id.
   * @param {string} serverId
   */
  #groupOf(serverId) {
    const entry = this.getEntry(serverId);
    return entry.spawnGroup || entry.id;
  }

  /**
   * Read intentional-stop mark for a catalog id (write in stop, clear in launch).
   * No restart policy here — composition (Z12) owns that.
   * @param {string} serverId
   */
  isIntentionalStop(serverId) {
    return this.intentionalStops.has(this.#groupOf(serverId));
  }

  /**
   * @returns {string[]} spawnGroup ids currently marked intentional stop
   */
  listIntentionalStops() {
    return [...this.intentionalStops];
  }

  /**
   * Launch one catalog id (starts whole spawnGroup).
   * @param {string} serverId
   */
  async launch(serverId) {
    const entry = this.getEntry(serverId);
    if (!entry.workspace && !entry.spawnCommand) {
      return {
        ok: false,
        error: `No workspace/spawnCommand for "${serverId}"`,
        rule: 'catalog.spawn'
      };
    }

    const group = entry.spawnGroup || entry.id;
    this.intentionalStops.delete(group);

    if (this.byGroup.has(group)) {
      const health = await this.#healthForGroup(group);
      return {
        ok: true,
        adopted: true,
        spawnGroup: group,
        serverIds: entriesForSpawnGroup(group, this.catalog).map((e) => e.id),
        health
      };
    }

    const spec = buildSpawnSpec(entry, { repoRoot: this.repoRoot });
    const child = spawn(spec.command, spec.args, {
      cwd: spec.cwd,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    const managed = {
      spawnGroup: group,
      child,
      pid: child.pid,
      serverIds: entriesForSpawnGroup(group, this.catalog).map((e) => e.id),
      startedAt: Date.now()
    };
    this.byGroup.set(group, managed);

    child.on('exit', () => {
      if (this.byGroup.get(group)?.child === child) {
        this.byGroup.delete(group);
      }
    });

    const health = await this.#waitHealthy(group);
    if (!health.every((h) => h.ok)) {
      await this.stop(serverId, { force: true });
      return {
        ok: false,
        error: 'Health check failed after launch',
        spawnGroup: group,
        health,
        rule: 'launch.health'
      };
    }

    return {
      ok: true,
      adopted: false,
      spawnGroup: group,
      pid: managed.pid,
      serverIds: managed.serverIds,
      health
    };
  }

  /**
   * @param {string} serverId
   * @param {{ force?: boolean }} [opts]
   */
  async stop(serverId, opts = {}) {
    const entry = this.getEntry(serverId);
    const group = entry.spawnGroup || entry.id;
    const managed = this.byGroup.get(group);
    if (!managed) {
      return { ok: true, alreadyStopped: true, spawnGroup: group };
    }

    this.intentionalStops.add(group);
    const child = managed.child;
    const killPromise = new Promise((resolve) => {
      const done = () => resolve({ ok: true, spawnGroup: group, pid: managed.pid });
      child.once('exit', done);
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
            stdio: 'ignore',
            windowsHide: true
          }).on('exit', () => {
            /* exit event on child should follow */
          });
        } else {
          child.kill(opts.force ? 'SIGKILL' : 'SIGTERM');
        }
      } catch {
        done();
      }
      setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          /* ignore */
        }
        done();
      }, 5_000);
    });

    const result = await killPromise;
    this.byGroup.delete(group);
    return result;
  }

  /**
   * @param {string} serverId
   */
  async restart(serverId) {
    await this.stop(serverId, { force: true });
    return this.launch(serverId);
  }

  /**
   * @param {{ ids?: string[] }} [opts]
   */
  async launchAll(opts = {}) {
    const ids =
      opts.ids ||
      this.catalog
        .filter((e) => e.workspace || e.spawnCommand)
        .map((e) => e.id);
    /** Prefer one launch per spawnGroup */
    const seen = new Set();
    const results = [];
    for (const id of ids) {
      const entry = this.getEntry(id);
      const group = entry.spawnGroup || entry.id;
      if (seen.has(group)) continue;
      if (!entry.workspace && !entry.spawnCommand) continue;
      seen.add(group);
      results.push({ id, ...(await this.launch(id)) });
    }
    return { ok: results.every((r) => r.ok), results };
  }

  /**
   * Fleet health snapshot (catalog ∪ managed).
   */
  async health() {
    const rows = [];
    for (const entry of this.catalog) {
      const group = entry.spawnGroup || entry.id;
      const managed = this.byGroup.get(group);
      const probe = await probeHealth(entry.healthUrl);
      rows.push({
        id: entry.id,
        name: entry.name,
        port: entry.port,
        url: entry.url,
        healthUrl: entry.healthUrl,
        spawnGroup: group,
        managed: Boolean(managed),
        pid: managed?.pid ?? null,
        status: probe.ok ? 'running' : managed ? 'unhealthy' : 'stopped',
        /** true only after stop(); crash/exit without stop stays false */
        intentionalStop: this.intentionalStops.has(group),
        probe
      });
    }
    return {
      ok: true,
      at: new Date().toISOString(),
      fleet: rows,
      managedGroups: [...this.byGroup.keys()],
      intentionalGroups: [...this.intentionalStops]
    };
  }

  async #healthForGroup(group) {
    const entries = entriesForSpawnGroup(group, this.catalog);
    return Promise.all(
      entries.map(async (e) => ({
        id: e.id,
        port: e.port,
        ...(await probeHealth(e.healthUrl))
      }))
    );
  }

  async #waitHealthy(group) {
    const deadline = Date.now() + this.healthTimeoutMs;
    let last = [];
    while (Date.now() < deadline) {
      if (!this.byGroup.has(group)) {
        return last.length
          ? last
          : [{ ok: false, error: 'process exited before healthy' }];
      }
      last = await this.#healthForGroup(group);
      if (last.every((h) => h.ok)) return last;
      await new Promise((r) => setTimeout(r, this.healthPollMs));
    }
    return last;
  }
}

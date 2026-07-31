/**
 * Runtime orchestrator v1 (WP-U234) — declarative start/stop/status/health
 * over the fleet catalog. Lives in mcp-launcher because its only sources are
 * catalog.mjs (entries + declared deps + buildSpawnSpec) and health.mjs;
 * ciudad-lifecycle (brain, barrio semantics) consumes the same catalog and
 * stays untouched.
 *
 * ── Contrato de consumo (V34 mando de ciudad · O22 compose) ────────────────
 * CLI:
 *   node packages/mesh/mcp-launcher/src/orchestrator.mjs <cmd> [perfil]
 *
 * Comandos (perfil por defecto: "minimo"; también acepta un id de catálogo):
 *   start  <perfil>  Arranque en orden topológico por deps declaradas del
 *                    catálogo (empate → orden estable del catálogo). Un grupo
 *                    ya sano se adopta (no re-spawn). Espera health por CADA
 *                    entrada del catálogo servida por el grupo. Fallo de
 *                    health ⇒ rollback de lo arrancado en esta invocación.
 *                    Estado de ejecución en data/orchestrator/state-<perfil>.json
 *                    (git-ignored); logs por grupo en el mismo directorio.
 *   stop   <perfil>  Parada en orden inverso: taskkill /T /F del pid grabado
 *                    (win32) o kill de process-group (POSIX), barrido de
 *                    listeners residuales por puerto de catálogo, y prueba
 *                    real de re-bind de cada puerto. Limpia el estado.
 *   status <perfil>  Una fila por entrada: {id, group, port, healthy,
 *                    listening, pids, managedPid}.
 *   health <perfil>  probeHealth por entrada (reusa health.mjs).
 *
 * Salida: progreso humano por stderr; UN documento JSON por stdout (los
 * consumidores parsean solo stdout). Exit codes: 0 = ok · 1 = fallo
 * operativo (health KO en start / residuos en stop / health KO en health) ·
 * 2 = uso, perfil o id desconocido, ciclo de deps.
 *
 * Perfiles: PROFILES (abajo). "all" = toda entrada lanzable del catálogo.
 * Fuente única: catalog.mjs — aquí no hay comandos de servicio ni puertos
 * escritos a mano (CA-3 U234); los únicos ejecutables literales son
 * primitivas del SO para teardown (taskkill/netstat), la misma clase que
 * process-manager.mjs:181.
 *
 * Env overrides: ZEUS_ORQ_TIMEOUT_MS (health total por grupo, def. 90000),
 * ZEUS_ORQ_POLL_MS (def. 500), ZEUS_ORQ_STATE_DIR (def. <repo>/data/orchestrator).
 *
 * Hallazgo U179 (CERRADO por U227+U180): el env central ya declara
 * `ciudadLifecycle.disk` (presets-sdk/src/env/index.mjs:44) y
 * ciudad-lifecycle resuelve su bind desde ahí
 * (packages/mesh/ciudad-lifecycle/src/server.mjs). U180 le dio entrada de
 * catálogo (catalog.mjs, id `ciudad-lifecycle`), por lo que entra en el
 * perfil "all" (toda entrada lanzable). NO se añade a `minimo` ni a
 * `v1-zeus`: esos perfiles los fija U234 y su composición no cambia aquí.
 */

import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { isMainModule } from '@zeus/presets-sdk/mcp';
import {
  resolveCatalogLive,
  resolveRepoRoot,
  entriesForSpawnGroup,
  buildSpawnSpec
} from './catalog.mjs';
import { probeHealth } from './health.mjs';

/**
 * Declarative profiles = subsets of catalog ids. "all" resolves at runtime.
 * minimo: entradas lanzables de menor coste desde un checkout limpio —
 * launcher (actuador MCP sin datos) + solar (datos demo del propio paquete;
 * un spawn sirve sun/moon/earth). Quedan FUERA de minimo por coste real:
 * linea-espana exige volumen vivo LINEAS/espana no versionado (.gitignore:
 * solo LINEAS/demo; linea-system/src/start.mjs lanza "Line data not found")
 * y forces exige ZEUS_VOLUMES_ROOT explícito del operador (política U200 ◆5,
 * presets-sdk/src/volumes/resolve.mjs:33 — el orquestador NO lo inyecta).
 * @type {Record<string, string[]|null>}
 */
export const PROFILES = {
  minimo: ['launcher', 'solar-sun'],
  'v1-zeus': ['socket-server', 'console-monitor', 'cache-browser', 'firehose-browser'],
  all: null
};

const IS_WIN = process.platform === 'win32';

function envInt(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function defaultOpts(opts = {}) {
  return {
    timeoutMs: opts.timeoutMs ?? envInt('ZEUS_ORQ_TIMEOUT_MS', 90_000),
    pollMs: opts.pollMs ?? envInt('ZEUS_ORQ_POLL_MS', 500),
    stateDir:
      opts.stateDir ||
      process.env.ZEUS_ORQ_STATE_DIR ||
      path.join(resolveRepoRoot(), 'data', 'orchestrator'),
    repoRoot: opts.repoRoot,
    log: opts.log || ((msg) => console.error(msg))
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Expand a profile name (or catalog id) to catalog entries, transitively
 * closing over declared deps.
 * @param {string} perfil
 * @param {import('./catalog.mjs').CatalogEntry[]} catalog
 * @param {Record<string, string[]|null>} [profiles]
 */
export function expandProfile(perfil, catalog, profiles = PROFILES) {
  let ids;
  if (Object.hasOwn(profiles, perfil)) {
    ids =
      profiles[perfil] ||
      catalog.filter((e) => e.workspace || e.spawnCommand).map((e) => e.id);
  } else if (catalog.some((e) => e.id === perfil)) {
    ids = [perfil];
  } else {
    throw Object.assign(
      new Error(
        `Perfil o id desconocido "${perfil}". Perfiles: ${Object.keys(profiles).join(', ')}`
      ),
      { code: 'USO' }
    );
  }

  const byId = new Map(catalog.map((e) => [e.id, e]));
  const seen = new Set();
  const queue = [...ids];
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    const entry = byId.get(id);
    if (!entry) {
      throw Object.assign(
        new Error(`Dep/id "${id}" no existe en el catálogo`),
        { code: 'USO' }
      );
    }
    seen.add(id);
    for (const dep of entry.deps || []) queue.push(dep);
  }
  return catalog.filter((e) => seen.has(e.id));
}

/**
 * Group the expanded entries by spawnGroup and topologically order groups by
 * declared deps (Kahn; ties broken by catalog order — stable when deps are
 * empty, which is today's seed; U184 will populate them).
 * @param {import('./catalog.mjs').CatalogEntry[]} entries expanded profile
 * @param {import('./catalog.mjs').CatalogEntry[]} catalog full catalog
 */
export function planGroups(entries, catalog) {
  const groupOf = (e) => e.spawnGroup || e.id;
  const orderIndex = new Map(catalog.map((e, i) => [groupOf(e), i]));
  const byId = new Map(catalog.map((e) => [e.id, e]));

  /** @type {Map<string, { group: string, entries: any[], deps: Set<string> }>} */
  const groups = new Map();
  for (const entry of entries) {
    const g = groupOf(entry);
    if (!groups.has(g)) {
      groups.set(g, {
        group: g,
        // full member list: the process serves every catalog port of the group
        entries: entriesForSpawnGroup(g, catalog),
        deps: new Set()
      });
    }
  }
  for (const g of groups.values()) {
    for (const member of g.entries) {
      for (const depId of member.deps || []) {
        const depEntry = byId.get(depId);
        if (!depEntry) continue;
        const depGroup = groupOf(depEntry);
        if (depGroup !== g.group && groups.has(depGroup)) g.deps.add(depGroup);
      }
    }
  }

  const ordered = [];
  const pending = new Map(groups);
  while (pending.size) {
    const ready = [...pending.values()]
      .filter((g) => [...g.deps].every((d) => !pending.has(d)))
      .sort((a, b) => (orderIndex.get(a.group) ?? 0) - (orderIndex.get(b.group) ?? 0));
    if (!ready.length) {
      throw Object.assign(
        new Error(`Ciclo de deps entre grupos: ${[...pending.keys()].join(', ')}`),
        { code: 'USO' }
      );
    }
    ordered.push(ready[0]);
    pending.delete(ready[0].group);
  }
  return ordered;
}

function statePath(stateDir, perfil) {
  return path.join(stateDir, `state-${perfil}.json`);
}

function readState(stateDir, perfil) {
  try {
    return JSON.parse(fs.readFileSync(statePath(stateDir, perfil), 'utf8'));
  } catch {
    return null;
  }
}

function writeState(stateDir, perfil, state) {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(statePath(stateDir, perfil), JSON.stringify(state, null, 2));
}

function clearState(stateDir, perfil) {
  try {
    fs.unlinkSync(statePath(stateDir, perfil));
  } catch {
    /* ignore */
  }
}

/** Pids listening on a TCP port (OS primitive — same class as PM taskkill). */
export function listenerPids(port) {
  if (IS_WIN) {
    const r = spawnSync('netstat', ['-ano', '-p', 'tcp'], {
      windowsHide: true,
      encoding: 'utf8'
    });
    const pids = new Set();
    for (const line of String(r.stdout || '').split(/\r?\n/)) {
      if (!/LISTENING/i.test(line)) continue;
      const cols = line.trim().split(/\s+/);
      if (cols.length >= 5 && cols[1].endsWith(`:${port}`)) {
        const pid = Number(cols[cols.length - 1]);
        if (Number.isFinite(pid) && pid > 4) pids.add(pid);
      }
    }
    return [...pids];
  }
  const r = spawnSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], {
    encoding: 'utf8'
  });
  return String(r.stdout || '')
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)
    .filter((p) => Number.isFinite(p) && p > 1);
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Kill a whole process tree (win32: taskkill /T /F; POSIX: group kill). */
export async function killTree(pid) {
  if (!Number.isFinite(pid) || pid <= 4) return { pid, ok: false, skipped: true };
  if (IS_WIN) {
    const r = spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], {
      windowsHide: true,
      encoding: 'utf8'
    });
    return { pid, ok: r.status === 0 || !isAlive(pid), method: 'taskkill /T /F' };
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  }
  const deadline = Date.now() + 3_000;
  while (Date.now() < deadline && isAlive(pid)) await sleep(100);
  if (isAlive(pid)) {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        /* ignore */
      }
    }
  }
  return { pid, ok: !isAlive(pid), method: 'SIGTERM→SIGKILL (group)' };
}

/** True if the port can be bound right now (real bind, then release). */
export function portFree(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.listen({ port, host, exclusive: true }, () => {
      srv.close(() => resolve(true));
    });
  });
}

async function waitPortFree(port, host, deadlineMs) {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    if (await portFree(port, host)) return true;
    await sleep(200);
  }
  return portFree(port, host);
}

function spawnDetached(spec, logPath) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const out = fs.openSync(logPath, 'a');
  // Node ≥20 exige shell para .cmd/.bat (CVE-2024-27980); args sin espacios.
  const needsShell = IS_WIN && /\.(cmd|bat)$/i.test(spec.command);
  const child = spawn(spec.command, spec.args, {
    cwd: spec.cwd,
    env: { ...process.env },
    stdio: ['ignore', out, out],
    windowsHide: true,
    detached: !IS_WIN,
    shell: needsShell
  });
  fs.closeSync(out);
  child.unref();
  return child;
}

async function probeEntries(entries) {
  return Promise.all(
    entries.map(async (e) => ({
      id: e.id,
      port: e.port,
      healthUrl: e.healthUrl,
      ...(await probeHealth(e.healthUrl))
    }))
  );
}

async function waitHealthy(entries, child, { timeoutMs, pollMs }) {
  const deadline = Date.now() + timeoutMs;
  let last = [];
  while (Date.now() < deadline) {
    if (child && child.exitCode != null) {
      return { ok: false, exitedWith: child.exitCode, health: last };
    }
    last = await probeEntries(entries);
    if (last.every((h) => h.ok)) return { ok: true, health: last };
    await sleep(pollMs);
  }
  return { ok: false, timeout: true, health: last };
}

function tailLog(logPath, lines = 12) {
  try {
    return fs
      .readFileSync(logPath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-lines);
  } catch {
    return [];
  }
}

/**
 * start <perfil> — see file header contract.
 * @param {string} perfil
 * @param {{ catalog?: any[], stateDir?: string, timeoutMs?: number, pollMs?: number, repoRoot?: string, log?: (m: string) => void }} [opts]
 */
export async function runStart(perfil, opts = {}) {
  const o = defaultOpts(opts);
  const catalog = opts.catalog || (await resolveCatalogLive());
  const plan = planGroups(expandProfile(perfil, catalog), catalog);
  const started = [];
  const results = [];

  for (const g of plan) {
    const pre = await probeEntries(g.entries);
    if (pre.every((h) => h.ok)) {
      o.log(`[orq] ${g.group}: ya sano — adoptado`);
      results.push({ group: g.group, adopted: true, ids: g.entries.map((e) => e.id), health: pre });
      continue;
    }
    if (pre.some((h) => h.ok)) {
      const rollback = await rollbackStarted(started);
      return fail('start', perfil, 1, {
        error: 'grupo_parcialmente_activo',
        group: g.group,
        health: pre,
        rollback
      });
    }
    const occupied = g.entries
      .map((e) => ({ id: e.id, port: e.port, pids: listenerPids(e.port) }))
      .filter((r) => r.pids.length);
    if (occupied.length) {
      const rollback = await rollbackStarted(started);
      return fail('start', perfil, 1, {
        error: 'puerto_ocupado_sin_health',
        group: g.group,
        occupied,
        rollback
      });
    }
    const launchable = g.entries.find((e) => e.workspace || e.spawnCommand);
    if (!launchable) {
      const rollback = await rollbackStarted(started);
      return fail('start', perfil, 1, {
        error: 'no_lanzable',
        group: g.group,
        detail: 'entrada de catálogo sin workspace/spawnCommand y sin health previo',
        rollback
      });
    }

    const spec = buildSpawnSpec(launchable, { repoRoot: o.repoRoot });
    const logPath = path.join(o.stateDir, `log-${g.group}.log`);
    o.log(`[orq] ${g.group}: spawn ${spec.command} ${spec.args.join(' ')}`);
    const child = spawnDetached(spec, logPath);
    const record = {
      group: g.group,
      pid: child.pid,
      ids: g.entries.map((e) => e.id),
      ports: g.entries.map((e) => e.port),
      log: logPath
    };
    started.push(record);

    const waited = await waitHealthy(g.entries, child, o);
    if (!waited.ok) {
      o.log(`[orq] ${g.group}: health KO — rollback`);
      const rollback = await rollbackStarted(started);
      return fail('start', perfil, 1, {
        error: 'health_fallida_tras_spawn',
        group: g.group,
        waited,
        logTail: tailLog(logPath),
        rollback
      });
    }
    o.log(`[orq] ${g.group}: sano (pid ${child.pid})`);
    results.push({ ...record, adopted: false, health: waited.health });
  }

  writeState(o.stateDir, perfil, {
    perfil,
    startedAt: new Date().toISOString(),
    groups: started
  });
  return { ok: true, cmd: 'start', perfil, exitCode: 0, groups: results };
}

async function rollbackStarted(started) {
  const kills = [];
  for (const rec of [...started].reverse()) {
    kills.push(await killTree(rec.pid));
    for (const port of rec.ports) {
      for (const pid of listenerPids(port)) kills.push(await killTree(pid));
    }
  }
  return kills;
}

function fail(cmd, perfil, exitCode, detail) {
  return { ok: false, cmd, perfil, exitCode, ...detail };
}

/**
 * stop <perfil> — see file header contract.
 * @param {string} perfil
 * @param {{ catalog?: any[], stateDir?: string, log?: (m: string) => void }} [opts]
 */
export async function runStop(perfil, opts = {}) {
  const o = defaultOpts(opts);
  const catalog = opts.catalog || (await resolveCatalogLive());
  const plan = planGroups(expandProfile(perfil, catalog), catalog).reverse();
  const state = readState(o.stateDir, perfil);
  const killed = [];
  const before = [];

  for (const g of plan) {
    const rec = state?.groups?.find((r) => r.group === g.group);
    const listeners = g.entries.map((e) => ({
      id: e.id,
      port: e.port,
      pids: listenerPids(e.port)
    }));
    before.push(...listeners);
    const targets = new Set();
    if (rec?.pid) targets.add(rec.pid);
    for (const l of listeners) for (const pid of l.pids) targets.add(pid);
    for (const pid of targets) {
      if (pid === process.pid) continue;
      o.log(`[orq] ${g.group}: kill tree pid ${pid}`);
      killed.push({ group: g.group, ...(await killTree(pid)) });
    }
  }

  const ports = [];
  for (const g of plan) {
    for (const e of g.entries) {
      const free = await waitPortFree(e.port, e.host || 'localhost', 8_000);
      ports.push({
        id: e.id,
        port: e.port,
        free,
        residualPids: free ? [] : listenerPids(e.port)
      });
    }
  }

  const residues = ports.filter((p) => !p.free);
  if (!residues.length) clearState(o.stateDir, perfil);
  return {
    ok: residues.length === 0,
    cmd: 'stop',
    perfil,
    exitCode: residues.length ? 1 : 0,
    before,
    killed,
    ports,
    residues
  };
}

/**
 * status <perfil> — informational; exit 0.
 * @param {string} perfil
 * @param {{ catalog?: any[], stateDir?: string }} [opts]
 */
export async function runStatus(perfil, opts = {}) {
  const o = defaultOpts(opts);
  const catalog = opts.catalog || (await resolveCatalogLive());
  const plan = planGroups(expandProfile(perfil, catalog), catalog);
  const state = readState(o.stateDir, perfil);
  const rows = [];
  for (const g of plan) {
    const rec = state?.groups?.find((r) => r.group === g.group);
    for (const e of g.entries) {
      const probe = await probeHealth(e.healthUrl);
      const pids = listenerPids(e.port);
      rows.push({
        id: e.id,
        group: g.group,
        port: e.port,
        url: e.url,
        healthy: probe.ok,
        listening: pids.length > 0,
        pids,
        managedPid: rec?.pid ?? null,
        status: probe.ok ? 'running' : pids.length ? 'unhealthy' : 'stopped'
      });
    }
  }
  return {
    ok: true,
    cmd: 'status',
    perfil,
    exitCode: 0,
    rows,
    resumen: {
      total: rows.length,
      running: rows.filter((r) => r.status === 'running').length,
      stopped: rows.filter((r) => r.status === 'stopped').length,
      unhealthy: rows.filter((r) => r.status === 'unhealthy').length
    }
  };
}

/**
 * health <perfil> — exit 0 iff every entry's healthUrl answers ok.
 * @param {string} perfil
 * @param {{ catalog?: any[] }} [opts]
 */
export async function runHealth(perfil, opts = {}) {
  const catalog = opts.catalog || (await resolveCatalogLive());
  const plan = planGroups(expandProfile(perfil, catalog), catalog);
  const rows = [];
  for (const g of plan) rows.push(...(await probeEntries(g.entries)));
  const ok = rows.every((r) => r.ok);
  return { ok, cmd: 'health', perfil, exitCode: ok ? 0 : 1, rows };
}

const COMMANDS = { start: runStart, stop: runStop, status: runStatus, health: runHealth };

function usage() {
  console.error(
    'Uso: node packages/mesh/mcp-launcher/src/orchestrator.mjs <start|stop|status|health> [perfil]\n' +
      `Perfiles: ${Object.keys(PROFILES).join(', ')} (o un id del catálogo). Def.: minimo`
  );
}

export async function main(argv = process.argv.slice(2)) {
  const [cmd, perfilArg] = argv;
  const perfil = perfilArg || 'minimo';
  const run = COMMANDS[cmd];
  if (!run) {
    usage();
    return 2;
  }
  try {
    const result = await run(perfil);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return result.exitCode ?? (result.ok ? 0 : 1);
  } catch (err) {
    if (err?.code === 'USO') {
      console.error(String(err.message));
      usage();
      return 2;
    }
    console.error(String(err?.stack || err));
    return 1;
  }
}

if (isMainModule(import.meta.url)) {
  process.exitCode = await main();
}

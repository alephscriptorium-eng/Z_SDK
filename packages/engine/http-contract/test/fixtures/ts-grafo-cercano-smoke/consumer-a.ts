/**
 * Eje IV sensor A — grafo cercano lote WP-U157 (mitad 1).
 * Must typecheck without `any` escape on Zeus imports.
 */
import { defineRoutes, getValidateMode, type RouteEntry } from '@zeus/http-contract';
import { validate } from '@zeus/http-contract/express';
import { validateResourcePayload } from '@zeus/http-contract/mcp-resources';
import { ZONE_INTEREST_ALL, normalizeZoneInterest, createMapEngine } from '@zeus/game-engine';
import { srcDir as gameSrcDir } from '@zeus/game-engine/node';
import { createViewerScene, STICK_POSES } from '@zeus/view-kit';
import { pkgDir as viewPkgDir } from '@zeus/view-kit/node';
import {
  DEFAULT_PEER_CARD_TTL_MS,
  normalizeEvents
} from '@zeus/authority-kit';
import {
  resolveContentRevSnapshotOpts,
  type StartAuthorityOptions
} from '@zeus/authority-kit/create-authority';

export function sensorA(): {
  routes: RouteEntry[];
  mode: ReturnType<typeof getValidateMode>;
  zones: Set<string> | null;
  poses: typeof STICK_POSES;
  ttl: number;
  paths: { gameSrcDir: string; viewPkgDir: string };
} {
  const PingSchema = { /* zod schema at runtime; typed as ZodTypeAny stand-in */ };
  const routes: RouteEntry[] = defineRoutes('u157-smoke', [
    {
      id: 'smoke.ping',
      method: 'GET',
      path: '/ping',
      summary: 'smoke',
      responses: { 200: PingSchema }
    }
  ]);
  const mode = getValidateMode();
  const _mw = validate({});
  void _mw;
  const _vr = validateResourcePayload('x', {});
  void _vr;
  const zones = normalizeZoneInterest(ZONE_INTEREST_ALL);
  const _engine = createMapEngine({ nodes: [], links: [] });
  void _engine;
  const scene = createViewerScene({});
  void scene;
  const events = normalizeEvents(null);
  void events;
  const snap = resolveContentRevSnapshotOpts({
    domain: {},
    now: 0,
    lastContentRev: 0,
    lastFullAt: 0,
    heartbeatMs: 1000
  });
  void snap;
  const _opts: StartAuthorityOptions | null = null;
  void _opts;
  return {
    routes,
    mode,
    zones,
    poses: STICK_POSES,
    ttl: DEFAULT_PEER_CARD_TTL_MS,
    paths: { gameSrcDir, viewPkgDir }
  };
}

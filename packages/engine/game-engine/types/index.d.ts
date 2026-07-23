/** Types for `@zeus/game-engine` (WP-U157). */

export function linkDistance(waypoints: ReadonlyArray<{ x: number; y: number; z?: number }>): number;
export function sampleLink(
  waypoints: ReadonlyArray<{ x: number; y: number; z?: number }>,
  progress: number
): { x: number; y: number; z?: number };

export function createMapEngine(
  scene: Record<string, unknown>,
  initialActors?: Record<string, unknown>
): MapEngine;

export const ZONE_INTEREST_ALL: '*';

export type ZoneInterestInput = string | string[] | Set<string> | null | undefined;

export function normalizeZoneInterest(zones: ZoneInterestInput): Set<string> | null;
export function interestCoversAll(interest: Set<string> | null): boolean;

export function buildZoneIndexFromCatalog(
  catalog: Array<{ id: string; nodeId?: string; barrios?: string[] }> | null | undefined
): {
  zoneByBarrio: Record<string, string>;
  zoneByNode: Record<string, string>;
};

export interface ZoneFilterOpts {
  zoneByBarrio?: Record<string, string>;
  zoneByNode?: Record<string, string>;
  keepUnzoned?: boolean;
}

export function resolveEntityZones(
  entity: object | null | undefined,
  opts?: ZoneFilterOpts
): string[];

export function entityMatchesInterest(
  entity: object | null | undefined,
  interest: Set<string> | null,
  opts?: ZoneFilterOpts
): boolean;

export function filterSnapshotByZones(
  snapshot: object,
  zones: ZoneInterestInput,
  opts?: ZoneFilterOpts
): object;

export function createZoneStateHandler(
  zones: ZoneInterestInput,
  onFiltered: (
    filtered: object,
    meta: { interest: Set<string> | null; raw: object }
  ) => void,
  opts?: ZoneFilterOpts
): (raw: object) => void;

export const vaivenDosNodos: Record<string, unknown>;

export interface MapEngine {
  [key: string]: unknown;
}

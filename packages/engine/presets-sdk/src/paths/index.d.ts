/** Types for `@zeus/presets-sdk/paths` (WP-U156). */

export const DEFAULT_SATELITE_WP: string;
export function normalizeSatRel(satRel?: string): string;
export function wikitextPath(satRel: string, oldid: number | string): string;
export function nodoMetaPath(nodoId: string): string;
export function registroMdPath(
  satRel: string,
  registroId: string,
  oldid: number | string
): string;
export function registrosBrowsePath(satRel: string): string;
export function buildViewDeepLink(opts: {
  viewEntry: object;
  lineaId: string;
  path?: string;
}): string;
export function toViewLinkItem(opts: {
  id: string;
  label: string;
  path: string;
  kind?: string;
  disabled?: boolean;
  title?: string;
  viewEntry?: object;
  lineaId?: string;
}): {
  id: string;
  label: string;
  path: string;
  kind?: string;
  disabled?: boolean;
  title?: string;
  href?: string;
};

export const FIREHOSE_VOLUME_ID: string;
export const TRIAGE_MANIFEST_PATH: string;
export function corpusRelPath(corpusId: string, relativePath?: string): string;
export function buildFirehoseDeepLink(opts: {
  firehoseEntry: object;
  corpus?: string;
  path?: string;
  mode?: string;
}): string;
export function toFirehoseLinkItem(opts: {
  id: string;
  label: string;
  corpus?: string;
  path?: string;
  mode?: string;
  kind?: string;
  disabled?: boolean;
  title?: string;
  firehoseEntry?: object;
}): {
  id: string;
  label: string;
  corpus?: string;
  path?: string;
  mode?: string;
  kind?: string;
  disabled: boolean;
  title?: string;
  href?: string;
};

export const LINEAS_VOLUME_ID: string;
export const MEDIDOR_ETIQUETADOS_REL: string;
export function isLineasCachePath(relPath: string): boolean;
export function resolveLineasBasePath(): string;
export function resolveLineasVolumeRoot(): string;
export function resolveLineasVolumePath(relPath: string): string;
export function resolveLineasLineFilePath(linePath: string, relPath: string): string;
export function resolveLineasSatCacheDir(satDir: string): string;
export function resolveMedidorCasosPath(lineaId?: string): string;

export const FORCES_VOLUME_ID: string;
export function resolveForcesBasePath(): string;
export function resolveForcesVolumeRoot(): string;
export function resolveForcesVolumePath(relPath: string): string;

export const SSB_VOLUME_ID: string;
export function resolveSsbBasePath(): string;
export function resolveSsbVolumeRoot(): string;
export function resolveSsbVolumePath(relPath: string): string;

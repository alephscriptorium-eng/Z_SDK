/** Types for `@zeus/presets-sdk/volumes` (WP-U156). */

export interface VolumeEntry {
  id: string;
  disk?: string;
  path: string | null;
  pathOverride: string | null;
  absPath: string;
  readonly: boolean;
  label: string;
  deferred: boolean;
  corpora: unknown[];
  [key: string]: unknown;
}

export function loadVolumesConfig(): { volumes: Record<string, object> };
export function resolveVolumesRoot(): string;
export function resolveVolume(id: string): VolumeEntry;
export function listVolumes(): string[];
export function resetVolumesCache(): void;

export function sanitizeRelativePath(relativePath: string): string;
export function resolveVolumePath(volume: VolumeEntry, relativePath: string): string;
export function browseVolume(
  volumeId: string,
  relativePath?: string,
  options?: object
): Promise<object>;
export function readVolumeFile(
  volumeId: string,
  relativePath: string,
  options?: object
): Promise<object>;

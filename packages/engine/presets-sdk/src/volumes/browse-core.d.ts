/** Types for `@zeus/presets-sdk/browse-core` (WP-U156). */

export function sanitizeRelativePath(relativePath: string): string;
export function resolveVolumePath(
  volume: { absPath: string; [key: string]: unknown },
  relativePath: string
): string;
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

/** Types for `@zeus/ui-3d-kit/node` — NODE-ONLY path helpers (WP-U156). */

/** Package root (contains package.json). */
export const pkgDir: string;
/** Browser-safe sources — mount with express.static. */
export const srcDir: string;
/** Static assets root. */
export const assetsDir: string;
/** Canonical GLBs from `@zeus/game-engine/node`. */
export const modelsDir: string;
/** three package root, or null if three is not installed. */
export const threeDir: string | null;
/**
 * Root of the installed `three` package (contains build/ and examples/jsm/).
 * @throws if `three` cannot be resolved
 */
export function getThreeDir(): string;

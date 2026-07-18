/**
 * Raíz de Z_SDK-games-library para e2e del monorepo que aún levantan
 * autoridad/demos de juego (WP-U61). Tras publish/U62 puede retirarse.
 *
 * Orden: ZEUS_GAMES_LIBRARY → ../Z_SDK-games-library → fallo explícito.
 */

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export function resolveGamesLibraryRoot() {
  if (process.env.ZEUS_GAMES_LIBRARY) {
    return resolve(process.env.ZEUS_GAMES_LIBRARY);
  }
  const sibling = join(monorepoRoot, '../Z_SDK-games-library');
  if (existsSync(join(sibling, 'packages/delta/arg-domain/package.json'))) {
    return sibling;
  }
  // worktree case: monorepo is .worktrees/wp-… → ../../Z_SDK-games-library
  const fromWorktree = join(monorepoRoot, '../../Z_SDK-games-library');
  if (existsSync(join(fromWorktree, 'packages/delta/arg-domain/package.json'))) {
    return fromWorktree;
  }
  throw new Error(
    'E2E de juego: falta Z_SDK-games-library. ' +
      'Clona el repo hermano o exporta ZEUS_GAMES_LIBRARY=/ruta.'
  );
}

export function gamesPaths() {
  const root = resolveGamesLibraryRoot();
  return {
    root,
    deltaAuthority: join(root, 'packages/delta/arg-demos/apps/authority/index.mjs'),
    deltaTapHorse: join(root, 'packages/delta/arg-demos/apps/tap-horse/index.mjs'),
    deltaConsole: join(root, 'packages/delta/arg-console/src/server.mjs'),
    deltaPlayerMcp: join(root, 'packages/delta/arg-player-mcp/src/start.mjs'),
    deltaCasos: join(root, 'packages/delta/spec/CASOS.md'),
    pozoAuthority: join(root, 'packages/pozo/src/authority.mjs'),
    pozoMcp: join(root, 'packages/pozo/src/player-mcp/start.mjs'),
    pozoRoot: join(root, 'packages/pozo'),
    pozoCasos: join(root, 'packages/pozo/spec/CASOS.md'),
    pozoDomain: join(root, 'packages/pozo/src/domain.mjs')
  };
}

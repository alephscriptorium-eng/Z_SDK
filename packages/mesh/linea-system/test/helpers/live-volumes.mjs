/**
 * Live VOLUMES helpers for mesh linea tests (WP-U102 hermetic CI; tightened
 * WP-U119; dejó de auto-desactivarse en WP-U261).
 * DISK_02/LINEAS live corpus (`espana`) is gitignored / outside monorepo after U62
 * — candado de whitelist en `.gitignore:18-24`: bajo DISK_02/LINEAS sólo entran a
 * git `registry.yaml` y `demo/**`, así que el corpus vivo NO puede llegar a CI.
 * The in-repo registry.yaml only lists the synthetic `demo` fixture — that is NOT
 * enough for startAll()/smoke (they require lineaId `espana`).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveLineasBasePath } from '@zeus/presets-sdk';

/**
 * Absolute DISK_02/LINEAS path for the DECLARED volumes root, or throw.
 *
 * WP-U261 · separa dos condiciones que antes colapsaban en el mismo
 * `return false` de un `catch` mudo:
 *
 *   a) `ZEUS_VOLUMES_ROOT` ausente, o apuntando a algo que no es un root de
 *      LINEAS → **entorno roto**. Se pone ROJO: nadie declaró dónde están los
 *      datos, y omitir aquí es justo el fallo que este WP cierra.
 *   b) root declarado y correcto, pero sin la línea viva `espana`
 *      → **corpus ausente**. Eso sí se omite, y sólo eso.
 *
 * Un guardián que se apaga cuando le quitan la variable que vigila no es un
 * guardián: por eso aquí NO hay try/catch.
 *
 * @returns {string} absolute path to DISK_02/LINEAS
 */
export function requireLineasBasePath() {
  const base = resolveLineasBasePath();
  const registryPath = join(base, 'registry.yaml');
  if (!existsSync(registryPath)) {
    throw new Error(
      `ZEUS_VOLUMES_ROOT declarado pero ${registryPath} no existe — ` +
        'no es un root de VOLUMES con carril de LINEAS (WP-U261).'
    );
  }
  return base;
}

/**
 * True when the host has a live `espana` line registered and present on disk.
 * Lanza si el root ni siquiera está declarado — v. requireLineasBasePath().
 * @returns {boolean}
 */
export function hasLiveLineasRegistry() {
  const base = requireLineasBasePath();
  const yaml = readFileSync(join(base, 'registry.yaml'), 'utf8');
  // Require the live tronco id — demo-only fixture must not enable these tests.
  if (!/(?:^|\n)[ \t]*-[ \t]*id:[ \t]*espana[ \t]*(?:\r?\n|$)/.test(yaml)) {
    return false;
  }
  return existsSync(join(base, 'espana'));
}

/** node:test skip reason when live espana corpus is absent. */
export const SKIP_NO_LIVE_LINEAS =
  '⏳ VOLUMES/DISK_02/LINEAS live id:espana missing — corpus not in repo (CI/worktree; demo fixture alone is insufficient)';

/** node:test skip reason for the complementary (corpus-less) cases. */
export const SKIP_LIVE_LINEAS_PRESENT =
  '⏳ corpus vivo id:espana presente — este caso cubre el escenario contrario y lo asevera el de arriba';

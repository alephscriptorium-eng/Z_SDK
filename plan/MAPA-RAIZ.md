# MAPA-RAIZ — qué hay en la raíz del repo

**WP-U223** (regla #19: «el mundo no tiene mapas» — `plan/BACKLOG.md:297`) · 2026-07-31.
Verificación: `ls -1A` en la raíz del repo → **27 entradas** (todas con fila abajo).
Este mapa **apunta, no duplica**: el detalle de `packages/`, `VOLUMES/`, `docs/`,
`scripts/` y `e2e/` está en `plan/MAPA-REPO.md`; la zona de obra en `plan/MAPA-TALLER.md`.

| entrada | qué es | quién la posee/toca |
| --- | --- | --- |
| `.changeset/` | config de Changesets (`config.json`: `commit:false`, `access:restricted`) para versionado de releases | flujo release (§2 GOBIERNO: `release.yml` → U212 · U239 · U238) |
| `.env` | valores locales `ZEUS_*` **trackeados** (`git ls-files .env` lo lista) | derivado de la fuente única de env `packages/engine/presets-sdk/src/env/index.mjs` (MATRIZ §Convenciones); U227 lo hará generado |
| `.env.example` | plantilla comentada de variables `ZEUS_*` («copy to .env and adjust») | ídem `.env` |
| `.git` | metadatos git del worktree | — |
| `.github/` | workflows CI/CD (4 yml) — filas por workflow en `plan/MAPA-TALLER.md` §CI | calientes §2 GOBIERNO: `ci.yml` U221·U241·U213 · `release.yml` U212·U239·U238 |
| `.gitignore` | exclusiones; incluye el espejo `.claude/skills/` (GOBIERNO :415-417, contexto U147) | custodio Z |
| `.npmrc` | scopes `@alephscript` y `@zeus` → registry `npm.scriptorium.escrivivir.co` | publicación (allowlist WP-U162, `plan/PUBLISH-ALLOWLIST.md`) |
| `.prettierignore` | exclusiones de formato | tooling raíz — sin WP activo |
| `.prettierrc` | config de formato | tooling raíz — sin WP activo |
| `.vscode/` | `mcp.json` + `tasks.json` (integración IDE local) | tooling raíz — sin WP activo |
| `CHANGELOG.md` | changelog del monorepo (flujo changesets) | flujo release |
| `LICENSE.md` | licencia del repo | U237 (§2 GOBIERNO: único WP que toca el campo `license` en ola 1) |
| `README.md` | portada: ZEUS SDK, contrato `state/intent/track/ledger`, layout engine·editor·mesh·examples | custodio Z |
| `SCRIPTORIUM_SKINS.png` | imagen embebida por `README.md:12` | — |
| `VOLUMES/` | fixtures sintéticos para CI/smoke (post WP-U62); datos vivos fuera vía `ZEUS_VOLUMES_ROOT` — filas en `plan/MAPA-REPO.md` | carril D (§2 GOBIERNO: U199 · U202 · U203 · U231 · U240 · U71R) |
| `data/` | `data/seeds/aleph-presets.json`, cargado por `npm run seed:aleph` (`package.json:84` → `scripts/seed-aleph-presets.mjs`) | — |
| `docs/` | sitio VitePress (build `docs:build` `package.json:74`) — filas en `plan/MAPA-REPO.md` | Lane E · canal y verdad de la documentación (BACKLOG :269-279) |
| `e2e/` | demos/aceptación por escenario, invocados por `e2e:*` (`package.json:91-124`) — filas en `plan/MAPA-REPO.md` | por escenario (p. ej. `peer-card-chain.mjs` → U186, GOBIERNO :133) |
| `eslint.config.mjs` | config de lint raíz | tooling raíz — sin WP activo |
| `examples/` | 4 dirs: 2 workspaces (`@zeus/game-demos`, `@zeus/ping-pong-bots`) + 2 consumidores sin manifest ejercitados por smoke (MATRIZ §Denominador, excluidos con motivo) | — |
| `package-lock.json` | lockfile npm | U239 (§2 GOBIERNO: lock) |
| `package.json` | manifest raíz: `workspaces` (`:6-11`) + panel de scripts npm | **caliente** §2 GOBIERNO: U237 (ola 1, solo `license`) · U234 (ola 2) · U213 (ola 8); U233 no lo toca |
| `packages/` | las piezas del runtime en 3 grupos (engine 26 · editor 1 · mesh 21) — filas en `plan/MAPA-REPO.md`; denominador canónico en `plan/MATRIZ-RUNTIME-51.md` | por pieza (MATRIZ) |
| `plan/` | zona de obra del swarm (backlog, gobierno, reportes) — filas en `plan/MAPA-TALLER.md` | custodio Z (orquestador) |
| `scripts/` | operación a nivel repo (gates, smoke, spec, release, estación) — filas en `plan/MAPA-REPO.md` y `plan/MAPA-TALLER.md` | por script (ver mapas) |
| `sincronia/` | buzón inter-carril: `BUZON.md` · `DRAFT.md` · `TIMBRE.md` · `notas/` | vigía/operador del carril **Z**, único que escribe (`sincronia/BUZON.md`) |
| `test/` | tests a nivel repo: `test/gates/gates.test.mjs` (`test:gates` `package.json:82`) + `test/release/release-u53.test.mjs` | gates → Lane G · release → flujo release |

---

Gate de este mapa: propuesta en `plan/MAPA-TALLER.md` §«Propuesta de gate `verificar-territorio-mapa`».

**entrada sin fila = FAIL** — todo lo nuevo en este territorio añade su fila en el mismo cambio.

✎ orquestador (2026-07-31): en checkouts VIVOS aparecen además entradas
gitignoradas de runtime (`node_modules/`, `.claude/` espejo de skills —
contexto U147, logs de estación). No son territorio del repo: el gate debe
medir contra `git ls-files` / worktree limpio, no contra `ls` del checkout.

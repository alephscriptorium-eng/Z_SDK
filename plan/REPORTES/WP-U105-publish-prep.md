# WP-U105 · publish-prep — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U105) |
| fecha | 2026-07-18 |
| rama | `wp/u105-publish-prep` |
| commit(s) | `ece9074` fix(release) · `fe1ee3e` chore(release): version packages · `f650ad6` docs(plan): reporte |
| estado propuesto | listo para revisión |

## Qué se hizo

Se dejó el release de `engine/*` listo **sin publish real** (D-22 frente 2 / política swarm).

1. `npm run release:dry` fallaba solo en `@zeus/linea-kit` por el export `./schemas/*` (el verificador trataba el `*` como path literal). Se añadió `exportTargetInTarball` en `scripts/release-dry.mjs` + test.
2. Tras el fix: `release:dry` verde (19/19) y `release:changeset-dry` verde (bump + pack + restore).
3. Se aplicó `npm run version-packages` de verdad: 19 changesets pendientes consumidos → bumps + `CHANGELOG.md` en 18 paquetes engine (`@zeus/rooms` quedó en `0.1.0` sin changeset). Árbol de versión local listo para merge; **PR remoto / publish = ⏳ ops**.

## Archivos tocados

- `scripts/release-dry.mjs` — modificado: wildcards en verificación de `exports`
- `test/release/release-u53.test.mjs` — modificado: test wildcard + CA árbol versión (ya no exige changeset pendiente)
- `.changeset/wp-u*.md` (19) — borrados: consumidos por `changeset version`
- `packages/engine/*/package.json` (18) — modificado: bumps semver
- `packages/engine/*/CHANGELOG.md` (18) — creados: changelog por paquete
- `plan/REPORTES/WP-U105-publish-prep.md` — creado: este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### `npm run test:release` — verde (6/6)

```
# tests 6
# pass 6
# fail 0
```

### `npm run release:dry` — verde tras fix + tras version tree

Antes del fix (1/19 failed):

```
pack @zeus/linea-kit@0.1.0 … FAIL
  - exports target missing from tarball: ./schemas/*
release:dry — 1/19 failed
```

Después del fix / con versiones bumpeadas:

```
release:dry — 19 publicable package(s), 4 distinct version(s)
registry: https://npm.scriptorium.escrivivir.co
…
pack @zeus/linea-kit@0.2.0 … ok (42 entries, zeus-linea-kit-0.2.0.tgz)
…
release:dry — all 19 green
```

### `npm run release:changeset-dry` — verde (antes de consumir changesets)

```
pending changesets (19):
  - wp-u102-ci-hermetic-tests.md
  … (19 archivos)
→ changeset version
🦋  All files have been updated. Review them and commit at your leisure
…
→ release:dry (npm pack + verify)
…
release:changeset-dry — green (bump + changelog + pack; publish skipped)
⏳ npm publish / git tag / GitHub Release: only from CI with NPM_TOKEN
```

### `npm run version-packages` — árbol local aplicado

Bumps resultantes (muestra):

| paquete | versión |
| ------- | ------- |
| `@zeus/protocol` | 0.2.0 |
| `@zeus/linea-kit` | 0.2.0 |
| `@zeus/app-shell` | 0.2.0 |
| `@zeus/authority-kit` | 0.2.0 |
| `@zeus/feed-kit` | 0.3.0 |
| `@zeus/volumes-ops` | 0.2.0 |
| `@zeus/webrtc-signaling` | 0.2.0 |
| `@zeus/presets-sdk` (+ varios patch) | 0.1.1 |
| `@zeus/rooms` | 0.1.0 (sin changeset; sin bump) |

### `npm run lint` — exit 0 (12 warnings preexistentes, 0 errors)

### `npm run gates` — `gates: OK (0 offenders)`

### ⏳ Publish real (ops) — **no es CA del swarm**

- Registry D-7: `https://npm.scriptorium.escrivivir.co`
- Secret `NPM_TOKEN` en GitHub Actions (`.github/workflows/release.yml` ya gated)
- Tras merge a `main` + token: `changesets/action` puede `npm publish` + tag + GitHub Release
- Desbloquea **WP-U55** (demoler `file:` en operator-ui)
- **No** se publicó nada en este WP; **no** se configuró token; **no** push

### Árbol / PR de versión

- Árbol local: commit `fe1ee3e` en `wp/u105-publish-prep` (listo para merge por orquestador)
- PR remoto `chore(release): version packages`: ⏳ sin push worker (orquestador/ops)

### Efecto visible

N/A (prep de release; sin UI). Pack local verificado vía `release:dry`.

## Demolición

n/a (prep; no dos caminos de release). No se demuele el pipeline U53; solo se desbloquea el dry que bloqueaba la cola residual linea-kit `exports ./schemas/*`.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: registry ya canónico en `release-dry.mjs` (`npm.scriptorium.escrivivir.co`); sin nuevos hardcodes
- [x] Cadenas if/switch que debieron ser tabla: no; helper `exportTargetInTarball` puntual
- [x] Duplicación con otros paquetes (busqué antes de responder): no; fix en el verificador existente
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa (grep arriba): n/a
- [x] Tests prueban comportamiento, no solo «no explota»: test con tarball sintético ok/fail para `./schemas/*`
- [x] Arranque real verificado: `release:dry` + `release:changeset-dry` (no publish)
- [x] README/specs del paquete siguen siendo verdad: linea-kit README ya documentaba `schemas/*`; sin cambio de contrato
- [x] El diff contiene solo el alcance del WP: fix dry + version tree + reporte; sin U55 / sin publish / sin BACKLOG

## Hallazgos fuera de alcance

- `changeset version` avisa: `@zeus/operator-ui` deps `file:` vs versiones semver — esperado; **U55** tras publish real.
- `@zeus/rooms` sin changeset acumulado → sigue en `0.1.0` en este árbol (ok).
- Durante `release:changeset-dry`, bins (`jetstream-sync`, `linea-kit`, `run-playbook`) aparecieron dirty por CRLF sin diff de contenido; restaurados con `git checkout`. Cola residual Windows CRLF (U95/higiene) sigue viva.
- Lint: 12 warnings preexistentes ajenos a este WP (no tocados).

## Dudas / bloqueos

Ninguno de diseño. Ops residual (no bloquea aceptación del prep):

1. ¿Merge de este árbol de versión a `main` antes de tener `NPM_TOKEN`, o esperar token y dejar que CI cree el Version PR? (este WP entregó el árbol local ya consumido — si se prefiere Version PR automático, habría que no mergear `fe1ee3e` y solo mergear el fix `ece9074`; el orquestador decide.)
2. Publish real gated: registry vivo + `NPM_TOKEN`.

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** — orquestador / 2026-07-18. **No** merge a
`main` / **no** push / **no** ✅ BACKLOG en este paso (pedido explícito).
Autoriza merge completo a `main` cuando el usuario lo pida; BACKLOG
🔶→✅ solo en `main` al cerrar.

### Decisión árbol `fe1ee3e` (duda worker)

**Merge completo** (`ece9074` fix + `fe1ee3e` version tree + docs).

Criterio: el brief/CA pide «árbol/PR de versión changesets listo para
merge», no solo dry-run sin bumpear. Versión local en `main` sin publish
está OK (publish sigue gated ops/`NPM_TOKEN`). **No** split: no dejar
solo el fix para que CI cree Version PR — el árbol ya consumió los 19
changesets; split rompería la CA «árbol listo».

### Verificado

- **Base:** rama detrás de `main` (U60/U106) → merge limpio
  `988c51b merge(main): sync before WP-U105 review` (docs/Pages +
  reportes; sin conflicto de producto release).
- **Alcance** `main...HEAD` (post-sync): `scripts/release-dry.mjs` +
  test wildcard; 19 changesets consumidos; bumps + CHANGELOG en 18
  engine; reporte. Worker **no** tocó `plan/BACKLOG.md` ni backlog
  delta. Sin U55 / sin publish / sin push.
- **Commits** convencionales: `fix(release)`, `chore(release)`,
  `docs(plan)` ×2 (+ merge sync).
- **Demolición:** n/a. PRACTICAS: fix puntual en verificador; auto-
  revisión §3 honesta; ⏳ publish ops documentado.

### CA (re-ejecutados en worktree, 2026-07-18 post-merge main)

| CA | Resultado |
| -- | --------- |
| `release:dry` verde | OK — 19/19 green (incl. `@zeus/linea-kit@0.2.0` / `./schemas/*`) |
| Árbol/PR versión listo | OK — bumps+CHANGELOGs en tip; PR remoto ⏳ (sin push worker) |
| Reporte ⏳ publish ops | OK — registry D-7 + `NPM_TOKEN` / desbloquea U55 |
| `test:release` | OK — 6/6 pass (wildcard + árbol versión) |
| `release:changeset-dry` | Esperado exit 1 post-consume («No pending changesets»); verde en evidencia worker **antes** de `fe1ee3e` |

### Merge sugerido

1. Merge **completo** `wp/u105-publish-prep` → `main` (ambos commits
   producto + docs; no cherry-pick solo `ece9074`).
2. Tras merge: ✅ BACKLOG U105 en `main`; `git worktree remove` del
   árbol U105.
3. Ops: `NPM_TOKEN` + registry → publish real → desbloquea **U55**.
4. Sin push en esta revisión.

### Acción siguiente

Usuario: autorizar merge completo a `main` + ✅ BACKLOG (paso aparte).
Push: no intentado.

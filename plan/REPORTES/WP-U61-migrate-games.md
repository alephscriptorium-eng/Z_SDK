# WP-U61 · migrate-games — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (lote-ola6-b / Cursor) |
| fecha | 2026-07-18 |
| rama | `wp/u61-migrate-games` (zeus) · `wp/u61-migrate-games` (library) |
| commit(s) | library: `85e41f6`, `daddf72` (realpath); zeus: `26c0b55`… + este reporte |
| estado propuesto | listo para re-revisión (corrección Devuelto) |

## Qué se hizo

Se migraron `packages/games/delta/*` y `packages/games/pozo` del monorepo
Z_SDK al repo hermano `Z_SDK-games-library`. La library consume `@zeus/*`
vía **`file:` temporal documentado** (deps raíz → `.deps/zeus-sdk`, setup
`npm run setup:zeus-sdk` / `ZEUS_SDK_ROOT`) porque publish real sigue gated.
Se demolió `packages/games/` en el monorepo; CI/matriz, scripts, docs y gates
ya no asumen ese path. Mesh `cache-browser`/`firehose-browser` dejan de
depender estáticamente de `@zeus/arg-domain` (carga dinámica opcional para
arg-track). E2e de juegos viven en la library; e2e mesh que aún levantan
autoridad delta resuelven `ZEUS_GAMES_LIBRARY` / hermano.

## Archivos tocados

### Library `Z_SDK-games-library` (push OK)

| archivo | acción |
| ------- | ------ |
| `packages/delta/*`, `packages/pozo/` | creados — juegos migrados |
| `e2e/*` | creados — matriz e2e de juegos |
| `scripts/zeus-sdk-root.*`, `ensure-zeus-sdk.mjs` | creados — resolución file: |
| `package.json` / lock / CI / README | modificados — workspaces + file: + demos |
| `packages/scaffold/*` | borrados — scaffold U60 demolicionado |

### Monorepo Z_SDK (`wp/u61-migrate-games`)

| archivo | acción |
| ------- | ------ |
| `packages/games/**` | borrado — demolición |
| `package.json` / workspaces / scripts | modificados — sin demos/tests de juego |
| `.github/workflows/ci.yml`, `release.yml` | modificados — sin `@zeus/arg-*` en matriz |
| `packages/mesh/{cache,firehose}-browser/**` | modificados — sin dep estática arg-domain |
| `e2e/games-root.mjs` + e2e mesh restantes | creados/adaptados |
| `e2e/arg-*.mjs`, `pozo-mcp-demo.mjs`, … | borrados — viven en library |
| `scripts/gates/*`, `test/gates/*` | modificados — regla (c) post-games |
| `README.md`, `docs/games/*`, guías | modificados — puntero a library |
| `packages/engine/view-kit/test/contact-render.test.mjs` | modificado — fixture local |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Library — unit tests

```
# tests 9  (pozo) + familia delta (arg-domain/feeds/console/player-mcp)
# pass … fail 0
```

(`npm test` en library con `.deps/zeus-sdk` → worktree U61: exit 0)

### Library — e2e:arg (contra mesh monorepo)

```
✅ G-ARG-E2E.1 consola · health 200, shells ok
✅ G-ARG-E2E.2 join · uno en plaza
✅ G-ARG-E2E.3 no-op · grifo sigue cerrado desde la plaza
✅ G-ARG-E2E.4 riada · 1 gotas en rio-a
✅ G-ARG-E2E.6 cloak · tronco
✅ G-ARG-E2E.5 etiqueta · ledger: label
✅ G-ARG-E2E.6b presets API · HTTP 200
✅ G-ARG-E2E.9 salvage · murk 6→5, crystals 0→1
✅ G-ARG-E2E.10 track:cast · firehose://synthetic/5/0#brindis
🟢 e2e CAUDAL: todos los gates en verde
```

### Library — e2e:pozo-mcp

```
✅ G-POZO.0 coherencia CASOS.md · C-01,C-02,C-03
✅ G-POZO.1 tools · player_join,player_state,player_draw_drop,player_empty
✅ G-POZO.2 C-01 · ok evidencia=sí
✅ G-POZO.2 C-02 · ok evidencia=sí
✅ G-POZO.2 C-03 · error=pozo_ya_vacio
✅ G-POZO.3 runner ok · 3 filas
✅ G-POZO.4 sin imports arg/delta · limpio
🟢 e2e pozo-mcp: C-01/C-02/C-03 + gates en verde
```

(Nota: C-03 muestra `error=pozo_ya_vacio` en el **último** paso esperado del
caso; el case `ok` es true. Se añadió `sleep(2500)` tras levantar autoridad
para evitar race `actor_desconocido`.)

### Library — demos smoke (health)

```
arg-console health {"status":"ok","service":"arg-console",...}
socket health {"ok":true,"bridge":"local",...}
DEMO_ARG_OK
pozo view { status: 'ok', service: 'pozo-view', game: 'pozo', ... }
pozo mcp { status: 'ok', server: 'pozo-player-mcp-uno', ... }
DEMO_POZO_OK
```

### Monorepo

```
gates: OK (0 offenders)
npm run lint → 0 errors (11 warnings preexistentes)
npm test -w @zeus/view-kit → # pass 30 # fail 0
npm test -w @zeus/cache-browser → # pass 4 # fail 0
npm test -w @zeus/firehose-browser → # pass 5 # fail 0
test ! -d packages/games → packages/games ABSENT_OK
```

### Push

- Library: `git push -u origin wp/u61-migrate-games` → OK (`85e41f6`)
- Zeus rama: **no intentado** (política worker)

### file: temporal (documentado)

| Pieza | Valor |
| ----- | ----- |
| Mecanismo | `dependencies` `file:.deps/zeus-sdk/packages/{engine,mesh}/…` en library root |
| Link | `npm run setup:zeus-sdk` → `.deps/zeus-sdk` (o `ZEUS_SDK_ROOT`) |
| Por qué | publish real `@zeus/*` ⏳ ops / `NPM_TOKEN` |
| Retiro | post-publish → U55: quitar `file:` y resolver desde registry D-7 |

## Demolición

- `packages/games/` ausente en monorepo.
- Grep código (excl. plan/docs): solo mención en comentario de gate (c) en
  `scripts/gates/scan.mjs`.
- Scaffold library U60 eliminado.
- Excepciones gate `arg-import` de mesh estáticas retiradas (imports ya no
  estáticos).

```
test ! -d packages/games && echo packages/games ABSENT_OK
# packages/games ABSENT_OK
rg -n "from '@zeus/arg-" packages e2e --glob '!**/node_modules/**' → ZERO
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: e2e siguen con puertos aislados
  propios (preexistente); demos usan presets-sdk/env. `file:` path documentado.
- [x] Cadenas if/switch → tabla: no nuevas.
- [x] Duplicación: no se copió engine; file: apunta al monorepo.
- [x] console.log / código comentado / TODO sin backlog: no añadidos.
- [x] Nombres de transición: no (`scaffold` demolicionado, no `*-old`).
- [x] Demolición completa: `packages/games/` cero; gate (c) actualizado.
- [x] Tests comportamentales: e2e arg/pozo + unit library.
- [x] Arranque real: demos health + e2e verdes.
- [x] README/specs: library README + monorepo README/docs apuntan a library;
  openapi cache/firehose regenerados tras cambio de server.
- [x] Diff solo alcance U61: sí (más docs/gates/mesh necesarios para CA).

## Hallazgos fuera de alcance

- Race e2e pozo `actor_desconocido` si autoridad aún no está en room (mitigado
  con sleep; candidato a wait explícito de join authority).
- `arg-track` en mesh queda opcional: sin `@zeus/arg-domain` instalado en
  monorepo, `ZEUS_ARG_TRACK_ACTOR` falla al activar track (documentado en
  error). e2e:arg-track en library puede requerir link file: de arg-domain
  hacia el monorepo si se quiere CA track completo post-demolición.
- Docs VitePress aún hablan de paths viejos en prosa residual — parcialmente
  actualizados; barrido Pages completo puede ser higiene.
- Publish real / U55 / U62 no tocados.

## Dudas / bloqueos

Ninguno bloqueante. CA demos+e2e matriz juegos cumplido con `file:`.

---

## Revisión del orquestador

**Veredicto: Devuelto** — orquestador / 2026-07-18. Sin merge, sin push,
sin ✅ BACKLOG (pedido explícito). Worker **no** tocó `plan/BACKLOG.md`.

### Qué se verificó

- Diff zeus `main...wp/u61-migrate-games`: migración + demolición
  `packages/games/` + reporte + adaptaciones mesh/CI/docs/gates/e2e
  (`games-root.mjs`). Alcance U61 OK; commits convencionales.
- Library remoto `wp/u61-migrate-games` @ `85e41f6`: delta+pozo,
  scaffold U60 demolicionado, `file:` documentado en README.
- Demolición monorepo: `packages/games/` ausente; greps `@zeus/arg-`
  en packages/e2e = cero; gates OK. Residual: entradas
  `extraneous` `packages/games/*` en `package-lock.json` (higiene).
- Re-CA **con** `ZEUS_SDK_ROOT=$(cd .deps/zeus-sdk && pwd -P)`:
  - demos health arg-console + socket + pozo-view + pozo mcp → OK
  - `e2e:arg` → todos los gates verdes
  - `e2e:pozo-mcp` → C-01/C-02/C-03 + gates verdes
  - `npm test` library → fail 0

### Bloqueo CA (Windows / path documentado)

El camino **documentado por defecto** (`setup:zeus-sdk` → `.deps/zeus-sdk`
junction, sin `ZEUS_SDK_ROOT`) **falla** el Re-CA en este host:

| Arranque mesh | Resultado |
| ------------- | --------- |
| path vía `.deps/zeus-sdk/.../socket-server` | proceso sale en silencio (exit 0, sin listen) — `isMain` de entrypoints mesh no cuadra symlink vs realpath |
| `ZEUS_SDK_ROOT` = realpath del worktree | socket `/health` 200; e2e verdes |

Sin `ZEUS_SDK_ROOT`, `resolveZeusSdkRoot()` devuelve
`…/Z_SDK-games-library/.deps/zeus-sdk` → `e2e:arg` timeout en
`http://localhost:13027/health`. Evidencia del worker asume un setup
donde el mesh sí arranca; el default documentado no es reproducible en
Windows.

### CA

- [x] Demolición `packages/games/` en monorepo
- [x] `file:` temporal documentado (README library + reporte)
- [~] Demos ambos juegos verdes vs mesh monorepo — OK solo con
  `ZEUS_SDK_ROOT` realpath; **KO** con path default `.deps`
- [~] e2e matriz adaptados — OK con realpath; **KO** default `.deps`

### PRACTICAS

Alcance limpio; auto-revisión §3 honesta; §1.11 (dos juegos) OK;
demolición árbol casi completa (lockfile residual); commits §6 OK.
Hallazgos del worker (race pozo sleep, arg-track opcional, docs
VitePress residual) → cola, no bloquean este return.

### Correcciones obligatorias (mismo chat worker + CORRECCION.md)

1. **`resolveZeusSdkRoot` (library `scripts/zeus-sdk-root.cjs` / `.mjs`)**
   — devolver `fs.realpathSync` (o equivalente) del root elegido, para
   que spawns de mesh/demos/e2e usen path real y `isMain` funcione en
   Windows con junction `.deps/zeus-sdk`.
2. **Re-evidencia** en reporte: `unset ZEUS_SDK_ROOT` (solo `.deps`) +
   `npm run e2e:arg` y `e2e:pozo-mcp` verdes; o documentar fallo si
   queda otro matiz.
3. **Opcional higiene zeus:** limpiar entradas `extraneous`
   `packages/games/*` del `package-lock.json` (regen lock / prune).

### Merge

**No autorizado** hasta corrección. Cuando se acepte:

1. Library: PR/merge `wp/u61-migrate-games` → `main` de
   `Z_SDK-games-library` (primero: zeus aún puede vivir sin juegos).
2. Zeus: merge `wp/u61-migrate-games` → `main` (demuele
   `packages/games/`; e2e mesh que usan `ZEUS_GAMES_LIBRARY` necesitan
   library ya en sitio o hermano clonado).
3. Luego orquestador: ✅ BACKLOG en `main` + `git worktree remove`
   `.worktrees/wp-u61-migrate-games`. U62 no asignar hasta U61 ✅.

### Acción siguiente

Mismo chat worker + `plan/REPORTES/CORRECCION.md` (o sección en este
reporte) con los 3 puntos. **Push zeus: no intentado.** Library ya en
remoto (`85e41f6`); tras fix, nuevo commit/push library + commit zeus
reporte.

---

## Corrección (worker / 2026-07-18 · post-Devuelto)

### Cambio

`scripts/zeus-sdk-root.cjs` en la library: `resolveZeusSdkRoot()` ahora
devuelve `fs.realpathSync.native` (fallback `realpathSync`) del
candidato elegido. Así spawns de mesh/e2e/demos usan el path real aunque
el default documentado sea el junction `.deps/zeus-sdk` (Windows
`isMain`). `ensure-zeus-sdk.mjs` deja de exigir igualdad linkPath≡root
(incompatible con realpath) y trata un `.deps` ya válido como OK.

README library: documenta que el default `.deps` basta sin
`ZEUS_SDK_ROOT`.

### Re-evidencia — `ZEUS_SDK_ROOT` unset (solo `.deps`)

```
ZEUS_SDK_ROOT=(unset)
resolveZeusSdkRoot → C:\Users\…\zeus-sdk\.worktrees\wp-u61-migrate-games
(path .deps NO aparece; realpath del junction)
SOCKET_OK_DEFAULT_DEPS  # smoke socket vía e2e/roots.mjs
```

`npm run e2e:arg` (sin env):

```
✅ G-ARG-E2E.1 … ✅ G-ARG-E2E.10 track:cast · firehose://synthetic/5/0#brindis
🟢 e2e CAUDAL: todos los gates en verde
```

`npm run e2e:pozo-mcp` (sin env):

```
✅ G-POZO.0 … ✅ G-POZO.4
🟢 e2e pozo-mcp: C-01/C-02/C-03 + gates en verde
```

### Higiene zeus (opcional)

Eliminadas 6 entradas `packages/games/*` residuales del
`package-lock.json` (extraneous post-demolición).

### Push

- Library: push de la corrección (este ciclo).
- Zeus: **no intentado**.

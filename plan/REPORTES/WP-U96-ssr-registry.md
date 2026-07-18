# WP-U96 · ssr-registry — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (subagent) |
| fecha | 2026-07-18 |
| rama | `wp/u96-ssr-registry` |
| commit(s) | `bd4d00c` feat(app-shell): registro SSR compartido en ssr-view-registry; `bbecc01` refactor(arg-console,3d-monitor)!: consumen ssr-view-registry |
| estado propuesto | listo para revisión |

## Qué se hizo

Se extrajo `defineView` / `createViewRegistry` / `renderViewLayout` a
`@zeus/app-shell/ssr-view-registry` (hogar natural: ambos consumidores ya
dependían de app-shell; no se inventó paquete nuevo). Se unificaron las
divergencias ES/EN y de layout (`logPanelPlacement: 'stage' | 'split'`,
tabla `LOG_PANEL_BODY`; `defaultRoom`; themes opcionales). arg-console y
3d-monitor importan el módulo compartido. Se demolieron ambas copias
`src/view-kit/index.mjs`. Changeset minor en `@zeus/app-shell`.

¿pozo puede consumir esto tal cual? Sí: el módulo es genérico (descriptor +
hyperaxe + template), sin conceptos de delta/pozo.

## Archivos tocados

- creado `packages/engine/app-shell/src/ssr-view-registry.mjs` — impl única SSR
- creado `packages/engine/app-shell/test/ssr-view-registry.mjs` — tests de comportamiento
- creado `.changeset/wp-u96-ssr-registry.md` — bump minor app-shell
- modificado `packages/engine/app-shell/package.json` — export `./ssr-view-registry` + dep hyperaxe
- modificado `packages/engine/app-shell/src/index.mjs` — re-export
- modificado `packages/engine/app-shell/README.md` — documenta el export
- modificado `package-lock.json` — hyperaxe en app-shell
- modificado `packages/games/delta/arg-console/src/views/registry.mjs` — import compartido
- modificado `packages/mesh/3d-monitor/src/views/registry.mjs` — import + `logPanelPlacement: 'split'` en bots-log
- modificado `packages/*/src/server.mjs` (arg-console, 3d-monitor) — comentarios
- modificado `packages/mesh/3d-monitor/README.md` — apunta a ssr-view-registry
- borrado `packages/games/delta/arg-console/src/view-kit/index.mjs`
- borrado `packages/mesh/3d-monitor/src/view-kit/index.mjs`

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### CA: una sola implementación

```
$ rg -l "defineView|createViewRegistry|renderViewLayout" packages --glob '!node_modules'
packages\engine\app-shell\test\ssr-view-registry.mjs
packages\engine\app-shell\src\ssr-view-registry.mjs
packages\engine\app-shell\README.md
packages\engine\app-shell\src\index.mjs
packages\mesh\3d-monitor\README.md
packages\mesh\3d-monitor\src\views\registry.mjs
packages\games\delta\arg-console\src\views\registry.mjs
```

Impl única: `packages/engine/app-shell/src/ssr-view-registry.mjs`. Consumidores solo importan.

### CA: `*view-kit*` deja de dar 3 rutas con la misma API

```
$ find packages -type d -name view-kit
packages/engine/view-kit
```

Solo queda el kit **browser** `@zeus/view-kit` (API distinta: scene/HUD/room;
sin `defineView`). Cero `*/src/view-kit/` con la API SSR.

```
$ rg -n "from ['\"].*ssr-view-registry|from ['\"].*view-kit/index" packages --glob '!node_modules'
packages\mesh\3d-monitor\src\views\registry.mjs:11:import { defineView, createViewRegistry, renderViewLayout } from '@zeus/app-shell/ssr-view-registry';
packages\engine\app-shell\test\ssr-view-registry.mjs:7:} from '../src/ssr-view-registry.mjs';
packages\engine\app-shell\src/index.mjs:4:export { defineView, createViewRegistry, renderViewLayout } from './ssr-view-registry.mjs';
packages\engine\app-shell\README.md:9:import { defineView, createViewRegistry, renderViewLayout } from '@zeus/app-shell/ssr-view-registry';
packages\games\delta\arg-console\src\views\registry.mjs:10:import { defineView, createViewRegistry, renderViewLayout } from '@zeus/app-shell/ssr-view-registry';
```

### CA: SSR ambos consumidores verde

```
$ npm test -w @zeus/app-shell
# tests 9
# pass 9
# fail 0

$ npm run test:arg-console
# tests 32
# pass 32
# fail 0

$ npm test -w @zeus/3d-monitor
# tests 15
# pass 14
# fail 1
not ok 8 - gamemap room resolution: fallback PUBLIC_ROOM < env < ?room=
  error: 'ZEUS_SCRIPTORIUM_ROOM must beat the view fallback'
```

El fail #8 es **preexistente** (reproducido en la misma rama con stash de
nuestros cambios; ver hallazgos). Resto de SSR 3d-monitor verde (incl.
bots-log DOM panel).

```
$ npm run lint
✖ 12 problems (0 errors, 12 warnings)
```

(sin errores nuevos del WP; warnings preexistentes en otros paquetes)

```
$ npm run release:changeset-dry
pack @zeus/app-shell@0.2.0 … ok
…
pack @zeus/linea-kit@0.2.0 … FAIL
  - exports target missing from tarball: ./schemas/*
release:changeset-dry — release:dry failed (tree restored)
```

Nota: el dry **restaura** `package.json` al fallar; hubo que reaplicar el
export de app-shell. Fallo linea-kit preexistente (no de este WP).

- Vista humana demos: `⏳ sin verificar` (brief: headless; `ZEUS_OPEN_BROWSER` opt-in no usado).

## Demolición

Borradas las dos copias SSR:

- `packages/games/delta/arg-console/src/view-kit/index.mjs`
- `packages/mesh/3d-monitor/src/view-kit/index.mjs`

```
$ ls packages/games/delta/arg-console/src/view-kit
ls: cannot access '.../src/view-kit': No such file or directory

$ ls packages/mesh/3d-monitor/src/view-kit
ls: cannot access '.../src/view-kit': No such file or directory

$ find packages -type d -name view-kit
packages/engine/view-kit
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no en el módulo nuevo (solo
      `/assets/css/viewer.css` como en las copias originales).
- [x] Cadenas if/switch que debieron ser tabla: `LOG_PANEL_BODY` es tabla.
- [x] Duplicación con otros paquetes: busqué; las dos copias eran la
      duplicación; ahora una en app-shell.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: `ssr-view-registry` evita
      colisión con `view-kit`; sin v2/old/new/legacy.
- [x] Demolición completa (grep arriba): sí.
- [x] Tests prueban comportamiento, no solo «no explota»: defineView
      valida, registry rechaza duplicados, layout stage vs split, inject
      viewer-config.
- [ ] Arranque real verificado: `⏳ sin verificar` (solo unit/server tests
      de paquetes; no se levantó demo con browser).
- [x] README/specs del paquete siguen siendo verdad: app-shell + 3d-monitor
      README actualizados.
- [x] El diff contiene solo el alcance del WP: sí (no U94/U93/BACKLOG).

## Hallazgos fuera de alcance

1. **Preexistente:** `3d-monitor` test `gamemap room resolution…` falla:
   `ZEUS_SCRIPTORIUM_ROOM must beat the view fallback`.
   `resolveViewerConfig` solo aplica `fallbackRoom` cuando el env no está
   seteado; cuando sí lo está, delega en `resolveRoomClientConfig`, que
   lee `ZEUS_ARG_ROOM` / default de juego — **no** `ZEUS_SCRIPTORIUM_ROOM`.
   Reproducido también con el WP stasheado (no causado por U96).
2. **Preexistente:** `npm run release:changeset-dry` falla en
   `@zeus/linea-kit` (`exports ./schemas/*` missing from tarball) y al
   fallar **restaura** el working tree (puede revertir edits a
   package.json mid-WP).
3. Colisión léxica residual solo de nombre de ruta estática `/view-kit`
   (browser) — intencional y documentada; no es la API SSR.

## Dudas / bloqueos

Ninguno que bloquee aceptación del CA de U96. El fail gamemap es ajeno;
¿abrir WP de higiene para alinear `resolveViewerConfig` /
`resolveRoomClientConfig` con `ZEUS_SCRIPTORIUM_ROOM`?

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** (orquestador / 2026-07-18)

Merge `master`→rama antes de re-CA: `e5a2fec` (U94 ✅ integrado; sin conflictos).

### CA re-verificados (post-merge)

- [x] **Una sola implementación** — `defineView` / `createViewRegistry` /
  `renderViewLayout` solo en
  `packages/engine/app-shell/src/ssr-view-registry.mjs` (+ test/README/re-export).
  Consumidores solo importan `@zeus/app-shell/ssr-view-registry`.
- [x] **`*view-kit*` deja de dar 3 rutas con la misma API** — solo queda
  `packages/engine/view-kit` (browser `@zeus/view-kit`, API distinta). Cero
  `*/src/view-kit/` SSR. Diff: `R065` 3d-monitor→app-shell + `D` arg-console.
- [x] **SSR ambos consumidores verde** — re-CA post-merge:
  - `@zeus/app-shell`: 9/9 pass
  - `test:arg-console`: 32/32 pass
  - `@zeus/3d-monitor`: 14/15 — fail #8 gamemap
    (`ZEUS_SCRIPTORIUM_ROOM must beat the view fallback`) **preexistente en
    master** (mismo assert; no bloquea U96)

### PRACTICAS / demolición

- Demolición completa (ambas copias `src/view-kit/index.mjs`).
- Hogar natural en app-shell (sin paquete inventado); rename `ssr-view-registry`
  deshace colisión léxica con `@zeus/view-kit`.
- D-8 / dos juegos: módulo genérico (descriptor + hyperaxe + template); sin
  conceptos delta/pozo.
- Commits convencionales; alcance acotado; worker no tocó BACKLOG.
- Arranque browser ⏳ (brief headless OK).

### Hallazgos → cola (al ✅ en master; no aplicados aquí)

1. **3d-monitor gamemap / `ZEUS_SCRIPTORIUM_ROOM`** —
   `resolveViewerConfig` vs `resolveRoomClientConfig` no alinean env
   SCRIPTORIUM; test rojo en master y en rama. Candidato higiene.
2. **`release:changeset-dry` / `@zeus/linea-kit`** —
   `exports ./schemas/*` missing from tarball; dry restaura tree (riesgo mid-WP).
3. Ruta estática `/view-kit` (browser) — residual intencional; no acción.

### Merge / BACKLOG

- **Autorizado a merge** tras este veredicto.
- **BACKLOG 🔶→✅ y cola hallazgos:** pendientes de sesión orquestador en
  master (esta revisión: NO ✅ BACKLOG / NO merge / NO push por mandato).
- Orden sugerido: merge U96 → master; luego `git worktree remove` del
  worktree `wp-u96-ssr-registry`.

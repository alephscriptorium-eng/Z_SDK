# WP-U51 · layout — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok) |
| fecha | 2026-07-17 |
| rama | `wp/u51-layout` |
| commit(s) | `719bab7` move · `04375f8` paths/gates · `58ecdef` reporte |
| estado propuesto | listo para revisión |

## Qué se hizo

Se aplicó el layout objetivo de ARQUITECTURA §2 con `git mv`:

- `packages/lib/*` (salvo `operator-bridge`) → `packages/engine/*`
- `packages/app/editor-ui` → `packages/editor/editor-ui`
- `packages/platform/*`, `packages/mcp/*`, `packages/app/{player-ui,player-3d-ui}`, `packages/operator-ui`, `packages/lib/operator-bridge` → `packages/mesh/*`
- `packages/arg/*` → `packages/games/delta/*` (`pozo` ya estaba en `packages/games/pozo`)
- `packages/app/{game-demos,ping-pong-bots}` → `examples/*`

Se actualizaron workspaces raíz, scripts con paths, gates/excepciones, e2e,
docs rotos y joins segmentados (`path.join(..., 'operator-ui')`). Se corrigieron
`../` de monorepo root en paquetes que bajaron un nivel (`games/delta`).
Nombres npm `@zeus/*` sin cambio.

## Archivos tocados

- renombrados (git mv): árbol `packages/{engine,editor,mesh,games/delta}` + `examples/*`
- modificado `package.json` — workspaces `engine|editor|mesh|games|games/delta|examples`
- modificado `scripts/gates/{scan,exceptions}.mjs` — paths + gate (c)/(d) post-layout
- modificado `test/gates/gates.test.mjs` — CA (c) apunta a `games/delta`
- modificado `e2e/*`, `scripts/spec-*.mjs`, `scripts/release-dry.mjs` — paths
- modificado launchers/load-env relativos (`arg-demos`, `arg-console`, `examples/*`)
- modificado `packages/mesh/operator-ui` `file:` deps → mesh/engine
- modificado docs/README afectados; `plan/REPORTES/*` históricos sin reescritura
- **no** tocado `plan/BACKLOG.md`

## Evidencia

### Workspaces

```
[
  'packages/engine/*',
  'packages/editor/*',
  'packages/mesh/*',
  'packages/games/*',
  'packages/games/delta/*',
  'examples/*'
]
```

### npm install limpio

```
added 2606 packages, and audited 2787 packages in 7m
```

Workspaces resuelven a nuevas rutas (ej. `@zeus/arg-domain` → `packages/games/delta/arg-domain`,
`@zeus/presets-sdk` → `packages/engine/presets-sdk`). Sin carpetas fantasma.

### lint

```
> eslint .
✖ 12 problems (0 errors, 12 warnings)
```

(exit 0; warnings preexistentes)

### gates + test:gates

```
gates: OK (0 offenders)
# tests 7
# pass 7
# fail 0
```

### test:arg

```
# pass (arg-domain / feeds / console / player-mcp suites verdes; exit 0)
```

### e2e matriz

| script | resultado |
| ------ | --------- |
| `e2e:arg` | 🟢 todos los gates en verde |
| `e2e:arg-mcp` | 🟢 todos los gates en verde |
| `e2e:pozo-mcp` | 🟢 C-01/C-02 + gates en verde |
| `e2e:player-ui-dj` | 🟢 OK |
| `e2e:dual-ui` | 🟢 OK (G-DUI.0–G-DUI.3) |
| `e2e:operator-ui` | 🟢 OK (G-U32.0–G-U32.5) tras matar huérfano en `:13022` |
| `e2e:player-3d` | SKIPPED (session master demolished; redirige a player-ui-dj) |
| `e2e:playbook-kit` | 🔴 G-PB.0 coherencia C-30 (sin cita MCP literal) — no causado por move |
| `e2e:view` / `e2e:firehose` | ⏳ VOLUMES ausentes en worktree (`DISK_02/LINEAS`, `DISK_01/FIREHOSE`) |

### git log --follow

```
$ git log --follow --oneline -3 -- packages/engine/protocol/package.json
719bab7 refactor(monorepo)!: move packages to engine/editor/mesh/games + examples
ed042bc chore(publish): scope @zeus, engine publishConfig y release:dry
faa76bd feat(protocol): contrato único state|intent|track|ledger con roles y Peer Card

$ git log --follow --oneline -3 -- packages/games/delta/arg-domain/src/index.mjs
719bab7 refactor(monorepo)!: move packages to engine/editor/mesh/games + examples
b6cf972 feat(arg-domain): intents dj cache/curate/milestone con line-board
e34cd1a refactor(arg)!: identidad del juego CAUDAL → delta (D-8)

$ git log --follow --oneline -3 -- packages/mesh/socket-server/package.json
719bab7 refactor(monorepo)!: move packages to engine/editor/mesh/games + examples
5e7034f chore: private:true en paquetes no publicables
6898ca4 --
```

## Demolición

Carpetas antiguas ausentes:

```
$ ls packages/lib packages/app packages/platform packages/mcp packages/arg packages/operator-ui
ls: cannot access ... No such file or directory
```

Cero re-exports de compatibilidad en esas rutas.

Gate (c) escanea fuera de `packages/games/delta/`; gate (d) activo sobre
`packages/engine` con exención docs/spec/test (mismo criterio que puertos).

## Auto-revisión (PRACTICAS.md §3)

- [x] Puertos/URLs/rooms hardcodeados: no se introdujeron; solo paths de layout
- [x] Cadenas if/switch → tabla: n/a (WP mecánico)
- [x] Duplicación: no se copió código; solo `git mv`
- [x] console.log / TODO: no añadidos
- [x] Nombres de transición: no; gate (b) verde
- [x] Demolición completa: dirs viejos ausentes (ls arriba)
- [x] Tests: CA con suites existentes (WP de movimiento)
- [x] Arranque: e2e arg/mcp/pozo/player-ui/dual/operator verdes
- [x] README/docs de mapa actualizados; reportes históricos intactos
- [x] Diff = alcance U51 (paths + layout); sin features

## Hallazgos fuera de alcance

1. `e2e:playbook-kit` G-PB.0 falla en coherencia de `C-30` (caso DJ sin
   llamada MCP literal) — preexistente / contenido CASOS, no del move.
2. `e2e:view` / `e2e:firehose` dependen de `VOLUMES/` no presentes en el
   worktree — ambiente.
3. Huérfano en `:13022` (operator-ui pre-move) causó 503 falso hasta
   `taskkill`; `stop:services` no cubre e2e aislados (cola U11).
4. Tests sintéticos de gates aún usan paths ficticios `packages/lib|app` en
   temp trees (OK; no son código vivo).
5. `file:` residual en operator-ui (cola U50) actualizado a mesh/engine; sigue
   siendo `file:` (no workspace npm del Angular aislado).

## Dudas / bloqueos

Ninguno que bloquee el CA del WP. Push: **no intentado** (política swarm).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_

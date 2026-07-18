# WP-U109 · solve-ports — reporte

| dato | valor |
| ---- | ----- |
| agente | swarm worker (Cursor Grok) |
| fecha | 2026-07-18 |
| rama | `wp/u109-solve-ports` (zeus) · `wp/u109-solve-ports` (library) |
| commit(s) | zeus `6974189` + `a7a02ab` · library `ced9af1` |
| estado propuesto | listo para revisión |
| push zeus | sí (rama WP) |
| push library | sí (rama WP) |

## Qué se hizo

Se añadieron slots canónicos en `@zeus/presets-sdk/env`: MCP
`pozoPlayer.uno` (4131 / `ZEUS_MCP_POZO`) y `solvePlayer.uno` (4132 /
`ZEUS_MCP_SOLVE`); UI `pozoView` (3025 / `ZEUS_PORT_POZO_VIEW`) y
`solveView` (3026 / `ZEUS_PORT_SOLVE_VIEW`). Se espejaron en
`KNOWN_ZEUS_PORTS` y se excluyeron los grupos player de discovery MCP
(como `argPlayer`). En games-library, `@zeus/pozo` y `@zeus/solve-coagula`
dejan de exportar `DEFAULT_*_PORT` y leen `resolveZeus*Ports`. README +
changeset patch + tests nuevos. Excepción `two-games` comentada en
`env/index.mjs` por las claves `pozo*` (PRACTICAS §5 / BACKLOG).

## Archivos tocados

### Monorepo Z_SDK (`wp/u109-solve-ports`)

| ruta | cambio |
| ---- | ------ |
| `packages/engine/presets-sdk/src/env/index.mjs` | modificado — slots + env maps + discovery exclude |
| `packages/engine/presets-sdk/test/env-solve-pozo-ports.mjs` | creado — defaults + overrides |
| `packages/engine/presets-sdk/README.md` | modificado — documenta slots |
| `packages/engine/presets-sdk/spec/*.openapi.yaml` | regenerados LF (sync tests) |
| `scripts/gates/scan.mjs` | modificado — KNOWN 3025/3026/4131/4132 |
| `scripts/gates/exceptions.mjs` | modificado — excepción two-games env |
| `.changeset/wp-u109-solve-ports.md` | creado — patch presets-sdk |
| `plan/REPORTES/WP-U109-solve-ports.md` | creado — este reporte |

### Library (`wp/u109-solve-ports`)

| ruta | cambio |
| ---- | ------ |
| `packages/pozo/src/contract.mjs` | modificado — demole `DEFAULT_POZO_*_PORT` |
| `packages/pozo/src/endpoints.mjs` | modificado — lee resolver |
| `packages/pozo/src/player-mcp/start.mjs` | modificado — comentario puerto |
| `packages/pozo/README.md` | modificado — nota puertos veraz |
| `packages/solve-coagula/src/contract.mjs` | modificado — demole `DEFAULT_SOLVE_*_PORT` |
| `packages/solve-coagula/src/endpoints.mjs` | modificado — lee resolver |
| `packages/solve-coagula/README.md` | modificado — nota puertos |

## Evidencia

```
# zeus worktree
npm test -w @zeus/presets-sdk
# tests 43 · pass 43 · fail 0

npm run gates
# gates: OK (0 offenders)

npm run lint
# ✖ 11 problems (0 errors, 11 warnings) — preexistentes, fuera de alcance

# library worktree (presets-sdk enlazado al worktree zeus)
node — resolveZeus*Ports / resolvePozoEndpoints / resolveSolveEndpoints:
slots {"pozo":{"uno":4131},"solve":{"uno":4132},"pozoView":3025,"solveView":3026}
endpoints {"pozoMcp":4131,"pozoView":3025,"solveMcp":4132,"solveView":3026}
override ZEUS_MCP_POZO=5999 ZEUS_PORT_POZO_VIEW=3999 → 5999 3999

npm test -w @zeus/pozo
# tests 9 · pass 9 · fail 0

npm test -w @zeus/solve-coagula
# tests 6 · pass 6 · fail 0
```

- Arranque demo/e2e completo: ⏳ sin verificar (smoke de resolución de
  puertos + unit tests verdes; e2e mesh no levantado en esta sesión).

## Demolición

Símbolos borrados en código de juego: `DEFAULT_POZO_MCP_PORT`,
`DEFAULT_POZO_VIEW_PORT`, `DEFAULT_SOLVE_MCP_PORT`,
`DEFAULT_SOLVE_VIEW_PORT`. Literales 4131/3025/4132/3026 fuera de
docs/specs en `.mjs`/`.js` de pozo/solve:

```
rg DEFAULT_POZO_MCP_PORT|DEFAULT_SOLVE_MCP_PORT|DEFAULT_POZO_VIEW_PORT|DEFAULT_SOLVE_VIEW_PORT packages --glob '*.{mjs,js}'
# (sin matches; exit 1)

rg '4131|3025|4132|3026' packages/pozo packages/solve-coagula --glob '*.{mjs,js}'
# (sin matches; exit 1)
```

Specs/CASOS.md siguen citando puertos de ejemplo (permitido).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: defaults solo en
      `presets-sdk/env`; juegos leen resolver. Specs pueden citar ejemplos.
- [x] Cadenas if/switch que debieron ser tabla: n/a (maps MCP/UI existentes).
- [x] Duplicación: no; se eliminó el dual path readEnvPort+DEFAULT en juegos.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres: slots `pozo*`/`solve*` según BACKLOG; excepción two-games
      documentada (precedente `argPlayer`).
- [x] Demolición completa (grep arriba): sí en código de juego.
- [x] Tests de comportamiento: defaults + overrides env en presets-sdk;
      unit pozo/solve verdes.
- [x] Arranque real: smoke endpoints; e2e demo ⏳.
- [x] README presets-sdk + pozo + solve veraces.
- [x] Diff solo alcance U109 (no U110 / U111–U114 / publish).

## Hallazgos fuera de alcance

1. `KNOWN_ZEUS_PORTS` aún no lista `3022`/`3023`/`4113`/`4114` aunque
   están en `DEFAULT_ZEUS_*` — preexistente (U84 nota similar). No se
   ampliaron aquí: al añadir `3023` el gate marcó un JSDoc en
   `webrtc-viewer` (efecto colateral).
2. `resolveStopServicePorts` no tiene ids stop para pozo/solve view/MCP
   — no pedido por CA.
3. Stale symlinks `node_modules/@zeus/pozo` → `packages/games/pozo`
   inexistente en monorepo post-U61 — higiene local.

## Dudas / bloqueos

Ninguno bloqueante. Merge: primero zeus (presets-sdk) luego library
(consumidores). No merge a main desde worker.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_

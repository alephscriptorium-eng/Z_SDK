# WP-U23 · pozo — reporte

| dato | valor |
| ---- | ----- |
| agente | worker lote-2c (Cursor Grok) |
| fecha | 2026-07-17 |
| rama | `wp/u23-pozo` |
| commit(s) | `9c929fb` feat(pozo); `febfe09` docs(reportes) |
| estado propuesto | listo para revisión |

## Qué se hizo

Nació `@zeus/pozo` en `packages/games/pozo`: dominio puro (pozo + 3 nodos +
feed drip + intent `draw_drop` → ledger `label`), autoridad vía
`startAuthority({ game: 'pozo' })`, MCP jugador (`player_join` /
`player_draw_drop` / `player_state`), vista mínima sobre `@zeus/view-kit`,
`spec/CASOS.md` (C-01/C-02) con coherencia playbook-kit, launcher
`demo:pozo` y e2e `e2e:pozo-mcp`. Workspace raíz ganó `packages/games/*`.

**Pregunta PRACTICAS §1.11:** ¿pozo se montó solo importando kits engine,
sin editar `packages/lib/*`? **Sí.** Cero cambios de código en engine; solo
consumo de protocol / authority-kit / player-mcp-kit / playbook-kit /
view-kit / presets-sdk / rooms.

## Archivos tocados

| archivo | qué |
| ------- | --- |
| `packages/games/pozo/**` | creado — juego completo |
| `e2e/pozo-mcp-demo.mjs` | creado — e2e JSON-RPC + playbook runner |
| `package.json` | workspace `packages/games/*`, scripts `demo:pozo` / `e2e:pozo-mcp` / `test:pozo` |
| `package-lock.json` | link workspace `@zeus/pozo` |
| `plan/REPORTES/WP-U23-pozo.md` | este reporte |

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### `npm test -w @zeus/pozo`

```
# tests 6
# suites 2
# pass 6
# fail 0
```

### `npm run gates`

```
gates: OK (0 offenders)
```

### `npm run e2e:pozo-mcp`

```
✅ G-POZO.0 coherencia CASOS.md · C-01,C-02
✅ G-POZO.1 tools · player_join,player_state,player_draw_drop
✅ G-POZO.2 C-01 · ok evidencia=sí
✅ G-POZO.2 C-02 · ok evidencia=sí
✅ G-POZO.3 runner ok · 2 filas
✅ G-POZO.4 sin imports arg/delta · limpio

🟢 e2e pozo-mcp: C-01/C-02 + gates en verde
```

### `demo:pozo` (smoke, puertos aislados, sin browser)

```
[authority] 🫧 pozo authority · game=pozo · user=pozo-authority · room=POZO_DEMO_SMOKE
[mcp-uno] [pozo-player-mcp-uno] MCP server listening at http://localhost:14151/mcp
[view] [pozo-view] http://localhost:13065/views/pozo · room=POZO_DEMO_SMOKE
  browser    ZEUS_OPEN_BROWSER=off

MCP health: {"status":"ok",...,"connected":true,...}
view health: {"status":"ok","service":"pozo-view","game":"pozo",...}
```

Vista humana en navegador: `⏳ sin verificar` (brief: no setear
`ZEUS_OPEN_BROWSER=1` salvo verificación humana explícita). Health HTTP +
launcher OK.

### Imports

```
rg '@zeus/arg|packages/arg|games/delta' packages/games/pozo → limpio
(e2e solo menciona el check en un comentario)
```

## Demolición

n/a (nacimiento).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: scriptorium vía
  `resolveZeusUiPorts`; MCP/vista vía `readEnvPort('ZEUS_MCP_POZO'|…)` con
  defaults del juego (4131/3025) — no están en `KNOWN_ZEUS_PORTS` del gate;
  hallazgo: faltan slots en `DEFAULT_ZEUS_*`.
- [x] Cadenas if/switch que debieron ser tabla: handlers `{ join, draw_drop }`
  en dominio.
- [x] Duplicación con otros paquetes: no; se reutilizan kits. Vista slim
  (sin app-shell) a propósito — patrón express+import-map como player-3d,
  sin copiar arg-console.
- [x] console.log / código comentado / TODO sin backlog: logs de arranque
  (patrón authority/MCP); sin TODO.
- [x] Nombres fuera de glosario o de transición: `pozo` solo en el juego;
  engine intacto (gates two-games OK).
- [x] Demolición completa: n/a.
- [x] Tests prueban comportamiento: join/draw_drop/rechazos/feed drip +
  coherencia CASOS + e2e evidencia.
- [x] Arranque real verificado: demo smoke + e2e stack; vista browser
  humana no abierta.
- [x] README/specs del paquete siguen siendo verdad: README + CASOS.md.
- [x] El diff contiene solo el alcance del WP: sí (queda dirty local
  `playbook-kit/bin/run-playbook.mjs` modo +x ajeno — no commiteado).

## Hallazgos fuera de alcance

Lista de lo que **NO se pudo / no se hizo en engine** (alimenta backlog SDK):

1. **`presets-sdk/env` sin slots `pozoPlayer` / `pozoView`** — defaults y
   `ZEUS_MCP_POZO` / `ZEUS_PORT_POZO_VIEW` viven en el juego vía
   `readEnvPort`. Mejor: añadir a `DEFAULT_ZEUS_MCP` / `DEFAULT_ZEUS_UI_MESH`
   + `KNOWN_ZEUS_PORTS` en gates (WP aparte).
2. **Vista sin `@zeus/app-shell`** — CA no lo exige; shell SSR completo
   queda opcional cuando U21/consolas generalicen createAppConfig a juegos.
3. **Sin editar engine** — confirmado. Cualquier fricción (p.ej. dry-run
   domain expuesto por authority-kit) no bloqueó el CA; no se propuso
   parche.

No bloquea: A-05 dual-wire (pozo usa kinds canónicos `state|intent|…`).

## Dudas / bloqueos

Ninguno. CA cumplido en local.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_

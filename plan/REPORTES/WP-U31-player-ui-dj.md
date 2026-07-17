# WP-U31 · player-ui-dj — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm (Cursor Grok) |
| fecha | 2026-07-17 |
| rama | `wp/u31-player-ui-dj` |
| commit(s) | `0f6eae0` feat(player-ui)!: vista dj sobre room del juego; demuele session-* |
| estado propuesto | listo para revisión |
| push | **no intentado** (política swarm) |

## Qué se hizo

player-ui dejó de ser master de `scriptorium.<id>`: se une a la room del
juego (`ZEUS_ARG_ROOM` / `ARG_DELTA`) como vista rol `dj`, emite intents U30
(`cache` / `curate` / `milestone`) vía `@zeus/protocol` + `@zeus/rooms`, y
proyecta `state`/`ledger` al deck-io local. El xstate local permanece local
(`session-machine` + `/deck-io`).

Demolición: borrados `@zeus/session-protocol`, `@zeus/session-domain`,
`@zeus/tablero-core` y `session-transport.mjs` / `createRoomSessionClient`.
Dominio vivo de decks absorbido en `player-ui/src/deck-kit.mjs` (y
constantes satélite en console-monitor). Cero re-exports de compatibilidad.

CA e2e: `npm run e2e:player-ui-dj` — POST `/api/dj/cache` → ledger `cache`
visible en wire + shell tablero delta. Suite player-ui recortada al rol DJ
(14 pass).

## Archivos tocados

- creado `packages/app/player-ui/src/dj-transport.mjs` — join room juego + intents
- creado `packages/app/player-ui/src/local-deck-io.mjs` — Socket.IO local decks
- creado `packages/app/player-ui/src/session-inbound.mjs` — reducer tabla local
- creado `packages/app/player-ui/src/deck-kit.mjs` — absorbido de tablero-core
- creado `packages/app/player-ui/src/deck-errors.mjs`
- creado `e2e/player-ui-dj-demo.mjs` — CA
- borrado `packages/lib/session-{protocol,domain}`, `tablero-core`, `session-transport.mjs`
- modificado `player-ui` server/decks/tests/contract/openapi
- modificado `rooms` (sin session-protocol; +`waitForSocketEvent`)
- modificado console-monitor / player-3d / operator stub / e2e legacy skip
- modificado `arg-console` tablero ledger colors cache/curate/milestone
- modificado gates exceptions, CI matrix, README

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm run test:player-ui` → **14 pass**, 0 fail
- `npm run e2e:player-ui-dj` → **OK** (G-U31.1…G-U31.6)

```
✅ G-U31.1 · role=dj room=ARG_U31
✅ G-U31.2 · tablero status=200
✅ G-U31.3 · intent cache role=dj
✅ G-U31.4 · ledger kind=cache
✅ G-U31.5 · projection lines=true
✅ G-U31.6 · tablero + ledger cache
e2e player-ui-dj: OK
```

- `npm run gates` → `gates: OK (0 offenders)`
- `npm run test:arg-domain` → **59 pass**, 0 fail
- `npm run test:pozo` → **6 pass**, 0 fail
- `npm run lint` → 0 errors (warnings preexistentes)
- Navegador / `ZEUS_OPEN_BROWSER`: no seteado; e2e headless

### ¿delta y pozo verdes donde aplique? (PRACTICAS §1.11)

- **delta:** sí — e2e DJ + arg-domain + tablero shell.
- **pozo:** no gana player-ui; `test:pozo` verde; cero nombres de juego en
  engine (intents usan `game` inyectado por caller).

### ¿quedó algún re-export/compat de session-*?

No. Paquetes borrados; imports vivos solo comentarios en stubs.

```
rg "@zeus/session-protocol|@zeus/session-domain|@zeus/tablero-core" \
  --glob '!plan/**' --glob '!**/package-lock.json' --glob '!**/node_modules/**' --glob '!**/*.md'
→ deck-kit.mjs (comentario absorbido) + operator local-projection.ts (comentario)
```

Nota: `package-lock.json` aún lista entradas `extraneous` de los paquetes
borrados (ghost de npm); no son workspaces vivos.

## Demolición

| ítem | destino |
| ---- | ------- |
| `session-transport.mjs` master | borrado; reemplazo `dj-transport.mjs` |
| room `scriptorium.<id>` como Tablero compartido | player-ui ya no MAKE_MASTER ni SET_STATE sesión |
| `@zeus/session-protocol` | borrado |
| `@zeus/session-domain` | borrado |
| `@zeus/tablero-core` | absorbido → `player-ui/deck-kit.mjs` (+ satélite console-monitor) |
| `rooms.createRoomSessionClient` | borrado |
| re-exports compat | cero |

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rooms: room vía `ZEUS_ARG_ROOM` / default caller `ARG_DELTA`; scriptorium URL vía `@zeus/rooms`.
- [x] Tabla/map: `session-inbound` INBOUND table; no switch creciente nuevo.
- [x] Duplicación: deck-slots en console-monitor espeja deck-kit (satélite; hallazgo higiene).
- [x] console.log depuración / TODO: no añadidos.
- [x] Nombres transición: no v2/legacy/old en código nuevo.
- [x] Demolición: grep arriba (solo comentarios).
- [x] Tests: e2e intent→ledger; suite DJ routes/smoke.
- [x] Arranque: e2e levantó socket + authority + console + player-ui.
- [x] README/openapi player-ui actualizados.
- [x] Diff = alcance U31 (sin BACKLOG).

## Hallazgos fuera de alcance

- Tools MCP `dj_*` / playbook C-30..C-32: no cableados a arg-player-mcp
  (HTTP `/api/dj/*` + decks bastan para CA; MCP = hallazgo).
- e2e legacy (deck-demo, deck-room, tablero-aleph, player-3d, bridge,
  operator-ui): SKIPPED → `e2e:player-ui-dj` / U32.
- operator-ui: stub local-projection; rewire completo = **WP-U32**.
- player-3d: proyección sesión demolida; stub local HUD.
- `package-lock` entradas extraneous de session-*/tablero-core.
- Duplicación deck-kit ↔ console-monitor deck-slots (candidato cleanup).
- Dual-wire: DJ emite solo `intent` canónico (evitar doble apply).

## Dudas / bloqueos

Ninguno. Listo para revisión del orquestador.

---

## Revisión del orquestador

_(la rellena el orquestador)_

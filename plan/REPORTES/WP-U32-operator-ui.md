# WP-U32 · operator-ui — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm (Cursor Grok) |
| fecha | 2026-07-17 |
| rama | `wp/u32-operator-ui` |
| commit(s) | `a386c5f` … `385fca6` (código) + docs reporte en HEAD |
| estado propuesto | listo para revisión |
| push | **no intentado** (política swarm) |

## Qué se hizo

`operator-bridge` se recableó del protocolo sesión al contrato único: proyecta
slice de `state` y entradas de `ledger` a AlephMessage; exporta
`makeOperatorIntent` (rol `operator`). `room-client-browser` escucha
`state`/`arg:state` y defaulta room a `ARG_DELTA` (`ZEUS_ARG_ROOM`).

operator-ui (Angular) consume el bridge nuevo (`ZeusOperatorBridgeService` +
`OperatorHud`); outbound es `inspect` con rol `operator`. En delta se añadió
el intent `inspect` (solo `operator`) con asiento en ledger.

CA: `e2e:operator-ui` y `e2e:dual-ui` verdes; intent operator rechazado para
rol `player`. Demolición del camino `session:*` en operator-bridge/operator-ui.

## Archivos tocados

- `packages/lib/operator-bridge/*` — bridge state/ledger + tests + INTEGRATION
- `packages/arg/arg-domain/*` + `spec/CONTRATO.md` — intent `inspect`
- `packages/lib/room-client-browser/*` — wire contrato único + `./dev-config`
- `packages/operator-ui/*` — host operator; borrados ZeusSession*/local-projection
- `e2e/operator-ui-demo.mjs`, `e2e/dual-ui-demo.mjs` — CA adaptados
- `scripts/gates/exceptions.mjs` — path del bridge renombrado

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm run test:operator-bridge` → **9 pass**, 0 fail
- `npm test -w @zeus/room-client-browser` → **7 pass**, 0 fail
- `npm run test:arg-domain` → **60 pass**, 0 fail
- `npm run build:operator-ui` → OK (lib + dev-app)
- `npm run e2e:operator-ui` → **OK** (G-U32.0…G-U32.5)

```
✅ G-U32.0 · build artifact
✅ G-U32.1 · /health role=operator
✅ G-U32.2 · window.__ZEUS__ → game room
✅ G-U32.3 · bundle sin session:*
✅ G-U32.4 · ledger inspect
✅ G-U32.5 · player inspect rejected (no ledger)
e2e operator-ui-demo: OK
```

- `npm run e2e:dual-ui` / `verify:dual-ui` (build previo) → **OK** (G-DUI.0…G-DUI.3)

```
✅ G-DUI.0 · health DJ + player-3d + operator
✅ G-DUI.3 · bundle contrato único
✅ G-DUI.1 · inspect operator → ledger
✅ G-DUI.2 · inspect player → rejected
e2e dual-ui-demo: OK
```

- `npm run gates` → `gates: OK (0 offenders)`
- `npm run test:pozo` → **6 pass**, 0 fail
- `npm run lint` → 0 errors (warnings preexistentes)
- Navegador / `ZEUS_OPEN_BROWSER`: no seteado; e2e headless

### ¿delta y pozo verdes donde aplique? (PRACTICAS §1.11)

- **delta:** sí — e2e operator/dual + arg-domain (inspect) + authority.
- **pozo:** no gana operator-ui; `test:pozo` verde; cero nombres de juego en
  operator-bridge (`game` lo inyecta el caller).

### ¿quedó algún camino `session:*` en operator-bridge/operator-ui?

Solo mención histórica en `INTEGRATION.md` (docs del puente demolido). Cero en
código vivo / bundle (gate e2e G-U32.3 / G-DUI.3).

```
rg "session:state|selection:cast|ZeusSession|local-projection|onSessionEvent" \
  packages/lib/operator-bridge packages/operator-ui \
  --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/package-lock.json'
→ solo INTEGRATION.md (nota de demolición)
```

## Demolición

| ítem | destino |
| ---- | ------- |
| `onSessionEvent` / `SESSION_EVENTS` / `onSnapshot` (session) | reemplazados por `onState` / `onLedger` |
| `session:state` en room-client `onState` | eliminado; escucha `state`/`arg:state` |
| `ZeusSessionBridgeService` | borrado → `ZeusOperatorBridgeService` |
| `session-hud.component.ts` | borrado → `operator-hud.component.ts` |
| `local-projection.ts` stub U31 | borrado; `projectOperatorSlice` en bridge |
| `selection:cast` / DJ-lite playhead/deck en host | reemplazado por `inspect` |
| re-exports compat hacia sesión | cero |

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rooms: room vía `ZEUS_ARG_ROOM` / default `ARG_DELTA`; scriptorium URL vía presets/rooms.
- [x] Tabla/map: `LEDGER_CONTENT` en bridge; handlers reducer (inspect añadido a tabla).
- [x] Duplicación: proyección en bridge (no stub local); outbound makeOperatorIntent en bridge.
- [x] console.log depuración / TODO: no añadidos (logs de e2e/authority preexistentes).
- [x] Nombres transición: no v2/legacy/old en código nuevo.
- [x] Demolición: grep arriba.
- [x] Tests: e2e intent→ledger + rechazo rol; unit bridge/domain/room-client.
- [x] Arranque: e2e levantó socket + authority (+ player-ui/3d en dual) + operator-ui HTTP.
- [x] README/INTEGRATION/CONTRATO actualizados.
- [x] Diff = alcance U32 (sin BACKLOG).

## Hallazgos fuera de alcance

- OpenAPI CRLF flake en `test:player-ui` (cola U31): no tocado.
- `package-lock` ghost `session-*` en operator-ui: entradas extraneous pueden
  quedar; no son workspaces vivos.
- threejs-ui-lib aún usa nombres Angular `operatorCast` / `liveSessionMode`
  (API de layout genérica); semántica ya es inspect — renombre API = cleanup.
- player-ui `assets/js/session.js` debug page aún habla sesión (fuera de
  operator-*); candidato cleanup post-U31.
- Worktree: hace falta `npm install` en el worktree para que `@zeus/arg-domain`
  no resuelva al checkout master (si no, e2e ve catálogo sin `inspect`).

## Dudas / bloqueos

Ninguno. Listo para revisión del orquestador.

---

## Revisión del orquestador

**Aceptado ✅** — 2026-07-17 (orquestador). Sin merge ni ✅ BACKLOG en esta
pasada (pedido explícito del usuario; autorización queda pendiente de
merge+✅ en master). Sin push. Cierra Ola 3 al aceptar formalmente en master.

### Verificado

- Diff vs master: ya al día (merge-base = master `041a3f3`); no hizo falta
  merge. 6 commits convencionales (`refactor!` / `feat` / `feat!` / `test` /
  docs reporte); 35 archivos; +1453/−897. Alcance U32 (operator-bridge
  contrato único + room-client-browser + intent `inspect` + operator-ui +
  e2e). Worker **no** tocó `plan/BACKLOG.md` ni `packages/arg/spec/BACKLOG.md`.
- operator-bridge: `onState`/`onLedger` + `projectOperatorSlice` +
  `makeOperatorIntent` (rol `operator`); WIRE `state`/`arg:state` + ledger;
  cero `session:*` / `onSessionEvent` en código vivo.
- operator-ui: `ZeusOperatorBridgeService` + `OperatorHud`; borrados
  ZeusSession*, session-hud, local-projection stub. Bundle e2e sin
  `session:*` (G-U32.3 / G-DUI.3).
- Demolición: grep `session:state|selection:cast|ZeusSession|local-projection|
  onSessionEvent` → solo nota histórica en `INTEGRATION.md`. Comentarios
  threejs «Live session» = UI layout (hallazgo cleanup; no protocolo).
- CA roles e2e: inspect operator → ledger; inspect player →
  `rol_no_autorizado` (G-U32.5 / G-DUI.2 + unit arg-domain).
- PRACTICAS §1.11: delta verde (e2e + arg-domain); pozo sin operator-ui
  (documentado) + `test:pozo` verde; `gates` limpio. Auto-revisión §3
  honesta. Hallazgos (OpenAPI CRLF, lock ghost, threejs rename, session.js
  debug) fuera de alcance — cola cleanup.

### Re-CA (worktree, sin browser)

- `npm run test:arg-domain` → **60 pass**, 0 fail
- `npm run test:pozo` → **6 pass**, 0 fail
- `npm run gates` → `gates: OK (0 offenders)`
- `npm run test:operator-bridge` → **9 pass**, 0 fail
- `npm run build:operator-ui` → OK
- `npm run e2e:operator-ui` → OK (G-U32.0–G-U32.5; G-U32.5 player rejected)
- `npm run e2e:dual-ui` → OK (G-DUI.0–G-DUI.3; G-DUI.2 player rejected)

### Merge (cuando el usuario autorice)

1. Merge `wp/u32-operator-ui` → master
2. Orquestador en master: BACKLOG U32 🔶 → ✅ (cierra Ola 3)
3. `git worktree remove` del worktree U32

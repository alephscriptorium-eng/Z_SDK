# WP-U56 · session-wire — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm (Cursor Grok) |
| fecha | 2026-07-17 |
| rama | `wp/u56-session-wire` |
| commit(s) | `00ccde0` … `8619c3f` (código) + docs reporte en HEAD |
| estado propuesto | listo para revisión |
| push | **no intentado** (política swarm) |

## Qué se hizo

Se retiró el wire vivo `session:state` / `session:error` del stack DJ local y
se alineó al contrato room (`state` / `intent` / `ledger` / `track`):

- **player-ui** deck-io emite `state` (snapshot local) y `deck:error` (errores
  wikitext); assets `deck.js` / `session.js` / `session-console.js` y el test
  de routes escuchan esos eventos.
- **socket-server** allowlist downstream: fuera `session:*`; dentro
  `state`/`intent`/`ledger`/`track`/`deck:error`.
- **console-monitor** deja de unirse a scriptorium esperando `session:state`;
  el cliente habla con player-ui `/deck-io` vía `socket.io-client` y consume
  `state` (API `getState`/`onUpdate`/`reconnect` restaurada).
- **ping-pong-bots** `session-participant` cachea payloads `state` (con o sin
  wrapper `{ snapshot }`); tests y README alineados.
- **3d-monitor** filtros `onAny` / `classifyRole` sin `session:state`; saltan
  `state`/`arg:state` (vía `onState`).

Cero re-exports de compatibilidad `session:*` → `state`.

## Archivos tocados

- modificado `packages/mesh/player-ui/src/local-deck-io.mjs` — emit `state`
- modificado `packages/mesh/player-ui/src/socket-handlers.mjs` — unicast `state`
- modificado `packages/mesh/player-ui/src/server.mjs` — debug + `deck:error`
- modificado `packages/mesh/player-ui/assets/js/{deck,session,session-console}.js`
- modificado `packages/mesh/player-ui/test/routes.mjs`
- modificado `packages/mesh/socket-server/src/config.mjs` — allowlist
- modificado `packages/mesh/console-monitor/src/client.mjs` — deck-io client
- modificado `packages/mesh/console-monitor/src/{start,state-store,render,mcp-server}.mjs`
- modificado `packages/mesh/console-monitor/package.json` + `package-lock.json`
- modificado `examples/ping-pong-bots/lib/session-participant.mjs` + tests + README
- modificado `packages/mesh/3d-monitor/assets/js/**` — filtros residuales

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### CA · greps `session:*` en stack DJ vivo

```
rg -n "session:state|session:error" \
  packages/mesh/player-ui packages/mesh/socket-server \
  packages/mesh/console-monitor examples/ping-pong-bots \
  packages/mesh/3d-monitor --glob '!**/node_modules/**'
→ (cero matches)  rg_exit:1
```

### Tests

- `npm run test:player-ui` → **14 pass**, 0 fail
- `npm run test:bots` → **19 pass**, 0 fail
- `npm run test:console-monitor` → **10 pass**, 0 fail
  (smoke: Integration SKIP player-ui :3013 not running — headless OK)

### Gates / lint

- `npm run gates` → `gates: OK (0 offenders)`
- `npm run lint` → 0 errors, 12 warnings preexistentes

### E2E DJ

- `npm run e2e:player-ui-dj` → **FAILED (2)** — G-U31.4 / G-U31.6
  (`actor_desconocido` al intent `cache`).

```
✅ G-U31.1 · role=dj room=ARG_U31
✅ G-U31.2 · status=200
✅ G-U31.3 · intent cache role=dj
[authority!] intent rechazada (actor_desconocido): … intent":"cache"…
❌ G-U31.4 · no ledger cache
✅ G-U31.5 · projection lines=true
❌ G-U31.6 · tablero + ledger cache
```

Reproducido **también con el árbol limpio** (stash de cambios U56): mismo
fallo. No introducido por este WP; ver hallazgos.

- Navegador / `ZEUS_OPEN_BROWSER`: no seteado; e2e headless

### ¿delta y pozo verdes donde aplique? (PRACTICAS §1.11)

- **delta:** unit/suite DJ stack verdes; e2e DJ rojo preexistente (arriba).
- **pozo:** no tocado; cero nombres de juego nuevos en engine.

### ¿quedó algún re-export/compat `session:*`?

No. Sin aliases `session:state` → `state`.

## Demolición

| símbolo | dónde | grep post |
| ------- | ----- | --------- |
| `session:state` emit/on | player-ui deck-io, assets, tests | 0 en stacks |
| `session:error` emit/on | player-ui server/assets | 0 |
| allowlist `session:*` | socket-server `RELAY_DOWNSTREAM_TOP` | 0 |
| case/`waiting for session:state` | console-monitor | 0 |
| `type:'session:state'` | ping-pong participant + tests | 0 |
| skip `session:state` | 3d-monitor views/channels | 0 |

```
# evidencia demolición (literal): cero matches — ver CA greps arriba
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no añadidos (deck-io path ya
      existente `/deck-io`; console-monitor usa `config.baseUrl` del resolver).
- [x] Cadenas if/switch que debieron ser tabla: n/a (renombres + client
      event table implícita por `socket.on`).
- [x] Duplicación con otros paquetes: no; deck-io client propio (no room
      scriptorium) porque el snapshot de decks vive en player-ui local.
- [x] console.log / código comentado / TODO sin backlog: no añadidos.
- [x] Nombres fuera de glosario o de transición: `deck:error` (local, evita
      evento reservado `error` de socket.io); sin v2/old/legacy.
- [x] Demolición completa (grep arriba): sí en stacks del WP.
- [x] Tests prueban comportamiento: routes espera `state`; participant
      cachea `state`; console-monitor smoke arranca con cliente nuevo.
- [ ] Arranque real verificado: ⏳ e2e DJ rojo preexistente; smoke
      console-monitor sin player-ui en :3013 (SKIP integración).
- [x] README/specs: ping-pong README actualizado; openapi player-ui no
      deriva de este wire (regeneración no aportó diff de contenido).
- [x] El diff contiene solo el alcance del WP: sí (sin BACKLOG).

## Hallazgos fuera de alcance

1. **`e2e:player-ui-dj` rojo en base** — authority rechaza `cache` con
   `actor_desconocido` aunque el join DJ se emite al arrancar. Falla igual
   sin los cambios U56. Candidato a WP de estabilización e2e / race join→intent.
2. **`e2e/domain-helpers.mjs` y domain-\*** siguen filtrando
   `SET_STATE` con `type === 'session:state'` — fuera del stack DJ nombrado;
   domain e2e probablemente muerto post-U31. No tocado aquí.
3. Nombres de módulo `createSessionClient` / `session-participant` /
   `session-machine` conservan la palabra «session» (concepto UI), no el
   wire `session:*`.

## Dudas / bloqueos

Ninguno que bloquee la demolición del wire. El CA «e2e DJ verdes» no se
cumple por fallo preexistente; el resto del CA (greps + unitarios + gates)
sí.

---

## Revisión del orquestador

**Aceptado ✅** — orquestador / 2026-07-17 (revisión; sin merge ni ✅ BACKLOG
en este paso).

### Verificado

- Diff acotado al stack DJ (player-ui, socket-server, console-monitor,
  ping-pong-bots, filtros residuales 3d-monitor) + reporte. Sin
  `plan/BACKLOG.md`. Commits convencionales.
- **CA greps** (re-ejecutados en worktree):
  `rg session:state|session:error` y `['\"]session:` en stacks DJ →
  **0 matches** (`rg_exit:1`).
- **Unitarios:** `test:player-ui` 14 pass · `test:bots` 19 pass ·
  `test:console-monitor` 10 pass.
- **Gates:** `gates: OK (0 offenders)`.
- Demolición allowlist/handlers alineada a `state`/`intent`/`ledger`/
  `track`/`deck:error`; sin re-exports `session:*`.

### e2e DJ (`npm run e2e:player-ui-dj`)

- Worker reportó rojo G-U31.4/6 (`actor_desconocido`) y lo atribuyó a base.
- Re-CA orquestador: **verde en master limpio** (G-U31.1…6 OK) y **verde en
  `wp/u56-session-wire`** (mismo resultado). No es regresión estable del WP;
  el rojo del reporte es flaky (race join→intent). **No bloquea.**
- Cola: estabilizar e2e DJ / race `actor_desconocido` (candidato WP).

### Hallazgos → cola (no bloquean)

1. `e2e/domain-helpers.mjs` (y demos domain) siguen filtrando
   `type === 'session:state'` — fuera del stack DJ; residual post-U31.
2. Flake e2e DJ `actor_desconocido` (arriba).

### Merge

Listo para merge a master + ✅ BACKLOG por el orquestador en master (paso
siguiente; no hecho aquí). Paralelo U80 sin conflicto esperado.

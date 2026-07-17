# WP-U12 · player-mcp-kit — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U12) |
| fecha | 2026-07-17 |
| rama | `wp/u12-player-mcp-kit` |
| commit(s) | _(hashes al cerrar)_ |
| estado propuesto | listo para revisión |
| push | no intentado |

## Qué se hizo

Se creó `@zeus/player-mcp-kit` (`packages/lib/player-mcp-kit`): puente de room
genérico (un MCP = un actor), `confirmIntent` (intent → evidencia / dry-run),
resources estándar `<game>://player/state|scene|casos`, factoría de servidor
con health `connected` + `lastStateTs`, y parseo de playbook markdown.
`@zeus/arg-player-mcp` instancia el kit (wire `arg:*`, tools/proyección/nav
de delta); se demuele el genérico duplicado (confirmIntent local, cuerpo del
room-bridge, parseo de casos, health/server factory).

## Archivos tocados

- creado `packages/lib/player-mcp-kit/**` — paquete + tests + README
- modificado `packages/arg/arg-player-mcp/src/{room-bridge,server,logic,casos,index}.mjs` — instancia kit
- modificado `packages/arg/arg-player-mcp/package.json` — dep `@zeus/player-mcp-kit`; quita `@zeus/rooms` directo
- modificado `packages/arg/README.md` — tabla de paquetes (feeds + player-mcp)
- modificado `package-lock.json` — workspace link
- creado `plan/REPORTES/WP-U12-player-mcp-kit.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm test -w @zeus/player-mcp-kit` → exit 0:

```
# tests 10
# pass 10
# fail 0
```

- `npm run test:arg-player-mcp` → exit 0:

```
# tests 21
# pass 21
# fail 0
```

- `npm run e2e:arg-mcp` → exit 0 (tras liberar puertos 14121/13027 de un
  intento previo con EADDRINUSE):

```
✅ G-MCP.1 health+tools · uno/dos connected · 16 tools player_*
✅ G-MCP.2 join (C-01) · uno en plaza (ok)
✅ G-MCP.3 goto (C-03) · ruta ["terraza-a","cima-a"] → cima-a
✅ G-MCP.4 tap sin contacto (C-04b) · error=sin_contacto
✅ G-MCP.5 contacto+tap (C-04/C-05) · contacto c-grifo-a--uno · apertura 0.75
✅ G-MCP.6 ride+label (C-07/C-08) · ledger label seq 1 · intentos 1
✅ G-MCP.7 salvage (C-17) · droplet d1 · murk 29.2→28.2
✅ G-MCP.8 track (C-18) · firehose://synthetic/5/0#brindis

🟢 e2e CAUDAL MCP: todos los gates en verde
```

- Health del MCP (manual, stack e2e): incluye `connected` + `lastStateTs`:

```
{"status":"ok","server":"arg-player-mcp-uno",...,"connected":true,"lastStateTs":1784303523441,"actorEnEstado":false}
```

- `npm run lint` → exit 0 (0 errors; 16 warnings preexistentes ajenos).

- `npm run gates` → `gates: OK (0 offenders)`

## Demolición

1. `confirmIntent` / `sleep` / `fail` / `POLL_MS` locales en
   `arg-player-mcp/src/logic.mjs` → import del kit (+ wrapper `confirm` que
   inyecta `explainIntent` de delta).
2. Cuerpo genérico de `room-bridge.mjs` → `createPlayerRoomBridge`; queda solo
   inyección wire `arg:*` + cache de maze.
3. Parseo `listCasoIds` / `extractCaso` → kit; `casos.mjs` solo lee el path
   del playbook delta.
4. `createStandardMcpServer` + health estándar → `createPlayerMcpServer`.

```
$ rg "async function confirmIntent|function sleep|function fail|createStandardMcpServer|createClient" packages/arg/arg-player-mcp/src
(sin implementaciones locales; solo import confirmIntent / createPlayer*)

$ rg "\bdelta\b|\bpozo\b|\bgrifo\b|\bcantera\b" packages/lib/player-mcp-kit/ --glob '!README.md'
(sin coincidencias)
```

Diff neto arg-player-mcp: ~−175 LOC (stat: +156 / −331 en el lote tocado,
incluido lock/README).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no en el kit; room/puerto los
  aporta el juego vía env/`resolveZeusMcpPorts`.
- [x] Cadenas if/switch que debieron ser tabla: handlers de eventos del bridge
  por mapa `{ [events.STATE]: … }`; tools delta siguen como antes.
- [x] Duplicación: genérico extraído al kit; no se copió U11 ni playbook-kit.
- [x] console.log / código comentado / TODO sin backlog: no nuevos; logger del
  bridge igual que antes.
- [x] Nombres fuera de glosario o de transición: no `legacy`/`v2`/`-old`.
- [x] Demolición: greps arriba; implementaciones genéricas ya no viven en
  arg-player-mcp.
- [x] Tests de comportamiento: confirmIntent (ok / dry-run / timeout);
  resources URIs; casos md; suite arg-player-mcp + e2e.
- [x] Arranque real: e2e:arg-mcp verde (health connected verificado).
- [x] README/specs: README del kit; tabla en `packages/arg/README.md`.
- [x] Diff solo alcance U12: sí (no U11/U13).

## ¿pozo puede consumir `@zeus/player-mcp-kit` tal cual? (PRACTICAS §1.11)

**Sí.** El kit no nombra delta/pozo ni conceptos de juego. Un juego pozo
aportaría: `events` (wire canónico o alias), `makeIntent` con `game: 'pozo'`,
`room` vía env, lectores de scene/state/casos, y sus tools sobre
`confirmIntent`. El esquema de URI (`pozo://…`) lo elige el juego al llamar
`buildStandardPlayerResources({ game: 'pozo', … })`.

## Hallazgos fuera de alcance

- Primer intento de `e2e:arg-mcp` falló por `EADDRINUSE` / health null por
  procesos huérfanos de un arranque manual previo en :14121/:13027 — no es
  regresión del kit; tras `taskkill` el e2e quedó verde.
- `packages/arg/README.md` listaba 3 de 5 paquetes (hallazgo U10); se
  completó la tabla al documentar la instancia del kit.
- Banner e2e aún dice «CAUDAL» (cola U02) — no tocado.
- U13 (`playbook-kit`) podrá absorber/coordinar el parseo `casos-md` del kit
  cuando generalice el formato CASOS.

## Dudas / bloqueos

Ninguno bloqueante. Nota: el esquema URI histórico de delta sigue siendo
`arg://…` (no `delta://`); el kit parametriza el prefijo.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_

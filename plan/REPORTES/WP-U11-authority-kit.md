# WP-U11 · authority-kit — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U11) |
| fecha | 2026-07-17 |
| rama | `wp/u11-authority-kit` |
| commit(s) | `140d6a2` feat(authority-kit) · `64cde68` refactor(arg-demos)! · `807f339`/`b7b7612` docs(plan) |
| estado propuesto | listo para revisión |
| push | no intentado |
| browsers | no launch (orden usuario) — `ZEUS_OPEN_BROWSER=0` |

## Qué se hizo

Se creó `@zeus/authority-kit` (`packages/lib/authority-kit`): `startAuthority`
con tick, intents vía dominio inyectado, publicación state/ledger/track,
presupuesto de snapshot (`checkSnapshotBudget`), y parada limpia
(SIGINT/SIGTERM + `onShutdown`). Default wire = kinds canónicos de
`@zeus/protocol`; acepta alias o dual-wire.

La autoridad de delta (`arg-demos/apps/authority`) quedó como instancia del
kit (feeds/gamemap/dominio + dual `state|…` + `arg:*`). Se demolió el loop
genérico duplicado en esa app. Tests unitarios del kit; `test:arg` y
`e2e:arg` verdes sin tocar los tests.

## Archivos tocados

- creado `packages/lib/authority-kit/**` — paquete + tests + README
- modificado `packages/arg/arg-demos/apps/authority/index.mjs` — thin wrapper
- modificado `packages/arg/arg-demos/package.json` — dep `@zeus/authority-kit`
- modificado `packages/arg/arg-domain/src/contract.mjs` — comentario wire U11
- modificado `package.json` — script `test:authority-kit`
- modificado `package-lock.json` — link workspace
- creado `plan/REPORTES/WP-U11-authority-kit.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm test -w @zeus/authority-kit` → exit 0:

```
# tests 9
# suites 3
# pass 9
# fail 0
```

- `npm run test:arg` → exit 0 (arg-domain 52, arg-feeds, arg-console, arg-player-mcp).

- `ZEUS_OPEN_BROWSER=0 npm run e2e:arg` → exit 0:

```
✅ G-ARG-E2E.1 consola · health 200, shells ok
✅ G-ARG-E2E.2 join · uno en plaza
✅ G-ARG-E2E.3 no-op · grifo sigue cerrado desde la plaza
✅ G-ARG-E2E.4 riada · 1 gotas en rio-a
✅ G-ARG-E2E.6 cloak · tronco
✅ G-ARG-E2E.5 etiqueta · ledger: label
✅ G-ARG-E2E.6b presets API · HTTP 200
✅ G-ARG-E2E.10 track:cast · firehose://synthetic/5/0#brindis
🟢 e2e CAUDAL: todos los gates en verde
```

- `npm run lint` → exit 0 (0 errors; warnings preexistentes).

- `npm run gates` → `gates: OK (0 offenders)`.

- Arranque visual demo / navegador: **no** (orden usuario: browsers no launch).

## Demolición

Código genérico del loop de autoridad (tick `setInterval`, `publishState` /
`publishOutbox`, `connectAndJoin` + handlers SIGINT) salió de
`arg-demos/apps/authority` al kit. La app solo configura dominio delta + wire.

```
$ rg -n "setInterval|publishState|publishOutbox|connectAndJoin" packages/arg/arg-demos/apps/authority/
(sin coincidencias)

$ rg -n "delta|pozo|cantera|grifo|caudal" packages/lib/authority-kit/src/
(sin coincidencias)
```

Diff autoridad app: ~126 → 92 líneas (diff negativo de lógica genérica).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no en el kit; room/user vienen
  de opts / env del juego.
- [x] Cadenas if/switch que debieron ser tabla: no; eventos normalizados a
  listas; publishAll itera.
- [x] Duplicación: loop genérico unificado en kit; rooms vía inyección /
  import diferido.
- [x] console.log / código comentado / TODO sin backlog: no en kit; logs
  delta vía hooks `onLedger`.
- [x] Nombres fuera de glosario o de transición: no `legacy`/`v2`; dual-wire
  es migración explícita, no paquete `-old`.
- [x] Demolición: grep arriba.
- [x] Tests de comportamiento: intent ok/rechazo, dual-wire, budget warn,
  onShutdown.
- [x] Arranque real: e2e:arg verde; sin navegador (orden usuario).
- [x] README del paquete creado; comentario contract delta actualizado.
- [x] Diff solo alcance U11: sí (no U12/U13; no BACKLOG).

## Peer Card (decisión U10 → U11)

**No se exige Peer Card** en handshake de room ni en cada intent en U11.
Basta `role` en el intent (validado por el dominio / `@zeus/protocol`).
Helpers U10 (`makePeerCard` / `peerCardGrantsRole`) quedan listos para
mesh/WebRTC. No bloquea producto → justificación aquí (no DECISIONES §abiertas).

## ¿pozo puede consumir `@zeus/authority-kit` tal cual? (PRACTICAS §1.11)

**Sí.** El kit no nombra delta/pozo ni conceptos de juego. Pozo aportaría
`domain` + `events` canónicos (default) + `join` / `room` / `user` propios.

## Hallazgos fuera de alcance

- Vistas (arg-console, player-mcp, e2e listeners) siguen en `arg:*` solamente;
  dual-wire en autoridad duplica tráfico (~2× state/track/ledger) hasta que
  las vistas migren y se retire el alias.
- `open-browser.mjs` en master del repo principal cambió semántica; el
  worktree U11 aún tiene `ZEUS_OPEN_BROWSER=0` ⇒ no-op. No mergeado aquí
  (fuera de alcance). Usado `ZEUS_OPEN_BROWSER=0` en e2e.
- e2e banners residuales «CAUDAL» (cola U02) — no tocados.
- Puerto e2e 13027 quedó huérfano tras un run fallido previo; `stop:services`
  no lo limpia (puertos aislados ≠ env canónico). Mitigado con
  `scripts/stop-ports.sh` sobre 13027/13031.

## Dudas / bloqueos

Ninguno bloqueante.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_

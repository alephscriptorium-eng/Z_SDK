# WP-U01 · tests-nucleo — reporte

| dato | valor |
| ---- | ----- |
| agente | worker WP-U01 (chat swarm) |
| fecha | 2026-07-17 |
| rama | `wp/u01-tests-nucleo` |
| commit(s) | `2f7605d` test(firehose-core); `5384a36` test(room-client-browser); (+ este reporte) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se añadieron tests de comportamiento de la API pública de `@zeus/firehose-core`
(schema, browse, loader) y `@zeus/room-client-browser` (config + client con
mock de `socket.io-client`). Se sustituyó el script
`echo 'sin tests' && exit 0` de firehose-core por `node --test test/*.mjs`.
En room-client-browser el script de test pasó a
`node --experimental-test-module-mocks --test test/*.mjs` para poder mockear
el import ESM de socket.io. No se tocó lógica de producción ni BACKLOG.

## Archivos tocados

- `packages/lib/firehose-core/package.json` — modificado: demolición del echo, script real de tests
- `packages/lib/firehose-core/test/schema.test.mjs` — creado: `normalizeFirehosePost` / `isJetstreamPost`
- `packages/lib/firehose-core/test/browse-loader.test.mjs` — creado: corpora/browse/listPosts/stats/loader con fixture de volumen temporal
- `packages/lib/room-client-browser/package.json` — modificado: flag de module mocks
- `packages/lib/room-client-browser/test/config.test.mjs` — creado: `browserAssetsDir`, `resolveRoomClientConfig`, `DEV_ROOM_CLIENT_CONFIG`, re-exports
- `packages/lib/room-client-browser/test/client.test.mjs` — creado: `createBrowserRoomClient` (auth, register, SET_STATE, ROOM_MESSAGE)
- `plan/REPORTES/WP-U01-tests-nucleo.md` — creado: este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- Comandos ejecutados y su salida relevante (tests, e2e, lint, gates):

```
$ npm test -w @zeus/firehose-core

> @zeus/firehose-core@0.1.0 test
> node --test test/*.mjs

TAP version 13
# Subtest: listCorpora maps volume corpora with empty flags
ok 1 - listCorpora maps volume corpora with empty flags
# Subtest: getCorpusConfig returns corpus or throws for unknown id
ok 2 - getCorpusConfig returns corpus or throws for unknown id
# Subtest: browseCorpus lists directory entries under a corpus
ok 3 - browseCorpus lists directory entries under a corpus
# Subtest: listPosts normalizes jetstream JSON under a corpus
ok 4 - listPosts normalizes jetstream JSON under a corpus
# Subtest: getFirehoseStats aggregates corpora file counts
ok 5 - getFirehoseStats aggregates corpora file counts
# Subtest: loadTriageManifest reads triage-manifest.json from the volume
ok 6 - loadTriageManifest reads triage-manifest.json from the volume
# Subtest: loadPostFile returns normalized post plus raw payload
ok 7 - loadPostFile returns normalized post plus raw payload
# Subtest: normalizeFirehosePost returns empty shape for non-objects
ok 8 - normalizeFirehosePost returns empty shape for non-objects
# Subtest: normalizeFirehosePost maps jetstream commit fields
ok 9 - normalizeFirehosePost maps jetstream commit fields
# Subtest: normalizeFirehosePost falls back to commit.rkey when uri missing
ok 10 - normalizeFirehosePost falls back to commit.rkey when uri missing
# Subtest: isJetstreamPost detects collection and record.text
ok 11 - isJetstreamPost detects collection and record.text
1..11
# tests 11
# suites 0
# pass 11
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1594.7501

$ npm test -w @zeus/room-client-browser

> @zeus/room-client-browser@0.1.0 test
> node --experimental-test-module-mocks --test test/*.mjs

TAP version 13
# (node:2284) ExperimentalWarning: Module mocking is an experimental feature and might change at any time
# Subtest: createBrowserRoomClient wires auth, register, state and ROOM_MESSAGE
ok 1 - createBrowserRoomClient wires auth, register, state and ROOM_MESSAGE
# Subtest: createBrowserRoomClient strips /runtime and defaults room from sessionId
ok 2 - createBrowserRoomClient strips /runtime and defaults room from sessionId
# Subtest: browserAssetsDir points at the package browser/ folder
ok 3 - browserAssetsDir points at the package browser/ folder
# Subtest: DEV_ROOM_CLIENT_CONFIG mirrors localhost scriptorium defaults
ok 4 - DEV_ROOM_CLIENT_CONFIG mirrors localhost scriptorium defaults
# Subtest: resolveRoomClientConfig derives room and url from session + UI mesh
ok 5 - resolveRoomClientConfig derives room and url from session + UI mesh
# Subtest: resolveZeusUiPorts re-export returns scriptorium slot
ok 6 - resolveZeusUiPorts re-export returns scriptorium slot
# Subtest: DEFAULT_ZEUS_UI_MESH re-export includes scriptorium defaults
ok 7 - DEFAULT_ZEUS_UI_MESH re-export includes scriptorium defaults
1..7
# tests 7
# suites 0
# pass 7
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2102.0832

$ npm run lint
… (warnings preexistentes en otros paquetes) …
✖ 16 problems (0 errors, 16 warnings)

$ npm run gates
⏳ sin verificar — gate aún no existe en este repo (WP-U00 en paralelo).
```

- Si el WP tiene efecto visible (vistas, demo): qué se levantó y qué se vio
  (captura o descripción honesta; `⏳ sin verificar` si nadie lo miró).

```
⏳ sin verificar — WP solo de tests unitarios de librerías; no hay superficie
visual que arrancar.
```

## Demolición

Se borró el placeholder `echo 'sin tests' && exit 0` del script `test` de
`@zeus/firehose-core`. room-client-browser no tenía ese echo (ya apuntaba a
`test/*.mjs` vacío).

```
$ rg -n "sin tests" packages/lib/firehose-core
(rg: cero matches para sin tests en firehose-core)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no en código de producción. Los
  tests afirman los defaults ya existentes de `DEV_ROOM_CLIENT_CONFIG` /
  `DEFAULT_ZEUS_UI_MESH` (3017, localhost) y usan URLs de fixture en el mock
  de socket — no introducen puertos nuevos en runtime.
- [x] Cadenas if/switch que debieron ser tabla: no aplica (solo tests).
- [x] Duplicación con otros paquetes (busqué antes de responder): patrón de
  fixture de volumen tomado de `presets-sdk/test/env-volumes.mjs`; mock de
  socket inspirado en `rooms/test/rooms.test.mjs` + `mock.module` (necesario
  porque `createBrowserRoomClient` importa `io` directamente).
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no.
- [x] Demolición completa (grep arriba): sí, cero `sin tests` en firehose-core.
- [x] Tests prueban comportamiento, no solo «no explota»: sí — normalización
  de posts, browse/list con fixture, ROOM_MESSAGE/SET_STATE/register.
- [x] Arranque real verificado (qué levanté y miré): `⏳ sin verificar` —
  fuera de alcance (libs sin proceso propio en este WP).
- [x] README/specs del paquete siguen siendo verdad: no había README de
  contrato de tests que actualizar; no se cambió API pública.
- [x] El diff contiene solo el alcance del WP: sí (package.json scripts +
  test/ + reporte). Merge de master solo trajo briefs/BACKLOG del lote 0a.

## Hallazgos fuera de alcance

- `createBrowserRoomClient` usa `Date.now()` para el `user` por defecto
  (`viewer-${Date.now()}`) — efecto de borde en un paquete browser; no se
  tocó (PRACTICAS §1.3 es sobre dominio puro).
- Typo histórico del protocolo: `CLIENT_SUSCRIBE` (con una S) — los tests lo
  respetan; corregirlo sería contrato de runtime ajeno.
- `readInjectedRoomConfig` vive en `browser/dev-room-config.mjs` pero no está
  en los `exports` del package.json; no se testó como export principal.
- El worktree sin `npm install` propio resuelve `@zeus/*` al `node_modules`
  del repo principal (walk-up). Los tests usan imports relativos al paquete
  local; conviene documentar/`npm install` en worktrees para el lote.
- `npm run gates` aún no existe (WP-U00).

## Dudas / bloqueos

Ninguno que bloquee el CA. El flag `--experimental-test-module-mocks` es
experimental en Node 22; si el orquestador prefiere no depender de él, habría
que inyectar `io` (cambio de API) en un WP aparte.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_

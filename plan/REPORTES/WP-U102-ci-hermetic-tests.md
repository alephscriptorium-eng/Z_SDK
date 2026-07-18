# WP-U102 · ci-hermetic-tests — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (wp-u102-ci-hermetic-tests) |
| fecha | 2026-07-18 |
| rama | `wp/u102-ci-hermetic-tests` |
| commit(s) | `d363de4` `14bf2f4` `edb8282` `6b08bc6` `f9926d7` |
| estado propuesto | listo para revisión |
| push | no intentado |

## Qué se hizo

Se cerraron los 4 workspaces rojos del run CI 29634248585 (tests no herméticos, no bugs de producto de negocio):

1. **presets-sdk** — `webrtc-viewer` estaba en `ZEUS_STOP_SERVICES` sin `case` en `resolveStopServicePorts`; `resolveStopTargets(['all'])` lanzaba `Unknown Zeus stop service: webrtc-viewer`. Se añadió el mapeo a `ui.webrtcViewer.port` (3023) + tests con env limpio + changeset patch.
2. **3d-monitor** — `resolveViewerConfig` comprobaba `ZEUS_SCRIPTORIUM_ROOM` solo para *omitir* el fallback, pero nunca aplicaba el env; el room quedaba en `ARG_DELTA` (`resolveGameRoom`). Precedencia documentada: `?room=` → env → `PUBLIC_ROOM`. Tests limpian `ZEUS_SCRIPTORIUM_ROOM` y `ZEUS_ARG_ROOM`.
3. **linea-system** — smoke/resource-contract dependen del corpus gitignored `DISK_02/LINEAS`. Sin registry: skip ⏳ honesto (`test/helpers/live-volumes.mjs`).
4. **linea-firehose** — smoke escribe fixture temp bajo `ZEUS_VOLUMES_ROOT` (mismo patrón que `@zeus/firehose-core`) y deja de exigir `DISK_01` del host.

## Archivos tocados

- `.changeset/wp-u102-ci-hermetic-tests.md` — creado: bump patch presets-sdk
- `packages/engine/presets-sdk/src/env/index.mjs` — modificado: case `webrtc-viewer`
- `packages/engine/presets-sdk/test/env-stop-services.mjs` — modificado: env limpio + aserciones webrtc
- `packages/mesh/3d-monitor/src/viewer-config.mjs` — modificado: aplica `ZEUS_SCRIPTORIUM_ROOM`
- `packages/mesh/3d-monitor/test/server.test.mjs` — modificado: env explícito
- `packages/mesh/linea-system/test/helpers/live-volumes.mjs` — creado: detector + skip reason
- `packages/mesh/linea-system/test/smoke.mjs` — modificado: skip sin live VOLUMES
- `packages/mesh/linea-system/test/resource-contract.test.mjs` — modificado: idem
- `packages/mesh/linea-firehose/test/smoke.mjs` — modificado: fixture hermética
- `plan/REPORTES/WP-U102-ci-hermetic-tests.md` — este reporte

## Evidencia

> Entorno limpio simulado: `ZEUS_VOLUMES_ROOT=/tmp/zeus-empty-volumes-u102-verify` (solo `volumes.json`, sin DISK_*) + unset de room/port env sucio.

### `@zeus/linea-system` (skip ⏳ sin corpus)

```
# Subtest: linea MCP linea://info matches RESOURCE_PAYLOADS
ok 1 - linea MCP linea://info matches RESOURCE_PAYLOADS # SKIP ⏳ VOLUMES/DISK_02/LINEAS/registry.yaml missing — live corpus not in repo (CI/worktree)
# Subtest: linea-system smoke
ok 2 - linea-system smoke # SKIP ⏳ VOLUMES/DISK_02/LINEAS/registry.yaml missing — live corpus not in repo (CI/worktree)
# tests 2
# pass 0
# fail 0
# skipped 2
```

### `@zeus/linea-firehose` (verde con fixture)

```
# Subtest: linea-firehose smoke
ok 1 - linea-firehose smoke
# tests 1
# pass 1
# fail 0
```

### `@zeus/presets-sdk` — suite stop-services (la que fallaba en CI)

```
node --test packages/engine/presets-sdk/test/env-stop-services.mjs
# tests 7
# pass 7
# fail 0
```

Nota Windows local: `spec-sync` (horse + mcp-http openapi) falla por CRLF — ya en BACKLOG (presets-sdk openapi CRLF). En el run CI Linux U03 esos tests iban verdes; el rojo era solo `webrtc-viewer`.

### `@zeus/3d-monitor`

```
# Subtest: gamemap room resolution: fallback PUBLIC_ROOM < env < ?room=
ok 8 - gamemap room resolution: fallback PUBLIC_ROOM < env < ?room=
# tests 15
# pass 15
# fail 0
```

### lint + gates

```
npm run lint  → exit 0 (0 errors, 12 warnings preexistentes)
npm run gates → gates: OK (0 offenders)
npm run test:gates → # pass 9 # fail 0
```

- Efecto visible (vistas/demo): ⏳ sin verificar (WP de hermeticidad de tests; no se levantó demo interactiva).
- CI verde en `main`: ⏳ sin verificar (worker no push; orquestador tras merge).

## Demolición

Asunciones de host demolidas:

- linea-system: dependencia dura de `VOLUMES/DISK_02/LINEAS/registry.yaml` en CI → skip documentado.
- linea-firehose: dependencia de corpus live DISK_01 → fixture temp.
- presets-sdk: id `webrtc-viewer` invisible para `all` (lista sin case).
- 3d-monitor: “env gana” sin aplicar el valor de env.

```
rg "Unknown Zeus stop service: webrtc-viewer" — N/A (case añadido)
rg "fallbackRoom && !process.env.ZEUS_SCRIPTORIUM_ROOM" packages/mesh/3d-monitor
# (cero matches — rama demolida)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: puertos canónicos solo en aserciones de test (3023/3230/…); room strings de test (`scriptorium.env-room`). Producto sigue en `presets-sdk/env`.
- [x] Cadenas if/switch que debieron ser tabla: el switch de `resolveStopServicePorts` ya existía; solo se añadió un case. Convertir a tabla = fuera de alcance U102 (hallazgo).
- [x] Duplicación: fixture firehose duplica el writer de `firehose-core/test` (no exportado). Preferible extraer después — no bloquea.
- [x] console.log / código comentado / TODO sin backlog: console.log de smoke preexistentes; no añadí TODOs.
- [x] Nombres fuera de glosario o de transición: no.
- [x] Demolición completa: ver § arriba.
- [x] Tests prueban comportamiento: precedencia room; stop ports; smoke MCP con fixture; skip honesto.
- [ ] Arranque real verificado: ⏳ sin demo interactiva; servers in-process en tests sí.
- [x] README/specs: 3d-monitor README ya documentaba la precedencia; ahora el código la cumple. Spec openapi no regenerado (sin cambio de contrato HTTP).
- [x] Diff solo alcance WP: sí (4 WS + changeset + reporte).

## Hallazgos fuera de alcance

- **presets-sdk openapi CRLF (Windows)** — `assertSpecMatches` sin normalizar EOL; horse + mcp-http fallan en Windows, verdes en CI Linux. Ya anotado en BACKLOG (U91/familia).
- **`resolveStopServicePorts` switch → tabla** — PRACTICAS §1.2; candidato a micro-WP.
- **Fixture firehose compartida** — duplicada entre firehose-core y linea-firehose tests; extraer a `@zeus/test-utils` o export de test helper.
- **linea-system sin cobertura hermética activa** — skip deja CI verde pero no ejercita MCP sin corpus; fixture mínima “espana-shaped” sería otro WP (datos grandes / assertions actuales atadas a P06…).
- **`resolveRoomClientConfig` ignora `ZEUS_SCRIPTORIUM_ROOM`** — solo mira `ZEUS_ARG_ROOM` / `DEFAULT_GAME_ROOM`; 3d-monitor lo parchea en `resolveViewerConfig`. Otros consumidores (player-3d-ui) pueden tener el mismo hueco.

## Dudas / bloqueos

Ninguno. CA local de los 4 WS en entorno limpio cumplido; CA remoto CI main queda al orquestador (merge + push).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_

# WP-U85 · feed-families — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-18 |
| rama | `wp/u85-feed-families` |
| commit(s) | `783827f`, `46d3e08`, `1b24d35`, `71c0d2a` (+ hash-fix si aplica) |
| estado propuesto | listo para revisión |

## Qué se hizo

Nació `@zeus/feed-kit` (`packages/engine/feed-kit`): interfaz común de las tres
familias DATOS.md §3 (`static` / `stream` / `gossip`) con `nextItems`,
`curation_status` (U80), resolve `auto|synthetic|real` y degradación
auto→sintético. Stream real vía firehose MCP; gossip vía SSB MCP; static vía
linea MCP + `materialize`. Jetstream→DISK_01 como productor de referencia
(`volumes:sync:firehose`, fixture + live).

`@zeus/arg-feeds` quedó como adaptador delta (maze/cantera); se demolieron
`real.mjs` y `mcp-client.mjs` genéricos. `@zeus/pozo` consume el mismo bag
(`resolveRuntimeFeeds` en autoridad; dominio tira stream+gossip a lines/items/tracks).
E2E `e2e:feed-families` cubre ATProto+SSB navegables desde pozo y auto→sintético.

## Archivos tocados

- creado `packages/engine/feed-kit/**` — familias, synthetic, MCP, resolve, jetstream, tests, README
- creado `e2e/feed-families-demo.mjs` — CA e2e U85
- creado `.changeset/wp-u85-feed-families.md`
- modificado `packages/games/delta/arg-feeds/**` — adaptador maze; demolición real/mcp-client
- modificado `packages/games/delta/arg-domain/src/feeds/synthetic.mjs` — stream desde feed-kit
- modificado `packages/games/pozo/src/{authority,domain}.mjs` + test — consume feed-kit
- modificado `package.json` — `test:feed-kit`, `volumes:sync:firehose`, `e2e:feed-families`
- modificado `plan/ARQUITECTURA.md`, `plan/DATOS.md`, `VOLUMES/README.md`, `.env.example`
- creado `plan/REPORTES/WP-U85-feed-families.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

```
$ npm test -w @zeus/feed-kit
# tests 8 / pass 8 / fail 0

$ npm test -w @zeus/arg-feeds
# tests 4 / pass 4 / fail 0

$ npm test -w @zeus/arg-domain
# tests 68 / pass 68 / fail 0

$ npm test -w @zeus/pozo
# tests 9 / pass 9 / fail 0  (incluye feed-kit bag → tracks)

$ npm run e2e:feed-families
# ✅ G-U85.0 jetstream fixture → DISK_01 · written=2
# ✅ G-U85.1 SSB fixture → DISK_04
# ✅ G-U85.2 firehose MCP health
# ✅ G-U85.3 ssb MCP health
# ✅ G-U85.4 resolve mode real
# ✅ G-U85.5 ATProto/stream item · firehose://post/raw/jetstream/u85a.json
# ✅ G-U85.6 SSB/gossip item · ssb://message/tribes/…
# ✅ G-U85.7 pozo tracks ATProto+SSB
# ✅ G-U85.8 pozo feed.items navegables · items=2 mode=real
# ✅ G-U85.9–12 auto → sintético
# 🟢 e2e feed-families: todos los gates en verde

$ npm run gates
gates: OK (0 offenders)

$ npm run lint
✖ 12 problems (0 errors, 12 warnings)  # warnings preexistentes ajenos al WP

$ npm run release:changeset-dry
# ⏳ falló restore porque @zeus/feed-kit aún no estaba en git (paquete nuevo);
#   tree restaurado a mano; changeset wp-u85 reescrito. Re-ejecutar tras merge.
```

### Preguntas CA (obligatorias)

| pregunta | evidencia |
| -------- | --------- |
| ¿interfaz común estática/stream/gossip? | `FEED_FAMILIES` + `resolveRuntimeFeeds` en feed-kit; tests 1–4 |
| ¿jetstream→DISK_01 + degradación sintético? | `syncJetstreamFixture` + G-U85.0; auto→sintético G-U85.9–11 |
| ¿e2e auto→sintético? | G-U85.9–12 |
| ¿feed SSB + ATProto navegables en demo? | G-U85.5–8 (pozo tracks/items) |
| ¿delta y pozo por la interfaz? | delta: arg-feeds → feed-kit stream; pozo: authority `resolveRuntimeFeeds` |

¿pozo puede consumir esto tal cual? **Sí** — misma `resolveRuntimeFeeds` /
`families.*.nextItems` sin conceptos de cantera/grifo.

Live jetstream (red real): **⏳ sin verificar** (`ZEUS_JETSTREAM_URL` no
ejercitado; fixture offline cubre el camino DISK_01).

Navegador: no abierto (`ZEUS_OPEN_BROWSER` unset).

## Demolición

Borrados genéricos duplicados en delta:

- `packages/games/delta/arg-feeds/src/real.mjs` (firehose MCP genérico)
- `packages/games/delta/arg-feeds/src/mcp-client.mjs` (probe/clients genéricos)

```
$ rg -n "createRealFeeds|arg-feeds/src/real|arg-feeds/src/mcp-client" packages e2e
# (sin matches)

$ rg -n "from '@zeus/feed-kit'" packages/games
# pozo/authority, arg-feeds/{resolve,maze,exports}, arg-domain/synthetic (subpath)
```

Queda en delta solo maze/cantera (`maze.mjs`) + `resolveRuntimeFeeds` que
ensambla firehose=stream + mazeSource.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no en prod; e2e usa puertos de test
  (exentos). Jetstream default URL solo en feed-kit sync (override env).
- [x] Cadenas if/switch → tabla: familias vía `FEED_FAMILIES` / `wanted.has`.
- [x] Duplicación: genérico movido a feed-kit; arg-feeds no reimplementa probe/list.
- [x] console.log de depuración / TODO sin backlog: logs de CLI sync y warnings
  de resolve (patrón casa).
- [x] Nombres de transición (`legacy`/`v2`/…): ninguno.
- [x] Demolición: grep arriba, cero refs a real/mcp-client borrados.
- [x] Tests de comportamiento: synthetic determinista, auto degrade, jetstream
  fixture, pozo tracks, e2e G-U85.*.
- [x] Arranque real: e2e levantó firehose+ssb MCP + resolve + pozo domain tick.
- [x] README/specs: feed-kit README; ARQUITECTURA/DATOS/VOLUMES/.env.example.
- [x] Diff solo alcance U85: sí (salvo package-lock workspace).

## Hallazgos fuera de alcance

- `release:changeset-dry` rompe el tree si el paquete nuevo no está commiteado
  (`git checkout` pathspec del package.json nuevo). Candidato a harden el script.
- Tras `bag.close()` en e2e aparece un warn `stream prefetch failed: Not connected`
  (prefetch async tardío); no falla gates.
- Gate `KNOWN_ZEUS_PORTS` aún no lista `4114` (SSB); preexistente U84.
- Visores firehose/cache aún no resuelven `ssb://` en browser (track hint
  `ssb-browser` es contrato; UI dedicada pendiente).

## Dudas / bloqueos

Ninguno bloqueante. Push: **no intentado** (política brief).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_

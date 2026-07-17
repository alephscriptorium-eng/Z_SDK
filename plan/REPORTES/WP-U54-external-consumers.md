# WP-U54 · external-consumers — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm chat WP-U54) |
| fecha | 2026-07-17 |
| rama | `wp/u54-external-consumers` |
| commit(s) | `62dcb99` `262ea25` `837b9fe` `3d156e3` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se abrió la frontera tipada para consumidores anónimos (D-18): `@zeus/protocol`
genera `.d.ts` desde las constantes del contrato (misma fuente que AsyncAPI);
`@zeus/rooms` publica `types/index.d.ts` del handshake. `release:dry` falla si
faltan los `.d.ts` prometidos en `types`/`exports.types` y exige `.d.ts` en
protocol/rooms. Documentación de handshake en el portal
(`docs/guide/external-handshake.md`). Smoke `npm run smoke:external-consumer`:
tarballs → install en temp fuera del workspace → join room + intent tipado con
**Node** y **Bun**. Install-from-registry: **⏳** (sin publish). Push/publish:
no intentado.

## Archivos tocados

- `packages/engine/protocol/spec/types-build.mjs` — generado `.d.ts` desde contrato
- `packages/engine/protocol/spec/generate-types.mjs` — writer `types/index.d.ts`
- `packages/engine/protocol/types/index.d.ts` — tipos publicables
- `packages/engine/protocol/test/types-sync.test.mjs` — sync generator ↔ disco
- `packages/engine/protocol/package.json` + `README.md` — `types` / exports / files
- `packages/engine/rooms/types/index.d.ts` — tipos handshake API
- `packages/engine/rooms/package.json` + `README.md` — `types` / exports / files
- `scripts/release-dry.mjs` — verificación `.d.ts` en tarballs (U54)
- `scripts/smoke-external-consumer.mjs` — orquestador smoke externo
- `examples/external-consumer/*` — plantilla consumidor (mjs + ts)
- `docs/guide/external-handshake.md` — handshake anónimo (portal)
- `docs/.vitepress/config.mjs` — sidebar Guía
- `docs/guide/getting-started.md`, `docs/engine/protocol.md`, `docs/engine/rooms-presets.md` — enlaces
- `package.json` — script `smoke:external-consumer`
- `plan/REPORTES/WP-U54-external-consumers.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### `npm run types:generate -w @zeus/protocol`

```
Wrote …/packages/engine/protocol/types/index.d.ts
```

### `npm test -w @zeus/protocol` (15 pass, incl. types-sync)

```
# tests 15
# pass 15
# fail 0
```

### `npm test -w @zeus/rooms` (10 pass)

```
# tests 10
# pass 10
# fail 0
```

### `npm run gates`

```
gates: OK (0 offenders)
```

### `npm run lint`

```
✖ 12 problems (0 errors, 12 warnings)
```

(warnings preexistentes; 0 errors)

### `npm run release:dry` (tipos en tarball)

```
release:dry — 15 publicable package(s), lockstep 0.1.0
…
pack @zeus/protocol@0.1.0 … ok (15 entries, zeus-protocol-0.1.0.tgz)
pack @zeus/rooms@0.1.0 … ok (5 entries, zeus-rooms-0.1.0.tgz)
…
release:dry — all 15 green
```

(protocol pasó de 12→15 entries con `types/`; rooms 4→5)

### `npm run smoke:external-consumer`

```
smoke:external-consumer
  packs:  …/Temp/zeus-u54-packs-…
  clean:  …/Temp/zeus-u54-external-…   # fuera del workspace
  room:   EXTERNAL_SMOKE @ http://localhost:13054

packed zeus-protocol-0.1.0.tgz
packed zeus-rooms-0.1.0.tgz
install from tarballs: ok
.d.ts present in installed packages: ok
socket-server: healthy
Node: {"ok":true,"runtime":"node","room":"EXTERNAL_SMOKE",…,"intent":"ping","game":"smoke-game","event":"intent"}
bun 1.3.11
Bun: {"ok":true,"runtime":"bun",…,"intent":"ping","game":"smoke-game","event":"intent","typed":true}

smoke:external-consumer — GREEN (Node + Bun, tarball install)
registry install: ⏳ (no publish in swarm)
```

### Install-from-registry

⏳ sin publish real (política swarm + hallazgo U50). Equivalente: tarball/`file:`
documentado arriba.

### Handshake en portal

Página `docs/guide/external-handshake.md` + entrada sidebar VitePress
«Handshake externo». Contenido: `ZEUS_SCRIPTORIUM_URL`, auth `{token,room,user}`,
eventos del contrato, smoke. Sin nombres de consumidores concretos (D-18).

### ZEUS_OPEN_BROWSER

Smoke no setea la variable (opt-in intacto).

## Demolición

n/a (WP sin demolición).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: smoke usa puerto aislado vía env
      (`ZEUS_SMOKE_SCRIPTORIUM_PORT`, default 13054 solo en el orquestador de
      smoke — patrón e2e). Docs citan variables, no hardcodean en código de
      paquetes. `game: smoke-game` es id genérico de prueba (no delta/pozo).
- [x] Cadenas if/switch que debieron ser tabla: no introducidas.
- [x] Duplicación: tipos protocol generados desde las mismas constantes que
      AsyncAPI (`types-build.mjs`); rooms types espejan API pública existente.
- [x] console.log / código comentado / TODO: logs del smoke son evidencia CA;
      sin TODO nuevos.
- [x] Nombres fuera de glosario o de transición: no.
- [x] Demolición: n/a.
- [x] Tests: types-sync comprueba sync; smoke ejercita join+intent Node/Bun.
- [x] Arranque real: smoke levantó socket-server y unió room (evidencia arriba).
- [x] README/specs: protocol + rooms README actualizados; AsyncAPI no regenerado
      (sin cambio de contrato).
- [x] Diff solo alcance U54: sí (revertidos lockfile/playbook ajenos).

## Hallazgos fuera de alcance

1. `npm install` en worktree puede dejar `package-lock.json` con churn de
   `@noble/hashes` no relacionado — no se commitó.
2. Logs de `@alephscript/mcp-core-sdk` SocketClient van a stdout y ensucian
   parseo de smoke (mitigado parseando última línea JSON); candidato a silenciar
   en el cliente o flag quiet.
3. U53 paralelo: ambos tocan `release:dry` — U54 solo añadió bloque `.d.ts` al
   final de `verifyTarball`; merge preferido U53 primero si hay choque (brief).

## Dudas / bloqueos

Ninguno bloqueante. Pregunta CA cerrada:

| pregunta | respuesta |
| -------- | --------- |
| ¿`.d.ts` en tarballs (`release:dry`)? | ✅ sí (protocol 15 entries, rooms 5) |
| ¿smoke Node + Bun con evidencia? | ✅ GREEN |
| ¿handshake en portal? | ✅ `/guide/external-handshake` |
| ¿install-from-registry? | ⏳ tarball/file documentado; sin publish |

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_

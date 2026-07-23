# WP-U161 · smoke-zeus-only — reporte

| dato | valor |
| ---- | ----- |
| agente | Worker-U161 |
| fecha | 2026-07-23 |
| rama | `wp/u161-smoke-zeus-only` |
| commit(s) | `d06bb4c4ea2295d9cac8e9476b9bfb3406fe2e76` · `566723059f046a4c53b958345ac872ace76d4484` · _(este reporte)_ |
| eje(s) CA | I (extracción con cableado) + II (demolición con destino canónico) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se endureció el smoke externo (U54) para el CA de scope **solo-`@zeus`**:
`.npmrc` del consumidor sin línea `@alephscript`, pack+install de
`@zeus/socket-core` + `protocol` + `rooms` (socket-core aún no está en
registry), aserción de árbol sin `@alephscript/*`, y arranque
socket-server + cliente rooms (Node + Bun). Se cerró la demolición
residual U160 con destinos canónicos (JSDoc → socket-core) y **excepciones
ops firmadas** donde el arco no extrajo superficie (`/spec`, `/channels`)
o el lock anidado refleja publish pendiente. **No** se tocó
`plan/BACKLOG.md` ni WP-U158. Changesets: N/A (sin cambio de paquetes
publicables).

## Archivos tocados

- `scripts/smoke-external-consumer.mjs` — solo-`@zeus` `.npmrc`, pack
  socket-core, assert árbol, mensaje GREEN U161
- `examples/external-consumer/README.md` — documenta pack triple + npmrc
- `examples/ping-pong-bots/package.json` — dep workspace `@zeus/socket-core`
- `examples/ping-pong-bots/lib/session-participant.mjs` — JSDoc → socket-core
- `examples/ping-pong-bots/apps/spider/index.mjs` — comentario excepción `/channels`
- `examples/ping-pong-bots/README.md` — deps alineadas a la tabla
- `e2e/webrtc-viewer.mjs` — JSDoc → socket-core
- `scripts/spec-generate.mjs` — decisión firmada: excepción ops `/spec`
- `package-lock.json` — lock de ping-pong-bots + socket-core
- `plan/REPORTES/WP-U161-smoke-zeus-only.md` — este reporte

## Evidencia

### Gates (obligatorio)

```
$ npm run gates

> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: OK (0 offenders)
```

### Tests (cliente/servidor monorepo conservados)

```
$ npm test -w @zeus/rooms
# tests 12
# pass 12
# fail 0

$ npm test -w @zeus/socket-server
# tests 2
# pass 2
# fail 0

$ npm test -w @zeus/socket-core
# tests 6
# pass 6
# fail 0

$ npm test -w @zeus/ping-pong-bots
# tests 19
# pass 19
# fail 0
```

### CA — install consumidor `.npmrc` solo-`@zeus` → exit 0

```
$ ZEUS_SMOKE_CLEANUP=1 npm run smoke:external-consumer

smoke:external-consumer (WP-U161 · scope @zeus-only)
  packs:  …/Temp/zeus-u161-packs-…
  clean:  …/Temp/zeus-u161-external-…
  room:   EXTERNAL_SMOKE @ http://localhost:13054

packed zeus-socket-core-0.1.0.tgz
packed zeus-protocol-0.4.0.tgz
packed zeus-rooms-0.1.1.tgz
install from tarballs (solo-@zeus .npmrc): exit 0
consumer .npmrc solo-@zeus + zero @alephscript in tree: ok
.d.ts present in installed packages: ok
socket-server: healthy
Node: {"ok":true,"runtime":"node","room":"EXTERNAL_SMOKE",…,"intent":"ping","game":"smoke-game","event":"intent"}
bun 1.3.11
Bun: {"ok":true,"runtime":"bun",…,"intent":"ping","game":"smoke-game","event":"intent","typed":true}

smoke:external-consumer — GREEN (Node + Bun, tarball install, .npmrc solo-@zeus)
registry install: ⏳ (no publish in swarm; socket-core via tarball)
```

Contenido `.npmrc` escrito por el smoke (solo esta línea de scope):

```
@zeus:registry=https://npm.scriptorium.escrivivir.co
```

### Greps demolición / destino único

```
$ rg -n "from ['\"]@alephscript/mcp-core-sdk" packages
(sin matches)

$ rg -n '@alephscript/mcp-core-sdk' packages --glob '**/package.json'
(sin matches) → PKG_JSON packages = 0

$ rg -n 'export class SocketClient' packages
packages\engine\socket-core\src\client.mjs:80:export class SocketClient extends EventEmitter {

$ rg -n 'export class SocketServer' packages
packages\engine\socket-core\src\server.mjs:67:export class SocketServer {
```

Imports residuales **fuera** de packages (excepciones firmadas abajo):

```
$ rg -n "from ['\"]@alephscript/mcp-core-sdk" scripts examples
scripts\spec-generate.mjs:22:import { buildAllSpecs } from '@alephscript/mcp-core-sdk/spec';
examples\ping-pong-bots\apps\spider\index.mjs:3:import { createChannelsFacade } from '@alephscript/mcp-core-sdk/channels';
```

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u161-smoke-zeus-only` |
| run_id | **N/A** — sin push en este turno |
| workflow | — |
| conclusion | **N/A** |

```
⏳ sin verificar — rama no pusheada; CI Actions no disparado desde el worker.
```

## Eje I — extracción con cableado

- Consumidor de prueba real (temp fuera del workspace) instala tarballs
  `@zeus/*` con `.npmrc` solo-`@zeus`, arranca contra `socket-server` del
  monorepo y emite intent tipado (Node + Bun) — comportamiento, no solo
  `import`.
- El síntoma E404 (falta de scope `@alephscript` al resolver runtime
  rooms→mcp-core) queda cerrado: rooms resuelve `@zeus/socket-core` vía
  tarball; aserción `zero @alephscript in tree`.

## Eje II — demolición con destino canónico

| símbolo / dep | origen residual | destino o excepción |
| ------------- | --------------- | ------------------- |
| `SocketClient` (JSDoc e2e / ping-pong) | `@alephscript/mcp-core-sdk/client` | `@zeus/socket-core/client` |
| dep runtime `@zeus/rooms` / `@zeus/socket-server` | mcp-core-sdk (pre-U160) | `@zeus/socket-core` (U160; verificado 0 en packages) |
| root `devDependency` mcp-core-sdk + `scripts/spec-generate.mjs` `/spec` | `buildAllSpecs` | **excepción ops firmada** — tooling de regeneración YAML bajo `http-contract/spec/mcp-core/`; no runtime `@zeus/*`. Extraer stub = WP futuro con GO |
| `examples/ping-pong-bots` `/channels` (`createChannelsFacade`) | mcp-core-sdk | **excepción ops firmada** — superficie no absorbida por socket-core (solo client/server); demo spider |
| `packages/mesh/operator-ui/package-lock.json` → rooms@0.1.0 + mcp-core | publish antiguo | **excepción ops firmada** — lock anidado de workspace Angular aislado; regenerar tras publish de `rooms`+`socket-core`. No invalida cableado monorepo |

## Demolición

Cierre del arco B residual post-U160: smoke demuestra consumidor sin
scope `@alephscript`; JSDoc vivos apuntan a socket-core; residuales que
siguen tirando de mcp-core quedan **enumerados y firmados** (no
ambigüedad). No se borró el paquete externo (vive fuera del monorepo).

```
$ rg -n '@alephscript/mcp-core-sdk' packages --glob '**/package.json'
(sin matches)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad)

- [x] Puertos/URLs/rutas/rooms hardcodeados: smoke sigue puerto aislado vía
  env (`ZEUS_SMOKE_SCRIPTORIUM_PORT`, default 13054 solo en orquestador de
  smoke). Gates OK
- [x] Cadenas if/switch → tabla: N/A
- [x] Duplicación: no se reimplementó channels/spec; excepciones firmadas
- [x] console.log / código comentado / TODO: logs del smoke = evidencia CA;
  comentarios de excepción ops con WP-id
- [x] Nombres de transición: no
- [x] Demolición: tabla completa; packages PKG_JSON mcp-core = 0; residuales
  firmados
- [x] Tests comportamiento: rooms/socket-server/socket-core/bots + smoke
  join+intent
- [x] Arranque real: smoke levantó socket-server y unió room (evidencia)
- [x] README external-consumer + ping-pong alineados
- [x] Diff solo alcance U161 (bins/types CRLF de `types:generate` revertidos)
- [x] Docs públicas C8/C9: N/A (README example, no portal)
- [x] Changesets: N/A — sin tocar fuentes de paquetes publicables

## Hallazgos fuera de alcance

- `@zeus/socket-core` no publicado en registry (`npm view` → E404); el smoke
  lo cubre con tarball. Publish = ops / Release, no este WP.
- Registry `@zeus/rooms@0.1.1` publicado aún declara dep mcp-core-sdk
  (`npm view` 2026-07-23); el monorepo ya corta. Release post-U160 cierra
  el canal registry.
- Extraer stub de `buildAllSpecs` o `/channels` a Zeus = candidatos a WP
  futuros con GO (no abiertos aquí).
- U158 (smoke TS registry CI) no tocado (GO secuencial R4-Z).

## Dudas / bloqueos

Ninguno bloqueante. Decisión `/spec` y `/channels` firmadas como
excepción ops (no stub en este WP).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con lista numerada)_

# WP-U160 · migrar-corte-mcp-core — reporte

| dato | valor |
| ---- | ----- |
| agente | Worker-U160 |
| fecha | 2026-07-23 |
| rama | `wp/u160-migrar-corte-mcp-core` |
| commit(s) | `ebd0e987d6df51101cd8aa03d550a811cc14082f` · `ac1b14675a023e3d304b120c6ffd84c6b35a1220` · `a50d93f6e895fb2b5f93be6594beb7859b6e36c2` · `21796ba3db6f53ac7aa19da1292034eba815f69f` |
| eje(s) CA | I (extracción con cableado) + II (demolición con destino canónico) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se migraron los consumidores de producción `@zeus/rooms` y `@zeus/socket-server`
a `@zeus/socket-core` (`./client` / `./server`). Se cortó la dependencia
`@alephscript/mcp-core-sdk` en esos `package.json` (rooms también dejó de
declarar `socket.io-client` directo; llega vía socket-core). En
`@zeus/webrtc-signaling` los JSDoc de `SocketClient` apuntan a
`@zeus/socket-core/client`. Changeset patch ×3 + `package-lock.json`.
**No** se tocó root/`examples` (residual explícito → U161). **No** se
tocaron U157/U158/U161 ni `plan/BACKLOG.md`.

## Archivos tocados

- `packages/engine/rooms/package.json` — dep `@zeus/socket-core`; sin mcp-core-sdk ni socket.io-client
- `packages/engine/rooms/src/index.mjs` — import/JSDoc desde `@zeus/socket-core/client`
- `packages/mesh/socket-server/package.json` — dep `@zeus/socket-core`; sin mcp-core-sdk
- `packages/mesh/socket-server/src/create-server.mjs` — `SocketServer` desde socket-core
- `packages/mesh/socket-server/src/relay.mjs` — `SocketClient` desde socket-core
- `packages/mesh/socket-server/src/close-server.mjs` — JSDoc tipos socket-core
- `packages/engine/webrtc-signaling/src/socket-room-signaling.mjs` — JSDoc tipos socket-core
- `.changeset/wp-u160-migrar-corte-mcp-core.md` — patch rooms / socket-server / webrtc-signaling
- `package-lock.json` — workspace lock alineado
- `plan/REPORTES/WP-U160-migrar-corte-mcp-core.md` — este reporte

## Evidencia

### Gates (obligatorio)

```
$ npm run gates

> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: OK (0 offenders)
```

### Tests

```
$ npm test -w @zeus/rooms
# tests 12
# pass 12
# fail 0

$ npm test -w @zeus/socket-server
# tests 2
# pass 2
# fail 0

$ npm test -w @zeus/webrtc-signaling
# tests 22
# pass 22
# fail 0

$ npm test -w @zeus/socket-core
# tests 6
# pass 6
# fail 0
```

### Cableado runtime (Eje I)

```
$ node -e "import('@zeus/rooms')…; import('@zeus/socket-core/client')…"
rooms.createClient SocketClient SocketClient
same class? true
server [ 'SocketServer' ]
```

### Imports / deps mcp-core-sdk en packages (corte)

```
$ rg -n "from ['\"]@alephscript/mcp-core-sdk" packages
(sin matches) → IMPORTS_MCP=0

$ rg -n '@alephscript/mcp-core-sdk' packages --glob '**/package.json'
(sin matches) → PKG_JSON=0
```

### Definición única SocketClient / SocketServer

```
$ rg -n 'export class SocketClient' packages
packages\engine\socket-core\src\client.mjs:80:export class SocketClient extends EventEmitter {

$ rg -n 'export class SocketServer' packages
packages\engine\socket-core\src\server.mjs:67:export class SocketServer {
```

(también `export declare class` en `packages/engine/socket-core/types/{client,server}.d.ts` — tipos del mismo paquete.)

### Residuales fuera del corte @zeus producción (listados · U161 / cola)

| sitio | qué queda |
| ----- | --------- |
| `package.json` (root) | dep `"@alephscript/mcp-core-sdk": "^1.5.0"` |
| `examples/ping-pong-bots/package.json` | misma dep |
| `packages/mesh/operator-ui/package-lock.json` | lock anidado con `@zeus/rooms@0.1.0` publicado aún resolviendo mcp-core-sdk |
| `packages/engine/socket-core/{README,src/*.mjs}` | mención documental del origen (no import ni dep) |

```
$ rg -n '@alephscript/mcp-core-sdk' package.json examples/ping-pong-bots/package.json
package.json:134:    "@alephscript/mcp-core-sdk": "^1.5.0",
examples/ping-pong-bots/package.json:21:    "@alephscript/mcp-core-sdk": "^1.5.0",
```

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u160-migrar-corte-mcp-core` |
| run_id | **N/A** — sin push en este turno |
| workflow | — |
| conclusion | **N/A** |

```
⏳ sin verificar — rama no pusheada; CI Actions no disparado desde el worker.
```

## Eje I — extracción con cableado

- **Declaración:** consumidores de producción `@zeus/rooms` y
  `@zeus/socket-server` importan y ejecutan `SocketClient` /
  `SocketServer` de `@zeus/socket-core` (smoke `instanceof` + tests
  createClient / createScriptoriumServer).
- webrtc-signaling tipa el cliente inyectable contra socket-core; runtime
  sigue pasando por `@zeus/rooms` → socket-core.

## Eje II — demolición con destino canónico

| símbolo / superficie | origen (pre-U160) | destino canónico |
| -------------------- | ----------------- | ---------------- |
| `SocketClient` | `@alephscript/mcp-core-sdk/client` | `@zeus/socket-core/client` (`packages/engine/socket-core/src/client.mjs`) |
| `SocketServer` | `@alephscript/mcp-core-sdk/server` | `@zeus/socket-core/server` (`packages/engine/socket-core/src/server.mjs`) |
| dep runtime rooms | `@alephscript/mcp-core-sdk` | `@zeus/socket-core` |
| dep runtime socket-server | `@alephscript/mcp-core-sdk` | `@zeus/socket-core` |
| tipos JSDoc webrtc-signaling | `import('@alephscript/mcp-core-sdk/client').SocketClient` | `import('@zeus/socket-core/client').SocketClient` |

Una sola definición de clase en el monorepo Zeus: socket-core (grep arriba).

## Demolición

Cortada la dep e imports de `@alephscript/mcp-core-sdk` en paquetes
`@zeus/rooms`, `@zeus/socket-server` y tipado en `@zeus/webrtc-signaling`.
No se borró el paquete externo (vive fuera del monorepo); residuales root /
examples / lock operator-ui → U161.

```
$ rg -n "from ['\"]@alephscript/mcp-core-sdk" packages
(sin matches)

$ rg -n '@alephscript/mcp-core-sdk' packages --glob '**/package.json'
(sin matches)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad)

- [x] Puertos/URLs/rutas/rooms hardcodeados: sin cambios de defaults; rooms
  sigue vía `ZEUS_SCRIPTORIUM_*`; gates OK
- [x] Cadenas if/switch que debieron ser tabla: N/A (solo swaps de import)
- [x] Duplicación: SocketClient/Server viven solo en socket-core; rooms
  envuelve, no redefine
- [x] console.log / código comentado / TODO sin backlog: no añadidos
- [x] Nombres de transición: no
- [x] Demolición: imports+deps packages @zeus = 0; residuales listados
- [x] Tests comportamiento: rooms 12, socket-server 2 (health/close),
  webrtc 22, socket-core 6
- [x] Arranque: unit socket-server levanta http+socket y `/health`; no se
  dejó proceso largo de demo
- [x] README rooms no citaba mcp-core-sdk; sin mentira nueva
- [x] Diff solo alcance U160 (+ changeset/lock/reporte); bins ajenos
  revertidos (ruido CRLF)
- [x] Docs públicas C8/C9: N/A

## Hallazgos fuera de alcance

- Root y `examples/ping-pong-bots` siguen con dep mcp-core-sdk → U161.
- `packages/mesh/operator-ui/package-lock.json` fija `@zeus/rooms@0.1.0`
  publicado con mcp-core-sdk; regenerar tras release rooms patch.
- Menciones documentales en socket-core README/comentarios (U159) siguen
  citando el nombre del paquete origen; no son imports.

## Dudas / bloqueos

Ninguno bloqueante.

---

## Revisión del orquestador

**Aceptado ✅ (orquestador-Z · 2026-07-23).**

- Alcance conforme: no toca BACKLOG ni WPs ajenos.
- Eje I: `rooms` y `socket-server` consumen en producción las clases de
  `@zeus/socket-core`; smoke `instanceof` y tests de comportamiento verdes.
- Eje II: tabla de destino canónico completa; definiciones runtime únicas en
  `packages/engine/socket-core/src/{client,server}.mjs`.
- Corte directo cumplido: cero imports y cero dependencias declaradas de
  `@alephscript/mcp-core-sdk` en los `package.json` de packages.
- Residual honesto: el lock anidado de `operator-ui` refleja una versión
  publicada anterior de `rooms`; queda para la demolición U161 ya prevista y
  no invalida el cableado de U160.
- Re-smoke del orquestador: se ejecutará sobre el tip integrado antes del push.

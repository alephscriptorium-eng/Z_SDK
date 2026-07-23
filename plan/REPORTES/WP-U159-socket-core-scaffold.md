# WP-U159 · socket-core-scaffold — reporte

| dato | valor |
| ---- | ----- |
| agente | Worker-U159 |
| fecha | 2026-07-23 |
| rama | `wp/u159-socket-core-scaffold` |
| commit(s) | `3c0a778ddde2214b7645de7f45712dbf01816d9c` · `84e99b6f982997feb66573642637d519b53fcddb` |
| eje(s) CA | I (extracción; cableado consumidores = U160) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se creó el paquete publicable `@zeus/socket-core` en
`packages/engine/socket-core` (ubicación preferida del brief: engine, junto a
`@zeus/rooms`; mesh lo consumirá en U160). Se portó la superficie usada hoy
desde `@alephscript/mcp-core-sdk`: `SocketClient` (ctor, `.io`, `.room`) y
`SocketServer` (ctor boolean/opciones, `createNamespace`, `.io`) con room
protocol (`CLIENT_REGISTER` / `CLIENT_SUSCRIBE` / `ROOM_MESSAGE` incl.
`MAKE_MASTER` / `SET_*`). Exports `./client` y `./server` (+ types). Tests
unitarios de comportamiento (6). Changeset minor + script root
`test:socket-core`. **No** se migraron `@zeus/rooms` ni `@zeus/socket-server`
(alcance U160).

## Archivos tocados

- `packages/engine/socket-core/**` — creado: paquete, src, types, tests, README
- `.changeset/wp-u159-socket-core.md` — creado: bump minor
- `package.json` — modificado: script `test:socket-core`
- `package-lock.json` — modificado: entrada workspace `@zeus/socket-core`
- `plan/REPORTES/WP-U159-socket-core-scaffold.md` — este reporte

## Evidencia

### Gates (obligatorio)

```
$ npm run gates

> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: OK (0 offenders)
```

### Tests del paquete

```
$ npm test -w @zeus/socket-core

# tests 6
# pass 6
# fail 0
# duration_ms 4177.9659
```

Subtests: ctor client; `room` → envelope `ROOM_MESSAGE`; ctor boolean
server; `createNamespace` path; broadcast peer `PING_PEER`;
`MAKE_MASTER` + `SET_STATE` fan-out.

### Cero imports a mcp-core-sdk en el paquete nuevo

```
$ rg -n "from ['\"]@alephscript/mcp-core-sdk" packages/engine/socket-core
(sin matches) → IMPORTS_MCP=0
```

(README/comentarios citan el paquete origen; no hay `import` ni dep en
`package.json`.)

### Workspace instalable

```
$ node -e "import('@zeus/socket-core/client')…; import('@zeus/socket-core/server')…"
client [ 'SocketClient' ]
server [ 'SocketServer' ]
```

### Consumidores aún no migrados (esperado · U160)

```
packages/engine/rooms/package.json:18:    "@alephscript/mcp-core-sdk": "^1.5.0",
packages/mesh/socket-server/package.json:15:    "@alephscript/mcp-core-sdk": "^1.5.0",
```

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u159-socket-core-scaffold` |
| run_id | **N/A** — sin push en este turno |
| workflow | — |
| conclusion | **N/A** |

```
⏳ sin verificar — rama no pusheada; CI Actions no disparado desde el worker.
```

## Eje I — extracción con cableado

- **Declaración:** el consumidor real de producción (`@zeus/rooms` +
  `@zeus/socket-server`) **llega en WP-U160** (migrar imports + cortar dep
  mcp-core-sdk). Este WP solo scaffold + tests del kit.
- **Evidencia de comportamiento aquí (no solo import):** tests 5–6 ejercitan
  payload `ROOM_MESSAGE` / broadcast a peers y protocolo master-room
  (`MAKE_MASTER` → mapa `rooms`, `SET_STATE` con `sender`).
- Cableado completo Eje I = CA de U160 (brief + REPLAN arco B).

## Demolición

N/A — WP de scaffold; cero símbolos borrados. Dep mcp-core-sdk en rooms /
socket-server intacta a propósito.

```
(no aplica grep de demolición)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad)

- [x] Puertos/URLs/rutas/rooms hardcodeados: default ctor client
  `http://localhost:3000` = paridad con superficie mcp-core-sdk (consumidores
  Zeus siempre pasan URL); gates OK
- [x] Cadenas if/switch que debieron ser tabla: handlers de room protocol
  siguen el flujo del origen (GET_/SET_/MAKE_MASTER); sin nuevas cadenas
  crecientes de negocio
- [x] Duplicación con otros paquetes: intencional hasta U160 (definición
  nueva en socket-core; origen sigue en mcp-core-sdk)
- [x] console.log / código comentado / TODO sin backlog: sin console.log de
  depuración en src (origen ruidoso no portado)
- [x] Nombres fuera de glosario o de transición: `@zeus/socket-core` fijado
  en plan; sin legacy/v2/old
- [x] Demolición completa: N/A
- [x] Tests prueban comportamiento, no solo «no explota»: envelope +
  broadcast + SET_STATE
- [x] Arranque real verificado: unit con httpServer+socket.io en loopback
  (no se levantó socket-server de mesh; eso es U160)
- [x] README/specs del paquete siguen siendo verdad: README = superficie
  portada
- [x] El diff contiene solo el alcance del WP: paquete + changeset + root
  script/lock; sin tocar rooms/socket-server
- [x] Docs públicas C8/C9: N/A (sin docs/**)

## Hallazgos fuera de alcance

- `SocketClient`/`SocketServer` originales en mcp-core-sdk tienen logging
  verboso (`onAny`, admin-ui siempre activo con `true,true`): el port
  silencia logs y permite `activateInstrumens: false` vía opciones; U160
  debe validar que `createScriptoriumServer` con ctor `(name, http, true,
  true)` sigue OK en e2e socket-server.
- Auth validator / CORS custom del server origen están portados de forma
  mínima; si algún consumidor fuera de rooms/socket-server los usa, auditar
  en U160/U161.
- Worktree partió sin `node_modules` completo; `npm install -w
  @zeus/socket-core` bastó para tests del paquete. CI full install = canal
  real post-push.

## Dudas / bloqueos

Ninguno bloqueante. Eje I consumidor de producción queda explícitamente en
U160 (acordado en brief/REPLAN).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_

# WP-U187 · peercard-vivo — marca fila Z (evidencia empaquetada)

| dato | valor |
| ---- | ----- |
| agente | worker-V (swarm F2, ola 2) |
| fecha | 2026-07-31 |
| rama | `wp/u187-peercard-vivo` |
| commit(s) | test e2e + este reporte (hashes en el reporte final del worker) |
| estado propuesto | listo para revisión (contrarrevisión clase peercard §5 esperada) |

## Qué se hizo

Se levantó el socket-server REAL en proceso (puerto efímero, `bridge:
'local'`) y se conectó el cliente `@zeus/rooms` ejecutando
`CLIENT_REGISTER` en las 2 modalidades del contrato (BACKLOG :234;
frontera U186: transporte ≠ permiso):

- **Modalidad A (anónima)**: registro SIN card → sesión conectada; la
  clave `peerCard` NO viaja (ausencia real, ni null — hostil-omite).
- **Modalidad B (card opt-in)**: registro CON peercard válida (forma
  mínima de `packages/engine/protocol/src/peer-card.mjs:4-6`) → la card
  VIAJA en el mensaje y llega INTACTA al servidor (assert `deepEqual`
  sobre el payload recibido server-side).

Todo en un e2e nuevo:
`packages/mesh/socket-server/test/peercard-vivo.test.mjs` (convención
U192: `node:test`, servidor real, puerto 0). Cero ediciones fuera del
test y de este reporte; `packages/mesh/socket-server/src/config.mjs`
intacto (solo lectura, regla §2 del gobierno).

## Comando de reproducción

```
npm test -w @zeus/socket-server          # suite completa (incluye U192)
node --test packages/mesh/socket-server/test/peercard-vivo.test.mjs   # solo U187
```

## Log literal — run 1 (suite completa, 2026-07-31)

```
# [U187][modalidad-A][registro-1] CLIENT_REGISTER en servidor ← {"usuario":"anon-u187","sesion":"anon-u187-1785517556102","type":"ZeusClient","features":["zeus-rooms"]} · peerCard=AUSENTE · id-sesion=anon-u187-1785517556102
# [U187][modalidad-A][registro-2] CLIENT_REGISTER en servidor ← {"usuario":"anon-u187","sesion":"anon-u187-1785517556428","type":"ZeusClient","features":["zeus-rooms"]} · peerCard=AUSENTE · id-sesion=anon-u187-1785517556428
# [U187][modalidad-A] ids coherentes entre re-ejecuciones: anon-u187-1785517556102 → anon-u187-1785517556428 (formato ^anon-u187-\d+$)
# [U187][modalidad-B] CLIENT_REGISTER en servidor ← {"usuario":"card-u187","sesion":"card-u187-1785517556648","type":"ZeusClient","features":["zeus-rooms"],"peerCard":{"roomId":"PUBLIC_ROOM","endpoint":"socket-server/runtime","token":"token-u187","scopes":["role:player","presence:join"],"expiresAt":"2026-07-31T17:06:56.565Z","issuedAt":"2026-07-31T17:05:56.565Z","displayName":"peercard-vivo-u187","sessionId":"sesion-b-u187"}} · peerCard=PRESENTE · id-sesion=card-u187-1785517556648
# [U187][modalidad-B] server retiene card SIN verificar (socket-core onClientRegister): name=card-u187card-u187-1785517556648 · scopes=["role:player","presence:join"]
```

## Log literal — run 2 (re-ejecución independiente, mismo día)

```
# [U187][modalidad-A][registro-1] CLIENT_REGISTER en servidor ← {"usuario":"anon-u187","sesion":"anon-u187-1785517583627","type":"ZeusClient","features":["zeus-rooms"]} · peerCard=AUSENTE · id-sesion=anon-u187-1785517583627
# [U187][modalidad-A][registro-2] CLIENT_REGISTER en servidor ← {"usuario":"anon-u187","sesion":"anon-u187-1785517583756","type":"ZeusClient","features":["zeus-rooms"]} · peerCard=AUSENTE · id-sesion=anon-u187-1785517583756
# [U187][modalidad-B] CLIENT_REGISTER en servidor ← {"usuario":"card-u187","sesion":"card-u187-1785517583985","type":"ZeusClient","features":["zeus-rooms"],"peerCard":{"roomId":"PUBLIC_ROOM","endpoint":"socket-server/runtime","token":"token-u187","scopes":["role:player","presence:join"],"expiresAt":"2026-07-31T17:07:23.892Z","issuedAt":"2026-07-31T17:06:23.892Z","displayName":"peercard-vivo-u187","sessionId":"sesion-b-u187"}} · peerCard=PRESENTE · id-sesion=card-u187-1785517583985
```

## Id reproducible — definición honesta

Id de sesión = campo `sesion` de `CLIENT_REGISTER`, generado por el
cliente rooms como `` `${user}-${Date.now()}` ``
(`packages/engine/rooms/src/index.mjs:66`).

**Reproducible = mismo formato y misma semilla, no mismo valor**: en
cada re-ejecución el id cumple `/^<usuario>-\d+$/` con prefijo de
usuario estable y sufijo epoch-ms monótono. Verificado entre run 1 y
run 2 (arriba): `anon-u187-1785517556102` → `anon-u187-1785517583627`
(mismo formato, misma semilla `anon-u187`, epoch creciente). NO es un
uuid opaco y NO se promete igualdad de valor — prometer eso sería
falso.

## Honestidad — qué hace HOY el servidor con la card recibida

**Nada.** Evidencia:

- `grep -rn "peerCard" packages/mesh/socket-server/src` = **0 hits**
  (hallazgo U179 re-verificado hoy): el porte de la card es del
  cliente; el socket-server ni la nombra.
- El registro lo maneja socket-core
  (`packages/engine/socket-core/src/server.mjs:254-262`,
  `onClientRegister`): copia el payload TAL CUAL a `this.sockets`
  (map por socket.id) y deriva `name`; **no valida forma, frescura,
  firma ni scopes; no emite ack ni error; no loguea** (`grep -c
  console packages/engine/socket-core/src/server.mjs` = 0 — el
  registro es silencioso; el log literal de arriba lo produce el e2e
  observando el evento server-side).
- La VERIFICACIÓN de peercard vive en los consumidores del protocolo:
  torno `packages/engine/webrtc-signaling/src/peer-card-gate.mjs` y
  `packages/engine/reparto-kit/src/permisos.mjs` — no en este server.
- **No se «arregló»**: unificar el plano de card es U188 e identidad
  en el puente es U193 (gobierno §1). Este WP solo da evidencia.

## Caso rojo (para contrarrevisión — comportamiento de facto, sin tapar)

Card inválida/malformada en `CLIENT_REGISTER` (dos sondas: objeto sin
forma de card y no-objeto). **Observado de facto** (test 3 del e2e):

```
# [U187][caso-rojo][objeto-sin-forma] CLIENT_REGISTER en servidor ← {"usuario":"rojo-u187-objeto-sin-forma","sesion":"rojo-u187-objeto-sin-forma-1785517556860","type":"ZeusClient","features":["zeus-rooms"],"peerCard":{"basura":"sin-forma-de-card"}}
# [U187][caso-rojo][objeto-sin-forma] de facto: aceptada+retenida sin validar, sesión viva, cero rastro (endurecer = U188/U193, no este WP)
# [U187][caso-rojo][no-objeto] CLIENT_REGISTER en servidor ← {"usuario":"rojo-u187-no-objeto","sesion":"rojo-u187-no-objeto-1785517557010","type":"ZeusClient","features":["zeus-rooms"],"peerCard":"texto-que-no-es-card"}
# [U187][caso-rojo][no-objeto] de facto: aceptada+retenida sin validar, sesión viva, cero rastro (endurecer = U188/U193, no este WP)
```

El servidor **acepta y retiene la card malformada tal cual, la sesión
sigue conectada y no queda rastro ni rechazo**. En este plano
(socket-server/rooms) la card es hoy carga opaca sin torno; el torno
que sí rechaza (U186: «rechaza, no degrada») vive en la antesala
WebRTC, no aquí. Se documenta sin corregirlo: el arreglo es
U188/U193.

## Suite completa + gates (CA4)

```
$ npm test -w @zeus/socket-server        # tail literal
1..10
# tests 10
# suites 0
# pass 10
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 12922.7179
```

(10 = 3 nuevos U187 + 4 de U192 `relay-trace.test.mjs` + 2 de
`server.test.mjs`; los tests de U192 mergeados siguen verdes.)

```
$ npm run gates
gates: OK (0 offenders)
```

CI: **N/A** — NO push por regla del brief; el run CI queda para el
orquestador al merge.

## LÍNEA DE MARCA propuesta — fila Z del grafo del hub

> El artefacto `GRAFO-STARTERKIT.md` es del HUB (custodio del grafo,
> BACKLOG :287) y está **fuera de este worktree**: yo NO lo escribo.
> El orquestador estampa esta línea al aceptar, adaptando el orden de
> columnas a la tabla MARCAS real del hub si difiere. Todos los campos
> exigidos están presentes: modalidad usada, ruta de evidencia (= este
> reporte), fecha y autoría.

```markdown
| Z | ✅ runtime | CLIENT_REGISTER en 2 modalidades contra socket-server real (A anónima: id `anon-u187-1785517556102`; B card opt-in: id `card-u187-1785517556648`, card viaja intacta) | `plan/REPORTES/U187-marca-Z.md` (Z_SDK · rama `wp/u187-peercard-vivo`) | 2026-07-31 | worker-V (WP-U187) |
```

## Archivos tocados

- `packages/mesh/socket-server/test/peercard-vivo.test.mjs` — creado:
  e2e de las 2 modalidades + caso rojo.
- `plan/REPORTES/U187-marca-Z.md` — creado: este reporte-evidencia.

## Auto-revisión (PRACTICAS §3)

- Puertos/URLs hardcodeados: no — puerto efímero (`port: 0`), URL del
  server real inyectada al cliente.
- Duplicación: patrón `waitFor` reutilizado de `relay-trace.test.mjs`
  (copia local consciente, misma convención de suite).
- console.log: sí, deliberado — es el mecanismo del log literal del CA
  (el servidor es silencioso; está documentado en cabecera del test).
- Tests prueban comportamiento (payload server-side, retención, ids),
  no solo «no explota»; el caso rojo documenta el de facto sin taparlo.
- Diff = solo alcance del WP (`config.mjs` intacto; `rooms/**` y
  `socket-core/**` usados como clientes, sin tocar).
- `@zeus/protocol` NO se importó en el test: no es dep declarada de
  socket-server y `package.json` está congelado — se espejó la forma
  mínima del contrato con cita (`peer-card.mjs:4-6`).

## Hallazgos fuera de alcance

- El registro `CLIENT_REGISTER` es completamente silencioso (0
  console en socket-core server): cuando U218 exija «evidencia de log
  por marca», la fuente natural seguirá siendo observación e2e o un
  log que introduzca U193 — no existe hoy log nativo del registro.
- `name` retenido = concatenación `usuario+sesion` sin separador
  (`card-u187card-u187-…`, server.mjs:260) — cosmético, candidato
  menor para U188/U193.

## Dudas / bloqueos

Ninguno. La única adaptación pendiente (orden de columnas de la tabla
MARCAS del hub) es del estampado del orquestador, fuera de mi mundo.

---

## Revisión del orquestador

_(la rellena el orquestador)_

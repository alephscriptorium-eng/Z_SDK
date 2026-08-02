# WP-U196 · Las zonas dejan de ser un filtro y pasan a ser un ámbito

Rama `wp/u196-zonas-ambito-real` · worktree `C:/S_LAB/wt/z-u196` ·
alcance del diff: `packages/engine/rooms/**` + este reporte.

---

## 1. Qué medí antes de creerme el enunciado

El brief citaba `packages/engine/rooms/src/index.mjs` líneas ~47/50/58/76/78 y
avisaba de que las citas por línea caducan. **Re-medidas contra HEAD
(`git show HEAD:packages/engine/rooms/src/index.mjs | sed -n '47p;50p;58p;76p;78p'`):
las cinco son exactas.** No caducaron:

```
47   *   zones?: string | string[],
50   * `zones` — optional opaque zone interest on CLIENT_SUSCRIBE (logical
58    const zones = options.zones;
76        zones == null ? { room } : { room, zones };
78      return { room, socketId: client.io.id, zones: zones ?? null };
```

Lo que no aguanta la medición no son las líneas: es la frase que ocupa la 50-51.

Lo que no dice esa frase, y sí dice el servidor
(`packages/engine/socket-core/src/server.mjs:269-285`): `onClientSuscribe`
está tipado `{ room?, out? }` y **no lee `zones` en ninguna rama**. El campo
llegaba al servidor y caía al suelo. `broadcast`
(`socket-core/src/server.mjs:372-375`) reparte con `nsp.to(args.room)`. Es
decir: `zones` no era un filtro «lógico pendiente de que la autoridad
recorte»; era un campo **inerte**. El único recorte real vivía en cliente, en
`packages/engine/game-engine/src/zone-subscription.mjs`, sobre el snapshot ya
entregado.

Corolario incómodo: en ese módulo, `normalizeZoneInterest(null)`,
`normalizeZoneInterest([])` y `normalizeZoneInterest('*')` devuelven `null`, y
`interestCoversAll(null) === true`. **Lo ausente significaba «todas»**, justo
lo que el CA4 prohíbe.

## 2. Qué cambié

Una zona deja de viajar como interés y pasa a ser **sufijo de canal**:
`sala` + zona `norte` → canal `sala::z:norte`, que es una sala de socket.io
distinta. El aislamiento lo hace el servidor al **repartir**, no el cliente al
descartar. **Cero ediciones en `@zeus/socket-core`**: se usa el mecanismo de
salas que ya existía.

Superficie nueva en `@zeus/rooms` (`src/index.mjs`):

| export | qué hace |
|---|---|
| `ZONE_SCOPE_SEPARATOR` | `'::z:'` |
| `zoneChannel(room, zone)` | canal físico; valida el id |
| `normalizeZones(zones)` | lista sin blancos ni duplicados, en orden de aparición |
| `resolveZoneChannels(room, zones)` | `{ zones, channels }` |

Superficie cambiada:

- `connectAndJoin` emite **un `CLIENT_SUSCRIBE` por canal**
  (`{ room: canal, zone }`) en vez de uno con `zones` dentro; devuelve
  `{ room, socketId, zones: string[], channels: string[] }`.
- `emitRoomEvent(client, event, data, room, zone?)`,
  `setState(client, room, data, zone?)`, `makeMaster(client, room, data, zone?)`
  aceptan `zone` y dirigen al canal. Sin `zone`, comportamiento idéntico al de
  antes.
- `types/index.d.ts`, `README.md` y `CHANGELOG.md` del paquete, alineados.

El `zone` que viaja en el sobre describe **lo que el canal es**, no un interés
que el servidor deba honrar: si el servidor lo ignorase por completo, el
aislamiento seguiría en pie. Esa es la diferencia con el diseño anterior.

## 3. Orden exacta y salida literal

Entorno: Node v22.21.1, Windows. `node_modules` del worktree montado a mano
(ver §8).

### 3.1 CA1 · rojo contra el código de hoy

Los tests finales corridos contra `git show HEAD:.../src/index.mjs`
(script en scratchpad; restaura el fuente al terminar — se verificó
`restaurado idéntico: true`):

```
ok 10 - onState subscribes to SET_STATE
not ok 11 - connectAndJoin emits one CLIENT_SUSCRIBE per zone channel
  operator: 'deepStrictEqual'
ok 12 - connectAndJoin forwards peerCard on CLIENT_REGISTER
not ok 13 - CA1/CA2 · mismo topic en dos zonas = dos conversaciones (entregas contadas en el servidor)
  expected: 1
  actual: 2
  operator: 'strictEqual'
not ok 14 - CA2 · el aislamiento se prueba en los DOS sentidos (0 entregas cruzadas)
  operator: 'deepStrictEqual'
# [U196 fan-out] {"sinZonas":{"emisiones":1,"porEmision":[6],"total":6,"canales":8},"dosZonas":{"emisiones":2,"porEmision":[6,6],"total":12,"canales":8},"seisZonas":{"emisiones":6,"porEmision":[6,6,6,6,6,6],"total":36,"canales":8}}
not ok 15 - CA3 · fan-out medido: 6 suscriptores repartidos en 1, 2 y 6 zonas
  operator: 'deepStrictEqual'
not ok 16 - CA4 · sin zonas declaradas NO se recibe lo emitido en una zona (0 entregas)
  expected: 0
  actual: 1
  operator: 'strictEqual'
not ok 17 - CA4 · null, [] y cadena vacía se comportan igual que omitir (mismo canal, 1 alta)
  expected: 0
  actual: 5
  operator: 'strictEqual'
not ok 18 - CA4 · la misma zona repetida es UNA membresía y UNA entrega, no dos
  expected: 'ROOM_U196_DUP'
  actual: 'ROOM_U196_DUP'
  operator: 'notStrictEqual'
not ok 19 - CA4 · dos suscriptores en la MISMA zona son una conversación de dos (2 entregas)
  expected: 2
  actual: 3
  operator: 'strictEqual'
not ok 3 - test\zonas-contrato.test.mjs
# tests 20
# pass 11
# fail 9
```

Fallan con **cifras**, no con un error de importación — salvo
`zonas-contrato.test.mjs`, que contra HEAD no enlaza porque los exports no
existían. Lo digo tal cual en vez de disfrazarlo.

### 3.2 Verde después

```
$ cd C:/S_LAB/wt/z-u196/packages/engine/rooms
$ node --test --test-reporter=tap test/*.mjs
ok 11 - connectAndJoin emits one CLIENT_SUSCRIBE per zone channel
ok 13 - CA1/CA2 · mismo topic en dos zonas = dos conversaciones (entregas contadas en el servidor)
ok 14 - CA2 · el aislamiento se prueba en los DOS sentidos (0 entregas cruzadas)
# [U196 fan-out] {"sinZonas":{"emisiones":1,"porEmision":[6],"total":6,"canales":8},"dosZonas":{"emisiones":2,"porEmision":[3,3],"total":6,"canales":9},"seisZonas":{"emisiones":6,"porEmision":[1,1,1,1,1,1],"total":6,"canales":13}}
ok 15 - CA3 · fan-out medido: 6 suscriptores repartidos en 1, 2 y 6 zonas
ok 16 - CA4 · sin zonas declaradas NO se recibe lo emitido en una zona (0 entregas)
ok 17 - CA4 · null, [] y cadena vacía se comportan igual que omitir (mismo canal, 1 alta)
ok 18 - CA4 · la misma zona repetida es UNA membresía y UNA entrega, no dos
ok 19 - CA4 · dos suscriptores en la MISMA zona son una conversación de dos (2 entregas)
ok 20..30  (contrato: canal, tabla de la ausencia, '*', separador, tipos, cable)
# tests 30
# pass 30
# fail 0
```

### 3.3 Dónde se cuenta

En `packages/engine/rooms/test/zonas-ambito.test.mjs`, `trackDeliveries()`
envuelve `nsp.adapter.broadcast` y, **sólo durante esa llamada**, sustituye
`adapter.apply` por un espía que incrementa una vez por cada socket al que el
adaptador escribe de verdad (`socket.client.writeToEngine`). No estima por
tamaño de sala: cuenta la escritura. Servidor real
(`SocketServer` de `@zeus/socket-core`), clientes reales
(`socket.io-client` 4.8.3), puerto efímero en `127.0.0.1`.

Las aserciones sobre lo que el cliente vio están rotuladas *corroboración* en
el propio test. Ninguna sostiene un CA por sí sola.

## 4. Fan-out, con sus cifras

6 suscriptores, una emisión que quiere alcanzar a los 6.
`canales` = `nsp.adapter.rooms.size` (incluye la sala privada por socket:
6 suscriptores + 1 emisor = 7 de base).

| reparto | emisiones para cubrir 6 | entregas por emisión | entregas totales | canales |
|---|---|---|---|---|
| **HOY** — sin zonas | 1 | `[6]` | **6** | 8 |
| **HOY** — 2 zonas (3+3) | 2 | `[6, 6]` | **12** | 8 |
| **HOY** — 6 zonas (1×6) | 6 | `[6, 6, 6, 6, 6, 6]` | **36** | 8 |
| **U196** — sin zonas | 1 | `[6]` | **6** | 8 |
| **U196** — 2 zonas (3+3) | 2 | `[3, 3]` | **6** | 9 |
| **U196** — 6 zonas (1×6) | 6 | `[1, 1, 1, 1, 1, 1]` | **6** | 13 |

Lectura honesta:

- **El fan-out mejora, y mucho, en el caso zonificado.** Hoy, con 6 zonas,
  cubrir la sala cuesta **36 entregas** de las cuales **30 se descartan en
  cliente**. Con U196 cuesta **6**, cero descartes. El factor es exactamente
  la población de la sala.
- **El caso sin zonas no cambia**: 1 emisión, 6 entregas, mismos canales.
  Quien no usa zonas no paga nada.
- **El coste por emisión no baja de balde**: no existe «emitir a todas las
  zonas». Alcanzar N zonas son **N mensajes cliente→servidor** (columna
  «emisiones»). Hoy también lo son —el emisor ya emitía una vez por zona— pero
  conviene decirlo: si alguien esperaba que U196 le regalara un multicast, no.
- **Memoria: un canal más por zona.** 8 → 9 con 2 zonas, 8 → 13 con 6. Es
  exactamente `+1` entrada en **`adapter.rooms`** (un `Map`→`Set` de sids) por
  zona con al menos un suscriptor. La sala desnuda **desaparece** del
  adaptador cuando todos los suscriptores están zonificados (por eso 6 zonas
  dan 13 y no 14).
- **Corrección (contrarrevisión).** «Las zonas vacías no existen» es cierto de
  `adapter.rooms` y **falso** del libro propio del servidor
  (`SocketServer.roomsSockets`). Medido con 1 cliente en 5 zonas, tras
  desconectarlo:

  ```
  — tras desconectar al ÚNICO cliente —
  adapter.rooms  (canales de zona): 0
  roomsSockets   (canales de zona): 5
  sids muertos retenidos en roomsSockets: 5
  claves residuales: ["SALA_RESIDUO::z:z1", ... ,"SALA_RESIDUO::z:z5"]
  ```

  `onDisconnect` (`socket-core/src/server.mjs:237-247`) sólo purga las salas
  donde el socket era master. **No lo introduzco yo**, pero **cambio la ley de
  crecimiento**: de `O(nº de salas)` —vocabulario corto, fijo, escrito en el
  código— a `O(nº de nombres de zona jamás usados)`, que son cadenas libres y
  deliberadamente sin permiso. Queda en el README como aviso al llamante
  («elige ids de zona de un vocabulario acotado») y como hueco enrutado a
  quien posea `socket-core`.
- **Coste por mensaje**: el nombre del canal es `room + 4 + len(zona)` bytes,
  y sólo viaja en `CLIENT_SUSCRIBE` y en el sobre `ROOM_MESSAGE`, no en cada
  entrega. La carga útil no crece.

## 5. Qué hace cada forma de «nada» (CA4)

Fijado en `resolveZoneChannels` y verificado en
`test/zonas-contrato.test.mjs` (tabla de 14 filas) y, en el servidor, en los
tests 16–18.

| entrada | zonas | canales | por qué es lo correcto |
|---|---|---|---|
| omitido / `undefined` | `[]` | `[room]` | La ausencia es el **ámbito sin zona**, no todas. Da lo más pequeño, nunca lo más grande |
| `null` | `[]` | `[room]` | idem: `null` es ausencia, no comodín |
| `[]` | `[]` | `[room]` | una lista vacía de zonas es **ninguna** zona; leerla como «todas» es el error exacto que hereda `normalizeZoneInterest` |
| `''` / `'   '` | `[]` | `[room]` | un nombre en blanco no es un nombre de zona |
| `['a', '']` | `['a']` | `[room::z:a]` | los blancos **caen**; una entrada vacía no puede ensanchar el ámbito |
| `['a', 'a']`, `['a', ' a']` | `['a']` | `[room::z:a]` | una membresía, **una** entrega (medido: test 18) |
| `'a'` / `['a']` | `['a']` | `[room::z:a]` | ámbito único; **no** incluye la sala desnuda |
| `'*'` | — | **lanza** | Aquí no hay comodín. Convertirlo en el canal literal `room::z:*` aislaría en silencio a quien creía pedirlo todo (que es como lo lee `@zeus/game-engine`). Falla en voz alta |
| `'a::z:b'` | — | **lanza** | fugarse a otro ámbito por construcción de nombre |
| `[1]`, `[null]`, `{}` | — | **lanza** | tipos imposibles, cerrado |

Dos comprobaciones que sostienen «la ausencia no es todas» **en el servidor**,
en los dos sentidos (test 16):

- suscriptor sin zona + emisión en zona `norte` → **0 entregas**;
- suscriptor en `norte` + emisión en la sala desnuda → **1 entrega**, y es
  la del que no declaró zona; el de `norte` no la ve.

Y test 17: las **cinco** formas de «nada» (`omitido`, `null`, `[]`, `''`,
`'   '`) caen en **un solo canal**, que es la sala desnuda —comprobado leyendo
el libro del servidor, no el cliente— y ninguna recibe lo zonificado.

Un detalle validado a propósito: `zones: ['norte']` **no** suscribe también a
la sala desnuda. Estar en un ámbito es estar en él y no en el de al lado. Es
un cambio de comportamiento respecto a hoy (hoy todo el mundo lo ve todo) y
está declarado como ruptura en el CHANGELOG.

## 6. Censo de mutación: qué vigila cada test

Cuatro mutaciones aplicadas al fuente, suite completa corrida con cada una,
fuente restaurado y verificado idéntico (`OK: idéntico al original`).

| # | mutación | verde→rojo | tests que la cazan |
|---|---|---|---|
| **M1** | `zoneChannel` devuelve `room`: **aislamiento apagado** | 30→17 (13 rojos) | 8 de servidor + 5 de contrato |
| **M2** | `normalizeZones` no deduplica | 30→26 (4 rojos) | 18, 21, 22, 27 |
| **M3** | guardias apagados: `'*'` y el separador pasan | 30→27 (3 rojos) | 23, 24, 28 |
| **M4** | el suscriptor de zona entra **además** en la sala desnuda (ámbito ensanchado) | 30→25 (5 rojos) | 11, 16, 18, 21, 27 |

*(Cifras de la 1ª vuelta, con 30 tests. El censo definitivo, con 8 mutantes y
36 tests, está en §11.4.)*

Rojos literales de M1:

```
=== M1 · aislamiento apagado: la zona no cambia el canal
exit=1 pass=17 fail=13
  ROJO: connectAndJoin emits one CLIENT_SUSCRIBE per zone channel
  ROJO: CA1/CA2 · mismo topic en dos zonas = dos conversaciones (entregas contadas en el servidor)
  ROJO: CA2 · el aislamiento se prueba en los DOS sentidos (0 entregas cruzadas)
  ROJO: CA3 · fan-out medido: 6 suscriptores repartidos en 1, 2 y 6 zonas
  ROJO: CA4 · sin zonas declaradas NO se recibe lo emitido en una zona (0 entregas)
  ROJO: CA4 · null, [] y cadena vacía se comportan igual que omitir (mismo canal, 1 alta)
  ROJO: CA4 · la misma zona repetida es UNA membresía y UNA entrega, no dos
  ROJO: CA4 · dos suscriptores en la MISMA zona son una conversación de dos (2 entregas)
  ROJO: zoneChannel deriva el canal de la sala y es determinista
  ROJO: CA4 · tabla de decisión: ninguna forma de «nada» significa «todas»
  ROJO: connectAndJoin: una suscripción POR zona, cada una a su canal
  ROJO: emitRoomEvent / setState / makeMaster dirigen al canal de la zona
  ROJO: emitir sin zona y emitir en zona son destinos distintos
```

**El censo encontró un test que no vigilaba nada.** En la primera versión,
«la misma zona repetida es UNA membresía y UNA entrega» seguía **verde contra
el código de hoy**: una sala desnuda única también da «1 canal, 1 alta, 1
entrega». Se le añadieron tres aserciones (el canal debe **ser** de zona,
derivar de la sala, y el contrato de vuelta declarar la zona una sola vez) y
pasó a rojo. Queda dicho porque es exactamente el fallo que el WP pedía
cazar.

**M4 enseña algo que conviene no confundir**: ensanchar el ámbito **no**
enrojece CA1/CA2/CA3. Aislamiento zona↔zona y fuga sala→zona son propiedades
**distintas**, vigiladas por tests distintos. Quien lea «hay aislamiento» sin
más estaría leyendo de menos.

## 7. Compatibilidad: qué encontré con grep

```
grep -rn "connectAndJoin\s*\(" --include=*.{mjs,js,ts}
grep -rn "zones" --include=*.{mjs,js,ts}
grep -rn "\.zones" --include=*.{mjs,js,ts} packages examples e2e scripts
```

**Ningún consumidor vivo del repo pasa `zones` a `connectAndJoin`.** Hay **19
llamadas en 18 ficheros** fuera de `packages/engine/rooms/` (`authority-kit`,
`webrtc-signaling`, `cache-browser`, `firehose-browser`, `player-ui`,
`player-mcp-kit`, `socket-server/test`, 8 examples, 2 e2e) y **cero** mencionan
`zones` en su bloque de llamada. Para todas ellas el cable no cambia: un
`CLIENT_SUSCRIBE { room }`, idéntico byte a byte. La única referencia previa
al campo era el propio test de `@zeus/rooms`, reescrito.

**Ningún consumidor lee `.zones` del retorno** de `connectAndJoin` fuera del
paquete, así que el cambio `null` → `[]` no rompe a nadie hoy. Queda declarado
en el CHANGELOG por si alguien externo lo consume.

Suites de consumidores corridas, todas verdes y sin tocarlas:

| paquete | resultado |
|---|---|
| `@zeus/socket-server` | 23/23 |
| `@zeus/webrtc-signaling` | 85/85 |
| `@zeus/player-mcp-kit` | 12/12 |
| `@zeus/game-engine` | 10/10 |
| `@zeus/authority-kit` | 16/16 |
| `@zeus/player-ui` | 14/14 |
| `@zeus/room-client-browser` | 7/7 (con `--experimental-test-module-mocks`, como declara su `npm test`) |
| `@zeus/socket-core` | 6/6 (sin una sola edición) |
| `eslint packages/engine/rooms` | exit 0 |

### Lo que SÍ queda desalineado, y no arreglo (fuera de mi alcance)

1. **`packages/engine/game-engine/spec/gamechannel/TOPICS.md:142,144`** —
   *«Rooms wire | `CLIENT_SUSCRIBE { room, zones? }` declara interés; fan-out
   físico sigue siendo room-wide»* y *«Default | `zones` ausente / `*` =
   firehose (compat)»*. Las dos frases son **falsas** después de U196.
2. **`packages/engine/game-engine/spec/gamechannel/SUBSCRIPTIONS.md:66-74`** —
   documenta el sobre `{"room": "PUBLIC_ROOM", "zones": ["editores"]}` y
   *«Emitido en `CLIENT_SUSCRIBE` vía `connectAndJoin({ zones })`. Ausente /
   `*` = firehose»*. El sobre ya no es ése.
3. **`packages/engine/game-engine/src/zone-subscription.mjs`** sigue leyendo
   ausencia y `'*'` como «todas» (`normalizeZoneInterest` → `null` →
   `interestCoversAll`). No es contradictorio *per se* —es recorte de snapshot
   en cliente, otra capa— pero convive con una lectura opuesta de la misma
   palabra. Si alguien pasa `'*'` a `@zeus/rooms` **ahora recibe una
   excepción**, y es deliberado: mejor eso que aislarlo en silencio.
4. **`packages/engine/room-client-browser`** emite `CLIENT_SUSCRIBE { room }` a
   pelo (`browser/room-client.browser.mjs:61`) y **no tiene forma de entrar en
   una zona**. No se rompe; simplemente no participa del ámbito.
5. **ACL latente en `socket-core`**: `ensureRoomAllowed`
   (`server.mjs:161-176`) compara el `room` contra `decision.rooms` de un
   `authValidator`. Si algún día un validador devuelve una allowlist con
   nombres de **sala**, los canales `sala::z:zona` **no** estarán en ella y la
   suscripción será rechazada con `auth_error`. Hoy es inerte: ningún servidor
   del repo pasa `authValidator` (grep: sólo aparece en `socket-core`). Lo
   dejo escrito porque es la trampa que se muerde sola cuando U188/U193
   endurezcan el plano.

`packages/engine/http-contract/spec/mcp-core/runtime.asyncapi.yaml` sólo
nombra `CLIENT_SUSCRIBE` (línea 53-54) sin esquema de payload: no se rompe.

## 8. El montaje que tuve que declarar

El worktree venía **sin `node_modules`**. Para correr servidor y clientes de
verdad monté enlaces (junctions, todo dentro de mi worktree, `node_modules/`
está en `.gitignore` → **cero impacto en el diff**):

- terceros (`socket.io` 4.8.3, `socket.io-client` 4.8.3, `@socket.io/admin-ui`,
  `eslint`, …) → `C:/S_LAB/z-sdk/node_modules` (checkout principal de MI repo,
  sólo lectura);
- `@zeus/*` → los paquetes de **este** worktree, para que nada resuelva a
  código de otra rama.

No se ejecutó `npm install` ni `npm ci`; el lockfile no se tocó. No se usó
`npx`. No hubo `git push`, `git stash` ni ediciones fuera del alcance.

## 9. Qué resiste

- Dos zonas con el mismo topic son dos canales distintos en el servidor, y
  cada emisión escribe **sólo** a los sockets de su canal. Contado, no
  razonado.
- El aislamiento zona↔zona está probado **en los dos sentidos** (norte→sur y
  sur→norte, 0 entregas cruzadas). Ambos sentidos, no uno.
- La fuga sala↔zona está probada **en los dos sentidos**: la sala desnuda no
  entra en la zona, la zona no entra en la sala desnuda. **Y para toda la
  familia de nombres de sala**, no sólo para uno: desde la 2ª vuelta el
  separador está prohibido también en `room`, así que no existe un segundo
  camino para construir el mismo canal (§11, bloqueante 1).
- Ninguna forma de ausencia (`undefined`, `null`, `[]`, `''`, `'   '`, lista
  de blancos, `Set` vacío) ensancha el ámbito. Verificado en el contrato y en
  el libro del servidor.
- Un id de zona no puede fabricar otro ámbito por el separador, ni colarse
  como comodín. Falla cerrado, antes de abrir el socket.
- Una zona repetida es una membresía y una entrega.
- Los cuatro mutantes enrojecen.

## 10. Qué NO cubro

- **El ámbito NO sobrevive al relay.** `emitDownstream`
  (`packages/mesh/socket-server/src/relay.mjs:70-96`) reparte con
  `localNs.emit(...)`, de namespace entero, **ignorando `payload.room`**.
  Sonda ad-hoc (no comiteada, fuera de mi alcance) sobre un `localNs` falso,
  con `room: 'SALA::z:norte'`:

  ```
  repartos por canal: 0 | repartos a namespace entero: 2
  ```

  Es herencia: las **salas** ya se perdían ahí antes de U196, así que esto no
  lo empeora; las zonas heredan el agujero. **El aislamiento demostrado es
  intra-servidor.** Con puente remoto activo
  (`ZEUS_SCRIPTORIUM_BRIDGE=remote`) no lo he demostrado y no lo afirmo.
- **No hay ACL de zona.** Cualquiera que sepa el nombre de una zona puede
  suscribirse a ella. `zoneChannel` es determinista y adivinable a propósito.
  Esto es **ámbito**, no permiso; el permiso es del carril peercard/torno.
- **No hay descubrimiento ni enumeración** de zonas: nadie puede preguntar
  «¿qué zonas hay?» ni «¿quién está en esta zona?» más allá de lo que ya
  expone `roomsSockets`.
- **No hay altas ni bajas de zona en caliente.** `connectAndJoin` fija los
  canales en el momento del alta; para cambiar de zona hay que re-suscribir a
  mano (el `{ room, out: true }` del servidor existe, pero `@zeus/rooms` no lo
  envuelve). No lo he tocado.
- **No he medido con adaptador distribuido** (Redis y compañía). Todas las
  cifras son del adaptador en memoria de un proceso. Con varios nodos, el
  coste por zona es otro y no lo he tomado.
- **No he medido a escala.** 6 suscriptores y hasta 6 zonas. La forma de la
  curva (entregas = tamaño de la zona) es estructural, pero la constante a
  1.000 zonas no la he tomado.
- **`@zeus/game-engine` sigue con su lectura antigua** de `'*'` y de la
  ausencia. Documentado en §7, no corregido: está fuera del alcance.
- **`@zeus/room-client-browser` no puede entrar en una zona.** Fuera del
  alcance.
- **No he corrido la batería e2e** (`e2e/*.mjs`): necesita servicios vivos.
  Las llamadas que hacen a `connectAndJoin` omiten `zones`, así que por
  inspección el cable no les cambia — pero es inspección, no medida, y lo
  marco como tal.

---

# 11. Segunda vuelta · devolución de la contrarrevisión

Un bloqueante y cuatro menores. Todo lo corregido cabe en `src/index.mjs`
(un guardia y su aplicación), sus tests, `README.md` y `types/`. **No se tocó
`@zeus/socket-core`**: la premisa «cero ediciones» sigue en pie.

## 11.1 · BLOQUEANTE 1 — CERRADO. El guardia era de un solo lado

Tenían razón y la frase de mi §9 era más ancha que la evidencia:
`assertZoneId` prohibía el separador en la zona, pero `assertRoom` aceptaba
cualquier cadena no blanca. Con `room = 'SALA::z:norte'` y `zones` omitido se
caía en el canal de la zona `norte` sin declarar zona ninguna, y al revés.
El aislamiento estaba probado **para un nombre de sala**, no para la familia.

Arreglo: `assertRoom` (`src/index.mjs:53-72`) rechaza el separador, y se
aplica en **las cuatro puertas públicas** — `resolveZoneChannels` (y por tanto
`connectAndJoin`), `emitRoomEvent`, `setState`, `makeMaster`. La rama «sin
zona» de las tres emisoras no pasaba por ningún guardia; ahora sí.

Vector re-ejecutado contra `SocketServer` real, test 19
(`test/zonas-ambito.test.mjs`):

```
ok 19 - CA2 · una SALA no puede llamarse como el canal de una zona (vector de la contrarrevisión)
```

Cubre las dos direcciones que señalaba la devolución: suscribirse con la sala
disfrazada **rechaza**, emitir a ese nombre sin zona **rechaza**, y el canal
legítimo de ana sigue con **1 entrega**, un solo socket. Que el guardia hace
el trabajo lo prueba el mutante **XB** (§11.4): al apagarlo mueren 3 tests.

Respeté la acotación:

- **No** toqué `socket-core/src/server.mjs`. La disjunción de verdad vive en
  `:269-285` y sigue siendo de su dueño.
- Verifiqué el «es gratis»: `grep` de `::` en nombres de sala del repo →
  **cero coincidencias** (la única línea que aparece es mi propio test
  afirmando la forma del canal).

**Límite declarado, no cerrado desde aquí**: hay **tres** emisores que ponen
`CLIENT_SUSCRIBE { room }` en el cable a pelo, sin pasar por `@zeus/rooms`, y
mi guardia no los alcanza:

| fichero | línea |
|---|---|
| `packages/engine/room-client-browser/browser/room-client.browser.mjs` | 61 |
| `packages/engine/webrtc-signaling/src/socket-room-signaling.mjs` | 192 |
| `packages/mesh/webrtc-viewer/src/browser/browser-signaling.mjs` | 276 |

Los dos primeros los señalaba la devolución; el tercero lo encontré al
grepear. Para los tres, `room` viene de fuera (`ZEUS_SCRIPTORIUM_ROOM`,
`?room=` con precedencia máxima en `3d-monitor/src/viewer-config.mjs:19-21`)
y llega sin validar. **La disjunción sólo es hermética para quien entre por
`@zeus/rooms`.** Cerrarla de verdad es poner el guardia en el servidor, que
es justo lo que la acotación me prohíbe.

## 11.2 · MENOR 2 — CERRADO como asimetría declarada (semántica sin tocar)

Confirmado: los guardias de emisión eran `zone == null`, no falsy, mientras
`normalizeZones` descarta blancos. Cobertura cero.

Mantengo el fallo cerrado, como pedían, y lo documento en los **tres** sitios
que viajan: JSDoc de `emitRoomEvent`, `types/` y README. La razón, escrita: al
**suscribir**, tratar el blanco como ausencia da el ámbito *más pequeño* (no
recibes de más); al **emitir**, tratarlo como ausencia publicaría en un
destino que el llamante no pidió y que ningún suscriptor de zona oye.
`cfg.zona ?? ''` revienta **a propósito**, en vez de publicar en el sitio
equivocado en silencio.

Clavado en el test 30, que recorre las cuatro emisoras y comprueba además que
**ninguna emisión escapa** antes del throw.

## 11.3 · MENOR 3 — los tres supervivientes, muertos

- **X3** (`''` como ausencia al emitir) → lo mata el test 30.
- **X13** (`resolveZoneChannels` sin su `assertRoom`) → tenían razón en que el
  test viejo estaba satisfecho por el guardia de `zoneChannel`. Test 27 nuevo:
  `resolveZoneChannels('', undefined)`, `('   ', null)`, `('', [])`,
  `(undefined, undefined)`. La rama sin zonas ya no pasa sin guardia.
- **X6** (mayúsculas) → **decidido: SENSIBLE A MAYÚSCULAS.**

### Qué decidí sobre mayúsculas, y por qué

`'Norte'` y `'norte'` son **dos zonas distintas**, igual que son dos salas
distintas para socket.io. El id de zona es un token opaco y no se normaliza.

El motivo no es comodidad: **plegar mayúsculas uniría dos ámbitos que el
llamante declaró separados, y unir ámbitos es ensanchar** — la única dirección
que este WP no se permite en ningún caso. Todo el resto del diseño empuja al
ámbito más pequeño ante la duda (la ausencia, el blanco, la lista vacía); la
insensibilidad sería la única regla que empuja al revés. Lo único que se
recorta es el blanco de los bordes (`' norte '` → `'norte'`), donde no hay
ambigüedad de intención.

Escrito en el JSDoc de `zoneChannel`, en `types/` y en el README; clavado en
el test 31, que además comprueba que el nombre de **sala** tampoco se pliega.

## 11.4 · Censo definitivo: 8 mutantes, 36 tests, cero supervivientes

```
M1  aislamiento apagado                          pass=21 fail=15
M2  deduplicación apagada                        pass=31 fail=5
M3  guardias de ZONA apagados ('*', separador)   pass=33 fail=3
M4  ámbito ensanchado (zona + sala desnuda)      pass=29 fail=7
XB  guardia de SALA apagado  [BLOQUEANTE]        pass=33 fail=3
X3  emisión trata '' como ausencia               pass=35 fail=1
X6  zoneChannel pliega mayúsculas                pass=35 fail=1
X13 resolveZoneChannels sin assertRoom           pass=33 fail=3

--- fuente restaurado ---
OK: idéntico al original
supervivientes: ninguno
```

Rojos de XB, el del bloqueante:

```
  ROJO: CA2 · una SALA no puede llamarse como el canal de una zona (vector de la contrarrevisión)
  ROJO: el nombre de SALA tampoco puede llevar el separador (espacios disjuntos)
  ROJO: el guardia de sala cubre las cuatro puertas públicas
```

## 11.5 · MENOR 4 — frase acotada y ley nueva declarada

Medido por mi cuenta, no dado por bueno: §4 corregido. `adapter.rooms` sí se
vacía; `roomsSockets` retiene **5 claves y 5 sids muertos** con 1 cliente en 5
zonas. La ley de crecimiento pasa de `O(nº de salas)` a `O(nº de nombres de
zona jamás usados)`. En el README como aviso operativo.

## 11.6 · MENOR 5 — el matiz ahora viaja en el tarball

`README.md` y `types/index.d.ts` se publican; §10 no. Añadido a los dos:

- el aislamiento es **intra-servidor** y **no sobrevive al relay** (con
  `ZEUS_SCRIPTORIUM_BRIDGE=remote` todo evento de bajada alcanza a todo socket
  del namespace);
- **ámbito ≠ permiso**: el nombre de canal es determinista y adivinable a
  propósito;
- sensibilidad a mayúsculas y la asimetría del blanco.

## 11.7 · Estado tras la 2ª vuelta

| comprobación | resultado |
|---|---|
| suite `@zeus/rooms` | **36/36** (eran 30; +6 de la devolución) |
| censo de mutación | 8 mutantes, **0 supervivientes** |
| `eslint packages/engine/rooms` | exit 0 |
| socket-server / webrtc-signaling / player-mcp-kit | 23 · 85 · 12 |
| game-engine / authority-kit / player-ui | 10 · 16 · 14 |
| socket-core / webrtc-viewer / room-client-browser | 6 · 17 · 7 |
| ediciones en `@zeus/socket-core` | **0** |
| alcance del diff | `packages/engine/rooms/**` + este reporte |

Consumidores re-corridos **después** de meter el guardia de sala, por si
rechazaba algún nombre vivo: ninguno se rompe.

## 11.8 · Higiene: los junctions

**Los desmonté yo.** `node_modules/` del worktree eliminado con `rmdir` sobre
cada enlace (`fs.rmdirSync`, que **no** recorre el junction), nunca con
borrado recursivo: una herramienta que siguiera los enlaces habría borrado las
dependencias del checkout principal. Verificado después que
`C:/S_LAB/z-sdk/node_modules` sigue intacto. No queda nada que desmontar.

Para reproducir la suite hace falta un `node_modules` normal (`npm ci` en la
raíz); todo lo que monté era andamio de ejecución, jamás código, y
`node_modules/` está en `.gitignore` — `git status --porcelain` vacío en todo
momento.

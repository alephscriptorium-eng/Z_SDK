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
  exactamente `+1` entrada en `adapter.rooms` (un `Map`→`Set` de sids) por
  zona **con al menos un suscriptor**; las zonas vacías no existen. Además,
  `SocketServer.roomsSockets` guarda su propia entrada `Map<canal, string[]>`.
  La sala desnuda **desaparece** del adaptador cuando todos los suscriptores
  están zonificados (por eso 6 zonas dan 13 y no 14).
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
  entra en la zona, la zona no entra en la sala desnuda.
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

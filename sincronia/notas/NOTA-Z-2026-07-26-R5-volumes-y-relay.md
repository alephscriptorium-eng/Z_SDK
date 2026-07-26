# NOTA · Z · R5 · (a) VOLUMES: mapeo y hueco · (b) relay/payload: veredicto

| dato | valor |
| ---- | ----- |
| Emisor | vigía **Z** · `C:\S_LAB\z-sdk` |
| Fecha | 2026-07-26 |
| Tick | `R5-Z` |
| Entrada | `NOTA-G-…-R4-frontera-volumes.md` §2.2 · `NOTA-S-…-R4-consensuada-O.md` §2 |
| Método | read-only · todo con cita `fichero:línea` · nada por memoria |

---

## (a) · VOLUMES · mapeo disco / registry / peso

### a.1 · El contrato, verificado en fuente

`VOLUMES/volumes.json` · política literal **`synthetic-fixtures-only`**.
Cuatro slots canónicos, y solo dos con árbol real en el monorepo:

| id | disco | ruta | estado en repo | naturaleza |
| -- | ----- | ---- | -------------- | ---------- |
| `firehose` | **DISK_01** | `DISK_01/FIREHOSE` | `deferred:true` · **no shipped** | live · fuera del monorepo |
| `lineas` | **DISK_02** | `DISK_02/LINEAS` | tracked | fixture (`linea-kit/test/fixtures/lineas`) |
| `forces` | **DISK_03** | `DISK_03/FORCES` | tracked | fixture (`linea-kit/test/fixtures/forces`) |
| `ssb` | **DISK_04** | `DISK_04/SSB` | `deferred:true` · **no shipped** | live · export de pub OASIS |

Confirmo por tanto lo que O supuso y G y S declararon: **cero líneas reales
en el árbol de z-sdk**. Los dos discos vivos (01 y 04) están declarados
diferidos **por contrato**, no por olvido.

### a.2 · Mapeo de lo que entra al molde local

| pieza | disco(s) | registry propio (verificado ahora) | peso |
| ----- | -------- | ---------------------------------- | ---- |
| fixtures z-sdk `DISK_02/LINEAS` | 02 | n/a (in-repo, tracked) | **8 KB** ✅ medido |
| fixtures z-sdk `DISK_03/FORCES` | 03 | n/a (in-repo, tracked) | **11 KB** ✅ medido |
| `@zeus/startpack-ciudad` | 04 (topology seeds) | **✅ 0.1.0 resuelve** | ⏳ el registry no expone `dist.unpackedSize` |
| `@zeus/mockdatas-ciudad` | 01 + 02 | **⛔ E404** | ~722 ficheros (dato de G, no medido por mí) |
| `@zeus/startpack-delta` | 02 + 03 | **⛔ E404** | ⏳ |
| `@zeus/startpack-pozo` | 03 | **⛔ E404** | ⏳ |
| `@zeus/startpack-solve-coagula` | 02 | **⛔ E404** | ⏳ |
| `@zeus/startpack-plaza` · `-sketch` | 02 / 03 | **⛔ E404** | ⏳ |

### a.3 · ⛔ Hallazgo C8 — y el defecto es mío

`VOLUMES/README.md:24` documenta como arranque de ronda:

> `npm install @zeus/startpack-delta`

**Ese comando falla hoy.** Verificado contra el registry propio: E404. De los
siete packs que G y S inventarían, **solo `startpack-ciudad` resuelve**. El
canal real de los demás es GitHub Release de `Z_SDK-games-library`, no npm.

Consecuencia directa para O: **el molde local no se puede montar siguiendo mi
documentación**. Es doc mía y el defecto es mío; no lo descubro pidiéndoselo a
nadie. Va a DRAFT como `Z-D6`.

⚠️ Y afecta a la elección de canal: si el molde debe ser reproducible por
`npm install`, hay que publicar los packs; si el canal es Release, mi README
miente. Una de las dos, no ambas.

### a.4 · Peso: lo que **no** puedo dar y por qué

El registry propio no expone `dist.unpackedSize`/`fileCount` en `npm view`, y
seis de siete packs no están ahí. Medir peso real exigiría `npm pack` contra
cada Release o abrir `g-sdk` — mundo ajeno, fuera de mi frontera. **Hueco
declarado, no estimación.** El README cita pesos históricos (firehose 38 MB,
líneas 20 MB) y los trato como **`[cita inerte]`**: no los he verificado.

### a.5 · Veredicto del hueco único

◆ **El corchete de mi tick llegó sin rellenar**: *«[custodio: declara aquí si
existe `ZEUS_VOLUMES_ROOT` en otro host, o "no existe"]»*. Sin esa
declaración el hueco **sigue abierto**, y es el único que queda: G y S ya
cerraron sus lados.

Lo que sí declaro, verificado en **este** host y ahora:

| comprobación | resultado |
| ------------ | --------- |
| `ZEUS_VOLUMES_ROOT` en el entorno | **no definida** (tampoco `ZEUS_LINEA_ALEPH_ROOT` ni `ZEUS_FIREHOSE_*`) |
| `C:\S\VOLUMES` · `C:\S_LAB\VOLUMES` · `C:\VOLUMES` | **ausentes** |

**Veredicto Z: en el host del lab no existe montaje de líneas reales.** Si
existe en otro host, solo el custodio puede decirlo — yo no lo puedo verificar
sin salir del mundo, y no voy a inferirlo. Con `«no existe»`, el molde local
arranca **solo con fixtures y packs**, y eso es perfectamente suficiente para
la demo: conviene decirlo así en vez de esperar un corpus que quizá no exista.

---

## (b) · Relay / payload · veredicto **depende-de-qué**

Camino del mensaje, entero, con cita. Fichero: `packages/mesh/socket-server/src/relay.mjs`
y `…/config.mjs`.

| tramo | línea | qué hace |
| ----- | ----- | -------- |
| subida local → bridge | `relay.mjs:37` | `socket.on(ev, (data) => bridgeClient.io.emit(ev, data))` — reenvía **la misma referencia**, sin tocar |
| qué sube | `config.mjs:6` | solo `CLIENT_REGISTER`, `CLIENT_SUSCRIBE`, `ROOM_MESSAGE` |
| bajada bridge → local | `relay.mjs:41` → `emitDownstream` (`relay.mjs:5-21`) | ver abajo |
| reemisión íntegra | `relay.mjs:7` | `localNs.emit('ROOM_MESSAGE', payload)` — **payload intacto** |
| desenvuelto | `relay.mjs:9-19` | lee `payload.event`/`payload.data` y reemite el evento interno con solo `data` |
| supresión | `relay.mjs:18` | **`MAKE_MASTER` no se reemite nunca** |
| allowlist | `relay.mjs:42-47` + `config.mjs:8-17` | `onAny` solo deja pasar 8 eventos; **el resto se descarta en silencio** |

### Veredicto en tres planos — porque la pregunta no tiene una sola respuesta

| plano | veredicto |
| ----- | --------- |
| **Contenido / payload** | **NO PUEDE.** No existe una sola línea que reescriba `data`. Se propaga la misma referencia. |
| **Sobre / framing** | **SÍ.** `{event,data}` entra y sale como evento propio: cambia el envoltorio, no el contenido. |
| **Pasar o no pasar** | **SÍ, y es lo que importa.** Allowlist de 8 eventos + supresión explícita de `MAKE_MASTER`. |

### Qué significa para el CA-ANTI-AUTORIDAD de O (punto 3)

**Su modelo no cae** — y lo digo con la evidencia delante, no por cortesía:
la regla *«el relay modifica el pub/sub, no el mensaje»* **se sostiene** en
el plano del contenido. El relay no traduce. La federación no se vuelve
traducción.

⚠️ **Pero falla otro punto suyo, el 3 de «lo que O defiende»** (*ningún nodo
obligatorio*, fail-open en topología): el bridge de hoy **es un cuello con
potestad de corte por tipo de evento**. Un evento que no esté en el allowlist
de 8 no cruza, y **nadie se entera**: no hay log ni error, se descarta. Eso es
literalmente su riesgo #1 —*el barrio ve todo y puede parar todo*— realizado
por allowlist, no por mala fe.

⚠️ **Segundo hallazgo, y este toca al hilo peercard:** `relay.mjs:29-32`
levanta **un solo** `bridgeClient` con `user: 'scriptorium-bridge'` y un
`secret` compartido para todo el namespace. Aguas arriba **la identidad
individual se colapsa**: el barrio no relaya *a Fulano*, habla *como uno*. El
relay no transforma el mensaje, pero **borra de quién viene**. Para el debate
reúso-de-cards esto es material de primera: hoy la card puede viajar en el
payload, pero el **transporte** ya no distingue emisores.

⚠️ Menor: `relay.mjs:7` y `:19` reemiten lo mismo por dos canales
(`ROOM_MESSAGE` + evento desenvuelto). Un cliente suscrito a ambos lo recibe
dos veces.

⏳ Alcance honesto: esto es el relay **de `socket-server`**. `@zeus/rooms` es
el cliente y solo compone sus propios mensajes (`rooms/src/index.mjs:73,77`);
no relaya de terceros. No he auditado `webrtc-signaling` como relay — ahí el
torno de U93 sigue siendo el asunto abierto.

---

## Estado

`ESTADO: VOLUMES_MAPEO=✅; VOLUMES_PESO=⏳ registry no expone y 6/7 packs E404; HUECO_UNICO=◆ falta declaración del custodio; C8_README=⛔ npm install documentado falla; RELAY_PAYLOAD=✅ no-puede (contenido) / sí filtra (paso); MODELO_O=se sostiene con 2 avisos; DRAFT=✅ al día`

— vigía **Z**

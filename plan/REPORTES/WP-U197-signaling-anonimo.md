# WP-U197 · Signaling anónimo WebRTC — `admisión ≠ permiso`

| dato | valor |
| ---- | ----- |
| agente | worker Z (swarm F2, ola 3) |
| fecha | 2026-08-01 |
| rama | `wp/u197-signaling-anonimo` (worktree `C:\S_LAB\wt\z-u197`, base `main`) |
| commits | `10bec3e` (obra) · `732bbb5`+`09c9ccd` (reporte) · **`5fb351c` (corrección de la devolución)** · este reporte |
| fila | BACKLOG :249 · GOBIERNO :195-201 · dep. **U186** ✅ (BACKLOG :233) |
| estado propuesto | **devuelto y corregido** — D1…D7 cerrados (§11); listo para la contrarrevisión acotada |

---

## 0. La decisión de diseño, primero (léala antes que nada)

El brief de gobierno dice: *«paths: `peer-card-gate.mjs` (**retirar el gate
de la antesala si U186 lo confirma**)»* (GOBIERNO :198-199).

**U186 no lo confirmó.** Su cierre dice literalmente *«los 4 tornos SE
QUEDAN»* (BACKLOG :233): la antesala WebRTC es una **capacidad opt-in**, y
el leak real de U186 era otro (`connect()` degradando en silencio una card
inválida). Retirar el torno de forma global habría sido, además,
catastrófico por una razón que sólo se ve leyendo a los consumidores:

```
packages/mesh/blob-sync-harness/src/lan-gate.mjs:8,23
    import { assertSignalingPeerCard } from '@zeus/webrtc-signaling';
    export function assertLanBlobTransferAllowed(peerCard, opts = {}) {
      const gate = assertSignalingPeerCard(peerCard, opts);
```

`assertSignalingPeerCard` **no es sólo el torno de la señalización**: hay
un tercero que la **importa** como portero del carril LAN de blobs
(U100/U101 · D-21 fila 4), reexportada además por
`packages/mesh/blobstore-client/src/lan.mjs:9-12,20`. Ablandar esa función
—o darle un modo permisivo por defecto— **le habría cambiado el veredicto
a un consumidor ajeno, en silencio y sin que su suite se enterase**. Eso
basta y sobra para no tocarla.

> ✎ **Corregido tras la devolución (§11·D2):** en la primera entrega
> escribí que ese carril quedaba «cerrado al anónimo». **Falso.**
> `assertLanBlobTransferAllowed` no tiene ni un llamador en ruta de
> producción (sólo el spike U100, el fixture de U101, tests y mi e2e), y
> `negotiateDataChannel` (`peer-session.mjs:83-183`) abre el DataChannel y
> mueve bytes **sin consultar card en ningún punto** — mi propia CA1 lo
> demuestra al entregar un payload por el canal anónimo. El carril LAN de
> blobs **no está cerrado: todavía no existe como ruta viva**. La decisión
> de no tocar el torno sigue siendo la correcta, pero por la razón de
> arriba (alguien lo importa), no por una protección que no está en pie.

**Lo hecho, entonces:**

1. `assertSignalingPeerCard` **queda intacta en semántica** (card ausente
   ⇒ deniega; su cuerpo no se tocó, sólo se le añadió cabecera de doc).
2. Se añade una capa **explícita y aparte**, `assertSignalingAdmission`,
   con dos modos declarados: `peer-card` (**defecto**, statu quo U93/U186)
   y `anonymous` (U197).
3. El modo es **configuración local del despliegue**. No se negocia, no se
   declara y no se transporta por el cable.

Doctrina resultante, corolario directo de U186 (*transporte ≠ permiso*):

> **admisión ≠ permiso.** La antesala puede admitir sin card; admitir no
> concede rol, no acredita identidad y no abre nada que antes estuviera
> cerrado. El rol se sigue consultando **en la acción**
> (`getSessionRole()`), nunca se deriva de haber completado un handshake.

**Lo que NO se hizo, y por qué:** no se cambió el **defecto** a anónimo.
Cambiar el defecto es una decisión de política de despliegue, no de este
WP — es materia del contrato **D-O11 / O13** abierto a O en
`plan/REPORTES/U186-paso0-frontera-room-join.md:123,148`. Además habría
roto la CA4 de U186 (`test/transporte-permiso.test.mjs:203`), aceptada el
2026-07-31. Se deja probado que basta declarar el modo (una línea de
config) para tener signaling anónimo, y se documenta el interruptor.

---

## 1. Qué se tocó (ruta:línea)

### Núcleo — `packages/engine/webrtc-signaling/`

| ruta:línea | qué |
| ---------- | --- |
| `src/peer-card-gate.mjs:1-14` | cabecera: el torno **no se retira ni se ablanda** |
| `src/peer-card-gate.mjs:132-136` | `SIGNALING_ADMISSION` — los **dos** únicos modos, congelado |
| `src/peer-card-gate.mjs:147-149` | `isPeerCardPresented(card)` — regla de presencia `!= null`, idéntica a U186 (`socket-room-signaling.mjs:79` original) |
| `src/peer-card-gate.mjs:184-224` | `assertSignalingAdmission(card, opts)` — la capa nueva; exigencias por **truthiness** desde la corrección (`:199-203`, §11·D1) |
| `src/peer-card-gate.mjs:62-108` | `assertSignalingPeerCard` — **cuerpo sin tocar** (`git diff` sobre el rango = 0 líneas de lógica) |
| `src/signaling-service.mjs:77` | `this._admission = SIGNALING_ADMISSION.peerCard` ← **el defecto no se movió** |
| `src/signaling-service.mjs:84-99` | `setAdmission()` / `getAdmission()` — sólo 2 modos, lo demás lanza |
| `src/signaling-service.mjs:106-117` | `isAnonymous()` / `describeAdmission()` |
| `src/signaling-service.mjs:284-323` | `handleMessage`: admisión de entrantes; anónimo (`:297-312`) ⇒ el mensaje entra sin `peerCard` ni `ssbId` (los `delete` son red, no la garantía — §11·D7) |
| `src/signaling-service.mjs:354-379` | `_gatedOutbound`: anónimo ⇒ sale **sin card y sin `ssbId`** |
| `src/socket-room-signaling.mjs:65,88` | opción `admission` en constructor y `connect()`; exigencias normalizadas al guardar (`:83-87`, §11·D1) |
| `src/socket-room-signaling.mjs:144-181` | `joinRoom(roomId, peerCard?)` — card **opcional** sólo en modo anónimo |
| `src/index.mjs:46-56` | exports nuevos |
| `types/index.d.ts`, `types/peer-card-gate.d.ts` | tipos de la API nueva |
| `README.md:14-16,46-104` | tabla de modos + los **6** invariantes que el modo anónimo **no** relaja + paridad de gemelos |
| `src/ssb-private-signaling.mjs:57-84,111-116` | el carril SSB **rechaza** el modo anónimo por construcción (§11·D1) |

### Gemelo de navegador — `packages/mesh/webrtc-viewer/`

Misma admisión **y misma red de seguridad** (ver §11·D3-D6). Sin esto,
«signaling sin card» sería falso en el navegador, que habla el **mismo
contrato de cable** (U88).

| ruta:línea | qué |
| ---------- | --- |
| `src/browser/browser-signaling.mjs:122-129` | `_applyPolicy()` — política declarada, aplicada también desde `connect()` (D4) |
| `src/browser/browser-signaling.mjs:131-140` | `_gateOpts()` — las opciones del torno en un solo sitio |
| `src/browser/browser-signaling.mjs:151-163` | `setAdmission()` — modo desconocido **lanza** (D3) |
| `src/browser/browser-signaling.mjs:179-197` | `getSessionRole()` / `getSsbId()` / `describeAdmission()` (D5) |
| `src/browser/browser-signaling.mjs:227-236` | `connect()` aplica la política antes de abrir cable (D4) |
| `src/browser/browser-signaling.mjs:266-304` | `joinRoom()` con card opcional + exigencias (D6) |
| `src/browser/browser-signaling.mjs:306-320,405-425` | torno de salida y de entrada con `_gateOpts()` (D6 · D7) |

### Pruebas y e2e (nuevos)

- `packages/engine/webrtc-signaling/test/signaling-anonimo.test.mjs` (**18** tests)
- `packages/mesh/webrtc-viewer/test/browser-signaling-anonimo.test.mjs` (**11** tests)
- `e2e/webrtc-signaling-anonimo.mjs` + script `e2e:webrtc-signaling-anonimo`
  (`package.json:112`)

### NO tocado (frontera respetada)

- `packages/engine/presets-sdk/src/env/index.mjs` — **sólo lectura**:
  fichero caliente cuyo dueño de edición es **U227** (GOBIERNO §2 :581,
  *«edición solo U227 (ola 2)»*). U197 figura ahí como *«(lee)»*. El e2e
  lo ejercita sin modificarlo.
- Allowlist del relay y su contrato: **no leídos para escribir, no
  tocados** (otro WP vivo). Ninguna ruta de este diff los alcanza.
- Territorio prohibido (`volumes-ops`, `VOLUMES`, `presets-sdk/src/volumes`,
  `linea-kit/{validate,loader,curation}`, `force-system`, `feed-kit/jetstream-sync`,
  `firehose-core`, `ssb-system`): **cero ficheros tocados** —
  `git show --stat 10bec3e 5fb351c` lo enseña.

---

## 2. CA1 · Handshake completo entre 2 peers anónimos, **de facto**

No es descripción: es la salida literal de la corrida. Servidor de
señalización **real** (`createScriptoriumServer`, loopback :13097),
`RTCPeerConnection` real (`@roamhq/wrtc`), DataChannel real.

```
$ npm run e2e:webrtc-signaling-anonimo

== CA4 · ICE por entorno ==
  resolveIceServers(env) = [{"urls":"stun:127.0.0.1:3478"},{"urls":"turn:127.0.0.1:3478","username":"u197","credential":"secreto-de-entorno"}]
  resolveIceServers(sin env) = []

== Servidor de señalización real (loopback) ==
  socket-server arriba en http://localhost:13097

== CA1/CA2 · handshake entre 2 peers ANÓNIMOS ==
  [paso 0] join anónimo · alice.isAnonymous()=true · rol=null
  negociando DataChannel real (trickle ICE, ICE del entorno)...
  [paso *] bob   ← offer         de alice · anonymous=true · peerCard=AUSENTE · ssbId=AUSENTE
  [paso *] bob   ← ice-candidate de alice · anonymous=true · peerCard=AUSENTE · ssbId=AUSENTE
  [paso *] alice ← answer        de bob   · anonymous=true · peerCard=AUSENTE · ssbId=AUSENTE
  [paso 1] offer  entregadas: 1
  [paso 2] answer entregadas: 1
  [paso 3] ICE    entregados: 8
  [paso 4] DataChannel ABIERTO entre dos anónimos y dato entregado: "ping-u197-anon"

== CA3 · admisión ≠ permiso ==
  alice.getSessionRole() tras el handshake = null
  assertLanBlobTransferAllowed(anónimo) = {"ok":false,"lane":"lan-datachannel","error":"peer-card missing or malformed"}
  assertSignalingPeerCard(anónimo) = {"ok":false,"error":"peer-card missing or malformed"}
  par estricto: gated entregados=0 · rechazos=1
  motivo: signaling peer-card rejected: peer-card missing or malformed
  card caducada PRESENTADA en modo anónimo → SignalingService.setPeerCard: peer-card expired

e2e:webrtc-signaling-anonimo OK — handshake anónimo completo (offer/answer/ICE + DataChannel), cero cards, cero permisos concedidos, ICE del entorno
```

Los **tres pasos** (offer → answer → ICE) están trazados uno a uno, con la
marca de que ni card ni `ssbId` viajaron. El paso 4 es la consecuencia
física: el canal se abre y transporta un dato real.

---

## 3. CA2 · Anónimo es anónimo — prueba de la **ausencia**

Ningún paso exige card, identidad ni credencial: `connect()`, `joinRoom()`,
`sendOffer`/`sendAnswer`/`sendIceCandidate` se ejecutan sin argumento de
card y completan.

La prueba fuerte no es que *funcione sin card*, sino que **la clave no
existe en el cable** (hostil-omite: ausencia real, no `null`). En
`test/signaling-anonimo.test.mjs` («CA2») los payloads se capturan tras un
round-trip JSON —igual que el cable, que no puede transportar `undefined`—
y se afirma sobre `hasOwnProperty`:

```
CA2: ningún payload del signaling anónimo lleva card, identidad ni credencial
  · hasOwnProperty(payload,'peerCard') === false   en los 5 frames
  · hasOwnProperty(payload,'ssbId')    === false   en los 5 frames
  · hasOwnProperty(payload.data,'peerCard') === false   (sin card oculta en data)
  · /peerCard|seatSignature|token/.test(JSON de todo el cable) === false
```

Y el transporte base tampoco la pide (U186 CA1 re-verificado):
`CLIENT_REGISTER.peerCard === undefined` (`CA2b`).

**Decisión deliberada:** el cable anónimo **tampoco lleva un
`anonymous: true`**. Una autodeclaración no verificable sería otro claim;
la **ausencia de card es la señal**, y el receptor la juzga con su propio
modo, nunca con el del emisor (`socket-room-signaling.mjs:170-176`,
`browser-signaling.mjs:194-199`).

---

## 4. CA3 · El que entra anónimo **NO** sale con permisos  ← el caso que importa

Cinco pruebas independientes, todas ejecutadas:

| # | prueba | resultado literal |
| - | ------ | ----------------- |
| 1 | rol tras handshake completo | `alice.getSessionRole() === null`; `getPeerCard() === null`; `describeAdmission() = {admission:'anonymous', anonymous:true, role:null}` |
| 2 | el helper del carril LAN de blobs — **leer §11·D2 antes de citar esta fila** | `assertLanBlobTransferAllowed(anónimo)` → `{"ok":false,"lane":"lan-datachannel","error":"peer-card missing or malformed"}`. **No** significa que exista una puerta cerrada: ese helper **no tiene llamadores en ruta de producción** y `negotiateDataChannel` abre el canal sin consultar card. Es un cartel, no una puerta |
| 3 | el portero de terceros no se movió | `assertSignalingPeerCard(anónimo)` → `{"ok":false,...}`; y **`assertSignalingPeerCard(null,{admission:'anonymous'}) === {ok:false}`**: el torno U186 ni conoce la opción, no hay contagio |
| 4 | par con antesala **estricta** en la misma sala | `gated entregados=0 · rechazos=1 · motivo: signaling peer-card rejected: peer-card missing or malformed` |
| 5 | exigencia configurada sobre modo anónimo | `requiredRole:'operator'` o `requireSeatSignature:true` ⇒ la ausencia **deniega** igual (`CA3d`, `CA3e`) |

~~La prueba 2 es la nuclear~~ — **corregido en la devolución (§11·D2)**. La
prueba 2 demuestra sólo que **el veredicto del helper no se movió**; no
demuestra que haya un carril vivo protegido, porque no lo hay. Las pruebas
que sí sostienen el CA3 son la **1** (rol `null` tras handshake completo),
la **3** (el torno compartido ignora el modo: cero contagio), la **4** (un
par estricto rechaza al anónimo) y la **5** (toda exigencia configurada
deniega). El invariante que se defiende es *el permiso nunca estuvo en el
canal*, y eso se prueba en el punto donde el permiso se consulta —
`getSessionRole()` y el torno por mensaje—, no en un helper sin llamadores.

Además, el veredicto de admisión anónima **no devuelve rol** en absoluto:
`assertSignalingAdmission(null,{admission:'anonymous'})` es exactamente
`{ok:true, anonymous:true, role:null}` (aserción `deepEqual`, `CA3`), de
modo que ningún consumidor puede leer un rol de ahí.

---

## 5. Casos rojos (los bypass que se intentaron y se cazaron)

Todos en `test/signaling-anonimo.test.mjs` y su gemelo de navegador.

| rojo | intento de bypass | veredicto |
| ---- | ----------------- | --------- |
| 1 | card **presentada** e inválida en modo anónimo (connect / joinRoom / send) | **RECHAZA**, no degrada. `connect` sin `CLIENT_REGISTER` siquiera; `joinRoom` deja `getRoomId()===''`; `sendMessage` lanza `peer-card required: peer-card expired` |
| 2 | card inválida **entrante** en modo anónimo | rechazada con motivo, `0` mensajes entregados |
| 3 | card **falsy presentada** (`false`, `0`, `''`, `NaN`) | `isPeerCardPresented === true` ⇒ se valida ⇒ rechaza. `null`/`undefined` ⇒ ausente ⇒ anónimo con `role:null` |
| 4 | **claim de identidad sin sello**: `ssbId` suelto en el handshake; y `from` con forma de feed SSB (`@…​.ed25519`) suplantando | ambos **DENIEGAN** (`unproven identity claim`), de entrada y de salida |
| 5 | el par remoto se **declara** anónimo en el payload (`anonymous:true`, `admission:'anonymous'`) contra una antesala estricta | ignorado: `0` entregados, `getAdmission()` sigue `'peer-card'` |
| 6 | inventar un tercer modo (`'anon'`, `'ANONYMOUS'`, `''`, `null`, `true`, `{}`) | `setAdmission` lanza `unknown admission mode` en los 7 |
| 7 | que el modo anónimo altere la ruta de card válida | intacta: card válida ⇒ `role:'player'`, anuncio con card |
| **8** | **exigencia declarada con truthy no-booleano** (`requireSsbId: 1`, `requireSeatSignature: 'yes'`) para que la admisión la descarte | **añadido en la corrección** (era el bloqueante D1): los 7 truthy deniegan y los 6 falsy siguen siendo «sin exigencia» — §11·D1 |
| **9** | modo anónimo en el **carril SSB** vía `setAdmission()` heredado con `requireSsbId:false` | **LANZA** por construcción (§11·D1) |
| **10** | en el **gemelo de navegador**: modo con typo, `connect({admission})` ignorado, exigencia puesta y join anónimo entrando igual | los tres **cerrados** (§11·D3-D6) |

### Fail-probe: se mutó el código y las pruebas cayeron

No basta con que las pruebas pasen; hay que enseñar que **caen**. Siete
mutaciones hostiles aplicadas sobre el árbol y revertidas (M1-M4 en la
primera entrega, M5-M7 en la corrección):

| mutación | qué simula | resultado |
| -------- | ---------- | --------- |
| **M1** — card presentada e inválida devuelve `{ok:true, anonymous:true}` | el bypass clásico: «si la card es basura, trátalo como anónimo» | **7 fail / 45** — cae `rojo 1`, `rojo 2`, `rojo 3` y **también las CA3b/CA3c de U186** |
| **M2** — `this._admission = anonymous` por defecto | retirar el torno global a hurtadillas | **6 fail / 45** — cae la **CA4 de U186** y su caso rojo, más `CA3c`, `rojo 5`, `rojo 6` |
| **M3** — la admisión anónima devuelve `role:'player'` | conceder rol al admitir | **1 fail / 45** (`rojo 3`) |
| **M4** — `admission: message?.admission ?? this._admission` + el payload propaga el claim | negociar el modo por el cable | **1 fail / 45** (`rojo 5`) |

Dos más tras la devolución: **M5** (revertir el arreglo D1 a `=== true`) y
**M6** (quitar el candado del carril SSB) — cada una tumba su prueba
(§11·D1). Y **M7** (quitar los `delete` anónimos) → **0 fallos**: código
muerto confirmado, declarado como tal (§11·D7).

Tras revertir: `45 pass / 0 fail` en la primera entrega, `48 pass / 0 fail`
tras la corrección. (M3 y M4 sólo tienen un cazador cada
una porque son mutaciones de superficie estrecha; el árbol restaurado se
verificó verde antes de commitear.)

---

## 6. CA4 · STUN/TURN por entorno — greps con patrón y salida

**El código no conoce ningún servidor.** Único punto de lectura —
`resolveIceServers`, cuya firma está en `presets-sdk/src/env/index.mjs:405`
(la primera entrega citaba 411, que es la primera línea del **cuerpo**):

```
$ grep -rn "ZEUS_WEBRTC_" --include=*.mjs packages/*/*/src/ | grep -v node_modules
packages/engine/presets-sdk/src/env/index.mjs:411:  for (const url of splitIceUrls(env.ZEUS_WEBRTC_STUN)) {
packages/engine/presets-sdk/src/env/index.mjs:415:  const turnUrls = splitIceUrls(env.ZEUS_WEBRTC_TURN_URL || env.ZEUS_WEBRTC_TURN);
packages/engine/presets-sdk/src/env/index.mjs:421:  const user = env.ZEUS_WEBRTC_TURN_USER;
packages/engine/presets-sdk/src/env/index.mjs:422:  const pass = env.ZEUS_WEBRTC_TURN_PASS ?? env.ZEUS_WEBRTC_TURN_CREDENTIAL;
packages/engine/presets-sdk/src/env/index.mjs:428:  if (String(env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN || '') === '1') {
   (resto de coincidencias: comentarios de doc en :370-399)
```

Literales de servidor. **Alcance del grep, explícito** (la primera entrega
se ceñía a `packages/**/src` sin decirlo — §11·contabilidad):

```
# (a) sólo código de producción — packages/**/src
$ grep -rnE "['\"\`](stuns?|turns?):" --include=*.mjs --include=*.js --include=*.ts packages/*/*/src/ | grep -v node_modules
packages/engine/presets-sdk/src/env/index.mjs:364:  'stun:stun.l.google.com:19302',
packages/engine/presets-sdk/src/env/index.mjs:365:  'stun:stun1.l.google.com:19302'

# (b) AMPLIADO a todo packages/** (tests y fixtures incluidos)
$ grep -rnE "['\"\`](stuns?|turns?):" --include=*.mjs --include=*.js --include=*.ts --include=*.example --include=*.json packages/ | grep -v node_modules
packages/engine/presets-sdk/src/env/index.mjs:364:  'stun:stun.l.google.com:19302',
packages/engine/presets-sdk/src/env/index.mjs:365:  'stun:stun1.l.google.com:19302'
packages/engine/presets-sdk/test/env-ice-servers.mjs:59:      ZEUS_WEBRTC_STUN: 'stun:coturn.example:3478',
packages/engine/presets-sdk/test/env-ice-servers.mjs:60:      ZEUS_WEBRTC_TURN_URL: 'turn:coturn.example:3478',
packages/engine/presets-sdk/test/env-ice-servers.mjs:68:      assert.deepEqual(servers[0], { urls: 'stun:coturn.example:3478' });
packages/engine/presets-sdk/test/env-ice-servers.mjs:70:        urls: 'turn:coturn.example:3478',
```

Las 4 coincidencias extra de (b) son del **test** de `resolveIceServers` y
usan `coturn.example` — dominio reservado, inocuo, y además son entradas
que el test mete al entorno para comprobar la salida. No son servidores
que el código conozca.

En el paquete de señalización y su gemelo de navegador: **cero**.

```
$ grep -rnE "(stuns?|turns?):" packages/engine/webrtc-signaling/src packages/engine/webrtc-signaling/types packages/mesh/webrtc-viewer/src
(0 coincidencias)
```

**Las 2 únicas coincidencias del repo** son `GOOGLE_STUN_URLS`
(`presets-sdk/src/env/index.mjs:363-366`), **opt-in duro** tras
`ZEUS_WEBRTC_ALLOW_GOOGLE_STUN=1` y con un WARNING de 6 líneas (D-17).
No las toco: fichero caliente **de U227** (GOBIERNO §2 :581) — ver §8.

Prueba de que el entorno *manda de verdad*, del e2e (§2 arriba):

- con `ZEUS_WEBRTC_STUN` + `ZEUS_WEBRTC_TURN_URL/_USER/_PASS` ⇒
  `[{"urls":"stun:127.0.0.1:3478"},{"urls":"turn:127.0.0.1:3478","username":"u197","credential":"secreto-de-entorno"}]`
  — valores **arbitrarios** inventados por el test: si el código conociera
  un servidor, aparecería aquí y no aparece.
- **sin** entorno ⇒ `[]`. Cero defaults implícitos.
- la negociación real de §2 corrió con la lista **resuelta del entorno**,
  no con una constante.

(Nota honesta: `e2e/webrtc-signaling-anonimo.mjs:36-39` contiene las
cadenas `stun:127.0.0.1:3478` / `turn:127.0.0.1:3478`. Son **entradas que
el test inyecta al entorno** para demostrar que el código las lee; no son
código de producción y `e2e/` queda fuera del grep de `packages/**/src`.)

---

## 7. Suites: antes → después

Medido en este worktree (`node v22.21.1`). Baseline tomada **antes** de
tocar nada; el worktree venía sin `node_modules` — se instaló con
`npm install --prefer-offline --ignore-scripts` y se **revirtió la deriva
del lockfile** que el install introdujo (§8, obs. 2).

| suite | antes | 1.ª entrega | tras la devolución |
| ----- | ----- | ----------- | ------------------ |
| `@zeus/webrtc-signaling` | 30 / 0 | 45 / 0 | **48 pass / 0 fail** |
| `@zeus/webrtc-viewer` | 6 / 0 | 13 / 0 | **17 pass / 0 fail** |
| `@zeus/blob-sync-harness` | 11 / 0 | 11 / 0 | 11 / 0 |
| `@zeus/blobstore-client` | 19 / 0 | 19 / 0 | 19 / 0 |
| `@zeus/rooms` | 12 / 0 | 12 / 0 | 12 / 0 |
| `@zeus/socket-core` | 6 / 0 | 6 / 0 | 6 / 0 |
| `@zeus/authority-kit` | 16 / 0 | 16 / 0 | 16 / 0 |
| `@zeus/protocol` | 37 / **3 fail** | 37 / 3 fail | 37 / **3 fail** ⚠️ pre-existente, ver §9 |
| `eslint` (paquetes tocados + e2e) | limpio | limpio | limpio |

e2e — son **cinco**, no cuatro (la primera entrega se dejó
`e2e:webrtc-viewer`, que también toca el gemelo que modifiqué):

```
npm run e2e:webrtc-signaling-anonimo  → OK   (nuevo)
npm run e2e:webrtc-signaling          → OK   (U88, sin regresión)
npm run e2e:peer-card-chain           → OK   (U93/U186, sin regresión)
npm run e2e:ssb-webrtc-signaling      → OK   (U90, sin regresión)
npm run e2e:webrtc-viewer             → OK   (U80/viewer, sin regresión)
```

**Las 30 pruebas previas de `webrtc-signaling`, incluida la suite
`transporte-permiso.test.mjs` completa de U186, pasan sin una sola
modificación.** Es el dato que mejor resume el WP: se añadió una
capacidad sin tocar un solo invariante heredado.

### Reproducción

```
cd C:\S_LAB\wt\z-u197
npm test -w @zeus/webrtc-signaling
npm test -w @zeus/webrtc-viewer
npm run e2e:webrtc-signaling-anonimo
node --test packages/engine/webrtc-signaling/test/signaling-anonimo.test.mjs
```

Los e2e **antiguos** (`:webrtc-signaling`, `:peer-card-chain`,
`:webrtc-viewer`) importan `e2e/helpers.mjs` y por tanto exigen
`ZEUS_VOLUMES_ROOT` **apuntando a una raíz con `volumes.json` operable** —
no basta con definir la variable: `resolveVolumesRoot` carga y valida el
fichero, y sin él aborta igual (`presets-sdk/src/volumes/resolve.mjs:33,52`).
Aquí se corrió con `ZEUS_VOLUMES_ROOT=C:\S_LAB\wt\z-u197\VOLUMES`, que
contiene `VOLUMES/volumes.json`. El e2e **nuevo no importa helpers a
propósito**: corre sin ninguna precondición de entorno.

---

## 8. Qué queda fuera, y de quién es

| tema | estado | dueño citado |
| ---- | ------ | ------------ |
| **TURN real contra servidor externo (coturn)** | ⏳ **no ejercitado**. El e2e prueba que las credenciales TURN del entorno llegan íntegras a la config ICE, pero **no** hay relay TURN vivo contra el que hacer un `relay candidate`: requiere VPS/pub del operador | **U198** (BACKLOG :250) · GOBIERNO :205-210: *«deps ext.: VPS/pub del operador (**custodio**) — la evidencia de ejecución exige entorno que el repo no contiene»*. STUN/TURN de despliegue = ops, **owner O** (GOBIERNO :196-197). Runbook: `docs/mesh/coturn-runbook.md`, nunca ejecutado |
| **Cambiar el DEFECTO a anónimo** | ⏳ **no hecho a propósito**. Es política de despliegue, no de este WP; y rompería la CA4 aceptada de U186 | **O** — contrato **D-O11 / O13** abierto en `plan/REPORTES/U186-paso0-frontera-room-join.md:123,148`. Basta `admission: 'anonymous'` (una línea) el día que O lo resuelva |
| **`GOOGLE_STUN_URLS` como literal en `env/index.mjs:363-366`** | leído, **no tocado**. Es opt-in tras flag + WARNING, así que no viola CA4 en la práctica; pero es el único literal de servidor del repo | **U227** — fichero caliente, *«edición solo U227 (ola 2)»* (GOBIERNO §2 :581) |
| **`SsbPrivateSignalingService` en modo anónimo** | ✎ **afirmación refutada y sustituida por código** (§11·D1). Decía «fuera de alcance porque `requireSsbId` es `true` por defecto, así que siempre exige card»: eso era confiar en un **valor por defecto** siendo que `requireSsbId:false` es legal y `setAdmission()` es público y heredado. Ahora `setAdmission('anonymous')` **lanza** en ese carril (`ssb-private-signaling.mjs:77-84`): imposible por construcción, no improbable por configuración | cerrado por Z en esta corrección |

---

## 9. Cero contrabando + observaciones de lo que se vio mal fuera

**Contrabando:** `git show --stat 10bec3e` = 12 ficheros, todos dentro de
`packages/engine/webrtc-signaling/`, `packages/mesh/webrtc-viewer/`,
`e2e/webrtc-signaling-anonimo.mjs` y una línea en `package.json` (el
script del e2e). Cero ficheros de territorio prohibido, cero cambios de
política, cero ediciones en la allowlist del relay.

**Obs. 1 — `@zeus/protocol` viene rojo en `main` (3/40), no es de U197.**
Verificado con `git stash` (mismas 3 caídas con y sin mi diff):

```
not ok 35 - Eje IV: tsc resolves peer-card-seat + roles subpath types (two consumers)
not ok 37 - types/index.d.ts is in sync with generator
not ok 38 - subpath .d.ts files are in sync with generator (WP-U155)
```

Son de sincronía del generador de `.d.ts` (línea U155). Alguien debe
regenerar o el gate G quedará rojo por una causa ajena. **No es mío y no
lo toco** (`protocol/src/peer-card*.mjs` es fichero caliente de
U188/U190/U191, GOBIERNO §2 :572).

**Obs. 2 — deriva del `package-lock.json` respecto a las licencias.**
Al instalar, npm quiso reescribir 52/50 líneas del lock, sobre todo:

```
-      "license": "AIPLv1",
+      "license": "SEE LICENSE IN LICENSE.md",
```

Es decir: el `package.json` (raíz y varios workspaces) ya declara
`SEE LICENSE IN LICENSE.md` pero **el lockfile sigue diciendo `AIPLv1`**.
Huele a **U237** (licencia/SPDX) cerrado sin regenerar el lock. **Lo
revertí** para no meter contrabando en mi diff, pero alguien debería
regenerarlo a propósito: si el gate de licencia (U239 / §5 fila
*Licencia/publicación/canal*) llega a leer el lock, verá el valor viejo.

**Obs. 3 — el `worktree` llegó sin `node_modules`.** Ninguna suite era
ejecutable hasta instalar (`Cannot find package '@zeus/protocol'`). Si el
protocolo de preparación de worktrees asume árbol instalable, conviene
decirlo en el BRIEF: sin `@roamhq/wrtc` (optional dep) **no hay e2e de
WebRTC posible**, y con él sí — es lo que ha permitido el CA1 de facto.

**Obs. 5 (autodenuncia) — usé `git stash` una vez, antes de que existiera
la regla que lo prohíbe.** Para comprobar que las 3 caídas de
`@zeus/protocol` eran previas y no mías hice `git stash -u` + `stash pop`
en un único comando encadenado (§9 obs. 1). Mi base era `dc70cec`; la
**regla 4-bis** (`git stash` PROHIBIDO con más de un worktree vivo,
GOBIERNO :655-663) aterrizó en `main` en `f307e52`, **después**, mientras
yo trabajaba — no estaba en mi árbol y no pude leerla. Estado comprobado
tras el hecho: `git stash list` **vacío**, `git status` limpio, los dos
commits de esta rama completos y las 45+13 pruebas verdes; el diff
`dc70cec..HEAD` son 13 ficheros, todos míos. No hay contaminación, pero lo
declaro porque el incidente que originó la regla es exactamente éste y un
revisor merece verlo escrito y no descubrirlo. La alternativa correcta
—`git show <base>:<ruta>` o copia al scratchpad— es la que usé después
para los fail-probes (§5), donde sí respaldé los ficheros en el
scratchpad en vez de tocar la pila.

**Obs. 4 — `packages/mesh/webrtc-viewer/src/browser/browser-signaling.mjs`
tenía cobertura CERO.** Es un gemelo completo del torno de señalización
(3 llamadas a `assertSignalingPeerCard`, líneas 111/197/289 del original)
y ninguna prueba lo tocaba. Se le añadieron 7. Recomendación al hilo de
identidad: **U188** («unificar plano peer-card: lógica en 4 sitios,
camino único») debería contar este fichero como uno de esos sitios — hoy
la admisión vive duplicada en dos clases hermanas, y cualquier
endurecimiento futuro habrá que hacerlo dos veces.

---

## 10. Nota para la contrarrevisión adversarial

El ataque a construir es *«entro anónimo y salgo con permisos»*. Las
cuatro puertas por las que se intentaría, y dónde está la prueba de que
están cerradas:

1. **Ablandar el torno compartido** → `assertSignalingPeerCard` sin tocar;
   `assertSignalingPeerCard(null,{admission:'anonymous'})` sigue `{ok:false}`
   (CA3b unitario + salida del e2e). *(El helper del carril LAN también
   deniega, pero **no cuenta como puerta**: §11·D2.)*
2. **Presentar card falsa y caer en anónimo** → `rojo 1/2/3` + fail-probe
   **M1** (7 pruebas caen, incluidas dos de U186).
3. **Colar identidad sin sello** → `rojo 4`: `ssbId` suelto y `from` con
   forma de feed **deniegan**; el cable anónimo sale sin `peerCard` ni
   `ssbId` (§3, `hasOwnProperty === false`).
4. **Negociar el modo por el cable** → `rojo 5` + fail-probe **M4**;
   `rojo 6` cierra la invención de un tercer modo.

Y la pregunta de fondo, por si se plantea: *si el defecto no cambió,
¿existe de verdad el signaling anónimo?* Sí — el e2e de §2 lo ejecuta de
punta a punta. Lo que no existe es un anónimo **por sorpresa**: entrar sin
card es una decisión que el operador declara en su despliegue, y aun
declarándola no obtiene nada más que la antesala.

---

## 11. Corrección de la devolución

Commits de corrección: **`5fb351c`** (código y pruebas) + este reporte.
Rama la misma, historia no reescrita.

### D1 · BLOQUEANTE — fail-open contra configuración declarada · **CERRADO**

**Aceptado sin matices.** La asimetría era mía y el diagnóstico exacto: el
torno U186 lee las exigencias por **truthiness** (`peer-card-gate.mjs:85`
`if (opts.requireSsbId || ssbId != null)` y `:100`), y yo las leía con
`=== true` en la admisión. Reproducido antes de tocar nada:

```
torno  U186 requireSsbId:1   -> {"ok":false,"error":"peer-card ssbId missing or malformed"}
admis. U197 requireSsbId:1   -> {"ok":true,"anonymous":true,"role":null}      ← FAIL-OPEN
admis. U197 requireSsbId:true-> {"ok":false,...}
admis. U197 reqSeatSig:'yes' -> {"ok":true,"anonymous":true,"role":null}      ← FAIL-OPEN
```

Esto **refutaba el contrato que yo mismo documenté** en
`peer-card-gate.mjs:165-167` («cualquier exigencia configurada … vuelve a
exigir card aunque el modo sea anónimo»). El texto estaba bien; el código
no lo cumplía. Se corrigió el código, no el texto.

**Arreglo** (`peer-card-gate.mjs:199-203`): `Boolean(opts.requireSsbId) ||
Boolean(opts.requireSeatSignature)`. Y, como pediste, **normalización
también en los tres puntos que guardaban el valor crudo**:
`signaling-service.mjs:125-130`, `socket-room-signaling.mjs:83-88`,
`ssb-private-signaling.mjs:111-115`.

Salida tras el arreglo — 7 truthy deniegan, 6 falsy siguen significando
«sin exigencia» (simetría exacta con el torno):

```
requireSsbId:1 / "yes" / -1 / Infinity / {} / [] / true  -> {"ok":false,"anonymous":false,...}
requireSeatSignature:1 / "yes" / true                    -> {"ok":false,"anonymous":false,...}
falsy 0 / "" / false / null / undefined / NaN            -> {"ok":true,"anonymous":true,"role":null}
```

**Barrido de hermanos** (`grep "=== true|=== false|!== true|!== false"` en
todo lo que toca U197): sólo había dos casos míos, ya corregidos. Quedan
tres pre-existentes en `ssb-private-signaling.mjs`:
- `:62` `requireSeatSignature === true` → **corregido** a `Boolean()`
  (dirección fail-closed, dentro de mi radio).
- `:57` y `:110` `allowTrickle === true` → **NO tocados a propósito**:
  normalizarlos abriría trickle donde hoy está cerrado (dirección
  **fail-open**) y es un knob de fiabilidad de U90, no de permiso. Queda
  anotado como observación, no como arreglo silencioso.

**Y el carril SSB, que declaré fuera de alcance con un argumento malo.**
Tenías razón: «`requireSsbId` es `true` por defecto» es confiar en un
valor por defecto, no una imposibilidad — `requireSsbId:false` es legal y
`setAdmission()` es público y heredado. Ahora es **estructural**:

```js
// ssb-private-signaling.mjs:77-84
setAdmission(mode) {
  if (mode === SIGNALING_ADMISSION.anonymous) {
    throw new Error('SsbPrivateSignalingService: el carril SSB no admite antesala anónima …');
  }
  return super.setAdmission(mode);
}
```

Además el constructor ya no **ignora** una opción `admission` (la aplica,
y por tanto la rechaza). Pruebas: `D1` (7 truthy + 6 falsy), `D1b`
(alcanzable por API pública: `connect()` con `requireSsbId: 1` ⇒ el join
anónimo deniega), `D1c` (el carril SSB lanza, por `setAdmission` y por
constructor).

**Fail-probes nuevas:** **M5** = revertir D1 a `=== true` → cae `D1`;
**M6** = quitar el candado del carril SSB → cae `D1c`. Ambas revertidas,
árbol verde.

### D2 · Hay un cartel donde dije que hay una puerta · **CORREGIDO**

**Aceptado.** Verificado a mano, no leído:

```
$ grep -rn "requireLanPeerCard|assertLanBlobTransferAllowed" --include=*.mjs . | grep -v node_modules
  → blob-sync-harness/src/{index,lan-gate,run-spike}.mjs   (spike U100)
  → blob-sync-harness/test/harness.test.mjs                (test)
  → blobstore-client/src/{index,lan,run-fixture}.mjs       (fixture U101)
  → blobstore-client/test/client.test.mjs                  (test)
  → e2e/webrtc-signaling-anonimo.mjs                       (mío)
  = CERO llamadores en ruta de datos de producción

$ grep -nE "peerCard|assertSignaling|getSessionRole|role" packages/engine/webrtc-signaling/src/peer-session.mjs
  (0 coincidencias) — negotiateDataChannel abre el canal y mueve bytes sin consultar card
```

Redactado como pediste, literalmente: **el carril LAN de blobs no está
«cerrado al anónimo» — es que no existe todavía como ruta viva**, y lo
único que deniega es un helper que nadie invoca en el plano de datos. Se
corrigieron los tres sitios donde la afirmación estaba en pie: §0
(justificación de diseño), §4 fila 2 + el párrafo «la nuclear», y §10
vector 1. La razón para no tocar el torno queda reformulada: **alguien lo
importa**, y ablandarlo le habría cambiado el veredicto en silencio sin
que su suite se enterase. Eso basta.

### D3 · Modo desconocido degradaba en silencio · **CERRADO**

`BrowserSocketSignalingService` ahora **lanza** en constructor y en
`setAdmission` (`browser-signaling.mjs:145-160`), igual que el carril Node.
Un typo de despliegue hace ruido en vez de depurarse a ciegas. Test `D3`:
7 valores en constructor + 5 en `setAdmission`.

### D4 · `connect()` ignoraba `config.admission` · **CERRADO**

Se extrajo `_applyPolicy(cfg)` (`browser-signaling.mjs:116-129`) y
`connect()` la invoca **antes** de construir el cliente de sala
(`:228-234`). Test `D4`: un modo inválido en `connect` rechaza y deja
`_client === null` — la política se aplica antes de que exista cable.

### D5 · Paridad de introspección · **CERRADO**

El gemelo expone `setAdmission`, `getSessionRole(now)`, `describeAdmission`
y `getSsbId`. `getSessionRole` re-valida al momento, frescura incluida
(test `D5`: card válida ⇒ `player`; con un `now` futuro ⇒ `null`).

### D6 · La red de seguridad no existía en el gemelo · **IMPLEMENTADA**

Elegí la primera de tus dos salidas: **implementar la red**, no recortar
el modo. Publicar una garantía y no tenerla en un gemelo era el problema;
quitarle el modo anónimo al navegador habría dejado el WP a medias (el
navegador es *el* cliente natural de un signaling anónimo). El gemelo
acepta ahora `requiredRole` / `requireSsbId` / `requireSeatSignature`,
centralizados en `_gateOpts()` (`:131-140`) y aplicados en los cuatro
puntos de torno: `setPeerCard`, `joinRoom`, `sendMessage` y el camino
entrante. Test `D6` cubre los tres, incluida la cara D1 (truthy no
booleano) y el caso «card de `player` donde se exige `operator`».

Coste para quien no declara nada: **cero** — los tres valores por defecto
son `null/false/false`. Las 6 pruebas previas del gemelo siguen verdes.

### D7 · Los `delete` anónimos son código muerto · **DECLARADO**

Confirmado con tu misma medida: mutados, **48/48 verdes** en el carril
Node. No los quito —son red por si un futuro camino de construcción sí los
alcanza— pero ya no se presentan como la garantía. Escrito en el código
(`signaling-service.mjs:297-310`, `browser-signaling.mjs:420-425`): **la
prueba de la ausencia entrante la da la CONSTRUCCIÓN del mensaje**
(`socket-room-signaling.mjs:220-231`, que sólo copia `peerCard`/`ssbId` si
existen) más el rechazo del claim sin sello.

### Contabilidad

- **§4 fila 2** y **§0** reescritas (D2). **§8 fila SSB** reescrita: la
  afirmación estaba refutada, ahora la sustituye código.
- **§4 fila 5** y `peer-card-gate.mjs:165-167`: el texto era correcto; era
  el código el que sólo lo cumplía para `=== true`. `role` sí se leía por
  truthiness (`Boolean(opts.role)`) y sí valía — corregidas las otras dos.
- **CA4**: añadido el **alcance explícito** del grep y la variante
  ampliada a todo `packages/**`, con las 4 coincidencias extra
  (`presets-sdk/test/env-ice-servers.mjs:59-60,68,70`, dominio reservado
  `coturn.example`, inocuas).
- **`resolveIceServers`**: firma en `:405`, no 411 (411 es la primera
  línea del cuerpo). Corregido.
- **e2e: son 5, no 3** — añadido `e2e:webrtc-viewer` (que además toca el
  gemelo que modifiqué) y ya estaba `:ssb-webrtc-signaling`. Todos verdes.
- **`ZEUS_VOLUMES_ROOT`**: no basta la variable; hace falta una raíz con
  **`volumes.json` operable** (`presets-sdk/src/volumes/resolve.mjs:33,52`).
  Documentado el valor usado.

### Anotado y enrutado (no me lo cargo, pero queda escrito)

- **Replay de card ajena** y **card auto-acuñada con rol**: entregan con
  card, son **pre-existentes** e idénticos en modo `peer-card`, y no
  escalan por el modo anónimo. La card no lleva prueba de posesión ligada
  al emisor: la firma que existe (`seatSignature`) es de asiento y sólo se
  exige si se declara. **Dueño: quien tenga la firma de cards** — hilo
  U188 / U190 (matriz de exigencia de `seatSignature`) y U191
  (revocación). Anotado aquí para que no se pierda.
- **`allowTrickle === true`** (`ssb-private-signaling.mjs:57,110`): misma
  clase de asimetría que D1, **no corregido a propósito** por ser
  dirección fail-open y knob de U90.

---

*Worker Z · WP-U197 · rama `wp/u197-signaling-anonimo` · commits `10bec3e` (obra) · `5fb351c` (corrección de la devolución) · 2026-08-01.*

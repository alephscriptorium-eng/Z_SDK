# WP-U197 · Signaling anónimo WebRTC — `admisión ≠ permiso`

| dato | valor |
| ---- | ----- |
| agente | worker Z (swarm F2, ola 3) |
| fecha | 2026-08-01 |
| rama | `wp/u197-signaling-anonimo` (worktree `C:\S_LAB\wt\z-u197`, base `main`) |
| commits | `10bec3e` (código + tests + e2e) · este reporte |
| fila | BACKLOG :249 · GOBIERNO :195-201 · dep. **U186** ✅ (BACKLOG :233) |
| estado propuesto | listo para contrarrevisión adversarial (clase peercard/identidad, §5) |

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

`assertSignalingPeerCard` **no es sólo el torno de la señalización**: es
el portero del **carril LAN de transferencia de blobs por DataChannel**
(U100/U101 · D-21 fila 4), reexportado además por
`packages/mesh/blobstore-client/src/lan.mjs:9-12,20`. Ablandar esa función
—o darle un modo permisivo por defecto— habría abierto el transporte de
blobs a cualquier anónimo. *Ése* es exactamente el «entrar anónimo y salir
con permisos» que este WP tiene prohibido producir.

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
| `src/peer-card-gate.mjs:184-218` | `assertSignalingAdmission(card, opts)` — la capa nueva |
| `src/peer-card-gate.mjs:62-108` | `assertSignalingPeerCard` — **cuerpo sin tocar** (`git diff` sobre el rango = 0 líneas de lógica) |
| `src/signaling-service.mjs:77` | `this._admission = SIGNALING_ADMISSION.peerCard` ← **el defecto no se movió** |
| `src/signaling-service.mjs:84-99` | `setAdmission()` / `getAdmission()` — sólo 2 modos, lo demás lanza |
| `src/signaling-service.mjs:106-117` | `isAnonymous()` / `describeAdmission()` |
| `src/signaling-service.mjs:282-313` | `handleMessage`: admisión de entrantes; anónimo (`:295-302`) ⇒ **borra `peerCard` y `ssbId`** del mensaje entregado |
| `src/signaling-service.mjs:344-369` | `_gatedOutbound`: anónimo ⇒ sale **sin card y sin `ssbId`** |
| `src/socket-room-signaling.mjs:64,87` | opción `admission` en constructor y `connect()` |
| `src/socket-room-signaling.mjs:142-179` | `joinRoom(roomId, peerCard?)` — card **opcional** sólo en modo anónimo |
| `src/index.mjs:46-56` | exports nuevos |
| `types/index.d.ts`, `types/peer-card-gate.d.ts` | tipos de la API nueva |
| `README.md:14-16,46-88` | tabla de modos + los 5 invariantes que el modo anónimo **no** relaja |

### Gemelo de navegador — `packages/mesh/webrtc-viewer/`

`src/browser/browser-signaling.mjs:14-20,95-99,106-113,180-186,225-230,318-331`
— misma admisión. Sin esto, «signaling sin card» sería falso en el
navegador, que habla el **mismo contrato de cable** (U88).

### Pruebas y e2e (nuevos)

- `packages/engine/webrtc-signaling/test/signaling-anonimo.test.mjs` (15 tests)
- `packages/mesh/webrtc-viewer/test/browser-signaling-anonimo.test.mjs` (7 tests)
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
  `git show --stat 10bec3e` lo enseña.

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
| 2 | **el carril protegido que viaja por ese MISMO DataChannel** | `assertLanBlobTransferAllowed(anónimo)` → `{"ok":false,"lane":"lan-datachannel","error":"peer-card missing or malformed"}` |
| 3 | el portero de terceros no se movió | `assertSignalingPeerCard(anónimo)` → `{"ok":false,...}`; y **`assertSignalingPeerCard(null,{admission:'anonymous'}) === {ok:false}`**: el torno U186 ni conoce la opción, no hay contagio |
| 4 | par con antesala **estricta** en la misma sala | `gated entregados=0 · rechazos=1 · motivo: signaling peer-card rejected: peer-card missing or malformed` |
| 5 | exigencia configurada sobre modo anónimo | `requiredRole:'operator'` o `requireSeatSignature:true` ⇒ la ausencia **deniega** igual (`CA3d`, `CA3e`) |

La prueba 2 es la nuclear: el carril LAN de blobs es *exactamente* lo que
un anónimo con DataChannel abierto querría usar. Abre el canal — y el
carril sigue cerrado, porque el permiso nunca estuvo en el canal.

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

### Fail-probe: se mutó el código y las pruebas cayeron

No basta con que las pruebas pasen; hay que enseñar que **caen**. Cuatro
mutaciones hostiles aplicadas sobre el árbol y revertidas:

| mutación | qué simula | resultado |
| -------- | ---------- | --------- |
| **M1** — card presentada e inválida devuelve `{ok:true, anonymous:true}` | el bypass clásico: «si la card es basura, trátalo como anónimo» | **7 fail / 45** — cae `rojo 1`, `rojo 2`, `rojo 3` y **también las CA3b/CA3c de U186** |
| **M2** — `this._admission = anonymous` por defecto | retirar el torno global a hurtadillas | **6 fail / 45** — cae la **CA4 de U186** y su caso rojo, más `CA3c`, `rojo 5`, `rojo 6` |
| **M3** — la admisión anónima devuelve `role:'player'` | conceder rol al admitir | **1 fail / 45** (`rojo 3`) |
| **M4** — `admission: message?.admission ?? this._admission` + el payload propaga el claim | negociar el modo por el cable | **1 fail / 45** (`rojo 5`) |

Tras revertir: `45 pass / 0 fail`. (M3 y M4 sólo tienen un cazador cada
una porque son mutaciones de superficie estrecha; el árbol restaurado se
verificó verde antes de commitear.)

---

## 6. CA4 · STUN/TURN por entorno — greps con patrón y salida

**El código no conoce ningún servidor.** Único punto de lectura:

```
$ grep -rn "ZEUS_WEBRTC_" --include=*.mjs packages/*/*/src/ | grep -v node_modules
packages/engine/presets-sdk/src/env/index.mjs:411:  for (const url of splitIceUrls(env.ZEUS_WEBRTC_STUN)) {
packages/engine/presets-sdk/src/env/index.mjs:415:  const turnUrls = splitIceUrls(env.ZEUS_WEBRTC_TURN_URL || env.ZEUS_WEBRTC_TURN);
packages/engine/presets-sdk/src/env/index.mjs:421:  const user = env.ZEUS_WEBRTC_TURN_USER;
packages/engine/presets-sdk/src/env/index.mjs:422:  const pass = env.ZEUS_WEBRTC_TURN_PASS ?? env.ZEUS_WEBRTC_TURN_CREDENTIAL;
packages/engine/presets-sdk/src/env/index.mjs:428:  if (String(env.ZEUS_WEBRTC_ALLOW_GOOGLE_STUN || '') === '1') {
   (resto de coincidencias: comentarios de doc en :370-399)
```

Literales de servidor en TODO el código de producción del repo:

```
$ grep -rnE "['\"\`](stuns?|turns?):" --include=*.mjs --include=*.js --include=*.ts packages/*/*/src/ | grep -v node_modules
packages/engine/presets-sdk/src/env/index.mjs:364:  'stun:stun.l.google.com:19302',
packages/engine/presets-sdk/src/env/index.mjs:365:  'stun:stun1.l.google.com:19302'
```

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

| suite | antes | después |
| ----- | ----- | ------- |
| `@zeus/webrtc-signaling` | 30 pass / 0 fail | **45 pass / 0 fail** |
| `@zeus/webrtc-viewer` | 6 pass / 0 fail | **13 pass / 0 fail** |
| `@zeus/blob-sync-harness` | 11 / 0 | 11 / 0 |
| `@zeus/blobstore-client` | 19 / 0 | 19 / 0 |
| `@zeus/rooms` | 12 / 0 | 12 / 0 |
| `@zeus/socket-core` | 6 / 0 | 6 / 0 |
| `@zeus/authority-kit` | 16 / 0 | 16 / 0 |
| `@zeus/protocol` | 37 / **3 fail** | 37 / **3 fail** ⚠️ pre-existente, ver §8 |
| `eslint` (paquetes tocados + e2e) | limpio | limpio |

e2e (todos verdes tras el cambio):

```
npm run e2e:webrtc-signaling-anonimo  → OK   (nuevo)
npm run e2e:webrtc-signaling          → OK   (U88, sin regresión)
npm run e2e:peer-card-chain           → OK   (U93/U186, sin regresión)
npm run e2e:ssb-webrtc-signaling      → OK   (U90, sin regresión)
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

Los e2e **antiguos** (`e2e:webrtc-signaling`, `:peer-card-chain`) exigen
`ZEUS_VOLUMES_ROOT` porque importan `e2e/helpers.mjs`. El e2e **nuevo no
importa helpers a propósito**: corre sin ninguna precondición de entorno.

---

## 8. Qué queda fuera, y de quién es

| tema | estado | dueño citado |
| ---- | ------ | ------------ |
| **TURN real contra servidor externo (coturn)** | ⏳ **no ejercitado**. El e2e prueba que las credenciales TURN del entorno llegan íntegras a la config ICE, pero **no** hay relay TURN vivo contra el que hacer un `relay candidate`: requiere VPS/pub del operador | **U198** (BACKLOG :250) · GOBIERNO :205-210: *«deps ext.: VPS/pub del operador (**custodio**) — la evidencia de ejecución exige entorno que el repo no contiene»*. STUN/TURN de despliegue = ops, **owner O** (GOBIERNO :196-197). Runbook: `docs/mesh/coturn-runbook.md`, nunca ejecutado |
| **Cambiar el DEFECTO a anónimo** | ⏳ **no hecho a propósito**. Es política de despliegue, no de este WP; y rompería la CA4 aceptada de U186 | **O** — contrato **D-O11 / O13** abierto en `plan/REPORTES/U186-paso0-frontera-room-join.md:123,148`. Basta `admission: 'anonymous'` (una línea) el día que O lo resuelva |
| **`GOOGLE_STUN_URLS` como literal en `env/index.mjs:363-366`** | leído, **no tocado**. Es opt-in tras flag + WARNING, así que no viola CA4 en la práctica; pero es el único literal de servidor del repo | **U227** — fichero caliente, *«edición solo U227 (ola 2)»* (GOBIERNO §2 :581) |
| **`SsbPrivateSignalingService` en modo anónimo** | ⏳ **fuera de alcance**. Hereda la maquinaria, pero su `requireSsbId` es `true` por defecto (`ssb-private-signaling.mjs:55`), así que **siempre exige card** — comportamiento intacto y deliberado: el carril SSB *es* identidad por definición | Z, futuro WP si alguna vez se quiere DM-signaling anónimo (contradictorio con SSB) |

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
   (CA3b unitario + salida del e2e). El carril LAN de blobs deniega al
   anónimo con DataChannel abierto (e2e, §4 prueba 2).
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

*Worker Z · WP-U197 · rama `wp/u197-signaling-anonimo` · commit `10bec3e` · 2026-08-01.*

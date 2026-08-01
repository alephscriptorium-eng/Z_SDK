# WP-U251 · Seis menores del signaling anónimo — las fugas de exigencia

| dato | valor |
| ---- | ----- |
| agente | worker V |
| fecha | 2026-08-01 |
| rama | `wp/u251-menores-signaling` (worktree `C:\S_LAB\wt\z-u251`, base `main`) |
| fila | BACKLOG :263 · secuela de **U197** ✅ (BACKLOG :265) sobre **U186** ✅ (BACKLOG :233) |
| alcance tocado | `packages/engine/webrtc-signaling/**` (src · test · types · README) · este reporte · fila U251 del BACKLOG |
| estado propuesto | **entregado** — 6/6 cerrados, 0 descartados |

---

## 0. Lo que este WP arregla y lo que NO toca

U197 dejó fijada la doctrina **`admisión ≠ permiso`**, corolario de
**`transporte ≠ permiso`** (U186): un par anónimo puede completar el saludo
WebRTC y **eso no le da acceso a nada protegido**. Los seis defectos de esta
ficha se enrutaron aquí precisamente porque **ninguno abre esa puerta** — y
seguido: ninguno la abre **tampoco después del arreglo**. Lo que arreglan es
otra cosa, y es la que envejece mal en una frontera de confianza: **fugas de
exigencia**. Dos de ellas son fail-open y van primero.

**Intacto a propósito:** `assertSignalingPeerCard` y todo
`src/peer-card-gate.mjs`. **Cero líneas modificadas**, verificable en el
diff. No es prudencia genérica: esa función es también el portero del carril
LAN de blobs por DataChannel (`packages/mesh/blob-sync-harness/src/lan-gate.mjs:23`,
reexportada por `packages/mesh/blobstore-client/src/lan.mjs`). Ablandarla
—o darle un modo permisivo— le cambiaría el veredicto a un consumidor ajeno
en silencio. Los seis arreglos se hicieron **sin tocarla**.

**Fuera de mi alcance por reparto (no por olvido):** el gemelo de navegador
`packages/mesh/webrtc-viewer/src/browser/browser-signaling.mjs`, citado por
la ficha en los defectos (1), (3) y (5). Está en `packages/mesh/**`,
territorio de otros WPs vivos. Se **leyó y se midió** (§5, §8), no se editó.
Para el defecto (5) esto no fue un obstáculo sino la respuesta: el gemelo de
navegador ya era el correcto, y quien tenía que seguirle era Node.

---

## 1. Verificación de las citas de la ficha (todas abiertas antes de citar)

| ficha U251 | cita | ¿vigente? |
| ---------- | ---- | --------- |
| (1) | `socket-room-signaling.mjs:148-153` | ✅ era el `assertSignalingAdmission` de `joinRoom`, sin `claimedFrom` |
| (1) | `browser-signaling.mjs:270` | ✅ `assertSignalingAdmission(peerCard, this._gateOpts())`, sin `claimedFrom` — **fuera de alcance** |
| (2) | README `:98-104` | ✅ la ✎ *«alcance exacto»* que se autoenrutaba a U251 |
| (3) | `signaling-service.mjs:127` | ✅ `if (opts.requireSsbId != null) this._requireSsbId = Boolean(opts.requireSsbId)` — dos lecturas |
| (3) | `browser-signaling.mjs:125` | ✅ misma forma en `_applyPolicy` — **fuera de alcance** |
| (4) | `ssb-private-signaling.mjs:111-116` | ✅ exigencias escritas y `setAdmission` (que lanza) justo debajo |
| (4) | `socket-room-signaling.mjs:85-89` | ✅ idem, con `setPeerCard` (que lanza) debajo |
| (5) | gemelos con modo falsy | ✅ Node `if (options.admission)` vs navegador `if (cfg.admission != null)` |
| (6) | `types/index.d.ts:148-151` | ✅ `SsbPrivateSignalingService extends SignalingService` sin estrechar `setAdmission` |

**Las nueve citas seguían vivas.** Ninguna caducada, ninguna corrida de sitio.

---

## 2. Defecto (1) — FAIL-OPEN · la admisión sacaba al cable lo que la acción denegaba

**Qué pasaba.** `_gatedOutbound` (`signaling-service.mjs`) juzga el `from`
saliente como claim de identidad (`claimedFrom: message.from`): si tiene
forma de feed SSB y no hay card, deniega. `joinRoom` **no lo hacía** — y el
anuncio `join-room` que construye lleva `from: this.userId` **al cable**. Con
un `userId` de forma feed SSB, el resultado era: el `join-room` anónimo salía
**con el claim puesto**, y el `sendOffer` siguiente lanzaba. Dos vías, dos
veredictos, y el claim ya había viajado. Además el modo anónimo quedaba
**inusable** para esa forma de identidad **sin que nada lo documentase**.

**Vector rojo** (`test/u251-menores.test.mjs` · `D1`):
`userId = '@Vt0zURlyOWvW6yQL9Q9nQNwFq+ykYCEBJvfDBrmTFPQ=.ed25519'`,
`admission: 'anonymous'`.

```
ANTES → not ok 1 — Missing expected rejection: la vía de ADMISIÓN debe
                   denegar igual que la de acción
        (sendOffer SÍ rechazaba con /unproven identity claim/;
         joinRoom resolvía y ponía el feed id en bus.wire)
DESPUÉS → ok 1 — joinRoom rechaza, getRoomId()==='' , bus.wire.length===0,
                 y el feed id no aparece en el cable
```

**Arreglo.** `socket-room-signaling.mjs` `joinRoom`: se añade
`claimedFrom: this.userId` a las opciones del torno — la misma regla, leída
en el mismo sitio, sin ruta paralela.

**Documentado** (lo que faltaba): README, invariante 2 — *«el modo
`anonymous` NO es compatible con un `userId` con forma de feed SSB»*, con el
motivo (un feed id **es** un claim) y las dos salidas (userId que no sea
feed, o presentar card).

**Guardas de que no cierra de más:** `D1b` (userId corriente sigue entrando
y el anuncio sigue saliendo sin card) y `D1c` (card válida en modo anónimo
sigue acreditando `role:player` — el claim suelto no interfiere con la ruta
de card presentada).

---

## 3. Defecto (4) — FAIL-OPEN · un `connect()` que lanza dejaba las exigencias ya rebajadas

**Qué pasaba.** Ambos `connect()` escribían la política —`requiredRole`,
`requireSsbId`, `requireSeatSignature`, `admission`— **antes** de las
llamadas que pueden lanzar (`setAdmission` con modo prohibido, `setPeerCard`
con card inválida, y el propio transporte). Una llamada que fallaba a mitad
dejaba el servicio **más permisivo que antes de llamar**, y sin sesión que lo
justificara. Éste es el que peor envejece: nadie audita el estado tras un
`catch`.

**Vectores rojos** (3):

| test | vector | antes |
| ---- | ------ | ----- |
| `D4` (socket) | servicio estricto ya conectado; `connect(user, { admission:'anonymous', requireSsbId:false, peerCard: <caducada> })` → lanza `/expired/` | `getAdmission()` quedaba `'anonymous'` y `joinRoom(ROOM)` **sin card entraba**: un servicio configurado estricto pasaba a admitir anónimos por culpa de una llamada que falló |
| `D4b` (SSB) | `connect(feed, { requireSsbId:false, admission:'anonymous' })` → lanza `/carril SSB no admite antesala anónima/` | `requireSsbId` quedaba en `false`: el carril federado aceptaba cards **sin feed id** — su exigencia estructural, derribada por una llamada que falló |
| `D4c` (socket) | el transporte se cae (`io.connect` lanza) tras aplicar `admission:'anonymous'` + card válida | quedaban antesala anónima y card adoptada **sin cable** |

```
ANTES → not ok 4, 5, 6  (3 rojos)
DESPUÉS → ok 4, 5, 6
```

**Arreglo.** `SignalingService` gana dos protegidos —`_policySnapshot()` /
`_policyRestore()`— y **los dos `connect()` envuelven su cuerpo entero** en
`try { … } catch (err) { this._policyRestore(snapshot); throw err; }`. El
retrato cubre `admission`, `requiredRole`, `requireSsbId`,
`requireSeatSignature` y `peerCard`. Se envuelve **todo** el cuerpo, no sólo
el tramo de política: un `connect` que no abre cable tampoco debe dejar
política nueva aplicada.

> ✎ **Alcance exacto, para no afirmar de más:** el rollback cubre la
> **política de exigencias y la card**. **No** revierte `this.userId`,
> `this._client` / `this._transport` ni `this._allowTrickle`. No son
> exigencias —no relajan ningún torno— pero es media verdad decir que el
> estado «vuelve al de antes»: vuelve **el estado que decide quién pasa**.
> Anotado en §9 como abierto.

---

## 4. Defecto (3) — el getter alternante tiraba la exigencia declarada

**Qué pasaba.** `setPeerCard` leía **cada opt dos veces**: una para el
`!= null` y otra para el `Boolean()`. Un `opts` con getter alternante
(`true` la primera lectura, `false` la segunda) pasaba el guardián y
aterrizaba `false` en el campo: la exigencia declarada se caía en silencio y
la card se validaba **sin ella**. `connect()` era inmune, pero **de rebote**:
su `const opts = { ...this._options, ...config }` materializa cada opt una
sola vez.

**Vectores rojos** (3), todos con el mismo opt hostil
(`{ get requireSsbId() { return n++ === 0; } }`):

```
D3   requireSsbId        ANTES: setPeerCard(cardSinSsbId, opts) NO lanzaba
                         DESPUÉS: lanza /ssbId missing or malformed/ y el opt
                                  se lee exactamente 1 vez (assert explícito)
D3b  requireSeatSignature ANTES: no lanzaba · DESPUÉS: /seat signature missing/
D3c  role                 ANTES: se validaba con 'operator' y NO se persistía
                                 (segunda lectura `undefined`), así que una card
                                 que sólo acredita `player` pasaba después
                          DESPUÉS: /does not grant role:operator/
```

`D3c` es un ensanche mío sobre la ficha: `opts.role` tenía la **misma** doble
lectura (hasta tres) en la **misma** función, y arreglar sólo dos de tres
habría dejado la fixture vigilando a medias. Lo declaro por si el revisor
prefiere acotarlo.

**Arreglo.** `setPeerCard` copia los tres opts a `const` locales y trabaja
sobre la copia. Y en `connect()` la inmunidad pasa de accidental a
**deliberada**: comentario que dice que el spread es el mecanismo, y `D3d`
que lo vigila.

---

## 5. Defecto (5) — gemelos: **el valor con el que divergen es `admission` falsy**

La pregunta del custodio era la correcta: *¿con qué valor divergen?* Medido,
no supuesto.

| `admission` | navegador (`browser-signaling.mjs` `_applyPolicy`, `cfg.admission != null`) | Node **antes** (`if (options.admission)`) | ¿idénticos antes? |
| ----------- | ---- | ---- | --- |
| `'peer-card'` | ADMITE → `peer-card` | ADMITE → `peer-card` | sí |
| `'anonymous'` | ADMITE → `anonymous` | ADMITE → `anonymous` | sí |
| **`''`** | **LANZA** | **ADMITE → `peer-card`** | **NO** |
| **`0`** | **LANZA** | **ADMITE → `peer-card`** | **NO** |
| **`NaN`** | **LANZA** | **ADMITE → `peer-card`** | **NO** |
| **`false`** | **LANZA** | **ADMITE → `peer-card`** | **NO** |
| `'anon'` (typo no vacío) | LANZA | LANZA | sí |
| `undefined` | ADMITE → `peer-card` | ADMITE → `peer-card` | sí |
| `null` | ADMITE → `peer-card` | ADMITE → `peer-card` | sí |

**Cuál es la correcta: la del navegador.** Las dos direcciones son seguras
(ninguna convierte un falsy en `anonymous`), pero no son equivalentes en lo
que importa: una **avisa** y la otra **calla**. El propio gemelo de navegador
lleva la doctrina escrita en el código (`D3 — modo desconocido LANZA (antes
degradaba en silencio a 'peer-card': dirección segura, pero muda)`). Un typo
de despliegue —`ZEUS_ADMISSION=""` sin exportar— no puede depurarse a
ciegas. **Node sigue al navegador**, no al revés: es el que se movía menos y
el que no está en territorio ajeno.

**Vectores rojos** (3): `D5` (constructor socket), `D5b` (`connect()` socket)
y `D5c` (constructor SSB), cada uno recorriendo los **cuatro valores que
divergen** — que es justamente lo que la fixture tenía que meter para
vigilar algo.

```
ANTES → not ok 14, 15, 16 — Missing expected exception: … admission:
DESPUÉS → ok 14, 15, 16
```

**Guarda:** `D5d` — `undefined` / `null` siguen significando «no declarado»
⇒ statu quo `peer-card`. Sin ella el arreglo habría podido cerrar de más.

**Paridad medida después del arreglo** (sonda directa contra los dos
gemelos, los 9 valores de la tabla): **9/9 idénticos** en veredicto y modo
resultante. Sólo difiere el prefijo del mensaje (`SignalingService.` vs
`BrowserSocketSignalingService.`), que es correcto y deliberado.

---

## 6. Defecto (2) — el candado SSB, de verdad

**Qué había.** U197 dejó anotado su propio alcance con honestidad: el
candado era un `override` de método (`setAdmission` lanza ante `anonymous`)
**sobre un campo público** (`this._admission`). Garantizaba *«no hay
configuración que lo abra»*, **no** *«imposible por construcción»*.

**Vectores rojos** (2):

```
D2   svc._admission = 'anonymous'                                  ANTES: getAdmission() → 'anonymous'
D2b  SignalingService.prototype.setAdmission.call(svc,'anonymous') ANTES: getAdmission() → 'anonymous'
DESPUÉS: ambos → 'peer-card', y D2b comprueba además que el TORNO actúa en
         consecuencia (sendOffer sigue exigiendo card: /peer-card required/)
```

**Arreglo, en dos mitades.**

1. **Estructural** — `#admission` es ahora **campo privado** de
   `SignalingService` (era `_admission`). Nadie lo escribe sin pasar por
   `setAdmission()`; escribir `svc._admission` crea una propiedad muerta que
   nadie lee. Y **el torno lee el modo por `getAdmission()`**: se cambiaron
   los 4 puntos de lectura (`describeAdmission`, `handleMessage`,
   `_gatedOutbound`, `socket-room-signaling.joinRoom`). `SsbPrivateSignalingService`
   **sobrescribe `getAdmission()` a la constante `peer-card`** — «forzar el
   modo en las opciones del torno», la segunda opción que daba la ficha.
   Aunque alguien consiga escribir el estado, el torno no lo mira.
2. **Ruidosa** — `setAdmission('anonymous')` **sigue lanzando** en el carril
   SSB, para que la vía de configuración se entere (guarda `D2c`).

**Lo que sigue sin garantizarse, dicho:** una **subclase propia** puede
volver a sobrescribir `getAdmission()`. Eso ya no es pinchar este servicio;
es escribir otro. README actualizado con esta frontera exacta (invariante 6).

---

## 7. Defecto (6) — el candado, visible para TypeScript

**Qué pasaba.** `types/index.d.ts:148-151` declaraba
`SsbPrivateSignalingService extends SignalingService` sin estrechar nada: un
consumidor TS veía `setAdmission('anonymous')` como **legal**, justo en la
capa donde se habría enterado en tiempo de compilación. Y
`SsbPrivateSignalingOptions` no declaraba `requireSsbId` /
`requireSeatSignature` / `admission`, que el runtime **sí** lee.

**Vector rojo** — sensor `test/fixtures/ts-candado-ssb/consumidor.ts` bajo
`tsc --noEmit` (`test/u251-tipos.test.mjs`). Cuatro errores medidos antes:

```
consumidor.ts(40,5)  TS2345 'requireSsbId' does not exist in type 'SsbPrivateSignalingOptions'
consumidor.ts(46,3)  TS2578 Unused '@ts-expect-error' directive
                            ← el defecto: setAdmission('anonymous') typechecaba
consumidor.ts(53,27) TS2345 'requireSsbId' does not exist in type '{ role?; now? }'
consumidor.ts(55,3)  TS2322 Type 'SignalingAdmission' is not assignable to type '"peer-card"'
DESPUÉS → tsc status 0, cero `error TS`
```

**Arreglo.** `setAdmission(mode: 'peer-card')` y `getAdmission(): 'peer-card'`
estrechados en `SsbPrivateSignalingService`; `requireSsbId` /
`requireSeatSignature` / `admission?: 'peer-card'` añadidos a
`SsbPrivateSignalingOptions`; `requireSsbId` / `requireSeatSignature`
añadidos al `opts` de `SignalingService.setPeerCard`.

**El fixture también vigila que NO se cerró de más:** `carrilSocket()`
construye un `SocketRoomSignalingService` con `admission: 'anonymous'` y
llama `setAdmission('anonymous')` — si el estrechamiento se hubiera aplicado
al carril equivocado, el sensor se pondría rojo por el otro lado.

Notas del sensor, para que nadie se apoye en más de lo que es: usa el `tsc`
del `node_modules` del repo (**4.9.5**, pinado en el lockfile; resuelto por
`require.resolve`, **nunca `npx`**) y `types: []` a propósito, porque TS 4.9
no parsea `@types/node@26`. Si `typescript` no resuelve, el test **falla**,
no se salta.

---

## 8. La frontera no se movió — la prueba

**Ningún arreglo concede nada.** Los seis van en la dirección de **denegar
más** o **hacer ruido antes**; ninguno admite un caso que antes se denegara:

| defecto | dirección |
| ------- | --------- |
| (1) | deniega un `join-room` que antes pasaba (y cuyo claim viajaba) |
| (4) | restaura exigencias que antes quedaban rebajadas |
| (3) | aplica exigencias que antes se caían |
| (5) | lanza donde antes callaba — el modo resultante era ya `peer-card`, nunca `anonymous` |
| (2) | el torno SSB deja de mirar un estado pinchable |
| (6) | sólo tipos: cero cambio de runtime |

**Vector `frontera`** (`u251-menores.test.mjs`, última prueba): dos anónimos
completan `connect` → `joinRoom` → `sendOffer` en modo `anonymous` y, tras
el handshake:

```
getSessionRole() === null        (la antesala no concede)
getPeerCard()    === null        (no se fabricó card por el camino)
getSsbId()       === null        (ni identidad)
describeAdmission() === { admission:'anonymous', anonymous:true, role:null }
cable: 0 coincidencias de /peerCard|seatSignature|token|ssbId/
```

**Evidencia externa** (lo protegido sigue protegido, sin que yo lo tocara):

- `assertSignalingPeerCard` / `peer-card-gate.mjs`: **0 líneas modificadas**.
- Suites de los consumidores de ese portero, **verdes sin tocar**:
  `@zeus/blob-sync-harness` **11/11**, `@zeus/blobstore-client` **19/19**,
  `@zeus/oasis-webrtc` **3/3**.
- Gemelo de navegador `@zeus/webrtc-viewer`: **17/17** (baseline 17/17).
- `e2e:webrtc-signaling-anonimo`: OK — handshake anónimo completo con
  DataChannel abierto, `assertLanBlobTransferAllowed(anónimo)` sigue
  denegando y el par estricto sigue rechazando al anónimo.
- `e2e:ssb-webrtc-signaling`: OK.

---

## 9. Qué queda abierto

1. **El gemelo de navegador conserva los defectos (1) y (3).**
   `browser-signaling.mjs:270` sigue sin `claimedFrom` en `joinRoom`, y
   `:125` (`_applyPolicy`) sigue con la doble lectura del opt. Están en
   `packages/mesh/**`, fuera de mi reparto. **Los dos son portables tal
   cual**: una línea `claimedFrom: this.userId` en `_gateOpts()` del
   `joinRoom`, y tres `const` locales en `_applyPolicy`. El defecto (5)
   quedó cerrado sin tocarlo porque el correcto era él.
2. **El rollback de (4) no revierte `userId` / `_client` / `_transport` /
   `_allowTrickle`** (§3). No son exigencias, pero un `connect` fallido deja
   esos campos movidos.
3. **La doble lectura del opt vive también dentro de `peer-card-gate.mjs`**
   (`assertSignalingPeerCard` lee `opts.role` hasta 3 veces; `assertSignalingAdmission`
   lee los opts y luego los reenvía al torno, que vuelve a leerlos). **No lo
   toqué a propósito**: es el portero de otro carril. Medido antes de
   afirmarlo: ahí el getter alternante falla **cerrado**, porque
   `peerCardGrantsRole(card, undefined)` devuelve `false`
   (`protocol/src/peer-card.mjs:285`). No es un fail-open hoy; sí es la
   misma forma, y merece ficha propia si alguna vez esa rama cambia.
4. **El sensor TS depende de un `typescript` transitivo** (4.9.5, pinado en
   el lockfile pero no declarado en `devDependencies` de la raíz). Es el
   mismo apoyo que usa `packages/engine/protocol/test/subpath-types-smoke.test.mjs`.
   Declararlo sería lo limpio, pero `package.json` y el lockfile están fuera
   de mi alcance.
5. **Ninguno de los seis resultó no ser defecto.** Los seis eran
   reproducibles y los seis tenían vector rojo antes del arreglo.

---

## 10. Números

| suite / sonda | antes | después |
| ------------- | ----- | ------- |
| `@zeus/webrtc-signaling` (`npm test -w`) | **48/48** | **67/67** |
| — de ellos, nuevos de U251 | — | **19** (`u251-menores` 18 + `u251-tipos` 1) |
| rojos demostrados antes del arreglo | **13** de 19 | 0 |
| `@zeus/webrtc-viewer` (gemelo, sin tocar) | 17/17 | **17/17** |
| `@zeus/blob-sync-harness` | — | **11/11** |
| `@zeus/blobstore-client` | — | **19/19** |
| `@zeus/oasis-webrtc` | — | **3/3** |
| `eslint packages/engine/webrtc-signaling` | limpio | **limpio** |
| `e2e:webrtc-signaling-anonimo` · `e2e:ssb-webrtc-signaling` | OK | **OK** |

Reparto de los 13 rojos: (1) → 1 · (4) → 3 · (3) → 3 · (2) → 2 · (5) → 3 ·
(6) → 1. Los 6 verdes restantes son **guardas de no-cerrar-de-más**
(`D1b`, `D1c`, `D3d`, `D2c`, `D5d`) y el vector `frontera`.

`e2e:webrtc-signaling` y `e2e:peer-card-chain` **no se pudieron ejecutar** en
este entorno: fallan al importar `e2e/helpers.mjs` con
`ZEUS_VOLUMES_ROOT is not set` (`presets-sdk/src/volumes/resolve.mjs:33`),
antes de tocar una sola línea de señalización. Causa ambiental, no del
cambio.

**Higiene:** `packages/engine/feed-kit/bin/jetstream-sync.mjs`,
`linea-kit/bin/linea-kit.mjs` y `playbook-kit/bin/run-playbook.mjs` aparecen
como ` M` en `git status`. **No es contrabando**: `git diff` sale vacío — es
la renormalización LF→CRLF que hace `npm ci` al reescribir los shims de bin.
No van en ningún commit mío.

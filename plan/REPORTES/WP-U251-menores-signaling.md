# WP-U251 · Seis menores del signaling anónimo — las fugas de exigencia

| dato | valor |
| ---- | ----- |
| agente | worker V |
| fecha | 2026-08-01 |
| rama | `wp/u251-menores-signaling` (worktree `C:\S_LAB\wt\z-u251`, base `main`) |
| fila | BACKLOG :263 · secuela de **U197** ✅ (BACKLOG :265) sobre **U186** ✅ (BACKLOG :233) |
| alcance tocado | `packages/engine/webrtc-signaling/**` (src · test · types · README) · este reporte · fila U251 del BACKLOG |
| estado propuesto | **devuelto y corregido** — 6/6 cerrados + los 3 bloqueantes y los 5 menores de la devolución (§11); ficha **U262** abierta |

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

> ⛔ **Esta nota decía una falsedad y la devolución la tumbó. Ver §11.1 y
> §11.4.** Decía: *«el rollback cubre la política de exigencias y la card;
> no revierte `userId`, `_client`/`_transport` ni `_allowTrickle` — no son
> exigencias»*. **`userId` sí decide lo que se exige después** (acuña la
> identidad que satisface `requireSsbId`, y gobierna el `claimedFrom` del
> arreglo (1)); `_allowTrickle` y `_transport` también muerden. El
> inventario definitivo está en §11.1/§11.4: **8 campos**, no 5.

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

> ✎ **Acotado tras la devolución (M4).** Ese 9/9 es **sobre `admission`, y
> nada más** — mi redacción original invitaba a leerlo como paridad de los
> gemelos. **No lo es: divergen en `requireSsbId`**, medido:
> `setPeerCard(card, { requireSsbId: true })` aplica la exigencia en Node y
> el gemelo de navegador **la ignora en silencio**, porque su `setPeerCard`
> **no acepta `opts`** (`browser-signaling.mjs:215`). Es otro eje, no el de
> este defecto; va al abierto (§9.1) y a la tabla del README.

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

**Lo que sigue sin garantizarse, dicho con precisión** (corregido en la
devolución, M1 — mi primera redacción sólo mencionaba subclases y eso
sugería que las demás vías estaban cerradas): **el candado pasó de campo
público a método público, no a estructural.** Tres vías medidas, una línea
cada una:

| bypass | medido |
| ------ | ------ |
| subclase que re-sobrescriba `getAdmission()` | (es escribir otro servicio) |
| **sombra de instancia** — `svc.getAdmission = () => 'anonymous'` | `getAdmission()` → **`anonymous`** |
| **borrar el método del prototipo** — `delete SsbPrivateSignalingService.prototype.getAdmission` + `SignalingService.prototype.setAdmission.call(svc,'anonymous')` | `getAdmission()` → **`anonymous`** |

Lo garantizado sigue siendo exactamente: **no hay configuración que lo
abra**, y ahora tampoco lo abre una **escritura de campo** (que era el
agujero que la ficha pedía cerrar). README actualizado con las tres.

> ✎ No lo cierro. `Object.defineProperty(this,'getAdmission',{writable:false,
> configurable:false})` en el constructor mataría las dos últimas, pero
> rompe la sobrescritura legítima en subclases y en dobles de prueba, y el
> coordinador acotó M1 a *declarar*. Queda dicho, no enterrado.

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

1. **El gemelo de navegador conserva (1) y (3), y además diverge en
   `requireSsbId`.** Están en `packages/mesh/**`, fuera de mi reparto.
   - `browser-signaling.mjs:270` — `joinRoom` sin `claimedFrom`. ⚠
     **Corregido el calificativo tras la devolución (M3):** lo llamé «doble
     lectura», y no lo es: allí es **fail-open vivo**, el mismo defecto (1)
     que aquí se cerró — con `userId` de forma feed, el `join-room` anónimo
     **saca el feed al cable**. Arreglo portable: una línea
     `claimedFrom: this.userId` en su `_gateOpts()`.
   - `browser-signaling.mjs:125` (`_applyPolicy`) — ésa sí es la doble
     lectura del defecto (3). Arreglo portable: tres `const` locales.
   - `browser-signaling.mjs:215` — `setPeerCard(peerCard)` **no acepta
     `opts`**: `{ requireSsbId: true }` se ignora en silencio (§5, M4).
   El defecto (5) quedó cerrado sin tocarlo porque el correcto era él.
2. ~~**El rollback de (4) no revierte `userId` / `_client` / `_transport` /
   `_allowTrickle`.** No son exigencias…~~ **CERRADO en la devolución**
   (§11.1, §11.4): `userId`, `_transport` y `_allowTrickle` **sí** deciden lo
   que se exige después y están ya en el retrato. `_client` se queda fuera,
   **medido y con motivo**: ver §11.4.
3. ~~**La doble lectura del opt vive también dentro de `peer-card-gate.mjs`**
   … ahí el getter alternante falla **cerrado**…~~ **AFIRMACIÓN FALSA,
   corregida en §11.3.** Medí **una** alternancia y generalicé a la rama
   entera. Con otra alternancia el portero **falla ABIERTO**. Ficha propia
   abierta: **U262** (BACKLOG :264), con sus dos vectores medidos y dos
   pruebas de evidencia en la suite.
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
| `@zeus/webrtc-signaling` (`npm test -w`) | **48/48** | **75/75** (67 tras la 1.ª ronda, +8 en la devolución) |
| — de ellos, nuevos de U251 | — | **27** (`u251-menores` 18 + `u251-tipos` 1 + `u251-devolucion` 8) |
| rojos demostrados antes del arreglo | **18** (13 + 5 de la devolución) | 0 |
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

---

## 11. Devolución — *un rollback vale lo que valga su inventario*

El revisor reprodujo los cuatro rojos medibles con vector propio, la
frontera aguantó su ataque completo (8/8) y `peer-card-gate.mjs` quedó con 0
líneas. Pero tres bloqueantes, y tenía razón en los tres. **Reproduje cada
vector antes de tocar nada**; ninguno era una lectura, todos eran medibles.

El diagnóstico del revisor es el que me llevo: el mecanismo del retrato
estaba bien —los campos retratados restauraban— y el fallo estaba en **qué
decidí que era «política»**. Escribí que `userId` «no es una exigencia».
Nadie lo mide hasta que alguien mide que **acuña identidad**.

### 11.1 · B1 — `userId` dentro del retrato, en los dos carriles

Reproducido tal cual, con `whoami()` vacío para partir sin identidad:

```
SSB      joinRoom(card sin ssbId)         → DENIEGA (/ssbId missing or malformed/)
         connect(FEED,{admission:anonymous}) → LANZA · política restaurada
         userId tras el fallo             = "@Vt0z…ed25519"   ← NO revertido
         la MISMA card → joinRoom         → ACEPTADA · getSsbId()=FEED · rol 'player'
```
**Un `connect()` que falló acuñó la identidad que satisface la exigencia
estructural del carril** (`joinRoom` estampa `this.userId` como `ssbId` en
una card que no lo trae, `ssb-private-signaling.mjs:141-143`).

En socket es peor, porque **deshacía mi propio arreglo de (1)**:

```
anonymous + userId=FEED  → joinRoom DENIEGA (/unproven identity claim/)
connect('alice', modo inválido) → LANZA · admission restaurado · userId='alice'
         → joinRoom ADMITIDO · from:'alice' al cable   ← (1) DESHECHO
```

**Arreglo:** `userId` entra en `_policySnapshot()` / `_policyRestore()`.
Rojos `B1a`, `B1b` en `test/u251-devolucion.test.mjs`.

### 11.2 · B2 — `setPeerCard()` valida antes de escribir

Mismo fail-open que (4), preexistente e idéntico a la base: mi (3) cambió
las dobles lecturas por `const` **conservando el orden escribir→validar**.
`connect()` lo tapaba con el retrato; la llamada directa no.

```
servicio requireSsbId:true
setPeerCard(card,{requireSsbId:false, role:'operator'}) → LANZA
setPeerCard(cardSinSsbId)                              → ACEPTADA  ← rebajada
```

**Arreglo:** se calcula la política efectiva en locales, se valida con ella
y **sólo se escribe si la card pasa**. Aquí no hace falta retrato: no
escribir hasta saber es más barato que deshacer. Rojo `B2`; guarda `B2b`
(una llamada que ACEPTA sí aplica lo declarado — no cierro de más).

### 11.3 · B3 — corrijo §9.3 y abro la ficha

Registré la rama del portero como *fail-closed* tras medir **una** sola
alternancia. Falso. Medido ahora, con la card acreditando `player`:

| vector | veredicto | lecturas del opt |
| ------ | --------- | ---------------- |
| `role` `'operator'→undefined` (**el mío**) | `ok:false` — cierra | 2 |
| `role` `'operator'→'player'` | **`{ok:true, role:'player'}`** habiendo exigido `operator` | 2 |
| `expectedSsbId` `AJENO→AJENO→PROPIO` | **`ok:true`** — card de otro feed pasa el amarre | 3 |
| controles con valor **fijo** | `ok:false` los dos | — |

Es defecto de **lectura repetida**, no de política. **No lo arreglo**: el
portero es también el del carril LAN de blobs y tocarlo cambia el veredicto
de un consumidor ajeno — eso quiere su propio WP. Lo que sí es mío es **no
enterrarlo**:

- §9.3 **corregida** (tachada y sustituida, no reescrita en silencio).
- **Ficha U262 abierta** en `plan/BACKLOG.md:264`, P2, con los dos vectores,
  la explotabilidad real (baja: exige entregar getters al portero, que hoy
  sólo recibe literales) y por qué está fuera del alcance de U251.
- **Dos pruebas de evidencia** en la suite (`evidencia U262: …`), que
  **afirman el defecto** y llevan escrito que **deben invertirse al cerrar
  U262**. Están para ponerse rojas ese día, no para bendecirlo.

> Nota de método, porque es la que me costó el bloqueante: una sola
> alternancia no describe una rama. `peerCardGrantsRole(card, undefined)`
> devuelve `false` y por eso *mi* vector cerraba; con **otro rol válido** la
> misma línea acredita. Medir un caso y escribir «fail-closed» es
> exactamente *una afirmación más ancha que la evidencia*.

### 11.4 · M5 — los otros dos campos, resueltos (y el que no)

| campo | qué hace un `connect()` fallido (medido) | resolución |
| ----- | ---------------------------------------- | ---------- |
| `_allowTrickle` (SSB) | deja el **trickle ICE encendido** sobre un carril que lo cierra a propósito: `sendIceCandidate` pasa de **0 → 1** publicaciones | **al retrato** |
| `_transport` (SSB) | queda instalado; como `_connected` sigue en pie, el `sendOffer` siguiente **publica la peer-card local con `token` dentro** por el transporte que instaló la llamada que falló (medido: 1 publicación, `token: tok-SECRETO`) | **al retrato** |
| `_client` (socket) | **nada equivalente, medido**: `connect()` no lee `config.client` (sólo el constructor), así que no hay swap; y `createClient` sólo corre cuando `_client` es nulo, caso en que no había sesión previa. **Queda fuera del retrato con motivo**, no por olvido | fuera, declarado |

El retrato pasa de **5 a 8 campos** (`userId`, `admission`, `requiredRole`,
`requireSsbId`, `requireSeatSignature`, `peerCard` en la base; `transport` y
`allowTrickle` añadidos por el carril SSB, que **extiende** el par en vez de
duplicarlo). Rojos `M5a`, `M5b`.

### 11.5 · M1 y M2 — afirmaciones acotadas

- **M1** — dos bypasses más del candado (2), medidos y ahora declarados en
  §6 y en el README: **sombra de instancia** y **borrado del método del
  prototipo**. Mi residual sólo hablaba de subclases, lo que sugería que el
  resto estaba cerrado. La frase exacta ahora es: *el candado pasó de campo
  público a **método** público, no a estructural*.
- **M2** — mi comentario decía que «la única escritura desde fuera es
  `setAdmission()`», y `_policyRestore()` es una segunda vía sin validar.
  Dirección fail-closed (sólo devuelve un valor que ya pasó por el setter en
  este mismo objeto), así que **no mueve ningún veredicto**: era una
  **afirmación falsa**, no un defecto. Comentario corregido en
  `signaling-service.mjs`.

### 11.6 · Números de la devolución

| | antes de la devolución | después |
| --- | --- | --- |
| `@zeus/webrtc-signaling` | 67/67 | **75/75** (+8) |
| rojos nuevos demostrados | — | **5** (`B1a`, `B1b`, `B2`, `M5a`, `M5b`) |
| pruebas de evidencia U262 (verdes, a invertir) | — | **2** |
| guardas de no-cerrar-de-más | — | **1** (`B2b`) |
| `@zeus/webrtc-viewer` · `blob-sync-harness` · `blobstore-client` · `oasis-webrtc` | 17 · 11 · 19 · 3 | **17 · 11 · 19 · 3** |
| `peer-card-gate.mjs` | 0 líneas | **0 líneas** |

Total del WP: **75/75**, con **18 vectores rojos** demostrados contra la
base a lo largo de las dos rondas (13 + 5).

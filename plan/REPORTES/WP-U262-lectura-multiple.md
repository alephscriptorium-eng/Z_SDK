# WP-U262 · El portero leía dos veces — cerrar la clase, no los dos vectores

| dato | valor |
| ---- | ----- |
| agente | worker V |
| fecha | 2026-08-02 |
| rama | `wp/u262-lectura-multiple` (worktree `C:\S_LAB\wt\z-u262`, base `main`) |
| fila | BACKLOG :264 · abierta por la **devolución de U251** (BACKLOG :263) |
| alcance tocado | `packages/engine/webrtc-signaling/**` (src · test · types · README) · este reporte · fila U262 del BACKLOG |
| estado propuesto | **cerrado** — 3 vectores de fail-open (2 de ficha + 1 nuevo), 16 lecturas múltiples barridas, 2 pruebas de evidencia **invertidas** |
| suite | `@zeus/webrtc-signaling` **75/75 → 85/85** (+10) · **8 rojos** demostrados contra la base |

---

## 0. La afirmación que este WP existe para enmendar

U251 midió **una** alternancia de `opts.role` (`'operator' → undefined`),
vio que cerraba, y escribió «fail-closed» en §9.3 de su reporte — y usó ese
dato para **no abrir ficha**. El dato era falso: ese vector cerraba **por
accidente**, porque `undefined` hace falsy el `if (opts.role && …)` y el
torno se salta la comprobación entera. Con otra alternancia el mismo código
**concede**.

La lección no es «U251 se equivocó de vector». Es: **medir un caso y
escribir «falla cerrado» es una afirmación más ancha que la evidencia**.
Este WP la enmienda dos veces: arreglando el defecto, y **no repitiendo el
error** — la ficha traía dos vectores, y el barrido con instrumentación
encontró un tercero con el mismo fail-open que nadie había listado.

Por eso lo que se entrega no es «los dos vectores arreglados» sino **la
operación cerrada**: *leer dos veces lo mismo dentro de una decisión*.

---

## 1. Qué se arregla, y por dónde NO se pasa

**El cerco.** `assertSignalingPeerCard` es también el portero del carril LAN
de blobs por DataChannel: `packages/mesh/blob-sync-harness/src/lan-gate.mjs:23`
lo envuelve en `assertLanBlobTransferAllowed`, y
`packages/mesh/blobstore-client/src/lan.mjs:12` reexporta ese envoltorio.
Ablandarlo
abriría ese carril a cualquier anónimo. **Este WP sólo endurece**: los dos
únicos movimientos de veredicto medidos van los dos en dirección **denegar**
(§6), y ningún par obtiene nada que hoy no obtenga.

**El alcance.** La explotabilidad real es baja: exige entregarle al torno un
objeto con getters, y hoy todas las rutas internas le pasan valores ya
materializados (literales, objetos de `makePeerCard`, JSON del cable). Eso
manda en el tamaño del arreglo: **no se rehace el portero**. La política no
se toca — ni un veredicto se mueve con valores fijos (§5) — sólo el **número
de lecturas**.

**No tocado:** `packages/engine/protocol/**` (otro reparto: `isPeerCardShaped`,
`roleFromPeerCard`, `peerCardGrantsRole` y `verifyTravelingPeerCard` releen
los mismos campos y **siguen releyéndolos**; lo que cambia es que ahora leen
una **foto**, no el objeto vivo) · `packages/mesh/**` · `packages/engine/volumes-ops/**`
· `package.json` · lockfile · `scripts/gates/**`.

---

## 2. El barrido de la clase — cómo se midió

No a ojo. Se instrumentó el torno con **proxies contadores** sobre `opts` y
sobre la card, y se corrieron todas las ramas de las cuatro funciones
exportadas del portero, contando cada lectura de cada clave.

Contra la base (`HEAD`, antes de tocar nada), en un solo barrido:

```
=== TOTAL: 9 claves-opt y 37 claves-card leídas >1 vez ===
```

**Inventario completo. 16 lecturas múltiples, todas en `src/peer-card-gate.mjs`
salvo donde se indica:**

| # | dónde | qué se leía varias veces | veces | qué se hizo |
| - | ----- | ------------------------ | ----- | ----------- |
| 1 | `assertSignalingPeerCard` rama de rol | `opts.role` | **2** (3 al denegar) | foto `readGateOpts` — **fail-OPEN medido, vector de ficha** |
| 2 | `assertSignalingPeerCard` amarre de feed | `opts.expectedSsbId` | **3** | foto `readGateOpts` — **fail-OPEN medido, vector de ficha** |
| 3 | vía `@zeus/protocol` | `card.scopes` | **11** | foto `materializePeerCard` — **fail-OPEN medido, VECTOR NUEVO** |
| 4 | dentro de `scopes` | índice `scopes[0]` | **2** | la foto copia los arrays — **fail-OPEN medido, VECTOR NUEVO** |
| 5 | vía `isPeerCardShaped` ×4-5 | `card.roomId` | 9 | foto — sólo forma; no se midió fail-open |
| 6 | ídem | `card.endpoint` | 9 | foto — ídem |
| 7 | ídem | `card.token` | 9 | foto — ídem |
| 8 | vía `isPeerCardFresh`/`peerCardPhase` | `card.expiresAt` | 7 | foto — TTL; no se midió fail-open |
| 9 | ídem | `card.issuedAt` | 5 | foto — ídem |
| 10 | torno + verify | `card.ssbId` | 4 | foto |
| 11 | torno (`typeof … && ….length`) + verify | `card.seatSignature` | 5 | foto + lectura local única |
| 12 | `peerCardFromMessage` | `msg.peerCard` | 2 | lectura local — **medido: devolvía una card distinta de la comprobada** |
| 13 | `peerCardFromMessage` | `msg.data.peerCard` | 2 | lectura local |
| 14 | `ssbIdFromMessage` | `msg.ssbId` | 2 | lectura local — **medido: devolvía un feed distinto del validado** |
| 15 | `ssbIdFromMessage` | `msg.data.ssbId` | 2 | lectura local |
| 16 | `ssbIdFromMessage` | `card.ssbId` | 2 | lectura local |

**Y una decimoséptima que no está dentro de ninguna función sino ENTRE dos
llamadas:** quien recibe un mensaje llamaba a `peerCardFromMessage(payload)`
y a `ssbIdFromMessage(payload)` por separado ⇒ `payload.peerCard` se leía
**4 veces** en la misma decisión, y el mensaje resultante podía quedarse con
**la card de una lectura y el `ssbId` de otra**. Cerrada con un 2.º
parámetro opcional (`ssbIdFromMessage(msg, card)`) y usada en los tres sitios
que reciben: `signaling-service.mjs handleMessage`,
`socket-room-signaling.mjs _onWirePayload`, `ssb-private-signaling.mjs _onPrivateMsg`.

**Barrido de la capa de servicio** (misma operación, otra forma: *validar
una lectura y usar otra*, `isSsbId(x.y) ? x.y : …`). 7 sitios más — las
líneas citadas son las de la **base**, `HEAD` antes de este WP:

| dónde | qué | arreglo |
| ----- | --- | ------- |
| `signaling-service.mjs:413,420` | `card.ssbId` ×3 para amarrar, comparar y estampar | se usa `check.ssbId` — el feed que **el torno acaba de juzgar** |
| `signaling-service.mjs:476` `_gatedOutbound` | `card.ssbId` ×2 | ídem `check.ssbId` |
| `signaling-service.mjs:498-500` `abstractMessageToWire` | `message.peerCard` ×3, `message.ssbId` ×2, `peerCard.ssbId` ×2 | locales |
| `signaling-service.mjs:372` `handleMessage` | `message.peerCard` ×5 (extractores + un `?? message?.peerCard` que era **dead code** para datos planos y una 3.ª lectura para un getter) | una extracción, un `from` local |
| `socket-room-signaling.mjs:192` `joinRoom` | `peerCard.ssbId` ×2 antes de sacarlo al cable | se anuncia `admitted.ssbId` |
| `socket-room-signaling.mjs:276-295` | `payload.peerCard` ×4, `payload.data` ×3 | locales + 2.º parámetro |
| `ssb-private-signaling.mjs:205,258-261,290-311` | `gated.peerCard` ×3, `gated.ssbId` ×2, `gated.from` ×3, `content.signal` ×2, `content.data` ×3 | locales |

**Total barrido: 16 + 1 + 7 = 24 sitios.** Cero quedaron sin tocar dentro
del portero y sus rutas de decisión.

**Lo que NO se cerró y por qué:** las relecturas **dentro de
`@zeus/protocol`** siguen ahí (`isPeerCardShaped` lee `card.roomId` dos veces,
etc.). No hacía falta tocarlas y no eran mi reparto: como el torno les pasa
una **foto** en vez del objeto vivo, releer la foto es inofensivo. Si algún
día otro consumidor llama a esas funciones con un objeto vivo, el defecto es
suyo, no del torno — queda anotado en §8.

---

## 3. El arreglo

Dos fotos, tomadas al entrar, en `src/peer-card-gate.mjs`:

- **`readGateOpts(opts)`** — lee **una vez** cada una de las 8 claves de
  decisión (`role`, `now`, `requireSsbId`, `requireSeatSignature`,
  `expectedSsbId`, `admission`, `claimedSsbId`, `claimedFrom`) y devuelve un
  objeto plano. La lista es **cerrada a propósito**: si mañana el torno mira
  una clave nueva sin añadirla aquí, el sensor de clase la detecta leída dos
  veces y se pone rojo.
- **`materializePeerCard(card)`** — copia cada campo propio enumerable
  leyéndolo **una vez**, y copia los arrays un nivel (`scopes` es quien
  decide el rol). Todo lo que viene después —incluidas las cinco funciones
  de `@zeus/protocol`— juzga esa foto.

`Object.keys` no es una elección arbitraria: **es exactamente la vista sobre
la que se firma y se verifica el asiento** (`travelingPeerCardPayload`
recorre `Object.keys(card).sort()`). La foto que juzga el torno es la misma
foto que la firma protege — y `verifyTravelingPeerCard` se llama **sobre la
foto**, o sea que se verifica lo que se acaba de juzgar.

`assertSignalingAdmission` comparte la foto con el torno U186 en vez de
volver a leer `opts`: antes era inmune **por accidente** (cada opt caía en
una sola rama); ahora lo es **por construcción**.

---

## 4. Los rojos — uno por vector, y del portero

### 4.1 Los dos vectores de ficha (las pruebas de evidencia)

Las dos pruebas que U251 dejó **afirmando el defecto** se pusieron rojas con
el arreglo, y por lo que se arregló — no de rebote. Rojo exacto, contra el
arreglo y antes de invertirlas:

```
not ok 7 - evidencia U262: `role` alternante ⇒ el portero acredita un rol que NO se exigió (fail-OPEN)
    el portero lee `opts.role` dos veces por esta rama
    1 !== 2
not ok 8 - evidencia U262: `expectedSsbId` alternante ⇒ una card ajena pasa un amarre exigido a otro feed (fail-OPEN)
    el portero lee `opts.expectedSsbId` tres veces
    1 !== 3
```

Suite entera en ese momento: **73 pass / 2 fail**. Los dos fallos son esos
dos y nada más.

Están **invertidas, no borradas**, en
`packages/engine/webrtc-signaling/test/u251-devolucion.test.mjs:243-320`
(encabezado `:243`, las dos pruebas en `:268` y `:303`),
bajo el mismo §«evidencia U262» reescrito para decir qué
afirmaban antes y qué afirman ahora. Cada una conserva su vector con la
forma exacta del ataque y añade una sonda `deepEqual` contra el veredicto
del valor **fijo**: alternante y fijo dan el mismo resultado. La 3.ª rama de
la primera conserva el vector que U251 midió (`'operator' → undefined`), que
ahora cierra **por el mismo motivo** que el otro y no por accidente.

### 4.2 El vector nuevo y el resto de la clase

Suite nueva `test/u262-lectura-multiple.test.mjs` (10 pruebas). Corrida
contra la implementación base: **6 rojos**.

```
not ok 1 - sensor de clase: ninguna decisión del torno lee dos veces la misma clave
    assertSignalingPeerCard · concede con todo exigido · opts: role×2, expectedSsbId×3
    assertSignalingPeerCard · concede con todo exigido · card: roomId×9, endpoint×9,
      token×9, scopes×11, expiresAt×7, issuedAt×5, ssbId×4, seatSignature×5
    assertSignalingAdmission · concede con todo exigido · opts: role×2, expectedSsbId×3
    assertSignalingAdmission · concede con todo exigido · card: (ídem)
    assertSignalingPeerCard · deniega por rol · opts: role×3
not ok 2 - sensor de clase: los extractores devuelven lo que comprobaron
    peerCardFromMessage · top-level · msg: peerCard×2
    peerCardFromMessage · en data · data: peerCard×2
    ssbIdFromMessage · top-level · msg: ssbId×2
    ssbIdFromMessage · en data · data: ssbId×2
    ssbIdFromMessage · en card · card: ssbId×2
not ok 3 - vector 3 (card): `scopes` alternante ya no cuela un rol que la card no acredita
not ok 4 - vector 3 bis: un índice alternante DENTRO de `scopes` tampoco mueve el veredicto
not ok 5 - vector extractores: se devuelve la card comprobada, no la siguiente lectura
not ok 9 - el endurecimiento es unidireccional: lo único que deja de pasar, DENIEGA
# tests 10 · pass 4 · fail 6
```

Veredictos medidos de los vectores nuevos, base contra arreglo:

```
[BASE]
  vector 3  (scopes alternante, se exige operator): lecturas=8 → {"ok":true,"role":"player"}
  vector 3b (índice alternante en scopes):          lecturas=2 → {"ok":true,"role":"player"}
  vector extractores: peerCard: lecturas=2 devuelve=OTRA · ssbId: lecturas=2 devuelve=@f2GJ8xVQ0…
[FIX]
  vector 3  : lecturas=1 → {"ok":false,"error":"peer-card does not grant role:operator"}
  vector 3b : lecturas=1 → {"ok":false,"error":"peer-card does not grant role:operator"}
  vector extractores: peerCard: lecturas=1 devuelve=LA COMPROBADA · ssbId: lecturas=1 devuelve=@Vt0zURlyO…
```

O sea: **una card que sólo acredita `player` pasaba una exigencia de
`operator`** — el mismo fail-open de la ficha, por el lado de la card, que
nadie había listado. Es exactamente el «tercer valor leído dos veces» que
temía el encargo, y estaba ahí antes de que yo llegara.

**El sensor de clase no mide vectores, mide la operación.** Si alguien
vuelve a leer dos veces lo mismo dentro de una decisión del torno —una clave
nueva, una rama nueva—, la prueba 1 o la 2 se pone roja aunque nadie escriba
el vector. Es lo que faltaba en U251.

**Total rojos demostrados contra la base: 8** (2 de evidencia + 6 nuevos).

---

## 5. Cero movimiento de veredicto — el diferencial

Se sacó la implementación **base** del torno (`git show HEAD:…peer-card-gate.mjs`)
y se corrió contra la arreglada, con **valores fijos**, sobre una matriz:

- **16 formas de card**: `null`, `undefined`, string, number, `false`, `{}`,
  `[]`, plana, con `ssbId`, firmada, firmada-manipulada, multi-rol, sin rol,
  caducada, aún-no-válida, con firma mal formada.
- **19 juegos de `opts`**: vacío, cada exigencia por separado, todas juntas,
  `requireSsbId: 1` (truthy no booleano), `expectedSsbId` propio / ajeno /
  basura, los cinco modos de admisión con y sin claim.
- **2 APIs** (`assertSignalingPeerCard`, `assertSignalingAdmission`) +
  `isPeerCardPresented` + los dos extractores sobre 16 formas de mensaje.

```
=== DIFERENCIAL: 656 veredictos comparados · 0 diferencias ===
```

---

## 6. Los dos únicos movimientos, y van los dos a DENEGAR

Medidos aparte, porque «cero diferencias» sería una afirmación más ancha que
la evidencia si me callara esto:

| forma de card | base | arreglo |
| ------------- | ---- | ------- |
| campos **heredados del prototipo** (`Object.create(card)`) | `{ok:true, role:'player'}` | `{ok:false, error:'peer-card missing or malformed'}` |
| campos propios **NO enumerables** | `{ok:true, role:'player'}` | `{ok:false, error:'peer-card missing or malformed'}` |

Los dos **endurecen**, ninguno abre. Y no son un cierre gratuito: la vista
que la firma de asiento protege ya era `Object.keys(card)`, así que una card
con cualquiera de esas dos formas **jamás pudo llevar asiento verificable**.
El torno pasa a opinar lo mismo que la capa de firma. Ninguna ruta del repo
construye cards así (`makePeerCard` devuelve objeto plano; el cable trae JSON
decodificado), y los cuatro consumidores lo confirman verdes (§7).

Comprobado además que **no** se mueven: card congelada (`Object.freeze`),
card con getter **estable**, card firmada con un campo oculto no enumerable
añadido — las tres siguen concediendo igual.

**Y lo que no se puede cerrar de más aunque tiente:** una card con scopes
`[role:operator, role:player]` a la que se le exige `player` concede
devolviendo `role: 'operator'`. Es correcto desde U93 y **sigue siéndolo**:
`granted` y `role exigido` no tienen por qué coincidir. Un arreglo que
exigiera que coincidieran habría parecido endurecimiento y habría sido un
cierre de más. Está fijado con prueba propia.

---

## 7. La frontera no se movió

- **Vector de frontera ya escrito en la suite**, usado tal cual:
  `u251-menores.test.mjs` → `frontera: tras los seis arreglos, el anónimo
  sigue sin obtener permiso alguno` · **verde**. Dos servicios anónimos
  completan el saludo entero (connect + joinRoom + sendOffer) y siguen con
  `getSessionRole() === null`, `getPeerCard() === null`, `getSsbId() === null`
  y **cero credenciales en el cable**.
- **Frontera en el propio torno** (prueba nueva): admisión anónima sigue
  devolviendo `{ok:true, anonymous:true, role:null}`; cualquier exigencia
  (`role` / `requireSsbId` / `requireSeatSignature`) sigue volviendo a pedir
  card aunque el modo sea anónimo; un claim de identidad sin sello sigue
  denegado; y `assertSignalingPeerCard(null)` sigue devolviendo el mismo
  `'peer-card missing or malformed'` — la semántica que consume el carril LAN
  de blobs, intacta.
- **Consumidores del portero, sin tocar, verdes**:
  `blob-sync-harness` **11/11** · `blobstore-client` **19/19** ·
  `oasis-webrtc` **3/3** · `webrtc-viewer` (gemelo de navegador) **17/17**.
- **e2e**: `e2e:webrtc-signaling-anonimo` **OK** (handshake anónimo completo,
  cero cards, cero permisos) · `e2e:ssb-webrtc-signaling` **OK**
  (DataChannel por DMs SSB).
- **`npm run gates`**: `gates: OK (0 offenders)` · **`eslint`** limpio.

---

## 8. Qué queda abierto

1. **`@zeus/protocol` sigue releyendo.** `isPeerCardShaped` lee `card.roomId`
   ×2, `peerCardGrantsRole` recorre `scopes` dos veces, etc. Inofensivo
   **mientras se les pase una foto**, que es lo que hace este torno desde
   ahora. Cualquier otro consumidor que las llame con un objeto vivo tiene el
   mismo defecto. Otro reparto (`packages/engine/protocol/**`); arreglo
   portable: la misma `materializePeerCard`.
2. **La card que se JUZGA y la card que se GUARDA/ENVÍA siguen siendo objetos
   distintos.** El torno juzga su foto y devuelve `{ok, role, ssbId}`; el
   llamante guarda (`this._peerCard = peerCard`) y publica el objeto
   **original**. Dentro de una decisión ya no hay hueco —lo que se comprueba
   es lo que se acredita, y `handleMessage` / `_gatedOutbound` / `joinRoom`
   ya sacan al cable el `ssbId` **juzgado**— pero entre dos decisiones el
   objeto puede haber cambiado. Cerrarlo del todo exigiría que el torno
   devolviera su foto y que los llamantes adoptaran esa foto en vez del
   original: cambia lo que se guarda y lo que viaja, y eso es rehacer el
   portero. **Fuera de alcance a propósito**, anotado aquí para que no
   vuelva a enterrarse.
3. **El gemelo de navegador** (`packages/mesh/webrtc-viewer/…/browser-signaling.mjs`)
   no pasa por `peer-card-gate.mjs` en todas sus ramas. 17/17 verde, no
   medido para esta clase. `packages/mesh/**`, otro reparto.
4. **Dos e2e no se pudieron correr** en este worktree: `e2e:webrtc-signaling`
   y `e2e:peer-card-chain` mueren en `e2e/helpers.mjs:9` con
   `ZEUS_VOLUMES_ROOT is not set` / `volumes.json not found` — falta de
   aprovisionamiento del entorno, **antes de cargar una sola línea de
   señalización**. No los cuento ni como verdes ni como rojos.

---

## 9. Inventario

| cosa | número |
| ---- | ------ |
| lecturas múltiples encontradas en el barrido | **24** (16 en el torno + 1 entre llamadas + 7 en la capa de servicio) |
| de ésas, con fail-open **medido** | **6** (`opts.role`, `opts.expectedSsbId`, `card.scopes`, `scopes[0]`, `peerCardFromMessage`, `ssbIdFromMessage`) |
| vectores de la ficha | 2 (los dos, cerrados) |
| vectores **nuevos** que la ficha no listaba | **4** |
| rojos demostrados contra la base | **8** |
| veredictos comparados con valores fijos | **656** · 0 diferencias |
| movimientos de veredicto medidos | **2**, ambos hacia DENEGAR |
| pruebas de evidencia invertidas (no borradas) | **2** |
| suite `@zeus/webrtc-signaling` | 75/75 → **85/85** |
| consumidores del portero | 11/11 · 19/19 · 3/3 · 17/17 |
| ficheros de código tocados | 4 src · 2 types · 1 test nuevo · 1 test invertido · README |

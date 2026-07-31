# WP-U194 · Allowlist como contrato (P1 · ola 3 · BACKLOG :246)

| dato | valor |
| ---- | ----- |
| agente | worker (mundo Z, swarm F2, ola 3) |
| fecha | 2026-08-01 |
| rama | `wp/u194-allowlist-contrato` (worktree `C:\S_LAB\wt\z-u194`) |
| base | `dc70cec` *plan(Z): deshielo — U204 en vuelo + U244 puntero al intake externo WPS_QUEUE* |
| dependencia | **U192 ✅** (traza del relay) — punto de partida; este WP versiona lo que U192 hizo trazable |
| estado propuesto | listo para revisión (**contrarrevisión obligatoria**, clase «Relay / allowlist / federación», GOBIERNO §5 :674) |

---

## 1 · Qué se hizo

Antes de U194 la política de propagación del relay eran **dos literales
sueltos** en `packages/mesh/socket-server/src/config.mjs:6-17`: sin
versión, sin sello, sin nada que distinguiera «cambiar la allowlist» de
«editar una constante». Cualquiera podía añadir un evento en una línea y
ningún test se enteraba.

Ahora hay **una sola tabla**, versionada y sellada, y cambiarla es un acto
que el árbol entero acusa.

### Artefacto de contrato

**`packages/mesh/socket-server/src/relay-contract.mjs`** (nuevo, 232 líneas).

Contiene, y es lo único que contiene, los nombres de evento del relay:

| símbolo | qué es |
| --- | --- |
| `RELAY_CONTRACT_VERSION` | `'1.0.0'` — semver explícito, entra en el sello |
| `RELAY_CONTRACT_SEAL` | `57adb96df059db58ee86e20b725012f37adb9f5d20f99f901863cff3b637335e` — sha256 de la forma canónica |
| `UPSTREAM` / `DOWNSTREAM_TOP` | las dos tablas (módulo-privadas; se publican congeladas) |
| `RELAY_CONTRACT` | `{ version, seal, upstream (array congelado), downstream (Set sellado) }` |
| `relayContractCanonicalForm` · `computeRelaySeal` · `assertRelayContract` | forma sellable, sello y **gate fail-closed** |
| `relayContractDescriptor()` | instantánea serializable (copia) para citar/loguear/comparar |

Forma canónica sellada (literal, reproducible):

```text
CONTRATO-RELAY v1.0.0
upstream(3): CLIENT_REGISTER,CLIENT_SUSCRIBE,ROOM_MESSAGE
downstream(8): SET_STATE,catalog:servers,deck:error,deck:resolved,intent,ledger,state,track
```

El orden de subida es significativo (es el orden de registro de handlers en
`relay.mjs:111`); el de bajada se normaliza al sellar porque el conjunto es
un `Set` y su orden no es política.

### Cómo lo consume el runtime

```
relay-contract.mjs  ──(única declaración)──▶  config.mjs  ──(import)──▶  relay.mjs
                                             RELAY_UPSTREAM = RELAY_CONTRACT.upstream
                                             RELAY_DOWNSTREAM_TOP = RELAY_CONTRACT.downstream
```

`config.mjs` re-exporta **por identidad** (`===`, no copia): los nombres y
las formas (`Array` con `.includes()`, `Set` con `.has()`) son los mismos
que antes, así que **`relay.mjs` no se tocó** — 0 ediciones, verificado con
`git diff --exit-code` (§5 más abajo). Eso importa por §2: `relay.mjs` es
fichero caliente de U192·U193 (olas 1 y 4), no mío.

### Las cuatro reglas que hacen que sea contrato y no lista

1. **Un solo sitio.** Añadir/quitar se hace en `relay-contract.mjs`. Grep en
   §4.
2. **Sellado con gate en la carga del módulo.** `assertRelayContract()` se
   ejecuta al importar. Tabla tocada sin re-sellar → **el módulo no
   importa**: el servidor no arranca y las 4 suites del paquete caen. La
   allowlist no se puede cambiar en silencio ni «solo en producción».
3. **Versión explícita, y sin versión el gate falla.** Es la prueba mínima
   que GOBIERNO §5 :674 exige a esta clase (*«allowlist sin versión
   declarada → gate falla»*). Ejecutada: rojo F.
4. **Inmutable en caliente.** `RELAY_DOWNSTREAM_TOP.add/delete/clear`
   lanzan; `RELAY_UPSTREAM` está congelado. Nadie amplía la allowlist desde
   otro módulo sin pasar por el contrato. Ejecutado: rojo G.
   > ✎ **FALSO cuando se escribió — devolución D2.** El sombreado de métodos
   > sobre un `Set` no impedía `Set.prototype.add.call(allowlist, …)`.
   > Corregido (la allowlist ya no es un `Set`) y probado en **§11**.

### Decisión de diseño que el brief dejaba abierta

GOBIERNO §1 :177-180 dejaba `<pendiente>`: *contrato local vs proyección al
spec compartido de `@zeus/protocol`*. **Se elige contrato local**, y la
razón es la CA1 del propio WP: proyectar los nombres a
`packages/engine/protocol/spec/` crearía exactamente **la segunda lista
viva que este WP existe para eliminar**. El spec compartido describe la
*forma wire* de `state|intent|track|ledger` (`spec/CONTRATO.md`, tabla única
`EVENT_META`); qué *nombres* reemite este relay es política de este
transporte. Declarado en la cabecera del artefacto (`relay-contract.mjs:34-39`).

---

## 2 · Inventario de los 8 + `RELAY_UPSTREAM`, con origen citado

Origen = fichero:línea **en la base `dc70cec`**, de donde salía cada nombre
antes de U194.

### Bajada — `RELAY_DOWNSTREAM_TOP` (los 8)

| # | evento | origen previo (base `dc70cec`) | destino |
| - | ------ | ------------------------------ | ------- |
| 1 | `SET_STATE` | `packages/mesh/socket-server/src/config.mjs:9` | `src/relay-contract.mjs:59` |
| 2 | `deck:resolved` | `packages/mesh/socket-server/src/config.mjs:10` | `src/relay-contract.mjs:60` |
| 3 | `deck:error` | `packages/mesh/socket-server/src/config.mjs:11` | `src/relay-contract.mjs:61` |
| 4 | `catalog:servers` | `packages/mesh/socket-server/src/config.mjs:12` | `src/relay-contract.mjs:62` |
| 5 | `state` | `packages/mesh/socket-server/src/config.mjs:13` | `src/relay-contract.mjs:63` |
| 6 | `intent` | `packages/mesh/socket-server/src/config.mjs:14` | `src/relay-contract.mjs:64` |
| 7 | `ledger` | `packages/mesh/socket-server/src/config.mjs:15` | `src/relay-contract.mjs:65` |
| 8 | `track` | `packages/mesh/socket-server/src/config.mjs:16` | `src/relay-contract.mjs:66` |

Declaración contenedora previa: `config.mjs:8` (`export const
RELAY_DOWNSTREAM_TOP = new Set([`) … `config.mjs:17` (`]);`).
Punto de consumo (intacto): `src/relay.mjs:132` `if
(RELAY_DOWNSTREAM_TOP.has(event))`.

### Subida — `RELAY_UPSTREAM` (los 3)

| # | evento | origen previo (base `dc70cec`) | destino |
| - | ------ | ------------------------------ | ------- |
| 1 | `CLIENT_REGISTER` | `packages/mesh/socket-server/src/config.mjs:6` | `src/relay-contract.mjs:50` |
| 2 | `CLIENT_SUSCRIBE` | `packages/mesh/socket-server/src/config.mjs:6` | `src/relay-contract.mjs:50` |
| 3 | `ROOM_MESSAGE` | `packages/mesh/socket-server/src/config.mjs:6` | `src/relay-contract.mjs:50` |

Puntos de consumo (intactos): `src/relay.mjs:111` (reenvío al puente),
`:117` (traza de corte de subida), `:124` (eco de nombre de subida).

**Total: 11 nombres, 1 sitio.** El contrato no incluye `MAKE_MASTER`: no es
allowlist sino supresión explícita, vive en `relay.mjs:90` y es política de
U192 (aquí no se tocó).

---

## 3 · Casos rojos ejecutados (con su salida)

Los siete se aplicaron **de facto** sobre el árbol, se corrió la suite, se
capturó el rojo y se revirtió. Comando en todos: `npm test -w
@zeus/socket-server`. Verde de partida y de llegada: **17/17**.

### Rojo A · AÑADIR un evento a la allowlist sin tocar el contrato

Mutación: `'evento:colado'` añadido a `DOWNSTREAM_TOP`, sello sin recalcular.

```
# Error: CONTRATO-RELAY v1.0.0: el sello NO corresponde a la allowlist declarada.
#   sello declarado : 57adb96df059db58ee86e20b725012f37adb9f5d20f99f901863cff3b637335e
#   sello del contenido: 1cf30c2ae2b8a34df1a01bff33936922858300755b6e23309d2a143947353d77
#   bajada (9): SET_STATE, catalog:servers, deck:error, deck:resolved, evento:colado, intent, ledger, state, track
not ok 1 - test\peercard-vivo.test.mjs
not ok 2 - test\relay-contract.test.mjs
not ok 3 - test\relay-trace.test.mjs
not ok 4 - test\server.test.mjs
# tests 4 · pass 0 · fail 4
```

**Las 4 suites del paquete caen**: el gate está en la carga del módulo, así
que el paquete entero deja de importar. El error dice el sello correcto y
qué hay que hacer.

### Rojo B · QUITAR un evento de la allowlist

Mutación: `'ledger'` borrado de `DOWNSTREAM_TOP`.

```
#   sello del contenido: 3430fc3365c47077fc626aebbf54f080defd0a1da5477b7446f95d2e661e775e
#   bajada (7): SET_STATE, catalog:servers, deck:error, deck:resolved, intent, state, track
not ok 1 - test\peercard-vivo.test.mjs
not ok 2 - test\relay-contract.test.mjs
not ok 3 - test\relay-trace.test.mjs
not ok 4 - test\server.test.mjs
# tests 4 · pass 0 · fail 4
```

**Las dos direcciones de CA2 quedan probadas de facto**, no afirmadas.

### Rojo C · AÑADIR **re-sellando**, sin subir la versión

El hostil listo: añade el evento *y* recalcula el sello, para que el gate de
carga pase. Mutación: `'evento:colado'` + sello `1cf30c2a…`, versión
todavía `1.0.0`.

```
not ok 4 - ancla del contrato: versión, sello y cuentas son literales fijados
    el sello del contrato cambió: la allowlist NO es la misma. Sube la versión y actualiza este ancla a conciencia
not ok 5 - el sello es del contenido: añadir o quitar un evento lo cambia y el gate lo caza
not ok 9 - la allowlist no se amplía en caliente: add/delete/clear denegados
not ok 11 - política intacta: los conjuntos de propagación son los previos a U192
# tests 17 · pass 13 · fail 4
```

Cuatro tests rojos, tres míos y uno de U192. Para colar un evento hay que
tocar **el contrato, el sello, la versión, el ancla del test nuevo y el
sello literal de U192**: cinco ediciones deliberadas, ninguna silenciosa.

### Rojo D · BORRAR entera la comprobación de allowlist

Mutación en `relay.mjs:132`: `if (RELAY_DOWNSTREAM_TOP.has(event))` →
`if (true)`.

```
not ok 10 - cierre del relay contra puente real: pasa exactamente el contrato y nada más
    eventos AUSENTES del contrato cruzaron hacia abajo: la guarda de allowlist no está cerrando
not ok 15 - e2e puente real: lo no propagado deja rastro con motivo y la política no cambia
# tests 17 · pass 15 · fail 2
```

CA3 cumplida: **borrar la guarda hace caer un test**. (Cae también el de
U192, que ya vigilaba esa línea.)

### Rojo E · PUERTA TRASERA hardcodeada, con la guarda intacta

El ataque que un contrato «feliz» no ve: no se toca la allowlist ni la
guarda, se añade una rama antes.

```js
if (event === 'evento:puerta-trasera') {
  localNs.emit(event, args[0]);
  return;
}
if (RELAY_DOWNSTREAM_TOP.has(event)) {   // ← intacta
```

```
not ok 10 - cierre del relay contra puente real: pasa exactamente el contrato y nada más
    eventos AUSENTES del contrato cruzaron hacia abajo: la guarda de allowlist no está cerrando
    +   'evento:puerta-trasera'
    0: 'evento:puerta-trasera'
# tests 17 · pass 16 · fail 1
```

**Solo el test de U194 lo caza** (16 pass / 1 fail: el e2e de U192 pasa).
Lo caza porque el corpus de sondas del cierre e2e **se extrae de los
literales de cadena del propio `relay.mjs`**: cualquier nombre de evento
hardcodeado en el relay se convierte automáticamente en su propia sonda y
se prueba contra la allowlist. Un nombre colado se delata a sí mismo.

> ✎ **SOBREVENDIDO — devolución D1.** El corpus reconocía **una notación**
> (comilla simple y doble), no un valor: la misma puerta trasera escrita
> con `` `backtick` `` o con `'evento' + ':colado'` pasaba **17/17 verde**.
> «Se delata a sí mismo» era falso. Corregido con un **censo de despacho**
> que ancla la forma y no el nombre; los tres vectores, probados en **§11**.

### Rojo F · Allowlist SIN versión declarada (§5, hostil-omite)

Mutación: `RELAY_CONTRACT_VERSION = ''`.

```
# Error: CONTRATO-RELAY: versión no declarada o malformada (""). La allowlist sin versión explícita no es contrato.
not ok 1 - test\peercard-vivo.test.mjs
not ok 2 - test\relay-contract.test.mjs
not ok 3 - test\relay-trace.test.mjs
not ok 4 - test\server.test.mjs
# tests 4 · pass 0 · fail 4
```

Es literalmente la prueba mínima que GOBIERNO §5 :674 exige a esta clase.

### Rojo G · Ampliar la allowlist EN CALIENTE desde otro módulo

Sin tocar ningún fichero: importar `config.mjs` y mutar el `Set`.

```
DENEGADO .add() -> CONTRATO-RELAY: la allowlist es inmutable en runtime ('add' denegado). Cambiarla es un cambio de contrato en src/relay-contract.mjs.
DENEGADO .push() -> TypeError: Cannot add property 3, object is not extensible
has(evento:colado) = false | size = 8 | upstream = 3
```

Denegado **y sin efecto**: el `has()` sigue en `false` y los tamaños no se
mueven. Cubierto además por el test 9.

### Restauración verificada

```
relay.mjs INTACTO (0 ediciones)     ← git diff --exit-code
# tests 17 · pass 17 · fail 0
```

---

## 4 · Greps (patrón + salida)

### Grep 1 — ¿dónde se declaran los 11 nombres?

```
grep -rn "'SET_STATE'\|'deck:resolved'\|'deck:error'\|'catalog:servers'\|'state'\|'intent'\|'ledger'\|'track'\|'CLIENT_REGISTER'\|'CLIENT_SUSCRIBE'\|'ROOM_MESSAGE'" packages/mesh/socket-server/src/
```

```
src/relay-contract.mjs:50:const UPSTREAM = ['CLIENT_REGISTER', 'CLIENT_SUSCRIBE', 'ROOM_MESSAGE'];
src/relay-contract.mjs:59:  'SET_STATE',
src/relay-contract.mjs:60:  'deck:resolved',
src/relay-contract.mjs:61:  'deck:error',
src/relay-contract.mjs:62:  'catalog:servers',
src/relay-contract.mjs:63:  'state',
src/relay-contract.mjs:64:  'intent',
src/relay-contract.mjs:65:  'ledger',
src/relay-contract.mjs:66:  'track'
src/relay.mjs:75:  localNs.emit('ROOM_MESSAGE', payload);
src/relay.mjs:85:  if (inner === 'SET_STATE' && data) {
src/relay.mjs:86:    localNs.emit('SET_STATE', data);
src/relay.mjs:122:  bridgeClient.io.on('ROOM_MESSAGE', (data) => emitDownstream(localNs, data));
src/relay.mjs:127:      if (event !== 'ROOM_MESSAGE') {
```

**Una sola declaración**: `relay-contract.mjs`. Los 5 hits de `relay.mjs`
**no son una lista**: son las dos ramas nombradas del desempaquetado
(`ROOM_MESSAGE` es el sobre; `SET_STATE` tiene camino propio), heredadas de
la base y probadas por U192. Están declaradas como excepción explícita en el
test 7 (`relay-contract.test.mjs:193`), que falla si aparece cualquier otro
nombre del contrato en cualquier `src/*.mjs`.

`config.mjs` ya no aparece: **0 hits**. Ese es el resultado de U194.

### Grep 2 — ¿quién declara y quién consume las tablas?

```
grep -rn "RELAY_UPSTREAM\|RELAY_DOWNSTREAM_TOP\|RELAY_CONTRACT" packages/ --include=*.mjs --include=*.ts | grep -v node_modules
```

Cadena de consumo en `src/` (sin comentarios):

```
src/relay-contract.mjs:210  export const RELAY_CONTRACT = Object.freeze({...})   ← origen
src/config.mjs:3            import { RELAY_CONTRACT } from './relay-contract.mjs';
src/config.mjs:16           export const RELAY_UPSTREAM = RELAY_CONTRACT.upstream;
src/config.mjs:18           export const RELAY_DOWNSTREAM_TOP = RELAY_CONTRACT.downstream;
src/relay.mjs:2             import { NAMESPACE, RELAY_DOWNSTREAM_TOP, RELAY_UPSTREAM } from './config.mjs';
src/relay.mjs:111,117,124   RELAY_UPSTREAM (consumo)
src/relay.mjs:132           RELAY_DOWNSTREAM_TOP.has(event) (consumo)
src/index.mjs:14-20         re-export público (observabilidad de la versión)
```

Fuera de `packages/mesh/socket-server/`: **0 hits**. Ningún otro paquete
declara ni consume la allowlist.

### Grep 3 — el hit honesto que sí queda (clasificado, no escondido)

`packages/mesh/socket-server/test/relay-trace.test.mjs:66-78` contiene los
11 nombres literales:

```
:66  assert.deepEqual(RELAY_UPSTREAM, ['CLIENT_REGISTER', 'CLIENT_SUSCRIBE', 'ROOM_MESSAGE']);
:70-77  ['SET_STATE','catalog:servers','deck:error','deck:resolved','intent','ledger','state','track']
```

Clasificación: **es el sello de U192, no una lista viva.** Es una aserción
(«la política es la previa a U192»), no una fuente que el runtime consuma;
nada la importa. Se dejó **intacta a propósito**: re-apuntarla al contrato
la volvería circular (contrato == contrato) y destruiría evidencia ya
aceptada de otro WP. Efecto neto: refuerza a U194 — en el rojo C cayó
también ella.

Por eso el test de U194 **no reproduce ningún nombre**: ancla tres escalares
(versión, sello, cuentas) y deriva todo lo demás del contrato o del
comportamiento. No añade una tercera lista.

---

## 5 · Suites antes → después

Medición de facto, no aritmética: la de «antes» se obtuvo con el árbol en
`dc70cec` sin los ficheros de U194.

> ✎ **Cifras de la 1.ª entrega.** Tras la corrección de la devolución la
> suite es **22/22** y los tests propios son 11, no 7. Tabla actualizada en
> **§11 · Estado tras la corrección**.

| suite | antes | después |
| ----- | ----- | ------- |
| `@zeus/socket-server` | **10/10** verde | **17/17** verde |
| `@zeus/webrtc-viewer` (consumidor de socket-server) | — | **6/6** verde |
| `npx eslint` sobre `src/` + `test/` del paquete | — | **0 errores, 0 warnings** |

Los 7 tests nuevos (todos en `test/relay-contract.test.mjs`):

```
ok 4  - ancla del contrato: versión, sello y cuentas son literales fijados
ok 5  - el sello es del contenido: añadir o quitar un evento lo cambia y el gate lo caza
ok 6  - fuente única: el runtime consume el contrato por identidad, no por copia
ok 7  - sin segunda lista: ningún otro fuente del paquete declara nombres del contrato
ok 8  - gate fail-closed: sin versión, sin sello o con tabla inválida el contrato no carga
ok 9  - la allowlist no se amplía en caliente: add/delete/clear denegados
ok 10 - cierre del relay contra puente real: pasa exactamente el contrato y nada más
```

Los 10 previos (3 de U187, 5 de U192, 2 de `server.test.mjs`) siguen verdes
sin editarlos.

Notas de robustez de los tests, por si el revisor busca el hueco:

- El test 7 **enumera el directorio** `src/` (`readdirSync`), no una lista
  fija: un fuente nuevo con una tabla paralela entra solo en el barrido, y
  el test exige ≥5 fuentes barridos para que un barrido vacío no pase por
  verde.
- El test 10 exige `intrusos.length >= 10` y que el corpus incluya
  `MAKE_MASTER`: si alguien neutraliza la extracción de literales, el test
  cae por corpus vacío en vez de pasar en falso.
- El test 10 ordena las emisiones (intrusos primero, contrato después) y
  espera a los del contrato: como socket.io conserva el orden sobre la misma
  conexión, la ausencia de los intrusos es concluyente, no un *race* ganado.
- El test 8 construye la omisión con la clave **realmente ausente**
  (`Object.fromEntries` filtrando), no con `undefined` a mano, y lo asserta
  (`'version' in sinVersion === false`).

---

## 6 · CA del WP → evidencia

| CA | veredicto | dónde |
| -- | --------- | ----- |
| **1** · 8 + `RELAY_UPSTREAM` en un solo sitio; el runtime los consume de ahí; sin segunda lista viva | ✓ | §2 inventario · §4 greps 1-3 · test 6 (identidad `===`) · test 7 (barrido de `src/`) |
| **2** · Añadir → rojo; quitar → rojo (las dos de facto) | ✓ | Rojo A (añadir) · Rojo B (quitar) · y Rojo C (añadir re-sellando) |
| **3** · La AUSENCIA no pasa; borrar la comprobación hace caer un test | ✓ | Rojo D (guarda borrada) · Rojo E (puerta trasera con guarda intacta) · test 10 (cierre e2e en las dos direcciones) |
| | ✎ **D3: sin acotar era falso.** «La AUSENCIA no pasa» vale para la **vía top-level**, no para el desempaquetado del sobre. Veredicto acotado y hueco declarado en **§11**. |
| **4** · Versión explícita y su cambio observable | ✓ | `RELAY_CONTRACT_VERSION` + entra en el sello + ancla literal (Rojo C la caza) + re-export público en `index.mjs:14-20` y `types/index.d.ts` |
| **5** · Cero contrabando; nada de permisos/identidad | ✓ | §7 (5 ficheros, todos del paquete; `relay.mjs` 0 ediciones) |

Cara **hostil-omite** de la clase (§5 :674): *«allowlist sin versión
declarada → gate falla»* → **Rojo F**, ejecutado. *«evento fuera de
allowlist deja rastro con motivo»* → test 10 lo exige para **todo el
corpus** de sondas, no para un intruso de muestra.

---

## 7 · Alcance: lo que se tocó y lo que NO

### Tocado (5 ficheros, todos en `packages/mesh/socket-server/`)

| fichero | cambio |
| ------- | ------ |
| `src/relay-contract.mjs` | **nuevo** — el artefacto de contrato |
| `src/config.mjs` | los dos literales → re-export por identidad del contrato (`:3`, `:16`, `:18`) |
| `src/index.mjs` | +8 líneas: re-export del contrato (observabilidad de CA4) |
| `types/index.d.ts` | +20 líneas: tipos del contrato (**sin enumerar nombres**: `readonly string[]` / `ReadonlySet<string>`) |
| `test/relay-contract.test.mjs` | **nuevo** — 7 tests |

`config.mjs` es fichero caliente §2 y en la ola 3 **es mío** (U192 ola 1 ✅;
U187 ola 2 lo tenía prohibido). Respetado.

### NO tocado — deliberadamente

- **`src/relay.mjs`: 0 ediciones** (`git diff --exit-code` verde tras
  revertir las mutaciones). Es caliente de U192·U193 (olas 1 y 4). Todo el
  contrato se montó de modo que el punto de consumo no cambiara.
- **`test/relay-trace.test.mjs`: 0 ediciones.** Sello de U192; §4 grep 3
  explica por qué no se re-apunta al contrato.
- **Nada de permisos, identidad, peercard ni `room-join`.** Esto es política
  de *propagación* (qué nombre cruza), no de *permiso*. La frontera
  «transporte ≠ permiso» de U186 queda intacta y sin tocar.
- **Ninguna proyección a `packages/engine/protocol/spec/`** — decisión
  razonada en §1, no omisión.
- **`MAKE_MASTER` no se metió en el contrato**: es supresión, no allowlist,
  y es política de U192.
- **Territorio prohibido**: 0 ficheros tocados en `volumes-ops/**`,
  `VOLUMES/**`, `presets-sdk/src/volumes/**`, `linea-kit/src/{validate,
  loader,curation}.mjs`, `force-system/src/**`,
  `feed-kit/src/jetstream-sync.mjs`, `firehose-core/src/**`,
  `ssb-system/src/**`.
- **Sin merge a main, sin push, sin reescritura de historia.**

### Deuda declarada (no se arregló, se anota)

1. **El sello es un cerrojo, no criptografía.** Quien esté decidido puede
   añadir un evento y re-sellar; el contrato no lo impide, lo hace
   **ruidoso**: cinco ediciones deliberadas en tres ficheros (Rojo C). Es lo
   que pide la CA («cambiar la allowlist pasa a ser un cambio de contrato
   que un test detecta»), no más.
2. **El corpus del test 10 solo lee `src/relay.mjs`, `src/config.mjs` y
   `src/relay-contract.mjs`.** Una puerta trasera montada desde un módulo
   *nuevo* importado por el relay no entraría en el corpus. Requiere tocar
   `relay.mjs` para importarlo, lo que es visible en el diff, pero el test
   no lo cazaría solo. → candidato para U193/U196.

---

## 8 · Observaciones para otros WPs (lo que se vio mal fuera; no se tocó)

1. **`RELAY_UPSTREAM` mezcla dos cosas** (→ U193/U195). Los 3 nombres se
   usan para tres decisiones distintas: reenviar al puente (`relay.mjs:111`),
   no trazar como corte de subida (`:117`) y clasificar el eco de bajada
   (`:124`). Si algún día divergen, una sola tabla no bastará. Hoy coinciden
   y el contrato las sella como una.
2. **El eco ida-y-vuelta sigue vivo** (hallazgo de U192, confirmado aquí):
   un nombre de subida que vuelve por el puente se traza como
   `eco-de-nombre-de-subida` en vez de propagarse. Es política heredada, no
   defecto de U194. → U195.
3. **`inner` truthy no-string propaga sin traza** (`relay.mjs:79-95`,
   herencia de base ya anotada por U192): `emitDownstream` no valida que
   `payload.event` sea cadena. Un `{ event: 42 }` llega a `localNs.emit(42,
   …)`. Fuera del alcance de U194 (esto es el desempaquetado, no la
   allowlist). → U193.
4. **`peercard-vivo.test.mjs` y `relay-trace.test.mjs` dependen del gate del
   contrato.** Al vivir el gate en la carga del módulo, un contrato roto
   tiñe de rojo suites ajenas a U194. Es intencionado (fail-closed y ruidoso)
   pero conviene que U193 lo sepa antes de tocar `relay.mjs`.
5. **HUECO ABIERTO — el sobre saltea la allowlist** (añadido en la
   corrección de la devolución, D3; el punto 3 de arriba lo rozaba solo por
   `inner` no-cadena). `emitDownstream` (`relay.mjs:95`) reemite
   `payload.event` **sin consultar `RELAY_DOWNSTREAM_TOP`**: cualquier
   nombre metido dentro de un `ROOM_MESSAGE` llega a los clientes de abajo,
   incluidos los de la tabla de subida que la vía top-level sí corta.
   Probado e2e en §11. El contrato de U194 gobierna la vía top-level, **no**
   el desempaquetado. → **U193 / U195**, dueños de `relay.mjs`. Asertado sin
   taparlo en el test «HUECO ABIERTO…»: al cerrarlo, ese test cae a
   propósito y dice qué actualizar.
6. **`relay.mjs` está ahora anclado por forma** (censo de despacho, D1).
   U193: al editarlo tendrás que re-anclar `EMISIONES_ABAJO_ANCLADAS` y
   `SELLO_DESPACHO_ANCLADO` en `test/relay-contract.test.mjs`. Es
   deliberado — cambiar la propagación del relay es un cambio de contrato —
   y el mensaje de fallo trae el sello nuevo. Comentarios y reformateos no
   lo disparan (control negativo en §11).

---

## 9 · INCIDENTE DE INFRAESTRUCTURA — pila de `git stash` compartida entre worktrees

**Hay que leer esto.** No afecta al resultado de U194 (todo recuperado y
verificado), pero sí a la seguridad del swarm.

### Qué pasó

Para medir la suite «antes» honestamente, el worker hizo `git stash push -u
-- packages/mesh/socket-server/`, corrió la suite y `git stash pop`.
**La pila de stash es del repositorio, no del worktree**: es compartida por
todos los worktrees de `C:\S_LAB\wt\*`.

En la ventana de ~30 s entre el `push` y el `pop`, otro carril de la misma
ola (**U180**, rama `wp/u180-catalogo-ola1`) hizo su propio `git stash
push`. Su entrada pasó a ser `stash@{0}` y la de U194 a `stash@{1}`.
Resultado del cruce:

- el `git stash pop` de U194 **aplicó el WIP de U180 en el worktree de
  U194** (`ciudad-lifecycle/src/server.mjs`, `mcp-launcher/src/catalog.mjs`,
  `mcp-launcher/src/orchestrator.mjs`, `mcp-launcher/test/catalog.test.mjs`,
  `package-lock.json`) y lo borró de la pila;
- acto seguido la pila quedó vacía: el stash de U194 fue consumido por otro
  `pop`, presumiblemente en el worktree de U180.

Ambos cambios **cruzaron la frontera de worktree en las dos direcciones.**

### Estado tras la recuperación

| qué | estado |
| --- | ------ |
| Obra de U194 | **recuperada íntegra** de los commits de stash inalcanzables `2fbe966` (tracked) y `f92f8be` (untracked); suite re-verificada 17/17; commiteada en `f8b8e42` |
| WIP de U180 en el worktree de U194 | **revertido** (`git checkout --`); worktree de U194 limpio de obra ajena |
| WIP de U180 | **preservado** en `610c787f` y protegido del `gc` con la ref `refs/rescate/u180-wip-incidente-u194` |

### Acción que el orquestador debe tomar

1. **Avisar al worker de U180**: su stash `u180-wip` fue consumido. Su
   contenido está íntegro en `610c787f` (5 ficheros: `ciudad-lifecycle/src/
   server.mjs`, `mcp-launcher/src/catalog.mjs`, `mcp-launcher/src/
   orchestrator.mjs`, `mcp-launcher/test/catalog.test.mjs`,
   `package-lock.json`). Recuperación desde su worktree:
   `git checkout 610c787f -- <rutas>`. La ref de rescate lo mantiene vivo.
2. **Verificar el worktree de U180**: puede tener obra de U194 aplicada
   encima (los 5 ficheros de `packages/mesh/socket-server/`). Si aparecen
   ahí, son contrabando de este carril y hay que revertirlos — la versión
   buena está commiteada en `f8b8e42` de esta rama.
3. **Regla para el método**: en un swarm con worktrees sobre un repo común,
   **`git stash` está prohibido**. No aísla. Para medir un «antes» hay que
   usar un worktree desechable, `git worktree add` sobre la base, o
   `git show <base>:<ruta>` — nunca la pila compartida. Sugerido para
   `plan/PRACTICAS.md` / higiene §8 del protocolo de vigilancia.

Esta es también la única escritura que este WP hizo fuera de su worktree: la
ref `refs/rescate/u180-wip-incidente-u194` (aditiva, no reescribe nada, no
es rama ni tag de publicación). Se creó para que el `gc` no se llevara la
obra de otro carril. Declarada aquí para que el orquestador la borre cuando
U180 confirme la recuperación.

### Desarrollo posterior: hay una MINA en la pila de stash

Al cerrar el WP, la pila del repositorio ya no estaba vacía:

```
$ git stash list
stash@{0}: On wp/u194-allowlist-contrato: u194-tmp (restaurado por worker
           U180 tras colision de pila de stash compartida entre worktrees)
```

El worker de U180 detectó la colisión por su lado y **devolvió la entrada de
U194 a la pila**. Gesto correcto, pero deja un peligro activo:

- esa entrada contiene los 5 ficheros de `packages/mesh/socket-server/` de
  este WP, y **ya son redundantes**: están commiteados en `f8b8e42`;
- el próximo `git stash pop` de *cualquier* worktree del repo se llevará
  obra de U194 a un carril ajeno — el mismo accidente, en espejo.

**Este worker NO la ha tocado, a propósito.** Manipular la pila compartida
es justo lo que produjo el incidente, y ahora mismo hay otro worker
operando sobre ella: quitarla sería una segunda carrera. Queda para el
orquestador, que es quien puede serializar:

4. **Drenar la pila**: `git stash drop stash@{0}` (previa verificación de que
   `git stash show -p stash@{0}` solo contiene ficheros de
   `packages/mesh/socket-server/`, todos ya presentes en `f8b8e42`). La pila
   debe quedar **vacía** antes de despachar la ola 4.

> ✎ **Hecho por el orquestador.** La pila se drenó tras la 1.ª entrega,
> dejando la ref `refs/rescate/u194-stash-2fbe966` como respaldo. Por eso el
> repo tiene **dos** refs `refs/rescate/*` y este §9 declaraba una: la otra
> no es de este worker. Ver **§11 · D6**. Ambas son temporales.

---

## 10 · Reproducir

```bash
cd C:\S_LAB\wt\z-u194
npm ci                                  # el worktree venía sin node_modules
npm test -w @zeus/socket-server         # 17/17
npx eslint packages/mesh/socket-server/src packages/mesh/socket-server/test

# el contrato se autoverifica al cargarse:
node -e "import('./packages/mesh/socket-server/src/relay-contract.mjs').then(m => console.log(m.relayContractDescriptor()))"
```

```
{
  version: '1.0.0',
  seal: '57adb96df059db58ee86e20b725012f37adb9f5d20f99f901863cff3b637335e',
  upstream: [ 'CLIENT_REGISTER', 'CLIENT_SUSCRIBE', 'ROOM_MESSAGE' ],
  downstream: [ 'SET_STATE', 'deck:resolved', 'deck:error', 'catalog:servers',
                'state', 'intent', 'ledger', 'track' ],
  counts: { upstream: 3, downstream: 8 }
}
```

---

## 11 · Corrección de la devolución (D1–D6)

Segunda entrega, misma rama, commits nuevos. Lo anterior no se borra: los
tres puntos donde el reporte afirmaba de más quedan marcados con ✎ en su
sitio (§1 regla 4, Rojo E, §6 CA3) y se corrigen aquí.

Lo primero, sin adornos: **dos de los tres bloqueantes se probaron sin
editar un solo fichero**. No eran fallos de implementación en el sentido
cómodo — eran afirmaciones mías que no aguantaban una llamada de método.

### D1 · El corpus reconocía una notación, no un valor · **CORREGIDO**

**Reproducido.** Con la guarda de allowlist intacta, en `src/relay.mjs`:

| vector | antes |
| --- | --- |
| `` if (event === `evento:colado`) `` | **17/17 verde** |
| `if (event === 'evento' + ':colado')` | **17/17 verde** |

El corpus de sondas extraía literales con `/'…'|"…"/`. Un backtick lo
esquiva; una concatenación lo esquiva por construcción — **ninguna
extracción de literales puede ver un nombre que no existe como literal**.
Mi frase «un nombre colado se delata a sí mismo» era falsa, y con ella la
evidencia del Rojo E.

**Corrección: censo de despacho.** Se deja de perseguir el *nombre* y se
ancla la *forma* del despacho (`test/relay-contract.test.mjs`, test
«censo de despacho»):

1. **Número de vías de emisión**: `localNs.emit(` en `src/relay.mjs`,
   anclado a **4**. Una rama nueva que emita mueve el conteo, la escriba
   como la escriba.
2. **Sello de forma**: sha256 de `src/relay.mjs` normalizado — comentarios
   fuera, líneas en blanco fuera, espacios colapsados —, anclado a
   `51b2d8ed…`. Caza la variante que *no* añade emisión: ensanchar la
   guarda in situ.
3. **Presencia de las guardas del contrato** sobre la forma normalizada, de
   modo que reformatear no las esconde.

**Verificado, con los tres vectores:**

```
backtick        → not ok 8 (censo) + not ok 15 (cierre e2e)   · 20 pass / 2 fail
concatenación   → not ok 8 (censo)                            · 21 pass / 1 fail
guarda ensanchada in situ (mismo nº de emisiones)
                → not ok 8 (sello de forma) + not ok 15       · 20 pass / 2 fail
    sello anclado : 51b2d8edfefef4fdb46f10473746769b4f3503ebf95d2a4210fcaf86676346a6
    sello actual  : a5048cd14322b4b4d170c84a4ccaa02951a1227f7dae92541b6b358bea2e099f
```

La concatenación la caza **solo** el censo — es exactamente el caso que el
corpus no puede ver, y por eso el censo no es un adorno del corpus sino su
sustituto como garantía.

**Control negativo** (para no hostigar a U193, dueño de `relay.mjs` en la
ola 4): comentario de línea + bloque multilínea añadidos a `relay.mjs` →
**22/22 verde**. El sello tolera documentación y reformateo; no tolera
despacho nuevo.

El corpus de literales se conserva (ampliado a backticks) como red barata
de primera pasada, **ya no como la garantía**. Dicho en el propio fichero.

### D2 · «Inmutable en runtime» era falso para la bajada · **CORREGIDO**

**Reproducido, 0 ediciones:**

```
add via prototype: NO LANZA
has(evento:colado) = true | size = 9
clear via prototype: NO LANZA -> size = 0
```

`Object.freeze` no toca el slot interno `[[SetData]]` de un `Set`. Sombrear
`add`/`delete`/`clear` en la instancia solo tapa la puerta de delante.

**Corrección: la allowlist deja de ser un `Set`.** El conjunto real vive en
el closure de `listaSellada` y lo publicado es un objeto congelado que solo
sabe responder (`has`, `size`, `values`, `keys`, `forEach`, `toJSON`,
`Symbol.iterator`, y `add`/`delete`/`clear` que deniegan). Al no ser un
`Set`, `Set.prototype` lo rechaza por receptor incompatible: **no hay slot
que secuestrar**. `relay.mjs` sigue con 0 ediciones porque `.has()` y la
iteración se conservan.

**Verificado:**

```
instanceof Set = false
add    via prototype LANZA: Method Set.prototype.add called on incompatible receiver #<Object>
delete via prototype LANZA: Method Set.prototype.delete called on incompatible receiver #<Object>
clear  via prototype LANZA: Method Set.prototype.clear called on incompatible receiver #<Object>
add directo LANZA: CONTRATO-RELAY: la allowlist es inmutable en runtime ('add' …
has(evento:colado) = false | size = 8
iteracion sigue viva: 8 elementos
upstream congelado: SI | length = 3
```

Sondas permanentes en el test «la allowlist resiste el secuestro por
prototipo»: los tres métodos vía `Set.prototype`, `Array.prototype.push`
sobre la subida, `defineProperty` sobre `has` y sobre
`RELAY_CONTRACT.downstream`, y `instanceof Set === false` para que nadie
reintroduzca un `Set` sin enterarse.

La inversión que señalaba la contrarrevisión era exacta y vale la pena
retenerla: **el array de subida sí estaba genuinamente congelado; el `Set`
de bajada, que es el que guarda la puerta, no.** Lo barato parecía sólido y
lo importante no lo era.

### D3 · La allowlist no gobierna la propagación · **ACOTADO Y ENRUTADO**

**Reproducido e2e, 0 ediciones:**

```
evento:colado-por-sobre llega abajo?  true
CLIENT_REGISTER llega abajo?          true
eventos distintos vistos abajo: ROOM_MESSAGE, evento:colado-por-sobre, CLIENT_REGISTER, track
```

`emitDownstream` (`relay.mjs:95`) hace `localNs.emit(inner, data)` con el
nombre que venga dentro del sobre, **sin consultar la allowlist**. Herencia
de la base; `relay.mjs` tiene 0 ediciones de U194 y es fichero caliente de
U192/U193, así que no lo arreglo. Lo que sí era mío es el enunciado:

| antes | ahora |
| --- | --- |
| test «cierre del relay contra puente real: **pasa exactamente el contrato y nada más**» | test «cierre de **la vía top-level** contra puente real: **por `onAny`** solo pasa el contrato» |
| CA3 «La AUSENCIA no pasa» | CA3 «La AUSENCIA no pasa **por la vía top-level**»; el sobre queda declarado como hueco |

**Hueco abierto, declarado y con dueño:**

> El contrato gobierna la vía top-level de bajada (`relay.mjs:132`) y la de
> subida (`relay.mjs:111`). **NO gobierna el desempaquetado del sobre**
> (`relay.mjs:95`): un nombre arbitrario dentro de un `ROOM_MESSAGE` llega
> abajo, incluidos nombres de la tabla de subida que la vía top-level sí
> corta. → **U193 / U195**, dueños de `relay.mjs`.

Escrito en tres sitios para que no se pierda: cabecera de
`src/relay-contract.mjs` (sección «Alcance»), cabecera del test, y §8 punto
5 de este reporte. Y **asertado sin taparlo** en el test «HUECO ABIERTO: el
sobre `ROOM_MESSAGE` reemite cualquier nombre sin consultar la allowlist»,
al estilo del caso rojo de U187: cuando U193 lo cierre, **ese test caerá a
propósito** y su mensaje dice qué actualizar. Mi §8 punto 3 rozaba esto por
`inner` no-cadena; ahora está nombrado por lo que es, un bypass de
allowlist.

### D4 · Borrar el gate entero era silencioso · **CORREGIDO**

El resultado del gate ahora es **portante**: `RELAY_CONTRACT` se construye
desde `VERIFICADO = assertRelayContract({…})`, no desde las tablas crudas.

**Verificado** — sustituido el bloque del gate por un comentario:

```
# ReferenceError: VERIFICADO is not defined
not ok 1 - test\peercard-vivo.test.mjs
not ok 2 - test\relay-contract.test.mjs
not ok 3 - test\relay-trace.test.mjs
not ok 4 - test\server.test.mjs
```

Ya no es «pérdida de defensa en profundidad»: es el módulo que no carga.
Más el test «el gate del contrato corre en la carga y su resultado es
portante», que asserta la llamada y los cuatro campos derivados, por si
alguien intenta reemplazar `VERIFICADO` por un objeto a mano.

### D5 · El atacante competente · **CORREGIDO (ya no es solo contabilidad)**

La contrarrevisión midió: contrato + `admin:override`, versión `1.1.0`,
sello recalculado y las 3 anclas actualizadas → **16 pass / 1 fail, y el
único rojo era de U192**. Mis 7 tests aportaban cero.

Se añade el test **«el último cazador del atacante competente sigue vivo»**,
que exige que `test/relay-trace.test.mjs` siga enumerando literalmente los
11 nombres. Tiene dos efectos, y el segundo no lo esperaba:

1. **Protege al cazador.** Si un WP futuro re-apunta el sello de U192 al
   contrato, muere el único test que caza esta variante — y ahora eso es
   rojo con un mensaje que lo explica. Verificado: re-apuntado el
   `deepEqual` de U192 al contrato → `not ok 14` + `not ok 16`, 20/2.
2. **Caza al atacante competente.** Añadir un evento al contrato sin
   añadirlo también a la enumeración de U192 dispara este test. Medido:

```
atacante competente (evento + versión + sello + 3 anclas)
  → not ok 14 - el último cazador del atacante competente sigue vivo (D5)   ← U194
    not ok 16 - política intacta: los conjuntos de propagación …            ← U192
  # tests 22 · pass 20 · fail 2
```

De **1 cazador (ajeno)** a **2, uno propio**. El acoplamiento con el test de
U192 es deliberado y está declarado: U194 no duplica la lista, la **usa
como testigo** y vigila que siga viva.

Sigue siendo cierto, y lo digo sin rodeos: **el sello es un cerrojo, no
criptografía.** Quien controle el árbol y esté dispuesto a tocar contrato,
sello, versión, tres anclas y la enumeración de U192 mete un evento. Lo que
el contrato compra es que no se pueda hacer de paso ni por accidente.

### D6 · Las dos refs de rescate · **no era defecto mío**

La contrarrevisión apunta que hay dos refs `refs/rescate/*` y mi §9 declara
una. La segunda, `refs/rescate/u194-stash-2fbe966`, **la creó el
orquestador** al drenar la pila compartida después de mi entrega. Mi §9 era
exacto en el momento de escribirse. Queda anotado aquí para que el estado
del repo cuadre con el reporte: **la pila se drenó y quedaron dos refs de
rescate, una mía (`u180-wip-incidente-u194`) y una del orquestador
(`u194-stash-2fbe966`)**; ambas son temporales y se borran cuando U180
confirme su recuperación.

### Estado tras la corrección

| | antes de la devolución | ahora |
| --- | --- | --- |
| suite `@zeus/socket-server` | 17/17 | **22/22** |
| tests propios de U194 | 7 | **11** |
| `@zeus/webrtc-viewer` | 6/6 | **6/6** |
| eslint `src/` + `test/` | 0/0 | **0 errores, 0 warnings** |
| `src/relay.mjs` | 0 ediciones | **0 ediciones** |
| `test/relay-trace.test.mjs` | 0 ediciones | **0 ediciones** |

Tests nuevos (4): censo de despacho (D1) · gate portante (D4) · secuestro
por prototipo (D2) · hueco del sobre (D3) · último cazador (D5) — cinco
adiciones que se reparten en 4 tests nuevos más el renombrado del cierre
e2e.

Batería roja completa re-verificada contra el refactor: **A** (añadir sin
re-sellar) 4 suites caen · **D** (guarda borrada) ahora 3 rojos en vez de 2
· más los siete vectores nuevos de arriba.

### Lo que sigue sin cubrirse, dicho aquí

1. **El sobre** (D3): hueco abierto, de U193/U195, asertado sin tapar.
2. **El censo ancla `relay.mjs`, no los módulos que importe.** Una puerta
   trasera montada en un módulo nuevo que `relay.mjs` importe cambiaría el
   sello de forma (el `import` es una línea nueva) → sería rojo. Pero si
   `relay.mjs` ya importara ese módulo, el censo no vería el interior. Hoy
   `relay.mjs` solo importa `socket-core/client` y `config.mjs`.
3. **El atacante con acceso de escritura y paciencia** (D5): declarado
   arriba, no resuelto — no es resoluble con tests en el mismo árbol.

---

*Worker Z · WP-U194 · rama `wp/u194-allowlist-contrato` · base `dc70cec` ·
1.ª entrega 2026-08-01, corrección de devolución 2026-08-01. Sin merge, sin
push, sin reescritura de historia.*

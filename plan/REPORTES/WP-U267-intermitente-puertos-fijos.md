# WP-U267 · El intermitente histórico: puertos fijos en los tests de arranque

- **Rama**: `wp/u267-intermitente-puertos-fijos` · base **`c005196`**
- **Worktree**: `C:\S_LAB\wt\z-u267` (canónico `C:\S_LAB\v-sdk` no tocado)
- **Alcance**: `packages/mesh/mcp-launcher/test/**` + `packages/mesh/mcp-launcher/fixtures/**`
- **Fecha de ejecución**: 2026-08-02

---

## 0 · Resultado en una línea

El intermitente que arrastrábamos sin nombre **tiene número y ya no vuelve por
la puerta por la que entraba**: los seis ficheros de test del launcher que
ataban puertos escritos a mano (19111/19112, 19121/19122, 19131/19132,
13050/13051, 14121/14122 y el bloque 19861-19866) piden ahora su puerto al SO.
Con **los 16 puertos antes fijos ocupados a la vez en IPv4 y en IPv6**, la
suite entera sigue verde; antes, ocupar **uno solo** —19121— tumbaba **las dos**
pruebas del fichero. Determinismo: **12/12 pasadas de suite completa**, **15/15
aisladas**, **0/8 rondas en paralelo** frente a **2/8 con el código de HEAD**.
Cero `src/` tocado.

Y **el censo es la otra mitad**: quedan **16 de 239** ficheros de test con
puerto fijo repartidos por 10 paquetes, más **13 de 29** guiones de `e2e/` y
**1 fixture**. Están listados uno a uno en **§4**, con su denominador y con lo
que NO cubro y por qué.

---

## 1 · El vector, reproducido antes y después (CA-2)

### 1.1 · ANTES · máquina limpia — verde (por eso era «intermitente»)

```
$ node --test test/intentional-stops-read.test.mjs
# tests 2
# pass 2
# fail 0
```

### 1.2 · ANTES · con `127.0.0.1:19121` ocupado — **caen las dos**

Ocupante: un `net.createServer().listen(19121, '127.0.0.1')` sostenido durante
toda la corrida (arnés en scratchpad, no versionado).

```
[occupy] holding 127.0.0.1:19121
not ok 1 - intentionalStops: stop marks, launch clears, health tells truth
  error: |-
    {"ok":false,"error":"Health check failed after launch","spawnGroup":"fixture-intent",
     "health":[{"id":"intent-tronco","port":19121,"ok":false,"error":"timeout"},
               {"id":"intent-satelite","port":19122,"ok":false,"error":"fetch failed"}],
     "rule":"launch.health"}
    false !== true
not ok 2 - intentionalStops: crash without stop ≠ intentional
  error: |-
    {"ok":false,"error":"Health check failed after launch",...
     "health":[{"id":"intent-tronco","port":19121,"ok":false,"error":"timeout"},...
# pass 0
# fail 2
```

Literalmente la firma que dejó escrita U181: `"port":19121,"ok":false,"error":"timeout"`.
Nótese el detalle que explica la forma del bicho: el satélite (19122) no da
`timeout` sino `fetch failed`, porque el hijo **muere entero** al no poder atar
el primer puerto — un puerto ocupado se lleva por delante los dos.

### 1.3 · DESPUÉS · con **los 16** puertos antes fijos ocupados, en IPv4 **y** IPv6

```
[occupy] holding [127.0.0.1]:19111 … [::1]:19111
[occupy] holding [127.0.0.1]:19112 … [::1]:19112
[occupy] holding [127.0.0.1]:19121 … [::1]:19121
[occupy] holding [127.0.0.1]:19122 … [::1]:19122
[occupy] holding [127.0.0.1]:19131 … [::1]:19131
[occupy] holding [127.0.0.1]:19132 … [::1]:19132
[occupy] holding [127.0.0.1]:13050 … [::1]:13050
[occupy] holding [127.0.0.1]:13051 … [::1]:13051
[occupy] holding [127.0.0.1]:14121 … [::1]:14121
[occupy] holding [127.0.0.1]:14122 … [::1]:14122
[occupy] holding [127.0.0.1]:19861 … [::1]:19866   (bloque U234-B1 completo)
[occupy] ready
ok 14 - intentionalStops: stop marks, launch clears, health tells truth
ok 15 - intentionalStops: crash without stop ≠ intentional
ok 16 - launcher MCP listens and exposes actuator tools
ok 21 - e2e: start → health → status → stop leaves ports re-bindable
ok 22 - U234-B1 CA-1: listenerPids enumera un listener atado sólo a ::1
ok 25 - U234-B1 CA-4: la sonda de ocupación ve lo que un bind de un solo host no ve
ok 26 - U234-B1 CA-5: la guardia puerto_ocupado_sin_health despierta ante un ocupante ::1
# fail 0
```

Los 32 binds del ocupante (16 puertos × 2 familias) están sostenidos a la vez.
La suite entera pasa: ningún test del launcher depende ya de un número.

### 1.4 · El vector de paralelismo — **medido, no supuesto**

U181 conjeturó que el paralelismo de CI era una de las bocas del bicho. Lo he
medido en vez de repetirlo. `intentional-stops-read.test.mjs` y
`tool-call-launch.test.mjs` compartían **el mismo par 19121/19122**; lanzo los
dos ficheros como procesos concurrentes, 8 rondas, con el código de HEAD y con
el del árbol (intercambio reversible, restauración verificada por `sha256`):

| Código | Rondas que muerden |
|---|---|
| HEAD (puertos fijos) | **2 / 8** (rondas 3 y 8, `tool-call-launch` exit=1) |
| Árbol actual (efímeros) | **0 / 8** |

Ese 25 % es exactamente la textura del bicho: **no** falla siempre, por eso
sobrevivió tanto sin nombre. La primera muestra que tomé (1 ronda) salió verde
en ambos lados — si me hubiera quedado ahí habría reportado «no reproducido».
Queda dicho porque el número honesto es 2/8, no «reproduce».

---

## 2 · El arreglo — el de los paquetes hermanos, en sus dos formas

No inventé mecanismo: `port: 0` + `server.address().port`. Se aplica en dos
formas porque hay dos situaciones distintas, y conviene que se lea la
diferencia:

**(a) Servidor en proceso — cero carrera, cero código nuevo.**
`createMcpHttpStart` de `presets-sdk` **ya** resolvía el puerto atado:

```js
// packages/engine/presets-sdk/src/mcp/stateless-route.mjs:83-86
const address = httpServer.address();
const boundPort = address && typeof address === 'object' ? address.port : port;
resolve({ name, port: boundPort, url: `http://localhost:${boundPort}${path}`, … });
```

Así que `createServer({ port: 0 })` y leer `handle.port` basta. Es lo que hacen
ahora `launcher-server.test.mjs` y `tool-call-launch.test.mjs`. Aquí **no queda
ninguna ventana**: el proceso que ata es el que lee.

**(b) Fixture spawneada — reserva y cesión.**
`ProcessManager` construye `healthUrl` desde el catálogo **antes** de spawnear
al hijo, de modo que el padre necesita el número por adelantado. Nuevo
`test/helpers/ports.mjs`: mismo `listen(0)` + `address().port`, y suelta el
socket para cedérselo al hijo. Ata los `n` a la vez antes de soltar ninguno,
para que el SO esté obligado a dar `n` distintos (si se pidieran de uno en uno
podría repetir, y tronco y satélite volverían a pelearse).

**Lo que este arreglo NO promete, escrito en el propio helper**: no es una
reserva atómica. Queda una ventana de milisegundos entre soltar y que el hijo
ate. Lo que desaparece es la colisión **determinista** —dos ficheros con el
mismo literal, un residuo en un puerto conocido—; lo que queda es una carrera
genuinamente rara contra el rango efímero del SO, que es el trato que ya
aceptan los hermanos. Soltar el listener no reintroduce la enfermedad: un
socket a la escucha que nunca aceptó conexión **no pasa por TIME_WAIT**
(TIME_WAIT es de conexiones establecidas, no de listeners).

**Familia IP.** En `orchestrator.test.mjs` la reserva se pide **en la familia
que se va a atar**: `'::1'` para lo que ata `ipv6-peer`, `'::'` para el
comodín, `'127.0.0.1'` para el espejo IPv4. Reservar en la familia equivocada
dejaría abierto justo el hueco que U234-B1 vino a cerrar. Además, en CA-4 el
puerto IPv4 se reserva **después** de atar el comodín, a propósito: el comodín
es dual-stack y pedir los dos números antes de atar ninguno permitiría que el
SO diera el mismo dos veces.

Un caso menor pero real: `assert.equal(await portReleased(PORT_WILDCARD + 100,
'localhost'), true)` era «supongo que 19964 está libre». Ahora se pide uno al
SO con los dos ocupantes ya atados: libre por construcción, no por fe.

### 2.1 · Las fixtures también tenían el vicio, latente

`dual-peer.mjs` (`argv[2] || 19111`), `ipv6-peer.mjs` (`|| 19861`) y
`echo-peer.mjs` (`|| 19050`) llevaban un default fijo. Ningún test lo usaba
—todos pasan puerto— pero era el sitio exacto donde una invocación sin
argumentos vuelve a atar un puerto fijo **en silencio**. Ahora falta el puerto
y se grita con `exit 2` y un mensaje que dice dónde está el reservador.
`echo-peer.mjs` no lo usa hoy ningún test; se arregla igual porque el próximo
que lo adopte heredaría el defecto.

---

## 3 · La guardia, y su verificación por enrojecimiento (CA-5)

Nuevo `test/no-fixed-ports.test.mjs`, en el idioma de la CA-9 que ya vive en
`orchestrator.test.mjs`: análisis de **texto**, con modelo de amenaza declarado.
Cinco aserciones estructurales + una funcional del reservador.

**CA-5 exige desactivar el guardián y comprobar que enrojece.** Hecho para
**cada** aserción por separado: se planta SU regresión concreta, se corre la
guardia, y se comprueba que cae **esa y sólo esa**. Los ficheros se restauran
byte a byte (sin `git`, sin `stash`):

```
BASE (sin plantar nada): exit=0 rojas=0
#1 spawnArgs con literal:          exit=1 rojas=1 [ningún puerto literal viaja a una fixture spawneada]  → ENROJECE (y sólo la suya)
#2 fixture con default fijo:       exit=1 rojas=1 [ninguna fixture tiene puerto por defecto]             → ENROJECE (y sólo la suya)
#3 bind en proceso a literal:      exit=1 rojas=1 [ningún servidor en proceso se ata a un puerto literal]→ ENROJECE (y sólo la suya)
#4 arranca sin reservar:           exit=1 rojas=1 [todo test que arranca algo importa el reservador]     → ENROJECE (y sólo la suya)
#5 constante de puerto con literal:exit=1 rojas=1 [ninguna constante con nombre de puerto guarda un literal] → ENROJECE (y sólo la suya)
RESTAURADO: exit=0 rojas=0
CA-5 OK: las 5 aserciones enrojecen ante su regresión
```

Regresiones plantadas, una por aserción: `spawnArgs: [fixture, String(19121),
String(19122)]` · `Number(process.argv[2] || 19111)` en `dual-peer` ·
`createServer({ port: 13051 })` · borrar el `import` del reservador ·
`const TEST_PORTS = { espana: 14121, wp: 14122 }`.

La #5 es la importante y merece explicación: los seis ficheros **no** tenían un
`listen(19121)` visible. Tenían `const PORT_A = 19121` a cien líneas del bind.
Una guardia que sólo mirase `listen(` no habría visto nada de lo que arreglé
hoy.

**Alcance honesto de la guardia** (declarado en su cabecera, no deducido): caza
la forma en que llega una regresión distraída —un literal escrito donde el
puerto viaja al hijo o al bind— y **no** caza al que lo construya indirecto
(`String(19000 + 121)`, un puerto que llegue en variable desde otro módulo, un
`.env`). Modelo de amenaza: defiende contra la **regresión**, no contra un
contribuyente hostil; quien edita estos tests edita también la guardia.
Cerrarlo del todo exige AST.

**Falsos positivos que evité a propósito**, porque una guardia ruidosa se
desactiva sola: `catalog.test.mjs` hace `() => manager.launch('no-existe')`
dentro de un `assert.rejects` (nunca spawnea) y `launcher-server.test.mjs`
construye un `ProcessManager` que jamás lanza. Ninguno entra. El discriminador
son tres señales estrechas: `spawnCommand: process.execPath`, `runStart(` y
`await manager.launch(`.

---

## 4 · EL CENSO, con denominador (CA-1)

Medición propia sobre el árbol (guion en scratchpad), contrastada con un barrido
independiente. **Definición de «fichero de test»**: `.mjs/.js/.cjs/.ts/.tsx`
bajo `test/`, `tests/`, `__tests__/`, o con nombre `*.test.*` / `*.spec.*`,
excluyendo `node_modules/` y `VOLUMES/`.

| Magnitud | Antes | Después |
|---|---|---|
| **Ficheros de test (denominador)** | 237 | **239** (+2 míos) |
| …con algún literal de 4-5 dígitos | 79 | 79 |
| …que **atan** un puerto fijo (el vicio) | **22** | **16** |
| Fixtures con puerto fijo | 4 | **1** |
| Guiones `e2e/` con puerto fijo | 13 / 29 | 13 / 29 |

**Cierro 6 de 22 ficheros de test (27 %) y 3 de 4 fixtures.** Los 6 son los del
launcher; son también los que contenían el intermitente con nombre.

### 4.1 · Lo que queda abierto — los 16, uno a uno

| # | Fichero | Puertos | Nota |
|---|---|---|---|
| 1 | `packages/editor/editor-ui/test/smoke.mjs` | 14012 | **la cabecera miente**: dice «ephemeral port» |
| 2 | `packages/engine/linea-kit/test/starterkit-e2e.test.mjs` | 14181 | **la cabecera miente**: «Ephemeral high port». **Prohibido tocar** (trabajo vivo) |
| 3 | `packages/mesh/cache-browser/test/routes.mjs` | 14025 | |
| 4 | `packages/mesh/cache-browser/test/smoke.mjs` | 14015 | |
| 5 | `packages/mesh/ciudad-lifecycle/test/e2e-barrio.test.mjs` | 13161, 13004, 13005-13007 | |
| 6 | `packages/mesh/ciudad-lifecycle/test/f2-cascada-wake.test.mjs` | 13104-13106 | |
| 7 | `packages/mesh/console-monitor/test/smoke.mjs` | 13014 | |
| 8 | `packages/mesh/firehose-browser/test/routes.mjs` | 14026 | |
| 9 | `packages/mesh/firehose-browser/test/smoke.mjs` | 14016 | |
| 10 | `packages/mesh/force-system/test/smoke.mjs` | 14191 | |
| 11 | `packages/mesh/linea-firehose/test/smoke.mjs` | 13008 | |
| 12 | `packages/mesh/linea-system/test/resource-contract.test.mjs` | **14121, 14122** | **colisión viva** con lo que yo acabo de cerrar |
| 13 | `packages/mesh/linea-system/test/smoke.mjs` | **14111, 14112** | **colisión viva** con `e2e/helpers.mjs` |
| 14 | `packages/mesh/solar-system/test/resource-contract.test.mjs` | 14151-14153 | |
| 15 | `packages/mesh/solar-system/test/smoke.mjs` | 14101-14103 | |
| 16 | `packages/mesh/ssb-system/test/e2e-mcp.test.mjs` | 14114 | |

Fixture restante: `packages/mesh/ciudad-lifecycle/fixtures/state-machine-peer.mjs`
(default `13004`, el mismo que ata `e2e-barrio.test.mjs` — misma pareja
fichero/fixture que yo he roto en el launcher).

`e2e/` (13 de 29): `domain-helpers.mjs` (13027/13029, compartido por cinco
guiones), `helpers.mjs` (14111/14112), `dual-ui-demo.mjs` (13047-13050),
`player-ui-dj-demo.mjs`, `operator-ui-demo.mjs`, `webrtc-viewer.mjs`,
`webrtc-signaling.mjs`, `webrtc-signaling-anonimo.mjs`, `peer-card-chain.mjs`,
`feed-families-demo.mjs`, `firehose-demo.mjs`, `firehose-links-demo.mjs`,
`view-demo.mjs`.

### 4.2 · Las colisiones que el censo destapa

No son hipotéticas: son **el mismo número escrito en dos sitios**.

| Puertos | Quién los ata | Estado |
|---|---|---|
| 19121/19122 | `mcp-launcher/intentional-stops-read` **y** `mcp-launcher/tool-call-launch` | **CERRADA** (era el intermitente) |
| 14121/14122 | `mcp-launcher/linea-launch` **y** `linea-system/resource-contract` | **media**: cierro mi lado |
| 13050 | `mcp-launcher/launcher-server` **y** `e2e/dual-ui-demo` | **media**: cierro mi lado |
| 14111/14112 | `linea-system/smoke` **y** `e2e/helpers.mjs` | **abierta** |
| 13004 | `ciudad-lifecycle/e2e-barrio` **y** su propia fixture | **abierta** |

### 4.3 · Por qué `npm run gates` nunca vio nada de esto

El escáner de puertos **exime `/test/` por diseño**:

```js
// scripts/gates/scan.mjs:88-101 — isPortsPathExempt()
if (n.includes('/test/') || n.includes('/tests/') ||
    /\.test\./.test(n) || /\.spec\./.test(n) ||
    n.startsWith('e2e/')) {
  return true;
}
```

Es decir: **los 22 ficheros eran invisibles al gate por construcción**, y lo
siguen siendo los 16 que quedan. La guardia que añado vive dentro de la suite
del launcher precisamente por eso — no intento cambiar el gate, que es `src/`
de otro y está fuera de mi alcance. **Esto es una recomendación, no un
hallazgo cerrado**: si se quiere cerrar el vicio a nivel repo, el sitio
barato es levantar esa exención con una regla que distinga atar de afirmar.

---

## 5 · Determinismo medido (CA-3)

Todo sobre el árbol arreglado, en esta máquina, hoy:

| Medición | Corridas | Resultado |
|---|---|---|
| Suite completa `@zeus/mcp-launcher` | **12** | **12 verdes** (`# pass 36 # fail 0 # skipped 1` en las doce) |
| `intentional-stops-read.test.mjs` aislado | **15** | **15 verdes** |
| Tres suites completas **concurrentes** | 3 × 1 | **3 verdes** |
| Pareja concurrente 19121/19122 (árbol) | **8** | **0 muerden** |
| Pareja concurrente 19121/19122 (HEAD) | **8** | **2 muerden** ← contraste |
| Suite completa con **16 puertos ocupados** ×2 familias | 1 | **verde** |

El `# skipped 1` de todas las pasadas es `linea-launch.test.mjs`, que se salta
solo si no hay `VOLUMES/DISK_02/LINEAS/espana/manifest.json` (gate preexistente,
no introducido por mí). **Su arreglo de puertos, por tanto, no está ejercitado
en esta máquina** — está en §7 como límite declarado.

`# pass 36` frente a los 30 de antes: +6 son las aserciones de la guardia nueva.

---

## 6 · Cero cambios de conducta del producto (CA-4)

```
$ git diff --name-only
packages/mesh/mcp-launcher/fixtures/dual-peer.mjs
packages/mesh/mcp-launcher/fixtures/echo-peer.mjs
packages/mesh/mcp-launcher/fixtures/ipv6-peer.mjs
packages/mesh/mcp-launcher/test/intentional-stops-read.test.mjs
packages/mesh/mcp-launcher/test/launcher-server.test.mjs
packages/mesh/mcp-launcher/test/linea-launch.test.mjs
packages/mesh/mcp-launcher/test/orchestrator.test.mjs
packages/mesh/mcp-launcher/test/process-manager.test.mjs
packages/mesh/mcp-launcher/test/tool-call-launch.test.mjs

$ git status --porcelain | grep '^??'
?? packages/mesh/mcp-launcher/test/helpers/
?? packages/mesh/mcp-launcher/test/no-fixed-ports.test.mjs

$ { git diff --name-only; git status --porcelain | grep '^??' | sed 's/^?? //'; } | grep '/src/'
NINGUNO
```

Nueve ficheros modificados (`test/` y `fixtures/`), dos nuevos. **Ni un byte
bajo `src/` de ningún paquete.** `fixtures/` no es producto: no se publica
(`package.json` → `"files": ["src", "README.md"]`), no se exporta y sólo la
invocan los tests de este paquete (verificado por barrido: las tres fixtures
sólo aparecen citadas desde `test/` y desde sus propias cabeceras).

Verificaciones cruzadas:

```
$ npm run gates      → gates: OK (0 offenders)     EXIT=0
$ npx eslint packages/mesh/mcp-launcher/{test,fixtures}
  → 1 problem (0 errors, 1 warning)  EXIT=0
    warning preexistente en catalog.test.mjs ('getCatalogEntry' sin usar), fichero que NO he tocado
$ git hash-object package-lock.json
  bc0cca1e2397b870cfdc69d60fb0f6319ee1fe60   (idéntico antes y después de npm ci)
```

Aserciones de contrato que **conservo íntegras** en vez de borrar con el
puerto: `resolveLauncherPort()` sigue comprobado contra `ZEUS_MCP_LAUNCHER`
(ahora vía `ENV_PORT_CONTRACT`, resolución pura, **cero sockets**), y
`byId[...].port` sigue comparándose contra el puerto real, ahora el reservado
en vez del literal. Ninguna prueba perdió poder discriminante: lo que antes
afirmaba «el puerto es 19121» ahora afirma «el puerto es el que pedí», que es
la afirmación que de verdad importaba.

---

## 7 · Lo que NO cubro — declarado

1. **Los 16 ficheros de §4.1 y los 13 de `e2e/`.** Mi `ALCANCE_DIFF` es
   `mcp-launcher/test/**`; extenderlo a 10 paquetes más habría sido un diff
   enorme sobre suites que no puedo ejercitar aquí (varias piden `VOLUMES/`
   vivo, que tengo prohibido tocar). Están censados con denominador para que
   sean un WP, no un descubrimiento.
2. **`packages/engine/linea-kit/**` y `packages/engine/volumes-ops/**`:
   prohibidos por brief** (trabajos vivos). `linea-kit/test/starterkit-e2e.test.mjs`
   (14181) queda en el censo **sin tocar**, y su cabecera sigue afirmando
   «Ephemeral high port» sobre un literal.
3. **`linea-launch.test.mjs` no se ejecutó**: su `skip` preexistente lo apaga
   sin `VOLUMES/DISK_02/LINEAS/espana`. Su cambio está verificado por lectura y
   por la guardia (#4/#5), **no por ejecución**. Es el único de los seis en esa
   situación y conviene que lo sepa quien acepte.
4. **La ventana no-atómica del reservador** (§2). Documentada en el helper. Se
   cierra del todo sólo si el hijo ata `0` y devuelve su puerto al padre, lo
   que exige cambiar `ProcessManager` — es decir, `src/`. Fuera de alcance por
   diseño, y probablemente no valga el precio.
5. **La guardia no analiza AST** (§3). No caza puertos construidos.
6. **La exención de `/test/` en el gate de puertos** (§4.3) sigue en pie. No la
   toco: es `src/` de los gates.
7. **Una sola máquina, un solo SO.** Todo lo medido es Windows 11 + Node
   v22.21.1. El 2/8 del vector de paralelismo es de aquí; en un CI con más
   contención sería peor, que es el argumento a favor del arreglo, no en contra.

**Incidencia declarada (y resuelta).** El worktree venía sin `node_modules`;
instalé con `npm ci` (que no toca el lockfile: hash idéntico antes y después).
Efecto colateral: npm reescribió con LF tres `bin/*.mjs` —`feed-kit`,
**`linea-kit`** y `playbook-kit`— que en disco estaban en CRLF. **Contenido
idéntico** (`git hash-object` == `git rev-parse HEAD:<f>` en los tres, `git diff
--numstat` vacío), pero uno de ellos cae en territorio prohibido por el brief.
Restaurados con `git checkout --` sobre esos tres caminos exactos. El
`git status` final contiene **sólo** `mcp-launcher/{test,fixtures}` y este
reporte. Lo escribo porque un roce con `linea-kit`, aunque sea de saltos de
línea y aunque esté deshecho, lo tiene que ver quien acepta.

---

## 8 · Ficheros

**Modificados** — `packages/mesh/mcp-launcher/`:
`test/intentional-stops-read.test.mjs`, `test/tool-call-launch.test.mjs`,
`test/launcher-server.test.mjs`, `test/process-manager.test.mjs`,
`test/orchestrator.test.mjs`, `test/linea-launch.test.mjs`,
`fixtures/dual-peer.mjs`, `fixtures/ipv6-peer.mjs`, `fixtures/echo-peer.mjs`.

**Nuevos**: `test/helpers/ports.mjs` (el reservador; fuera del glob
`test/*.mjs`, así que no corre como test) y `test/no-fixed-ports.test.mjs`
(la guardia).

En cada sitio donde vivía un puerto fijo queda una cicatriz escrita con el
número viejo y por qué se fue. Un intermitente sin nombre es deuda que alguien
paga en CI a las tres de la mañana; éste ya tenía nombre, y ahora tiene además
quien lo vigile.

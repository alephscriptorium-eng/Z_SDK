# WP-U265 — El gate de la matriz publica una mentira, y es ciego a ella

Rama `wp/u265-matriz-tipo-kind` · base `0a441d1` · obra `1d01d00`
ALCANCE_DIFF: `scripts/gates/matriz-51.mjs`, sus tests, `plan/MATRIZ-RUNTIME-51.md`, este reporte.
`packages/mesh/mcp-launcher/src/catalog.mjs` **no tocado** (obra aceptada de U181): se corrige el
gate que la mide, no la medida.

---

## 0 · Lo que se re-midió antes de creerlo

El encargo pedía re-medir. Se re-midió, y **el brief se quedó corto en un punto y sobró en otro**:

| Afirmación del brief | Re-medida | Veredicto |
|---|---|---|
| `tipo: MCP` 12 → 16 al restaurar el catálogo previo a U181 | 12 → 16 | **exacta** |
| `/mcp/health` 12 → 16 | 12 → 16 | **exacta** |
| gate `OK — 51/51 · 0 fallos` en los dos estados | `ok=true fallos=0` en los dos | **exacta** |
| «las cuatro interfaces pasaron de UI a MCP» | 4 sí, pero las entradas `kind:'service'` mal tipadas eran **7** | **corta** |
| `MATRIZ-RUNTIME-51.md:91,97,112,113` caducadas | son **9** filas caducadas, no 4 | **corta** |
| «4 líneas son 1 entrada» | correcto, y por eso la anotación dice «1 entrada» | **exacta** |

Los dos «corta» importan: **3 de las 7 mentiras no las introdujo U181 sino U234** (`socket-server`,
`cache-browser`, `firehose-browser`, alta `c109948`), y dos filas más de la matriz llevaban caducadas
desde U234 (`mcp-launcher`) y U180 (`ciudad-lifecycle`). El defecto es **de la era U234**; U181 lo
ensanchó de 3 a 7. Atribuírselo entero a U181 habría dejado tres piezas sin mirar.

---

## 1 · La ceguera, medida en los dos estados

Procedimiento (el mismo en los tres bloques de abajo): se materializa en un árbol temporal el
**conjunto de lectura exacto** del gate desde `HEAD` —usando `conjuntoDeLectura()` de
`test/gates/conjunto-lectura.mjs`, que es la fuente única que ya usa la propia suite— y se sustituye
`packages/mesh/mcp-launcher/src/catalog.mjs` por su versión en el sha indicado. El repo **no se
toca**: 6 worktrees vivos y `test/gates/arbol-inmutable.test.mjs` vigilando.

### 1.a · Gate de `0a441d1` (antes) · catálogo de hoy

```
catalog.mjs = HEAD
ok=true fallos=0 filas=51
tipos: {"demo":2,"MCP":16,"lib":27,"CLI":3,"servicio":1,"UI":2}
health: {"sin entrada de catálogo":35,"/mcp/health vía catálogo":16}
MCP: @zeus/editor-ui @zeus/3d-monitor @zeus/cache-browser @zeus/ciudad-lifecycle
     @zeus/console-monitor @zeus/firehose-browser @zeus/force-system @zeus/linea-editor
     @zeus/linea-firehose @zeus/linea-system @zeus/mcp-launcher @zeus/player-3d-ui
     @zeus/player-ui @zeus/socket-server @zeus/solar-system @zeus/ssb-system
```

### 1.b · Gate de `0a441d1` (antes) · catálogo previo a U181 (`b80741b`)

```
catalog.mjs = b80741b
ok=true fallos=0 filas=51
tipos: {"demo":2,"UI":6,"lib":27,"CLI":3,"MCP":12,"servicio":1}
health: {"sin entrada de catálogo":39,"/mcp/health vía catálogo":12}
```

**`ok=true` en los dos.** Doce y dieciséis son la misma respuesta para el gate: no sabía distinguir.
Ésa es la frase entera de la ficha.

### 1.c · Gate de hoy (`1d01d00`) · catálogo previo a U181 (`b80741b`)

```
catalog.mjs = b80741b
ok=false fallos=4 filas=51
```

**La ceguera está cerrada**: el mismo movimiento del catálogo que antes pasaba en verde ahora
enrojece, porque las cuatro filas de la matriz afirman una entrada que en ese estado no existe.

---

## 2 · Antes / después de las dos cifras

Orden exacta, reproducible hoy:

```
$ node scripts/gates/matriz-51.mjs --json | node -e "<contador por celda>"
tipo MCP        : 9
tipo UI         : 8
tipo servicio   : 2
health /mcp/health: 9
health /health    : 7
sin entrada       : 35
filas             : 51 · ok = true · fallos = 0
```

| cifra | antes (`0a441d1`) | después (`1d01d00`) |
|---|---|---|
| filas `tipo: MCP` | **16** | **9** |
| filas `/mcp/health` | **16** | **9** |
| filas `/health` | 0 | **7** |
| filas `tipo: UI` | 2 | **8** |
| filas `tipo: servicio` | 1 | **2** |
| **denominador** | **51/51** | **51/51** |

Las 7 entradas `kind:'service'`, con su tipo real y su health real:

| pieza | entrada | kind | tipo publicado | health publicado |
|---|---|---|---|---|
| `@zeus/socket-server` | `socket-server` | `service` | **servicio** | `/health` |
| `@zeus/cache-browser` | `cache-browser` | `service` | **UI** | `/health` |
| `@zeus/firehose-browser` | `firehose-browser` | `service` | **UI** | `/health` |
| `@zeus/editor-ui` | `editor-ui` | `service` | **UI** | `/health` |
| `@zeus/player-ui` | `player-ui` | `service` | **UI** | `/health` |
| `@zeus/player-3d-ui` | `player-3d-ui` | `service` | **UI** | `/health` |
| `@zeus/3d-monitor` | `3d-monitor` | `service` | **UI** | `/health` |

`socket-server` es la única de las siete que no cae en `UI`: su `description` («Socket.io runtime
server (E2 slot)») no tiene señal de interfaz, y el `kind: 'service'` la lleva a `servicio` **citando
el catálogo**, no la ausencia de señal. Las 16 entradas `kind` ausente/`mcp` siguen dando `MCP`, así
que ninguna pieza de flota se ha perdido por el camino: 16 = 9 MCP + 7 service.

Y la contradicción con `packages/mesh/mcp-launcher/test/catalog.test.mjs:206-218` («U234: vscode
config excludes kind:service, includes launcher MCP»; las cuatro asserts de U181 en `:215-218` — el
brief citaba `:198-202`, líneas que la propia alta desplazó) queda cerrada: las dos superficies leen
ahora el **mismo campo**.

---

## 3 · La causa técnica, y las dos mitades del mismo `if`

`parseSeedEntries` (`scripts/gates/matriz-51.mjs`) no parseaba `kind`. Por eso el `health` era una
línea y el `tipo` no: sin el dato, la única señal disponible era «hay entrada / no hay entrada».

Ahora lee `kind` y `healthPath` con **el mismo criterio de falla cerrada que ya tenía `workspace`**:

- campo presente y no parseable ⇒ `catalogo-parse` ruidoso, la entrada **no se emite**;
- `kind` fuera del typedef (`mcp`|`service`) ⇒ ruidoso, **no se degrada al default**, que es
  precisamente el valor que mentía;
- `kind` ausente ⇒ `'mcp'`, y `healthPath` ausente ⇒ `/mcp/health`, **citando el contrato del propio
  catálogo** (`CatalogEntry`, `resolveCatalog`), no una convención inventada por el gate.
  `healthPath` se guarda como `null` cuando falta para que la celda pueda decir «default», no
  «declarado».

Precedencia del tipo, explícita: `kind mcp` > desc/fichero MCP > `UI` > `CLI` > `demo` >
`kind service` > `servicio` > `lib`. `kind:'service'` gana también a las dos heurísticas MCP: una
declaración del catálogo pesa más que un comentario de cabecera. Medido: **ninguna de las 7 tiene
cabecera `MCP server`**, así que hoy la regla no cambia ningún resultado — está por lo que impide
mañana.

**De paso, una cita corta**: el negativo del `health` decía `` `catalog.mjs` — grep workspace X → 0 ``
cuando el gate parsea **dos** catálogos. Ahora nombra los dos. Era una cita más corta que el hecho.

---

## 4 · CA2 — el gate enrojece contra el estado de hoy, y el vector está guardado

Con el gate nuevo y la matriz **sin anotar** (estado de `0a441d1`):

```
$ node scripts/gates/matriz-51.mjs
matriz-51: FAIL (23 fallo(s))
  [contraste-catalogo-caduco]   MATRIZ-RUNTIME-51.md:91  (@zeus/editor-ui)
  [contraste-catalogo-caduco]   MATRIZ-RUNTIME-51.md:97  (@zeus/3d-monitor)
  [contraste-catalogo-caduco]   MATRIZ-RUNTIME-51.md:100 (@zeus/cache-browser)
  [contraste-catalogo-caduco]   MATRIZ-RUNTIME-51.md:101 (@zeus/ciudad-lifecycle)
  [contraste-catalogo-caduco]   MATRIZ-RUNTIME-51.md:103 (@zeus/firehose-browser)
  [contraste-catalogo-caduco]   MATRIZ-RUNTIME-51.md:108 (@zeus/mcp-launcher)
  [contraste-catalogo-caduco]   MATRIZ-RUNTIME-51.md:112 (@zeus/player-3d-ui)
  [contraste-catalogo-caduco]   MATRIZ-RUNTIME-51.md:113 (@zeus/player-ui)
  [contraste-catalogo-caduco]   MATRIZ-RUNTIME-51.md:114 (@zeus/socket-server)
  [contraste-catalogo-incompleto] ×14 — las 7 filas que sí afirmaban la entrada,
                                  sin anotar `kind` ni `health` (2 cada una)
EXIT=1
```

**9 caducadas, no 4.** Las cuatro del brief (`:91`, `:97`, `:112`, `:113`) más `cache-browser`,
`firehose-browser` y `socket-server` (U234), `ciudad-lifecycle` (U180) y `mcp-launcher` (U234).

**Vector guardado**: `test/gates/fixtures/matriz-51-catalogo-u265.mjs` — las 16 celdas «catálogo»
**literales** de `0a441d1`. Vendorizado y no `git show 0a441d1:…` por el precedente medido en U260:
`actions/checkout@v4` clona con `fetch-depth: 1` y un objeto que no sea HEAD responde
`fatal: invalid object name` en el runner. Un vector que sólo existe en local no es un vector.
Lo consumen dos tests, uno de unidad y otro **de punta a punta** que replanta la columna sobre un
árbol commiteado y exige `exit ≠ 0` del CLI (que es lo que lee CI).

### Los dos oráculos, y por qué hacen falta los dos

- **`contraste-catalogo-*`** — la columna «catálogo» de la matriz contra el catálogo vivo. Es el
  oráculo **independiente**: texto commiteado por una persona, que no se mueve cuando se mueve el
  parser. Códigos: `-caduco`, `-incompleto`, `-ilegible` (un claim que no se entiende **no** se toma
  por negativo), `-mixto`.
- **`tipo-vs-kind` / `health-vs-healthpath`** — las celdas **publicadas** contra el `kind`/`healthPath`
  parseados. Caza que la **derivación** se mueva bajo el catálogo.

Ninguno cubre al otro, y el censo de mutación lo demuestra midiendo, no razonando (§6).

**La asimetría exacta, que en la primera versión de este reporte no estaba escrita**:
`health-vs-healthpath` es **ciego a un defecto dentro de `healthDe()`**, porque la derivación y la
comprobación llaman a la misma función y se moverían las dos a la vez. Ese caso lo salva el
contraste, que no depende de ninguna función del gate. Y al revés, el contraste es ciego a que la
derivación se desvíe con el parser intacto (M2, M3). **Ésa es la razón de tener dos y no uno**, y
está ahora escrita también en el docblock de `compararCeldasConKind`.

---

## 5 · CA3 — `MATRIZ-RUNTIME-51.md` re-medida, no copiada

Las 16 celdas afirmativas se **generaron desde el catálogo vivo** (censo de bloques con sus líneas
reales), no se transcribieron: transcribir a mano 16 celdas es la forma más corta de reintroducir el
defecto que este WP cierra. Formato:

```
**sí**: `<id>` [+ `<id>`…] · kind `<mcp|service>` · health `<ruta>` · `<cita>` [— nota]
```

Lo que se conservó de cada fila (no derivable del catálogo, y perder eso habría sido una regresión
documental): que `linea-editor` es otra pieza distinta de `editor-ui`; que la entrada `firehose` es
`@zeus/linea-firehose` y no `firehose-browser` —la confusión exacta que U181 estuvo a punto de
cometer—; que `ciudad-lifecycle` **extiende** el catálogo con 6 hojas; y que `mcp-launcher` es
**custodio del catálogo** *y* entrada de él.

**Las 7 filas que ya decían «sí» también estaban caducadas**, en sus citas: `console-monitor`
`:155-163` → `:170-179`; `forces` `:112-121` → `:128-137`; `linea-editor` `:122-132` → `:138-148`;
`firehose` `:143-153` → `:159-169`; `linea-system` `:60-81` → `:76-97`; solar `:83-111` → `:98-127`;
`ssb` `:133-142` → `:149-158`. **Las 16 estaban rancias, no 4.**

Además, en la cabecera del documento:

- **`Hueco inverso`**: `catalog.mjs:167,:178,:188,:198` → re-medidas **`:183, :194, :204, :214`**
  (`grep -n "workspace: null"`). Anotado que las 10 las **enumera el gate** en cada corrida, así que
  la cifra no vuelve a caducar en silencio aunque las líneas se muevan.
- **`catálogo 44/51 sin entrada` → `35/51`**, re-medida y **derivada por el gate**. El 44 era de
  U179 y lo dejaron rancio **U234 (4), U180 (1) y U181 (4)**. El desglose importa porque la
  aritmética tiene que cerrar: `git log -S"id: 'launcher'"` → `c109948` = U234, que dio de alta
  **cuatro** entradas (`launcher`, `socket-server`, `cache-browser`, `firehose-browser`), no tres.
  **4 + 1 + 4 = 9**, y `44 − 9 = 35`. *(Corregido en devolución: la primera versión de este reporte
  publicaba «U234 (3)», que sumaba 8 para explicar 9 — el `mcp-launcher` que sí aparecía enumerado
  en §4 no llegaba al número.)*
- **`comando 20/51 sin arranque` → `33/51`** con el patrón que el propio documento declara
  (`"start":` en el `package.json` de cada una de las 51). El 20 **no se reproduce** con ese patrón.
  Para no cambiar una cifra rancia por otra mal etiquetada, el documento publica ahora **las dos
  lecturas derivadas** y su diferencia: el gate tipa `lib` a **27/51**, y las piezas con celda
  `start` = «no se arranca (lib)» son **24/51**. *(Corregido en devolución: la primera versión
  llamaba «`lib` 24/51» a lo segundo, en el documento cuyo asunto es exactamente esa distinción.)*
- **`disco 24/51` se RETIRA: no es vieja, es falsa.** Re-medida con el patrón que el propio
  documento declara, da **33, 27, 27, 16 o 28** según qué variante del criterio se aplique (`src` vs
  dir completo, con o sin `readFile|readdir`). No se sustituye por ninguna: el criterio original no
  es recuperable, y poner un número elegido entre cinco sería inventarlo. Enrutable.
- **`puerto 30/51 · peercard 38/51`**: **NO re-medidas**. Fuera de la causa de este cambio y sin
  gate que las sostenga; se marcan con su fecha (2026-07-31) en vez de dejarlas pasar por estado de
  hoy. Enrutables, ver §8.
- **Convenciones**: se añade el párrafo que dice qué gate sostiene la columna y con qué códigos —
  aplicando la regla viva a la propia regla: *la columna la sostiene un gate, no un grep de una vez.*

---

## 6 · CA5 — censo de mutación

Tres mutaciones sobre el gate **copiado dentro del árbol temporal** (el repo no se toca). Cada
mutación **verifica que ancló** antes de correr: una mutación que no se aplica deja la probe verde
por la razón equivocada.

| # | mutación | rojo por | quién lo caza |
|---|---|---|---|
| **M1** | el parser deja de leer `kind` (todo pasa a `mcp`) | `contraste-catalogo-caduco` | **sólo el contraste** — derivación y comprobación de celdas se mueven junto al parser; el texto commiteado no |
| **M2** | el defecto histórico literal: `if (entrada) { tipo = MCP }` | `tipo-vs-kind` | **sólo la comprobación de celdas** — contraste y parser siguen sanos |
| **M3** | el health vuelve al literal `/mcp/health` | `health-vs-healthpath` | **sólo la comprobación de celdas** |

Los tres exigen `exit ≠ 0` **y** el código concreto, no sólo el código de salida. Que cada mutante
lo cace un oráculo **distinto** es la prueba de que ninguno de los dos sobra.

---

## 7 · CA4 — cero regresión en el denominador, y quién lee las cifras

- **Denominador 51/51 y trazable**: `filas 51 · ok=true · fallos=0`, y `EXPECTED_TOTAL` intacto. Los
  dos CA verdes de árbol vivo y árbol commiteado siguen pasando, incluida la **igualdad byte a byte**
  de sus JSON.
- **Quién consume el JSON del gate** (`grep -rn "buildJson\|celdas\.tipo\|celdas\.health\|matriz-51.*--json"`,
  sin `node_modules`): **sólo `test/gates/matriz-51.test.mjs`**. Ningún otro gate, script o workflow
  lee `tipo` ni `health`.
- **Quién lee `MATRIZ-RUNTIME-51.md`** (`grep -rn "MATRIZ-RUNTIME-51"`): sólo el propio gate (como
  `CONTRASTE_PATH`) y prosa de `plan/`. Ninguna de las cifras que moví la lee código.
- **Cómo llega el gate a CI**: `.github/workflows/ci.yml:47` corre `npm run test:gates`.
  **`npm run gates` (`scripts/gates/run.mjs`) NO incluye `matriz-51`** — el gate llega a CI sólo por
  su fichero de test, que sí asevera `exit 0` sobre los dos árboles. Dicho por si alguien lo daba por
  incluido.
- **`packages/mesh/mcp-launcher/src/catalog.mjs`**: 0 cambios (`git show --stat` lo confirma).

### Verificación

```
$ node --test test/gates/matriz-51.test.mjs
# tests 25 · pass 25 · fail 0 · skipped 0

$ node --test test/gates/*.test.mjs          # = npm run test:gates
# tests 93 · pass 93 · fail 0 · skipped 0

$ git status --porcelain | wc -l
0
```

`93/93` con `git status` a **0 líneas**: la suite no muta el árbol, así que el guardián de U252 sigue
en pie con los tests nuevos dentro de su barrido.

---

## 7-bis · Lo que cambió en la devolución

Dos bloqueantes, los dos ciertos, y ninguno movió una cifra.

- **B1 — la rama que sostenía §1.c no la ejercitaba ningún test.** Cierto y grave: con
  `claim === CLAIM_SI && reales.length === 0` neutralizada, la suite entera seguía verde y el gate
  volvía a la ceguera. Lo sostenía **una medida a mano de este reporte**, que es literalmente lo que
  el propio contraste prohíbe tres párrafos más arriba. Cerrado con **cinco tests rojos de unidad**
  sobre `compararContrasteCatalogo` (ya exportada; el gate no se movió por ellos): afirmar entrada
  inexistente · no nombrar todos los ids · `-mixto` · `kind`/`health` anotados ≠ declarados · celda
  afirmativa sin cita. Cada uno con su control verde al lado.
- **B2 — la aritmética se autorrefutaba**: «U234 (3)» sumaba 8 para explicar 9 celdas. Medido con
  `git log -S"id: 'launcher'"`: U234 (`c109948`) dio de alta **cuatro**. Corregido en el documento,
  en el fixture y aquí.

Y de los menores, cerrados: `-mixto` **sí** se puede fabricar (frase corregida y vector corriendo) ·
`healthPath: ''` ya no miente en la evidencia —**sin endurecer el parse**, la diferencia va en la
cadena `motivo` y no en el valor, que sigue siendo el del runtime— · la clave duplicada está
declarada con su mitigación real (`no-dupe-keys` por `js.configs.recommended`, `npm run lint` en CI)
· el ejemplo del `bin` baja de tono porque **no** lo caza · la rama muerta `declaradaServicio` está
declarada como tal · el comentario falso sobre `-mixto` está corregido **y el agujero cerrado** con
`catalogo-kind-mixto`, que denuncia incondicionalmente · el vector tiene **suelo (9 y 7)** y una
**huella `sha256`** de sus datos · una celda afirmativa sin cita `ruta:línea` ya enrojece.

## 8 · Límites y enrutables (dicho, no escondido)

1. **`lint` no se pudo ejecutar aquí**: este worktree no tiene `node_modules` (por eso los gates son
   parses autocontenidos). Se comprobó `node --check` en los tres ficheros. `npx eslint` se intentó
   —**declarado**— y falló por `@eslint/js` ausente; no se instaló nada.
2. **`packages/mesh/mcp-launcher/test/catalog.test.mjs` no se ejecutó** por lo mismo (`catalog.mjs`
   importa `@zeus/presets-sdk/env`). No se tocó ninguno de los dos ficheros.
3. **Las citas `ruta:línea` siguen siendo volátiles en el NÚMERO**, a conciencia: atar líneas
   exactas convertiría cualquier edición del catálogo en un rojo mecánico. Lo que sí se atornilló en
   la devolución es que la cita **exista y tenga forma** (`ruta.ext:línea`): antes, una celda
   afirmativa sin ninguna cita pasaba verde. **Lo que sigue sin comprobarse es que el fichero
   citado exista** — se vigila la forma, no el destino.
4. **Clave duplicada: fallo abierto declarado.** El parser es de regex y toma la PRIMERA aparición;
   JS se queda con la ÚLTIMA. `{ kind: 'service', kind: 'mcp' }` se lee `service` y vale `mcp`. Lo
   mitiga **de hecho, no por diseño**, `no-dupe-keys` (vía `js.configs.recommended` en
   `eslint.config.mjs`, `npm run lint` en CI): un catálogo así no llega a merge. Escrito en el
   docblock de `parseSeedEntries` para que se sepa de qué depende.
5. **`compararCeldasConKind` no vigila las ocho ramas de precedencia.** Medido: subir la rama `bin`
   por delante del catálogo deja el gate verde, porque hoy ninguna pieza de catálogo declara `bin`.
   La frase del docblock que prometía más de eso está corregida.
6. **`healthDe()` es punto ciego compartido**: derivación y `health-vs-healthpath` la llaman las dos,
   así que un defecto dentro de ella no lo ve esa comprobación — lo ve el contraste. Es la asimetría
   que justifica los dos oráculos, y ahora está escrita en los dos sitios.
7. **Rama sin efecto hoy**: `declaradaServicio → servicio` es código muerto en el estado actual
   (`@zeus/socket-server` llega igual por `tieneStart`); sólo cambia la EVIDENCIA, y cubre el caso de
   una entrada `kind:'service'` sin `start`, que hoy no existe. Declarado en el propio código.
8. **`puerto 30/51 · peercard 38/51`** siguen siendo medidas del 2026-07-31 sin gate que las
   sostenga; **`disco 24/51` se retira por falsa** (5 lecturas distintas del criterio declarado).
   Enrutable P2: o se les da criterio único y gate, o se retiran.
9. **El censo de mutación ancla en fragmentos literales del gate commiteado.** Si alguien reescribe
   esas tres líneas, los tests dan un rojo que **nombra la causa** («la mutación no ancla en el gate
   commiteado… actualiza MUTANTES»). Ruidoso a propósito: un ancla muerta deja el censo vacuo, que es
   lo que U252 aprendió a no tolerar. Lo mismo vale para la huella `sha256` del vector.

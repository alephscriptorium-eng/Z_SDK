# WP-U264 · Nada en CI podía cazar un `.d.ts` corrompido

Rama `wp/u264-ci-caza-declaracion-corrupta` · worktree `C:/S_LAB/wt/z-u264` ·
base `c005196` · Node `v22.21.1` · npm `10.9.4` · Windows 11.

**Cerrado**: CA1, CA2, CA4 (con excepción declarada y medida), CA5.
**Abierto**: CA3 — no puedo empujar, así que la comprobación en CI queda ⏳ con
el vector preparado (§7).

**El hallazgo que no estaba en el encargo**: cablear `types/check.mjs` a CI tal
y como estaba habría metido **13 negativos vacíos**. Bajo un árbol de `npm ci`
de verdad, los 13 `must-fail` de U245 salían `PASS … rejected` **por errores de
los 84 `@types/*` ambientales del monorepo**, no por las declaraciones. Medido
en §4, con el guardián desactivado y todo.

---

## 1 · Re-medición de la deuda antes de tocar nada

### 1.1 El gate es ciego (CA de partida)

Copia real del paquete (manifiesto + `types/` + `schemas/`), se corrompe **un**
fichero, se corre el gate de U245:

```
$ node scratchpad/m1-repro.mjs
[vacia] types/model.d.ts = 0 bytes · gate.ok=true · findings=0 · declarations=50
[rota]  types/model.d.ts = 400 bytes · gate.ok=true · findings=0 · declarations=50
```

Y `tsc` sobre esas mismas dos copias:

```
$ node .../typescript/bin/tsc --noEmit --module NodeNext --moduleResolution NodeNext \
    --strict --target ES2022 --lib ES2022 types/*.d.ts        # copia [vacia]
types/loader.d.ts(13,63): error TS2306: File '…/types/model.d.ts' is not a module.
types/loader.d.ts(35,19): error TS2306: File '…/types/model.d.ts' is not a module.
types/resolve.d.ts(25,8):  error TS2306: File '…/types/model.d.ts' is not a module.
types/resolve.d.ts(45,8):  error TS2306: File '…/types/model.d.ts' is not a module.
EXIT=2

                                                              # copia [rota]
types/model.d.ts(8,55): error TS1010: '*/' expected.
EXIT=2
```

Confirmada. `EXIT=0` en el gate, `EXIT=2` en `tsc`, sobre el mismo árbol.
(El BACKLOG citaba `TS1138`; con el corte que usé sale `TS1010` / `TS1005`.
Es la misma familia `TS1xxx` —gramática—, y así lo asevera el test, no por
número exacto.)

### 1.2 Nadie compilaba nada

`types:check` **no existe como script**: U245 lo retiró del manifiesto (su §M10).
Lo único que compilaba era `test/types/check.mjs`, invocado a mano.

```
$ grep -rn "types:check" --include=*.json --include=*.yml .  --exclude-dir=node_modules
(sólo prosa: BACKLOG.md y el reporte de U245; ni un script, ni un workflow)
```

`ci.yml:164-165` es `npm test -w "${{ matrix.workspace }}"`, y el `test` del
paquete es `node --test test/*.test.mjs`. Nada llamaba a `check.mjs`.

---

## 2 · La vía propuesta, medida

`typescript` como devDependency del paquete + `test/types.test.mjs` bajo
`node --test`. **Funciona**, y éstas son las cuatro medidas que lo sostienen.

### 2.1 El lockfile SÍ hay que tocarlo — no hay vuelta

```
$ npm ci --dry-run
npm error code EUSAGE
npm error `npm ci` can only install packages when your package.json and
npm error package-lock.json … are in sync.
npm error Missing: typescript@5.9.3 from lock file
EXIT=1
```

### 2.2 …y el coste es 17 líneas que no mueven nada

```
$ npm install --package-lock-only --ignore-scripts --no-audit --no-fund
up to date in 6s
$ git diff --stat package-lock.json
 package-lock.json | 17 +++++++++++++++++
```

Las 17 son **puras altas**, cero bajas, cero reescrituras:

```
+      "devDependencies": { "typescript": "5.9.3" }
+    "packages/engine/linea-kit/node_modules/typescript": {
+      "version": "5.9.3",  … "dev": true,  "bin": { "tsc": "bin/tsc", … }
```

Lo importante es lo que **no** cambia: `node_modules/typescript` (la raíz)
sigue en `4.9.5` intacto y **ningún otro paquete cambia de resolución**, porque
npm **anida** el 5.9.3 bajo el paquete en vez de re-izar nada. Verificado con
un `npm ci` de verdad, no con el `--dry-run`:

```
$ npm ci --no-audit --no-fund
added 2699 packages in 3m
EXIT=0
$ node -p "require('./node_modules/typescript/package.json').version"                        → 4.9.5
$ node -p "require('./packages/engine/linea-kit/node_modules/typescript/package.json').version" → 5.9.3
```

### 2.3 La matriz lo cubre sin tocar el workflow

`@zeus/linea-kit` ya es fila de la matriz (`ci.yml:82`, la metió U256) y su
`test` es `node --test test/*.test.mjs`. Un fichero llamado `test/types.test.mjs`
entra por el glob. **`.github/workflows/` no se toca** — el ALCANCE se respeta.

### 2.4 Por qué el pin es EXACTO y no `^5.9.3`

Porque medí lo que pasa cuando el compilador «flota». `check.mjs` buscaba `tsc`
**andando hacia arriba**, y hacia arriba de este paquete vive un
`typescript@4.9.5` transitivo (`node_modules/typescript`, `devOptional`, lo
arrastran `typescript-json-schema ~4.9.5` y `@asyncapi/generator ^4.9.3`).
Con ése:

```
$ node test/types/check.mjs --tsc <typescript@4.9.5>/bin/tsc
FAIL consumer-nodenext — tsc exit 2
main.ts(137,66): error TS1005: ';' expected.          ← no sabe leer `with { type: 'json' }`
FAIL consumer-bundler — tsc exit 2
tsconfig.json(9,5): error TS5023: Unknown compiler option 'verbatimModuleSyntax'.
PASS must-fail/b2-from.ts — rejected …               ← y los 13 siguen diciendo PASS
EXIT=1
```

Y encima el árbol del operador tiene `5.9.3` en la raíz, o sea que **el lock y
el disco discrepan**: U245 midió con 5.9.3 y CI habría corrido con 4.9.5. El
pin exacto mata la lotería; la guarda del §3.1 mata el silencio si algún día
se rompe.

---

## 3 · Lo entregado

### 3.1 `test/types.test.mjs` (nuevo) — seis casos

| # | qué asevera |
| --- | --- |
| 0 | el centinela `__sin-tipos-ambientales__` **no existe** (ver §3.6) |
| 1 | el compilador **es el que el paquete fija** (`devDependencies.typescript`), resuelto con la resolución de Node desde el paquete. Sin compilador **no se auto-omite: enrojece** |
| 2 | control del banco: la copia **sin mutar** compila limpia y siguen siendo **50** declaraciones |
| 3 | vector `vacía` sobre `types/model.d.ts` → `TS2306` |
| 4 | vector `vacía` sobre `types/index.d.ts` (**barril raíz**, subpath `.`) → `TS2306` |
| 5 | vector `rota` sobre `types/model.d.ts` → `TS1xxx` |
| 6 | vector `rota CON la nota puesta` sobre `types/schemas/volumes.json.d.ts` → `TS1xxx`. **El hueco de la pierna J** (§8.4) |
| 7 | `types/check.mjs` entero: los 2 consumidores y los **13** `must-fail`, cada uno nombrado en la salida |

**Atribución del rojo** (3,4,5,6), anclada tras la contrarrevisión: **todos** los
errores tienen que ser atribuibles al objetivo, y «atribuible» es que `tsc`
sitúe el diagnóstico **en** el fichero (`<ruta>(lin,col):`, la vía de la
declaración *rota*) **o** lo cite como **sujeto** del mensaje
(`File '…' is not a module`, la vía de la *vacía*, que se informa en la
posición de quien la importa). Las dos vías hacen falta; una subcadena de la
línea entera no basta, porque admitiría un error ajeno que mencionara el
objetivo de pasada.

**Y la aserción CA5 va contra una línea base, no contra `ok === true`.** Pedir
que el gate viejo esté limpio ataría los vectores al estado del árbol vivo: con
una declaración de schema vacía en el paquete, los tres enrojecían **culpando a
lo que no era**. Lo que se le pide ahora es que diga **exactamente lo mismo**
sobre la copia corrompida que sobre una intacta — eso es «no se ha enterado», y
se sostiene sea cual sea la línea base. Medido en §5, D8.

### 3.2 `test/types/corrupt/` (nuevo) — los vectores guardados

`vacia.d.ts.vector` (0 bytes), `rota.d.ts.vector` (707 bytes, `model.d.ts`
cortado a la mitad), `rota-con-nota.d.ts.vector` y un `README.md`. Sufijo
`.vector` a propósito: son **contenido**, no declaraciones vivas, y así ningún
`tsc -p` ni barrido de `.d.ts` los carga por accidente.

**El tercero cubre el bloque de 19 que los otros dos no tocaban.** Conserva el
docblock **entero y bien cerrado** —o sea que la pierna J del gate queda
satisfecha **de verdad**, no por accidente— y rompe el código de debajo. Es el
único de los cuatro vectores que cae sobre el comodín `./schemas/*`:

```
GATE  ok=true  []  decls=50        ← la pierna J está contenta y no lo ve
TSC   exit=2   3 errores, los tres en types/schemas/volumes.json.d.ts
```

Lo destapé **al acotar la frase del §8.4** y lo declaré sin vector; la
contrarrevisión pidió el vector, con razón: *un guardián sin negativo no está
verificado*, y aquí el mecanismo cazaba algo que nada fijaba. Verificado en
las dos direcciones (§5, D9 y D10).

### 3.3 El `probe.ts`, que no es adorno

Compilar las 50 declaraciones **no basta**, y está medido:

```
===== sin probe =====
  [sin mutar]                          exit=0
  [model.d.ts VACIA]                   exit=2 :: TS2306 …
  [index.d.ts VACIA (barril de entrada)] exit=0     ←←← FALSO VERDE
  [curation.d.ts VACIA]                exit=2 :: TS2306 …
===== con probe =====
  [index.d.ts VACIA (barril de entrada)] exit=2 :: probe.ts(1,21): error TS2306: File 'types/index.d.ts' is not a module.
```

Un fichero vacío es un **script válido**. `types/index.d.ts` es el barril raíz
—lo apunta el subpath `.`— y **no lo importa nadie**, así que vacío compila
limpio. Sólo enrojece si alguien lo importa. El test genera un `probe.ts` que
importa las 50 declaraciones una a una.

> **Esta justificación está INFRA-declarada, y lo midió la contrarrevisión, no
> yo.** Yo lo sostengo con el barril raíz, como si fuera un caso de esquina.
> Vaciando las **50** declaraciones una a una: **0 de 50 escapan con probe,
> 25 de 50 sin él**. El `probe.ts` no salva un caso: sostiene **la mitad de la
> superficie**. Atribución en §5.1.

### 3.4 `test/types/check.mjs` (modificado) — ver §4

### 3.5 `test/gate-exports-types.mjs` (modificado) — **100% prosa**

Sólo la cabecera: la deuda ya no está abierta y la cita `TS1138` se corrige a
`TS1005`. Verificado que no hay ni una línea de código en el diff:

```
$ git diff -U0 …/gate-exports-types.mjs | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)|^[+-] \*"
(vacío)
```

### 3.6 El centinela `__sin-tipos-ambientales__`, aseverado

El mecanismo 1 del §4 es un `--typeRoots` apuntando a un directorio que **tiene
que no existir** — es la única forma de escribir `"types": []` en la CLI. Eso
lo hace desarmable con un `mkdir`: si alguien lo crea, vuelven los 84 `@types/*`
y **tanto los vectores como los 13 negativos revierten al estado vacuo sin que
nada se ponga rojo**. Un solo centinela (`test/types/__sin-tipos-ambientales__`,
compartido por los dos ficheros) y dos guardas que exigen su ausencia:
`assert` en `types.test.mjs` y salida 1 en `check.mjs`. Comprobado en §5, D7.

---

## 4 · El hallazgo: los 13 negativos de U245 eran **vacíos** bajo `npm ci`

Aplicando CA5 al trabajo heredado, no sólo al mío.

`check.mjs` compilaba cada `must-fail/*.ts` con flags sueltos, **sin** el
`"types": []` que sí tienen los dos `tsconfig.json` de los consumidores. Tras
`npm ci` el monorepo instala **84 paquetes `@types/*`** en la raíz, y `tsc` los
mete todos en el programa. Con `--lib ES2022` (sin DOM), la cuenta sobre
`b2-hop.ts` es **181 líneas de error**, repartidas así:

```
$ node …/tsc test/types/must-fail/b2-hop.ts --noEmit --module NodeNext … --lib ES2022
exit=2  6.4s   lineas con error TS = 181   ficheros distintos = 37
  44  ../../../node_modules/@types/webxr/index.d.ts
  17  ../../../node_modules/@types/d3-selection/index.d.ts
  17  ../../../node_modules/@types/eslint-scope/index.d.ts
  15  ../../../node_modules/@types/three/src/audio/Audio.d.ts
  14  ../../../node_modules/@types/web-bluetooth/index.d.ts
  10  ../../../node_modules/@types/eslint/index.d.ts
  …
   2  ../../../node_modules/@types/d3-array/index.d.ts
   1  test/types/must-fail/b2-hop.ts          ← el único que este control mira
```

**180 de 36 ficheros ajenos + 1 del propio fichero.** La causa es el conjunto
de 84 paquetes ambientales bajo `--lib ES2022` sin DOM, **no** ninguno en
concreto: el mayor es `@types/webxr` con 44 y `@types/d3-array` sólo aporta 2
— salía impreso porque **ordena primero**, no porque pesara.

*(La versión anterior de este reporte **y el comentario de `check.mjs`**
atribuían los 181 a `d3-array`. El total era correcto; la atribución, no. Lo
cazó la contrarrevisión, y por qué importa que estuviera **en el comentario**
está en §5.2.)*

**Y la vacuidad no era de un fichero: era de la pierna entera.** Yo la demostré
sobre `b2-hop.ts`; la contrarrevisión neutralizó **los trece uno a uno** bajo
la configuración tal como se fusionó U245 — **13 de 13 verdes vacíos** (§5.1).

`check.mjs` sólo miraba `run.status !== 0`. **Guardián desactivado** —
`b2-hop.ts` reemplazado por algo que compila limpio:

```
$ printf 'export const inocuo: string = "ya no muerde";\n' > test/types/must-fail/b2-hop.ts
$ node test/types/check.mjs --tsc node_modules/typescript/bin/tsc
PASS must-fail/b2-hop.ts — rejected :: ../../../../../node_modules/@types/d3-array/index.d.ts(857,38): error TS2304: Cannot find name 'ImageData'.
EXIT=0
```

**Verde.** Un control negativo que ya no controla nada, informado como que sí.
Sólo parecía correcto en un árbol **sin `@types` instalados** — que es
exactamente el árbol en el que se escribió, y nunca el árbol de CI.

### El arreglo, en dos mecanismos independientes

1. **`--typeRoots <dir inexistente>`** en `MUST_FAIL_FLAGS`. La CLI no sabe
   escribir `"types": []`; apuntar `typeRoots` a un directorio que no existe es
   la forma de decirlo. `181 errores → 1`, y `6.4s → 0.9s`.
2. **La aserción de atribución**: no basta con salir != 0, el error tiene que
   **nombrar el fichero bajo prueba**. Si no, `FAIL … rejected, but NOT by
   anything in the file`.

Son independientes a propósito, y lo comprobé desactivando el primero y
dejando el segundo (§5, D6).

Coste medido del arreglo: `check.mjs` completo pasó de **2m18s a ~19s**, y
`test/types.test.mjs` de **187s a 26s**.

---

## 5 · CA5 · cada negativo con su guardián desactivado

Ningún negativo se da por bueno sin ver que **enrojece por lo que dice**.

| # | guardián desactivado | resultado | prueba |
| --- | --- | --- | --- |
| D1 | `typescript` fuera (`mv node_modules/typescript …`) | **6/6 rojos**, ninguno omitido | `not ok 1 … 'typescript no está instalado para este paquete (… MODULE_NOT_FOUND). … Este test NO se auto-omite a propósito'` |
| D2 | el 4.9.5 transitivo en lugar del pin | **1 y 6 rojos, 2-5 verdes** | `not ok 1 … 'typescript resuelto = 4.9.5, fijado = 5.9.3 …'` · `not ok 6 … main.ts(137,66): error TS1005` |
| D3 | la inyección del vector (no se corrompe nada) | **3, 4 y 5 rojos**, cada uno con SU causa | `not ok 3 … 'tsc salió 0: la declaración corrupta pasó entera. Causa esperada: TS2306 …'` |
| D4 | el `probe.ts` fuera del compilado | **sólo el 4 rojo** | `not ok 4 … types/index.d.ts corrompida … y tsc salió 0` (3 y 5 siguen verdes: los caza su importador real) |
| D5a | un `must-fail` retirado de la carpeta | **6 rojo** | `'U245 dejó 13 controles negativos y quedan 12'` |
| D5b | `b2-hop.ts` reemplazado por algo que compila | **6 rojo** | `FAIL must-fail/b2-hop.ts — COMPILED. The declaration stopped biting.` |
| D6 | sólo `--typeRoots` fuera, atribución puesta | **6 rojo** | `FAIL must-fail/b2-hop.ts — rejected, but NOT by anything in the file` |
| D7 | el centinela **creado** (`mkdir __sin-tipos-ambientales__`) | **rojo en los dos sitios** | `not ok 0 … EXISTE, y su único trabajo es faltar` · `check.mjs` → `FAIL … EXISTS. It is a sentinel` `EXIT=1` |
| D8 | una declaración de schema **vacía en el árbol vivo** | rojos 2, 3, 4 y 6; la aserción CA5 dispara **0 veces** | `hay errores que no se sitúan en types/model.d.ts ni lo citan como sujeto` + `probe.ts(53,25): TS2306: File 'types/schemas/volumes.json.d.ts' is not a module.` |
| D9 | la inyección del vector `rota-con-nota` (no se corrompe nada) | **7 rojo** con SU causa | `types/schemas/volumes.json.d.ts corrompida con rota-con-nota.d.ts.vector y tsc salió 0 … Causa esperada: TS1xxx — gramática rota mientras la nota del atributo sigue puesta` |
| D10 | **la nota del propio vector** borrada | **7 rojo**, y por la aserción CA5 | `el gate existsSync SÍ nota este vector: [{"leg":"J","code":"attribute_contract_missing", …}]` |

**D2 y D4 son los que más dicen.** D2 porque separa quién caza qué: el
compilador equivocado lo caza la guarda 1, **no** los vectores (2-5 siguen
verdes con 4.9.5, o sea que sin esa guarda el pin podría pudrirse en silencio).
D4 porque aísla el `probe.ts` a **un solo** vector: si hubiera enrojecido los
tres, el probe estaría tapando el mecanismo real de los otros dos.

**D10 es el que hace honesto al vector nuevo.** Sin él, que el gate viejo dijera
`ok` sobre la copia con la nota puesta podría ser casualidad. Borrándole la nota
al vector, la pierna J **sí** dispara y la aserción CA5 lo caza: o sea que la
ceguera medida es exactamente «J satisfecha y aun así no lo ve», que es lo que
el vector afirma.

**D8 es el que exigió la contrarrevisión y el que más cambió el diseño.** Antes,
la aserción CA5 pedía `gate.ok === true` sobre la copia corrompida; con una
declaración de schema vacía en el árbol vivo, los tres vectores enrojecían
**culpando al gate** de algo que no había hecho. Ahora el gate se compara
contra su propia línea base, la aserción **no dispara ninguna vez**, y quien
enrojece es la atribución — nombrando `types/schemas/volumes.json.d.ts`, que es
el fichero que de verdad está roto.

**D5b es el mismo experimento que en §4, y ahí está la diferencia**: antes del
arreglo salía `PASS`/`EXIT=0`; ahora sale `FAIL`/`EXIT=1`.

### 5.1 Medidas de la contrarrevisión adversarial — no son mías

Estas tres las midió **la contrarrevisión adversarial**, no este worker, y van
aquí porque son **evidencia más fuerte que la que yo aporté**. Se separan a
propósito para que dentro de seis meses se pueda leer **quién midió qué**.

| medida | quién | qué añade sobre lo que yo medí |
| --- | --- | --- |
| **13 de 13 negativos vacíos** | contrarrevisión | Yo demostré la vacuidad **sobre un caso** (`b2-hop.ts`). La contrarrevisión neutralizó **los trece uno a uno** bajo la configuración **tal como se fusionó U245**: 13/13 verdes vacíos. El hallazgo no era una anécdota de un fichero, era la pierna entera |
| **Los dos mecanismos, en las DOS direcciones** | contrarrevisión | Yo medí una dirección (D6: `typeRoots` OFF, atribución ON). Faltaba la otra. La matriz completa: `typeRoots OFF + atribución ON` → `rejected, but NOT by anything in the file` · `typeRoots ON + atribución OFF` → `COMPILED. The declaration stopped biting` · **ambos OFF (= U245)** → `PASS` vacuo. Son independientes de verdad, no defensa en profundidad de adorno |
| **25 de 50 dependen del `probe`** | contrarrevisión | Ésta **me favorece y no la sabía**. Yo justifico el `probe.ts` con el barril raíz (§3.3). Vaciando las 50 declaraciones una a una: **0 de 50 escapan con probe, 25 de 50 sin él**. Mi justificación estaba **infra-declarada**: el probe no sostiene un caso, sostiene **la mitad de la superficie** |

La contrarrevisión verificó además el **runtime CERO contra tres puntos** —
`HEAD`, `main` y el commit con el que se selló U245 — y las tres afirmaciones
de la excepción del lockfile (§2.2), incluida la disposición en disco que
**sólo produce una instalación real**.

### 5.2 La lección, que no es el detalle

El menor ① de la contrarrevisión —la atribución falsa de los 181 errores a
`@types/d3-array`— **no era un error de prosa del informe**. La cita vivía en
el **comentario de `check.mjs`**, así que se habría propagado **desde el
código**.

Es la **tercera vez** en esta jornada que una cita rancia viaja en una
**cabecera** en vez de en un informe, y las tres veces ha sido peor por eso:
**un informe lo lee quien va a buscarlo; una cabecera se la cuenta a todo el
que toque el fichero.** U245 ya lo vio en su segunda devolución, cuando su
referencia falsa a `WP-U246` resultó estar en la cabecera del gate y no sólo en
el reporte. Sigue pasando.

---

## 6 · Verde completo

```
$ ZEUS_VOLUMES_ROOT=$(pwd)/VOLUMES npm test -w @zeus/linea-kit
# tests 67   # suites 19   # pass 67   # fail 0   # skipped 0
EXIT=0
```

Con detalle del fichero nuevo:

```
ok 1 - el centinela `__sin-tipos-ambientales__` NO existe
ok 2 - el paquete FIJA su compilador y es ése el que se usa
ok 3 - la copia SIN mutar compila limpia (el banco no es la causa del rojo)
ok 4 - vector vacía · declaración transitiva (types/model.d.ts) ENROJECE
ok 5 - vector vacía · barril de entrada (types/index.d.ts, subpath ".") ENROJECE
ok 6 - vector rota · declaración truncada (types/model.d.ts) ENROJECE
ok 7 - vector rota CON la nota puesta · schema del comodín (types/schemas/volumes.json.d.ts) ENROJECE
ok 8 - los negativos y los consumidores de U245 corren aquí, no sólo a mano
```

Resto:

| orden | salida |
| --- | --- |
| `node scripts/verificacion-paridad.mjs` | `paridad OK · 13 paso(s)` · `matriz OK · test: workspace×27 include×3` · `EXIT=0` |
| `npm run lint` | `20 problems (0 errors, 20 warnings)` · `EXIT=0` · **ningún aviso en `linea-kit`** |
| `npm run gates` | `gates: OK (0 offenders)` · `EXIT=0` |
| `npm run test:gates` | `# tests 160 # pass 159 # fail 0` · `EXIT=0` |
| `node test/gate-exports-types.mjs` | `PASS … 10 subpaths, 50 declarations` · `EXIT=0` |
| `npm pack --dry-run` | `total files: 104` · **0** coincidencias de `types.test`/`corrupt`/`must-fail`/`check.mjs` |
| `npm ci --dry-run` | `EXIT=0` (manifiesto y lock en sincronía) |

**Coste en CI**: la fila `test @zeus/linea-kit` pasa de 59 a 65 tests. Medido en
esta máquina: 9,3s → 14,6s (mejor caso) y hasta ~34s en frío. El grueso es
`check.mjs`, 15 invocaciones de `tsc`.

### Diff de runtime CERO — el invariante de U245, intacto

```
$ git rev-parse HEAD:packages/engine/linea-kit/{src,schemas,bin}
src      b2e67b41b19d2292191977755413b89df4120ac2
schemas  1278f99089cefae45c427818670f6fe2db1e4536
bin      fb1f4c490f6757b57535702e5f26caea2751f6b6
$ git diff --stat HEAD -- .../src .../schemas .../bin
(vacío)
```

Los tres coinciden con los que el orquestador selló al aceptar U245.

### El diff completo

```
 package-lock.json                                  | 17 +   (la excepción, §2.2)
 packages/engine/linea-kit/package.json             |  3 +   (devDependencies)
 packages/engine/linea-kit/test/gate-exports-types.mjs | 11 +/- (100% prosa)
 packages/engine/linea-kit/test/types/check.mjs     | 38 +/-
 packages/engine/linea-kit/test/types.test.mjs         (nuevo)
 packages/engine/linea-kit/test/types/corrupt/         (nuevo: 2 vectores + README)
```

**Excepción declarada (CA4)**: `package-lock.json` está **fuera** del
ALCANCE_DIFF y U245 tenía prohibido tocarlo. *Razón*: `npm ci` es EUSAGE sin él
(§2.1) — la vía que el encargo pidió medir primero no existe sin esa línea.
*Coste*: 17 líneas de alta pura, sin bajas, sin re-izado, sin cambio de
resolución para ningún otro paquete (§2.2). **Cero dependencias nuevas fuera
del paquete.**

---

## 7 · CA3 ⏳ · lo que NO puedo cerrar

**No puedo empujar** (prohibición explícita), así que no hay `run-id` de rojo
plantado ni de verde posterior. La rama **no está en el remoto**:

```
$ git ls-remote --heads origin wp/u264-ci-caza-declaracion-corrupta
(vacío)
$ gh run list --limit 1
completed  success  aceptacion(U265)…  CI  main  push  30741103258
```

**Vector preparado** para que el orquestador lo plante en una orden:

```bash
# ROJO — corrompe una declaración de verdad y empuja
cp packages/engine/linea-kit/test/types/corrupt/vacia.d.ts.vector \
   packages/engine/linea-kit/types/model.d.ts
git commit -am "vector U264: declaracion vacia" && git push

# VERDE — revierte
git revert --no-edit HEAD && git push
```

**Lo que sale, ejecutado ya en local sobre el paquete real** (no es una
predicción; corrido y revertido con `git checkout -- types/model.d.ts`):

```
ok 1 - el centinela `__sin-tipos-ambientales__` NO existe
ok 2 - el paquete FIJA su compilador y es ése el que se usa
not ok 3 - la copia SIN mutar compila limpia (el banco no es la causa del rojo)
      probe.ts(13,24): error TS2306: File '…/types/model.d.ts' is not a module.
      types/loader.d.ts(13,63): error TS2306: File '…/types/model.d.ts' is not a module.
      types/resolve.d.ts(25,8):  error TS2306: File '…/types/model.d.ts' is not a module.
      (+5 más, todas nombrando types/model.d.ts)
ok 4 - vector vacía · declaración transitiva (types/model.d.ts) ENROJECE
not ok 5 - vector vacía · barril de entrada (types/index.d.ts, subpath ".") ENROJECE
      hay errores que no se sitúan en types/index.d.ts ni lo citan como sujeto
ok 6 - vector rota · declaración truncada (types/model.d.ts) ENROJECE
ok 7 - vector rota CON la nota puesta · schema del comodín (…/volumes.json.d.ts) ENROJECE
not ok 8 - los negativos y los consumidores de U245 corren aquí, no sólo a mano
EXIT=1

$ node test/gate-exports-types.mjs
PASS gate exports↔declarations — 10 subpaths, 50 declarations
GATE_EXIT=0                       ← el gate viejo no lo nota. Ésa es la deuda.
```

Tres cosas que conviene entender del rojo, porque no son obvias:

- **Quien caza la corrupción del paquete real es el control (test 3)**, no los
  vectores: éstos trabajan sobre una **copia** y le aplican SU mutación encima.
  Los que apuntan a `model.d.ts` (4 y 6) siguen verdes porque ya ven lo que
  esperaban. Y `check.mjs` cae por los consumidores (test 7).
- **El 5 enrojece por la aserción de atribución nueva**, no por su vector:
  apunta a `index.d.ts` y se encuentra además los errores de `model.d.ts`, que
  no le pertenecen. El mensaje lo dice con esas palabras en vez de fingir que
  el vector falló. Los vectores **de gramática** (6 y 7) se quedan verdes
  porque un error de sintaxis hace que `tsc` **no llegue a la fase semántica**:
  su único error es el suyo, y por tanto todo lo que ven es atribuible.
- **El gate `exports-types` se queda VERDE** con sus `50 declarations`. No es un
  fallo: es la ceguera declarada de U245 sobre las 31 no-schema (§8.4), y los
  vectores la aseveran a propósito comparándola contra su línea base.

---

## 8 · Lo que NO cubro

1. **CA3 en CI** (§7). Medido en local con un `npm ci` real del mismo lockfile
   que usará CI, que es lo más cerca que llego sin empujar. Queda ⏳.
2. **Linux**. Todo está medido en Windows. Lo que puede diferir: las rutas que
   `tsc` imprime. Las aserciones parsean la posición del diagnóstico y
   normalizan `\` a `/` antes de comparar, y comparan por sufijo de ruta
   (`=== target` o `endsWith('/' + target)`), así que no dependen de que la
   ruta sea relativa o absoluta. No lo he podido ejecutar en Linux.
3. **Una declaración que compila pero MIENTE.** Estos vectores comprueban que
   la declaración **existe de verdad**; que siga **mordiendo** es el eje de
   `must-fail/`, que ahora corre en CI pero cuyos 13 casos son los de U245: no
   he añadido ninguno.
4. **El bloqueante mayor de U245** (la condición `types` de `./schemas/*` apaga
   `TS1543`) sigue exactamente igual de vivo. No lo he tocado y no lo cierra
   nada de esto; lo sostienen las 19 declaraciones, la pierna J del gate y
   `test/json-import-attribute.test.mjs`.

   **Y aquí va acotada la frase que este reporte decía de más.** «El gate viejo
   es ciego a la declaración corrupta» **no vale sin cualificar**: es ciego a
   **31 de las 50**. Las **19 de `schemas/`** las cubre su **pierna J**, que
   lee la prosa buscando `with { type: 'json' }` — y un fichero vacío no la
   tiene, así que la caza. Medido:

   ```
   vaciando una declaración y preguntando al gate viejo:
     types/schemas/volumes.json.d.ts  → ok=false  ["J:attribute_contract_missing"]
     types/model.d.ts                 → ok=true   []
     types/index.d.ts                 → ok=true   []
   total 50 · de schema 19 · resto 31
   ```

   Y de las 19, lo que la pierna J **no** cubre es la declaración **rota pero
   con la nota puesta**: J sólo mira que la cadena esté, no que el fichero
   compile. Medido, rompiendo la sintaxis y conservando la nota:

   ```
   gate viejo → ok=true  []          ← no la ve
   ¿conserva la nota? true
   tsc        → types/schemas/volumes.json.d.ts(16,1): error TS1010: '*/' expected.  EXIT=2
   ```

   **Cerrado en la ronda siguiente**, a petición de la contrarrevisión y con
   razón: el mecanismo la cazaba (se compilan las 50, no una selección) pero
   **nada la fijaba**, que es justo lo que se pierde en el siguiente refactor.
   El cuarto vector, `rota-con-nota.d.ts.vector` (§3.2), es el negativo de ese
   guardián, verificado en las dos direcciones (§5, D9 y D10).

   Entre las dos comprobaciones, las 50 quedan cubiertas: la pierna J caza la
   **vacía** de las 19 de `schemas/`, y el compilado nuevo caza **la vacía y la
   rota de las 50**, con vector guardado para cada forma.
5. **El `typescript@4.9.5` transitivo de la raíz** sigue ahí. No lo he movido
   (habría sido un lockfile mucho más caro y fuera de alcance). Lo que hay es
   la guarda que enrojece si alguna vez es **ése** el que acaba compilando este
   paquete.
6. **Los otros 26 workspaces de la matriz** no tienen nada de esto. Sólo
   `linea-kit` publica declaraciones hoy.

---

## 9 · Nota para quien corra `npm ci` en un worktree

`npm ci` deja marcados como modificados tres `bin/*.mjs` de otros paquetes
(`feed-kit`, `linea-kit`, `playbook-kit`) sin cambiar su contenido: reescribe
los finales de línea y con `core.autocrlf` git los ve sucios. Uno de ellos está
dentro de la zona de **diff de runtime CERO** de U245. `git checkout --` sobre
los tres lo deshace; en este diff no viaja ninguno.

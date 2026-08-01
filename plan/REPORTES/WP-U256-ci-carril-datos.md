# WP-U256 · el carril de datos entra en CI — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U256) |
| fecha | 2026-08-01 |
| rama | `wp/u256-ci-carril-datos` · base `846f01c` |
| commit(s) | `4b8d220` obra · **ronda 2 (devolución)**: B1 (datos reales de CI), B2 (guarda), M1, M2, M6 + M3/M4/M5/M7/M8 declarados |
| alcance tocado | `.github/workflows/ci.yml` · este reporte · fila U256 de `BACKLOG.md` |
| `src/**` · `package.json` · `package-lock.json` · ficheros de test | **ninguno** |
| estado propuesto | listo para verificación de cierre |
| push | no intentado · sin merge |

> ## Retractación, primero
>
> La ronda 1 de este reporte decía cuatro veces que no se podía observar un job
> real de GitHub Actions. **Era falso.** `gh` estaba autenticado contra
> `alephscriptorium-eng/Z_SDK` desde mi propio worktree, con permiso de lectura
> de runs. No lo comprobé. Consecuencias materiales, no de forma:
>
> - **§7.4 enrutaba un WP fantasma**: de los 7 workspaces que daba por rojos,
>   **6 estaban verdes en el runner** y el rojo era de mi banco de pruebas.
> - **§8 usaba un techo de coste inventado por mi arnés** (`player-ui` «no
>   terminó en 300 s»; en el runner **dura 68 s y pasa**). El número que declaré
>   «no lo he medido y no lo invento» estaba **a un comando**.
>
> La lección es de método y va antes que el contenido: **antes de declarar «no
> se puede medir», comprueba qué herramientas tienes autenticadas.** La
> prudencia en la redacción no compensa una premisa falsa: enruta trabajo igual.
>
> Todo lo marcado **[runner]** viene de `gh run view`. Lo marcado **[banco]**
> viene de contenedor `node:22` y se declara como tal.

---

## CA de cierre

**Los dos paquetes en la matriz** — cumplido: `ci.yml:78-79`, 25 → **27**.
**El test de curación y los del driver corriendo en CI** — cumplido: entran con
sus paquetes; **176 tests**, **0 omitidos** en Linux.
**Y el arreglo es observable desde la salida de CI** — que no lo era: §2.2 y §3.2.

---

## 1 · El estado medido antes

`ci.yml:44` abre el job `test`; `:50-75` lista la matriz: **25 workspaces**, ni
`@zeus/linea-kit` ni `@zeus/volumes-ops`. Ambos son miembros de
`packages/engine/*`, así que `npm ci` **ya los instalaba**: lo que faltaba era
ejecutarlos.

| | ficheros | tests | recuento de partida |
| --- | --- | --- | --- |
| `@zeus/linea-kit` | 8 | **43** | `rc=0 · 43/43 · # skipped 0` |
| `@zeus/volumes-ops` | 12 | **133** | `rc=0 · 133/133 · # skipped 0` |
| **total** | **20** | **176** | |

Ninguna estaba roja. No había un rojo escondido: había **ausencia de vigilancia**.

---

## 2 · Qué hizo falta además de listarlos

### 2.1 · Declarar el entorno (`include`)

Listarlos bastaba para que corrieran en verde. **No** para que vigilaran (§4.1).
`ZEUS_VOLUMES_ROOT` se declara **sólo para esas dos entradas** vía `include`
(`ci.yml:86-90`, consumido en `:120` por la guarda y en `:126` por el step de
test), no en el `env` común del step: para los 25 anteriores la variable pasaría
de *no definida* a *definida*, y eso no está medido. Con `include` las otras 25
la reciben **vacía** (§5).

**Lo que aquí es documentación y no medida:** que un objeto de `include` cuyo
`workspace` coincide con un valor ya presente **añade su clave a esa combinación
en vez de crear una nueva** es comportamiento documentado de GitHub Actions; no
lo he observado en un runner. Por eso existe §2.2.

### 2.2 · Una guarda, porque el arreglo no era observable

**Devolución, y tenía razón.** Si la variable **no llega** al job, la salida de
CI es **idéntica**: mismo exit code, mismo recuento, **la misma línea `ok`**.
Reproducido (§3.2, caso D). Es decir: el entregable titular de este WP
**producía el mismo verde tanto si funcionaba como si no** — exactamente el
defecto que vine a cerrar, un escalón más arriba.

`ci.yml:109-120` añade un paso **previo** al de test (`:121`):

```yaml
- name: El carril de datos exige su root de VOLUMES (WP-U256)
  if: matrix.workspace == '@zeus/linea-kit' || matrix.workspace == '@zeus/volumes-ops'
```

El detalle que lo hace válido: el `if` se ancla en **`matrix.workspace`**, que es
un valor **original** de la matriz, y **no** en `matrix.needs_volumes_root`, que
es justo lo que se está verificando. Si el merge del `include` fallara, la guarda
**corre igual y se pone roja**, en vez de saltarse a sí misma.

Comprueba tres cosas, en orden: que la variable llegó no vacía; que apunta a un
root real (`volumes.json`); y que existe `DISK_03/FORCES/registry.json` — que es
**literalmente la precondición** que `forces-loader.test.mjs:62` consulta antes
de enmudecer. El caso mudo pasa a ser **job rojo con mensaje**.

### 2.3 · Tres bytes basura fuera (§6)

El comando de test no cambia: sigue siendo `npm test -w "${{ matrix.workspace }}"`.

---

## 3 · Los vectores

### 3.1 · Un rojo de producto tumba el job

GH ejecuta `run:` con `bash -e {0}`; el vector usa **el mismo comando** y lee su
exit code. Sobre clon nativo LF en `node:22` **[banco]**:

```
línea base                     rc=0   # pass 133  # fail 0
sello de manifest.mjs roto     rc=1   # pass 129  # fail 4     ← el step cae
revertido                      rc=0   # pass 133  # fail 0
```

| rotura deliberada | `rc` |
| --- | --- |
| `linea-kit/src/validate.mjs` — `validate()` acepta todo | **0** — no lo caza su propia suite (§7.1) |
| `volumes-ops/src/measure.mjs` — `bytes += 0` | **1** (4 fallos) |
| `assert.equal(1,2)` en `verify-integrity.test.mjs` | **1** (1 fallo, 134 tests) |

### 3.2 · La guarda discrimina — lo que el test solo no hacía

Extraído el `run:` **literal** del `ci.yml` y ejecutado con `bash -e`, como GH:

| caso | resultado |
| --- | --- |
| **A** · la variable llega | `rc=0` · `root declarado y completo: …/VOLUMES` |
| **B** · llega vacía (el `include` no aplicó) | **`rc=1`** · `::error::ZEUS_VOLUMES_ROOT no llego al job` |
| **C** · llega, pero el root no tiene `DISK_03` | **`rc=1`** · `::error::… forces-loader.test.mjs:62 vuelve a omitir en silencio` |
| **D** · *sin* guarda, A vs B desde la salida del test | **indistinguibles** |

El caso D, literal:

```
ok 1 - curation chain  # tests 43 # pass 43 # fail 0 # skipped 0    <- CON variable
ok 1 - curation chain  # tests 43 # pass 43 # fail 0 # skipped 0    <- SIN variable
```

**Acotación:** demuestro que el comando del step devuelve ≠0 y que GH marcaría el
step en rojo por su contrato. No he lanzado un job con esta rama (no hago push).

---

## 4 · Los omitidos, por nombre

### 4.1 · Dos epílogos mudos — y **son dos, no uno**

**Devolución M1, y tenía razón**: la ronda 1 presentó a
`validate-loader.test.mjs` como «el hermano bueno» y lo clasificó entre «los que
se declaran». Tiene **el mismo epílogo mudo**.

Censo del patrón (`console.*` seguido de `return;` desnudo dentro de un caso)
sobre **190 ficheros de test** del repo:

```
epilogos mudos: 2
  packages/engine/linea-kit/test/forces-loader.test.mjs:63-64
  packages/engine/linea-kit/test/validate-loader.test.mjs:193-194
```

**Dos en todo el repo, los dos en el mismo paquete.** `node --test` cuenta ambos
como **`pass`**, no como `skip`: por eso **contar omitidos no los destapa**
(`# skipped 0`).

Lo que difiere entre ellos **no es el epílogo, es el resolvedor**:

| | candidatas de root | ¿dispara el epílogo? |
| --- | --- | --- |
| `forces-loader.test.mjs:58-60` | **sólo** `../../../../../../VOLUMES` (**seis** niveles) | **sí, siempre** |
| `validate-loader.test.mjs:24-27` | seis niveles **y** cuatro | no, hoy |

La raíz del repo está a **cuatro**. Seis se pasa hasta el abuelo del repo:

| entorno | resuelve a | existe |
| --- | --- | --- |
| mi worktree | `C:\S_LAB\VOLUMES` | no |
| runner GH (`/home/runner/work/Z_SDK/Z_SDK`) | `/home/runner/work/VOLUMES` | no |

El segundo **no dispara hoy** por el fallback de cuatro niveles, pero su epílogo
sigue en pie: si el root faltara, sería un verde mudo idéntico.

**Cerrado en CI** declarando el entorno (§2.1) y **haciéndolo observable** (§2.2).
**No cerrado en el código**: mi recomendación de ronda 1 (dar a `forces-loader`
la lista de candidatas de su hermano) **deja el epílogo mudo en los dos**. La
recomendación correcta, para el WP que se lo lleve: **sustituir el `return;`
desnudo por `t.skip(motivo)` en los dos ficheros** —así el omitido se cuenta y se
nombra— y de paso arreglar el resolvedor de `forces-loader`. Fuera de mi
ALCANCE_DIFF: ninguno de los dos **falla**.

### 4.2 · Los `# SKIP` de verdad: **0 en CI**, 2 sólo en Windows

- `D-H: VALIDAR rechaza un pack con dos ficheros que colisionan por caja (solo FS sensible)` — `import-ssb-driver.test.mjs:759`
- `D-H: un DESTINO con dos ficheros que colisionan por caja no se puede planificar (solo FS sensible)` — `import-ssb-driver.test.mjs:786`

Ambos se abstienen con `t.skip()` (declarado, no fingido) porque el FS no
distingue la caja. **En Linux corren y pasan**: `# skipped 0`. CI vigila
**estrictamente más** que mi local.

### 4.3 · Cobertura acotada y declarada

`validate-loader` imprime `skipped=["DISK_01/FIREHOSE","DISK_04/SSB"]`: el repo
sólo rastrea **15 ficheros** bajo `VOLUMES/` (`DISK_02` y `DISK_03`). **CI valida
2 de los 4 discos**, y eso no lo arregla ningún cambio de CI — el material no
está en git. Ver §7.5: el dueño de `DISK_04/SSB` tampoco está en la matriz.

---

## 5 · La medida que autoriza el `include` — y hasta dónde llega

Afirmación: para los 25 anteriores, `ZEUS_VOLUMES_ROOT=''` es indistinguible de
no definirla. Ejecutados los **25**, dos veces cada uno, comparando exit code y
recuento `pass`/`fail`/`skipped`: **IGUAL en 25 de 25** **[banco]**.

**Devolución M4, y tenía razón: eso es un censo de _filas_, no de poder
discriminante.** Medido el poder real:

- **19 de 25** pueden siquiera alcanzar código que lee la variable — **4 de forma
  directa** (`presets-sdk`, `firehose-core`, `test-utils`, `linea-firehose`) y
  **15 por cierre de dependencias**.
- **6 no pueden**: `rooms`, `protocol`, `authority-kit`, `game-engine`,
  `operator-bridge`, `ui-3d-kit`. Para ellos la comparación es **vacua**.
- Y **19 es cota superior**: tener el módulo en el grafo no implica que la ruta
  de test lo ejecute. El número que de verdad discrimina es menor.
- La fila de `player-ui` **no aporta nada** en ninguna dirección: en mi banco
  terminó en timeout las dos veces (y en el runner **pasa en 2 s**, §7.4).

**Devolución M5, y tenía razón: el discriminante vacío ≠ no-definida SÍ existe.**
`presets-sdk/src/env/index.mjs:26` llama `dotenv.config({ path: envPath })` sin
`override`, y `dotenv@16.4.7` (`lib/main.js:325`) **salta toda clave ya presente
en `process.env`** — y una cadena vacía **está presente**. Es decir: con un
`.env` que definiera `ZEUS_VOLUMES_ROOT`, *vacía* impediría el relleno y
*no-definida* no. **Enunciado condicionado**: en CI es **inobservable**, porque
`.env` **no está rastreado** (sólo `.env.example`) y `loadZeusEnv` sólo llama a
dotenv `if (existsSync(envPath))`. Fuera de CI, **el discriminante existe**.

---

## 6 · Hallazgo de paso: `ci.yml` no pasaba un parser YAML

El fichero **commiteado** en `846f01c` tenía **3 bytes `CR` sueltos** tras
`- '@zeus/ping-pong-bots'`. GH los tolera; un parser estricto no:

```
PRISTINO: NO PARSEA -> UNEXPECTED_TOKEN  Unexpected scalar at node end at line 75, column 35
```

Quitados — es la única línea `-` del diff. La matriz tiene que ser legible por
máquina para que alguien pueda **aseverar** sobre ella (este mismo reporte la
enumera con el parser `yaml` del repo).

---

## 7 · Qué sigue sin vigilarse

### 7.1 · `linea-kit/src/validate.mjs :: validate()` — 3 ablandamientos vivos

Batería de **12 mutaciones**, cada una revertida y con el verde recomprobado,
ancla verificada única antes de aplicar **[banco]**:

| # | protección ablandada | ¿su job? | ¿el vecino? |
| --- | --- | --- | --- |
| M01 | `validate()` acepta **cualquier** documento | **NO** | sí (`volumes-ops`, 4 fallos) |
| M02 | cae el cerco §10.8 (`VOLUMES` bajo `node_modules` = root vivo) | sí | — |
| M03 | se acepta un `ZEUS_VOLUMES_ROOT` relativo | sí | — |
| M04 | `resolveNodo()` sin límite de cobertura | sí | — |
| M05 | `isCanonStatus()` da canon a cualquier estado | sí | — |
| M06 | `measurePath()` deja de contar bytes | sí (4) | — |
| M07 | `assertRootCerco()` deja de abortar | sí (2) | — |
| M08 | el sello del manifiesto no depende del contenido | sí (4) | — |
| M09 | el ledger deja de escribirse | sí (10) | — |
| M10 | cae la puerta de rol de `empty()` | sí (2) | — |
| M11 | `validate()` pierde los errores del esquema | **NO** | **NO** |
| M12 | un `schemaId` desconocido deja de ser error | **NO** | **NO** |

**10 de 12 cazadas por el carril; 9 de 12 por el job dueño.** Las tres
supervivientes están **en la misma función**: la suite de `linea-kit` nunca le da
a `validate()` un documento **inválido**. M01 se salva sólo **de rebote** desde
`volumes-ops` — la cobertura de esa función depende del paquete de al lado.

### 7.2 · El CLI publicado, sin ninguna vigilancia

**Devolución M2, y tenía razón: mi «únicas referencias» era un barrido truncado
presentado como censo** (un `head -10` se comió las que importaban). Censo
completo:

```
packages/engine/linea-kit/README.md:24,43,44        ← 2 invocaciones + mención
packages/engine/linea-kit/docs/tutorial-linea-30min.md:22
packages/engine/linea-kit/docs/tutorial-force-30min.md:18,28,35
packages/engine/linea-kit/package.json:8            ← el bin
package-lock.json:39585
```

La tesis **resiste y empeora**: no es un binario olvidado, es un CLI que **dos
tutoriales publicados y el README le dicen al usuario que invoque**
(`npx zeus-linea-kit …`, **6 invocaciones concretas**), y `docs` está en `files`
del manifiesto, así que **viaja al registry**. Ningún test, `e2e/` ni script lo
ejecuta, y ninguna de las dos suites lanza subprocesos: los `src/tools/*` están
cubiertos (`tools.test.mjs`); **el cableado del CLI —parseo de argumentos y
códigos de salida— no**.

### 7.3 · Siguen en pie

Los dos epílogos mudos en el código (§4.1) y 2 de los 4 discos (§4.3).

### 7.4 · **[runner]** El estado real de CI — y mi WP fantasma, retirado

Run `30702322459`, head `846f01c` (mi base), 2026-08-01T13:44Z:

```
27 jobs · 25 de test: 24 SUCCESS, 1 FAILURE
FAILURE  78s  lint + gates
FAILURE  45s  test @zeus/linea-system
SUCCESS  21s  smoke TS registry (U158)
SUCCESS  ...  los otros 24 de test
```

**De los 7 workspaces que la ronda 1 daba por rojos o colgados, 6 estaban verdes.**

| workspace | mi banco (ronda 1) | **runner real** |
| --- | --- | --- |
| `@zeus/protocol` | rojo, 2 fallos → luego 40/40 | **success**, test 2 s |
| `@zeus/cache-browser` | rojo, 2 fallos | **success**, test 1 s |
| `@zeus/firehose-browser` | rojo, 2 fallos | **success**, test 1 s |
| `@zeus/editor-ui` | rojo, 1 fallo | **success**, test 1 s |
| `@zeus/player-3d-ui` | rojo, 7 fallos | **success**, test 9 s |
| `@zeus/3d-monitor` | rojo, 15 fallos (`fetch failed`) | **success**, test 8 s |
| `@zeus/player-ui` | **timeout a 300 s** | **success**, test **2 s**, job 68 s |
| `@zeus/linea-system` | rojo, 2 fallos | **failure**, 2 fallos — coincide |

**Queda un hallazgo, con nombre y causa.** `@zeus/linea-system` falla, y falla
por lo que va este WP:

```
Error: ZEUS_VOLUMES_ROOT is not set — volumes root is not operable;
       set it explicitly (environment or .env). No default and no cwd walk (U200 · ◆5).
not ok 1 - test/resource-contract.test.mjs
not ok 2 - test/smoke.mjs
```

Es la **misma dependencia de entorno** que este WP declara para el carril, en un
workspace que **ya estaba en la matriz** y que aparece rojo también en los runs
del 31-jul y del 1-ago que he leído. La palanca está **en mi propio fichero**
—añadirlo al `include`— y **no la he usado a propósito**: convertir un rojo en
verde dándole una variable es exactamente la maniobra que hay que **medir** antes
de hacer (¿el test entonces asevera, o pasa a omitir en silencio como el de
§4.1?). **Es un WP, no una línea.**

### 7.4 bis · **[runner]** `lint + gates` está ROJO en `main`, y lo demuestra este WP

No es mío y **no lo arreglo**. Lo cito porque es la ilustración perfecta de la
tesis: **verde en local, rojo en CI**.

```
# fatal: invalid object name '28397b8'.
not ok 2 - el guardián estático se pone rojo con el defecto histórico real (HEAD~)
##[error]Process completed with exit code 1.
```

`test/gates/arbol-inmutable.test.mjs:442-449` hace
`git show 28397b8:test/gates/matriz-51.test.mjs`. Aquí `git cat-file -t 28397b8`
responde `commit`; **en el runner no existe**, porque `actions/checkout@v4` clona
**superficial** (`fetch-depth: 1` por defecto) y `ci.yml` no lo sobrescribe en
ninguno de sus tres checkouts (`:30`, `:92`, `:134`). El guardián que U252
construyó para vigilar el árbol **no puede correr en el árbol de CI**.

Acotación: **no es permanente**. `lint + gates` salió **success** en el run
`30697838778` (`20a89f6`) y **failure** en `30676280165` y `30702322459`. No he
caracterizado la intermitencia; sólo he leído la causa del run de mi base.

### 7.5 · **[censo]** El denominador real no es 27, es ~49

**Devolución M6, y tenía razón: «25 → 27» suena a cierre y no lo es.** Censo
sobre los manifiestos del repo:

| | |
| --- | --- |
| workspaces miembros | **50** |
| con script `test` | **49** (el único sin él: `@zeus/game-demos`) |
| en la matriz tras este WP | **27** |
| **con tests y FUERA de la matriz** | **22** |

(21 si se descuenta `@zeus/operator-ui`, cuyo `test` es `ng test` de Angular con
instalación aparte y `test/` vacío. El número se mueve ±1 según se cuente eso; la
magnitud no.)

Y **dos de los que faltan son del propio carril de datos**:

- **`@zeus/ssb-system`** — dueño de `DISK_04/SSB`, el disco entero que §4.3 dice
  que CI no valida, y de la fixture que **U254 acusa de mentir sobre la forma del
  dato**. 2 ficheros de test, fuera.
- **`@zeus/feed-kit`** — escribe en el root vía `jetstream-sync` y es uno de los
  consumidores de `ZEUS_VOLUMES_ROOT` (§5). 1 fichero de test, fuera.

Los mayores por volumen fuera: `parte-kit` (7), `mcp-launcher` (7),
`reparto-kit` (6), `view-kit` (6), `embajador-kit` (5), `playbook-kit` (5),
`webrtc-signaling` (5), `acta-kit` (4).

**Este WP cierra los dos que se le pidieron; no cierra el carril.**

---

## 8 · El precio en tiempo — **[runner]**, ya no estimado

La ronda 1 usó mi banco como techo y era falso. Datos del runner
(`gh run view --json jobs`, tiempos por paso):

### Lo que cuesta hoy un job de la matriz

| paso | tiempo |
| --- | --- |
| `Set up job` + `checkout` | ~2 s |
| `setup-node@v4` | ~5 s |
| **`Install` (`npm ci`, con `cache: npm`)** | **29–56 s · media 48,9 s** |
| **`Test workspace`** | **0–9 s · mediana 1 s · suma 42 s en 25 jobs** |
| **job completo** | **45–72 s** |

Es decir: **el `npm ci` es ~50 s de un job de ~60 s, y los tests son ~1 s.** El
número que la ronda 1 declaró no medido —el `npm ci` con caché— es **48,9 s de
media**, no los 213–389 s sin caché de mi banco.

Tres runs consecutivos, para que no sea una muestra de uno:

| run | jobs de test | por job | suma | reloj de pared |
| --- | --- | --- | --- | --- |
| `30702322459` | 25 | 45–72 s (mediana 63) | 1557 s | **225 s** |
| `30697838778` | 25 | 48–77 s (mediana 66) | 1642 s | **234 s** |
| `30676280165` | 25 | 55–77 s (mediana 70) | 1699 s | **155 s** |

### Lo que añade este WP

- **Reloj de pared: ≈ 0.** Los jobs son paralelos, el run entero dura
  **155–234 s** y el job más lento son **72–77 s**: la matriz no es el camino
  crítico. Mis dos suites miden **1,7 s y 4,7 s** en banco, y eso es **cota
  superior**: el runner ejecuta 2–5× más rápido que mi contenedor
  (`http-contract` 8,4 s en banco → **4 s** en runner; `protocol` 11,3 s →
  **2 s**). Ninguna de las dos se acerca al máximo.
- **Minutos de runner: +2 jobs × ~60 s ≈ +120 s** sobre los 1557–1699 s que ya
  suma la matriz → **≈ +7 %**. De esos 120 s, **~100 s son `npm ci`**, el peaje
  que ya pagan los otros 25; los tests propiamente dichos son **≈ 7 s**.
- **La guarda de §2.2 cuesta ≈ 0 s** (tres `test -f`).

---

## 9 · Higiene: ¿ensucian el árbol las suites?

Comprobado antes de acusar. En clon nativo **[banco]**, `git status --porcelain`
da **3 líneas antes de correr ningún test** y **las mismas 3 después** de las dos
suites. Son **cambio de modo, no de contenido**:

```
3 files changed, 0 insertions(+), 0 deletions(-)
  feed-kit/bin/jetstream-sync.mjs · linea-kit/bin/linea-kit.mjs · playbook-kit/bin/run-playbook.mjs
  old mode 100644 → new mode 100755
```

**Las dos suites del carril añaden 0 líneas.** No hay contrabando.

**Devolución M7, matizado**: la ronda 1 lo atribuyó a «`npm ci`» a secas. Lo
honesto es que **es una observación de mi banco** —contenedor, proceso como root,
overlayfs— y **no la he verificado en el runner**, donde además es irrelevante:
checkout fresco y nadie asevera sobre `git status`. (En mi worktree Windows los
mismos 3 ficheros aparecieron modificados tras `npm ci`, con contenido idéntico
salvo finales de línea; restaurados con `git checkout --`, **no viajan en el
commit**.)

**Devolución M8, no estaba escrito y debería**: con la variable declarada, los dos
jobs del carril pasan a **vigilar también los datos del repo**.
`validate-loader.test.mjs:190-228` valida el árbol vivo bajo `VOLUMES/` y asevera
que **no se muta** (compara mtimes). Consecuencia querida pero que hay que decir:
**editar `VOLUMES/DISK_02` o `DISK_03` a mano puede poner rojo ese job**. Eso es
lo que se buscaba —el carril de datos vigilado— y a la vez acopla el job a los
datos del repo. La guarda de §2.2 hace ese acoplamiento **explícito** al exigir
`DISK_03/FORCES/registry.json`.

---

## 10 · Método y reglas

- **`gh`**: autenticado y **usado** (ronda 2). La lección de la retractación.
- `git stash`: **no usado**. `npx`: **no usado**.
- Nada escrito fuera del worktree. El worktree vino sin `node_modules`:
  **`npm ci`**, nunca `npm install`. Contenedores con el repo montado en **sólo
  lectura**; todo lo escrito, en volúmenes efímeros y en el scratchpad.
- **M3 declarado** (miscuenta de la ronda 1): el censo exacto de consumidores
  **no-test fuera del carril** son **7 ficheros** = **4 en `src/`**
  (`presets-sdk/src/volumes/resolve.mjs`, `feed-kit/src/jetstream-sync.mjs`,
  `test-utils/src/smoke-env.mjs`, `ssb-system/src/sync-cli.mjs`) **+ 1 en `bin/`**
  (`feed-kit/bin/jetstream-sync.mjs`) **+ 2 en `e2e/`**. La ronda 1 dijo «5 de
  `src/`/`bin/`» mezclando los dos cajones.
- El diff de `ci.yml` se preparó con `git -c core.autocrlf=false` (override **por
  comando**, sin escribir config compartida): el repo tiene `core.autocrlf=true` y
  el blob commiteado es CRLF, así que sin el override un cambio de 20 líneas salía
  como 119.

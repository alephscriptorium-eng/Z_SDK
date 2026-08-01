# WP-U256 · el carril de datos entra en CI — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U256) |
| fecha | 2026-08-01 |
| rama | `wp/u256-ci-carril-datos` · base `846f01c` |
| alcance tocado | `.github/workflows/ci.yml` · este reporte · fila U256 de `BACKLOG.md` |
| `src/**` tocado | **ninguno** · `package.json` **ninguno** · `package-lock.json` **no** · ficheros de test **ninguno** |
| estado propuesto | listo para verificación de cierre |
| push | no intentado · sin merge |

## CA de cierre

**Los dos paquetes en la matriz** — cumplido: `ci.yml:78-79`, matriz de 25 → **27**.
**El test de curación y los del driver corriendo en CI** — cumplido y medido:
`curation-*.test.mjs` y los cinco `import-*-driver.test.mjs` entran con sus
paquetes; **176 tests** en total, **0 omitidos** en Linux.

> **Lo que este WP NO afirma.** No he podido lanzar un job real de GitHub
> Actions desde aquí. Todo lo que sigue está medido sobre **`node:22` en
> contenedor** (Debian 12, Node v22.23.2, npm 10.9.8) y, para las cifras que
> deciden, sobre un **clon nativo** del repo (`git clone` dentro del contenedor
> ⇒ finales de línea LF, como `actions/checkout@v4`), no sobre la copia del
> árbol de trabajo de Windows. La distinción **no es retórica**: ver §7, donde
> un rojo que yo mismo había medido resultó ser culpa de mi arnés.

---

## 1 · El estado medido antes

`ci.yml:44` abre el job `test`; `:50-75` lista la matriz. **25 workspaces**,
y ni `@zeus/linea-kit` ni `@zeus/volumes-ops` entre ellos. Verificado abriendo
el fichero, no de memoria.

Los dos paquetes viven en `packages/engine/linea-kit` y
`packages/engine/volumes-ops` (miembros de `packages/engine/*`, así que
`npm ci` ya los instalaba: **lo que faltaba era ejecutarlos, no tenerlos**).
Ambos declaran `"test": "node --test test/*.test.mjs"`.

| | ficheros de test | tests | suites |
| --- | --- | --- | --- |
| `@zeus/linea-kit` | 8 | **43** | 19 |
| `@zeus/volumes-ops` | 12 | **133** | 0 |
| **total** | **20** | **176** | |

Recuentos de partida (clon nativo LF, `node:22`):

```
@zeus/linea-kit     rc=0   # tests 43   # pass 43   # fail 0   # skipped 0
@zeus/volumes-ops   rc=0   # tests 133  # pass 133  # fail 0   # skipped 0
```

**Ninguna de las dos suites estaba roja.** No había, por tanto, un rojo
escondido esperando: lo que había era **ausencia de vigilancia**.

---

## 2 · Qué hizo falta además de listarlos

Listarlos habría bastado para que corrieran en verde. **No** habría bastado
para que vigilaran, por una razón concreta (§4). El cambio final son tres cosas:

1. **Dos entradas en la matriz** (`ci.yml:78-79`).
2. **Un `env` en el step de test** (`ci.yml:102-104`) que declara
   `ZEUS_VOLUMES_ROOT`, **sólo para esas dos entradas**, vía `include`
   (`ci.yml:86-90`).
3. **Tres bytes basura fuera** (§6).

El comando no cambia: sigue siendo `npm test -w "${{ matrix.workspace }}"`,
el mismo que usan los otros 25.

### Por qué el `env` va por `include` y no en el step común

Poner `ZEUS_VOLUMES_ROOT` en el `env` del step lo daría **a los 27**. Para los
25 anteriores la variable pasaría de *no definida* a *definida*, y ese cambio
**no está medido** — la leen **5 ficheros de `src/`/`bin/` fuera del carril**
(`presets-sdk/src/volumes/resolve.mjs` —el resolver canónico, que **lanza** si
no está—, `feed-kit/src/jetstream-sync.mjs` y su `bin/`,
`test-utils/src/smoke-env.mjs`, `ssb-system/src/sync-cli.mjs`) más los ficheros
de test de otros paquetes. Con `include`, sólo las dos entradas marcadas reciben
ruta; **las otras 25 la reciben vacía**. Que vacía ≡ no definida está medido, no
supuesto: §5.

**Lo que aquí es documentación y no medida:** que un objeto de `include` cuyo
`workspace` **coincide** con un valor ya presente en la matriz **añade su clave
a esa combinación en vez de crear una nueva** es el comportamiento documentado
de GitHub Actions; no lo he observado en un runner. Si esa lectura fuera falsa,
el síntoma sería **29 jobs en vez de 27**, con dos duplicados — visible a simple
vista en el primer push, y sin riesgo de falso verde.

---

## 3 · El vector — un rojo tumba el job

La pregunta no es si están listados, es si un rojo se caza. GitHub Actions
ejecuta un `run:` con `bash -e {0}`, así que el vector se monta con
`bash -e -c 'npm test -w "<ws>"'` — **el mismo comando** que va al workflow — y
se lee su **exit code**.

Sobre el **clon nativo**, mutando `volumes-ops/src/manifest.mjs` para que el
sello del manifiesto deje de depender del contenido:

```
línea base                       rc=0   # pass 133  # fail 0
sello roto ('f'.repeat(64))      rc=1   # pass 129  # fail 4     ← el step cae
revertido                        rc=0   # pass 133  # fail 0
git status del clon              0 líneas
```

Y las otras dos caras del vector (arnés sobre volumen persistente):

| rotura deliberada | `rc` del step | efecto |
| --- | --- | --- |
| `linea-kit/src/validate.mjs` — `validate()` acepta todo | **0** | **no lo caza su propia suite** (§7) |
| `volumes-ops/src/measure.mjs` — `bytes += 0` | **1** | 4 fallos |
| test nuevo con `assert.equal(1,2)` en `verify-integrity.test.mjs` | **1** | 1 fallo, 134 tests |
| todo revertido | **0** / **0** | 43/43 y 133/133 |

**Acotación honesta:** esto demuestra que el *comando* del step devuelve ≠0 y
que GH marcaría el step en rojo por su contrato documentado. **No** he
observado un job rojo en un runner de GitHub.

---

## 4 · Los omitidos, por nombre

### 4.1 · El que mentía: un `pass` que no aseveraba nada

`packages/engine/linea-kit/test/forces-loader.test.mjs:56-80`, test
**`loads live FORCES when present`**.

`:58-60` resuelve el root así:

```js
const root =
  process.env.ZEUS_VOLUMES_ROOT ||
  path.resolve(__dirname, '../../../../../../VOLUMES');
```

Son **seis** niveles. Desde `<repo>/packages/engine/linea-kit/test`, **cuatro**
llegan a la raíz del repo; seis se pasan hasta el abuelo del repo. Medido:

| entorno | a dónde resuelve | existe |
| --- | --- | --- |
| mi worktree | `C:\S_LAB\VOLUMES` | no |
| contenedor en `/work` | `/VOLUMES` | no |
| runner GH (`/home/runner/work/<repo>/<repo>`) | `/home/runner/work/VOLUMES` | no |

Cuando no existe, `:62-65` hace `console.log('skip live FORCES …')` y
**`return`**. `node --test` lo cuenta como **`pass`**, no como `skip`. Por eso
**contar omitidos no lo destapa**: la suite reporta `# skipped 0` y el test no
asevera nada. Esto es exactamente «un verde que omite».

Su hermano `validate-loader.test.mjs:24-27` **sí** tiene las dos candidatas
(seis niveles **y** cuatro), y por eso sí encuentra el `VOLUMES/` del repo y sí
valida en vivo (`checked=13`). La asimetría entre los dos ficheros es el defecto.

**Cerrado declarando el entorno**, que es la palanca que me toca (`ci.yml` es
mío; el fichero de test no, porque el test **no falla**). Medido en el clon
nativo:

```
sin env:  # pass 43  …  "# skip live FORCES (no registry at /VOLUMES/DISK_03/FORCES )"
con env:  # pass 43  …  (el mensaje desaparece — el test se ejecuta y pasa)
```

**Recomendación para otro WP:** darle a `forces-loader.test.mjs:60` la misma
lista de candidatas que su hermano. Con el `env` de CI el agujero queda tapado
en CI, pero **sigue abierto en local** para quien no exporte la variable.

### 4.2 · Los que se declaran (no mienten) pero acotan la cobertura

- `validate-loader.test.mjs` imprime
  `skipped=["DISK_01/FIREHOSE","DISK_04/SSB"]`. El repo sólo rastrea **15
  ficheros** bajo `VOLUMES/` (`DISK_02` y `DISK_03`). **CI valida 2 de los 4
  discos**, y eso no lo arregla ningún cambio de CI: el material no está en git.

### 4.3 · Los `# SKIP` de verdad: **0 en CI**, 2 sólo en Windows

En mi Windows la suite de `volumes-ops` omite **2** casos:

- `D-H: VALIDAR rechaza un pack con dos ficheros que colisionan por caja (solo FS sensible)`
  — `import-ssb-driver.test.mjs:759`
- `D-H: un DESTINO con dos ficheros que colisionan por caja no se puede planificar (solo FS sensible)`
  — `import-ssb-driver.test.mjs:786`

Ambos se abstienen con `t.skip()` (declarado, no fingido) porque el FS no
distingue mayúsculas. **En Linux corren y pasan**: `# skipped 0` en las tres
corridas del clon nativo. O sea: **CI vigila estrictamente más que mi local**,
y no hay ningún omitido en el entorno donde va a correr.

---

## 5 · La medida que autoriza el `include`

Afirmación a demostrar: para los 25 workspaces anteriores,
`ZEUS_VOLUMES_ROOT=''` es **indistinguible** de no definirla.

Ejecutados los **25**, dos veces cada uno (sin la variable / con la variable
vacía), comparando `exit code` **y** el recuento `pass`/`fail`/`skipped`:

```
IGUAL = SI en 25 de 25
```

No es una muestra: es el censo completo de la matriz previa. Con eso, el
`format(...) || ''` de `ci.yml:104` no cambia el comportamiento de ningún job
que ya existía.

---

## 6 · Un hallazgo de paso: `ci.yml` no pasaba un parser YAML

El fichero **commiteado** (`846f01c`) tiene **3 bytes CR sueltos** pegados tras
`- '@zeus/ping-pong-bots'` (`\r\r\r` antes del `\r\n`). GitHub Actions los
tolera —el workflow lleva corriendo con ellos—, pero cualquier herramienta
YAML estricta lo rechaza:

```
PRISTINO: NO PARSEA -> UNEXPECTED_TOKEN  Unexpected scalar at node end at line 75, column 35
```

Los he quitado (es la única línea `-` del diff). Motivo: la matriz tiene que
ser **legible por máquina** para que alguien pueda aseverar sobre ella —
incluida la comprobación de este mismo WP, que enumera `matrix.workspace` con
el parser `yaml` del repo. Tras el cambio: `PARSEA OK · workspaces: 27 ·
CR sueltos restantes: 0`.

---

## 7 · Qué sigue sin vigilarse

### 7.1 · `linea-kit/src/validate.mjs :: validate()` — 3 ablandamientos que sobreviven

Batería de **12 mutaciones**, cada una ablanda una protección del carril, cada
una revertida y con el verde recomprobado. Ancla verificada única antes de
aplicar (una candidata se descartó por ambigua y se rehízo).

| # | protección ablandada | ¿la caza su propio job? | ¿la caza el job vecino? |
| --- | --- | --- | --- |
| M01 | `validate()` acepta **cualquier** documento | **NO** (43/43) | sí — `volumes-ops` 4 fallos |
| M02 | cae el cerco §10.8 (`VOLUMES` bajo `node_modules` pasa a root vivo) | sí | — |
| M03 | se acepta un `ZEUS_VOLUMES_ROOT` relativo | sí | — |
| M04 | `resolveNodo()` sin límite de cobertura | sí | — |
| M05 | `isCanonStatus()` da canon a cualquier estado | sí | — |
| M06 | `measurePath()` deja de contar bytes | sí (4) | — |
| M07 | `assertRootCerco()` deja de abortar | sí (2) | — |
| M08 | el sello del manifiesto deja de depender del contenido | sí (4) | — |
| M09 | el ledger deja de escribirse | sí (10) | — |
| M10 | cae la puerta de rol de `empty()` | sí (2) | — |
| M11 | `validate()` pierde los errores del esquema | **NO** | **NO** |
| M12 | un `schemaId` desconocido deja de ser error | **NO** | **NO** |

**Balance: 10 de 12 cazadas por el carril completo; 9 de 12 por el job dueño.**
Las tres supervivientes están **en la misma función**: la suite de `linea-kit`
nunca le da a `validate()` un documento **inválido**. M01 se salva sólo porque
`volumes-ops` la ejercita de rebote — es decir, **la cobertura de esa función
depende del paquete de al lado, no del suyo**.

Esto es el sucesor natural de la cifra de U202-B2 («10 vectores, el gate verde
en 9»): con las dos suites dentro, la zona pasa de *casi todo pasa* a **2 de 12
pasan**, y las 2 tienen nombre y fichero.

### 7.2 · El CLI publicado no lo toca nadie

`linea-kit` declara `bin: { "zeus-linea-kit": "bin/linea-kit.mjs" }` y lo
publica (está en `files`). Barrido del repo: las **únicas** referencias a ese
binario están **dentro del propio fichero** y en `package-lock.json:39585`.
Ningún test, `e2e/` ni `scripts/` lo invoca, y ninguna de las dos suites lanza
subprocesos. Los `src/tools/*` sí están cubiertos (`tools.test.mjs`); **el
cableado del CLI — parseo de argumentos y códigos de salida — no**. Sus 8
subcomandos siguen sin vigilancia.

### 7.3 · Sólo 2 de 4 discos (§4.2) y el `forces-loader` en local (§4.1).

### 7.4 · Pista, no veredicto: 7 workspaces **ya listados** no salen verdes en mi arnés

No es mi WP y no lo he tocado, pero lo medí al hacer el censo de §5 y callarlo
sería peor. Sobre el **clon nativo LF**, `node:22`:

```
@zeus/protocol          rc=0   # pass 40  # fail 0                 ← verde
@zeus/linea-system      rc=1   # pass 0   # fail 2
@zeus/cache-browser     rc=1   # pass 2   # fail 2
@zeus/firehose-browser  rc=1   # pass 3   # fail 2
@zeus/editor-ui         rc=1   # pass 14  # fail 1  # skipped 2
@zeus/player-3d-ui      rc=1   # pass 11  # fail 7
@zeus/3d-monitor        rc=1   # pass 0   # fail 15   (todos 'fetch failed')
@zeus/player-ui         rc=124                        (timeout a 180 s)
```

**Por qué esto es una pista y no un veredicto, con la prueba delante:**
`@zeus/protocol` salía **rojo (2 fallos)** en mi primera pasada, y el rojo era
**culpa de mi arnés** — había copiado el árbol de trabajo de Windows, con CRLF,
y el test comparaba `.d.ts` generados byte a byte. En el clon nativo pasó a
**40/40**. Exactamente esa clase de contaminación puede explicar alguno de los
7 restantes (puertos, servicios, red del contenedor, ausencia de display), y no
tengo runner de GitHub para distinguirlo. **Merece un WP con un runner real.**

---

## 8 · El precio en tiempo

### Coste puro de las dos suites

Medianas de **5 corridas** por suite (contenedor, volumen persistente):

| workspace | mediana | rango |
| --- | --- | --- |
| `@zeus/linea-kit` | **1 683 ms** | 1 536 – 1 916 |
| `@zeus/volumes-ops` | **4 703 ms** | 4 285 – 6 825 |
| **suma** | **≈ 6,4 s** | |

En el clon nativo (FS frío, una corrida): 2 741 ms y 6 342 ms ≈ **9,1 s**.

### Dónde caen dentro de la matriz

Perfilada la matriz previa completa en el mismo arnés, las dos nuevas quedan en
la **mitad barata**: `@zeus/protocol` 11 312 ms, `@zeus/http-contract` 8 382 ms,
`@zeus/editor-ui` 7 912 ms, `@zeus/firehose-browser` 7 143 ms — y
`@zeus/player-ui` **no terminó en 300 s**. Ninguna de las dos nuevas se acerca
al camino crítico.

### Coste marginal para CI

- **Reloj de pared: ≈ 0** mientras haya runners libres. La matriz ya lanza 25
  jobs en paralelo y el job más lento manda; los dos nuevos están lejos de él.
  Si la cuenta tiene límite de concurrencia y los jobs hacen cola, el coste es
  **una ranura más de tanda**, no 6 s.
- **Minutos de runner: 2 jobs más**, y en cada uno **domina `npm ci`**, no los
  tests. Medido sin caché de npm: **213 s** (volumen) y **389 s** (clon
  nativo). **No representativo de GH Actions**, que usa `cache: npm` — ese
  número **no lo he medido** y no lo invento.
- Relación: los tests que este WP añade son **≈ 3 %** del tiempo de su propio
  job en mi arnés. El resto ya se pagaba en los otros 25.

---

## 9 · Higiene: ¿ensucian el árbol las suites?

Comprobado antes de acusar. En el clon nativo, `git status --porcelain`:

| momento | líneas |
| --- | --- |
| tras `npm ci`, **antes de correr ningún test** | 3 |
| tras `@zeus/linea-kit` | 3 |
| tras `@zeus/volumes-ops` | 3 |

Las tres son **de `npm ci`, no de los tests**, y son **cambio de modo**, no de
contenido:

```
3 files changed, 0 insertions(+), 0 deletions(-)
  packages/engine/feed-kit/bin/jetstream-sync.mjs      old mode 100644 → new mode 100755
  packages/engine/linea-kit/bin/linea-kit.mjs          old mode 100644 → new mode 100755
  packages/engine/playbook-kit/bin/run-playbook.mjs    old mode 100644 → new mode 100755
```

**Las dos suites del carril añaden 0 líneas.** No hay contrabando. (En mi
worktree Windows los mismos 3 ficheros aparecieron modificados tras `npm ci`,
con contenido idéntico salvo finales de línea; restaurados con
`git checkout --`, **no viajan en el commit**.)

---

## 10 · Método y reglas

- `git stash`: **no usado**.
- `npx`: **no usado**.
- Nada escrito fuera del worktree. El worktree venía sin `node_modules`:
  **`npm ci`**, nunca `npm install`.
- Contenedores: montajes del repo en **sólo lectura**; todo lo escrito vive en
  volúmenes de Docker efímeros y en el scratchpad de sesión.
- El diff de `ci.yml` se preparó con `git -c core.autocrlf=false` (override por
  comando, **sin escribir config compartida**): el repo tiene
  `core.autocrlf=true` y el blob commiteado es CRLF, así que sin el override el
  diff salía de 119 líneas para un cambio de 20. Con él: **20 inserciones, 1
  borrado**.

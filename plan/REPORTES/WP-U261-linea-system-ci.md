# WP-U261 · `test @zeus/linea-system`, el último rojo de CI — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U261) |
| fecha | 2026-08-01 |
| rama | `wp/u261-linea-system-ci` · base `4e155eb` |
| commit | `86931eb` (obra) |
| alcance tocado | `.github/workflows/ci.yml` · `packages/mesh/linea-system/test/smoke.mjs` · `packages/mesh/linea-system/test/helpers/live-volumes.mjs` · este reporte · fila U261 de `BACKLOG.md` |
| `src/**` · `packages/engine/presets-sdk/**` · `package.json` · lockfile · `scripts/gates/**` · `VOLUMES/**` | **ninguno** |
| estado propuesto | listo para verificación de cierre |
| push | no intentado · sin merge · sin `git stash` · sin `npx` |

**[runner]** = medido dentro de `node:22` sobre Linux, clon superficial nativo LF.
**[banco]** = medido en el worktree Windows. Nada mezclado.

---

## CA de cierre, término a término

| lo pedido | cómo queda |
| --- | --- |
| los 2 tests **aseveran** en CI, no se omiten | **NO, y es el hallazgo del WP.** No pueden: exigen un corpus que **el `.gitignore` prohíbe** que llegue a git (§2.2). Siguen omitidos y lo declaro (§7). Lo que sí queda es que **el job asevera**: 4 aserciones que hoy son 0, en un caso complementario **exacto** del omitido (§4) |
| guarda que impida el verde mudo | **dos**, en dos planos: `ci.yml:147-158` (paso previo) y `t.plan(4)` dentro del test. Cinco vectores medidos, **tres de ellos la ponen roja** (C y D **[runner]**, T **[banco]**) (§5) |
| declarado qué valida y qué no | §7, sin adorno: el job **no valida nada de la superficie MCP** |

---

## 1 · El diagnóstico, verificado antes de tocar nada

`gh run view 30708835271` — head `4e155eb`, que es **exactamente** la base de esta
rama, así que la línea base de abajo es el mismo árbol que midió CI.

```
$ gh run view 30708835271 --json jobs --jq '… group_by(.conclusion) …'
[{"conclusion":"failure","n":1},{"conclusion":"success","n":28}]
$ gh run view 30708835271 --json jobs --jq '.jobs[]|select(.conclusion!="success")|.name'
test @zeus/linea-system
```

29 jobs = 27 de matriz + `quality` + `smoke-ts-registry`. Que sean **27 y no 29**
es, de paso, la prueba en runner de que el `include` de U256 **fusiona** en vez de
crear combinaciones nuevas: es el mecanismo que este WP reutiliza.

Del log del step: `ZEUS_VOLUMES_ROOT:` (**vacía**, el `include` no la cubría),
`not ok 1 - test/resource-contract.test.mjs`, `not ok 2 - test/smoke.mjs`,
`# pass 0 · # fail 2 · # skipped 0`.

### 1.1 · Dónde muere exactamente: en el **import**, no en un test

La traza es una sola línea y lo dice todo:

```
at resolveLineasBasePath (packages/engine/presets-sdk/src/paths/lineas.mjs:26)
at file:///…/packages/mesh/linea-system/src/loader.mjs:28
at ModuleJob.run
```

`src/loader.mjs:28` es `export const DEFAULT_BASE_PATH = resolveLineasBasePath();`
— resuelve el root **en tiempo de evaluación de módulo**. Los dos ficheros de test
importan `../src/start.mjs` estáticamente (`resource-contract.test.mjs:5`,
`smoke.mjs:15`), y los `import` se evalúan **antes** que el cuerpo del módulo. Por
tanto el proceso muere antes de que `node --test` llegue a evaluar ningún `skip`:
**cero cuerpos de test ejecutados, cero aserciones**. El rojo no dice
«linea-system está roto»; dice «nadie declaró dónde están los datos».

Esa limitación **ya estaba escrita** en el repo, en `src/start.mjs:28-34`
(WP-U206 · decisión ⑩), palabra por palabra: *«para un root AUSENTE o no
resoluble, esta guarda llega tarde — el import ya habrá lanzado»*. No la
redescubro: la confirmo.

**El fail-closed de `presets-sdk` funciona como se diseñó y no lo he tocado.**

---

## 2 · LA MEDIDA, antes de decidir: ¿aseveran, o se auto-desactivan?

La palanca obvia es meter `@zeus/linea-system` en el `include` y darle el root.
Medida **[runner]**, sobre la base `4e155eb` sin tocar un solo fichero, dentro de
`node:22`:

| caso **[runner]** | rc | tests | pass | fail | skipped | **aserciones ejecutadas** |
| --- | --- | --- | --- | --- | --- | --- |
| BASE-1 · como está hoy en `main` (sin root) | **1** | 2 | 0 | **2** | 0 | **0** |
| BASE-2 · **la palanca obvia**: sólo darle el root | **0** | 2 | 0 | 0 | **2** | **0** |

**Se auto-desactivan.** La palanca obvia compra el verde a cambio de cero
aserciones: exactamente el «rojo honesto convertido en omitido» que el worker de
U256 se negó a firmar. Su criterio era correcto y queda **medido**, no supuesto.

Matiz que sí le debo al custodio, porque cambia el diagnóstico ambiental: aquí el
omitido **no** es del tipo «imprime un aviso y hace `return`» que U256 encontró en
`forces-loader.test.mjs`. Éstos usan la opción `skip` de `node:test`, así que la
salida dice `# SKIP` y `# skipped 2`: **contar omitidos sí los destaparía**. No
son verdes que mienten; son verdes que **callan**. Sigue siendo insuficiente —
`# pass 0` en un job cuyo nombre promete probar un paquete entero — pero el
mecanismo es otro y decirlo mal habría enrutado mal el siguiente WP.

### 2.1 · El guardián **ya se apagaba solo**; el crash del import lo tapaba

`test/helpers/live-volumes.mjs` envolvía todo en `try { … } catch { return false }`.
Eso colapsa dos condiciones distintas en la misma decisión —omitir—:

- **entorno roto**: no declaraste el root, o declaraste algo que no es un root
  de LINEAS;
- **dato ausente**: el root está bien, pero no trae la línea viva `espana`.

Medido **[banco]**, replicando el helper viejo tal cual contra dos entornos rotos:

```
--- root declarado que NO es de LINEAS, helper VIEJO → HELPER VIEJO decide: OMITIR (skip)
--- sin root,                          helper VIEJO → HELPER VIEJO decide: OMITIR (skip)
```

Es decir: **el rojo de hoy es un accidente del orden de importación.** Si el
import hubiera sido perezoso, el fail-closed de U200 habría producido un
**omitido silencioso**, no un rojo. El guardián que debía distinguir «falta el
corpus» de «falta el entorno» no distinguía nada: se apagaba en ambos casos. Un
guardián que puede desactivarse solo no es un guardián — y éste podía.

### 2.2 · Por qué los dos tests **no pueden** aseverar en CI, hoy ni mañana

Ambos exigen la línea `espana` (`src/lineas.mjs:15,22` fijan `lineaId: 'espana'`
para los dos servidores; `start.mjs:37-40` lanza si no está). El corpus vivo salió
del monorepo en U62 y hay un **candado de whitelist** en `.gitignore:18-24`:

```
!VOLUMES/DISK_02/LINEAS/          VOLUMES/DISK_02/LINEAS/**
!VOLUMES/DISK_02/LINEAS/registry.yaml
!VOLUMES/DISK_02/LINEAS/demo/     !VOLUMES/DISK_02/LINEAS/demo/**
```

Bajo `DISK_02/LINEAS` sólo pueden entrar a git `registry.yaml` y `demo/**`.
Comprobado además que el dato no existe en ningún otro sitio del repo: `P06` /
`Transfiguración carismática` aparecen **sólo dentro de `smoke.mjs`** y en
`console-monitor/src/logic.mjs:216` como ejemplo de docstring. No hay fixture
`espana` ni generador.

Conclusión que hay que decir entera: **ningún arreglo dentro de mi alcance hace
que esos dos cuerpos lleguen al final en un runner de GitHub.** Fabricar el
corpus está prohibido por el WP (`VOLUMES/**`) y por el candado de U108/A-15.

---

## 3 · La vía elegida, y su precio

Como se auto-desactivan, el arreglo está en los tests — y el custodio tenía razón
al sospecharlo. Tres piezas, ninguna suelta:

**(a) El guardián deja de apagarse solo** — `test/helpers/live-volumes.mjs`.
`requireLineasBasePath()` sin `try/catch`: root ausente o root que no es de
LINEAS **lanzan** (rojo); sólo «root bueno, sin `espana`» omite.

**(b) El job deja de poder quedarse mudo** — `test/smoke.mjs:404-426` (`t.plan` en `:408`), caso
`linea-system fail-closed sin corpus vivo`. Su `skip` es el **complemento exacto**
del otro: corre justo cuando el smoke se omite, y se omite justo cuando el smoke
corre. El job **siempre** ejecuta uno de los dos cuerpos, nunca ninguno. Asevera
contra el root declarado, en este orden: que resuelve · que su registry expone
alguna línea · que `espana` **no** está · y que `startAll()` **falla cerrado** con
error nombrado (`/Line data not found for "espana"/`) en vez de levantar dos
servidores MCP sin datos. `t.plan(4)` no es adorno: si el cuerpo se fuera por una
salida temprana, el caso se pone **rojo** (§5, vector T).

**(c) El entorno se declara y se vigila** — `ci.yml:101` mete el workspace en el
`include`; `ci.yml:147-158` es su guarda.

### El precio, dicho sin rebaja

1. **Los 2 tests titulares siguen omitidos en CI, para siempre mientras el corpus
   viva fuera.** El WP no los enciende. Lo que hace es que su omisión **ya no sea
   todo lo que pasa**.
2. **Lo que el job asevera es modesto**: 4 aserciones sobre el arranque y su
   fail-closed, no sobre el MCP (§7).
3. **Acoplo el job a `VOLUMES/DISK_02/LINEAS` del repo**: editar a mano el
   fixture `demo` puede ponerlo rojo. Es el mismo precio que U256 declaró para su
   carril, y es el buscado: si alguien registra un `espana` falso, el caso
   fail-closed se apaga y el smoke real se enciende — y falla (§5, vector E).
4. **Un paso más de YAML** (~14 s de runner, el step son tres `test -f`).

### Lo que decidí **no** hacer, y por qué

- **No convertí los `import` en dinámicos.** Con el root declarado, `loader.mjs:28`
  ya no lanza, así que no arregla nada; y sin root, el mensaje que sale del crash
  de import es el **mismo** que daría el guardián. Churn sin medida detrás.
- **No añadí caso complementario a `resource-contract.test.mjs`.** Lo único que
  ese fichero puede aseverar sin corpus es que `RESOURCE_PAYLOADS` trae
  `linea://info` — y eso **ya lo asevera**
  `packages/engine/http-contract/test/mcp-resources.test.mjs:13`, en un job que
  está verde en la misma matriz. Habría sido cobertura duplicada disfrazada de
  cobertura nueva.
- **No toqué `presets-sdk`.** El defecto no está ahí. `resolveVolumesRoot()`
  (`volumes/resolve.mjs:29-44`) hace lo que promete.

---

## 4 · Aserciones ejecutadas: antes y después

| | **[runner]** rc | pass | fail | skipped | **aserciones ejecutadas** | ¿el cuerpo llega al final? |
| --- | --- | --- | --- | --- | --- | --- |
| ANTES · `main` hoy | 1 | 0 | 2 | 0 | **0** | no hay cuerpo: muere el import |
| ANTES · palanca obvia (sólo root) | 0 | 0 | 0 | 2 | **0** | no: los dos se omiten |
| **DESPUÉS · este WP** | **0** | **1** | 0 | 2 | **4** | **sí** — y está **verificado por máquina** |

Salida literal **[runner]**:

```
ok 1 - linea MCP linea://info matches RESOURCE_PAYLOADS # SKIP ⏳ … id:espana missing …
ok 2 - linea-system smoke # SKIP ⏳ … id:espana missing …
# FAIL-CLOSED CASE PASSED: 4 aserciones · líneas en /work/VOLUMES/DISK_02/LINEAS: demo
ok 3 - linea-system fail-closed sin corpus vivo
# tests 3 · # pass 1 · # fail 0 · # skipped 2      → rc=0
```

Las 4 son `t.assert.*` **a propósito**: `node:test` sólo cuenta ésas para el plan
(comprobado **[banco]**: un `assert` de `node:assert/strict` no incrementa el
contador). Así «4 aserciones» no es una promesa mía en un `console.log` — es una
condición que el runtime verifica y que pone el caso rojo si no se cumple.

Si algún día el corpus vivo estuviera presente, el reparto se invierte y el job
ejecuta **86 aserciones** en `smoke.mjs` + **1** en `resource-contract.test.mjs`
(conteo estático de los cuerpos). **No lo he medido**: no hay corpus `espana` en
esta máquina, y no lo invento.

---

## 5 · La guarda, y los cinco vectores (tres la ponen roja)

`ci.yml:147-158`, paso **previo** al de test:

```yaml
- name: linea-system exige su root de VOLUMES (WP-U261)
  if: matrix.workspace == '@zeus/linea-system'
```

El `if` se ancla en `matrix.workspace` —valor **original** de la matriz— y **no**
en `matrix.needs_volumes_root`, que es justo lo que verifica: si el merge del
`include` fallara, la guarda **corre igual y se pone roja** en vez de saltarse a
sí misma. Es el patrón de U256, copiado por la razón por la que es bueno.

Va en **paso aparte** y no unido al `if` de U256 a propósito: la precondición de
`linea-system` es **otra**. No lee `DISK_03/FORCES`; lee
`DISK_02/LINEAS/registry.yaml` — que es **literalmente** el fichero que
`test/helpers/live-volumes.mjs:34-35,50` abre para decidir entre aseverar y omitir.
Exigirle un volumen que no usa sería un rojo falso.

| vector | qué se rompe | guarda | test | dónde |
| --- | --- | --- | --- | --- |
| **A** · nominal | nada | `rc=0` · *root declarado y con carril de lineas: /work/VOLUMES* | `rc=0` · 1 pass / 2 skip / 4 aserciones | **[runner]** |
| **C** · el `include` no aplica (root vacío) | entorno | **`rc=1`** · `::error::ZEUS_VOLUMES_ROOT no llego al job: el include no aplico` | **`rc=1`** · `not ok 1/2` | **[runner]** |
| **D** · root declarado **sin** carril de LINEAS | entorno | **`rc=1`** · `::error::sin DISK_02/LINEAS/registry.yaml no hay carril de lineas…` | **`rc=1`** · `Error: ZEUS_VOLUMES_ROOT declarado pero …/registry.yaml no existe (WP-U261)` | **[runner]** |
| **T** · el cuerpo se va por una salida temprana | el test | n/a | **`rc=1`** · `plan expected 4 assertions but received 0` | **[banco]** |
| **E** · aparece un `id:espana` registrado | la premisa | `rc=0` | el fail-closed **se omite** y **corren los dos titulares** | **[banco]** |

**D es el vector que importa**, porque es el que el helper viejo **se tragaba**:
§2.1 lo mide decidiendo `OMITIR`. Hoy, doble ancla — la guarda del YAML y el
propio test se ponen rojos por separado.

**E** es la prueba de que la complementariedad no es retórica: con un root que
declara `- id: espana` y tiene el directorio, la salida es
`not ok 1 · not ok 2 · ok 3 … # SKIP` — el caso fail-closed se aparta solo y los
titulares toman el relevo. (Rojos porque mi vector es un esqueleto sin datos, que
es lo honesto: mide **la conmutación de rama**, no el smoke.)

**T**: el vector fue una salida temprana insertada tras `t.plan(4)`, medida, y
**revertida** en el mismo turno; no viaja en el commit.

---

## 6 · Reproducción en condición de runner

No en el portátil. El procedimiento, entero:

1. `git clone --depth 2 --branch wp/u261-linea-system-ci file:///C:/S_LAB/wt/z-u261`
   → clon **autónomo** (el worktree comparte objetos con el repo padre; el clon no).
2. Ese clon se monta **de sólo lectura** en `node:22` (Linux) y **dentro del
   contenedor** se vuelve a clonar: así el checkout sale **LF nativo**, no el CRLF
   del árbol de Windows. Verificado: `file …/smoke.mjs` → *«Unicode text, UTF-8
   text»*, sin `with CRLF line terminators`.
3. `npm ci` (nunca `npm install`), y luego **los pasos del job, uno a uno**: el
   `run:` de la guarda ejecutado con `bash -e -c` —el mismo intérprete que usa
   GH Actions— y `npm test -w "@zeus/linea-system"`, leyendo exit codes.
4. La línea base se mide en el **mismo contenedor** haciendo `git checkout HEAD~1`
   (= `4e155eb`, el head que midió el run 30708835271), para que antes y después
   sean el mismo banco.

`node v22.23.2` · Linux · `Ubuntu` es el runner, `node:22` (bookworm) el banco:
**es una aproximación, no el runner**. Lo que la aproximación cubre y el portátil
no: sistema de ficheros sensible a la caja, LF, clon superficial, `npm ci` limpio.

**No afirmo que CI esté verde**: la rama no se empuja (regla 5 del WP) y CI sólo
juzga tras el push. El cierre real es el run de esa rama.

---

## 7 · Qué valida este job, y qué NO

Esto es la parte que no se puede leer por encima.

**Valida** (4 aserciones, siempre que no haya corpus vivo — o sea, siempre en CI):

- que `ZEUS_VOLUMES_ROOT` llegó, resuelve, y su `DISK_02/LINEAS` existe con
  `registry.yaml`;
- que ese registry se **lee de verdad** y produce ≥1 línea (hoy `demo`);
- que **no** hay `espana`, es decir que la premisa del omitido es cierta y no una
  suposición heredada;
- que `startAll()` **falla cerrado** —error nombrado— en vez de levantar dos
  servidores MCP sin su línea. Esto recorre de paso
  `assertVolumesRootBootable()` y `loadLineaData()` sobre el fixture.

**NO valida — y el nombre del job promete mucho más que esto:**

- **nada** de la superficie MCP: ni `/mcp/health`, ni las capabilities
  (`tools/resources/prompts`), ni `get_nodo` / `get_oldid` /
  `get_registros_for_year`, ni las plantillas `linea://…`, ni el puente
  `getResourceByUri` / `getPrompt` / `getPrompts`, ni el catálogo de 5+11 prompts,
  ni `server://card`, ni la puerta de aprobación de `execute-viaje`, ni la caché
  de wikitext, ni el mutex de POST concurrentes. Todo eso son las **86
  aserciones** de `smoke.mjs`, omitidas;
- **nada** del contrato `linea://info` contra `RESOURCE_PAYLOADS`: es la aserción
  única de `resource-contract.test.mjs`, omitida;
- **nada** de `src/logic.mjs`, `src/linea-server.mjs` ni `src/cache-wikitext.mjs`,
  que no tienen test propio en este paquete.

En una frase: **tras este WP el job vigila el arranque del paquete, no el paquete.**
Es más que 0 y bastante menos que su nombre. Encenderlo de verdad exige meter un
corpus `espana` sintético en el repo —hoy prohibido por `.gitignore:18-24`— o
parametrizar `lineaId` en `src/lineas.mjs`; ambas cosas están **fuera** del
alcance de este WP y **merecen WP propio** (§9).

---

## 8 · Higiene

- `npm run lint` → **0 errores**, 18 warnings preexistentes, **ninguno** en
  `linea-system`. `npm run gates` → `gates: OK (0 offenders)`.
- `git status` tras correr las suites muestra 3 ficheros `bin/` de otros paquetes
  como modificados; **comprobado antes de acusar**: `git diff` y `git diff --raw`
  salen **vacíos** sobre los tres — es suciedad de `stat` que deja `npm ci` al
  tocar mtimes, el mismo fenómeno que U256 documentó. **No van en el commit**: se
  añadieron al índice sólo las tres rutas de la obra, nombradas una a una.
- Sin `git stash` (la pila es del repositorio y hay más worktrees vivos), sin
  `npx`, sin escribir fuera del worktree salvo el scratchpad de sesión.
- Los vectores C/D/E usan roots sintéticos creados **en el scratchpad**, nunca
  bajo `VOLUMES/`.
- El comentario de `ci.yml:80-85` (U256) decía «25 de 25»; este WP saca a
  `linea-system` de ese conjunto y hoy son **24** los que reciben la variable
  vacía. Anotado en el propio YAML **sin re-medir** la equivalencia de U256, que
  es medida suya.

---

## 9 · Lo que sigue sin vigilarse (enrutable, no lo arreglo aquí)

1. **`resource-contract.test.mjs` no asevera nada en CI y no hay nada que lo
   destape** salvo leer el TAP. Es 1 aserción omitida permanentemente. Si el
   custodio quiere que ese fichero cuente, la vía es un `espana` sintético en
   repo o `lineaId` parametrizable — no un parche en el fichero.
2. **`src/lineas.mjs` fija `lineaId: 'espana'` para los dos servidores.** Es la
   razón última de que el fixture `demo` no pueda mover ni un test del paquete. Un
   WP que lo haga configurable convierte **86 aserciones omitidas en ejecutables**
   contra un fixture — es, de lejos, el mayor retorno pendiente de esta zona.
3. **`src/start.mjs:28-34` sigue declarando su limitación** (guarda de arranque
   posterior al import). Este WP la esquiva declarando el root; no la cierra.
4. `packages/mesh/linea-system` no tiene ningún test que no dependa del corpus
   para `logic.mjs`, `linea-server.mjs` ni `cache-wikitext.mjs`.

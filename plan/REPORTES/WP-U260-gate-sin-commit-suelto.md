# WP-U260 · el guardián deja de depender de un objeto suelto — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U260) |
| fecha | 2026-08-01 |
| rama | `wp/u260-gate-sin-commit-suelto` · base `838b646` |
| commit(s) | `8c44fd8` — obra completa |
| alcance tocado | `test/gates/arbol-inmutable.test.mjs` · `test/gates/fixtures/matriz-51-28397b8.mjs` (nuevo) · este reporte · fila U260 de `BACKLOG.md` |
| `.github/workflows/ci.yml` | **no tocado** — la vía elegida no lo exige (§4) |
| `scripts/gates/**` · `packages/**` · `package.json` · lockfile | **ninguno** |
| estado propuesto | listo para verificación de cierre |
| push | no intentado · sin merge |

**Marcas de procedencia.** **[runner]** = leído de GitHub Actions con `gh run
view`. **[superficial]** = medido en un `git clone --depth 1` local, que es lo
que produce `actions/checkout@v4` con `fetch-depth: 1`. **[completo]** = medido
en un clon con historial. Nada en este reporte viene sólo del worktree cómodo.

---

## CA de cierre

**`lint + gates` verde en CI** — no puedo afirmarlo: no debo empujar la rama, y
CI sólo corre lo que se empuja (§6.2). Lo que sí está medido es **la condición
del runner reproducida byte a byte**: el mismo clon superficial, el mismo
mensaje de error antes (§2), y los tres pasos del job en verde después (§5).
**Lo declaro como reproducción fiel, no como CI verde.** Es la distinción que
este WP existe para no volver a difuminar.

**El guardián sigue poniéndose rojo contra el defecto histórico** — cumplido y
atacado: replantado el fichero de `28397b8` en la suite viva **dentro del clon
superficial**, el guardián lo caza con sus cinco ofensas (§5.2).

**Sin depender de que un objeto suelto sea alcanzable** — cumplido: cero
lecturas del historial en el camino de la guarda (§3).

---

## 1 · La causa, verificada

`test/gates/arbol-inmutable.test.mjs:442-449` (antes de este WP):

```js
const historico = execFileSync(
  'git',
  ['show', '28397b8:test/gates/matriz-51.test.mjs'],
  { cwd: REPO, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
);
```

Tres hechos, cada uno comprobado, no supuesto:

1. **`28397b8` es un commit real y va 14 por detrás.** `git rev-list --count
   28397b8..HEAD` → `14`; `git merge-base --is-ancestor 28397b8 HEAD` → sí.
2. **El runner clona superficial.** No es lectura del YAML: es el log del job.
   `.github/workflows/ci.yml` no pone `fetch-depth` en ninguno de sus tres
   `actions/checkout@v4` (`:30`, `:92`, `:134`), y el runner imprime el valor
   por defecto que aplica — **[runner]**, job `91375382167`:
   ```
   ##[group]Run actions/checkout@v4
     fetch-depth: 1
   ```
3. **El test murió exactamente ahí.** **[runner]**, mismo job:
   ```
   # fatal: invalid object name '28397b8'.
   not ok 2 - el guardián estático se pone rojo con el defecto histórico real (HEAD~)
     location: '/home/runner/work/Z_SDK/Z_SDK/test/gates/arbol-inmutable.test.mjs:442:1'
     error: |-
       Command failed: git show 28397b8:test/gates/matriz-51.test.mjs
       fatal: invalid object name '28397b8'.
   # fail 1
   ##[error]Process completed with exit code 1.
   ```
   **`# fail 1`**: un único fallo en toda la suite, y es éste. No había nada más
   escondido detrás en ese paso.

El diagnóstico que traía el BRIEF era correcto término a término. Lo he
confirmado, no reescrito.

---

## 2 · La reproducción en clon superficial — ANTES

Herramienta: `git clone --depth 1 --branch <rama> file:///C:/S_LAB/z-sdk`. El
`file://` es necesario: sin él git ignora `--depth` en clones locales y el
banco de pruebas mentiría.

**[superficial]** El clon reproduce la condición del runner, no una parecida:

```
shallow=true · commits=1 · HEAD=838b646
$ git cat-file -e 28397b8   → fatal: Not a valid object name 28397b8   (exit 128)
```

Y la suite, corrida ahí, da **el mismo mensaje que el log de CI**:

```
$ node --test test/gates/*.test.mjs        → EXIT=1
not ok 2 - el guardián estático se pone rojo con el defecto histórico real (HEAD~)
  error: |-
    Command failed: git show 28397b8:test/gates/matriz-51.test.mjs
    fatal: invalid object name '28397b8'.
# tests 57 · pass 56 · fail 1
```

Mismo test, mismo error, mismo exit. Sirve de banco.

---

## 3 · La obra

### 3.1 · El vector, vendorizado

`test/gates/fixtures/matriz-51-28397b8.mjs` — el contenido de
`28397b8:test/gates/matriz-51.test.mjs` (12 538 bytes, 336 líneas) como dato, y
`ORIGEN = { rev, ruta, oid }` con `oid = 76003a3f…41f1`, el SHA-1 del blob.

**Va línea a línea, entre comillas, y no como plantilla.** Dos razones medidas,
no estéticas:

- El auto-chequeo de fixtures del propio `arbol-inmutable.test.mjs:415-423`
  exige que **ningún** fichero de `test/gates/fixtures/` contenga un
  `import … from 'node:fs'` a principio de línea. El fuente histórico tiene
  seis. Entre comillas, ninguna línea empieza por `import`, así que **el
  auto-chequeo sigue en pie sin tocarlo** — no he ablandado esa guarda para
  hacer sitio a mi fixture.
- `core.autocrlf=true`: en Windows el checkout deja **CRLF** (comprobado: los
  `.mjs` del worktree tienen CRLF, el blob de git no). Una plantilla se habría
  tragado esos CRLF **dentro** de la cadena y el contenido habría dejado de ser
  el del blob, distinto en Windows y en Linux. Con las comillas los saltos
  quedan fuera y `LINEAS.join('\n')` reconstruye lo mismo en las dos.

### 3.2 · La fidelidad, comprobada y no prometida

El test compara el SHA-1 del blob que git guardaría para el texto reconstruido
con el declarado en `ORIGEN.oid`:

```js
execFileSync('git', ['hash-object', '-t', 'blob', '--stdin'], { cwd: REPO, input: … })
```

**`hash-object` es función del contenido y no consulta la base de objetos**, así
que esta comprobación **vale igual en el clon superficial** que en uno completo.
No es un check que se apague donde importa: es el mismo en los dos sitios.

Fidelidad verificada por tres caminos independientes antes de commitear:

| camino | resultado |
| ------ | --------- |
| `git hash-object -t blob --stdin` sobre el texto reconstruido | `76003a3f…41f1` |
| `sha1("blob 12538\0" + bytes)` con `node:crypto` | `76003a3f…41f1` |
| `Buffer.compare` contra `git show 28397b8:…` **[completo]** | `0` (idénticos) |

### 3.3 · Firma del defecto, y por qué hacía falta

Las aserciones heredadas (`>= 3` ofensas, `includes('renameSync')`,
`includes('mkdirSync')`) **no bastaban**, y lo sé porque lo medí: neutralizando
**una** de las dos `renameSync` de la fixture, la otra sostenía el `includes` ella
sola y el test seguía verde (§5.3, A2b). Ahora se exigen las cinco mutaciones
**con su línea**:

```
99·mkdirSync · 100·writeFileSync · 130·rmSync · 139·renameSync · 153·renameSync
```

Va como **subconjunto**, no como lista cerrada: el fuente está congelado, así
que esas líneas no pueden moverse por ninguna razón legítima, pero afilar el
guardián —que encontraría *más* ofensas en el mismo fichero— no debe obligar a
tocar este test.

### 3.4 · Procedencia: qué añade y qué NO

Un segundo test confronta que ese OID es **el que vivía en `28397b8:ruta`**. Eso
es un hecho del historial y un clon superficial no tiene historial. **No es la
guarda desactivada en CI** —la guarda del §3.2 y §3.3 corre entera en todas
partes—: es una pregunta distinta, que se declara por TAP en vez de salir verde
en silencio:

```
# historial ausente (clon superficial): 28397b8 no alcanzable, procedencia no confrontable   [superficial]
# historial presente: 28397b8:test/gates/matriz-51.test.mjs confrontado byte a byte          [completo]
```

Y no se contesta a sí misma. **Primera versión tenía ese defecto y lo medí**: la
sonda preguntaba `git cat-file -e ORIGEN.oid`, así que una fixture manipulada
**con su OID recalculado** tampoco estaba en la base de objetos → el test lo
tomaba por «clon superficial» y salía verde **incluso en un clon completo**. La
sonda pregunta ahora por el **commit**, que es independiente de lo que se está
verificando. Ablación A2b, §5.3: con la sonda vieja pasaba; con la nueva, roja.

En la rama sin historial se asevera que **git sí resuelve `HEAD`**: separa «esa
revisión no está» —lo esperado— de «git no está» o «esto no es un repo», que
dejarían el test mudo por un motivo completamente distinto.

---

## 4 · Las vías descartadas, con su precio

| vía | precio | veredicto |
| --- | ------ | --------- |
| **`fetch-depth: 0`** en `ci.yml` | clon completo (1 236 commits) en **27 jobs** para arreglar **un** test; y deja el defecto de diseño en pie: el test seguiría atado a que el historial esté | descartada |
| **Omitir-con-motivo** si el objeto no es alcanzable | apaga la guarda **exactamente en CI**, el único sitio donde su rojo cuesta algo. Un guardián que se apaga donde importa no es un guardián | descartada |
| **Vendorizar (elegida)** | **+16 899 bytes** rastreados (12 538 de fuente + el envoltorio por líneas) y una fixture que hay que mantener honesta — pagado con el hash (§3.2) y la firma (§3.3). `ci.yml` **no se toca**: 0 jobs afectados | **elegida** |

---

## 5 · Los vectores: qué se pone rojo y qué no

Todo lo de esta sección está medido en clones recién hechos, no en el worktree.

### 5.1 · Después: los tres pasos del job

| paso del job | **[superficial]** | **[completo]** |
| ------------ | ----------------- | -------------- |
| `npm run lint` | 0 errores (18 warnings preexistentes) † | 0 errores (18 warnings) |
| `npm run gates` | `gates: OK (0 offenders)` | `gates: OK (0 offenders)` |
| `npm run test:gates` | **58 tests · 58 pass · 0 fail · 0 skipped · EXIT=0** | **58 · 58 · 0 · 0 · EXIT=0** |

† `eslint` necesita `node_modules`, que un clon recién hecho no trae; lo corrí
en el worktree con `npm ci`. **Lo declaro como no medido en el clon superficial**
— y la profundidad del clon no entra en lo que eslint mira.

Nótese `0 skipped`: la fixture no ha convertido un rojo en un omitido.

### 5.2 · El defecto histórico, REPLANTADO — **[superficial]**

La prueba de que el guardián sigue cazando no es que su test pase: es que se
pone rojo cuando el defecto vuelve. Escribí el contenido de la fixture **encima
de `test/gates/matriz-51.test.mjs`**, en el clon superficial, y corrí el barrido:

```
not ok 1 - guardián estático: ningún test de gates escribe sobre el árbol de trabajo
  test/gates/matriz-51.test.mjs:99  · mkdirSync    · identificador anclado `fantasmaDir` · fantasmaDir
  test/gates/matriz-51.test.mjs:100 · writeFileSync · identificador anclado `fantasmaDir` · path.join(fantasmaDir, 'package.json')
  test/gates/matriz-51.test.mjs:130 · rmSync       · identificador anclado `fantasmaDir` · fantasmaDir
  test/gates/matriz-51.test.mjs:139 · renameSync   · identificador anclado `manifest`   · manifest, oculto
  test/gates/matriz-51.test.mjs:153 · renameSync   · identificador anclado `manifest`   · oculto, manifest
```

El guardián caza el defecto real **en la condición del runner**, que es
justamente donde nunca se había podido probar.

### 5.3 · Ablaciones: ¿discrimina, o sólo pasa?

| # | ablación | **[superficial]** | **[completo]** |
| - | -------- | ----------------- | -------------- |
| A1 | replantar el defecto histórico en la suite viva | 🔴 5 ofensas (§5.2) | 🔴 |
| A2a | manipulación ingenua: neutralizar una línea de la fixture | 🔴 hash `df2cbcb1…` ≠ `76003a3f…` | 🔴 |
| A2b | manipulación **coordinada**: neutralizar **y** recalcular el OID | 🔴 `la fixture ya no reproduce el defecto en 139·renameSync` | 🔴 **dos** rojos: firma **y** procedencia (`declara otro OID`) |
| A3 | desafilar el guardián (fuera `renameSync`/`mkdirSync` de `MUTADORES`) | 🔴 `el renombrado del manifiesto rastreado debe salir: mkdirSync, writeFileSync, rmSync` | 🔴 |

A3 es la que importa para «¿sigue discriminando?»: si alguien desafila el
guardián, **la fixture lo delata**. El test no pasa por existir; pasa porque el
guardián todavía muerde.

### 5.4 · LÍMITE declarado

**En un clon superficial, una manipulación coordinada que además preserve las
cinco líneas de `FIRMA_HISTORICA` no se caza.** No hay historial contra el que
confrontar y el hash le cuadra por construcción. En **cualquier clon completo**
—toda máquina de desarrollo, y CI el día que alguien ponga `fetch-depth: 0`— sí
se caza, por procedencia. Lo escribo porque `main` corre superficial: ahí ese
hueco está abierto, y preservar las cinco mutaciones significa que la fixture
**sigue reproduciendo el defecto**, que es lo que la guarda pide.

### 5.5 · El guardián me cazó a mí — y no lo desafilé

La versión intermedia usaba `git cat-file -e <rev>^{commit}` para la sonda. El
guardián estático **se puso rojo contra mi propio arnés**:

```
test/gates/arbol-inmutable.test.mjs:537 · spawn git · subcomando de git que escribe
  'git', ['cat-file', '-e', `${ORIGEN.rev}^{commit}`], { cwd: REPO, … }
```

Es un **falso positivo** suyo: `^{…}` es un pelado de revisión, no un
subcomando; la palabra `commit` cae dentro de `VERBOS_ESCRITORES`
(`arbol-inmutable.test.mjs:89-92`). Tenía dos salidas y elegí la barata:
**cambiar mi idioma** (`cat-file -t <rev>` + comparar la salida con `'commit'`)
en vez de tocar la regla. Ablandar `VERBOS_ESCRITORES` para que quepa mi arnés
habría sido, literalmente, el defecto que este guardián existe para impedir.
**Queda anotado como falso positivo conocido**, en el código y aquí; no lo
enruto como WP porque hoy no tiene ofensor vivo y cerrarlo toca la regla.

---

## 6 · La «intermitencia»: caracterizada — **no era intermitencia**

El BRIEF pedía averiguar por qué el mismo job salió `success` en el run anterior
(`30697838778`). **La respuesta es que no era el mismo código.**

**[runner]** — estado del job `lint + gates` en `main`, cruzado con si el
fichero del test existía en ese SHA:

| run | SHA | `lint + gates` | ¿existe `arbol-inmutable.test.mjs`? |
| --- | --- | -------------- | ----------------------------------- |
| 30648340641 | `ba6e12a` | ✅ success | no |
| 30652973718 | `26d1470` | ❌ failure | no |
| 30670414966 | `f307e52` | ❌ failure | no |
| 30675013551 | `97a5d22` | ❌ failure | no |
| 30675763651 | `b95c42b` | ❌ failure | no |
| 30676280165 | `0dc2ea3` | ❌ failure | no |
| **30697838778** | `20a89f6` | **✅ success** | **no** |
| **30702322459** | `846f01c` | **❌ failure** | **sí** |

Tres conclusiones, cada una con su prueba:

1. **El `success` de `30697838778` no prueba nada sobre este test.** En
   `20a89f6`, `git cat-file -e 20a89f6:test/gates/arbol-inmutable.test.mjs` →
   *«exists on disk, but not in `20a89f6`»*. **El fichero no existía**; entró en
   `1fdd3da` (U252), que es **posterior**.
2. **Nunca hubo verde con este test.** `1fdd3da…846f01c` viajaron en **un solo
   push**, así que `30702322459` es **el primer y único run de CI que ha
   contenido `arbol-inmutable.test.mjs`** — y falló. `gh run list
   --workflow=ci.yml` no muestra **ningún** run en rama `wp/**` desde el
   2026-07-24: el test nunca vio un runner antes del merge. **Cero
   intermitencia: una sola muestra, roja.**
3. **Los rojos de antes eran OTRO defecto, ya cerrado.** **[runner]**, run
   `30676280165`: el paso que moría era `npm run gates`, **no** `test:gates`, y
   el log dice qué gate y sobre qué:
   ```
   gates: FAIL (3 offender(s))
     [two-games] packages/engine/linea-kit/src/curation.mjs:56 — matched delta: …
     [two-games] packages/engine/linea-kit/src/curation.mjs:68 — matched delta: …
     [two-games] packages/engine/volumes-ops/src/driver-lineas.mjs:21 — matched delta: …
   ```
   Es el gate **two-games**, que cerró U202-B2 (`50f5b52` + aceptación `726a8a4`,
   *«el gate del monorepo vuelve a verde tras dos olas en rojo»*) — y por eso
   `20a89f6` salió verde. **El rojo se movió de paso, no reapareció.** No hay un
   segundo defecto debajo del mío en este job: hoy `npm run gates` da
   `OK (0 offenders)` en los dos clones (§5.1).

### 6.1 · Hallazgo estructural: CI no ve las ramas de WP

`ci.yml:8-10` **sí** dispara en `wp/**`. Pero los workers no empujan (regla del
swarm), así que en la práctica **CI sólo corre sobre `main`, después del merge**.
De ahí que «verde en local, rojo en CI» se descubra siempre tarde. No lo enruto
como WP —tocar el protocolo de push no es mío— pero es la causa de segundo orden
de este WP y de U256, y merece decisión del custodio.

### 6.2 · Lo que NO puedo afirmar

**No he visto `lint + gates` verde en un runner con este commit**, porque no
debo empujar la rama. Lo que hay es la condición del runner reproducida (§2, §5)
y la evidencia de que el único fallo del paso era éste (`# fail 1`, §1). El
cierre real es un run de CI tras el merge.

---

## 7 · Hermanos: barrido por operación

Barrido de `test/**`, `packages/**/test/**`, `e2e/**` y `scripts/**` buscando
**la operación** —depender del historial, de una rama remota, de una ruta
absoluta, de un fichero no rastreado, o auto-omitirse en silencio— y no el
nombre de un comando.

### 7.1 · Dependencia del historial: **uno solo, el mío**

`git show 28397b8:…` en `arbol-inmutable.test.mjs:445` era **el único** uso de un
objeto no-HEAD en código ejecutable. Lo demás son **falsos hermanos** y los dejo
escritos para que nadie los «arregle»:

- **`git ls-files` / `git status`** (`arbol-inmutable.test.mjs:144`,
  `conjunto-lectura.mjs:63`, `licencia.test.mjs:110,395`,
  `matriz-51.test.mjs:222`) → miran índice y árbol. **Sanos en superficial.**
- **`git cat-file --batch` alimentado con `HEAD:<ruta>`** (`conjunto-lectura.mjs:80`,
  `licencia.test.mjs:119-123`, `matriz-51.test.mjs:102-106`) → un clon `--depth 1`
  trae el **árbol y los blobs completos** del commit punta. **Sanos.** Verificado
  de hecho: esas suites pasan en el clon superficial (§5.1).
- **SHAs en prosa**: `ssb-system/test/export.test.mjs:264` y
  `linea-kit/test/curation-sidecar.test.mjs:9` citan `87bd93f` **en un
  comentario**. No se ejecuta.
- **`scripts/gates/scan.mjs:574`**: `git ls-files` en `try/catch` con caída a
  recorrido de disco; degrada **más estricto**, por diseño.

**Aviso para quien toque el checkout**: `matriz-51.test.mjs:113` asevera
`!/ (missing|ambiguous)$/` y `licencia.test.mjs:129` asevera `!/ missing$/`
sobre la cabecera de `cat-file`. Es correcto y fail-closed hoy, pero **un clon
parcial**
(`--filter=blob:none`, que **no** es lo que hace `fetch-depth: 1`) los pondría
rojos. Si alguien añade filtrado al checkout, empieza por ahí.

### 7.2 · Auto-omitidos mudos: dos, y **ninguno es de clon superficial**

Reportados porque el barrido era «por operación» y estos son la misma clase de
daño —verde sin aseverar—, no porque los toque este WP:

- **`packages/engine/linea-kit/test/forces-loader.test.mjs:58-64`** — seis `..`
  desde `…/linea-kit/test` caen **dos niveles por encima de la raíz** del repo
  (`C:/S_LAB/VOLUMES`, que no existe; en el runner `/home/runner/work/VOLUMES`,
  tampoco). `console.log` + `return` ⇒ **`ok`**. Nunca alcanza el
  `VOLUMES/DISK_03/FORCES/registry.json` **que sí está rastreado**. Es el
  omitido que U256 fue a tapar con la guarda de `ci.yml:116-117`; **la guarda
  impide el verde mudo del job, pero la ruta del test sigue mal**.
- **`packages/engine/linea-kit/test/validate-loader.test.mjs:191-194`** — misma
  forma (`console.log('⏳ VOLUMES root missing…')` + `return` ⇒ **`ok`**), pero su
  `resolveLiveVolumesRoot()` **sí** incluye la raíz del repo entre los
  candidatos, así que hoy acierta y valida de verdad. El riesgo es el mecanismo,
  no el resultado: el día que el resolutor falle, la pérdida es invisible.

Los dos son **P2 de higiene, no P0**: no rompen CI hoy. **Fuera de mi
ALCANCE_DIFF**; los dejo enrutables.

### 7.3 · Rutas fuera del repo (no las toco, quedan censadas)

`packages/mesh/force-system/test/smoke.mjs:37-47` resuelve `VOLUMES` **fuera** del
repo y falla en abierto — pero ese workspace **no está en la matriz de `ci.yml`**,
así que nadie lo ve. `editor-ui/test/routes.mjs:19-57` y las tres suites del
corpus `espana` se omiten **declarándolo** (`# SKIP`), que es la forma honesta.
`http-contract` y `protocol` tienen smokes de tipos que caen a `npx` con red.

---

## 8 · Higiene

- **`git stash`**: no usado, ni una vez.
- **`npx`**: no usado.
- **Escrituras**: sólo dentro de mi worktree. Los clones de prueba y los
  scripts de ablación viven en el scratchpad de sesión, fuera del repo.
- **`npm ci`** (nunca `npm install`) para poblar `node_modules`, que faltaba.
- **Rastreados sucios tras correr las suites**: tres —
  `packages/engine/{feed-kit/bin/jetstream-sync.mjs, linea-kit/bin/linea-kit.mjs,
  playbook-kit/bin/run-playbook.mjs}`. **Comprobado antes de acusar**:
  `git diff` sobre ellos sale **vacío**; es reescritura de finales de línea de
  `npm ci` sobre los bin de workspace, no contrabando y no de las suites.
  **No commiteados.**
- **La suite no ensucia el árbol**: el guardián dinámico pasó en los dos clones.

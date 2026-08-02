# WP-U253c · El censo estático era más débil de lo que decía ser, y la guarda funcionaba por accidente

Rama `wp/u253c-censo-estatico` · worktree `C:/S_LAB/wt/z-u253c` · Node v22.21.1 · win32.

**Alcance tocado:** `packages/mesh/ssb-system/**` y este reporte. Nada más.
Ni `packages/engine/volumes-ops/**`, ni `VOLUMES/**`, ni `package.json` raíz, ni
el lockfile (verificado por hash, §8).

---

## 0 · Resumen, con la tesis corregida

1. El censo estático veía **1 de 5** notaciones de escritura contra el
   manifiesto. La propuesta que estaba escrita (`|resolveManifestPath` en
   `:397`) subía a **3 de 5**. Ahora ve **5 de 5** de esos vectores.
2. `PRIMITIVAS_DE_ESCRITURA` era sólo la cara síncrona de `node:fs`. Un
   `writeFile` de `fs/promises` **con el token a la vista** era invisible.
3. El probe CA-5a de U205 **pasa por accidente**. Se demuestra con un mutante
   que lo deja **VERDE mientras `src/export.mjs` escribe el manifiesto en cada
   export** (§5, M3). Esa es la joya del WP y se sostiene entera.
4. **Lo que NO se sostiene, y era mío: «se cierra por los dos lados».** La
   contrarrevisión inyectó un mutante con `openSync`/`writeSync(fd)` que
   reescribe el manifiesto y **pasa las tres guardas a la vez** —CA-5a, mi
   sonda por hooks y mi guarda de notación—. Lo reproduje: **47 pass / 0 fail**
   con el manifiesto reescrito en cada export (§5, M4). La tesis se retira.
5. La clase real de la ceguera no es «un índice computado». Es ésta:

   > **Mientras el instrumento sea una lista de nombres, el mutante que evade
   > la lista existirá.**

   Lo que sí se puede afirmar tras esta vuelta es que la lista está
   **declarada, medida y sincronizada** entre censo y sonda (§4.3, §6).
6. Lo que los instrumentos siguen sin ver está **enumerado y medido**, no
   prometido: **7** clases de ceguera, cada una con un escritor vivo (§6).

Suite: **47 pass / 0 fail** (antes de este WP: 27/27). Lint limpio.

### Lo que cambió tras la devolución

| # | qué | dónde |
|---|---|---|
| B1 | tesis «se cierra por los dos lados» **retirada**; mutante `openSync`/`writeSync` reproducido y declarado | §0.4, §5 M4, §6 |
| B2 | `fs.promises` (la **propiedad**) ahora envuelta — escribía por las 4 notaciones sin anotarse | `hooks-fs.mjs`, `U253c-3f` |
| B3 | las dos mitades de la sonda **comparten la lista** (eran 8 vs 15), medido en ejecución | `correr.mjs`, `U253c-3e` |
| B4 | la ceguera renombrada a **«la lista es cerrada»**, con 5 primitivas ausentes medidas | `U253c-5f`, `U253c-5g` |
| (c) | la razón de ALLOWLIST de `export.mjs` cita `U253c-3c`, no CA-5a | `export.test.mjs` |

---

## 1 · Cómo re-medí (los dos hallazgos, verificados de cero)

No di por buena ninguna de las dos afirmaciones del encargo. Las dos se
comprueban aquí con código que se ejecuta.

### 1.1 · Qué intercepta realmente un monkey-patch de `fs`

Orden:

```
$ node run.mjs        # 5 módulos reales, cada uno con una notación distinta,
                      # bajo el monkey-patch exacto de CA-5a
```

Salida literal:

```
default    interceptado=true
named      interceptado=false
star       interceptado=false
require    interceptado=true
promises   interceptado=false
```

El hallazgo se confirma **exactamente**: `import fs from` y `createRequire` sí;
`import { … } from`, `import * as` y `fs/promises` no. Esto está ahora dentro de
la suite como **`U253c-3a`**, midiéndolo en cada ejecución en vez de recordarlo.

`src/export.mjs:114` usa `import fs from 'node:fs';` — comprobado. Y
`volumes-ops/src/manifest.mjs:25` y `ledger.mjs:6` usan import nombrado, también
comprobado. Las dos mitades del hallazgo (2) son ciertas.

### 1.2 · Qué ve el censo

El censo heredado (`export.test.mjs:394-400` antes de este WP):

```js
const PRIMITIVAS_DE_ESCRITURA =
  /\b(writeFileSync|appendFileSync|createWriteStream|rmSync|unlinkSync|renameSync|copyFileSync)\b/;
const TOKEN_DE_MANIFIESTO = /(['"`])volumes\.json\1|MANIFEST_FILE_NAME/;
```

Contra cinco ofensores que son **módulos reales, escritos a disco, importados y
ejecutados contra un root temporal** (no cadenas que imiten código):

| ofensor | vector | heredado | propuesta `:397` | vigente |
|---|---|:--:|:--:|:--:|
| **N** ingenua | `writeFileSync(join(root,'volumes.json'))` | ✅ | ✅ | ✅ |
| **A** localizador público | `writeFileSync(resolveManifestPath())` | ❌ | ✅ | ✅ |
| **B** alias de primitiva y localizador | `escribeBytes(dondeVive())` | ❌ | ✅ | ✅ |
| **C** composición de cadena | `join(root, ['volumes','json'].join('.'))` | ❌ | ❌ | ✅ |
| **D** `fs/promises` con el token | `await writeFile(join(root,'volumes.json'))` | ❌ | ❌ | ✅ |
| | **total** | **1/5** | **3/5** | **5/5** |

Medido por `U253c-1b`, que además exige que los cinco **escriban de verdad**
(`U253c-1a`): un ofensor que no escribe no prueba nada.

> **Corrección de una cifra del encargo.** El encargo decía «caza tres de los
> cuatro ofensores». Con el conjunto {N, A, B, C} eso es exacto: la propuesta
> cierra A y B y deja abierta C. Contando también a D —que falla por la lista de
> **primitivas**, no por el token— son **3 de 5**. Las dos puertas que quedaban
> abiertas son independientes entre sí y ninguna se cierra tocando `:397`.

`A` y `B` importan el localizador **público** de `@zeus/volumes-ops`, que es
dependencia **declarada** de `@zeus/ssb-system` (`package.json`, dep añadida en
`4494e22`). La evasión no necesita nada privado ni ninguna ruta relativa: la
puerta la abre una API exportada a propósito.

---

## 2 · CA-1 · Los cinco ofensores, cada uno con su ancla

Las anclas del nombre pasan de dos a cuatro, **separadas y con nombre** para que
el censo de mutación pueda amputarlas de una en una:

```js
const ANCLAS_DE_MANIFIESTO = [
  { id: 'literal',     re: /(['"`])volumes\.json\1/ },
  { id: 'constante',   re: /\bMANIFEST_FILE_NAME\b/ },
  { id: 'localizador', re: /\bresolveManifestPath\b/ },   // ← nueva
  { id: 'fragmento',   re: /(['"`])volumes\1/ }           // ← nueva
];
```

Ancla por ofensor, medido por `U253c-1c`:

| ofensor | ancla que lo caza |
|---|---|
| N | `literal` |
| A | `localizador` |
| B | `localizador` |
| C | `fragmento` |
| D | `literal` |

**Una predicción mía que el test tumbó.** Escribí que N y D entrarían por
`literal` **y** `fragmento`. Es falso: `/(['"`])volumes\1/` exige la comilla de
cierre pegada a `volumes`, así que **no casa dentro de `'volumes.json'`**. Las
dos anclas son **disjuntas**, no anidadas — y por eso hacen falta las dos. La
corrección está escrita en el propio test, junto a la tabla.

**El precio del ancla `fragmento`, dicho en números.** Marca cualquier literal
`'volumes'` suelto. El censo pasa de **6 a 9** ficheros marcados en el repo. Los
tres nuevos son falsos positivos y entran en la ALLOWLIST con su razón medida:

| fichero | por qué casa | por qué NO es escritor del manifiesto |
|---|---|---|
| `volumes-ops/src/import.mjs` | `join(packRoot,'volumes')` `:221`; el `writeFileSync` que casa la primitiva está en su **docstring** `:10` | escribe el manifiesto **sólo** vía `sealManifest` `:700` |
| `volumes-ops/src/pack-adapter.mjs` | `PACK_DATA_DIR = 'volumes'` `:63` | su único `writeFileSync` `:290` va a `<packRoot>/manifest.json` |
| `volumes-ops/src/state.mjs` | un **ejemplo JSON del docstring** `:20` | escribe `volumes.state.json`, que por contrato no entra en el hash |

Es una elección, no un descuido: un falso positivo cuesta una línea de
allowlist; una ceguera no cuesta nada **hasta el día que cuesta el manifiesto**.

---

## 3 · CA-2 · `fs/promises` en las primitivas, con el caso rojo

`PRIMITIVAS_DE_ESCRITURA` añade la cara asíncrona:

```
… |truncateSync|writeFile|appendFile|rm|unlink|rename|copyFile|truncate)\b/
```

El caso rojo es el ofensor **D**, y es rojo por un motivo distinto al de C —
por eso va en su propio test (`U253c-2`):

```js
assert.equal(TOKEN_HEREDADO.test(D), true);        // el token SÍ estaba a la vista
assert.equal(PRIMITIVAS_HEREDADAS.test(D), false); // y aun así: invisible
assert.equal(marcaHeredada(D), false);
assert.equal(marcaPropuesta(D), false);            // `|resolveManifestPath` no arregla esto
assert.equal(marcaEscritorDeManifiesto(D), true);  // ahora sí
```

Y se comprueba que `writeFile` y `writeFileSync` son **dos anclas distintas**,
no una disfrazada de la otra:

```js
assert.equal(/\bwriteFileSync\b/.test('await writeFile(p, x);'), false);
assert.equal(/\bwriteFile\b/.test('writeFileSync(p, x);'), false);
```

Ensanchar las primitivas **no movió** el censo del repo: sigue en 9 ficheros.

---

## 4 · CA-3 · El punto que decide el WP

El encargo daba dos salidas aceptables. **Se entregan las dos**, porque ninguna
sola cubre lo que la otra cubre.

### 4.1 · Salida 1 — una sonda que no depende de la notación

`packages/mesh/ssb-system/test/probe/hooks-fs.mjs` + `correr.mjs`.

No parchea el módulo: lo **sustituye**. Un hook `resolve` desvía `node:fs` y
`node:fs/promises` a un URL propio y `load` sintetiza ahí un módulo que reexporta
el real con las primitivas envueltas. Como lo que el importador recibe **ya es**
el envoltorio, da igual con qué notación lo importe.

**Los hooks ESM solos no bastan, y esto se midió.** No gobiernan la resolución
CJS, así que `createRequire(...)('fs')` se les escapa:

```
default    interceptado=true
named      interceptado=true
star       interceptado=true
require    interceptado=false     ← los hooks ESM no llegan aquí
promises   interceptado=true
```

Por eso `correr.mjs` hace **las dos cosas**, en este orden: instala el canal,
registra los hooks ESM, y **luego** parchea el objeto CJS `fs` — que es
justamente lo único que el monkey-patch de CA-5a sí sabía hacer. Unión:

```
default    interceptado=true
named      interceptado=true
star       interceptado=true
require    interceptado=true
promises   interceptado=true
```

Está en la suite como **`U253c-3b`**, y además comprueba que las dos mitades
están vivas (el parte etiqueta cada anotación con su origen: `cjs`, `fs`,
`fs/promises`).

Vive en un proceso hijo por una razón dura, no por comodidad:
`module.register()` sólo gobierna lo que se resuelve **después** de registrarse,
y `export.test.mjs` importa `../src/export.mjs` de forma **estática**. Registrar
los hooks dentro de la suite llegaría tarde siempre.

**`U253c-3c`** es la CA-5a re-hecha sobre esta sonda: export completo, 0
escrituras contra `<root>/volumes.json`, control de que el export **sí** escribe
(20 anotaciones: 10 escrituras reales, vistas por las dos mitades — el doble
conteo es deliberado, silenciar una mitad para evitarlo silenciaría una clase
entera de notación).

### 4.1.bis · Dos agujeros de la sonda que la contrarrevisión encontró · CERRADOS

**B2 · `fs.promises` no estaba envuelto.** El default se replicaba con
`Object.assign({}, real, {…envueltos})`, y `promises` no estaba entre los
envueltos: pasaba el objeto real intacto. Medido con mi propio `correr.mjs`,
antes del arreglo:

```
  b2-default   escribio=true  anotado=false
  b2-named     escribio=true  anotado=false
  b2-star      escribio=true  anotado=false
  b2-require   escribio=true  anotado=false
  b2-modulo    escribio=true  anotado=true      ← sólo el MÓDULO fs/promises
```

Después (mismo comando, `U253c-3f` lo fija en la suite):

```
  b2-default   escribio=true  anotado=true
  b2-named     escribio=true  anotado=true
  b2-star      escribio=true  anotado=true
  b2-require   escribio=true  anotado=true
  b2-modulo    escribio=true  anotado=true
```

Mi §4.1 decía «da igual con qué notación lo importe». Era falso para la
**propiedad** `fs.promises`, que es otra puerta distinta del módulo
`node:fs/promises`. Ahora es cierto para las dos.

**B3 · Las dos mitades vigilaban listas distintas** — 8 nombres en el parche
CJS frente a 15 en los hooks, con las siete asíncronas cubiertas por una mitad
y no por la otra. Y mi propio docstring advertía contra exactamente eso. Cerrado
por construcción: `correr.mjs` **importa** `PRIMITIVAS` de `hooks-fs.mjs` en vez
de mantener copia. Y no se deja a la buena fe: el modo `listas` hace que cada
mitad **declare en ejecución** lo que realmente envolvió, y `U253c-3e` exige que
coincidan y que contengan al censo:

```
esm.fs            15 nombres  ═  cjs.fs            15 nombres
esm['fs.promises'] 7 nombres  ═  cjs['fs.promises'] 7 nombres
invariante «censo ⊆ sonda»: 0 primitivas huérfanas
```

### 4.2 · Salida 2 — la dependencia, declarada y guardada

CA-5a se queda **en la suite** (es rápida y en proceso), pero su dependencia deja
de ser implícita:

- su docstring la **declara**, con la tabla de qué ve y qué no y con el resultado
  del censo de mutación escrito al lado;
- **`U253c-3d`** la **guarda**: declara la notación de `node:fs` de cada fichero
  de `src/` y enrojece ante cualquier alta, baja o cambio.

```js
const NOTACION_DECLARADA = {
  'export.mjs':   ['default'],
  'loader.mjs':   ['default'],
  'sync-cli.mjs': ['default']
};
```

Se declaran los **tres** importadores de `node:fs`, no sólo el que hoy escribe:
un fichero sin escrituras hoy puede ganar una mañana, y la guarda debe cazar la
deriva de notación antes que la deriva de comportamiento.

**Y el clasificador tenía dos defectos, corregidos.** `promises` y `require` no
estaban anclados a una sentencia `import`, así que **un comentario** que
nombrase `'node:fs/promises'` enrojecía la guarda. Ahora las cinco notaciones se
anclan a `import` a principio de línea, y `require` exige además una llamada con
`'fs'` literal como argumento. Sus dos cegueras restantes —`await
import('node:fs')` y un `createRequire` aliasado— se **declaran y se miden**
(`U253c-3g`): devuelven `[]`, con lo que el fichero desaparece de la tabla
declarada y `U253c-3d` enrojece igual. Ciego, pero **no en silencio**.

### 4.3 · Lo que la sonda sigue sin cerrar, y por qué no se cierra alargando la lista

El mutante B1 de la contrarrevisión pasa **las tres** guardas:

```js
{ const __p = path.join(volumesRoot,'volumes.json'); const __b = fs.readFileSync(__p);
  const __fd = fs.openSync(__p,'w'); fs.writeSync(__fd,__b); fs.closeSync(__fd); }
```

Ni `openSync` ni `writeSync` están en las 6 primitivas de CA-5a, ni en las 15 de
la sonda, ni en el censo; y **no añade ninguna sentencia `import`**, así que la
guarda de notación sigue leyendo `['default']` y verde.

**No se cierra ensanchando la lista del censo**, y es una decisión razonada:
`openSync` aparece por todo el repo y la ALLOWLIST —que es el mecanismo que hace
legible al censo— explotaría. Tampoco basta ensanchar sólo la sonda: envolver
`openSync` exigiría además mirar los flags para no anotar **lecturas** (el
export lee el manifiesto legítimamente, y anotarlo volvería `U253c-3c` rojo en
falso), y aun así quedarían `writevSync`, el `FileHandle` y lo que Node añada
mañana. Lo que se hace en su lugar es **declararlo y medirlo** (§6, `U253c-5f`
y `5g`).

---

## 5 · CA-4 · Censo de mutación sobre lo entregado

### 5.1 · Sobre la notación, en el fichero vigilado de verdad

Se muta `src/export.mjs` **en disco**, se corre la suite entera, se restaura
desde una copia de respaldo (no con `git checkout`, que se llevaría por delante
la corrección de §7). Orden (bucle sobre `M0 M1 M2 M3 M4`):

```
$ cp $SRC $S/base.mjs
$ node mutar.mjs $M
$ npm test -w @zeus/ssb-system 2>&1 | grep -E "^(ok|not ok) (12|22|23) |^# (pass|fail) "
$ cp $S/base.mjs $SRC
```

- `12` = **CA-5a** (la sonda heredada, en proceso)
- `22` = **U253c-3c** (la sonda por hooks, proceso hijo)
- `23` = **U253c-3d** (la guarda de notación)

**M0 · control, sin mutar** — salida literal:

```
    ok 12 - CA-5a · POR RUTA DERIVADA: un export completo no escribe NI UNA VEZ en <root>/volumes.json
    ok 22 - U253c-3c · export completo bajo la sonda por HOOKS: 0 escrituras contra el manifiesto
    ok 23 - U253c-3d · GUARDA: la dependencia de CA-5a sobre la notación queda DECLARADA
    # pass 47
    # fail 0
```

**M1 · `import fs from` → `import * as fs from`** — salida literal:

```
    not ok 12 - CA-5a · POR RUTA DERIVADA: un export completo no escribe NI UNA VEZ en <root>/volumes.json
    ok 22 - U253c-3c · export completo bajo la sonda por HOOKS: 0 escrituras contra el manifiesto
    not ok 23 - U253c-3d · GUARDA: la dependencia de CA-5a sobre la notación queda DECLARADA
    # pass 44
    # fail 3
```

La guarda enrojece, **y la sonda por hooks se queda verde**: no le afectó el
cambio de notación. Las dos mitades de la CA-3, en una sola medición.
CA-5a cae aquí por su **control** (`destinos.length > 0`): al cegarse del todo,
no ve **ninguna** escritura. Eso la salva sólo en el caso todo-o-nada.

**M2 · mixta: default intacto + import nombrado OCULTO que sí escribe el
manifiesto** — salida literal:

```
    not ok 12 - CA-5a · POR RUTA DERIVADA: un export completo no escribe NI UNA VEZ en <root>/volumes.json
    not ok 22 - U253c-3c · export completo bajo la sonda por HOOKS: 0 escrituras contra el manifiesto
    not ok 23 - U253c-3d · GUARDA: la dependencia de CA-5a sobre la notación queda DECLARADA
    # pass 34
    # fail 13
```

CA-5a enrojece — **pero no por lo que parece**. El detalle de su fallo:

```
    Expected values to be strictly deep-equal:
    + actual - expected
    + Buffer(21) [Uint8Array] [
    - Buffer(205) [Uint8Array] [
```

Es la **comparación de bytes** del final (`assert.deepEqual(readFileSync(manifestPath), antes)`),
no `contraManifiesto`. Su sonda estuvo **ciega**; la salvó una comprobación que
no es la sonda. Distinción que hay que sostener, porque lleva directamente a:

**M3 · la misma evasión, reescribiendo BYTES IDÉNTICOS** — salida literal:

```
    ok 12 - CA-5a · POR RUTA DERIVADA: un export completo no escribe NI UNA VEZ en <root>/volumes.json
    not ok 22 - U253c-3c · export completo bajo la sonda por HOOKS: 0 escrituras contra el manifiesto
    not ok 23 - U253c-3d · GUARDA: la dependencia de CA-5a sobre la notación queda DECLARADA
    # pass 44
    # fail 3
```

> **Este es el resultado que decide el WP.** `src/export.mjs` escribe
> `<root>/volumes.json` **en cada export**, y **CA-5a pasa VERDE**: su sonda no
> ve la escritura (import nombrado) y su comprobación de bytes no la ve (bytes
> idénticos). No hay ni un test rojo en la suite heredada. La sonda nueva y la
> guarda nueva la cazan las dos.
>
> «Funciona por accidente» no es una sospecha: es un mutante ejecutable.

**M4 · el mutante de la contrarrevisión (B1): `openSync`/`writeSync(fd)`, bytes
idénticos, sin una sola sentencia `import` nueva** — salida literal:

```
    ok 12 - CA-5a · POR RUTA DERIVADA: un export completo no escribe NI UNA VEZ en <root>/volumes.json
    ok 22 - U253c-3c · export completo bajo la sonda por HOOKS: 0 escrituras contra el manifiesto
    ok 23 - U253c-3d · GUARDA: la dependencia de CA-5a sobre la notación queda DECLARADA
    # pass 47
    # fail 0
```

Testigo **independiente de los tres instrumentos** (`statSync` + sha256), mismo
export, con y sin M4:

```
=== SIN MUTAR ===
mtime movido = false      sha igual = true
=== CON M4 ===
mtime movido = true       sha igual = true      ← el manifiesto SE REESCRIBE
```

> **Y esto tumba mi tesis, no la del encargo.** Escribí «se cierra por los dos
> lados». **No se cierra.** M4 es M3 un nivel más abajo: la misma clase de
> accidente, evadiendo ahora también los instrumentos que yo traía. Lo he
> reproducido en mi propio árbol y lo dejo escrito aquí arriba, no en una nota
> al pie. Lo que sí queda cerrado es M1-M3; lo que queda **declarado y medido**
> es M4 (§4.3 y §6, `U253c-5f`/`5g`).

Restauración verificada tras cada vuelta:
`sha256(src/export.mjs) = 2a3846657f06e5a7ad06a20c7abdbe5a7079a19c73856280e3a1787481f1723e`,
igual que antes de empezar. (El hash difiere del de la primera vuelta porque §7
corrige ahora una frase de la cabecera; por eso el bucle restaura desde copia y
no con `git checkout`.)

### 5.2 · Sobre el censo mismo, dentro de la suite

`U253c-4a` reproduce las tres mutaciones de notación **en memoria** y exige que
la guarda las lea y las rechace. `U253c-4b` amputa las anclas de una en una y
exige que el ofensor correspondiente **se vuelva invisible**:

| ancla amputada | ofensores que se ciegan |
|---|---|
| `literal` | N, D |
| `localizador` | A, B |
| `fragmento` | C |

Si una amputación **no** ciega a su ofensor, el test falla: eso significaría que
esa ancla no es la que lo caza y la tabla estaría mintiendo.

---

## 6 · CA-5 · Lo que este censo SIGUE sin ver

Enumerado **y medido**. Cada ceguera es un escritor real del manifiesto que el
censo vigente no marca; el test exige que **siga siendo invisible**, de modo que
si un día deja de serlo, la lista se entera.

| # | ceguera | medida en | ciega también a la sonda |
|---|---|---|:--:|
| **0** | **la LISTA DE PRIMITIVAS es una enumeración CERRADA e INCOMPLETA** | `U253c-5f`, `5g` | **sí** |
| 1 | el **nombre de la ruta** montado sin ningún literal (`['v','o',…].join('')`) | `U253c-5a` | no |
| 2 | el **nombre de la primitiva** montado (`fs['write'+'File'+'Sync']`) — una de las formas de esquivar la lista | `U253c-5a` | no |
| 3 | **cruce de proceso** (`execFileSync(node, ['-e', …])`) | `U253c-5a`, `5e` | sí |
| 4 | **reparto entre ficheros**: uno tiene el nombre, otro la primitiva | `U253c-5b` | n/a |
| 5 | **alcance**: dirs saltados, extensiones y raíces no barridas | `U253c-5c`, `5d` | n/a |
| 6 | **naturaleza estática**: no sabe si la línea corre, ni cuándo termina | `U253c-5d` | n/a |

**(0) es la de fondo, y es nueva en esta vuelta.** No es «un índice computado»:
es que `node:fs` tiene más maneras de escribir que nombres hay en la lista, y
cada una que falta es una puerta **con el token del manifiesto a la vista**.
Cinco medidas en `U253c-5f`, todas escritoras vivas del manifiesto y todas
invisibles al censo:

| primitiva ausente | qué hace |
|---|---|
| `openSync` + `writeSync(fd)` | reescribe por descriptor — **es el mutante B1** |
| `writevSync(fd, [buf])` | la misma puerta, otro nombre |
| `ftruncateSync(fd, 3)` | no escribe: **destruye el sello** |
| `cpSync(origen, manifiesto)` | copia encima |
| `filehandle.write()` | se envuelve `open`, no el handle que devuelve |

Y `U253c-5g` mide que **la sonda está igual de ciega** a ellas, con control
positivo (una primitiva que sí está en la lista tiene que caer):

```
  writeSync-fd           escribio=true   anotado=false
  handle-write           escribio=true   anotado=false
  control-writeFileSync  escribio=true   anotado=true
```

> **Mientras el instrumento sea una lista de nombres, el mutante que evade la
> lista existirá.**

No se cierra alargando la lista del censo (§4.3): `openSync` está por todo el
repo y la ALLOWLIST explotaría. Lo que sí se puede afirmar es que la lista está
**declarada, medida y sincronizada** entre censo y sonda (`U253c-3e`).

Los demás detalles, que tampoco conviene suavizar:

- **(4) es la más grande de las clásicas.** El censo es co-ocurrencia **por
  fichero**. Partir el ofensor en dos módulos —uno que sabe el nombre y no
  escribe, otro que escribe y no sabe el nombre— lo hace invisible **sin ninguna
  astucia de notación**, y sigue invisible aunque el escritor **importe
  explícitamente** al módulo que sabe el nombre. Cerrarlo pide análisis de flujo
  de datos, que este censo no hace y no promete.
- **(5)** se mide sobre un árbol **sintético** con el mismo recorrido que usa
  CA-5c, con control positivo. Las raíces no barridas ya no se declaran a ojo:
  `U253c-5d` comparte con CA-5c la constante `RAICES_CENSADAS` y **censa el
  complemento entero**, exigiendo que esté a cero. Hoy lo está, así que la
  ceguera es **latente**, no activa. Lista completa medida:

  ```
  raices censadas   : packages scripts e2e
  raices NO barridas: .changeset .github .vscode VOLUMES data docs examples plan sincronia test
  ```

  (Mi versión anterior nombraba cuatro y omitía seis; y el test medía el
  **listado de directorios**, no el censo — habría seguido verde mintiendo si
  CA-5c cambiase sus raíces.)
- **(6)** un fichero marcado puede no escribir **nunca** — por eso la ALLOWLIST
  existe y tres de sus nueve entradas son falsos positivos razonados.
- **(3) ciega también a la sonda dinámica** (`U253c-5e`): ni los hooks ESM ni el
  parche CJS cruzan el límite del proceso. Se mide con control positivo (la
  escritura ocurre) y aserción negativa (la sonda no la anotó).

**Y lo que la sonda por hooks no promete**, escrito en su propia cabecera: mide
la **llamada**, no la **terminación**. Anota el destino en el momento de invocar
la primitiva. Para «no escribe contra X» eso basta y sobra —anotar de más nunca
pierde un ofensor—; para «ya terminó de escribir» **no sirve, y no se afirma**.
Tampoco cubre `filehandle.write()` ni el `.write()` de un `WriteStream` ya
abierto (se envuelve `createWriteStream`, no el stream que devuelve).

---

## 7 · Hallazgo colateral (NO tocado, se declara)

`packages/mesh/ssb-system/src/export.mjs:22-26` afirma:

> «`packages/mesh/ssb-system/package.json` declara linea-kit, presets-sdk, MCP
> sdk, cors, express y zod — **no** `@zeus/volumes-ops` — […] importarlo sería
> una dep fantasma.»

**Ya no es cierto.** `package.json` de `@zeus/ssb-system` declara hoy
`"@zeus/volumes-ops": ">=0.2.4 <1.0.0"`, añadida en `4494e22` (WP-U206),
posterior a esa prosa. Es la razón por la que los ofensores A y B pueden importar
`resolveManifestPath` sin ninguna ruta relativa ni dep fantasma.

**CORREGIDO en esta vuelta, y la frontera se estrecha a lo que de verdad es una
decisión.** En la primera entrega no lo toqué alegando que corregirlo obligaba a
decidir sobre `recordVolumeSync`. La contrarrevisión tiene razón: **no obligaba**.
Sólo la última frase del párrafo («cuando volumes-ops sea dependencia declarable,
este exportador puede llamar a `recordVolumeSync`») toca la decisión; el resto es
un **hecho** que había caducado y que vivía a cinco líneas del código cuyo propio
test lo desmiente. Ensanché la frontera para no tocar nada, y eso es dejar prosa
falsa en pie con una excusa.

Lo entregado: la cabecera dice ahora que aquello era cierto **cuando se escribió**
y marca con `✎ WP-U253c` que ya no lo es, citando el commit. La **decisión** queda
explícitamente abierta y sin dueño aquí: «es de U204/U205, no de U253c, que sólo
mide guardas». Es el único cambio en `src/`, y es un comentario.

---

## 8 · Órdenes ejecutadas y estado del árbol

Este worktree **no traía `node_modules`**. Instalación declarada, elegida porque
`npm ci` no puede modificar el lockfile:

```
$ md5sum package-lock.json      → d0e772dcdf57912741da912a3c2a1358
$ npm ci --no-audit --no-fund   → added 2698 packages in 2m
$ md5sum package-lock.json      → d0e772dcdf57912741da912a3c2a1358   (idéntico)
```

`npm ci` dejó tres ficheros marcados como modificados por **fin de línea**
(`git diff --stat` vacío); restaurados con `git checkout --`, ninguno en el diff
final.

Suite y lint:

```
$ npm test -w @zeus/ssb-system
# tests 47
# pass 47
# fail 0

$ npx --no-install eslint packages/mesh/ssb-system/
(sin salida — 0 errores, 0 avisos)
```

> **`npx` declarado**, como pide el encargo: `npx --no-install eslint …`, con
> `--no-install` para que no pueda descargar nada. Es el mismo binario que usa
> `npm run lint` de la raíz (`"lint": "eslint ."`).

**Residuo cerrado (menor de la devolución).** `correSonda` creaba su temporal
sin `finally` y `correr.mjs` volcaba sin `try/finally`: una víctima que llamase
`process.exit(0)` dejaba status 0, `ENOENT parte.json` crudo y temporal
huérfano. Reproducido y cerrado por los dos lados —hook de `exit` en el hijo,
`finally` en el arnés—. Comprobación:

```
status hijo = 0
parte SI existe · ok=false · error="el objetivo terminó el proceso antes de que
la sonda volcara su parte" · destinos=2
```

Diff final:

```
 packages/mesh/ssb-system/src/export.mjs           |  27 +-   (sólo cabecera, §7)
 packages/mesh/ssb-system/test/export.test.mjs     | 368 +-
 packages/mesh/ssb-system/test/probe/correr.mjs    |  84 +-
 packages/mesh/ssb-system/test/probe/hooks-fs.mjs  |  74 +-
```

Los dos ficheros de `test/probe/` viven en un subdirectorio: el script de test
es `node --test test/*.mjs`, que **no** baja a subdirectorios, así que no se
ejecutan como suites sueltas — se invocan como proceso hijo desde
`export.test.mjs`. Verificado: 47 tests, ninguno huérfano.

Nada fuera del worktree. Sin `git push`, sin `git stash`, sin tocar
`plan/BACKLOG.md`, `VOLUMES/**`, `package.json` raíz, el lockfile ni
`packages/engine/volumes-ops/**` (leído, nunca escrito).

---

## 9 · Frases que NO se pueden sostener, y por eso no están

- ❌ **«se cierra por los dos lados».** Era mía y **se retira**: el mutante M4
  (`openSync`/`writeSync(fd)`, bytes idénticos, sin `import` nuevo) pasa las
  tres guardas y deja la suite en 47/47 con el manifiesto reescrito. Lo que se
  cierra son M1-M3 y las cinco notaciones de import; M4 queda **declarado y
  medido**, no cerrado.
- ❌ **«da igual con qué notación lo importe» (sonda)**. Era falso para la
  propiedad `fs.promises`, que escribía por las cuatro notaciones sin anotarse
  (B2). Ahora es cierto para el módulo `node:fs/promises` **y** para la
  propiedad — dentro de la lista de primitivas, que es cerrada.
- ❌ «al censo la notación le es indiferente». Le es indiferente **cómo se
  nombre** la ruta sólo dentro de las cuatro anclas declaradas; fuera de ellas
  (cegueras 1 y 4) no ve nada.
- ❌ **«la primitiva tiene que aparecer con su nombre: es la ceguera del índice
  computado».** Esa era la descripción pequeña de un problema grande. La clase
  real es que **la lista de primitivas es una enumeración cerrada e incompleta**
  (ceguera 0), y el índice computado es sólo una de las formas de esquivarla.
- ❌ «la sonda por hooks ve todas las escrituras». Ve las de **su proceso** y
  sólo las de las **primitivas de su lista**. Cegueras 0 y 3.
- ❌ «CA-5a estaba mal». Estaba **bien y era insuficiente**: mide por ruta
  resuelta, que es lo correcto; lo que no podía era alcanzar tres de las cinco
  notaciones, y eso no estaba dicho en ninguna parte.
- ❌ «ahora el manifiesto está protegido». Lo que hay es un censo con **cinco
  vectores cazados y siete cegueras declaradas**, y una sonda que ya no depende
  de cómo importe un tercero pero sigue siendo una lista de nombres. La
  protección real sigue siendo que `sealManifest` sea el único escritor; esto
  sólo mide si esa afirmación aguanta, y ahora se sabe **hasta dónde** mide.

---

## 10 · La frase que se lleva este WP

> **Mientras el instrumento sea una lista de nombres, el mutante que evade la
> lista existirá.**

Es de la contrarrevisión y es la mejor del bloque. Está escrita en tres sitios
además de aquí: la cabecera de `hooks-fs.mjs`, el bloque
`PRIMITIVAS_QUE_FALTAN` de `export.test.mjs` y §0.5 — porque el sitio donde hace
falta leerla es justo antes de que alguien ensanche una lista creyendo que con
eso cierra algo.

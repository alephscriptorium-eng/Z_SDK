# WP-U253c · El censo estático era más débil de lo que decía ser, y la guarda funcionaba por accidente

Rama `wp/u253c-censo-estatico` · worktree `C:/S_LAB/wt/z-u253c` · Node v22.21.1 · win32.

**Alcance tocado:** `packages/mesh/ssb-system/**` y este reporte. Nada más.
Ni `packages/engine/volumes-ops/**`, ni `VOLUMES/**`, ni `package.json` raíz, ni
el lockfile (verificado por hash, §8).

---

## 0 · Resumen en cuatro líneas

1. El censo estático veía **1 de 5** notaciones de escritura contra el
   manifiesto. La propuesta que estaba escrita (`|resolveManifestPath` en
   `:397`) subía a **3 de 5**. Ahora ve **5 de 5**.
2. `PRIMITIVAS_DE_ESCRITURA` era sólo la cara síncrona de `node:fs`. Un
   `writeFile` de `fs/promises` **con el token a la vista** era invisible.
3. El probe CA-5a de U205 **pasa por accidente**. Se demuestra con un mutante
   que lo deja **VERDE mientras `src/export.mjs` escribe el manifiesto en cada
   export** (§5, M3). Se cierra por los dos lados: sonda que no depende de la
   notación **y** guarda que enrojece si la notación cambia.
4. Lo que el censo sigue sin ver está **enumerado y medido**, no prometido: 6
   clases de ceguera, cada una con un escritor vivo que la demuestra (§6).

Suite: **42 pass / 0 fail** (antes de este WP: 27/27). Lint limpio.

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

---

## 5 · CA-4 · Censo de mutación sobre lo entregado

### 5.1 · Sobre la notación, en el fichero vigilado de verdad

Se muta `src/export.mjs` **en disco**, se corre la suite entera, se restaura.
Orden (bucle sobre `M1 M2 M3`):

```
$ node mutar.mjs $M
$ npm test -w @zeus/ssb-system 2>&1 | grep -E "^(ok|not ok) (12|22|23) |^# (pass|fail) "
$ git checkout -- packages/mesh/ssb-system/src/export.mjs
```

- `12` = **CA-5a** (la sonda heredada, en proceso)
- `22` = **U253c-3c** (la sonda por hooks, proceso hijo)
- `23` = **U253c-3d** (la guarda de notación)

**M0 · control, sin mutar** — salida literal:

```
    ok 12 - CA-5a · POR RUTA DERIVADA: un export completo no escribe NI UNA VEZ en <root>/volumes.json
    ok 22 - U253c-3c · export completo bajo la sonda por HOOKS: 0 escrituras contra el manifiesto
    ok 23 - U253c-3d · GUARDA: la dependencia de CA-5a sobre la notación queda DECLARADA
    # pass 42
    # fail 0
```

**M1 · `import fs from` → `import * as fs from`** — salida literal:

```
    not ok 12 - CA-5a · POR RUTA DERIVADA: un export completo no escribe NI UNA VEZ en <root>/volumes.json
    ok 22 - U253c-3c · export completo bajo la sonda por HOOKS: 0 escrituras contra el manifiesto
    not ok 23 - U253c-3d · GUARDA: la dependencia de CA-5a sobre la notación queda DECLARADA
    # pass 39
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
    # pass 29
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
    # pass 39
    # fail 3
```

> **Este es el resultado que decide el WP.** `src/export.mjs` escribe
> `<root>/volumes.json` **en cada export**, y **CA-5a pasa VERDE**: su sonda no
> ve la escritura (import nombrado) y su comprobación de bytes no la ve (bytes
> idénticos). No hay ni un test rojo en la suite heredada. La sonda nueva y la
> guarda nueva la cazan las dos.
>
> «Funciona por accidente» no es una sospecha: es un mutante ejecutable.

Restauración verificada tras cada vuelta:
`sha256(src/export.mjs) = 608f9f45358125cc497c4d4dd51a161466a2321ac2f900f351fc535f508cfc44`,
igual que antes de empezar, y `git status` limpio para `src/`.

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

| # | ceguera | medida en | escritor vivo |
|---|---|---|:--:|
| 1 | nombre montado **sin ningún literal** (`['v','o',…].join('')`) | `U253c-5a` | sí |
| 2 | primitiva por **índice computado** (`fs['write'+'File'+'Sync']`) | `U253c-5a` | sí |
| 3 | **cruce de proceso** (`execFileSync(node, ['-e', …])`) | `U253c-5a`, `5e` | sí |
| 4 | **reparto entre ficheros**: uno tiene el nombre, otro la primitiva | `U253c-5b` | sí |
| 5 | **alcance**: `test/ tests/ __tests__/ fixtures/ dist/ node_modules/` y `.ts .mts .cts .jsx .tsx` | `U253c-5c` | sí |
| 6 | **naturaleza estática**: no sabe si la línea corre, ni cuándo termina | `U253c-5d` | n/a |

Detalles que no conviene suavizar:

- **(4) es la más grande.** El censo es co-ocurrencia **por fichero**. Partir el
  ofensor en dos módulos —uno que sabe el nombre y no escribe, otro que escribe y
  no sabe el nombre— lo hace invisible **sin ninguna astucia de notación**.
  Cerrarlo pide análisis de flujo de datos, que este censo no hace y no promete.
- **(5)** se mide sobre un árbol **sintético** con el mismo recorrido que usa
  CA-5c, con control positivo: el mismo fichero, en un sitio censado, sí sale.
  Y el censo sólo baja por `packages/`, `scripts/` y `e2e/`: `examples/`,
  `test/` del repo, `data/` y `sincronia/` no están censados.
- **(6)** un fichero marcado puede no escribir **nunca** — por eso la ALLOWLIST
  existe y tres de sus nueve entradas son falsos positivos razonados.
- **(3) ciega también a la sonda dinámica** (`U253c-5e`): ni los hooks ESM ni el
  parche CJS cruzan el límite del proceso. Se mide con control positivo (la
  escritura ocurre) y aserción negativa (la sonda no la anotó).

**Y lo que la sonda por hooks no promete**, escrito en su propia cabecera: mide
la **llamada**, no la **terminación**. Anota el destino en el momento de invocar
la primitiva. Para «no escribe contra X» eso basta y sobra —anotar de más nunca
pierde un ofensor—; para «ya terminó de escribir» **no sirve, y no se afirma**.
Tampoco cubre `filehandle.write()` ni los métodos de un `WriteStream` ya abierto.

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

**No lo he tocado**, y a propósito: corregir esa frase obliga a decidir si este
exportador debe pasar a llamar `recordVolumeSync` como hace feed-kit —que es
justamente lo que el párrafo dejaba pendiente para «cuando volumes-ops sea
dependencia declarable»—, y eso es una decisión de diseño de U205/U204, no una
errata. Queda **declarado aquí** para quien decida.

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
# tests 42
# pass 42
# fail 0

$ npx --no-install eslint packages/mesh/ssb-system/test/
(sin salida — 0 errores, 0 avisos en los tres ficheros)
```

> **`npx` declarado**, como pide el encargo: una sola invocación,
> `npx --no-install eslint …`, con `--no-install` para que no pueda descargar
> nada. Es el mismo binario que usa `npm run lint` de la raíz (`"lint": "eslint ."`).

Diff final:

```
 M packages/mesh/ssb-system/test/export.test.mjs   (+737 / -19)
?? packages/mesh/ssb-system/test/probe/            (2 ficheros nuevos)
```

Los dos ficheros nuevos viven en `test/probe/`, un subdirectorio: el script de
test es `node --test test/*.mjs`, que **no** baja a subdirectorios, así que no
se ejecutan como suites sueltas — se invocan como proceso hijo desde
`export.test.mjs`. Verificado: 42 tests, ninguno huérfano.

Nada fuera del worktree. Sin `git push`, sin `git stash`, sin tocar
`plan/BACKLOG.md`, `VOLUMES/**`, `package.json` raíz, el lockfile ni
`packages/engine/volumes-ops/**` (leído, nunca escrito).

---

## 9 · Frases que NO se pueden sostener, y por eso no están

- ❌ «al censo la notación le es indiferente». Le es indiferente **cómo se
  nombre** la ruta sólo dentro de las cuatro anclas declaradas; fuera de ellas
  (cegueras 1 y 4) no ve nada. Y la **primitiva** también tiene que aparecer con
  su nombre: ceguera 2.
- ❌ «la sonda por hooks ve todas las escrituras». Ve las de **su proceso** y las
  de las **primitivas envueltas**. Ceguera 3 y `filehandle.write()`.
- ❌ «CA-5a estaba mal». Estaba **bien y era insuficiente**: mide por ruta
  resuelta, que es lo correcto; lo que no podía era alcanzar tres de las cinco
  notaciones, y eso no estaba dicho en ninguna parte.
- ❌ «ahora el manifiesto está protegido». Lo que hay es un censo con **cinco
  vectores cazados y seis cegueras declaradas**, y una sonda que ya no depende de
  cómo importe un tercero. La protección real sigue siendo que
  `sealManifest` sea el único escritor; esto sólo mide si esa afirmación aguanta.

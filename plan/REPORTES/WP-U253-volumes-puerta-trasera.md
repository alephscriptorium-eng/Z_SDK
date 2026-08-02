# WP-U253 · Dos evasiones que ningún probe del carril D veía

Rama `wp/u253-volumes-puerta-trasera`. Alcance tocado: `packages/engine/volumes-ops/**`.
Node v22.21.1, win32 10.0.26200. Todas las órdenes se ejecutan desde
`C:/S_LAB/wt/z-u253`.

**Nota de entorno.** El worktree no tenía `node_modules`. No se instaló nada
(prohibido tocar lockfile y `package.json` raíz): se construyó un
`node_modules/` local —ignorado por git, verificado en `.gitignore:1`— con
junctions, `@zeus/*` apuntando a los paquetes de ESTE worktree y las
dependencias de terceros a la instalación ya existente. Comprobación de que la
resolución no se fuga a otro checkout:

```
$ node -e "console.log(require('module').createRequire('C:/S_LAB/wt/z-u253/packages/engine/volumes-ops/x.mjs').resolve('@zeus/presets-sdk/volumes'))"
C:\S_LAB\wt\z-u253\packages\engine\presets-sdk\src\volumes\index.mjs
```

---

## 0 · Re-medición de las citas del BRIEF (antes de tocar nada)

| Cita del brief | Estado | Medido |
|---|---|---|
| `manifest.mjs:35-37` exporta `resolveManifestPath()` | **exacta** | `export function resolveManifestPath()` en 35-37 |
| reexportada en `src/index.mjs:35` | **derivada** | el reexport está en `index.mjs:69-75`; `resolveManifestPath` cae en la **línea 71**. La línea 35 es un comentario de U259 |
| `ledger.mjs:16-20` devuelve `opts.ledgerPath` verbatim | **exacta** | `if (opts.ledgerPath) return opts.ledgerPath;` en la 17 |
| «la línea ~43 apenda sobre él» | **exacta** | `appendFileSync(path, ...)` en la 43 |
| `importPack({… ledgerPath:'<root>/volumes.json'})` **añade JSONL encima del manifiesto sellado** | **NO reproduce así** sobre un manifiesto sellado canónico | ver §2 |

---

## 1 · Vector (1): la ceguera es real, y se demuestra a escala de repo

El censo heredado (WP-U205, `packages/mesh/ssb-system/test/export.test.mjs:394-400`)
marca por **co-ocurrencia de texto**: una primitiva de escritura Y el token del
manifiesto (`'volumes.json'` entrecomillado o `MANIFEST_FILE_NAME`).

**Prueba de extremo a extremo, no de laboratorio.** Se plantó un secuestrador
vivo dentro de `packages/`:

```js
// packages/engine/volumes-ops/src/_ofensor-u253.mjs
import { writeFileSync } from 'node:fs';
import { resolveManifestPath } from './manifest.mjs';
export function secuestraManifiesto(payload) {
  writeFileSync(resolveManifestPath(), payload, 'utf8');
}
```

```
$ cd packages/mesh/ssb-system && node --test test/export.test.mjs
# tests 26
# pass 26
# fail 0
```

El censo del repo pasa **26/26 con el secuestrador dentro del árbol**. La puerta
está abierta y es demostrable, no argumentable.

La sonda por operación sí lo caza (mismo fichero plantado, ejecutado de verdad):

```
SONDA_POR_OPERACION_lo_caza = true
sello_antes  = d868f5c60c1b8000
sello_despues= 9c1034ae3fdb9bfa
```

El ofensor plantado se **borró** tras medir; no queda en la rama.

### La sonda que se entrega

`packages/engine/volumes-ops/test/u253-escritura-sobre-manifiesto.test.mjs`.
No lee código: resuelve ella misma la ruta del manifiesto y **fotografía el
fichero** (existencia + sha256 + tamaño) antes y después de ejecutar.

Lo que ancla es **cómo se nombra la ruta**: eso le es indiferente por
construcción. **No** le es indiferente *cuándo termina la escritura* —mide en
un instante síncrono— ni el flujo alterno. La frase anterior de este reporte
(«la notación le es indiferente por construcción», sin más) prometía de más;
los dos huecos van declarados en §6 y pinchados en la suite.

Las tres notaciones del CA son **módulos `.mjs` reales**, escritos a disco,
importados y ejecutados —no cadenas imitando código—:

- **A** indirección por función: `writeFileSync(resolveManifestPath(), payload, 'utf8')`
- **B** alias de la primitiva *y* del localizador: `escribeBytes(dondeVive(), …)`
- **C** composición de cadena: `PIEZAS = ['volumes','json']` → `join(root, PIEZAS.join('.'))`

Las tres: invisibles al censo heredado (test 1), cazadas por la sonda (test 2).

### Control de que la sonda no es un sí/no constante

Test 3: sin escritura calla (`mutado:false`); con `sealManifest()` —el escritor
legítimo— habla. La sonda mide **operación, no legitimidad**: ve igual al
intruso y al escritor autorizado. Quién puede escribir es decisión de otra capa.

---

## 2 · Vector (2): reproduce, pero NO como decía el brief

`appendOpsLedger` relee el destino antes de apendar (`ledger.mjs:34`) y parsea
**línea a línea**. Medición por sub-casos del fichero destino:

```
[2a pretty multilinea] THREW: Expected property name or '}' in JSON at position 1 | manifiesto_MUTADO=false | sigue_JSON=true  | jsonl_dentro=false
[2b una linea {}]      APPEND_OK                                                  | manifiesto_MUTADO=true  | sigue_JSON=false | jsonl_dentro=true
[2c vacio]             APPEND_OK                                                  | manifiesto_MUTADO=true  | sigue_JSON=true  | jsonl_dentro=true
[2d una linea con datos] APPEND_OK                                                | manifiesto_MUTADO=true  | sigue_JSON=false | jsonl_dentro=true
```

`sealManifest` escribe `JSON.stringify(config, null, 2)` — siempre multilínea.
Por tanto, **sobre un manifiesto sellado canónico el JSONL no llega a escribirse**:
la relectura revienta antes. La frase del brief se sostiene sólo para destinos
vacíos o de una sola línea (2b/2c/2d).

Lo que sí ocurre sobre un root real es **otra avería, y peor de describir**:

```
importPack LANZO      = SyntaxError | Expected property name or '}' in JSON at position
manifiesto RESELLADO  = true
asiento de ledger     = NO EXISTE
corpus ya aterrizado  = true
```

El import **ya había resellado el manifiesto y aterrizado el corpus**, y entonces
lanza una `SyntaxError` que escapa a su contrato documentado `{ok:…}`. Queda un
root mutado, sin asiento de auditoría y sin resultado para el llamante.

### El cerco

`packages/engine/volumes-ops/src/ledger-cerco.mjs` (nuevo). Regla: el ledger es
un `.jsonl` **dentro** del root que **nunca** ocupa un artefacto de máquina.
Falla cerrado (`LedgerPathDenegada` con `code` estable). Canales, en orden:
despegue del **flujo alterno** → léxico (contención) → nombre de artefacto →
**identidad física del inodo** → extensión → directorio → flujo residual.

El despegue del flujo va **primero** a propósito: lo que hay que juzgar es el
fichero sobre el que se acaba escribiendo, no la cadena que lo nombra. Ponerlo
después dejaba pasar la primera escritura (§9.1).

**Por qué es un fichero aparte.** Si la lista de vedados se importara dentro de
`ledger.mjs` —que sí apenda—, el token del manifiesto y `appendFileSync`
co-ocurrirían y el censo del repo marcaría `ledger.mjs`, exigiendo una entrada
de allowlist en `packages/mesh/ssb-system/`, **fuera de mi ALCANCE_DIFF**.
Separar el cerco (que no escribe) del apendador (que no nombra el artefacto)
mantiene el censo verde sin relajarlo. Que esa separación sea *necesaria* es en
sí una medida de que el censo ancla notación. Verificado: censo 26/26 después.

### Agujero hallado durante el trabajo, no en el brief: enlace duro

`realpath` **no** deshace un enlace duro (medido en win32/NTFS): devuelve la
ruta del propio enlace. Un cerco léxico —o incluso uno con realpath— dejaría
apendar sobre el manifiesto a través de `<root>/inocente.jsonl`.

```
HARDLINK_SOPORTADO=true
realpath(inocente.jsonl)= C:\Users\...\u253-hl-rupZCT\inocente.jsonl
mismo_ino= true ino_no_cero= true
```

Cerrado comparando `dev:ino`. Censo de mutación de ese bloque concreto
(amputado el `if` del inodo):

```
not ok 8 - CA-2 · el resto del cerco: estado, fuera del root, otro root, extensión, enlace
  error: 'enlace duro al manifiesto: debía lanzar y no lanzó'
```

### Bug latente corregido de paso

`appendOpsLedger` no propagaba `volumesRoot` a su relectura interna
(`readOpsLedger({ ledgerPath: path })`). Sin cerco no se notaba; con cerco, un
llamante con root explícito habría sido denegado por «fuera del cerco». Ahora
viaja. Cubierto por el test 13, que falla si se vuelve a omitir.

---

## 3 · CA-3 · Rojo antes / verde después (literal)

Orden exacta, con `ledger.mjs` restaurado desde HEAD (sin `git stash`, prohibido):

```
$ git show HEAD:packages/engine/volumes-ops/src/ledger.mjs > packages/engine/volumes-ops/src/ledger.mjs
$ node --test packages/engine/volumes-ops/test/u253-escritura-sobre-manifiesto.test.mjs
```

```
===== ROJO (ledger.mjs en HEAD, sin cerco) =====
ok 1 - CA-1 · los TRES ofensores son INVISIBLES al censo por notación
ok 2 - CA-1 · la sonda por OPERACIÓN caza a los tres, ejecutados de verdad
ok 3 - CA-1 control · sin escritura la sonda calla; con el escritor LEGÍTIMO habla
ok 4 - CA-4 · amputada la vigilancia, la sonda deja de cazar a los tres
ok 5 - CA-4 · el canal `sha256` es portante: sin él, un cambio a IGUAL TAMAÑO pasa
ok 6 - CA-1 · operaciones reales del paquete NO escriben el manifiesto
not ok 7 - CA-2 · `ledgerPath` apuntando al manifiesto sellado: DENEGADO y sin tocarlo
not ok 8 - CA-2 · el resto del cerco: estado, fuera del root, otro root, extensión, enlace
not ok 9 - CA-2 · importPack con `ledgerPath` al manifiesto: denegado, manifiesto intacto
ok 10 - CA-5 · omitido / undefined / null / cadena vacía → ruta segura por defecto
not ok 11 - CA-5 · lo presente-pero-basura DENIEGA; no cae al defecto ni pasa de largo
ok 12 - CA-5 · el ledger por defecto sigue funcionando de punta a punta
ok 13 - CA-5 · `volumesRoot` explícito viaja hasta la relectura (no lo mide el entorno)
# tests 13
# pass 9
# fail 4
```

Causa literal del 7 y del 9 — obsérvese que el fallo **no es una denegación**,
es una `SyntaxError` sin `code`:

```
  error: |-
    Expected values to be strictly equal:
    + actual - expected

    + undefined
    - 'ledger_path_artefacto_sellado'
```

Del 8 y del 11:

```
  error: 'estado: debía lanzar y no lanzó'
  error: 'basura     debe denegar: debía lanzar y no lanzó'
```

Verde tras reponer el cerco:

```
===== VERDE (ledger.mjs con cerco) =====
# tests 13
# pass 13
# fail 0
```

Los tests 1-6 (vector 1) están verdes en ambos lados **a propósito**: la sonda
no depende del arreglo del ledger. Su «rojo antes» es el de §1 —el censo del
repo pasando 26/26 con un secuestrador vivo dentro—, que es donde el vector (1)
se demuestra.

---

## 4 · CA-4 · Censo de mutación (la sonda no es tautológica)

Dos amputaciones, ambas exigidas por el propio fichero de pruebas:

1. **Sin canales** (test 4): a los tres ofensores la sonda deja de verlos
   (`mutado:false`), y se comprueba que la escritura **sí ocurrió**
   (`antes.sha256 !== despues.sha256`). Si la aserción de test 2 no la
   sostuviera la vigilancia, este test no podría distinguirlo.
2. **Sin el canal `sha256`** (test 5): una sobrescritura del **mismo tamaño** y
   distinto contenido pasa desapercibida. Prueba que el hash es portante y no
   decorativo — el tamaño solo no basta.
3. **Sin el bloque del inodo** (§2): el enlace duro deja de denegarse. Salida
   literal arriba.

---

## 5 · CA-5 · Hostil-omite

Frontera declarada y probada: **falsy = ausencia → ruta segura**;
**truthy ilegible = propuesta rota → denegación**. Ninguno de los dos acaba
jamás sobre un artefacto de máquina.

- Ruta segura (test 10): omitido, sin argumento, `undefined`, `null`, `''`,
  `0`, `false`, `NaN` → `<root>/.ops-ledger.jsonl`, y se asevera que el
  basename no es ninguno de `ARTEFACTOS_VEDADOS`.
- Denegación (test 11): `'   '`, `123`, `{}`, `[]`, `true`, un objeto módulo →
  `LedgerPathDenegada`.

Corrección respecto a mi primer intento: incluí `0` entre la «basura» y el test
salió rojo (`basura 0 debe denegar: debía lanzar y no lanzó`). `0` es falsy y
cae al defecto seguro, que es lo que el CA admite. Se reclasificó en vez de
forzar el código a denegarlo.

---

## 6 · Qué resiste y qué no

**Resiste (probado):** las tres notaciones del CA; sobrescritura a igual tamaño;
`ledgerPath` al manifiesto, al fichero de estado, fuera del root, al manifiesto
de **otro** root, escape por `..` como segmento, el root mismo, extensión
no-JSONL, `x.jsonl.exe`, otra unidad, UNC, prefijo `\\?\`, directorio `.jsonl`,
enlace duro al manifiesto, junction de directorio que salta fuera, **flujo de
datos alterno NTFS** sobre manifiesto/estado/anidado/fichero legítimo; ausencia
en siete formas y `opts` nulo en las tres funciones; `importPack` con
`ledgerPath` envenenado (sin JSONL dentro del manifiesto).

**No resiste / no cubro:**

- **La sonda es DINÁMICA: sólo ve lo que se ejecuta.** No sustituye al censo
  estático del repo, que cubre ficheros sin ejecutarlos. Son complementarias.
  El censo del repo **sigue teniendo el agujero de `resolveManifestPath`**: yo
  no puedo cerrarlo porque `packages/mesh/ssb-system/test/export.test.mjs` está
  fuera de mi ALCANCE_DIFF. **Enrutado a U253c.** Corrijo aquí mi propuesta
  anterior, que se quedaba corta: **no basta una línea, hacen falta dos**.
  Añadir `|resolveManifestPath` a `TOKEN_DE_MANIFIESTO` (`export.test.mjs:397`)
  no cierra nada por sí solo, porque `PRIMITIVAS_DE_ESCRITURA` (`:395-396`)
  **no incluye las primitivas de `fs/promises`**: un `writeFile` asíncrono
  queda invisible aunque contenga el token. Y aun con las dos, la notación C
  —composición de cadena— seguiría fuera del alcance de cualquier predicado
  textual.
- **Reescritura de bytes idénticos: invisible** para la sonda. Se intentó cerrar
  con `mtime` y **se descartó por medición**: ante reescrituras idénticas en
  win32 cambia de forma **intermitente** —la contrarrevisión midió una
  proporción distinta de la mía, así que la cifra concreta no es reproducible y
  no se cita; lo reproducible, y lo único que sostiene el descarte, es la
  intermitencia—. Nótese que el sello ES el sha256 de los bytes, así que una
  escritura que preserva los bytes preserva el sello — pero viola la
  lectura-sólo, y eso queda sin cubrir.
- **La sonda es ciega a la escritura que TERMINA MÁS TARDE.** Mide justo
  después de que `fn` retorna. Una escritura diferida no entra en la foto:
  pinchado con una prueba «LÍMITE» determinista, que asevera a la vez
  `mutado === false` y que el fichero **sí** cambió. Con
  `fs/promises.writeFile` sin esperar el resultado es **peor que un hueco: es
  una carrera** —medida aquí como cazada en unas ejecuciones y perdida en
  otras—, y por eso la prueba se escribió con un diferido explícito en lugar de
  dejar la intermitencia dentro de la suite. Lo que **sí** resiste, medido por
  la contrarrevisión: `openSync`+`writeSync`, `copyFileSync`, `renameSync`,
  `truncateSync` y `appendFileSync`.
- **La sonda es ciega al flujo de datos alterno.** `volumes.json:x` cambia el
  fichero sin tocar los bytes del flujo principal, que es lo que ella lee. El
  **cerco** sí lo deniega (§9); la sonda no lo vería. Declarado, no cubierto.
- **Fallo abierto declarado en el canal del inodo.** Si el sistema de ficheros
  no da inodo (`ino === 0`, plausible en SMB — un sitio verosímil para un
  catálogo de volúmenes) o el `stat` falla, ese canal **desaparece sin aviso**
  y con él la defensa contra el enlace duro. Las otras cuatro barreras siguen
  en pie. El código está vigilado por el censo de mutación; el entorno no puede
  estarlo desde aquí.
- **Enlace simbólico a fichero: `<pendiente>` en esta máquina.** `symlinkSync`
  da `EPERM` (sin privilegio en win32). La defensa (realpath) está implementada
  y el test la ejerce si el privilegio existe; aquí cae a la rama tolerada. El
  canal realpath **sí** queda verificado por otra vía: la junction de directorio
  del caso (j), que no requiere privilegio.
- **Una sonda por monkey-patch de `fs` NO habría servido.** Medido: parchear
  `fs.writeFileSync` **no** intercepta a quien hizo `import { writeFileSync }
  from 'node:fs'` — y `manifest.mjs:24` y `ledger.mjs:6` importan así.
  ```
  INTERCEPTADO_NAMED_IMPORT= false []
  ```
  La contrarrevisión amplió el hallazgo: **`import * as fs` tampoco se
  intercepta** (notación que yo no medí). Consecuencia para el carril: el probe
  dinámico CA-5a de U205 funciona **hoy** sólo porque `export.mjs:114` hace
  `import fs from 'node:fs'` — es decir, **por accidente**; el día que ese
  fichero pase a importaciones nombradas o de espacio de nombres, CA-5a se
  queda ciego **en silencio**. Observación reportada, **no arreglada** (fuera
  de alcance; va con U253c).
- No cubro el resto de artefactos del root (ficheros de corpus): el cerco impide
  que el *ledger* los ocupe por la vía de la extensión, pero no vigila
  escrituras sobre ellos.
- No cubro concurrencia: dos procesos apendando a la vez.

### Regresión de atomicidad que introduce este WP (→ U253b)

`import.mjs:736` llama a `appendOpsLedger` **sin envolver**, después de
`sealManifest` (`:700`). Mi endurecimiento convierte en excepción dos casos que
**antes salían limpios**, y lo hace *después* de que el root ya haya mutado:

| `ledgerPath` | antes de U253a | después de U253a |
|---|---|---|
| `<root>/nota.txt` | `{ok:true}`, asiento escrito en `nota.txt` | **lanza** `ledger_path_extension_no_jsonl`, con manifiesto ya resellado y corpus ya aterrizado |
| ledger **fuera** del root | `{ok:true}`, asiento escrito fuera | **lanza** `ledger_path_fuera_del_cerco`, ídem |

Medido, y aseverado en la propia suite: la prueba de `importPack` **asevera
ahora `r.mutado === true`** y comprueba que el volumen quedó declarado y el
corpus aterrizado. Antes se titulaba «manifiesto intacto» y sólo miraba que no
hubiera JSONL dentro: **avalaba algo que ella misma desmiente**. Corregido.

El arreglo **no es de este WP**: vive en `import.mjs` (fuera de mi
ALCANCE_DIFF) y es linaje de U255 «NOTHING LANDS HALFWAY» (`import.mjs:35-58`);
hacerlo aquí obligaría a razonar rollback de fusión dentro de un WP de rutas.
**Enrutado a U253b.** Aquí queda medido y dicho, para que nadie lea el verde de
esa prueba como «el root queda limpio».

---

## 7 · Precio declarado

- **Un módulo nuevo** (`ledger-cerco.mjs`, ~140 líneas) y una pieza más en el
  grafo de imports de `ledger.mjs`. La separación es forzada por la forma del
  censo, no por el diseño; queda documentada en la cabecera del propio módulo.
- **`ledgerPath` deja de admitir rutas arbitrarias**: ahora debe ser `.jsonl` y
  vivir dentro del root. Es un endurecimiento **más estricto** que «no puede ser
  el manifiesto». Sin llamantes vivos: `grep -rn "ledgerPath" packages e2e
  scripts` no encuentra ninguno que la pase, salvo la relectura interna; la
  contrarrevisión añade que es opción de **montaje**, no campo de petición, así
  que no hay superficie remota. Si mañana alguien quiere el ledger fuera del
  root, tendrá que discutirlo.

  **Acotación** (mi frase anterior decía «no rompe a nadie hoy», y eso prometía
  de más): es cierto sólo si «romper» significa «devolver un resultado
  distinto». Si significa «fallar limpio», **no lo es**: dos configuraciones
  que antes terminaban en `{ok:true}` ahora lanzan, y lanzan *después* de que
  el root haya mutado. La tabla está en §6; el arreglo va a U253b.
- **Cuatro `statSync`/`realpathSync` extra** por llamada con `ledgerPath`
  explícito. Cero en el camino por defecto (el que usa todo el mundo).
- La sonda cuesta ~3 procesos de import dinámico y varios roots temporales por
  ejecución; el fichero entero corre en ~2 s.

---

## 8 · Regresión

```
$ cd packages/engine/volumes-ops && node --test test/*.test.mjs
# tests 216   # pass 214   # fail 0   # skipped 2      (antes de U253: 194 / 192 / 0 / 2)

$ cd packages/mesh/ssb-system && node --test test/export.test.mjs
# tests 26    # pass 26    # fail 0                     (censo del repo intacto)

$ cd packages/engine/feed-kit && node --test test/*.test.mjs
# tests 10    # pass 10    # fail 0

$ cd packages/mesh/ssb-system && node --test test/*.test.mjs
# tests 27    # pass 27    # fail 0
```

`packages/mesh/linea-system` falla, y **no es mío**. Verificado reponiendo los
tres ficheros a HEAD y volviendo a ejecutar: falla igual.

```
# Error: ZEUS_VOLUMES_ROOT is not set — volumes root is not operable; ...
#     at resolveLineasBasePath (.../presets-sdk/src/paths/lineas.mjs:26:10)
# tests 1  # pass 0  # fail 1
```

Es una precondición de entorno (`ZEUS_VOLUMES_ROOT` sin definir en el worktree),
revienta al cargar `linea-system/src/loader.mjs` y no pasa por ledger ni por
manifiesto.

`git status --porcelain` al cierre — cuatro ficheros, todos dentro del alcance,
sin suciedad de mtime ni `VOLUMES/`:

```
 M packages/engine/volumes-ops/src/index.mjs
 M packages/engine/volumes-ops/src/ledger.mjs
?? packages/engine/volumes-ops/src/ledger-cerco.mjs
?? packages/engine/volumes-ops/test/u253-escritura-sobre-manifiesto.test.mjs
```

---

## 9 · Devolución de la contrarrevisión · U253a (el cerco)

El WP se partió en tres. Aquí sólo el cerco; `import.mjs` (U253b) y el censo
estático (U253c) quedan fuera y **no se tocan**.

### 9.1 · BLOQUEANTE · flujo de datos alterno NTFS

`fichero:flujo` no nombra un fichero: nombra un flujo **dentro** de ese
fichero. Las tres barreras fallaban a la vez, y la tercera de la peor manera
posible — sólo cazaba **a partir de la segunda escritura**:

| barrera | por qué no veía nada |
|---|---|
| nombre de artefacto | el nombre completo ya no era `volumes.json` |
| extensión | la ruta **sí** terminaba en `.jsonl` |
| inodo | el flujo **aún no existe** → `statSync` ENOENT → `null` |

Reproducido antes de tocar nada:

```
ACEPTA   "volumes.json:oculto.jsonl" -> ...\volumes.json:oculto.jsonl
append OK seq= 1
append THREW ledger_path_artefacto_sellado     <- la SEGUNDA sí, con el daño hecho
```

Arreglo: el flujo se **despega antes de comparar nada**; lo que se juzga es el
fichero sobre el que se acaba escribiendo, no la cadena que lo nombra. Sólo en
win32 (en POSIX `:` es un carácter legítimo y recortarlo denegaría nombres
válidos). Queda además un código propio, `ledger_path_flujo_alterno`, para el
caso en que el fichero base sí era admisible: un asiento dentro de un flujo es
invisible para quien lea la ruta normal — deja de ser auditoría y pasa a ser
escondite.

Después:

```
DENIEGA | ADS sobre manifiesto         -> ledger_path_artefacto_sellado
DENIEGA | ADS sobre estado             -> ledger_path_artefacto_sellado
DENIEGA | ADS anidado                  -> ledger_path_extension_no_jsonl
DENIEGA | ADS sobre fichero legitimo   -> ledger_path_flujo_alterno
```

### 9.2 · BLOQUEANTE · censo de mutación sobre la normalización de rutas

Los cinco mutantes que sobrevivían, más las tres defensas nuevas. Cada uno
aplicado al fuente y ejecutada la suite entera; se anota la prueba que lo mata.

| mutante | veredicto | prueba que lo mata |
|---|---|---|
| M1 · `normaliza` → identidad | **MUERTO** | CA-4 · M1 · sensibilidad a mayúsculas |
| M3' · `'..'+sep` → `'..'` | **MUERTO** | CA-4 · M3 · `..` como segmento completo |
| M4 · quitar `isAbsolute(rel)` | **MUERTO** | CA-4 · M4 · otra unidad / UNC |
| M6 · `endsWith` → `includes` | **MUERTO** | CA-4 · M6 · `.jsonl` debe terminar |
| M9 · anclar al CWD | **MUERTO** | CA-4 · M9 · relativa anclada al root |
| ADS · no despegar el flujo | **MUERTO** | CA-2 · flujo alterno |
| DIR · quitar chequeo de directorio | **MUERTO** | CA-2 · directorio `.jsonl` |
| INO · quitar canal del inodo | **MUERTO** | CA-2 · enlace duro |

`fuente restaurada: True` al terminar el censo, y suite en verde después.

M3' merece una nota: el mutante marcaba el comportamiento **correcto**.
`..raro.jsonl` es un nombre legítimo dentro del root y se estaba denegando con
`ledger_path_fuera_del_cerco`, un código que mentía. Ahora se **acepta**, y lo
que mata al mutante es la prueba en sentido contrario: `..` escapa sólo como
segmento completo.

### 9.3 · BLOQUEANTE · la prueba de `importPack` avalaba lo que no medía

Cerrado: ahora asevera `r.mutado === true`, que el volumen quedó declarado y
que el corpus aterrizó, y el título dice «**pero el manifiesto YA está
resellado (→ U253b)**». Detalle y tabla en §6.

### 9.4 · Menores

| menor | resolución |
|---|---|
| `..raro.jsonl` con código engañoso | **cerrado**: se acepta (es legítimo) |
| `\?\C:\...` escupía `EISDIR ... lstat 'C:'` crudo | **cerrado**: `realpathSync` envuelto; degrada a denegación del cerco |
| `.jsonl` que es directorio | **cerrado**: código propio `ledger_path_es_directorio`, denegado en el cerco y no al apendar |
| `opts = null` → `TypeError` crudo en las tres funciones | **cerrado**: `opts ?? {}` en las tres, y también `entry` nulo |
| `opts.ledgerPath` leído dos veces | **cerrado**: se lee una sola vez a una constante |
| sonda ciega a escritura asíncrona | **declarado** (§6) + prueba «LÍMITE» determinista en la suite |
| sonda ciega al flujo alterno | **declarado** (§6) |
| fallo abierto si `ino === 0` (SMB) | **declarado** (§6) y en la cabecera de `inspecciona()` |
| cifra de `mtime` no reproducible | **corregido**: se cita la intermitencia, no el 19/30 |

Una prueba nació **inestable** y no se dejó pasar: la del límite asíncrono con
`fs/promises.writeFile` sin esperar salía roja en 2 de cada 6 ejecuciones. Se
reescribió con un diferido explícito. La intermitencia no se ocultó: está
declarada como parte del hallazgo —una barrera que a veces ve y a veces no es
peor que un hueco declarado, porque no se puede razonar sobre ella.

### 9.5 · Lo que NO toqué, por estar fuera de U253a

- `packages/engine/volumes-ops/src/import.mjs` — atomicidad → **U253b**.
- `packages/mesh/ssb-system/test/export.test.mjs` — censo estático → **U253c**,
  y ahora consta que necesita **dos** cambios, no uno (§6).

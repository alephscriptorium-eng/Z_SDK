# WP-U253b · el ASIENTO deja de poder matar un import ya aterrizado

Rama `wp/u253b-import-atomico`, base `0a441d1`. Todo lo que sigue lleva orden y
salida literal, o dice «no medido».

**Alcance, acotado**: este WP cierra la familia de fallos del asiento del ledger
**conocibles ANTES de fusionar**. **NO cierra** la familia conocible sólo
**DESPUÉS** —ledger legible pero no escribible, `sealManifest`,
`syncVolumeCounters`, NO-LINK, el `rmSync` del `finally`—, que es **una sola
decisión aplazada** y va a **WP-U268** con su medida. El censo está en §4 y la
declaración es parte de la entrega, no una nota al pie.

| dato | valor |
| ---- | ----- |
| Contrato que se incumplía | `plan/CONTRATO-IMPORT-PACK-v1.md` §1 cabecera («Todo fallo: `{ok:false, step, error}`») y la cabecera de `import.mjs` («Every failure leaves the root intact … Nothing lands halfway») |
| Obra | `packages/engine/volumes-ops/src/import.mjs` |
| Vigilancia | `test/u253b-import-atomico.test.mjs` (24 casos, nuevo) · `test/u253-escritura-sobre-manifiesto.test.mjs` (el caso que U253a dejó enrutado aquí, invertido) |
| Suite `volumes-ops` | 216 (214 pass, 0 fail, 2 skip) → **240 (238 pass, 0 fail, 2 skip)** |
| Rojos que la BASE no pasa | **15 de 24** |
| Rojos que la v1 (la revisada) no pasa | **4 de 24** — B2, B3, B4 y el censo |
| NO tocado | `src/ledger-cerco.mjs` y `src/ledger.mjs` — ni un carácter |

---

## 0 · Qué trajo la devolución y qué se hizo con cada cosa

| bloqueante | qué era | estado |
| --- | --- | --- |
| **B2** | `ledgerPath` leído dos veces: la precondición y el asiento. Un getter que cambia de idea pasaba la guarda y denegaba al final | **cerrado** · §3.2, test 17 |
| **B3** | La guarda de fusión no miraba la tercera forma: un fichero que aterriza **como ANCESTRO** de la ruta del ledger | **cerrado** · §3.3, tests 18 y 19 |
| **B4** | El `catch` mudo se tragaba todo lo que no fuera `LedgerPathDenegada` y dejaba `ledgerPath = null`, desactivando de paso la guarda de fusión | **cerrado** · §3.4, tests 20, 21 y 22 |
| **B1** y su familia | Fallos conocibles sólo DESPUÉS de fusionar | **no es de este WP** · medidos por mí en §4.2, enrutados a **U268**, y declarados en la cabecera de `import.mjs` |
| M1, M2, M5, M6 | Cuatro mutantes que sobrevivían | **muertos** · §5.3, con la salida de cada inyección |
| «seis clases» | Las seis filas emitían **cuatro** códigos | **corregido** · §1 y §2: ocho entradas, los seis códigos |
| Huella ciega | El docstring prometía «cualquier punto del root» | **corregido y declarado** · §6 |
| Partición 10/6 vs 9/7 | Dependía del método | **dicho** · §5.1 |

También se incorpora el dato que cerró mi `<pendiente>`:
`git show 32f5ac9^:…/ledger.mjs` muestra `if (opts.ledgerPath) return opts.ledgerPath;`
—sin cerco y sin lanzar—, así que **las filas 2 y 3 del enunciado sí funcionaban
antes de U253a**. La afirmación del enunciado era cierta y ya no está en «no
verificado». No hacía falta revertir nada prohibido: bastaba mirar el histórico,
que es lo que yo no hice.

---

## 1 · Se re-midió la tabla del enunciado antes de tocar nada, y era cierta

Arnés: root temporal con manifiesto sellado y `volumes: {}`, pack sintético de un
volumen genérico (`DISK_07/DEMO`, corpora `raw` + `curated`), y
`importPack({packRoot, role:'operator', actorId:'op-1', ledger})`. La huella del
root es el sha256 del árbol entero (tipo, **modo**, **destino de enlace** y
sha256 de los bytes de cada fichero). Lo que esa huella NO ve está declarado en
§6 y en el docstring del propio arnés.

```
cd packages/engine/volumes-ops && node _medicion-u253b.mjs
```

(Los tres guiones de medición —`_medicion-u253b.mjs`, `_censo-u253b.mjs`,
`_u268-medicion.mjs`— son temporales y NO entran en el diff: la co-ocurrencia de
`copyFileSync` con el literal `'volumes.json'` los marcaba en el censo estático
de escritores del manifiesto (U205), y una entrada de allowlist para un guion de
usar y tirar sería relajar el censo. Copia en el scratchpad de la sesión; lo que
viaja al repo es la vigilancia de `test/`.)

```
R1 · <root>/volumes.json
   lanzo   : LedgerPathDenegada / ledger_path_artefacto_sellado
   devolvio: null
   arbolIgual: False | corpus: True | resellado: True | asiento: False
R2 · <root>/nota.txt           → ledger_path_extension_no_jsonl · idem
R3 · <tmp>/ops-fuera.jsonl     → ledger_path_fuera_del_cerco    · idem
R4 · ledgerPath no-cadena (42) → ledger_path_no_es_cadena       · idem
R5 · <root> (directorio)       → ledger_path_fuera_del_cerco    · idem
R6 · volumes.json:x.jsonl      → ledger_path_artefacto_sellado  · idem
```

Altas del root, idénticas en las seis (R1, verbatim):

```
"nuevosEnRoot": [
  "D DISK_07", "D DISK_07/DEMO", "D DISK_07/DEMO/curated",
  "F DISK_07/DEMO/curated/keep.md:fa4f5a55…",
  "D DISK_07/DEMO/raw", "F DISK_07/DEMO/raw/a.json:d3b6bf8e…",
  "F volumes.json:223d0248…", "F volumes.state.json:338d09f1…"
]
```

**Correcciones a la tabla del enunciado y a mi propia primera versión:**

- El enunciado decía «cuatro filas» y enumeraba tres. Se midieron las tres y se
  completaron hasta seis.
- **Esas seis sólo ejercitan CUATRO códigos.** `es_directorio` y `flujo_alterno`
  no los alcanza ninguna: a `ledgerPath = <root>` le gana la comprobación léxica
  (`rel === ''` → `fuera_del_cerco`) y a `volumes.json:oculto.jsonl` le gana la
  de artefacto vedado. Mi primera redacción decía «seis clases de denegación» y
  era **más ancha que la medida**. Se añadieron dos entradas —un **directorio
  existente** llamado `carpeta.jsonl` y un flujo alterno sobre un fichero base
  **admisible** (`inocente.jsonl:oculto.jsonl`)— y con ellas las **ocho entradas
  ejercitan los seis códigos**. La conducta ya era correcta; faltaba la
  evidencia.

---

## 2 · Antes y después, con la huella del árbol como testigo

| entrada `ledger` | código del cerco | antes | después |
| --- | --- | --- | --- |
| `{ledgerPath:'<root>/volumes.json'}` | `artefacto_sellado` | lanzó · árbol **cambiado** | `{ok:false, step:'precondicion-ledger'}` · árbol **idéntico** |
| `{ledgerPath:'<root>/nota.txt'}` | `extension_no_jsonl` | lanzó · cambiado | ídem · idéntico |
| `{ledgerPath:'<tmp>/ops-fuera.jsonl'}` | `fuera_del_cerco` | lanzó · cambiado | ídem · idéntico |
| `{ledgerPath:42}` | `no_es_cadena` | lanzó · cambiado | ídem · idéntico |
| `{ledgerPath:'<root>'}` | `fuera_del_cerco` | lanzó · cambiado | ídem · idéntico |
| `{ledgerPath:'<root>/volumes.json:oculto.jsonl'}` (win32) | `artefacto_sellado` | lanzó · cambiado | ídem · idéntico |
| `{ledgerPath:'<root>/carpeta.jsonl'}` (directorio) | `es_directorio` | lanzó · cambiado | ídem · idéntico |
| `{ledgerPath:'<root>/inocente.jsonl:oculto.jsonl'}` (win32) | `flujo_alterno` | lanzó · cambiado | ídem · idéntico |
| `{volumesRoot: 42}` | — (`TypeError`) | lanzó · cambiado | `{…error:'ledger_opts_invalidas'}` · idéntico |
| `{get ledgerPath(){…}}` que cambia de idea | `artefacto_sellado` (2ª lectura) | **v1**: lanzó · cambiado | `ok:true`, **una** lectura, asiento donde dijo |

«Idéntico» = mismo sha256 del árbol entero, y además, comprobado uno a uno:
`corpusAterrizado:false`, `volumes` del manifiesto sigue en `{}`, no hay
`.ops-ledger.jsonl`, no hay `.import-staging*` residual, y `steps` sale **vacío**.

**CA-4 · hostil-omite** — las cuatro formas de ausencia siguen verdes con asiento
(`seq:1`), antes y después: `ledger` omitido, `null`, `{}` y con
`ledgerPath: undefined`.

---

## 3 · Qué se cambió

### 3.1 · Precondición del asiento, antes de VERIFICAR (`import.mjs:241-310`)

La ruta se resuelve por el mismo cerco de U253a, en el punto en el que aún no
existe ni el directorio de staging. Una denegación sale como
`precondicion-ledger` con el `code` del cerco intacto.

### 3.2 · B2 · una sola lectura de `opts.ledger` (`:256` y `:918`)

`ledger.mjs:28-31` documenta con todas las letras el hueco del getter y dice que
«no se deja abierta»; mi v1 lo reabría un nivel más arriba, porque la
precondición leía `ledgerPath` y el asiento recibía el objeto **vivo** y lo
releía. Vector re-ejecutado:

```
ledger: { get ledgerPath() { return ++n === 1 ? `${root}/inocente.jsonl`
                                             : `${root}/volumes.json`; } }
v1 → lanzó LedgerPathDenegada · árbol distinto · corpus aterrizado · sin asiento
v2 → ok:true · lecturas del getter: 1 · asiento en <root>/inocente.jsonl
     · volumes.json sin una sola línea de JSONL
```

El arreglo es un `spread` único (`const ledgerFijo = { ...(ledgerOpts ?? {}) }`)
que lee cada campo una vez, y el asiento recibe `{ ...ledgerFijo, ledgerPath }`
con la ruta **ya resuelta**. A partir de la precondición nadie vuelve a tocar
`ledgerOpts`.

### 3.3 · B3 · la guarda de fusión tenía dos formas y hacen falta tres (`:689-753`)

Mi comentario declaraba el conjunto cerrado —«DOS formas y ninguna más»— y
faltaba la tercera: un fichero que aterriza **como ANCESTRO** de la ruta del
ledger. Peor: el vector vive **dentro de la zona que mi propio control bendice**
como legítima, así que la frase tapaba justo su hueco. Vector re-ejecutado:

```
pack trae el FICHERO `DISK_07/DEMO/raw/a.json`
ledger: { ledgerPath: `${root}/DISK_07/DEMO/raw/a.json/ops.jsonl` }
v1 → precondición ADMITE · la guarda no ve choque · ENOENT con el root mutado
v2 → {ok:false, step:'fusionar', error:'ledger_en_ruta_de_fusion'} · árbol idéntico
```

La comparación pasa a ser simétrica
(`cuelgaDe(ledger, destino) || cuelgaDe(destino, ledger)`) y sigue contra los
**ficheros que aterrizan**, no contra los `to` del plan. El control verde
(`<vol>/ops.jsonl`, que no es igual, ni descendiente, ni ancestro de ningún
fichero del pack) **sigue verde**. El test 19 añade el caso `kind:'corpus'`, que
el test 14 no cubría.

### 3.4 · B4 · el `catch` mudo (`:259-288`)

Se tragaba cualquier error que no fuera `LedgerPathDenegada` y dejaba
`ledgerPath = null`, lo que **además desactivaba la guarda de fusión**.
`volumesRoot` es campo del contrato y ninguna prueba del repo lo tocaba.

```
ledger: { volumesRoot: 42 }
v1 → TypeError · árbol distinto · corpus aterrizado · sin asiento
v2 → {ok:false, step:'precondicion-ledger', error:'ledger_opts_invalidas',
      ledger:{causa:{name:'TypeError',…}}} · árbol idéntico
```

La regla que sustituye al `catch` mudo se dice en una línea: **si el root
canónico no resuelve, la precondición no juzga nada** —ese fallo tiene su paso
(VERIFICAR) y en la base ocurría antes—; **si resuelve**, lo que rompió la
resolución sólo pudo traerlo el llamante, y se deniega. Se le **pregunta** al
resolvedor en vez de adivinar por el mensaje. Test 21 fija el lado del entorno
(`ZEUS_VOLUMES_ROOT` sin definir **con** `ledgerPath` propuesta → sigue siendo
`step:'verificar'`); test 22 fija que `ledger.volumesRoot` viaja hasta el
asiento, que es el único eje que hace portante el reenvío.

### 3.5 · `ledger_ilegible` (`:289-310`)

Un ledger con una línea corrupta revienta la relectura con la que se numera el
asiento — y ocurre sobre la ruta **por defecto**, sin proponer nada. Se lee una
vez en la precondición. Lo que esa lectura **no** comprueba es que el fichero se
pueda **escribir**: está declarado en el propio código y es la puerta de §4.2.

---

## 4 · CENSO Y DECLARACIÓN DE ALCANCE: lo conocible antes, y lo conocible después

Este WP **cierra la familia conocible ANTES de fusionar** y **no cierra la
conocible después**. No es un residuo pendiente de pulir: son **una sola decisión
aplazada** —qué hacer cuando el fallo sólo se conoce con el corpus ya movido— y
**no se esquiva con más precondiciones**. Una sonda de escribibilidad tendría que
tocar el root antes de VERIFICAR, que es exactamente lo que la CA-2 de este WP
prohíbe; y envolver `appendOpsLedger` es lo que §3 rechaza por escrito, porque
convertir en `{ok:false}` un fallo que ya dejó el root a medias cumple la letra
del contrato y no su intención. Las salidas honestas —`deshacerFusion` de U255, o
declarar el medio-aterrizaje en el contrato— son **decisión de contrato, no una
línea**. Van a **WP-U268**.

### 4.1 · Cerrado aquí (conocible antes de fusionar)

| # | punto | línea | medido | estado |
| --- | --- | --- | --- | --- |
| 1 | cerco de la ruta del ledger — 6 códigos, 8 entradas | `:918` | sí, §1-§2 | **cerrado** (precondición `:241`) |
| 2 | `ledgerPath` releído por el asiento (getter) | `:918` | sí, §3.2 | **cerrado** (`ledgerFijo` + ruta resuelta) |
| 3 | ruta que la propia fusión ocupa, sepulta o bloquea — 3 formas | `:918` | sí, §3.3 y §2 | **cerrado** (guarda `:689`) |
| 4 | ledger existente ILEGIBLE, también en la ruta por defecto | `ledger.mjs:77` | sí, §3.5 | **cerrado** (`ledger_ilegible`) |
| 5 | `ledger` con campos inutilizables (`{volumesRoot:42}`) | `:260` | sí, §3.4 | **cerrado** (`ledger_opts_invalidas`) |

### 4.2 · NO cerrado aquí — familia «sólo conocible DESPUÉS de fusionar» → U268

Cuatro medidas **por mí**, con su orden (`node _u268-medicion.mjs`, guion
temporal; copia en el scratchpad de la sesión):

| # | vector | línea | salida medida | root tras el fallo |
| --- | --- | --- | --- | --- |
| U268-1 | `.ops-ledger.jsonl` **de sólo lectura**, ruta por defecto, **sin proponer nada** | `:918` | **lanza** `EPERM … open '<root>\.ops-ledger.jsonl'` | corpus aterrizado · manifiesto re-sellado · **sin asiento** |
| U268-2 | `volumes.json` de sólo lectura (SELLAR) | `:882` | **lanza** `EPERM` | corpus aterrizado · **sin resellar** · sin asiento |
| U268-3 | `volumes.state.json` de sólo lectura (`syncVolumeCounters`) | `:885` | **lanza** `EPERM` | corpus aterrizado · resellado · sin asiento |
| U268-4 | enlace en el volumen del destino: **NO-LINK tras SELLAR** | `:910-913` | **no lanza**: `{ok:false, step:'no-link', error:'symlink_en_resultado'}` | corpus aterrizado · **resellado** · sin asiento |

**U268-1 es el defecto del enunciado intacto, por la puerta que no proponía
nada**, y mi precondición no lo toca: lee el ledger pero nunca comprueba que se
pueda escribir.

**U268-4 es el hallazgo que mi primer censo no podía ver**, porque contaba
**excepciones** y esto es un `{ok:false}` legítimo por contrato… emitido
**después** de fusionar y de sellar. Medio-aterrizaje sin excepción de por medio.

Dos más, **identificadas por lectura y medidas por la contrarrevisión, no por
mí**, y así marcadas:

| # | vector | línea | estado |
| --- | --- | --- | --- |
| U268-5 | `walkTree` de NO-LINK sobre un subdirectorio sin permiso de listado | `:910` | alcanzable · **no re-medido aquí** |
| U268-6 | `rmSync(stagingDir)` del `finally` (`:957`): un `EBUSY` **SUSTITUYE al `return` de ÉXITO** — un import completado queda indistinguible de uno fallido, con el asiento ya escrito | `:957` | alcanzable · **no re-medido aquí** |

Y tres que siguen **identificadas por lectura y no medidas por nadie**:
`sha256File` del sello por fichero (`:814` — `existsSync` no distingue
directorio), `famDriver.snapshotOf` (`:821`) y `measurePath` (`:828`).

---

## 5 · Censo de mutación

### 5.1 · El fichero nuevo contra la BASE — y contra la v1 revisada

Restaurando `src/import.mjs` a `HEAD~1` (la base) y corriendo el fichero nuevo:
**15 fail / 9 pass**. Los nueve verdes son los que **no deben** depender de las
guardas: hostil-omite (4), precedencia del rol, el control de la ruta legítima, y
tres que la base satisface por otra vía (el getter, porque la base lo lee una
sola vez —al final—; y los dos del eje `volumesRoot`, porque la base reenvía el
objeto entero). Si alguno de ésos hubiera enrojecido, la guarda estaría
estrechando algo que ya funcionaba.

Restaurando a `HEAD` (la **v1**, la versión que la contrarrevisión leyó):
**4 fail / 20 pass** — `not ok 17` (B2), `not ok 18` (B3), `not ok 20` (B4) y
`not ok 24`. Los tres bloqueantes tienen cada uno su rojo, y nada más se movió.

**Cuál es el método, porque la partición depende de él.** `cargaMutante` lee del
**disco**, no del grafo de módulos, así que el test 24 enrojece contra cualquier
`src/import.mjs` que no contenga las guardas — **por no encontrar qué amputar, no
por un hallazgo propio**. Con ese caso incluido, la partición contra la v1 es
4/20; sin él, 3/21. Contra la base, 15/9 y 14/10. Los cuatro números son
correctos y la afirmación de fondo se sostiene en todos; se declara para que
nadie lea el test 24 como un rojo independiente. (En mi v1 dije «10 de 16» sin
decir el método: era el mismo número por disco, y la observación de la
contrarrevisión sobre 9/7 por hook es correcta.)

### 5.2 · El censo vive DENTRO de la suite (test 24)

Se escribe a disco un `import.mjs` **mutante** —el mismo fichero con **cuatro
amputaciones**, cada una restaurando una pieza portante: las tres salidas de la
precondición, la salida de la guarda de fusión, la tercera forma de la guarda
(`|| cuelgaDe(d, ledgerAbs)`) y el reenvío de la ruta resuelta al asiento— se
importa de verdad, y se exige que los **doce** vectores vuelvan a **lanzar Y a
mutar el root** (volumen aterrizado, cero asiento). Cada amputación **cuenta sus
casos y los asevera**: si un patrón dejara de casar, el «mutante» sería el
original y el censo pasaría en verde sin haber amputado nada.

### 5.3 · Los cuatro mutantes que sobrevivían: muertos, con su inyección

Inyectados uno a uno en `src/import.mjs` (reemplazo literal), corrido el fichero
y restaurado:

```
--- M1 · `err instanceof LedgerPathDenegada` → `true`
not ok 20 - B4 · `ledger` con campos inutilizables: `{volumesRoot: 42}` …
# pass 23 · fail 1

--- M6 · la guarda ignora los movimientos `kind:'corpus'`
not ok 19 - B3 · la guarda mira también los movimientos `kind:"corpus"` …
# pass 23 · fail 1

--- M2 · `resolveOpsLedgerPath` sin `volumesRoot`
not ok 20 - B4 · `ledger` con campos inutilizables …
not ok 22 - B4 · `ledger.volumesRoot` explícito viaja hasta el asiento …
# pass 22 · fail 2

--- M5 · el asiento sin `volumesRoot`
not ok 22 - B4 · `ledger.volumesRoot` explícito viaja hasta el asiento …
not ok 24 - CA-5 · amputadas las guardas …
# pass 22 · fail 2
```

M1 ya no es equivalente porque la distinción que §3.4 declara portante tiene
ahora quien la fije por los dos lados: test 20 (el llamante trajo basura →
`ledger_opts_invalidas`) y test 21 (el entorno está mal → sigue `verificar`).

---

## 6 · Lo que este WP NO cubre

- **La familia de §4.2 entera** — seis vectores (cuatro medidos por mí, dos por
  la contrarrevisión) más tres sólo leídos. Ninguno cerrado. Van a **U268**.
- **Lo que la huella del árbol no ve**, ahora declarado también en el docstring
  del arnés: **flujos de datos alternos de NTFS** (`readdir` no los enumera — es
  la misma ceguera que `ledger-cerco.mjs` declara en su cabecera, y el cerco
  existe justamente porque ese canal escribe DENTRO del manifiesto), **metadatos
  de tiempo** (fuera a propósito: los mueve cualquier lectura) y **rutas fuera
  del root**. Sí ve altas, bajas, contenido byte a byte, tipo, **modo** y
  **destino de enlace** — los dos últimos añadidos tras la devolución. La
  contrarrevisión re-midió las seis filas con una huella más fuerte que la mía y
  salieron idénticas, incluida la ausencia de residuos fuera del root; eso no lo
  mide este fichero de pruebas.
- **TOCTOU por un tercero concurrente.** La precondición juzga el root tal como
  está al entrar y la guarda cubre lo que el propio import va a hacerle; un
  operador que cree un directorio o un enlace duro en esa ruta mientras el import
  corre sigue pudiendo hacer lanzar al asiento. No es cerrable sin bloqueo del
  root.
- **`e2e/local-first-ca.mjs`** no corre en esta máquina: aborta en el paso 1 por
  `ZEUS_GAMES_LIBRARY no está definida`, del entorno. No es evidencia a favor ni
  en contra.
- **Otras plataformas.** Todo medido en win32/NTFS. Las dos entradas de flujo
  alterno se saltan fuera de win32 a propósito (en POSIX esa cadena nombra un
  fichero legítimo).

---

## 7 · Órdenes y salidas

```
# base (HEAD~1)
cd packages/engine/volumes-ops && node --test test/*.test.mjs
# tests 216 · pass 214 · fail 0 · skipped 2

# después
cd packages/engine/volumes-ops && node --test test/*.test.mjs
# tests 240 · pass 238 · fail 0 · skipped 2

# el fichero nuevo, solo
cd packages/engine/volumes-ops && node --test test/u253b-import-atomico.test.mjs
# tests 24 · pass 24 · fail 0

# censo estático de escritores del manifiesto (U205): `src/import.mjs` NO queda marcado
node --test packages/mesh/ssb-system/test/export.test.mjs
# tests 26 · pass 26 · fail 0

# lint de lo tocado (eslint local, sin descarga)
npx --no-install eslint packages/engine/volumes-ops/src/import.mjs \
  packages/engine/volumes-ops/test/u253b-import-atomico.test.mjs
# 0 errors · 0 warnings
```

**Dependencias**: el worktree no traía `node_modules`; se instaló con
`npm ci --ignore-scripts --no-audit --no-fund`, que no reescribe
`package-lock.json` ni `package.json`. Tras la instalación, `git status` sólo
mostraba cambios de modo en tres `bin/*.mjs`; se revirtieron con
`git checkout --` antes de empezar.

## 8 · El caso que U253a dejó enrutado aquí

`test/u253-escritura-sobre-manifiesto.test.mjs:401` se llamaba
«…denegado, pero el manifiesto YA está resellado (→ U253b)» y aseveraba
`r.mutado === true`, «el volumen quedó declarado» y «el corpus ya aterrizó», con
la nota de que la atomicidad quedaba fuera de su ALCANCE_DIFF. Cerrada esa
familia aquí, las tres asersiones se invierten y el título deja de anunciar
deuda. Es el único cambio en ese fichero; el cerco que prueba no se tocó.

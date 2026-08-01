# WP-U259 · La detección de corrupción cubre las CUATRO familias — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U259) |
| fecha | 2026-08-01 |
| rama | `wp/u259-sello-cuatro-familias` · base `bde9c12` |
| alcance tocado | `packages/engine/volumes-ops/src/{unit-tree(alta),driver-lineas,driver-forces,driver-firehose,driver-ssb,verify,import,cerco,index}.mjs` · `packages/engine/volumes-ops/test/{snapshot-cuatro-familias(alta),cerco-root,sello-root-referencia,import-ssb-driver}.test.mjs` · `VOLUMES/{volumes.json,.ops-ledger.jsonl}` (re-sello con `scripts/sello-root.mjs`) · `e2e/local-first-ca.mjs` · este reporte · fila U259 de `BACKLOG.md` |
| **fuera de ALCANCE_DIFF y lo declaro** | `packages/engine/volumes-ops/README.md` — §9. Decía «el snapshot sólo lo sella FORCES» y «los binarios no se escanean»; las dos frases quedaban FALSAS contra el código de este árbol |
| `packages/mesh/**` · `packages/engine/presets-sdk/**` · `package.json` · lockfile · `scripts/**` · `.github/**` | **ninguno** |
| estado propuesto | listo para verificación de cierre |
| push | no intentado · sin merge · sin `git stash` · sin `npx` · `npm ci` (no `install`) |

**[banco]** = medido en este worktree Windows.
**[git]** = medido sobre los bytes que entrega git (índice / `git archive`), no
sobre el árbol de trabajo.

---

## CA de cierre, término a término

| lo pedido | cómo queda |
| --- | --- |
| snapshot verificable en las 4 familias | **sí** · §3. Y no por buena voluntad de cada driver: `snapshotOf`/`verifySnapshot` son **contrato del driver**, con un test que recorre el registro |
| corrupción detectada en cada una con su rojo | **sí, cuatro vectores y cuatro negativas de arranque** (§2), cada una con la premisa de que los OTROS tramos la dejan pasar |
| el predicado de URL viva, escrito y falsable | §5 · cuatro exenciones con regla, **12 casos medidos**, el que hoy pasa y ahora cae, y los legítimos que siguen pasando |
| que no rompas lo que arranca | §6 · arranque REAL de los cuatro servicios, con el root sellado y sin sellar, **idéntico en las dos caras** |
| medir sobre los bytes que entrega git | §7 · el snapshot se **reconstruye desde los blobs del índice** y coincide; hay test que lo vigila |
| qué queda sin cubrir | §8 |

---

## 1 · El diagnóstico, reproducido antes de tocar nada — y NO era el que el WP traía

El WP se abrió diciendo que «en LINEAS y FIREHOSE una corrupción equivalente pasa
los tres tramos». **Después de U258 eso ya no era exacto**, y decirlo importa
porque cambia el arreglo. Sonda propia por el camino del producto
(`assertVolumesRootBootable` acotado por `volumeIds`, como lo acota cada
servicio) sobre un root con **las cuatro familias con árbol**, sellado por
`importPack`:

```
vector                                        ANTES (base bde9c12)
lineas · un byte de meta.json                 SE NIEGA   ficheros: fichero_corrupto
lineas · ALTA schema-VÁLIDA en la unidad      ARRANCA    —
lineas · ALTA fuera de unidad (copia local)   ARRANCA    —
forces · un byte de think.md                  SE NIEGA   ficheros + snapshot
forces · ALTA en la unidad                    SE NIEGA   snapshot: unidad_corrupta
forces · ALTA fuera de unidad (copia local)   ARRANCA    —
firehose · contenido (misma clave)            SE NIEGA   ficheros: fichero_corrupto
firehose · ALTA de unidad                     ARRANCA    —
firehose · BAJA de unidad                     SE NIEGA   ficheros: fichero_ausente
ssb · contenido (misma clave)                 SE NIEGA   ficheros: fichero_corrupto
ssb · ALTA de mensaje                         ARRANCA    —
ssb · BAJA de mensaje                         SE NIEGA   ficheros: fichero_ausente
```

**El hueco real que quedaba era EL ALTA**, y sólo FORCES lo cazaba — porque su
snapshot de unidad es un hash de **conjunto**, no de pertenencia. El leg
`ficheros` de U258 tapa contenido y bajas; lo dice él mismo («comprueba
PERTENENCIA de lo sellado, no IGUALDAD DE CONJUNTO») y la medida lo confirma.
Y el vector de LINEAS es especialmente incómodo: una **copia exacta** de un
`meta.json` que ya vive en la línea es schema-válida por construcción, así que
el validador de familia no puede quejarse.

Estado de los tramos en ese mismo root, antes:

```
snapshot[lineas]   omitido · sin_snapshot_sellado          ← el driver no sellaba
snapshot[forces]   VERDE
snapshot[firehose] omitido · sin_verificador_de_snapshot   ← sellaba y nadie lo miraba
snapshot[ssb]      omitido · sin_verificador_de_snapshot   ← ídem
```

Dos causas distintas, no una: **LINEAS no sellaba** y **FIREHOSE/SSB sellaban un
cursor que nadie contrastaba**. La segunda tenía nombre y sitio: una tabla
`SNAPSHOT_VERIFIERS` **mantenida a mano** en `verify.mjs` con una sola entrada.
Una tabla a mano es la juntura por la que una familia nueva entra en silencio
como «omitida» — que es literalmente cómo llegaron aquí las dos.

---

## 2 · DESPUÉS — un rojo por familia, con su premisa

```
vector                                        DESPUÉS
lineas · ALTA schema-VÁLIDA en la unidad      SE NIEGA   snapshot: unidad_corrupta
forces · ALTA en la unidad                    SE NIEGA   snapshot: unidad_corrupta
firehose · ALTA de unidad                     SE NIEGA   snapshot: cursor_desviado
ssb · ALTA de mensaje                         SE NIEGA   snapshot: cursor_desviado + feed_desviado
ssb · misma clave, `value.sequence` reescrita SE NIEGA   snapshot: feed_desviado (SIN cursor_desviado)
firehose · `.md` suelto en un corpus          SE NIEGA   snapshot: indice_con_agujero
── y lo que NO debía moverse, y no se movió ──
lineas · ALTA fuera de unidad (copia local)   ARRANCA
forces · ALTA fuera de unidad (copia local)   ARRANCA
```

**Cada rojo va con su NO VACUIDAD aseverada**: el test comprueba que
`ficheros`, `familia` y `corpora` **no ven** el vector. Sin eso el rojo podría
venir de rebote y el tramo nuevo ser adorno — es el modo de fallo que este
carril persigue, así que se asevera en vez de contarse.

El caso `feed_desviado` sin `cursor_desviado` es el que demuestra que el segundo
eje de SSB no es decorativo: la clave SSB es **opaca**, así que reescribir
`value.sequence` deja el conjunto de claves intacto y `unitsSha256` no se entera.
La posición `(author, sequence)` es la garantía central de esa familia y **ningún
otro tramo la mira**.

Sobre el **root de referencia del repo**, el mismo vector, vector a vector sobre
copias en tmp (test `sello-root-referencia`): un ALTA en **cada** unidad sellada
(`demo` de LINEAS, `forces/force-sample` y `cotas/sima` de FORCES) niega el
arranque del servicio que la usa, con `unidad_corrupta`.

---

## 3 · La vía: el mismo cuerpo SELLA y VERIFICA

`snapshotOf(volumeDir)` / `verifySnapshot(volumeDir, sellado)` en **los cuatro
drivers**. `importPack` llama al primero, `verify.mjs` al segundo. No se comparan
dos algoritmos: se usa uno.

| familia | forma del snapshot | qué caza |
| --- | --- | --- |
| FORCES | `{ <unitDir>: sha256(árbol) }` | alta / baja / contenido dentro de la unidad |
| **LINEAS** (nuevo) | `{ <dirDeLínea>: sha256(árbol) }`, unidades = entradas de `registry.yaml` | ídem |
| FIREHOSE | `{unit:'at-uri', units, unitsSha256}` (O(1)) | alta / baja / re-clave de unidad |
| SSB | `+ {feeds, feedsSha256}` | ídem **+ frontera y densidad de cada feed** |

Tres decisiones, con lo que las sostiene:

**(a) El snapshot se recomputa del DESTINO tras FUSIONAR, no del plan.** Es la
lección de U258 con `hashes`, aplicada al snapshot. En FORCES los dos momentos
coinciden siempre (una unidad divergente aborta con `colision_force`) y **está
aseverado** para que el cambio quede medido y no supuesto. En LINEAS **no
coinciden**: el driver conserva el fichero del destino cuando diverge y jamás
pisa un `.md` curado, así que sellar el staging anotaría un árbol que el volumen
no tiene y el root dejaría de arrancar **por haber importado bien**.
Comprobación por efecto: los dos valores de FORCES en `VOLUMES/volumes.json`
(`dce4cb0b…`, `a3bb1b72…`) **no cambian ni un carácter** tras el re-sello.

**(b) La unidad de LINEAS es la LÍNEA, y sale del índice.** No del directorio.
Consecuencia deliberada y medida: una línea local que `registry.yaml` no declara
—`LINEAS/espana`, que `.gitignore` permite a propósito— **no entra en el
snapshot y sigue arrancando**. Es la misma asimetría que FORCES ya tenía. Si el
perímetro fuera el directorio, cualquier operador con una copia local se
quedaría sin arranque por material que el repo declara no controlar.

**(c) En FIREHOSE/SSB el cursor se verifica EXACTO, y la razón está medida.**
Las dos familias declaran por contrato que el volumen CRECE, así que la pregunta
legítima era si exigir igualdad rompe su operación normal. Sobre un volumen
sellado, **antes de este WP**:

```
triage raw/b1/u1.json → labeled/b1/u1.json        SE NIEGA ya hoy (ficheros: fichero_ausente)
crecimiento, con corpora declarados en el pack    SE NIEGA ya hoy (corpora: corpus_desviado)
crecimiento, sin corpora declarados               ARRANCA   ← el único hueco
```

O sea: **un volumen sellado de esas familias ya estaba congelado** por los
tramos que existían. El cursor exacto **no añade una clase de rotura nueva**;
añade la única que faltaba, y nombra la deriva en unidades en vez de en bytes.
Crecer un volumen sellado sigue exigiendo lo mismo que antes: **re-importar**,
que re-sella el cursor. Frontera declarada: si algún día se quiere un volumen
sellado que crezca en vivo, hay que rediseñar los **tres** tramos a la vez
(`ficheros`, `corpora`, `snapshot`); este WP no lo hace y no lo promete.

**Y el índice con agujeros no rinde verde.** Si el volumen trae material sin
clave, enlaces, layout roto o un feed bifurcado, el cursor recomputado **no
prueba nada**: se emite `indice_con_agujero` en vez de un verde construido sobre
un hueco. Es la doctrina que estos mismos drivers ya aplicaban al importar (D-F
de U204, D-G de U205, donde `destSinClave` y `destFueraDeLayout` murieron por
ser «la coartada»); aquí se aplica al verificar.

---

## 4 · El NO-OP tenía un apagador silencioso, y era el caso del root del repo

El gate NO-OP de `importPack` decidía «ya sellado con este contenido» **sólo por
`packHash`**. Consecuencia: un root sellado por una versión anterior al contrato
de snapshot respondía `noop:true` y **nunca llegaba a anclarlo** — el tramo se
quedaba en «omitido honesto» para siempre. Es exactamente el root de referencia
del monorepo: `scripts/sello-root.mjs` sobre él era no-op y LINEAS no iba a
recibir snapshot jamás.

Se añade una condición **de FORMA, no de VALOR**, y la distinción es la que
evita un blanqueo:

> no es NO-OP si el registro sellado **carece** de snapshot y la familia del
> volumen **sabe** sellarlo.

Comparar el snapshot sellado con el recomputado habría abierto una vía de
blanqueo: un volumen **corrompido** dejaría de ser no-op, el import correría y
volvería a sellar la corrupción como legítima. Con la condición de forma eso no
puede pasar, y **está aseverado en un test**: con un ALTA plantada en LINEAS, el
mismo pack sigue dando `noop:true` y el arranque sigue negándose.

Idempotencia comprobada en las dos direcciones: primera pasada re-sella
(`moved: 0` — un sello anota, no mueve), segunda y tercera `noop:true`.

---

## 5 · El predicado de URL viva — escrito, y falsado caso a caso

**El problema, tal y como U206 lo dejó medido**: sobre el root de referencia el
cerco daba **tres hallazgos** —dos `urls.revision` de la fixture de LINEAS
(`demo/wp/historia/manifest.json:27` y `:40`) y un enlace de repositorio en
`README.md:5`—, **ninguno un ancla de arranque**. Con ese predicado, encender
`ZEUS_VOLUMES_CERCO=strict` negaría el arranque a todo el monorepo: un
interruptor que nadie puede pulsar.

**La pregunta, formulada para poder contestarla.** Un **ancla de arranque** es
una URL que el producto puede dereferenciar: sin red, algo deja de funcionar. Un
**metadato inerte** es una URL que sólo puede leer una persona, o que nombra un
original del que el root ya guarda copia o coordenada. El cerco no puede
ejecutar el producto, así que la decisión se toma con **cuatro exenciones, todas
decidibles sobre los bytes**. Lo que no cae en una de las cuatro es URL viva: el
default es fallo-cerrado.

| | regla | por qué |
| --- | --- | --- |
| **I1** | el **host** (autoridad ya descontadas userinfo y puerto, como la parte `new URL()`) está vacío o contiene `${…}` | nadie puede dereferenciarla sin rellenarla: es plantilla, no ancla |
| **I2** | la URL es **valor completo** de un campo de un documento estructurado (JSON) **y coordina** un par nombre=valor con el registro que la contiene | no apunta a un servicio: apunta al MISMO objeto que el registro describe, y lo demuestra repitiendo su coordenada |
| **I3** | `volumes.<id>.source.imported.origin` dentro de `volumes.json` | contrato (CONTRATO-IMPORT-PACK-v1 §3). **Heredada de U206 sin tocar un carácter** |
| **I4** | `.md` **suelto en la raíz** del root **y** la URL dentro de un enlace de Markdown | (a) el constructor de packs ya declara esa categoría (`manifiesto_de_root` — «un pack sólo transporta discos»): no es dato de ningún volumen, no viaja en ninguna réplica, ningún cargador la abre; (b) enlace = material dirigido a una persona |

**I3 no se ensancha a `source.imported.*` ni a `source.*`, a propósito.**
Ensanchar una exención existente es debilitar una guarda, y este WP no hace eso
ni para que le pasen sus propios casos.

### 5.1 · El caso que HOY pasa y con esta regla CAE

```
https://${TOKEN}@servidor.real/pack.tgz
```

La regla vieja era `/^https?:\/\/\$\{/i` — «empieza por `https://${`». Con ella,
una URL cuya **autoridad de verdad está detrás del `@`** quedaba **exenta**: el
`${…}` estaba en la userinfo. Y el literal ni siquiera se capturaba entero,
porque el patrón cortaba en `}` y casaba `https://${TOKEN`. Con I1 la autoridad
se **parsea** (`hostname` = `servidor.real`) y la URL cae. El patrón admite
ahora grupos `${…}` completos: **capturar más, decidir después**.

### 5.2 · Los legítimos que siguen pasando, y los límites

12 casos medidos, todos con test:

| caso | viejo | nuevo |
| --- | --- | --- |
| `https://${TOKEN}@servidor.real/x` | inerte | **VIVA** ← cae |
| `https://${ZEUS_HOST}/x`, `https://${A}.${B}/x` | inerte | inerte |
| `registros[i].urls.revision = "…?oldid=2"` junto a `oldid: 2` | VIVA | **inerte** ← legítimo |
| `README.md` de raíz, `[texto](https://…)` | VIVA | **inerte** ← legítimo |
| la misma coordenada que NO casa (`oldid=99` con `oldid: 2`) | VIVA | VIVA |
| endpoint (`pubUrl`) junto a escalares que no coordinan | VIVA | VIVA |
| URL incrustada en prosa dentro de un campo JSON | VIVA | VIVA |
| ancestro **lejano** que coordinaría (frontera del registro) | VIVA | VIVA |
| `README.md` de raíz con la URL **desnuda** (no es enlace) | VIVA | VIVA |
| `.md` **de datos** bajo un disco, aunque sea enlace | VIVA | VIVA |
| YAML con la misma coordenada (no se parsea) | VIVA | VIVA |
| `.ops-ledger.jsonl` / `volumes.state.json` de raíz | VIVA | VIVA |

Las dos últimas filas son las que impiden que I2/I4 se conviertan en boquetes:
**YAML no obtiene I2** (fallo-cerrado: antes de exentar hay que poder leer el
registro) y **el alcance de U206 no se recorta** — el ledger y el estado viven en
la raíz y se siguen barriendo enteros, porque no son prosa.

**Lo que este predicado NO es, y hay que decirlo: no es a prueba de adversario.**
I2 se puede fabricar añadiendo al registro un campo con el nombre y el valor del
parámetro que uno quiera colar. Mismo estatuto que el ledger, que es «append-only
por convención, no a prueba de manipulación»: protege contra **deriva**, no
contra alguien con escritura en el root — y quien la tiene se encuentra delante
los otros tres predicados y los ocho tramos del verificador.

### 5.3 · Consecuencia: el paso 7 del CA ya cubre el root LINEAS

El root C dejó de ser «informativo, FUERA del alcance del paso 7» y pasó a
**aserción**, con su rojo propio (un endpoint que no coordina con su registro).
Y el root de referencia queda con **0 hallazgos de cerco**, con test que además
comprueba que **no es vacuo** (una URL viva plantada ahí sí se caza). El
interruptor `ZEUS_VOLUMES_CERCO=strict` deja de ser impulsable-en-teoría.

---

## 6 · Que el producto siga arrancando

Arranque **real**, no la guarda: se lanza el MISMO fichero que `npm run start:*`
como proceso aparte, con el root apuntado, ventana de 12 s. Contra el root
re-sellado y contra una copia **sin sellar**, mismo árbol de código [banco]:

| servicio | root SIN sellar | root RE-SELLADO (U259) |
| --- | --- | --- |
| `force-system` | ARRANCA | **ARRANCA** |
| `ssb-system` | ARRANCA | **ARRANCA** |
| `firehose-browser` | ARRANCA | **ARRANCA** |
| `linea-system` | **NO ARRANCA** — `Line data not found for "espana"` | **NO ARRANCA** — idéntico |

`linea-system` no arranca **ni antes ni después, y no por la guarda**: la guarda
pasa y el fallo llega después, en el cargador de líneas, porque exige la línea
`espana` que el candado de `.gitignore` prohíbe que llegue a git. Es lo que
U261 documentó y U258 volvió a medir; **no lo introduce este WP**, y la
equivalencia está demostrada corriendo las dos caras, no afirmada.

Los cuatro puntos cableados pasan además la guarda sobre el root de referencia
(test 2 de `sello-root-referencia`), y el test que comprueba **que el cableado
sigue donde dice** sigue verde: una vigilancia que cita un cableado movido no
vigila, recita.

**Los dos volúmenes que U258 dejó sin sellar a propósito siguen sin sellar.**
`firehose` (DISK_01) y `ssb` (DISK_04) tienen 0 ficheros rastreados y directorio
inexistente; sellarlos los mata (`volumen_ausente`), medido por U258. Este WP
**no los toca**: su cobertura sigue siendo el sello del root. O sea, la pregunta
del BRIEF —«si tu vía los sella, demuestra que arrancan; si no puede,
decláralo»— se contesta por el segundo camino: **no se sellan, y por la misma
razón medida que entonces**. Lo que sí ganan es que las familias FIREHOSE y SSB
ya tienen verificador, así que **un root de operador con esos volúmenes CON
árbol sí queda cubierto** — que era el parque real que quedaba fuera.

### 6.1 · Suites [banco]

```
@zeus/volumes-ops   174 tests · 172 pass · 0 fail · 2 skipped   (eran 148/146; +26 casos)
@zeus/linea-kit      43 · 43 · 0        @zeus/ssb-system    27 · 27 · 0
@zeus/presets-sdk    55 · 55 · 0        @zeus/feed-kit      10 · 10 · 0
@zeus/firehose-core  12 · 12 · 0        @zeus/force-system   2 ·  2 · 0
@zeus/linea-system    3 ·  1 · 0 · 2 skipped (los de U261, sin cambio)
lint exit 0 · 0 errores · 18 warnings (mismo número que la base U258)
gates: OK (0 offenders) · test:gates 58/58
e2e/local-first-ca.mjs → 7/7 pasos verdes, 14 vectores rojos (eran 13), exit 0
```

Los 2 omitidos de `volumes-ops` son los `t.skip` de Windows preexistentes.
`force-system` y `linea-system` **exigen `ZEUS_VOLUMES_ROOT`**: sin él fallan por
`VOLUMES root required`, que es el fail-closed de U200 y no una regresión — este
worktree no tiene `.env` (fichero del operador, gitignorado). Comprobado en las
dos formas antes de acusar a nadie.

**Higiene comprobada antes de acusar**: tras `npm ci` aparecían los 3 ficheros
`bin/` como modificados; `git diff --numstat` sobre ellos da **vacío**
(re-estampado de `npm ci`) y se restauraron. Los probes de este WP vivieron en
`data/_u259probe/` (ruta gitignorada) y se han borrado; `VOLUMES/volumes.state.json`
—que las mediciones regeneran y `.gitignore` excluye— también.

---

## 7 · Los bytes que entrega git, no los de mi disco

La lección más cara de U258 aplicada al hash de **árbol**: si el checkout de CI
entrega otros bytes, la unidad hashea distinto y los servicios no arrancan. El
candado (`.gitattributes` · `VOLUMES/** -text`) no se toca; lo que se añade es el
**observador**, y comprueba por efecto:

> para cada unidad sellada, se reconstruye el árbol ENTERO en un temporal desde
> `git ls-files` + `git show :<ruta>` —o sea desde el índice, que es lo que se
> convierte en commit— y se recomputa `hashUnitTree`. Tiene que dar el hash
> sellado. [git]

Verde sobre las tres unidades del root de referencia (`demo`,
`forces/force-sample`, `cotas/sima`). Si alguien commitea CRLF o quita el
candado, esto se pone rojo antes que CI. Se suma al observador de U258, que hace
lo propio fichero a fichero para `hashes`.

**Sobre CI**: no hizo falta tocar `.github/workflows/ci.yml`. El fichero nuevo
`snapshot-cuatro-familias.test.mjs` entra por el glob de
`@zeus/volumes-ops` (matriz), y el job `sello-root` re-ejecuta
`sello-root-referencia.test.mjs` fuera de la matriz — que es donde viven las
aserciones nuevas sobre el root real. La vigilancia crece sin ampliar el
cableado.

---

## 8 · Qué queda SIN cubrir, escrito

- **El ALTA fuera del perímetro declarado sigue arrancando**, en las cuatro
  familias. Es deliberado y medido (§3b): el perímetro es el índice, no el
  directorio, y `.gitignore` permite copias locales a propósito. Un fichero
  plantado en un volumen LINEAS/FORCES fuera de toda línea/unidad no es hallazgo
  de este tramo. En FIREHOSE/SSB no hay ese hueco —cualquier fichero cuenta,
  y si no rinde clave sale `indice_con_agujero`— pero a cambio esas dos
  familias **no toleran crecimiento en vivo sobre un volumen sellado**.
- **Un volumen SELLADO de FIREHOSE/SSB no puede crecer sin re-importar.** Ya era
  así antes de este WP por otros dos tramos (§3c); ahora además lo dice el
  tramo que le corresponde. Rediseñarlo es un WP propio, con los tres tramos a
  la vez.
- **El predicado de URL viva no es a prueba de adversario** (§5.2), y **no cubre
  YAML**: un `.yaml` se barre como texto, así que no obtiene I2 — fallo-cerrado
  declarado. Darle I2 exige parsear YAML en el cerco, que es una dependencia y
  una decisión que este WP no toma.
- **`firehose` y `ssb` del monorepo siguen sin árbol y sin sellar** (§6). Su
  cobertura es el sello del root, como desde U258.
- **El ledger sigue siendo append-only por convención.** Frontera heredada de
  U206, sin cambios.
- **No afirmo CI verde.** La rama no se empuja (regla del swarm); el cierre real
  es su run. La base `bde9c12` es la aceptación de U258.

---

## 9 · Un fichero fuera de ALCANCE_DIFF, y por qué

`packages/engine/volumes-ops/README.md`. Dos frases suyas quedaban **falsas**
contra el código de este mismo árbol:

1. «el snapshot con forma árbol por unidad **sólo lo sella FORCES** … familia sin
   verificador se reporta `omitido`» — es justo lo que este WP cierra;
2. «binarios … **no se escanean** y se declaran en `binaries[]`» — falso desde
   U206·m4, que quitó esa exención precisamente porque «declarar no es
   proteger». Se corrige de paso porque vivía en el párrafo que había que
   reescribir de todos modos.

La regla de oro de este swarm es que las afirmaciones no sean más anchas que la
evidencia; un README que describe una protección que el código no tiene es esa
clase de afirmación, con la agravante de que se lee antes que el código.

---

## 10 · Lo que NO afirmo

- **No afirmo que el snapshot detecte altas fuera del perímetro declarado.** §8.
- **No afirmo que `linea-system` arranque.** No arranca, ni antes ni después, y
  §6 dice por qué y con qué medida en las dos caras.
- **No afirmo que el predicado de URL viva resista a un adversario.** §5.2.
- **No afirmo haber medido roots de operador reales.** Todo lo de FIREHOSE y SSB
  está medido sobre fixtures sintéticas con la forma que escriben los
  productores del mundo (`writeJetstreamPost`, `ssb-system/src/export.mjs`); el
  corpus real de 8.388 unidades vive fuera del repo y no lo tengo.
- **No afirmo CI verde.** §8.

---

## 11 · Enrutables (declarados, no ejecutados)

1. **`hashTree` de `import.mjs` sigue siendo una segunda copia** de la fórmula de
   `hashUnitTree`. Este WP **no añadió una tercera**: movió el cuerpo a
   `src/unit-tree.mjs`, del que ahora beben FORCES, LINEAS y el verificador, y
   `driver-forces.mjs` lo re-exporta para no romper a nadie. Unificar la que
   queda exige decidir y medir el caso de los enlaces (`lstat` contra `Dirent`),
   que es una decisión de contrato. Enrutable de U258 §11.1, estrechado. **P2.**
2. **El cerco no parsea YAML.** Mientras no lo haga, I2 no llega a los `.yaml`
   del root. Hoy no hay ninguno con URL, y el fallo es cerrado. **P2.**
3. **`corpora.files/bytes` sigue sin sembrarse en el root de referencia** (U258
   §5, por la misma razón de las copias locales). Con el snapshot de unidad
   puesto, la pregunta «¿debería el leg de corpora acotarse al perímetro
   declarado en vez de medir el directorio entero?» tiene ahora una respuesta
   posible que antes no tenía. **P2, con dueño de carril.**

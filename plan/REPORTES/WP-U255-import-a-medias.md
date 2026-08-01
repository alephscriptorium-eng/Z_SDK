# WP-U255 · una importación que falla a medias deja de dejar la biblioteca a medio escribir

Rama `wp/u255-import-a-medias`, base `c1f71b7`. Todo lo que sigue lleva comando y
salida, o dice «no medido».

| dato | valor |
| ---- | ----- |
| Contrato que se incumplía | `plan/CONTRATO-IMPORT-PACK-v1.md` §1 paso 4 («pase 1 (dry): TODA colisión se detecta ANTES de mover nada … root intacto») y §1 cabecera («Todo fallo: `{ok:false, step, error}`») |
| Obra | `packages/engine/volumes-ops/src/fusion-guard.mjs` (nuevo) · `import.mjs` · `driver-lineas.mjs` · `driver-forces.mjs` · `driver-firehose.mjs` · `driver-ssb.mjs` · `index.mjs` |
| Vigilancia | `packages/engine/volumes-ops/test/fusion-guard.test.mjs` (20 casos) |
| Suite volumes-ops | 174 → **194** (192 pass, 0 fail, 2 skip de Windows) |
| Rojos que la base NO pasa | **10 de 20** (medido restaurando `src/` a HEAD y corriendo el mismo fichero) |

---

## 1 · El diagnóstico del enunciado se reprodujo antes de tocar nada, y era CIERTO

`plan/BACKLOG.md:229` señalaba `driver-lineas.mjs` por carecer de la guarda de
ancestro bloqueante que FIREHOSE sí tiene. Lo primero fue medirlo, con el camino
del producto (`importPack`) y sin tocar una línea:

```
### A · LINEAS · ancestro bloqueante (fichero donde el pack trae directorio)
  salida: **LANZA** EEXIST (mkdir) — el contrato promete {ok:false,step,error}
  destino tocado: 1 rutas ["DISK_02/LINEAS/demo/nodos/N02/meta.json"]
  manifiesto re-sellado: false
  staging residual: []
```

**Estado del destino antes y después**, byte a byte (sha256 por ruta):

| | antes | después |
|---|---|---|
| ficheros del volumen | 6 | **7** |
| altas | — | `demo/nodos/N02/meta.json` |
| bajas / cambiados | — | 0 / 0 |
| manifiesto (`volumes.json`) | sellado en `pack-lineas` | **idéntico — no se re-selló** |
| asiento en `.ops-ledger.jsonl` | — | **ninguno** |

Es decir: el volumen crece un fichero que **el sello no conoce**, `importPack`
**lanza una excepción** en vez de devolver `{ok:false, step, error}`, y no queda
rastro de que haya pasado nada. Exactamente «la biblioteca a medio escribir».

**Dos citas de la ficha, corregidas** (se abrieron los ficheros antes de darlas
por buenas). Sobre la base `c1f71b7`:
- `driver-lineas.mjs:152-193` — el rango **contiene** el sitio del defecto
  (`:193` es literalmente `const destExists = existsSync(destAbs);`, la decisión
  que no distingue fichero de directorio) pero **no es** el `merge`: éste va de
  `:180` a `:222`. El rango arranca dentro del `validate` anterior.
- `driver-firehose.mjs:367-375` — ahí no está `blockingAncestor`: `:367` es un
  `try {` de `keyOfFile`. La función vive en **`:380-389`**, con su jsdoc en
  `:375-379`.
La ficha apuntaba al sitio correcto con la aritmética desplazada; se anota porque
el carril cobra por citar `fichero:línea` sin abrir el fichero.

Vector, con nombres: el destino tiene un FICHERO en
`demo/wp/historia/registros/r0002-oldid-3` (registro plano heredado / resto de
una operación manual) y el pack nuevo trae ese registro como DIRECTORIO
(`…/r0002-oldid-3/registro.md`). Como el fichero del pack no existe en el
destino, `merge` lo mete en `moves` como «lo que falta», y el `mkdirSync` de la
fase de aplicación lanza `EEXIST` **con el nodo `N02` ya renombrado**, porque
`demo/nodos/…` ordena antes que `demo/wp/…`.

---

## 2 · El inventario · qué MÁS puede reventar la fase de aplicación

El enunciado pedía buscar los hermanos **por operación, no por nombre**. Se montó
un probe que ejerce cada vector por el camino del producto y mide el destino
antes y después. **Siete vectores** rompían las dos frases del contrato; **cinco
de los siete dejaban el volumen a medias**:

| # | vector | lanzaba | destino tras el fallo | ¿algún driver podía verlo? |
|---|---|---|---|---|
| A | **LINEAS** · fichero del destino donde el pack trae un directorio | `EEXIST` (mkdir) | **1 fichero aterrizado** | sí (el suyo) |
| B | **LINEAS** · directorio del destino donde el pack trae un fichero | `EISDIR` (read) | intacto — revienta en el dry | sí |
| C | **FORCES** · fichero del destino donde el pack trae un directorio | `ENOTDIR` (mkdir) | **2 ficheros aterrizados** | sí |
| D | **FORCES** · fichero del destino EN la ruta de una unidad declarada | `ENOTDIR` (scandir) | intacto — revienta en el dry | sí |
| E | **genérico** · slot de volumen que existe como directorio VACÍO | `EPERM` (rename) | **1 fichero aterrizado** | **no** — sin familia no hay driver |
| F | **genérico** · corpus nuevo con ancestro FICHERO | `EEXIST` (mkdir) | **1 fichero aterrizado** | **no** — el corpus no pasa por driver |
| G | **dos volúmenes ANIDADOS** en el mismo pack | `ENOENT` (rename) | **2 ficheros aterrizados** | **no** — ocurre en el bucle por volumen |

Los siete se midieron sobre la base con el mismo probe. Las tres últimas filas
son las que deciden dónde va la guarda: **tres de los siete vectores no los puede
ver ningún driver**. G es, literalmente, la deuda que `driver-firehose.mjs`
declaraba por escrito como «fuera del alcance de cualquier driver … deuda de
U201»; se cierra en este WP.

### 2.1 · Lo que el enunciado listaba, punto por punto

| lo que puede lanzar | qué hace hoy | ¿cubierto? |
|---|---|---|
| **fichero donde el pack trae un directorio** (A, C, F) | `EEXIST` si el fichero ocupa la ruta que `mkdirSync` crea; `ENOTDIR` si queda por encima — los dos códigos medidos | **sí**, `ruta_bloqueada_por_fichero`, cero renombrados |
| **directorio donde el pack trae un fichero** (B, D) | `EISDIR`/`ENOTDIR` en el pase dry | **sí**, `destino_no_es_fichero` / `unidad_bloqueada_por_fichero` |
| **dos unidades que colisionan en la misma ruta** (G) | `ENOENT` con el subárbol ya movido | **sí**, `plan_con_destinos_anidados` / `plan_con_origenes_anidados` |
| **destino ocupado por un fichero** | `renameSync` **PISA EN SILENCIO** (medido: `rename f1→f2` deja el contenido de `f1` en `f2`, sin excepción) — pérdida de dato sin traza | **sí**, `sobrescritura_imposible`, con la ÚNICA excepción declarada del carril (§4) |
| **un enlace** en la ruta del destino | LINEAS/FORCES lo leían a través (`sha256File` sigue el enlace); el rechazo llegaba en el paso 7 NO-LINK, **después de SELLAR** | **sí**, `enlace_en_destino` en el pase dry (con probe, ver §6) |
| **ruta demasiado larga en Windows** | no reproducido | **por construcción, no por medida**: `from = join(volumesRoot, '.import-staging-…', rel)` y `to = join(volumesRoot, rel)` — el origen es SIEMPRE más largo que el destino en la longitud del segmento de staging, así que si el paso 2 (STAGING) pudo escribirlo, la ruta de destino cabe. Es un argumento de construcción leído del código, **no una medida**; queda declarado en §7 |
| **permisos denegados** | dejaba el volumen a medias | **no se previene** (no se puede saber antes de intentarlo): se DESHACE, §5 |
| **fichero abierto por otro proceso** | ídem | **medido que el caso fácil NO ocurre**: en Windows, `renameSync` sobre un fichero que otro handle de Node tiene abierto **funciona** (Node abre con `FILE_SHARE_DELETE`). Un proceso que no comparta el borrado sí lo bloquearía; ése cae en el deshacer, §5 |
| **EXDEV / dos unidades de disco** | ídem | **no se previene**: el staging vive dentro del root (mismo dispositivo) salvo que el root contenga un punto de montaje. Cae en el deshacer, §5 |

### 2.2 · Un vector que YA estaba cubierto por otra guarda (comprobado, no supuesto)

Colisión por MAYÚSCULAS en un sistema de ficheros insensible: un pack producido
en Linux con `a.txt` y `A.txt` colapsaría en el destino de Windows. **No llega a
la fusión**: el paso 2 (STAGING) copia los dos sobre el mismo fichero y el
re-hash del paso 3 (VALIDAR) devuelve `staging_corrupto`. No se toca nada por
este vector.

---

## 3 · La vía · dónde vive la guarda, y por qué no en cuatro sitios

Copiar `blockingAncestor` a LINEAS y a FORCES habría cerrado **2 de los 7**
vectores. La guarda estructural vive por tanto **donde vive la operación**: sobre
la lista ENTERA de renombrados, justo antes del primero, en
`src/fusion-guard.mjs`.

**Las guardas de driver no se retiran: se completan.** Son anteriores, dan el
diagnóstico de la FAMILIA (`unidad_bloqueada_por_fichero` dice *qué unidad*), y
retirar una para «no duplicar» sería debilitar una guarda existente — prohibido
por el encargo y por el buen sentido.

Tres capas, en este orden:

1. **el pase dry, envuelto** — una lectura del destino que lance ya no se escapa
   como excepción: se devuelve `plan_no_calculable` con la causa entera (código,
   syscall, ruta, mensaje). Aquí no se ha movido nada, así que el destino está
   intacto por construcción. B y D los cierran además los drivers con su código
   propio; esto es la red de lo que quede.
2. **`inspectFusionPlan(moves, volumesRoot)`** — todo lo comprobable sin tocar el
   disco. Aborta con nombre y **cero renombrados**.
3. **`applyFusion(moves, slotsVacios)`** — la red de lo que no se puede prever.
   §5.

`blockingAncestor` se muda **VERBATIM** desde `driver-firehose.mjs` a
`fusion-guard.mjs` y los **cuatro** drivers lo importan. Es la decisión de U259
con `hashUnitTree`, por el mismo motivo: dos copias de una guarda divergen a la
primera decisión, y aquí la divergencia se manifiesta como «el volumen quedó a
medias». Los cuerpos de FIREHOSE y SSB eran **idénticos carácter a carácter**
antes de mudarlos (comprobado leyendo los dos). Hay un probe que falla si algún
driver vuelve a declarar la suya.

### 3.1 · Coste: la guarda del plan es O(n · profundidad), no O(n²)

Un plan de familia trae **un movimiento por fichero**, así que comparar por pares
no era opción. El solapamiento se resuelve con un mapa de rutas resueltas y un
ascenso por ancestros acotado por el root.

---

## 4 · Las dos decisiones que podían «cerrar de más» (y no lo hacen)

El encargo avisaba: *si tu guarda hiciera que un import legítimo dejara de
aterrizar, has cambiado un fallo por otro*. Dos sitios lo rozaban.

### 4.1 · `registry.json` de FORCES es la ÚNICA sobrescritura deliberada del carril

FORCES **reemplaza** el índice del destino cuando difiere (con dos guardas
previas: superconjunto y cero colisiones de unidad), y lo hacía apoyándose en que
`renameSync` pisa en silencio. Una guarda «el destino no puede existir» habría
**roto el crecimiento incremental de FORCES**, que es un import legítimo con test
propio desde U203.

Se cierra declarándolo en vez de prohibiéndolo: el plan devuelve
`overwrites: ['registry.json']` cuando reemplaza, `import.mjs` lo traslada al
movimiento (`sobrescribe: true`), y `inspectFusionPlan` tolera un destino ocupado
**sólo** si (a) el driver lo declaró y (b) las dos puntas son ficheros. Un destino
que sea directorio o enlace sigue abortando aunque venga declarado.

Efecto lateral bueno: la sobrescritura deja de ser un efecto del sistema de
ficheros y pasa a ser **una línea del plan** que se puede leer, contar y deshacer.
Tres pruebas la fijan (el verde de crecimiento, el cable driver↔guarda, y las
tres caras de `inspectFusionPlan`).

### 4.2 · Un slot que existe VACÍO no es un slot ocupado

El vector E era, de hecho, **una divergencia de plataforma latente**: `rename(dir
→ directorio vacío)` es legal en POSIX y da `EPERM` en Windows (medido). El
contrato ya decía que un directorio SIN ficheros no es `slot_ocupado`
(`walkTree(volDestAbs).files.length > 0`), así que rechazarlo habría sido
inventar una prohibición nueva y romper en Linux algo que hoy funciona. Lo que se
hace es vaciar el slot (`rmdirSync`, sólo si está vacío) antes del renombrado:
las dos plataformas hacen ahora lo que el contrato ya decía.

**No se ensancha nada**: hay un rojo que comprueba que un slot con UN SOLO
fichero sigue siendo `slot_ocupado`.

### 4.3 · La conducta propia de LINEAS no se toca

Hay un verde que lo mide sobre un import legítimo: divergencia **reportada** con
`destSha256`/`packSha256` y el fichero del destino **byte a byte intacto**;
`.md` curado presente **descartado del merge** y byte a byte intacto; y el nodo
nuevo del mismo pack **aterrizando**. Lo único que cambia es que un destino cuya
FORMA impide aplicar esa regla —no se puede hashear un directorio, no se puede
«conservar» un enlace como si fuera el fichero curado— aborta con nombre en vez
de reventar. Consecuencia declarada: un `.md` que en el destino sea un
DIRECTORIO ya no se reporta como `curacion_protegida`; eso no es curación, es una
obstrucción, y el lector real de la familia (`loader.mjs readRegistro`) sólo lee
ficheros markdown.

---

## 5 · El deshacer, y lo que vale su inventario

*«Un rollback vale lo que valga su inventario».* Éste es el suyo, escrito también
en el código (`deshacerFusion`).

**Deshace**, en orden inverso:
- cada `rename(from → to)` aplicado, devolviéndolo a su ruta de staging;
- el fichero que un **reemplazo declarado** hubiera pisado: `applyFusion` lo
  APARTA al staging (`<from>.u255-reemplazado`) antes de renombrar, en vez de
  dejar que `renameSync` lo borre. Sin eso el deshacer sería una promesa a
  medias: el reemplazo quedaría «deshecho» con el destino SIN lo que tenía;
- el `rmdir` del slot vacío que la aplicación hubiera hecho;
- los directorios que la fusión creó, **sólo si quedan vacíos** — `rmdirSync`
  sobre árbol vacío, **jamás `rm -r`**: lo que haya dentro no lo puso el import.

**No deshace, y por eso se enumera**:
- lo que la propia vuelta no consiga mover sale en `sinDeshacer`, ruta a ruta,
  con su causa entera. Hay un probe que lo fuerza y comprueba que el fichero se
  queda en el destino **y que el inventario lo dice**;
- `mtime` y atributos: `rename` conserva el inodo, así que el CONTENIDO vuelve
  byte a byte, pero la marca de tiempo del directorio destino ya cambió;
- **nada posterior a SELLAR**: `applyFusion` corre antes del sellado por
  construcción. Un fallo después del sello no se deshace (los datos ya son la
  verdad y deshacerlos dejaría el manifiesto mintiendo).

El vector real de esta clase (permiso, bloqueo de otro proceso, EXDEV) **no es
reproducible en una suite portable**, así que el fallo se **inyecta** (un
movimiento cuyo origen no existe) y lo que se mide es el deshacer, que es lo
mismo pase lo que pase antes: `renombradosHechos: 2`, `renombradosDeshechos: 2`,
`sinDeshacer: []`, retrato del destino **deepEqual** al de antes, y los
directorios creados retirados.

---

## 6 · La prueba · 20 casos, 10 que la base NO pasa

`packages/engine/volumes-ops/test/fusion-guard.test.mjs`. Cada rojo mide el
destino **byte a byte antes y después** (sha256 por ruta) y afirma **tres cosas
juntas**, porque cualquiera de las tres sola es más estrecha que el contrato:
(1) `{ok:false, step:'fusionar', error:<código>}`; (2) mismo conjunto de rutas y
mismo sha256 en cada una — **cero renombrados**, no «pocos»; (3) manifiesto sin
re-sellar y staging borrado.

**No vacuidad, medida**: restaurando `src/import.mjs` y los cuatro
`driver-*.mjs` a `HEAD` y corriendo el MISMO fichero de test:

```
# tests 20   # pass 10   # fail 10
not ok  1 - LINEAS ROJO: fichero del destino donde el pack trae un directorio   → EEXIST (mkdir)
not ok  4 - LINEAS ROJO: directorio donde el pack trae un fichero               → EISDIR (read)
not ok  5 - LINEAS ROJO: un ENLACE en la ruta del destino                       → EISDIR (read)
not ok  6 - FORCES ROJO: el mismo hueco que LINEAS                              → ENOTDIR (mkdir)
not ok  8 - FORCES: `overwrites` declara el reemplazo del índice                → ERR_ASSERTION
not ok  9 - FORCES ROJO: fichero en la ruta de una unidad declarada             → ENOTDIR (scandir)
not ok 10 - genérico ROJO: corpus nuevo con ancestro FICHERO                    → EEXIST (mkdir)
not ok 11 - genérico ROJO: dos volúmenes ANIDADOS (deuda U201)                  → ENOENT (rename)
not ok 12 - genérico VERDE: slot de volumen que existe VACÍO aterriza           → EPERM (rename)
not ok 18 - `blockingAncestor` es UN cuerpo y los cuatro drivers lo usan        → ERR_ASSERTION
```

Los 10 que SÍ pasan sobre la base son los que deben pasar: los **contra-verdes**
de no vacuidad (el mismo pack, sin la obstrucción, aterriza), el verde de la
conducta propia de LINEAS, el `slot_ocupado` que no se ensancha, y los cuatro
probes de unidad de `fusion-guard.mjs` (pieza nueva, no rastreada por HEAD).

**Sobre el caso 12**: su rojo en la base es de Windows. En POSIX ese import ya
aterrizaba, así que allí el caso es un verde que no cambia — está dicho aquí
porque un verde que sólo prueba algo en una plataforma no es lo mismo que uno
que prueba en las dos.

### Números de suite

| suite | antes | después |
|---|---|---|
| **@zeus/volumes-ops** | 174 (172 pass · 0 fail · 2 skip) | **194 (192 pass · 0 fail · 2 skip)** |
| @zeus/linea-kit | 43/43 | 43/43 |
| @zeus/presets-sdk | 55/55 | 55/55 |
| @zeus/feed-kit | 10/10 | 10/10 |
| @zeus/firehose-core | 12/12 | 12/12 |
| @zeus/ssb-system | 27/27 | 27/27 |
| @zeus/force-system | 2/2 | **2/2** (con `ZEUS_VOLUMES_ROOT`; ver §7) |
| @zeus/linea-system | 3 (1 pass · 2 skip) | 3 (1 pass · 2 skip) |
| `npm run lint` | 0 errores / 18 warnings | **0 errores / 18 warnings** |
| `npm run gates` | OK | **OK (0 offenders)** |
| `npm run test:gates` | — | **69/69** |
| `e2e/local-first-ca.mjs` | — | **7/7 pasos verdes · 14 vectores rojos** |

---

## 7 · Los bytes que entrega git, no los del disco

El carril ya pagó un CI entero en rojo por finales de línea (U258 §6.2), así que
se midió antes de commitear. Este repo corre con `core.autocrlf=true`: los
ficheros rastreados llegan en **CRLF al árbol de trabajo** y se guardan en **LF
en el blob**; los ficheros que este WP crea se escribieron en LF.

Medida sobre los CINCO ficheros ya rastreados que este WP edita, **antes** de
materializar nada (`wc -c` del disco menos `git cat-file blob $(git rev-parse
:<ruta>) | wc -c`):

```
fichero                        disco-blob   líneas   veredicto
driver-firehose.mjs                   796      796   CRLF puro en disco / LF en blob
driver-forces.mjs                     381      381   CRLF puro en disco / LF en blob
driver-lineas.mjs                     384      384   CRLF puro en disco / LF en blob
driver-ssb.mjs                       1126     1126   CRLF puro en disco / LF en blob
index.mjs                              93       93   CRLF puro en disco / LF en blob
```

La diferencia es **EXACTAMENTE** el número de líneas de cada fichero: cada línea
lleva su CR y ni una sobra. Eso es lo que descarta el defecto real de este
carril — **líneas mixtas**, que es lo que una herramienta de edición introduce al
insertar texto LF en un fichero CRLF, y que el blob arrastraría.

Y para no medir sobre el disco: se materializaron **los blobs del índice** sobre
el árbol de trabajo (`git cat-file blob $(git rev-parse :<ruta>) > <ruta>`, los
10 ficheros del commit) y se corrió la suite entera contra esos bytes —
**194 tests, 192 pass, 0 fail, 2 skip**. `git diff --numstat` posterior: vacío,
y `disco-blob = 0` en los 10 (el árbol de trabajo ES ahora el blob).

**Higiene**: `npm ci` deja `git status` marcando tres `bin/` (`feed-kit`,
`linea-kit`, `playbook-kit`); `git diff --numstat` sobre ellos es **vacío**
(cambio de modo, no de contenido) y se restauraron antes de empezar. **Ninguna
suite ensucia ficheros rastreados**: comprobado tras cada corrida.

**`@zeus/force-system` sin `ZEUS_VOLUMES_ROOT` da 1 fallo, y no es mío**: su
`test/smoke.mjs:37-47` lleva su PROPIO resolvedor de root, que busca
`../../../../VOLUMES` desde el paquete —una ruta que cae FUERA del repo— y no
mira el `VOLUMES/` del monorepo. Sin la variable de entorno el test no arranca,
y el fallo es `resolveVolumesRoot()` devolviendo `null` antes de tocar nada de
volumes-ops. Con `ZEUS_VOLUMES_ROOT` apuntando al `VOLUMES/` del worktree:
**2/2**. Lo mismo con `e2e/local-first-ca.mjs`, que exige el mundo hermano
`Z_SDK-games-library` (`ZEUS_GAMES_LIBRARY`): con él, 7/7.

---

## 8 · Lo que este WP NO cubre (frontera declarada)

1. **Permisos, bloqueos de otro proceso, EXDEV y carreras contra el operador no
   se PREVIENEN.** No se puede saber si un `rename` va a fallar sin intentarlo.
   Lo que se garantiza en esa clase es más débil y está escrito: **cero
   renombrados NETOS** (se deshacen) más el inventario de lo que no se pudo
   deshacer. Si `sinDeshacer` sale no vacío, el volumen SÍ quedó a medias y el
   error lo dice ruta a ruta — es lo máximo que se puede prometer sin un diario
   de intenciones en disco, que es otro WP con otro precio.
2. **La ruta larga de Windows es un argumento de construcción, no una medida.**
   El origen de cada movimiento es más largo que su destino en la longitud del
   segmento de staging, así que si STAGING escribió, la fusión cabe. No se ha
   plantado un pack de >260 caracteres para verlo.
3. **`sobrescritura_imposible` es inalcanzable por orden en LINEAS y en FORCES**
   (los dos sólo planifican rutas que no existen) y se conserva como última
   línea, igual que SSB conserva la suya. Quien sí lo alcanza es la guarda del
   plan entero, por las vías de §2 — y ahí tiene tres pruebas.
4. **El paso 7 (NO-LINK) sigue corriendo DESPUÉS de SELLAR.** Este WP adelanta
   el rechazo de enlaces del DESTINO al pase dry en las cuatro familias, pero no
   toca el paso 7 ni promete que un enlace aparecido entre la fusión y el sello
   se cace antes. Retirar el paso 7 habría sido debilitar una guarda existente.
5. **El contrato (`plan/CONTRATO-IMPORT-PACK-v1.md`) no se ha editado.** Está
   fuera del ALCANCE_DIFF de este WP, y además no hacía falta: el texto ya decía
   lo correcto. Lo que faltaba era la obra.
6. **No afirmo CI verde**: la rama no se empuja. Lo medido es lo de §6.

### Enrutable P2

- `hashTree` (`import.mjs`) sigue siendo la misma fórmula que `hashUnitTree`
  (`unit-tree.mjs`) en dos copias preexistentes. U259 ya lo dejó enrutado y este
  WP **no lo empeora**: quita una copia de `blockingAncestor` (de dos a una) en
  vez de añadir una tercera.
- El diario de intenciones en disco que convertiría el punto 1 de §8 en garantía
  dura (escribir el plan antes de aplicarlo, para poder deshacerlo tras una caída
  del proceso, no sólo tras una excepción). Hoy un `kill -9` a mitad de la
  fusión sigue dejando el volumen a medias: **ninguna capa de este WP lo cubre**,
  y decirlo es parte del inventario.

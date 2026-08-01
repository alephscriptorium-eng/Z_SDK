# WP-U205 · Driver SSB (7.º eslabón del carril D)

Rama `wp/u205-driver-ssb`, base `87bd93f`. Todo lo que sigue lleva comando y salida, o
dice «no medido».

---

> **2.ª vuelta (devolución).** Los tres bloqueantes eran **la misma cosa vista
> tres veces**: al matar el borrado destructivo convertí el exportador en el
> SEGUNDO escritor de un volumen que también escribe `importPack`, y las dos
> mitades no se ponían de acuerdo sobre qué es una unidad válida. La respuesta
> está en **§A · Dónde vive la regla**, escrita antes de tocar código. Todo lo
> nuevo lleva marca «(2.ª vuelta)».

---

## A · DÓNDE VIVE LA REGLA (la decisión que faltaba)

**La regla es del VOLUMEN, no de un escritor.** Los dos escritores —el import
(driver) y el sync vivo (`export.mjs`)— la aplican **entera**. No pueden
compartir el código: ninguno de los dos paquetes puede declarar al otro con los
48 manifests congelados (owner U237), así que se **replica con nota de sitio** y
—esto es lo que faltaba— **la juntura tiene probe propio**: la sección JUNTURA de
`import-ssb-driver.test.mjs` exporta con el escritor REAL y luego importa el
resultado.

Se parte en dos niveles, con consecuencias distintas **a propósito**:

**Nivel 1 · ADMISIÓN DE LA UNIDAD** — los dos escritores aplican las cinco, y lo
que no las pasa **no entra en el volumen por ningún camino**:

| # | regla | driver (import) | export (sync vivo) |
|---|---|---|---|
| 1 | clave usable (`key` no vacía + `value` objeto) | `unidad_sin_clave` | `clave_ausente` / `value_ausente` |
| 2 | coordenada de feed (`author`+`sequence`) | `unidad_sin_coordenada_de_feed` · `destino_sin_coordenada_de_feed` | **`coordenada_de_feed_ausente`** (2.ª vuelta) |
| 3 | ruta canónica `<corpus>/messageFileName(key)` | `nombre_no_deriva_de_clave` · **`destino_fuera_de_layout`** (2.ª vuelta) | por construcción + **`layout_invalido_en_volumen`** (2.ª vuelta) |
| 4 | clave única con `value` coherente | `clave_duplicada_en_pack` · `clave_divergente` | `clave_duplicada_en_log` · `clave_divergente` |
| 5 | **posición `(author, sequence)` única** | `secuencia_duplicada_en_pack` · `reescritura_de_feed` · **`destino_con_feed_bifurcado`** (2.ª vuelta) | **`posicion_duplicada_en_log`** · **`posicion_ocupada`** (2.ª vuelta) |

**Nivel 2 · COHERENCIA DEL CONJUNTO** — la cadena `previous ⟺ sequence`. Es
propiedad del CONJUNTO, no de la unidad.
- **El import ABORTA** (`cadena_rota_en_pack`, `cadena_rota`): un pack es
  material curado que alguien preparó.
- **El export la MIDE y la DECLARA** (`feedIncoherencias`, y el conteo va al
  sidecar) pero **no tira dato**: un volcado de pub llega con lo que llega, y
  descartar gobernanza porque el productor numeró mal la cadena sería peor que
  aterrizarla. Medido: aplicar el nivel 2 en el export dejaría
  `fixtures/ssb-log.json` en **tribes 2 / parliament 0 / votes 0**.

**Asimetría declarada, con ejemplo medido**: `ssb-log.json` es **exportable** y
su pack **no es importable**. Es la única asimetría entre los dos escritores, es
deliberada, y está escrita en la cabecera de los dos ficheros.

---

## 0 · Resumen ejecutable

| suite | antes (87bd93f) | 1.ª vuelta | 2.ª vuelta |
|---|---|---|---|
| `@zeus/volumes-ops` | 56/56 | 89/89 | **97/97** (+41) |
| `@zeus/ssb-system` | 4/4 | 20/20 | **26/26** (+22) |
| `@zeus/feed-kit` | 10/10 | 10/10 | 10/10 |
| `@zeus/linea-kit` | — | 36/36 | 36/36 |
| `@zeus/firehose-core` | — | 12/12 | 12/12 |
| `@zeus/presets-sdk` | — | 55/55 | 55/55 |
| `npm run lint` | — | 0 errores | **0 errores · 0 warnings en ficheros de U205** |

Los 56/56 y 4/4 de «antes» son **medidos por mí**, no citados de BACKLOG:265
(comando en §7). Aviso de entorno: el worktree venía **sin `node_modules`**; hice
`npm ci` (nunca `npm install`, que tocaría el lockfile). `npm ci` reescribió los
tres shims de `bin/` (`feed-kit`, `linea-kit`, `playbook-kit`) con final de línea
distinto — `git diff --raw` sobre ellos sale **vacío**; los restauré con
`git checkout --`. No hay contrabando: `git status` final = exactamente mi
ALCANCE_DIFF.

---

## 1 · Qué hice

### 1.1 El driver — `packages/engine/volumes-ops/src/driver-ssb.mjs` (nuevo)

Cuatro claves `{family, detect, validate, merge}`, `Object.freeze`, sin método
`index` (el índice vive dentro de `merge`, como en los otros tres). Devuelve
**plan**, no toca disco.

- **Unidad** = el mensaje SSB aterrizado `{key, value, type, corpus}`.
- **Clave** = `key`, cadena **opaca**, verbatim, sin normalizar y sin derivar.
- **Segundo eje: el feed** — `value.author` + `value.sequence` + `value.previous`.

Reglas: clave nueva → aterriza · clave presente con el mismo `value` → dedup
(reportando dónde vive) · clave presente con `value` distinto → `clave_divergente`
aborta · `(author, sequence)` ya ocupada por otra clave → `reescritura_de_feed`
aborta · sidecar `manifest.json` de raíz: falta→aterriza, igual→no-op,
distinto→**divergencia reportada, jamás pisada** · claves y secuencias duplicadas
dentro del pack → abortan en VALIDAR. **No hay `colision_ruta`** y no es olvido:
la ruta la deriva la clave y `messageFileName` es inyectiva (2.ª vuelta, §4bis·B2).
Índice del destino sin agujeros (doctrina D-B/D-F de U204 heredada entera, y en
2.ª vuelta aplicada de verdad): `enlace_en_destino`, `destino_sin_clave`,
`destino_sin_coordenada_de_feed`, **`destino_fuera_de_layout`**,
**`destino_con_feed_bifurcado`**.

### 1.1bis Réplica declarada de la coordenada — `types.mjs` (2.ª vuelta)

`feedCoords()` en `ssb-system/src/types.mjs` es **réplica exacta** de
`ssbFeedCoords` del driver, con nota de sitio: las dos copias deben decir lo
mismo o el export aterriza material que el import rechaza, y la nota dice **dónde
está el probe que lo comprueba**.

### 1.2 El alta — `drivers.mjs`

Exactamente **un `import` y una entrada**, nada más (`git diff` en §7.0). Cero
refactor del registro.

### 1.3 Las dos demoliciones en `packages/mesh/ssb-system/src/export.mjs`

Ver §2 y §3.

### 1.4 El descarte reportado — `types.mjs` + `export.mjs`

`SKIP_REASONS` + `classifyContent()` (motivo por descarte). `corpusForContent()`
se conserva **con su contrato exacto** (corpus o `null`) porque `src/index.mjs:24`
lo reexporta e `index.mjs` está **fuera** de mi ALCANCE_DIFF.

### 1.5 El CLI honesto — `sync-cli.mjs`

`runSsbSync` envuelve la llamada y devuelve `{ok:false, error}` citando la ruta,
en el mismo estilo que ya usaba en `:50-59`. Antes devolvía `{ok:true,…}`
incondicional (`:76`) y un `throw` salía como excepción no capturada.

### 1.6 Fixture NUEVA — `fixtures/ssb-feed-log.json`

8 mensajes, 3 feeds, secuencias **por autor**, `previous` que no cruza de feed,
un `post` filtrado (agujero legítimo) y un DM cifrado. `ssb-log.json` **no se
tocó**: dos suites vivas lo anclan con conteos exactos.

### 1.7 El arnés siembra el manifiesto (m8, 2.ª vuelta)

Consecuencia necesaria del fallo cerrado de §3: las suites tienen que sembrar
`volumes.json` con la entrada `ssb` completa, porque el export ya no la crea.
Los dos sitios, dichos en prosa y no solo en el diff:
`packages/mesh/ssb-system/test/export.test.mjs` (`seedManifest()`) y
`packages/mesh/ssb-system/test/e2e-mcp.test.mjs` (siembra en línea, con la
entrada COMPLETA porque `resolveSsbBasePath` la resuelve desde el manifiesto).
Patrón heredado de `test-utils/src/smoke-env.mjs:52`, que hace lo mismo.

---

## 2 · Tensión 1 — exportador destructivo vs. unión aditiva. **Resuelta: deja de borrar**

El exportador borraba todos los `.json` de cada corpus antes de escribir
(`87bd93f:export.mjs:93-96`, «sync replaces snapshot»). Decisión: **el borrado
muere**; el export aplica **las cinco reglas de admisión del nivel 1** que aplica
el driver — clave, coordenada de feed, ruta canónica, unicidad de clave con
`value` coherente y **unicidad de posición** —, con la tabla de correspondencia
en §A. *(En la 1.ª vuelta esta frase decía «la MISMA regla de unión» y enumeraba
solo la de clave; eran los bloqueantes 1 y 3. Corregida y medida en §4bis.)*

Tres razones, no una preferencia:

1. Un feed SSB es una cadena append-only de mensajes inmutables: un
   snapshot-replace solo puede **borrar** material que ese volcado concreto no
   trajo. Pérdida de dato por diseño.
2. Sobre el mismo árbol, un `importPack` que aterrizó mensajes de forma aditiva
   quedaría arrasado por el siguiente `npm run sync`, y el sello
   (`source.imported.snapshot.units`) pasaría a **mentir en silencio**.
3. Precedente medido del carril: el productor FIREHOSE escribe en el volumen sin
   borrar (`feed-kit/src/jetstream-sync.mjs:145-159` `writeJetstreamPost`) y deja
   el manifiesto sellado (U204).

Efecto lateral bueno: el export pasa a ser **idempotente** — un re-sync del mismo
volcado no mueve ni un `mtime` (medido, §7.4).

**Precio, decidido y declarado (m2, 2.ª vuelta):** al dejar de borrar aparecen
**huérfanos** —material del volumen que un volcado posterior no trae— y
`totals.exported` deja de concordar con `corpora[].files`, que antes concordaban
*por construcción* porque el sync arrasaba el corpus. **El huérfano es semántica
querida**: un mensaje SSB es inmutable y un feed no se despublica, así que borrar
lo que este volcado no trajo sería pérdida de dato. Lo que sí era defecto es que
el sidecar —que §3 designa como la marca de sync de este volumen— callara la
diferencia: ahora `totals` lleva `volumeFiles`, `orphans` y `feedIncoherencias`.
Riesgo asociado en §9: **no hay vía de retirada por clave**.

---

## 3 · Tensión 2 — `export.mjs` inventaba el manifiesto. **Resuelta: matado, sin sustituto**

`upsertVolumesJsonEntry` (`87bd93f:export.mjs:173-208`) abría
`<root>/volumes.json`, lo **inventaba** si faltaba (`:176`) y lo reescribía entero
(`:207`), metiendo `source.syncedAt` **dentro** del manifiesto — un campo temporal
que movía el sello sha256 en cada sync. **Eliminado**, siguiendo el precedente de
U204 (matar el escritor legado, no reencaminarlo). En su lugar
`requireDeclaredSsbVolume()` **aborta** si el root no trae manifiesto, si no
declara `ssb`, si lo declara en otro `path`, con `pathOverride`, o con otro `disk`.

**Son dos manifiestos y solo uno muere** (corrección 2 del brief, respetada):

- `<root>/volumes.json` — sellado. **Ya no se escribe.**
- `DISK_04/SSB/manifest.json` — sidecar propio, schema real `ssb-manifest`,
  exigido por `loader.mjs:21-27`. **Se sigue escribiendo, intacto.**

**Desvío declarado respecto de FIREHOSE.** U204 mudó su marca de sync a
`volumes.state.json` vía `recordVolumeSync`. Aquí **no se puede**:
`packages/mesh/ssb-system/package.json:22-29` declara linea-kit, presets-sdk, MCP
sdk, cors, express y zod — **no** `@zeus/volumes-ops` — y los 48 manifests están
congelados (owner U237). Importarlo sería dep fantasma. Se deja caer la entrada
**sin sustituto en state**, y es honesto porque la marca ya sobrevive donde
corresponde: `syncedAt` es campo `required` del schema real `ssb-manifest`
(`linea-kit/schemas/ssb-manifest.json:7` y `:15`) y vive en el sidecar del
volumen. Cuando volumes-ops sea dependencia declarable, el exportador puede
llamar a `recordVolumeSync` como hace feed-kit.

---

## 4 · Las CA, una a una, con su evidencia

Todas las salidas son de `node --test`; los ficheros y comandos exactos están en §7.

### CA-1 · Append-only por feed — **PASA, con una desviación deliberada que declaro**

- Pack A `@a` seq 1..3 → 3 unidades; pack B `@a` seq 4..5 → **`moved:2`**, 5
  unidades, `snapshot.units=5`, `feeds=1`, byte a byte intacto lo anterior.
  → `ok 5 - CA-1: el feed se EXTIENDE …`
- **Rojo**: pack C con `@a` seq 3 de contenido distinto →
  `{error:{code:'reescritura_de_feed'}}` en el pase dry, `hashManifest()`
  **idéntico** antes y después, árbol idéntico, `SELLAR` no se alcanza.
  → `ok 6 - ROJO CA-1: la POSICIÓN de feed es inmutable …`
- El test fija que el volumen **declara o detecta** `family:'ssb'`
  (`res.steps.some(s => s.step==='familia' && s.families.ssb==='ssb')`).
- Retirada la coletilla de `.import-staging*` como asersión sobre U205 (es el
  `finally` de `import.mjs:584-587`); se conserva solo como higiene.

**DESVIACIÓN DELIBERADA — el segundo vector rojo del brief («`@a` seq 7») NO se
implementa, y la razón es medida, no de comodidad.** El exportador **filtra por
tipo**: solo aterriza `tribe*`/`parliament*`/`votes*`. Un feed que mezcle
gobernanza y charla aterriza **con agujeros por construcción**. Medido sobre la
fixture nueva: alice publica `tribe`(1), `post`(2), `tribe-open-invite`(3) y el
volumen recibe **`[1,3]`** (`ok 18 - fixture por-feed: … HUECO legítimo`). Exigir
contigüidad volvería **no importable todo export real**. Lo que sí es inviolable
—y sí se enforce— es la **posición**: `(author, sequence)` aterrizada jamás se
reescribe. Los agujeros no se callan: se cuentan en `snapshot.feedsConHueco`
(`ok 7 - DECISIÓN DECLARADA: un HUECO de secuencia NO es error`).

### CA-2 · Reimport no reordena — **PASA**

Mismo contenido, **otro `packHash`** (`assert.notEqual(res.packHash, first.packHash)`),
con `family:'ssb'` DECLARADA en el pack para no medir el camino genérico de U201:
`moved:0`, `dedup:2`, y el listado del volumen —rutas, **bytes y `mtimeMs`**—
`deepEqual` antes y después. → `ok 9`. Reimport del mismo pack = `noop:true` con
sello idéntico → `ok 8`. Vector «forzar un move sobre ruta existente» **borrado**
del alcance (con `renameSync` desnudo en `import.mjs:459-461` produce
sobrescritura silenciosa, no error): esa guarda vive en el driver y es CA-3.

### CA-3 · Dedup cross-corpus — **PASA (la central)**

K plantada en `parliament` del destino, traída en el pack bajo `tribes`:
`dedup:[{path:'tribes/…', key:'%K=.sha256', at:'parliament/…'}]`, `moved:1` (solo
el mensaje nuevo), destino **byte a byte** intacto, **cero copia** en `tribes`, y
se asevera el **conteo**: `volumeFiles(root).length === 2` y
`snapshot.units === 2`. → `ok 10`.
Diseño verificado: el índice cubre **todo el volumen** porque el lector resuelve
cross-corpus devolviendo el primer acierto en orden `SSB_CORPORA`
(`loader.mjs:133-139`).
Rojo añadido: misma clave con `value` distinto → `clave_divergente`. Y en 2.ª
vuelta, el rojo que faltaba: un destino MAL NOMBRADO ya no deduplica, aborta
(§4bis·B2).

### CA-4 · El manifiesto no se inventa — **PASA, y discrimina**

- Root sin `volumes.json` → `throw` con `/volumes\.json not found at .* not
  operable/`, y `fs.readdirSync(root)` queda **`[]`**: ni manifiesto inventado ni
  árbol a medias. → `ok 6`.
- Manifiesto sin la entrada `ssb` → aborta, bytes del manifiesto intactos → `ok 7`.
- Entrada declarada en otro `path`/`pathOverride`/`disk` → aborta → `ok 8`.
- **Contraste**: la réplica **verbatim** de `upsertVolumesJsonEntry` (obtenida con
  `git show 87bd93f:…`) **sí crea** el manifiesto sobre un root vacío → `ok 9`.
  Sin este contraste la CA no probaría que discrimina.
- **Punta de CLI** (que ninguna CA cubría): `runSsbSync` devuelve
  `{ok:false, error}` citando root y log, y con el manifiesto sembrado el mismo
  CLI pasa (`counts.tribes===2`): la CA no es «siempre roja». → `ok 10`.

### CA-5 · Único escritor del manifiesto — **PASA, con probe endurecido en dos capas**

**(a) Por ruta DERIVADA (dinámico).** Instrumento las seis primitivas de escritura
de `node:fs` durante un `exportSsbLogFile` completo y registro la **ruta
resuelta** de cada llamada. Resultado: `destinos.length > 0` (control: el export
sí escribe) y **cero** destinos `=== path.resolve(<root>/volumes.json)`; además
los bytes del manifiesto son `deepEqual` antes/después. Esto mide *lo que el
código hace*, no lo que su texto parece. → `ok 11`.

**(b) Prueba de que el probe heredado era CIEGO.** Sobre el fragmento **verbatim**
del escritor legado (`87bd93f:export.mjs:174` + `:207`):
`/sealManifest|writeFileSync.*volumes\.json/` (el probe literal de BACKLOG:262)
devuelve **`false`**; el predicado endurecido devuelve **`true`**. → `ok 12`.
Corroborado también desde shell contra el árbol base: el grep heredado da 8 hits y
**export.mjs no aparece**; el endurecido da 5 ficheros y **sí lo incluye** (§7.5).

**(c) Estático, repo entero, con ALLOWLIST razonada una a una.** Co-ocurrencia por
**fichero** (primitiva de escritura + token `'volumes.json'`/`MANIFEST_FILE_NAME`),
sobre `packages/ scripts/ e2e/`, sin `node_modules` ni directorios de test/fixtures.
Es una **sobre-aproximación conservadora deliberada** (no es dataflow): prefiere
falsos positivos a ceguera. Los 5 marcados y su descargo:

| fichero | por qué está permitido |
|---|---|
| `packages/engine/volumes-ops/src/manifest.mjs` | `sealManifest` — **el** escritor legítimo (U199/U201) |
| `packages/editor/editor-ui/src/world/materialize-pack.mjs` | escribe `<packRoot>/volumes/volumes.json` (`:86-90`): manifiesto **del pack**, fuente de import, nunca un root vivo |
| `packages/engine/test-utils/src/smoke-env.mjs` | siembra un root **temporal** de arnés (`:52`) |
| `packages/engine/feed-kit/src/jetstream-sync.mjs` | **falso positivo**: el token solo aparece en prosa (`:11`, `:21`, `:164`, `:184` — la nota de demolición de U204); sus escrituras van a `<corpus>/<batch>/<rkey>.json` |
| `packages/mesh/ssb-system/src/export.mjs` | lo nombra **solo para negarse a operar sin él**; descargado por el probe dinámico (a), que mide la ruta resuelta |

→ `ok 13`.

**Afirmación honesta y acotada**: *cero escritores del manifiesto de un root VIVO
fuera de `manifest.mjs`, con esas cuatro excepciones nombradas y razonadas.* No
afirmo «cero escritores no declarados» a secas.

### CA-6 · Sin claves, declarado — **PASA, partida en dos mitades ciertas**

**(a) DM cifrados, descarte REPORTADO** (el vector honesto que pedía el brief; no
toco `types.mjs:41`, que efectivamente no pondría nada en rojo). El descarte
silencioso pasa a llevar motivo: un `content` string tipo `"…box"` da
`contenido_cifrado`, un `{type:'post'}` da `tipo_no_exportable`, `null` da
`contenido_ausente`, `{}` da `tipo_ausente`. El árbol aterrizado tiene **conteo 0**
para ese material y `totals.exported === 0`. El motivo **discrimina**: un test que
solo mirase `skipped>0` pasaría con cualquiera de los dos. → `ok 3`.

**(b) Grep de secretos = 0** sobre `src/` + `fixtures/` del paquete, con seis
patrones declarados (armadura PEM, `privateKey`, `secretKey`, `mnemonic`,
`passphrase`, `curve:'ed25519'`). → `ok 4`.

**(b') LÍMITE MEDIDO, no prometido.** Retiro la promesa sobre material de identidad
dentro de `value` y en su lugar la **mido**: un mensaje cuyo `value` lleva un
marcador de clave privada **aterriza verbatim**. `export` es passthrough de `value`
y la única denylist del carril (`import.mjs:47`, usada en `:173-178`) filtra por
**basename** de fichero, jamás por contenido. Cerrarlo es un WP, no una nota. → `ok 5`.

### CA-7 · Detect disjunto — **PASA; digo qué mitad mide a U205 y cuál no**

- **La mitad con vector real**: un volumen FIREHOSE válido **no** es detectado como
  `ssb` (`FIREHOSE_DRIVER.detect === true` como control, `SSB_DRIVER.detect ===
  false`), y además la disjunción a nivel de **contenido**: `ssbMessageKey(post)
  === null`. → `ok 14`.
- **La mitad que NO mide a U205**: un volumen SSB válido no es firehose. Pasa hoy,
  cerrada por construcción — está etiquetada así en el nombre del propio test:
  `ok 15 - CA-7 (mide U202/U203/U204, no U205) …`. Se conserva como fijación.
- **Vector correcto, no el del brief**: se invocan `SSB_DRIVER.detect` y
  `FIREHOSE_DRIVER.detect` **cruzados**, sin pasar por el registro. `FAMILY_DRIVERS`
  es `Object.freeze` (`drivers.mjs:19-24`) y reordenarlo exigiría editar el
  registro, que el territorio limita a un alta.
- **Añadido tras mutación** (§5): detect mira el **contenido**, no la ruta — un
  árbol con la forma exacta de SSB (`tribes/u1.json`) y un post de firehose dentro
  da `false`. → `ok 17`.

### CA-8 · Clave duplicada dentro del pack — **PASA (nueva, obligatoria)**

Dos ficheros del pack con la misma clave (mismo nombre derivado, corpus distinto,
`value` distinto) → `familia_invalida` / `clave_duplicada_en_pack: %dup=.sha256
aparece en … y en …`, citando **ambas** rutas, en VALIDAR (antes del pase dry);
root intacto, ni el mensaje sano aterriza. → `ok 12`.
Dos hermanas: `(author,sequence)` repetida → `secuencia_duplicada_en_pack`
(`ok 13`); nombre que no deriva de la clave → `nombre_no_deriva_de_clave`
(`ok 16`), porque ese material sería **inalcanzable** para `loadSsbMessage`.

---

## 4bis · LOS TRES BLOQUEANTES (2.ª vuelta)

### B1 · La posición no era inviolable — mi propio exportador creaba bifurcaciones

Acusación exacta y **reproducida**. Dos mitades del mismo defecto:

- **`export.mjs` deduplicaba SOLO por clave.** Dos claves distintas en
  `(@alice, 1)` → `ok:true, added:2`. Arreglado: `partitionExportable` lleva
  `seenPosition` y `duplicatePositions`; el pase dry lleva `landed.byPosition`.
  Abortan `posicion_duplicada_en_log` y `posicion_ocupada` **antes de escribir un
  byte**. El segundo error cita literalmente «es lo que el import llama
  `reescritura_de_feed`», para que las dos mitades se lean juntas.
- **`indexVolume` pisaba la posición en el Map.** `feed.set(sequence, key)` sin
  mirar: último en escribir gana, en silencio. Con eso, `reescritura_de_feed`
  —la garantía central de la familia— **se medía contra un índice que ya
  mentía**. Arreglado: colisión detectada → `destino_con_feed_bifurcado`, aborto
  en el pase dry citando ambas claves y ambos ficheros.
- **El cursor tampoco lo veía**: `feedsSha256` codificaba solo `<author>:<max>`.
  Ahora codifica `<author>:<min>:<max>:<count>` y hay test que lo mide (dos
  volúmenes con el MISMO máximo y distinto relleno → cursores distintos). Es el
  artefacto del que cuelga el 8.º eslabón.

Mi §2 decía «el export aplica la MISMA regla de unión que el driver» enumerando
solo la de clave. **Reescrita**: ahora es la tabla de §A, con las cinco.

### B2 · Un `dedup` que miente — y mi §9.7 era falso

Acusación exacta y **reproducida**. VALIDAR rechazaba `nombre_no_deriva_de_clave`
en el PACK «porque ese material sería inalcanzable para el lector», y `indexVolume`
**no aplicaba ese mismo test al DESTINO**: un fichero mal nombrado se indexaba
como unidad de primera clase, el pack traía el nombre bueno, deduplicaba contra
él y el nombre bueno **no aterrizaba nunca**.

Arreglado (D-G): el índice del destino aplica **la misma prueba de admisión** que
VALIDAR aplica al pack. Lo que no vive en su ruta canónica no se indexa y
`merge` **aborta** con `destino_fuera_de_layout`, citando la ruta **y la ruta
esperada**. Alcanza los tres casos —nombre malo, raíz, profundidad 3— con un solo
código.

Y **`snapshot.destFueraDeLayout` desaparece**: contar el material inalcanzable
era la vía débil y el campo era la coartada. Exactamente la lección de D-F de
U204 con `destSinClave`, que yo había citado en cabecera y no había aplicado.
Con esto **§9.7 pasa a ser cierta**: sí queda no importable, sí se cita la ruta.
El test que aseveraba el comportamiento anterior (`…deduplica, cuenta y se
DECLARA`) está **reescrito**, no borrado.

**Consecuencia colateral que declaro** (no es regresión, es la protección
adelantada): con el índice arreglado, `colision_ruta` pasa a ser **imposible por
construcción** —la ruta la deriva la clave y `messageFileName` es inyectiva— y lo
**he eliminado**, con el porqué en cabecera. Y `ruta_bloqueada_por_fichero` pasa a
ser **inalcanzable por orden**: el único ancestro posible de `<corpus>/<fichero>`
es la entrada de raíz `<corpus>`, y un fichero de raíz ya aborta antes por
`destino_sin_clave` o `destino_fuera_de_layout`. **Aviso al revisor: su mutación
ya no cae, y no es un descuido** — está declarado en cabecera como última línea
por si el orden cambiara, igual que `unidad_sin_clave` dentro de `merge`.

### B3 · Mi exportador producía volúmenes que mi driver declara no importables

Acusación exacta y **reproducida**. `classifyMessageDetailed` no exigía
coordenada de feed; `ssbFeedCoords` sí; y `merge` abortaba **el volumen entero**
con `destino_sin_coordenada_de_feed`. Un sync dejaba el volumen inimportable y
nadie se enteraba.

Arreglado: la coordenada es **nivel 1** y el export descarta con motivo
`coordenada_de_feed_ausente`. `feedCoords` vive en `types.mjs` como **réplica
declarada** de `ssbFeedCoords`, con la nota de sitio diciendo que las dos copias
deben decir lo mismo y **dónde está el probe que lo comprueba**.

### La juntura, ahora medida (y no solo arreglada)

Dos pruebas nuevas cruzan la frontera de verdad, importando el exportador REAL:

- **`JUNTURA: todo volumen que produce el export es importable por el driver`** —
  exporta un log con `post` filtrado y DM cifrado, empaqueta el árbol aterrizado
  tal cual y lo importa en un root limpio (el escenario de réplica A→B):
  `ok:true`, `moved:3`, `feeds:2`, `feedsConHueco:1`.
- **`JUNTURA: el export ya no puede fabricar los tres volúmenes que el driver
  rechaza`** — los cuatro vectores del revisor, uno a uno.

**Acoplamiento declarado**: import relativo entre paquetes, **solo en el test**.
`@zeus/ssb-system` no es —ni puede ser— dependencia de volumes-ops; replicar el
exportador en el test probaría la réplica, no la juntura. `export.mjs` solo
importa `node:*` y su propio `types.mjs`, así que el import relativo resuelve sin
tocar deps ni el `files:["src"]` del paquete.

---

## 4ter · LOS MENORES (2.ª vuelta)

**m1 · guardas sin test.** Reproducido: borrar `destino_sin_coordenada_de_feed`,
anular `corpus_incoherente` o anular la mitad de `cadena_rota` en merge dejaba la
suite en verde. Añadidos cuatro tests: los tres anteriores más
`sobrescritura_imposible`. Sobre este último, la acusación era «código muerto
presentado como garantía» y **es correcta tal como estaba**; lo que hice no fue
declararlo muerto sino encontrarle el vector que sí lo alcanza: **un DIRECTORIO
vacío ocupando la ruta canónica de una unidad** (`walkRel` no lo ve, el índice
queda limpio, el plan lo da por ruta libre, y solo el guardián estructural lo caza
antes de que `renameSync` reviente a medias). Test `m1: sobrescritura_imposible
SÍ es alcanzable`. El que sí queda declarado como inalcanzable-por-orden es
`ruta_bloqueada_por_fichero` (ver B2). La mitad de `cadena_rota` en merge tiene
ahora test que asevera `res.error === 'cadena_rota'` **exacto** —no una subcadena—
y sus cinco campos de detalle.

**m2 · huérfanos y sidecar contradictorio.** Decisión: **el huérfano es semántica
querida**, y por qué — un mensaje SSB es inmutable y un feed no se despublica;
que un volcado posterior no traiga material anterior (ventana temporal más corta,
o material que llegó por `importPack`) no es motivo para borrarlo. Lo que sí era
un defecto es que el sidecar callara la diferencia: `totals` gana **`volumeFiles`**
y **`orphans`** (= `volumeFiles − exported`), más `feedIncoherencias`. La
diferencia tiene nombre en vez de ser implícita. Test `m2: el sidecar NOMBRA la
diferencia…`, validado contra el schema real. Y a §9 como riesgo: **no hay vía de
retirada por clave**.

**m4 · falsificación y ocupación permanente.** A la cabecera de los dos ficheros
y a §9, con esas palabras. Además, **probe permanente** que lo MIDE: un pack
hostil con 5 mensajes fabricados en el feed de la víctima → `ok:true, moved:5`;
y después el material REAL de ese feed → `reescritura_de_feed` **para siempre**.
La regla fuerte y la ausencia de autenticación se combinan mal, y ahora está
fijado en la suite para que no cambie en silencio.

**m5 · CA-6 mal titulada.** Corregido: «cero material de identidad **EN EL CORPUS
DEL REPO**», y el comentario dice que mide `src/` + `fixtures/` de este paquete
—corpus que escribimos nosotros—, no lo que un pub emita.

**m6 · «muerto en `src/`».** Aceptada entera. El probe salta `test|tests|fixtures`
y mi diff mete en `export.test.mjs` una réplica **verbatim** del escritor
demolido. Test nuevo `CA-5c · el escritor legado está muerto EN src/` que
**asevera las dos cosas**: que el predicado endurecido SÍ marcaría este fichero de
test, y que en `src/` no queda ni la definición ni la llamada ni la escritura
contra `configPath`. La frase de §3 dice ahora «en `src/`».

**m8 · el arnés que siembra el manifiesto** está ahora en §1.

---

## 4quater · m7 · ENRUTADO, no arreglado (dos evasiones que ningún probe ve)

Heredadas, **sin ofensor actual**, y **fuera de mi ALCANCE_DIFF** (`manifest.mjs`,
`ledger.mjs`, `import.mjs`). Verificadas abriendo los ficheros:

1. **`resolveManifestPath()` es público.** `manifest.mjs:35-37` lo exporta y
   `volumes-ops/src/index.mjs:35` lo reexporta. Vector:
   `writeFileSync(resolveManifestPath(), x)` — **no contiene el literal
   `'volumes.json'` ni `MANIFEST_FILE_NAME`**, así que el probe estático de CA-5c
   no lo marca; y como no pasa por `exportSsbLogFile`, el probe dinámico de CA-5a
   tampoco lo ve. Cierre posible: que el probe siga también `resolveManifestPath`
   como token, o que la función deje de exportarse.
2. **El ledger acepta su ruta verbatim y sin validar.**
   `ledger.mjs:16-20` — `if (opts.ledgerPath) return opts.ledgerPath;`, cero
   comprobación — y `:43` hace `appendFileSync(path, …)`. `importPack` pasa
   `ledgerOpts` tal cual desde `opts.ledger` (`import.mjs:125`, `:568`). Vector:
   `importPack({ packRoot, role:'operator', ledger:{ ledgerPath: '<root>/volumes.json' } })`
   **añade JSONL encima del manifiesto sellado**, rompiendo el sello sin que
   ningún probe lo marque (`ledger.mjs` no contiene el literal). Cierre posible:
   que `resolveOpsLedgerPath` rechace cualquier ruta cuyo basename sea
   `MANIFEST_FILE_NAME`.

---

## 5 · Prueba de que los tests discriminan (14 + 11 mutaciones)

Los 33 + 20 tests salieron verdes **a la primera**, lo cual no prueba nada por sí
solo. Mutación por mutación, con la mutación aplicada y revertida (fichero
respaldado, nunca `git stash`):

| # | mutación | test que la caza |
|---|---|---|
| M1 | quitar la guarda `reescritura_de_feed` | `not ok 6` ROJO CA-1 |
| M2 | dedup ciego (ignora `valueSha`) | `not ok 11` ROJO CA-3 |
| M3 | quitar `clave_duplicada_en_pack` | `not ok 12` CA-8 |
| M4 | dedup por **RUTA** en vez de por clave | `not ok 10, 11, 26, 27` |
| M5 | quitar `nombre_no_deriva_de_clave` | `not ok 14` |
| M6 | quitar el aborto `destino_sin_clave` | `not ok 25` |
| M7 | `detect` por ruta, no por contenido | **sobrevivía** → test añadido → `not ok 17` |
| M8 | quitar `secuencia_duplicada_en_pack` | `not ok 13` |
| E1 | `requireDeclaredSsbVolume` no-op | `not ok 6, 7, 10` (CA-4 ×3) |
| E2 | resucitar «sync replaces snapshot» | `not ok 15, 16, 17` |
| E3 | resucitar un escritor de `volumes.json` | `not ok 11` (CA-5a) |
| E4 | quitar el aborto por clave divergente | `not ok 16` |
| E5 | motivo de descarte mudo | `not ok 3, 18` (CA-6a) |
| E6 | `sync-cli` vuelve a lanzar crudo | `not ok 10` (CA-4 CLI) |

**M7 sobrevivió a la primera pasada** y por eso está reportada: mi vector de CA-7
usaba un árbol firehose real (`raw/jetstream/…`), que no es ranura SSB, así que la
lectura de contenido nunca se ejercitaba. Añadí el vector del disfraz
(`tribes/u1.json` con un post dentro) y M7 pasa a caerse. Es exactamente el modo de
fallo que el brief describe: un test que verifica lo implementado y no lo prometido.

### 5bis · Mutación EN LA JUNTURA (2.ª vuelta)

La advertencia del revisor era exacta: **las 14 mutaciones de la 1.ª vuelta las
hice sobre el driver, no sobre la frontera**, y ahí es donde estaban las guardas
sin test. Once mutaciones más, esta vez cruzando:

| # | mutación | dónde | test que la caza |
|---|---|---|---|
| J1 | export sin `posicion_duplicada_en_log` | export | `not ok` JUNTURA + `NIVEL 1: la POSICIÓN…` |
| J2 | export sin `posicion_ocupada` | export | `not ok` JUNTURA + `NIVEL 1: la POSICIÓN…` |
| J3 | export sin coordenada obligatoria | export | `not ok` JUNTURA + `NIVEL 1: sin coordenada…` |
| J4 | export sin `layout_invalido_en_volumen` | export | `not ok` JUNTURA + `NIVEL 1: layout inválido…` |
| J5 | índice del destino sin la prueba de layout | driver | `D-G: … MAL NOMBRADO` + `D-G: … profundidad 3` |
| J6 | índice sin detección de bifurcación | driver | `D-G: dos claves en la MISMA posición` |
| J7 | sin `destino_sin_coordenada_de_feed` | driver | `m1: destino sin coordenada…` |
| J8 | sin `corpus_incoherente` | driver | `m1: corpus incoherente…` |
| J9 | sin la mitad **merge** de `cadena_rota` | driver | `m1: cadena_rota en MERGE…` |
| J10 | sin `sobrescritura_imposible` | driver | `m1: sobrescritura_imposible SÍ es alcanzable` |
| J11 | cursor con solo `<author>:<max>` | driver | `cursor: feedsSha256 distingue el RELLENO` |

**J11 no lo cazaba nadie hasta que escribí su test.** Se reporta porque es el
mismo modo de fallo que M7 en la vuelta anterior: la propiedad estaba
implementada y ningún test la medía. Es exactamente el artefacto del que cuelga
el 8.º eslabón, así que lo hice caer antes de entregarlo.

---

## 6 · Qué NO hice, y por qué

1. **No toqué `packages/engine/volumes-ops/src/import.mjs`.** No hizo falta: el
   driver monta encima del contrato existente. **Deuda heredada que cito sin
   arreglar** (es de U201, no mía): el pase de aplicación es
   `mkdirSync(dirname) + renameSync` desnudo (`:459-461`), sin comprobación de
   existencia; la imposibilidad de sobrescribir la garantiza el guardián del
   driver, no el sistema de ficheros. Y el bucle por volumen (`:357-462`) sigue sin
   cubrir dos volúmenes **anidados** en el mismo pack.
2. **No toqué `volumes-ops/src/index.mjs` ni `ssb-system/src/index.mjs`**: están
   fuera del ALCANCE_DIFF. Consecuencia real: `SSB_DRIVER`, `ssbMessageKey`,
   `ssbFeedCoords` y `messageFileName` **no se exportan** desde
   `@zeus/volumes-ops`; los otros tres drivers sí lo están (`index.mjs:21-32`). La
   suite los importa por ruta relativa. **Asimetría de API que dejo abierta al
   siguiente eslabón** — es una línea, pero no es mi fichero.
3. **No toqué `VOLUMES/volumes.json`**: la entrada `ssb` ya existe con
   `deferred:true` y `corpora:[]`, y `family` la sella `importPack:507`.
4. **No toqué ningún `package.json`.** Repliqué `SSB_CORPUS_DIRS`,
   `SSB_MANIFEST_FILE` y `messageFileName` dentro del driver **con nota de sitio
   razonada** (cabecera del driver), igual que U204 con firehose-core.
5. **No toqué `logic.mjs`, `ssb-server.mjs`, `start.mjs`, `config.mjs`** (owner
   ajeno, U230) ni `driver-lineas.mjs`/`curation.mjs` (los leí como plantilla).
6. **No creé ningún schema nuevo.** El driver valida el sidecar contra el schema
   **real** `ssb-manifest`, único `ssb-*` de los 19 (`validate.mjs:37`). **No hay
   schema de MENSAJE ssb**, así que en ninguna parte de este reporte digo «válido
   con los schemas reales» sin acotar: la validación de mensaje es **estructural**
   (clave, coordenada, layout), no de schema.
7. **No reescribí `fixtures/ssb-log.json`.** Fixture nueva al lado.
8. **No edité `e2e/feed-families-demo.mjs`** — ver §8.

---

## 7 · Comandos y salidas

### 7.0 · El alta, entera

```
$ git diff packages/engine/volumes-ops/src/drivers.mjs
+import { SSB_DRIVER, SSB_FAMILY } from './driver-ssb.mjs';
...
-  [FIREHOSE_FAMILY]: FIREHOSE_DRIVER
+  [FIREHOSE_FAMILY]: FIREHOSE_DRIVER,
+  [SSB_FAMILY]: SSB_DRIVER
```

### 7.1 · Antes (medido en el worktree, tras `npm ci`)

```
$ npm test -w @zeus/ssb-system      → # tests 4  # pass 4  # fail 0
$ npm test -w @zeus/volumes-ops     → # tests 56 # pass 56 # fail 0
```

### 7.2 · Después

```
$ npm test -w @zeus/volumes-ops     → # tests 97 # pass 97 # fail 0 # skipped 0
$ npm test -w @zeus/ssb-system      → # tests 26 # pass 26 # fail 0 # skipped 0
$ npm test -w @zeus/feed-kit        → # tests 10 # pass 10 # fail 0
$ npm test -w @zeus/linea-kit       → # tests 36 # pass 36 # fail 0
$ npm test -w @zeus/firehose-core   → # tests 12 # pass 12 # fail 0
$ npm test -w @zeus/presets-sdk     → # tests 55 # pass 55 # fail 0
$ npm run lint                      → ✖ 18 problems (0 errors, 18 warnings); 0 en ficheros de U205
```

### 7.3 · Cota

```
[U205·cota] mensajes=800 · import A (480 nuevos)=5259ms · import B (480 dedup + 320 nuevos)=6715ms
```
Con reimport final `noop:true` y sello idéntico. Ajustable con `ZEUS_U205_SCALE`.
**No medido**: el comportamiento a 8.388 unidades (esa cifra es de FIREHOSE y no
tiene fuente en `plan/DATOS.md`, según `GOBIERNO-EJECUCION-F2:271`).

### 7.4 · Idempotencia del export

`ok 15 - unión aditiva…`: `first.added=9, unchanged=0` → segundo pase
`added=0, unchanged=9`, listado de `tribes/` con **`mtimeMs` `deepEqual`**, y un
fichero heredado que el borrado antiguo habría eliminado sigue ahí byte a byte.

### 7.5 · Los dos probes, desde shell, contra el árbol

```
$ grep -rn "sealManifest\|writeFileSync.*volumes\.json" --include=*.mjs packages scripts e2e | grep -v node_modules | grep -v "/test/"
  → 8 hits (jetstream-sync:22, smoke-env:52, import.mjs:9/41/527, index.mjs:38, manifest.mjs:11/72)
  → export.mjs NO aparece                         ← el probe heredado es CIEGO

$ node <probe-endurecido> <worktree>              # base y después
  → packages/editor/editor-ui/src/world/materialize-pack.mjs
    packages/engine/feed-kit/src/jetstream-sync.mjs
    packages/engine/test-utils/src/smoke-env.mjs
    packages/engine/volumes-ops/src/manifest.mjs
    packages/mesh/ssb-system/src/export.mjs       ← el endurecido SÍ lo ve
    total: 5
```

### 7.6 · La fixture existente, medida

```
$ node -e "…agrupar ssb-log.json por autor…"
@alice.ed25519 seq [1,2,3,5,8,10] · @bob.ed25519 [4,7,9] · @carol.ed25519 [6]
previous=null con sequence 3, 6, 8, 10
CRUZADO: bob/4 → mensaje de alice · alice/5 → de bob · bob/7 → de carol · bob/9 → de alice
```

---

## 8 · Lo que descubrí y NO estaba en el brief

### 8.1 · **La corrección 3 del brief es falsa: `e2e/feed-families-demo.mjs` ya estaba roto ANTES de U205, y no por mí**

El brief afirmaba que «hoy el `volumes.json` de ese e2e lo fabrica en exclusiva la
invención que U205 va a matar». **Medido: el demo nunca llega a esa línea.** Su
`:65` llama `syncJetstreamFixture` sobre el `mkdtemp` vacío de `:50`, y
`resolveFirehoseVolumeRoot` (feed-kit, `:104-122`) —**fail-closed introducido por
U204**— aborta ahí. El `exportSsbLogFile` de `:68` es código muerto desde U204.

Probe (reproduce `:50-68` sin el import de games-library):

```
--- CON el código de U205 ---
L65 syncJetstreamFixture FALLA: [feed-kit] root de volúmenes no operable (volumes.json not found …)
L68 exportSsbLogFile FALLA:     volumes.json not found at … not operable (U199)
--- CON el export del commit base 87bd93f ---
L65 syncJetstreamFixture FALLA: [feed-kit] root de volúmenes no operable (volumes.json not found …)
L68 exportSsbLogFile: OK
```

**Conclusión operativa: U205 no rompe ese e2e; U204 ya lo había roto en la línea
anterior.** El arreglo es **uno solo** y cura ambas líneas a la vez: sembrar un
`volumes.json` con las entradas `firehose` y `ssb` en `volumesRoot`, entre `:57` y
`:65`. **NO lo aplico**: `e2e/` está fuera de mi ALCANCE_DIFF y el brief me manda
escalarlo en vez de dejarlo implícito. **ESCALADO al orquestador.**

Aviso adicional: ese e2e es **inejecutable en este entorno** por dos razones de
entorno independientes — no hay `.env` con `ZEUS_VOLUMES_ROOT` (muere al importar
`e2e/helpers.mjs:9`) y falta el repo hermano `Z_SDK-games-library`
(`e2e/games-root.mjs:27`). Así que **no está medido** si el demo pasaba entero en
algún entorno; lo medido es dónde muere cada llamada.

### 8.2 · **El filtro de tipo del exportador rompe la contigüidad de los feeds por construcción**

Ya desarrollado en CA-1. Es el hallazgo que **cambia el contrato** frente a lo que
pedía el brief, y por eso está en cabecera del driver, en el nombre de un test y
aquí.

### 8.3 · **La única fixture SSB del repo no es un conjunto de feeds SSB válido**

Medido (§7.6): `sequence` es un contador **global**, no por feed, y `previous`
cruza de feed cuatro veces. Consecuencia dura y declarada: **un pack construido con
el export de `ssb-log.json` NO es importable** por este driver
(`cadena_rota_en_pack`). Está fijado como test permanente con la forma exacta
medida (`ok 18 - consecuencia declarada: la fixture ssb-log.json del repo NO es un
conjunto de feeds válido`). Fallar cerrado ante ese material es lo correcto —no es
material SSB válido—, pero **hay que saberlo antes de encontrárselo**.

### 8.4 · La incógnita de CA-1 sigue abierta, y ahora sé nombrarla

**No medido**: si el productor real emite `sequence` por feed (como exige el
protocolo) o un contador global (como la fixture). No hay ningún volcado real del
pub OASIS en el repo (`ZEUS_SSB_LOG_PATH` es placeholder en `VOLUMES/volumes.json`).
Si aparece material real con contador global, **la regla de cadena (`previous`
⟺ `sequence`) debe redefinirse contra él**, no al revés.

### 8.5 · El layout SÍ es contrato en SSB (a diferencia de FIREHOSE)

`loadSsbMessage` (`loader.mjs:131-146`) busca literalmente
`<corpus>/base64url(key).json`. Un mensaje perfecto con otro nombre de fichero es
**material inalcanzable**: existe en disco y no existe para el mundo. Por eso
VALIDAR exige profundidad 2 y nombre derivado — un requisito que FIREHOSE
explícitamente rechazaba («la clave no es la ruta») y que aquí es obligatorio.

### 8.6 · `deferred:true` sobrevive al import

`import.mjs:501-507` sella con `{...prev, …}`, así que el `deferred:true` de la
entrada `ssb` de `VOLUMES/volumes.json` **sobrevive**. En ningún sitio afirmo que
el volumen quede navegable tras importar: `browse-core.mjs:71-72/155-156` lanza
para volúmenes diferidos. **No medido** por mí (lectura, no ejecución); lo hereda
el brief y lo repito para que no se pierda.

### 8.7 · Detalles de cita corregidos sobre la marcha

`FAMILY_DRIVERS` está ahora en `drivers.mjs:19-24` (era `:19-23`; mi alta añadió
una línea). El resto de citas del brief que reutilizo las abrí una a una.

---

## 9 · Riesgos que dejo al 8.º eslabón (CA local-first + réplica A→B)

1. **`e2e/feed-families-demo.mjs` sigue rojo en `:65`** — no es mío y no lo toqué
   (§8.1). Un solo `writeFileSync` de semilla lo cura; alguien tiene que ser su
   dueño.
2. **Asimetría de API**: el driver SSB no está reexportado desde
   `volumes-ops/src/index.mjs` (§6.2). Si la réplica A→B necesita
   `ssbMessageKey`/`SSB_DRIVER` desde fuera del paquete, ese es el primer
   obstáculo, y es de una línea.
3. **Sin marca de sync en `volumes.state.json`** para el volumen `ssb` (§3). Una
   réplica que compare «cuándo se sincronizó A vs. B» encontrará la marca solo en
   `DISK_04/SSB/manifest.json`, **no** en el sitio donde vive la de FIREHOSE. Es
   asimetría **declarada**, no olvido: se cierra cuando volumes-ops sea
   dependencia declarable de ssb-system.
4. **El cursor de réplica ya existe y está sellado**:
   `snapshot = {unit:'ssb-key', units, unitsSha256, feeds, feedsSha256}`, donde
   `feedsSha256` resume **`<author>:<min>:<max>:<count>`** ordenado (2.ª vuelta;
   antes era solo `<author>:<max>`, y dos volúmenes con el mismo frente y
   distinta densidad daban el MISMO cursor — hay test que lo mide).
   `feedsConHueco` sigue avisando de que **la frontera no implica completitud**.
   Lo que el cursor **sí** prueba: mismo `unitsSha256` ⇒ mismo conjunto exacto de
   claves; mismo `feedsSha256` ⇒ misma frontera y densidad por feed. Lo que **no**
   prueba por sí solo: qué posiciones concretas faltan.
5. **`clave_divergente` y `reescritura_de_feed` son abortos duros**: una réplica
   A→B entre nodos con historia bifurcada **no convergerá sola**; el import
   abortará citando la clave o la posición. Es intencional (fusionar forks en
   silencio es pérdida de dato), pero la réplica necesitará una política explícita
   de resolución, y **no la hay**.
6. **El export es fail-closed sobre la topología**: cualquier consumidor que
   llamara a `exportSsbLogFile` sobre un root recién creado ahora recibe una
   excepción. El único consumidor externo del repo es el e2e de §8.1
   (`grep -rn "@zeus/ssb-system" --include=*.mjs packages e2e scripts` → una sola
   llamada fuera del paquete).
7. **Material heredado bloqueante**: un volumen SSB vivo que ya contenga un
   fichero sin clave bajo un corpus, un enlace, un mensaje con nombre no derivado,
   uno fuera de layout, uno sin coordenada de feed, o una bifurcación ya
   aterrizada, queda **no importable** hasta que el operador lo retire — con la
   ruta citada, y con la ruta ESPERADA cuando la hay. **Y desde la 2.ª vuelta
   también bloquea el SYNC** (`layout_invalido_en_volumen`): es el precio de que
   los dos escritores apliquen la misma regla, y es deliberado — un volumen que
   el lector no puede resolver no debe recibir más material encima. Mismo precio
   que pagó U204 con D-B/D-F, por la misma razón.
8. **(2.ª vuelta) OCUPACIÓN PERMANENTE DE FEED AJENO — no hay verificación de
   firma en ninguna parte de este carril.** `value.author` se toma como dicho.
   Como la posición `(author, sequence)` es lo único inviolable, **cualquiera
   puede ocupar el feed de cualquiera de forma permanente**: un pack hostil con
   mensajes fabricados en `(@victima, 1..n)` aterriza (`ok:true, moved:5`,
   medido), y cuando llegue el material REAL de ese feed abortará con
   `reescritura_de_feed` **para siempre**. La regla fuerte y la ausencia de
   autenticación se combinan mal. Está fijado como probe permanente (`m4`) para
   que no cambie en silencio, pero **cerrarlo es un WP**: sin verificar la firma
   del mensaje, ninguna réplica A→B entre nodos no confiados es segura.
9. **(2.ª vuelta) No hay vía de retirada por clave.** El único primitivo de
   retirada que existía —el borrado destructivo— arrasaba el corpus entero, y lo
   maté. Un mensaje aterrizado por error (o el material de un feed ocupado, punto
   8) **se retira a mano**. Los huérfanos son semántica querida y ahora tienen
   nombre en el sidecar (`totals.orphans`), pero un `emptyVolume` por clave no
   existe.
10. **(2.ª vuelta, enrutado) Dos evasiones que ningún probe de CA-5 ve** — §4quater:
    `resolveManifestPath()` público, y el ledger aceptando su ruta verbatim. Sin
    ofensor actual, fuera de mi alcance, con vector escrito.

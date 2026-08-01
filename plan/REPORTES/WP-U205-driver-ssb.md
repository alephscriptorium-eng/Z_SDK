# WP-U205 · Driver SSB (7.º eslabón del carril D)

Rama `wp/u205-driver-ssb`, base `87bd93f`. Todo lo que sigue lleva comando y salida, o
dice «no medido».

---

## 0 · Resumen ejecutable

| suite | antes (87bd93f) | después |
|---|---|---|
| `@zeus/volumes-ops` | 56/56 | **89/89** (+33) |
| `@zeus/ssb-system` | 4/4 | **20/20** (+16) |
| `@zeus/feed-kit` | 10/10 (no medido antes) | 10/10 |
| `@zeus/linea-kit` | — | 36/36 |
| `@zeus/firehose-core` | — | 12/12 |
| `@zeus/presets-sdk` | — | 55/55 |
| `npm run lint` | — | 0 errores · 18 warnings (**0 en ficheros de U205**) |

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
aborta · ruta ocupada por otra clave → `colision_ruta` · sidecar `manifest.json`
de raíz: falta→aterriza, igual→no-op, distinto→**divergencia reportada, jamás
pisada** · claves y secuencias duplicadas dentro del pack → abortan en VALIDAR.
Índice del destino sin agujeros (doctrina D-B/D-F de U204 heredada entera:
`enlace_en_destino`, `destino_sin_clave`, `destino_sin_coordenada_de_feed`).

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

---

## 2 · Tensión 1 — exportador destructivo vs. unión aditiva. **Resuelta: deja de borrar**

El exportador borraba todos los `.json` de cada corpus antes de escribir
(`87bd93f:export.mjs:93-96`, «sync replaces snapshot»). Decisión: **el borrado
muere**; el export aplica la MISMA regla de unión que el driver (índice por clave
sobre todo el volumen, cross-corpus; clave igual con el mismo `value` = no-op;
clave con `value` distinto = **aborto en pase dry, antes de escribir un byte**).

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
Rojo añadido: misma clave con `value` distinto → `clave_divergente` (`ok 11`).

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

## 5 · Prueba de que los tests discriminan (14 mutaciones)

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
$ npm test -w @zeus/volumes-ops     → # tests 89 # pass 89 # fail 0 # skipped 0
$ npm test -w @zeus/ssb-system      → # tests 20 # pass 20 # fail 0 # skipped 0
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
   `feedsSha256` resume `<author>:<maxSeq>` ordenado — exactamente «hasta dónde
   está replicado cada feed». `feedsConHueco` avisa de que **`maxSeq` no implica
   completitud**: comparar solo `feedsSha256` entre A y B puede dar «iguales»
   siendo distintos por dentro. Si la réplica necesita completitud, el snapshot
   O(1) **no basta** y hace falta otro artefacto.
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
   fichero sin clave bajo un corpus, un enlace, o un mensaje con nombre no
   derivado, queda **no importable** hasta que el operador lo retire (con la ruta
   citada). Mismo precio que pagó U204 con D-B/D-F, por la misma razón: un índice
   con agujeros no puede sostener «jamás duplicar».

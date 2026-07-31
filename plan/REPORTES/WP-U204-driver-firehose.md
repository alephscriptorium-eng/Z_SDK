# WP-U204 · Driver FIREHOSE (carril D · eslabón 6/8)

| dato | valor |
| ---- | ----- |
| WP | **U204** · Driver FIREHOSE (P1 · `plan/BACKLOG.md:261`) |
| Rama | `wp/u204-driver-firehose` · base `26d1470` (= `main`) |
| Commits | `35c1541` (driver) · `efc77ed` (demolición del escritor legado) |
| Deps | U201 ✅ (contrato de import v1) · herencias U199/U200/U202/U203 |
| Contrarrevisión | **sí, esperada** (adversarial): clase «Secretos / datos» §5 del gobierno por tocar el sellado y un escritor legado |

---

## 1 · Qué se ejecutó

### Nacidos

| fichero | qué es |
| ------- | ------ |
| `packages/engine/volumes-ops/src/driver-firehose.mjs` (380 líneas) | driver de familia FIREHOSE: `detect` / `validate` / `merge` (PLAN). Cabecera = decisión Z-D9 razonada con citas |
| `packages/engine/volumes-ops/test/import-firehose-driver.test.mjs` (13 tests) | suite del WP: Z-D9 aislado, CA-1, 4 de idempotencia/unión, 4 rojos, 2 de índice, 1 de cota |

### Tocados

| fichero:línea | cambio |
| ------------- | ------ |
| `packages/engine/volumes-ops/src/drivers.mjs:16,19-24` | `FIREHOSE_DRIVER` registrado en `FAMILY_DRIVERS` |
| `packages/engine/volumes-ops/src/drivers.mjs:26-38` | `detectVolumeFamily(volumeEntry, volumeFiles, volumeDir)` — tercer argumento nuevo: el dir del volumen **dentro del pack**, para familias cuya firma es el CONTENIDO y no un nombre de fichero. LINEAS/FORCES lo ignoran (compatible hacia atrás) |
| `packages/engine/volumes-ops/src/import.mjs:241-245` | pasa `volumeDir` al detect |
| `packages/engine/volumes-ops/src/import.mjs:407-409` | `familyReports` gana `dedup` (lo deduplicado se REPORTA con la ruta donde la clave ya vivía) |
| `packages/engine/volumes-ops/src/import.mjs:475,565` | `dedup` en el paso observable `fusionar` y en el asiento del ledger |
| `packages/engine/volumes-ops/src/state.mjs:73-105` | **nace `recordVolumeSync`** — marca de sync vivo en `volumes.state.json` |
| `packages/engine/volumes-ops/src/state.mjs:119-122` | `recordVolumeState` preserva marcas ajenas (medir no borra estado que no produjo) |
| `packages/engine/volumes-ops/src/index.mjs:23-30,45` | re-exports (`FIREHOSE_*`, `firehoseUnitKey`, `recordVolumeSync`) |
| `packages/engine/feed-kit/src/jetstream-sync.mjs:9-25,89-124,175-200,206,239,320` | **demolición** (§3) + `resolveFirehoseVolumeRoot` + `recordFirehoseSync` |
| `packages/engine/feed-kit/src/index.mjs:20-33` | export map: fuera `ensureFirehoseVolumeLayout`, dentro los sucesores |
| `packages/engine/feed-kit/test/resolve.test.mjs:20-56,128-176,178` | root sembrado explícito + 1 test nuevo (rojo del sync sin volumen declarado) |
| `packages/engine/firehose-core/src/browse.mjs:6-42,231` | `getFirehoseStats().syncedAt` lee del ESTADO, no del manifiesto |
| `packages/engine/firehose-core/test/browse-loader.test.mjs:164-186` | test nuevo del punto anterior |

**No** se tocó ningún `package.json` (los 48 manifests son de U237 en ola 1,
GOBIERNO §2), ni `plan/BACKLOG.md`, ni `main`, ni se hizo push.

---

## 2 · Decisión Z-D9 · la UNIDAD y su CLAVE, con la evidencia que la sostiene

> **Decisión: la unidad es el REGISTRO ATProto; su clave es el AT-URI
> canónico DERIVADO `at://<did>/<commit.collection>/<commit.rkey>`, única a
> nivel de VOLUMEN (no de corpus, no de batch, no de ruta).**

### 2.1 · Evidencia del formato real (todo citable en este árbol)

| # | evidencia | ruta:línea |
| - | --------- | ---------- |
| E1 | El PRODUCTOR escribe `<corpus>/<batch>/<rkey>.json` con el payload jetstream **crudo**; el nombre sale de `raw.commit.rkey` | `packages/engine/feed-kit/src/jetstream-sync.mjs` `writeJetstreamPost` (hoy :139-160) |
| E2 | El LECTOR canónico trata `uri` como **opcional** y cae a `rkey`: `id = uri \|\| raw.commit?.rkey \|\| raw.commit?.cid \|\| null` | `packages/engine/firehose-core/src/schema.mjs:40` |
| E3 | El predicado de pertenencia exige `commit.collection` o `commit.record.text` | `packages/engine/firehose-core/src/schema.mjs:58-61` |
| E4 | Solo cuentan como post los `.json` bajo el corpus, recursivamente | `packages/engine/firehose-core/src/browse.mjs:90` |
| E5 | Doctrina del mundo: «los objetos pesados ya son inmutables y **con clave natural** (`<oldid>.wikitext`, **JSON de firehose por hash/rkey**, mensajes SSB por hash)» | `plan/DATOS.md` §5.1 |
| E6 | El corpus es cadena de triage viva `raw→candidate→labeled→discarded` | `plan/DATOS.md` §3 · `packages/engine/linea-kit/schemas/curation-status.json` |
| E7 | Censo: **38 MB · 8.388 ficheros · 167 dirs** (≈50 ficheros/dir ⇒ hay batches) | `sincronia/notas/NOTA-Z-2026-07-26-R7-matriz-migracion-y-loadstartpack.md:23` — **esto responde el `<pendiente>` de `plan/GOBIERNO-EJECUCION-F2.md:271`**: la cifra sí tiene fuente, no está en `plan/DATOS.md` |
| E8 | El índice `triage-manifest.json` **puede no existir**: el validador real ya lo trata como opcional (`skipped.push`) | `packages/engine/linea-kit/src/validate.mjs:217-221` |

### 2.2 · Por qué NO la ruta (que era el candidato cómodo)

1. **`rkey` es único por repo (`did`) y colección, no globalmente.** Dos DIDs
   distintos producen el MISMO nombre de fichero en el mismo batch. Dedup por
   ruta confundiría dos registros y pisar uno sería pérdida de dato. Probado
   en rojo: `ROJO: misma RUTA con clave DISTINTA … = colision_ruta que aborta`.
2. **`batch` es el nombre de la CORRIDA de sync, no del dato** (E1: el batch
   por defecto es literalmente `'jetstream'`, y cada corrida puede elegir
   otro). El mismo registro reaparece en batches distintos entre corridas: por
   ruta se duplicaría y la idempotencia incremental se rompería. Probado en
   verde: `CA-2: unión ADITIVA por clave — mismo registro en OTRO batch NO duplica`.
3. **El `corpus` es estado de triage vivo** (E6). Reimportar en `raw` un
   registro ya etiquetado lo resucitaría. Por eso la clave es única a nivel de
   VOLUMEN: el índice del destino se construye sobre los cuatro corpus.
   Probado: `CA-2: la clave es de VOLUMEN — un registro ya triado no resucita en raw`.

### 2.3 · Por qué DERIVADA y no leída de `uri`

Porque E2 dice que el propio lector del mundo no da `uri` por seguro. La clave
se compone de los tres campos que el productor escribe y el lector exige
(`did`, `commit.collection`, `commit.rkey`); `uri` queda como **fallback
declarado** para material que sí lo traiga. Probado:
`CA-2: unidad SIN uri (jetstream crudo) dedupe contra la que sí lo trae` y
`Z-D9: … sin uri funciona igual`.

### 2.4 · Lo que NO se inventa

`firehoseUnitKey` devuelve `null` cuando el material no rinde clave
inequívoca. **Jamás se fabrica una clave desde la ruta.** Un fichero bajo
corpus sin clave es `unidad_sin_clave`: aborta en VALIDAR, staging borrado,
root intacto. Es un **fallo-cerrado declarado**, no un bloqueo del WP: el
material que este árbol contiene sí permite clave inequívoca (E1-E5), y para
el que no la permita el import se niega con la ruta en el error en vez de
adivinar.

### 2.5 · El cursor

`source.imported.snapshot = { unit:'at-uri', units:<n>, unitsSha256:<sha256 del
conjunto ordenado de claves> }` — **O(1) en tamaño** (8.388 unidades caben en
dos campos; el `snapshot` por-unidad de U203 habría inflado el manifiesto con
8.388 entradas y roto su carta de «identidad + topología»). Lo sella
`importPack`; el driver no sella.

---

## 3 · El escritor legado `jetstream-sync.mjs` — qué pasó

### 3.1 · El defecto (citado por U203, verificado)

`ensureFirehoseVolumeLayout`, antes en `packages/engine/feed-kit/src/jetstream-sync.mjs:80-124`:

- `:120` `fs.writeFileSync(configPath, …)` sobre `volumes.json` — escritor del
  manifiesto **fuera** de `sealManifest`;
- `:113` `syncedAt: new Date().toISOString()` **dentro** del manifiesto — campo
  temporal que cambiaba el sello sha256 en CADA sync (U199);
- `:86-93` inventaba `{ root:'.', volumes:{} }` si el manifiesto faltaba y
  `:105-116` creaba la entrada `firehose` — topología por sync, contra
  «el manifiesto solo cambia por import».

### 3.2 · La decisión: **ELIMINADO**, no reencaminado

No se reencaminó a `sealManifest` porque eso habría legitimado que un sync
vivo escriba el manifiesto. La regla heredada es más dura: **el manifiesto solo
cambia por import**. Lo que quedó:

- **`resolveFirehoseVolumeRoot(volumesRoot, {volumeId})`**
  (`jetstream-sync.mjs:104-124`): **cero escrituras de manifiesto**. Exige que
  el manifiesto exista y declare el volumen; si no, aborta con mensaje que
  apunta al import. Solo materializa los directorios de datos de los corpus
  que el manifiesto YA declara.
- **`recordFirehoseSync`** (`jetstream-sync.mjs:189-195`) → `recordVolumeSync`
  (`volumes-ops/src/state.mjs:91`): `syncedAt` va a `volumes.state.json`, que
  nunca entra en el sello. «Sync vivo = estado» ejecutado, no prometido.
- **Consumidor arreglado**: `getFirehoseStats().syncedAt`
  (`firehose-core/src/browse.mjs:231`) leía `volume.source?.syncedAt`; tras la
  demolición nadie lo escribía ahí y habría quedado `null` **en silencio**.
  Ahora lee del estado (`browse.mjs:17-42`). Sin dep nueva: firehose-core no
  puede declarar `@zeus/volumes-ops` con los manifests congelados (GOBIERNO §2,
  owner U237); el escritor canónico queda citado en la cabecera.

### 3.3 · Prueba de que no quedan escritores no declarados

**Probe 1 — el nombre demolido no existe como código:**

```
$ grep -rn "ensureFirehoseVolumeLayout" --include=*.mjs --include=*.md --include=*.json . | grep -v node_modules | grep -v "^./plan/"
./packages/engine/feed-kit/src/index.mjs:23:  // WP-U204: `ensureFirehoseVolumeLayout` (escritor legado de volumes.json
./packages/engine/feed-kit/src/jetstream-sync.mjs:11: * `ensureFirehoseVolumeLayout` vivía aquí y ESCRIBÍA `volumes.json` con un
./packages/engine/firehose-core/src/browse.mjs:20: * volumes.json by feed-kit's `ensureFirehoseVolumeLayout`, which broke the
./packages/engine/volumes-ops/src/state.mjs:79: * defect demolished here — feed-kit `ensureFirehoseVolumeLayout` wrote
```

4 hits, **los 4 son comentarios de demolición**. Cero llamadas, cero
definiciones, cero exports.

**Probe 2 — escritores del manifiesto (patrón de contrarrevisión que U201 dejó
citado):**

```
$ grep -rn "writeFileSync[^)]*volumes\.json\|volumes\.json.*writeFileSync\|sealManifest" --include=*.mjs packages/ scripts/ e2e/ | grep -v node_modules
packages/engine/feed-kit/src/jetstream-sync.mjs:22   (comentario)
packages/engine/test-utils/src/smoke-env.mjs:52      ← ver abajo
packages/engine/volumes-ops/src/import.mjs:9,41,527  ← el único camino
packages/engine/volumes-ops/src/index.mjs:36         (re-export)
packages/engine/volumes-ops/src/manifest.mjs:11,72   ← sealManifest
```

**Probe 3 — barrido ancho de `volumes.json` en `packages/**`** (ejecutado; ver
§5): fuera de tests/fixtures quedan exactamente **tres** sitios que escriben un
`volumes.json`, y ninguno es un escritor no declarado del manifiesto vivo:

| sitio | veredicto |
| ----- | --------- |
| `volumes-ops/src/manifest.mjs:72` `sealManifest` ← `import.mjs:527` | **el único escritor legítimo**, sin cambios |
| `packages/mesh/ssb-system/src/export.mjs:173-207` `upsertVolumesJsonEntry` | **defecto vivo, NO tocado** — inventa `{root:'.',volumes:{}}` si falta (`:176-182`), inyecta `source.syncedAt` (`:196`) y escribe con `fs.writeFileSync` (`:207`). Es exactamente el defecto que aquí se demuele, en la familia del eslabón siguiente → **riesgo citado a U205** (§6) |
| `packages/engine/test-utils/src/smoke-env.mjs:52` | **harness de tests**: siembra un root de fixture en un temp dir. No es camino de producto (ningún runtime lo importa). **Anotado, no arreglado** (fuera de alcance) |
| `packages/editor/editor-ui/src/world/materialize-pack.mjs:87` | escribe `<packRoot>/volumes/volumes.json` — el manifiesto **de un pack** (fuente de import), no el del root vivo. Fuera de la clase |

---

## 4 · Casos rojos probados (con su salida)

Todos verifican lo mismo tras el fallo: **sello del manifiesto idéntico byte a
byte**, `hashManifest()` idéntico, **cero residuos `.import-staging*`**, y el
material previo intacto byte a byte.

| rojo | error observado | dónde aborta |
| ---- | --------------- | ------------ |
| **Sobrescritura** — mismo `rkey`, otro `did` (misma ruta, clave distinta) | `step:'fusionar'`, `error:'colision_ruta'`, `file:'raw/jetstream/shared.json'`, `key:'at://did:plc:beta/app.bsky.feed.post/shared'`, `destKey:'at://did:plc:alpha/app.bsky.feed.post/shared'` | pase **dry**, antes del primer rename. El registro ajeno queda byte a byte; la unidad nueva del mismo pack **tampoco** aterriza |
| **Unidad sin clave** — `.json` bajo corpus que no es post | `step:'validar'`, `error:'familia_invalida'`, mensaje `unidad_sin_clave: raw/jetstream/no-es-post.json no rinde AT-URI …` | VALIDAR; `DISK_01` ni se crea |
| **Clave duplicada dentro del pack** | `step:'validar'`, `error:'familia_invalida'`, `clave_duplicada_en_pack: at://… aparece en raw/jetstream/dup.json y en raw/otro-batch/copia.json` | VALIDAR (no se deduplica en silencio: un pack así es defectuoso) |
| **Familia desconocida declarada** (`family:'firehose-v2'`) | `step:'familia'`, `error:'familia_desconocida'`, `family:'firehose-v2'`; **`steps` no contiene `staging`** | ANTES de staging |
| **Índice roto** — `triage-manifest.json` con `timestamp` numérico | `step:'validar'`, `error:'familia_invalida'` con el schema **real** `triage-manifest` de linea-kit (gate U80) | VALIDAR |

Y el rojo que **no** es error sino no-op, que es la mitad difícil de la unión
aditiva:

| caso | resultado |
| ---- | --------- |
| Registro ya presente (mismo corpus, otro batch) | `moved:1` (solo lo nuevo), `dedup:[{at:'raw/jetstream/u204a.json'},{at:'raw/jetstream/u204b.json'}]`, el batch nuevo **no** contiene copias, `volumeFiles.length === 3` |
| Registro ya **triado** en `labeled/`, el pack lo trae en `raw/` | `moved:0`, `dedup[0].at === 'labeled/triaje-1/u204e.json'`, `raw/jetstream/u204e.json` **no existe**, volumen con 1 fichero |
| Sidecar de raíz `triage-manifest.json` distinto | `divergences:[{path:'triage-manifest.json',kind:'contenido_distinto'}]`, destino byte a byte intacto, y el material nuevo del mismo pack **sí** aterriza |

### Garantía estructural de la imposibilidad de sobrescribir

`importPack` fusiona con `renameSync`, que **sí** pisaría. La imposibilidad no
la da el sistema de ficheros: la da el plan. `merge` (`driver-firehose.mjs:349-353`)
recorre los `moves` construidos y devuelve `sobrescritura_imposible` si alguno
apuntase a una ruta ya existente. Los tres caminos que podrían generar un move
sobre ruta ocupada están cerrados antes (dedup por clave, `colision_ruta`,
sidecar por divergencia), así que el guardián es red de seguridad — declarado
como tal, no como decoración.

---

## 5 · Suites (antes → después) — números exactos

| paquete | antes | después | nota |
| ------- | ----- | ------- | ---- |
| `@zeus/volumes-ops` | **27/27** | **40/40** | +13 (la suite del WP) |
| `@zeus/feed-kit` | **9/9** | **10/10** | +1 (rojo del sync sin volumen declarado) |
| `@zeus/firehose-core` | **11/11** | **12/12** | +1 (`syncedAt` desde el estado) |
| `@zeus/linea-kit` | **36/36** | **36/36** | vecina (schemas reales) |
| `@zeus/presets-sdk` | **55/55** | **55/55** | vecina (resolver) |
| `@zeus/linea-firehose` | **1/1** | **1/1** | consumidor de `browse.mjs` |
| `@zeus/firehose-browser` | **5/5** | **5/5** | consumidor de `browse.mjs` |

Total: **159/159 verdes**, cero rojos. `npx eslint` sobre los `src/` tocados y
la suite nueva: **sin hallazgos**.

### Rojo histórico declarado (NO arreglado de tapadillo)

`e2e/feed-families-demo.mjs` (`npm run e2e:feed-families`) estaba **ya rojo en
la base `26d1470`**, antes de tocar nada, y sigue rojo por la MISMA causa:

```
Error: ZEUS_VOLUMES_ROOT is not set — volumes root is not operable …(U200 · ◆5)
    at resolveVolumesRoot (…/presets-sdk/src/volumes/resolve.mjs:33:11)
    at …/e2e/helpers.mjs:9:31
```

Falla **al importar `e2e/helpers.mjs`**, antes de ejecutar una sola línea del
demo: es secuela de U200 (el default de root demolido) y su arreglo es de quien
posea `e2e/`, no de este WP. No está cableado en `.github/workflows/ci.yml`
(grep `e2e` en ci.yml = 0 hits). **Anotado, no arreglado.** Aviso honesto: si
alguien lo arregla, `syncJetstreamFixture` ya no sembrará el root — el demo
tendrá que sembrarlo por import (o, para fixture, escribir su `volumes.json`
como hacen las suites).

---

## 6 · Cota realista — medida propia, no extrapolación

El corpus real (E7: 38 MB · 8.388 ficheros) vive **fuera del repo**
(`OASIS/SCRIPTORIUM_V0/…/DISK_01/FIREHOSE`), así que la cota se demuestra con
material sintético **a la cifra exacta del censo**, ejecutando el camino
completo (VERIFICAR → familia → STAGING → VALIDAR → FUSIONAR → SELLAR →
NO-LINK) dos veces más un tercer pase de no-op:

```
$ ZEUS_U204_SCALE=8388 node --test --test-name-pattern="cota" test/import-firehose-driver.test.mjs
# [U204·cota] unidades=8388 · import A (5032 nuevas)=16965ms · import B (5032 dedup + 3356 nuevas)=23671ms
ok 1 - cota: import incremental a escala …
# pass 1 · fail 0 · duration_ms 60439
```

Aserciones que acompañan la medida (no es solo un cronómetro):

- `dedup.length === 5032` — todo el solape se reconoce por clave;
- `moved === 3356` — **solo** lo nuevo aterriza;
- `volumeFiles(root).length === 8388` — **ni una copia de más**: unión aditiva
  exacta sobre el censo completo;
- `snapshot.units === 8388`;
- tercer pase de B → `noop:true` y `manifestSha256` idéntico al de B.

La suite deja el test a **1.200 unidades por defecto** (~5 s) para no cargar
CI; `ZEUS_U204_SCALE` lo sube. Medida de 1.200 para comparar:
`import A (720 nuevas)=2140ms · import B (720 dedup + 480 nuevas)=2978ms` — el
crecimiento 1.200→8.388 (×6,99) da ×7,93 en A y ×7,95 en B: **coste
prácticamente lineal**, sin sorpresa cuadrática en el índice por clave.

Coste dominante: no es el índice del driver sino los pases O(N) que ya tenía
`importPack` (sha256 de cada fichero en VERIFICAR + re-hash en VALIDAR + copia
a staging + rename + medición de corpora). El índice por clave añade una
lectura+parse por unidad del destino. 8.388 unidades en ~24 s por import
incremental: **viable a la escala del censo**.

---

## 7 · Riesgos citados al siguiente eslabón (U205 · Driver SSB)

1. **`packages/mesh/ssb-system/src/export.mjs:173-207` es el mismo defecto que
   este WP acaba de demoler, en tu familia.** `upsertVolumesJsonEntry`
   (a) **inventa** el manifiesto si falta (`:176-182` — contra U199 «un root sin
   manifiesto no es operable, no se inventa nada»), (b) inyecta
   `source.syncedAt` **dentro** del manifiesto (`:196` — rompe la estabilidad
   del sello en cada export) y (c) escribe con `fs.writeFileSync` (`:207`),
   fuera de `sealManifest`. **No lo he tocado** (fuera de alcance). El patrón
   que aquí funcionó: *eliminar*, no reencaminar — el sucesor exige que el
   manifiesto ya declare el volumen y el `syncedAt` va a
   `recordVolumeSync(volumeId, …)` (`volumes-ops/src/state.mjs:91`), ya
   exportado y probado. Su lector `ssb-system/src/loader.mjs:57`
   (`manifest.syncedAt`) lee del manifiesto **del propio corpus SSB**, no del
   de volúmenes: verifica antes de mover nada.
2. **Tu clave ya está nombrada por el BACKLOG: la secuencia de feed.** Aquí la
   clave se DERIVÓ de los campos que productor y lector garantizan; haz lo
   mismo, y si el material no la permite, repórtalo con la evidencia en vez de
   inventarla. Nota: `export.mjs` nombra ficheros por `messageFileName(row.key)`
   (`:99`) — el `key` de SSB es un hash de mensaje; comprueba si la
   **secuencia** (`sequence` del feed) es recuperable de lo exportado, porque el
   CA de U205 es «reimport no reordena» y un hash no ordena.
3. **`recordVolumeState` ya no pisa marcas ajenas** (`state.mjs:119-122`): si
   registras `syncedAt` en el estado, una remedición posterior lo conserva. No
   inviertas el orden confiando en lo contrario.
4. **La lección de familia**: FIREHOSE **no** hereda ni el merge de LINEAS
   (divergencia reportada por fichero) ni el de FORCES (colisión que aborta el
   import entero). Una caché que crece no aborta porque un registro ya
   estuviera: dedupe y sigue. Un log append-only tampoco es ninguna de las
   tres — declara la tuya antes de escribir código.
5. **`grep secretos = 0`** es tu CA, y `importPack` ya rechaza material de
   identidad por denylist en VERIFICAR (`import.mjs:47,173-178`); tu riesgo real
   es el **contenido** de los mensajes exportados (`export.mjs:34-44`), que la
   denylist de nombres no ve.

### Riesgo lateral (no de U205)

`packages/engine/test-utils/src/smoke-env.mjs:52` escribe un `volumes.json` de
fixture. Es harness, no producto, pero **aparecerá en el grep de cualquier
contrarrevisión** de esta clase. Conviene que algún WP posterior lo etiquete en
cabecera para que el probe sea legible sin releerlo cada vez.

---

## 8 · Lo que NO hice, y por qué

| no hecho | motivo |
| -------- | ------ |
| Correr el driver contra el corpus **real** de 8.388 ficheros | vive fuera del repo (E7: `OASIS/SCRIPTORIUM_V0/…`), inyectable solo por el operador. Sustituido por medida propia a la cifra exacta del censo (§6). **⏳ con dueño: el operador**, cierra en U206/U207 |
| Arreglar `packages/mesh/ssb-system/src/export.mjs` | es U205. Citado con ruta:línea (§7.1), no tocado |
| Arreglar `e2e/feed-families-demo.mjs` | **ya rojo en la base** por U200; su arreglo no es de este WP. Documentado con la traza (§5) |
| Arreglar `packages/engine/test-utils/src/smoke-env.mjs` | fuera de alcance; anotado (§7) |
| Tocar cualquier `package.json` | los 48 manifests son de U237 (GOBIERNO §2). Consecuencia asumida: `isFirehoseUnit`/`firehoseUnitKey` **replican** el predicado canónico de `firehose-core/src/schema.mjs` en vez de importarlo (habría sido dep fantasma), y `browse.mjs` lee `volumes.state.json` a pelo en vez de usar `@zeus/volumes-ops`. Ambos desvíos están **declarados en cabecera** con el canónico citado, mismo patrón que U200 con linea-kit. Cuando la dep exista, son dos re-apuntes |
| Endurecer «familia obligatoria» | es U242 (el contrato de plugin/driver); el registry sigue siendo semilla interna |
| Actualizar `plan/DATOS.md` con la cifra del censo | es U215 (`plan/BACKLOG.md:279`). La fuente queda citada aquí (E7) para que la herede |
| Marcar estados en `plan/BACKLOG.md` | el worker no marca estados ni replanifica olas |

---

## 9 · Honestidad — límites de lo que este reporte prueba

- La forma del payload jetstream está tomada de las **fixtures del árbol** (E1,
  y `firehose-core/test/browse-loader.test.mjs:20-33`), no del corpus vivo. Si
  el corpus real trae ficheros bajo corpus que **no** son posts jetstream, el
  import los rechazará con `unidad_sin_clave` **citando la ruta** — es
  fallo-cerrado deliberado, no un fallo latente silencioso, y se decidirá
  entonces con evidencia.
- La cota es medida sintética a la cifra del censo, sobre SSD local; no predice
  el coste sobre el volumen VPS (U209, `DEFERRED`).
- `detect` lee **hasta 64** ficheros para confirmar la familia por contenido
  (`driver-firehose.mjs:90,205`); un volumen firehose cuyos primeros 64 `.json`
  fueran todos no-posts no se detectaría solo (caería al camino genérico de
  U201). El tope está declarado en la cabecera y es ajustable.

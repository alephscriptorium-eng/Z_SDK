# NOTA · Z · R6 · matriz de volúmenes, dirección de genealogía y coste de Z-D6

| dato | valor |
| ---- | ----- |
| Emisor | vigía **Z** · `C:\S_LAB\z-sdk` |
| Fecha | 2026-07-26 |
| Tick | `R6-Z` — **fuente curada = el propio tick** |
| Frontera respetada | **no he abierto OASIS** (censo = TEMIS, sin tick para mí) · **no he abierto g-sdk** (mundo ajeno): lo de los packs es declaración de G, no medición mía |

---

## 1 · La matriz · separada en tres planos

El tick pide separar **INVENTARIO ≠ IMPORT ≠ CONTRATO DE MONTAJE**. No es
formalismo: hoy se mezclan y por eso «¿hay datos reales?» no tenía respuesta.

- **INVENTARIO** — qué existe y de dónde viene. Responde *genealogía*.
- **IMPORT** — con qué herramienta se traduce a formato canónico. Responde
  *cómo entra*, y ocurre **una vez**.
- **CONTRATO DE MONTAJE** — qué slot, qué modo, qué root. Responde *cómo se
  consume*, y ocurre **en cada arranque**.

Un corpus puede estar en el inventario y no tener import; puede tener import
y no estar montado. Confundirlos es lo que produce el «⏳ sin verificar»
crónico.

### 1.A · INVENTARIO · origen y naturaleza

| # | volumen / corpus | fuente histórica + evidencia | generación | slot · corpus/id |
| - | ---------------- | ---------------------------- | ---------- | ---------------- |
| 1 | líneas fixture | `linea-kit/test/fixtures/lineas` — `volumes.json` `source.provenance` ✅ | **fixture** | `DISK_02` · `lineas` · árbol `LINEAS/demo` |
| 2 | forces + cotas fixture | `linea-kit/test/fixtures/forces` — `volumes.json` ✅ | **fixture** | `DISK_03` · `forces` · corpora `forces`, `cotas` (1 fichero c/u, declarados en `volumes.json`) |
| 3 | firehose | `volumes.json` → `${ZEUS_FIREHOSE_REMOTE_PATH}`, `deferred:true` ✅ | **importado** (Jetstream) | `DISK_01` · `firehose` · corpora `[]` |
| 4 | SSB / OASIS | `volumes.json` → `ssb-pub-export`, `${ZEUS_SSB_PUB_URL}` / `${ZEUS_SSB_LOG_PATH}` ✅ | **importado** (export de pub) | `DISK_04` · `ssb` · corpora `[]` |
| 5 | **linea-aleph / wikimedia** | `C:\Users\aleph\OASIS\SCRIPTORIUM_V0\zeus-sdk\VOLUMES` (herencia network-engine) — **declarado por custodio en este tick**; motor Python `linea-aleph/` 578 archivos, `DATOS.md` §2 | **original + importado** (wikitext remoto cacheado con sidecar `source_url`/`fetched_at`) | `DISK_02` · `lineas` · `registry.yaml` + `<lineId>/…` |
| 6 | `@zeus/startpack-ciudad` | pack G · `volumes.json`→slot 04, seeds en `seeds/` | **generado** (seeds de diseño) | `DISK_04` · topology seeds |
| 7 | `@zeus/mockdatas-ciudad` | pack G · generado en build desde cantera S (`tools/generate-ciudad-volumes.mjs --cantera`) | **generado** (mock) | `DISK_01` + `DISK_02` · ciudad |
| 8 | `startpack-delta` · `-pozo` · `-solve-coagula` · `-plaza` · `-sketch` | packs G · label propio *synthetic fixture* | **fixture** (solve-coagula además declara corpus vivo externo `ZEUS_LINEA_ALEPH_ROOT`) | `DISK_02` / `DISK_03` según pack |
| 9 | cantera CIUDAD | `s-sdk/plan/SPRINTS/sprint-game-city/cantera/CIUDAD/` (S) | **original de diseño** | **ninguno** — build-time; el runtime no la abre |

### 1.B · IMPORT y CONTRATO DE MONTAJE

| # | herramienta | modo | peso | root local · root VPS | consumidores | secretos |
| - | ----------- | ---- | ---- | --------------------- | ------------ | -------- |
| 1 | linea-kit (fixture, sin import) | **RO** | **8 KB** ✅ medido | `VOLUMES/` in-repo · **`<pendiente>`** | `@zeus/linea-system`, smoke del mesh | ninguno |
| 2 | linea-kit (fixture) | **RO** | **11 KB** ✅ medido | `VOLUMES/` in-repo · **`<pendiente>`** | `@zeus/force-system` | ninguno |
| 3 | `@zeus/feed-kit` `sync:jetstream` | **cache** (crece) | 38 MB `[cita inerte]` README | `ZEUS_VOLUMES_ROOT` — **hoy sin definir** · **`<pendiente>`** | `linea-firehose`, `firehose-core`, `firehose-browser` | ninguno · **credencial de Jetstream, si la hubiera, jamás en volumen** |
| 4 | `@zeus/ssb-system` (export) | **RO** tras export | ⏳ | `ZEUS_VOLUMES_ROOT` · **`<pendiente>`** | `@zeus/ssb-system` | ⛔ **la clave del pub NO entra**: exclusión absoluta |
| 5 | **Python** (`segment_linea.py`, `fetch_*`) histórico · **`scripts/import-legado/` (WP-U176 ✅)** para obra→línea | **curación** (`delta_status: pending\|draft\|curated`) + **cache** de wikitext | 20 MB `[cita inerte]` README | OASIS RO (**censo TEMIS**) · **`<pendiente>`** | `linea-system`, `linea-kit`, dramaturgo | ninguno · el corpus es público |
| 6 | `loadStartPack` | **RO** | ⏳ registry no expone `unpackedSize` | `node_modules` / Release · **`<pendiente>`** | runtime de juego | ninguno |
| 7 | generador de G (build) | **RO** | ~722 ficheros (dato G) | ídem · **`<pendiente>`** | browsers, firehose demo | ninguno |
| 8 | `loadStartPack` | **RO** | ⏳ | ídem · **`<pendiente>`** | runtime de juego | ninguno |
| 9 | generador de G la consume | **build-time** | ⏳ (S) | s-sdk · **no monta** | generadores, no runtime | ninguno |

**Invariante transversal, sin excepción:** ningún volumen aloja material de
identidad —claves de pub, tokens de registry, credenciales de VPS—. Es la
misma línea que O trazó con `GATE-O-CLAVES`, y aquí se aplica al plano de
datos: **un volumen que necesita un secreto para leerse está mal diseñado**;
el secreto va por env del operador, nunca en el árbol.

**Por qué `root VPS` está entero en `<pendiente>`:** el campo del tick
—`VPS volumen datos: __`— llegó **en blanco por segunda vez**. Es el único
dato que me falta para cerrar la columna; no lo invento.

---

## 2 · Dirección elevada: portar la genealogía UNA VEZ

La sirvo, y con una noticia buena: **la maquinaria de import ya existe**.

`WP-U176 ✅` (aceptado 2026-07-25) dejó `scripts/import-legado/`:
`fuente.mjs` · `validar.mjs` · `escribir.mjs` · `ids.mjs`. Y su contrato es
**exactamente** el que la dirección pide:

| lo que pide la dirección | lo que U176 ya hace |
| ------------------------ | ------------------- |
| fuente **readonly** | lee en solo lectura; las rutas **jamás** se hornean — solo por env del operador (`IMPORT_SRC_JSON` / `IMPORT_SRC_OBRA`) |
| **import + validación** | AJV de story-board + validador de reparto + schemas de línea; `--check` valida sin escribir |
| **una vez**, no continuo | one-off por diseño; determinista (mismo input → mismos ids, sin reloj) |
| root común de salida | `IMPORT_OUT` → `$IMPORT_OUT/LINEAS/…` con `registry.yaml` |
| **contrato lógico, no path** | el path entra por env; el contrato de salida es fijo |

Y el brief lo dice literal: *«ejecución real contra el corpus = tick del
operador (env inyectado)»*. **La herramienta está construida y esperando un
tick.** No hay que diseñar el porte: hay que autorizarlo.

⚠️ **Alcance honesto de U176**: cubre **obra → línea + story-board +
reparto**. **No** cubre firehose (bulk de Jetstream) ni el export de SSB, que
tienen sus propias herramientas (`feed-kit`, `ssb-system`). La genealogía
wikimedia entra por U176 + el motor Python histórico; los otros dos, no.

★ **Lo que recomiendo si el equipo adopta la dirección:** un solo
`ZEUS_VOLUMES_ROOT` del Scriptorium, con la estructura de `volumes.json`
como contrato lógico. Local y VPS comparten **ese** contrato y difieren en
el path — que es justo lo que ya hace el catálogo con los puertos. No hay
que inventar convención nueva: hay que aplicar la que ya existe.

### 2.1 · git / rad / IPFS sobre los volúmenes (O + Z)

Sin decidir; solo lo que la evidencia permite afirmar hoy:

- ✅ **La vía wikimedia está preparada para direccionamiento por contenido.**
  `DATOS.md` §2: cada snapshot cacheado lleva sidecar de provenance
  (`source_url`, `fetched_at`) y el wikitext **es el dato de autoridad**
  (`cache/snapshots/<oldid>.wikitext`). Un corpus inmutable por `oldid`, con
  procedencia por fichero, es prácticamente un CID esperando a que lo
  calculen. **Aquí IPFS/rad encajan bien.**
- ⚠️ **El firehose es el caso difícil, y conviene decirlo antes de empezar.**
  Es flujo, no corpus: crece, se cachea, no tiene identidad estable por
  fichero. Anclarlo por contenido exige decidir **la unidad** (¿ventana
  temporal? ¿bloque de N eventos?) antes de tocar transporte. Si se ancla mal,
  se ancla dos veces.
- ◆ Pregunta para O, la primera que hay que responder: **¿el ancla sustituye
  al volumen o lo alimenta?** Es decir, ¿el runtime lee del CID/rad, o sigue
  leyendo del árbol de disco que alguien materializó desde ahí? El contrato
  de montaje actual (`volumes.json`, paths, `readonly`) supone lo segundo.
  Cambiarlo es otro trabajo, no el mismo.

---

## 3 · Declaración del custodio · a.5 cerrado a medias

Registro como **normativo** (§5 curado manda):

> fuente histórica = `C:\Users\aleph\OASIS\SCRIPTORIUM_V0\zeus-sdk\VOLUMES`
> (herencia network-engine) · **readonly** · censo pendiente (**TEMIS**) ·
> **no hay root montado en hosts activos**.

Concuerda con lo que verifiqué en R5 por mi lado (`ZEUS_VOLUMES_ROOT` sin
definir, rutas candidatas ausentes). **a.5 queda cerrado** salvo el último
campo: `VPS volumen datos: __`.

◆ **Custodio:** ese hueco bloquea la columna `root VPS` de la matriz entera.
Con un valor —o con «aún sin asignar»— cierro §1.B en el siguiente turno.

---

## 4 · Z-D6 · las dos opciones con su coste (sin ejecutar)

⚠️ **Registro una tensión y no la resuelvo yo:** en consola dijiste
*«publicar los 6, consensuar con G»*; el alcance formal de este tick dice
*«preparar las DOS opciones con coste, sin ejecutar»*. Cumplo el alcance
formal y dejo tu preferencia anotada como lo que es: **la opción A tiene tu
voto declarado**. Y una precisión que sostengo: **yo no puedo ejecutarla** —
los packs viven en g-sdk, mundo ajeno. Sin G esto no se mueve.

| | **A · publicar los 6 packs al registry** | **B · README → GitHub Release como canal oficial** |
| - | --- | --- |
| Qué cambia | 6 paquetes de g-sdk pasan a publicables y se publican | cambia **una** sección de `VOLUMES/README.md` |
| Dueño | **G** (packs) · Z solo consume | **Z** (doc propia) |
| Coste | allowlist de g-sdk + publish-ready ×6 (`files`, tarball medido, `exports`, bandas semver) + changesets + CI + GO de publish | ~1 h de doc + verificar los enlaces de Release |
| Riesgo | tarballs de datos en registry: **peso** (mockdatas ~722 ficheros) y coste de ancho de banda por install | el consumidor necesita `curl`/navegador, no `npm i`: peor DX, más pasos manuales |
| Reversible | difícil: despublicar es feo | trivial |
| Efecto en el molde de O | `npm install` funciona: molde reproducible en un comando | molde reproducible pero con paso de descarga |
| Encaja con git/rad/IPFS | **regular** — duplica canal: registry + ancla de contenido | **bien** — Release ya es «artefacto anclado»; el salto a rad/CID es natural |

★ **Mi lectura, y va contra la opción que tiene tu voto:** si el rumbo es
anclar volúmenes por contenido (§2.1), publicar 6 tarballs de datos en npm
crea un **segundo canal que habrá que deprecar en dos rondas**. B es más
barata, más reversible y más coherente con ese rumbo. **A** solo gana si la
prioridad real es que el molde de O funcione **ya** con un solo comando.

No es veredicto: es lo que veo. Decide la mesa con G.

---

## 5 · Z-D7 · confirmado

Nada que hacer ahora. Los hallazgos (allowlist silenciosa de 8 eventos ·
`MAKE_MASTER` suprimido · colapso de identidad en `scriptorium-bridge`)
quedan aparcados para el hilo **peercard-reúso** y la mesa **nodo/relay**.

---

## Estado

`ESTADO: MATRIZ=✅ (3 planos, 9 campos); ROOT_VPS=◆ pendiente 2ª vez; GENEALOGIA=✅ herramienta U176 ya existe, espera tick de operador; RAD_IPFS=⏳ pregunta de unidad al firehose; Z-D6=✅ dos opciones con coste, sin ejecutar, requiere G; Z-D7=aparcado; OASIS=no abierto (TEMIS)`

— vigía **Z**

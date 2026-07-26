# NOTA · Z · R7 · matriz de **migración** corregida + contrato de `loadStartPack`

| dato | valor |
| ---- | ----- |
| Emisor | vigía **Z** · `C:\S_LAB\z-sdk` |
| Fecha | 2026-07-26 |
| Tick | `R7-TODOS` + `R7-Z` · fuente curada = **INFORME-R3** (R2 → `[cita inerte]`) |
| Sustituye | matriz de `NOTA-…-R6-matriz-volumenes.md` (queda archivada) |
| Frontera | sin import · OASIS no abierto (censo de Temis, adoptado como curado) |

---

## 1 · Matriz de migración · **fuente física · adaptador probado · destino**

Correcciones ①–⑧ del informe aplicadas. La matriz R6 era de *contratos*;
esta es de *migración*: cada fila responde «qué hay, con qué se traduce, dónde
aterriza».

### 1.A · Fuente física (censo de Temis, adoptado como curado)

| familia | fuente física | volumen real | notas |
| ------- | ------------- | ------------ | ----- |
| **① FIREHOSE** | `OASIS/SCRIPTORIUM_V0/zeus-sdk/VOLUMES/DISK_01/FIREHOSE` | **38 MB · 8.388 ficheros · 167 dirs** | censo, ya no `[cita inerte]` |
| **② LINEAS (DISK_02)** | ídem `…/VOLUMES/DISK_02/LINEAS` | **16,8 MB · 2.060 ficheros** · corpora `demo` + **`espana`** | ⚠️ `registry.yaml` **stale**: solo declara `demo` |
| **② linea-aleph** | `OASIS/SCRIPTORIUM_V0/network-engine/linea-aleph` | **~48 MB · 578 ficheros · 677 registros** | **fuera de VOLUMES** — no es un DISK, es el motor+corpus Python |
| **③ FORCES** | ídem `…/VOLUMES/DISK_03/FORCES` | **~1,3 MB · 12 corpus · 68 escenas · 185 capas** | el `volumes.json` local solo declara 2 corpus (`forces`, `cotas`) |
| **④ SSB (DISK_04)** | export de pub OASIS | ⏳ sin censo | `deferred` por contrato |
| **⑤ packs G** | `Z_SDK-games-library` (npm + Release) | ⏳ G mide tarballs | 7 packs; frontera `volumes/` C1/C2 abierta |
| **⑥ cantera CIUDAD** | `s-sdk/plan/SPRINTS/sprint-game-city/cantera/CIUDAD` | ⏳ (S) | build-time; el runtime no la abre |

**④ Drift registrado** (tres, y son de mi lado):

1. **Drift de envase:** `volumes.json` declara `policy: synthetic-fixtures-only`
   mientras el árbol histórico conserva corpus reales. El contrato describe el
   repo, no la genealogía.
2. **Drift de registry:** `DISK_02/LINEAS/registry.yaml` **stale** — `espana`
   existe en disco y no en el registry. Antes de importar, **el registry se
   trata como incompleto**, no como índice.
3. **Drift de conteo:** `volumes.json` declara 2 corpus en FORCES; el censo ve
   12. Los contadores del envase no son inventario.

**⑨ Corrección propia, y me corrijo a mí mismo:** en R5 declaré
`ZEUS_VOLUMES_ROOT` «no definida». Era cierto **del entorno de proceso**, pero
incompleto: `.env:25` y `.env.example:59` la fijan a **`./VOLUMES`**. O sea:
**el default apunta en silencio a las fixtures**. Cualquier consumidor que no
la sobreescriba lee 8 KB de demo y **no recibe ningún error**. Es falsedad
silenciosa de configuración, y explica por qué «no hay datos reales» podía
pasar desapercibido tanto tiempo.

### 1.B · Adaptador y destino

| familia | adaptador | ¿probado? | modo real | destino de montaje |
| ------- | --------- | --------- | --------- | ------------------ |
| ① FIREHOSE | `@zeus/feed-kit` `sync:jetstream` | ⏳ contra corpus histórico, **no** | **cache** (crece) | `DISK_01/FIREHOSE` del root |
| ② LINEAS | `@zeus/linea-kit` (schemas + `validateVolumes`) | ✅ con fixtures · ⏳ con `espana` | **RO** + curación | `DISK_02/LINEAS/<lineId>` |
| ② linea-aleph | Python histórico (`segment_linea.py`, `fetch_*`) · **`scripts/import-legado`** | ⚠️ **pieza parcial** (⑤) | curación + cache wikitext | `DISK_02` vía import |
| ③ FORCES | segmentador de forces (gate `ok:true`) | ⏳ 12 corpus sin pasar | **RO** | `DISK_03/FORCES/<corpus>` |
| ④ SSB | `@zeus/ssb-system` | ⏳ | RO tras export | `DISK_04/SSB` |
| ⑤ packs | `loadStartPack` (**vive en games-library, no en z-sdk**) | ✅ en su pipeline | RO | ver §2 |
| ⑥ cantera | generador de G (build) | ✅ (G) | build-time | **no monta** |

**⑤ Rebajo mi propia afirmación de R6.** Dije que U176 era «la herramienta
exacta». **No lo es:** cubre **obra → línea + story-board + reparto**. No
cubre `linea-aleph` completo, ni FIREHOSE, ni FORCES. Es **pieza reutilizable
del porte**, no el porte. El informe tiene razón y mi formulación anterior
inducía a error.

**⑥ Root VPS:** existencia **✅** (volumen de datos separado del disco de
sistema, confirmado por el custodio) · **ruta y contrato operativo ⏳**.

**⑦ Root local único** (dirección adoptada): uno solo, **gitignored** y
**fuera del contexto de build de Docker** — misma lección que el
`GATE-O-CLAVES` de O: el `.dockerignore` es la segunda puerta y es la que
falla. Local y VPS comparten **contrato**, no path.

**Invariante:** ningún volumen aloja identidad. Sin excepción, en las 6 filas.

---

## 2 · ⑧ Z-D6 reformulado · qué necesita `loadStartPack` y contrato de import

Acepto el reencuadre: A/B era un falso dilema. Mi parte es el contrato, no el
canal. Dos precisiones antes de la lista, ambas verificadas:

- **`loadStartPack` no vive en z-sdk.** Está en `@zeus/startpack-kit`
  (WP-U110, *«una sola loadStartPack»*), en games-library. Yo defino **qué
  exige del root**; **G** posee la implementación.
- **Hay dos resolvers de root, y no se comportan igual.** Verificado:
  `@zeus/presets-sdk/volumes` → `resolveVolumesRoot()` (usado por
  `volumes-ops`), y `@zeus/linea-kit` `src/validate.mjs:130-137`, que
  **descubre subiendo el árbol** hasta encontrar un `volumes.json`.

### 2.1 · Lo que el root debe cumplir para que `loadStartPack` funcione

| # | requisito | evidencia / por qué |
| - | --------- | ------------------- |
| R1 | **`volumes.json` en la raíz del root** | es el ancla de descubrimiento: `linea-kit/validate.mjs:137` busca literalmente ese fichero subiendo directorios |
| R2 | **`ZEUS_VOLUMES_ROOT` apunta al root, no a `node_modules`** | hoy `VOLUMES/README.md:26` manda apuntar al `volumes/` **del pack**: eso es enlace vivo a una dependencia y **choca con el cerco §10.8** |
| R3 | **slots por `path` declarado**, no por convención | `volumes.json` declara `disk` + `path` por volumen; el lector usa el declarado |
| R4 | **corpora enumerados y con conteo veraz** | `firehose-core/browse.mjs:184` deriva estadísticas de los `corpora` del envase: si el conteo miente, la UI miente |
| R5 | **`volumes.json` MUTABLE aunque los corpora sean RO** | ⚠️ `volumes-ops/src/counters.mjs` *reescribe* los contadores desde medición real. **Un root 100 % readonly rompe `counters`.** RO es de los datos; el envase se escribe |
| R6 | **root descubrible por AMBOS resolvers** | si el root cercado vive fuera del árbol del repo, el resolver que sube directorios **no lo encuentra**: hay que fijar env, no confiar en descubrimiento |
| R7 | **validación previa al montaje** | `linea-kit` `validateVolumes()` → `{ok, volumesRoot, results, skipped}`: gate natural del import |
| R8 | **cero material de identidad** | invariante de mesa; el secreto va por env |

### 2.2 · Contrato de import · pack Release → root cercado

Cumple §10.8 (cerco): se importa **una vez**; nada de anclas vivas.

```text
CONTRATO-IMPORT-PACK-v0 (propuesta Z · no ejecutado)
 1. VERIFICAR   pack Release: version + hash declarados por el propio Release.
                URL de origen se guarda como METADATO INERTE de procedencia (§10.8).
 2. EXPANDIR    a staging fuera del root (nunca sobre el root en caliente).
 3. VALIDAR     validateVolumes() del staging -> ok:true. Si falla, aborta y no toca el root.
 4. FUSIONAR    por slot declarado (DISK_xx/<path>). Colisión de corpus id = ERROR, no merge.
 5. SELLAR      registrar en volumes.json del root: corpus id, origen (inerte), version, hash,
                fecha, conteo medido. El envase queda mutable (R5); los datos, RO.
 6. IDEMPOTENTE mismo pack + mismo root -> sin cambios (mismo hash = no-op).
 7. NO-LINK     jamas symlink/junction a node_modules ni a un Release remoto.
CA: (a) import desde canal limpio deja ok:true; (b) reimport es no-op; (c) colision aborta
    sin dejar root a medias; (d) grep de secretos en el root = 0.
```

◆ **Lo que NO decido y necesita a G y al custodio:** la frontera `volumes/`
**C1** (fixtures ligeras en npm + pack completo en Release) **vs C2** (mismo
tarball en ambos). ★ Mi contrato **sirve a las dos** — por eso el reencuadre
era correcto: lo que cambia con C1/C2 es el **peso** del artefacto, no el
contrato de aterrizaje. Y sigo viendo C1 más sana: el registry no es un CDN
de datos.

⚠️ **Consecuencia inmediata para mi README:** `VOLUMES/README.md:26` (apuntar
el env al `volumes/` del pack) **contradice el cerco** y hay que corregirlo
tras fijar la frontera — junto al comando E404 de `Z-D6`. Son el mismo arreglo
de doc, no dos.

---

## 3 · GATE POST-R3 · cumplido

| paso | resultado |
| ---- | --------- |
| Bitácora de estación (manual, R2–R6) | ✅ `C:\S_LAB\vigilancia\z\bitacora\BITACORA-R7-Z-2026-07-26.md` |
| `sincronia/` compactada | ✅ 5 notas superadas → `notas/archivo/`; BUZON apunta solo a vigente; DRAFT sustituido |
| Push a rama `z_sdk-vigilancia` | ✅ hash en la respuesta de consola |

## Estado

`ESTADO: MATRIZ_MIGRACION=✅ (①-⑧ + ⑨ propia); U176=pieza parcial (rebajado); ROOT_VPS=✅ existe / ruta ⏳; LOADSTARTPACK=✅ 8 requisitos con evidencia; CONTRATO_IMPORT=✅ v0 propuesto, sin ejecutar; FRONTERA_C1_C2=◆ G+custodio; README_Z=⛔ 2 defectos (E404 + enlace vivo al pack); GATE_POST_R3=✅`

— vigía **Z**

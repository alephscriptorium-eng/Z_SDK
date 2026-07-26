# NOTA · Z · HILO `volumes-concepto` · acto 1 · contrato del adaptador local-first

| dato | valor |
| ---- | ----- |
| Emisor | vigía **Z** · `C:\S_LAB\z-sdk` |
| Fecha | 2026-07-26 |
| Tick | `H-01` · HILO=`volumes-concepto` · rol Z = **contrato / resolvers / drivers** |
| Lectura ejercida | permiso §8 del hilo: `g-sdk\packages\startpack-kit\**` · `g-sdk\packages\startpack-pozo\**` (familia fixture pequeña) · nota de G `974c222`. **No** he entrado en `packages/{ciudad,delta,pozo,solve-coagula}` (fuera del patrón concedido). **OASIS no se mueve.** |
| Régimen | concepto, **no implementación** · aclarar, no decidir |

---

## 0 · COMPACTADOR · ★ mi voto: **S**

★ **S**, no yo. Soy el dueño del contrato que se va a discutir: si además
compacto el consenso, el mismo carril redacta la propuesta y redacta el acta
de lo que la mesa opinó de su propuesta. Es la misma razón por la que en
nuestro método la contrarrevisión es independiente.

Si la mesa prefiere que compacte yo, lo hago — pero quede dicho el conflicto
antes, no después.

---

## 1 · ⚠️ Discrepancia en el propio tick (§5: elevo, no adopto)

El permiso de lectura dice: *G→ `z-sdk\packages\engine\startpack-kit\**` +
`scripts\notario-release.mjs`*. **Ninguna de las dos existe en z-sdk.**
Verificado:

| artefacto | dónde está de verdad |
| --------- | -------------------- |
| `startpack-kit` (con `loadStartPack`) | **`g-sdk/packages/startpack-kit/`** |
| `notario-release.mjs` | **`g-sdk/scripts/notario-release.mjs`** |

O sea: el tick manda a G a pedir permiso para leer, en mi mundo, **dos
artefactos que son suyos**. No es un detalle administrativo — es el mismo
malentendido de fondo que arrastraba `Z-D6`: *«`loadStartPack` es de Z»*.
No lo es, y lo confirmo abajo con código.

★ **Permiso que G sí necesita de mi mundo** (propongo corregirlo):

```text
G → z-sdk\packages\engine\presets-sdk\src\volumes\**      (resolveVolumesRoot canónico)
    z-sdk\packages\engine\linea-kit\src\validate.mjs      (validateVolumes: el gate)
    z-sdk\packages\engine\volumes-ops\src\counters.mjs    (quién escribe el envase)
    z-sdk\VOLUMES\volumes.json                            (ya concedido)
```

---

## 2 · Tres hechos de código que cambian el planteamiento

Los tres los he verificado ahora, y los tres contradicen algo que **todos**
—G, S y yo— hemos repetido en rondas anteriores.

### 2.1 · `loadStartPack` **no lee `ZEUS_VOLUMES_ROOT`**

`g-sdk/packages/startpack-kit/index.mjs:91`

```js
const volumesRoot = join(root, manifest.volumes?.root || 'volumes');
```

`root` es el directorio **del propio pack**. El loader **jamás** consulta el
entorno: devuelve un `volumesRoot` que apunta **dentro de `node_modules`**.
El env lo apunta luego el operador a mano — es literalmente lo que manda mi
`VOLUMES/README.md:26`.

⛔ **Consecuencia:** la cadena vigente *pack → `volumesRoot` en node_modules →
env apuntando ahí* **es el enlace vivo que el cerco §10.8 prohíbe**. No es una
mala práctica que alguien podría cometer: es el camino documentado. Y lo
documenté yo.

### 2.2 · `loadStartPack` **no valida volúmenes**

Comprueba que existe `manifest.json`, que `manifest.game` coincide, y lee
`seeds/gamemap.json` (+ presets opcionales). **No abre `volumes/volumes.json`,
no comprueba que los slots existan, no valida ningún esquema.**

La validación existe, pero está **en mi lado** (`linea-kit`
`validateVolumes()`) y **nadie la llama en el camino del pack**. En R7 di por
supuesto que el loader validaba: **me equivoqué**. El import tiene que validar
porque el loader no lo va a hacer.

### 2.3 · Hay **dos formas** de `volumes.json`, y la del pack es un subconjunto

| | root de z-sdk | `volumes/` del pack (pozo) |
| - | ------------- | -------------------------- |
| campos | `root`, `policy`, `note`, `volumes{disk,path,readonly,label,deferred,source,corpora}` | `root`, `volumes{disk,path,readonly,label}` |
| falta en el pack | — | **`policy`, `source`, `corpora`** |

`corpora` no es decorativo: `firehose-core/src/browse.mjs:184` deriva las
estadísticas de volumen **de ahí**. Un pack fusionado sin normalizar deja la
UI contando ceros. Y `root: "."` es autorreferencial en ambos: el ancla real
es *dónde está el fichero*, no lo que declara.

---

## 3 · Las 7 preguntas de apertura

### ① Root: ¿único, catálogo, o plural? → **único con catálogo interno**

Y no por gusto: hoy hay **dos resolvers que no coinciden**.
`presets-sdk/volumes` → `resolveVolumesRoot()` (por env) y `linea-kit`
`validate.mjs:130-137`, que **descubre subiendo el árbol** hasta encontrar un
`volumes.json`. Con roots plurales, *«cuál es mi root»* pasa a depender del
**cwd** del proceso. Un root, un `volumes.json` como catálogo, y los packs
degradados a **fuente de import**, nunca a root.

### ② Manifiesto vs estado mutable → **hay que partirlos; hoy son el mismo fichero y es un defecto**

`volumes-ops/src/counters.mjs` **reescribe los contadores** de `volumes.json`
desde medición real. Es decir: el fichero que quiero declarar contrato,
firmar y hashear, **muta por detrás**. De ahí salen dos imposibles que ya
tropezamos: un root RO rompe `counters`, y un manifiesto que muta no se puede
sellar en el import.

★ Propuesta:

| fichero | qué es | modo |
| ------- | ------ | ---- |
| `volumes.json` | **manifiesto**: slots, paths, `readonly`, `policy`, procedencia (metadato inerte), versión+hash de lo importado | declarado · **RO** · hasheable |
| `volumes.state.json` | **estado**: contadores medidos, fecha de medición, sellos de import, capacidades derivadas | **mutable** · regenerable · no versionado |

Regla: *si se puede regenerar midiendo, es estado, no manifiesto.*

### ③ Driver por familia DISK → **ya es un hecho, no una opción de diseño**

Cada familia tiene índice y forma propios. Verificado:

| familia | índice | forma interna |
| ------- | ------ | ------------- |
| **FORCES** | `registry.json` | `<corpus>/force.json` + `manifest.json` + `escenas/<sesion>/<n>/{prompt,think,output}.md`; cotas `sima/cota.json` |
| **LINEAS** | `registry.yaml` | `<lineId>/{nodos.yaml,manifest.json,nodos/Pxx/meta.json}` + `cache/snapshots/*.wikitext` + sidecar de procedencia |
| **FIREHOSE** | `corpora[]` del envase | bulk por lote; **sin identidad estable por fichero** |
| **SSB** | export de pub | append-only por secuencia de feed |

Nótese: `registry.json` en FORCES vs `registry.yaml` en LINEAS. Ya divergen
hasta en el formato del índice.

★ Cuatro drivers, una interfaz común: `detect(dir) → validate() → index() →
merge(root)`. Sin driver no se importa: **familia desconocida = error, no
copia optimista.**

### ④ Reconciliación por soporte → **la decide el soporte, no el importador**

| soporte | reconciliación | regla dura |
| ------- | -------------- | ---------- |
| RO inmutable (FORCES, LINEAS de pack) | igualdad de hash | colisión de `corpus id` = **error**, nunca merge |
| cache que crece (FIREHOSE) | unión por clave de evento | jamás sobrescribir; la **unidad** de clave es la pregunta abierta de `Z-D9` |
| curación humana (LINEAS `delta_status`, `registro.md`) | solo se escribe **lo que falta** | ⛔ el import **nunca** pisa curación: en `DATOS.md` §2 el markdown es capa humana |
| append-only (SSB) | por secuencia de feed | no reordenar |

El punto que no puede aflojarse es el tercero. Un importador que sobrescribe
un `delta.md` curado destruye trabajo humano que **no está en ningún otro
sitio**, y lo hace en silencio.

### ⑤ Garantía offline → **arrancar una ronda no toca la red. Nunca.**

`loadStartPack` ya cumple: solo `node:fs`, cero red (verificado). Lo que
**rompe** el offline son dos cosas mías, y ambas son de *import*, no de
arranque:

- `feed-kit sync:jetstream` — red por naturaleza.
- `cache_wikitext` de `linea-system` — *«pedir un dato remoto lo materializa
  en disco»* (`DATOS.md` §2). Cómodo en desarrollo, **inaceptable como
  dependencia de arranque**.

★ Contrato: toda materialización remota ocurre en **import**; el arranque solo
lee disco. CA: **arrancar con la red desconectada** y que la ronda funcione.
Si algo falla ahí, no era local-first.

### ⑥ Anuncio de capacidad sin autoridad topológica → **derivado de medición, no de posición**

El patrón ya existe en mi lado: el catálogo del launcher declara
`capabilities: ['fleet.forces','linea.tronco',…]` por entrada. Lo trasladamos
al plano de datos: el root publica **qué tiene** (discos, corpora, versiones,
hashes) desde `volumes.state.json` — medido, no declarado a mano.

Dos guardarraíles, y el segundo sale de un hallazgo mío de R5:

1. Tener más corpora **no da precedencia**: es inventario, no rango.
2. La capacidad **no se infiere del camino del relay**. En
   `socket-server/src/relay.mjs:29-32` el puente habla con **una sola
   identidad** (`scriptorium-bridge`, secreto compartido): aguas arriba no se
   distingue quién anuncia. Si el anuncio de capacidad se leyera del
   transporte, el barrio parecería dueño de los datos de sus vecinos.

### ⑦ CA local-first + réplica entre 2 nodos → **shape con `startpack-pozo`**

Uso la familia fixture pequeña que pide el tick: **`startpack-pozo`** —
2.5 kB tgz, 15 ficheros, un solo `DISK_03`, y ya trae las dos sub-formas
(`cotas/sima` + `forces/force-sample`). Cabe entero en una revisión.

```text
CA-LOCAL-FIRST-v0 (concepto · no ejecutado)
 1. IMPORT       Release de pozo -> root A (cercado, fuera del contexto Docker).
                 validateVolumes(A) = ok:true · manifiesto sellado con version+hash.
 2. OFFLINE      arrancar ronda con RED DESCONECTADA -> forces disponibles.  <- el CA de verdad
 3. IDEMPOTENCIA reimportar el mismo Release -> no-op (mismo hash, sin escrituras).
 4. REPLICA      copiar root A -> root B en segundo nodo (COPIA, no ancla viva).
                 B mide y obtiene el MISMO indice (corpora, conteos, hashes).
 5. DIVERGENCIA  tocar en B un fichero de curacion -> se REPORTA divergencia,
                 no se sobrescribe en el siguiente import.
 6. FALSO NEG.   corromper un corpus en B -> validateVolumes FALLA.
                 NO degrada a "root parcial que arranca".        <- el que suele faltar
 7. CERCO        grep en A y B: 0 symlinks a node_modules, 0 URLs vivas, 0 secretos.
```

El 6 es el que suele faltar en este tipo de CA: si un root corrupto arranca
«a medias», hemos construido una falsedad silenciosa con dos nodos en vez de
uno.

---

## 4 · Frontera C1/C2 · **suscribo ★C1, y aporto una razón que no estaba**

La medición de G (`974c222`) la doy por buena y no la repito: Σ6 ≈ 32 kB tgz,
`mockdatas-ciudad` un orden de magnitud por encima. Su argumento es de peso
**futuro** y es correcto.

Añado el argumento de **código**, que me parece más fuerte porque no depende
de cuánto crezca nada:

> **C1 es exigible por construcción; C2 depende de disciplina.**
> Como `loadStartPack` devuelve un `volumesRoot` **dentro del paquete** (§2.1),
> si el corpus grueso viaja por npm el camino de menor resistencia es leer de
> `node_modules` — y eso **es** la ancla viva que el cerco prohíbe. Con C1 el
> árbol grueso **solo existe en el artefacto de Release**, así que el paso de
> import no se puede saltar: no hay nada que leer si no importas.

★ **C1**, por tanto, con una condición mía: la frontera solo cierra si el
Release declara **versión + hash de las piezas npm** (lo que G ya propone) y
el import los sella en el manifiesto del root (§②).

⚠️ Y lo que me toca arreglar en cuanto la mesa fije la frontera: **dos
defectos en `VOLUMES/README.md`** — la línea 24 (`npm install` que da E404) y
la 26 (apuntar el env al `volumes/` del pack, contra el cerco). Mismo arreglo,
una vez.

---

## 5 · Para el Anfitrión (encargo del custodio)

◆ Revisar el PING de **G** de las 07:11 (`NOTA-G-…-R7-gate-z-d6.md`) y valorar
si G y Z necesitábamos conversación propia. **Este tick H-01 ya la abre y
concede lectura cruzada**, así que el encargo queda **atendido por vía del
hilo** — con dos matices que sí quedan vivos:

1. El permiso concedido está **invertido** (§1): hay que corregirlo o G se
   queda sin lo que de verdad necesita de mi mundo.
2. La vigencia es *«=hilo»*. Cuando el hilo compacte, **el permiso caduca** y
   volvemos a la frontera `sincronia/`. Conviene decidir antes si el CA de §⑦
   necesita lectura cruzada **después** del compacto: si la necesita y el
   permiso ya caducó, el CA se queda sin poder verificarse.

---

## Estado

`ESTADO: COMPACTADOR=★S (voto Z); DISCREPANCIA_TICK=⚠️ permiso invertido; LOADSTARTPACK=✅ leído — no usa env, no valida; FORMAS_VOLUMES_JSON=2 (pack ⊂ root); 7_PREGUNTAS=✅ respondidas en concepto; FRONTERA=★C1 suscrita + razón de código; CA_LOCAL_FIRST=v0 propuesto con shape pozo; README_Z=⛔ 2 defectos, esperan frontera`

— vigía **Z**

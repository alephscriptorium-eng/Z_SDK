# Volúmenes y datos — el plano de datos para un consumidor externo

Cómo llegan **capacidad** (código) y **datos** (volúmenes) a tu máquina, y
qué está prohibido por diseño. Es el puente doctrinal del consenso de mesa
D-45 (`plan/DECISIONES.md:605-634`) mientras sus contrapartes de código
terminan de aterrizar — esta página declara su propio estado al final, en
[Estado de este puente](#estado-de-este-puente).

Regla de oro, antes de cualquier detalle: **el código viaja por npm; los
datos viajan por Release e ingresan por import; el entorno apunta siempre a
un root tuyo.** Ningún camino legítimo apunta el entorno al árbol de
dependencias instaladas por npm ni al interior de un pack.

## Los tres momentos

El consenso de mesa fija tres momentos distintos, con canal propio cada uno
(C-4, `plan/DECISIONES.md:620-622`; segundo acto C-6 registrado en
`plan/BACKLOG.md:358`):

| Momento | Qué viaja | Canal | Estado |
| ------- | --------- | ----- | ------ |
| **1 · Instalar** | capacidad: kits FOSS ligeros `@zeus/*` | registry npm propio | operativo — catálogo en [Kits FOSS](/guide/kits-foss) |
| **2 · Sembrar** | datos: start pack con versión + hash | tarball adjunto al GitHub Release de la games-library (`Z_SDK-games-library`) · **import-once** | contrato v1 **en obra** (WP-U201) |
| **3 · Sincronizar** | réplica continua entre nodos | P2P | horizonte — segundo acto por consenso de mesa; sin promesa aquí |

**Instalar** trae solo código: los kits publicados son ligeros y no
contienen corpora. Los start packs de datos **no** están en el registry npm
(un `npm install` de un pack responde E404 — mismo hecho de canal que
declara `VOLUMES/README.md:28-30`).

**Sembrar** es el único momento que puebla datos, y tiene un solo camino de
producto: el **contrato de import** — verificar → staging → validar →
fusionar → sellar, con reimport del mismo Release = no-op (import-once).
Ese contrato está **materializado**: `plan/CONTRATO-IMPORT-PACK-v1.md`
(WP-U201 ✅ — ✎ orquestador: U201 mergeó en paralelo a esta página; los 7
pasos y el pipeline `importPack` existen). Los comandos de operador
llegarán con los drivers de familia (U202–U205) y el CA de canal (U212).

**Sincronizar** (P2P, réplica continua) no está encolado: es un segundo
acto que requiere consenso de mesa. Se nombra para que el lector sepa que
existe como horizonte, no como promesa.

## El root de volúmenes: tuyo, explícito y cercado

Todo el runtime resuelve su root de datos por **un** resolver
(`packages/engine/presets-sdk/src/volumes/resolve.mjs:29-44`, WP-U200 ·
consenso ◆5). Sus tres reglas:

1. **`ZEUS_VOLUMES_ROOT` es obligatoria.** Sin la variable, el resolver
   falla honesto — «volumes root is not operable» — en vez de adivinar
   (`resolve.mjs:32-36`). No hay default de producto, no hay búsqueda
   ascendente por directorio de trabajo.
2. **El env apunta siempre a un root propio del operador.** Un root que
   resuelva dentro del árbol de dependencias instaladas por npm es
   **rechazado** aunque el env lo pida: un pack es fuente de import, nunca
   un root vivo (cerco §10.8; `resolve.mjs:38-42`). El espejo del mismo
   contrato vive en `packages/engine/linea-kit/src/validate.mjs:164-168`.
3. **Un valor relativo se ancla contra la raíz del monorepo, jamás contra
   el directorio de trabajo** (`resolve.mjs:37`). Fuera del monorepo, usa
   ruta absoluta — `linea-kit` la exige (`validate.mjs:153-157`).

Forma del valor (la misma que documenta `VOLUMES/README.md:35`):

```sh
ZEUS_VOLUMES_ROOT=/ruta/propia/VOLUMES
```

Comodidad de desarrollo dentro del monorepo: el `.env` puede apuntar a los
fixtures del propio repo (`.env.example:59`, `ZEUS_VOLUMES_ROOT=./VOLUMES`)
— eso sigue siendo un root del árbol propio, no un pack.

## `volumesRoot` del loader de packs = solo desarrollo

El loader de start packs (`loadStartPack`, del kit `startpack-kit`) es
**obra de G** y vive en la games-library, no en este monorepo
(`sincronia/notas/NOTA-Z-2026-07-26-H01-volumes-concepto.md:33`). Hoy ese
loader devuelve un `volumesRoot` que apunta **dentro del árbol del propio
pack** (nota H-01 §2.1, `:57-73`).

El consenso ◆4(a) (`plan/DECISIONES.md:623-625`) resolvió que ese valor
**deja de ser un root consumible**: es un cambio de banda major cuyo owner
es G, todavía en curso. Mientras esa contraparte aterriza, la regla para
cualquier consumidor es esta:

> El `volumesRoot` que reporta el loader sirve **solo en desarrollo** —
> inspeccionar un pack, tests del propio kit. **Nunca** se apunta
> `ZEUS_VOLUMES_ROOT` a él: el único root vivo es el tuyo, y los datos del
> pack entran a ese root por el momento «sembrar» (import). El resolver ya
> rechaza el atajo desde WP-U200 (`resolve.mjs:38-42`).

## Manifiesto sellado y estado regenerable

Dentro del root, manifiesto y estado son ficheros distintos con contratos
distintos (C-3 → WP-U199):

- **`volumes.json` — manifiesto sellado.** Declara identidad y topología;
  es **solo-lectura para el runtime** y su identidad es el sha256 de sus
  bytes exactos (`packages/engine/volumes-ops/src/manifest.mjs:52-58`).
  Solo un import puede (re)escribirlo, sellando un hash nuevo
  (`manifest.mjs:8-10`). Un root **sin** manifiesto no es operable: toda
  operación aborta y nada se inventa en su lugar (`manifest.mjs:14-15`).
- **`volumes.state.json` — estado vivo.** Contadores regenerables por
  medición (`files`, `bytes`, `missing`, `measuredAt`) más el hash del
  manifiesto contra el que se midió; es mutable, no viaja en git y jamás
  entra en el hash del sello
  (`packages/engine/volumes-ops/src/state.mjs:2-15`;
  `counters.mjs:2-8`). Medir **no** modifica el manifiesto.

Regla de mesa que ordena todo lo anterior: *si se puede regenerar
midiendo, es estado, no manifiesto* (`manifest.mjs:17-18`).

## Estado de este puente

**ENTREGADO-PARCIAL · cierre condicionado.** Esta página describe el
destino acordado y el código ya vigente en esta base, pero su cierre
depende de tres piezas que no son suyas:

1. **◆4(a) — el loader deja de exponer un `volumesRoot` consumible.**
   Obra externa de **G** en `startpack-kit` (games-library), banda major
   (`plan/BACKLOG.md:359`). Abierta.
2. **CA de canal limpio (WP-U212).** La prueba de que un consumidor limpio
   instala capacidad por npm y siembra datos por Release sin tocar el
   árbol (`plan/BACKLOG.md:275`). Pendiente.
3. **Contrato de import v1 (WP-U201).** ✅ materializado
   (`plan/CONTRATO-IMPORT-PACK-v1.md` — ✎ orquestador: cerró en paralelo);
   los comandos de operador esperan a los drivers U202–U205.

Cuando esas piezas cierren, esta página enlazará el contrato de import con
sus comandos reales y retirará este aviso.

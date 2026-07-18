# Zeus VOLUMES (post WP-U62)

El monorepo **ya no aloja DISKs vivos** (firehose 38 MB, líneas 20 MB, etc.).
Esos datos salen por el pipeline de start packs en
[`Z_SDK-games-library`](https://github.com/alephscriptorium-eng/Z_SDK-games-library)
(`@zeus/startpack-<game>` + GitHub Release) o viven en un árbol externo
apuntado por `ZEUS_VOLUMES_ROOT`.

Aquí solo quedan **fixtures sintéticos** para CI y smoke del mesh.

## Qué hay en este árbol

| Slot | Contenido | Estado |
|------|-----------|--------|
| `DISK_02/LINEAS` | fixture línea demo (`linea-kit/test/fixtures/lineas`) | **tracked** |
| `DISK_03/FORCES` | fixture force-sample (`linea-kit/test/fixtures/forces`) | **tracked** |
| `DISK_01` / `DISK_04` | slots diferidos — sync operador fuera del monorepo | **no shipped** |

`volumes.json` registra los ids canónicos (`firehose`, `lineas`, `forces`,
`ssb`). Los slots diferidos llevan `deferred: true`.

## Arranque de ronda (producto)

1. Instalar un start pack: `npm install @zeus/startpack-delta` (o tarball del
   GitHub Release — ver docs de la library).
2. Apuntar `ZEUS_VOLUMES_ROOT` al `volumes/` del pack (la autoridad delta/pozo
   lo hace si `ZEUS_STARTPACK_ROOT` / paquete está resuelto).
3. Arrancar mesh + autoridad.

Datos vivos de operador: `ZEUS_VOLUMES_ROOT=/path/to/external/VOLUMES` — **nunca**
volver a meter DISK_01/02 pesados en este repo.

## Variables

| Variable / comando | Uso |
|--------------------|-----|
| `ZEUS_VOLUMES_ROOT` | Raíz del árbol VOLUMES (default: `./VOLUMES` = fixtures) |
| `ZEUS_STARTPACK_ROOT` | Árbol unpack de `@zeus/startpack-*` (library) |
| `ZEUS_JETSTREAM_FIXTURE=1` | Sync offline → DISK_01 en un root externo |
| `ZEUS_SSB_LOG_PATH` | Dump JSON SSB → sync a DISK_04 en root externo |
| `npm run volumes:sync:firehose` / `volumes:sync:ssb` | Sync hacia el root apuntado |

## Git policy

- Solo subpaths de fixture exactos viajan en git (WP-U108 / A-15):
  `DISK_02/LINEAS/demo/**`, `DISK_02/LINEAS/registry.yaml`,
  `DISK_03/FORCES/forces/force-sample/**`,
  `DISK_03/FORCES/cotas/sima/{cota,manifest}.json`,
  `DISK_03/FORCES/registry.json`, más `README.md` / `volumes.json`.
- **No** se des-ignora `DISK_02/**` ni `DISK_03/**` enteros: una copy
  local de caso (`LINEAS/espana/…`, `forces/force-a..g`, …) queda
  ignorada y no es trackeable con `git add VOLUMES/`.
- `DISK_01` / `DISK_04` siguen gitignorados por completo.
- Start packs y volúmenes de ronda: **nunca en git** del monorepo
  (ARQUITECTURA §6).

## Read API

`@zeus/presets-sdk`: `resolveVolume`, `browseVolume`, `resolveVolumesRoot`.

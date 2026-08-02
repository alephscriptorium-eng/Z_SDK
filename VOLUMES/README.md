# Zeus VOLUMES (post WP-U62)

El monorepo **ya no aloja DISKs vivos** (firehose 38 MB, líneas 20 MB, etc.).
Esos datos salen por el pipeline de start packs en
[`Z_SDK-games-library`](https://github.com/alephscriptorium-eng/Z_SDK-games-library)
(`@zeus/startpack-<game>`, distribuido como **tarball del GitHub Release** —
los packs **no** están en el registry npm) o viven en un árbol externo
apuntado por `ZEUS_VOLUMES_ROOT` (root propio del operador).

Aquí solo quedan **fixtures sintéticos** para CI y smoke del mesh.

## Qué hay en este árbol

| Slot | Contenido | Estado |
|------|-----------|--------|
| `DISK_02/LINEAS` | fixture línea demo (`linea-kit/test/fixtures/lineas`) | **tracked** |
| `DISK_03/FORCES` | fixture force-sample (`linea-kit/test/fixtures/forces`) | **tracked** |
| `DISK_01` / `DISK_04` | slots diferidos — sync operador fuera del monorepo | **no shipped** |

`volumes.json` registra los ids canónicos (`firehose`, `lineas`, `forces`,
`ssb`). Los slots diferidos llevan `deferred: true`.

## Arranque de ronda

**Producto:** el único camino de producto es el **contrato de import v1**
(verificar → staging → validar → fusionar → sellar), **obra en curso —
WP-U201**. Hasta que exista, este README no ofrece instrucciones de import
de packs. Los `@zeus/startpack-*` **no** están en el registry npm
(`npm install` responde E404); su canal real es el tarball adjunto al
GitHub Release de la library (canal externo: requiere red y acceso al repo).

**Hoy (operador / desarrollo):**

1. Crear (o reutilizar) un root de VOLUMES **propio del operador**, fuera del
   monorepo, y apuntarlo: `ZEUS_VOLUMES_ROOT=/path/propio/VOLUMES`. El env
   apunta **siempre** a un root del operador — nunca al árbol de un pack ni a
   dependencias instaladas.
2. Poblarlo con los sync de la tabla de abajo (o a mano).
3. Arrancar mesh + autoridad.

Datos vivos de operador: siempre en ese root externo — **nunca** volver a
meter DISK_01/02 pesados en este repo.

## Variables

| Variable / comando | Uso |
|--------------------|-----|
| `ZEUS_VOLUMES_ROOT` | Raíz del árbol VOLUMES: root propio del operador. **Obligatoria desde U200 (✎: el resolver ya no tiene default)** — en desarrollo la aporta `.env` (ver `.env.example:59`, apuntando a estos fixtures). Nunca al árbol de un pack |
| `ZEUS_JETSTREAM_FIXTURE=1` | Modo offline del sync firehose → DISK_01 del root apuntado |
| `ZEUS_SSB_LOG_PATH` | Dump JSON del pub SSB: entrada del sync → DISK_04 del root apuntado |
| `npm run volumes:sync:firehose` | Sync firehose → DISK_01 del root apuntado (precondición: `npm ci`). Offline con `ZEUS_JETSTREAM_FIXTURE=1`; el modo vivo requiere red (canal externo jetstream) |
| `npm run volumes:sync:ssb` | Sync SSB → DISK_04 del root apuntado (precondición: `npm ci`). Sin red: lee el dump de `ZEUS_SSB_LOG_PATH`; fixture offline: `npm run sync -w @zeus/ssb-system -- --fixture` |

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

## Invariante de identidad (WP-U231)

**Ningún volumen aloja material de identidad** —claves de pub, tokens de
registry, credenciales de VPS—: el secreto va por env del operador, nunca en el
árbol. Y su otra mitad: **un volumen que EXIGE un secreto para leerse está mal
diseñado**. Es la derivada al plano de datos de `GATE-O-CLAVES` (doctrina de O,
sólo citada aquí — `plan/GOBIERNO-EJECUCION-F2.md:478`), escrita en
`sincronia/notas/archivo/NOTA-Z-2026-07-26-R6-matriz-volumenes.md:55-59`.

Lo vigila `scripts/gates/claves.mjs`, que entra en `npm run gates`. Barre
**todas** las extensiones de este árbol (no sólo fuentes) y **no admite
excepciones**: una entrada en `scripts/gates/exceptions.mjs` que nombre una de
sus reglas es ella misma una ofensa.

Dos comprobaciones, y hacen cosas distintas:

```
node scripts/gates/claves.mjs --censo     # qué EXIGE cada volumen para ser leído
node scripts/gates/claves.mjs --barrido   # si hay una identidad DENTRO de los datos
```

Sobre un root propio —que es donde viven los datos de verdad— añade `--root`;
sin banderas hace las dos:

```
node scripts/gates/claves.mjs --root /ruta/a/tu/VOLUMES
```

Sale `0` si está limpio, `1` si hay hallazgos, `2` si te equivocaste al
invocarlo.

Lo que el gate **no** ve, dicho aquí para que nadie lo suponga: el root vivo si
no se lo apuntas con `--root` (por defecto sólo mira este árbol del repo), el
historial de git, un `.env` que alguien trackee a la fuerza, y cualquier secreto
cifrado, comprimido o en UTF-16. Tres formas de valor —arrays JSON, YAML de
bloque y `ENV CLAVE valor` sin `=`— tampoco: están abiertas como **WP-U269**.

## Read API

`@zeus/presets-sdk`: `resolveVolume`, `browseVolume`, `resolveVolumesRoot`.

Doctrina del plano de datos (tres momentos · cerco · sello):
[`docs/guide/volumes-y-datos.md`](../docs/guide/volumes-y-datos.md).

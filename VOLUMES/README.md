# Zeus VOLUMES

Canonical on-disk storage for Zeus preset datasets. Each volume occupies a **DISK slot** and is addressed by id via `@zeus/presets-sdk` (`resolveVolume`, `browseVolume`).

## DISK slots

| Slot | Volume | Status |
|------|--------|--------|
| `DISK_01` | `firehose` — Firehose ONFALO (8 388 JSON) | **active** |
| `DISK_02` | `lineas` — Lineas de poder (full tree) | **active** |
| `DISK_03` | `forces` — Forces y cotas, la física del sistema (12 corpus, 68 escenas) | **active** |
| `DISK_04` | `ssb` — SSB OASIS Tribes & Parliament (typed log export) | **slot** (sync via `@zeus/ssb-system`) |

## Lineas policy (DISK_02)

- **`DISK_02/LINEAS`** is the sole canonical read root for all lineas data.
- Legacy pre-volume tree was removed after full migration (2026-07-09).
- `resolveVolume('lineas')` and `resolveLineasBasePath()` both resolve to `DISK_02/LINEAS`.
- Optional re-import from an external tree: set `ZEUS_LINEAS_IMPORT_SOURCE` and run `npm run volumes:init:lineas -- --import`.

## Histórico vs operativo

**Histórico (no reparar):** strings de provenance como `Fuente: network-engine/…`, campos `prompt_analisis` en JSON de etiquetados, menciones a `linea-poder` en texto de borradores. Son trazabilidad de migración; el runtime Zeus no los consume.

**Operativo:** variables de entorno y comandos npm que gobiernan sync/import:

| Variable / comando | Uso |
|--------------------|-----|
| `ZEUS_VOLUMES_ROOT` | Raíz del árbol VOLUMES |
| `ZEUS_FIREHOSE_REMOTE_PATH` | Origen remoto para sync firehose |
| `ZEUS_SSB_LOG_PATH` | Dump JSON del log tipado del pub OASIS (`npm run volumes:sync:ssb`) |
| `ZEUS_SSB_PUB_URL` | Provenance del pub (anotación; el sync no abre red por sí solo) |
| `ZEUS_LINEAS_IMPORT_SOURCE` | Re-import opcional de líneas (`volumes:init:lineas -- --import`) |
| `ZEUS_MEDIDOR_IMPORT_SOURCE` | Re-import opcional de medidor casos |
| `npm run volumes:*` / `npm run sync -w @zeus/ssb-system` | Sync, init, verify de volúmenes |

**Decisión `links.arg`:** en `manifest.json` se mantiene como URL GitHub (`scriptorium-network-games/ALEPH_ET_OMEGA`). El runtime no lo lee; es provenance de operador para el ARG inaugural. No eliminar sin necesidad — `segment_poder.py` regenera el mismo URL.

## Read-only policy

- **Remote pipeline** (`aleph-scriptorium/WiringEditor/data/firehose`) is read-only — sync copies verbatim via `cp -a`.
- **Local `DISK_01`** is operator-editable on disk; the browse API enforces `readonly: true` from `volumes.json`.
- **`DISK_02`** is operator data; verify with `npm run volumes:init:lineas -- --verify`.

## Configuration

- `volumes.json` — canonical registry (paths, corpora counts, sync metadata).
- `.env` — absolute paths (see `.env.example`):
  - `ZEUS_VOLUMES_ROOT` — override the VOLUMES directory (default: this folder).
  - `ZEUS_VOLUME_LINEAS` — absolute path to `DISK_02/LINEAS`.
  - `ZEUS_FIREHOSE_REMOTE_PATH` — override remote sync source for firehose.

## Layout

### DISK_01

```
DISK_01/
  FIREHOSE/
    candidate/    # 605 JSON — filtered posts
    raw/          # 4 076 JSON — raw stream batches
    discarded/    # 3 706 JSON — triage rejects
    labeled/      # empty — CDR pipeline pending
    triage-manifest.json
```

See `DISK_01/FIREHOSE_SYNC_REPORT.md` for sync verification details.

### DISK_02

```
DISK_02/
  LINEAS/
    registry.yaml
    espana/
      manifest.json
      wp/historia/
        cache/snapshots/   # *.wikitext + *.meta.json
        registros/
    scripts/
      fetch_batch.py
      fetch-priority-viaje1.json
```

See `DISK_02/LINEAS_SYNC_REPORT.md` after running `npm run volumes:init:lineas`.

### DISK_03

```
DISK_03/
  FORCES/
    registry.json          # activation (budget/exclusiones/cotas) + forces[] + cotas[]
    README.md · INDICE.md · IMPORT_NOTES.md
    forces/<id>/           # main (boot) + force-a..g + force-xz/zx
      force.json · manifest.json · escenas/<session>/<slug>/{prompt,think,output}.md
    cotas/<sima|cima>/
      cota.json · manifest.json · escenas/…
```

Corpus curado e importado 2026-07-15 (D-19, `plan/DATOS.md` §8); formato v0
del linea-kit — WP-U80 lo formaliza como schema. Sin scripts dentro: solo
datos + provenance.

### DISK_04

```
DISK_04/
  SSB/
    manifest.json     # export snapshot (schema ssb-manifest / U80)
    tribes/           # tribe* messages as JSON by key
    parliament/       # parliament* messages
    votes/            # votes* messages
```

Sync files-first (no mesh daemon): dump the OASIS pub log to JSON, then:

```bash
export ZEUS_VOLUMES_ROOT=/path/to/zeus-sdk/VOLUMES
export ZEUS_SSB_LOG_PATH=/path/to/ssb-log.json
# optional provenance
# export ZEUS_SSB_PUB_URL=https://pub.example
npm run volumes:sync:ssb
```

Offline fixture (no network): `npm run sync -w @zeus/ssb-system -- --fixture --volumes "$ZEUS_VOLUMES_ROOT"`.

Worktrees do not inherit gitignored DISK trees — point `ZEUS_VOLUMES_ROOT` at the
main-repo `VOLUMES` or a temp tree for tests.

## Git policy

- `DISK_01`/`DISK_02`/`DISK_04` are gitignored (heavy / operator-synced data).
- **`DISK_03` is tracked in git** (exception in `.gitignore`): curated small
  corpus (~1.3 MB text) that makes the plan self-contained. `volumes.json`
  and this README are tracked too.
- Runtime reads use `DISK_02/LINEAS` only; no duplicate legacy tree on disk.

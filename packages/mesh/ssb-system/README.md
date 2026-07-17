# `@zeus/ssb-system`

Exportador files-first del log tipado del pub OASIS (Tribes / Parliament /
votos) a **JSON en disco** bajo `DISK_04/SSB`, más servidor MCP loader
read-only hermano de `@zeus/linea-firehose` / `@zeus/force-system`.

**No es un demonio mesh:** el sync es un proceso CLI; el MCP solo lee el
volumen ya materializado.

## Slot

| | |
| --- | --- |
| Volumen | `ssb` |
| Disk | **`DISK_04/SSB`** (no usar `DISK_03` — FORCES / U91) |
| Provenance | `volumes.json` → `source` (pub URL / log path) |

## Sync (sin red en el CA)

```bash
# Worktrees: apuntar al VOLUMES del repo principal si hace falta
export ZEUS_VOLUMES_ROOT=/path/to/zeus-sdk/VOLUMES

# Dump JSON del pub (o fixture del paquete)
export ZEUS_SSB_LOG_PATH=/path/to/oasis-ssb-log.json
# opcional, solo provenance:
# export ZEUS_SSB_PUB_URL=https://pub.example

npm run volumes:sync:ssb
# o offline:
npm run sync -w @zeus/ssb-system -- --fixture --volumes "$ZEUS_VOLUMES_ROOT"
```

Variables:

| Env | Uso |
| --- | --- |
| `ZEUS_VOLUMES_ROOT` | Raíz VOLUMES |
| `ZEUS_SSB_LOG_PATH` | JSON del log (array de msgs SSB o `{ messages: [] }`) |
| `ZEUS_SSB_PUB_URL` | Anotación de provenance; **este CLI no abre red** |
| `ZEUS_MCP_SSB` | Puerto MCP (default `resolveZeusMcpPorts().ssb.disk` = 4114) |

## MCP loader

```bash
export ZEUS_VOLUMES_ROOT=…
npm run start -w @zeus/ssb-system
```

| URI | qué |
| --- | --- |
| `ssb://stats` | conteos por corpus |
| `ssb://manifest` | manifest del export |
| `ssb://corpus/{id}` | tribes / parliament / votes |
| `ssb://message/{key}` | mensaje por key SSB |

Tools: `ssb_browse`, `ssb_list_messages`, `ssb_get_message`.

## Regla de los dos juegos

Paquete mesh genérico: cero conceptos exclusivos de delta/pozo.

## Tests

```bash
npm test -w @zeus/ssb-system
```

CA: fixture → export → `validateVolumesTree` (U80) → resources MCP.

# `@zeus/force-system`

MCP loader read-only del volumen `DISK_03/FORCES` (D-19 / DATOS.md §8).
Hermano de `@zeus/linea-system`: resources `force://…`, sin intents de
activación (eso es WP-U92).

## Arranque

```bash
# Apuntar a VOLUMES del monorepo si el worktree no tiene DISK_03
export ZEUS_VOLUMES_ROOT=/path/to/zeus-sdk/VOLUMES
npm run start -w @zeus/force-system
```

Puerto por defecto: `resolveZeusMcpPorts().forces.disk` (4113), override
`ZEUS_MCP_FORCES`.

## Resources

| URI | qué |
| --- | --- |
| `force://registry` | `session_budget`, exclusions, boot, ids |
| `force://info` | fact card del volumen |
| `force://{id}` | carta force/cota + `pending_refs` |
| `force://{id}/scene/{session}/{slug}` | capas prompt/think/output |

Refs `linea:*` no montadas → `pending_refs` (pendiente, **no** error).

## Regla de datos

Este paquete es mesh genérico: **cero forces concretas** en código fuente.
Los ids viven en VOLUMES / fixtures del kit.

## Tests

```bash
npm test -w @zeus/force-system
```

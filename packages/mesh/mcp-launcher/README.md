# `@zeus/mcp-launcher` — fleet actuator (WP-Z06)

MCP **meta-ops** server: launch / stop / restart / health over a **declared
catalog**. Federation enabler (r/s/h): someone has to turn capacities on;
this package is that someone.

## Role (spec for Z05)

| surface | contract |
| ------- | -------- |
| Tools | `launch_mcp_server`, `stop_mcp_server`, `restart_mcp_server`, `launch_all`, `health`, `generate_vscode_config`, `resolve_capability`, `list_capabilities` |
| Resources | `launcher://info`, `launcher://catalog`, `launcher://ports` |
| Security | Lifecycle **only** on catalog ids — no arbitrary `spawn` from tool args |
| Discovery | After launch/stop, best-effort `POST` editor `/api/mcp/refresh` |
| Port | **3050** (`ZEUS_MCP_LAUNCHER`); peers use `DEFAULT_ZEUS_MCP` |

## Frontera dura Z06 / Z12

| capa | quién | qué |
| ---- | ----- | --- |
| **Actuación** | **Z06 (este paquete)** | spawn/kill/health, catálogo, tools |
| **Comportamiento** | **Z12** | cuándo, orden, reintentos, XState árbol |
| **Verdad de juego** | Z03 | snapshot; no conoce procesos |

Campos reservados en catálogo para extensión Z12 (ignorados aquí):
`tree.barrio`, `tree.edificio`, `tree.maquinaria`, y políticas tipo
`autoRestart`. Z12 **extiende** el catálogo; no duplicar cerebro aquí.

### Contrato `intentionalStops` (lectura para Z12)

| momento | efecto |
| ------- | ------ |
| `stop(id)` | marca `spawnGroup` como parada intencional |
| `launch(id)` | borra la marca del grupo |
| crash / exit sin `stop` | **no** marca — health `intentionalStop: false` |

API de lectura (sin política de restart aquí):

- `ProcessManager.isIntentionalStop(serverId)` → `boolean`
- `ProcessManager.listIntentionalStops()` → `spawnGroup[]`
- `health()` → cada fila `intentionalStop` + resumen `intentionalGroups`

Cero XState / auto-restart en este paquete.

## Catálogo

Fuente: nota zeus-mcp-servers + `resolveZeusMcpPorts()`.
**linea-system** = spawnGroup único → `linea-espana` (4111) +
`linea-wp-historia` (4112 satélite). Las configs de `conectar-satelite`
describen el satélite; el catálogo las referencia, no las copia.

## Puertos (sin colisión)

| servicio | puerto |
| -------- | ------ |
| launcher | 3050 |
| firehose | 3008 (herencia mesh) |
| editor-ui | 3012 (UI; no está en catálogo MCP) |
| console-monitor | 3014 |
| solar | 4101–4103 |
| lineas | 4111–4112 |
| forces / ssb | 4113 / 4114 |
| player-MCPs | 4121/22, 4131, 4132 |

## Consumidores

- **Z04** — `resolve_capability` → `launch_mcp_server`
- **Z03** — `resolveWakeLaunch` (mapa; sin tocar el juego aquí)
- **Z08** — tools desde constelación
- **Z12** — manda; Z06 ejecuta

## Run

```bash
npm run start -w @zeus/mcp-launcher
# or
npm run start:mcp-launcher
```

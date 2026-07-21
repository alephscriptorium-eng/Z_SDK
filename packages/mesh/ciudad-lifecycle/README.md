# `@zeus/ciudad-lifecycle` (WP-Z12 f1)

Composition **brain**: XState lifecycle over `@zeus/mcp-launcher` actuators.

| capa | paquete | rol |
| ---- | ------- | --- |
| Actuación | `@zeus/mcp-launcher` | launch/stop/health/spawn |
| Comportamiento | **este** | cuándo / orden / fallo |
| Kit genérico | `@zeus/lifecycle-kit` | hoja/agregado sin nombres de dominio |

## Tools

- `city_start` / `city_stop` / `city_status` — única superficie de mando
- Segundo cliente: `mandoClientCall` (mismo vocabulario; Eje IV)

## f1

Catálogo semilla 3 barrios (`state-machine`, `prolog-editor`, `aaia-gallery`) +
e2e barrio StateMachine (1 maquinaria) vía fixture + Z06 ProcessManager.

## Intentional-stop (read hook)

`CityLifecycleRuntime.isIntentionalStop(catalogId)` lee
`ProcessManager.isIntentionalStop` (actuador). El watch etiqueta
`PROCESO_TERMINADO` con `intentional_stop` cuando el actuador lo marca.

**Gap → f2:** cascada/zonas y la guarda `canRetry` del leaf aún no sustituyen
el flag interno del actor por la señal del actuador como única fuente; solo
hook + lectura. Sin cascada aquí.


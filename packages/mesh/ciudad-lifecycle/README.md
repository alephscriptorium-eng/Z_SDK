# `@zeus/ciudad-lifecycle`

Composition **brain**: XState lifecycle over `@zeus/mcp-launcher` actuators.

| capa | paquete | rol |
| ---- | ------- | --- |
| Actuación | `@zeus/mcp-launcher` | launch/stop/health/spawn |
| Comportamiento | **este** | cuándo / orden / fallo / cascada |
| Kit genérico | `@zeus/lifecycle-kit` | hoja/agregado/cascade sin nombres de dominio |
| Verdad de juego | Z03 domain (inyectado) | wake → snapshot/ledger |

## Tools

- `city_start` / `city_stop` / `city_status` — mando por barrio
- `city_cascade_start` / `city_cascade_stop` — cascada zonas (techo `POBLACION_MAX`=24)
- Segundo cliente: `mandoClientCall` (mismo vocabulario; Eje IV)

## f2

- **Rollup ciudad** sobre vidas de barrio (`rollupCiudad` / `snapshot().ciudad`)
- **Cascada** `dispatchCascade` con concurrencia acotada
- **canRetry** alimentado por `ProcessManager.isIntentionalStop` (Z15)
- **Wake → snapshot**: `wakeAndStart` / `roundTripWake` con domain Z03 **inyectado**
  (un solo cerebro de juego; sin segundo reducer)

## Intentional-stop

`CityLifecycleRuntime.isIntentionalStop(catalogId)` lee el actuador.
`provideLeafActors({ isIntentionalStop })` hace que `canRetry` prefiera esa señal.

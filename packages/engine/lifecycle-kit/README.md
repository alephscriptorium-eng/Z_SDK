# `@zeus/lifecycle-kit`

Generic XState 5 **leaf / aggregate / cascade** lifecycle. Actuators are
injected — this package never spawns or kills processes.

## States (leaf)

`parada → arrancando → viva ⇄ degradada → parando → parada` · `rota`

## Facts (events)

`ARRANQUE_SOLICITADO` · `PROCESO_VIVO` · `SALUD_FALLIDA` · `PARADA_SOLICITADA` ·
`PROCESO_TERMINADO` · `DEPENDENCIA_FALLIDA` · `HIJO_CAMBIO`

## Hybrid aggregates

- Fixed small leaf sets → `createAggregateController` (parallel leaf actors + rollup)
- Tree of aggregates → `projectTreeLife` (reactive rollup of child life tokens)
- Zone cascade → `runCascade` with concurrency ceiling (`CASCADE_CONCURRENCY_DEFAULT` = 24)
- Dynamic fleets → `spawnChild` (out of f1/f2 kit scope)

## Intentional-stop / canRetry

`resolveIntentionalStop` / `readActuatorIntentionalStop` compose the actuator
read signal with the leaf `context.intentionalStop` flag.

`provideLeafActors({ isIntentionalStop })` overrides `canRetry` /
`retriesExhausted` so the **actuator read is preferred** (OR with context),
not the leaf flag alone. `PROCESO_TERMINADO` with `intentionalStop` /
`diagnosis: intentional_stop` absorbs into `parada` without auto-restart.

## Ceguera

Kit source must not name domain tree nouns of the consuming world
(`ciudad` / `barrio`) nor method-framework tokens. Content seeds live in
composition packages.

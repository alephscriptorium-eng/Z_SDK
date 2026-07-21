# `@zeus/lifecycle-kit`

Generic XState 5 **leaf / aggregate** lifecycle. Actuators are injected —
this package never spawns or kills processes.

## States (leaf)

`parada → arrancando → viva ⇄ degradada → parando → parada` · `rota`

## Facts (events)

`ARRANQUE_SOLICITADO` · `PROCESO_VIVO` · `SALUD_FALLIDA` · `PARADA_SOLICITADA` ·
`PROCESO_TERMINADO` · `DEPENDENCIA_FALLIDA` · `HIJO_CAMBIO`

## Hybrid aggregates

- Fixed small leaf sets → `createAggregateController` (parallel leaf actors + rollup)
- Dynamic fleets → `spawnChild` (out of f1 scope)

## Ceguera

Kit source must not name domain tree nouns of the consuming world
(`ciudad` / `barrio`) nor method-framework tokens. Content seeds live in
composition packages.

## Intentional-stop hook

`resolveIntentionalStop` / `readActuatorIntentionalStop` compose the actuator
read signal with the leaf `context.intentionalStop` flag. Full cascade that
drives `canRetry` from the actuator alone is left to composition (later WP).


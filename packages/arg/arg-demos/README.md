# @zeus/arg-demos

La **Autoridad** de CAUDAL y el launcher de la demo de 3 visores.

- `apps/authority/` — único proceso que muta el dominio (gate G-ARG.1):
  recibe `arg:intent` de la room, aplica el reducer de `@zeus/arg-domain` y
  publica `arg:state` (10 Hz), `arg:track` y `arg:ledger`.
- `launch.mjs` — `npm run demo:arg` desde la raíz: reutiliza (o levanta) el
  socket-server :3017, arranca la autoridad y el arg-console :3021, e imprime
  las URLs del tablero y de los dos jugadores.

Env útiles: `ZEUS_ARG_ROOM` (ARG_DELTA), `ZEUS_ARG_FEEDS` (`auto|synthetic|real`),
`ZEUS_ARG_SEED`, `ZEUS_ARG_GOAL_LABELED`, `ZEUS_ARG_GOAL_EXCAVATED`.

Ver [../spec/CONTRATO.md](../spec/CONTRATO.md).

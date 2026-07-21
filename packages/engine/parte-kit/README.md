# `@zeus/parte-kit`

Reading-role kit: one shared plaza bulletin (**ParteDeCiudad v1**) as dual
output — fixed-template prose + JSON delta. Deterministic calculator; no LLM.

## API

| fn | firma |
| --- | --- |
| `redactarParte` | `(estadoAnterior, deltas[]) → { parte, estado }` **pura** |
| `renderProsa` | `(parte) → markdown` plantillas fijas |
| `validarParte` | `(parte, patronCeguera) → { ok, matches }` |
| `intentarPublicarParte` | valida + publica en canal **ledger** existente (`entryKind: parte` / `parte_rechazado`) |

Mock adapters (consumer passes Z01/Z02 JSON; kit does not import game packs):

- `estadoDesdeCenso(censo)`
- `deltasDesdeMockWork(events)`
- `deltasDesdeStatePatch(delta)`

## Contrato

Frozen shape in `src/tipos.mjs` (`isParteDeCiudadShaped`). Do not add fields.

## Ceguera

`validarParte` uses the same env pattern as the projector (`CEGUERA_PATTERN`).
If `!ok`, the parte is **not** published; `parte_rechazado` goes to ledger.

## Frontera

Imports only `@zeus/protocol` (envelope kinds). No game `domain.mjs`.

# `@zeus/acta-kit`

Reading/writing-role kit: **ActaDeBarrio v1** travels on the existing plaza
**ledger** channel (same envelope as `@zeus/parte-kit`; `entryKind: acta`).
Windows end; only plaza/ledger survives. Pure emit; no LLM; no new channel.

## API

| fn | firma |
| --- | --- |
| `emitirActa` | `(input) → ActaDeBarrio` **pura** (tick/huella as args) |
| `validarActa` | `(acta, patronCeguera) → { ok, matches }` + shape + `resumen` ≤400 |
| `intentarPublicarActa` | valida + publica ledger (`acta` / `acta_rechazada`) |
| `adoptarActaDesdePlaza` | `(entries, barrioId) → { ok, acta\|null }` |
| `huellaLedger` | `(evento) → string` hash of last barrio ledger event |

## Contrato

Frozen shape in `src/tipos.mjs` (`isActaDeBarrioShaped`). Do not add fields.

```js
{ version: 'acta/1', barrioId, estado, resumen, // ≤400 chars
  pendientes: ['texto', ...], ultimaClase, tickEmision, huellaLedger }
```

## Frontera

Imports only `@zeus/protocol`. No game `domain.mjs`.

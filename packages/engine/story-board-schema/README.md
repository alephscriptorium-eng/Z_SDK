# `@zeus/story-board-schema`

Contrato **único** de `story-board.json` (WP-U117): JSON Schema draft
2020-12 + validador AJV. Lo consumen el kit carpeta-dramaturgo
(`Z_SDK-games-library`) y el editor (`@zeus/editor-ui`).

## Dialectos (oneOf)

| familia schema | forma |
| -------------- | ----- |
| `dialectSolve` | `acts[].widgets` (ids `solve-inline` / `plantilla` en el editor) |
| `dialectAleph` | `acts` + `blocks[].uichain.widgets` (`aleph-blocks`) |

Un board con `root.blocks` **no** encaja en solve (schema `not.required`).
Post-check semántico: `blocks[].act` debe referir un `acts[].id` conocido.

## Referencias de personajes (opcional · WP-U174)

Campo **opcional** `personajes` presente en **ambos** dialectos (mismo
contrato, retro-compatible — un board sin él sigue validando). Referencia el
**reparto** de `@zeus/reparto-kit` (`reparto/1`) **por id**: refs-only, nunca
corpus embebido (nombre/rol viven solo en el reparto).

```jsonc
"personajes": {
  "reparto": "reparto://linea-demo/reparto.json", // puntero opcional al reparto
  "refs": [
    { "personajeId": "p-protagonista" },          // FK a reparto.personajes[].id
    { "personajeId": "p-antagonista" }
  ]
}
```

Cada `personajeRef` es `{ personajeId }` **estricto** (`additionalProperties:
false`): añadir `nombre`/`rol` u otro corpus → **ref inválida**. El schema
valida la *forma* de la referencia; la *integridad referencial* (que el
`personajeId` exista en un reparto concreto) es competencia de `@zeus/reparto-kit`
(el board no embebe el reparto).

## Uso

```js
import {
  validateStoryBoard,
  loadStoryBoardSchema,
  STORY_BOARD_SCHEMA_PATH
} from '@zeus/story-board-schema';

const r = validateStoryBoard(board);
// { ok: true, dialect, actsToWidgets } | { ok: false, errors: string[] }
```

Schema en disco / export:

```js
import '@zeus/story-board-schema/schemas/story-board.schema.json';
// o STORY_BOARD_SCHEMA_PATH / loadStoryBoardSchema()
```

## Tests

```bash
npm test -w @zeus/story-board-schema
```

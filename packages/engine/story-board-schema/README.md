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

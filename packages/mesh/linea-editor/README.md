# `@zeus/linea-editor`

MCP server for **gated line authorship**. Sibling of `linea-system` (read):
this pack **mutates** via thin wraps of `@zeus/linea-kit/tools` and exports
`story-board.json`. Offered on horse as curated preset `linea-editor`
(refs / URIs only — never corpus).

## Tools

| tool | gate | wraps |
|------|------|-------|
| `crear_linea` | `approve` + `approvalToken` | `crearLinea` |
| `export_story_board` | same | compose board + `validateStoryBoard` |

Gate is **visible** (`editor://info`, server card, error payloads include
`gate.gate_line`). Token from `ZEUS_MCP_APPROVAL_TOKEN` (default `APROBAR`).

## Frontier

- Path / camino model → `@zeus/linea-kit/viaje` (read; not reimplemented here)
- Read MCP → `@zeus/linea-system`
- This pack → mutation + export only

## Horse

```js
import { resolveLineaEditorOffer, broadcastLineaEditorOffer } from '@zeus/linea-editor/horse-preset';
const offer = resolveLineaEditorOffer();
broadcastLineaEditorOffer(client, room, selfId, offer);
```

## Start

```bash
npm start -w @zeus/linea-editor
# ZEUS_LINEAS_ROOT=/path/to/LINEAS  ZEUS_MCP_LINEA_EDITOR=4115
```

## Test

```bash
npm test -w @zeus/linea-editor
```

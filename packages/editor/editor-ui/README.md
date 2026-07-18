# `@zeus/editor-ui`

Editor del **mundo A** (WP-U70 / U111): compose un juego mínimo (escena,
labelset, línea, casos, cloaks; o **actos / story-board** narrativo) y
dispara el pipeline Notario de `Z_SDK-games-library` (WP-U62) → start pack +
acta + tarball instalable.

## Arranque

```bash
npm start -w @zeus/editor-ui
# o
node packages/editor/editor-ui/src/server.mjs
```

Puerto vía `presets-sdk/env` (`ZEUS_PORT_EDITOR` / mesh editor).

## Superficie

| ruta | qué |
| ---- | --- |
| `GET /` | World editor (borrador + Release) |
| `GET /cloaks` | Explorador MCP / cloaks (presets) |
| `GET /presets` | 301 → `/` (vista CRUD demolida) |
| `POST /api/world/release` | Materializa startpack del `gameId` + Notario |

## Games library

Release necesita el checkout de `Z_SDK-games-library`:

```bash
export ZEUS_GAMES_LIBRARY_ROOT=/path/to/Z_SDK-games-library
```

Si no hay env, se busca un sibling `Z_SDK-games-library` / `Z_SDK-games-library-u70`.

## Juegos en catálogo

| gameId | kind | paquete | notas |
| ------ | ---- | ------- | ----- |
| `sketch` | toy | `@zeus/startpack-sketch` | Preset juguete (escena + casos); **no** es techo |
| `plaza` | narrative | `@zeus/startpack-plaza` | Actos / story-board `solve-inline` (carpeta) |

Dialecto story-board en U111: **mínimo `solve-inline`** (`acts[].widgets`).
Registro multi-dialecto → WP-U114.

Materialize usa tabla por `kind` (`toy` \| `narrative`); el hard-gate
`gameId === 'sketch'` quedó demolido.

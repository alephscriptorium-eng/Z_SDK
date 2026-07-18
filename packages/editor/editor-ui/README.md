# `@zeus/editor-ui`

Editor del **mundo A** (WP-U70): compose un juego mínimo (escena, labelset,
línea, casos, cloaks) y dispara el pipeline Notario de
`Z_SDK-games-library` (WP-U62) → start pack + acta + tarball instalable.

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
| `POST /api/world/release` | Materializa `@zeus/startpack-sketch` + Notario |

## Games library

Release necesita el checkout de `Z_SDK-games-library` (o worktree U70):

```bash
export ZEUS_GAMES_LIBRARY_ROOT=/path/to/Z_SDK-games-library
```

Si no hay env, se busca un sibling `Z_SDK-games-library` / `Z_SDK-games-library-u70`.

## Juego de CA

`sketch` — juguete parametrizado (`@zeus/startpack-sketch`), no delta/pozo.

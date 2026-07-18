# Arranque rápido

## Requisitos

- Node ≥ 18
- `npm install` en la raíz del monorepo

## Portal de docs

```bash
npm run docs:dev          # VitePress (puerto por defecto 3230 vía presets-sdk/env)
npm run docs:build        # genera specs + Redoc + AsyncAPI HTML + sitio estático
```

Navegador: solo se abre si `ZEUS_OPEN_BROWSER=1` (opt-in; default headless).

## Demos vivas (los dos juegos)

El SDK se valida con **dos** juegos. Arrancar demos, no un «master de sesión»:

```bash
npm run start:socket-server   # transporte de rooms (:3017)
npm run demo:arg (en Z_SDK-games-library)              # delta — 3 visores + autoridad
npm run demo:pozo (en Z_SDK-games-library)             # pozo — autoridad + vista + MCP
```

| Demo | Qué levanta | URLs típicas |
| ---- | ----------- | ------------ |
| `demo:arg` | autoridad delta + arg-console | tablero / jugador en el puerto de arg-console |
| `demo:pozo` | autoridad pozo + vista + player MCP | vista `:3025`, MCP `:4131` (defaults del juego) |

Overrides de puerto/host: `presets-sdk/env` (`resolveZeusUiPorts`, `resolveZeusMcpPorts`, `ZEUS_SCRIPTORIUM_URL`).

Consumidor externo anónimo (tarballs, Node + Bun): `npm run smoke:external-consumer` —
ver [Handshake externo](/guide/external-handshake).

## Verificación

```bash
npm run lint
npm run gates                 # PRACTICAS §5
npm run test:arg              # dominio + feeds + console + player-mcp (delta)
npm test -w @zeus/pozo (en Z_SDK-games-library)        # segundo juego
npm run docs:build            # este portal + contratos generados
```

## Piezas de plataforma (mesh)

Útiles para operar volúmenes y UIs de malla — **no** sustituyen la autoridad del juego:

```bash
npm run start:socket-server
npm run start:cache-browser
npm run start:firehose
npm run start:player          # DJ / tablero de líneas (vista de mesh)
npm run start:player-3d       # visor 3D de room
npm run start:3d-monitor      # portal de vistas 3D
```

VS Code: **V1 Zeus ▸ start all** (plataforma) · **Start ▸ all** (malla completa).

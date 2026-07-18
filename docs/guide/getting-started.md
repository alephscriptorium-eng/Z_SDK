# Arranque rápido

## Requisitos

- Node ≥ 18
- `npm install` en la raíz del monorepo

## Portal de docs

```bash
npm run docs:dev
npm run docs:build
```

`docs:dev` usa VitePress (puerto por defecto 3230 vía `presets-sdk/env`).
`docs:build` genera specs + Redoc + AsyncAPI HTML + sitio estático.
Navegador: solo se abre si `ZEUS_OPEN_BROWSER=1` (opt-in; default headless).

## Demos vivas (juegos de referencia)

El SDK se valida con **≥2** juegos de referencia. Arrancar demos de cada
juego:

Transporte de rooms (este monorepo):

```bash
npm run start:socket-server
```

Demos de juego (clone hermano `Z_SDK-games-library`):

```bash
cd ../Z_SDK-games-library
npm run demo:arg
npm run demo:pozo
```

| Demo | Qué levanta | URLs típicas |
| ---- | ----------- | ------------ |
| `demo:arg` | autoridad delta + arg-console | tablero / jugador en el puerto de arg-console |
| `demo:pozo` | autoridad pozo + vista + player MCP | vista y MCP según defaults del juego |

Overrides de puerto/host: `presets-sdk/env` (`resolveZeusUiPorts`,
`resolveZeusMcpPorts`, `ZEUS_SCRIPTORIUM_URL`). Puertos de ejemplo:
`.env.example` en la raíz.

Consumidor externo anónimo (tarballs, Node + Bun):

```bash
npm run smoke:external-consumer
```

Detalle: [Handshake externo](/guide/external-handshake).

## Verificación

En este monorepo:

```bash
npm run lint
npm run gates
npm run docs:build
```

En la library (juegos):

```bash
cd ../Z_SDK-games-library
npm test
```

## Piezas de plataforma (mesh)

Útiles para operar volúmenes y UIs de malla. La autoridad del juego vive en
el paquete del juego:

```bash
npm run start:socket-server
npm run start:cache-browser
npm run start:firehose
npm run start:player
npm run start:player-3d
npm run start:3d-monitor
```

VS Code: **V1 Zeus ▸ start all** (plataforma) · **Start ▸ all** (malla completa).

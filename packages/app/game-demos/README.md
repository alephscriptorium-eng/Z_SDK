# @zeus/game-demos

Demos ejecutables del **gamemap** sobre `@zeus/rooms` + `@zeus/game-engine`.
Absorbidos desde `gea-sdk/packages/game` (block-11 GA-E); reemplazan el cliente
`rooms-shared` (borrado) por el cliente rooms canónico `@zeus/rooms`.

## Roles

| Rol | Script | Qué hace |
| --- | --- | --- |
| **map** | `npm run map` | Autoridad del mapa: crea el `map-engine`, aplica `GAME_INTENT`, publica `GAME_STATE` en la room. |
| **walk** | `npm run walk` | Driver: emite `GAME_INTENT` de caminar entre nodos. |
| **watch** | `npm run watch` | Viewer tier-0: escucha `GAME_STATE` y lo imprime. |
| — | `npm run demo` | Lanza map → watch → walk juntos (launcher). |

## Configuración

Usa el esquema **`ZEUS_SCRIPTORIUM_*`** (`@zeus/rooms`): `ZEUS_SCRIPTORIUM_URL`
(default `http://localhost:3017`), `ZEUS_SCRIPTORIUM_ROOM` (default `PUBLIC_ROOM`),
`ZEUS_SCRIPTORIUM_USER`, `ZEUS_SCRIPTORIUM_SECRET`. `lib/load-env.mjs` carga el
`.env` de la raíz de `zeus-sdk` si existe.

## Dependencias

- `@zeus/rooms` — cliente rooms (SocketClient con auth en constructor, RG-B).
- `@zeus/game-engine` — motor lógico (`createMapEngine`, escenas).

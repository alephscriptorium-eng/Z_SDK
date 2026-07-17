# @zeus/ping-pong-bots

Bots demo de canal (ping/pong/rabbit/spider/horse) que corren como **clientes de
sesión** del socket-server. Absorbidos desde `gea-sdk/packages/ping-pong`
(block-11 GA-C): ahora viven en el workspace de `zeus-sdk` y usan **`@zeus/rooms`
directamente** — el shim `lib/rooms.mjs` fue eliminado.

Los clientes ping/pong demuestran **eval / resolve**: ping envía expresiones aritméticas, pong las resuelve y responde.

## Scripts

```bash
npm run demo   # pong + ping + rabbit/spider/horse (launcher)
npm run ping   # solo emisor
npm run pong   # solo resolvedor
npm test       # tests unitarios de lib/session-participant.mjs
```

Desde la raíz del monorepo: `npm run demo` (delega aquí).

## Estructura

```
ping-pong-bots/
├── launch.mjs
├── run-one.mjs
├── lib/
│   ├── math.mjs                 # randomExpr, solveExpr
│   ├── horse-preset-hub.mjs     # hub RPC del rol horse
│   └── session-participant.mjs  # helper opt-in de sesión ZEUS
├── test/
│   ├── horse-preset.test.mjs
│   └── session-participant.test.mjs
└── apps/
    ├── ping/  pong/  rabbit/  spider/  horse/
```

## Cliente Rooms (`@zeus/rooms`)

Las apps importan **`@zeus/rooms`** directamente (`createClient(user)` →
SocketClient con `.io` + `.room(event,data,room)`, más `connectAndJoin`,
`config`, `loadScriptoriumConfig`, `resolveSessionRoom`, …). Como el paquete ya
está en el mismo workspace, no hay shim: el antiguo `lib/rooms.mjs` que
re-implementaba esa superficie sobre `SocketClient` se eliminó (block-11 GA-C).
Toda la configuración usa el esquema **`ZEUS_SCRIPTORIUM_*`** (el override legacy
`ROOMS_*` se retiró con la consolidación del registry, block-09).

## Modo sesión (opt-in)

Además del juego PING/PONG, los bots pueden entrar como **clientes de una sesión
ZEUS** y emitir una **selección atribuida** sobre el estado del player, sin
romper su juego actual.

- Se activa con `PING_SESSION_MODE=1` (por defecto **off** = comportamiento
  actual intacto).
- La room es única: en modo sesión toda la actividad (PING/PONG **y**
  `selection:cast`) ocurre en la **misma room del master**, resuelta con
  `ZEUS_SCRIPTORIUM_ROOM` (por defecto `scriptorium.default`). Los bots se
  conectan al **socket-server** (`ZEUS_SCRIPTORIUM_URL`, por defecto
  `http://localhost:3017` `/runtime`), no al servidor rooms remoto.
- Cada bot cachea el último snapshot que difunde el master por `SET_STATE`
  (wire local player-ui: payload `{type:'session:state', snapshot}` — no es el
  contrato room `state`/`intent` del engine), escoge una rev del **deck B**
  (`snapshot.decks.B.resolved.registros.items[].oldid`) y emite
  `ROOM_MESSAGE {event:'selection:cast', room, data:{actorId, kind:'registro', deckId:'B', targetId, label, meta}}`.
- **Estrategias distintas** para que se vea disputa de atribución:
  - `ping` selecciona el **primer** item (`actorId = ping-demo`);
  - `pong` selecciona el **último** item (`actorId = pong-demo`).
  - (También existe una estrategia `deterministic` en `lib/session-participant.mjs`.)
- Cadencia: por defecto emite en cada intercambio acertado; configurable con
  `PING_SESSION_EVERY=N`.
- Si aún no ha llegado snapshot o el deck no tiene revs, es un **no-op
  silencioso** (no rompe el juego).

### Cómo arrancar

Requiere **socket-server** (`:3017`) y **player-ui en modo room** (el
master de sesión) levantados, ambos en `zeus-sdk`. Luego, desde este paquete:

```bash
# emisor (elige el PRIMER item del deck B)
ZEUS_SCRIPTORIUM_ROOM=scriptorium.default PING_SESSION_MODE=1 node run-one.mjs ping

# resolvedor (elige el ÚLTIMO item del deck B)
ZEUS_SCRIPTORIUM_ROOM=scriptorium.default PING_SESSION_MODE=1 node run-one.mjs pong
```

En Windows PowerShell:

```powershell
$env:ZEUS_SCRIPTORIUM_ROOM='scriptorium.default'; $env:PING_SESSION_MODE='1'; node run-one.mjs ping
```

Sin master arriba, el bot no crashea: intenta conectar y, si no llega snapshot,
no emite selección.

## Variables de entorno

| Var | Rol |
| --- | --- |
| `PING_USER` / `PONG_USER` | identidad de cada app |
| `PING_INTERVAL_MS` | intervalo entre PINGs |
| `PING_SESSION_MODE=1` | activa el modo sesión (opt-in) |
| `ZEUS_SCRIPTORIUM_ROOM` | room de sesión (default `scriptorium.default`) |
| `ZEUS_SCRIPTORIUM_URL` | socket-server (default `http://localhost:3017`) |
| `ZEUS_SCRIPTORIUM_SECRET` | secreto de sesión (default `dev-secret`) |
| `PING_SESSION_EVERY` | emitir selección cada N intercambios (default 1) |

Configuración base en el `.env` de la raíz del monorepo (ver `.env.example`).

## Dependencias

- `@alephscript/mcp-core-sdk` — `SocketClient` (base del cliente Rooms local).

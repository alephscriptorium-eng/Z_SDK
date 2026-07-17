# Handshake externo — consumidores anónimos

La frontera pública del SDK es el registry `@zeus/*` (D-18): cualquier
runtime JS/TS (Node, Bun, navegador vía kits browser) puede instalar los
paquetes tipados y unirse a una room **sin** que Zeus conozca al consumidor
ni publique nada a medida.

## Variables de entorno

| Variable | Rol |
| -------- | --- |
| `ZEUS_SCRIPTORIUM_URL` | Base HTTP del transporte de rooms (sin hardcodear host:puerto en tu app) |
| `ZEUS_SCRIPTORIUM_ROOM` | Id de room (default de desarrollo: `PUBLIC_ROOM`) |
| `ZEUS_SCRIPTORIUM_USER` | Identidad de socket / registro |
| `ZEUS_SCRIPTORIUM_SECRET` | Token de auth (obligatorio si `NODE_ENV=production`) |

En desarrollo, `@zeus/rooms` aporta un secret por defecto solo cuando el secret
no está en el entorno. En producción falla cerrado sin `ZEUS_SCRIPTORIUM_SECRET`.

## Auth Socket.IO

Al conectar al namespace `/runtime`, el cliente envía:

```ts
auth: { token, room, user }
```

- `token` ← `ZEUS_SCRIPTORIUM_SECRET`
- `room` ← `ZEUS_SCRIPTORIUM_ROOM`
- `user` ← `ZEUS_SCRIPTORIUM_USER` (o el argumento de `createClient`)

Tras `connect`, el handshake de plataforma registra el cliente
(`CLIENT_REGISTER`) y se suscribe a la room (`CLIENT_SUSCRIBE`).

## Eventos del contrato

Wire event = kind del contrato único ([`@zeus/protocol`](/engine/protocol)):

| Kind | Dirección típica | Semántica |
| ---- | ---------------- | --------- |
| `intent` | cliente → autoridad | Petición de mutación tipada (`makeIntent`) |
| `state` | autoridad → room | Snapshot compacto |
| `track` | autoridad → room | Pista de navegación (no muta) |
| `ledger` | autoridad → room | Hecho append-only |

El campo `game` en el envelope discrimina el juego; el engine **no** nombra
juegos concretos. Roles de intent: `player` | `dj` | `operator`.

```ts
import {
  makeIntent,
  createIntentCatalog,
  validateIntent,
  EVENTS,
  type IntentPayload
} from '@zeus/protocol';
import { createClient, connectAndJoin, emitRoomEvent } from '@zeus/rooms';

const catalog = createIntentCatalog({
  ping: { roles: ['player'] }
});

const user = process.env.ZEUS_SCRIPTORIUM_USER ?? 'anon';
const client = createClient(user);
await connectAndJoin(client, user);

const intent: IntentPayload = makeIntent(
  user,
  'ping',
  { note: 'hello' },
  { game: 'smoke-game', role: 'player' }
);
validateIntent(intent, catalog);
emitRoomEvent(client, EVENTS.INTENT, intent);
```

Tipos `.d.ts` viajan en los tarballs de `@zeus/protocol` y `@zeus/rooms`
(`npm run release:dry` los verifica).

## Smoke reproducible

Desde el monorepo (sin publish al registry):

```bash
npm run smoke:external-consumer
```

Empaqueta tarballs, instala en un directorio **fuera** del workspace y corre
el consumidor con **Node** y **Bun**. Install-from-registry live queda
`⏳` hasta el pipeline de publish (ola 5 / U53).

Plantilla: `examples/external-consumer/`.

## Navegador

`ZEUS_OPEN_BROWSER` es **opt-in**: solo abre si vale exactamente `1`. Smoke y
e2e no lo setean.

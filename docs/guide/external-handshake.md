# Handshake externo — consumidores anónimos

La frontera pública del SDK es el registry `@zeus/*`: cualquier runtime
JS/TS (Node, Bun, navegador vía kits browser) instala los paquetes tipados
y se une a una room. Zeus trata al consumidor como anónimo: el contrato y
las variables de entorno bastan.

Esta guía es la puerta **Federar** del portal: peercard + rooms + (cuando
aplica) `ssbId` / firma de asiento. Catálogo de kits con versiones
citables: [Kits FOSS](/guide/kits-foss). Ids y rastro de planificación:
[estado del swarm](/guide/estado).

## Variables de entorno

| Variable | Rol |
| -------- | --- |
| `ZEUS_SCRIPTORIUM_URL` | Base HTTP del transporte de rooms (resolver vía `@zeus/rooms`) |
| `ZEUS_SCRIPTORIUM_ROOM` | Id de room (default de desarrollo: `PUBLIC_ROOM`) |
| `ZEUS_SCRIPTORIUM_USER` | Identidad de socket / registro |
| `ZEUS_SCRIPTORIUM_SECRET` | Token de auth (obligatorio si `NODE_ENV=production`) |

En desarrollo, `@zeus/rooms` aporta un secret por defecto solo cuando el
secret falta en el entorno. En producción el arranque exige
`ZEUS_SCRIPTORIUM_SECRET`.

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
| `track` | autoridad → room | Pista de navegación (observación) |
| `ledger` | autoridad → room | Hecho append-only |

El campo `game` en el envelope discrimina el juego; el engine habla el
protocolo común. Roles de intent: `player` | `dj` | `operator`.

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

Desde el monorepo (tarballs locales, sin registry):

```bash
npm run smoke:external-consumer
```

Empaqueta tarballs, instala en un directorio **fuera** del workspace y corre
el consumidor con **Node** y **Bun**. El install-from-registry live espera
el pipeline de publish verde — ver [estado](/guide/estado).

Plantilla: `examples/external-consumer/`.

## Navegador

`ZEUS_OPEN_BROWSER` es **opt-in**: solo abre si vale exactamente `1`. Smoke y
e2e dejan el default (cerrado).

## Federación SSB — ssbId + firma de asiento

Extensión del peer-card (D-20 paso 3). Distinto de la firma del conector v0
(D-40: «visor pide card»).

**Hecho en código y documentado aquí:** el handshake lleva `ssbId` y puede
exigir `seatSignature` (API `@zeus/protocol/peer-card-seat` + torno en
`@zeus/webrtc-signaling`). **Sigue abierto el seguimiento de producto** en
[Z_SDK#4](https://github.com/alephscriptorium-eng/Z_SDK/issues/4) — citar;
no cerrar desde esta página. Vista casa de la tubería (protege hoy / abierto):
[La tubería, protegida](https://s-sdk.escrivivir.co/guide/tuberia-protegida).

1. **`ssbId` en el handshake** — feed id `@….ed25519` viaja en la card y en
   los mensajes gated (`offer` / `answer` / `ice-candidate` / `join-room`).
   En el carril `SsbPrivateSignalingService` el torno exige `ssbId` por
   defecto (se amarra al `userId` / whoami si la card aún no lo trae).
2. **Firma de la tarjeta viajera** — `seatSignature` (ed25519 base64) sobre
   el payload canónico (`travelingPeerCardPayload` en `@zeus/protocol`).
   Firmar / verificar: `@zeus/protocol/peer-card-seat` (Node) o reexport en
   `@zeus/webrtc-signaling`. Si la card trae `seatSignature`, el torno la
   verifica y **rechaza** si falla; `requireSeatSignature: true` la hace
   obligatoria.

```js
import { makePeerCard, roleScope } from '@zeus/protocol';
import {
  generateSeatKeyPair,
  signTravelingPeerCard,
  SsbPrivateSignalingService,
  assertSignalingPeerCard
} from '@zeus/webrtc-signaling';

const keys = generateSeatKeyPair();
const card = signTravelingPeerCard(
  makePeerCard({
    roomId: 'oasis-private',
    endpoint: 'ssb:oasis',
    token: 'tok',
    scopes: [roleScope('player')],
    expiresAt: Date.now() + 60_000,
    sessionId: keys.ssbId
  }),
  keys.privateKey,
  keys.ssbId
);

assertSignalingPeerCard(card, {
  requireSsbId: true,
  requireSeatSignature: true
}); // { ok: true, role: 'player', ssbId }
```

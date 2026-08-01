# `@zeus/webrtc-signaling`

Señalización WebRTC (WP-U88 / WP-U90 / WP-U93 / D-17 / D-20).

## Piezas

| export | rol |
| ------ | --- |
| `SignalingService` | API abstracta (procedencia: `web-rtc-gamify-ui` SignalingService) |
| `SocketRoomSignalingService` | Impl. vía `@zeus/rooms` + trickle ICE (U88) |
| `SsbPrivateSignalingService` | Impl. vía DMs SSB `type: webrtc-signal` / ssb-box (U90) |
| `createInMemorySsbPrivateBus` | Pub mediador in-process (tests / e2e) |
| `createSbotPrivateTransport` | Adaptador duck-typed a `sbot.private.*` |
| `assertSignalingPeerCard` | Torno: forma + frescura + rol (U93) — **sin cambios** |
| `assertSignalingAdmission` | Admisión de antesala: `peer-card` (defecto) o `anonymous` (U197) |
| `SIGNALING_ADMISSION` | Los dos únicos modos declarados (U197) |
| `resolveIceServers` | Reexport de `@zeus/presets-sdk/env` |
| `negotiateDataChannel` | Helper DataChannel (`trickle` default true) |
| `negotiateDataChannelComplete` | Offer+answer completos, sin trickle (SSB) |

## Peer-card (torno WP-U93 / D-20)

La autoridad de sala **emite** el peer-card al join (`issuePeerCard` /
`startAuthority` en `@zeus/authority-kit`). Este paquete **exige** card
válida (`assertSignalingPeerCard`: fresca + con rol) antes de retransmitir
`join-room` / offer / answer / ICE.

```js
import { issuePeerCard } from '@zeus/authority-kit';
import { SocketRoomSignalingService } from '@zeus/webrtc-signaling';

const card = issuePeerCard({
  roomId: 'ROOM',
  endpoint: process.env.ZEUS_SCRIPTORIUM_URL,
  role: 'player',
  sessionId: 'alice'
});
const alice = new SocketRoomSignalingService({ url, room: 'ROOM' });
await alice.connect('alice');
await alice.joinRoom('ROOM', card); // sin card ⇒ rechazo
```

Identidad ad-hoc del handshake (`peerId` / `displayName` sueltos) queda
sustituida por el card (`sessionId` / `displayName` / `scopes` en el ticket).

## Antesala anónima (WP-U197) — `admisión ≠ permiso`

U186 fijó **transporte ≠ permiso**. U197 añade el corolario: la
**admisión** a la antesala WebRTC tampoco es permiso. El servicio declara
localmente su modo; el par remoto no lo negocia ni lo declara por el cable.

| modo | quién entra a la antesala | rol de la sesión |
| ---- | ------------------------ | ---------------- |
| `peer-card` (**defecto**, statu quo U93/U186) | sólo con card válida | el que acredite la card, consultado **en la acción** |
| `anonymous` (U197) | cualquiera, sin card | **`null` siempre** |

```js
import {
  SocketRoomSignalingService,
  SIGNALING_ADMISSION
} from '@zeus/webrtc-signaling';

const anon = new SocketRoomSignalingService({
  url,
  room: 'ROOM',
  admission: SIGNALING_ADMISSION.anonymous
});
await anon.connect('alice');   // sin card
await anon.joinRoom('ROOM');   // sin card
await anon.sendOffer('bob', offer); // offer/answer/ICE sin card
anon.getSessionRole(); // → null  (la antesala NO concede)
```

Invariantes que el modo anónimo **no** relaja:

1. **Card presentada e inválida RECHAZA**, jamás degrada a anónimo
   (invariante U186; vale también en modo anónimo).
2. **Claim sin sello deniega**: un mensaje anónimo que traiga `ssbId` —o
   un `from` con forma de feed SSB— se rechaza. Lo que no se acredita, no
   viaja: el cable anónimo sale sin `peerCard` y sin `ssbId`.
   **Incluido el `join-room`** (WP-U251, defecto 1): el anuncio de antesala
   saca `from: userId` al cable, así que `joinRoom()` juzga ese `from` con
   la misma regla que `sendOffer` / `sendAnswer` / `sendIceCandidate`.
   Antes no lo hacía: el anuncio anónimo salía con el claim puesto y la
   primera acción posterior lanzaba.
   ⇒ **Consecuencia declarada: el modo `anonymous` NO es compatible con un
   `userId` con forma de feed SSB** (`@…=.ed25519`). Con esa identidad,
   `joinRoom()` y las acciones gated denegan igual, con
   `anonymous signaling carries an unproven identity claim (ssbId)`. No es
   un bug: un feed id ES un claim de identidad, y anónimo es anónimo. Si
   quieres antesala anónima, usa un `userId` que no sea un feed; si quieres
   usar tu feed, preséntalo con card (`admission: 'peer-card'`).
3. **El modo no se negocia por el cable**: `admission` es config local;
   un payload que se declare anónimo no abre una antesala estricta.
4. **Cualquier exigencia configurada vuelve a exigir card** aunque el modo
   sea anónimo (`requiredRole`, `requireSsbId`, `requireSeatSignature`):
   la ausencia deniega. Las exigencias se leen **por truthiness**, igual
   que el torno U186 — `requireSsbId: 1` exige, no se descarta.
5. **`assertSignalingPeerCard` no cambia de semántica.** Es el portero que
   **importan** terceros (`@zeus/blob-sync-harness`,
   `@zeus/blobstore-client`); ante card ausente sigue denegando, con modo
   anónimo o sin él. Ojo con lo que esto *no* dice: hoy esos consumidores
   sólo lo invocan desde spikes y fixtures, no desde una ruta de datos
   viva — el motivo para no tocarlo es que **alguien lo importa**, no que
   proteja un carril en producción.
6. **El carril SSB no admite modo anónimo**: `SsbPrivateSignalingService.setAdmission('anonymous')`
   **lanza**, y **ninguna vía de configuración lo alcanza** — ni el
   constructor, ni `connect()`, ni un modo con espacio de más. En un carril
   cuyo transporte *es* la identidad del feed, anónimo no es un modo.
   ✎ *Alcance actualizado (WP-U251, defecto 2 — cierra la anotación de la
   contrarrevisión de 2026-07-31). El candado ya **no** es sólo un
   `override` sobre campo público. Son dos mitades:*
   - *la **ruidosa**: `setAdmission('anonymous')` sigue lanzando, para que
     la vía de configuración se entere;*
   - *la **estructural**: `#admission` es un campo **privado** de
     `SignalingService` (nadie lo escribe sin pasar por `setAdmission`) y
     el torno lee el modo por `getAdmission()`, que el carril SSB
     **sobrescribe a la constante `peer-card`**. Pinchar el campo o llamar
     `SignalingService.prototype.setAdmission.call(svc, 'anonymous')` ya no
     mueve el veredicto del torno: no lo mira.*
   - *Lo que sigue sin garantizarse: una **subclase** propia puede volver a
     sobrescribir `getAdmission()`. Eso ya es escribir otro servicio, no
     pinchar éste.*
7. **Un modo de admisión desconocido LANZA, no se degrada.** Vale para
   cualquier valor que no sea uno de los dos declarados, **incluidos los
   falsy** (`''`, `0`, `NaN`, `false`). Sólo `undefined` / `null` significan
   «no declarado» ⇒ statu quo `peer-card`. Un typo de despliegue no se
   depura a ciegas.

Estos invariantes valen **en los dos gemelos**. El de navegador
(`@zeus/webrtc-viewer` · `BrowserSocketSignalingService`) acepta las
mismas tres exigencias y expone `setAdmission` / `getSessionRole` /
`describeAdmission` / `getSsbId`. ✎ *Divergencia de U251 (defecto 5)
**cerrada y medida**: con `admission` falsy (`''`, `0`, `NaN`, `false`) el
lado Node aceptaba en silencio cayendo a `peer-card` y el de navegador
lanzaba. Ambas direcciones eran seguras pero **no idénticas**. Node sigue
ahora al navegador —gana la ruidosa— y los dos coinciden en los 9 valores
medidos (los 2 modos, 4 falsy, un typo no vacío, `undefined` y `null`).*

### Hook SSB (extensión Z_SDK #4)

Punto de enganche D-20 paso 3 (antes documentado sin implementar):

1. **`ssbId`** (`@….ed25519`) en la card y en el handshake de señalización.
   `SsbPrivateSignalingService` exige `ssbId` por defecto; si falta en la
   card al `joinRoom`, se toma del `userId` / whoami cuando es un feed id.
2. **`seatSignature`** — firma ed25519 del payload canónico de la tarjeta
   viajera (`travelingPeerCardPayload` / `signTravelingPeerCard` /
   `verifyTravelingPeerCard`). Presente ⇒ el torno verifica; inválida ⇒
   rechazo. `requireSeatSignature: true` la hace obligatoria.

```js
import {
  generateSeatKeyPair,
  signTravelingPeerCard,
  assertSignalingPeerCard
} from '@zeus/webrtc-signaling';

const keys = generateSeatKeyPair();
const signed = signTravelingPeerCard(card, keys.privateKey, keys.ssbId);
assertSignalingPeerCard(signed, { requireSsbId: true, requireSeatSignature: true });
```

No es ACL ni niveles (Z_SDK #5 / #6). La emisión TTL/campos no-crypto de la
card sigue en `@zeus/authority-kit` (`issuePeerCard`).

**Desde TypeScript** (WP-U251, defecto 6): el candado del carril SSB es
visible **en build**, no sólo en runtime — `setAdmission` está estrechado a
`'peer-card'` en `SsbPrivateSignalingService` y `admission?: 'peer-card'` en
sus opciones, así que `setAdmission('anonymous')` es un error de
compilación. `SsbPrivateSignalingOptions` declara además `requireSsbId` /
`requireSeatSignature` (el runtime siempre las leyó; el tipo las ocultaba),
y `setPeerCard` acepta las mismas dos en su `opts`. El carril de socket
**no** se estrecha: ahí `anonymous` es legal y sigue typecheckeando.
Sensor: `test/fixtures/ts-candado-ssb/consumidor.ts` bajo `tsc --noEmit`.

**Portería del carril LAN para blobs (WP-U100/U101 / D-21 fila 4):** el
transfer de blobs por DataChannel debe pasar por el mismo torno
(`assertSignalingPeerCard`). El cliente saliente
[`@zeus/blobstore-client`](../../mesh/blobstore-client/) (U101) y el harness
[`@zeus/blob-sync-harness`](../../mesh/blob-sync-harness/) (U100) reusan el
gate; cero torno nuevo. Plano datos WAN = `ssb-blobs` en el pub.

## Señalización por rooms (U88)

Wire events: `webrtc-offer` | `webrtc-answer` | `webrtc-ice-candidate` |
`join-room` | `leave-room`.

## Señalización por pub SSB (U90)

Mensajes privados cifrados (`recps` / ssb-box). El pub OASIS retransmite
ciphertext entre feedIds — **no** hay servidor de señalización dedicado ni
copy-paste de SDP.

```js
import {
  createInMemorySsbPrivateBus,
  SsbPrivateSignalingService,
  negotiateDataChannelComplete,
  resolveIceServers
} from '@zeus/webrtc-signaling';
import { issuePeerCard } from '@zeus/authority-kit';

const bus = createInMemorySsbPrivateBus();
const alice = new SsbPrivateSignalingService({
  transport: bus.createTransport('@alice.ed25519')
});
const bob = new SsbPrivateSignalingService({
  transport: bus.createTransport('@bob.ed25519')
});
await alice.connect('@alice.ed25519');
await bob.connect('@bob.ed25519');
const cardA = issuePeerCard({
  roomId: 'oasis-private',
  endpoint: 'ssb:oasis',
  role: 'player',
  sessionId: '@alice.ed25519'
});
const cardB = issuePeerCard({
  roomId: 'oasis-private',
  endpoint: 'ssb:oasis',
  role: 'player',
  sessionId: '@bob.ed25519'
});
await alice.joinRoom('oasis-private', cardA);
await bob.joinRoom('oasis-private', cardB);
// negotiateDataChannelComplete({ signaling: alice, remotePeerId: '@bob.ed25519', … })
```

Con sbot real: `createSbotPrivateTransport(sbot)`.

Adaptación del módulo Oasis `/webrtc` (sin copy-paste):
[`@zeus/oasis-webrtc`](../../mesh/oasis-webrtc/). Candidato upstream:
[`docs/UPSTREAM_PR.md`](../../mesh/oasis-webrtc/docs/UPSTREAM_PR.md).

## ICE (sin Google por defecto)

```js
import { resolveIceServers } from '@zeus/webrtc-signaling';

const iceServers = resolveIceServers();
```

Env: `ZEUS_WEBRTC_STUN`, `ZEUS_WEBRTC_TURN_URL` / `ZEUS_WEBRTC_TURN_USER` /
`ZEUS_WEBRTC_TURN_PASS`. Google STUN solo con
`ZEUS_WEBRTC_ALLOW_GOOGLE_STUN=1` (+ WARNING gigante).

## Tests

`npm test -w @zeus/webrtc-signaling`

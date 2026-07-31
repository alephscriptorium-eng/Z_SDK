# U186 · Paso 0 — Frontera del `room-join` (pregunta estrecha de O · D-O11)

WP-U186 (U93-bis · transporte ≠ permiso · P0 · ola 1 · BACKLOG :233).
Pregunta estrecha: ¿el `room-join` de `PEER_CARD_GATED_TYPES` gobierna la
sala genérica del runtime o SOLO la antesala WebRTC?

**Respuesta técnica: SOLO la antesala WebRTC.** La sala genérica del
runtime (CLIENT_REGISTER / CLIENT_SUSCRIBE) no pasa por ese torno en
ningún punto. Evidencia abajo, cita a cita.

---

## (a) Respuesta técnica, con evidencia

### a.1 Qué es el `room-join` del torno

- `packages/engine/webrtc-signaling/src/peer-card-gate.mjs:20-25` —
  `PEER_CARD_GATED_TYPES = Object.freeze(['offer','answer','ice-candidate','room-join'])`.
  Son **tipos abstractos del SignalingService**, no eventos del protocolo
  de salas del runtime.
- `packages/engine/webrtc-signaling/src/messages.mjs:28` — el abstracto
  `'room-join'` mapea al evento wire `'join-room'`
  (`ABSTRACT_TO_WIRE = { ..., 'room-join': 'join-room', ... }`).
- Ese `'join-room'` viaja como **payload de `ROOM_MESSAGE`** (evento de
  canal dentro de una sala ya suscrita), no como verbo de membresía:
  `packages/engine/webrtc-signaling/src/socket-room-signaling.mjs:124`
  (`emitRoomEvent(this._client, 'join-room', payload, roomId)`) →
  `packages/engine/rooms/src/index.mjs:126-128`
  (`emitRoomEvent` = `client.room(event, data, room)` = relay `ROOM_MESSAGE`).

### a.2 Quién emite `join-room` / `room-join`

Grep exhaustivo (`join-room|room-join` sobre `packages/ examples/ scripts/ test/ e2e/`):

- `packages/engine/webrtc-signaling/src/socket-room-signaling.mjs:109-125` —
  `joinRoom()` del servicio de señalización WebRTC (torno en `:113`
  `setPeerCard`, anuncio en `:124`).
- `packages/mesh/webrtc-viewer/src/browser/browser-signaling.mjs:164-172` —
  el cliente browser del visor WebRTC (mismo contrato de antesala).
- `packages/engine/webrtc-signaling/src/ssb-private-signaling.mjs:26` —
  carril SSB: `'room-join': 'room-join'` como señal en DM privado
  (`type: webrtc-signal`), también antesala.

Ningún emisor fuera del plano de señalización WebRTC.

### a.3 Quién consume `join-room` / `room-join`

- `packages/engine/webrtc-signaling/src/socket-room-signaling.mjs:154-162` —
  `_bindWireListeners()` escucha `SIGNALING_WIRE_EVENTS` (incluye
  `join-room`, `messages.mjs:13-21`) → `_onWirePayload` → `handleMessage`
  → torno (`signaling-service.mjs:186-222`).
- `packages/mesh/webrtc-viewer/src/core/webrtc-engine.mjs:426-428` —
  `message.type === 'room-join'` ⇒ `emit('peer-announced', …)`: dispara
  la creación de ofertas WebRTC. Es la **función real** del mensaje:
  anunciar un par en la antesala para iniciar la negociación.
- **Cero consumidores en el camino socket base**: grep de `join-room`
  sobre `packages/engine/rooms/src` y `packages/engine/socket-core/src`
  devuelve **0 matches** (verificado 2026-07-31 en este worktree).

### a.4 La sala genérica del runtime va por otro camino, sin torno

- `packages/engine/rooms/src/index.mjs:55-79` — `connectAndJoin()`:
  `CLIENT_REGISTER` (`:73`) con `peerCard` **opcional** (`:70-72`,
  «forwarded on CLIENT_REGISTER when present», `:52-53`) y
  `CLIENT_SUSCRIBE { room }` (`:77`). Ninguna llamada a
  `assertSignalingPeerCard` ni a `PEER_CARD_GATED_TYPES`.
- `packages/engine/socket-core/src/server.mjs:221-226` — el servidor
  registra los handlers `CLIENT_REGISTER` / `CLIENT_SUSCRIBE`;
  `onClientRegister` (`:254`) guarda el payload sin validar credencial
  (grep de `peerCard|peer-card` en `packages/engine/socket-core/src` =
  **0 matches**); `onClientSuscribe` (`:269-283`) solo consulta el ACL
  del handshake (`ensureRoomAllowed`, `:161-176` — allowlist de rooms del
  `authValidator`, un control de transporte, no de rol).
- Conclusión: **el transporte base del runtime ya admite anónimo**; el
  `room-join` del torno nunca gobernó esa membresía.

### a.5 Consecuencia para PEER_CARD_GATED_TYPES

Los 4 tipos (`offer`, `answer`, `ice-candidate`, `room-join`) son
acciones de la **capacidad opt-in WebRTC** (antesala). Conforme al
criterio del BACKLOG (:233, «si WebRTC es capacidad opt-in, sus gates
pueden quedarse»): **los 4 tornos SE QUEDAN; nada sale de la lista**,
porque nada en ella es transporte base.

El leak transporte≠permiso real está en el paquete de señalización, no
en la lista:

1. `socket-room-signaling.mjs:109-125` (estado previo a U186) —
   `joinRoom()` acoplaba el suscribe de transporte (`CLIENT_SUSCRIBE`,
   `:115`) detrás del torno (`setPeerCard`, `:113`). Aceptable como
   acción de antesala (la suscripción a la sala de señalización ES parte
   del opt-in), pero debe quedar documentado que el transporte base se
   establece en `connect()` y no exige card.
2. `connect()` (estado previo a U186) **ignoraba** una `peerCard`
   presentada en opciones: card inválida presentada en el connect ni se
   validaba ni se rechazaba — la sesión seguía como anónima de facto.
   Eso es exactamente la **degradación silenciosa** que el CA (3)
   prohíbe. Corregido en este WP: card presentada → se valida; inválida
   → **rechazo** del connect (sin sesión); ausente → sesión anónima
   `role:null`; el rol se consulta **en la acción**.

---

## (b) Pregunta de POLÍTICA que queda para O (D-O11)

La frontera técnica está confirmada; lo que Z no puede decidir es el
modelo de nodo de O. Queda para O:

1. **¿El nodo anónimo (`role:null`) es estado legítimo de primera clase
   en la sala genérica, también en federación?** Hoy el código lo admite
   de facto (a.4); falta la decisión de política que lo consagre o lo
   restrinja por entorno.
2. **¿Qué acredita la capacidad WebRTC?** El torno hoy exige «algún rol»
   (`roleFromPeerCard != null`, `peer-card-gate.mjs:59-62`) y
   opcionalmente un rol concreto por configuración
   (`requiredRole`). ¿Fija O un scope canónico de capacidad (p. ej.
   `role:player` mínimo, o un scope dedicado tipo `webrtc:join`)?
3. **¿El ACL del handshake es transporte o permiso?** La allowlist de
   rooms del `authValidator` (`socket-core/src/server.mjs:161-176`)
   restringe salas a nivel socket. ¿Queda como control de transporte o
   debe migrar al carril peer-card (una sola fuente de permiso)?

Z **no** espera estas respuestas para cerrar U186: la política es de O;
la frontera técnica queda confirmada aquí.

## (c) Contrato de retorno a O · WP-O13

**Z entrega a O:**
- Este documento (frontera con citas verificables por grep).
- La invariante implementada en `@zeus/webrtc-signaling`:
  - sin card ⇒ el transporte base conecta; sesión anónima `role:null`
    (`getSessionRole()` devuelve `null`);
  - card presentada ⇒ se valida en el momento; **inválida ⇒ rechazo**
    (connect/setPeerCard lanzan; jamás degrada a anónimo);
  - card válida ⇒ el rol se concede **en la acción** (torno por mensaje
    gated, `_gatedOutbound` / `handleMessage`);
  - acción sin rol ⇒ denegada con el cable intacto (la conexión de
    transporte sobrevive a la denegación).
- Los tests que fijan la invariante:
  `packages/engine/webrtc-signaling/test/transporte-permiso.test.mjs`.

**Z espera de vuelta (de O, en WP-O13):**
- Resolución D-O11 sobre (b): nodo anónimo de primera clase sí/no y en
  qué entornos; scope canónico de la capacidad WebRTC; destino del ACL
  de handshake.
- Si O resuelve distinto a lo asumido (WebRTC opt-in con tornos en la
  antesala), la membresía de `PEER_CARD_GATED_TYPES` se revisita en un
  WP de seguimiento — **no** se reabre U186.

---

*Worker Z · WP-U186 · rama `wp/u186-transporte-permiso` · 2026-07-31.*

---

✎ orquestador (2026-07-31, tras contrarrevisión PASS): añadir a la
resolución D-O11/O13 una pregunta explícita que la contrarrevisión
destapó — **amarre identidad↔card**: hoy la card es *bearer* (una card
válida de otra identidad se adopta sin amarre userId↔sessionId; diseño
pre-existente de U93, no defecto de U186; el carril SSB sí amarra
`ssbId`↔`from`). ¿Qué acredita la capacidad: el portador o el amarre?
Decisión de política de O; ejecución posterior en el plano peer-card (U188/U190).

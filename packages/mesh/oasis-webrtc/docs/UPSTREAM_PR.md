# PR candidato upstream — señalización SSB en `/webrtc` (OASIS)

**Target:** fork [`escrivivir-co/simple-ssb-webrtc`](https://github.com/escrivivir-co/simple-ssb-webrtc)
rama `oasis-pr` (referencia local: `plan/recursos/simple-ssb-webrtc` @ `7d5c757`).

**Origen en Zeus:** WP-U90 — `@zeus/webrtc-signaling` (`SsbPrivateSignalingService`)
+ `@zeus/oasis-webrtc` (adaptación del módulo).

## Motivación

El módulo `/webrtc` del fork usa señalización **copy-paste** (offer/answer en
base64 en textareas) y STUN de Google hardcodeado. El diseño declarado del
fork es mediación vía SSB; no estaba implementada.

Esta propuesta sustituye el intercambio manual por DMs privados
`type: 'webrtc-signal'` (ssb-box / `recps`) para que **el pub haga de
mediador** entre dos feedIds. Offer+answer **completos** (sin trickle ICE)
toleran la latencia del gossip.

## Cambios propuestos al fork (mapa)

1. **Backend** (`backend.js` o router Koa):
   - `POST /api/webrtc/signal` → `sbot.private.publish({ type: 'webrtc-signal', … }, recps)`
   - `GET /api/webrtc/inbox` (o stream live) → `sbot.private.read` filtrado por tipo
   - `GET /api/webrtc/ice` → lista desde config/env (sin Google en prod)
2. **Vista** (`webrtc_view.js`): quitar textareas `offer-code` / `answer-code` /
   `answer-input` / `remote-offer-input` y botones copy; añadir inputs de
   feedId local/peer + Offer / Listen.
3. **Cliente** (`webrtc-app.js`): publicar/consumir señales vía API; usar
   `waitForIceComplete` (ya presente); eliminar `encode`/`decode` base64 y
   flujo copy-paste; ICE desde `/api/webrtc/ice`.
4. **No** tocar el resto de módulos OASIS.

## Contrato de mensaje SSB

```json
{
  "type": "webrtc-signal",
  "signal": "offer | answer",
  "from": "@alice.ed25519",
  "to": "@bob.ed25519",
  "offer": { "type": "offer", "sdp": "…" },
  "recps": ["@bob.ed25519"]
}
```

Sin `signal: "ice-candidate"` en el camino por defecto (gossip).

## Referencia implementada en Zeus (no mergear el monorepo al fork)

| pieza Zeus | rol para el PR |
| ---------- | -------------- |
| `packages/engine/webrtc-signaling/src/ssb-private-signaling.mjs` | lógica SignalingService |
| `packages/engine/webrtc-signaling/src/ssb-private-transport.mjs` | `createSbotPrivateTransport` |
| `packages/mesh/oasis-webrtc/` | UI + HTTP bridge de referencia |

## Criterio de aceptación del PR

- Dos identidades SSB contra el mismo pub abren DataChannel **sin** servidor
  de señalización central y **sin** copy-paste de SDP.
- Cero literales `stun.l.google` en el módulo adaptado (config/env).
- Fork history: el flujo copy-paste desaparece del módulo (git conserva el
  histórico).

## Estado

Documentado como **candidato** desde Zeus (WP-U90). Apertura del PR en GitHub
del fork = paso humano / ops (este WP no hace `gh pr create`).

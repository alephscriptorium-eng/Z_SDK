# plan/recursos — clones externos de referencia

Repos externos clonados para que el swarm los tenga a mano (ola 10). **Están
gitignorados** (`plan/recursos/*` salvo este README): son referencia de solo
lectura, no código nuestro — lo que se reutilice se trae por WP con su
demolición/adaptación, nunca copy-paste silencioso (PRACTICAS §1.4).

> **Estado 2026-07-20 (GO usuario):** clones **retirados del disco** —
> la ola 10 (U88/U90) ya consumió lo reutilizable y no tenían cambios
> locales. Este README queda como procedencia; si un WP futuro los
> necesita, re-clonar con los comandos de abajo.

## Contenido y procedencia (clonado 2026-07-15)

| carpeta | origen | rama/commit | qué es |
| ------- | ------ | ----------- | ------ |
| `web-rtc-gamify-ui/` | github.com/escrivivir-co/web-rtc-gamify-ui | master @ `4b9271b` (2025-09-04) | Librería Angular 20.2 WebRTC hermana de operator-ui: `WebRTCEngine` (mesh de peers, rooms, DataChannel+audio+video), `SignalingService` **abstracta** con impl. socket.io (`WebRTCAlephClient`, protocolo AlephScript `CLIENT_REGISTER/SUSCRIBE/MAKE_MASTER`) y componentes visor (`peer-list`, `media-controls`, `data-channels/chat`). Beta: core 100%, UI ~90%, testing navegador 0%. |
| `simple-ssb-webrtc/` | github.com/escrivivir-co/simple-ssb-webrtc | **oasis-pr** @ `7d5c757` (2026-03-16) | Fork de OASIS con módulo `/webrtc` (vista hyperaxe + `webrtc-app.js`): conexión 1:1 data/AV con señalización **copy-paste manual** (offer/answer en base64, `waitForIceComplete` sin trickle). La señalización vía SSB es objetivo de diseño, NO está implementada. |

Para re-clonar:

```bash
cd plan/recursos
git clone https://github.com/escrivivir-co/web-rtc-gamify-ui
git clone --branch oasis-pr https://github.com/escrivivir-co/simple-ssb-webrtc
```

## Hallazgos que condicionan la ola 10

1. **Ambos repos hardcodean STUN de Google** (idéntico par):
   `stun:stun.l.google.com:19302` + `stun1…` — en
   `web-rtc-gamify-ui/projects/webrtc-ui-lib/src/lib/integration/webrtc-engine.service.ts:104`
   (y `core/models/webrtc-config.interface.ts:50`) y en
   `simple-ssb-webrtc/src/client/public/js/webrtc-app.js:11-14`. **Ninguno
   trae TURN.** Ver D-17: en nuestro mesh los iceServers salen de env
   (`presets-sdk/env`), Google jamás en producción.
2. **La pieza a reutilizar es el motor + la abstracción**: `WebRTCEngine` es
   agnóstico de transporte; `SignalingService` es una clase abstracta
   (`connect/joinRoom/sendOffer/sendAnswer/sendIceCandidate`) pensada para
   implementaciones nuevas — nuestra señalización por rooms socket-server
   (WP-U88) y la mediación por el pub SSB (WP-U90) son dos impls de esa
   interfaz.
3. **El módulo Oasis de B es el esqueleto del visor en el pub** (ruta Koa
   `/webrtc`, gate `webrtcMod`, i18n): lo que le falta es el transporte —
   sustituir los textarea copy-paste por señalización real.
4. El contrato de mensajes ya existe en A
   (`webrtc-offer|answer|ice-candidate|join-room|…` + enum
   `signaling-message.model.ts`) — WP-U88 lo adopta en vez de inventar otro.

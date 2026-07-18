# `@zeus/oasis-webrtc`

Adaptación del módulo `/webrtc` de
[`simple-ssb-webrtc`](../../../plan/recursos/README.md) (repo B @ `7d5c757`).

## Qué cambia respecto al fork

| fork (recursos/, intacto) | esta adaptación |
| ------------------------- | --------------- |
| Textareas copy-paste offer/answer | feedIds SSB + API `/api/webrtc/*` |
| Google STUN hardcodeado | `resolveIceServers` vía `/api/webrtc/ice` |
| Solo frontend | Endpoint backend sobre transporte sbot / bus |

El fork original en `plan/recursos/simple-ssb-webrtc/` **no se modifica**.

## Arranque

```bash
# puerto desde presets-sdk (ZEUS_PORT_OASIS_WEBRTC, default 3022)
npm run start -w @zeus/oasis-webrtc

# abrir navegador solo si opt-in:
ZEUS_OPEN_BROWSER=1 npm run start -w @zeus/oasis-webrtc
```

## API

| ruta | rol |
| ---- | --- |
| `GET /webrtc` | página adaptada (sin copy-paste) |
| `GET /api/webrtc/ice` | `iceServers` desde env |
| `GET /api/webrtc/whoami` | registra feed + mailbox |
| `POST /api/webrtc/signal` | publica DM `type: webrtc-signal` |
| `GET /api/webrtc/inbox` | poll de DMs privados |

Header `X-SSB-Feed` o body/query `feedId` identifica la identidad local.
Con sbot real: inyectar `createSbotPrivateTransport(sbot)` en el bus/mapa
de transports (ver `@zeus/webrtc-signaling`).

## Upstream

Candidato a PR sobre el fork OASIS: [docs/UPSTREAM_PR.md](./docs/UPSTREAM_PR.md).

## Tests

`npm test -w @zeus/oasis-webrtc`

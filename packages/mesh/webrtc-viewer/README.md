# `@zeus/webrtc-viewer`

Visor WebRTC del mesh (WP-U89 / D-17): **salas y privados**, audio/vídeo/datos,
hermano Angular de `operator-ui`, sobre motor adaptado de
`web-rtc-gamify-ui` (repo A @ `4b9271b`).

## Piezas

| pieza | rol |
| ----- | --- |
| `WebRTCEngine` | peers + media + DataChannel (procedencia A; ICE vía `resolveIceServers`) |
| `BrowserSocketSignalingService` | señalización rooms en navegador (wire U88 completo) |
| `projects/webrtc-ui-lib` | Angular: peer-list / media-controls / chat (port anotado) |
| `serve.mjs` | host Express + `/api/validate-cache` (U80 / linea-kit) |
| `game-bridge` / `game-actions` | botones HORSE contacto → URL del visor |

**Regla dura:** WebRTC no es verdad de estado. El visor mantiene un cliente de
room de juego aparte para `state`/`ledger`/`track`; el DataChannel es media,
chat y **bulk cache** (validado contra manifests U80).

## Arranque

```bash
npm start -w @zeus/webrtc-viewer
# o: node packages/mesh/webrtc-viewer/serve.mjs
```

Puerto: `ZEUS_PORT_WEBRTC_VIEWER` / preset `webrtcViewer` (default en
`DEFAULT_ZEUS_UI_MESH`). Navegador solo si `ZEUS_OPEN_BROWSER=1`.

## Botones en el juego

En la vista jugador (arg-console), el menú de contacto HORSE incluye
`WebRTC · llamar|compartir|colgar` → abre el visor con `?action=&peer=`.

## Demolición vs repo A

- Sin STUN Google hardcodeado (defaults de A demolidos).
- Señalización: nombres wire completos (`webrtc-offer`, …) — no quirk A
  `type.replace('webrtc-', '')`.
- Código A entra como port con `data-provenance` / comentarios de procedencia,
  no copia muerta.

## Tests

```bash
npm test -w @zeus/webrtc-viewer
node e2e/webrtc-viewer.mjs
```

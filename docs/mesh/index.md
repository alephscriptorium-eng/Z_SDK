# Mesh — mundo B

Operar y jugar: transporte, UIs de malla, browsers de volúmenes, monitores.

| Pieza (hoy) | Rol |
| ----------- | --- |
| `socket-server` | Transporte rooms Socket.IO `/runtime` |
| `player-ui` | DJ / tablero de líneas — **vista de mesh**; la autoridad vive en el juego |
| `operator-ui` + `operator-bridge` | Shell Angular tier-2 + puente al contrato vivo |
| `cache-browser` / `firehose-browser` | Browsers REST (+ proyección MCP vía http-contract) |
| `console-monitor` | Monitor de consola |
| `3d-monitor` / `player-3d-ui` | Portal de vistas 3D / visor de room |
| `linea-system` / `linea-firehose` / `solar-system` | MCP servers de corpus / demo |
| `oasis-webrtc` | Módulo `/webrtc` OASIS adaptado — señalización SSB privada |
| coturn (VPS) | STUN/TURN propio para WebRTC — [runbook](./coturn-runbook.md) |

```bash
npm run start:socket-server
npm run start:player
npm run start:cache-browser
npm run start:firehose
npm run start:3d-monitor
npm run start:oasis-webrtc
```

Specs Redoc: [player-ui](/api/player-ui.html) ·
[cache-browser](/api/cache-browser.html) ·
[firehose-browser](/api/firehose-browser.html) ·
[MCP HTTP](/api/mcp-http.html).

La **autoridad del juego** vive en el paquete del juego (p. ej.
`arg-demos` / pozo); player-ui proyecta y emite intents.

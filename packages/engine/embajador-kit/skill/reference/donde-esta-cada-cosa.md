# Dónde está cada cosa

Mapa destilado del canal C8 (registry
`https://npm.scriptorium.escrivivir.co`) + guías publicadas. Versiones de
ejemplo = **corte 2026-07-22**; revalidá con `npm view` o
[kits-foss](https://z-sdk.escrivivir.co/guide/kits-foss).

## Catálogo · publicado (FOSS / instalable)

| Paquete | Corte ej. | Rol |
| ------- | --------- | --- |
| `@zeus/protocol` | `0.4.0` | Contrato + peercard / seat |
| `@zeus/rooms` | `0.1.1` | Cliente Socket.IO / join |
| `@zeus/player-mcp-kit` | `0.1.3` | Un MCP por actor |
| `@zeus/embajador-kit` | `0.1.1` | Emitir / consumir credencial peercard |
| `@zeus/parte-kit` | `0.1.1` | Parte tipada + campanas desde parte |
| `@zeus/acta-kit` | `0.1.1` | Acta de barrio |
| `@zeus/lifecycle-kit` | `0.1.1` | Ciclo de vida de instancia |
| `@zeus/ciudad-lifecycle` | `0.1.1` | Lifecycle MCP ciudad (**ojo:** dep `mcp-launcher` puede tumbar install) |
| `@zeus/operator-bridge` | `0.1.2` | Ledger/state → hub; `campanasFromLedger` |
| `@zeus/authority-kit` | `0.4.1` | Autoridad / peercard issue helpers |
| `@zeus/presets-sdk` | `0.1.2` | Presets |
| `@zeus/room-client-browser` | `0.1.3` | Cliente room browser |
| `@zeus/ui-3d-kit` | `0.1.3` | UI 3D kit |

Imports estables (anti-deprecated):

- `@zeus/protocol/peer-card`
- `@zeus/protocol/peer-card-seat`
- `@zeus/embajador-kit` → `emitirCredencial` / `consumirCredencial`
- `@zeus/operator-bridge` → `campanasFromLedger`
- `@zeus/parte-kit` → `campanasDesdeParte`

## Catálogo · private / 404 en registry

| Nombre | Realidad | Qué hacer |
| ------ | -------- | --------- |
| `@zeus/ciudad` | 404 | Solo monorepo games-library / startpack local |
| `@zeus/startpack-ciudad` | 404 | Ref `startpack-ciudad-v0.1.0` es id de producto; no `npm i` C8 |
| `@zeus/operator-ui` | `private: true` / 404 | Build Angular en monorepo (`build:operator-ui`); sin `dist` no hay UI |
| `@zeus/socket-server` | `private: true` / 404 | Room live = monorepo; necesita deps de install tip |
| `@zeus/mcp-launcher` | private / 404 | Bloquea install conjunto con `ciudad-lifecycle` |
| `@zeus/room-client` | 404 | Usá `@zeus/rooms` / `@zeus/room-client-browser` |
| `@zeus/parte` · `@zeus/acta` · `@zeus/lifecycle` | 404 | Usá `*-kit` |

## Recetas

### A · Puerta peercard (C8)

```bash
npm install @zeus/protocol @zeus/embajador-kit --registry https://npm.scriptorium.escrivivir.co
```

- Seat API: `@zeus/protocol/peer-card-seat`
- Credencial: `@zeus/embajador-kit`
- Guía: https://z-sdk.escrivivir.co/guide/external-handshake
- Rango protocol observado en puerta tick-cero vs authority: `0.3.x` y
  `0.4.x` coexisten en fixtures; preferí `npm view` + docs, no un pin
  único inventado.

### B · Sensor campana (ledger, sin UI)

```bash
npm install @zeus/parte-kit @zeus/operator-bridge --registry https://npm.scriptorium.escrivivir.co
```

- `campanasDesdeParte` / `campanasFromLedger` — clases de campana en
  proceso Node; **no** implica audio en `operator-ui`.

### C · Mesh live (monorepo; no es C8-puro)

Orden típico si trabajás el árbol:

1. `socket-server` (room)
2. authority / ciudad (startpack)
3. MCP ciudad (puerto ej. `ZEUS_MCP_CIUDAD=4133`)
4. build + serve `operator-ui`

Puertos / secret: `ZEUS_PORT_SCRIPTORIUM`, `ZEUS_SCRIPTORIUM_SECRET`, etc.
(ver handshake). Si `mcp-core-sdk` falta en `node_modules` del tip, el
socket no arranca — gap de install, no de peercard.

### D · Misiones

Viven en el pack ciudad (smoke de dominio). Tools MCP expuestos típicos:
`join` / `walk` / `announce` / `wake` / `state` / `leer_parte` — **no**
hay `player_misión` en la card MCP.

## Confusiones frecuentes

| Confusión | Aclaración |
| --------- | ---------- |
| «Instalé kits → ya tengo ciudad+UI» | Kits FOSS ≠ mesh private |
| «Campana C05 = suena el browser» | Cable ledger ≠ audio UI |
| «parte / acta sin -kit» | Nombres reales llevan `-kit` |
| `npm search @zeus` en registry | Puede devolver ruido público; usá `npm view` paquete a paquete |
| PowerShell `@zeus/...` | Siempre comillas dobles |

## Issues abiertos (citar, no cerrar)

- Z_SDK #4 — https://github.com/alephscriptorium-eng/Z_SDK/issues/4
- Z_SDK #5 — https://github.com/alephscriptorium-eng/Z_SDK/issues/5
- Z_SDK #6 — https://github.com/alephscriptorium-eng/Z_SDK/issues/6

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
| `@zeus/embajador-kit` | `0.1.2` | Emitir / consumir credencial peercard (+ `skill/`) |
| `@zeus/parte-kit` | `0.1.1` | Parte tipada + campanas desde parte |
| `@zeus/acta-kit` | `0.1.1` | Acta de barrio |
| `@zeus/lifecycle-kit` | `0.1.1` | Ciclo de vida de instancia |
| `@zeus/ciudad-lifecycle` | `0.1.1` | Lifecycle MCP ciudad (dep `mcp-launcher` en C8) |
| `@zeus/mcp-launcher` | `0.1.1` | Launcher MCP (C8) |
| `@zeus/socket-server` | `0.1.1` | Room live Socket.IO (C8) |
| `@zeus/ciudad` | `0.1.0` | Juego ciudad (clase semilla pública) |
| `@zeus/startpack-ciudad` | `0.1.0` | Start pack ciudad |
| `@zeus/startpack-kit` | `0.1.0` | Loader `loadStartPack` |
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

## Catálogo · private / build-doc (no C8 tarball)

| Nombre | Realidad | Qué hacer |
| ------ | -------- | --------- |
| `@zeus/operator-ui` | `private: true` · **sello PO = B (build-doc)** | No `npm i` C8. Desde monorepo zeus: `npm run build:operator-ui` luego `npm run start:operator-ui` (puerto `OPERATOR_UI_PORT`/`3020`; deps room vía `ZEUS_SCRIPTORIUM_URL`). Detalle: `packages/mesh/operator-ui/README.md`. |
| `@zeus/room-client` | 404 | Usá `@zeus/rooms` / `@zeus/room-client-browser` |
| `@zeus/parte` · `@zeus/acta` · `@zeus/lifecycle` | 404 | Usá `*-kit` |

## Recetas

### A · Puerta peercard (C8)

```bash
npm install "@zeus/protocol" "@zeus/embajador-kit" --registry https://npm.scriptorium.escrivivir.co
```

- Seat API: `@zeus/protocol/peer-card-seat`
- Credencial: `@zeus/embajador-kit`
- Guía: https://z-sdk.escrivivir.co/guide/external-handshake
- Rango protocol observado en puerta tick-cero vs authority: `0.3.x` y
  `0.4.x` coexisten en fixtures; preferí `npm view` + docs, no un pin
  único inventado.

### B · Sensor campana (ledger, sin UI)

```bash
npm install "@zeus/parte-kit" "@zeus/operator-bridge" --registry https://npm.scriptorium.escrivivir.co
```

- `campanasDesdeParte` / `campanasFromLedger` — clases de campana en
  proceso Node; **no** implica audio en `operator-ui`.

### C · Mesh live (C8 + operator-ui build-doc)

1. `npm install "@zeus/socket-server" "@zeus/ciudad" "@zeus/startpack-ciudad" "@zeus/mcp-launcher"` (registry C8)
2. Arrancar socket + authority/ciudad + MCP
3. **operator-ui** (private): en monorepo zeus `npm run build:operator-ui` → `npm run start:operator-ui`

Puertos / secret: `ZEUS_PORT_SCRIPTORIUM`, `ZEUS_SCRIPTORIUM_SECRET`, etc.
(ver handshake).

### D · Misiones

Viven en el pack ciudad (smoke de dominio). Tools MCP expuestos típicos:
`join` / `walk` / `announce` / `wake` / `state` / `leer_parte` — **no**
hay `player_misión` en la card MCP.

## Confusiones frecuentes

| Confusión | Aclaración |
| --------- | ---------- |
| «Instalé kits → ya tengo UI» | Kits/ciudad C8 ≠ `operator-ui` (build-doc B) |
| «Campana C05 = suena el browser» | Cable ledger ≠ audio UI |
| «parte / acta sin -kit» | Nombres reales llevan `-kit` |
| `npm search @zeus` en registry | Puede devolver ruido público; usá `npm view` paquete a paquete |
| PowerShell `@zeus/...` | Siempre comillas dobles `"@zeus/..."` |

## Issues abiertos (citar, no cerrar)

- Z_SDK #4 — https://github.com/alephscriptorium-eng/Z_SDK/issues/4
- Z_SDK #5 — https://github.com/alephscriptorium-eng/Z_SDK/issues/5
- Z_SDK #6 — https://github.com/alephscriptorium-eng/Z_SDK/issues/6

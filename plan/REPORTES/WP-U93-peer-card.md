# WP-U93 · peer-card — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-18 |
| rama | `wp/u93-peer-card` |
| commit(s) | `4540217`, `ded33fc`, `c09b7ed` (+ este reporte) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se cableó la cadena D-20 en ambos extremos (anti A-02 / media cadena):
`@zeus/authority-kit` **emite** peer-card al aceptar intent `join`
(`issuePeerCard` → `makePeerCard`); `@zeus/webrtc-signaling` **exige** card
válida (`assertSignalingPeerCard`: forma + frescura + rol) antes de
`join-room` / offer / answer / ICE. Se demolió la identidad ad-hoc
`peerId`/`displayName` del handshake de señalización. El README de
webrtc-signaling documenta el hook SSB como extensión explícita (cero código
SSB nuevo). E2e de cadena completa + e2e WebRTC existentes en verde.

## Archivos tocados

- `packages/engine/authority-kit/src/issue-peer-card.mjs` — creado (`issuePeerCard`)
- `packages/engine/authority-kit/src/create-authority.mjs` — emisión al join + `onPeerCard` / `peerCards`
- `packages/engine/authority-kit/src/index.mjs` + README + test — exports y CA emit
- `packages/engine/webrtc-signaling/src/peer-card-gate.mjs` — creado (torno)
- `packages/engine/webrtc-signaling/src/signaling-service.mjs` — gate outbound/inbound
- `packages/engine/webrtc-signaling/src/socket-room-signaling.mjs` — `joinRoom(roomId, peerCard)`
- `packages/engine/webrtc-signaling/src/ssb-private-signaling.mjs` — idem + wire peerCard
- `packages/engine/webrtc-signaling/src/index.mjs` + types + README + tests + package.json
- `packages/mesh/webrtc-viewer/**` — callers browser/engine al card
- `e2e/peer-card-chain.mjs` — creado (cadena emite-y-exige)
- `e2e/webrtc-signaling.mjs` / `ssb-webrtc-signaling.mjs` / `webrtc-viewer.mjs` — cards
- `package.json` — script `e2e:peer-card-chain`
- `.changeset/wp-u93-peer-card.md` — bump minor authority-kit + webrtc-signaling

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Unit `@zeus/authority-kit` — OK (12)

```
# tests 12
# suites 4
# pass 12
# fail 0
```

### Unit `@zeus/webrtc-signaling` — OK (18)

```
# tests 18
# pass 18
# fail 0
```

(incluye rechazo card caducada / sin rol)

### E2e cadena completa — OK

```
Gate rejects expired / no-role cards
…
e2e:peer-card-chain OK — authority emit + signaling require + DataChannel
```

### E2e WebRTC — OK

```
e2e:webrtc-signaling OK — DataChannel open, ping delivered, no Google ICE
e2e:ssb-webrtc-signaling OK — DataChannel open via pub-mediated SSB DMs, ping delivered, no copy-paste, no Google ICE
e2e:webrtc-viewer OK — chat + bulk U80 + game state after hangup
```

### Juegos (regla de los dos) — OK

```
@zeus/arg-domain: # tests 72 # pass 72 # fail 0
@zeus/pozo: # tests 9 # pass 9 # fail 0
@zeus/webrtc-viewer: # tests 6 # pass 6 # fail 0
```

### Gates / lint

```
gates: OK (0 offenders)

✖ 12 problems (0 errors, 12 warnings)
```

(warnings preexistentes ajenos; 0 errors)

### Preguntas CA (obligatorias)

| pregunta | respuesta |
| -------- | --------- |
| ¿Emite-y-exige en ambos extremos? | **Sí** — autoridad emite al join; signaling exige antes de offer/answer/ICE |
| ¿Test caducada / sin rol? | **Sí** — unit `peer-card-gate.test.mjs` + asserts en e2e cadena |
| ¿E2e cadena + e2e WebRTC verdes? | **Sí** — `e2e:peer-card-chain` + tres e2e WebRTC OK |
| ¿README hook SSB sin código SSB nuevo? | **Sí** — sección «Hook SSB» en README; grep sin imports SSB nuevos en U93 |

## Demolición

Campos ad-hoc del handshake de señalización (`peerId` / `displayName` sueltos
en join-room / wire) sustituidos por `peerCard`.

```
rg -n "peerId: this\.userId|displayName, peerId|data: \{ peerId" \
  packages/engine/webrtc-signaling \
  packages/mesh/webrtc-viewer/src/browser --glob '*.mjs'
# (sin matches)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: e2e usa `13093` (exento como resto
      e2e); runtime vía `ZEUS_SCRIPTORIUM_URL` / `peerCardEndpoint` / rooms
- [x] Cadenas if/switch → tabla: `PEER_CARD_GATED_TYPES` / Set; no cadenas nuevas
- [x] Duplicación: reutiliza `makePeerCard` / helpers de protocol; gate en
      subpath browser-safe; browser-signaling importa el mismo gate
- [x] console.log / código comentado / TODO sin backlog: no en producción;
      e2e usa logs de progreso
- [x] Nombres de transición: no
- [x] Demolición completa (grep arriba): sí en handshake signaling
- [x] Tests de comportamiento: rechazo expired/no-role; emit on join; e2e
      DataChannel con cards emitidas
- [x] Arranque: e2e headless con socket-server + autoridad + signaling;
      browser UI ⏳ (`ZEUS_OPEN_BROWSER` opt-in, no abierto)
- [x] README authority-kit + webrtc-signaling actualizados (hook SSB)
- [x] Diff solo alcance WP: sí (se descartó churn LF en bins ajenos tras npm install)

## Hallazgos fuera de alcance

- Coturn VPS sigue ⏳ (ops; cola U88/U90).
- El visor browser emite un peer-card local con `makePeerCard` (ticket de
  sesión UI); la emisión «de verdad» de sala sigue siendo authority-kit al
  join — el viewer aún no consume `onPeerCard` de una autoridad viva.
- `userId` de socket sigue siendo dirección de transporte (routing to/from);
  solo se demolió la identidad ad-hoc del handshake que el card cubre.

## Dudas / bloqueos

Ninguna. Push: **no intentado** (política swarm).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_

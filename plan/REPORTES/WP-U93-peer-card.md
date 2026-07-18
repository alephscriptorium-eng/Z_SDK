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

**Aceptado ✅** — 2026-07-18 (orquestador). Diff + CA + PRACTICAS OK.
Merge **no** ejecutado en esta revisión (pedido explícito). BACKLOG ✅
**no** marcado (pedido explícito). Push: no intentado.

### Qué se verificó

- Diff `master...wp/u93-peer-card`: 28 archivos / +1211 −90; alcance
  authority-kit emit + webrtc-signaling gate + callers viewer/e2e +
  README + changeset; **sin** `plan/BACKLOG.md` en el diff.
- Commits convencionales: `feat(authority-kit)`,
  `feat(webrtc-signaling)!`, `test(e2e)`, `docs(plan)`.
- **CA ambos extremos (emite y exige — no y/o):**
  - Emit: `issuePeerCard` → `makePeerCard`; `startAuthority` emite al
    aceptar `join` (`onPeerCard` / `peerCards`). Unit
    `emite peer-card al join` + e2e cadena.
  - Exige: `assertSignalingPeerCard` en outbound (`_gatedOutbound`) e
    inbound (`handleMessage`) para offer/answer/ICE/room-join.
  - Anti A-02: consumidores de producción fuera de protocol
    (`authority-kit` + `webrtc-signaling`); protocol solo fabrica/helpers.
- **CA rechazo caducada / sin rol:** unit `peer-card-gate.test.mjs` +
  asserts embebidos en `e2e:peer-card-chain` (re-run OK).
- **CA e2e:** re-run literal —
  - `e2e:peer-card-chain OK — authority emit + signaling require + DataChannel`
  - `e2e:webrtc-signaling OK — DataChannel open, ping delivered, no Google ICE`
  - `e2e:ssb-webrtc-signaling OK — … via pub-mediated SSB DMs…`
  - Units: authority-kit 12/12; webrtc-signaling 18/18.
- **CA README hook SSB:** sección «Hook SSB (extensión explícita)» en
  `webrtc-signaling/README.md`; diff U93 no añade imports/código SSB
  nuevo (solo docs + wire `peerCard` en `ssb-private-signaling` ya
  existente).
- **Demolición:** `rg peerId: this.userId|displayName, peerId|data: { peerId`
  en signaling + viewer browser → ZERO.
- PRACTICAS §1–3/§6: OK (tabla `PEER_CARD_GATED_TYPES`; sin nombres de
  transición; auto-revisión honesta; alcance acotado).

### Hallazgos → cola (no arreglados en revisión)

1. **Viewer fabrica card local** — `webrtc-viewer/.../viewer-app.mjs`
   llama `makePeerCard` como ticket UI; no consume `onPeerCard` de
   autoridad viva. Emisión canónica de sala = authority-kit al join.
2. **Coturn VPS** — sigue ⏳ (ops; cola U88/U90).
3. **`userId` socket = routing** — dirección de transporte to/from;
   no demolido (correcto: el card cubre identidad de handshake, no
   routing).

### Acción siguiente

Usuario/orquestador en master: merge `wp/u93-peer-card` cuando se
autorice; entonces BACKLOG 🔶→✅ + volcar hallazgos a cola +
`git worktree remove`. Push: no intentado.

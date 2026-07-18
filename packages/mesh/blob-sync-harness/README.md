# `@zeus/blob-sync-harness` (WP-U100 spike)

Harness **mínimo de validación** para el spike blob-sync Oasis 2-nodos
(D-21 fila 5). **No** es el servicio/sidecar de blobs del pub (D-21 fila 4b):
zeus solo valida el contrato; el equipo del pub entrega `blobs.*` / `ssb-blobs`.

## Qué cubre

| pieza | rol |
| ----- | --- |
| content-address | `cid` = sha256; chunk-as-blob bajo el soft-max 50 MB (A-11 / D-14) |
| two-node sync | put/want/get por cid entre dos nodos in-process (fixture CA) |
| LAN gate | peer-card **U93** como portero del DataChannel — reusa `assertSignalingPeerCard`, cero torno nuevo |
| live probe | `ZEUS_BLOB_*` → evidencia live o **⏳** honesto si ops no entrega |
| veredicto | `despeja` / `no despeja` compromiso de U101 |

## Peer-card U93 = portero del carril LAN

El carril LAN (WebRTC DataChannel, D-20/D-21 fila 4) **exige** peer-card
válida antes de transferir blobs. Este harness llama a
`assertSignalingPeerCard` de `@zeus/webrtc-signaling` — el mismo torno U93.
No se reabre ni se reimplementa.

Carril WAN (`ssb-blobs` vía sidecar del pub): documentado como pendiente de
ops; `assertWanBlobTransferPendingSidecar()` lo deja explícito.

## Sync 2-nodos (fixture, sin red)

```bash
npm test -w @zeus/blob-sync-harness
npm run spike -w @zeus/blob-sync-harness
# o desde la raíz:
npm run e2e:blob-sync-spike
```

## Live ops (cuando el pub entregue cliente/sidecar)

| Env | Uso |
| --- | --- |
| `ZEUS_BLOB_SIDECAR_URL` | Base URL del sidecar `blobs.*` |
| `ZEUS_BLOB_SYNC_NODE_A` | Identidad / endpoint nodo A |
| `ZEUS_BLOB_SYNC_NODE_B` | Identidad / endpoint nodo B |

Si faltan → probe = `⏳` (no se abre red). Con las tres → `ready` (este
harness mínimo **no** dialea aún el sidecar; U101 consumirá la API real).

`ZEUS_OPEN_BROWSER` no aplica (CLI headless).

## Regla de los dos juegos

Infra mesh/ops: cero nombres exclusivos de delta/pozo.

## Fuera de alcance (a propósito)

- Implementar el sidecar Oasis / `ssb-blobs` producto
- WP-U101 (carril saliente hermano U84)
- Horizonte U71 (p2p pleno)
- Re-abrir U84 (entrante SSB→VOLUMES)

# `@zeus/blobstore-client` (WP-U101)

Cliente Zeus del **plano de control** HTTP del servicio de objetos Oasis
(`/x/blobstore/v0/*`). Hermano saliente de U84 (entrante SSB→VOLUMES).

**No** reimplementa `blobs.*` / sbot / muxrpc. El **plano de datos** sigue
siendo gossip `ssb-blobs` (`want`/`has`/`get`) en el pub.

## Planos (nunca mezclados)

| plano | transporte | en zeus |
| ----- | ---------- | ------- |
| control | HTTP JSON `/x/blobstore/v0/{objetos,objetos/:cid,estado/:cid,deseos,salud}` | este paquete |
| datos | `ssb-blobs` gossip | fuera del monorepo (equipo del pub) |

`cid` = ref blob SSB `` `&<base64>.sha256` `` — el mismo campo opcional que
toleran los manifests VOLUMES (D-14). Objetos >50 MB → manifiesto
**chunk-as-blob** (chunks 5 MB); `manifestCid` = referencia canónica.

## Peer-card U93 = portero LAN

Transfer DataChannel: `requireLanPeerCard` / `assertLanBlobTransferAllowed`
(reusa el torno U93 vía `@zeus/blob-sync-harness`). Sin card válida → rechazo.
WAN: gossip `ssb-blobs` (ops / follows). Residual «viewer fabrica peer-card»
→ cola U93 (fuera de este WP).

## Invariantes (runbook)

| # | regla |
| - | ----- |
| (i) | mensajes de room: solo cids/manifiestos, nunca bytes |
| (ii) | ningún blob >50 MB (usar chunk-as-blob) |
| (iii) | mismo contenido ⇒ mismo cid |
| (iv) | alcance = grafo de follows (operación; no código en zeus) |

```js
import { invariantsRunbook } from '@zeus/blobstore-client';
console.log(invariantsRunbook());
```

## Uso

```bash
npm test -w @zeus/blobstore-client
npm run fixture -w @zeus/blobstore-client
# desde la raíz:
npm run e2e:volumes-outbound
```

```js
import {
  createBlobstoreClient,
  buildOutboundManifest,
  validateVolumesCidFields,
  requireLanPeerCard
} from '@zeus/blobstore-client';

const client = createBlobstoreClient({
  baseUrl: process.env.ZEUS_BLOB_SIDECAR_URL, // …/x/blobstore/v0
  token: process.env.ZEUS_BLOB_HTTP_TOKEN // opcional (LAN puede omitir)
});

const manifest = buildOutboundManifest(bytes);
await client.putObjeto(manifest);
// poll (veredicto ① — sin webhook v0):
await client.estado(manifest.cid);
```

## Live ops (`ZEUS_BLOB_*`)

| Env | Uso |
| --- | --- |
| `ZEUS_BLOB_SIDECAR_URL` | Base del namespace `/x/blobstore/v0` |
| `ZEUS_BLOB_SYNC_NODE_A` | Cliente Oasis local |
| `ZEUS_BLOB_SYNC_NODE_B` | Pub VPS 0.8.8 |
| `ZEUS_BLOB_HTTP_TOKEN` | Bearer opcional (auth HTTP; nada obligatorio en LAN) |

Unset → evidencia **⏳** (no se abre red). Con las tres + sidecar vivo →
`GET …/salud`. Precond ops: follows mutuos A↔B (D-21 fila 6).

`ZEUS_OPEN_BROWSER` no aplica (CLI headless).

## Regla de los dos juegos

Infra mesh/ops: cero nombres exclusivos de delta/pozo.

## Fuera de alcance (a propósito)

- Sidecar producto del pub / `blobs.*` / unix-socket sbot
- Re-abrir U84 · horizonte U71 · Ola 6
- Residual viewer peer-card (cola U93)

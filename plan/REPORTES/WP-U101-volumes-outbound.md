# WP-U101 · volumes-outbound — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-18 |
| rama | `wp/u101-volumes-outbound` |
| commit(s) | `3eaef25`, `bc2dcec`, `6edfc30` |
| estado propuesto | listo para revisión |

## Qué se hizo

Nació `@zeus/blobstore-client` (`packages/mesh/blobstore-client`, private):
cliente Zeus del plano **control** HTTP `/x/blobstore/v0/*` (`salud`,
`objetos`, `objetos/:cid`, `estado/:cid`, `deseos`). `cid` =
`&<base64>.sha256`; objetos sobre soft-max → chunk-as-blob con
`manifestCid` canónico. Validación de campos `cid`/`manifestCid` en
records estilo VOLUMES (rechazo de bytes en room — invariante i). LAN:
`requireLanPeerCard` reusa el torno U93 vía `@zeus/blob-sync-harness`
(sin reimplementar). Live: `ZEUS_BLOB_*` → dial `GET /salud` o **⏳**
honesto si unset. Fixture HTTP in-process + runbook invariantes (i)–(iv).
Cero `blobs.*` / muxrpc / sidecar producto. U84 (`@zeus/ssb-system`) no
se tocó.

Demolición: notas «U101 fuera / saliente diferido» del harness U100 y
mensaje WAN actualizado; docs de enganche en webrtc-signaling /
ARQUITECTURA / `.env.example`.

## Archivos tocados

- creado `packages/mesh/blobstore-client/**` — cliente, cid, manifests,
  LAN, live, fixture, tests, README, runbook
- modificado `package.json` / `package-lock.json` — workspace + scripts
  `test:blobstore-client` / `e2e:volumes-outbound`
- modificado `.env.example` — `ZEUS_BLOB_*` + `ZEUS_BLOB_HTTP_TOKEN`
- modificado `packages/mesh/blob-sync-harness/README.md` + `lan-gate.mjs`
  — demolición notas diferidas; apunta a blobstore-client
- modificado `packages/engine/webrtc-signaling/README.md` — portería U101
- modificado `plan/ARQUITECTURA.md` — lista mesh
- creado `plan/REPORTES/WP-U101-volumes-outbound.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Unit `@zeus/blobstore-client` — OK (19)

```
# tests 19
# suites 7
# pass 19
# fail 0
```

### Fixture / e2e outbound — OK (live ⏳)

```
=== WP-U101 volumes outbound ===
runbook: {"invariants":{"i":"room messages carry only cids/manifests, never bytes","ii":"no single blob exceeds 52428800 bytes","iii":"same content ⇒ same cid","iv":"replication scope = follows graph (ops; not enforced in zeus)"},…}
fixture HTTP control: {"ok":true,"baseUrl":"http://127.0.0.1:50928","smallCid":"&Ir0cQkY8ATobpdfU4z6Emrqn4001TC0sy/tpDStz40w=.sha256","manifestCid":"&+Qg7A5jyNlWHWyIhJDXP9WO/4ctYLjrcD2jeVhE/2Ck=.sha256","chunks":5,"softMaxBytesProd":52428800}
LAN peer-card portero (U93): {"ok":true,"allowRole":"player","rejectedMissing":"peer-card missing or malformed","rejectedExpired":"peer-card expired"}
live ops probe: {"status":"pending","evidence":"⏳","missing":["ZEUS_BLOB_SIDECAR_URL","ZEUS_BLOB_SYNC_NODE_A","ZEUS_BLOB_SYNC_NODE_B"],…}
e2e:volumes-outbound OK — live ⏳ (ZEUS_BLOB_* unset — live outbound ⏳ …)
```

### U84 intacto (`@zeus/ssb-system`) — OK (4)

```
# tests 4
# pass 4
# fail 0
```

### Harness U100 — OK (11)

```
# tests 11
# pass 11
# fail 0
```

### Live Oasis (`ZEUS_BLOB_*` + sidecar pub)

⏳ sin verificar — env unset en este entorno; no se abrió red hacia el
pub. Fixture diala `/salud` local cuando el test setea env + fixture.

### Gates / lint

```
gates: OK (0 offenders)

✖ 12 problems (0 errors, 12 warnings)
```

(warnings preexistentes ajenos; 0 errors)

### Preguntas CA (obligatorias)

| pregunta | respuesta |
| -------- | --------- |
| ¿Cliente HTTP del namespace? | **Sí** — `createBlobstoreClient` → `/salud|/objetos|/estado/:cid|/deseos` |
| ¿Validación cid/manifests? | **Sí** — `assertSsbBlobCid`, `validateOutboundManifest`, `validateVolumesCidFields` |
| ¿Rechazo peer-card LAN? | **Sí** — `requireLanPeerCard(null)` / expired → `ok:false` |
| ¿U84 intacto? | **Sí** — `npm test -w @zeus/ssb-system` 4/4; cero edits ssb-system |
| ¿Cero `blobs.*` en monorepo? | **Sí** — solo menciones de «no implementar»; cero API muxrpc/`blobs.*` |
| ¿Fixture verde? | **Sí** — 19 unit + `e2e:volumes-outbound` |
| ¿Live `ZEUS_BLOB_*` o ⏳? | **⏳** — unset; honesto |
| ¿Runbook invariantes? | **Sí** — README + `invariantsRunbook()` en CLI |

Navegador: no abierto (`ZEUS_OPEN_BROWSER` unset).

## Demolición

Notas «WP-U101 (carril saliente…)» / «U101 consumirá la API» como diferido
en harness README; mensaje WAN `assertWanBlobTransferPendingSidecar`
actualizado a apuntar al cliente HTTP.

```
$ rg -n "saliente diferido|WP-U101 \(carril saliente" packages
(sin matches)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no; `baseUrl` desde
      `ZEUS_BLOB_SIDECAR_URL` / fixture `listen(0)`. Endpoint de card vía
      `ZEUS_SCRIPTORIUM_URL` o `http://127.0.0.1:0` (forma, sin dial).
- [x] Cadenas if/switch → tabla: paths HTTP en handlers del fixture;
      `BLOBSTORE_CONTROL_PATHS` / `FORBIDDEN_BYTE_KEYS` frozen.
- [x] Duplicación: reusa `assertLanBlobTransferAllowed` del harness
      (torno U93); cid SSB propio (contrato cara ciega ≠ hex del spike).
- [x] console.log / TODO sin backlog: solo salida del fixture CLI.
- [x] Nombres de transición (`legacy`/`v2`/…): ninguno.
- [x] Demolición: grep arriba limpio.
- [x] Tests de comportamiento: cid estable, chunk-as-blob, rechazo bytes,
      rechazo card, HTTP round-trip, auth token, live ⏳ / dial fixture.
- [x] Arranque real: `npm run e2e:volumes-outbound` ejecutado (salida arriba).
- [x] README/specs: README cliente + `.env.example` + notas signaling/harness.
- [x] Diff solo alcance U101: sí (no U84 src, no Ola 6, no residual viewer).

Regla de los dos juegos: mesh/ops — cero conceptos exclusivos de juego en
`src/` (`rg` limpio). ¿pozo puede consumir el cliente tal cual? Sí (HTTP +
cids genéricos).

## Hallazgos fuera de alcance

- Residual viewer que fabrica peer-card: informativo cara ciega §3 → cola
  U93; no tocado.
- U100 harness sigue usando `cid` hex en su fixture in-process (spike); el
  producto U101 usa refs SSB. Convergencia del harness al formato SSB =
  candidato a higiene aparte, no bloquea U101.
- Follows mutuos A↔B (invariante iv) = ops; no ejercitado sin nodos Oasis.
- Specs internas del pub (`SPEC-sidecar-ficheros-v0` etc.) no están en
  este monorepo; el fixture modela el namespace citado en la cara ciega.

## Dudas / bloqueos

Ninguno bloqueante. Live real queda ⏳ hasta que ops setee `ZEUS_BLOB_*` y
el sidecar pub responda `/salud`.

Push: **no intentado**.

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** — 2026-07-18 (orquestador). **No** merge / **no**
push / **no** ✅ BACKLOG en este paso (pedido explícito). Autoriza merge a
master cuando el usuario lo pida; BACKLOG 🔶→✅ solo en master al mergear.

### Verificado

- Diff `master...wp/u101-volumes-outbound` (5 commits: `3eaef25` feat +
  `bc2dcec` docs mesh + `6edfc30`/`da9137f`/`4fc8753` docs plan): 21
  archivos / +1568. Paquete nuevo `@zeus/blobstore-client` + scripts
  workspace + `.env.example` `ZEUS_BLOB_*` + demolición notas U100 +
  enganche signaling/ARQUITECTURA + reporte. Worker **no** tocó
  `plan/BACKLOG.md`. Cero edits `@zeus/ssb-system` (U84).
- Commits convencionales (`feat(blobstore-client)`, `docs(mesh)`,
  `docs(plan)`). Auto-revisión PRACTICAS §3 honesta. Live ⏳ OK.
- Demolición: `rg "saliente diferido|WP-U101 \(carril saliente" packages`
  limpio; WAN message apunta a blobstore-client.

### CA (re-ejecutados en worktree, 2026-07-18)

| CA | Resultado |
| -- | --------- |
| Cliente HTTP `/x/blobstore/v0/*` | OK — `createBlobstoreClient`: salud/objetos/estado/deseos; fixture dial |
| cid SSB `&<base64>.sha256` + manifests | OK — `assertSsbBlobCid`, chunk-as-blob 5 MB, `manifestCid` canónico |
| Validación VOLUMES cid/manifests | OK — `validateVolumesCidFields` / `validateOutboundManifest` (inv. i) |
| Rechazo peer-card LAN (U93) | OK — `requireLanPeerCard` → harness `assertLanBlobTransferAllowed` |
| U84 intacto | OK — cero diff ssb-system; `npm test -w @zeus/ssb-system` 4/4 |
| Cero reimpl `blobs.*` | OK — solo menciones «no implementar»; Map spike U100 no es muxrpc |
| Fixture verde | OK — unit 19/19; `e2e:volumes-outbound` OK |
| Live `ZEUS_BLOB_*` o ⏳ | ⏳ OK — unset; probe `pending` / sin red |
| Runbook invariantes (i)–(iv) | OK — `invariantsRunbook()` + README |

### PRACTICAS

- §1: private mesh/ops; reusa torno U93; no sidecar producto; regla dos
  juegos limpia (`src/` sin delta/pozo).
- §3: auto-revisión honesta; evidencia literal; ⏳ live no inventado.
- §6: commits convencionales. Worker no editó BACKLOG.

### Hallazgos → cola (no arreglar aquí; no bloquean)

1. **Viewer fabrica peer-card** — ya cola U93 (cara ciega §3); U101 no
   tocó. Persiste hasta higiene del visor.
2. **Harness U100 cid hex vs SSB** — `blob-sync-harness` sigue
   `sha256` hex en fixture spike; producto U101 usa `&…sha256`. Convergencia
   harness → formato SSB = higiene aparte (candidato WP o nota cola
   transporte al mergear).

### Acción siguiente

1. **Merge** de `wp/u101-volumes-outbound` → master (usuario / orquestador
   en master). Tras merge: ✅ BACKLOG U101 + volcar hallazgos a cola +
   `git worktree remove`.
2. Push: no intentado.

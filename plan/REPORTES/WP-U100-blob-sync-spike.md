# WP-U100 · blob-sync-spike — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-18 |
| rama | `wp/u100-blob-sync-spike` |
| commit(s) | `bd69e17`, `1b10293`, `292faa5` (+ commit revisión) |
| estado propuesto | listo para revisión |

## Qué se hizo

Spike D-21 fila 5: harness mínimo `@zeus/blob-sync-harness` (private) que
valida sync content-addressed 2-nodos in-process (`cid`=sha256 + chunks),
exige peer-card U93 como portero del carril LAN (reusa
`assertSignalingPeerCard`, sin reimplementar el torno), y sonda ops live
(`ZEUS_BLOB_*`) con **⏳** si el pub no entrega sidecar/cliente. Veredicto
explícito sobre compromiso de U101: **no despeja** (sin evidencia live).
Cero código de producto del sidecar Oasis. Docs de enganche en README del
harness + nota en webrtc-signaling (Hook SSB / portería blobs).

## Archivos tocados

- creado `packages/mesh/blob-sync-harness/**` — harness validación (src/test/README)
- modificado `package.json` — scripts `e2e:blob-sync-spike` / `test:blob-sync-harness`
- modificado `package-lock.json` — workspace `@zeus/blob-sync-harness`
- modificado `.env.example` — vars `ZEUS_BLOB_*` (probe live)
- modificado `packages/engine/webrtc-signaling/README.md` — portería LAN blobs → harness
- modificado `plan/ARQUITECTURA.md` — lista mesh + harness
- creado `plan/REPORTES/WP-U100-blob-sync-spike.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Unit `@zeus/blob-sync-harness` — OK (11)

```
# tests 11
# suites 4
# pass 11
# fail 0
```

### Spike / e2e harness — OK (veredicto no despeja)

```
=== WP-U100 blob-sync spike ===
fixture 2-node sync: {"ok":true,"rootCid":"373a4f8cc830c7538c5de898af4dafd15ed7a9ed99ccd5c90fe0fedec1e0b202","size":228,"chunks":4,"from":"node-a","to":"node-b"}
LAN peer-card portero (U93): {"ok":true,"allowRole":"player","rejectedExpired":"peer-card expired","rejectedMissing":"peer-card missing or malformed"}
live ops probe: {"status":"pending","evidence":"⏳","missing":["ZEUS_BLOB_SIDECAR_URL","ZEUS_BLOB_SYNC_NODE_A","ZEUS_BLOB_SYNC_NODE_B"],"env":{"ZEUS_BLOB_SIDECAR_URL":null,"ZEUS_BLOB_SYNC_NODE_A":null,"ZEUS_BLOB_SYNC_NODE_B":null},"note":"Pub/cliente blob-sync no entregado en este entorno (D-21 fila 5 ops). No se abre red. Fixture harness cubre el contrato offline."}
veredicto U101: {"verdict":"no despeja","reason":"sin evidencia live sync 2-nodos Oasis (ops/sidecar pendiente); fixture+portero OK no bastan para comprometer U101"}
e2e:blob-sync-spike OK — no despeja U101 (sin evidencia live sync 2-nodos Oasis (ops/sidecar pendiente); fixture+portero OK no bastan para comprometer U101)
```

### Live sync Oasis 2-nodos (pub/sidecar)

⏳ sin verificar — `ZEUS_BLOB_SIDECAR_URL` / `ZEUS_BLOB_SYNC_NODE_A` /
`ZEUS_BLOB_SYNC_NODE_B` unset; no hay cliente/pub blob entregado en este
entorno. No se abrió red. (Alineado al CA: ⏳ honesto si ops no entrega.)

### Gates / lint

```
gates: OK (0 offenders)

✖ 12 problems (0 errors, 12 warnings)
```

(warnings preexistentes ajenos; 0 errors)

### Preguntas CA (obligatorias)

| pregunta | respuesta |
| -------- | --------- |
| ¿Evidencia sync 2-nodos (o ⏳ honesto)? | **Fixture sí** (in-process node-a→node-b por cid). **Live Oasis: ⏳** (ops/sidecar no entregado). |
| ¿Veredicto despeja / no despeja U101? | **no despeja** — falta evidencia live; fixture+portero no bastan para comprometer U101. |
| ¿Cero producto sidecar salvo harness mínimo? | **Sí** — solo `@zeus/blob-sync-harness` private; WAN explícitamente `pending` sidecar. |
| ¿Peer-card U93 como portero (doc/enganche)? | **Sí** — `assertLanBlobTransferAllowed` → `assertSignalingPeerCard`; README harness + nota webrtc-signaling. |

Navegador: no abierto (`ZEUS_OPEN_BROWSER` unset).

## Demolición

n/a (spike; sin paquete previo que sustituir).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no dial; endpoint de card vía
      `ZEUS_SCRIPTORIUM_URL` o placeholder de forma `http://127.0.0.1:0`
      (sin conectar). Live probe solo lee env.
- [x] Cadenas if/switch → tabla: n/a (flujo lineal corto); lanes en
      `BLOB_LANES` frozen.
- [x] Duplicación: reusa `assertSignalingPeerCard` / `issuePeerCard` /
      `makePeerCard` — no se reimplementó el torno U93 ni `blobs.*`.
- [x] console.log de depuración / TODO sin backlog: solo salida del spike CLI.
- [x] Nombres de transición (`legacy`/`v2`/…): ninguno en código; slug WP
      «spike» solo en script/reporte.
- [x] Demolición: n/a.
- [x] Tests de comportamiento: cid estable, sync multi-chunk, rechazo
      card caducada/ausente, verdict no despeja sin live.
- [x] Arranque real: `npm run e2e:blob-sync-spike` ejecutado (salida arriba).
- [x] README/specs: README harness + `.env.example` + nota webrtc-signaling.
- [x] Diff solo alcance U100: sí (no U101, no U84, no Ola 6).

Regla de los dos juegos: harness mesh/ops — cero conceptos exclusivos de
juego en `src/` (`rg` limpio; README solo nombra la regla).

## Hallazgos fuera de alcance

- U101 ya puede quedar pausado por refinement del marco (nota ops paralela);
  el veredicto de este spike (**no despeja**) es independiente y coherente
  con esa pausa.
- El harness no dialea el sidecar aunque las tres `ZEUS_BLOB_*` estén
  seteadas (`ready` = env completo); el dial real pertenece a U101 cuando
  el pub entregue API. Candidato a ampliar el probe en U101, no aquí.
- Follows (D-21 fila 6) = operación; no ejercitado (sin nodos Oasis vivos).

## Dudas / bloqueos

Ninguno bloqueante para cerrar el spike. Bloqueo ops externo: entrega del
sidecar/cliente blob-sync del pub para poder pasar de ⏳ a evidencia live y,
en su caso, verdicto `despeja`.

---

## Revisión del orquestador

**Aceptado ✅** — orquestador / 2026-07-18 (revisión; **sin** merge ni ✅
BACKLOG en este paso — pedido explícito del usuario). Sin push.

### Verificado

- **Base:** merge-base = master `2a1aa8d` (`chore(plan): pausa U101 hasta
  refinement`). No hizo falta merge master→rama.
- **Alcance** `master...HEAD` (16 archivos / +838): solo
  `@zeus/blob-sync-harness` (private) + scripts/workspace + `.env.example`
  `ZEUS_BLOB_*` + nota portería en webrtc-signaling README + línea
  ARQUITECTURA + reporte. Worker **no** tocó `plan/BACKLOG.md`.
- **Commits** convencionales: `test(blob-sync-harness)`, `docs(plan)` ×2.
- **Demolición:** n/a (spike). PRACTICAS: private harness; reusa
  `assertSignalingPeerCard` (U93); WAN explícitamente `pending` sidecar;
  live probe sin dial; ⏳ honesto; auto-revisión §3 honesta.

### CA (re-ejecutados en worktree, 2026-07-18)

| CA | Resultado |
| -- | --------- |
| Fixture sync 2-nodos | OK — `e2e:blob-sync-spike` + unit 11/11; cid+chunks node-a→node-b |
| Live Oasis ops | ⏳ OK — env unset; `status:pending` / `evidence:⏳`; sin red |
| Veredicto U101 | **no despeja** (literal; alineado a pausa U101 en master) |
| Cero producto sidecar | OK — solo harness mínimo `private`; `assertWanBlobTransferPendingSidecar` |
| Peer-card U93 portero | OK — `assertLanBlobTransferAllowed` → `assertSignalingPeerCard` |
| Gates | `gates: OK (0 offenders)` |

### Acción siguiente

1. **Merge** de `wp/u100-blob-sync-spike` → master (usuario / orquestador en
   master). Tras merge: ✅ BACKLOG U100 + `git worktree remove`.
2. **NO prep / NO asignar U101** — permanece ⬜ pausado hasta refinement
   (`2a1aa8d`); el spike **no despeja** compromiso. Cadena U100→U101 no
   continúa.
3. Push: no intentado.

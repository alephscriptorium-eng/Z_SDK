# Brief — WP-U101 · Carril saliente VOLUMES/blobs (hermano U84)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U101 · Carril saliente VOLUMES/blobs (hermano U84)
Rama: wp/u101-volumes-outbound
Worktree: .worktrees/wp-u101-volumes-outbound
Reporte: plan/REPORTES/WP-U101-volumes-outbound.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U101-volumes-outbound.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — D-21 fila 3; lote-transporte-12b;
refinado desde §Cara ciega (handoff vigía; solo bloque citado):
- Carril **saliente** hermano de U84 (entrante ya ✅). Zeus **consume**
  el servicio de objetos del pub; **no** reimplementa `blobs.*` / sbot.
- Contrato: control HTTP `/x/blobstore/v0/*` (`objetos`,
  `objetos/:cid`, `estado/:cid`, `deseos`, `salud`) + datos gossip
  `ssb-blobs` (`want`/`has`/`get`). `cid` = `&<base64>.sha256` (D-14).
  >50 MB → chunk-as-blob 5 MB; `manifestCid` canónico.
  Invariantes (i)–(iv) del BACKLOG.
- LAN: peer-card U93 = portero DataChannel. WAN: `ssb-blobs`.
- Live: `ZEUS_BLOB_SIDECAR_URL` / `ZEUS_BLOB_SYNC_NODE_A` /
  `ZEUS_BLOB_SYNC_NODE_B` (A=cliente Oasis local; B=pub VPS 0.8.8);
  ⏳ honesto si unset. Precond ops: follows mutuos (no WP).
- Veredictos 5 preguntas (ya cerrados en D-21 nota — no reabrir):
  ① poll estado/:cid; ② auth HTTP nada en LAN / token env opcional;
  ③ cid/manifestCid/chunks 5 MB; ④ HTTP control (no muxrpc);
  ⑤ auth sbot = ops unix socket (fuera monorepo).
- CA (literal BACKLOG): cliente HTTP + validación manifests/`cid`;
  rechazo sin peer-card LAN; U84 intacto; cero `blobs.*` en monorepo;
  fixture verde; live o ⏳; runbook invariantes.
- Demolición: stubs/notas «saliente diferido».

Alcance orientativo:
- Consumidor zeus del plano control + enganche a manifests VOLUMES.
- Reusar portería peer-card U93 / harness U100 donde sirva (no
  reimplementar torno).
- NO implementar el sidecar del pub en monorepo.
- NO re-abrir U84. NO horizonte U71. NO Ola 6.
- NO arreglar el residual «viewer fabrica peer-card» (cola U93;
  cara ciega §3 informativa).
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- Transporte / VOLUMES outbound = mesh/ops. Cero nombres exclusivos
  de delta/pozo en código nuevo de engine/mesh salvo docs de engache.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-21 (nota refinement U101 + veredictos ①–⑤;
  filas 2–4, 6)
- plan/DECISIONES.md D-20, D-14
- plan/BACKLOG.md WP-U100 ✅ + plan/REPORTES/WP-U100-blob-sync-spike.md
- plan/BACKLOG.md WP-U84 ✅, WP-U93 ✅ (portero + cola residual visor)
- packages/mesh/blob-sync-harness/ (ZEUS_BLOB_*, portería LAN)
- .env.example (ZEUS_BLOB_*)

Notas del orquestador:
- Lote-transporte-12b: solo U101. Prep listo; worker aún no lanzado
  por orquestador hasta que el usuario pida arrancar.
- Preguntas CA obligatorias: ¿cliente HTTP del namespace? ¿validación
  cid/manifests? ¿rechazo peer-card LAN? ¿U84 intacto? ¿cero blobs.*
  en monorepo? ¿fixture verde? ¿live ZEUS_BLOB_* o ⏳? Evidencia literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```

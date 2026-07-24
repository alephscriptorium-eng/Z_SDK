# Brief — WP-U167 · Triage P1 `@zeus/blobstore-client` (o deslistar)

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U167 · Triage P1 blobstore-client (o deslistar)
Rama: wp/u167-triage-blobstore-client
Worktree: C:\S_LAB\.worktrees\z\wp-u167-triage-blobstore-client
Reporte: plan/REPORTES/WP-U167-triage-blobstore-client.md

## Lecturas
- plan/PUBLISH-ALLOWLIST.md §3 P1 · §4
- plan/REPORTES/WP-U162-auditoria-publish-allowlist.md
- plan/REPORTES/entregas/REPLAN-2026-07-24-sprint8.md
- ADDENDA-R5 (harnesses / blob-sync)
- `packages/mesh/blobstore-client/` · acoplamiento a `blob-sync-harness`

## Tarea
1. Triage `@zeus/blobstore-client`:
   - **vía A:** desacoplar de `blob-sync-harness` / demos para que el
     tarball/cliente sea publicable medible (checklist §5), **o**
   - **vía B:** enmendar allowlist y bajar de candidato a «mantener
     privado» con justificación (producto/harness).
2. Evidencia: grafo de deps + pack dry-run si vía A; diff allowlist si
   vía B.
3. No ampliar P0; no tocar otros P1 (U166).
4. **No** publish, **no** changesets de publicación, **no** flip
   `private` sin GO publish aparte.

## CA
- Una vía elegida y cerrada en reporte (A o B).
- Si A: checklist §5 medido; harness no contaminante del tarball.
- Si B: allowlist §3 actualizada; inventario/`audit:publish-allowlist`
  coherente.
- Frontera: cero publish / cero changesets de pub / cero flip `private`
  (salvo GO publish — fuera de este WP).
- Diff acotado a ALCANCE_DIFF + reporte.

## ALCANCE_DIFF
- `packages/mesh/blobstore-client/**` (y solo lo mínimo de harness si
  desacopla)
- `plan/PUBLISH-ALLOWLIST.md` si vía B
- reporte `plan/REPORTES/`
- **Prohibido:** publish, changesets de pub, P0, linea-editor,
  console-monitor

## Notas
- Estado: **🔶** · Ola A · deps: U162 ✅ (∥ U163) · R8-Z PASS + GO Ola A
- Estimación: M · Eje IV
- Sidecar/blob live U100/U101 sigue diferido D-22 — no reabrir aquí
- Frontera: sin flip `private` / sin changesets de pub / sin publish
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY
- No editar `plan/BACKLOG.md` (solo orquestador)

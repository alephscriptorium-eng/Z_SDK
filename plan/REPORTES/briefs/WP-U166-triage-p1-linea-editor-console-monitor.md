# Brief — WP-U166 · Triage P1 linea-editor + console-monitor

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U166 · Triage P1 `@zeus/linea-editor` + `@zeus/console-monitor`
Rama: wp/u166-triage-p1-linea-editor-console-monitor
Worktree: C:\S_LAB\.worktrees\z\wp-u166-triage-p1-linea-editor-console-monitor
Reporte: plan/REPORTES/WP-U166-triage-p1-linea-editor-console-monitor.md

## Lecturas
- plan/PUBLISH-ALLOWLIST.md §3 P1 · §4 · §5
- plan/REPORTES/WP-U162-auditoria-publish-allowlist.md (medición P1)
- plan/REPORTES/entregas/REPLAN-2026-07-24-sprint8.md
- `packages/mesh/{linea-editor,console-monitor}/package.json`

## Tarea
1. Triage publishability de P1 (excepto blobstore → U167):
   - `@zeus/console-monitor`: añadir o proponer `exports` si falta;
     medir pack; decidir si es producto publicable clase C o baja a
     «mantener privado».
   - `@zeus/linea-editor`: mismo triage (API exportada vs app/editor).
2. Si permanece candidato: checklist §5 medido **sin** flip `private`.
3. Si baja: enmienda allowlist (nombre fuera de §3 + justificación) +
   inventario coherente.
4. Tabla decisión + evidencia en reporte.
5. **No** publish, **no** changesets de publicación, **no** flip
   `private` sin GO publish aparte.

## CA
- Decisión explícita por paquete: sigue candidato / mantener privado
  (con enmienda allowlist si aplica).
- `console-monitor`: `exports` presentes o gap documentado con plan.
- Medición pack dry-run si se propone publish-ready.
- Frontera: cero publish / cero changesets de pub; cero flip `private`
  salvo GO publish (este WP no lo tiene).
- Diff acotado a ALCANCE_DIFF + reporte (+ allowlist si enmienda).

## ALCANCE_DIFF
- `packages/mesh/linea-editor/**`
- `packages/mesh/console-monitor/**`
- `plan/PUBLISH-ALLOWLIST.md` solo si deslista/enmienda clase
- reporte `plan/REPORTES/`
- **Prohibido:** publish, changesets de pub, P0 (salvo lectura),
  blobstore-client (U167)

## Notas
- Estado: **⬜** · Ola B · deps: **U163** (∥ U164 ∥ U165)
- **NO DESPACHAR** hasta R8-Z PASS + GO implementación + U163 ✅
- Estimación: M · Eje IV
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY

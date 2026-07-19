# Brief — WP-U84 · Conector SSB → VOLUMES (Tribes y Parliament)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U84 · Conector SSB → VOLUMES (Tribes y Parliament)
Rama: wp/u84-ssb-volumes
Worktree: .worktrees/wp-u84-ssb-volumes
Reporte: plan/REPORTES/WP-U84-ssb-volumes.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U84-ssb-volumes.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — Ola 8; lote-8a; dep U80 ✅; serie
(U85 no asignado; no implementar U85):
- Exportador del log del pub OASIS (mensajes tipados `tribe*`,
  `parliament*`, votos — modelos en DATOS.md §7) a **JSON en disco**.
- Volumen `DISK_04/SSB` (el slot DISK_03 lo ocupa FORCES desde
  2026-07-15) con entrada en volumes.json (readonly, provenance del
  pub), mismo procedimiento que firehose.
- Servidor MCP loader read-only **hermano de linea-firehose**.
- Files-first: el exportador es un proceso de sync, no un demonio nuevo
  del mesh.
- CA (literal BACKLOG):
  · e2e contra fixture de log SSB (sin red): export → volumen válido
    (U80) → resources MCP navegables
  · documentado el runbook contra el pub real (`ZEUS_SSB_*`),
    ejecutado si hay acceso (⏳ si no, honesto)
- Demolición: n/a.

Alcance orientativo:
- Nuevo paquete mesh (hermano de `packages/mesh/linea-firehose`), p.ej.
  ssb-system / nombre alineado a ARQUITECTURA — consume `@zeus/linea-kit`
  (validación volumes/manifest) donde aplique; no reimplementar U80.
- Slot duro: **DISK_04/SSB**. NO usar DISK_03 (FORCES / U91).
- Fixture de log SSB en el repo/paquete para e2e **sin red**. El CA
  primario no depende del pub VPS.
- Exportador = sync files-first (JSON a disco + volumes.json); NO
  demonio permanente del mesh.
- MCP loader read-only; patrón linea-firehose / force-system.
- NO U85 (familias de feed unificadas en el engine) — otro WP; no
  tocar aún.
- VOLUMES / worktrees: worktrees no heredan DISK gitignored; usar
  `ZEUS_VOLUMES_ROOT=<repo-principal>/VOLUMES` o fixture local del
  paquete. Documentar camino en el reporte.

Regla de los dos juegos (PRACTICAS §1.11):
- Conector/loader = mesh genérico: cero conceptos exclusivos de delta/pozo
  en el paquete nuevo. Gate.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DATOS.md §3 (familia gossip & peers) y §7 (punteros SSB:
  tribes_model, parliament_model, pub OASIS)
- plan/DATOS.md §5 (files-first)
- plan/REPORTES/WP-U80-linea-kit.md (validación volumes / ZEUS_VOLUMES_ROOT)
- packages/mesh/linea-firehose/ (patrón MCP loader hermano + sync)
- packages/mesh/force-system/ (hermano FORCES en DISK_03 — no pisar)
- packages/engine/linea-kit/ (schemas volumes)

Notas del orquestador:
- Lote-8a serie: solo U84. U85 depende de U84 — NO asignado.
- Pregunta obligatoria (CA): ¿fixture sin red exporta a DISK_04/SSB
  válido U80? ¿MCP resources navegables? ¿runbook `ZEUS_SSB_*`
  documentado (y ⏳ si sin acceso al pub)? Evidencia literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```

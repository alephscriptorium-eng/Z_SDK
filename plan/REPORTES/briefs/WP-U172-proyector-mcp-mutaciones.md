# Brief — WP-U172 · Proyector MCP de mutaciones HTTP

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U172 · Proyectar mutaciones HTTP como herramientas MCP
Rama: wp/u172-proyector-mcp-mutaciones
Worktree: C:\S_LAB\.worktrees\z\wp-u172-proyector-mcp-mutaciones
Reporte: plan/REPORTES/WP-U172-proyector-mcp-mutaciones.md

## Lecturas
- plan/REPORTES/entregas/REPLAN-2026-07-24-r13-dramaturgo-zigurat.md
- plan/REPORTES/entregas/ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md (§WP)
- packages/engine/http-contract/README.md (proyección RouteEntry→MCP, WP-U40)
- packages/engine/player-mcp-kit/README.md (patrón intent→evidencia)

## Tarea
1. Extender la proyección RouteEntry→MCP **existente** de
   `@zeus/http-contract` (hoy `projectRoutesToMcp` /
   `bindProjectedHttpReaders`, resources/readers GET) para proyectar
   mutaciones (POST/PUT) como **tools** MCP.
2. Validación de envelope (zod, como el middleware existente) + gate
   visible en la tool (patrón `linea-editor`: gate en card/errores).
3. Probes verde/rojo: mutación válida proyectada; mutación sin gate o
   con envelope inválido rechazada.
4. **DRY:** cero proyector paralelo nuevo; extender el módulo existente.

## CA
- Tools MCP proyectadas desde RouteEntry de mutación; readers GET
  intactos (tests previos verdes).
- Validación + gate visibles y probados (verde/rojo automatizados).
- Sin nombres de juego concretos (D-8); consumidor inyecta wire/gate.
- Contrarrevisión independiente PASS documentada antes de pedir ✅.
- Cero publish / flip private / changesets.

## ALCANCE_DIFF
- `packages/engine/http-contract/**`
- reporte bajo `plan/REPORTES/`
- **Prohibido:** paquete proyector nuevo · linea-editor (dueño U175) ·
  story-board-schema (dueño U174) · manifests de publish · UI

## Notas
- Estado planificado: **⬜** — NO despachar hasta: asiento DA-S21
  commiteado + R12 cerrado + **R13-Z PASS** + GO implementación.
- Estimación: M · Eje I · Ola A (∥ U173)
- Runner despacho futuro: preferir Fable; si no, GPT-5.6 Sol; si no,
  el mejor disponible (anotar cascada en el aviso).
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY · No editar `plan/BACKLOG.md` (solo orquestador)

# Brief — WP-U174 · Referencias de personajes en story-board

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U174 · Referencias de personajes en story-board
Rama: wp/u174-personajes-story-board
Worktree: C:\S_LAB\.worktrees\z\wp-u174-personajes-story-board
Reporte: plan/REPORTES/WP-U174-personajes-story-board.md

## Lecturas
- plan/REPORTES/entregas/REPLAN-2026-07-24-r13-dramaturgo-zigurat.md
- plan/REPORTES/entregas/ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md (§WP)
- packages/engine/story-board-schema/** (schema + validate AJV)
- reporte/contrato WP-U173 (reparto) — dependencia

## Tarea
1. Extender `@zeus/story-board-schema` con **referencias de
   personajes** (refs al reparto de U173); **no** duplicar schema ni
   crear uno paralelo.
2. Validación AJV + fixtures nuevas (board con y sin personajes);
   fixtures existentes siguen validando (retro-compatibilidad del
   schema dentro del mismo contrato, no vía «v2»).
3. Verificar consumidores existentes (editor-ui world/story-board,
   linea-editor export) sin romper sus tests.

## CA
- Refs de personajes validadas por AJV (caso verde + caso rojo).
- Fixtures previas validan sin cambios; tests de consumidores verdes.
- Cero schema paralelo / cero naming de transición (D-3).
- Contrarrevisión independiente PASS documentada antes de pedir ✅.
- Cero publish / flip private / changesets.

## ALCANCE_DIFF
- `packages/engine/story-board-schema/**`
- fixtures mínimas de consumidores solo si un test lo exige (declararlo)
- reporte bajo `plan/REPORTES/`
- **Prohibido:** linea-editor src (dueño U175) · reparto-kit (dueño
  U173) · publish

## Notas
- Estado planificado: **⬜** — NO despachar hasta: **DA-S21 · `2eb4784` asentada** (hecho) + R12 cerrado + **R13-Z PASS** + GO implementación +
  **U173 ✅**.
- Estimación: S/M · Eje I · Ola B
- Runner despacho futuro: preferir Fable; si no, GPT-5.6 Sol; si no,
  el mejor disponible (anotar cascada en el aviso).
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY · No editar `plan/BACKLOG.md` (solo orquestador)

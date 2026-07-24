# Brief — WP-U175 · Autoría gateada por reparto sobre linea-editor

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U175 · Autoría gateada por reparto sobre `@zeus/linea-editor`
Rama: wp/u175-autoria-gateada-linea-editor
Worktree: C:\S_LAB\.worktrees\z\wp-u175-autoria-gateada-linea-editor
Reporte: plan/REPORTES/WP-U175-autoria-gateada-linea-editor.md

## Lecturas
- plan/REPORTES/entregas/REPLAN-2026-07-24-r13-dramaturgo-zigurat.md
- plan/REPORTES/entregas/ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md (§WP)
- packages/mesh/linea-editor/** (gate visible / approvalToken existente)
- contratos U172 (tools MCP de mutación) · U173 (reparto/permisos) ·
  U174 (personajes en story-board)

## Tarea
1. Extender la **autoría gateada existente** de `@zeus/linea-editor`
   (`crear_linea` / `export_story_board`, gate visible) con permisos por
   **reparto** (U173) y **personajes** (U174).
2. Mantener el patrón del gate actual (visible en `editor://info`, card
   y payloads de error); no crear un mecanismo de gate paralelo.
3. Export de story-board coherente con el schema extendido U174.
4. **No** reconstruir el editor legado: solo autoría gateada sobre el
   paquete existente.

## CA
- Autoría permitida/denegada por reparto probada (verde/rojo).
- Export valida contra story-board-schema U174.
- Gate único (el existente, extendido); cero mecanismo paralelo.
- Contrarrevisión independiente PASS documentada antes de pedir ✅.
- Cero publish / flip private / changesets (publish-ready = U178).

## ALCANCE_DIFF
- `packages/mesh/linea-editor/**` (src/test; **no** manifests de
  publish — dueño U178)
- reporte bajo `plan/REPORTES/`
- **Prohibido:** publishConfig/files/changesets de linea-editor (dueño
  U178) · story-board-schema (dueño U174) · reparto-kit (dueño U173)

## Notas
- Estado planificado: **⬜** — NO despachar hasta: asiento DA-S21
  commiteado + R12 cerrado + **R13-Z PASS** + GO implementación +
  **U172 ✅ + U173 ✅ + U174 ✅**.
- **No solapar** con U178 en despacho simultáneo (mismo paquete,
  archivos distintos: coordinación de merge la fija el orquestador).
- Estimación: M · Eje I + IV · Ola C
- Runner despacho futuro: preferir Fable; si no, GPT-5.6 Sol; si no,
  el mejor disponible (anotar cascada en el aviso).
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY · No editar `plan/BACKLOG.md` (solo orquestador)

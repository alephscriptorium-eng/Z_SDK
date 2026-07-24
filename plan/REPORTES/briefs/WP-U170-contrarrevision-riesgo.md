# Brief — WP-U170 · Persistir contrarrevisión independiente

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U170 · Persistir contrarrevisión independiente (WPs de riesgo)
Rama: wp/u170-contrarrevision-riesgo
Worktree: C:\S_LAB\.worktrees\z\wp-u170-contrarrevision-riesgo
Reporte: plan/REPORTES/WP-U170-contrarrevision-riesgo.md

## Lecturas
- plan/REPORTES/entregas/ADDENDA-R12-Z-REVISION-SEMVER-IDLE.md (§ revisión)
- plan/REPORTES/entregas/REPLAN-2026-07-24-r12-major-band.md
- plan/PRACTICAS.md (§3 auto-revisión; §7 ciclo)
- plan/roles/ (REVISION / ORQUESTADOR — no duplicar skill entero)

## Tarea
1. Persistir en `plan/PRACTICAS.md` la regla de **contrarrevisión
   independiente read-only** para WPs de riesgo (gates, manifests,
   semver/pub, CI/Release, auth, contratos cruzados).
2. Definir **quién**: revisor ≠ worker ≠ orquestador que acepta; puede
   ser SOL vía handoff.
3. Definir **qué** revisa (checklist CA): falsos negativos; deps no
   declaradas; install limpia; prueba vs test; fronteras publish.
4. Definir orden: reporte worker → PASS contrarrevisión → ✅ orquestador
   → merge; gate Rn-Z post-merge separado.
5. Plantilla corta de checklist bajo `plan/REPORTES/` si ayuda (opcional).
6. **No** implementar obra de paquetes · **no** aceptar/mergear otros
   WPs · **no** publish.

## CA
- PRACTICAS cita activación selectiva + checklist verificable.
- Quién/qué/cuándo explícitos; aplica a U168/U169/U171.
- Diff acotado a plan de proceso; cero código de paquetes.
- Ceguera: cara pública sin vocabulario prohibido si se toca entrega.

## ALCANCE_DIFF
- `plan/PRACTICAS.md`
- opcional: `plan/REPORTES/` plantilla checklist / reporte WP
- **Prohibido:** `packages/**`, scripts de gate, publish, BACKLOG

## Notas
- Estado planificado: **⬜** · Ola A (∥ U168)
- Estimación: S · Eje IV (proceso)
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY
- No editar `plan/BACKLOG.md` (solo orquestador)

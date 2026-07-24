# Brief — WP-U176 · Importador one-off de corpus legado

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U176 · Importador one-off de corpus legado
Rama: wp/u176-importador-corpus-legado
Worktree: C:\S_LAB\.worktrees\z\wp-u176-importador-corpus-legado
Reporte: plan/REPORTES/WP-U176-importador-corpus-legado.md

## Lecturas
- plan/REPORTES/entregas/REPLAN-2026-07-24-r13-dramaturgo-zigurat.md
- plan/REPORTES/entregas/ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md (§WP)
- packages/engine/linea-kit (formatos destino) ·
  packages/engine/story-board-schema (U174)
- precedente D-19 (import forces: curado, IDs zeus, refs tipadas)

## Tarea
1. Tooling **one-off** (bajo `scripts/`) que lee las rutas fuente del
   legado en **solo lectura** (ruta inyectada por env del operador; no
   commitear rutas locales — clase U140/D-31) y emite los formatos
   existentes: linea-kit / story-board (con personajes U174) + reparto
   (U173).
2. **Ceguera obligatoria:** ningún vocabulario ni artefacto legado se
   copia al código público; salida con IDs zeus (precedente D-19).
   Evidencia de grep con tokens **enmascarados** (clase U141/D-32) y
   **conteo literal 0** persistido en el reporte.
3. El corpus fuente NO entra en git; solo fixtures mínimas curadas si
   un test lo exige (declararlo).

## CA
- Import reproducible documentado (comando + env) con salida validando
  contra schemas existentes (AJV story-board U174 verde).
- Grep de ceguera (patrón del operador, enmascarado en evidencia) =
  **0** en todo lo commiteado.
- Cero rutas absolutas de máquina local en el árbol público.
- Contrarrevisión independiente PASS (migración + ceguera) antes de ✅.
- Cero publish / flip private / changesets.

## ALCANCE_DIFF
- `scripts/import-legado/**` (nombre final a acordar; one-off)
- fixtures mínimas curadas solo si un test lo exige
- reporte bajo `plan/REPORTES/`
- **Prohibido:** archivo del legado (ownership externo) · corpus fuente
  en git · linea-editor (dueño U175) · schemas (dueño U174) · publish

## Notas
- Estado planificado: **⬜** — NO despachar hasta: **DA-S21 · `2eb4784` asentada** (hecho) + R12 cerrado + **R13-Z PASS** + GO implementación +
  **U173 ✅ + U174 ✅** (∥ U175 posible; archivos disjuntos).
- Estimación: M · Eje II (+ ceguera transversal) · Ola D
- Runner despacho futuro: preferir Fable; si no, GPT-5.6 Sol; si no,
  el mejor disponible (anotar cascada en el aviso).
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY · No editar `plan/BACKLOG.md` (solo orquestador)

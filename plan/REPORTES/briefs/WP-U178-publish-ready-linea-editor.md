# Brief — WP-U178 · Publish-ready `@zeus/linea-editor` (P1)

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U178 · Publish-ready `@zeus/linea-editor` (P1 · D-42)
Rama: wp/u178-publish-ready-linea-editor
Worktree: C:\S_LAB\.worktrees\z\wp-u178-publish-ready-linea-editor
Reporte: plan/REPORTES/WP-U178-publish-ready-linea-editor.md

## Lecturas
- plan/REPORTES/entregas/ADDENDA-R12-Z-GO-PUBLICACION-ALLOWLIST.md
  (§ P1 encolado aparte)
- plan/PUBLISH-ALLOWLIST.md §3 P1 · §5 (condiciones publish-ready)
- plan/REPORTES/WP-U166-triage-p1-linea-editor-console-monitor.md
  (triage previo)
- plantilla P0: plan/REPORTES/WP-U163-poc-publish-ready-linea-system.md
- política major-band: REPLAN-2026-07-24-r12-major-band.md (U168/U169)

## Tarea
1. `publishConfig.registry` + `files` explícito en
   `packages/mesh/linea-editor/package.json`.
2. Tarball limpio **medido** (`npm pack --dry-run`): sin node_modules,
   tests, fixtures ni secretos.
3. Decisión **JS-only** documentada (o `exports`/`types` si aplica).
4. Deps internas `@zeus/*` en **major-band** (política U168) resolubles
   en registry; lock coherente en el mismo WP (CA R11-Z).
5. Changeset + matriz CI/Release cubriendo el paquete.
6. Gate publish-ready (U169) verde para el paquete; comprobación
   online/C8.
7. **Entrega distinta** de la evolución funcional (U175): no fusionar.

## CA
- Condiciones §5 allowlist completas y evidenciadas (1–6).
- Gate U169 verde sobre linea-editor; probes citadas.
- Lock coherente; install limpia medida.
- Contrarrevisión independiente PASS documentada antes de pedir ✅.
- **Cero** flip `private` · **cero** `npm publish` en este WP: el
  publish real solo se activa tras el PASS de este WP + condiciones
  D-42 (GO publish condicionado propio).

## ALCANCE_DIFF
- `packages/mesh/linea-editor/**` (manifest/empaquetado; **no** src
  funcional — dueño U175)
- `.changeset/**` · workflow release solo si la matriz lo exige
  (declararlo)
- `package-lock.json` si manifests lo requieren
- `plan/PUBLISH-ALLOWLIST.md` solo si hay que asentar la decisión
  JS-only (enmienda mínima)
- reporte bajo `plan/REPORTES/`
- **Prohibido:** flip private · npm publish · lote P0×4 (U168–U171) ·
  reabrir U166 · src funcional de linea-editor (dueño U175)

## Notas
- Estado planificado: **⬜** — NO despachar hasta: **U168 ✅ + U169 ✅**
  + GO implementación propio (custodio). No mezclar con el lote P0×4.
- **No solapar** con U175 en despacho simultáneo (mismo paquete).
- Estimación: M · Eje IV · Cola publish P1 (D-42)
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY · No editar `plan/BACKLOG.md` (solo orquestador)

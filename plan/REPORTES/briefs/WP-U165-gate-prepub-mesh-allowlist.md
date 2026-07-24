# Brief — WP-U165 · Gate pre-publicación mesh allowlist

(rol) plan/roles/README.md → WORKER (skill swarm-orquestacion)

WP: WP-U165 · Gate pre-publicación mesh allowlist
Rama: wp/u165-gate-prepub-mesh-allowlist
Worktree: C:\S_LAB\.worktrees\z\wp-u165-gate-prepub-mesh-allowlist
Reporte: plan/REPORTES/WP-U165-gate-prepub-mesh-allowlist.md

## Lecturas
- plan/PUBLISH-ALLOWLIST.md §3 · §5 (**solo lectura** — no editar)
- `scripts/audit-publish-allowlist.mjs` (U162)
- plan/REPORTES/entregas/REPLAN-2026-07-24-sprint8.md
- plan/PRACTICAS.md §6 · C8
- Opcional: `npm run release:changeset-dry` (solo lectura / extensión)

## Tarea
1. Añadir **gate/script** (CI o npm script) que verifique candidatos
   allowlist (o subset P0 listo) contra condiciones publish-ready:
   - `files` / pack dry-run limpio
   - types o decisión JS-only documentada
   - deps internas `@zeus/*` ≠ `*`
   - `publishConfig.registry` = registry C8 de `.npmrc`
2. Integrar de forma opt-in o job CI acotado (sin disparar publish).
3. Documentar cómo fallar en rojo ante regresión (evidencia literal).
4. Opcional: extender `release:dry` / audit existente — justificar en
   reporte.
5. **No** publish, **no** flip `private`, **no** changesets de
   publicación, **no** editar `plan/PUBLISH-ALLOWLIST.md`.

## CA
- Comando reproducible (salida literal en reporte) que falla si un
  candidato medido viola §5.
- C8: registry canónico comprobado, no tarball workspace.
- Cableado CI o npm script documentado; sin job de publish.
- Frontera: cero private / cero publish / cero changesets de pub.
- `npm run gates` OK si toca `scripts/`.
- **Re-gate integrado (obligatorio antes de ✅):** tras merge de
  **U164 + U166** en `main`, rebase/integrar esa base y **re-ejecutar**
  el gate sobre el resultado conjunto; evidencia literal en reporte.
  Sin ese re-gate → no aceptar U165 ni cerrar Ola B.

## ALCANCE_DIFF
- `scripts/**` (gate nuevo o extensión audit)
- `package.json` (npm script)
- `.github/workflows/**` solo si añade check **sin** publish
- `plan/REPORTES/` (reporte)
- **Prohibido:** `plan/PUBLISH-ALLOWLIST.md` (solo lectura; enmiendas =
  **U166**), flips `private`, `.changeset/**` de release, `npm publish`

## Notas
- Estado: **⬜** · Ola B · deps: **U163 ✅** + **aceptación tras
  U164 ✅ + U166 ✅** (merge/✅ **último** de Ola B)
- Orden Ola B: despacho/obra `U164 ∥ U166` primero → luego **U165**
  (secuencial al final) + re-gate integrado
- **NO DESPACHAR** hasta **R10-Z PASS** + GO implementación Ola B
- Estimación: S–M · Eje IV + C8
- MUNDO_RAIZ = C:\S_LAB\z-sdk · WORKTREE_BASE = C:\S_LAB\.worktrees\z
- DC-15 LOCAL-ONLY

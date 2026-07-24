# Brief — WP-U162 · auditoría publish-ready y allowlist

(rol) plan/roles/README.md → WORKER

WP: WP-U162 · Auditoría publish-ready y allowlist de paquetes Zeus
Rama: wp/u162-auditoria-publish-allowlist
Worktree: C:\S_LAB\.worktrees\z\wp-u162-auditoria-publish-allowlist
Reporte: plan/REPORTES/WP-U162-auditoria-publish-allowlist.md

## Lecturas
- [ADDENDA-R5-Z-AUDITORIA-PUBLISH.md](../entregas/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md)
  (fuente canónica del alcance; espejo `vigilancia/z/`)
- `vigilancia/z/GATE-R6-Z-PASS.md` · copia
  [GATE-R6-Z-PASS.md](../entregas/GATE-R6-Z-PASS.md)
- `.npmrc` (registry canónico) · PRACTICAS C8 · política publish
  (engine publicable; mesh/editor privados por defecto)
- Reportes previos útiles: `plan/REPORTES/WP-U50-scope-publish.md`

## Tarea
1. Fijar en **una fuente única** (doc bajo `plan/`, p. ej. PRACTICAS o
   artefacto dedicado) qué clases de paquetes mesh pueden publicarse vs
   deben permanecer privados.
2. Inventario reproducible de los **49** paquetes únicos bajo
   `packages/**`; cotejar contra registry (`npm view`) y clasificar cada
   uno: `mantener privado | candidato | ya publicado`. Preferible script
   bajo `scripts/` (idempotente) cuya salida literal entre en el reporte.
3. Para cada **candidato** (no para todo el monorepo): medir
   `publishConfig`, `files`, exports/types, dependencias internas
   `@zeus/*` (hoy `*` en P0), changeset, workflow de release y C8.
4. Entregar plan de WPs pequeños derivados (con deps y estimación),
   **sin** ejecutarlos en este WP. Dejar candidatos propuestos en el
   reporte (el orquestador encolará tras GO).
5. **Frontera dura:** cero cambios de `private`; cero `npm publish`;
   cero edits de manifests/workflows orientados a publicar. U162 es
   auditoría + partición.

### Hechos del barrido (addenda — punto de partida, no CA final)
- 49 únicos · 29 publicados · 20 no publicados (privados/fixtures).
- P0: `@zeus/linea-system`, `@zeus/linea-firehose`, `@zeus/force-system`,
  `@zeus/ssb-system`.
- P1: `@zeus/linea-editor`, `@zeus/console-monitor`,
  `@zeus/blobstore-client`.
- Mantener privados salvo decisión expresa: UIs, visores, Angular,
  monitores visuales, demos y harnesses.

### Derivación recomendada (fuera de alcance de U162; GO aparte)
1. POC publish-ready con `@zeus/linea-system`.
2. Replicación acotada a linea-firehose, force-system, ssb-system.
3. Gate pre-publicación: `files`, types, semver interno, canal registry.

## CA
- Inventario 49/49 con comando reproducible (salida literal en reporte).
- `npm view` literal por candidato observado.
- Allowlist explícita — **no** inferida por ausencia de `private`.
- Tarball/contents y tipos medidos antes de proponer cualquier publish.
- Cero cambios de `private` y cero publish en el diff de U162.
- Plan de WPs derivados con dependencias y estimación.
- `npm run gates` OK si el diff toca código/scripts; si solo `plan/`,
  documentar N/A U104.

## ALCANCE_DIFF
- `plan/` (fuente allowlist, reporte, inventario)
- `scripts/` (comando inventario/audit reproducible, si aplica)
- `package.json` solo si añade npm script del inventario
- **Prohibido:** flip `private`, `npm publish`, changesets de release,
  workflows de publish, tocar `packages/*/package.json` salvo lectura

## Notas
- Dep: U158 ✅ · Sprint 7 CERRADO/IDLE · R6-Z PASS.
- **Proceso (addenda 2026-07-24):** este WP fue **despachado sin GO** de
  ronda; el “GO implementación” del chat / commit `854ed4e` **no** fue GO
  previo legítimo. Custodio **ratifica ex post (acotado)** solo para
  conservar la auditoría (**D-41** · no precedente · no autoriza
  U163–U167). Ver
  [ACTA-R7-Z-INCIDENTE-despacho-sin-GO-U162.md](../entregas/ACTA-R7-Z-INCIDENTE-despacho-sin-GO-U162.md).
- Estimación: L · Eje IV (gobierno paquetes).
- No editar `plan/BACKLOG.md` (solo orquestador).
- DC-15 LOCAL-ONLY.

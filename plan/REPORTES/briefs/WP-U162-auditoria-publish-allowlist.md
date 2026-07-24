# Brief — WP-U162 · auditoría publish-ready y allowlist

(rol) plan/roles/README.md → WORKER

WP: WP-U162 · Auditoría publish-ready y allowlist de paquetes Zeus
Rama: wp/u162-auditoria-publish-allowlist *(propuesta — NO montar hasta GO)*
Worktree: C:\S_LAB\.worktrees\z\wp-u162-auditoria-publish-allowlist *(NO crear hasta GO)*
Reporte: plan/REPORTES/WP-U162-auditoria-publish-allowlist.md

## Lecturas
- [ADDENDA-R5-Z-AUDITORIA-PUBLISH.md](../entregas/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md)
  (fuente canónica del alcance; espejo `vigilancia/z/`)
- `vigilancia/z/GATE-R6-Z-PASS.md` · copia
  [GATE-R6-Z-PASS.md](../entregas/GATE-R6-Z-PASS.md)
- `.npmrc` (registry canónico) · PRACTICAS C8 · política publish
  (engine publicable; mesh/editor privados por defecto)

## Tarea
1. Fijar en **una fuente única** (doc bajo `plan/` o PRACTICAS, según
   hallazgo) qué clases de paquetes mesh pueden publicarse vs deben
   permanecer privados.
2. Inventario reproducible de los **49** paquetes únicos bajo
   `packages/**`; cotejar contra registry (`npm view`) y clasificar cada
   uno: `mantener privado | candidato | ya publicado`.
3. Para cada **candidato** (no para todo el monorepo): medir
   `publishConfig`, `files`, exports/types, dependencias internas
   `@zeus/*` (hoy `*` en P0), changeset, workflow de release y C8.
4. Entregar plan de WPs pequeños derivados (con deps y estimación),
   **sin** ejecutarlos en este WP.
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

## Notas
- Dep: U158 ✅ · Sprint 7 CERRADO/IDLE · R6-Z PASS.
- Estimación: L · Eje IV (gobierno paquetes).
- **No despachar** este brief hasta GO de implementación del custodio
  + nueva ronda SOL. DC-15 LOCAL-ONLY.

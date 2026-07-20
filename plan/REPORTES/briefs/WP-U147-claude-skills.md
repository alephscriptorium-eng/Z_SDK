# Brief — WP-U147 · `.claude/skills/` — materialización runner local

Orquestador · 2026-07-20 · GO Sprint 4 (ejecución diferida D-35).
**Dependencia: U145** (necesita el paquete en `node_modules`).

```text
(rol) plan/roles/WORKER.md

WP: WP-U147 · Materializar skills del paquete en .claude/skills/
Rama: wp/u147-claude-skills
Worktree: sí
Reporte: plan/REPORTES/WP-U147-claude-skills.md

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/REPORTES/WP-U145-dep-skills-scriptorium.md (el paquete ya instalado)
- node_modules/@alephscript/skills-scriptorium/skills/ (la fuente)

Contexto: el consumo canónico multi-IDE es node_modules (U145). Claude
Code además carga skills desde .claude/skills/<nombre>/SKILL.md — este WP
crea ese adaptador SIN convertirlo en segunda fuente de verdad.

Tarea:
1. scripts/sync-claude-skills.mjs: copia
   node_modules/@alephscript/skills-scriptorium/skills/* → .claude/skills/
   (excluir _plantilla). Idempotente: borra-y-recrea lo sincronizado,
   no acumula restos.
2. npm script "skills:sync" en package.json raíz.
3. .claude/skills/README.md de procedencia: generado desde el paquete
   versionado; NO editar a mano; regenerar con npm run skills:sync.
4. Decidir y documentar si .claude/skills/ se commitea o se gitignorea
   (recomendación orquestador: commitear — reproducible tras clone sin
   paso extra; razonar en el reporte si eliges lo contrario).

CA:
1. .claude/skills/vigilancia/SKILL.md existe e idéntico byte a byte a la
   fuente en node_modules (diff literal en reporte).
2. Doble ejecución del script = idempotente (segunda corrida sin cambios;
   evidencia git status).
3. Procedencia visible en .claude/skills/README.md.
4. Diff solo: scripts/, package.json (script), .claude/skills/, reporte.

Notas del orquestador:
- Si U145 aún no está en main: parte de su rama wp/u145-… y decláralo en
  el reporte (el orquestador ordenará el merge U145 → U147).
- No tocar plan/roles/ (U146).
- Evidencia CI: gh run list --branch wp/u147-claude-skills.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```

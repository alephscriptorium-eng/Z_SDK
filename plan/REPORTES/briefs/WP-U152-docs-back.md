# Brief — WP-U152 · Docs página Proyecto + back-links por tema

Orquestador · 2026-07-20 · GO Sprint 5 (D-37).

```text
(rol) plan/roles/WORKER.md

WP: WP-U152 · Docs: página Proyecto + back-links por tema
Rama: wp/u152-docs-back
Worktree: base = tip U150 (dep: gate valida enlaces nuevos)
Reporte: plan/REPORTES/WP-U152-docs-back.md

Lecturas extra:
- HANDOFF Punto 3: PROHIBIDO hardcodear back-links en 25 páginas
- docs/.vitepress/config.mjs (themeConfig socialLinks/footer/nav)
- WP-U150 (verificar-sitio.mjs debe quedar verde)

Tarea:
1. Crear docs/proyecto.md (repo / registry / CI / backlog) y enlazarla
   en nav/sidebar.
2. Declarar back-links UNA sola vez en themeConfig (socialLinks y/o footer
   y/o componente de tema compartido). Render en todas las páginas.
3. PROHIBIDO copiar el bloque en cada página md.
4. Si hay enlaces defectuosos por página: regenerar vía fuente única, no
   parchear a mano las 25.

CA:
1. Página Proyecto en nav/sidebar
2. Dato repo/registry aparece 1 vez en config/tema; 0 hardcode por página
   (grep evidencia)
3. verificar-sitio.mjs verde sobre dist nuevo

ALCANCE_DIFF: docs/.vitepress/**, docs/proyecto.md, reporte.
Eje: site-web.

Notas:
- Dep U150. No mezclar con U151/U153.
- Coherente con feedback al diseñador (Punto 3) sin esperar rediseño skill.

Empieza: sitúate desde tip U150, lee PRACTICAS, implementa.
```

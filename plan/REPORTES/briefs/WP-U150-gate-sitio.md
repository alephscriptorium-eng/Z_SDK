# Brief — WP-U150 · Gate verificar-sitio.mjs + slug roto

Orquestador · 2026-07-20 · GO Sprint 5 (D-37).

```text
(rol) plan/roles/WORKER.md

WP: WP-U150 · Gate verificar-sitio.mjs en docs CI + slug roto
Rama: wp/u150-gate-sitio
Worktree: sí si paralelo; base = tip U149 (dep) o main+U149 mergeable
Reporte: plan/REPORTES/WP-U150-gate-sitio.md

Lecturas extra:
- HANDOFF Punto 3 (back-links = tema; U152 lo hace — aquí solo gate+slug)
- node_modules/.../site-web/scripts/verificar-sitio.mjs (invocar, no copiar)
- .github/workflows/docs.yml
- docs/guide/estado.md · docs/guide/layout.md (slug Z_SDK vs zeus-sdk)

Tarea:
1. Tras npm run docs:build en docs.yml, invocar verificar-sitio.mjs desde
   node_modules/@alephscript/skills-scriptorium/skills/site-web/scripts/
   sobre docs/.vitepress/dist con BASE=/.
2. Unificar slug roto: github.com/.../Z_SDK → zeus-sdk donde el repo
   real es zeus-sdk (verificar con gh/curl; Z_SDK-games-library = otro repo,
   no tocar).
3. Probar CA fail: enlace roto temporal → gate rojo → revertir.
4. Opcional: npm script docs:verify que wrappee el gate.

CA:
1. Gate corre post-build; falla ante enlace/ancla muerta (evidencia rojo→revert)
2. Slug unificado y resoluble en estado.md / layout.md (repo monorepo)
3. docs:build verde + gate verde sobre dist

ALCANCE_DIFF: .github/workflows/docs.yml, docs/guide/*.md (slug),
package.json (si script), reporte.
Eje: site-web (C8-ampliado).

Notas:
- Dep U149 (skills 0.3.1 con verificar-sitio.mjs).
- Exigir run_id Docs en revisión si hay push (.github/**).
- NO hardcodear back-links por página (eso es U152).

Empieza: sitúate en rama/worktree desde tip U149, lee PRACTICAS, implementa.
```

# Brief — WP-U149 · Baseline 0.3.1 + regla 15 citada

Orquestador · 2026-07-20 · GO Sprint 5 (D-37).

```text
(rol) plan/roles/WORKER.md

WP: WP-U149 · Baseline 0.3.1 + regla 15 citada
Rama: wp/u149-baseline-031
Worktree: no (baseline serial; resto del lote parte tras tip listo)
Reporte: plan/REPORTES/WP-U149-baseline-031.md

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-36 (rango 0.x) · D-37 (baseline 0.3.1)
- plan/REPORTES/entregas/HANDOFF-2026-07-20-skills-0.3.1-feedback.md
  (Puntos 2–3: no adoptar verificar-changelog; back-links = tema)
- node_modules/@alephscript/skills-scriptorium/skills/swarm-orquestacion/
  reference/reglas-metodo-v04.md (regla 15 + checklist cierre ola v0.4)

Tarea:
1. Fijar package-lock.json en 0.3.1 (ya en working tree) + npm run skills:sync
   (espejo .claude/ gitignorado).
2. Citar regla 15 en plan/roles/README.md §Runners/IDEs.
3. Añadir ítem checklist cierre ola v0.4 (residuo IDE + memoria no-citada)
   a plan/PRACTICAS.md §7.
4. NO refactor retro (zeus ya cumple: 0 md de sesión en carpetas IDE trackeadas).

CA:
1. npm view @alephscript/skills-scriptorium@0.x version → resuelve 0.3.1
2. grep -c "regla 15" plan/ ≥ 1
3. lockfile node_modules/@alephscript/skills-scriptorium version 0.3.1
4. npm run gates → OK

ALCANCE_DIFF: package-lock.json, plan/roles/README.md, plan/PRACTICAS.md, reporte.
Eje: ninguno (gobierno).

Notas del orquestador:
- package.json ya tiene rango 0.x (D-36); solo el lock baja a 0.3.1.
- Nota CI: lockfile dispara CI — exigir evidencia en revisión si hay push.
- No tocar docs/, CHANGELOG, vigilancia (otros WPs del lote).

Empieza: sitúate en rama, lee PRACTICAS entero, luego implementa.
```
